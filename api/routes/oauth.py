import secrets
import time
from collections import defaultdict
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlmodel import select

from core.config import settings
from core.database import get_session
from models import OAuthClient, User
from routes.auth import get_current_user_from_token

router = APIRouter(tags=["OAuth"])

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Scopes a human owner may grant to their agent clients
GRANTABLE_SCOPES = {
    "catalog:read",
    "orders:create",
    "orders:read:own",
    "downloads:read:own",
    "billing:read",
}

# Token endpoint rate limiter — 10 attempts per client_id per minute
_token_rate: dict = defaultdict(list)
_TOKEN_WINDOW = 60
_TOKEN_MAX = 10


def _enforce_token_rate_limit(client_id: str):
    now = time.time()
    key = client_id or "unknown"
    _token_rate[key] = [t for t in _token_rate[key] if now - t < _TOKEN_WINDOW]
    if len(_token_rate[key]) >= _TOKEN_MAX:
        raise HTTPException(
            status_code=429,
            detail={"error": "too_many_requests", "error_description": "Rate limit exceeded"},
        )
    _token_rate[key].append(now)


def _oauth_available():
    if not settings.OAUTH_PRIVATE_KEY or not settings.OAUTH_PUBLIC_KEY:
        raise HTTPException(
            status_code=503,
            detail={"error": "temporarily_unavailable", "error_description": "OAuth not configured"},
        )


def _lookup_client(session, client_id: str) -> Optional[OAuthClient]:
    """Fetch a single OAuthClient by client_id."""
    result = session.execute(
        select(OAuthClient).where(OAuthClient.client_id == client_id)
    )
    return result.scalars().first()


def _lookup_clients_for_user(session, user_id) -> List[OAuthClient]:
    """Fetch all OAuthClients owned by a user."""
    result = session.execute(
        select(OAuthClient).where(OAuthClient.user_id == user_id)
    )
    return result.scalars().all()


def _lookup_user(session, user_id) -> Optional[User]:
    """Fetch a User by primary key."""
    result = session.execute(
        select(User).where(User.id == user_id)
    )
    return result.scalars().first()


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class RegisterClientRequest(BaseModel):
    name: str
    scopes_requested: List[str] = ["catalog:read"]
    spending_limit_cents: int = 0


class ClientSummary(BaseModel):
    id: str
    client_id: str
    name: str
    scopes_allowed: List[str]
    spending_limit_cents: int
    spent_cents: int
    is_active: bool
    last_used_at: Optional[datetime]
    created_at: datetime


def _client_summary(c: OAuthClient) -> ClientSummary:
    return ClientSummary(
        id=str(c.id),
        client_id=c.client_id,
        name=c.name,
        scopes_allowed=c.scopes_allowed or [],
        spending_limit_cents=c.spending_limit_cents,
        spent_cents=c.spent_cents,
        is_active=c.is_active,
        last_used_at=c.last_used_at,
        created_at=c.created_at,
    )


# ---------------------------------------------------------------------------
# Token endpoint — OAuth 2.1 Client Credentials
# ---------------------------------------------------------------------------

@router.post("/oauth/token")
async def token_endpoint(request: Request, session=Depends(get_session)):
    """
    RFC 6749 §4.4 Client Credentials grant (OAuth 2.1).
    Accepts application/x-www-form-urlencoded.
    """
    _oauth_available()

    form = await request.form()
    grant_type    = str(form.get("grant_type", ""))
    client_id     = str(form.get("client_id", ""))
    client_secret = str(form.get("client_secret", ""))
    scope_str     = str(form.get("scope", ""))

    if grant_type != "client_credentials":
        raise HTTPException(
            status_code=400,
            detail={"error": "unsupported_grant_type"},
        )

    _enforce_token_rate_limit(client_id)

    client = _lookup_client(session, client_id)
    if not client or not client.is_active:
        raise HTTPException(status_code=401, detail={"error": "invalid_client"})

    if not pwd_context.verify(client_secret, client.client_secret_hash):
        raise HTTPException(status_code=401, detail={"error": "invalid_client"})

    allowed = set(client.scopes_allowed or [])
    # RFC 6749 §4.4: if no scope requested, grant all scopes the client is authorized for
    requested = set(scope_str.split()) if scope_str.strip() else allowed
    granted   = requested & allowed

    if not granted:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "invalid_scope",
                "error_description": "No requested scope is authorized for this client",
            },
        )

    now    = datetime.utcnow()
    expire = now + timedelta(minutes=settings.OAUTH_TOKEN_EXPIRE_MINUTES)

    payload = {
        "iss":       settings.FRONTEND_URL,
        "sub":       f"agent:{client.id}",
        "aud":       "https://api.shopagentresources.com",
        "exp":       expire,
        "iat":       now,
        "jti":       str(uuid4()),
        "scope":     " ".join(sorted(granted)),
        "client_id": client.client_id,
        "agent_id":  str(client.id),
    }

    token = jwt.encode(payload, settings.OAUTH_PRIVATE_KEY, algorithm="ES256")

    client.last_used_at = now
    session.add(client)
    session.commit()

    return JSONResponse({
        "access_token": token,
        "token_type":   "Bearer",
        "expires_in":   settings.OAUTH_TOKEN_EXPIRE_MINUTES * 60,
        "scope":        " ".join(sorted(granted)),
    })


# ---------------------------------------------------------------------------
# Client management — human owner registers / lists / revokes agent clients
# ---------------------------------------------------------------------------

