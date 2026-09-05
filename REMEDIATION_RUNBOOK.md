# Remaining Remediation Runbook

This runbook covers the work that remains after commit `5275e47` (`fix: remediate security audit findings`). Run the stages in order. Key rotation is urgent; the other stages should first be completed against test-mode or staging services, then promoted to production.

## Current baseline

- Repository: `C:\Dev\Streming-App`
- Local URL: `http://localhost:3000`
- Firebase project: `gen-lang-client-0356999908`
- Firestore database: `ai-studio-pwstreamer-d116304c-f3fc-41ee-8b60-b6de39028c06`
- Package manager: npm
- Minimum Node version: 20
- Security remediation commit: `5275e47`

Start every work session from PowerShell:

```powershell
Set-Location C:\Dev\Streming-App
git status --short --branch
node --version
npm --version
npm ci
npm run lint
npm run build
```

Expected result: the working tree contains only the changes intended for the current stage, TypeScript passes, and the production build completes.

## 1. Rotate the exposed Gemini API key

The old key appeared in Git history. Removing it from the current files does not invalidate it, so rotate it before doing lower-priority work.

1. Open Google Cloud Console for the project that owns the Gemini key.
2. Go to **APIs & Services > Credentials**.
3. Locate the compromised key by name, creation date, or usage.
4. Create a replacement key, or use **Rotate key** if the console offers it.
5. Apply API restrictions so the key can call only the Gemini/Generative Language API it needs.
6. Apply an application restriction suitable for the server deployment. The key is consumed by the server and must never use a `VITE_` variable.
7. Store the replacement as `GEMINI_API_KEY` in the deployment secret store. Put it in local `.env` only when local AI features need it.
8. Deploy or restart the server so it reads the replacement.
9. Exercise one Gemini-backed feature and confirm a successful response in server logs.
10. Disable or delete the old key and confirm requests made with it fail.
11. Review key usage for unexpected traffic since the first public commit.

Do not rewrite Git history as a substitute for rotation. A coordinated history rewrite is optional after the old key has been revoked, because it requires every clone and branch to be updated.

Validation:

```powershell
rg -n "GEMINI_API_KEY\s*=\s*\S+" . --glob "!node_modules/**" --glob "!dist/**" --glob "!.git/**"
git log --all -S "GEMINI_API_KEY" --oneline -- .env.example
```

Pass condition: no current tracked file contains the Gemini secret, the new key works, and the old key is disabled.

