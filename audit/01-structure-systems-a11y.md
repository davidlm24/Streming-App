# Lane A — Structure, Systems & Accessibility

**Verdict.** The most expensive structural problem in PwStream is that **there is no design-token layer at all** — colour is authored as 811 arbitrary hex utilities (`bg-[#16191E]`, 89 distinct background values alone) scattered across 33 files, and "light mode" is a 194-line, 112-selector, 16-`!important` retrofit in `src/index.css` that hardcodes *eleven* of those 89 values. The other 235 background occurrences never flip, while the same stylesheet unconditionally forces their text dark. The measured result is text at **1.02:1** against its own background in light mode: entire modals (`ScreenSharePickerModal`, `CloudflareStreamModal`) become blank rectangles. This is not a styling bug; it is the absence of an architecture, and every future surface inherits it. Compounding it, the app ships essentially zero accessibility semantics — **one** `aria-label` and **one** `role` in 35 components, 159 `<label>` elements against 10 `htmlFor`, no `<main>` in any authenticated view, and no `role="dialog"` on any of the 20 hand-rolled modal roots. Structurally the product is also navigationally broken between 768px and 1279px, where three independent `hidden`/`md:hidden`/`xl:flex` rules conspire to leave a live streamer with no way out of the studio. Fixing the token layer first is what makes the other 29 findings tractable; fixing them in the current system means editing 33 files by hand every time.

---

## Severity Ledger

| # | Severity | Finding | File:line | Effort |
|---|---|---|---|---|
| 1 | P0 | Studio is a navigation dead-end at 768–1279px: no exit, no nav, no history | `src/components/Header.tsx:151,327,426` | S |
| 2 | P0 | Light theme translates 11 of 89 background hexes but forces all text dark → 1.02:1 contrast | `src/index.css:155-176,211-214` | L |
| 3 | P0 | 159 `<label>`, 10 `htmlFor`, 2 `<input id>` — form fields have no programmatic name | `src/components/WebinarPublicPage.tsx:258-266` | M |
| 4 | P0 | Whole-app ARIA vacuum: 1 `aria-label`, 1 `role`, 0 live regions, 0 `role="dialog"` on 20 modals | `src/components/Header.tsx:342` | L |
| 5 | P0 | No `<main>` landmark in any authenticated view; no skip link; studio has no `<h1>` | `src/components/AuthAndPricing.tsx:287` | S |
| 6 | P0 | Default studio tab `'first'` matches no panel — right sidebar renders empty on entry | `src/App.tsx:237` | XS |
| 7 | P0 | Stream health is `Math.random()`; the `warning` branch is mathematically unreachable | `src/components/StudioPreview.tsx:801-830` | M |
| 8 | P0 | No data-loss guard: exiting the studio or closing the tab mid-broadcast is silent | `src/App.tsx:1896,2432` | S |
| 9 | P1 | 20 hand-rolled modal roots, no shared primitive, 12 z-index tiers escalating to `z-[99999]` | `src/components/BillingDashboard.tsx:1254` | M |
| 10 | P1 | `LeftSidebar` is 5,483 lines / 161 props / 10 tabs / 184 controls / JSX depth ~20 | `src/components/LeftSidebar.tsx:198` | L |
| 11 | P1 | Studio presents ~98 simultaneous controls with 96 `title=` tooltips as the only documentation | `src/App.tsx:2230-2259` | M |
| 12 | P1 | Tab IDs are ordinal nonsense (`'first'`, `'third'`, `'seven'`); tab array duplicated with divergent labels | `src/App.tsx:2231` vs `2649` | S |
| 13 | P1 | No i18n layer; the 10 primary studio tabs are English in a pt-BR app; `<html lang="en">` | `src/App.tsx:2231-2240`, `index.html:2` | M |
| 14 | P1 | `alert()`×19 + `confirm()`×6 are the entire feedback and confirmation system | `src/components/LeftSidebar.tsx:1998` | M |
| 15 | P1 | `text-gray-500` (231 uses) is 3.64:1 on panel; active tab white-on-`#4683E0` is 3.76:1 | `src/App.tsx:2250` | M |
| 16 | P1 | `touch-target-btn` utility defined, used **0** times; `touch-action-btn` used 9× against 530 buttons | `src/index.css:344-349` | M |
| 17 | P1 | `focus:outline-none` ×137 with **0** `focus-visible:` replacements — keyboard focus is invisible | `src/components/Header.tsx:360` | S |
| 18 | P1 | Breakpoint strategy incoherent: JS `isMobile < 1024` vs Tailwind `md:` (768) on the same elements | `src/App.tsx:371,1996` | M |
| 19 | P1 | `ThemeContext` writes 6 redundant theme hooks, ignores `prefers-color-scheme`, sets no `color-scheme`, FOUCs | `src/context/ThemeContext.tsx:38-52` | S |
| 20 | P1 | Admin and super-admin surfaces are ungated in navigation — `#admin` promotes any user | `src/App.tsx:160-162,2801` | S |
| 21 | P1 | Dashboard is a hardcoded mock: every user is greeted "Marcos Gonçalves"; 4 fake metric cards; dead "Ver todos" | `src/App.tsx:2795,2818-2821,2845` | M |
| 22 | P1 | Public registration form: LGPD consent pre-ticked, legal links are dead `<span>`s | `src/components/WebinarPublicPage.tsx:293-296` | S |
| 23 | P1 | Zero loading states in the app: 0 `isLoading`, 0 skeletons, no auth-resolution gate | `src/App.tsx:96-103` | M |
| 24 | P2 | Dead code: `StudioScenePreviewControls` (279 lines) imported, never rendered; `rtmpConnected` timer never read | `src/App.tsx:22`, `src/components/ControlTray.tsx:50-58` | XS |
| 25 | P2 | Cross-component state routed through 6 untyped `window` CustomEvents instead of React state | `src/App.tsx:1070-1086` | M |
| 26 | P2 | 27 `<th>` elements, **0** `scope` attributes, across 4 data tables | `src/components/BillingDashboard.tsx:1199` | XS |
| 27 | P2 | Heading order skips a level (`h2` → `h4`) inside sidebar panels | `src/components/LeftSidebar.tsx:1113,1130` | S |
| 28 | P2 | 441 text nodes below 10px, down to `text-[4px]`; 1,102 arbitrary px font sizes total | `src/App.tsx:2218` | M |
| 29 | P2 | `profile` and `billing` are the same component with an argument — the "7 views" are really 5 | `src/App.tsx:2781-2787` | S |
| 30 | P2 | Fake billing identity and card data pre-filled into every user's account | `src/components/BillingDashboard.tsx:73-88` | S |

**Counts — P0: 8 · P1: 15 · P2: 7 (30 total).**

---

## Findings

### 1. [P0] Studio is a navigation dead-end between 768px and 1279px

**What.** Three independent responsive rules remove every route out of the studio in the 768–1279px band, and there is no browser-history fallback because view switching is React state.

**Evidence.**
```tsx
// src/components/Header.tsx:151 — primary nav, hidden below 1024
<nav className="hidden lg:flex items-center gap-1 xl:gap-3 ...">

// src/components/Header.tsx:327 — "Sair do Webinar", hidden below 1280
className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold ..."

// src/components/Header.tsx:426 — hamburger (the other exit), hidden AT AND ABOVE 768
className="md:hidden text-white p-2 hover:bg-slate-800 rounded cursor-pointer"
```
`ControlTray` declares and destructures `onExit` (`ControlTray.tsx:19,38`) and `App.tsx:2432` passes it, but **the prop is never rendered** — I grepped the whole file; `onExit` appears only in the interface and the destructure. `App.tsx:151` holds `currentView` in `useState` and only `useEffect` at `154-182` touches history, for `?mode=admin` — no `pushState` on view change, so browser Back exits the app entirely.

**Why it costs.** A user on an iPad Pro (1024×1366), a 1280×800 laptop in a non-maximised window, or any half-screen split view enters the studio and is trapped. Their only escape is a full page reload, which — see finding 8 — silently kills the broadcast. This is the single highest-frequency support ticket this layout will generate.

**Fix.** Render the exit control in `ControlTray` where the prop already exists, unconditionally at all breakpoints (it is the tray that is always visible), and delete the `hidden xl:flex` header duplicate. Change the header hamburger from `md:hidden` to `lg:hidden` so it covers the band the `<nav>` does not. Then push view changes to history:
```tsx
const setView = (v: View) => {
  setCurrentView(v);
  window.history.pushState({ view: v }, '', v === 'dashboard' ? '/' : `/${v}`);
};
// and in the existing popstate listener: setCurrentView(e.state?.view ?? 'dashboard')
```

---

### 2. [P0] Light theme translates 11 of 89 background values but forces all text dark

**What.** `index.css` implements light mode by enumerating eleven specific dark hex values as attribute selectors and overriding them to white, while simultaneously overriding *every* light text utility to a dark colour — so any surface whose background hex is not in the list of eleven keeps its dark background and gains dark text.

