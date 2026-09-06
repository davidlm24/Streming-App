# Lane B — Art Direction & Anti-Slop

**Design read:** a *redesign-overhaul* audit of a live-broadcast SaaS for Brazilian creators and agencies. It currently speaks generic dark-dashboard. It should speak **broadcast instrument**: hue-neutral graphite chrome, one owned signal accent, monospace numerics, flat surfaces that recede behind video.

Scope: 33,449 lines of TS/TSX across 35 components. Every claim below is a grep count or a `file:line` I opened and read.

---

## Slop Score: **8.5 / 10**

Ten would be indistinguishable from a default AI dashboard. This is an 8.5 because the studio shell has genuine domain ambition — a resizable three-column grid, VU meters, program/preview monitors, a tally vocabulary, real broadcast density — that no template generates. Everything else is stock.

The three most damning tells:

1. **The accent is not the brand's; it is Tailwind's.** `#4683E0` appears 85 times. Tailwind `blue-*` classes appear **1,322** times, and the Recharts palette at `SuperAdminAnalytics.tsx:35` is `['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6']` — literally `blue-500, emerald-500, amber-500, red-500, violet-500` in ramp order. The charts don't even know the brand color exists. Add the gradient-text headline `from-blue-400 via-indigo-400 to-purple-400 bg-clip-text` at `AuthAndPricing.tsx:298` and this is the canonical AI-purple signature, shipped on the first screen a buyer sees.

2. **There is no design system underneath any of it.** The `@theme` block in `index.css:4-7` declares exactly two font families and **zero** color, radius, spacing, or shadow tokens. Consequence: 1,088 hardcoded hex literals across **187 distinct values**, of which **102 are dark surface greys** and **39 sit inside a single 8-point luminance band** — thirty-nine greys a human cannot tell apart. `border-slate-800` and its seven opacity variants account for **816 of 1,627 border declarations (50.2%)**. Eight border radii, no rule; `WebinarPublicPage.tsx` alone uses seven, `StudioPreview.tsx` twelve.

3. **The typography is a shout, not a system.** 950 `font-bold` + 224 `font-black` + 77 `font-extrabold` = **1,251 heavy-weight declarations against 53 normal/medium**. 1,101 arbitrary pixel sizes (`text-[10px]` ×489, down to `text-[4px]` ×6) against 996 scale tokens. **518 `uppercase`, 310 of them paired with `tracking-*`** — the badge/eyebrow signature, three hundred and ten times. **Zero `tabular-nums`** anywhere, in a product whose entire value is numbers: bitrate, timecode, viewers, GB, money. And Montserrat is downloaded on every page load for a `--font-display` token that **no component ever uses**.

Two findings sit below the slop line and above it at the same time, because they are not aesthetic failures but unfinished work: the landing page ships a competitor's marketing copy verbatim (`AuthAndPricing.tsx:301`, with a `RESTREAM MODE` badge at `:276`), and the brand name is spelled **ten different ways** across the source.

---

## Slop Tells — Quantified

| Tell | Occurrences | Example file:line | Verdict |
|---|---|---|---|
| Tailwind default blue as de-facto accent | 1,322 blue-* vs 85 `#4683E0` | `Header.tsx:173`, `AuthAndPricing.tsx:340` | **Fatal.** The brand does not own a color. |
| `slate-800` border monoculture | 816 / 1,627 borders = 50.2% | `App.tsx:2823`, `PlansModal.tsx:159` | **Fatal.** Plus 8 opacity variants with no rule. |
| Two neutral ramps mixed (cool + true) | slate 1,924 / gray 1,050 | `App.tsx:2825-2827` (`text-[#a59ebf]` + `text-gray-400` + `text-slate-400` on one screen) | **Fatal.** Six values express one role. |
| Gradient text heading | 2 | `AuthAndPricing.tsx:298`, `PwStreamLogo.tsx:75` | **Fatal.** Both are `blue→indigo/violet→purple/pink`. |
| `bg-gradient-to-r from-blue-* to-indigo/purple-*` | 10 | `AuthAndPricing.tsx:340,459,595`; `Header.tsx:173`; `LeftSidebar.tsx:3953`; `QrCodeModal.tsx:901` | **Fatal.** The exact banned recipe, on every primary CTA. |
| Total gradients as chrome | 45 | `Header.tsx:80,102,133` — three notification bars, three different 3-stop gradients | Bad. Gradient is doing decoration, not hierarchy. |
| Tinted-fill pill (`bg-<c>-500/{5,10,15,20}`) | **473** | `WebinarPublicPage.tsx:376`, `AdminPanel.tsx:202` | **Fatal.** The single most-repeated device in the app. |
| Badge soup: `uppercase` + `tracking-*` micro-labels | **310** (518 `uppercase` total) | `ControlTray.tsx:344,346` (`text-[7px] font-black uppercase`) | **Fatal.** 7px all-caps badges. |
| Icon-in-a-tinted-rounded-square KPI card | 16 exact, 33 loose | `SuperAdminAnalytics.tsx:207`, `App.tsx:2829` | **Fatal.** Four in a row, then the number colored to match the tile. |
| KPI number colored decoratively, not semantically | 4 | `SuperAdminAnalytics.tsx:211,224,240,251` — blue/amber/emerald/purple | Bad. Amber means *warning* everywhere else; here it means "tile #2". |
| Glassmorphism by default | 44 `backdrop-blur` + 57 `border-white/{5..25}` | `StudioPreview.tsx:2500,2536,3263` | Bad. Applied to overlays *on top of video*, where it costs GPU and clarity. |
| Neon / colored glow shadows | 30 colored + 19 distinct arbitrary | `StudioPreview.tsx:2764` (`shadow-[0_0_30px_rgba(6,182,212,0.15)]` around the video frame) | Bad. The chrome glows; the video does not. |
| Uniform-ish radius chaos | 8 radii / 1,683 uses | `WebinarPublicPage.tsx` = 7 distinct; `StudioPreview.tsx` = 12 | **Fatal.** Coin flip, not scale. |
| Emoji in production UI | 68 | `Header.tsx:94` (`⚡ Simular…`), `ControlTray.tsx:318,398` (`⚡ Ativar Dispositivos Reais`), `QrCodeModal.tsx:20-80` (`📱🎧🎓👟☕`) | Bad. lucide-react is installed and has all of these. |
| Div-based fake screenshots | 4 components, ~230 lines | `ScreenSharePickerModal.tsx:9,51,99,139` (`PhotoshopMock`, `OBSMock`, `VSCodeMock`, `PowerPointMock`) | **Fatal.** The #1 LLM design tell, built at industrial scale, at `text-[4px]`. |
| Three-equal-cards feature/pricing row | 3 surfaces | `AuthAndPricing.tsx:378` (3-col), `:648` (4-col), `PlansModal.tsx:150` (3-col), `BillingDashboard.tsx:453` (3-col) | Bad. Banned pattern, four times. |
| Decorative blur orbs / radial "hero glow" | 5 | `AuthAndPricing.tsx:262` (`w-[800px] blur-[120px]`), `WebinarPublicPage.tsx:151-152` | Bad. Plus an 11-line radiating SVG at `AuthAndPricing.tsx:267`. |
| Fake-perfect / invented metrics presented as real | ~12 | `App.tsx:2818-2821` (`'14'`, `'4.829'`, `'1.240m'`, `'87%'`), `WebinarPublicPage.tsx:50` (`{42,28,15}`), `:340` (`1.282 assistindo`), `:211` (`382 participando`) | **Fatal on the public page** — fabricated social proof shown to a streamer's own audience. |
| Decorative motion (`animate-pulse/ping/bounce`) | 78 / 17 / 6 | `App.tsx:2804` (pulsing `Server` icon on a static nav button) | Bad. → Lane C. |
| Dead Tailwind class (`slate-850` does not exist) | 20 | `WebinarPublicPage.tsx:367,483`; `BillingDashboard.tsx:1606,1613,1657,1663,1717,1723`; `ScreenSharePickerModal.tsx` ×13 | **Fatal.** Those borders and fills render as nothing. → Lane A. |
| Competitor copy shipped verbatim | 4 strings + 15 refs | `AuthAndPricing.tsx:276` `RESTREAM MODE`, `:297-301` English Restream tagline, `:624` `Upgrade to grow and engage your audience` | **Fatal.** Not slop. Unfinished. |
| Brand name spelling variants | **10** | `pwstreamer` 97 · `PwStreamer` 55 · `pwstream` 48 · `PwStream` 16 · `PW Stream` 10 · `PWSTREAMER` 5 · `PWstreamer` 4 · `pwStream` 3 · `pw-streamer` 1 · `pw-stream` 1 | **Fatal.** A brand with ten spellings has no brand. |
| One glyph, many meanings | `Sparkles` ×29 | `PlansModal.tsx:217` (=PIX), `:246` (=demo), `App.tsx:2635` (=Smart Sidebar), `WebinarPublicPage.tsx:309` (=bonus material), `AuthAndPricing.tsx:294` (=eyebrow) | Bad. Six meanings, one icon. |
| Icon size anarchy | **22 distinct sizes** | 14 ×199, 12 ×111, 16 ×98, 13 ×86, 10 ×62, 11 ×44, 15 ×24, plus 8/9/17/22/24/26/28/32/36/48/120/140 | Bad. `strokeWidth` explicitly set only 13 times → 98% run lucide's default `2`, which blows out at 10-13px. |
| z-index escalation war | 20 distinct values | `z-[99999]`, `z-[10000]`, `z-[9999]`, `z-[200]`, `z-[150]`, `z-[120]`, `z-[110]`, `z-[105]`, `z-60`, `z-35` | Bad. Not a scale. |
| Demo/simulation controls in shipping chrome | 3 | `Header.tsx:94` (`Simular 30 Dias Expirados`), `Header.tsx:125` (`Restaurar 30 Dias (Demo)`), `PlansModal.tsx:246` (`Ativar Plano X (Demo)` — next to the real Pay button) | **Fatal on the paywall.** A free-plan-giveaway button sits beside the checkout CTA. |

