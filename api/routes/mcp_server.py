"""
MCP HTTP Streamable Server — Protocol 2025-03-26
JSON-RPC 2.0 over POST /mcp

Tools exposed:
  search_listings      — catalog discovery (cursor-paginated)
  get_listing          — single listing detail + install manifest preview
  purchase_listing     — idempotent Stripe charge via agent wallet
  get_install_manifest — deliver install manifest for an owned listing
  get_wallet_balance   — agent owner's account balance / spend summary
"""
import base64
import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlmodel import select

from core.config import settings
from core.database import get_session
from models import OAuthClient, Product, Transaction, User
from routes.oauth import get_current_agent, require_scope
from services.security import scan_manifest, sign_manifest

router = APIRouter(tags=["MCP"])

stripe.api_key = settings.STRIPE_SECRET_KEY

# ---------------------------------------------------------------------------
# Protocol constants
# ---------------------------------------------------------------------------

PROTOCOL_VERSION = "2025-03-26"
SERVER_INFO = {"name": "agent-resources-mcp", "version": "1.0.0"}

TOOLS: List[Dict] = [
    {
        "name": "search_listings",
        "description": (
            "Search and browse the Agent Resources catalog. "
            "Returns paginated listings of MCP servers, AI personas, and skills."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "query":    {"type": "string",  "description": "Free-text search query"},
                "category": {"type": "string",  "description": "Filter by category: mcp_server, persona, skill"},
                "max_price_cents": {"type": "integer", "description": "Maximum price in cents (0 = free only)"},
                "limit":    {"type": "integer",  "description": "Results per page (1-50, default 20)", "default": 20},
                "cursor":   {"type": "string",   "description": "Pagination cursor from previous response"},
            },
            "required": [],
        },
    },
    {
        "name": "get_listing",
        "description": "Get full details for a single listing including install manifest preview.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "slug": {"type": "string", "description": "The listing slug (from search_listings results)"},
            },
            "required": ["slug"],
        },
    },
    {
        "name": "purchase_listing",
        "description": (
            "Purchase a listing on behalf of the agent owner. "
            "Charges the owner's default Stripe payment method. "
            "Idempotent: supplying the same idempotency_key returns the cached result."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "slug": {"type": "string", "description": "Listing slug to purchase"},
                "idempotency_key": {
                    "type": "string",
                    "description": "Client-generated idempotency key (UUID recommended). Required for safe retries.",
                },
            },
            "required": ["slug", "idempotency_key"],
        },
    },
    {
        "name": "get_install_manifest",
        "description": (
            "Retrieve the install manifest for a listing the owner has purchased. "
            "Returns structured config for MCP servers (command, args, env_vars), "
            "system prompts for personas, or skill definitions."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "slug": {"type": "string", "description": "Listing slug"},
            },
            "required": ["slug"],
        },
    },
    {
        "name": "get_wallet_balance",
        "description": "Get the agent owner's spending summary: total spent via this client, spending limit, and available budget.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
]


# ---------------------------------------------------------------------------
# Cursor helpers (cursor encodes ISO timestamp + UUID for stable pagination)
# ---------------------------------------------------------------------------

def _encode_cursor(created_at: datetime, record_id: UUID) -> str:
    raw = f"{created_at.isoformat()}|{record_id}"
    return base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")


def _decode_cursor(cursor: str) -> Optional[tuple]:
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        raw = base64.urlsafe_b64decode(padded).decode()
        ts_str, id_str = raw.split("|", 1)
        return datetime.fromisoformat(ts_str), UUID(id_str)
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------

