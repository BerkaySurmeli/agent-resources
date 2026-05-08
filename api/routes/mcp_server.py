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

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlmodel import select

from core.config import settings
from core.database import get_session
from models import MCPDetail, OAuthClient, Product, Transaction, User
from routes.oauth import get_current_agent, require_scope
from routes.wallet import wallet_deduct
from routes.webhooks import emit_purchase_completed, emit_wallet_low_balance
from services.manifest import build_manifest
from services.security import scan_manifest, sign_manifest

router = APIRouter(tags=["MCP"])

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


def _tool_purchase_listing(args: Dict, session, client: OAuthClient, owner: User) -> tuple[Dict, Optional[Dict]]:
    slug            = str(args.get("slug", "")).strip()
    idempotency_key = str(args.get("idempotency_key", "")).strip()

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

    # Already owned — return immediately (no new emit)
    existing = session.execute(
        select(Transaction).where(
            Transaction.buyer_id == owner.id,
            Transaction.product_id == product.id,
            Transaction.status == "completed",
        )
    ).scalars().first()
    if existing:
        return (
            {"status": "already_owned", "product_slug": slug, "transaction_id": str(existing.id)},
            None,
        )

    # Idempotency check — same key = cached result (no new emit)
    idem_prefix = "wallet_free_" if product.price_cents == 0 else "wallet_"
    idempotent_tx = session.execute(
        select(Transaction).where(
            Transaction.stripe_payment_intent_id == f"{idem_prefix}{idempotency_key}",
        )
    ).scalars().first()
    if idempotent_tx:
        return (
            {
                "status":           idempotent_tx.status,
                "product_slug":     slug,
                "transaction_id":   str(idempotent_tx.id),
                "idempotent_replay": True,
            },
            None,
        )

    # Spending limit guard
    if client.spending_limit_cents > 0:
        if (client.spent_cents or 0) + product.price_cents > client.spending_limit_cents:
            raise PermissionError(
                f"Purchase of ${product.price_cents/100:.2f} would exceed spending limit "
                f"(${client.spending_limit_cents/100:.2f}). "
                f"Current spend: ${(client.spent_cents or 0)/100:.2f}"
            )

    result = wallet_deduct(
        user_id=owner.id,
        amount_cents=product.price_cents,
        product_slug=slug,
        product_id=product.id,
        seller_id=product.owner_id,
        idempotency_key=idempotency_key,
        client=client,
        session=session,
    )

    product.download_count = (product.download_count or 0) + 1
    session.add(product)
    session.commit()

    # Signal to the async route handler to fire purchase + low-balance webhooks
    emit_hint = {
        "product":   product,
        "user_id":   owner.id,
        "wallet_balance_cents": result.get("wallet_balance_remaining"),
        "tx_id":     result.get("transaction_id"),
    }

    return ({**result, "product_slug": slug}, emit_hint)


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

    # Prefer MCPDetail row (richer, version-linked) over one_click_json for mcp_server category
    mcp_detail = None
    if product.category == "mcp_server":
        mcp_detail = session.execute(
            select(MCPDetail)
            .where(MCPDetail.product_id == product.id)
            .order_by(MCPDetail.id.desc())
        ).scalars().first()

    manifest_body = build_manifest(
        category=product.category,
        slug=product.slug,
        name=product.name,
        description=product.description or "",
        one_click_json=product.one_click_json or {},
        version=getattr(product, "version", "1.0.0") or "1.0.0",
        mcp_detail=mcp_detail,
    )

    scan = scan_manifest({
        "description": product.description or "",
        "command": manifest_body.get("command", ""),
        "args": manifest_body.get("args", []),
        "system_prompt": manifest_body.get("system_prompt", ""),
    })
    signed = sign_manifest(manifest_body, settings.OAUTH_PRIVATE_KEY) if settings.OAUTH_PRIVATE_KEY else manifest_body

    return {
        "slug":     product.slug,
        "name":     product.name,
        "category": product.category,
        "manifest": signed,
        "security": {
            "safe":       scan["safe"],
            "risk_level": scan["risk_level"],
            "findings":   scan["findings"],
        },
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


def _dispatch(method: str, params: Dict, rpc_id, client: OAuthClient, owner: User, session) -> tuple[Dict, Optional[Dict]]:
    emit_hint: Optional[Dict] = None
    try:
        if method == "initialize":
            return (_rpc_ok({
                "protocolVersion": PROTOCOL_VERSION,
                "serverInfo":      SERVER_INFO,
                "capabilities":    {"tools": {"listChanged": False}},
            }, rpc_id), None)

        if method == "tools/list":
            return (_rpc_ok({"tools": TOOLS}, rpc_id), None)

        if method == "tools/call":
            tool_name = params.get("name", "")
            tool_args = params.get("arguments", {})

            if tool_name == "search_listings":
                result = _tool_search_listings(tool_args, session)
            elif tool_name == "get_listing":
                result = _tool_get_listing(tool_args, session, owner)
            elif tool_name == "purchase_listing":
                result, emit_hint = _tool_purchase_listing(tool_args, session, client, owner)
            elif tool_name == "get_install_manifest":
                result = _tool_get_install_manifest(tool_args, session, owner)
            elif tool_name == "get_wallet_balance":
                result = _tool_get_wallet_balance(client, owner)
            else:
                return (_rpc_error(-32601, f"Unknown tool: {tool_name}", rpc_id), None)

            return (
                _rpc_ok(
                    {"content": [{"type": "text", "text": json.dumps(result, default=str)}]},
                    rpc_id,
                ),
                emit_hint,
            )

        if method == "ping":
            return (_rpc_ok({}, rpc_id), None)

        return (_rpc_error(-32601, f"Method not found: {method}", rpc_id), None)

    except (ValueError, KeyError) as e:
        return (_rpc_error(-32602, f"Invalid params: {e}", rpc_id), None)
    except PermissionError as e:
        return (_rpc_error(-32603, f"Forbidden: {e}", rpc_id), None)
    except RuntimeError as e:
        return (_rpc_error(-32603, f"Internal error: {e}", rpc_id), None)


# ---------------------------------------------------------------------------
# HTTP endpoint
# ---------------------------------------------------------------------------

async def _fire_purchase_webhooks(emit_hint: Dict, background_tasks: BackgroundTasks, session) -> None:
    """Schedule purchase + low-balance webhook emissions after a successful purchase."""
    from models import Transaction
    tx_id = emit_hint.get("tx_id")
    product = emit_hint.get("product")
    user_id = emit_hint.get("user_id")
    balance = emit_hint.get("wallet_balance_cents")

    if tx_id and product and user_id:
        tx = session.execute(
            select(Transaction).where(Transaction.id == tx_id)
        ).scalars().first()
        if tx:
            await emit_purchase_completed(tx, product, user_id, background_tasks, session)

    if balance is not None and user_id:
        await emit_wallet_low_balance(balance, user_id, background_tasks, session)


@router.post("/mcp")
async def mcp_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
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
        responses = []
        for item in body:
            if not isinstance(item, dict):
                continue
            rpc_resp, emit_hint = _dispatch(
                item.get("method", ""),
                item.get("params", {}),
                item.get("id"),
                client,
                owner,
                session,
            )
            if emit_hint:
                await _fire_purchase_webhooks(emit_hint, background_tasks, session)
            responses.append(rpc_resp)
        return JSONResponse(responses)

    if not isinstance(body, dict):
        return JSONResponse(_rpc_error(-32600, "Invalid Request"), status_code=400)

    response, emit_hint = _dispatch(
        body.get("method", ""),
        body.get("params", {}),
        body.get("id"),
        client,
        owner,
        session,
    )
    if emit_hint:
        await _fire_purchase_webhooks(emit_hint, background_tasks, session)
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
