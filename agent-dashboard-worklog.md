# Agent Dashboard Worklog

## March 18, 2026

### Completed

- Verified the local stack runs with:
  - frontend at `http://localhost:3000`
  - backend at `http://localhost:1337`
- Confirmed agent auth works through `POST /api/auth/local`
- Confirmed `GET /api/properties/my-properties` returns assigned properties with private `Property_Address`
- Finished the agent create-property path with server-side image processing
- Added server-side image rules:
  - max `12` images
  - max `15MB` per image
  - image MIME types only
- Added dashboard-side image preview and validation UX

### Bugs Fixed

1. Custom route permission mismatch

- Symptom: `POST /api/properties/my-properties` returned `403 Forbidden`
- Cause: Strapi gave the route a custom scope based on the handler name
- Fix: explicitly set route auth scope to `api::property.property.create`

2. Upload file insert failed after Cloudinary success

- Symptom: upload reached Cloudinary, then Strapi returned `FOREIGN KEY constraint failed`
- Cause: upload plugin tried to write `created_by_id` / `updated_by_id` using the authenticated agent user, but media audit relations point to `admin_users`
- Fix: call upload service without passing the agent user object

### Evidence From Live Testing

- Successful agent property create response:
  - status `201`
  - property code: `agent-test-20260318-b`
- Successful follow-up list response:
  - new property appears in `GET /api/properties/my-properties`
- Uploaded image stored on Cloudinary:
  - optimized from `2600x1700` to `2400x1569`
  - watermark area showed measurable pixel difference from the flat-color source test image

### Current Focus

Editing support was completed after the initial create/upload verification:

- added `PUT /api/properties/my-properties/:documentId`
- restricted updates to properties assigned to the authenticated agent
- reused the dashboard property form for edit mode
- added an `Edit` action in the property list
- preserved the current gallery when no replacement files were uploaded
- confirmed live update success on property `agent-test-20260318-b`

### Latest Verified State

- create flow: working
- edit flow: working
- image optimization + watermark on create: working
- image preservation on edit with no new uploads: working

### Next Work Candidates

- optional image replacement test through the edit route from the UI itself
- cleanup of temporary debug records:
  - `control-test-20260318`
  - `agent-test-20260318-b`
  - `agenttest@example.com`
