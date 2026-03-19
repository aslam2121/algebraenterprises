# Decisions

## 2026-03-19

### Project memory files are the session source of truth
- `docs/current-state.md`, `docs/todo.md`, and `docs/decisions.md` were initialized as the persistent handoff layer for Codex sessions
- Future work should start from these files before editing code

### Preserve the existing frontend architecture
- Keep the current Next.js App Router split between `app/(public)/` and `app/agent/`
- Reuse the existing inline-style plus `globals.css` approach unless a task explicitly requires a styling-system change
- Preserve Strapi JWT cookie auth on the frontend unless the task is specifically about auth redesign

### Preserve backend data and relation constraints
- `Property_Address` remains private and should only be available through authenticated/custom flows
- Assigned properties should continue to be resolved from the user side and deduplicated by `documentId` because direct REST filtering on the relation is unreliable

### Cloudinary uploads require an environment-specific workaround
- In this WSL/Node environment, Cloudinary uploads timed out from Node even though curl connectivity worked
- The backend now uses a Cloudinary HTTPS agent with IPv4-only DNS lookup in `algebra-enterprises-backend/config/plugins.js`
- This workaround was verified with live `POST /api/properties/my-properties` and `PUT /api/properties/my-properties/:documentId` requests
- Do not remove or refactor this workaround without re-verifying live uploads

### Current merge gate
- The remaining review findings are considered unresolved and should be addressed before treating the current patch as ready to merge

### Use a single root git repository for the workspace
- The previous setup only tracked `algebra-enterprises-frontend/` as a repo, which left backend code and root memory files outside version control
- The workspace is being standardized to one root repo at `/home/aslam2121/projects/algebra_enterprises/web_app`
- The old frontend git metadata was backed up to `/tmp/algebra-enterprises-frontend.git-backup-20260319-125724` before removal
