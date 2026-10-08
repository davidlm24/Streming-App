PwStreamer is a browser studio that puts one live on every channel at once. This system is the product's visual grammar, mined from the shipped code (`src/index.css`, `DESIGN.md`, the `ui/` primitives and the studio console) and extended to the full surface a multistreaming product needs: destinations, going on air, stream health, chat from every platform, recordings, analytics, scheduling, guests, teams and billing.

Its creative north star is **the launcher and the desk, soft-modern**. Outside the studio the app is a launcher: every screen has one action, and the rest is state, set on a narrow column over an 18-step navy ramp in Inter. Inside the studio it is a cutting desk: program and preview, scenes, keys, meters, a chat and a tray, always dark, with instrument numbers in mono — but the desk is upholstered, not industrial: generous radii, tonal controls separated by light instead of outlines, and four quiet shadow roles. Colour is scarce on purpose: **the brand blue fills the one action on the screen, and carmine means ON AIR.** Everything else, including "on", "selected", "current", "healthy" and "degraded", climbs or descends the neutral ramp and is said by an icon and a word.

## Content fundamentals

- Write in Brazilian Portuguese, sentence case, second person informal ("você"). Verbs on buttons name what happens to the object in view: "Conectar canal", "Salvar alterações", "Ir ao ar", "Encerrar transmissão". Never the dialog's title on its button.
- The product is **PwStreamer**; the legal entity is **PW Stream Online** (copyright and legal texts only). The two spellings differ on purpose.
- Honesty before effect. No invented numbers, viewers, customers or payments. Where there is no data, the screen says so in words: "Nenhum canal conectado.", "Nada muda: o preview está igual ao programa.", "A assinatura abre em breve, por aqui mesmo. Hoje nenhuma cobrança é feita."
- What is not shipped is said in a sentence in `label` or `body`, `ink-lo`, next to what it concerns. No disabled buttons, no "em breve" badges, no fake checkout.
- Numbers and units are glued with a non-breaking space ("3 horas", "30 dias", "−25 dB"), and the last two words of a short phrase too ("ao vivo", "no ar"). Multi-line `label`/`body` in narrow columns get `text-wrap: pretty`.
- No emoji. No uppercase tracked labels; the only uppercase text in the product is the "ONLINE STUDIO" tag inside the logo.
- Money is formatted by the app (`R$ 49,90`), never by hand, and set in `price` with tabular numerals.

## Colour

Use roles (`var(--ink)`, `var(--raise)`), never primitives (`n-*`) or raw hex in a component. The roles switch with the theme; the ramp never does.