def _tool_search_listings(args: Dict, session) -> Dict:
    query    = str(args.get("query", "")).strip()
    category = str(args.get("category", "")).strip()
    max_price = args.get("max_price_cents")
    limit    = min(max(int(args.get("limit", 20)), 1), 50)
    cursor   = args.get("cursor")

    stmt = (
        select(Product)
        .where(Product.is_active == True, Product.is_verified == True)
        .order_by(Product.created_at.desc(), Product.id.desc())
    )

    if query:
        stmt = stmt.where(
            (Product.name.ilike(f"%{query}%")) | (Product.description.ilike(f"%{query}%"))
        )
    if category:
        stmt = stmt.where(Product.category == category)
    if max_price is not None:
        stmt = stmt.where(Product.price_cents <= int(max_price))

    if cursor:
        decoded = _decode_cursor(cursor)
        if decoded:
            cur_ts, cur_id = decoded
            stmt = stmt.where(
                (Product.created_at < cur_ts)
                | ((Product.created_at == cur_ts) & (Product.id < cur_id))
            )

    rows = session.execute(stmt.limit(limit + 1)).scalars().all()
    has_more = len(rows) > limit
    items = rows[:limit]

    next_cursor = None
    if has_more and items:
        last = items[-1]
        next_cursor = _encode_cursor(last.created_at, last.id)

    return {
        "listings": [
            {
                "slug":         p.slug,
                "name":         p.name,
                "category":     p.category,
                "description":  (p.description or "")[:280],
                "price_cents":  p.price_cents,
                "price_display": f"${p.price_cents / 100:.2f}" if p.price_cents else "Free",
                "tags":         p.category_tags or [],
                "download_count": p.download_count,
                "quality_score": p.quality_score,
            }
            for p in items
        ],
        "cursor":    next_cursor,
        "has_more":  has_more,
        "count":     len(items),
    }


def _tool_get_listing(args: Dict, session, owner: User) -> Dict:
    slug = str(args.get("slug", "")).strip()
    if not slug:
        raise ValueError("slug is required")

    product = session.execute(
        select(Product).where(Product.slug == slug, Product.is_active == True)
    ).scalars().first()

    if not product:
        raise ValueError(f"Listing '{slug}' not found")

    already_owned = session.execute(
        select(Transaction).where(
            Transaction.buyer_id == owner.id,
            Transaction.product_id == product.id,
            Transaction.status == "completed",
        )
    ).scalars().first() is not None

    manifest_preview = None
    if product.one_click_json:
        manifest_preview = {
            "type":    product.category,
            "command": product.one_click_json.get("command"),
            "args":    product.one_click_json.get("args", []),
            "env_vars_required": product.one_click_json.get("env_vars_required", []),
        }

    return {
        "slug":         product.slug,
        "name":         product.name,
        "category":     product.category,
        "description":  product.description or "",
        "price_cents":  product.price_cents,
        "price_display": f"${product.price_cents / 100:.2f}" if product.price_cents else "Free",
        "tags":         product.category_tags or [],
        "download_count": product.download_count,
        "quality_score": product.quality_score,
        "already_owned": already_owned,
        "manifest_preview": manifest_preview,
    }


