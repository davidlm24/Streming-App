# Supabase migration design

## Decisions (2026-09-30)

- **A dedicated project in a separate Supabase account.** PW Streamer gets its own account and project; the other account's projects hold unrelated applications and are not reused. The project is created at cutover, in `sa-east-1` (São Paulo), because the users are in Brazil. The free plan costs nothing, pauses a project after 7 days without use, and caps the database at 500 MB, file storage at 1 GB, and a single file at 50 MB.
- **Local first.** The schema, the RLS tests, the server, and the client are built and tested against the local Supabase stack in Docker (`npm run db:start`, `npm run db:test`). The hosted project only receives what already passes locally.
- **Start from zero.** Nothing is imported from Firebase: no Auth users, no Firestore documents, no Storage objects (the Firebase Storage bucket never existed). People sign in again with Google, and the 30-day trial starts again. The auth-migration and data-import sections below are kept as reference only.
- **Google sign-in only in production**, as today. Email and password stay in development. The Google Meet scopes the Firebase sign-in requested are dropped: the app never used them.
- **The full control-plane schema** (`20260924121120_streaming_control_plane.sql`), plus what the app uses today and that schema lacked (`20260930150000_acrescimos_do_app.sql`): teleprompter scripts, separate banner and ticker lists in `studio_settings`, and the profile photo and name from Google.
- **The RTMP key regeneration route is removed** (stage 2). It had no screen and no ingest behind it, and it wrote to the Firestore `rtmpKeys` and `auditLogs` collections. The `rtmp_keys` tables stay in the schema for when ingest arrives.
- **Stages 2 and 3 ship together, at the cutover.** After stage 2 the server accepts only Supabase sessions while the client still signs in with Firebase, so the stage 2 pull request stays a draft until stage 3 is ready.

The runtime is Node 22 or newer. Current Supabase JavaScript libraries no longer support Node 20.

## Migration strategy

Use a staged cutover, one pull request per stage. Do not point the production client at Supabase until every stage passes locally.

1. **Database:** schema, RLS, and tests on the local stack, with a CI job that rebuilds the database from the migrations and runs `supabase/tests` on every change.
2. **Server:** validate Supabase access tokens in `src/middleware/auth.ts`; read profiles created by the auth trigger; keep `user_roles` in step with `SUPER_ADMIN_EMAILS`; move the trial check and the Stripe webhook writes to Postgres.
3. **Client:** Supabase Auth with the Google redirect flow, and Supabase-backed versions of the `firestoreService` functions (profile, webinars, studio settings, banners, tickers, scripts, and the admin client list), keeping the React interfaces.
4. **Media:** the studio library moves from the browser (IndexedDB) to the `media-assets` bucket. The free plan's 50 MB per-file cap limits video clips.
5. **Cutover:** create the project in the new account, link it and push the migrations with the CLI (the owner signs in to the CLI), configure the Google provider and redirect URLs, set the environment variables locally and on Vercel, then remove the Firebase packages, configuration, rules, and tests.

## Target services

| Firebase responsibility | Supabase responsibility | Notes |
| --- | --- | --- |
| Firebase Auth | Supabase Auth | Email/password and Google OAuth; users receive new Supabase sessions |
| Firestore `/users/{uid}` | `public.profiles` | One row per `auth.users` row |
| Firestore user subcollections | Owner-keyed Postgres tables | Protected with RLS using `auth.uid()` |
| Firestore `rtmpKeys` | `public.rtmp_keys` | Server/admin managed; encrypted secret material must not be exposed through the Data API |
| Firestore `auditLogs` | `app_private.audit_logs` plus an admin-only view or endpoint | Append-only; not readable by ordinary users |
| Firestore `stripeEvents` | `app_private.stripe_events` | Webhook idempotency, server-only |
| Firebase Storage | Supabase Storage bucket `media-assets` | Object paths start with the authenticated user's UUID |
| Firebase realtime listeners | Supabase Realtime Postgres changes | Subscribe only to the current user's rows |
| Firebase Admin SDK | `@supabase/supabase-js` server client with a secret key | Never expose the secret key to the browser |

## Proposed schema

The initial schema preserves current behavior while allowing relational improvements later.

