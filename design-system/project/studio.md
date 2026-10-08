# The desk: studio grammar

The studio is the only surface where a mistake is public. These rules make the state of the air legible at a glance and under stress.

## Program and preview

- Two monitors, both square-cornered frames (`tally-ring` 2px of padding around a 16:9 stage, `radius-0` frame around a `radius-2xl` stage, so the ring follows the stage's corner and nothing bleeds). Program frame `n-14` at rest; preview frame `n-89`. The two differ in VALUE (3.8:1 against `sig`), never only in hue.
- Labels ("Programa", "Preview", then the scene name in `ink-lo`) sit 8px above the picture in `label`, outside it. Nothing that would not go to air is drawn over the picture: no "PRÉVIA", "AO VIVO" or "PUSH TO LIVE" stickers. The only overlay is the guides (`guia`, thirds, safe area and centre, in `mix-blend-mode: difference`).
- Choosing a scene sends it to preview; Corte or Fusão sends preview to program. `NextCut` lists in words what the cut carries ("Entra a tela compartilhada", "Sai o banner"), or says "Nada muda".

## On air

- Before air the studio has one coloured thing: **"Ir ao ar"**, `Button` lg primary in the bar, once every destination is ready. Pending destinations keep it ghost and the bar says what is missing in words.
- On air: the program frame turns `sig` and the eight corner marks (`tally-mark` 4px, `n-92`, 10px outside the frame, arms 13% × 22%) appear. The ring frames; the marks signal. The marks are neutral, so the state reads under protanopia and in greyscale and under blur (6.8:1).
- The bar shows the LIVE pill (`sig` fill, `on-sig` text, `radius-full`, `label` weight 600) with the on-air clock in `measure-lg` beside it, tabular. The one coloured action becomes **"Encerrar transmissão"** (`Button` danger), confirmed by a dialog with cancel focused.
- Recording is not air: "Gravando" is a filled circle in `ink-hi`, the word, and the elapsed in `measure`. No red dot.

## Destinations while live

- `DestinationHealth` rows, one per destination: platform mark, name, a signal of five bars on the ramp (filled bars `ink-hi`, empty `chart-5`), then bitrate, fps, dropped frames and latency in `measure`, tabular, aligned in columns.
- Health is said in a word and climbs the ramp: "estável" in `ink-lo`; "instável" in `ink-hi` with the bars at two or three; "caiu" in `ink-hi` with an alert icon and the bars empty; "reconectando" with `aria-busy`. Never green, amber or red.
- Totals in the bar: "Canais: 3 de 4 prontos" as a text action that opens the destinations panel.

## Meters and keys

- The audio meter is value, not hue: `ink-lo` nominal, `ink-hi` above −12 dBFS, the peak held one second as a 2px `ink-hi` line, the reading "−25 dB" in `measure`. Segments every 6px with a 1px gap in `surface`.
- Transition keys are raised objects (`raise`, `line-ctl` border, 56px, `radius-xl`) with the duration inside in `measure`; pressing lights the border to `ink-hi` and drops the fill to `panel`.
- Tray controls: on rises to `raise` + `ink-hi`, off sits in `well` + `ink-lo`; the icon and the word say the state (`aria-pressed`).
- Tool tabs: 56px, icon 18px over a `label` caption; the open one rises to `raise`.

## Stage graphics

Banner, ticker, logo, timer, QR and pinned comment are measured in `cqw`/`cqh` so they cover the same part of the picture on preview and program. They enter with the cut (dry on Corte, dissolving on Fusão). The plate is `g-fundo` with `g-texto`; the QR card is `g-qr` white because phones read it best. The ticker runs `ticker` (20s) linear and stands still under reduced motion.

## Keyboard

Scenes, keys, tray and tools are all operable by keyboard: the tool rail is a vertical tab list (one Tab stop, arrows move), the tray controls are toggle buttons, Esc closes any menu and returns focus to its trigger, and the focus ring (`focus`) is visible over every surface including the stage.
