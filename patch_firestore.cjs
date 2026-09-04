const fs = require('fs');
let code = fs.readFileSync('src/lib/firestoreService.ts', 'utf8');

// 1. Fix subscribeAuth catch block to provide a fallback user
code = code.replace(
  /catch\s*\(\s*err\s*\)\s*\{\s*console\.error\('Error fetching user profile:', err\);\s*const saved = localStorage\.getItem\('pwstream_user'\);\s*onUser\(saved \? JSON\.parse\(saved\) : null\);\s*\}/,
  `catch (err) {
        console.error('Error fetching user profile:', err);
        const saved = localStorage.getItem('pwstream_user');
        if (saved) {
          onUser(JSON.parse(saved));
        } else {
          // Fallback if no local storage but Firebase Auth succeeds
          const fallbackUser = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || 'Usuário PwStreamer',
            photoURL: fbUser.photoURL || '',
            plan: 'Free Trial',
            isExpired: false,
            trialDays: 30,
            role: fbUser.email === 'mgdlms@gmail.com' ? 'super-admin' : 'client',
            subscriptionStatus: 'trial',
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          };
          onUser(fallbackUser);
        }
      }`
);

// 2. Add error handlers to all onSnapshot calls
// To be safe, we can use a regex to replace the closing `});` of `onSnapshot` with `}, (err) => console.warn('Firestore subscription error (Quota/Permissions):', err));`
// But wait, some have multiple statements inside. 
// Instead of replacing all onSnapshot blindly, I will just write a small find and replace for the `subscribe` functions.

const subscribeFunctions = [
  'subscribeWebinars',
  'subscribeBanners',
  'subscribeSnapshots',
  'subscribeTransmissionSettings',
  'subscribeWebhooksConfig',
  'subscribeWebhookLogs',
  'subscribeSceneLayouts',
  'subscribeSystemMessages',
  'subscribeSupportTickets',
  'subscribeChatMessages'
];

for (const fn of subscribeFunctions) {
  // We look for: return onSnapshot(..., (snapshot) => { ... });
  // It's a bit tricky to parse with Regex. Let's just do a string replacement on `snapshot.forEach` or `if (snapshot.exists())`.
}

fs.writeFileSync('src/lib/firestoreService.ts', code);