**Evidence.**
```css
/* src/index.css:155-176 — the entire covered set */
.theme-light .bg-\[\#16191E\], [data-theme="light"] .bg-\[\#16191E\],
.theme-light .bg-\[\#0F1115\], ... .bg-\[\#05060a\] { background-color: #FFFFFF; }

/* src/index.css:211-214 — applied globally, with no background guard */
.theme-light .text-white:not(.bg-blue-600 *):not(...) { color: #0F172A; }
```
Measured blast radius: **693** `bg-[#…]` occurrences across **32** files, **89** distinct values. **458** occurrences match the eleven covered hexes; **235 occurrences across 79 distinct values do not.** Two concrete casualties:
```tsx
// src/components/ScreenSharePickerModal.tsx:504
className="w-full bg-[#13151E] border border-slate-800 text-xs text-white ..."
// src/components/CloudflareStreamModal.tsx:145
<div className="bg-[#121622] border border-slate-800 rounded-xl p-4 space-y-3">
```
`#0F172A` on `#13151E` = **1.02:1**. `#334155` (the `.text-gray-300` override) on `#121622` = **1.74:1**.

**Why it costs.** Light mode is a shipped, header-promoted feature (`Header.tsx:338`, plus a duplicate in the user dropdown at `:397` and a third in the mobile menu at `:450`). A user who enables it finds the screen-share picker — the control they need to start presenting — rendered as an unreadable dark rectangle. The 1,412-line `ScreenSharePickerModal` alone carries 51 `bg-[#…]` uses. And because the fix mechanism is "add another hex to the selector list", every new component silently regresses the theme.

**Fix.** Replace the override system with semantic tokens — full spec in **Token Architecture Spec** below. As an immediate stop-gap before that migration lands, gate the text overrides on a themed surface so untranslated backgrounds do not get dark text: scope `.theme-light .text-white { color: #0F172A }` to `.theme-light .surface .text-white` and add `.surface` only to elements whose background token is theme-aware.

---

### 3. [P0] Form fields have no programmatic name

**What.** The app renders 159 `<label>` elements and 159 `<input>` elements, but only 10 `htmlFor` attributes and **2** inputs with an `id`. Nothing associates them.

**Evidence.** The public lead-capture form — the product's conversion surface — is representative:
```tsx
// src/components/WebinarPublicPage.tsx:257-266
<div className="space-y-1.5 text-left">
  <label className="text-xs text-gray-400 font-semibold">Nome Completo</label>
  <input type="text" required placeholder="Ex: Carlos Albuquerque"
    value={name} onChange={(e) => setName(e.target.value)}
    className="w-full bg-slate-950 border border-slate-800 rounded-xl ..." />
</div>
```
Per-file: `BillingDashboard.tsx` 15 labels / 0 `htmlFor`; `QrCodeModal.tsx` 10 / 0; `CustomDestinationModal.tsx` 10 / 0; `CloudflareStreamModal.tsx` 9 / 0; `LeftSidebar.tsx` 42 / 8; `App.tsx` 7 / 0.

**Why it costs.** WCAG 2.1 **1.3.1 and 4.1.2, Level A**. A screen-reader user hears "edit text, blank" for every field in checkout, RTMP configuration, and webinar registration. Clicking the visible label does not focus the field either, which costs every user — labels are the largest hit target for a small input. For a Brazilian SaaS this also matters for public-procurement eligibility (eMAG/LBI 13.146).

**Fix.** Mechanical and scriptable. For each pair, emit an id and bind it:
```tsx
const id = useId();
<label htmlFor={id} className="...">Nome Completo</label>
<input id={id} type="text" required ... />
```
For the ~40 icon-only buttons that carry a `title` but no text, add `aria-label` with the same string — `title` alone is not an accessible name on a `<button>` in every AT/browser pairing.

---

### 4. [P0] Whole-app ARIA vacuum

**What.** Across 35 components and roughly 30,000 lines, the app contains exactly one `aria-*` attribute and one `role`.

**Evidence.**
```tsx
// src/components/Header.tsx:342 — the ONLY aria-label in src/
aria-label="Alternar Tema Claro/Escuro"
// src/components/ImagePlaceholder.tsx:28 — the ONLY role in src/
role="button"
```
Zero `aria-live`, `role="status"`, `role="alert"`, `role="log"`, `role="dialog"`, `role="tab"`, `role="tablist"`, `aria-selected`, `aria-expanded`, `aria-modal`. There are **20** `fixed inset-0` modal roots (App.tsx ×3, LeftSidebar ×2, AddChannelsModal ×2, plus 13 others) and **none** is announced as a dialog.

**Why it costs.** Three concrete failures on the primary surface: (a) the live chat in `VirtualizedChat.tsx:339` streams new comments that are never announced — a blind host cannot moderate; (b) the GO LIVE state change, the recording timer, and the Firestore quota banner (`App.tsx:1922`) are silent; (c) opening any of the 20 modals leaves the page behind it fully exposed to the screen reader, with no boundary and nothing announcing that a dialog opened. The ten-item studio rail (`App.tsx:2230-2259`) is a tab set built from bare `<button>`s, so arrow-key navigation and "tab 3 of 10" orientation do not exist.

**Fix.** Three targeted additions, no redesign required.
```tsx
// 1. Chat log — VirtualizedChat.tsx:340
<div role="log" aria-live="polite" aria-relevant="additions" aria-label="Chat do webinar" ...>

// 2. Broadcast status — a single visually-hidden region in App.tsx, driven by isLive/isRecording
<div role="status" aria-live="assertive" className="sr-only">
  {isLive ? `Ao vivo há ${formatTime(liveTime)}` : 'Transmissão encerrada'}
</div>

// 3. Modals — one shared primitive (see finding 9) carrying:
<div role="dialog" aria-modal="true" aria-labelledby={titleId}>
```
And convert the studio rail to `role="tablist"` / `role="tab"` + `aria-selected` / `aria-controls`, with roving `tabIndex`.

---

### 5. [P0] No `<main>` landmark in any authenticated view; no skip link; studio has no `<h1>`

**What.** Landmark coverage exists only on the two logged-out surfaces.

**Evidence.** `<main>` appears exactly twice in `src/`: `AuthAndPricing.tsx:287` and `WebinarPublicPage.tsx:170`. `<nav>` appears once, `Header.tsx:151`, and is `hidden lg:flex`. `<aside>` and `<section>`: zero occurrences. The six `<h1>` elements live in `App.tsx:2795` (dashboard), `AdminPanel.tsx:141`, `AuthAndPricing.tsx:296`, `BillingDashboard.tsx:376`, `SuperAdminPanel.tsx:401`, `WebinarPublicPage.tsx:182` — **the studio has none**. A grep for skip-link patterns (`skip`, `pular para`) returns nothing.

**Why it costs.** WCAG **2.4.1 Bypass Blocks, Level A**. On the studio — the surface users spend hours in — a screen-reader user lands in an unstructured `<div>` soup with no `<main>` to jump to, no `<h1>` to establish what the page is, and no skip link past the header's 26 buttons. Every session begins by tabbing through the entire chrome. The two panel regions (scenes left, settings right) are `<div>`s, so they cannot be reached by landmark navigation either.

**Fix.**
```tsx
// App.tsx:1892 — wrap the view switcher
<a href="#conteudo" className="sr-only focus:not-sr-only ...">Pular para o conteúdo</a>
<Header ... />
<main id="conteudo" className="...">{/* the currentView switch */}</main>
```
In the studio grid (`App.tsx:1950`), give the scenes column `<aside aria-label="Cenas e participantes">` and the settings column `<aside aria-label="Painel de configurações">`, and add a visually-hidden `<h1>{title || 'Estúdio de transmissão'}</h1>` as the first child of `<main>`.

---

### 6. [P0] Default studio tab `'first'` matches no panel — the sidebar renders empty on entry

**What.** `activeTab` is initialised to `'first'`, but `LeftSidebar` has no branch for that value, so a first-time user opening the studio sees a 330px-wide empty dark column.

**Evidence.**
```tsx
// src/App.tsx:237
const [activeTab, setActiveTab] = useState<string>('first'); // Default to broadcast
// src/components/LeftSidebar.tsx:198
activeTab: string;
```
`LeftSidebar`'s render root (`:1101`) contains conditionals for exactly ten values — `widgets` (1104), `settings` (1222), `design`/`video` (2413), `third` (3648), `apps` (3911), `audience` (4228), `seven` (4233), `schedule` (4249), `theme` (4415). `grep "'first'" src/components/LeftSidebar.tsx` returns nothing. The comment `// Default to broadcast` describes a tab that does not exist.

**Why it costs.** This is the first thing a new streamer sees. A fifth of the studio's horizontal space is a blank void with ten unexplained English icons beside it, and nothing indicates that clicking one is required. The tab type being `string` rather than a union is why TypeScript never caught it.

**Fix.** Two lines, and one type:
```tsx
// src/types.ts
export type StudioTab = 'seven'|'widgets'|'schedule'|'design'|'theme'|'third'|'video'|'audience'|'settings'|'apps';
// src/App.tsx:237
const [activeTab, setActiveTab] = useState<StudioTab>('seven'); // Chat is the live-session default
// src/components/LeftSidebar.tsx:198
activeTab: StudioTab;
```
Chat is the correct default: it is what the Smart Sidebar itself force-selects when the stream goes live (`App.tsx:1063-1067`).

