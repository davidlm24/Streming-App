The system's button: primary is the screen's one action, ghost is everything secondary, danger ends or deletes.

- Variants: `primary` (`brand-deep` fill with a 1px inner highlight and `shadow-ctl`, `on-brand` text, one per screen, never two in a viewport), `ghost` (tonal: `raise` fill, `ink`, a `line` hairline, hover lifts the border to `line-ctl`), `danger` (`sig` fill: "Encerrar transmissão", confirming a deletion).
- Sizes: default 9px × 18px in `button`; `lg` (13px × 24px, `button-lg`) only for the screen's action ("Entrar no estúdio", "Criar conta", "Ir ao ar"); `sm` (5px × 11px, `button-sm`, `radius-md`) on dense surfaces.
- States: hover `brightness(1.08)`; pressing scales to 0.97 over 160ms (strong ease-out) and dims to 0.95 — only `filter` and `transform` animate (`tap`); disabled at 45% with no shadow; `loading` disables **and** sets `aria-busy`, swapping the icon for a spinner.
- The label is the verb of what happens to the object in view. An icon goes left at 8px (`chip-gap`); the screen action takes an arrow on the right.
- Don't: put two primaries in one viewport; colour "Criar conta" in the public header (it is ghost there); use the brand blue for anything that is not this button.
