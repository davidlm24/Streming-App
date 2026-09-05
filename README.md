<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d116304c-f3fc-41ee-8b60-b6de39028c06

## Run Locally

**Prerequisites:** Node.js 20 or newer and npm.


1. Install dependencies:
   `npm ci`
2. Copy `.env.example` to `.env` and configure at least `FIREBASE_SERVICE_ACCOUNT_JSON`. Add Stripe, Cloudflare, and Gemini credentials for the corresponding integrations.
3. Run the app:
   `npm run dev`

The Firebase service-account JSON belongs only in the server environment. Never prefix it with `VITE_` or expose it to browser code.

Before production use, deploy the checked-in Firestore and Storage rules with the Firebase CLI, then configure `APP_URL`, Stripe price IDs, the Stripe webhook secret, and `SUPER_ADMIN_EMAILS` in the deployment environment.