---

### 7. [P0] Stream health is fabricated, and its warning state is unreachable

**What.** The only diagnostic surface in a live-broadcasting product reports random numbers, and the degraded branch can never fire.

**Evidence.**
```tsx
// src/components/StudioPreview.tsx:801-815
const interval = setInterval(() => {
  const baseFps = localStream || screenStream || isLive ? 60 : 30;
  const fpsVar = Number((baseFps - Math.random() * 0.8).toFixed(1));
  const bitrateVar = Math.round(baseBitrate + (Math.random() * 260 - 130));
  const lossVar = Number((Math.random() * 0.06).toFixed(2));
  let status: 'excellent' | 'good' | 'warning' = 'excellent';
  if (lossVar > 2 || fpsVar < 24) { status = 'warning'; }
  else if (lossVar > 0.5 || fpsVar < 45) { status = 'good'; }
```
`lossVar` has a maximum of 0.06, so `lossVar > 2` and `lossVar > 0.5` are both dead. `fpsVar` is at minimum 29.2, so `fpsVar < 24` is dead. **`status` can only ever be `'excellent'` or `'good'`.** The same pattern sits in `ControlTray.tsx:53-58`, where `rtmpConnected` flips on `Math.random() > 0.1` every 15 seconds — and is then never read anywhere in the file. Across `src/` there are 63 `Math.random()` call sites, including `OBSIntegrationModal.tsx:98-104` (server latency) and `StudioPerformanceMonitor.tsx:40-42` (CPU/memory).

**Why it costs.** This is an architectural error-state gap, not a data-source gap: the surface that must warn a paying host that their stream is degrading is *structurally incapable* of doing so. A host will watch a green "excellent" badge while their audience sees a frozen frame. Because the fake state occupies the slot, there is nowhere for a real `getStats()` reading to land without a rewrite.

**Fix.** Replace the interval with `RTCPeerConnection.getStats()` (or the MediaRecorder/ingest telemetry the backend already has) and define three real states with thresholds a broadcaster recognises — `saudável` / `instável` (packet loss > 1% or fps < 80% of target for 5s) / `crítico` (loss > 5% or ingest disconnected). Pair `crítico` with the `role="alert"` region from finding 4. Until a real source exists, render an honest "Métricas indisponíveis" empty state rather than a fabricated green one.

---

### 8. [P0] No data-loss guard on studio exit or tab close

**What.** Leaving the studio is a single unconfirmed state change, and there is no `beforeunload` handler anywhere in the codebase.

**Evidence.**
```tsx
// src/App.tsx:1896 (Header) and :2432 (ControlTray) — identical, no isLive check
onExit={() => setCurrentView('dashboard')}
// src/components/Header.tsx:461 — mobile menu, same
onClick={() => { onExit(); setMenuOpen(false); }}
```
`grep -rn "beforeunload" src/` returns nothing. Meanwhile `window.confirm` *is* used six times for far smaller stakes — regenerating a stream key (`AdminPanel.tsx:72`), deleting an RTMP destination (`CustomDestinationModal.tsx:441`), clearing webhook logs (`WebhookPanel.tsx:1114`).

**Why it costs.** The product guards a log-clearing action but not "end a live broadcast in front of an audience". A misclick on "Sair do Webinar" — which sits 12px from the theme toggle in the header (`Header.tsx:327` then `:338`) — drops the stream with no confirmation and no recovery. Combined with finding 1, a trapped 1024px user's only escape (reload) is also the destructive one.

**Fix.**
```tsx
// App.tsx — guard the transition
const exitStudio = () => {
  if (isLive || isRecording) { setConfirmExitOpen(true); return; }  // in-app dialog, not confirm()
  setView('dashboard');
};
// App.tsx — guard the tab
useEffect(() => {
  if (!isLive && !isRecording) return;
  const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
  window.addEventListener('beforeunload', h);
  return () => window.removeEventListener('beforeunload', h);
}, [isLive, isRecording]);
```

---

### 9. [P1] 20 hand-rolled modal roots, no shared primitive, 12 z-index tiers

**What.** Every modal reimplements its own overlay, and they compete for stacking order with escalating magic numbers.

**Evidence.** 20 `fixed inset-0` overlay roots across 16 files. No `Modal`/`Dialog`/`Sheet` primitive exists in `src/components/`. Distinct z-index values in use: `z-0, z-10, z-20, z-30, z-35, z-40, z-50, z-60, z-[98], z-[99], z-[100], z-[105], z-[110], z-[120], z-[150], z-[200], z-[9999], z-[10000], z-[99999]`.
```tsx
// src/components/BillingDashboard.tsx:1254
<div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
// src/components/LegalModals.tsx:16
<div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
```

**Why it costs.** Nineteen copies of the same overlay means nineteen places to add `role="dialog"`, focus trapping, and Escape handling — which is why none of them has any. The `z-[99999]` is a symptom: someone hit a stacking conflict and won it with a number no one could beat, which guarantees the next conflict is worse. It also encodes an IA problem: several of these are not modal work at all. `WebhookPanel` (1,523 lines), `CustomDestinationModal` (1,183), `ScreenSharePickerModal` (1,412) and `BillingDashboard`'s invoice viewer are multi-step configuration surfaces that a user needs to reference *while* looking at the studio — they should be routed panels or side sheets, not blocking overlays.

**Fix.** Build one `<Dialog>` primitive carrying `role="dialog" aria-modal="true"`, focus trap, Escape, scroll-lock, and a single `z-[var(--z-modal)]`. Define a four-tier scale in `@theme` — `--z-base: 0; --z-sticky: 50; --z-overlay: 100; --z-modal: 200; --z-toast: 300` — and delete every arbitrary value. Then reclassify by dwell time: anything a user configures once and returns to (webhooks, custom RTMP destinations, plans) becomes a route under a `settings` view; anything they pick from mid-session (screen share picker, invite) stays a dialog.

---

### 10. [P1] `LeftSidebar` is a 5,483-line component with 161 props

**What.** A single component holds ten unrelated feature areas, receives 161 props, and nests JSX to roughly twenty levels.

**Evidence.** `LeftSidebarProps` (`LeftSidebar.tsx:198`ff) declares **161** members; `App.tsx:2049-2200` and `2461+` each spell out the full list twice. The file contains 131 `<button>`, 48 `<input>`, 5 `<select>`, 188 `bg-[#…]` utilities, 42 `<label>`, and its own modal roots. Maximum leading indentation is 40 columns, i.e. ~20 levels of JSX nesting (`App.tsx` reaches 16, `StudioPreview.tsx` 18).

**Why it costs.** The prop list is the IA made literal: banners, tickers, teleprompter, widgets, audio, video, snapshots, schedule, audience, themes and QR codes are one object. Nothing can be lazy-loaded, so every studio session parses all ten features. Nothing can be tested in isolation. And the twenty-level nesting is what produces the panel-inside-panel-inside-panel look reviewers keep flagging: a tab body wraps a section card wraps a row card wraps a control card wraps the control.

**Fix.** Split by tab into ten sibling components under `src/components/studio/panels/`, each owning its own state via a `StudioContext` rather than props (the app already has `MediaManagerContext` and `ThemeContext` as precedent). Render them through a map keyed by `StudioTab` with `React.lazy`. Target: each panel under 400 lines, max nesting depth 8 — panel → section → group → row → control, with the card treatment applied at exactly one of those levels.

---

### 11. [P1] The studio presents ~98 simultaneous controls documented only by tooltips

**What.** At rest, before any panel is expanded, the studio mounts roughly a hundred interactive controls, and the only explanation of what any of them does is a native `title` tooltip.

**Evidence.** `<button>` counts per studio component: `Header` 26, `StudioPreview` 41, `ControlTray` 16, `ScenesPanel` 3, plus the 12-button vertical rail in `App.tsx:2205-2273` — **~98 mounted simultaneously**, before `LeftSidebar` adds its 131 buttons / 48 inputs when a tab is opened. Documentation is 151 `title=` attributes app-wide, 96 of them in the studio (`LeftSidebar` 49, `StudioPreview` 28, `App.tsx` 11, `Header` 4, `ControlTray` 4). Some carry an entire paragraph:
```tsx
// src/App.tsx:2215
title="Smart Sidebar: Durante a Live, recolhe abas inativas mantendo o foco no Chat para economizar processamento e espaço visual."
```
There is no onboarding, no first-run tour, no progressive disclosure — `grep` finds no tour/coachmark/onboarding code.

**Why it costs.** `title` tooltips never appear on touch devices, take ~1s to appear on desktop, cannot be read by keyboard users, and are unstyled OS chrome. So the studio's entire explanatory layer is invisible to mobile and keyboard users and slow for everyone else. A first-time Brazilian streamer faces ~98 controls, ten English tab labels, and no guidance — the activation cliff is the product's biggest conversion risk after the trial gate.

