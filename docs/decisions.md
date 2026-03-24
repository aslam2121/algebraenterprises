# Decisions

## 2026-03-19

### Project memory files are the session source of truth
- `docs/current-state.md`, `docs/todo.md`, and `docs/decisions.md` were initialized as the persistent handoff layer for Codex sessions
- Future work should start from these files before editing code
- When Codex makes repo changes requested by the user, those changes should be committed before handoff unless the user explicitly says not to commit

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

### Uploaded property images should be renamed from the property code
- The backend image processor now derives output filenames from `Property_Code` instead of the original local file names
- Both create and edit property flows pass the normalized property code into the processor, so generated names follow a stable `property-code-N` pattern before upload

### Cloudinary uploads should retry one processed image at a time
- The previous upload path retried a single large multi-file request, which still left bigger image batches exposed to connection resets like `read ECONNRESET`
- The backend now uploads processed property images one at a time with retries per file, and it removes already-uploaded partial files if a later upload still fails
- Retry detection now also checks error messages, not just nested error codes, so Cloudinary failures that only surface as message text still follow the retry path

### Missing neighbourhood values should be backfilled from property titles
- `algebra-enterprises-backend/scripts/backfill-neighbourhood-from-title.js` is the one-off path for filling blank `Neighbourhood` values from the title prefix before the `(property-code)` suffix
- The script updates only rows where neighbourhood is blank and leaves existing neighbourhood values untouched
- It first tries an exact title-to-schema match, then normalized matching, then explicit aliases for schema spelling drift
- Current explicit alias handling includes:
  - `Panchsheel Enclave` title -> `Pansheel Enclave` schema value
  - normalized cases like `G.K 2` -> `G.K-2`, `SafdarJung Enclave` -> `Safdarjung Enclave`, and `GulMohar Park` -> `Gulmohar Park`

### Frontend neighbourhood reads should normalize both spellings
- Live Strapi property payloads now expose `Neighbourhood`, while older frontend code paths still expected `Neighborhood`
- Frontend rendering and filter code should use the shared normalizer in `algebra-enterprises-frontend/lib/strapi.js` so UI components stay tolerant of both spellings
- Public property filtering should target the live REST filter key `Neighbourhood`

### Strapi neighbourhood values must be stored as JSON arrays
- The `Neighbourhood` field is a JSON custom field backed by the multi-select plugin, so Strapi admin expects array-shaped values even when `max: 1`
- Older scripts had been writing plain strings like `Vasant Vihar`, which the frontend could normalize but the Strapi admin UI rendered as empty
- Backend property writes now store neighbourhood as a one-item array, and `algebra-enterprises-backend/scripts/normalize-neighbourhood-json.js` is the one-off repair path for converting legacy string values to valid JSON arrays

### Available_Floors workbook imports should use a dedicated Python updater
- `algebra-enterprises-backend/scripts/import-available-floors.py` is the one-off path for syncing the root `properties_available_floors.xlsx` workbook into Strapi by `Property_Code`
- The workbook is read directly with Python standard-library XLSX parsing so the importer does not need a new npm dependency just to handle a simple two-column spreadsheet
- The updater writes `Available_Floors` to both draft and published rows for the matching `document_id`, keeping Strapi admin and published data aligned
- Duplicate workbook rows for the same `Property_Code` are merged by taking the later non-empty `Available_Floors` value

### Frontend neighbourhood filters must use `$contains` against `Neighbourhood`
- The Strapi `Neighbourhood` field is stored as a JSON array because it is backed by the multi-select plugin, even though `max: 1`
- Direct REST filtering with `filters[Neighbourhood][$eq]=...` returns zero rows against that stored shape
- Public frontend filter builders should use `filters[Neighbourhood][$contains]=...` so the `/properties` area filter continues to work

### Cloudflare R2 should be wired through Strapi's official `aws-s3` provider
- The backend upload provider is being migrated from Cloudinary to Cloudflare R2 through `@strapi/provider-upload-aws-s3` to keep the change inside Strapi's supported provider path instead of adding a custom upload layer
- R2 config should use the account-scoped `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_REGION=auto`, with optional `R2_PUBLIC_URL` / `R2_ROOT_PATH` for saved asset URLs
- `R2_ACL` should be allowed to stay blank so the provider does not send ACL headers unless explicitly requested, which is safer for R2 compatibility
- Frontend and backend host allowlists should keep legacy Cloudinary hosts during the transition so older stored media URLs continue to render while new uploads go to R2

