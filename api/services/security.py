"""
Phase 5 — Prompt injection defense + manifest signing.

scan_for_injection(text)  → list of findings (severity, pattern, excerpt)
scan_manifest(manifest)   → {safe: bool, findings: [...]}
sign_manifest(manifest)   → manifest dict with _sig block appended
"""
import base64
import hashlib
import json
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

_rx = re.compile

# ---------------------------------------------------------------------------
# Prompt injection patterns — OWASP LLM01 2025
# Each tuple: (severity, human label, compiled regex)
# ---------------------------------------------------------------------------

_COMPILED = [
    # Instruction override
    ("critical", "instruction-override",
     _rx(r"(?i)ignore\s+(all\s+)?(previous|prior|above|earlier)\s+instructions?")),
    ("critical", "instruction-override",
     _rx(r"(?i)disregard\s+(all\s+)?(previous|prior|above)?\s*instructions?")),
    ("critical", "instruction-override",
     _rx(r"(?i)forget\s+(all\s+)?(previous|your\s+)?(instructions?|training|context|rules?)")),
    ("critical", "instruction-override",
     _rx(r"(?i)your\s+(new\s+)?instructions?\s+(are|is)\s*[:\n]")),
    # Role / persona hijack
    ("high", "role-hijack",
     _rx(r"(?i)you\s+are\s+now\s+(a\s+)?(?!the\s+user|an?\s+assistant)")),
    ("high", "role-hijack",
     _rx(r"(?i)act\s+as\s+(a\s+)?(?:DAN|jailbreak|unrestricted|unfiltered)")),
    ("high", "role-hijack",
     _rx(r"(?i)pretend\s+(you\s+are|to\s+be)\s+(?:an?\s+)?(?:evil|malicious|unrestricted)")),
    # System prompt delimiter injection
    ("high", "delimiter-injection",
     _rx(r"<\s*/?\s*system\s*>")),
    ("high", "delimiter-injection",
     _rx(r"\[SYSTEM\]|\[INST\]|<\|system\|>|<\|im_start\|>|<\|im_end\|>")),
    ("high", "delimiter-injection",
     _rx(r"###\s*System|###\s*Instructions?|#{3,}\s*Prompt")),
    # Data exfiltration prompts
    ("high", "exfiltration",
     _rx(r"(?i)(?:send|transmit|exfiltrate|leak|forward)\s+(?:all\s+)?(?:user\s+)?(?:data|secrets?|keys?|tokens?|passwords?)")),
    ("high", "exfiltration",
     _rx(r"(?i)(?:print|output|reveal|show)\s+(?:all\s+)?(?:system\s+)?(?:prompt|instructions?|context)")),
    # Secrecy instructions
    ("medium", "secrecy-request",
     _rx(r"(?i)do\s+not\s+(?:tell|inform|mention|reveal)\s+(?:the\s+)?(?:user|human)")),
    ("medium", "secrecy-request",
     _rx(r"(?i)keep\s+this\s+(?:instruction|prompt|secret|hidden|confidential)")),
    # Indirect injection via external fetch
    ("medium", "indirect-injection",
     _rx(r"(?i)(?:fetch|retrieve|download|load)\s+(?:instructions?|prompts?)\s+from")),
]

# Shell injection patterns for command/args fields
_SHELL_PATTERNS = [
    ("critical", "shell-injection", _rx(r"\$\(|`[^`]+`")),
    ("critical", "shell-injection", _rx(r";\s*(?:rm|curl|wget|bash|sh|python|node)\b")),
    ("high",     "shell-injection", _rx(r"\|\s*(?:curl|wget|bash|sh|nc|netcat)\b")),
    ("high",     "path-traversal",  _rx(r"\.\./\.\.|/etc/(?:passwd|shadow|hosts)")),
    ("medium",   "shell-injection", _rx(r"&&\s*(?:curl|wget|rm|chmod|chown)\b")),
]


def _excerpt(text: str, match: re.Match, window: int = 60) -> str:
    start = max(0, match.start() - 20)
    end   = min(len(text), match.end() + 20)
    raw   = text[start:end].replace("\n", " ").strip()
    return raw[:window] + ("…" if len(raw) > window else "")


def scan_for_injection(text: str) -> List[Dict]:
    """Scan a text string for prompt injection patterns. Returns list of findings."""
    if not text:
        return []
    findings = []
    for severity, label, pattern in _COMPILED:
        for match in pattern.finditer(text):
            findings.append({
                "severity": severity,
                "type":     label,
                "excerpt":  _excerpt(text, match),
            })
    return findings


