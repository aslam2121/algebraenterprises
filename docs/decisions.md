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

### Keep the frontend on a Next 16 line
- The frontend was moved from `next@15.2.3` to `next@16.2.0`
- This keeps the app on a supported Next 16 line, aligns with `eslint-config-next@16.2.0`, and resolves the `npm audit` advisories affecting `next@16.1.6`

### Remove leftover root package metadata
- The workspace root `package.json` and `package-lock.json` only duplicated `js-cookie`, which is already declared in `algebra-enterprises-frontend/package.json`
- Those root package files were removed so Next no longer detects multiple lockfiles during frontend builds
- The root repository should continue to be managed as a git repo without a separate root npm package unless a real workspace-level dependency or script is introduced later

### Keep the default watermark text aligned with the documented brand
- The fallback watermark text in `algebra-enterprises-backend/src/api/property/utils/agent-property.js` should remain `ALGEBRA ENTERPRISES`
- `PROPERTY_IMAGE_WATERMARK` can still override that value per environment when an explicit custom watermark is needed
- An unrelated local change that switched the fallback to `info@algebraenterprises.com` was reverted because the docs and dashboard copy still describe the brand watermark, not an email watermark

### Normalize Strapi media URLs through one shared helper
- Local Strapi media can arrive as relative `/uploads/...` paths
- Frontend image rendering should resolve media URLs through `algebra-enterprises-frontend/lib/strapi.js` instead of passing raw values directly into `next/image` or gallery components

### Query-string navigation must drive property filters
- `/properties` filter state should resync when the route query string changes without a full remount
- Future edits to `app/(public)/properties/page.js` should preserve that behavior

### Enquiry status is confirmed only after API success
- Agent dashboard enquiry status should not update local state unless the backend `PUT /api/enquiries/:documentId` request succeeds

### WordPress property CSV imports should upsert by `Property_Code`
- The root `algebra_properties_data.csv` import was implemented as a backend one-off script at `algebra-enterprises-backend/scripts/import-wordpress-properties.js`
- The importer updates existing published property documents by `Property_Code` instead of creating a second copy of the dataset
- The importer also reads the root `algebra_Parking.csv` file, using `Property_Code` as the overlay key for `Parking`
- Imported properties should have their private `Property_Address` cleared to an empty string rather than filled with placeholder text
- Existing non-CSV fields such as images, assigned agent, description, price, and area values are preserved during import updates
- CSV listing type alias `For Rent, For Sale` is normalized to the schema value `For Rent and For Sale`
- Duplicate CSV rows for the same `Property_Code` are merged by taking later non-empty field values, which resolved the conflicting `ag1373` rows during this import
- Parking import values are normalized as follows before validation: blank and `no` become empty, `yes` becomes `1`, and numeric strings are kept as integers

### Bulk property assignment should use a neighborhood-driven dry-run script
- `algebra-enterprises-backend/scripts/bulk-assign-properties.js` assigns published properties to a selected agent by neighborhood through Strapi's document service
- The script requires either `--agent-id` or `--agent-email` plus one or more `--neighborhood` values
- `--apply` performs the updates; omitting it produces a dry-run preview
- `--only-unassigned` limits the selection to properties without an assigned agent

### Address and rent refreshes should use a dedicated CSV updater
- `algebra-enterprises-backend/scripts/import-address-rent.js` is the one-off path for syncing the root `algebra-address-rent.csv` file into Strapi by `Property_Code`
- The script updates only the private `Property_Address` field and `Price`, instead of widening the broader WordPress property importer
- CSV price normalization rules are:
  - `L` / `l` values stay in lakhs
  - `K` / `k` values are converted to lakhs by dividing by `100`
  - malformed repeated-decimal strings like `1..7L` are normalized before parsing
  - blank prices become `null`
- The trailing CSV summary row (`Total,,216,`) is ignored, and placeholder address values like `\` are treated as empty strings

### Backend property tooling should tolerate both neighborhood spellings
- `schema.json` currently exposes the field as `Neighbourhood`, while older scripts and stored data previously used `Neighborhood`
- The shared property helper and the WordPress importer now resolve either spelling so backend scripts keep loading after the schema spelling change
- Until the spelling is standardized end-to-end, future script work should continue to support both keys when reading or writing neighborhood values

### Per-property image uploads now allow up to 50 files
- The backend image validation limit and the agent dashboard client-side limit were both raised from `12` to `50`
- The 15MB-per-file cap, resize/optimization, and watermarking behavior remain unchanged
- Future upload testing should account for the heavier batch size because a 50-image submission puts much more load on Sharp processing and Cloudinary upload time than the old 12-image ceiling
