"""
Standards-compliant Catalog API — Phase 4 headless

Compliance:
  - RFC 9457  Problem Details (application/problem+json)
  - IETF draft-ietf-httpapi-ratelimit-headers-07
  - Cursor-based pagination (opaque base64 token)
  - Smithery-style qualified names: @owner-slug/listing-slug
  - OAuth 2.1 Bearer token OR anonymous (catalog:read scope)
"""
import base64
import time
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from services.security import scan_manifest
from services.trust import compute_trust_score, trust_score_dict
from sqlmodel import func, select

from core.database import get_session
from models import OAuthClient, Product, Review, Transaction, User
from routes.oauth import get_current_agent

router = APIRouter(prefix="/v1/catalog", tags=["Catalog"])
scan_router = APIRouter(prefix="/v1/catalog/scan", tags=["Catalog"])

# ---------------------------------------------------------------------------
# Rate limiter — 120 req / 60 s per client_id (or IP for anonymous)
# ---------------------------------------------------------------------------

_rl_store: dict = defaultdict(list)
_RL_WINDOW = 60
_RL_LIMIT  = 120


def _rate_limit_key(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return f"token:{auth[7:20]}"
    forwarded = request.headers.get("X-Forwarded-For", "")
    return f"ip:{forwarded.split(',')[0].strip() or request.client.host}"


def _check_rate_limit(key: str) -> tuple[int, int]:
    """Returns (remaining, reset_ts). Raises 429 if exceeded."""
    now = time.time()
    _rl_store[key] = [t for t in _rl_store[key] if now - t < _RL_WINDOW]
    remaining = _RL_LIMIT - len(_rl_store[key])
    reset_ts   = int(now) + _RL_WINDOW
    if remaining <= 0:
        raise HTTPException(
            status_code=429,
            headers={
                "RateLimit-Limit":     str(_RL_LIMIT),
                "RateLimit-Remaining": "0",
                "RateLimit-Reset":     str(reset_ts),
                "Retry-After":         str(_RL_WINDOW),
            },
            detail=_problem(
                "https://shopagentresources.com/errors/rate-limit-exceeded",
                "Too Many Requests",
                429,
                "Rate limit exceeded. Back off and retry after the reset time.",
            ),
        )
    _rl_store[key].append(now)
    return remaining - 1, reset_ts


# ---------------------------------------------------------------------------
# RFC 9457 Problem Details helper
# ---------------------------------------------------------------------------

def _problem(type_uri: str, title: str, status: int, detail: str, **extra) -> Dict:
    obj = {"type": type_uri, "title": title, "status": status, "detail": detail}
    obj.update(extra)
    return obj


def problem_response(type_uri: str, title: str, status: int, detail: str, **extra) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        content=_problem(type_uri, title, status, detail, **extra),
        headers={"Content-Type": "application/problem+json"},
    )


# ---------------------------------------------------------------------------
# Cursor helpers
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
# Qualified name helpers  @owner-slug/listing-slug
# ---------------------------------------------------------------------------

def _qualified_name(owner_slug: Optional[str], listing_slug: str) -> str:
    if owner_slug:
        return f"@{owner_slug}/{listing_slug}"
    return listing_slug


def _parse_qualified_name(qname: str) -> tuple[Optional[str], str]:
    """Returns (owner_slug, listing_slug). owner_slug is None for bare slugs."""
    if qname.startswith("@") and "/" in qname:
        parts = qname[1:].split("/", 1)
        return parts[0], parts[1]
    return None, qname


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class CatalogListing(BaseModel):
    qualified_name: str
    slug: str
    name: str
    category: str
    description: str
    price_cents: int
    price_display: str
    tags: List[str]
    download_count: int
    quality_score: int
    trust_score: int
    trust_grade: str
    trust_risk: str
    owner_slug: Optional[str]
    created_at: str


class CatalogPage(BaseModel):
    data: List[CatalogListing]
    pagination: Dict[str, Any]
    meta: Dict[str, Any]


def _fetch_trust_inputs(product: Product, session) -> tuple:
    """Returns (completed_tx_count, ratings_list) for trust scoring."""
    tx_count = session.execute(
        select(func.count(Transaction.id)).where(
            Transaction.product_id == product.id,
            Transaction.status == "completed",
        )
    ).scalar() or 0

    reviews = session.execute(
        select(Review).where(Review.product_id == product.id)
    ).scalars().all()
    ratings = [r.rating for r in reviews]

    return tx_count, ratings


