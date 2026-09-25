# Lane C — Interaction, Motion & Craft

**Verdict.** This app writes animation code that never runs. `animate-in` appears **67 times across 25 files** — on every modal, every dashboard entrance, every dropdown — and the plugin that defines it (`tailwindcss-animate`) is not in `package.json`, not in `node_modules`, and not registered via `@plugin` in `src/index.css`. Tailwind v4 ships no such utility. So every one of those classes is an inert string. Combined with the fact that **all 15 modals unmount via `if (!isOpen) return null`** (`CloudflareStreamModal.tsx:28`, `RTMPConfigModal.tsx:118`, +13 more), the result is that every overlay in this product hard-cuts in and hard-cuts out, on both edges, with nothing in between. That is the single detail that most makes this feel unfinished in use — not because a fade is missing, but because someone clearly intended one and the app has been shipping without it, unnoticed, which tells you no one has watched these transitions closely.

Underneath that sit three structural gaps: **zero `focus-visible:`** in 33,798 lines (907 `hover:` against 0), **zero `prefers-reduced-motion`** guarding **127 infinite animations** (24 of them pulsing over the live video canvas), and **zero ESC / backdrop / scroll-lock / focus-trap** on any modal. The real-time layer is the opposite story: `VirtualizedChat`'s scroll anchoring and unread pill are genuinely well built (`VirtualizedChat.tsx:216`, `:633`), and the drag handlers ship real touch equivalents. Those prove the team can do this. The craft is present in patches and absent as a system.

## Craft Ledger

| # | Severity | Finding | File:line | Fix effort |
|---|---|---|---|---|
| 1 | **P0** | 67 `animate-in` / `fade-in` / `zoom-in-95` / `slide-in-*` classes are undefined — no plugin installed. All entrance animation is dead code. | `App.tsx:2988`, `AddChannelsModal.tsx:243`, +23 files | 1 line (CSS) |
| 2 | **P0** | Zero `prefers-reduced-motion` anywhere, guarding 127 infinite animations | `index.css` (absent) | ~20 lines |
| 3 | **P0** | Zero ESC-to-close, zero backdrop-click, zero body scroll lock, zero focus trap/restore across all 15 modals | all modal files | 1 hook + 15 call sites |
| 4 | **P0** | `AudioVUMeter` calls `setLevel()` on every rAF frame → ~60 React renders/sec of 15 nodes, each with `transition-all`, during live broadcast | `AudioVUMeter.tsx:47-48` | ~25 lines |
| 5 | **P0** | GO LIVE / END LIVE has no `disabled`, no pending state, no confirm — double-clickable, irreversible | `Header.tsx:300-321` | ~15 lines |
| 6 | **P0** | 25 native blocking `alert()`/`confirm()` calls; a native dialog freezes the main thread — video, chat, encoder UI all stall mid-broadcast | `LeftSidebar.tsx` (10), +8 files | Medium |
| 7 | **P1** | Zero `focus-visible:` in the codebase; 37 `outline-none` with no replacement whatsoever | `CloudflareStreamModal.tsx` (11), `AuthAndPricing.tsx` (11) | ~10 lines global |
| 8 | **P1** | `active:` on 35 of 530 buttons (6.6%). `hover:`→`active:` ratio is **26:1** | codebase-wide | ~10 lines global |
| 9 | **P1** | Scene transition width-animates over live video (`w-full` → `w-[calc(100%-220px)]`, `transition-all duration-500`) — layout+paint every frame | `StudioPreview.tsx:3005` | 4 lines |
| 10 | **P1** | `AnimatePresence mode="wait"` doubles scene-switch latency: exit completes fully before enter begins | `StudioPreview.tsx:3006` | 1 line |
| 11 | **P1** | Drag updates React state per pointer-move, re-rendering the 4206-line `StudioPreview` over live video | `StudioPreview.tsx:641` | ~20 lines |
| 12 | **P1** | 41 `clipboard.writeText` calls, **zero** `.catch()` — UI shows "Copiado!" even when the copy failed (RTMP stream keys) | `CloudflareStreamModal.tsx:30-34` | ~8 lines |
| 13 | **P1** | `animate-spin` applied to the entire `<button>` element, not the icon — the whole button rotates | `AdminPanel.tsx:152`, `SuperAdminPanel.tsx:412`, `SuperAdminAnalytics.tsx:170` | 3 lines |
| 14 | **P1** | Login/register fully synchronous, no pending state, no disabled submit; button has no `active:` | `AuthAndPricing.tsx:176-209`, `:520-525` | ~15 lines |
| 15 | **P1** | `initial={{ scale: 0 }}` on the radial scene wipe — violates "nothing appears from nothing" | `StudioPreview.tsx:2977` | 1 line |
| 16 | **P1** | Multi-touch drag jump: `e.touches[0]` re-reads on every move; second finger hijacks the drag | `StudioPreview.tsx:637-638` | ~6 lines |
| 17 | **P1** | `useSceneTransition` drops input when busy instead of retargeting; timeouts never cleaned on unmount | `useSceneTransition.ts:26`, `:40-50` | ~15 lines |
| 18 | **P2** | `transition-all` 458× vs `transition-transform` 26× — animating every property including layout | codebase-wide | Mechanical |
| 19 | **P2** | 6 explicit easing utilities total across 458 transitions; ~99% use Tailwind's default curve | codebase-wide | ~4 lines (theme) |
| 20 | **P2** | `hover:scale-105` ungated by `@media (hover:hover)` — sticks on touch after tap | `ControlTray.tsx:463`, `:553`, `:564` | ~5 lines |
| 21 | **P2** | `touch-action-btn` on 9 of 530 buttons (1.7%); `touch-target-btn` on **0**. Duplicated twice on one element | `LeftSidebar.tsx:1299` | Mechanical |
| 22 | **P2** | `ImagePlaceholder` is an error state only — no loading placeholder exists, so images pop in and shift layout | `ImagePlaceholder.tsx:1-40` | ~20 lines |
| 23 | **P2** | 18 hover-only affordances (`group-hover:opacity-100`) with no touch equivalent — invisible on tablets | `LeftSidebar.tsx` (9), `StudioPreview.tsx` (3) | ~10 lines |
| 24 | **P2** | `animate-spin duration-1000` — `duration-*` is a transition utility and does nothing to a CSS animation | `StudioPreview.tsx:3114` | 1 line |
| 25 | **P2** | `VirtualizedChat` scroll handler comment claims rAF throttling; there is none. `setScrollTop` per scroll event drives an O(n) `useMemo` | `VirtualizedChat.tsx:189-206`, `:187` | ~12 lines |

**Counts: 6 P0 · 11 P1 · 8 P2**

## State Coverage Matrix

Measured across all of `src/` (33,798 lines, 51 files).

| Signal | Count | Per 530 `<button>` | Verdict |
|---|---|---|---|
| `hover:` | **907** | 171% | Saturated |
| `active:` | **35** | **6.6%** | Effectively absent |
| `focus-visible:` | **0** | **0%** | Absent |
| `focus:` | 246 | — | Inputs only (`focus:border`, `focus:ring`) |
| `disabled:` (utility) | 26 | 4.9% | Absent |
| `disabled={}` (binding) | 39 | 7.4% | Absent |
| `aria-busy` | **0** | 0% | Absent |
| `outline-none` | 139 | — | 37 with **no** replacement |
| `cursor-pointer` | 485 | 92% | Cosmetic affordance stands in for real state |
| `group-hover:opacity-100` | 18 | — | Hover-only, no touch path |
| `touch-action-btn` | 9 | **1.7%** | Defined, essentially unused |
| `touch-target-btn` | **0** | **0%** | Defined, never used |

**The ratio that matters: `hover:` to `active:` is 26:1. `hover:` to `focus-visible:` is 907:0.**

The interpretation is precise. Every control in this app tells you it is hoverable, and almost none of them confirm they were pressed or show where the keyboard is. Emil's rule — a button must answer the press — is unmet on 93% of buttons.

### Worst offenders by component

| Component | `<button>` | `hover:` | `active:` | Coverage | Note |
|---|---|---|---|---|---|
| `LeftSidebar.tsx` | **131** | 239 | **3** | **2.3%** | 131 buttons, 3 press states. Largest surface, worst ratio. |
| `StudioPreview.tsx` | 41 | 82 | 5 | 12.2% | Live surface; 24 infinite animations |
| `BillingDashboard.tsx` | **38** | 62 | **0** | **0%** | Payment surface, zero press feedback |
| `AuthAndPricing.tsx` | 36 | 48 | 1 | 2.8% | First impression + checkout |
| `ScreenSharePickerModal.tsx` | 27 | 48 | 1 | 3.7% | Destructive (stop share) |
| `App.tsx` | 26 | 63 | 3 | 11.5% | — |
| `Header.tsx` | 26 | 44 | 2 | 7.7% | Contains GO LIVE |
| `CustomDestinationModal.tsx` | 23 | 38 | **0** | **0%** | Best async logic, zero press feedback |
| `CloudflareStreamModal.tsx` | 21 | 26 | **0** | **0%** | 11 naked `outline-none` |
| `WebhookPanel.tsx` | 21 | 30 | **0** | **0%** | — |
| `QrCodeModal.tsx` | 14 | 24 | **0** | **0%** | Imports Motion, never uses it |
| `ControlTray.tsx` | 16 | 31 | **5** | **31%** | **Best in codebase** — the reference |

