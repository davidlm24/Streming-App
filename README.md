<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d116304c-f3fc-41ee-8b60-b6de39028c06

## Run Locally

**Prerequisites:** Node.js 22 or newer and npm.


1. Install dependencies:
   `npm ci`
2. Start the local Supabase stack (Docker required):
   `npm run db:start`
3. Copy `.env.example` to `.env` and set the Supabase values printed by `npx supabase status -o env`: `VITE_SUPABASE_URL` and `SUPABASE_URL` (the `API_URL`), `VITE_SUPABASE_PUBLISHABLE_KEY` (the `PUBLISHABLE_KEY`) and `SUPABASE_SECRET_KEY` (the `SECRET_KEY`). Without them nobody signs in. Add Stripe, Cloudflare, and Gemini credentials for the corresponding integrations.
4. Create the local test accounts (`dona@example.test`, `outra@example.test`, `admin@example.test`; the passwords are in `scripts/contas-de-teste.mjs`) and put `admin@example.test` in `SUPER_ADMIN_EMAILS` to use the Administração:
   `npm run db:contas`
5. Run the app:
   `npm run dev`

   It signs itself in as `dona@example.test`, so reloading a page does not cost a login. The session is real: the studio, the channels and the media work against the local database. To work as somebody else, set `VITE_DEV_LOGIN_EMAIL` and `VITE_DEV_LOGIN_SENHA` in `.env` — `admin@example.test` is the one that sees the Administração.

   Signing out turns the automatic sign-in off, so that it stays testable; the sign-in screen then offers to turn it back on. The e-mail and password form is still there for signing in as anyone else.

   **It only happens in development, against the local Supabase.** Vite removes the whole thing from the production bundle, credentials included, and a development build pointed at the hosted project does not try to sign in at all. Google is off locally unless you configure it in `supabase/config.toml`.

The Supabase secret key belongs only in the server environment. Never prefix it with `VITE_` or expose it to browser code.

Before production use:

1. Sign the CLI in to the account that owns the project (`npx supabase login`) and link it (`npx supabase link --project-ref <ref>`).
2. Push the schema: `npx supabase db push`.
3. Push the hosted Auth settings: `npx supabase config diff` to review, then `npx supabase config push`. The `[remotes.producao]` section of `supabase/config.toml` holds them, so production differs from local development in the open: e-mail sign-up off, confirmations on, Google on, and the production URLs. Set `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` in the shell that runs the push; they are read from the environment and never written to the file.
4. Set the deployment environment's variables **before the build**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are baked into the client bundle by Vite, so a deploy built without them ships the previous values. Also set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `APP_URL`, the Stripe price IDs, the Stripe webhook secret, and `SUPER_ADMIN_EMAILS`.

5. Deploy. Production is `https://streming-app-five.vercel.app` (Vercel project `streming-app`). It is not linked to GitHub yet, so deploy with the Vercel CLI from a clean copy of the commit (`git archive`), never from a working tree with `.env` files in it; the exact commands are in `SUPABASE_MIGRATION.md`, "What remains". The functions run in São Paulo (`regions` in `vercel.json`), next to the database.

The cutover checklist is in `SUPABASE_MIGRATION.md`.

## Supabase migration development

The staged Supabase control-plane schema, RLS policies, and regression tests are in `supabase/`. It is not linked to a cloud project yet, so these commands only operate on the local Docker stack:

```bash
npm run db:start        # the local stack, with every migration applied
npm run db:test         # the RLS tests in supabase/tests
npm run test:servidor   # the Express server against the local stack
npm run db:contas        # local test accounts for the development sign-in
npx supabase db lint --local
npx supabase db advisors --local
```

Use the credentials printed by `npx supabase start` only in an untracked local `.env`. The cloud project will use `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, and `SUPABASE_SECRET_KEY`; the final value stays server-only. See `SUPABASE_MIGRATION.md` for the cutover sequence.