**Not slop, credit where due:** the Portuguese sample names (`Roberto Santos`, `Fernanda Lima`, `Ana`, `Lucas`) are locale-appropriate and specific, not "John Doe". The `--ticker-duration` / `chat-bubble-in` motion vocabulary in `index.css:44-118` is genuinely domain-authored. The studio's 9-11px density is a real editorial choice, badly executed but not a default.

---

## Palette Audit

**1,088 hex literals · 187 distinct values · 693 `bg-[#…]` across 89 distinct backgrounds · 0 tokens.**

### What is actually in use

**Dark surfaces — 102 distinct hex values.** Thirty-nine of them fall inside relative luminance 19-27, i.e. a band roughly 3% of the visible range:

```
#11131a #14121e #10141d #11141a #121419 #12141a #161222 #1c1212 #12141c #12141f
#13141c #12151b #13151b #13151e #15151d #171422 #121620 #13161e #121622 #14161f
#121626 #151620 #0f172a #14171e #141720 #141822 #1a1625 #161821 #161822 #18181f
#16191e #161922 #31102b #161924 #101a30 #171926 #181a25 #181b26 #1a1b24
```

The two "official" values (`#0F1115` ×226, `#16191E` ×248) do 44% of the work; the other 100 do the rest, arbitrarily. `ControlTray.tsx` alone uses five surface hexes (`#13151b` mobile, `#16191E` desktop — **the panel changes color at a breakpoint**, `:266`; plus `#0B0D11`, `#1E222B`, `#0F1115`). `PlansModal.tsx` stacks four (`#0c0f18` shell / `#0a0d14` header / `#16191E` cards / `#0F1115` footer), none of them the app's canonical pair.

**Neutral ramps — two, mixed.** `slate-*` 1,924 uses (blue-tinted, hue ≈ 215°) and `gray-*` 1,050 (near-neutral). They are used interchangeably for the same roles. Body text alone is expressed six ways: `text-gray-400` (519), `text-gray-500` (233), `text-gray-300` (226), `text-slate-400` (112), `text-slate-300` (50), `text-[#a59ebf]` (52).

**Accent — contested.** `#4683E0` (85 hex + 18 `text-[#4683E0]`) is the intended brand blue. It loses to Tailwind: `text-blue-400` 321, `bg-blue-500` 302, `border-blue-500` 297, `bg-blue-600` 146. `PwStreamLogo.tsx` uses `#4683E0 → #7E57C2 → #EC407A` for the mark (`:36-38`) and `#4683E0 → #8B5CF6 → #EC407A` for the wordmark (`:75`) — **the logo's two gradients don't even use the same purple.**

**Semantic families — sixteen families for five roles:**

| Role | Families in use | Counts |
|---|---|---|
| Success | emerald / green / lime | 412 / 63 / 1 |
| Danger | red / rose | 232 / 59 |
| Warning | amber / orange / yellow | 295 / 64 / 12 |
| Info + brand | blue / purple / indigo / cyan / sky / pink | 1,322 / 127 / 83 / 27 / 9 / 9 |
| Neutral | slate / gray | 1,924 / 1,050 |

`ControlTray.tsx:337` uses `green-500` for "Real" while the rest of the app uses `emerald-500` for success. `StudioPreview.tsx:2763` introduces cyan as a seventh chromatic family to mean "studio preview mode" — with a neon glow around the video frame.

**Chart palettes — a third, unrelated system.**
`SuperAdminAnalytics.tsx:35`: `['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6']` — the Tailwind 500 ramp, verbatim. Axes `#64748B`, tooltip border `#334155`, comparison bar `#1E293B`. `StudioPerformanceMonitor.tsx:180-205` uses `#6B7280` axes (a *different* grey family) with `#3B82F6`/`#10B981` series. `SuperAdminPanel.tsx:748` uses `#4B5563` axes (a third). Three chart surfaces, three axis greys, and none uses `#4683E0`. `SuperAdminAnalytics.tsx:227` runs a `from-amber-500 to-emerald-400` fill on a **storage-usage** bar: the meter is most alarming when empty and greenest when full. The semantics are inverted.

