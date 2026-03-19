# CLAUDE.md — Algebra Enterprises Real Estate Web App
## Context File for Claude Code CLI

This file gives Claude Code full context about this project so it can assist effectively without needing re-explanation.

---

## Project Summary

Full-stack real estate web app for **Algebra Enterprises**, Delhi. Replaces an existing WordPress site. Shows 265+ premium rental/sale properties across Delhi. Has a public website, and a private agent portal.

**Status:** In active development. Core features built. Not yet deployed.

---

## Tech Stack

| Layer | Technology | Version | Location |
|---|---|---|---|
| Backend CMS | Strapi | v5.39.0 | `algebra-enterprises-backend/` |
| Frontend | Next.js | 15.2.3 | `algebra-enterprises-frontend/` |
| Database | SQLite (dev) | — | `backend/.tmp/data.db` |
| Image Storage | Cloudinary | — | Connected via plugin |
| Auth | Strapi JWT | — | `js-cookie` on frontend |
| CSS | Inline styles + `<style>` tags | — | No Tailwind used |
| Fonts | Playfair Display + DM Sans | — | Google Fonts in globals.css |

---

## Running the Project

```bash
# Terminal 1 — Backend
cd algebra-enterprises-backend
npm run develop
# Strapi admin: http://localhost:1337/admin
# API:          http://localhost:1337/api

# Terminal 2 — Frontend
cd algebra-enterprises-frontend
npm run dev
# Website:        http://localhost:3000
# Agent login:    http://localhost:3000/agent/login
# Agent dashboard:http://localhost:3000/agent/dashboard
```

---

## Frontend File Structure

```
algebra-enterprises-frontend/
├── app/
│   ├── layout.js                      ← Root layout (no Navbar, imports globals.css)
│   ├── globals.css                    ← Design tokens, fonts, animations
│   ├── (public)/
│   │   ├── layout.js                  ← Public layout WITH Navbar + lightbox CSS
│   │   ├── page.js                    ← Homepage
│   │   └── properties/
│   │       ├── page.js                ← Listings page with filters + pagination
│   │       └── [code]/
│   │           └── page.js            ← Property detail + gallery + enquiry form
│   └── agent/
│       ├── login/
│       │   └── page.js                ← JWT login page
│       └── dashboard/
│           └── page.js                ← Agent dashboard
├── components/
│   ├── Navbar.js                      ← Sticky nav, transparent→solid on scroll
│   ├── Hero.js                        ← Homepage hero with search bar
│   ├── PropertyCard.js                ← Property grid card component
│   └── HomeClientParts.js             ← Client-side interactive bits for homepage
├── lib/
│   └── strapi.js                      ← Strapi API helper functions
└── .env.local
    NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

---

## Backend File Structure

```
algebra-enterprises-backend/
├── src/
│   └── api/
│       └── property/
│           ├── controllers/
│           │   └── property.js        ← Custom findMyProperties (returns private Address)
│           ├── routes/
│           │   ├── property.js        ← Default CRUD routes
│           │   └── agent-property.js  ← GET /api/properties/my-properties
│           └── content-types/
│               └── property/
│                   └── schema.json    ← Property schema definition
├── config/
│   ├── plugins.js                     ← Cloudinary upload provider config
│   └── middlewares.js                 ← Security/CSP middleware (allows Cloudinary)
└── .env
    CLOUDINARY_NAME=...
    CLOUDINARY_KEY=...
    CLOUDINARY_SECRET=...
```

---

## Design System

```css
/* Colors */
--navy:       #0a1628   /* page background */
--navy-light: #112240   /* card background */
--navy-mid:   #1a3a5c   /* hover states */
--red:        #c0392b   /* primary CTA */
--red-light:  #e74c3c   /* hover red */
--gold:       #c9a84c   /* accents, labels */
--muted:      #8a9bb5   /* secondary text */

/* Fonts */
Playfair Display → all h1/h2/h3/h4
DM Sans         → all body text, inputs, buttons

