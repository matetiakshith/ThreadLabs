# ThreadLabs Phase 2 and The Beatle

Implemented without replacing the existing page designs, customer accounts, image provider, motion infrastructure or Render services.

## Accounts and portfolios

Artisan public signup uses the existing PostgreSQL account table, scrypt password hashing and hashed seven-day HttpOnly sessions. Every signup receives a new artisan ID and cannot claim an existing workshop. The existing architecture has one role per account; that remains unchanged. Login role and resource ownership are checked on the server. Progressive profile editing saves name, contact, city/state, experience, specialties, materials, categories, capabilities and biography. Portfolios support photo upload, title/category/description editing and removal from the portfolio.

Studio publication requires an explicit browser confirmation. Only studio and craft details enter the public directory. New studios remain unverified, and prices, distance and completion times are not fabricated. Published studios can receive commissions in the existing request desk. Full name, contact details and portfolio photographs remain private.

Optional password reset uses a verified Resend sender. Token hashes are stored, expire after 30 minutes and can be consumed once. Password replacement and session revocation are atomic. The frontend removes reset tokens from the address bar. Delivery failures never reveal whether an account exists. An unavailable email service gives an actionable error.

## Collections

The existing Hugging Face generator remains the provider integration: Qwen/Qwen-Image for text and Qwen/Qwen-Image-Edit via fal-ai for inline reference editing, subject to operator configuration and hosted model availability. Users choose 1–6 views; five is the default. Each request generates exactly one image. The browser orchestrates the sequence with server-persisted view status: hero, front, back, side, detail and optional styling. Later views use the master image plus the exact original prompt and a reused seed where supported.

The server stores an allowlisted garment specification, original brief, seed and view metadata. Body measurements are excluded from image requests and the saved image specification. Multiple views are rejected when reference editing is unsupported. Images are conceptual: reference conditioning does not guarantee hidden geometry, lettering, embroidery placement or production dimensions. Existing views remain available if regeneration fails. The master is locked after successful generation; a changed master needs a new collection. Interrupted view claims recover after five minutes.

The existing fashion board now supports thumbnails, previous/next, fullscreen, per-view download and regeneration, cancellation, saved-design retrieval, and per-view errors. A customer explicitly attaches their collection when confirming a commission. The assigned artisan can view its generated images; other accounts cannot. Original reference photographs remain private to the customer.

Private Supabase Storage holds decoded PNG files under account/UUID keys; PostgreSQL stores references rather than image blobs. The backend verifies the bucket is private and serves files only after ownership or assignment checks. Render's filesystem is not permanent image storage. Removed portfolio entries and replaced views can leave private unreferenced objects; an operator retention/garbage-collection policy is still needed before storing substantial volumes.

## The Beatle

The original SVG uses a compact oval body, integrated head, two tiny eyes, short antennae and a single wing seam. No raster asset, gradients, texture or 3D rendering. It is reusable at avatar and launcher sizes. Installed Motion/Framer Motion animates idle float/blink/antennae, thinking tilt, a responding lift and restrained cursor lean. Reduced motion removes those movements. The chat panel is keyboard accessible, preserves unsent input when closed, fits mobile screens and yields to existing dialogs.

The server uses a configurable chat-completions provider independently of image generation. The trusted role comes from the session. English, Hindi and Telugu are selectable. Reviewed product knowledge reflects App.jsx's actual workflows. The construction layer provides a general checklist, requires missing measurements, separates facts/recommendations/assumptions and avoids claiming a certified pattern. Its extension references provide general pressing/sewing resources, not validated garment-specific production plans.

The assistant can return allowlisted navigation actions, draft garment prompts and artisan biographies. Using a draft fills the editor; the user still reviews and saves/submits it. It cannot place orders, alter measurements, publish profiles or run arbitrary JavaScript. A separate opt-in shares current garment/craft context. Account identity, contact data, photos and precise measurements are excluded from automatic context. The messages a user types are sent to the configured provider, and this is disclosed in the panel. Optional saved conversations belong to the authenticated account and can be deleted. Only the most recent twenty messages are retained. Without provider configuration, the UI reports unavailability and offers real platform shortcuts.

