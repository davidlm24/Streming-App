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
5. Run the app and sign in with the development email form (Google is off locally unless you configure it in `supabase/config.toml`):
   `npm run dev`

The Supabase secret key belongs only in the server environment. Never prefix it with `VITE_` or expose it to browser code.

Before production use, link the Supabase project and push the migrations (`npx supabase link`, `npx supabase db push`), configure the Google provider and the redirect URLs in the project, then set the Supabase values, `APP_URL`, Stripe price IDs, the Stripe webhook secret, and `SUPER_ADMIN_EMAILS` in the deployment environment. The cutover checklist is in `SUPABASE_MIGRATION.md`.

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