def _listing_response(product: Product, owner_slug: Optional[str], session) -> CatalogListing:
    tx_count, ratings = _fetch_trust_inputs(product, session)
    ts = compute_trust_score(
        is_verified=product.is_verified,
        quality_score=product.quality_score,
        download_count=product.download_count,
        created_at=product.created_at,
        virus_scan_status="",
        completed_transaction_count=tx_count,
        ratings=ratings,
    )
    return CatalogListing(
        qualified_name=_qualified_name(owner_slug, product.slug),
        slug=product.slug,
        name=product.name,
        category=product.category,
        description=(product.description or "")[:280],
        price_cents=product.price_cents,
        price_display=f"${product.price_cents / 100:.2f}" if product.price_cents else "Free",
        tags=product.category_tags or [],
        download_count=product.download_count,
        quality_score=product.quality_score,
        trust_score=ts.score,
        trust_grade=ts.grade,
        trust_risk=ts.risk_label,
        owner_slug=owner_slug,
        created_at=product.created_at.isoformat(),
    )


# ---------------------------------------------------------------------------
# Optional auth dependency (anonymous OK for catalog:read)
# ---------------------------------------------------------------------------

def _optional_agent(request: Request, session=Depends(get_session)) -> Optional[tuple]:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    try:
        from routes.oauth import get_current_agent as _gca
        return _gca(request, session)
    except HTTPException:
        return None


# ---------------------------------------------------------------------------
# Rate-limit response wrapper
# ---------------------------------------------------------------------------

def _add_rl_headers(response: JSONResponse, remaining: int, reset_ts: int) -> JSONResponse:
    response.headers["RateLimit-Limit"]     = str(_RL_LIMIT)
    response.headers["RateLimit-Remaining"] = str(remaining)
    response.headers["RateLimit-Reset"]     = str(reset_ts)
    return response


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=CatalogPage)
async def list_catalog(
    request: Request,
    q:          Optional[str] = Query(None, description="Free-text search"),
    category:   Optional[str] = Query(None, description="mcp_server | persona | skill"),
    max_price:  Optional[int] = Query(None, description="Max price in cents"),
    min_trust:  Optional[int] = Query(None, description="Minimum trust score (0-100)"),
    sort:       str           = Query("popular", description="popular | newest | price_asc | price_desc"),
    limit:      int           = Query(20, ge=1, le=50),
    cursor:     Optional[str] = Query(None, description="Opaque pagination cursor"),
    session=Depends(get_session),
):
    """
    Browse the public catalog. No authentication required.
    Returns RFC 9457 errors, IETF rate-limit headers, and cursor pagination.
    """
    rl_key = _rate_limit_key(request)
    remaining, reset_ts = _check_rate_limit(rl_key)

    stmt = (
        select(Product, User)
        .join(User, Product.owner_id == User.id, isouter=True)
        .where(Product.is_active == True, Product.is_verified == True)
    )

    if q:
        q = q.strip()
        stmt = stmt.where(
            (Product.name.ilike(f"%{q}%")) | (Product.description.ilike(f"%{q}%"))
        )
    if category:
        if category not in ("mcp_server", "persona", "skill"):
            return problem_response(
                "https://shopagentresources.com/errors/invalid-parameter",
                "Invalid Parameter",
                400,
                f"category must be one of: mcp_server, persona, skill",
                instance=str(request.url),
            )
        stmt = stmt.where(Product.category == category)
    if max_price is not None:
        stmt = stmt.where(Product.price_cents <= max_price)

    # Sorting
    if sort == "newest":
        stmt = stmt.order_by(Product.created_at.desc(), Product.id.desc())
    elif sort == "price_asc":
        stmt = stmt.order_by(Product.price_cents.asc(), Product.created_at.desc(), Product.id.desc())
    elif sort == "price_desc":
        stmt = stmt.order_by(Product.price_cents.desc(), Product.created_at.desc(), Product.id.desc())
    else:
        stmt = stmt.order_by(Product.download_count.desc(), Product.quality_score.desc(), Product.id.desc())

    # Cursor (only works cleanly with created_at ordering; fallback for other sorts)
    if cursor and sort in ("newest", "popular"):
        decoded = _decode_cursor(cursor)
        if decoded:
            cur_ts, cur_id = decoded
            if sort == "newest":
                stmt = stmt.where(
                    (Product.created_at < cur_ts)
                    | ((Product.created_at == cur_ts) & (Product.id < cur_id))
                )

    rows = session.execute(stmt.limit(limit + 1)).all()
    has_more = len(rows) > limit
    items = rows[:limit]

    next_cursor = None
    if has_more and items and sort == "newest":
        last_product = items[-1][0]
        next_cursor = _encode_cursor(last_product.created_at, last_product.id)

    data = [_listing_response(p, u.profile_slug if u else None, session) for p, u in items]

    if min_trust is not None:
        data = [d for d in data if d.trust_score >= min_trust]

    total_stmt = (
        select(func.count(Product.id))
        .where(Product.is_active == True, Product.is_verified == True)
    )
    if category:
        total_stmt = total_stmt.where(Product.category == category)
    total = session.execute(total_stmt).scalar() or 0

    resp = JSONResponse({
        "data": [d.model_dump() for d in data],
        "pagination": {
            "limit":      limit,
            "has_more":   has_more,
            "cursor":     next_cursor,
            "total_approx": total,
        },
        "meta": {
            "sort":    sort,
            "filters": {k: v for k, v in {"q": q, "category": category, "max_price": max_price, "min_trust": min_trust}.items() if v is not None},
        },
    })
    return _add_rl_headers(resp, remaining, reset_ts)


