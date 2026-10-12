# ThreadLabs Render deployment

## Status — 12 October 2026

The latest local application builds successfully. This version has **not been pushed or deployed**. Git cannot authenticate a push to `https://github.com/matetiakshith/ThreadLabs.git` (`could not read Username`). No private credentials have been printed or committed.

Chrome is signed into Render. Existing free services `threadlabs0` and `threadlabs-1` both use **`abhiii-bit/threadlabs`, branch `master`, commit `4c069fb90bec690a91ac403c77e0e87638be7577`**, a different repository. Their configuration was inspected without changing or deploying either service. Their URLs are not results of this task.

## Architecture and exact settings

Current architecture: React 19 / Vite 8 in `client/`, Express 4 in `server/`, entry point `server/server.js`, npm lockfiles in both directories. No Create React App or MySQL. Existing JSON data remains the development store. PostgreSQL now stores real production accounts, sessions, commissions and legacy catalogs/orders.

Use one **free Node Web Service** and a PostgreSQL database, as defined in root `render.yaml`. Express serves `client/dist`, `/api` and the SPA navigation fallback on one HTTPS origin. This preserves `/api`, keeps credentials on the server and avoids cross-site session cookies. No framework migration or visual redesign.

| Setting | Value |
| --- | --- |
| Repository | `https://github.com/matetiakshith/ThreadLabs.git` |
| Branch | `main`, after pushing the prepared source commit |
| Root Directory | **blank** — repository root |
| Runtime / version | Node `22.22.0` (`.node-version` and `NODE_VERSION`) |
| Instance / region | Free / Singapore |
| Build | `npm ci --prefix client --include=dev && npm run build --prefix client && npm ci --prefix server --omit=dev` |
| Start | `npm start --prefix server` |
| Health | `/api/health` |
| Frontend output | `client/dist`, served by Express |
| API base | `VITE_API_BASE=/api` |
| Host / port | `0.0.0.0` / Render-supplied `PORT` |
| Auto-deploy | Off — manually deploy and verify the selected commit |

Local development remains `npm run dev` in each directory. Vite proxies `/api` to `http://127.0.0.1:5001`. Development retains prototype sign-in and QA samples. Production uses server accounts and PostgreSQL commissions and excludes synthetic QA workshops/accounts/orders from the production client.

## Free hosting limits

The user requested free hosting. The Blueprint uses free Render PostgreSQL, not a paid disk. Free web-service files disappear on restart/redeploy/spin-down; real records are persisted in PostgreSQL. JSON files only seed the public catalog and empty production order store. Production never seeds checked-in QA orders.

**Free Render PostgreSQL expires after 30 days and has no managed backups.** Export/migrate before expiry and update `DATABASE_URL`. Only one free database is allowed per workspace. If one already exists, connect an appropriate existing database instead of selecting a paid plan. Free web services sleep on inactivity and share workspace usage limits. This is a free deployment candidate, not unlimited production hosting.