**Near-duplicate count, summarized:** 102 dark surfaces collapsing to ~5 real levels · 39 in one 8-point luminance band · 2 neutral ramps · 3 blues · 3 greens · 3 ambers · 3 axis greys.

### Proposed Palette

Principle for this product: **the chrome must be hue-neutral, because a blue-tinted UI biases an operator's perception of the video they are grading, framing, and keying.** That is not taste; it is why Resolve, Premiere and Blackmagic hardware are grey. `slate` must go. Depth comes from a four-step neutral ramp, not from shadow or tint.

Second principle: red, green and amber are **spent** — broadcast tally already owns them (red = on air, green = preview/ready, amber = degraded). The brand accent must live outside that system. Blue and violet are the category default (Restream, StreamYard, vMix, Riverside) *and* the AI tell. The remaining defensible hue is already buried in the current logo as its third gradient stop: **magenta.** Kill the blue and the purple, keep `#EC407A`, push it to signal chroma, and the product owns a color nobody in this category has.

```
NEUTRAL — hue-neutral graphite (replaces slate + gray + 102 hexes)
--ink-000   #0A0A0B   app ground, outermost shell
--ink-050   #121214   rails, sidebars, header
--ink-100   #17171A   panel / card
--ink-150   #1E1E22   raised panel, popover, dropdown, input fill
--ink-200   #26262B   hairline (default border), inactive track
--ink-300   #34343A   hairline-strong (modal edge, stage bezel)
--stage     #000000   video letterbox ONLY. The one correct pure black.

TEXT
--text-hi   #F2F2F3   headings, primary values, active labels
--text      #B4B4BA   body, default UI text
--text-lo   #7C7C86   metadata, table secondary, captions
--text-dim  #55555E   disabled, placeholder

BRAND — one accent, used only for primary action + focus + selection
--signal-400  #FF6FB4   accent text / icon on dark
--signal-500  #FF3D9A   primary button fill, focus ring, selection border
--signal-600  #E22B82   pressed
--signal-tint rgba(255,61,154,0.12)   the ONE tint recipe

BROADCAST STATUS — reserved. Never used for brand, never for decoration.
--onair     #E5231A   ON AIR / LIVE / REC (tally program)
--ready     #2DD46E   preview / ready / healthy (tally preview)
--warn      #F0A020   degraded, quota, dropped frames
--fail      #FF5A4E   error, disconnected
--info      #6E7BFF   neutral notice (the only cool chromatic; never a CTA)

CHART — 5 categorical, hue-spaced, all ≥3:1 on --ink-100, one system with the above
--c1 #FF3D9A   --c2 #4DC9F0   --c3 #F0A020   --c4 #2DD46E   --c5 #A97BFF
--c-axis #55555E   --c-grid #26262B   --c-track #1E1E22
```

**Separation rules (non-negotiable):**
- `--onair` (hue 3°, L≈48) vs `--signal-500` (hue 334°, L≈62): 31° hue + a large luminance delta + zone separation — tally lives on the stage bezel and the LIVE pill, accent lives on buttons and focus. **LIVE state is never color-only**: always red + the word "AO VIVO" + a pulse.
- `--signal-*` never fills an area larger than a button. No accent backgrounds, no accent gradients, no accent glows.
- The tint recipe `--signal-tint` replaces all 473 `bg-<c>-500/{5,10,15,20}` instances. Status tints get the same 12% treatment off their own hue. Four tints total, not twenty.
- Zero `shadow-<color>` glows. Zero `drop-shadow` on the logo.

---

## Type Audit

### Measured distribution

**Sizes — 2,097 declarations, no scale.**

| Class | Uses | | Class | Uses |
|---|---|---|---|---|
| `text-[10px]` | **489** | | `text-xs` (12) | **759** |
| `text-[9px]` | 243 | | `text-sm` (14) | 94 |
| `text-[11px]` | 162 | | `text-base` (16) | 45 |
| `text-[8px]` | 150 | | `text-lg` (18) | 27 |
| `text-[7px]` | 29 | | `text-2xl` (24) | 26 |
| `text-[6px]` | 12 | | `text-3xl` (30) | 20 |
| `text-[5px]` | 11 | | `text-xl` (20) | 18 |
| `text-[4px]` | **6** | | `text-4xl` (36) | 4 |
| `text-[8.5px]`/`[7.5]`/`[6.5]` | 9 | | `text-5xl` / `text-7xl` | 2 / 1 |

1,101 arbitrary pixel sizes against 996 scale tokens. Nineteen distinct sizes between 4px and 72px. A 4px, 5px, 6px and 7px tier exists — 58 elements — mostly inside the div-based fake screenshots (`ScreenSharePickerModal.tsx`, 6 × `text-[4px]`). Separately, Tailwind v4 pairs a line-height with the **named** sizes but not with arbitrary ones, so half the app's text has a designed leading and half inherits — **two line-height models in one product**, unintentionally.

**Weights — 1,304 declarations, 96% heavy.**

| Weight | Uses | Loaded? |
|---|---|---|
| `font-bold` (700) | 950 | ✅ |
| `font-black` (900) | **224** | ❌ **not requested for either family** → synthesized or silently falls to 800 |
| `font-semibold` (600) | 179 | ✅ |
| `font-extrabold` (800) | 77 | ✅ Poppins only |
| `font-medium` (500) | 48 | ✅ |
| `font-normal` (400) | 5 | ✅ |
| `font-light` (300) | **0** | ⚠️ Montserrat 300 is downloaded and never used |

When 96% of text is 700+, weight stops carrying hierarchy. That is why hierarchy has been outsourced to size and color instead — and why there are 19 sizes and 6 body greys.

**Tracking — 400 uses, applied backwards.** 309 `tracking-wider` + 27 `tracking-widest` sit on tiny uppercase labels (correct direction, excessive amount). Only 29 `tracking-tight` + 3 `tracking-tighter` sit on display type, against 52 instances of `text-2xl` and above. Zero arbitrary tracking. The `text-7xl` H1 at `AuthAndPricing.tsx:296` does get `tracking-tight`; the `text-5xl` H1 at `WebinarPublicPage.tsx:186` gets `tracking-tight` too — but every `text-3xl` heading in the admin panels runs at 0.

**Leading — 139 uses across ~3,000 text elements (≈5%).** `leading-relaxed` 47, `leading-normal` 40, `leading-tight` 29, `leading-none` 15, `leading-snug` 8. Zero arbitrary. Body prose is therefore mostly at whatever Tailwind's paired default is.

**Numerics — `tabular-nums`: 0 occurrences.** In a product that displays timecode, bitrate, viewer counts, GB, minutes, percentages and money. `font-mono` is used 285 times, but **no `--font-mono` is declared in `@theme`**, so all 285 fall back to `ui-monospace, SFMono-Regular, Menlo, Consolas…` — meaning the price on the pricing page (`AuthAndPricing.tsx:680`, `BillingDashboard.tsx:484`), every KPI (`BillingDashboard.tsx:1462,1492,1522`), the countdown (`WebinarPublicPage.tsx:225`) and every stream key render in a **different typeface on Windows than on macOS**, and at `font-black` (900) in a family that has no 900 face.

