# Algebra Enterprises Web App

Full-stack real estate platform for Algebra Enterprises with:

- a public Next.js website
- a Strapi backend CMS/API
- a private agent dashboard
- Cloudflare R2-backed media storage

## Repository Layout

- `algebra-enterprises-frontend/` — Next.js frontend
- `algebra-enterprises-backend/` — Strapi backend
- `docs/` — project memory, deployment notes, and working decisions

## Local Development

Backend:

```bash
cd algebra-enterprises-backend
npm install
npm run develop
```

Frontend:

```bash
cd algebra-enterprises-frontend
npm install
npm run dev
```

## Production Notes

- Render-native deployment prep is documented in [`docs/render-hobby-deploy.md`](docs/render-hobby-deploy.md)
- Media uploads are configured for Cloudflare R2
- Production should use PostgreSQL, not local SQLite

## Important Project Docs

- [`docs/current-state.md`](docs/current-state.md)
- [`docs/todo.md`](docs/todo.md)
- [`docs/decisions.md`](docs/decisions.md)
