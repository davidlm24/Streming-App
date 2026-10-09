# The desk: studio grammar

The studio is the only surface where a mistake is public. These rules make the state of the air legible at a glance and under stress.

## Program and preview

- Two monitors with a quiet corner: `radius-lg` (12px, less than a control's, because an image frame asks for discretion), each a `tally-ring` 2px of padding around a 16:9 stage, the frame's radius following the stage's by the ring's width so nothing bleeds. Program frame `n-14` at rest; preview frame `n-89`. The two differ in VALUE (3.8:1 against `sig`), never only in hue.
- Labels ("Programa", "Preview", then the scene name in `ink-lo`) sit 8px above the picture in `label`, outside it. Nothing that would not go to air is drawn over the picture: no "PRÉVIA", "AO VIVO" or "PUSH TO LIVE" stickers. The only overlay is the guides (`guia`, thirds, safe area and centre, in `mix-blend-mode: difference`).
- Choosing a scene sends it to preview; Corte or Fusão sends preview to program. `NextCut` lists in words what the cut carries ("Entra a tela compartilhada", "Sai o banner"), or says "Nada muda", in a `radius-2xl` box on `panel` without an outline.

## On air

- Before air the studio has one coloured thing: **"Ir ao ar"**, `Button` lg primary in the bar, once every destination is ready. Pending destinations keep it ghost and the bar says what is missing in words.
- On air: the program frame turns `sig` and the eight corner marks (`tally-mark` 4px, `n-92`, 10px outside the frame, arms 13% × 22%) appear. The ring frames; the marks signal; the marks stay square whatever the frame's corner. The marks are neutral, so the state reads under protanopia and in greyscale and under blur (6.8:1).
- The bar shows the LIVE pill (`sig` fill, `on-sig` text, `radius-full`, `label` weight 600) with the on-air clock in `measure-lg` beside it, tabular. The one coloured action becomes **"Encerrar transmissão"** (`Button` danger), confirmed by a dialog with cancel focused.
- Recording is not air: "Gravando" is a filled circle in `ink-hi`, the word, and the elapsed in `measure`. No red dot.

## Before air

- `Readiness` lists what the air waits for: devices, each destination, the connection, the recording. In order stays `ink-lo`; what is missing climbs to `ink-hi` with the alert icon and the text action that fixes it. Its sum ("2 itens faltam antes de ir ao ar.") is the same sentence `OnAir` shows as `pending`.
- Pressing "Ir ao ar" starts the `Countdown` cue (3, 2, 1, Ar) in a `panel` box (`radius-2xl`, `shadow-raise`) over the program's label, `aria-live="assertive"`; the program frame turns `sig` on "Ar", not before. The cue is neutral so that carmine arrives with the air and nothing else.

## Destinations while live

- `DestinationHealth` rows, one per destination: platform mark, name, a signal of five bars on the ramp (filled bars `ink-hi`, empty `chart-5`), then bitrate, fps, dropped frames and latency in `measure`, tabular, aligned in columns.
- Health is said in a word and climbs the ramp: "estável" in `ink-lo`; "instável" in `ink-hi` with the bars at two or three; "caiu" in `ink-hi` with an alert icon and the bars empty; "reconectando" with `aria-busy`. Never green, amber or red.
- Totals in the bar: "Canais: 3 de 4 prontos" as a text action that opens the destinations panel.

## Meters and keys

- The audio meter is value, not hue: `ink-lo` nominal, `ink-hi` above −12 dBFS, the peak held one second as a 2px `ink-hi` line, the reading "−25 dB" in `measure`. Segments every 6px with a 1px gap in `surface`; the track is a pill.
- Transition keys are raised objects (`raise` with `shadow-raise`, no outline, 56px, `radius-xl`) with the duration inside in `measure`; hover lights a `line-ctl` border, pressing lights it to `ink-lo`, drops the fill to `panel` and scales the key to 0.97.
- Tray controls say their state by height as well as by the icon and the word (`aria-pressed`): on rises to `raise` + `ink-hi` with `shadow-ctl`; off sits sunken in `well` + `ink-lo`, without an outline.
- Tool tabs: 56px, icon 18px over a `label` caption; the open one rises to `raise` with `shadow-ctl`.

## Guests and sources

- The Convidados panel: the invite link in a `CopyField` at the top, then `GuestRow`s, waiting room first (`ink-hi` with the alert icon, because someone is waiting on the operator), stage below (on `panel`). "Admitir ao palco" and "Tirar do palco" are ghost `sm`; mic and camera are icons on the ramp, never a red slash.
- Admitting a guest is a cut: the guest enters the preview's layout first, and `NextCut` says "Entra Marina Costa". The guest's own view is the viewer `Player` with their camera card over it and no studio controls.
- The Fontes panel lists the preview scene's `SourceRow`s in stage order. A device that went away says what happened in `ink-hi` ("câmera desconectada") and disables its switch; the program keeps the last frame until the next cut.
- The Mídia panel is a `MediaGrid`; choosing a tile sends it to preview. The Roteiro panel is the `Teleprompter`, the operator's and never the stage's.

## Polls and alerts

- A `Poll` is made in the Enquetes panel, launched to the chat of every destination that supports it and to the viewer page, and shown on the program as a graphic in the live's colours through "Mostrar no programa". Results are shares on the ramp; the leading option is the only emphasis.
- `StageAlert` is the one graphic that enters on its own: a follower, a member, a guest, a raised hand, chosen per platform under Gráficos, one at a time, held `alert-hold` and gone. It is never a payment and never a sound.

## Stage graphics

Banner, ticker, logo, timer, QR and pinned comment are measured in `cqw`/`cqh` so they cover the same part of the picture on preview and program. They enter with the cut (dry on Corte, dissolving on Fusão). The plate is `g-fundo` with `g-texto`; the QR card is `g-qr` white because phones read it best. The ticker runs `ticker` (20s) linear and stands still under reduced motion.

## Keyboard

Scenes, keys, tray and tools are all operable by keyboard: the tool rail is a vertical tab list (one Tab stop, arrows move), the tray controls are toggle buttons, Esc closes any menu and returns focus to its trigger, and the focus ring (`focus`) is visible over every surface including the stage.