`ControlTray` is the only component where pressing things feels like anything. It is also the component users touch most during a broadcast. That is not a coincidence — someone polished the surface they actually used, and the pattern never propagated.

## Motion Inventory

Every animation in the codebase.

| Animation | File:line | Duration | Easing | Property | Earns it? | Correct value |
|---|---|---|---|---|---|---|
| `animate-in` + `fade-in` (55×) | `App.tsx:2790`, +54 | — | — | **none — class undefined** | Intended yes, **runs never** | Define via `@plugin` or hand-roll (see Finding 1) |
| `zoom-in-95` (10×) | `App.tsx:2988` | — | — | **none — undefined** | Yes | `200ms` `cubic-bezier(0.23,1,0.32,1)`, `scale(0.95)→1` |
| `slide-in-from-*` (13×) | `App.tsx:2020`, `:2044` | — | — | **none — undefined** | Yes | `240ms` `cubic-bezier(0.32,0.72,0,1)` |
| `ticker-scroll-left/right` | `index.css:38-54` | 15s (var) | `linear` | `transform` ✅ | **Yes** — broadcast ticker, linear is correct | Keep. Gate on reduced-motion. |
| `chat-bubble-in` | `index.css:75-88` | 250ms | `cubic-bezier(0.16,1,0.3,1)` | `opacity`+`transform` ✅ | **Yes** — best-tuned animation in the codebase | Keep as-is. Only used at `StudioPreview.tsx:3339`, correctly keyed so only new messages animate. |
| `subtle-shimmer` | `index.css:90-102` | 4s **infinite** | `linear` | `background-position` ❌ paints | **No** — perpetual, non-compositor | Delete, or run once on mount |
| `ticker-badge-glow` | `index.css:104-117` | 3s **infinite** | `ease-in-out` | `opacity` + **`filter: drop-shadow`** ❌ | **No** — animated filter forces repaint every frame, forever | Drop the `filter`; keep `opacity: 1→0.92` only |
| `pulse-blink` | `index.css:119-130` | 1.5s **infinite** | *(none — defaults to `ease`)* | `opacity` ✅ | **Partly** — REC indicator justifies it | Keep for REC only; add `steps()` feel: `1.5s ease-in-out infinite` |
| `body` transition | `index.css:137` | 200ms | `ease` | `background-color`, `color` ✅ | **Yes** — theme swap | Correct. |
| `animate-pulse` (78×) | 21× in `StudioPreview` | 2s **infinite** | `cubic-bezier(0.4,0,0.6,1)` | `opacity` ✅ | **Mostly no** — 78 perpetual pulses | Cut to ≤6 (live/rec status only) |
| `animate-ping` (17×) | `Header.tsx:315`, +16 | 1s **infinite** | `cubic-bezier(0,0,0.2,1)` | `transform`+`opacity` ✅ | **No** — 17 expanding rings is noise | Cut to 1 (live dot) |
| `animate-spin` (22×) | `AdminPanel.tsx:152`, +21 | 1s **infinite** | `linear` | `transform` ✅ | **Mixed** — 12 legitimately gated on `isTesting`/`isSaving`; 4 are perpetual state indicators misusing the loading idiom | Gate all on a real pending flag; never for "recording"/"live" |
| `animate-bounce` (6×) | various | 1s **infinite** | custom | `transform` ✅ | **No** | Remove |
| Scene fade | `StudioPreview.tsx:1730-1733` | `transitionDuration/1000` = 300ms | `easeInOut` | `opacity` (Motion `x`/`scale` shorthand ❌ not GPU) | Yes | `linear` for crossfade; use `transform` string |
| Scene slide | `:1745-1748` | 300ms | `easeOut` ✅ | `x` shorthand ❌ | Yes | `transform: "translateX()"` |
| Scene zoom | `:1752-1755` | 300ms | `easeInOut` | `scale` ✅ 0.9→1 | Yes | `easeOut` for entering |
| Dip-to-color overlay | `:2918-2921` | 150ms | `easeInOut` | `opacity` ✅ | Yes | Correct |
| Slide wipe | `:2927-2930` | 150ms | `easeInOut` | `x` ❌ | Yes | `cubic-bezier(0.32,0.72,0,1)` |
| Smooth wipe | `:2936-2942` | 150ms | `[0.22,1,0.36,1]` ✅ | `x`+`skewX` | Yes | **Only hand-tuned Motion curve in the app** |
| Shutter wipe | `:2958-2969` | 150ms | `easeInOut` | `y` ❌ | Yes | ok |
| Radial wipe | `:2976-2982` | 150ms | `easeInOut` | **`scale: 0`** ❌ | Yes | `scale: 0.85` — never from 0 |
| Flash | `:2988-2991` | 150ms | `easeOut` ✅ | `opacity` ✅ | Yes | Correct |
| Reaction float | `:2896-2899` | **2200ms** | `easeOut` | `y`,`scale`,`opacity` | Yes — decorative, not user-blocking | Acceptable; 2.2s is fine for ambient |
| Logo in/out | `:3027-3030` | 350ms | `easeOut` ✅ | varies | Yes | Correct |
| Overlay img | `:2773-2776` | **800ms** | *(default)* | `opacity` ✅ | Marginal | 300ms |
| Nested platform modal | `AddChannelsModal.tsx:459-463` | *(Motion default spring)* | spring | `opacity`+`scale` 0.95 ✅ | **Yes** — correct values | Add `{duration:0.2, bounce:0.1}` |
| Live-video width morph | `StudioPreview.tsx:3005` | **500ms** | `ease-in-out` | **`width`** ❌❌ layout | **No** — layout thrash over live video | `transform: translateX()` + fixed width |
| Banner reposition | `:3657` | **700ms** | `ease-out` | `transition-all` ❌ | No — over 400ms ceiling | 250ms, `transform` only |
| Progress bar | `:3139` | 1000ms | `ease-linear` ✅ | `transition-all` ❌ | Yes | `transition-[width]` — linear is right for progress |
| VU meter segments | `AudioVUMeter.tsx:127` | 75ms | default | `transition-all` ❌ | **No** — retargets every 16ms, never completes | Remove transition entirely; drive via CSS var |
| Chevron rotate | `ControlTray.tsx:384`, `:479` | 200ms | default | `transform` ✅ | **Yes** | Correct |
| Press feedback | `ControlTray.tsx:463` etc. (35×) | `transition-all` | default | `transform` | **Yes** | Scope to `transition-transform 160ms` |

**Aggregate:** 127 infinite animations. 458 `transition-all` against 38 property-scoped (`transform` + `opacity`). 6 explicit easing utilities in the entire app — meaning ~99% of transitions run Tailwind's default `cubic-bezier(0.4, 0, 0.2, 1)`, a symmetric ease-in-out, on entrances where ease-out is required.

## Modal Compliance Matrix

| Modal | ESC | Backdrop | Scroll lock | Focus trap | Focus restore | Enter anim | Exit anim |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `AddChannelsModal` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ *(dead class)* | ❌ |
| ↳ nested platform modal | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ *(Motion)* | ✅ *(Motion)* |
| `CloudflareStreamModal` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ *(dead)* | ❌ |
| `CustomDestinationModal` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ *(dead)* | ❌ |
| `InviteModal` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ *(none at all)* | ❌ |
| `LegalModals` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `OBSIntegrationModal` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ *(dead)* | ❌ |
| `PlansModal` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ *(dead)* | ❌ |
| `QrCodeModal` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ *(imports Motion, unused)* | ❌ |
| `RTMPConfigModal` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ *(dead)* | ❌ |
| `ScreenSharePickerModal` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ *(none)* | ❌ |
| `StreamReportModal` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ *(dead)* | ❌ |
| `ThumbnailEditor` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `VideoQualityPanel` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ *(dead)* | ❌ |
| Create-webinar (`App.tsx:3062`) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ *(dead)* | ❌ |
| Integrations (`App.tsx:3242`) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ *(dead)* | ❌ |

**16 surfaces. 1 partial pass (a nested modal). 111 of 112 cells fail.**

Verification: `grep -rn "Escape" src --include=*.tsx` → **0 files**. `body.style.overflow` → **0**. `aria-modal|role="dialog"` → **0**. `autoFocus|.focus()` → **2**, neither in a modal. `onKeyDown` → **1 file** (`ImagePlaceholder.tsx`).

Z-index is ad-hoc and collision-prone rather than tiered: `z-50`, `z-60`, `z-[100]`, `z-[110]`, `z-[120]`, `z-[150]`, `z-[200]`, `z-[10000]`.

## Async Feedback Matrix