def scan_shell(value: str) -> List[Dict]:
    """Scan a command or arg string for shell injection patterns."""
    if not text := value:
        return []
    findings = []
    for severity, label, pattern in _SHELL_PATTERNS:
        for match in pattern.finditer(text):
            findings.append({
                "severity": severity,
                "type":     label,
                "excerpt":  _excerpt(text, match),
            })
    return findings


def scan_manifest(manifest: Dict) -> Dict:
    """
    Scan every text field in a manifest dict for injection.
    Returns {"safe": bool, "risk_level": str, "findings": [...]}
    """
    findings = []

    text_fields = ["description", "system_prompt", "name", "instructions"]
    for field in text_fields:
        val = manifest.get(field)
        if isinstance(val, str):
            for f in scan_for_injection(val):
                findings.append({**f, "field": field})

    # Shell injection in command + args
    if cmd := manifest.get("command"):
        for f in scan_shell(str(cmd)):
            findings.append({**f, "field": "command"})
    for arg in manifest.get("args", []):
        for f in scan_shell(str(arg)):
            findings.append({**f, "field": "args"})

    # Nested manifest dict
    inner = manifest.get("manifest", {})
    if inner and isinstance(inner, dict):
        nested = scan_manifest(inner)
        findings.extend(nested["findings"])

    severities = {f["severity"] for f in findings}
    if "critical" in severities:
        risk = "critical"
    elif "high" in severities:
        risk = "high"
    elif "medium" in severities:
        risk = "medium"
    else:
        risk = "none"

    return {
        "safe":       risk not in ("critical", "high"),
        "risk_level": risk,
        "findings":   findings,
    }


# ---------------------------------------------------------------------------
# Manifest signing — ES256 using existing OAuth EC key pair
# ---------------------------------------------------------------------------

def _canonical_bytes(manifest: Dict) -> bytes:
    """Produce deterministic UTF-8 bytes for signing (strips existing _sig block)."""
    clean = {k: v for k, v in manifest.items() if not k.startswith("_sig")}
    return json.dumps(clean, sort_keys=True, separators=(",", ":"), default=str).encode()


def sign_manifest(manifest: Dict, private_key_pem: str) -> Dict:
    """
    Sign the manifest with ES256. Appends a _sig block to the dict.
    Returns the manifest with the signature attached.
    """
    try:
        from cryptography.hazmat.primitives.asymmetric.ec import ECDSA
        from cryptography.hazmat.primitives.hashes import SHA256
        from cryptography.hazmat.primitives.serialization import load_pem_private_key

        key   = load_pem_private_key(private_key_pem.encode(), password=None)
        data  = _canonical_bytes(manifest)
        raw_sig = key.sign(data, ECDSA(SHA256()))
        sig_b64 = base64.urlsafe_b64encode(raw_sig).rstrip(b"=").decode()

        digest = hashlib.sha256(data).hexdigest()

        return {
            **manifest,
            "_sig": {
                "alg":       "ES256",
                "kid":       "key-2026-05",
                "sig":       sig_b64,
                "digest":    digest,
                "signed_at": datetime.utcnow().isoformat() + "Z",
                "verify_at": "https://api.shopagentresources.com/.well-known/jwks.json",
            },
        }
    except Exception as e:
        return {**manifest, "_sig": {"error": f"signing unavailable: {e}"}}


def verify_manifest(manifest: Dict, public_key_pem: str) -> Dict:
    """
    Verify a signed manifest. Returns {"valid": bool, "reason": str}.
    Used by agents to confirm authenticity before installing.
    """
    sig_block = manifest.get("_sig", {})
    if not sig_block or "sig" not in sig_block:
        return {"valid": False, "reason": "no signature block"}

    try:
        from cryptography.exceptions import InvalidSignature
        from cryptography.hazmat.primitives.asymmetric.ec import ECDSA
        from cryptography.hazmat.primitives.hashes import SHA256
        from cryptography.hazmat.primitives.serialization import load_pem_public_key

        key  = load_pem_public_key(public_key_pem.encode())
        data = _canonical_bytes(manifest)

        padded = sig_block["sig"] + "=" * (-len(sig_block["sig"]) % 4)
        raw_sig = base64.urlsafe_b64decode(padded)

        key.verify(raw_sig, data, ECDSA(SHA256()))
        return {"valid": True, "reason": "signature verified", "signed_at": sig_block.get("signed_at")}
    except InvalidSignature:
        return {"valid": False, "reason": "signature mismatch — manifest may have been tampered"}
    except Exception as e:
        return {"valid": False, "reason": f"verification error: {e}"}