**Measure.** `LegalModals.tsx:17` is `max-w-3xl` (768px) with `p-6`, giving ~720px of text at `text-sm`/`text-xs` → roughly **100-120 characters per line**. Optimal is 45-75. The one place `leading-relaxed` *is* applied (`:41`) is undone by the measure.

**Numeric alignment.** `BillingDashboard.tsx:1214-1217`: the invoice **ID** column is `font-mono font-bold`; the **Valor Pago** column is `font-bold` in proportional Poppins, left-aligned, no tabular figures. Exactly backwards — the column that must align doesn't, and the one that needn't does.

### Verdict on the two-family setup

**Montserrat is dead weight.** `--font-display` (`index.css:6`) has **zero consumers** — `grep -r "font-display" src/` returns only `index.css` itself. Montserrat only ever paints if Poppins fails to load. Meanwhile `index.css:1` requests **five Montserrat weights** (300;400;500;600;700) via `@import`, and `index.html` has no `preconnect` or `preload` — so the render-blocking chain is HTML → CSS → `@import` → `fonts.googleapis.com` → `fonts.gstatic.com`, two extra round trips for a family that never appears.

**Poppins is the wrong tool for this product.** It is a geometric sans with circular bowls, a large x-height and wide advance widths — a marketing display face. At the 9-11px that 732 elements use, its counters close up; in a 240px scenes rail its width wastes columns. It is fine for the pricing page and wrong everywhere else, and the pricing page is 5% of the surface area.

Net: two families loaded, ten static faces requested, one family used, one weight used at 96%, one weight (900) used 224 times and never loaded, and the actual technical typeface — the mono carrying every number in the product — is unspecified.

### Proposed Type System

Two variable families, self-hosted, `font-display: swap`, preloaded. Down from 10 static Google faces.

```
--font-ui    "Geist", "Inter Tight", system-ui, sans-serif       (OFL, variable)
--font-num   "Geist Mono", ui-monospace, "SF Mono", monospace     (OFL, variable)
```

Geist is a grotesk built for interface density: tight advance widths, open apertures at 11px, and a mono sibling with identical vertical metrics — which is what makes a number column and a label column line up without hacks. `--font-num` is not decoration; it is the fix for 285 unstyled `font-mono` calls.

**Two ladders, because the product genuinely has two densities.** Today both surfaces use the console rhythm — the pricing page breathes exactly as little as the studio does.

*Console ladder* — studio, sidebars, admin, tables:

| Token | rem / px | line-height | tracking | For |
|---|---|---|---|---|
| `--t-micro` | 0.6875 / **11** | 1.27 (14px) | +0.06em if caps | **The smallest size that ships.** Replaces every 4-10px. |
| `--t-xs` | 0.75 / 12 | 1.33 (16px) | 0 | table cells, field labels, badges |
| `--t-sm` | 0.8125 / 13 | 1.38 (18px) | 0 | panel body, list rows |
| `--t-md` | 0.9375 / 15 | 1.47 (22px) | 0 | panel titles, active values |
| `--t-lg` | 1.125 / 18 | 1.33 (24px) | -0.01em | section headers |
| `--t-num` | 1.75 / 28 | 1.0 | 0 | KPI values — `--font-num`, `font-variant-numeric: tabular-nums` |

*Editorial ladder* — auth, pricing, public webinar, legal, billing prose:

| Token | rem / px | line-height | tracking | For |
|---|---|---|---|---|
| `--e-body` | 1 / 16 | 1.6 | 0 | prose, `max-width: 66ch` |
| `--e-lead` | 1.125 / 18 | 1.55 | 0 | hero subhead, plan descriptions |
| `--e-h3` | 1.5 / 24 | 1.25 | -0.01em | card titles, plan names |
| `--e-h2` | 2 / 32 | 1.15 | -0.02em | section headings |
| `--e-h1` | `clamp(2.25rem, 4vw, 3.5rem)` | 1.05 | -0.03em | one per page |
| `--e-price` | 2.5 / 40 | 1.0 | -0.02em | `--font-num`, tabular. The price is a number. |

**Weights: 400 / 500 / 600 / 700. No 800. No 900.** 500 becomes the UI default (replacing 950 `font-bold`), 600 for labels and emphasis, 700 for headings and primary buttons only. This alone restores hierarchy without touching a single size.

**Rules:**
- `font-variant-numeric: tabular-nums` on every table, KPI, meter, timecode, price and counter. Non-negotiable.
- Prose measure `66ch`; legal modal `62ch` (drops `LegalModals.tsx` from ~110ch to 62ch).
- Uppercase micro-labels: `--t-micro`, weight 600, `+0.06em`, `--text-lo`. **Budget: one per panel header.** Not 310.
- All-caps is banned for anything over 4 words. `AuthAndPricing.tsx:302` currently sets a 20-word paragraph in `uppercase tracking-wider`.
- One language per surface. `AuthAndPricing.tsx:297-301,624` and the studio tab rail (`App.tsx:2651-2660`: 8 English labels, 2 Portuguese) must pick Portuguese.

---

## Surface, Depth & Spacing

### Measured

**Radius — 8 values, 1,683 uses, no rule.**

`rounded-xl` 501 · `rounded-lg` 377 · bare `rounded` (4px) 344 · `rounded-full` 285 · `rounded-2xl` 113 · `rounded-md` 37 · `rounded-sm` 15 · `rounded-3xl` 11, plus 18 single-corner variants and 10 × `rounded-[1px]`.

Distinct radii per file: `StudioPreview.tsx` **12** · `WebinarPublicPage.tsx` **7** · `BillingDashboard.tsx` 7 · `App.tsx` 8 · `ControlTray.tsx` 6 · `AuthAndPricing.tsx` 6 · `PlansModal.tsx` 4 · `Header.tsx` 4. Nesting is unruled: `PlansModal.tsx:97` is a `rounded-3xl` shell containing `rounded-2xl` cards containing `rounded-xl` buttons containing `rounded-full` badges — four radii, three nesting levels, no relationship between them.

**Shadow — 255 uses across 6 tokens + 19 distinct arbitrary values + 30 colored glows.**