**Fix.** Three moves, in order. (a) Define a *default* studio: collapse the vertical rail to the four tabs a first session needs (Chat, Design, Prompter, Settings) behind a "Mais" disclosure. (b) Replace `title` with a real `<Tooltip>` component (`role="tooltip"`, `aria-describedby`, focus- and touch-triggered) for short hints, and move the paragraph-length ones into panel-level help text that is always visible. (c) Add a three-step first-run overlay keyed on `localStorage` covering: pick a scene → add a destination → GO LIVE.

---

### 12. [P1] Tab IDs are ordinal nonsense, and the tab array is duplicated with divergent labels

**What.** The studio's ten tabs are keyed by a mix of ordinal words and semantic names, and the array is written out twice with different copy in each.

**Evidence.**
```tsx
// src/App.tsx:2231 (mobile drawer)
{ id: 'seven', label: 'Chat', icon: MessageSquare, desc: 'Chat' },
...
{ id: 'theme', label: 'Styles', icon: Sliders, desc: 'Cores' },
// src/App.tsx:2649 (desktop rail) — same ids, different labels and descriptions
{ id: 'seven', label: 'Chat', icon: MessageSquare, desc: 'Chat unificado do webinar' },
...
{ id: 'theme', label: 'Temas', icon: Sliders, desc: 'Tema Claro/Escuro do estúdio, cores da marca e tipografia' },
```
So the same tab is labelled **"Styles"** on mobile and **"Temas"** on desktop. `'seven'` is Chat, `'third'` is Prompter, `'first'` is nothing (finding 6).

**Why it costs.** A user who switches between a tablet and a desktop sees a different navigation vocabulary for the same panel. Every future edit must be made twice or the two diverge further — which they already have, across all ten `desc` strings. The ordinal IDs mean no one can read `activeTab === 'seven'` and know what it means.

**Fix.** Hoist one `STUDIO_TABS` constant into `src/data.ts`, typed as `readonly { id: StudioTab; label: string; icon: LucideIcon; desc: string }[]`, rename `seven → chat`, `third → prompter`, and import it in both render sites.

---

### 13. [P1] No i18n layer; the primary studio navigation is English in a Portuguese product

**What.** Every user-facing string is inlined at its call site — there is no `i18n`, `react-intl`, or `useTranslation` anywhere — and the strings are inconsistently Portuguese.

**Evidence.** The ten studio tab labels, the app's main navigation, are English while their tooltips are Portuguese:
```tsx
// src/App.tsx:2233-2239
{ id: 'schedule', label: 'Schedule', ..., desc: 'Agenda' },
{ id: 'theme',    label: 'Styles',   ..., desc: 'Cores' },
{ id: 'audience', label: 'Audience', ..., desc: 'Usuários' },
{ id: 'settings', label: 'Settings', ..., desc: 'Ajustes' },
```
The unauthenticated landing page's `<h1>` is English:
```tsx
// src/components/AuthAndPricing.tsx:296-299
<h1 className="text-5xl sm:text-7xl font-extrabold ...">
  One live video <br />
  <span className="...">30+ destinations</span>
```
with `Log In` / `Sign Up` beside `Início` / `Planos` (`:279-282`). The document declares the wrong language entirely:
```html
<!-- index.html:2 -->
<html lang="en">
```
Other English in the chrome: `GO LIVE` / `END LIVE` (`Header.tsx:316,319`), `LIVE STREAM` / `RECORDING ON|OFF` (`:197,207`), `AUTO-PIPELINE SECURE` (`ControlTray.tsx:592`), `SMART ON` (`App.tsx:2218`).

**Why it costs.** `lang="en"` makes every screen reader pronounce Portuguese with English phonetics — unintelligible, and a WCAG **3.1.1 Level A** failure. Beyond that, the first screen a Brazilian visitor sees is half English, and the first screen a paying user works in labels its ten panels in a language they may not read. Text expansion is also unmanaged: the rail labels are `text-[7px]` … `text-[8px]` with `truncate max-w-full` (`App.tsx:2256`, `:2674`), so translating "Settings" → "Configurações" silently clips to "Configu…".

**Fix.** Set `<html lang="pt-BR">` today — one character-level change, largest a11y return in the file. Translate the ten tab labels (`Chat, Widgets, Agenda, Design, Temas, Prompter, Vídeo, Público, Ajustes, Apps`) and the landing `<h1>`. Then extract strings to `src/i18n/pt-BR.ts` as a flat keyed object and introduce a `t()` helper — no library needed for a single locale, but it makes the second locale a data change rather than a 33-file edit. Give the rail labels a two-line clamp instead of `truncate` so longer Portuguese words survive.

---

### 14. [P1] `alert()` and `confirm()` are the entire feedback system

**What.** The app has no toast, no inline validation, and no error surface — it uses 19 native `alert()` calls and 6 `window.confirm()` calls.

**Evidence.**
```tsx
// src/components/LeftSidebar.tsx:1998
onClick={() => alert(`Layout '${template.name}' carregado com sucesso!`)}
// src/components/LeftSidebar.tsx:2466
onClick={() => alert("As cores principais da marca e os estilos tipográficos dos letreiros foram movidos para a aba dedicada 'Temas' no menu vertical do painel!")}
// src/components/LeftSidebar.tsx:813
alert('Por favor, digite um nome para a cena!');
// src/components/PlansModal.tsx:54
alert('Erro ao processar pagamento');
```
There are 84 `catch` blocks in `src/`; most `console.error` and surface nothing (`App.tsx:213`).

**Why it costs.** A native `alert()` blocks the entire browser tab — during a live broadcast, a validation alert freezes the studio UI including the video preview. It cannot be styled, cannot be dismissed by clicking away, has no `role="alert"` so it bypasses the live-region model, and on mobile it is a jarring OS sheet. `LeftSidebar.tsx:2466` is worse: an alert is being used as *navigation documentation*, telling the user where a feature moved. And `alert('Erro ao processar pagamento')` is the entire payment failure experience — no reason, no retry, no support path.

**Fix.** Add a toast surface (Sonner is a two-import install, or a 60-line `ToastContext`) with `role="status"` for success and `role="alert"` for errors. Move validation messages inline beneath their field with `aria-describedby` + `aria-invalid` — that is where the user is looking, and it satisfies WCAG 3.3.1. Replace the six `confirm()` calls with the shared `<Dialog>` from finding 9 so destructive confirmations are styled, keyboard-trapped, and can name consequences precisely.

---

### 15. [P1] Body-text and active-state contrast fail AA in the dark theme

**What.** The two most-used muted text colours and the active tab treatment fall below 4.5:1 on the surfaces they actually sit on.

**Evidence.** Measured (full table below). `text-gray-500` `#6b7280` on the panel `#16191E` = **3.64:1**, used **231** times. `text-slate-500` `#64748b` on the same = **3.70:1**, 26 uses. The active studio tab:
```tsx
// src/App.tsx:2250 and :2668 — white on the brand blue
isActive ? 'bg-[#4683E0] text-white shadow-lg ring-1 ring-blue-400/20' : ...
```
`#ffffff` on `#4683E0` = **3.76:1**. And the ControlTray's device-picker chevrons are `text-gray-500` on `#0B0D11` (`ControlTray.tsx:381`) = **4.02:1**.

**Why it costs.** WCAG **1.4.3 Level AA**. None of these is large text — `text-gray-500` is overwhelmingly applied at `text-[9px]`–`text-xs`, which makes 3.64:1 substantially worse in practice than the number suggests. The active-tab failure is the more damaging one: it is the *state indicator* for the studio's primary navigation, so a low-vision user cannot tell which of ten panels they are in.

**Fix.** Retire `text-gray-500`/`text-slate-500` as body colours in dark mode; the correct muted token is `#9ca3af` (`text-gray-400`, 6.94:1) with `#6b7280` reserved for genuinely decorative dividers and disabled states. Darken the active-tab background to `#2F63B8` (white → 5.9:1) or keep `#4683E0` and set the label to `#0B1220`. Both are single-token edits once the token layer from the spec below exists.

---

### 16. [P1] The touch-target utilities exist and are not used

**What.** `index.css` defines two utilities specifically to enforce 44px touch targets. One is used nine times; the other is used zero times.

**Evidence.**
```css
/* src/index.css:336-349 */
@utility touch-action-btn { @media (pointer: coarse) and (max-width: 991px) { min-height: 44px; min-width: 44px; padding: .75rem 1.25rem !important; } }
@utility touch-target-btn { @media (pointer: coarse) and (max-width: 991px) { min-height: 44px; min-width: 44px; } }
```
`touch-action-btn`: 9 uses (`App.tsx` ×2, `LeftSidebar.tsx` ×7). `touch-target-btn`: **0 uses anywhere in `src/`**. Against 530 `<button>` elements. Meanwhile the studio's primary controls are explicitly sized below the threshold:
```tsx
// src/components/ControlTray.tsx:463 — screen share, the most-used control
className="w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 md:w-9 md:h-9 rounded-full ..."   // 30 → 34 → 36px
// src/components/ControlTray.tsx:381 — device chevron
className="w-3.5 h-7.5 sm:w-4 sm:h-8.5 md:w-4 md:h-9 ..."                  // 14px wide
```
The rail buttons are `w-11 h-11` on mobile (44px — correct) but `md:w-10 md:h-10` (40px) at `App.tsx:2248`, i.e. they *shrink* below the threshold as the viewport grows into tablet range where touch is still likely.