@scan_router.get("/{slug}")
async def scan_listing(
    slug: str,
    request: Request,
    session=Depends(get_session),
):
    """
    Pre-purchase security scan for a listing.
    Returns injection findings so agents can make an informed decision before buying.
    No authentication required.
    """
    rl_key = _rate_limit_key(request)
    remaining, reset_ts = _check_rate_limit(rl_key)

    product = session.execute(
        select(Product).where(Product.slug == slug, Product.is_active == True)
    ).scalars().first()

    if not product:
        resp = problem_response(
            "https://shopagentresources.com/errors/not-found",
            "Listing Not Found",
            404,
            f"No listing found for slug '{slug}'",
            instance=str(request.url),
        )
        _add_rl_headers(resp, remaining, reset_ts)
        return resp

    manifest = product.one_click_json or {}
    scan_target = {
        "description": product.description or "",
        "name":        product.name,
        "command":     manifest.get("command", ""),
        "args":        manifest.get("args", []),
    }
    injection_result = scan_manifest(scan_target)

    tx_count, ratings = _fetch_trust_inputs(product, session)
    ts = compute_trust_score(
        is_verified=product.is_verified,
        quality_score=product.quality_score,
        download_count=product.download_count,
        created_at=product.created_at,
        virus_scan_status="",
        completed_transaction_count=tx_count,
        ratings=ratings,
    )

    resp = JSONResponse({
        "slug":       product.slug,
        "name":       product.name,
        "injection": {
            "safe":       injection_result["safe"],
            "risk_level": injection_result["risk_level"],
            "findings":   injection_result["findings"],
        },
        "trust": trust_score_dict(ts),
        "recommendation": (
            "safe to install"
            if injection_result["safe"] and ts.risk_label in ("low", "medium")
            else f"review findings before installing"
        ),
    })
    return _add_rl_headers(resp, remaining, reset_ts)


@router.get("/{qname:path}")
async def get_catalog_item(
    qname: str,
    request: Request,
    session=Depends(get_session),
):
    """
    Get a single listing by slug or qualified name (@owner/slug).
    No authentication required.
    """
    rl_key = _rate_limit_key(request)
    remaining, reset_ts = _check_rate_limit(rl_key)

    owner_slug, listing_slug = _parse_qualified_name(qname)

    stmt = select(Product, User).join(User, Product.owner_id == User.id, isouter=True).where(
        Product.slug == listing_slug,
        Product.is_active == True,
    )
    if owner_slug:
        stmt = stmt.where(User.profile_slug == owner_slug)

    row = session.execute(stmt).first()

    if not row:
        resp = problem_response(
            "https://shopagentresources.com/errors/not-found",
            "Listing Not Found",
            404,
            f"No listing found for '{qname}'",
            instance=str(request.url),
        )
        _add_rl_headers(resp, remaining, reset_ts)
        return resp

    product, owner = row
    data = _listing_response(product, owner.profile_slug if owner else None, session)

    manifest_preview = None
    if product.one_click_json:
        manifest_preview = {
            "type":              product.category,
            "command":           product.one_click_json.get("command"),
            "args":              product.one_click_json.get("args", []),
            "env_vars_required": product.one_click_json.get("env_vars_required", []),
        }

    resp = JSONResponse({
        **data.model_dump(),
        "manifest_preview": manifest_preview,
    })
    return _add_rl_headers(resp, remaining, reset_ts)
