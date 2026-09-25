# PwStream — UI/UX Audit Synthesis

Three specialists audited this codebase in parallel, each locked to a different layer with
explicit non-overlap contracts. This document is the connective tissue: what they independently
converged on, what blocks shipping, and the order to fix things in.

| Lane | Skill | Report | Verdict |
|---|---|---|---|
| A — Structure, Systems & Accessibility | `impeccable` | [01-structure-systems-a11y.md](01-structure-systems-a11y.md) | 8 P0 · 15 P1 · 7 P2 |
| B — Art Direction & Anti-Slop | `design-taste-frontend` | [02-art-direction-antislop.md](02-art-direction-antislop.md) | Slop Score **8.5 / 10** |
| C — Interaction, Motion & Craft | `emil-design-eng` | [03-interaction-motion-craft.md](03-interaction-motion-craft.md) | 6 P0 · 11 P1 · 8 P2 |

All headline claims were independently re-verified against source before publication.

---

## 1. Ship blockers

These are not design debt. They are commercial, legal, and truthfulness problems that a
prospective customer or a competitor's lawyer reaches before they reach any UI.

| # | Blocker | Evidence |
|---|---|---|
| SB-1 | **A competitor's marketing copy ships verbatim on the landing page.** A navbar badge reads `RESTREAM MODE`; the H1 is English (`One live video / 30+ destinations`) over Restream's own sentence, on a pt-BR product. 43 `restream` references across `src/`. | `AuthAndPricing.tsx:276`, `:297-301` |
| SB-2 | **Three pricing tables contradict each other on price and currency.** `$14/$29/$49` vs `R$ 49,90/99,90/199,90` — same plan names, ~3.5× apart. Standard is "3 canais" in one and "Até 2 destinos" in the other. Annual discount is simultaneously 16.7%, 20% and 21.4%. | `AuthAndPricing.tsx:380-382` vs `PlansModal.tsx:75,82,89` |
| SB-3 | **A free-plan giveaway button sits beside the real checkout CTA.** `Ativar Plano {selectedPlan} (Demo)`, titled "Simular aprovação imediata do plano pago". | `PlansModal.tsx:246` |
| SB-4 | **Demo/simulation controls are in the shipping header.** `Simular 30 Dias Expirados`, `Restaurar 30 Dias (Demo)`. | `Header.tsx:94,125` |
| SB-5 | **LGPD consent is pre-ticked and the legal links are dead `<span>`s** on the public registration form. | `WebinarPublicPage.tsx:293-296` |
| SB-6 | **Admin and super-admin are ungated in navigation** — the `#admin` hash promotes any user. | `App.tsx:160-162,2801` |
| SB-7 | **Fabricated audience numbers are shown to a streamer's own audience** (`1.282 assistindo`, `382 participando`) on the public page. | `WebinarPublicPage.tsx:340,211` |

---

## 2. Convergence — six root causes behind ~30 findings

The lanes could not see each other's work. Where they landed on the same code from three
different directions, that code is the highest-leverage thing to fix.

### C1 · There is no modal primitive
20 hand-rolled modal roots, no shared component.

- **A9** — no primitive; 12 z-index tiers escalating to `z-[99999]`
- **A4** — 0 `role="dialog"` / `aria-modal` across 20 modal roots
- **C1** — 67 `animate-in`/`fade-in`/`zoom-in-*` classes are undefined (`tailwindcss-animate` is
  not installed, not in `node_modules`, never registered via `@plugin`). Combined with
  `if (!isOpen) return null`, every overlay hard-cuts in **and** out.
- **C3** — 0 ESC, 0 backdrop click, 0 body scroll lock, 0 focus trap, 0 focus restore
- **B** — 20 distinct z-index values; not a scale

→ *One `<Modal>` + `useModal()` resolves five findings across all three lanes.*

### C2 · There is no token layer
`@theme` (`index.css:4-7`) declares two font families and nothing else.

- **A2** — light mode enumerates 11 of **89** distinct `bg-[#…]` values (693 usages, 32 files)
  while `:211` forces `.text-white → #0F172A` globally with no background guard.
  Result: **1.02:1** contrast. `ScreenSharePickerModal` and `CloudflareStreamModal` render as
  unreadable dark rectangles.
- **B4** — 187 distinct hex values; **102 dark greys, 39 inside one 8-point luminance band**;
  two neutral ramps (slate 1,924 / gray 1,050) mixed for identical roles
- **B** — `border-slate-800` + 7 opacity variants = **816 of 1,627 borders (50.2%)**
- **B** — 8 radii, no rule; `StudioPreview.tsx` alone uses 12
- **A28 / B** — 1,101 arbitrary px font sizes, 441 text nodes below 10px, down to `text-[4px]`
- **B** — `slate-850` used 20× and **is not a Tailwind color**; those borders render as nothing

→ *One `@theme` block; ~2,200 mechanical edits + 79 judgment calls.*

### C3 · Interaction states were never designed
- **A17 / C7** — 137 `focus:outline-none` with **0** `focus-visible:` replacements
- **C8** — `active:` on 35 of 530 buttons (6.6%); `hover:`→`active:` ratio is **26:1**
- **A16 / C21** — `touch-target-btn` defined and used **0** times; `touch-action-btn` on 9 of 530

→ *~10 lines of global CSS recovers most of it.*