Sources: [Render free limits](https://render.com/docs/free), [Blueprint specification](https://render.com/docs/blueprint-spec), [Node version configuration](https://render.com/docs/node-version).

## Environment variables

Never upload `.env` files. `.env.example` files contain names only. Every `VITE_*` value is public.

| Variable | Production value / purpose |
| --- | --- |
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22.22.0` |
| `HOST` | `0.0.0.0` |
| `SERVE_FRONTEND` | `true` |
| `VITE_API_BASE` | `/api`, during frontend build |
| `DATABASE_URL` | Blueprint injects the database's internal PostgreSQL URL. Required for real accounts and durable orders/catalogs. External databases must use their provider's certificate-validated TLS URL; do not disable certificate verification. |
| `HF_TOKEN` | **Missing**. Add privately in Render Environment. Requires Hugging Face Inference Providers permission and usable provider billing/credits. Never use `VITE_HF_TOKEN`. |
| `HF_IMAGE_MODE` | `providers` |
| `HF_IMAGE_PROVIDER` / `HF_IMAGE_MODEL` | `fal-ai` / `Qwen/Qwen-Image` |
| `HF_IMAGE_EDIT_PROVIDER` / `HF_IMAGE_EDIT_MODEL` | `fal-ai` / `Qwen/Qwen-Image-Edit`; `none` explicitly disables reference conditioning |
| `LEGACY_API_TOKEN` | Render-generated server-only operator token protecting legacy order/catalog-write APIs. Never send to a browser. Current UI uses authenticated `/api/commissions`. |
| `DATA_DIR` | `/tmp/threadlabs-legacy-data`; initial seed only. Production writes use PostgreSQL. Never point into `client/public`. |
| `FRONTEND_ORIGINS` | Optional exact HTTPS custom-domain origins. The service's `RENDER_EXTERNAL_URL` origin is added automatically. Exclude localhost in production. |
| `PORT`, `RENDER`, `RENDER_EXTERNAL_URL`, `RENDER_GIT_COMMIT` | Supplied automatically by Render |

`OPENAI_API_KEY` and `GEMINI_API_KEY` are retained example names for older integrations; current image generation does not use them. Requirement extraction is local rule-based parsing. Dedicated image mode requires `HF_IMAGE_ENDPOINT` and explicitly declared capabilities as documented in `server/.env.example`; the LoKR adapter repository alone is not a hosted generator.

## Accounts and privacy

Production customers register through the existing sign-in page. Passwords require 12–128 characters and use salted scrypt hashes. Session cookies are HttpOnly, Secure in production, SameSite=Lax, expire after seven days and are revoked on logout. Only hashed tokens are stored. Sign-in/registration are rate limited. Browser-origin checks cover account and commission writes.

Artisan identities are assigned by the operator. Public registration cannot claim a trusted artisan profile. To provision an artisan, obtain the database's external URL privately, permit your administration IP where supported, put the URL in ignored `server/.env`, and run:

```sh
cd server
node scripts/create-artisan-account.js WORKSHOP_USERNAME art-001
```

The command prompts for a hidden password and validates the profile against the current directory. Never put passwords in command arguments or screenshots. Never provision QA accounts in production. Password-reset and email-verification flows are not implemented; artisan provisioning is manual.

Commissions are scoped to the authenticated customer or assigned artisan. Clients cannot choose an account owner. Only the assigned artisan can advance production, one stage at a time; duplicate/skipped/terminal-decline updates are rejected atomically. Measurement validation shares the panel's canonical centimeter ranges. Production commission snapshots stay in React memory, not localStorage. Unsaved drafts use tab-scoped sessionStorage and reset at sign-in/sign-out.

Customer references are sent inline to the configured provider only for generation. PNG/JPEG/WebP validation limits input to 4 MB and 20 megapixels. The server limits total bodies to 10 MB, two concurrent generations and five requests per client IP per minute, with a two-minute timeout and disconnect cancellation. Body measurements and customer identifiers are excluded from image-provider payloads. Prompts/images/credentials are not logged. Images return as private data URLs with `Cache-Control: no-store`; no public customer upload directory or bucket is introduced.

## Endpoint inventory

| Method | Endpoint | Access / purpose |
| --- | --- | --- |
| GET | `/api/health` | Public health, account readiness and deployed revision |
| GET | `/api/artisans`, `/api/artisans/:id`, `/api/heritage-crafts` | Public discovery/catalog |
| POST | `/api/artisans/:id/catalog` | Legacy operator-only catalog write |
| POST | `/api/ai/parse-requirements`, `/api/ai/match-artisans` | Validated requirements/matching |
| GET | `/api/ai/image-capabilities` | Public status, no credentials |
| POST | `/api/ai/generate-image` | Authenticated in production; real provider errors |
| POST | `/api/auth/register` | Customer registration only |
| POST | `/api/auth/login`, `/api/auth/logout` | Sign-in/session revocation |
| GET | `/api/auth/me` | Authenticated identity |
| GET, POST | `/api/commissions` | Owner-scoped list/create |
| PATCH | `/api/commissions/:id/status` | Assigned-artisan stage transition |
| GET, POST | `/api/orders` | Legacy operator-only order contract |
| GET | `/api/orders/:id` | Legacy operator-only detail |
| PATCH | `/api/orders/:id/status` | Legacy operator-only update |
| POST | `/api/orders/:id/messages` | Legacy operator-only messages |

External services: Hugging Face/fal-ai, Google Fonts, Unsplash, browser SpeechRecognition. India boundary data is bundled locally. Reference/sketch processing and Three.js/motion run in the browser.

## Remaining account/deployment steps

1. Authenticate Git using an account with write access to `matetiakshith/ThreadLabs`. `git push --dry-run origin main` must succeed. Do not repoint the remote merely because another repository is connected to Render.
2. Push the prepared local commit to the authorized branch without force-pushing. If using another branch, update/select that branch in the Blueprint.
3. In Render choose **New → Blueprint**, connect `matetiakshith/ThreadLabs`, select the pushed branch and root `render.yaml`. Review both plans are **Free** and resource names are new. Do not repoint either existing service without explicit user instruction.
4. Add `HF_TOKEN` privately. Without a token/credits the site can serve, but real image generation remains unavailable and unverified.
5. Apply the Blueprint and inspect logs. Confirm the database exists, `DATABASE_URL` is injected and `/api/health` reports `accountsReady: true` and the pushed SHA in `revision`.
6. Provision production artisan accounts; test customer registration/sign-in with user-controlled credentials.
7. Verify the actual assigned public Render URL serving the intended SHA. A candidate service name or existing URL is not success.
8. Run the live checklist below and export/migrate the database before its 30-day expiry.

## Validation and pre-existing limitations

Clean dependency installation and the Vite build pass, including on Node 22.22.0. Frontend tests cover measurements, motion lifecycle/reduced motion, India geometry and garment briefs. Backend tests cover image errors/security and added HTTP/PostgreSQL authorization, ownership, sequential stages, revocation, durable catalog updates, origin rejection, QA seed exclusion, SPA navigation and API/static-file 404s. SQL tests use a real embedded PostgreSQL engine via **test-only** PGlite; they do not verify a deployed Render database.

Local browser QA uses an ignored isolated test harness, never production identities. Customer sign-in, measurements, no-token design board, India map, commission creation, artisan acceptance/stage update and customer tracking of that server update are exercised. Mobile layout is checked at 390×844; default desktop is also checked. The real production server separately serves static assets, health and nested routes without database/provider credentials. Large Three.js bundle warnings and existing lint warnings remain visible.

**Live testing is unperformed because no requested-source deployment exists.** After deployment verify homepage/navigation, Anime.js scroll effects, Motion interactions, 3D gallery/fabric, measurements, board, a real provider request, artisan workspace, map, light/dark modes, nested-route refresh and browser console/network errors on desktop/mobile.

The current App tree does not expose older virtual try-on / tech-pack download components; those source files remain preserved. The visible cloth scene is a generic fabric study. Workshop chat and delivery map remain explicitly illustrative prototype features. Nearby QA workshops remain development-only; production needs real nearby data. Catalog verification/distance/phone metadata comes from supplied profiles, not newly verified marketplace/live location data. No real image-generation success, live GPS, real chat or virtual try-on verification is claimed.
