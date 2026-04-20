# Integration Guide

How to set up Claudia in your OpenClaw environment.

## Prerequisites

- OpenClaw installed and configured
- Basic understanding of agent frameworks
- Optional: API keys for integrated services

## Installation

### Step 1: Copy Persona Files

```bash
# Copy to your OpenClaw workspace
cp -r claudia-persona ~/.openclaw/workspace/

# Or clone if using git
git clone [repo-url] ~/.openclaw/workspace/claudia-persona
```

### Step 2: Update AGENTS.md

Add Claudia to your agent roster in `~/.openclaw/workspace/AGENTS.md`:

```markdown
## Claudia

**Role:** AI Orchestrator & Executive Assistant  
**Trigger:** "Claudia" or "@claudia"  
**Persona:** `claudia-persona/SOUL.md`

**Capabilities:**
- Multi-agent orchestration
- Project management
- Full-stack development
- Business operations

**When to use:**
- Complex projects requiring coordination
- When you need someone to own outcomes
- Multi-step workflows
- Quality assurance
```

### Step 3: Create Memory Structure

```bash
# Create executive memory directories
mkdir -p ~/.openclaw/workspace/memory/executive/{hot,para/{projects,areas,resources,archive},timeline,intelligence/{patterns,relationships,market}}

# Create initial dashboard
cat > ~/.openclaw/workspace/memory/executive/hot/dashboard.md << 'EOF'
# Executive Dashboard

## Active Projects
*No active projects yet*

## Today's Priorities
1. Set up Claudia persona
2. Configure integrations

## Blockers
*None*

## Quick Links
- [Project Briefs](para/projects/)
- [Daily Logs](../timeline/)
EOF
```

### Step 4: Configure API Keys (Optional)

Create `~/.openclaw/workspace/.env`:

```bash
# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (for email)
RESEND_API_KEY=re_...

# X/Twitter (for social)
X_API_KEY=...
X_API_SECRET=...
X_ACCESS_TOKEN=...
X_ACCESS_SECRET=...

# Bluesky (for social)
BLUESKY_HANDLE=...
BLUESKY_PASSWORD=...

# Database (if needed)
DATABASE_URL=postgresql://...
```

## Verification

Start a new OpenClaw session and verify:

```
You: "Claudia, are you there?"

Claudia: "I'm here. Ready to coordinate. What's the project?"
```

Check that she:
- Loads SOUL.md correctly
- Can access memory system
- Responds with her characteristic style

## First Project

Test with a simple task:

```
You: "Claudia, create a project brief for a blog post about AI agents"

Claudia: "Got it. Creating project brief now."

[She'll create: memory/executive/para/projects/ai-agents-blog/brief.md]

Claudia: "Done. Brief created at memory/executive/para/projects/ai-agents-blog/brief.md

Outline:
- Hook: The shift from chatbots to agents
- Body: Key capabilities, real examples
- Conclusion: Future of work

Want me to write it or delegate to a content agent?"
```

## Customization

### Adjust Personality

Edit `claudia-persona/SOUL.md`:
- Change emoji
- Adjust communication style
- Add/remove capabilities
- Modify boundaries

### Add Capabilities

Create new files in `claudia-persona/capabilities/`:

```markdown
# NEW_CAPABILITY.md

## Overview
What this capability does

## Tools Required
- Tool 1
- Tool 2

## Usage Patterns
When and how to use

## Examples
Real usage examples
```

### Modify Workflows

Edit files in `claudia-persona/workflows/` or create new ones:

```markdown
# New Workflow

## Phase 1: ...
## Phase 2: ...
```

## Troubleshooting

### Claudia not responding correctly
- Check SOUL.md is readable
- Verify AGENTS.md configuration
- Restart OpenClaw session

### Memory not persisting
- Check directory permissions
- Verify memory/ structure exists
- Check disk space

### API integrations failing
- Verify .env file exists
- Check API keys are valid
- Review error logs

## Advanced Configuration

### Sub-Agent Spawning

Claudia can spawn specialized agents. Configure in `AGENTS.md`:

```markdown
## Chen (Developer)

**Role:** Software Developer  
**Trigger:** "Chen" or spawn from Claudia  
**Persona:** `chen-developer/SOUL.md`

## Adrian (Designer)

**Role:** UX/UI Designer  
**Trigger:** "Adrian" or spawn from Claudia  
**Persona:** `adrian-designer/SOUL.md`
```

### Custom Tools

Add tool definitions to `TOOLS.md`:

```markdown
## Custom API

**Command:** `custom-api`  
**Usage:** `custom-api endpoint data`  
**Description:** Custom API integration
```

## Updates

To update Claudia to latest version:

```bash
# Backup current configuration
cp -r claudia-persona claudia-persona-backup

# Download new version
curl -L [download-url] | tar xz

# Merge customizations
diff claudia-persona-backup/SOUL.md claudia-persona/SOUL.md
```

## Support

- **Documentation**: [docs.agentresources.com](https://docs.agentresources.com)
- **Community**: [Discord](https://discord.gg/agentresources)
- **Email**: support@shopagentresources.com

---

*Integration guide version 1.0*