/* Breakpoint */
860px → mobile layout (single column)
```

---

## Strapi Collections

### Property
Key fields (see schema.json for full list):
- `Title` — string
- `Property_Code` — uid (unique, used in URLs)
- `Neighborhood` — multi-select custom field (max 1)
- `Listing_Type` — enum: For Rent / For Sale / For Rent and For Sale
- `Property_Status` — enum: Live / Rented Out / Sold
- `Price` — decimal (in Lakhs)
- `Bedrooms`, `Bathrooms`, `Area_Sqm` — integers/decimals
- `Property_Type` — enum: Apartment / Entire Building / Independent House / Duplex / Service Apartment / Farm House
- `Description` — blocks (rich text)
- `Images` — media multiple (Cloudinary)
- `Featured_Property` — boolean
- `Features` — multi-select custom field
- `Property_Address` — string, **PRIVATE FIELD** (never in public API)
- `users_permissions_user` — relation manyToOne to User (the assigned agent)
  - ⚠️ Display name is "Assigned_Agent" but API key is `users_permissions_user`
  - ⚠️ Cannot filter by this field via REST API — must query from User side

### Enquiry
- `Name`, `Phone`, `Email`, `Message` — string fields
- `Property_Code`, `Property_Title` — string
- `Client_Status` — enum: New / Contacted / Closed

---

## Critical Technical Issues & Solutions

### 1. Agent-Property Relation
**Problem:** Cannot filter properties by assigned agent using `filters[users_permissions_user]` — always returns 400.

**Working solution:** Query from the USER side instead:
```javascript
GET /api/users/me?populate=properties
// Returns agent's profile with array of assigned properties
```
Then deduplicate by `documentId` (Strapi v5 returns duplicates).

### 2. Private Fields
**Problem:** `Property_Address` is marked private in Strapi — never appears in any API response.

**Solution:** Custom controller `findMyProperties` uses `strapi.db.query()` which bypasses privacy filters:
```javascript
// In controller — strapi.db.query bypasses private field restriction
const properties = await strapi.db.query('api::property.property').findMany({
  where: { id: { $in: uniqueIds } },
  populate: { Images: true },
  // No select array = ALL fields including private Property_Address
});
```

### 3. Strapi v5 Duplicate DocumentIds
**Problem:** `me.properties` returns same property twice (different `id`, same `documentId`).

**Solution:** Always deduplicate:
```javascript
const seen = new Set();
const unique = allProps.filter(p => {
  if (seen.has(p.documentId)) return false;
  seen.add(p.documentId);
  return true;
});
```

### 4. Server vs Client Components
**Problem:** Next.js App Router — event handlers (`onMouseEnter` etc.) cannot be in Server Components.

**Solution:** Any component with event handlers must have `'use client'` at top. Interactive bits extracted into separate client components (see `HomeClientParts.js`).

### 5. CSS in Next.js
**Problem:** Cannot import CSS from node_modules inside `'use client'` page files.

**Solution:** Import all external CSS in the layout file:
```javascript
// app/(public)/layout.js
import '../globals.css';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
```

### 6. Route Groups
The app uses a `(public)` route group:
- `app/(public)/layout.js` → has Navbar, imports `../globals.css` (note `../`)
- `app/layout.js` → root layout, imports `./globals.css`
- `app/agent/` → outside (public) group, no Navbar

---

## API Endpoints Reference

### Public (no auth)
```
GET /api/properties?filters[Property_Status][$eq]=Live&populate=Images
GET /api/properties?filters[Listing_Type][$eq]=For Rent
GET /api/properties?filters[Neighborhood][$eq]=Vasant Vihar
GET /api/properties?filters[Property_Code][$eq]=ag1753&populate=Images
GET /api/properties?filters[Featured_Property][$eq]=true&populate=Images
POST /api/enquiries   body: { data: { Name, Phone, Email, Message, Property_Code, Property_Title, Client_Status: 'New' } }
POST /api/auth/local  body: { identifier, password }
```

### Authenticated (JWT required)
```
GET  /api/users/me
GET  /api/users/me?populate=properties
GET  /api/properties/my-properties          ← custom endpoint, returns Property_Address
POST /api/properties/my-properties          ← custom endpoint, creates assigned property + watermarked images
PUT  /api/properties/my-properties/:documentId ← custom endpoint, updates assigned property safely
PUT  /api/properties/:documentId            body: { data: { Property_Status } }
PUT  /api/enquiries/:documentId             body: { data: { Client_Status } }
GET  /api/enquiries?sort=createdAt:desc
```

---

## Agent Authentication Flow

```
1. Agent POSTs to /api/auth/local with email + password
2. Strapi returns { jwt, user }
3. JWT stored in cookie: Cookies.set('agent_token', jwt, { expires: 7 })
4. User stored in cookie: Cookies.set('agent_user', JSON.stringify(user), { expires: 7 })
5. Dashboard reads token → fetches /api/users/me for fresh data
6. All authenticated requests: headers: { Authorization: `Bearer ${token}` }
```

---

## Packages Installed

### Frontend (`algebra-enterprises-frontend/`)
```json
{
  "next": "15.2.3",
  "react": "^19",
  "react-dom": "^19",
  "axios": "^1.x",
  "js-cookie": "^3.x",
  "yet-another-react-lightbox": "^3.x"
}
```

### Backend (`algebra-enterprises-backend/`)
```json
{
  "@strapi/strapi": "5.39.0",
  "@strapi/provider-upload-cloudinary": "^5.x",
  "sharp": "^0.33.x"
}
```

---

## What's Done ✅

- Strapi backend with all collections and fields
- 265 properties imported via CSV script
- Cloudinary connected for image storage
- Public API permissions configured
- Homepage (hero, featured properties, areas strip, footer)
- Properties listing page (filters, pagination, search)
- Property detail page (gallery, lightbox, enquiry form)
- Fullscreen image lightbox (yet-another-react-lightbox)
- Agent login page (JWT auth)
- Agent dashboard (properties + enquiries tabs, status toggles, add-property flow)
- Agent dashboard edit flow for assigned properties
- Private Property_Address field (secure, only visible to agents)
- Custom Strapi endpoint for agent's properties
- Server-side image resize + optimize + watermark pipeline for agent uploads
- Agent create-property flow tested end to end against local Strapi + Cloudinary

---

## What's Next 🔲

Priority order:
1. **Deploy Strapi to Railway** (switch SQLite → PostgreSQL)
2. **Deploy Next.js to Vercel**
3. **Connect custom domain**
4. **Contact page** (`app/(public)/contact/page.js`)
5. **About page** (`app/(public)/about/page.js`)
6. **Email notifications** on new enquiry (Strapi email plugin)
7. **Re-upload old images** to Cloudinary (pre-Cloudinary images are local)

Future features:
- Video support on property detail
- Google Maps embed
- WhatsApp floating chat widget
- Price range / beds / baths filters
- Similar properties section
- SEO (meta tags, sitemap)
- Arabic language support

---

## Things to NEVER Do

```bash
npm audit fix --force   # breaks Next.js — always broke things in this project
```

- Never commit `.env` or `.env.local` files
- Never use `strapi.entityService` for private fields (use `strapi.db.query`)
- Never put CSS imports from node_modules inside 'use client' files
- Never filter properties by `users_permissions_user` via REST API (always 400)

---

## Deployment Plan (When Ready)

```
Backend:
1. Create PostgreSQL on Railway
2. Update .env with DATABASE_URL
3. Push to Railway via GitHub