**Fix.** The `max-width: 991px` guard in both utilities is itself wrong — a 1024px iPad is `pointer: coarse` and gets nothing. Drop the width condition and key purely on `(pointer: coarse)`. Then apply `touch-target-btn` to every icon-only control via the shared `<IconButton>` that these components are missing, rather than hoping it is remembered per call site. The 14px-wide chevron needs a real fix regardless: merge it into its parent button as a long-press/secondary affordance.

---

### 17. [P1] Focus indicators are removed 137 times and never replaced

**What.** `focus:outline-none` appears 137 times in `src/`. `focus-visible:` appears **zero** times. `focus:ring` appears five times.

**Evidence.**
```tsx
// src/components/Header.tsx:360 — the account menu trigger
className="flex items-center gap-3 text-left hover:bg-slate-800 p-2 rounded-lg transition-all focus:outline-none cursor-pointer"
// src/components/WebinarPublicPage.tsx:265 — public registration input
className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
```
The input case at least substitutes a border colour; the button case substitutes nothing at all.

**Why it costs.** WCAG **2.4.7 Focus Visible, Level AA**. A keyboard user tabbing through the studio's ~98 controls has no idea where they are. This is not a polish issue — it makes the entire application unusable without a mouse, which also excludes switch-device and voice-control users. (I am reporting the *absence* of an indicator; the visual design of the replacement ring belongs to Lane C.)

**Fix.** Delete every `focus:outline-none` and set one global rule so the indicator cannot be forgotten per component:
```css
:where(button, a, input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-radius: inherit;
}
```
`:focus-visible` means mouse users never see it, which is the reason the outlines were removed in the first place.

---

### 18. [P1] Breakpoint strategy is split between JavaScript and CSS at different values

**What.** The studio's layout switch is a JS boolean at 1024px, but the components inside it use Tailwind's `md:` (768px) for the same decisions, so a 256px-wide band behaves as neither mobile nor desktop.

**Evidence.**
```tsx
// src/App.tsx:371 and :1091 — the layout switch
const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
// src/App.tsx:1996 — the scenes panel is ALSO gated on md: (768), inside a !isMobile (1024) branch
className={`hidden md:flex shrink-0 overflow-hidden h-full ${...}`}
```
Breakpoint prefix usage across `src/`: `sm:` **308**, `md:` **65**, `lg:` **38**, `xl:` **7**, `2xl:` **0**. So 78% of all responsive work happens at 640px, while the actual layout transformation happens at 1024px in JS where no CSS can see it.

**Why it costs.** The 768–1023px band is where finding 1's dead-end lives, and it exists precisely because `Header` reasons in `md:`/`lg:`/`xl:` while `App` reasons in `isMobile`. The mismatch is also untestable — a CSS-only responsive check (dev-tools resize without a JS resize event, or SSR) renders a layout that never exists in production. And with 7 `xl:` uses and 0 `2xl:`, the studio does nothing with the extra space on a 1440px+ display, which is the hardware most streamers actually use.

**Fix.** Pick one source of truth. Move the layout switch to CSS container/media queries so the grid template is declarative (`grid-template-columns` via a `md:` / `lg:` class rather than an inline `style`), and if a JS boolean is still needed for conditional mounting, derive it from `matchMedia('(min-width: 1024px)')` and name the same three breakpoints in one exported constant. Then add the `xl:`/`2xl:` tier the studio is missing: at ≥1536px, widen both side panels rather than stretching the preview.

---

### 19. [P1] `ThemeContext` writes six redundant hooks, ignores system preference, and flashes

**What.** The theme provider stamps two classes plus a data attribute onto both `<html>` and `<body>`, hardcodes dark as the default, never sets `color-scheme`, and applies everything in an effect after first paint.

**Evidence.**
```tsx
// src/context/ThemeContext.tsx:38-52
if (theme === 'light') {
  root.classList.remove('dark');
  root.classList.add('light', 'theme-light');
  root.setAttribute('data-theme', 'light');
  body.classList.remove('dark');
  body.classList.add('light', 'theme-light');
  body.setAttribute('data-theme', 'light');
} else { /* mirror */ }
// :16-26 — no prefers-color-scheme fallback
return 'dark';
```
`index.css` consumes only two of the six hooks consistently (`.theme-light`, `[data-theme="light"]`) plus a stray `body.light` at `:147`. `body { background-color: #0F1115 }` at `:134` is unconditional, and the class is applied in `useEffect`.

**Why it costs.** (a) Every light-mode page load flashes dark before the effect runs — on a slow connection that is several hundred milliseconds of the wrong theme. (b) No `color-scheme: light` means native `<select>` dropdowns (20 in the app), date pickers, and Firefox scrollbars stay dark inside a white page. (c) A user whose OS is set to light gets dark anyway, on first visit, forever. (d) Six hooks for one boolean means the next stylesheet author has to guess which one is load-bearing.

**Fix.** One attribute, on one element, set before paint:
```html
<!-- index.html, inline in <head> before the stylesheet -->
<script>
  var t = localStorage.getItem('pwstream_theme')
    || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.dataset.theme = t;
  document.documentElement.style.colorScheme = t;
</script>
```
Then `ThemeContext` only writes `document.documentElement.dataset.theme` and `style.colorScheme`, and `index.css` targets `[data-theme="light"]` alone. Also honour `matchMedia` changes at runtime when the user has not made an explicit choice.

---

### 20. [P1] Admin and super-admin surfaces are ungated in navigation

**What.** Any authenticated user can reach the super-admin view by URL, and the dashboard shows an admin entry point to everyone.

**Evidence.**
```tsx
// src/App.tsx:160-162 — no role check
if (pathname.endsWith('/admin') || hash === '#admin' || search.includes('mode=admin')) {
  setCurrentView('super-admin');
}
// src/App.tsx:2801 — rendered for every user on the dashboard
onClick={() => setCurrentView('admin')}
```
`HeaderProps` declares `role?: string` (`Header.tsx:8`) and never reads it. The only role check in the app lives *inside* the panel it should be guarding:
```tsx
// src/components/SuperAdminPanel.tsx:38
return user?.role === 'super-admin' || user?.email === 'mgdlms@gmail.com'
  || localStorage.getItem('pwstream_master_unlocked') === 'true';
```

**Why it costs.** This is an information-architecture failure before it is a security one: the 7-view model has no notion of who a view is *for*, so authorisation is re-derived ad hoc inside each panel — inconsistently, and in one case from a `localStorage` flag the client controls. A regular customer sees "Painel de Administração" on their dashboard and either clicks it and hits a wall (bad) or does not (worse — the surface renders). The correct client-side posture is to not offer what the user cannot use.

**Fix.** Add `role` to the user model and derive the view set from it: `const views = VIEWS.filter(v => v.roles.includes(user.role))`. Gate the `#admin` effect on `user.role === 'super-admin'`, remove the dashboard admin button for non-admins, and treat the client check as UX only — the server-side rule in `firestore.rules` is the actual boundary.

---

### 21. [P1] The dashboard is a hardcoded mock

**What.** The first screen after login greets every user by a fixed name, shows four invented metrics, and offers a link that does nothing.

**Evidence.**
```tsx
// src/App.tsx:2795 — not user.name
<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Olá, Marcos Gonçalves</h1>
// src/App.tsx:2818-2821 — identical for every account
{ label: 'Webinares Realizados',  value: '14',    change: '+2 este mês' },
{ label: 'Espectadores Únicos',   value: '4.829', change: '+15% semana passada' },
{ label: 'Minutos Transmitidos',  value: '1.240m', change: 'Média 90m por live' },
{ label: 'Engajamento Médio',     value: '87%',   change: 'Altamente positivo' },
// src/App.tsx:2845 — styled as a link, no handler
<span className="text-xs text-blue-400 hover:underline cursor-pointer">Ver todos</span>
```
`App.tsx:2849` maps `webinars` with no empty-state fallback, so deleting the two seeded items (`handleDeleteWebinar`, `:207`) leaves a blank card body.

**Why it costs.** The dashboard is the app's orientation surface and it orients the user to fiction. A brand-new account is told it has run 14 webinars for 4,829 viewers. That destroys trust in every other number the product shows — including, fatally, the stream-health readout from finding 7. The dead "Ver todos" and the missing empty state are the same class of problem: the surface was composed visually and never wired.

**Fix.** `{user.name}` in the heading. Drive the four tiles from real aggregates and give each a genuine zero state ("Nenhum webinar realizado ainda — agende o primeiro"). Give "Ver todos" a handler or delete it. Add the empty state for `webinars.length === 0` with the "Agendar Webinar" CTA as its primary action — the dashboard's activation moment belongs there, not in the header.

---

### 22. [P1] Public registration form: consent pre-ticked, legal links dead

**What.** The LGPD marketing-consent checkbox ships checked, and the Privacy Policy and Terms references inside its label are non-interactive `<span>`s nested in the label itself.

