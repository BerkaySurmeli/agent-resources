import base64

from fastapi import APIRouter
from fastapi.responses import JSONResponse, PlainTextResponse

from core.config import settings

router = APIRouter(tags=["Discovery"])

_CACHE_1DAY = "public, max-age=86400"
_API_BASE    = "https://api.shopagentresources.com"


@router.get("/.well-known/oauth-authorization-server")
async def oauth_metadata():
    """RFC 8414 — OAuth 2.0 Authorization Server Metadata."""
    return JSONResponse(
        content={
            "issuer":                                _API_BASE,
            "token_endpoint":                        f"{_API_BASE}/oauth/token",
            "introspection_endpoint":                f"{_API_BASE}/oauth/introspect",
            "revocation_endpoint":                   f"{_API_BASE}/oauth/revoke",
            "jwks_uri":                              f"{_API_BASE}/.well-known/jwks.json",
            "registration_endpoint":                 f"{_API_BASE}/oauth/clients",
            "scopes_supported": [
                "catalog:read",
                "orders:create",
                "orders:read:own",
                "downloads:read:own",
                "billing:read",
            ],
            "response_types_supported":              ["token"],
            "grant_types_supported":                 ["client_credentials"],
            "token_endpoint_auth_methods_supported": ["client_secret_post"],
            "code_challenge_methods_supported":      ["S256"],
        },
        headers={"Cache-Control": _CACHE_1DAY},
    )


@router.get("/.well-known/jwks.json")
async def jwks():
    """RFC 7517 — JSON Web Key Set. Clients use this to verify ES256 agent tokens."""
    if not settings.OAUTH_PUBLIC_KEY:
        return JSONResponse({"keys": []}, headers={"Cache-Control": _CACHE_1DAY})

    try:
        from cryptography.hazmat.primitives.serialization import load_pem_public_key

        pub_key      = load_pem_public_key(settings.OAUTH_PUBLIC_KEY.encode())
        pub_numbers  = pub_key.public_numbers()  # type: ignore[attr-defined]

        def _b64url(n: int, byte_len: int) -> str:
            return base64.urlsafe_b64encode(
                n.to_bytes(byte_len, "big")
            ).rstrip(b"=").decode()

        key_obj = {
            "kty": "EC",
            "crv": "P-256",
            "kid": "key-2026-05",
            "use": "sig",
            "alg": "ES256",
            "x":   _b64url(pub_numbers.x, 32),
            "y":   _b64url(pub_numbers.y, 32),
        }
    except Exception:
        key_obj = {}

    return JSONResponse(
        content={"keys": [key_obj] if key_obj else []},
        headers={"Cache-Control": _CACHE_1DAY},
    )


@router.get("/.well-known/agent.json")
async def agent_card():
    """Google A2A Agent Card — makes this marketplace discoverable by A2A-compliant agents."""
    return JSONResponse(
        content={
            "name":        "Agent Resources Marketplace",
            "description": (
                "Curated marketplace for AI personas, skills, and MCP servers. "
                "Agents can discover, purchase, and install capabilities programmatically."
            ),
            "url":     _API_BASE,
            "version": "1.0.0",
            "capabilities": [
                {
                    "name":        "catalog-search",
                    "description": "Search and filter marketplace listings by capability, category, price, and trust score",
                    "inputModes":  ["application/json"],
                    "outputModes": ["application/json"],
                    "tags":        ["discovery", "search"],
                },
                {
                    "name":        "purchase",
                    "description": "Purchase a listing using a pre-authorized agent wallet",
                    "inputModes":  ["application/json"],
                    "outputModes": ["application/json"],
                    "tags":        ["commerce", "payment"],
                },
                {
                    "name":        "install",
                    "description": "Retrieve structured install manifest for a purchased item (MCP config, system prompt, skill definition)",
                    "inputModes":  ["application/json"],
                    "outputModes": ["application/json"],
                    "tags":        ["install", "mcp", "persona", "skill"],
                },
            ],
            "authentication": {
                "schemes":          ["OAuth2"],
                "oauth2DiscoveryUrl": f"{_API_BASE}/.well-known/oauth-authorization-server",
            },
            "provider": {
                "name": "Agent Resources",
                "url":  "https://shopagentresources.com",
            },
        },
        headers={"Cache-Control": _CACHE_1DAY},
    )


@router.get("/.well-known/mcp-server.json")
async def mcp_server_metadata():
    """MCP server metadata (emerging standard) — for MCP-native agent discovery."""
    return JSONResponse(
        content={
            "name":             "Agent Resources MCP Server",
            "version":          "1.0.0",
            "endpoint":         "https://mcp.shopagentresources.com/mcp",
            "protocol_version": "2025-03-26",
            "auth": {
                "type":      "oauth2",
                "discovery": f"{_API_BASE}/.well-known/oauth-authorization-server",
            },
        },
        headers={"Cache-Control": _CACHE_1DAY},
    )


@router.get("/.well-known/security.txt")
async def security_txt():
    """RFC 9116 — Security contact information."""
    content = (
        "Contact: mailto:security@shopagentresources.com\n"
        "Preferred-Languages: en\n"
        "Policy: https://shopagentresources.com/security\n"
    )
    return PlainTextResponse(content, headers={"Cache-Control": _CACHE_1DAY})