| Table | Key columns | Origin |
| --- | --- | --- |
| `profiles` | `id uuid primary key references auth.users`, email, name, plan, subscription fields, trial dates, role | `/users/{uid}` |
| `webinars` | id, owner_id, payload `jsonb`, created_at, updated_at | `/users/{uid}/webinars` and public webinar records |
| `studio_settings` | `user_id primary key`; `transmission` (channels with their stream keys, graphics color), `banners` and `tickers` lists, and the layout columns, as `jsonb` | `/users/{uid}/studioSettings/*` |
| `teleprompter_scripts` | id, owner_id, webinar_id (null for the general script), script, notes; one per webinar and one general per owner | `/users/{uid}/roteiros` |
| `snapshots` | id, user_id, name, url, captured_at | `/users/{uid}/snapshots` |
| `audience_members` | id, user_id, payload `jsonb`, created_at | `/users/{uid}/audience` |
| `webhook_logs` | id, user_id, payload `jsonb`, created_at | `/users/{uid}/webhookLogs` |
| `media_assets` | id, owner_id, storage_path, content_type, byte_size, payload `jsonb` | `media_assets` |
| `rtmp_keys` | id, client_id, label, encrypted_key, status, created_at | `rtmpKeys` |
| `stream_sessions` | id, user_id, payload `jsonb`, created_at | `streamSessions` |
| `webinar_registrations` | id, webinar_id, name, email, company, registered_at | `webinarRegistrations` |
| `app_private.audit_logs` | id, actor_id, action, entity type/id, metadata, created_at | `auditLogs` |
| `app_private.stripe_events` | stripe_event_id unique, type, received_at, payload | `stripeEvents` |

`jsonb` is intentional for the existing complex UI payloads. Fields used for filtering, sorting, entitlement enforcement, or joins must be promoted to typed columns and indexed instead of remaining inside JSON.

## Authorization model

Every `public` table must have RLS enabled. Policies use the authenticated user's UUID, never browser-editable `user_metadata`.

- An ordinary user can select, insert, update, and delete only rows where `owner_id` or `user_id` equals `auth.uid()`.
- Every update policy contains both `USING` and `WITH CHECK` ownership predicates.
- `profiles` permits a user to update only mutable display/profile fields. Plans, roles, Stripe IDs, entitlement versions, and trial dates are changed by the server only.
- Public webinar details are exposed through a minimal `security_invoker` view or a purpose-built public API, not by granting broad access to private webinar rows.
- Super-admin authorization comes from a server-maintained role table or `app_metadata`; it never comes from `user_metadata`. JWT role changes require a token refresh.
- `app_private` is not exposed through the Data API. Stripe events, audit logs, API secrets, and decrypted RTMP credentials remain server-only.
- The `media-assets` Storage policies require the first object-path segment to equal `auth.uid()`. Upsert operations need select, insert, and update policies.
- **Every table needs explicit grants.** In this Supabase version, tables created in `public` grant no read or write to the API roles by default, including `service_role`, which bypasses RLS but still needs table privileges. The app role (`authenticated`) gets what the RLS policies allow; the server (`service_role`) gets only what it uses (`20260930160000_servidor.sql`): read, insert, and update on `profiles` and `user_roles`. New functions in `public` are not executable by the API roles either; server-only functions revoke and grant explicitly.

## Application changes

### Client

1. Install and lock `@supabase/supabase-js`.
2. Replace `src/lib/firebase.ts` with a browser Supabase client using only:

   ```text
   VITE_SUPABASE_URL
   VITE_SUPABASE_PUBLISHABLE_KEY
   ```

3. Replace `src/lib/firestoreService.ts` with a Supabase-backed module retaining its exported domain functions where possible. This keeps the React components stable during the migration.
4. Replace Firebase calls in `src/lib/storageService.ts` with the Storage client and metadata writes to `media_assets`.
5. Replace `onSnapshot` listeners with scoped Supabase Realtime subscriptions or explicit refetches where realtime is not useful.
6. Replace Firebase email/password, Google sign-in, logout, and auth-state code with Supabase Auth methods.
7. Replace `authenticatedFetch` so it sends the Supabase access token as `Authorization: Bearer <token>`.
8. Remove Firebase packages, configuration, rules, and quota fallback messaging only after the cutover has passed.

### Express server

1. Add a server-only Supabase client initialized with:

   ```text
   SUPABASE_URL
   SUPABASE_SECRET_KEY
   ```

2. Replace Firebase ID-token verification in `src/middleware/auth.ts` with server-side Supabase token validation. Do not trust decoded JWT payloads without validation.
3. Replace Admin SDK profile creation, Stripe entitlement writes, RTMP-key writes, audit logs, and Stripe idempotency with transactions or constrained writes to the new tables.
4. Keep Stripe and Cloudflare endpoints in Express during this migration. Stripe signature verification requires the raw request body, and moving it to Edge Functions would widen the cutover unnecessarily.

Done in stage 2:

- `requireAuth` validates the bearer token with `auth.getUser` on the Auth service, which also rejects the token of a signed-out session. A rejected token answers 401; an unreachable Auth service answers 503.
- `GET /api/auth/profile` and `POST /api/validate-trial` read the profile the auth trigger created, recreate it if the administration deleted it, and keep the caller's `user_roles` row equal to `SUPER_ADMIN_EMAILS` (a confirmed email in the list), which is what `app_private.is_super_admin()` and the RLS policies read.
- On start, the server runs `public.sync_super_admins` with the list: it promotes confirmed emails in the list and demotes every other admin, including one who no longer goes through the server and would otherwise keep reading every profile through the Data API. Changing `SUPER_ADMIN_EMAILS` therefore requires restarting the server (on Vercel, a new deployment).
- The Stripe webhook verifies the signature (400 when it fails), then records the event and the profile change in one transaction through `public.apply_stripe_event`, which only the secret key can execute. A repeated delivery changes nothing, and a failed write answers 503 so Stripe delivers again. Stripe does not guarantee order, so a change applies only when the event is newer than the last one applied (`profiles.stripe_synced_at`) and concerns the profile's current subscription: a late "active" retry cannot undo a later cancellation, and the cancellation of an old subscription cannot cancel the current one. A subscription's plan follows its price (`STRIPE_PRICE_*`), so a plan change made in the billing portal is kept. Events carrying a non-Supabase user id (from before the migration) are only recorded.
- A token from a signed-out session answers 401, like any other rejected token.
- The billing portal reads `stripe_customer_id` from `profiles`.
- `firebase-admin` and `src/lib/firebase-admin.ts` are removed.
- `tests/servidor/servidor.test.ts` runs the real `createApiApp` against the local stack (`npm run test:servidor`): sign-in, a signed-out session, profile, the admin role, its removal through the profile route and on start, an unconfirmed admin email, expired trial, signed Stripe events (a repeated delivery, an out-of-order retry, a cancellation, a portal plan change), and the billing portal. The CI job runs it after the database tests.

## Auth migration choices

Not used: the migration starts from zero (decision of 2026-09-30). Kept as reference for a future import.

1. **Password-hash import.** Export Firebase Auth users and Firebase's Scrypt hash parameters, then import supported accounts into Supabase Auth. This preserves passwords where the export data and hash configuration are available.
2. **Password reset cutover.** Import identities and require all email/password users to set a new password on first Supabase login. This is simpler and preferred for a small user base.
3. **Just-in-time password migration.** Temporarily verify legacy Firebase credentials at login, then create/update the Supabase credential. This minimizes disruption but adds a short-lived bridge service.

Google users must be configured in Supabase Auth with the correct OAuth redirect URL, allowed origins, and provider credentials. Configure the Supabase project's redirect allow list before enabling the new client.

## Data and Storage import

Not used: the migration starts from zero (decision of 2026-09-30). Kept as reference for a future import.

1. Take a timestamped backup of Firestore, Firebase Auth, and Storage before any write freeze.
2. Export Firestore collections using the official Firebase-to-Supabase tooling or a custom exporter that preserves Firestore document IDs and timestamp values.
3. Convert nested user subcollections into the tables above. Keep legacy Firestore IDs as text IDs during the first import where it makes reconciliation easier.
4. Export Firebase Storage objects and copy them to `media-assets/<supabase-user-id>/...`.
5. Build an explicit Firebase UID to Supabase UUID mapping before importing owner-keyed rows or Storage files.
6. For every imported table, record source count, target count, rejected rows, and checksum/ID samples.
7. Keep a durable migration journal containing the export time, importer version, mapping-file checksum, and completion status.

## Local development

```text
npm run db:start   # the local stack in Docker, with every migration applied
npm run db:test    # the RLS tests in supabase/tests
npm run db:reset   # rebuild the local database from the migrations
npm run db:stop
```

`npx supabase status -o env` prints the local URL and keys for `.env`. They are the CLI's public development defaults, not secrets of any hosted project.

## Test and cutover gates

Before switching production traffic, configure the hosted project's Auth:

- **Email and password sign-up is off** (Google only, as decided), **email confirmation stays on, and anonymous sign-ins stay off.** The Auth API is public with the publishable key, and the server treats a confirmed email in `SUPER_ADMIN_EMAILS` as an admin. With confirmation off, the Auth service confirms by itself an email that someone signs up with, or adds to an anonymous account: anyone could claim the admin's address and become admin. The local stack (`supabase/config.toml`) keeps confirmation off for development only.
- The Google provider, the site URL, and the redirect allow list point at the production origin.

Then verify:

- Google login, logout, and token refresh (email login only in development);
- a user cannot read or mutate another user's profile, media, webhook logs, stream sessions, or webinar drafts;
- users cannot change their own plan, role, trial, or Stripe entitlement fields;
- the admin account can perform its intended server-authorized operations;
- Stripe Checkout, signed webhooks, duplicate event delivery, billing portal, and cancellation remain correct;
- Storage upload, download, replacement, and delete work for the owner and fail for another user;
- realtime subscription filters never deliver another user's data;
- source and target counts reconcile after the final delta import;
- no Firebase secret, service account, or package remains in the deployed client bundle.

## Rollback

Keep the Firebase application configuration and backups intact until the monitoring window closes. If the Supabase cutover fails, restore the previous deployment configuration, re-enable Firebase writes, and use the migration journal to identify records created while the new system was active. Do not delete Firebase data as part of this migration.

## References

- [Supabase Firebase Auth migration](https://supabase.com/docs/guides/platform/migrating-to-supabase/firebase-auth)
- [Supabase Firestore data migration](https://supabase.com/docs/guides/platform/migrating-to-supabase/firestore-data)
- [Supabase row level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