**Evidence.**
```tsx
// src/components/WebinarPublicPage.tsx:292-297
<input type="checkbox" required defaultChecked id="privacy-check" className="mt-1 accent-blue-500" />
<label htmlFor="privacy-check" className="text-[10px] text-gray-400 leading-relaxed">
  Concordo em receber convites de webinars e aceito a
  <span className="text-blue-400 hover:underline cursor-pointer">Política de Privacidade</span> e os
  <span className="text-blue-400 hover:underline cursor-pointer">Termos de Uso</span> da plataforma.
</label>
```
A working `LegalModal` component exists and is wired in `AuthAndPricing.tsx:1123` and `App.tsx:3236` — it simply was not connected here.

**Why it costs.** Pre-ticked marketing consent is not valid consent under LGPD Art. 8 (or GDPR Art. 7) — it must be an affirmative act. Worse, because the `<span>`s sit *inside* a `<label htmlFor>`, clicking "Política de Privacidade" toggles the checkbox instead of opening the policy: a user trying to read the terms silently un-consents. This is the product's public conversion form, so it is also the highest-traffic instance of finding 3's missing labels.

**Fix.** Remove `defaultChecked`. Move the two references out of the `<label>` into a sibling line and make them real buttons that open `LegalModal` with `type="privacy"` / `type="terms"` — the component and both content types already exist. Separate the "receber convites" marketing consent from the "aceito os Termos" acceptance; they are different legal bases and cannot share one checkbox.

---

### 23. [P1] The application has no loading states

**What.** No skeleton, no spinner-gated view, and no gate on authentication resolution.

**Evidence.** `grep -rn "isLoading\|skeleton" src/ --include=*.tsx` returns **0** matches for both. The 22 `animate-spin` uses are decorative record icons, not loaders. Authentication resolves in an effect with no pending state:
```tsx
// src/App.tsx:96-103
useEffect(() => {
  const unsubscribe = subscribeAuth((userProfile) => {
    if (userProfile) { setUser(userProfile); }   // never clears on sign-out elsewhere
  });
  return () => unsubscribe();
}, []);
// src/App.tsx:1882 — renders the marketing page while auth is still in flight
if (!user) { return <AuthAndPricing onAuthSuccess={handleAuthSuccess} initialView="landing" />; }
```
The only mitigation is the optimistic `localStorage` seed at `:79-89`. A user whose `localStorage` was cleared but whose Firebase session is valid sees the full marketing landing page before being snapped into the app.

**Why it costs.** Architecturally, no surface in the product has a defined third state. Every data-bearing panel — billing history, invoices, webinar list, audience, webhook logs — renders as if data is always present, which means a slow Firestore read renders an empty-looking UI indistinguishable from a genuinely empty account. The `isQuotaExceeded` banner at `App.tsx:1921` proves the team already knows Firestore can fail; there is just nowhere for that knowledge to surface per-panel.

**Fix.** Add a third auth state and gate on it:
```tsx
const [authState, setAuthState] = useState<'pending'|'authed'|'anon'>('pending');
if (authState === 'pending') return <AppBootScreen />;   // logo + neutral background, no marketing
```
Define a three-state contract for every async panel — `loading` (skeleton matching the final layout), `empty` (the copy that already exists in `LeftSidebar`), `error` (retry + reason) — and give it a shared `<AsyncBoundary data={...}>` wrapper so it cannot be skipped. The empty-state copy in `LeftSidebar.tsx:3274,3395,3584,4359` is genuinely good work; it just needs the other two states beside it.

---

### 24. [P2] Dead code that still costs runtime

**What.** A 279-line component is imported and never rendered, and a `setInterval` runs forever to update state nothing reads.

**Evidence.**
```tsx
// src/App.tsx:22 — the only reference to this component anywhere in src/
import { StudioScenePreviewControls } from './components/StudioScenePreviewControls';
```
`grep -rn "StudioScenePreviewControls" src/` returns four hits: the import, and three inside the component's own file. It is never used in JSX.
```tsx
// src/components/ControlTray.tsx:50-58 — rtmpConnected has exactly one other reference: none
const [rtmpConnected, setRtmpConnected] = useState(true);
useEffect(() => {
  const interval = setInterval(() => { setRtmpConnected(Math.random() > 0.1); }, 15000);
  return () => clearInterval(interval);
}, []);
```
`touch-target-btn` (`index.css:344`) is likewise defined and never used.

**Why it costs.** `StudioScenePreviewControls` implements the Preview/Program workflow with ten transition types — the studio's most professionally differentiating feature — and it ships in the bundle without ever appearing on screen. The `rtmpConnected` interval re-renders `ControlTray` every 15 seconds during a broadcast for no reason.

**Fix.** Decide whether the Preview/Program bar is shipping. If yes, mount it above `StudioPreview` in `App.tsx:2321` — all its props already exist as state in `App`. If no, delete both the import and the file. Delete `rtmpConnected` and its effect. Either use `touch-target-btn` (finding 16) or remove it.

---

### 25. [P2] Cross-component state routed through untyped `window` CustomEvents

**What.** Six studio state channels bypass React entirely and travel through the global event bus.

**Evidence.**
```tsx
// src/App.tsx:1070-1086
const handleSwitchSubtab = (e: Event) => {
  const customEvent = e as CustomEvent<{ tab: string }>;
  const tabName = customEvent.detail?.tab;
  if (tabName === 'settings') { setActiveTab('settings'); }
  else if (tabName === 'slides') { setActiveTab('apps'); }
  else if (tabName === 'videos' || tabName === 'audios') { setActiveTab('video'); }
};
window.addEventListener('switch-studio-subtab', handleSwitchSubtab);
```
The six channels: `switch-studio-subtab`, `studio-recording-state`, `studio-reaction`, `studio-logo-pos-set`, `studio-banner-pos-set`, `studio-speaker-pos-change` / `-updated`. Dispatchers sit in `ControlTray.tsx:124,536`, `LeftSidebar.tsx:617,2510,2518,3337,3356`; listeners in `App.tsx:1082`, `StudioPreview.tsx:377,394,587,873,874`.

**Why it costs.** These are the *only* couplings in the app that TypeScript cannot see — handlers are typed `(e: any)` at `StudioPreview.tsx:855,868`. The `switch-studio-subtab` translation table above is a second, hidden tab-name mapping that must be kept in sync with the two tab arrays from finding 12; `'slides'` maps to `'apps'` and `'videos'` maps to `'video'`, mappings that exist nowhere else. Deleting a tab breaks a listener silently.

**Fix.** Lift the six channels into the `StudioContext` that finding 10 introduces. Position updates (`logo-pos`, `banner-pos`, `speaker-pos`) are ordinary shared state; the tab switch is a context method; the reaction burst is the one genuine fire-and-forget case and can stay an event, but should be typed via `declare global { interface WindowEventMap { 'studio-reaction': CustomEvent<{emoji: string}> } }`.

---

### 26. [P2] Data tables have no header scope

**What.** Four `<table>` elements, 27 `<th>` elements, zero `scope` attributes.

**Evidence.** `BillingDashboard.tsx:1199` (invoice history), `SuperAdminAnalytics.tsx:363`, `SuperAdminPanel.tsx:502` (client stream keys), `WebhookPanel.tsx:1180` (delivery logs). `grep -rhoE 'scope='` over `src/` returns nothing.

**Why it costs.** WCAG **1.3.1**. In the invoice table, a screen-reader user navigating cell by cell hears "R$ 297,00" with no indication of whether that is the amount, the tax, or the total — the association between a data cell and its column header simply is not published. Billing records are exactly the content where that matters.

**Fix.** `<th scope="col">` on every header cell, and `<th scope="row">` on the first cell of each row where one identifies the record (invoice number, client email). Add `<caption className="sr-only">` naming each table.

---

### 27. [P2] Heading hierarchy skips levels

**What.** Panel content jumps from `h2` straight to `h4`, and there is no `h1` above any of it in the studio.

**Evidence.**
```tsx
// src/components/LeftSidebar.tsx:1113
<h2 className="text-base font-bold text-white leading-tight">Widgets do Estúdio</h2>
// src/components/LeftSidebar.tsx:1130 — next heading in document order
<h4 className="text-xs font-bold text-white">Botão Chat Flutuante</h4>
```
The pattern repeats at `1173`, `1199`, and `3413`. Across the app: 6 `h1`, 33 `h2`, 75 `h3`, 48 `h4`, 5 `h5` — and the studio contributes zero `h1`.

**Why it costs.** WCAG **1.3.1**. Heading navigation (the primary way screen-reader users skim a dense page) reports a broken outline, so the sidebar's ten panels read as one undifferentiated level-2 list with orphaned level-4 items beneath.

**Fix.** Levels track structure, not size — that is what the classes are for. Each panel's title is the `h2`, each section within it `h3`, each card `h4`. Fix `1130`, `1173`, `1199`, `3413` to `h3`. Add the studio `h1` from finding 5.

---

### 28. [P2] 441 text nodes render below 10px, down to 4px

**What.** The app uses 1,102 arbitrary pixel font sizes, of which 441 are under 10px.