@router.post("/oauth/clients", status_code=201)
async def register_client(
    body: RegisterClientRequest,
    current_user: User = Depends(get_current_user_from_token),
    session=Depends(get_session),
):
    """Register a new OAuth agent client. Returns the plaintext secret exactly once."""
    granted = list(set(body.scopes_requested) & GRANTABLE_SCOPES)
    if not granted:
        raise HTTPException(
            status_code=400,
            detail="No valid scopes requested. Allowed: " + ", ".join(sorted(GRANTABLE_SCOPES)),
        )

    raw_client_id     = f"agt_{secrets.token_hex(12)}"
    raw_client_secret = f"sk_live_{secrets.token_hex(24)}"
    secret_hash       = pwd_context.hash(raw_client_secret)

    client = OAuthClient(
        user_id              = current_user.id,
        client_id            = raw_client_id,
        client_secret_hash   = secret_hash,
        name                 = body.name,
        scopes_allowed       = granted,
        spending_limit_cents = max(0, body.spending_limit_cents),
    )
    session.add(client)
    session.commit()
    session.refresh(client)

    return {
        "client_id":            raw_client_id,
        "client_secret":        raw_client_secret,
        "name":                 client.name,
        "scopes_allowed":       client.scopes_allowed,
        "spending_limit_cents": client.spending_limit_cents,
        "created_at":           client.created_at.isoformat(),
        "warning":              "Save client_secret now — it will not be shown again",
    }


@router.get("/oauth/clients", response_model=List[ClientSummary])
async def list_clients(
    current_user: User = Depends(get_current_user_from_token),
    session=Depends(get_session),
):
    """List all OAuth clients owned by the current user. Secrets are never returned."""
    clients = _lookup_clients_for_user(session, current_user.id)
    return [_client_summary(c) for c in clients]


@router.delete("/oauth/clients/{client_id}", status_code=204)
async def revoke_client(
    client_id: str,
    current_user: User = Depends(get_current_user_from_token),
    session=Depends(get_session),
):
    """Revoke an agent client. All tokens it issued are immediately invalid."""
    client = _lookup_client(session, client_id)
    if not client or str(client.user_id) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Client not found")
    client.is_active = False
    session.add(client)
    session.commit()


# ---------------------------------------------------------------------------
# Token introspection — RFC 7662
# ---------------------------------------------------------------------------

@router.post("/oauth/introspect")
async def introspect_token(request: Request, session=Depends(get_session)):
    """RFC 7662 Token Introspection — for resource servers validating agent tokens."""
    _oauth_available()

    form  = await request.form()
    token = str(form.get("token", ""))

    try:
        payload = jwt.decode(
            token,
            settings.OAUTH_PUBLIC_KEY,
            algorithms=["ES256"],
            audience="https://api.shopagentresources.com",
        )
        client = _lookup_client(session, payload.get("client_id", ""))
        active = bool(client and client.is_active)
    except JWTError:
        active  = False
        payload = {}

    if not active:
        return {"active": False}

    return {
        "active":    True,
        "scope":     payload.get("scope"),
        "client_id": payload.get("client_id"),
        "agent_id":  payload.get("agent_id"),
        "sub":       payload.get("sub"),
        "exp":       payload.get("exp"),
        "iat":       payload.get("iat"),
    }


# ---------------------------------------------------------------------------
# Token revocation — RFC 7009
# Tokens are short-lived (30 min); client revocation via DELETE /oauth/clients
# is the primary mechanism. This endpoint exists for spec compliance.
# ---------------------------------------------------------------------------

@router.post("/oauth/revoke", status_code=200)
async def revoke_token():
    """RFC 7009 Token Revocation. Use DELETE /oauth/clients/:id to revoke all tokens."""
    return {}


# ---------------------------------------------------------------------------
# Auth dependency — used by all agent-facing routes (Phases 3+)
# ---------------------------------------------------------------------------

def get_current_agent(
    request: Request,
    session=Depends(get_session),
) -> tuple:
    """
    Validates an ES256 OAuth Bearer token.
    Returns (OAuthClient, User) — used as Depends() on agent routes.
    """
    _oauth_available()

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={"error": "invalid_token", "error_description": "Bearer token required"},
        )

    token = auth_header.split(" ", 1)[1]

    try:
        payload = jwt.decode(
            token,
            settings.OAUTH_PUBLIC_KEY,
            algorithms=["ES256"],
            audience="https://api.shopagentresources.com",
        )
    except JWTError:
        raise HTTPException(status_code=401, detail={"error": "invalid_token"})

    client = _lookup_client(session, payload.get("client_id", ""))
    if not client or not client.is_active:
        raise HTTPException(
            status_code=401,
            detail={"error": "invalid_token", "error_description": "Client revoked or not found"},
        )

    owner = _lookup_user(session, client.user_id)
    if not owner:
        raise HTTPException(status_code=401, detail={"error": "invalid_token"})

    return client, owner


def require_scope(required: str):
    """
    Returns a FastAPI dependency that enforces a specific OAuth scope.
    Usage: @router.get("/...", dependencies=[Depends(require_scope("catalog:read"))])
    """
    def _check(request: Request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail={"error": "invalid_token"})
        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(
                token,
                settings.OAUTH_PUBLIC_KEY,
                algorithms=["ES256"],
                audience="https://api.shopagentresources.com",
            )
        except JWTError:
            raise HTTPException(status_code=401, detail={"error": "invalid_token"})
        granted = set(payload.get("scope", "").split())
        if required not in granted:
            raise HTTPException(
                status_code=403,
                detail={"error": "insufficient_scope", "required_scope": required},
            )
    return _check
