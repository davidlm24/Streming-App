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
4. Set the deployment environment's variables **before the build**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are baked into the client bundle by Vite, so a deploy built without them ships the previous values. Also set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `APP_URL`, `MOTOR_URL`, `MOTOR_SEGREDO`, the Stripe price IDs, the Stripe webhook secret, and `SUPER_ADMIN_EMAILS`.

5. Deploy. Production is `https://streming-app-five.vercel.app` (Vercel project `streming-app`). It is not linked to GitHub yet, so deploy with the Vercel CLI from a clean copy of the commit (`git archive`), never from a working tree with `.env` files in it; the exact commands are in `SUPABASE_MIGRATION.md`, "What remains". The functions run in São Paulo (`regions` in `vercel.json`), next to the database.

The cutover checklist is in `SUPABASE_MIGRATION.md`.

## Motor de transmissão

The studio goes live through `motor/`: a Node + ffmpeg service that receives the composed program over a WebSocket (WebM chunks), transcodes it once (H.264 + AAC) and pushes RTMP to every channel. It runs outside Vercel because it needs ffmpeg and connections that last a whole live. The API and the motor share `MOTOR_SEGREDO`: the API signs a two-minute ticket per transmission (`POST /api/transmissoes`, which also records it in `stream_sessions`), the browser hands it to the motor together with the channels and their keys (the keys never reach the API or the database), and the motor reports each channel's state back (`POST /api/motor/eventos`).

Locally, run it from the Docker image (no ffmpeg install needed):

```
docker build -f motor/Dockerfile -t pwstreamer-motor .
docker run --rm -p 8787:8080 -e MOTOR_SEGREDO=<the same as in .env> -e APP_URL=http://host.docker.internal:3211 pwstreamer-motor
```

and set `MOTOR_URL=ws://localhost:8787` and `MOTOR_SEGREDO` in `.env`. For tests that point channels at the Docker network, add `MOTOR_PERMITE_REDE_PRIVADA=1` to `.env` and run the container with `-e MOTOR_PERMITE_REDE_PRIVADA=1 -e NODE_ENV=development`; the image runs in production mode by default, where private addresses are always refused. With ffmpeg installed, `npm run motor:dev` runs it directly. `npm run test:motor` covers the ticket and the ffmpeg commands.

In production the motor is the Fly.io app `pwstreamer-motor` (São Paulo, `motor/fly.toml`; the machine stops when nobody is live and starts on the first connection). Deploy from the repository root, with the Fly CLI signed in:

```
fly deploy --config motor/fly.toml --dockerfile motor/Dockerfile .
```

Once, set its secrets (`fly secrets set MOTOR_SEGREDO=… APP_URL=https://streming-app-five.vercel.app --config motor/fly.toml`) and, on Vercel, `MOTOR_URL=wss://pwstreamer-motor.fly.dev` and the same `MOTOR_SEGREDO`. The CSP in `vercel.json` already allows that origin.

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