**Evidence.** Distribution across `src/`: `text-[4px]` ×6, `text-[5px]` ×11, `text-[6px]` ×12, `text-[7px]` ×29, `text-[8px]` ×150, `text-[9px]` ×243, `text-[10px]` ×489, `text-[11px]` ×162.
```tsx
// src/App.tsx:2218 — the Smart Sidebar toggle's own label
<span className="text-[6px] font-black uppercase tracking-wider">{isLive && isSmartSidebarEnabled ? 'SMART ON' : 'SMART'}</span>
// src/App.tsx:2256 — the studio tab labels
<span className="text-[7px] font-bold uppercase tracking-wide truncate max-w-full px-0.5">{tab.label}</span>
```

**Why it costs.** At 6–7px, uppercase, with letter-spacing, the studio's own navigation labels are decoration rather than text — which is why finding 11's tooltip problem exists at all. All of these fall well under WCAG's 18.66px-bold / 24px "large text" threshold, so every one of them needs the full 4.5:1 (finding 15), and several do not have it. This is also a straightforward density signal: the labels are that small because ten tabs were fitted into a 60px rail rather than the rail being sized for ten tabs.

**Fix.** Set a floor of 11px for any text conveying meaning and 12px for anything read in sequence. Widen the studio rail from `w-[60px]` to 72px so the tab labels can sit at 11px on two lines (which also solves the translation clipping in finding 13). The type *scale* that should replace these 1,102 arbitrary values is Lane B's call — I am flagging only the floor.

---

### 29. [P2] `profile` and `billing` are one component with an argument

**What.** Two of the seven declared views resolve to the same component distinguished by a prop, which itself maps into a four-value sub-tab.

**Evidence.**
```tsx
// src/App.tsx:2781-2787
) : currentView === 'profile' || currentView === 'billing' ? (
  <BillingDashboard user={user} onUpdateUser={handleAuthSuccess}
    onBackToDashboard={() => setCurrentView('dashboard')} initialTab={currentView} />
// src/components/BillingDashboard.tsx:33-34
const [activeSubTab, setActiveSubTab] = useState<'profile'|'plans'|'billing-history'|'metrics'>(
  initialTab === 'profile' ? 'profile' : 'plans'
```

**Why it costs.** The top-level route model claims seven peers; two of them are one surface, and that surface has four internal tabs of which only two are addressable from outside. So `plans` and `metrics` exist but cannot be linked to, deep-linked, or returned to after a refresh — a user sent to "your invoices" lands on the plans tab. The nesting is three deep (view → component → sub-tab) for what is conceptually a flat settings area.

**Fix.** Collapse to one `settings` view with four addressable sub-routes: `/settings/perfil`, `/settings/planos`, `/settings/faturas`, `/settings/uso`. Combined with the history work in finding 1, this makes every settings surface linkable and makes browser Back behave.

---

### 30. [P2] Fake billing identity and card data pre-filled into every account

**What.** The billing form initialises with a specific company's tax and address details and a test card number.

**Evidence.**
```tsx
// src/components/BillingDashboard.tsx:73-75
const [companyName, setCompanyName]     = useState('VineaSX Solutions Ltda');
const [taxId, setTaxId]                 = useState('12.345.678/0001-99'); // CNPJ or CPF
const [billingAddress, setBillingAddress] = useState('Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100');
// :86-88
const [stripeCardNumber, setStripeCardNumber] = useState('4242 4242 4242 4242');
const [stripeExpiry, setStripeExpiry] = useState('12/29');
const [stripeCvc, setStripeCvc] = useState('424');
// :92-93
const [paypalEmail, setPaypalEmail] = useState('marcos-test@pwstreamer.com');
```
The same pattern is in `AuthAndPricing.tsx:42-50`.

**Why it costs.** Defaults are a design decision, and these are the wrong ones: a user who does not notice will submit someone else's CNPJ on their own invoice. It also means the form has no genuine empty state, so the required/optional distinction is invisible — every field looks satisfied. And it teaches users that the payment fields are pre-populated, which is exactly the habit a phishing page exploits.

**Fix.** Initialise all of these to `''` and put the demo values behind an explicit `import.meta.env.DEV` guard or a visible "Preencher dados de teste" button in the sandbox banner that already exists at `:966`.

---

## Token Architecture Spec

### Measured blast radius

| Metric | Count |
|---|---|
| Arbitrary hex colour utilities in `src/` (`bg-[#`, `text-[#`, `border-[#`, gradient stops) | **811** |
| — of which `bg-[#…]` | 693 (89 distinct values) |
| — of which `text-[#…]` | 80 (11 distinct) |
| — of which `border-[#…]` | 9 (6 distinct) |
| — of which `from-/to-/via-[#…]` | 29 |
| Distinct 6-digit hex literals across `src/` (incl. `.ts`, `.css`) | **187** (1,088 occurrences) |
| Files containing at least one arbitrary hex utility | **33 of 35** |
| `bg-[#…]` occurrences the light theme translates | 458 (11 distinct values) |
| `bg-[#…]` occurrences the light theme **misses** | **235** (79 distinct values) |
| Palette utilities also needing semantic mapping | `border-slate-800` 816 · `text-gray-400` 517 · `text-blue-400` 321 · `bg-slate-800` 257 · `text-gray-500` 231 · `text-emerald-400` 168 · `bg-slate-950` 122 · `bg-slate-900` 105 |
| Light-theme override block in `index.css` | 194 lines · 112 selectors · 16 `!important` |
| Theme hooks written by `ThemeContext` per toggle | 6 (2 elements × class ×2 + attribute) |

### Target: Tailwind v4 `@theme` with semantic tokens

Replace the entire `index.css:140-333` override block with a two-palette token set. Tailwind v4 emits every `@theme` entry as a CSS custom property, so `[data-theme="light"]` only needs to redeclare the semantic layer — the utilities themselves never change.

```css
/* src/index.css — replaces lines 140-333 entirely */
@import "tailwindcss";

@theme {
  /* ---- Primitive ramp (never used directly in components) ---- */
  --color-ink-950: #05060A;  --color-ink-900: #0B0D11;
  --color-ink-850: #0F1115;  --color-ink-800: #13151E;
  --color-ink-750: #16191E;  --color-ink-700: #1C1F2B;
  --color-ink-650: #1E222B;  --color-ink-600: #252A35;
  --color-paper-50:  #FFFFFF; --color-paper-100: #F8FAFC;
  --color-paper-200: #F3F5F9; --color-paper-300: #E2E8F0;
  --color-brand-500: #4683E0; --color-brand-600: #2F63B8; --color-brand-700: #1D4ED8;

  /* ---- Semantic surfaces (dark is the default authoring theme) ---- */
  --color-canvas:        var(--color-ink-850);  /* page background            */
  --color-surface:       var(--color-ink-750);  /* panels, header, modals     */
  --color-surface-raised:var(--color-ink-650);  /* dropdowns, popovers        */
  --color-surface-sunken:var(--color-ink-800);  /* inputs, wells, code        */
  --color-surface-deep:  var(--color-ink-900);  /* control tray, stage bezel  */

  /* ---- Semantic content ---- */
  --color-content-strong: #FFFFFF;   /* headings, active labels             */
  --color-content:        #E2E8F0;   /* body                                */
  --color-content-muted:  #9CA3AF;   /* secondary — 6.94:1 on --surface     */
  --color-content-subtle: #6B7280;   /* DECORATIVE ONLY — 3.64:1, never text */
  --color-content-onBrand:#FFFFFF;

  /* ---- Semantic lines & state ---- */
  --color-line:        #1E293B;   --color-line-strong: #334155;
  --color-accent:      var(--color-brand-500);
  --color-accent-hover:#5B93E6;
  --color-focus:       #7CB0FF;
  --color-live:        #EF4444;   --color-record: #DC2626;
  --color-success:     #34D399;   --color-warning: #FBBF24;  --color-danger: #F87171;

  /* ---- Elevation & stacking (finding 9) ---- */
  --z-base: 0; --z-sticky: 50; --z-overlay: 100; --z-modal: 200; --z-toast: 300;
}

/* ---- Light theme: ONLY the semantic layer is redeclared ---- */
[data-theme="light"] {
  --color-canvas:        var(--color-paper-200);
  --color-surface:       var(--color-paper-50);
  --color-surface-raised:var(--color-paper-50);
  --color-surface-sunken:var(--color-paper-100);
  --color-surface-deep:  var(--color-paper-100);

  --color-content-strong: #0F172A;
  --color-content:        #1E293B;
  --color-content-muted:  #475569;   /* 7.58:1 on white */
  --color-content-subtle: #64748B;   /* 4.76:1 on white — safe as text here */

  --color-line:        var(--color-paper-300);  --color-line-strong: #CBD5E1;
  --color-accent:      var(--color-brand-600);  /* 5.9:1 with white text */
  --color-accent-hover:var(--color-brand-700);
  --color-focus:       #1D4ED8;
  --color-success:     #047857;  --color-warning: #B45309;  --color-danger: #B91C1C;
}

html { color-scheme: dark; }
[data-theme="light"] { color-scheme: light; }
body { background-color: var(--color-canvas); color: var(--color-content); }

:where(button,a,input,select,textarea,[tabindex]):focus-visible {
  outline: 2px solid var(--color-focus); outline-offset: 2px; border-radius: inherit;
}

@utility touch-target {
  @media (pointer: coarse) { min-height: 44px; min-width: 44px; }
}
```

