"""
Install manifest REST endpoint — Phase 8 headless.

GET /v1/manifest/:slug         — preview (free listings) or owned check (paid)
GET /v1/manifest/:slug/preview — public preview, redacts sensitive fields
"""
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlmodel import select

from core.config import settings
from core.database import get_session
from models import MCPDetail, Product, Transaction
from routes.catalog import _rate_limit_key, _check_rate_limit, _add_rl_headers, problem_response
from routes.oauth import get_current_agent
from services.manifest import build_manifest
from services.security import scan_manifest, sign_manifest

router = APIRouter(prefix="/v1/manifest", tags=["Manifest"])


def _build_and_sign(product: Product, mcp_detail, signed: bool = True) -> dict:
    manifest_body = build_manifest(
        category=product.category,
        slug=product.slug,
        name=product.name,
        description=product.description or "",
        one_click_json=product.one_click_json or {},
        version=getattr(product, "version", "1.0.0") or "1.0.0",
        mcp_detail=mcp_detail,
    )
    if signed and settings.OAUTH_PRIVATE_KEY:
        return sign_manifest(manifest_body, settings.OAUTH_PRIVATE_KEY)
    return manifest_body


@router.get("/{slug}/preview")
async def manifest_preview(
    slug: str,
    request: Request,
    session=Depends(get_session),
):
    """
    Public preview manifest — no auth required.
    Sensitive fields (system_prompt, endpoint) are redacted for paid listings.
    Always includes claude_desktop_config structure so agents know what to expect.
    """
    rl_key = _rate_limit_key(request)
    remaining, reset_ts = _check_rate_limit(rl_key)

    product = session.execute(
        select(Product).where(Product.slug == slug, Product.is_active == True)
    ).scalars().first()

    if not product:
        resp = problem_response(
            "https://shopagentresources.com/errors/not-found",
            "Listing Not Found", 404,
            f"No listing found for slug '{slug}'",
            instance=str(request.url),
        )
        return _add_rl_headers(resp, remaining, reset_ts)

    mcp_detail = None
    if product.category == "mcp_server":
        mcp_detail = session.execute(
            select(MCPDetail)
            .where(MCPDetail.product_id == product.id)
            .order_by(MCPDetail.id.desc())
        ).scalars().first()

    manifest = _build_and_sign(product, mcp_detail, signed=False)

    # Redact paid-listing sensitive fields in preview
    if product.price_cents > 0:
        if "system_prompt" in manifest:
            words = manifest["system_prompt"].split()
            manifest["system_prompt"] = " ".join(words[:20]) + "… [purchase to unlock full prompt]"
        if "tool_definition" in manifest:
            manifest["tool_definition"]["description"] += " [purchase to unlock full schema]"
            manifest.get("tool_definition", {}).pop("input_schema", None)
        if "direct_call" in manifest.get("usage_example", {}):
            manifest["usage_example"]["direct_call"]["endpoint"] = "[purchase to unlock]"

    scan = scan_manifest({
        "description": product.description or "",
        "command": manifest.get("command", ""),
        "args": manifest.get("args", []),
    })

    resp = JSONResponse({
        "slug":        product.slug,
        "name":        product.name,
        "category":    product.category,
        "price_cents": product.price_cents,
        "preview":     True,
        "manifest":    manifest,
        "security": {
            "safe":       scan["safe"],
            "risk_level": scan["risk_level"],
        },
    })
    return _add_rl_headers(resp, remaining, reset_ts)


@router.get("/{slug}")
async def get_manifest(
    slug: str,
    request: Request,
    session=Depends(get_session),
    agent=Depends(get_current_agent),
):
    """
    Full signed manifest. Requires OAuth Bearer token.
    Free listings: always accessible.
    Paid listings: requires a completed transaction.
    """
    rl_key = _rate_limit_key(request)
    remaining, reset_ts = _check_rate_limit(rl_key)

    client, owner = agent

    product = session.execute(
        select(Product).where(Product.slug == slug, Product.is_active == True)
    ).scalars().first()

    if not product:
        resp = problem_response(
            "https://shopagentresources.com/errors/not-found",
            "Listing Not Found", 404,
            f"No listing found for slug '{slug}'",
            instance=str(request.url),
        )
        return _add_rl_headers(resp, remaining, reset_ts)

    if product.price_cents > 0:
        owned = session.execute(
            select(Transaction).where(
                Transaction.buyer_id == owner.id,
                Transaction.product_id == product.id,
                Transaction.status == "completed",
            )
        ).scalars().first()

        if not owned:
            resp = problem_response(
                "https://shopagentresources.com/errors/payment-required",
                "Payment Required", 402,
                f"'{slug}' requires purchase. Use the purchase_listing MCP tool or POST /payments/create-checkout-session.",
                instance=str(request.url),
            )
            return _add_rl_headers(resp, remaining, reset_ts)

    mcp_detail = None
    if product.category == "mcp_server":
        mcp_detail = session.execute(
            select(MCPDetail)
            .where(MCPDetail.product_id == product.id)
            .order_by(MCPDetail.id.desc())
        ).scalars().first()

    manifest = _build_and_sign(product, mcp_detail, signed=True)

    scan = scan_manifest({
        "description":   product.description or "",
        "command":       manifest.get("command", ""),
        "args":          manifest.get("args", []),
        "system_prompt": manifest.get("system_prompt", ""),
    })

    resp = JSONResponse({
        "slug":     product.slug,
        "name":     product.name,
        "category": product.category,
        "manifest": manifest,
        "security": {
            "safe":       scan["safe"],
            "risk_level": scan["risk_level"],
            "findings":   scan["findings"],
        },
    })
    return _add_rl_headers(resp, remaining, reset_ts)
