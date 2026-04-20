# Memory System Guide

Claudia's memory system is a 4-layer architecture designed for persistence, organization, and continuous improvement.

## Architecture Overview

```
~/.openclaw/workspace/memory/executive/
├── hot/                       # Now: Dashboard, alerts, priorities
│   └── dashboard.md
├── para/                      # PARA knowledge graph
│   ├── projects/              # Active projects
│   │   └── [project-name]/
│   │       └── brief.md
│   ├── areas/                 # Ongoing responsibilities
│   ├── resources/             # Reference material
│   └── archive/               # Completed projects
├── timeline/                  # Daily logs (auto-generated)
│   └── YYYY-MM-DD.md
└── intelligence/              # Learnings & patterns
    ├── patterns/              # Recurring solutions
    ├── relationships/         # Contact context
    └── market/                # Industry insights
```

## Layer 1: Hot Memory

**Purpose**: Current state, immediate priorities

**Files**:
- `dashboard.md` — Active projects, today's priorities, blockers
- `alerts.md` — Urgent items requiring attention

**Update Frequency**: Real-time, as things change

**Example dashboard.md**:
```markdown
# Executive Dashboard

## Active Projects
- [Agent Resources](para/projects/agent-resources/brief.md) — Launch prep
- [Trading Bot](para/projects/trading-bot/brief.md) — Monitoring

## Today's Priorities
1. Fix Stripe Connect webhooks
2. Review Chen's PR
3. Update documentation

## Blockers
- Waiting for Stripe test account

## Quick Links
- [Project Briefs](para/projects/)
- [Daily Logs](timeline/)
```

## Layer 2: PARA

**Purpose**: Organized knowledge by type

### Projects
Active work with defined outcomes and deadlines.

**Structure**:
```
para/projects/[project-name]/
├── brief.md           # Project overview
├── decisions.md       # Key decisions log
├── notes.md           # Working notes
└── archive/           # Old versions
```

**Example brief.md**:
```markdown
# Project: Agent Resources Marketplace

## Goal
Launch a marketplace for AI personas and tools

## Status
In development, targeting beta launch

## Key Decisions
- Tech stack: Next.js + FastAPI + PostgreSQL
- Hosting: Railway (API) + Vercel (Web)
- Payments: Stripe Connect

## Team
- Claudia: Orchestration
- Chen: Backend development
- Adrian: UI/UX design

## Timeline
- Week 1: Core infrastructure
- Week 2: Listing system
- Week 3: Payments + launch

## Links
- [GitHub Repo](...)
- [Staging](...)
- [Production](...)
```

### Areas
Ongoing responsibilities without specific end dates.

**Examples**:
- `areas/operations.md` — Business operations
- `areas/marketing.md` — Marketing activities
- `areas/development.md` — Development standards

### Resources
Reference materials, guides, and documentation.

**Examples**:
- `resources/api-reference.md`
- `resources/deployment-guide.md`
- `resources/security-checklist.md`

### Archive
Completed projects and outdated materials.

## Layer 3: Timeline

**Purpose**: Chronological record of what happened

**Naming**: `YYYY-MM-DD.md`

**Content**:
```markdown
# 2026-04-17

## Morning
- Fixed Stripe webhook handlers
- Reviewed Chen's database migration PR
- Updated Claudia persona documentation

## Afternoon
- Created marketing campaign for launch
- Tested payment flow end-to-end
- Documented memory system

## Decisions
- Switched from SendGrid to Resend for email
- Deferred mobile app to v2

## Blockers
- None

## Notes
- Stripe Connect onboarding is smoother than expected
- Need to add rate limiting to API
```

**Auto-creation**: Claudia creates these automatically each day

## Layer 4: Intelligence

**Purpose**: Distilled learnings and patterns

### Patterns
Recurring solutions and approaches.

**Example**:
```markdown
# Pattern: Database Migration Safety

## Problem
Migrations can fail and corrupt data

## Solution
1. Always backup before migrating
2. Use transactions for atomicity
3. Test migrations on copy of production data
4. Have rollback plan ready

## Tools
- `pg_dump` for backups
- Alembic/SQLModel for migrations
- Railway CLI for database access

## Examples
- [Agent Resources migration #8](...)
```

### Relationships
Context about people, organizations, and connections.

**Example**:
```markdown
# Contact: Berkay

## Role
Founder, Agent Resources

## Preferences
- Direct, sharp communication
- Pacific Time zone
- Telegram for urgent matters

## Projects
- Agent Resources marketplace
- Trading bot system

## Notes
- Technical background, prefers hands-off management
- Values autonomy and speed
```

### Market
Industry insights and competitive intelligence.

## Memory Operations

### Daily Routine
1. **Morning**: Read dashboard.md, review priorities
2. **During work**: Log to today's timeline file
3. **Evening**: Update dashboard, capture key learnings

### Weekly Review
1. Review past week's timeline entries
2. Update project briefs with progress
3. Promote recurring patterns to intelligence/
4. Archive completed projects

### Monthly Compaction
1. Review all timeline entries
2. Distill into MEMORY.md (long-term memory)
3. Clean up outdated hot memory
4. Update SOUL.md if behavioral changes needed

## Best Practices

### Writing Style
- **Factual**: What happened, not interpretations
- **Concise**: Bullet points over paragraphs
- **Linkable**: Reference other files with paths
- **Searchable**: Use consistent terminology

### Security
- **Never store**: Passwords, API keys, secrets
- **Be careful with**: Personal data, financial info
- **Safe to store**: Project details, decisions, patterns

### Maintenance
- Delete temporary notes after use
- Archive old projects promptly
- Review and compact monthly
- Keep hot memory minimal

## Integration with Claudia

Claudia automatically:
- Creates daily timeline entries
- Updates dashboard on status changes
- Logs decisions to project briefs
- Captures errors to .learnings/
- Promotes patterns after 3+ occurrences

You can ask:
- "What did we work on last week?"
- "Show me the Agent Resources project status"
- "What patterns do we have for database migrations?"
- "When did we decide to use Stripe?"

---

*This memory system is included with the Claudia persona package*