def _tool_purchase_listing(args: Dict, session, client: OAuthClient, owner: User) -> Dict:
    slug             = str(args.get("slug", "")).strip()
    idempotency_key  = str(args.get("idempotency_key", "")).strip()

    if not slug:
        raise ValueError("slug is required")
    if not idempotency_key:
        raise ValueError("idempotency_key is required")
    if "orders:create" not in (client.scopes_allowed or []):
        raise PermissionError("Scope 'orders:create' is required to purchase listings")

    product = session.execute(
        select(Product).where(Product.slug == slug, Product.is_active == True)
    ).scalars().first()

    if not product:
        raise ValueError(f"Listing '{slug}' not found")

    # Check already owned
    existing = session.execute(
        select(Transaction).where(
            Transaction.buyer_id == owner.id,
            Transaction.product_id == product.id,
            Transaction.status == "completed",
        )
    ).scalars().first()

    if existing:
        return {"status": "already_owned", "product_slug": slug, "transaction_id": str(existing.id)}

    # Idempotency check — same key from same agent = return cached result
    idempotent_tx = session.execute(
        select(Transaction).where(
            Transaction.stripe_payment_intent_id == f"agent_idem_{idempotency_key}",
        )
    ).scalars().first()

    if idempotent_tx:
        return {
            "status":       idempotent_tx.status,
            "product_slug": slug,
            "transaction_id": str(idempotent_tx.id),
            "idempotent_replay": True,
        }

    # Check spending limit
    if client.spending_limit_cents > 0:
        if client.spent_cents + product.price_cents > client.spending_limit_cents:
            raise PermissionError(
                f"Purchase of ${product.price_cents/100:.2f} would exceed spending limit "
                f"(${client.spending_limit_cents/100:.2f}). Current spend: ${client.spent_cents/100:.2f}"
            )

    # Free listing — no Stripe charge needed
    if product.price_cents == 0:
        tx = Transaction(
            buyer_id=owner.id,
            seller_id=product.owner_id,
            product_id=product.id,
            amount_cents=0,
            platform_fee_cents=0,
            stripe_payment_intent_id=f"agent_idem_{idempotency_key}",
            status="completed",
        )
        session.add(tx)
        product.download_count = (product.download_count or 0) + 1
        session.add(product)
        session.commit()
        session.refresh(tx)
        return {"status": "completed", "product_slug": slug, "transaction_id": str(tx.id), "amount_cents": 0}

    # Paid listing — require a saved Stripe customer + default payment method
    stripe_customer_id = getattr(owner, "stripe_customer_id", None)
    if not stripe_customer_id:
        raise PermissionError(
            "Owner has no saved payment method. "
            "Please visit shopagentresources.com/settings/billing to add a card."
        )

    try:
        intent = stripe.PaymentIntent.create(
            amount=product.price_cents,
            currency="usd",
            customer=stripe_customer_id,
            confirm=True,
            off_session=True,
            idempotency_key=f"mcp_{idempotency_key}",
            metadata={"product_slug": slug, "agent_client_id": client.client_id},
        )
    except stripe.error.CardError as e:
        raise PermissionError(f"Payment failed: {e.user_message}")
    except stripe.error.StripeError as e:
        raise RuntimeError(f"Stripe error: {str(e)}")

    platform_fee = int(product.price_cents * 0.10)
    tx = Transaction(
        buyer_id=owner.id,
        seller_id=product.owner_id,
        product_id=product.id,
        amount_cents=product.price_cents,
        platform_fee_cents=platform_fee,
        stripe_payment_intent_id=intent.id,
        status="completed" if intent.status == "succeeded" else "pending",
    )
    session.add(tx)

    # Update agent spending counter
    client.spent_cents = (client.spent_cents or 0) + product.price_cents
    session.add(client)

    product.download_count = (product.download_count or 0) + 1
    session.add(product)

    session.commit()
    session.refresh(tx)

    return {
        "status":         tx.status,
        "product_slug":   slug,
        "transaction_id": str(tx.id),
        "amount_cents":   product.price_cents,
        "payment_intent": intent.id,
    }


def _tool_get_install_manifest(args: Dict, session, owner: User) -> Dict:
    slug = str(args.get("slug", "")).strip()
    if not slug:
        raise ValueError("slug is required")

    product = session.execute(
        select(Product).where(Product.slug == slug, Product.is_active == True)
    ).scalars().first()

    if not product:
        raise ValueError(f"Listing '{slug}' not found")

    owned = session.execute(
        select(Transaction).where(
            Transaction.buyer_id == owner.id,
            Transaction.product_id == product.id,
            Transaction.status == "completed",
        )
    ).scalars().first()

    if not owned and product.price_cents > 0:
        raise PermissionError(
            f"You do not own '{slug}'. Purchase it first with the purchase_listing tool."
        )

    manifest = product.one_click_json or {}

    manifest_body = {
        "type":              product.category,
        "command":           manifest.get("command"),
        "args":              manifest.get("args", []),
        "env_vars_required": manifest.get("env_vars_required", []),
        "env_vars_optional": manifest.get("env_vars_optional", []),
        "config_schema":     manifest.get("config_schema", {}),
        "homepage":          f"https://shopagentresources.com/listing/{product.slug}",
        "description":       product.description or "",
    }

    scan = scan_manifest(manifest_body)
    signed = sign_manifest(manifest_body, settings.OAUTH_PRIVATE_KEY) if settings.OAUTH_PRIVATE_KEY else manifest_body

    return {
        "slug":     product.slug,
        "name":     product.name,
        "category": product.category,
        "version":  "1.0.0",
        "manifest": signed,
        "security": {
            "safe":       scan["safe"],
            "risk_level": scan["risk_level"],
            "findings":   scan["findings"],
        },
        "install_instructions": (
            f"1. Set required env vars: {', '.join(manifest.get('env_vars_required', [])) or 'none'}\n"
            f"2. Run: {manifest.get('command', '')} {' '.join(manifest.get('args', []))}\n"
            f"3. Add to your MCP client config under key: {product.slug}"
        ),
    }


