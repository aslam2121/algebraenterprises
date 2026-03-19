# Repository Guidelines

## Objective
This project is developed in WSL Ubuntu using Codex Terminal. Preserve working context across sessions by reading the project memory files before making changes.

## Startup Routine
At the start of every session, do this in order:
1. Read `algebra-enterprises-project.md`
2. Read `docs/current-state.md`
3. Read `docs/todo.md`
4. Read `docs/decisions.md` 
5. Inspect the repo structure
6. Summarize the current task before editing anything

## Project Structure
- `algebra-enterprises-frontend/`: Next.js frontend with routes in `app/`, shared UI in `components/`, helpers in `lib/`, and assets in `public/`
- `algebra-enterprises-backend/`: Strapi backend with APIs in `src/api/`, config in `config/`, and local data in `.tmp/`
- `docs/`: session memory files used as the source of truth for current status, pending work, and decisions

## Project-Specific Instructions
- This is a full-stack real estate app for Algebra Enterprises with a public site and a private agent portal
- Frontend structure matters: `app/(public)/` contains the public website, while `app/agent/` contains login and dashboard routes
- The design system already uses inline styles plus `app/globals.css`; do not introduce Tailwind or a new styling system unless explicitly requested
- Keep existing brand tokens and typography consistent: dark navy base, gold accents, and the established heading/body font pairing
- `Property_Address` is a private Strapi field and must never be exposed through public property endpoints
- Assigned properties cannot be filtered reliably via `filters[users_permissions_user]`; use the existing user-side relation pattern and deduplicate by `documentId`
- Agent auth uses Strapi JWT stored in cookies on the frontend; preserve that flow unless the task is specifically about auth refactoring
- Agent property create and edit flows already support server-side image optimization, watermarking, and Cloudinary upload; preserve those behaviors when touching dashboard or upload code
- Custom authenticated property routes to be aware of: `GET /api/properties/my-properties`, `POST /api/properties/my-properties`, and `PUT /api/properties/my-properties/:documentId`
- When working on image rendering, support both Cloudinary URLs and local Strapi `/uploads/...` media paths

## Current Known Risks
- Frontend `package.json` currently uses `next@15.2.3`; treat framework version changes as high-risk and verify security implications before changing it
- `app/(public)/properties/page.js` currently initializes filters from `useSearchParams()` once and does not resync on same-route query-string navigation
- `components/PropertyCard.js` still uses raw `property.Images[0].url`; local Strapi `/uploads/...` paths must be normalized against `NEXT_PUBLIC_STRAPI_URL`
- `app/agent/dashboard/page.js` still updates enquiry status local state without checking `response.ok`
- `algebra-enterprises-backend/config/plugins.js` contains a Cloudinary IPv4-agent workaround required for successful uploads in this WSL/Node environment; preserve it unless replacing it with a verified alternative

## Build, Test, and Development Commands
- `cd algebra-enterprises-frontend && npm run dev`: run the frontend locally
- `cd algebra-enterprises-frontend && npm run build`: production build
- `cd algebra-enterprises-frontend && npm run lint`: run ESLint
- `cd algebra-enterprises-backend && npm run develop`: run Strapi with reload
- `cd algebra-enterprises-backend && npm run start`: run Strapi without reload
- `cd algebra-enterprises-backend && npm run build`: build Strapi admin

## Working Rules
- Never assume the current status without checking files
- Do not edit unrelated files
- Prefer minimal, reversible changes
- Explain major edits before making them
- After each meaningful task, update `docs/current-state.md` and `docs/todo.md`
- Update `docs/decisions.md` whenever a technical decision is made

## Coding Workflow
- Understand the existing structure before adding new code
- Reuse existing patterns where sensible
- Keep functions and components small and readable
- Add comments only when they improve clarity
- Run relevant checks after changes when possible
- Use JavaScript conventions already present in the repo: 2-space indentation, semicolons, `PascalCase` components, and `camelCase` helpers

## Safety Rules
- Never delete important files without explicit confirmation in project notes
- Never overwrite original source data or raw assets unless requested
- If a migration or refactor is needed, create a backup or parallel copy first
- If unsure, inspect first and propose the safest path

## Session Handoff
Before ending a session:
1. Update `docs/current-state.md` with completed work, work in progress, and blockers
2. Update `docs/todo.md` with next steps
3. Record important decisions in `docs/decisions.md`
4. Provide a short handoff summary

## Environment
- OS: WSL Ubuntu
- Editor: VS Code and terminal workflow
- Use Linux-compatible shell commands
- Prefer commands that are safe inside WSL

## Default Instruction
When resuming work, continue from the last unfinished item in `docs/todo.md`, use `docs/current-state.md` as the source of truth, and check the unresolved items in `Current Known Risks` before touching related files.