| Action | Pending | Disabled in flight | Optimistic | Success | Error recovery |
|---|:---:|:---:|:---:|:---:|:---:|
| Login (`AuthAndPricing.tsx:176`) | ❌ | ❌ | n/a | ❌ | ⚠️ inline `authError`, on-submit only |
| Register (`:195`) | ❌ | ❌ | n/a | ❌ | ⚠️ inline, on-submit only |
| Checkout (`:1079`) | ✅ `isProcessingCheckout` | ✅ | ❌ | ⚠️ | ❌ |
| **GO LIVE / END LIVE** (`Header.tsx:302`) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Toggle mute (`ControlTray.tsx:367`) | n/a | ❌ | ✅ | ✅ visual | ❌ |
| Toggle camera (`ControlTray.tsx`) | ❌ | ❌ | ✅ | ✅ visual | ❌ |
| Start/stop screen share (`:462`) | ❌ | ❌ | ✅ | ✅ visual | ❌ |
| Toggle recording (`:563`) | ❌ | ❌ | ✅ | ✅ timer | ❌ |
| Save custom destination (`CustomDestinationModal.tsx:378`) | ✅ `'saving'` | ✅ | ❌ | ✅ `'saved'` + 3s reset | ✅ `'error'` |
| Test RTMP connection (`:1127`) | ✅ `isTesting` | ✅ | n/a | ✅ | ✅ |
| Test OBS connection (`OBSIntegrationModal.tsx:490`) | ✅ | ✅ | n/a | ✅ | ⚠️ |
| Test Cloudflare (`CloudflareStreamModal.tsx:302`) | ✅ `isTesting` | ⚠️ | n/a | ✅ | ⚠️ |
| Copy stream key (41 sites) | n/a | n/a | ✅ | ✅ 2s "Copiado!" | ❌ **no `.catch()` — success shown on failure** |
| Media upload (logo/watermark/overlay/bg/audio/clip) (`MediaManagerContext.tsx:334-599`) | ✅ `isCloudUploading` | ⚠️ | ❌ | ⚠️ | ❌ `console.error` only |
| Refresh admin data (`AdminPanel.tsx:152`) | ✅ | ❌ | n/a | ❌ | ❌ |
| Regenerate stream key (`:288`) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Webhook send (`WebhookPanel.tsx:978`) | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ |
| Delete scene / channel / destination | n/a | n/a | ✅ | ✅ | ❌ native `confirm()` |
| Post chat message (`VirtualizedChat.tsx:254`) | ❌ | ❌ | ✅ | ✅ | ❌ |

**Totals: 9 of 19 have a pending state. 5 of 19 disable in flight. 1 of 19 has a real error-recovery path.**

`CustomDestinationModal`'s `useState<'idle' | 'saving' | 'saved' | 'error'>` (`:167`) is the only complete state machine in 33,798 lines. It is the pattern the other 18 should copy verbatim.

---

## Findings

### 1. (P0) Every entrance animation in the app is a dead CSS class

**What.** `animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-*` are utilities from the `tailwindcss-animate` plugin. That plugin is absent from `package.json`, absent from `node_modules`, and never registered in `src/index.css` (which contains only `@import "tailwindcss"` at line 2 — no `@plugin` directive). Tailwind v4 does not ship these utilities natively.

**Evidence.**
```
grep -roh --include=*.tsx "animate-in" src | wc -l   → 67
grep -roh --include=*.tsx "fade-in" src | wc -l      → 55
ls node_modules/tailwindcss-animate                  → not found
grep -n "@plugin" src/index.css                      → (no match)
```
`src/App.tsx:2988` — a modal that intends to scale in:
```jsx
<div className="bg-[#16191E] border border-slate-800 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
```
`src/App.tsx:2020` — the mobile sidebar drawer:
```jsx
<div className="absolute inset-y-0 left-0 w-[280px] z-[99] ... animate-in slide-in-from-left duration-300">
```
The `duration-300` resolves (it is a real Tailwind utility) but has no animation to apply itself to.

**Why it feels wrong.** A drawer that is supposed to slide in from the left instead teleports. There is no motion to interpret, so the user gets no spatial cue about where the panel came from — which is exactly the "preventing jarring changes" purpose animation exists to serve. Worse, this is invisible in code review: the classes read as correct.

**Fix.** Hand-roll the four utilities in `src/index.css` rather than adding a dependency. This is ~25 lines and removes the failure mode permanently.

```css
/* src/index.css — after the existing keyframes block (line 130) */

@keyframes enter {
  from {
    opacity: var(--enter-opacity, 1);
    transform: translate3d(var(--enter-x, 0), var(--enter-y, 0), 0)
               scale3d(var(--enter-scale, 1), var(--enter-scale, 1), 1);
  }
}

.animate-in {
  animation: enter 200ms cubic-bezier(0.23, 1, 0.32, 1) both;
}

.fade-in            { --enter-opacity: 0; }
.zoom-in-95         { --enter-scale: 0.95; }
.slide-in-from-top-1    { --enter-y: -0.25rem; }
.slide-in-from-top-2    { --enter-y: -0.5rem; }
.slide-in-from-top-3    { --enter-y: -0.75rem; }
.slide-in-from-bottom-1 { --enter-y: 0.25rem; }
.slide-in-from-bottom-2 { --enter-y: 0.5rem; }
.slide-in-from-right    { --enter-x: 100%; }
.slide-in-from-right-2  { --enter-x: 0.5rem; }
.slide-in-from-left     { --enter-x: -100%; }
```

Note `cubic-bezier(0.23, 1, 0.32, 1)` — a strong ease-out — rather than the plugin's default. Entrances start fast. And `both` fill mode so the element holds its from-state before the animation starts, preventing a flash of the final position.

For the two full-drawer slides (`App.tsx:2020`, `:2044`) override to the iOS drawer curve, which has the right weight for a large panel:
```css
.slide-in-from-left, .slide-in-from-right {
  animation-duration: 300ms;
  animation-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
}
```

### 2. (P0) No `prefers-reduced-motion`, guarding 127 infinite animations

**What.** `grep -rn "prefers-reduced-motion\|useReducedMotion" src` returns **nothing**. Meanwhile the app runs 127 perpetual animations: 78 `animate-pulse`, 17 `animate-ping`, 22 `animate-spin`, 6 `animate-bounce`, plus `ticker-scroll` (×2), `subtle-shimmer` (4s), `ticker-badge-glow` (3s), `pulse-blink` (1.5s).

**Evidence.** `src/components/StudioPreview.tsx` alone carries **24** `animate-pulse`/`animate-ping` instances — pulsing over the live video canvas, continuously, for the entire broadcast. `src/index.css:104-117`:
```css
@keyframes ticker-badge-glow {
  0%, 100% { opacity: 1;    filter: drop-shadow(0 0 2px rgba(255,255,255,0.2)); }
  50%      { opacity: 0.92; filter: drop-shadow(0 0 6px rgba(255,255,255,0.45)); }
}
.animate-ticker-badge { animation: ticker-badge-glow 3s ease-in-out infinite; }
```

**Why it feels wrong.** Two separate harms. For vestibular-sensitive users, 127 unstoppable animations is a genuine accessibility failure with no escape hatch. For everyone else it is an attention tax: this is a tool you stare at for a two-hour broadcast, and the periphery never stops moving. An `opacity` oscillation between 1 and 0.92 (an 8% swing) is not communicating anything — it is below the threshold where a user can decode a state change but above the threshold where the eye keeps being drawn back to it. And the `filter: drop-shadow` in that keyframe forces a repaint every frame, forever, on a surface that also decodes video.

**Fix.** Reduced motion means *fewer and gentler*, not zero — keep the ticker readable (it carries broadcast content), keep the REC blink (it carries state), kill everything decorative.

```css
/* src/index.css — append */
@media (prefers-reduced-motion: reduce) {
  /* Kill decorative perpetual motion */
  .animate-shimmer-sweep,
  .animate-ticker-badge,
  .animate-bounce,
  .animate-ping {
    animation: none !important;
  }

  /* animate-pulse: keep a static mid-opacity so "live" still reads */
  .animate-pulse {
    animation: none !important;
    opacity: 0.85;
  }

  /* Ticker still needs to convey its text — slow it, don't stop it */
  .animate-ticker,
  .animate-ticker-left,
  .animate-ticker-right {
    animation-duration: calc(var(--ticker-duration, 15s) * 2);
  }

  /* Entrances: fade only, no movement */
  .animate-in {
    --enter-x: 0 !important;
    --enter-y: 0 !important;
    --enter-scale: 1 !important;
    animation-duration: 120ms;
  }

  /* Spinners stay — they encode pending state — but slow them */
  .animate-spin { animation-duration: 1.8s; }

  /* Global transition damping */
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }

  /* Exempt: REC blink is load-bearing state */
  .animate-blink {
    animation: pulse-blink 1.5s ease-in-out infinite !important;
    animation-iteration-count: infinite !important;
  }
}
```

For the Motion side, gate the scene transitions in `StudioPreview.tsx`:
```jsx
import { useReducedMotion } from 'motion/react';

const shouldReduceMotion = useReducedMotion();

// StudioPreview.tsx:1743 — slide variant
} else if (transitionType === 'slide') {
  animationProps = shouldReduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 },
        transition: { duration: 0.12 } }
    : { initial: { x: '100%', opacity: 0.5 }, animate: { x: 0, opacity: 1 },
        exit: { x: '-100%', opacity: 0.5 },
        transition: { duration: durationSecs, ease: [0.32, 0.72, 0, 1] } };
}
```

### 3. (P0) No modal mechanics whatsoever

**What.** Across 16 overlay surfaces: no ESC handler, no backdrop-click-to-close, no body scroll lock, no focus trap, no focus restore.

**Evidence.** Every modal root is a bare `<div>` with no handlers:
```jsx
// src/components/CloudflareStreamModal.tsx:54
<div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
```
```jsx
// src/components/OBSIntegrationModal.tsx:195
<div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200" id="obs-integration-modal">
```
The only `onClick={onClose}` in each file sits on the header X button (`CloudflareStreamModal.tsx:79`) and a footer button (`:587`) — never on the overlay.

`grep -rn "Escape" src --include=*.tsx` → 0 files. `grep -rn "body.style.overflow" src` → 0.

