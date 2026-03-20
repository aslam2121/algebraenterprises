# TODO

## Highest Priority
- Remove the four deleted mismatch rows from the source WordPress CSV if future full imports should stay aligned:
  - `ag1373` / `Dera Mandi (ag1374)`
  - `ag1636` / `SafdarJung Enclave (ag1635)`
  - `ag824` / `Jor Bagh (ag827)`
  - `ag1049` / `Sundar Nagar (ag1049-1)`
- Remove the three deleted property codes from `algebra-address-rent.csv` if future address/rent refreshes should stay clean:
  - `ag1373`
  - `ag1049`
  - `ag824`
- Use `node scripts/bulk-assign-properties.js` in `algebra-enterprises-backend` when you want to assign neighborhoods to an agent:
  - dry-run first, then rerun with `--apply`
  - target agent by `--agent-id` or `--agent-email`
  - pass one or more `--neighborhood` values
  - if you need to avoid reassigning existing agent-owned properties, include `--only-unassigned`
  - already applied in this session for Umar on `Anand Niketan`, `Vasant Vihar`, `Shanti Niketan`, and `Westend`, for Azhar on `Defence Colony`, `Hauz Khas`, `Panchsheel Park`, `Safdarjung Enclave`, and `SDA`, and for Nazish on the requested 17-neighborhood set
- Decide whether to keep `agent-dashboard-worklog.md` as a rolling log or fold its key points into `docs/current-state.md`
- Confirm the new root repo commit was created successfully and use it as the base for future changes

## Validation
- Re-run `npm run lint` and `npm run build` in `algebra-enterprises-frontend` after any further frontend edits
- Re-run `node scripts/import-wordpress-properties.js` in `algebra-enterprises-backend` as a dry-run before any future CSV apply pass
- Re-run `node scripts/import-address-rent.js` in `algebra-enterprises-backend` as a dry-run before any future address/rent apply pass
- Re-run `node scripts/bulk-assign-properties.js ...` without `--apply` before any future bulk assignment
- Re-verify the agent image upload flow if you decide to test near the new 50-image ceiling, because the processing path now allows substantially larger batches
- If `algebra_Parking.csv` changes again, rerun the same importer because it now reads the parking overlay automatically
- If `algebra-address-rent.csv` changes again, rerun `node scripts/import-address-rent.js --apply` because it now owns the private-address and rent refresh path
- Browser verification completed for:
  - `/properties?type=rent` to `/properties?type=sale` navigation on the same page
  - property detail pages with both Cloudinary and local Strapi media
  - a public property card with a local `/uploads/...` image (`ag1753`) in the rent listings
  - agent enquiry status failure handling
  - agent property edit with replacement image upload still working after frontend fixes

## Cleanup / Follow-Up
- Keep `docs/current-state.md`, `docs/todo.md`, and `docs/decisions.md` updated after each meaningful task