Frontend:
1. Push to GitHub
2. Connect to Vercel
3. Set NEXT_PUBLIC_STRAPI_URL = Railway URL
4. Deploy

Domain:
1. Add domain in Vercel dashboard
2. Update DNS records
3. HTTPS auto-configured
```

---

## Latest Checkpoint

As of **March 18, 2026**, the most recent completed work was on the agent dashboard and media pipeline:

- `POST /api/properties/my-properties` now works for authenticated agents.
- Uploaded agent images are processed server-side with `sharp` before upload:
  - auto-rotate from EXIF
  - resize to max `2400x2400`
  - compress output
  - apply bottom-right `ALGEBRA ENTERPRISES` watermark
- Upload validation is enforced before processing:
  - max `12` images
  - max `15MB` per image
  - images only
- Dashboard add-property form now includes:
  - client-side file validation
  - image previews
  - size labels
  - reset after successful publish

Important bugs fixed during live testing:

1. Custom route auth scope:
   - `POST /api/properties/my-properties` was returning `403`
   - fixed by mapping the route auth scope to `api::property.property.create`

2. Upload media foreign key:
   - Cloudinary upload succeeded, but Strapi file insert failed with `FOREIGN KEY constraint failed`
   - cause: upload service was being passed the agent user, but upload media audit fields point to `admin_users`
   - fix: do not pass the authenticated agent user into the upload service call

Live local verification completed:

- frontend dev server running on `http://localhost:3000`
- backend dev server running on `http://localhost:1337`
- agent registration/login tested successfully
- custom create-property route tested successfully
- created property appears back in `GET /api/properties/my-properties`
- uploaded Cloudinary image confirmed at `2400x1569`

Temporary local test account created:

- email: `agenttest@example.com`
- password: `TestAgent123!`

Temporary test properties created during debugging:

- `control-test-20260318` (default route control test)
- `agent-test-20260318-b` (successful agent custom-route test)

Additional completed work after that checkpoint:

- `PUT /api/properties/my-properties/:documentId` added for safe agent-side editing
- dashboard now supports **Edit Property** on assigned listings
- edit form reuses the create form
- existing gallery is preserved when no new files are uploaded
- uploading new files during edit replaces the gallery after watermark/optimization processing
- live local edit test passed for property `agent-test-20260318-b`

Next immediate task:

- optional cleanup of temporary test records and test account

---

*Last updated: March 18, 2026*
*Project started: March 15, 2026*
