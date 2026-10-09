# Surfaces

The product map, surface by surface, with the components each one is built from. Each screen keeps one primary action; everything else is state, a text action or a "⋯" menu.

## Public site

- **Início** (home): `PageHeader` with `display` h1 and `abertura`; the one image is the real Painel capture (`assets/Images/painel-exemplo.png`) in a `radius-xl` frame with a `line` border; sections "Já funciona", "Em breve", "Planos" (`PlanList`) and "Comece pelo teste grátis". Primary: "Criar conta" (`Button` lg) in the hero and in the closing section, never both in one viewport.
- **Entrar / Criar conta**: `SignInButton` (ghost, full width, the coloured G) is the action, so the screen has no colour. Failures in a `role="alert"` line in `ink-hi` above it; the legal line below in `label`.
- **Termos, Privacidade, Ajuda**: `Prose` in one `column`, the entity named as PW Stream Online, `Tabs` between the three when they share a page.

## Shell (between lives)

- **Painel**: the next live's title in `display` with a `Countdown` under it, "Entrar no estúdio" (`Button` lg, `action-gap` below) as the one action, the readiness line of `Chip`s (one per destination with its state), "Próximas lives" as `EventRow`s, "Canais" count beside the section title. A first-run account sees the `Stepper` (Conectar um canal, Testar câmera e microfone, Agendar, Ir ao ar) in place of the next live; a trial near its end gets a `Notice` above the sections.
- **Canais** (destinations): a list of `ActionRow`s with the platform tile; "Conectar canal" opens the master-detail `Modal` (xl): `PlatformPicker` (`list`) on the left, the form on the right (`Field`s for name, server and `StreamKey`; for YouTube, Twitch and Kick also the live's title, description and visibility as plain `Field`s and a `Segmented`), "Conectar canal" or "Salvar alterações" on the footer. Pending destinations say what is missing in words ("Falta a chave"). A destination's `SwitchRow` ("Transmitir para …") decides whether it goes on air with the others.
- **Webinars** (schedule): `EventRow`s with the hour in mono; "Agendar webinar" opens the `Modal` md form (Data and Hora side by side, options in a two-column `Checkbox` grid). Each row's "⋯" `Menu`: Inscrições, Criar capa, Excluir (`sig-texto`).
- **Gravações** (recordings, addition): `Tabs` (Gravações, Clipes); `EventRow`s with duration in mono, or `MediaGrid` of `MediaTile`s for clips; `SearchField` in the section header, `Pagination` below. "⋯" with Baixar, Publicar, Criar clipe, Excluir (`ConfirmDialog`). A recording in progress is said by a filled circle in `ink-hi` and the word "Gravando" with the elapsed in `measure`, never a red dot. An export in progress is a `ProgressBar` row.
- **Análises** (analytics, addition): `Tabs` (Visão geral, Por destino, Chat, Inscrições); `StatTile`s (viewers peak, average, chat messages, watch time), `ValueChart`s over time, `BarChart` per destination and a `DataTable` of lives, all on the ramp; a `Segmented` for the period. No number is estimated: where a platform does not report, the tile says "—" and why.
- **Configurações**: `ActionRow`s to Ingestão (RTMP server as `CopyField`, `StreamKey` for OBS/vMix), Integrações, Qualidade de vídeo (`Segmented` for resolution and a `Slider` for bitrate with the value in `measure`), Capa (`UploadZone` compact), Equipe (addition: `MemberRow`s, "Convidar" as the one action, which opens a `Modal` md with the e-mail `Field` and the role `Segmented`), Notificações (`SwitchRow`s per event and channel, and the inbox of `NotificationRow`s under its own tab), Atalhos (`Kbd` in sentences).
- **Plano e cobrança**: `PlanList` with the Mensal/Anual `Segmented` in the section header, `UsageMeter`s for hours, destinations and storage, invoices as a `DataTable` (date mono, description, amount in `price`, "Baixar" text action). No primary until checkout exists; the sentence "A assinatura abre em breve, por aqui mesmo. Hoje nenhuma cobrança é feita." sits where the button would.
- **Dados de cadastro**: `Avatar` lg beside the name, then the `Registry` (label, value `hairline-gap` below, origin line `chip-gap` below, "Editar" text action to the right); editing happens in place. "Excluir conta" is a text action in `sig-texto` at the foot, behind a `ConfirmDialog`.
- **Administração** (internal): the customer list as a `DataTable` with `SearchField` in the section header, `Pagination` below, and `label` state words; a customer's row opens the same `Registry` read-only.

## Studio (the desk)

- **StudioBar**: monochrome logo, "Estúdio · session", the destinations count as a text action, `OnAir` (the "Ir ao ar" primary before air; the LIVE pill, the clock and "Encerrar" while on air), "Sair do estúdio" ghost sm.
- **SceneRail**: scenes as 56px rows (the one in preview rises to `raise`; the one on program says "programa" in `ink-hi`); `TransitionKeys` (Corte 0 ms, Fusão 400 ms) below a line; `LayoutPicker` for a scene's stage layout.
- **Monitor** desk: Program above (frame `n-14` at rest, `sig` + corner marks on air), Preview below (frame `n-89`), `NextCut` beside it listing what the cut carries. Labels sit outside the picture; nothing that would not go to air is drawn over it except the guides.
- **Tray**: microphone with the `AudioMeter`, camera, screen share, guides; device pickers as `Menu`s opening upward; on phones the words go to screen readers and the controls become 44px squares.
- **ToolRail** and panels: Chat (`ChatMessage` list, pinned comment, `ChatComposer`), Gráficos (`StageGraphics`: banner, ticker, logo, timer, QR, with corner pickers and colour), Roteiro (teleprompter), QR code, Mídia (clips), Câmera (card shape, framing, mirror, chroma), Fontes (addition: `SourceRow`s of the scene in preview), Roteiro (`Teleprompter`), Mídia (`MediaGrid` of `MediaTile`s with an `UploadZone` compact at the top), Convidados (addition: the invite link in a `CopyField`, then `GuestRow`s: waiting room first, stage below), Enquetes (addition: `Poll`s with the operator controls), Destinos (addition: `Readiness` before air, `DestinationHealth` rows while on air). Alerts (`StageAlert`) are chosen per platform under Gráficos.
- **Stage graphics** are measured in fractions of the stage (`cqw`/`cqh`), inside the safe area (7% top and bottom, 6% sides), in the live's own colours (`g-fundo`, `g-texto`), identical in every theme.

## Viewer page (designed; waits for the transmission)

The public page of a webinar, at `pwstreamer.com/ao-vivo/<slug>`, in the shell theme the visitor chooses. Nothing here is drawn until the transmission exists; the state of the live decides the page.

- **Before air**: `WatchHeader` with "Começa …" and "Inscrever-se" (`Button` lg) as the one action; the `Modal` md form asks name and e-mail (`Field`s) and nothing else. Registered: ghost "Inscrição confirmada", a `Countdown` under the title, the `Player` in `upcoming`. "Compartilhar" and the `CopyField` with the link for whoever wants to send it on.
- **On air**: `Player` live (console chrome, LIVE pill, viewers in `measure`), the `WatchHeader` with the count, the chat as viewer `ChatMessage`s with `ChatComposer`, `ReactionBar` under the player, a `Poll` when the operator launches one. No primary: the page is for watching.
- **After air**: `Player` in `ended`, then `vod` once the recording is published, with chapters; "Ver a gravação" is the one action until then. The chat becomes read-only history.
- **Embed**: the same `Player` alone, taken from `CopyField` (multiline) on the webinar's row.
- Tips, subscriptions and payments stay on the platforms; the page links out in a sentence and collects nothing.