Reference: [Google Cloud API key management](https://docs.cloud.google.com/docs/authentication/api-keys) and [API key best practices](https://docs.cloud.google.com/docs/authentication/api-keys-best-practices).

## 2. Configure production credentials and service settings

### 2.1 Create the local configuration

```powershell
Set-Location C:\Dev\Streming-App
Copy-Item .env.example .env -ErrorAction Stop
```

Fill `.env` without committing it. Use Stripe test-mode values and a staging Firebase service account during validation.

Required for the secured core flow:

| Variable | Source | Purpose |
| --- | --- | --- |
| `APP_URL` | Deployment URL, or `http://localhost:3000` locally | Stripe success, cancel, and portal return URLs |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase/Google Cloud service account | Server token verification and privileged Firestore writes |
| `STRIPE_SECRET_KEY` | Stripe test or live secret key | Checkout and billing portal |
| `STRIPE_WEBHOOK_SECRET` | Output from `stripe listen`, or deployed webhook endpoint | Webhook signature verification |
| `STRIPE_PRICE_STANDARD` | Stripe recurring Price ID | Standard plan mapping |
| `STRIPE_PRICE_PRO` | Stripe recurring Price ID | Professional plan mapping |
| `STRIPE_PRICE_BUSINESS` | Stripe recurring Price ID | Business plan mapping |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard | Stream account |
| `CLOUDFLARE_STREAM_API_TOKEN` | Cloudflare API token with `Stream Write` | Create live inputs from the server |
| `CLOUDFLARE_CUSTOMER_SUBDOMAIN` | Cloudflare Stream customer code/subdomain | Playback URLs |
| `SUPER_ADMIN_EMAILS` | Comma-separated allowlist | Server-side super-admin assignment |
| `GEMINI_API_KEY` | Rotated Google Cloud key | Gemini-backed features |

Other provider variables in `.env.example` are required only when those integrations are enabled.

The Firebase client `apiKey` in `firebase-applet-config.json` is a public project identifier. Keep its Google API restrictions configured, but do not replace it with the server service-account secret.

Check presence without printing values:

```powershell
node --import dotenv/config -e "const n=['APP_URL','FIREBASE_SERVICE_ACCOUNT_JSON','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','STRIPE_PRICE_STANDARD','STRIPE_PRICE_PRO','STRIPE_PRICE_BUSINESS','CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_STREAM_API_TOKEN','CLOUDFLARE_CUSTOMER_SUBDOMAIN','SUPER_ADMIN_EMAILS'];const m=n.filter(k=>!process.env[k]);console.log(m.length?'Missing: '+m.join(', '):'All required variables are set');process.exitCode=m.length?1:0"
```

### 2.2 Provision each external service

1. In Firebase/Google Cloud, create a runtime service account with only the roles needed by Firebase Admin Auth and the named Firestore database. Download the JSON once and put it in the deployment secret store.
2. For local development, either use the single-line JSON in `FIREBASE_SERVICE_ACCOUNT_JSON` or set `GOOGLE_APPLICATION_CREDENTIALS` to a JSON file outside the repository.
3. In Stripe test mode, create three recurring Prices and copy their `price_...` IDs into the matching variables.
4. Create a Stripe webhook endpoint at `https://YOUR_APP/api/webhooks/stripe` and subscribe at minimum to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the endpoint signing secret into `STRIPE_WEBHOOK_SECRET`.
6. In Cloudflare, create a scoped API token with the `Stream Write` permission and store it only on the server.
7. Set `SUPER_ADMIN_EMAILS` to the exact normalized account email or emails that should receive admin access.
8. Add the same names to the production host's secret/environment settings. Never prefix server credentials with `VITE_`.
9. Restart or redeploy, then inspect logs for missing-configuration errors without logging secret values.

Pass condition: the presence check succeeds in the target runtime, startup logs contain no credential parsing error, and no server secret is present in browser source or the built assets.

```powershell
rg -n "FIREBASE_SERVICE_ACCOUNT_JSON|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|CLOUDFLARE_STREAM_API_TOKEN" dist\assets
```

Expected result: no matches.

References: [Stripe subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks) and [Cloudflare Stream live input API](https://developers.cloudflare.com/api/resources/stream/subresources/live_inputs/methods/create/).

## 3. Validate and deploy Firebase rules

Firebase's Firestore and Storage emulators require Java. Use JDK 21 for a current installation even though older emulator documentation lists JDK 11 as the minimum.

### 3.1 Install prerequisites

1. Install a JDK 21 distribution such as Eclipse Temurin.
2. Open a new PowerShell window.
3. Verify Java and the Firebase CLI:

```powershell
java -version
npx firebase-tools@15.29.0 --version
npx firebase-tools@15.29.0 login
```

### 3.2 Compile rules locally

The checked-in `firebase.json` targets the named Firestore database. Do not run `firebase init`, because it can replace the existing configuration.

```powershell
Set-Location C:\Dev\Streming-App
npx firebase-tools@15.29.0 emulators:start --only firestore,storage --project demo-pwstreamer
```

Wait for both emulators to report ready. Rule syntax and load errors appear in this terminal. Stop with `Ctrl+C`.

### 3.3 Add rule regression tests

1. Install the test library and a test runner:

```powershell
npm install --save-dev firebase-tools@15.29.0 @firebase/rules-unit-testing vitest
```

2. Add `tests/rules/firestore.rules.test.ts` and `tests/rules/storage.rules.test.ts`.
3. Use a demo project ID and the emulator. Never point these tests at production.
4. Cover these cases:
   - unauthenticated reads and writes are denied;
   - a user can read their own `/users/{uid}` document;
   - a client cannot create or delete their user document;
   - a client cannot change `plan`, `role`, trial dates, billing source, or entitlement version;
   - a client can change only allowed profile fields;
   - user A cannot read or mutate user B's private records, streams, or webinars;
   - a super-admin claim can perform the intended admin operations;
   - uploads succeed only in the authenticated user's allowed Storage path;
   - cross-user Storage reads, writes, and deletes fail.
5. Add scripts:

```json
{
  "test:rules": "firebase emulators:exec --only firestore,storage --project demo-pwstreamer \"vitest run tests/rules\""
}
```

6. Run `npm run test:rules` and require it to pass before deployment.

Firebase recommends `@firebase/rules-unit-testing` because it can mock Authentication and remains connected to emulators rather than production resources. See [Firebase rule unit testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator).

### 3.4 Review and deploy

The CLI deploy overwrites rules configured in the Firebase console. Save the currently deployed Firestore and Storage rules as a rollback copy before this step.

```powershell
Set-Location C:\Dev\Streming-App
npx firebase-tools@15.29.0 projects:list
npx firebase-tools@15.29.0 firestore:databases:list --project gen-lang-client-0356999908
git diff -- firestore.rules storage.rules firestore.indexes.json firebase.json
npx firebase-tools@15.29.0 deploy --only firestore,storage --project gen-lang-client-0356999908
```

Read the CLI target shown before accepting any interactive prompt. It must show project `gen-lang-client-0356999908` and the named database from `firebase.json`.

Pass condition: rules tests pass, deployment succeeds for Firestore and Storage, and a post-deploy owner/cross-user smoke test has the same results as the emulator.

Rollback: restore the saved rule files, commit the rollback, and deploy the same targets again. Firebase documents the database-specific array configuration and deployment behavior in the [Firebase CLI reference](https://firebase.google.com/docs/cli). Emulator prerequisites are in [Local Emulator Suite setup](https://firebase.google.com/docs/emulator-suite/install_and_configure).

## 4. Run authenticated end-to-end security tests

Use Stripe test mode, a staging Firebase project when available, and two ordinary test accounts plus one allowlisted admin account.

### 4.1 Prepare identities and clean data

1. Create `owner-a@example.test` and `owner-b@example.test` in Firebase Authentication.
2. Add only the admin test email to `SUPER_ADMIN_EMAILS`.
3. Delete any old user documents for these test accounts so trial provisioning starts from a known state.
4. Start the app with the staging/test `.env`:

```powershell
npm run dev
```

### 4.2 Verify authentication and ownership

1. Call any protected `/api` endpoint without signing in. Expect HTTP `401`.
2. Sign in as user A and create a stream/webinar.
3. Record its ID from the Network panel.
4. Sign in as user B and attempt to read, update, start, and delete that ID through the UI or an authenticated API client. Expect `403` or `404` for every operation.
5. Sign back in as user A. Confirm their own operations still work.
6. Trigger `/api/webhooks/test-trigger` with a loopback or private target such as `http://127.0.0.1`. Expect rejection.
7. Send repeated requests to a rate-limited endpoint until the configured threshold is crossed. Expect HTTP `429`, then verify normal operation resumes after the window.

### 4.3 Verify trial and entitlements

1. Sign in with a new client account.
2. Confirm the initial trial dates are created once.
3. Sign out and sign in again. Confirm the original trial dates have not moved forward.
4. Attempt client writes that change `plan`, `role`, `trialEndDate`, `subscriptionStatus`, `billingSource`, or `entitlementsVersion`. Expect Firestore denial.
5. Set the trial end in the past using an Admin SDK test fixture. Confirm protected features fail closed rather than granting access when dates are invalid or missing.
6. Sign in with the allowlisted admin account, refresh its ID token, and verify the admin API works.
7. Confirm an ordinary client cannot open admin APIs even if the browser UI is manipulated.

### 4.4 Verify Stripe Checkout, webhooks, and portal

Install and authenticate the Stripe CLI, then run this in a second terminal:

```powershell
stripe login
stripe listen --events checkout.session.completed,customer.subscription.updated,customer.subscription.deleted --forward-to localhost:3000/api/webhooks/stripe
```

Copy the displayed `whsec_...` into the local `STRIPE_WEBHOOK_SECRET`, restart the app, then:

1. Sign in as a client and choose a paid plan.
2. Confirm the browser is redirected to a Stripe-hosted Checkout page.
3. Complete Checkout with a Stripe test card.
4. Confirm `checkout.session.completed` is accepted with HTTP `2xx`.
5. Inspect the user's Firestore document. Confirm the plan, subscription status, Stripe customer/subscription IDs, `billingSource: "stripe"`, and entitlement version were written by the server.
6. Resend the same event from Stripe. Confirm the resulting state is unchanged and no duplicate side effect is created.
7. Open the billing portal from the application. Confirm it opens for the signed-in customer's Stripe record.
8. Cancel the test subscription and confirm `customer.subscription.deleted` removes paid access.
9. Send a webhook with an invalid signature. Expect HTTP `400` and no Firestore change.

Stripe documents local event forwarding and the listener signing secret in [its webhook guide](https://docs.stripe.com/webhooks?lang=node).

Pass condition: every denied case is denied server-side or by Firebase Rules, owner flows work, duplicate Stripe delivery is harmless, and cancellation removes entitlement.

## 5. Remove simulated billing and analytics UI

This is the main UI follow-up for the next audit. The server-side Stripe redirect is already active, but parts of the interface still resemble a first-party payment processor or show demo data.

### 5.1 Simplify paid-plan checkout

1. In `src/components/AuthAndPricing.tsx`, replace the “checkout simulation” wording and intermediate simulated checkout state with a clear redirect state such as “Opening secure Stripe Checkout…”.
2. In `src/components/BillingDashboard.tsx`, remove the local card, PayPal, Mercado Pago, Pix, bank-slip, and fabricated success-detail forms.
3. Keep plan comparison, billing interval selection, and one action: **Continue to secure checkout**.
4. Have that action call `/api/checkout` through `authenticatedFetch`, disable while pending, show a useful error on failure, and navigate only to the URL returned by the server.
5. Keep **Manage billing** connected to `/api/billing/portal`.
6. Do not collect or store card numbers, security codes, or banking data in React state.

### 5.2 Replace fabricated account data

1. Identify every invoice, payment method, usage, viewer, revenue, and conversion value created from a hard-coded array or `Math.random()`.
2. For invoices and payment methods, add authenticated server endpoints backed by Stripe, or remove those panels until the endpoint exists.
3. For analytics, calculate values from authoritative Firestore/server records. If the product deliberately needs a preview, label it visibly as **Sample data** and keep it out of operational/admin totals.
4. Make email read-only unless Firebase Authentication email-change verification is implemented.
5. Persist editable profile fields through an allowed server or Firestore path; do not display a successful save for local-state-only changes.

Useful search:

```powershell
rg -n "Math\.random|mock|demo|simulat|invoice|payment|card|paypal|mercado|pix|boleto|revenue|conversion" src
```

### 5.3 UI acceptance checks

- A user never enters payment credentials into this application's own DOM.
- The paid-plan CTA always lands on a Stripe domain.
- Refreshing the page preserves all successful profile changes.
- Empty operational data renders an honest empty state.
- Sample data, if retained for a preview, is clearly identified.
- Loading, retry, cancellation, and provider-error states are usable on desktop and mobile.

Pass condition: searching the UI no longer finds simulated payment forms or unlabeled fabricated operational data, and Checkout/portal regression tests still pass.

## 6. Reduce the initial JavaScript bundle

The current production build emits a large initial client bundle. Measure before and after every change so code splitting improves the first load rather than only rearranging files.

### 6.1 Record the baseline

```powershell
npm run build
Get-ChildItem dist\assets\*.js | Sort-Object Length -Descending | Select-Object Name,Length
node -e "const fs=require('fs'),z=require('zlib');for(const f of fs.readdirSync('dist/assets').filter(x=>x.endsWith('.js'))){const b=fs.readFileSync('dist/assets/'+f);console.log(f,Math.round(b.length/1024)+' KiB',Math.round(z.gzipSync(b).length/1024)+' KiB gzip')}"
```

Save the initial entry-chunk raw and gzip sizes in the pull request or commit message.

### 6.2 Split infrequently used screens

1. In `src/App.tsx`, change static imports for large, infrequently visited views to `React.lazy(() => import(...))`.
2. Start with:
   - `SuperAdminPanel`
   - `BillingDashboard`
   - `WebinarPublicPage`
   - admin webhook/analytics views
3. Wrap the view switch in `Suspense` with a small loading component that matches the existing background and does not shift layout.
4. Move `recharts` usage behind lazy-loaded analytics/performance components so it is not required by the landing-page entry graph. `LeftSidebar.tsx` currently imports charts directly, so extract that chart section into its own lazy component if the sidebar itself must remain eager.
5. Build after each extraction and use the application to open the new lazy route. Watch the Network and Console panels for failed chunks.

Vite splits dynamic imports into separate chunks and preloads their shared dependencies; see [Vite dynamic imports and code splitting](https://vite.dev/guide/features.html#dynamic-import) and [production builds](https://vite.dev/guide/build).

### 6.3 Set and enforce a budget

Use these initial targets, then tighten them when real-user data is available:

- initial application JavaScript: at most 400 KiB gzip;
- no individual non-entry chunk over 500 KiB raw without a documented reason;
- landing page and sign-in work before admin, analytics, billing, or studio chunks download;
- no increase in interaction errors or layout shift.

Add a CI script that builds, finds the entry chunk referenced by `dist/index.html`, measures gzip size, and exits nonzero above the agreed budget.

Pass condition: the initial entry is within budget, infrequent screens download on demand, and all view transitions work after a clean production build.

## 7. Release gate

Run this gate after all earlier stages pass:

```powershell
Set-Location C:\Dev\Streming-App
npm ci
npm run lint
npm run test:rules
npm run build
npm audit --omit=dev
git diff --check
git status --short --branch
```

Then complete the following manual checks in a production-like environment:

- fresh registration and trial provisioning;
- repeat login without trial reset;
- user A/user B isolation;
- owner stream creation and deletion;
- blocked private-network webhook target;
- Stripe Checkout, signed webhook, duplicate delivery, portal, and cancellation;
- ordinary-client denial from admin APIs;
- admin login and token refresh;
- owner-only Storage upload and deletion;
- mobile and desktop loading/error/empty states;
- initial bundle budget.

Release only when all automated checks pass and every manual check has recorded evidence. Keep Stripe in test mode until the full gate passes. Promote the same named settings to live mode, register the live webhook signing secret, deploy, and perform one low-value live subscription smoke test.

## Completion record

Record the evidence here or in the release pull request:

| Stage | Owner | Date | Evidence | Result |
| --- | --- | --- | --- | --- |
| Gemini key rotated and old key revoked |  |  |  |  |
| Production secrets configured |  |  |  |  |
| Firebase rule tests passing |  |  |  |  |
| Firebase rules deployed and smoke-tested |  |  |  |  |
| Auth/ownership/trial E2E complete |  |  |  |  |
| Stripe lifecycle E2E complete |  |  |  |  |
| Simulated UI removed or clearly labeled |  |  |  |  |
| Initial bundle within budget |  |  |  |  |
| Final release gate complete |  |  |  |  |
