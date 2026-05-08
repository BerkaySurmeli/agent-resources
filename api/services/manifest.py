"""
Install manifest builder — Phase 8 headless.

build_manifest(product, mcp_detail) → category-specific structured manifest

Each category returns:
  mcp_server  — claude_desktop_config, cursor_config, raw command block
  persona     — system_prompt block, identity block, injection guide
  skill       — tools[] array (Anthropic/OpenAI tool-use format), usage example
"""
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# MCP Server manifest
# ---------------------------------------------------------------------------

def _env_placeholder(var_name: str) -> str:
    return f"<YOUR_{var_name.upper()}>"


def _mcp_server_manifest(
    slug: str,
    name: str,
    command: Optional[str],
    args: List[str],
    env_vars_required: List[str],
    env_vars_optional: List[str],
    description: str,
    homepage: str,
    version: str,
) -> Dict:
    env_block = {v: _env_placeholder(v) for v in env_vars_required}
    env_block.update({v: _env_placeholder(v) for v in env_vars_optional})

    claude_desktop_config = {
        "mcpServers": {
            slug: {
                "command": command or "npx",
                "args":    args,
                **({"env": env_block} if env_block else {}),
            }
        }
    }

    cursor_config = {
        "mcp": {
            "servers": {
                slug: {
                    "command": command or "npx",
                    "args":    args,
                    **({"env": env_block} if env_block else {}),
                }
            }
        }
    }

    install_steps = [
        f"1. Install: {command or 'npx'} {' '.join(args)}",
    ]
    if env_vars_required:
        install_steps.append(
            f"2. Set required env vars: {', '.join(env_vars_required)}"
        )
    install_steps.append(
        f"{'3' if env_vars_required else '2'}. Add the claude_desktop_config block to your claude_desktop_config.json"
    )
    install_steps.append(
        f"{'4' if env_vars_required else '3'}. Restart your MCP client"
    )

    return {
        "type":    "mcp_server",
        "version": version,
        "command": command,
        "args":    args,
        "env_vars_required": env_vars_required,
        "env_vars_optional": env_vars_optional,
        "claude_desktop_config": claude_desktop_config,
        "cursor_config":         cursor_config,
        "install_steps":         install_steps,
        "homepage": homepage,
    }


# ---------------------------------------------------------------------------
# Persona manifest
# ---------------------------------------------------------------------------

def _persona_manifest(
    slug: str,
    name: str,
    description: str,
    one_click: Dict,
    homepage: str,
    version: str,
) -> Dict:
    role        = one_click.get("role", name)
    tone        = one_click.get("tone", "professional")
    language    = one_click.get("language", "English")
    raw_prompt  = one_click.get("system_prompt") or description

    system_prompt = (
        f"You are {name}. {raw_prompt}\n\n"
        f"Tone: {tone}. Language: {language}."
    ).strip()

    identity_block = {
        "name":        name,
        "role":        role,
        "tone":        tone,
        "language":    language,
        "description": description,
    }

    injection_guide = {
        "anthropic_sdk": {
            "example": {
                "model":  "claude-opus-4-7",
                "system": system_prompt,
                "messages": [{"role": "user", "content": "Hello"}],
            },
            "note": "Pass system_prompt as the `system` parameter.",
        },
        "openai_sdk": {
            "example": {
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": "Hello"},
                ],
            },
            "note": "Pass system_prompt as the first message with role=system.",
        },
        "claude_desktop": {
            "note": "Paste system_prompt into Settings → Custom Instructions.",
        },
    }

    return {
        "type":           "persona",
        "version":        version,
        "name":           name,
        "identity":       identity_block,
        "system_prompt":  system_prompt,
        "injection_guide": injection_guide,
        "homepage":       homepage,
    }


# ---------------------------------------------------------------------------
# Skill manifest
# ---------------------------------------------------------------------------

def _skill_manifest(
    slug: str,
    name: str,
    description: str,
    one_click: Dict,
    homepage: str,
    version: str,
) -> Dict:
    input_schema = one_click.get("input_schema") or {
        "type": "object",
        "properties": {},
        "required": [],
    }
    output_schema = one_click.get("output_schema") or {
        "type": "object",
        "description": "Result of the skill execution",
    }
    endpoint = one_click.get("endpoint")

    tool_definition = {
        "name":        slug.replace("-", "_"),
        "description": description,
        "input_schema": input_schema,
    }

    openai_tool_definition = {
        "type": "function",
        "function": {
            "name":        slug.replace("-", "_"),
            "description": description,
            "parameters":  input_schema,
        },
    }

    usage_example = {
        "anthropic_sdk": {
            "tools": [tool_definition],
            "note": "Pass the tools array to client.messages.create(tools=[...])",
        },
        "openai_sdk": {
            "tools": [openai_tool_definition],
            "note": "Pass to client.chat.completions.create(tools=[...])",
        },
    }

    if endpoint:
        usage_example["direct_call"] = {
            "endpoint":    endpoint,
            "method":      one_click.get("method", "POST"),
            "input_schema": input_schema,
            "output_schema": output_schema,
            "note": "Call this endpoint directly if not using an LLM framework.",
        }

    return {
        "type":               "skill",
        "version":            version,
        "name":               name,
        "tool_definition":    tool_definition,
        "openai_tool_definition": openai_tool_definition,
        "input_schema":       input_schema,
        "output_schema":      output_schema,
        "usage_example":      usage_example,
        "homepage":           homepage,
    }


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def build_manifest(
    category: str,
    slug: str,
    name: str,
    description: str,
    one_click_json: Dict,
    version: str = "1.0.0",
    mcp_detail: Optional[Any] = None,
) -> Dict:
    """
    Build a category-specific structured install manifest.

    mcp_detail: MCPDetail SQLModel row (optional, used for mcp_server category
                to prefer DB-stored command/args over one_click_json).
    """
    homepage = f"https://shopagentresources.com/listing/{slug}"
    ocj = one_click_json or {}

    if category == "mcp_server":
        if mcp_detail:
            command  = mcp_detail.command
            args     = list(mcp_detail.args or [])
            env_req  = list(mcp_detail.env_vars_required or [])
        else:
            command  = ocj.get("command")
            args     = ocj.get("args", [])
            env_req  = ocj.get("env_vars_required", [])

        env_opt = ocj.get("env_vars_optional", [])

        return _mcp_server_manifest(
            slug=slug, name=name,
            command=command, args=args,
            env_vars_required=env_req,
            env_vars_optional=env_opt,
            description=description,
            homepage=homepage, version=version,
        )

    if category == "persona":
        return _persona_manifest(
            slug=slug, name=name, description=description,
            one_click=ocj, homepage=homepage, version=version,
        )

    if category == "skill":
        return _skill_manifest(
            slug=slug, name=name, description=description,
            one_click=ocj, homepage=homepage, version=version,
        )

    # Unknown category — return generic block
    return {
        "type":    category,
        "version": version,
        "command": ocj.get("command"),
        "args":    ocj.get("args", []),
        "env_vars_required": ocj.get("env_vars_required", []),
        "raw":     ocj,
        "homepage": homepage,
    }