**Why it feels wrong.** ESC-to-dismiss is the most deeply learned interaction on the web; an overlay that ignores it reads as broken or frozen, especially one covering the studio mid-broadcast. Missing scroll lock means the page behind scrolls under the modal when the user spins the wheel — the classic tell of an overlay bolted on rather than built. And with no focus restore, dismissing a modal drops the keyboard user back at the top of the document.

**Fix.** One hook, applied at 16 call sites. This handles all five concerns and, critically, is the prerequisite for exit animations (Finding 4 of *The Ten Details*).

```ts
// src/hooks/useModalBehavior.ts  (new file)
import { useEffect, useRef } from 'react';

export function useModalBehavior(isOpen: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Remember where focus was
    restoreRef.current = document.activeElement as HTMLElement;

    // 2. Lock body scroll without layout shift
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;

    // 3. Move focus into the panel
    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter(el => el.offsetParent !== null);

    requestAnimationFrame(() => (focusables()[0] ?? panelRef.current)?.focus());

    // 4. ESC + focus trap
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const els = focusables();
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPad;
      restoreRef.current?.focus();   // 5. Restore focus
    };
  }, [isOpen, onClose]);

  // Backdrop click — only when the press *started* on the backdrop,
  // so a drag that ends outside the panel doesn't close it.
  const downOnBackdrop = useRef(false);
  const backdropProps = {
    onMouseDown: (e: React.MouseEvent) => { downOnBackdrop.current = e.target === e.currentTarget; },
    onMouseUp:   (e: React.MouseEvent) => {
      if (downOnBackdrop.current && e.target === e.currentTarget) onClose();
      downOnBackdrop.current = false;
    },
  };

  return { panelRef, backdropProps };
}
```

Call site, e.g. `CloudflareStreamModal.tsx:54`:
```jsx
const { panelRef, backdropProps } = useModalBehavior(isOpen, onClose);
if (!isOpen) return null;

return (
  <div
    {...backdropProps}
    role="presentation"
    className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
  >
    <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="cf-modal-title" tabIndex={-1}
         className="animate-in zoom-in-95 ...">
```

The `onMouseDown`/`onMouseUp` pairing is the detail that matters: a naive `onClick` on the backdrop closes the modal when a user selects text inside the panel and releases the mouse outside it. Nobody notices the fix; everybody notices the bug.

### 4. (P0) `AudioVUMeter` re-renders React ~60×/second during a live broadcast

**What.** The analyser loop calls `setLevel` on every animation frame, and the smoothing function guarantees the value never settles.

**Evidence.** `src/components/AudioVUMeter.tsx:35-50`:
```js
const draw = () => {
  if (!analyser) return;
  analyser.getByteFrequencyData(dataArray);
  let maxVal = 0;
  for (let i = 0; i < dataArray.length; i++) {
    if (dataArray[i] > maxVal) maxVal = dataArray[i];
  }
  const targetLevel = (maxVal / 255) * 100;
  setLevel(prev => prev * 0.4 + targetLevel * 0.6);   // ← React state, every frame
  animationFrameId = requestAnimationFrame(draw);
};
```
That drives 15 nodes, each carrying a transition (`:127`):
```jsx
className={`flex-1 h-full rounded-[1px] transition-all duration-75 ${isLit ? litBg : unlitBg}`}
```

**Why it feels wrong.** Three compounding problems. First, an exponential smoother (`prev*0.4 + target*0.6`) asymptotically approaches but never equals its target, so React re-renders every single frame even in silence. Second, `transition-all duration-75` on a class that changes every ~16ms means the transition is perpetually retargeted and never completes — you are paying for a transition that renders as a smear. Third, `AudioVUMeter` is mounted inside `ControlTray` (`ControlTray.tsx:7`), which sits in the studio chrome — so a 60Hz React render loop runs alongside video decode, canvas compositing, and the chat. This is the most expensive idle component in the app.

**Fix.** Keep the value in a ref, write to the DOM through a CSS custom property, and let CSS do the segment lighting. Zero React renders.

```jsx
// src/components/AudioVUMeter.tsx
const barsRef = useRef<HTMLDivElement>(null);
const levelRef = useRef(0);

// inside draw():
const targetLevel = (maxVal / 255) * 100;
levelRef.current = levelRef.current * 0.4 + targetLevel * 0.6;
// Write once per frame, to one element — no React involved
barsRef.current?.style.setProperty('--vu', String(Math.round(levelRef.current / 100 * 15)));
animationFrameId = requestAnimationFrame(draw);
```
```jsx
<div ref={barsRef} className="vu-bars flex items-center gap-[2px] h-2 ...">
  {Array.from({ length: 15 }).map((_, idx) => (
    <div key={idx} className="vu-seg flex-1 h-full rounded-[1px]" style={{ '--i': idx } as React.CSSProperties} />
  ))}
</div>
```
```css
/* src/index.css */
.vu-seg {
  background: var(--vu-off, rgb(6 78 59 / 0.4));
  /* No transition: at 60fps the value IS the animation. */
}
.vu-bars { --vu: 0; }
.vu-seg:nth-child(-n + 9)  { --vu-on: #10b981; --vu-off: rgb(6 78 59 / 0.4); }
.vu-seg:nth-child(n + 10):nth-child(-n + 12) { --vu-on: #fbbf24; --vu-off: rgb(69 26 3 / 0.4); }
.vu-seg:nth-child(n + 13)  { --vu-on: #ef4444; --vu-off: rgb(69 10 10 / 0.3); }
```
Light a segment when `--i < --vu` using a container-level approach, or simply keep the JS write per-segment on the ref — either way the React tree never re-renders.

Note the deliberate removal of the transition. Emil's rule about interruptibility cuts the other way here: when a value updates at display refresh rate, the *sampling* is the animation. Adding a 75ms transition on top only adds lag between the sound and the bar.

**Also (`AudioVUMeter.tsx:67-96`):** when no real stream is present, the component runs a `setInterval` at 100ms generating **fake speech levels** via `Math.random()`. A VU meter that bounces convincingly when no microphone is connected is a state-legibility lie on a broadcast tool's most trusted indicator. When there is no audio track, render the meter dark and disabled.

### 5. (P0) GO LIVE has no press guard, no pending state, and no confirmation

**What.** The single most consequential control in the product is a plain toggle.

**Evidence.** `src/components/Header.tsx:300-321`:
```jsx
<button
  type="button"
  onClick={onToggleLive}
  id="btn-header-go-live"
  className={`... transition-all cursor-pointer shadow-md hover:scale-[1.03] active:scale-95 shrink-0 ${
    isLive
      ? 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-500 shadow-red-600/30 animate-pulse'
      : ...
  }`}
  title={isLive ? "Encerrar transmissão ao vivo" : ...}
>
  {isLive ? (<><span className="w-2 h-2 rounded-full bg-white animate-ping"></span><span>END LIVE ({formatHeaderTime(liveTime)})</span></>)
          : (<span>GO LIVE</span>)}
</button>
```
No `disabled`, no `aria-busy`, no in-flight lock, no confirm on END LIVE.

**Why it feels wrong.** Going live is a network handshake with N destinations; it takes seconds. During that window the button is fully live and a second click fires `onToggleLive` again. Ending a broadcast is irreversible and one click away with no confirmation. And while live, the entire button runs `animate-pulse` (a 2s opacity oscillation) *plus* an `animate-ping` dot — two infinite animations on the same element for the whole broadcast. A pulsing, dimming button is the visual language of *disabled* or *loading*; using it for "active" inverts the convention on the control that most needs to be unambiguous.

**Fix.** A three-state machine, a hold-to-confirm END LIVE, and static live styling.