def _tool_get_wallet_balance(client: OAuthClient, owner: User) -> Dict:
    budget_remaining = (
        client.spending_limit_cents - client.spent_cents
        if client.spending_limit_cents > 0
        else None
    )
    return {
        "client_id":             client.client_id,
        "client_name":           client.name,
        "spent_cents":           client.spent_cents,
        "spending_limit_cents":  client.spending_limit_cents,
        "budget_remaining_cents": budget_remaining,
        "scopes":                client.scopes_allowed or [],
        "owner_email":           owner.email,
    }


# ---------------------------------------------------------------------------
# JSON-RPC 2.0 dispatcher
# ---------------------------------------------------------------------------

def _rpc_error(code: int, message: str, rpc_id=None) -> Dict:
    return {"jsonrpc": "2.0", "id": rpc_id, "error": {"code": code, "message": message}}


def _rpc_ok(result: Any, rpc_id=None) -> Dict:
    return {"jsonrpc": "2.0", "id": rpc_id, "result": result}


def _dispatch(method: str, params: Dict, rpc_id, client: OAuthClient, owner: User, session) -> Dict:
    try:
        if method == "initialize":
            return _rpc_ok({
                "protocolVersion": PROTOCOL_VERSION,
                "serverInfo":      SERVER_INFO,
                "capabilities":    {"tools": {"listChanged": False}},
            }, rpc_id)

        if method == "tools/list":
            return _rpc_ok({"tools": TOOLS}, rpc_id)

        if method == "tools/call":
            tool_name = params.get("name", "")
            tool_args = params.get("arguments", {})

            if tool_name == "search_listings":
                result = _tool_search_listings(tool_args, session)
            elif tool_name == "get_listing":
                result = _tool_get_listing(tool_args, session, owner)
            elif tool_name == "purchase_listing":
                result = _tool_purchase_listing(tool_args, session, client, owner)
            elif tool_name == "get_install_manifest":
                result = _tool_get_install_manifest(tool_args, session, owner)
            elif tool_name == "get_wallet_balance":
                result = _tool_get_wallet_balance(client, owner)
            else:
                return _rpc_error(-32601, f"Unknown tool: {tool_name}", rpc_id)

            return _rpc_ok(
                {"content": [{"type": "text", "text": json.dumps(result, default=str)}]},
                rpc_id,
            )

        if method == "ping":
            return _rpc_ok({}, rpc_id)

        return _rpc_error(-32601, f"Method not found: {method}", rpc_id)

    except (ValueError, KeyError) as e:
        return _rpc_error(-32602, f"Invalid params: {e}", rpc_id)
    except PermissionError as e:
        return _rpc_error(-32603, f"Forbidden: {e}", rpc_id)
    except RuntimeError as e:
        return _rpc_error(-32603, f"Internal error: {e}", rpc_id)


# ---------------------------------------------------------------------------
# HTTP endpoint
# ---------------------------------------------------------------------------

@router.post("/mcp")
async def mcp_endpoint(
    request: Request,
    session=Depends(get_session),
    agent=Depends(get_current_agent),
):
    """
    MCP HTTP Streamable Transport (2025-03-26).
    Accepts a single JSON-RPC 2.0 object or a batch array.
    Authentication: OAuth 2.1 Bearer token (scope: catalog:read minimum).
    """
    client, owner = agent

    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            _rpc_error(-32700, "Parse error"),
            status_code=400,
        )

    if isinstance(body, list):
        responses = [
            _dispatch(
                item.get("method", ""),
                item.get("params", {}),
                item.get("id"),
                client,
                owner,
                session,
            )
            for item in body
            if isinstance(item, dict)
        ]
        return JSONResponse(responses)

    if not isinstance(body, dict):
        return JSONResponse(_rpc_error(-32600, "Invalid Request"), status_code=400)

    response = _dispatch(
        body.get("method", ""),
        body.get("params", {}),
        body.get("id"),
        client,
        owner,
        session,
    )
    return JSONResponse(response)


# ---------------------------------------------------------------------------
# Discovery — GET /mcp returns server capabilities without auth (spec §3.2)
# ---------------------------------------------------------------------------

@router.get("/mcp")
async def mcp_discovery():
    """Unauthenticated discovery: returns server info and tool list."""
    return JSONResponse({
        "protocolVersion": PROTOCOL_VERSION,
        "serverInfo":      SERVER_INFO,
        "capabilities":    {"tools": {"listChanged": False}},
        "tools":           TOOLS,
        "auth": {
            "type":      "oauth2",
            "discovery": "https://api.shopagentresources.com/.well-known/oauth-authorization-server",
        },
    })
