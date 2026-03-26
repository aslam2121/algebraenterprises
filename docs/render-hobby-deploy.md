# Render Hobby Deploy

This project should be deployed to Render as 3 services:

1. `algebra-enterprises-backend` as a Render Web Service
2. `algebra-enterprises-frontend` as a Render Web Service
3. a Render Postgres database

Media should continue to use Cloudflare R2. Do not deploy production on SQLite in Render because Render web-service filesystems are ephemeral.

## Recommended Hobby Setup

### Lowest-cost real setup
- Frontend: Free Web Service
- Backend: Paid lowest web service
- Database: Paid smallest Render Postgres
- Media: Cloudflare R2

### Temporary testing setup
- Frontend: Free Web Service
- Backend: Free Web Service
- Database: Free Render Postgres
- Media: Cloudflare R2

Use the temporary setup only for testing. Free web services spin down when idle, and free Render Postgres is not appropriate for a real production deployment.

## Service Order

Create services in this order:

1. Render Postgres
2. Backend web service
3. Frontend web service
4. Custom domains
5. Data import from local SQLite to Render Postgres

## Backend Service

### Render Settings
- Service type: `Web Service`
- Root directory: `algebra-enterprises-backend`
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Health check path: `/admin`

### Required Environment Variables

Copy values from `algebra-enterprises-backend/.env.render.example`.

Required:
- `NODE_ENV=production`
- `HOST=0.0.0.0`
- `APP_KEYS`
- `API_TOKEN_SALT`
- `ADMIN_JWT_SECRET`
- `TRANSFER_TOKEN_SALT`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `DATABASE_CLIENT=postgres`
- `DATABASE_URL`
- `DATABASE_SSL=false`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_REGION=auto`
- `R2_ENDPOINT`
- `R2_BUCKET`
- `R2_PUBLIC_URL`

Optional:
- `R2_ROOT_PATH`
- `CORS_ORIGINS`
- `FRONTEND_URL`
- `PROPERTY_IMAGE_WATERMARK`

### Notes
- This repo now includes the `pg` package explicitly so Strapi can use PostgreSQL on Render.
- Keep backend and Postgres in the same Render region.
- Use the internal Render Postgres URL for `DATABASE_URL`.
- Set backend CORS so the public frontend can read `/api/properties` directly from the browser:
  - `CORS_ORIGINS` should include at least `https://<your-frontend-service>.onrender.com`
  - if you add a custom frontend domain later, append it there too

## Frontend Service

### Render Settings
- Service type: `Web Service`
- Root directory: `algebra-enterprises-frontend`
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Health check path: `/`

### Required Environment Variables

Copy values from `algebra-enterprises-frontend/.env.render.example`.

Required:
- `NODE_ENV=production`
- `NEXT_PUBLIC_STRAPI_URL=https://<backend-service>.onrender.com`
- `R2_PUBLIC_URL=https://<public-media-host>`

Optional:
- `R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`

### Notes
- The frontend uses `NEXT_PUBLIC_STRAPI_URL` directly in public fetches, so the backend must be a public Render web service, not a private service.
- The frontend package now includes a Node engine declaration to reduce Render runtime guesswork.

## Manual Tasks After Deploy

These steps still need to be done manually:

1. Create a Strapi admin user in the deployed backend
2. Recreate or migrate agent users
3. Import or migrate local SQLite data into Render Postgres
4. Verify Cloudflare R2 uploads from:
   - Strapi admin property editor
   - agent dashboard create/edit
5. Verify frontend flows:
   - homepage
   - `/properties`
   - property detail pages
   - enquiry submit
   - agent login/dashboard
6. Add custom domains
7. Update:
   - `NEXT_PUBLIC_STRAPI_URL`
   - `R2_PUBLIC_URL`
   after final production domains are known

## Data Migration Options

### Option 1: Re-import content
Use the existing one-off import scripts if your source files are the source of truth:
- `node scripts/import-wordpress-properties.js`
- `node scripts/import-address-rent.js --apply`
- `python3 scripts/import-available-floors.py --apply`

This is the cleaner path if your latest CSV/XLSX sources are authoritative.

### Option 2: Export local SQLite data and restore into Postgres
Use Strapi export/import or database-level migration tooling if you need to preserve current local admin users, enquiries, and records exactly as they exist now.

This path needs more care and should be done after the empty Render backend boots successfully on Postgres.

## Pre-Go-Live Checklist

- Backend deploy succeeds on Render
- Frontend deploy succeeds on Render
- Frontend can reach backend over HTTPS
- R2 media loads from the final public host
- Strapi admin opens and login works
- Public property pages render correctly
- Agent login works
- Enquiry submission works
- Property image processing still works
- Render Postgres contains the expected data

## Do Not Do

- Do not use SQLite on Render for production
- Do not point `R2_PUBLIC_URL` at the raw upload API endpoint if you have a proper public media host
- Do not make the backend private while the frontend still uses `NEXT_PUBLIC_STRAPI_URL` in public browser requests