### R2 secrets must stay backend-only
- Real Cloudflare R2 access keys should only live in ignored backend env files such as `algebra-enterprises-backend/.env`
- Frontend env files may only receive the non-secret public delivery host or endpoint needed for `next/image` host allowlisting
- If credentials are ever pasted into chat or otherwise exposed during setup, they should be rotated before production use

### The raw R2 S3 endpoint should not be treated as the final public asset URL
- Uploading to Cloudflare R2 through the Strapi S3 provider works with the account-scoped `R2_ENDPOINT`, but the resulting raw `*.r2.cloudflarestorage.com/<bucket>/<key>` URL returned `400 Bad Request` in live checks
- Keep `R2_ENDPOINT` for backend upload API access, but set a real public delivery host in `R2_PUBLIC_URL` for production-facing image URLs
- Frontend image allowlisting and backend CSP should continue to derive from the public delivery host once that domain is chosen

### Switching the R2 public host requires rewriting older file URLs
- Once a working public host is added in `R2_PUBLIC_URL`, new uploads can use that base URL, but older `files.url` values already saved in Strapi still keep their previous host
- The same applies to responsive image URLs nested inside the `files.formats` JSON column
- In this project, the existing `aws-s3` file rows were rewritten from the raw upload endpoint to the working `r2.dev` public bucket host after `R2_PUBLIC_URL` was added

### Backend R2 env changes only affect new uploads after a Strapi restart
- Updating `.env` with a working `R2_PUBLIC_URL` is not enough by itself if the backend process is already running
- In this project, `ag1225` images uploaded before the backend restart still saved raw `cloudflarestorage.com` URLs even though the env file had been updated
- After restarting Strapi, new uploads immediately saved `url` and `formats.*.url` values on the public `r2.dev` host

### Strapi admin property-image uploads should reuse the shared property processor
- Watermarking, the 2400px resize/optimization step, and property-code-based renaming already lived in `processPropertyImages()` for the custom agent routes
- The upload plugin is now wrapped during app bootstrap so uploads linked directly to `ref=api::property.property` and `field=Images` are preprocessed through that same helper before Strapi stores them
- This keeps the Strapi admin property edit flow aligned with the agent flow for existing-property uploads, without changing unrelated uploads in the general Media Library
- Strapi 5 admin uploads can arrive through both `admin-upload.uploadFiles` and `admin-upload.unstable_uploadFilesStream`, so both handlers must stay wrapped or property uploads from the editor can bypass processing

### Concurrent admin uploads need a hardened R2 HTTP transport
- The default S3 client transport produced intermittent `ssl3_read_bytes:sslv3 alert bad record mac` failures during larger concurrent Strapi admin upload batches
- The backend now configures the R2 S3 client with an explicit AWS SDK `NodeHttpHandler`, IPv4 DNS lookup, no keep-alive socket reuse, bounded socket concurrency, and explicit timeouts
- This transport hardening cleared a 22-file concurrent upload stress run against Strapi's upload service without changing any property or media-model behavior

### Large Strapi admin upload batches should favor serialized R2 sockets over aggressive concurrency
- A later end-to-end check of the Strapi admin-style upload-and-attach flow showed that the remaining failure was still transport queueing, not the property `Images` relation itself
- The R2 S3 client is now tuned more conservatively in `algebra-enterprises-backend/config/plugins.js` with `maxSockets=1`, `maxAttempts=8`, `connectionTimeout=120000`, and `requestTimeout=600000`
- This slower but safer profile cleared a real out-of-sandbox 22-file upload-and-attach test where all uploaded media IDs were successfully assigned to the temporary property
- Keep this conservative transport profile unless a future production/staging verification proves a faster setting is equally stable

### Production traffic must use HTTPS-only public hosts
- Local `http://localhost` hosts are allowed only for development and verification inside this workspace
- Production app traffic should use an HTTPS `NEXT_PUBLIC_STRAPI_URL`
- Production media traffic should use an HTTPS `R2_PUBLIC_URL` backed by the real public/custom delivery domain, not the raw R2 upload API endpoint
- Any final production rollout should include one explicit verification pass that no user-facing asset or API URL falls back to plain HTTP