### C4 · `alert()` is the notification system
- **A14** — 19 `alert()` + 6 `confirm()` are the entire feedback and confirmation system
- **C6** — a native dialog blocks the main thread: video, chat and encoder UI stall mid-broadcast
- **C12** — 41 `clipboard.writeText` calls with **zero** `.catch()`; the UI reports "Copiado!"
  even when copying an RTMP stream key silently failed
- **C (handoff)** — no toast surface exists anywhere

→ *One toast primitive, plus a confirm dialog built on C1's modal.*

### C5 · Fabricated data is presented as real
- **A7** — stream health is `Math.random()` and the `warning` branch is **mathematically
  unreachable**: `lossVar` maxes at 0.06 against thresholds of `> 2` and `> 0.5`; `fpsVar`
  bottoms at 29.2 against `< 24`. The one surface that must warn a paying host their stream is
  failing cannot do so.
- **A21** — the dashboard greets every user as "Marcos Gonçalves"; 4 hardcoded metric cards
- **A30** — fake billing identity and card data pre-filled into every account
- **B** — invented social proof on the public page (see SB-7)

→ *Not a design fix. A truthfulness fix.*

### C6 · The product has no identity of its own
- **B** — competitor copy verbatim (SB-1)
- **B** — the brand name is spelled **ten ways**; `App.tsx:3050` uses two in one sentence
- **B** — 1,322 Tailwind `blue-*` against 85 `#4683E0`; the Recharts palette
  (`SuperAdminAnalytics.tsx:35`) is the literal Tailwind 500 ramp and never touches the brand color
- **B** — the logo carries two different purples in its own two gradients
  (`PwStreamLogo.tsx:37` `#7E57C2` vs `:75` `#8B5CF6`)

---

## 3. Standalone P0s not covered by a cluster

| Finding | Evidence |
|---|---|
| **The studio is a navigation dead-end at 768–1279px.** Nav is `hidden lg:flex`, exit is `hidden xl:flex`, hamburger is `md:hidden`. `ControlTray` accepts and destructures `onExit` but never renders it. View state is plain `useState` with no `pushState`, so browser Back exits the app. | `Header.tsx:151,327,426` |
| **No data-loss guard.** `beforeunload` appears **0 times** — the only escape from the trap above is a reload, which silently kills the broadcast. | `App.tsx:1896,2432` |
| **The default studio tab matches no panel.** `useState<string>('first')` commented `// Default to broadcast`; `LeftSidebar` has zero `'first'` cases. Every first-time user opens the studio to a blank 330px sidebar. `activeTab: string` being untyped is why TypeScript never caught it. | `App.tsx:237` |
| **Whole-app ARIA vacuum.** Exactly **1** `aria-label` and **1** `role` in 35 components. 159 `<label>` against 10 `htmlFor`. No `<main>` in any authenticated view, no skip link, no `<h1>` in the studio. Level-A failures on 1.3.1, 2.4.1, 4.1.2. | `Header.tsx:342` |
| **`AudioVUMeter` re-renders React ~60×/sec during live broadcast.** The smoother never settles, so it renders in silence too, driving 15 nodes with `transition-all duration-75` that retarget every 16ms and never complete. | `AudioVUMeter.tsx:47-48` |
| **GO LIVE / END LIVE has no `disabled`, no pending state, no confirm** — double-clickable and irreversible. | `Header.tsx:300-321` |
| **Zero `prefers-reduced-motion`** guarding 127 infinite animations. `StudioPreview.tsx` runs 24 of them continuously over live video. `ticker-badge-glow` animates `filter: drop-shadow` — a forced repaint every frame, forever. | `index.css:104` |

---

## 4. Fix sequence

Ordered by impact per unit of effort, not by lane.

**Phase 0 — before anyone sees it.** SB-1 through SB-7. Mostly deletions and one pricing
decision. No design work required.

**Phase 1 — cheap and disproportionate.** `App.tsx:237` (one word). The 25 lines of CSS that
revive every entrance animation. ~10 lines of global `:focus-visible`. The
`prefers-reduced-motion` block. `beforeunload`. Rendering `ControlTray`'s existing `onExit`.
Deleting `slate-850`.

**Phase 2 — the three primitives.** `<Modal>`, `<Toast>`, `<ConfirmDialog>`. Retires 25
`alert()`/`confirm()` calls, 20 hand-rolled modal roots, the z-index war, and the missing
dialog semantics in one pass.

**Phase 3 — the token layer.** The `@theme` block, then the mechanical migration. This is the
only way the light theme is ever correct; patching `index.css` further makes it worse.

**Phase 4 — identity.** Palette, type system, and the brand cleanup, on top of Phase 3's tokens.
Lane B's report carries a full proposed direction and a copy-pasteable `@theme` block.

**Phase 5 — truthfulness.** Wire real metrics or label the simulated ones honestly. Make the
stream-health warning branch reachable.

---

## 5. Credit where it is due

The lanes were instructed to be unsparing, and were. They also independently flagged real work:

- `VirtualizedChat`'s scroll anchoring and unread pill (`:214-227`, `:633`) are correct, and
  better than most shipping chat implementations.
- The drag handlers ship genuine touch equivalents.
- The studio shell — resizable 3-column grid, VU meters, program/preview monitors, real
  broadcast density — is domain work no template generates.
- The `--ticker-duration` / `chat-bubble-in` motion vocabulary in `index.css:44-118` is
  authored for this domain, not borrowed.
- The Portuguese sample names are locale-appropriate and specific, not "John Doe".