## Database rollout

`server/migrations/002_phase2.sql` is additive and idempotent. It creates profiles, media references, portfolios, designs, conversations and password-reset tables. It does not alter customer records, roles or existing commissions. It has been applied only to local PGlite PostgreSQL test databases.

Production is not migrated automatically. Before rollout, back up the existing database and review this file. Apply it through the database operator's SQL client or set `PHASE2_MIGRATE=true` for one reviewed startup, then restore it to false. Existing account schema initialization stays as before. Missing Phase 2 tables return a service-unavailable response without falling back to localStorage.

## Required configuration

- `DATABASE_URL`: existing Render PostgreSQL; do not replace it.
- `PHASE2_MIGRATE`: false by default; opt in only after backup/review.
- `OBJECT_STORAGE_URL`, `OBJECT_STORAGE_KEY`, `OBJECT_STORAGE_BUCKET`: private Supabase project, server service-role key, private bucket.
- Existing `HF_TOKEN`, `HF_IMAGE_MODE`, `HF_IMAGE_MODEL`, `HF_IMAGE_PROVIDER`, editing settings and dedicated endpoint capabilities where applicable.
- `ASSISTANT_ENDPOINT`, `ASSISTANT_MODEL`, `ASSISTANT_API_KEY`, `ASSISTANT_TIMEOUT_MS`, `ASSISTANT_MAX_TOKENS`, `ASSISTANT_RATE_LIMIT`.
- Optional `RESEND_API_KEY`, `RESET_EMAIL_FROM`, `APP_URL` (HTTPS) for verified email resets.
- Existing `FRONTEND_ORIGINS` / Render same-origin serving configuration.
- `VITE_DEMO_MODE=true` explicitly enables the old local demo account flow in development; real server authentication is the default. Never enable this for production builds.

Server credentials must not appear in frontend environment variables. The assistant has no default model: choose an available chat model with access/credits. No services or existing environment values have been replaced or rotated. For future horizontal scaling, replace per-process rate limit counters with a shared limiter.

## Validation and limitations

Frontend production build passed. Frontend existing tests: 26 passed. Backend test totals and browser checks are recorded in the implementation report. Lint completes with warnings in existing components; new Beatle/profile/studio additions have no targeted lint warnings. The existing large Three.js bundle warning remains.

Backend tests execute real PostgreSQL SQL using PGlite and real local HTTP sessions. External image, chat, object storage and email behavior is isolated with explicit fixtures. Browser tests use generated images labelled QA FIXTURE, not AI-generated garments. Provider availability, real multi-view consistency, real multilingual answers, external storage durability and real email delivery still require configured integration testing.

No production credentials are configured in the supplied local environment. Render deployment and production schema migration have not been performed. Existing `threadlabs-current` and `threadlabs-current-db` remain unchanged. No new live URL is claimed.

## Primary integration references

- [Hugging Face chat completion API](https://huggingface.co/docs/inference-providers/en/tasks/chat-completion)
- [Supabase authenticated storage route](https://github.com/supabase/storage/blob/master/src/http/routes/object/getObject.ts)
- [Resend email API](https://resend.com/docs/api-reference/emails/send-email)
- [USU Extension sewing resources](https://extension.usu.edu/sewing/)
- [USU Extension pressing tools](https://extension.usu.edu/sewing/research/basic-sewing-supplies)

## Reviewed Render rollout

When `PHASE2_MIGRATE=true` runs in production, the server creates an immutable `phase2-baseline` recovery snapshot in `threadlabs_rollout_backups` in the existing private PostgreSQL database, inside the same transaction as the additive migration. It captures existing accounts, sessions, commissions and legacy records without changing their source tables. The backup table has no API and must be treated as private account data by operators. This supports migration recovery and is not an external disaster-recovery backup. Free Render PostgreSQL still requires a separate export before expiry. Migration failure stops the new deployment, leaving Render's prior healthy deploy available. After verification, set the flag false for subsequent starts.