Components then read `bg-surface`, `text-content-muted`, `border-line`, `bg-accent` — Tailwind generates all of these from the `@theme` names automatically. **Zero `!important`, zero attribute-selector hacks, and a new component is theme-correct by default rather than by remembering to register its hex.**

### Migration path

| Phase | Work | Files | Risk |
|---|---|---|---|
| **0 — Land tokens, change nothing** | Add the `@theme` block and the `[data-theme="light"]` block above the existing overrides. Both systems coexist; the new tokens are unused. Switch `ThemeContext` to write only `data-theme` + `color-scheme` and add the pre-paint script (finding 19). | `index.css`, `ThemeContext.tsx`, `index.html` | None — existing selectors still match. |
| **1 — Mechanical surface swap** | Codemod the 458 covered background occurrences: `bg-[#16191E]`→`bg-surface` (229), `bg-[#0F1115]`→`bg-canvas` (210), `bg-[#0B0D11]`→`bg-surface-deep`, `bg-[#1E222B]`→`bg-surface-raised`, `bg-[#4683E0]`→`bg-accent` (47). Delete each hex from the override list as its last use disappears. | 32 files, ~505 edits | Low — 1:1 mapping, verified by the counts above. |
| **2 — Triage the 79 orphans** | The 235 uncovered occurrences are near-duplicates of five surfaces (`#13151E`, `#121622`, `#161922`, `#1C1F2B`, `#12141C` are all within 6% luminance of each other). Map each to the nearest semantic surface; do not preserve the distinctions — they are accidents. Start with the two worst offenders: `ScreenSharePickerModal` (51) and `BillingDashboard` (62). | 32 files, ~235 edits | Medium — some are intentional brand colours (`#1877f2` Facebook, `#9146ff` Twitch, `#0A66C2` LinkedIn). Keep those as a separate `--color-platform-*` group; they are not theme-dependent. |
| **3 — Content & line tokens** | Swap `text-gray-400`→`text-content-muted` (517), `text-gray-500`→`text-content-subtle` **only where decorative**, otherwise `text-content-muted` (fixes finding 15's 231 AA failures). `border-slate-800`→`border-line` (816), `border-slate-700`→`border-line-strong` (175). | 33 files, ~1,700 edits | Low mechanically; the `gray-500` triage needs a human pass. |
| **4 — Delete the old system** | Remove `index.css:140-333`. Verify by grep: `bg-\[#` should return only the `--color-platform-*` set. Add a CI check failing any new `\[#[0-9a-fA-F]` in `src/**/*.tsx`. | `index.css` | Low if phases 1–3 are complete. |
| **5 — Contrast gate** | Add an automated AA check over the token pairs (the semantic set is now ~20 values, not 187 — a 30-line test). | new test | — |

Phases 1 and 3 are ~2,200 mechanical edits; both are safe `sed`-scale codemods because the mapping is total. Phase 2 is the only one needing judgment, and it is bounded to 79 values.

---

## Contrast Audit Table

Failing and borderline pairs only, measured against WCAG 2.1 AA (4.5:1 normal text, 3:1 large/UI). Every pair below is used at `text-xs` or smaller in the codebase, so **the large-text exemption does not apply to any of them.**

| Element | Context | FG | BG | Ratio | AA? |
|---|---|---|---|---|---|
| `.text-white` override on untranslated surface | **light** — `ScreenSharePickerModal.tsx:504` `bg-[#13151E]` | `#0F172A` | `#13151E` | **1.02:1** | **FAIL — invisible** |
| `text-amber-400` (78 uses, not overridden) | **light** — badge on `bg-surface` | `#FBBF24` | `#FFFFFF` | **1.67:1** | **FAIL** |
| `.text-gray-300` override on untranslated surface | **light** — `CloudflareStreamModal.tsx:145` `bg-[#121622]` | `#334155` | `#121622` | **1.74:1** | **FAIL** |
| `text-cyan-400` (RECORDING label, not overridden) | **light** — `Header.tsx:206` | `#22D3EE` | `#FFFFFF` | **1.81:1** | **FAIL** |
| `text-emerald-400` (168 uses, not overridden) | **light** — status text on card | `#34D399` | `#FFFFFF` | **1.92:1** | **FAIL** |
| `.text-gray-400` override on untranslated surface | **light** — `ScreenSharePickerModal.tsx:526` `bg-[#1C1F2B]` | `#475569` | `#1C1F2B` | **2.16:1** | **FAIL** |
| `text-blue-400` (321 uses, not overridden) | **light** — links, metric deltas | `#60A5FA` | `#FFFFFF` | **2.54:1** | **FAIL** |
| `input::placeholder` | **light** — `index.css:266` on white input | `#94A3B8` | `#FFFFFF` | **2.56:1** | **FAIL** |
| `text-gray-500` (231 uses) | **dark** — on panel `bg-surface` | `#6B7280` | `#16191E` | **3.64:1** | **FAIL** |
| `text-slate-500` on `bg-slate-900/40` | **dark** — inactive rail button, `App.tsx:2213` | `#64748B` | `#131823` | **3.73:1** | **FAIL** |
| `text-red-500` (not overridden) | **light** — error/live text | `#EF4444` | `#FFFFFF` | **3.76:1** | **FAIL** |
| `#4683E0` brand text (18 uses, not overridden) | **light** — accent labels, links | `#4683E0` | `#FFFFFF` | **3.76:1** | **FAIL** |
| **Active tab label** — `App.tsx:2250`, `:2668` | **dark & light** — white on brand fill | `#FFFFFF` | `#4683E0` | **3.76:1** | **FAIL** (state indicator) |
| `text-slate-500` | **dark** — on panel | `#64748B` | `#16191E` | **3.70:1** | **FAIL** |
| `text-slate-500` | **dark** — on canvas | `#64748B` | `#0F1115` | **3.97:1** | **FAIL** |
| `text-gray-500` chevrons — `ControlTray.tsx:381` | **dark** — on tray `#0B0D11` | `#6B7280` | `#0B0D11` | **4.02:1** | **FAIL** |
| `text-gray-500` | **dark** — on canvas | `#6B7280` | `#0F1115` | **3.91:1** | **FAIL** |
| `.text-gray-500` → `#64748B` | **light** — on `#F8FAFC` nested card | `#64748B` | `#F8FAFC` | 4.55:1 | PASS (borderline) |
| `#4683E0` brand text | **dark** — on panel | `#4683E0` | `#16191E` | 4.68:1 | PASS (borderline) |
| `text-red-500` | **dark** — on panel | `#EF4444` | `#16191E` | 4.68:1 | PASS (borderline) |
| `.text-gray-500` → `#64748B` | **light** — on white | `#64748B` | `#FFFFFF` | 4.76:1 | PASS (borderline) |

Passing for reference (no action): `text-gray-400` on panel 6.94:1 · `text-slate-400` 6.87:1 · `text-blue-400` dark 6.93:1 · `text-[#a59ebf]` 7.42:1 · `text-emerald-400` dark 9.16:1 · `text-amber-400` dark 10.55:1 · light body `#1E293B` on `#F3F5F9` 13.40:1.

**Pattern.** Every light-theme failure has the same cause: `index.css` overrides *text* colours globally (`:216-248`) but overrides *backgrounds* by enumeration (`:155-190`), and it overrides none of the saturated accent colours at all. The token spec fixes all 12 light failures with two lines each. The five dark failures are all `#6B7280`/`#64748B` used as body text; the spec renames that value `--color-content-subtle` and marks it decorative-only.

---

## Handoff

- **Lane B (design-taste-frontend).** The unauthenticated landing page renders a competitor's tagline as its `<h1>` — "One live video / 30+ destinations" (`AuthAndPricing.tsx:296-299`) — beneath a header badge that literally reads `RESTREAM MODE` (`:276`). I am flagging the pt/en mixing as an i18n finding; the brand and positioning implications of shipping a competitor's name and copy in the product chrome are yours. Related: the detector flags gradient text on that same `<h1>` (`:298`).
- **Lane B (design-taste-frontend).** 1,102 arbitrary pixel font sizes across eight distinct values from `text-[4px]` to `text-[11px]` — there is no type scale, only per-call-site guesses. I have specified a legibility *floor* (11px, finding 28) and nothing above it; the scale, weights, and the `Poppins`/`Montserrat` pairing in `index.css:4-7` are yours.
- **Lane C (emil-design-eng).** Twenty hand-rolled `fixed inset-0` modal roots with no shared primitive and no focus trap, Escape handler, or scroll lock among them (finding 9) — I have specified the structural contract (`role="dialog"`, `aria-modal`, one z-tier); the interaction mechanics of the primitive are yours. Also: `focus:outline-none` ×137 with zero `focus-visible:` replacements (finding 17) — I have specified that an indicator must exist and given a `:where()` default; its visual treatment is yours.
