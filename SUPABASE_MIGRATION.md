# Supabase migration design

## Decision required before implementation

PW Streamer needs a dedicated Supabase project. The existing active project in the account contains an unrelated application and live data, so it must not be reused for this migration.

Create a new project in the existing organization, in a region selected for the application's users. For European users, `eu-west-3` (Paris) is the preferred region. Project creation can incur a recurring cost and must be confirmed before it is created.

The runtime is now Node 22 or newer. Current Supabase JavaScript libraries no longer support Node 20.

## Migration strategy

Use a staged cutover. Do not point the production client at Supabase until the complete copy, RLS verification, and acceptance tests pass.

1. Create a dedicated Supabase project and configure Auth, Storage, and the Data API.
2. Create the Postgres schema and RLS policies in an isolated Supabase branch or local development stack.
3. Replace client Firebase Auth, Firestore, and Storage adapters with Supabase adapters while preserving the current React interfaces.
4. Replace Firebase Admin verification and Firestore server writes with server-only Supabase clients.
5. Export Firebase Auth users, Firestore collections, and Storage objects.
6. Import data into Supabase, compare source and target counts, and test account ownership with two ordinary users and one administrator.
7. Put Firebase writes into maintenance mode, run a final delta export/import, and switch the application environment variables.
8. Keep Firebase read-only until the post-cutover monitoring window closes, then decommission it separately.

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
| `studio_settings` | `user_id primary key`, banners, transmission, destinations, webhooks, scenes as `jsonb` | `/users/{uid}/studioSettings/*` |
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

## Auth migration choices

Choose one before importing users:

1. **Password-hash import.** Export Firebase Auth users and Firebase's Scrypt hash parameters, then import supported accounts into Supabase Auth. This preserves passwords where the export data and hash configuration are available.
2. **Password reset cutover.** Import identities and require all email/password users to set a new password on first Supabase login. This is simpler and preferred for a small user base.
3. **Just-in-time password migration.** Temporarily verify legacy Firebase credentials at login, then create/update the Supabase credential. This minimizes disruption but adds a short-lived bridge service.

Google users must be configured in Supabase Auth with the correct OAuth redirect URL, allowed origins, and provider credentials. Configure the Supabase project's redirect allow list before enabling the new client.

## Data and Storage import

1. Take a timestamped backup of Firestore, Firebase Auth, and Storage before any write freeze.
2. Export Firestore collections using the official Firebase-to-Supabase tooling or a custom exporter that preserves Firestore document IDs and timestamp values.
3. Convert nested user subcollections into the tables above. Keep legacy Firestore IDs as text IDs during the first import where it makes reconciliation easier.
4. Export Firebase Storage objects and copy them to `media-assets/<supabase-user-id>/...`.
5. Build an explicit Firebase UID to Supabase UUID mapping before importing owner-keyed rows or Storage files.
6. For every imported table, record source count, target count, rejected rows, and checksum/ID samples.
7. Keep a durable migration journal containing the export time, importer version, mapping-file checksum, and completion status.

## Test and cutover gates

Before switching production traffic, verify:

- registration, email login, Google login, logout, and token refresh;
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