`shadow-2xl` 74 · `shadow-md` 69 · `shadow-lg` 49 · `shadow-xl` 33 · `shadow-sm` 30 · `shadow-inner` 8. There is no elevation logic: `shadow-2xl` (the app's heaviest) is used on modals *and* on inline sidebar panels *and* on the ControlTray. Then 30 colored glows (`shadow-blue-500/20` ×9, `shadow-blue-600/50`, `shadow-emerald-500/25`, `shadow-rose-600/30`…) and 19 hand-rolled `shadow-[…]` values including `shadow-[0_0_30px_rgba(6,182,212,0.15)]` wrapped **around the video frame** (`StudioPreview.tsx:2763`).

**Border — 1,627 declarations, 93 distinct colors, one accounts for half.** `border-slate-800` 579 + `/80` 150 + `/60` 54 + `/40` 14 + `/90` 12 + `/50` 4 + `/30` 1 = **816 (50.2%)**. Seven opacity levels of the same colour with no rule for choosing between them. Plus 57 `border-white/{5,10,15,20,25}` glass edges.

**Spacing — the one thing that is nearly right.** Only 2 arbitrary paddings and 1 arbitrary gap in the whole codebase; 95%+ of spacing sits on Tailwind's 4pt scale. `gap-2` 352 · `gap-1.5` 257 · `gap-1` 203 · `p-4` 148 · `p-3` 133. The failures are (a) `py-0.2` ×23 (0.8px — functionally zero, off-scale, `ScreenSharePickerModal.tsx:77,89,90`), `p-[1px]`, `p-[2px]`; and (b) **no density calibration between surfaces**. `py-0.5` (2px) is the single most common vertical padding at 187 uses, and `py-8`/`py-12`/`py-16` total 15. The pricing page (`AuthAndPricing.tsx:287` — `py-12`) and the studio operate on the same rhythm. A broadcast console should be dense; a pricing page should breathe. They are identical.

**Chrome vs content.** The studio grid (`App.tsx:1958-1966`) is `scenesWidth | 1fr | sidebarWidth` at defaults **240px / flex / 360px**, plus a 75px vertical tab rail (`App.tsx:2623`) = **675px of permanent chrome**. At 1440px that leaves the video 765px — **53% of the viewport**, before the 52 absolutely-positioned overlays inside `StudioPreview.tsx` are drawn on top of it. The stage itself is correctly `bg-black rounded-2xl` (`:2762`), but in studio-preview mode it acquires `border-2 border-cyan-500/70 ring-2 ring-cyan-500/20 shadow-[0_0_30px_…]` — the chrome glows brighter than the picture. **The video is not the hero.**

**Arbitrary values overall:** 2,129 total, 264 distinct — of which 1,191 are `text-*` and 693 are `bg-[#…]` (89 distinct backgrounds). **88% of arbitrary values are the two things that must be tokens: color and type size.**

### Proposed

**Radius — 4 steps + one shape rule.**

```
--r-1  3px    badges, chips, inline pills, cell fills — anything under 28px tall
--r-2  6px    buttons, inputs, list rows, dropdown items, tabs
--r-3  10px   panels, cards, modals, popovers, dropdown containers
--r-4  14px   the video stage well, full-screen overlays. Nothing else.
--r-pill      avatars, status dots, toggle knobs ONLY. Never buttons, never badges.
```
Rule: **a child's radius = parent's radius − the inset padding**, and never larger than its parent's. Max radius drops from 24px to 14px — large radii read consumer-app; a broadcast instrument reads tighter.

**Elevation — 3 levels, no colored glow, ever.**

```
--e-0  none. 1px solid var(--ink-200).      90% of surfaces. Depth = the neutral ramp.
--e-1  0 4px 12px rgba(0,0,0,.5), 0 0 0 1px var(--ink-200)     popovers, dropdowns
--e-2  0 24px 64px rgba(0,0,0,.7), 0 0 0 1px var(--ink-300)    modals only
```
Banned: all 30 `shadow-<color>` glows, all 19 arbitrary shadows, `drop-shadow` on the logo, and `backdrop-blur` everywhere except the single modal scrim. Elevation on a dark UI comes from **the surface stepping up the ramp** (`--ink-050 → --ink-100 → --ink-150`), not from black shadow that has nothing to fall on.

**Border — 3 recipes, total.**
```
default    1px solid var(--ink-200)                 all chrome division. One value, no opacity variants.
strong     1px solid var(--ink-300)                 modal edge, stage bezel
selected   1px solid var(--signal-500) + --signal-tint fill
focus      2px solid var(--signal-500), outline-offset 2px   — an outline, never a border-color swap
```
This retires 816 `border-slate-800*` and 93 distinct border colors.

**Spacing — keep the 4pt base, add density modes.**
```
Console   rhythm 4/6/8/12   panel padding 12   row height 28 / 32   section gap 16
Editorial rhythm 8/16/24/32/48/64   panel padding 32   section rhythm 64-96
```
Ban `py-0.2`, `p-[1px]`, `p-[2px]`. Minimum interactive row height 28px, minimum touch target 44px (the `touch-action-btn` utility in `index.css:336` already knows this — apply it).

---

## Surface-by-Surface Critique

### Auth / Pricing — `AuthAndPricing.tsx` (1,129 lines)

**Reads as:** a Restream screenshot someone rebuilt in Tailwind and did not finish.

- `:276` — a badge in the product's own navbar reading `RESTREAM MODE`.
- `:297-301` — the H1 is `One live video / 30+ destinations` in **English**, and the subhead is Restream's own marketing sentence verbatim: *"Restream helps you to go live on multiple platforms at the same time…"*. Source comments confirm the intent: `:260` "Styled like Restream Print 1 background", `:289` "RESTREAM LANDING PAGE (Print 1 Inspired)", `:618` "(Inspired by Print 2: Upgrade Page)". `:624` — `Upgrade to grow and engage your audience`, English H2 over a Portuguese body.
- `:298` — `bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent`. The single most recognizable AI-design signature, on the hero headline.
- `:300` — a 20-word value proposition set in `uppercase tracking-wider font-semibold`. All-caps destroys word-shape recognition; this is the sentence that has to do the selling.
- `:262-268` — an 800px `blur-[120px]` blue orb, a red dot, and an 11-line radiating SVG. Decoration standing in for a hero visual. **There is no product imagery anywhere on this page.**
- `:378-408` — three equal cards; `:648` — four equal plan cards with `absolute -top-3 right-4` badges at `text-[9px] font-black uppercase`. Badge soup on the conversion surface.
- `:680` — `text-3xl font-black text-white font-mono`: the price, the most important number on the page, in an undeclared system monospace at a weight that does not exist.
- `:686-694` — three CTAs in one row, three different colors (emerald-600 / `#4683E0` / slate-950). No primary. The eye has nowhere to go.
- `:41-49` — `cardNumber` initialises to `'4242 4242 4242 4242'`, `paypalEmail` to `'marcos-test@pwstreamer.com'`, `paypalPassword` to `'••••••••••'`. The checkout is pre-filled with Stripe test data.
- `:250` — `name: name || 'Marcos Gonçalves'`.

**Direction:** delete every English string and every Restream reference. One editorial ladder, `--e-h1` at `clamp(2.25rem,4vw,3.5rem)`, `-0.03em`, no gradient, sentence case, Portuguese. Replace the orb with a real product frame — a screenshot of the studio with a live stage, or nothing. One primary CTA in `--signal-500`, everything else `--e-0` ghost. Price in `--font-num` tabular at `--e-price`. Asymmetric split (copy left, product right), not centered-over-glow. Trust signals below the hero, not inside it.

### Public Webinar Page — `WebinarPublicPage.tsx` (504 lines)

**Reads as:** an internal demo fixture. This is the surface a streamer's own audience sees. It should be the best-looking file in the repo. It is one of the weakest.

- **Zero imagery.** `thumbnailUrl` is declared at `:23` and destructured at `:35` and **never rendered**. The only `<img>` on the page is a chat avatar. A registration landing page with no visual.
- **Fabricated social proof, hardcoded.** `:50` `pollVotes = {42, 28, 15}` · `:53-56` two Q&A entries with 12 and 7 upvotes · `:211` `382 participando` · `:340` `1.282 assistindo` · `:60` a countdown that starts at `{2h 45m 12s}` **on every page load**, for every visitor, forever. The streamer's audience is shown invented attendance figures.
- `:367` `bg-slate-850` and `:483` `border-slate-850` — **`slate-850` is not a Tailwind color.** The Share button has no background and the chat input has no border.
- `:151-152` — two blur orbs (500px blue, 400px indigo). The same decoration as the auth page, so the two public surfaces are visually interchangeable.
- Seven distinct radii on one page (`rounded`, `-md`, `-lg`, `-xl`, `-2xl`, `-3xl`, `-full`).
- Four body-text colours in one column: `text-gray-300`, `text-gray-400`, `text-[#d0cbdc]` (`:430`), `text-[#a59ebf]` (`:348,378`).
- **Hierarchy inverted.** The primary conversion CTA (`:300`) is `text-xs` — 12px. The countdown (`:225`) is `text-2xl`. Form labels and inputs are all `text-xs`. The page shouts the timer and whispers the button.
- `:148` `bg-slate-950` while the application shell is `#0F1115` — the marketing surfaces and the product are two different blacks.
- `:305-309` — trust strip is `Certificado • Material Complementar` with a `text-gray-600` middle dot.

**Direction:** this page gets the editorial ladder and a real hero image (speaker portrait or a still from the stream). Form fields at `--e-body` (16px) — 12px inputs also trigger iOS zoom-on-focus. Primary CTA at `--e-lead`, `--signal-500`, full-width. Every hardcoded metric either comes from real data or is removed; a countdown driven by `webinarDate`, not a constant. Registration card on `--ink-100` with `--e-0`, `--r-3`, no orbs. This page should be able to carry a client's brand color via `streamColor` — today that prop is accepted at `:37` and never applied.

### Dashboard — `App.tsx:2789-3050`

**Reads as:** the archetypal AI-generated admin home. If you needed one screenshot to illustrate the genre, this is it.

- `:2795` — `Olá, Marcos Gonçalves` is a **hardcoded string literal**, not `user.name`. Every customer is greeted by the developer's name.
- `:2814-2833` — four KPI tiles, `lg:grid-cols-4`, each `bg-[#16191E] border border-slate-800 p-5 rounded-2xl` with an `w-11 h-11 bg-[#0F1115] border border-slate-800 rounded-xl flex items-center justify-center` **icon tile** on the right. The exact stock card.
- `:2818-2821` — the metrics are `'14'`, `'4.829'`, `'1.240m'`, `'87%'` with deltas `'+2 este mês'`, `'+15% semana passada'`, `'Altamente positivo'`. All invented, all presented as real, none tabular.
- `:2804`, `:2959`, `:3249` — `animate-pulse` on decorative `Server`, `Sparkles` and `Palette` icons attached to static buttons. Motion as noise.
- `:3050` — the footer reads *"All Rights Reserved to **PwStreamer** Online. Developed and Maintained by **PWstreamer**"* — two spellings in one sentence.
- Four greys in one viewport: `text-[#a59ebf]`, `text-gray-200`, `text-gray-400`, `text-gray-500`.
- `:2790` `max-w-7xl … py-8 space-y-8` — the editorial container, filled with console-density content.

**Direction:** kill the icon tiles. A stat is a label and a number: `--t-micro` uppercase label in `--text-lo`, value in `--font-num` tabular at `--t-num` in `--text-hi`, delta in `--ready`/`--fail` at `--t-xs`. Separate the four with `1px solid var(--ink-200)` verticals, not four boxes. The webinar list should be `divide-y` rows at 48px, not nested cards. Greeting from `user.name`. Every number from Firestore or absent.

### Studio Shell — `App.tsx:1949-2700` + `StudioPreview.tsx` + `ControlTray.tsx` + `LeftSidebar.tsx`

**Reads as:** the only part of this product with a real point of view — buried under chrome that fights the picture.

- **The video is not the hero.** 675px of permanent chrome (240 scenes + 360 sidebar + 75 tab rail, `App.tsx:1963`, `:2623`) leaves 53% of a 1440px viewport for the stage, then draws 52 absolutely-positioned overlays on top of it (`StudioPreview.tsx`).
- `StudioPreview.tsx:2762-2764` — studio-preview mode wraps the stage in `border-2 border-cyan-500/70 ring-2 ring-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.15)]`. A neon halo around the one thing that should be quiet, in a seventh chromatic family.
- `ControlTray.tsx:267` — `bg-[#13151b] sm:bg-[#16191E]`: the tray is a different colour on mobile than on desktop. Five surface hexes in one 598-line component.
- `ControlTray.tsx:318,398` — `⚡ Ativar Dispositivos Reais`, emoji in a control-surface button. `:344,346` — `Real` / `Simulado` badges at `text-[7px] font-black uppercase`; simulated devices are a shipped, first-class UI concept.
- `App.tsx:2649-2658` — the primary tab rail is labelled `Chat, Widgets, Schedule, Design, Temas, Prompter, Video, Audience, Settings, Apps`: eight English, two Portuguese, at `text-[8px] uppercase`.
- 20 distinct z-index values including `z-[99999]`, `z-[10000]`, `z-[9999]`.
- `Header.tsx:94,125` — `⚡ Simular 30 Dias Expirados` and `↺ Restaurar 30 Dias (Demo)` shipped in the product header. `:80,102,133` — three notification bars, three different 3-stop gradients, plus a fourth on the "Adicionar canais" button (`:173`). `:151-162` — a desktop nav containing exactly one link, behind a `border-l` divider.

**Direction:** this is where the neutral graphite ramp earns its keep. Chrome at `--ink-050`/`--ink-100`, hairlines at `--ink-200`, **zero shadow**, zero blur, zero gradient. The stage well gets `--r-4`, `1px solid var(--ink-300)`, and nothing else — tally state is communicated by a 3px `--onair` frame plus the LIVE pill, never by a glow. Overlays get a 40%-black scrim with no blur. Collapse the overlay set into a single hover-revealed toolbar. Icon rail at 14px/1.5 stroke, labels at `--t-micro`. Full Portuguese. A documented z-scale: `10 chrome / 20 sticky / 30 overlay / 40 dropdown / 50 modal / 60 toast`.

### Billing — `BillingDashboard.tsx` (1,775 lines)

**Reads as:** three pricing tables that disagree with each other about what the product costs.

- **Price contradiction.** `BillingDashboard.tsx:149-199` and `AuthAndPricing.tsx:79,103,128`: **$14 / $29 / $49**. `PlansModal.tsx:75,82,89`: **R$ 49,90 / R$ 99,90 / R$ 199,90**. Same plan names, different currency, different numbers, ~3.5× apart. A user who saw $14 and clicks upgrade in-app is quoted R$ 199,90 for Business.
- **Feature contradiction.** `AuthAndPricing.tsx:85` Standard = "Transmissão simultânea para 3 canais"; `PlansModal.tsx:77` Standard = "Até 2 destinos simultâneos". Storage tiers exist in PlansModal and nowhere else.
- **Discount contradiction.** `BillingDashboard.tsx:447` says `Economize 20%`; `AuthAndPricing.tsx:642` says `2 meses grátis` (16.7%); the actual figures (14→11) are 21.4%. Three claims, one toggle.
- `:1217` — `<td className="py-3.5 px-4 font-bold">${invoice.amount.toFixed(2)} USD</td>`: the money column, left-aligned, proportional, no `font-mono`, no `tabular-nums`, while the invoice **ID** at `:1214` is `font-mono font-bold`. Currency is also rendered `$… USD` here while PlansModal charges R$.
- `:1218-1226` — Gateway is a `rounded text-[10px]` pill, Status is a `rounded-full text-[9px] uppercase` pill. Two badge shapes in adjacent columns.
- `:1462,1492,1522` — `text-3xl font-black text-white font-mono`: KPI values at weight 900 in an undeclared fallback mono.
- `:1378,1593-1712` — seat management hardcoded to `marcos`, `ana`, `lucas`.
- 20 × `border-slate-850` at `:1606-1723` — buttons with no border.

**Direction:** **one** pricing source of truth, one currency (BRL for a Brazilian product, with `Intl.NumberFormat('pt-BR')`), one plan schema imported by all three surfaces. Price at `--e-price` in `--font-num` tabular. Money columns right-aligned, tabular, `--text-hi`. One badge shape (`--r-1`) and one status tint recipe. Delete the "(Demo)" activation button from the paywall (`PlansModal.tsx:246`) — a free-plan-giveaway sitting beside the checkout CTA is the most expensive four lines in the repo.

### Admin — `AdminPanel.tsx`, `SuperAdminPanel.tsx`, `SuperAdminAnalytics.tsx`

**Reads as:** a Recharts starter template with Tailwind defaults.

- `SuperAdminAnalytics.tsx:35` — `COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6']`, the Tailwind 500 ramp verbatim, ignoring `#4683E0`.
- `:204-255` — four KPI cards, each with a tinted `rounded-xl` icon tile (`:207,220,236,247`), each with **the number tinted to match the tile** (`:211,224,240,251`): `text-blue-400`, `text-amber-400`, `text-emerald-400`, `text-purple-400`. Colour is decorating position, not meaning. Amber means *warning* on every other screen.
- `:227` — a **storage-usage** bar filled `bg-gradient-to-r from-amber-500 to-emerald-400`: it looks most alarming when empty and healthiest when full. Inverted semantics.
- Three chart surfaces, three axis greys: `#64748B` (`SuperAdminAnalytics.tsx:274`), `#6B7280` (`StudioPerformanceMonitor.tsx:180`), `#4B5563` (`SuperAdminPanel.tsx:748`).
- `AdminPanel.tsx:169-174` — tab labels are full sentences ("Destinos para Redes Sociais (YouTube / Facebook / Twitch)") at `text-xs uppercase tracking-wider`; the tab bar cannot hold one line.
- `AdminPanel.tsx:152` — `animate-spin` on the refresh button spins for as long as `isRefreshing` is true, with no floor or ceiling. → Lane C.
- `AdminPanel.tsx:202` — `Isolado para: {user?.email || 'mgdlms@gmail.com'}` in a badge. A hardcoded personal email as fallback.

**Direction:** the chart palette becomes `--c1…--c5` above, and the categorical hues stop overlapping status hues. Series colour is assigned by data identity, never by tile position. KPI values in `--text-hi` with `--font-num` tabular; colour returns to meaning only (`--ready` / `--warn` / `--fail`). Axes `--c-axis`, grid `--c-grid`, one value each. Tab labels become 1-2 words with the detail in a description row.

---

## The Direction

**PwStream should look like a broadcast instrument, not a SaaS dashboard.**

The product's job is to disappear. An operator is watching a picture and reading numbers under time pressure, and every hue in the chrome biases how they judge that picture. That is the whole argument, and it settles almost every decision below.

**Palette.** Hue-neutral graphite in six steps (`--ink-000` `#0A0A0B` through `--ink-300` `#34343A`), replacing `slate`, `gray` and 102 ad-hoc hexes. `slate` is removed on principle: a blue-tinted UI is a colorimetric lie next to video. Depth is the ramp, never shadow. Pure black exists exactly once — the video letterbox. Broadcast status (red on-air / green ready / amber degraded) is a reserved namespace that the brand may never borrow. The brand accent is **magenta `#FF3D9A`**, recovered from the third stop of the existing logo gradient, used only on the primary action, the focus ring and selection — never as a fill, a background, a gradient or a glow. Nobody in this category owns magenta; everybody owns blue.

**Type.** One family, **Geist**, and one numeric family, **Geist Mono** — variable, self-hosted, preloaded. Montserrat is deleted (zero consumers). Poppins is deleted (a display face doing console work at 9px). Two ladders: console 11/12/13/15/18 + 28 mono, editorial 16/18/24/32/48 + 40 mono. Four weights (400/500/600/700), with **500 as the UI default** — that single change restores hierarchy that 1,251 bold declarations destroyed. Negative tracking above 16px, `+0.06em` on 11px caps, prose at 1.6 and 66ch. `tabular-nums` everywhere a number appears — this is a product made of numbers.

**Radius / shadow / border.** Four radii (3/6/10/14) with a nesting rule; pill reserved for avatars, dots and knobs. Three elevations, and 90% of surfaces are flat. Three border recipes total, replacing 93 colors and 8 opacity variants. Zero colored glows, zero backdrop-blur outside the modal scrim, zero decorative gradients.

**Density.** Two calibrated modes, not one. Console: 4/6/8/12 rhythm, 28-32px rows, 12px panel padding. Editorial: 8/16/24/32/48/64, 64-96px section rhythm, 32px panel padding. The pricing page must breathe; the studio must not.

**Iconography.** Keep lucide (already a dependency). Four sizes only — 12/14/16/20, down from 22. `strokeWidth: 1.5` at ≤16px, `2` at 20px+; today 98% run at 2 and blow out at 10px. One glyph, one meaning: retire `Sparkles` (29 uses, 6 meanings). Zero emoji.

**Logo.** `PwStreamLogo.tsx` is a hexagon frame, a play triangle, dashed radar rings with `animate-ping`, a tri-color gradient stroke, a second and *different* tri-color gradient on the wordmark, a `drop-shadow` glow, `font-black` at a weight that isn't loaded, and a 9px mono tagline. It is six ideas. It also says **"PwStreamer"** while the file is `PwStream`, the meta title is `PwStreamer`, the legal copy is `PW Stream Online`, and the source contains ten spellings. Pick one name. Then pick one idea: the play triangle *or* the signal wave, monochrome `--text-hi` with the counterform in `--signal-500`, no gradient, no glow, no `animate-ping`, legible at 16px.

**Three references, and why:**
1. **DaVinci Resolve** — hue-neutral graphite chrome, flat panels, no shadow, accent used only for selection. The proof that a professional video tool's UI is grey *for a reason*, and the direct answer to 1,924 uses of `slate`.
2. **Linear** — the discipline of one grotesk, four sizes, 500 as the default weight, tight display tracking, real focus rings, and elevation used only where it means something. The exact counter-example to 310 uppercase-tracked badges.
3. **Figma's editor chrome** (the editor, not the marketing site) — how dense tooling sits *around* a canvas: a tiny consistent icon set, 28px rows, one accent for selection and primary action, and a canvas that owns the middle of the screen. The model for reclaiming the 47% of the studio currently spent on panels.

```css
/* src/index.css — replaces the current @theme block (index.css:4-7) */
@theme {
  /* ---- Type ---- */
  --font-sans: "Geist", "Inter Tight", system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --font-display: var(--font-sans);        /* one family. Montserrat is gone. */

  /* Console ladder */
  --text-micro:      0.6875rem;  --text-micro--line-height: 0.875rem;
  --text-xs:         0.75rem;    --text-xs--line-height:    1rem;
  --text-sm:         0.8125rem;  --text-sm--line-height:    1.125rem;
  --text-md:         0.9375rem;  --text-md--line-height:    1.375rem;
  --text-lg:         1.125rem;   --text-lg--line-height:    1.5rem;
  --text-num:        1.75rem;    --text-num--line-height:   1;
  /* Editorial ladder */
  --text-body:       1rem;       --text-body--line-height:  1.6rem;
  --text-lead:       1.125rem;   --text-lead--line-height:  1.75rem;
  --text-h3:         1.5rem;     --text-h3--line-height:    1.875rem;
  --text-h2:         2rem;       --text-h2--line-height:    2.3rem;
  --text-h1:         clamp(2.25rem, 4vw, 3.5rem);
  --text-price:      2.5rem;     --text-price--line-height: 1;

  --tracking-display: -0.03em;
  --tracking-head:    -0.02em;
  --tracking-tight:   -0.01em;
  --tracking-caps:     0.06em;

  --font-weight-normal:   400;
  --font-weight-medium:   500;   /* the UI default */
  --font-weight-semibold: 600;
  --font-weight-bold:     700;   /* the ceiling. No 800, no 900. */

  /* ---- Neutral: hue-neutral graphite. No slate, no gray. ---- */
  --color-ink-000: #0A0A0B;
  --color-ink-050: #121214;
  --color-ink-100: #17171A;
  --color-ink-150: #1E1E22;
  --color-ink-200: #26262B;   /* default hairline */
  --color-ink-300: #34343A;   /* strong hairline */
  --color-stage:   #000000;   /* video letterbox only */

  --color-text-hi:  #F2F2F3;
  --color-text:     #B4B4BA;
  --color-text-lo:  #7C7C86;
  --color-text-dim: #55555E;

  /* ---- Brand: one accent. Primary action, focus, selection. Nothing else. ---- */
  --color-signal-400: #FF6FB4;
  --color-signal-500: #FF3D9A;
  --color-signal-600: #E22B82;
  --color-signal-tint: color-mix(in oklab, #FF3D9A 12%, transparent);

  /* ---- Broadcast status: reserved namespace. Never brand, never decoration. ---- */
  --color-onair: #E5231A;
  --color-ready: #2DD46E;
  --color-warn:  #F0A020;
  --color-fail:  #FF5A4E;
  --color-info:  #6E7BFF;
  --color-onair-tint: color-mix(in oklab, #E5231A 12%, transparent);
  --color-ready-tint: color-mix(in oklab, #2DD46E 12%, transparent);
  --color-warn-tint:  color-mix(in oklab, #F0A020 12%, transparent);
  --color-fail-tint:  color-mix(in oklab, #FF5A4E 12%, transparent);

  /* ---- Charts: same system, hue-spaced, no overlap with status ---- */
  --color-c1: #FF3D9A;  --color-c2: #4DC9F0;  --color-c3: #F0A020;
  --color-c4: #2DD46E;  --color-c5: #A97BFF;
  --color-c-axis:  #55555E;
  --color-c-grid:  #26262B;
  --color-c-track: #1E1E22;

  /* ---- Radius: 4 steps. Child radius = parent − inset. ---- */
  --radius-1: 3px;    /* badges, chips, cell fills */
  --radius-2: 6px;    /* buttons, inputs, rows, tabs */
  --radius-3: 10px;   /* panels, cards, modals, popovers */
  --radius-4: 14px;   /* video stage, full-screen overlays. Nothing else. */
  /* rounded-full: avatars, status dots, toggle knobs ONLY */

  /* ---- Elevation: 3 levels. No colored glow. Ever. ---- */
  --shadow-e1: 0 4px 12px rgb(0 0 0 / 0.5), 0 0 0 1px var(--color-ink-200);
  --shadow-e2: 0 24px 64px rgb(0 0 0 / 0.7), 0 0 0 1px var(--color-ink-300);

  /* ---- Spacing: 4pt base, unchanged. Density is a rhythm, not a token. ---- */
  --spacing: 0.25rem;
}

@layer base {
  body {
    background-color: var(--color-ink-000);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-weight: var(--font-weight-medium);
    font-synthesis-weight: none;   /* surfaces any weight that isn't really loaded */
  }
  /* Numbers are the product. */
  table, [data-numeric], .kpi, .price, .timecode {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
  /* One focus recipe, everywhere. */
  :focus-visible {
    outline: 2px solid var(--color-signal-500);
    outline-offset: 2px;
  }
  /* Prose measure. */
  .prose { max-width: 66ch; line-height: 1.6; }
}
```

---

## Handoff

- **→ Lane A (accessibility/plumbing):** `slate-850` is not a Tailwind color and is used **20 times** as a border or background — `WebinarPublicPage.tsx:367,483`, `BillingDashboard.tsx:1606,1613,1657,1663,1717,1723`, and 13× in `ScreenSharePickerModal.tsx`. Those surfaces silently render with no border/fill. Related: **940 text elements at 4-10px** (`text-[4px]` ×6 up to `text-[10px]` ×489), which is a legibility failure before it is an aesthetic one.

- **→ Lane A (token plumbing):** the light theme in `index.css:139-333` works by escaping ~25 specific hex values into selectors (`.theme-light .bg-\[\#16191E\]`). Since `@theme` declares **zero color tokens** and there are **187 distinct hexes / 89 distinct `bg-[#…]`**, the override sheet covers a fraction of the palette and will break entirely the moment any hex changes. The `@theme` block I propose above is the prerequisite for that architecture working at all.

- **→ Lane C (motion):** 78 `animate-pulse`, 17 `animate-ping`, 6 `animate-bounce` and 22 `animate-spin`, overwhelmingly on non-status decoration — a pulsing `Server` icon on a static nav button (`App.tsx:2802`), `animate-bounce` on a success checkmark (`WebinarPublicPage.tsx:245`), `animate-ping` inside the logo mark (`PwStreamLogo.tsx:56`). Separately, `AdminPanel.tsx:152` applies `animate-spin` to the whole refresh button for as long as `isRefreshing` is true, with no minimum or maximum duration.
