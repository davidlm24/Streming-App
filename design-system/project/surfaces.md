# Surfaces

The product map, surface by surface, with the components each one is built from. Each screen keeps one primary action; everything else is state, a text action or a "⋯" menu.

## Public site

- **Início** (home): `PageHeader` with `display` h1 and `abertura`; the one image is the real Painel capture (`assets/Images/painel-exemplo.png`) in a `radius-xl` frame with a `line` border; sections "Já funciona", "Em breve", "Planos" (`PlanList`) and "Comece pelo teste grátis". Primary: "Criar conta" (`Button` lg) in the hero and in the closing section, never both in one viewport.
- **Entrar / Criar conta**: the Google button (`Button` ghost, full width, the coloured G) is the action, so the screen has no colour. Failures in a `role="alert"` line in `ink-hi` above it.

## Shell (between lives)

- **Painel**: the next live's title in `display`, "Entrar no estúdio" (`Button` lg, `action-gap` below) as the one action, the readiness line of `Chip`s (one per destination with its state), "Próximas lives" as `EventRow`s, "Canais" count beside the section title.
- **Canais** (destinations): a list of `ActionRow`s with the platform tile; "Conectar canal" opens the master-detail `Modal` (xl): platforms on the left, the form on the right (`Field`s for name, server and `StreamKey`), "Conectar canal" or "Salvar alterações" on the footer. Pending destinations say what is missing in words ("Falta a chave").
- **Webinars** (schedule): `EventRow`s with the hour in mono; "Agendar webinar" opens the `Modal` md form (Data and Hora side by side, options in a two-column `Checkbox` grid). Each row's "⋯" `Menu`: Inscrições, Criar capa, Excluir (`sig-texto`).
- **Gravações** (recordings, addition): `EventRow`s with duration in mono; "⋯" with Baixar, Publicar, Excluir. A recording in progress is said by a filled circle in `ink-hi` and the word "Gravando" with the elapsed in `measure`, never a red dot.
- **Análises** (analytics, addition): `StatTile`s (viewers peak, average, chat messages, watch time) and `ValueChart`s per destination, all on the ramp; a `Segmented` for the period.
- **Configurações**: `ActionRow`s to Ingestão (RTMP server and `StreamKey` for OBS/vMix), Integrações, Qualidade de vídeo, Capa, Equipe (addition: members and roles as list rows, "Convidar" as the one action), Notificações (`Switch` rows).
- **Plano e cobrança**: `PlanList` with the Mensal/Anual `Segmented` in the section header, `UsageMeter`s for hours, destinations and storage, invoices as list rows with `price`. No primary until checkout exists.
- **Dados de cadastro**: the registry `dl` (label, value `hairline-gap` below, origin line `chip-gap` below, "Editar" text action to the right); editing happens in place.
- **Administração** (internal): the customer list with a search control in the section header and `label` state words.

## Studio (the desk)

- **StudioBar**: monochrome logo, "Estúdio · session", the destinations count as a text action, `OnAir` (the "Ir ao ar" primary before air; the LIVE pill, the clock and "Encerrar" while on air), "Sair do estúdio" ghost sm.
- **SceneRail**: scenes as 56px rows (the one in preview rises to `raise`; the one on program says "programa" in `ink-hi`); `TransitionKeys` (Corte 0 ms, Fusão 400 ms) below a line; `LayoutPicker` for a scene's stage layout.
- **Monitor** desk: Program above (frame `n-14` at rest, `sig` + corner marks on air), Preview below (frame `n-89`), `NextCut` beside it listing what the cut carries. Labels sit outside the picture; nothing that would not go to air is drawn over it except the guides.
- **Tray**: microphone with the `AudioMeter`, camera, screen share, guides; device pickers as `Menu`s opening upward; on phones the words go to screen readers and the controls become 44px squares.
- **ToolRail** and panels: Chat (`ChatMessage` list, pinned comment, `ChatComposer`), Gráficos (`StageGraphics`: banner, ticker, logo, timer, QR, with corner pickers and colour), Roteiro (teleprompter), QR code, Mídia (clips), Câmera (card shape, framing, mirror, chroma), Convidados (addition: green-room rows with "Convidar" and the invite link in a `StreamKey`-style field), Destinos (addition: `DestinationHealth` rows while on air).
- **Stage graphics** are measured in fractions of the stage (`cqw`/`cqh`), inside the safe area (7% top and bottom, 6% sides), in the live's own colours (`g-fundo`, `g-texto`), identical in every theme.

## Viewer page (not yet shipped)

Registration, countdown, player, chat and polls for the public webinar page. It follows the shell's rules in the light or dark theme and will use `Field`, `Button`, `ChatMessage`, `ChatComposer` and `EventRow`; nothing here is drawn until the transmission exists.