```jsx
const [liveState, setLiveState] = useState<'idle'|'starting'|'live'|'stopping'>('idle');
const busy = liveState === 'starting' || liveState === 'stopping';

<button
  type="button"
  onClick={handleToggleLive}
  disabled={busy}
  aria-busy={busy}
  className={`... transition-transform duration-[160ms] ease-out
    active:scale-[0.97] disabled:opacity-60 disabled:cursor-wait
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    focus-visible:ring-offset-[#0F1115] focus-visible:ring-white
    ${isLive
      ? 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-500 shadow-red-600/30'  /* no animate-pulse */
      : ...}`}
>
  {liveState === 'starting' ? (<><Spinner/> CONECTANDO…</>)
   : liveState === 'stopping' ? (<><Spinner/> ENCERRANDO…</>)
   : isLive ? (<><span className="w-2 h-2 rounded-full bg-white animate-pulse"/> END LIVE ({formatHeaderTime(liveTime)})</>)
   : <span>GO LIVE</span>}
</button>
```
Keep exactly one `animate-pulse` — on the 2px dot, not the button. That is the whole point of a status dot.

For END LIVE, hold-to-confirm is better than a modal here: it keeps the action on the same control, requires deliberate intent, and cannot be dismissed by a stray Enter keypress mid-broadcast. This is Emil's asymmetric-timing pattern — slow while the user decides, snappy when the system responds:
```css
.end-live-fill {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 200ms ease-out;      /* release: fast */
}
.end-live:active .end-live-fill {
  clip-path: inset(0 0 0 0);
  transition: clip-path 1200ms linear;        /* press: deliberate */
}
```

### 6. (P0) 25 native `alert()` / `confirm()` calls freeze the broadcast

**What.** The app uses blocking browser dialogs for confirmation and error reporting.

**Evidence.**
```
grep -rn "\balert(\|\bconfirm(" src --include=*.tsx | wc -l   → 25
  10  src/components/LeftSidebar.tsx
   3  src/components/WebhookPanel.tsx
   3  src/components/SuperAdminPanel.tsx
   3  src/components/BillingDashboard.tsx
   2  src/components/ControlTray.tsx
   ... 4 more files
```

**Why it feels wrong.** `window.alert` and `window.confirm` block the JavaScript main thread until dismissed. In a broadcast tool that means the chat stops updating, the VU meter freezes, the scene compositor stalls, and any rAF loop halts — while the stream keeps running. Two of these are in `ControlTray.tsx`, the studio's primary control surface. Beyond the technical harm, a system dialog is unstyleable, unbranded, untranslatable through the app's own i18n, and cannot be dismissed with the app's own affordances.

**Fix.** There is no toast system in this app (`grep -rn "toast\|Toaster" src` → no library, no component). Add one — Sonner is the obvious pick and requires a single `<Toaster />` mount — and replace destructive `confirm()` with an in-app confirmation that reuses the `useModalBehavior` hook from Finding 3.

```jsx
// main.tsx or App.tsx root
import { Toaster, toast } from 'sonner';
<Toaster position="bottom-right" theme="dark" closeButton
         toastOptions={{ duration: 4000 }} />

// Replace: alert('Falha ao salvar o webhook');
toast.error('Falha ao salvar o webhook', {
  action: { label: 'Tentar novamente', onClick: () => retrySave() }
});
```
The `action` is the part that matters — an alert can only be acknowledged; a toast can carry the recovery path, which is what the Async Feedback Matrix shows is missing in 18 of 19 flows.

### 7. (P1) Zero `focus-visible:`; 37 `outline-none` with nothing put back

**What.** The app removes the browser's focus ring 139 times and replaces it 102 times with a border/ring that only responds to `:focus`, never `:focus-visible`. 37 removals have no replacement at all.

**Evidence.**
```
outline-none total ............................. 139
  with focus:border or focus:ring on same line .. 102
  with NO replacement ............................ 37
focus-visible: (anywhere) ......................... 0
```
Naked removals cluster in `CloudflareStreamModal.tsx` (11) and `AuthAndPricing.tsx` (11). E.g. `AuthAndPricing.tsx:824`:
```jsx
className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none"
```
That is a checkout form field with the focus ring deleted and nothing in its place.

Even the 102 "replaced" cases use `:focus`, e.g. `App.tsx:3122`:
```jsx
className="... focus:outline-none focus:border-blue-500 transition-all"
```

**Why it feels wrong.** Two distinct defects. (a) `:focus` fires on mouse click, so clicking an input leaves a persistent blue border that reads as an error or an unsaved-changes state — this is precisely why `:focus-visible` was specified. (b) On the 37 naked cases and on all 530 buttons, a keyboard user has no idea where they are. And `focus:border-blue-500` changes only the border *color*, not its width, so on a surface that already uses blue borders for selection the focus indicator is ambiguous.

Lane A owns whether elements are reachable; this is about the ring itself being absent, mistimed, and invisible on the light theme (where `border-slate-800` is overridden to `#E2E8F0` by `index.css:193-208` but the blue focus border is not).

**Fix.** One global rule, themed, using `:focus-visible` so it never appears on mouse click. Add to `src/index.css`:

```css
/* Global focus ring — keyboard only, both themes */
:where(button, [role="button"], a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])):focus-visible {
  outline: 2px solid var(--focus-ring, #60A5FA);
  outline-offset: 2px;
  border-radius: inherit;
}

:root { --focus-ring: #60A5FA; }                       /* dark theme */
.theme-light, [data-theme="light"] { --focus-ring: #1D4ED8; }  /* light theme */

/* Kill the mouse-click border artifact: scope the existing pattern to keyboard */
:where(input, textarea, select):focus:not(:focus-visible) {
  outline: none;
}
```
`outline` rather than `box-shadow` or `border` because outline does not participate in layout, follows `border-radius` automatically in modern browsers, and cannot be clipped by an ancestor's `overflow: hidden` — which matters here given how many panels use `overflow-hidden` with rounded corners.

Then delete the 37 naked `focus:outline-none` occurrences; the `:where()` selector has zero specificity so it will not fight existing utilities, but an explicit `focus:outline-none` on the element still wins and must go.

### 8. (P1) Press feedback on 6.6% of buttons

**What.** 530 `<button>` elements, 35 `active:` utilities.

**Evidence.** `BillingDashboard.tsx` — 38 buttons, **0** `active:`. `CustomDestinationModal.tsx` — 23 buttons, **0**. `CloudflareStreamModal.tsx` — 21 buttons, **0**. `WebhookPanel.tsx` — 21 buttons, **0**. `LeftSidebar.tsx` — **131 buttons, 3** `active:`.

The counter-example, `ControlTray.tsx:368`:
```jsx
className={`w-7.5 h-7.5 ... rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${...}`}
```

**Why it feels wrong.** A button that does not move under the finger does not confirm it heard you. On a fast network you never notice; on a slow one you click twice. The app compensates with `cursor-pointer` on 485 elements — a pointer change is an affordance *promise*, not a *response*. The gap between 907 hover states and 35 press states is the single clearest measure of where the polish stopped.

**Fix.** A base class in `index.css` applied to the button primitives, rather than 495 individual edits.

```css
@utility pressable {
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);

  &:active:not(:disabled) {
    transform: scale(0.97);
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

/* Only give hover-scale to devices that truly hover */
@media (hover: hover) and (pointer: fine) {
  .pressable:hover:not(:disabled) { transform: scale(1.02); }
}
```
`0.97` rather than the codebase's existing `scale-95`: at the small sizes used here (28–36px round buttons) a 5% compression reads as a glitch, while 3% reads as a press. Note that `scale()` scales children too, so the icon compresses with the button — which is what makes it feel physical.

Also fix `AuthAndPricing.tsx:595`, which uses `active:scale-[0.99]` — a 1% change is below the perceptual threshold and is effectively no feedback at all.

### 9. (P1) The live video stage animates `width` for 500ms

**What.** When a lateral banner or vertical QR overlay activates, the container holding the live video feed animates its width.

**Evidence.** `src/components/StudioPreview.tsx:3005`:
```jsx
<div className={`relative h-full z-10 flex items-center justify-center transition-all duration-500 ease-in-out ${
  isLateralActive ? 'w-[calc(100%-220px)] sm:w-[calc(100%-250px)] mr-auto ml-2' : 'w-full'
}`}>
```
Same pattern at `ProgramMonitorView.tsx:264` with `duration-300`.

**Why it feels wrong.** `width` is a layout property. Animating it forces layout → paint → composite on every frame for 500ms, and every descendant re-lays-out with it — including the `<video>` element, which must be re-scaled each frame. This happens on the program output during a live broadcast, which is the one surface in the app where a dropped frame is visible to the audience. It also exceeds the 400ms ceiling for a user-initiated change.

**Fix.** Give the stage a stable width and translate it, so only the compositor is involved.

```jsx
<div
  className="relative h-full z-10 flex items-center justify-center
             transition-transform duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]
             will-change-transform"
  style={{
    width: '100%',
    transform: isLateralActive
      ? 'translateX(-110px) scaleX(calc(1 - 220 / var(--stage-w, 1280)))'
      : 'none',
  }}
>
```
If the `scaleX` distortion on video is unacceptable (it will be — video must not stretch), keep the width static and instead translate the *banner* into place over a stage that was always sized for it:
```jsx
{/* Stage: fixed at the narrower width whenever lateral mode is available */}
<div className="relative h-full z-10 w-[calc(100%-220px)] mr-auto ml-2" />
{/* Banner slides in over the reserved gutter */}
<div className={`absolute right-0 w-[220px] transition-transform duration-[280ms]
                 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform
                 ${isLateralActive ? 'translate-x-0' : 'translate-x-full'}`} />
```
Reserving the space and sliding content into it is the standard fix: no layout runs, the video never re-scales, and 280ms with the iOS drawer curve reads as more deliberate than 500ms of `ease-in-out` did.

### 10. (P1) `mode="wait"` doubles every scene switch

**What.** The scene compositor waits for the outgoing scene's exit to finish before starting the incoming scene's enter.

**Evidence.** `src/components/StudioPreview.tsx:3006-3017`:
```jsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeFeeds.length === 0 ? 'empty' : `${layout}-${activeFeeds.map(f => f.id).join(',')}`}
    initial={animationProps.initial}
    animate={animationProps.animate}
    exit={animationProps.exit}
    transition={animationProps.transition}
```
With `transitionDuration = 300` (`App.tsx:598`), `durationSecs` = 0.3 (`:1727`), so a switch costs 300ms out + 300ms in = **600ms**, during which the program feed shows neither scene fully.

**Why it feels wrong.** A scene cut in a broadcast tool is a performance action — the operator hits it on a beat. 600ms of dead air, with a blank frame in the middle, is both over Emil's 400ms ceiling and visible to the audience. `mode="wait"` exists for cases where two elements must not overlap; a crossfade is precisely the case where they *should*.

**Fix.** Remove `mode="wait"` so exit and enter overlap, and drop the per-half duration accordingly.
```jsx
<AnimatePresence mode="sync" initial={false}>
```
`initial={false}` additionally suppresses the enter animation on first mount — the studio should not fade its first scene in on load.

With overlap, the total is 300ms rather than 600ms. Also correct the easings at `:1730-1755`: `easeInOut` is wrong for a crossfade (use `linear`, since opacity crossfades read as uneven with eased curves — the midpoint dips), and the zoom variant's exit should be `easeIn` (leaving) while its enter is `easeOut` (arriving):
```js
// StudioPreview.tsx:1729 — fade
transition: { duration: durationSecs, ease: 'linear' }

// :1748 — slide
transition: { duration: durationSecs, ease: [0.32, 0.72, 0, 1] }

// :1755 — zoom
transition: { duration: durationSecs, ease: [0.23, 1, 0.32, 1] }
```

### 11. (P1) Dragging re-renders a 4206-line component per pointer move

**What.** The speaker-card, banner, and resize drags all set React state on every `mousemove`/`touchmove`.

**Evidence.** `src/components/StudioPreview.tsx:634-645`:
```js
const handleMove = (moveEvt: MouseEvent | TouchEvent) => {
  const rect = getStageRect();
  if (!rect) return;
  const currentX = 'touches' in moveEvt ? moveEvt.touches[0].clientX : moveEvt.clientX;
  const currentY = 'touches' in moveEvt ? moveEvt.touches[0].clientY : moveEvt.clientY;
  const deltaX = ((currentX - startX) / rect.width) * 100;
  const deltaY = ((currentY - startY) / rect.height) * 100;
  setSpeakerCardPos({                                    // ← full component re-render
    x: Math.max(1, Math.min(80, initialX + deltaX)),
    y: Math.max(1, Math.min(74, initialY + deltaY))
  });
};
```

**Why it feels wrong.** On a 120Hz trackpad this fires ~120×/second, and each one re-renders `StudioPreview` — a component that also hosts the video elements, the 24 pulsing indicators, the chat widget, and the ticker. Dragging a name card around the stage should be the smoothest interaction in the app; instead it is the heaviest. Three further gaps: (a) `Math.max(1, Math.min(80, …))` is a hard wall — Emil's point that real objects decelerate rather than stopping dead; (b) no `setPointerCapture`, so the drag relies on window listeners; (c) `moveEvt.touches[0]` is re-read every frame, so if the user rests a second finger and lifts the first, `touches[0]` becomes the *other* finger and the card teleports.

**Fix.** Write transforms directly to the node during the drag; commit to React state once on release.

```js
const startDragSpeakerCard = (e: React.PointerEvent) => {
  e.stopPropagation();
  if (e.isPrimary === false) return;              // (c) ignore secondary touches
  const node = cardRef.current;
  if (!node) return;

  node.setPointerCapture(e.pointerId);            // (b) real pointer capture
  const startX = e.clientX, startY = e.clientY;
  const initialX = speakerCardPos.x, initialY = speakerCardPos.y;
  let latest = { x: initialX, y: initialY };

  // (a) rubber-band past the bounds instead of a hard stop
  const damp = (v: number, lo: number, hi: number) =>
    v < lo ? lo - (lo - v) * 0.35 :
    v > hi ? hi + (v - hi) * 0.35 : v;

  const onMove = (ev: PointerEvent) => {
    if (ev.pointerId !== e.pointerId) return;
    const rect = getStageRect(); if (!rect) return;
    latest = {
      x: damp(initialX + ((ev.clientX - startX) / rect.width) * 100, 1, 80),
      y: damp(initialY + ((ev.clientY - startY) / rect.height) * 100, 1, 74),
    };
    // Direct style write — no React render
    node.style.transform = `translate3d(${latest.x - initialX}%, ${latest.y - initialY}%, 0)`;
  };

  const onUp = (ev: PointerEvent) => {
    if (ev.pointerId !== e.pointerId) return;
    node.style.transform = '';
    node.style.transition = 'transform 220ms cubic-bezier(0.23,1,0.32,1)';
    setSpeakerCardPos({                            // one render, on release
      x: Math.max(1, Math.min(80, latest.x)),
      y: Math.max(1, Math.min(74, latest.y)),
    });
    node.releasePointerCapture(e.pointerId);
    node.removeEventListener('pointermove', onMove);
    node.removeEventListener('pointerup', onUp);
  };

  node.addEventListener('pointermove', onMove);
  node.addEventListener('pointerup', onUp);
};
```
Pointer events replace the parallel mouse/touch handler pairs at `:2492-2493`, `:2612-2613`, `:3407-3408`, `:3469-3470` with one path. Add `touchAction: 'none'` to each draggable (currently only at `:2472`) so the browser does not claim the gesture for scrolling.

### 12. (P1) 41 clipboard copies, zero error handling — success is shown on failure

**What.** Every copy affordance reports success unconditionally.

**Evidence.** `src/components/CloudflareStreamModal.tsx:30-34`:
```js
const copyToClipboard = (text: string, fieldName: string) => {
  navigator.clipboard.writeText(text);      // returns a Promise; never awaited, never caught
  setCopiedField(fieldName);
  setTimeout(() => setCopiedField(null), 2000);
};
```
```
grep -rn "clipboard.writeText" src --include=*.tsx | wc -l  → 41
... of which have a .catch or try/catch                     → 0
```
Bare fire-and-forget calls at `App.tsx:3359`, `:3378`, `AdminPanel.tsx:231`, `:255`, `AuthAndPricing.tsx:325`, `:444`, and 35 more.

**Why it feels wrong.** `navigator.clipboard.writeText` rejects on a non-secure origin, when the document is not focused, or when the permission is denied. In every one of those cases the UI still flips to "Copiado!" with a green check. The user pastes an RTMP stream key into OBS and gets whatever was previously on their clipboard. A confirmation that can be wrong is worse than no confirmation, because it stops the user from checking.

**Fix.**
```js
const copyToClipboard = async (text: string, fieldName: string) => {
  try {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  } catch {
    // Fallback for non-secure contexts
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (!ok) throw new Error();
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Não foi possível copiar. Selecione o texto e use Ctrl+C.');
    }
  }
};
```
Also worth noting for the success state: 2000ms is right. Under ~1200ms users miss the confirmation on a glance away; over ~3000ms it starts reading as a persistent state rather than an acknowledgement.

### 13. (P1) `animate-spin` on the button instead of the icon

**What.** Three refresh controls spin their entire `<button>` — border, padding, label and all.

**Evidence.** `src/components/AdminPanel.tsx:152`:
```jsx
className={`p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all text-gray-400 hover:text-white ${isRefreshing ? 'animate-spin' : ''}`}
```
Identical bug at `SuperAdminPanel.tsx:412`. Worse at `SuperAdminAnalytics.tsx:170`, where the spinning element is a wide button with a text label:
```jsx
className={`px-4 py-2 ... rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shrink-0 ${isRefreshing ? 'animate-spin' : ''}`}
```

**Why it feels wrong.** A rotating rounded rectangle with text tumbling inside it is unmistakably a bug. It also makes the button unclickable-feeling mid-rotation because the hit target is moving.

**Fix.** Move the class to the icon, which is what the sibling implementations already do correctly (`CustomDestinationModal.tsx:1174`, `OBSIntegrationModal.tsx:490`):
```jsx
// AdminPanel.tsx:152
className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors text-gray-400 hover:text-white disabled:opacity-60"
disabled={isRefreshing}
aria-busy={isRefreshing}
>
  <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
```
Related, `StudioPreview.tsx:3114`:
```jsx
<Clock size={20} className="animate-spin duration-1000" style={{ animationDuration: '4s' }} />
```
`duration-1000` is a *transition-duration* utility and has no effect on a CSS animation; the inline style is doing all the work. Delete `duration-1000` and use `[animation-duration:4s]` so the value stays in the class list where it can be read.

### 14. (P1) Login and register have no async lifecycle at all

**What.** Both handlers are synchronous and call `onAuthSuccess` inline.

**Evidence.** `src/components/AuthAndPricing.tsx:176-193`:
```js
const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();
  if (!email || !password) { setAuthError('Por favor, preencha todos os campos.'); return; }
  const isSuperAdmin = email.trim().toLowerCase() === 'mgdlms@gmail.com';
  const userRole = isSuperAdmin ? 'super-admin' : 'client';
  onAuthSuccess({ email, name: ..., role: userRole, plan: 'Free Trial', isExpired: false, trialDays: 30 });
};
```
Submit button, `:520-525` — no `disabled`, no pending branch, and no `active:` state:
```jsx
<button type="submit" className="w-full py-3 bg-[#4683E0] hover:bg-blue-600 rounded-xl text-sm font-bold transition-all text-white flex items-center justify-center gap-2">
  Entrar no Estúdio <LogIn size={16} />
</button>
```

**Why it feels wrong.** This is the first interaction anyone has with the product. When Firebase auth is wired in behind it, the button will accept repeat clicks during the round trip and give no sign it is working. Validation fires only on submit, so a user with a typo'd email fills the whole form before learning. And the app's own good pattern already exists 550 lines away — `:1079` correctly does `disabled={isProcessingCheckout || ...}` with `disabled:opacity-50` and a spinner at `:1084`.

**Fix.** Lift the checkout pattern up to auth, and move validation to on-blur-after-first-submit — the timing that avoids nagging mid-typing while still catching errors before submission:

```jsx
const [authState, setAuthState] = useState<'idle'|'pending'|'error'>('idle');
const [touched, setTouched] = useState(false);

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setTouched(true);
  if (!email || !password) { setAuthError('Por favor, preencha todos os campos.'); return; }
  setAuthState('pending'); setAuthError('');
  try {
    await signIn(email, password);
    onAuthSuccess({ ... });
  } catch (err) {
    setAuthState('error');
    setAuthError('E-mail ou senha incorretos.');
  }
};

<button
  type="submit"
  disabled={authState === 'pending'}
  aria-busy={authState === 'pending'}
  className="w-full py-3 bg-[#4683E0] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-wait
             rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2
             transition-transform duration-[160ms] ease-out active:scale-[0.97]
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
>
  {authState === 'pending'
    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Entrando…</>
    : <>Entrar no Estúdio <LogIn size={16}/></>}
</button>
```
Only `onBlur` after `touched` is true should surface field errors — validating on every keystroke punishes the user mid-thought, validating only on submit makes them fix errors one round-trip at a time.

### 15. (P1) `scale: 0` on the radial wipe

**What.** The radial scene transition grows from literal nothing.

**Evidence.** `src/components/StudioPreview.tsx:2976-2982`:
```jsx
<motion.div
  initial={{ scale: 0, borderRadius: '100%' }}
  animate={{ ... }}
  transition={{ duration: transitionDuration / 2000, ease: 'easeInOut' }}
```

**Why it feels wrong.** Emil's rule: nothing in the real world appears from nothing. At `scale: 0` the first several frames render a sub-pixel element, so the animation appears to begin late and then rush — the perceived timing does not match the specified duration.

**Fix.** Start from a visible seed and fade in alongside:
```jsx
initial={{ scale: 0.12, opacity: 0, borderRadius: '100%' }}
animate={{ scale: 2.4, opacity: 1, borderRadius: '100%' }}
transition={{ duration: transitionDuration / 2000, ease: [0.23, 1, 0.32, 1] }}
```
Also note `borderRadius` is in the animated set — animating `border-radius` triggers paint. Since it is constant at `100%` here, move it to `style` or a class so Motion does not include it in the animation.

### 16. (P1) Multi-touch hijacks the drag

**What.** Covered mechanically in Finding 11; calling out separately because it is a distinct, reproducible defect.

**Evidence.** `src/components/StudioPreview.tsx:637-638`:
```js
const currentX = 'touches' in moveEvt ? moveEvt.touches[0].clientX : moveEvt.clientX;
const currentY = 'touches' in moveEvt ? moveEvt.touches[0].clientY : moveEvt.clientY;
```
`touches[0]` is re-evaluated on every move. Rest a second finger on the stage, lift the first, and `touches[0]` now refers to a different finger at a different position — the card jumps by the distance between them.

**Fix.** Either the `pointerId` guard in Finding 11, or if staying on touch events, latch the identifier:
```js
const touchId = 'touches' in e ? e.touches[0].identifier : null;
const pick = (ev: TouchEvent) =>
  Array.from(ev.touches).find(t => t.identifier === touchId);
```

### 17. (P1) Scene transitions drop input and leak timers

**What.** `useSceneTransition` refuses new transitions while one is running, and its nested `setTimeout`s are never cleared.

**Evidence.** `src/hooks/useSceneTransition.ts:26`:
```js
if (isTransitioning) return;    // input silently discarded
```
`:40-50`:
```js
setTimeout(() => {
  onSceneChange();
  setTransitionStage('revealing');
  setTimeout(() => {
    setIsTransitioning(false);
    setTransitionStage('idle');
  }, activeDuration / 2);
}, activeDuration / 2);
```
No handle is stored, no cleanup effect exists, and the hook returns without an unmount guard.

**Why it feels wrong.** During a broadcast an operator switches scenes rapidly. With a 300ms transition, any second press inside that window is swallowed — the operator presses, nothing happens, and they press again, which lands after the window and produces a double-switch. Emil's point about springs maintaining velocity applies to the state machine too: an interrupted transition should retarget, not be ignored. Separately, if the studio unmounts mid-transition (navigating out, ending the session), both timers still fire and call `setState` on an unmounted component.

**Fix.**
```ts
const timers = useRef<number[]>([]);

useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

const triggerTransition = useCallback((onSceneChange, customOptions) => {
  // Retarget instead of dropping: cancel the in-flight transition and start fresh.
  timers.current.forEach(clearTimeout);
  timers.current = [];

  const activeDuration = customOptions?.duration ?? duration;
  // ... set colour/type as before

  setIsTransitioning(true);
  setTransitionStage('covering');

  timers.current.push(window.setTimeout(() => {
    onSceneChange();
    setTransitionStage('revealing');
    timers.current.push(window.setTimeout(() => {
      setIsTransitioning(false);
      setTransitionStage('idle');
    }, activeDuration / 2));
  }, activeDuration / 2));
}, [overlayColor, duration, transitionType]);
```
Dropping `isTransitioning` from the dependency array is deliberate — it was the source of the stale-closure guard.

### 18. (P2) `transition-all` 458× versus 38 property-scoped transitions

**Evidence.**
```
transition-all ........ 458
transition-colors ..... 157
transition-transform ... 26
transition-opacity ..... 12
```

**Why it feels wrong.** `transition-all` animates every animatable property that changes, including `width`, `height`, `padding`, `border-width` and `box-shadow` — all of which force layout or paint. It also produces surprises: a class swap that changes both colour and size animates both, at the same duration and curve, whether or not that was intended. In `AudioVUMeter.tsx:127` it is applied to an element whose class changes every 16ms.

**Fix.** Mechanical. `transition-all` → `transition-colors` for hover-colour changes (the majority), `transition-transform` for press/scale, `transition-opacity` for fades, and `transition-[width]`/`transition-[max-height]` where a layout animation is genuinely wanted. Highest-value single edit is `AudioVUMeter.tsx:127` (remove entirely, per Finding 4) and `StudioPreview.tsx:3005` (per Finding 9).

### 19. (P2) Six explicit easings across 458 transitions

**Evidence.**
```
ease-in-out ... 3
ease-out ...... 2
ease-linear ... 1
```
Everything else falls through to Tailwind's default `cubic-bezier(0.4, 0, 0.2, 1)`.

**Why it feels wrong.** That default is a symmetric ease-in-out. Applied to entrances it delays the initial movement — the exact moment the user is watching — so a 200ms dropdown *feels* slower than a 200ms dropdown with ease-out. Across 458 transitions the cumulative effect is an interface that feels a half-beat behind the pointer.

**Fix.** Register stronger curves in the `@theme` block at `index.css:4-7` so they are available as utilities:
```css
@theme {
  --font-sans: "Poppins", "Montserrat", system-ui, sans-serif;
  --font-display: "Montserrat", sans-serif;

  --ease-out-strong:  cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer:      cubic-bezier(0.32, 0.72, 0, 1);
}
```
Then `ease-out-strong` for anything entering, `ease-drawer` for panels and sheets, `ease-in-out-strong` for on-screen movement, `linear` for crossfades and progress.

### 20. (P2) Hover-scale ungated on touch devices

**Evidence.** `ControlTray.tsx:463`, `:553`, `:564`, `Header.tsx:304`, `AuthAndPricing.tsx:595`, `LeftSidebar.tsx:1299`, `:1686` all pair `hover:scale-*` with no `@media (hover: hover)` guard.

**Why it feels wrong.** Touch browsers fire `:hover` on tap and hold it until the next tap elsewhere. On a tablet, tapping the mute button leaves it visibly enlarged — reading as a stuck selected state on a control whose entire job is to communicate binary state clearly.

**Fix.** Covered by the `pressable` utility in Finding 8, which puts the hover branch inside `@media (hover: hover) and (pointer: fine)`.

### 21. (P2) Touch target utilities defined but unused

**Evidence.**
```
touch-action-btn (defined index.css:336) → applied to 9 of 530 buttons (1.7%)
touch-target-btn (defined index.css:344) → applied to 0
```
And `LeftSidebar.tsx:1299` carries it twice on one element:
```jsx
className={`w-full touch-action-btn py-2.5 px-4 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer touch-action-btn hover:scale-[1.02] active:scale-[0.98] ${
```

**Why it feels wrong.** Someone did the work of defining a 44px minimum target behind a `(pointer: coarse)` query and then applied it to under 2% of the surface. The studio's control tray buttons — `w-7.5 h-7.5` (30px) at `ControlTray.tsx:368` — are the ones that most need it, and have it least. The duplicated class is a sign the utility was applied by find-and-replace rather than review.

**Fix.** Fold the coarse-pointer minimum into the `pressable` utility from Finding 8 so it applies everywhere by construction:
```css
@utility pressable {
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
  &:active:not(:disabled) { transform: scale(0.97); }
  &:disabled { cursor: not-allowed; opacity: 0.55; }

  @media (pointer: coarse) {
    min-height: 44px;
    min-width: 44px;
  }
}
```
For visually small controls, keep the visual size and expand the hit area only:
```css
@utility hit-44 {
  @media (pointer: coarse) {
    position: relative;
    &::after {
      content: '';
      position: absolute;
      inset: 50% auto auto 50%;
      translate: -50% -50%;
      min-width: 44px;
      min-height: 44px;
    }
  }
}
```

### 22. (P2) No image loading placeholder — images pop in and shift layout

**Evidence.** `src/components/ImagePlaceholder.tsx:1-40` is entirely an *error* state:
```jsx
<AlertTriangle className="text-red-400 mb-2" size={24} />
<p className="text-xs text-slate-300 font-medium mb-1">Falha ao carregar imagem</p>
```
There is no skeleton, no aspect-ratio reservation, and no `<Loader>` component anywhere (`grep -rn "Loader2\|Loader\b" src` → 0).

**Why it feels wrong.** Chat avatars (`VirtualizedChat.tsx:555-560`) load lazily with no reserved box. In a virtualized list this compounds: an unloaded avatar measures differently from a loaded one, `setItemRef` (`:243-251`) records the wrong height, and the scroll positions computed at `:120-132` shift under the user as images arrive.

**Fix.** Reserve the box and cross-fade the image in.
```jsx
<div className="w-7 h-7 rounded-full bg-slate-800 shrink-0 mt-0.5 overflow-hidden border border-white/10">
  <img
    src={comment.authorAvatar}
    alt=""
    width={28} height={28}
    loading="lazy" decoding="async"
    referrerPolicy="no-referrer"
    onLoad={e => (e.currentTarget.style.opacity = '1')}
    className="w-full h-full object-cover opacity-0 transition-opacity duration-200 ease-out"
  />
</div>
```
The wrapper holds the 28px box whether or not the image ever arrives, so `setItemRef` measures a stable height. `width`/`height` attributes plus `decoding="async"` keep the main thread free during the live chat.

### 23. (P2) Hover-only affordances with no touch path

**Evidence.** 18 `group-hover:opacity-100` controls, 9 of them in `LeftSidebar.tsx`. E.g. `AddChannelsModal.tsx:378`:
```jsx
<div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
```

**Why it feels wrong.** On a tablet these controls are permanently invisible — there is no hover to reveal them. On desktop they are still a discoverability cost, since the user must already suspect something is there.

**Fix.** Reveal on focus-within as well, and show unconditionally on coarse pointers:
```jsx
className="absolute inset-0 ... opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
           [@media(pointer:coarse)]:opacity-100 transition-opacity duration-150 ease-out"
```

### 24. (P2) `duration-1000` on a CSS animation

Covered in Finding 13. `StudioPreview.tsx:3114`.

### 25. (P2) `VirtualizedChat` scroll handler is unthrottled and O(n)

**What.** The comment promises rAF throttling; the code has none, and the state it sets drives a full position recompute.

**Evidence.** `src/components/VirtualizedChat.tsx:189-206`:
```js
// Handle scroll events with requestAnimationFrame throttling
const onScrollHandler = useCallback(() => {
  const el = containerRef.current;
  if (!el) return;
  const currentScrollTop = el.scrollTop;
  ...
  setScrollTop(currentScrollTop);        // ← no rAF anywhere
  setIsNearBottom(isAtBottom);
  if (isAtBottom) setUnreadCount(0);
}, []);
```
And `:114-187` recomputes every item's position on each change, with `scrollTop` in the dependency array (`:187`):
```js
for (let i = 0; i < count; i++) {
  const item = filteredComments[i];
  const h = measuredHeightsRef.current.get(item.id) || ESTIMATED_ITEM_HEIGHT;
  positions.push({ top: currentTop, height: h, bottom: currentTop + h });
  currentTop += h;
}
```

**Why it feels wrong.** After a two-hour broadcast with thousands of messages, every scroll event walks the entire array. The binary search at `:140-151` is a nice touch, but it operates on an array that was just rebuilt in O(n) to enable it. Scrolling back through history — exactly what a moderator does — gets slower the longer the stream runs.

**Fix.** Throttle to one update per frame, and cache the prefix sums so `scrollTop` changes do not trigger a rebuild.
```js
const rafRef = useRef<number | null>(null);
const onScrollHandler = useCallback(() => {
  if (rafRef.current !== null) return;
  rafRef.current = requestAnimationFrame(() => {
    rafRef.current = null;
    const el = containerRef.current;
    if (!el) return;
    const st = el.scrollTop;
    const atBottom = el.scrollHeight - st - el.clientHeight <= 45;
    setScrollTop(st);
    setIsNearBottom(atBottom);
    if (atBottom) setUnreadCount(0);
  });
}, []);
useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);
```
Then split the memo in two so the O(n) pass depends only on the list, and the windowing depends on scroll:
```js
const positions = useMemo(() => { /* the O(n) loop */ },
  [filteredComments]);                              // not scrollTop

const { startIndex, endIndex, virtualItems, topOffset } = useMemo(
  () => { /* binary search + slice against `positions` */ },
  [positions, scrollTop, containerHeight]);
```

**Credit where due.** The two hardest parts of live-chat scrolling are already right, and should not be touched. `:214-227` only auto-scrolls when the user is already at the bottom, accumulating an unread count otherwise:
```js
if (currentLength > prevLength) {
  const addedCount = currentLength - prevLength;
  if (isNearBottom) {
    requestAnimationFrame(() => { containerRef.current.scrollTop = containerRef.current.scrollHeight; });
  } else {
    setUnreadCount(prev => prev + addedCount);
  }
}
```
And `:633-640` surfaces the "N novas mensagens" pill. That is the correct design, and it is better than most shipping chat implementations.

---

## The Ten Details

Ordered by impact per line changed.

**1. Define the missing animation utilities — 25 lines, restores 67 dead animations.**
Paste the `@keyframes enter` block from Finding 1 into `src/index.css` after line 130. Every modal, drawer, dropdown and dashboard in the app gains its intended entrance. Nothing else in the codebase changes. This is the highest-leverage edit available.

**2. Add the reduced-motion block — 30 lines, 127 animations become respectful.**
Paste the `@media (prefers-reduced-motion: reduce)` block from Finding 2 into `src/index.css`. Also the single largest accessibility win in this lane.

**3. Global `:focus-visible` ring — 12 lines, 717 interactive elements gain a keyboard indicator.**
```css
:where(button, [role="button"], a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])):focus-visible {
  outline: 2px solid var(--focus-ring, #60A5FA);
  outline-offset: 2px;
  border-radius: inherit;
}
:root { --focus-ring: #60A5FA; }
.theme-light, [data-theme="light"] { --focus-ring: #1D4ED8; }
:where(input, textarea, select):focus:not(:focus-visible) { outline: none; }
```
Then delete the 37 naked `focus:outline-none` occurrences.

**4. The `pressable` utility — 14 lines, press feedback + touch targets + disabled semantics everywhere.**
```css
@utility pressable {
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
  &:active:not(:disabled) { transform: scale(0.97); }
  &:disabled { cursor: not-allowed; opacity: 0.55; }
  @media (pointer: coarse) { min-height: 44px; min-width: 44px; }
}
@media (hover: hover) and (pointer: fine) {
  .pressable:hover:not(:disabled) { transform: scale(1.02); }
}
```
Apply to buttons file-by-file, starting with `LeftSidebar.tsx` (131 buttons, 3 press states) and `BillingDashboard.tsx` (38 buttons, 0).

**5. Remove `mode="wait"` from the scene compositor — 1 line, halves scene-switch latency.**
`StudioPreview.tsx:3006`: `<AnimatePresence mode="sync" initial={false}>`. 600ms → 300ms, and no blank frame between scenes.

**6. Stop the VU meter's 60Hz React loop — ~25 lines, removes the most expensive idle component in the studio.**
Finding 4. Move `level` to a ref, write a CSS variable, delete `transition-all duration-75` from `AudioVUMeter.tsx:127`. Also stop simulating fake audio when no track is present.

**7. `useModalBehavior` hook — ~55 lines once, 16 modals become dismissible.**
Finding 3. ESC, backdrop, scroll lock, focus trap, focus restore. The `onMouseDown`/`onMouseUp` backdrop pairing is the detail that separates this from a naive implementation.

**8. Guard GO LIVE — ~15 lines on the app's most consequential control.**
Finding 5. Add `disabled`/`aria-busy` during the connect handshake, move `animate-pulse` from the button to the 2px status dot, and put a hold-to-confirm on END LIVE.

**9. Stop width-animating the live stage — 4 lines, removes layout thrash from the program output.**
`StudioPreview.tsx:3005` and `ProgramMonitorView.tsx:264`. Reserve the gutter, slide the banner in with `transition-transform duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]`.

**10. Make clipboard tell the truth — ~10 lines, 41 call sites stop lying.**
Finding 12. Wrap `writeText` in try/catch with an `execCommand` fallback and a real error toast. A false "Copiado!" on an RTMP stream key costs the user a failed broadcast.

---

## Handoff

- **Lane A** — Z-index is unlayered and collision-prone across overlays: `z-50`, `z-60`, `z-[99]`, `z-[100]`, `z-[110]`, `z-[120]`, `z-[150]`, `z-[200]`, `z-[10000]` (`LegalModals.tsx:16`). `AddChannelsModal` opens a nested modal at `z-60` from a parent at `z-50` (`:243`, `:463`), so the stacking is already load-bearing. A token scale (`--z-dropdown/-overlay/-modal/-toast`) is an IA decision, not a motion one. I own how the modals animate; the tier ordering is yours.

- **Lane A** — The app has no toast or notification surface at all, and 25 blocking `alert()`/`confirm()` calls stand in for one. I have specced the mechanics (Finding 6), but *where* transient feedback lives — and whether destructive confirms belong in a dialog or inline — is an information-architecture call.

- **Lane B** — `ControlTray.tsx` is the only component in the codebase with real press states (5 `active:` across 16 buttons, 31% coverage, versus 2.3% in `LeftSidebar`). If you are defining a button component language, that file is the existing house style worth formalising rather than inventing against.
