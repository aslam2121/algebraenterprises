# TODO

## Highest Priority
- Fix the frontend Next.js version issue flagged in review; verify the target version is not a vulnerable downgrade before changing `algebra-enterprises-frontend/package.json`
- Update `algebra-enterprises-frontend/app/(public)/properties/page.js` so filter state resyncs when `/properties` query params change without a remount
- Update image rendering helpers/components to prefix local Strapi `/uploads/...` URLs with `NEXT_PUBLIC_STRAPI_URL`
- Update `algebra-enterprises-frontend/app/agent/dashboard/page.js` so enquiry status only updates after a successful API response

## Validation
- Run `npm run lint` in `algebra-enterprises-frontend`
- Manually verify:
  - `/properties?type=rent` to `/properties?type=sale` navigation on the same page
  - property cards and detail pages with both Cloudinary and local Strapi media
  - agent enquiry status failure handling
  - agent property create/edit with image upload still working after frontend fixes

## Cleanup / Follow-Up
- Remove temporary verification property `agent-fix-20260319` if it is no longer needed
- Decide whether to keep `agent-dashboard-worklog.md` as a rolling log or fold its key points into `docs/current-state.md`
- Keep `docs/current-state.md`, `docs/todo.md`, and `docs/decisions.md` updated after each meaningful task
- Confirm the new root repo commit was created successfully and use it as the base for future changes