- **Grounds.** Page in `bg`. Fields and sunken wells in `well`. Dialogs, the studio bar and tray in `surface`. One step up for what is chosen or hovered: `panel` for hover, `raise` for the chosen/active/pressed thing and for anything that floats (menu, toast).
- **Ink.** `ink-hi` for titles, names, the current item and anything that needs attention (a pending destination, a field error, the meter near the limit). `ink` for body. `ink-lo` for descriptions, hints and the metadata line. `ink-dim` only for placeholders and the unchecked box border, never under 12px.
- **Structure is a 1px line** in `line`, never a card: sections, lists and region borders stay hairline. **Controls are tonal**: they sit on a fill from the ramp (`well` sunken, `panel`/`raise` lifted) with the shadow of their role instead of a 1px outline. Form fields keep the solid `line-ctl` border — that is the field's grammar (a known contrast debt inherited from the source, kept exact and noted on the token).
- **The single-voice rule.** One screen, one coloured area: the primary `Button` in `brand-deep` with `on-brand` text. "On", "selected", "current", "ready" are said on the ramp: the switch on is full `ink-hi`, the active segment and the chosen row rise to `raise`, the current destination gets a 2px `ink-hi` underline. A screen that shows something you cannot do yet (plans before checkout) has no primary and therefore no colour.
- **The air rule.** `sig` is ON AIR: the program frame while live, the LIVE pill in the studio bar, the danger button that ends a transmission or deletes something. It never means warning, error, pending, recording or decoration, and it never enters a chart. A field error is `ink-hi` with an icon. A destination that dropped rises to `ink-hi` with an alert icon and the word "caiu".
- **The focus ring** is `focus` (brand-lift), 2px solid, offset 2px, 4px corner, on every surface, in every theme. It is the one exception to the single voice.
- **The brand gradient** (`brand-grad-from` to `brand-grad-mid` to `brand-grad-to`, three isoluminant stops) lives only inside the logo. In the console the logo is monochrome in `ink-hi`.
- **Platform marks are monochrome**: YouTube, Twitch, Facebook, Kick, TikTok, LinkedIn, Instagram, X and RTMP servers are drawn in `currentColor`, 1.75 stroke, from Lucide (Kick is the system's own K in the same stroke). The only coloured third-party mark is Google's G on the sign-in button.
- **Charts separate series by value on the ramp** (`chart-1` to `chart-5`), never by hue. The order survives protanopia, deuteranopia and greyscale.
- **Three themes.** `dark` is the shell's default; `light` is the shell's alternative; `console` is the studio and is always dark, even inside the light theme, because the operator's eyes adapt to the picture's surround and it cannot change mid-live. In code the console is a scope (`[data-surface="console"]`) over the same roles; here it is modelled as a theme so previews can show it.

## Typography

Inter, hosted by Google Fonts, in four sizes and up to four weights, carries every working label; Poppins survives only inside the logo (`display` family) as the brand's voice; the system mono stack for measures. Contrast comes from size and ink, not colour.

- `display` once per screen: the page h1 or the next live's title. `title` for sections, dialogs and the on-air session. `abertura` for the one sentence under a home h1.
- `body` is the working size; `body-strong` for names and field labels; `label` for the metadata line under a name, states, hints, errors, monitor labels and tool captions; `price` for money.
- Buttons use `button` (14px/600), `button-lg` for the screen's action, `button-sm` on dense surfaces.
- **Mono is the instrument voice.** `measure` for every live number, and only the number: dB, ms, bitrate, fps, dropped frames, latency, chat times, the hour inside a schedule phrase ("Hoje, às 20:00": only "20:00" is mono). `measure-lg` for the on-air clock and a stat headline. Always tabular numerals. Mono is never a label, a kicker or an ornament.
- Four sizes in the shell: 12, 14, 16, 30. A fifth size is debt.

## Spacing and layout

- The shell is one centred column of `column` (768px) with `row-y` gutters (`section-inset` from `sm`), `section-gap` on top (`page-top-wide` from `sm`) and `page-bottom` below. Header and footer run to `header-max` (1152px), so the column sits inset from the bar.
- Sections are `section-gap` apart, opened by a 1px `line` and `section-inset` to the title; content starts `row-y` below the title. List rows have `row-y` vertical padding and `line` dividers; full-page lists close with a line above and below.
- Forms: label, field `chip-gap` below, hint or error `chip-gap` below the field, `field-gap` between fields, `section-inset` from the guidance sentence to the first field. Two short fields sit side by side with `field-inset` between them.
- Dialogs: `modal-md` for a short form, `modal-lg` for a single-column list, `modal-xl` for master-detail (list 240px, 1px divider, detail `section-inset` from it; under `md` it becomes two steps with a "‹ Plataformas" text action to go back).
- The studio is a desk: scene rail left, monitors centre (program above, preview and next-cut below, the row as wide as the program), tools right behind a 72px rail, the tray at the foot. Every region is separated by a 1px `line`; the only floating thing is the device menu.

## Shape, depth and motion

- Controls are rounded (`radius-xl` for buttons, fields, rows and keys; `radius-2xl` for the next-cut box; `radius-3xl` for dialogs; `radius-full` for chips, switches, the segmented control, the meter track and the LIVE pill). The checkbox is 20px with `radius-check`. Monitors carry a quieter `radius-lg` (an image frame asks for discretion); the tally's corner marks stay square — the signal does not live in the radius. Stage graphics are square: what goes to air is its own vocabulary.
- Fields keep a solid border; a dashed border means "add" and nothing else, so a pending item never reads as an empty slot. Every other control is tonal, without an outline.
- Depth in four roles, per theme: `shadow-ctl` on buttons, active options and chips; `shadow-raise` on the transition keys; `shadow-menu` on the anchored menu (which scales in from its trigger corner); `shadow-float` on dialogs, toasts and the camera card over the stage. In the tray, state speaks by height: off sits sunken in the well, on rises to `raise` with `shadow-ctl`. Pressing any button scales it to 0.97 (160ms, strong ease-out).
- One moment of motion per page: a newly connected destination's chip slides in once; the outline slides over the home capture; the outgoing program fades in a Fusão (`dissolve`, 400ms). Dialogs enter with `enter` + `ease-enter` only through `Modal`. Buttons animate only `filter` (`tap`). A success mark scales once (`confirm`) and stops. Under `prefers-reduced-motion` everything becomes a cut and the ticker stands still.

## States

- Every state is an icon plus a word plus the full accessible name: "YouTube Principal: pronto", "Kick: sem chave", "Twitch: caiu". `aria-pressed`, `aria-current`, `aria-checked`, `aria-busy`, `aria-invalid` carry it; colour never carries it alone.
- Attention climbs the ramp: a pending destination, a field error, an unsaved value, a failed save, a dropped destination, a meter near the limit all go to `ink-hi` with an icon. What is in order stays in `ink-lo`.
- Saving: the control stays where it is and announces `aria-busy` at 45% opacity until the database confirms; "salvo" is said only after. Each failure has its own sentence with the way out, in a `role="alert"` line in `ink-hi` above the actions.
- Empty: a sentence ("Nenhum webinar agendado."), no number, no illustration. Loading: a skeleton in `panel` with `aria-busy`.
- Disabled: 45% opacity, `cursor: not-allowed`. A loading button is disabled **and** `aria-busy`, its icon replaced by a spinner.

## Iconography

Lucide, 16px in rows and buttons, 14px inside menus and chips, 18px in the tool rail, stroke 1.75, `currentColor`, `aria-hidden` with the name on the control. Platform marks come from the same set and the same stroke (`assets/Icons/kick.svg` is the one drawn by hand). The brand mark is the hexagon with the play glyph (`assets/Logos`): gradient in the shell, monochrome in the console, never redrawn.

## Intentional additions

The shipped code stops where the air begins: it has no go-live, no telemetry, no recording, no analytics, no guests. The product brief (a Restream-class multistreamer) needs them, so this system adds the following families on top of the source's own, each built from the rules above and marked "intentional addition" in its guidelines: `OnAir` (the go-live action, the LIVE pill and the on-air clock), `DestinationHealth` (per-destination bitrate, dropped frames and latency on the value ramp), `StreamKey` (reveal and copy an RTMP key), `LayoutPicker` (the stage layouts as tiles), `ChatMessage` and `ChatComposer` (the unified chat), `StatTile` and `ValueChart` (analytics on the ramp), `EventRow` (the schedule), `UsageMeter` (plan consumption), `EmptyState` and `Skeleton`.
