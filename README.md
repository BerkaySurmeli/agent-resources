# Agent Resources

A marketplace for OpenClaw Personas, Skills, and MCP Servers.

**Domain:** https://shopagentresources.com

## Project Structure

```
/claw-base
├── /web          # Next.js frontend (Vercel)
├── /api          # FastAPI backend (Railway)
├── /docs         # Documentation
└── README.md     # This file
```

## Quick Start

### Backend
```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd web
npm install
npm run dev
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full instructions.

## Tech Stack

- **Frontend:** Next.js 14, Tailwind CSS, Vercel
- **Backend:** FastAPI, SQLModel, PostgreSQL, Railway
- **Domain:** Cloudflare

## Features

- MCP Server marketplace
- Agent Skills & Personas
- One-click install for non-technical users
- 15% platform fee on sales
- Free listings for first 100 developers
- "Verified & Tested" badge system

## License

[PLACEHOLDER]
