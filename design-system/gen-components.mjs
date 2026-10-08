// Writes components/<Comp>/README.md and preview.html for the catalogue below.
// Edit a component here, then run `npm run ds:build`; never edit the generated files by hand.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('./project/components/', import.meta.url));

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&display=swap" rel="stylesheet">';

function preview({ group, height, width, theme, body, pad = 16, bg }) {
  const root = theme === 'console'
    ? `<div id="root" class="pw pw-console" data-theme="console" style="padding:${pad}px"></div>`
    : `<div id="root" class="pw" style="padding:${pad}px${bg ? ';background:var(--' + bg + ')' : ''}"></div>`;
  return `<!-- @dsCard group="${group}" height=${height}${width ? ` width=${width}` : ''} -->
${FONTS}
${root}
<script>
(function(){
  var P = window.PwStreamer, h = React.createElement, I = function(n, s, x){ return h(P.Icon, Object.assign({ name: n, size: s || 16 }, x || {})); };
  var tree = (function(){ ${body} })();
  ReactDOM.createRoot(document.getElementById('root')).render(tree);
})();
</script>
`;
}

const row = (gap, ...kids) => `h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: ${gap}, alignItems: 'center' } }, ${kids.join(', ')})`;
const col = (gap, ...kids) => `h('div', { style: { display: 'flex', flexDirection: 'column', gap: ${gap} } }, ${kids.join(', ')})`;

const C = [];

C.push({ name: 'Logo', group: 'Brand', height: 150, readme: `The PwStreamer mark and wordmark, in the shell (gradient) or the console (monochrome).

- The consumer passes \`iconSize\`, \`textSize\` and, in the studio, \`monochrome\`. Nothing else is configurable: the mark is never redrawn, recoloured or placed on a busy ground.
- Shell header: \`iconSize 28\`, \`textSize "sm"\`. Studio bar: \`iconSize 24\`, \`textSize "sm"\`, \`monochrome\`. Public home hero: \`iconSize 48\`, \`textSize "xl"\`.
- The gradient (\`brand-grad-*\`) exists only here. The "ONLINE STUDIO" tag is part of the mark, not a label style.
- Do: wrap it in a button that names its destination ("PwStreamer, painel"). Don't: use the gradient version in the console, or the tag anywhere else.`,
  body: `return ${col(28, `h(P.Logo, { iconSize: 32, textSize: 'md' })`, `h(P.Logo, { iconSize: 48, textSize: 'xl' })`, `h('div', { className: 'pw-console', 'data-theme': 'console', style: { padding: 16, display: 'inline-flex', background: 'var(--surface)' } }, h(P.Logo, { iconSize: 24, textSize: 'sm', monochrome: true }))`)};` });

C.push({ name: 'Button', group: 'Actions', height: 170, readme: `The system's button: primary is the screen's one action, ghost is everything secondary, danger ends or deletes.

- Variants: \`primary\` (\`brand-deep\` fill, \`on-brand\` text, one per screen, never two in a viewport), \`ghost\` (transparent, \`ink\`, \`line-ctl\` border, hover \`raise\`), \`danger\` (\`sig\` fill: "Encerrar transmissão", confirming a deletion).
- Sizes: default 9px × 18px in \`button\`; \`lg\` (13px × 24px, \`button-lg\`) only for the screen's action ("Entrar no estúdio", "Criar conta", "Ir ao ar"); \`sm\` (5px × 11px, \`button-sm\`, \`radius-md\`) on dense surfaces.
- States: hover \`brightness(1.1)\`, active \`0.93\`, only \`filter\` animates (\`tap\`); disabled at 45%; \`loading\` disables **and** sets \`aria-busy\`, swapping the icon for a spinner.
- The label is the verb of what happens to the object in view. An icon goes left at 8px (\`chip-gap\`); the screen action takes an arrow on the right.
- Don't: put two primaries in one viewport; colour "Criar conta" in the public header (it is ghost there); use the brand blue for anything that is not this button.`,
  body: `return ${col(16, row(10, `h(P.Button, null, 'Conectar canal')`, `h(P.Button, { variant: 'ghost' }, 'Cancelar')`, `h(P.Button, { variant: 'danger' }, 'Encerrar transmissão')`, `h(P.Button, { disabled: true }, 'Salvar alterações')`, `h(P.Button, { loading: true }, 'Enviando')`), row(10, `h(P.Button, { size: 'lg', icon: I('arrowRight', 16) }, 'Entrar no estúdio')`, `h(P.Button, { size: 'sm', variant: 'ghost' }, 'Sair do estúdio')`, `h(P.Button, { size: 'sm' }, 'Entrar')`, `h(P.Button, { variant: 'ghost', icon: I('plus', 14) }, 'Novo banner')`))};` });

C.push({ name: 'IconButton', group: 'Actions', height: 90, readme: `A 44px icon-only button whose accessible name is part of the signature.

- The consumer supplies \`label\` (required) and the icon as children. No background at rest, \`raise\` on hover, \`radius-xl\`.
- Use for close, search, pin, the mobile menu. Don't: ship an icon button without a label, or shrink it below the 44px \`touch\` target except where the source already does (the 32px "⋯" trigger is known debt).`,
  body: `return ${row(8, `h(P.IconButton, { label: 'Buscar no chat' }, I('search', 18))`, `h(P.IconButton, { label: 'Fixar no programa' }, I('pin', 18))`, `h(P.IconButton, { label: 'Fechar' }, I('x', 18))`, `h(P.IconButton, { label: 'Abrir menu' }, I('more', 18))`)};` });

C.push({ name: 'TextAction', group: 'Actions', height: 110, readme: `A secondary action in text: no box, no colour.

- With \`onClick\` it is a button; with \`href\` it is an external link that opens a new tab and says so to screen readers, with the external-link icon after the label.
- \`ink-lo\` at rest, \`ink-hi\` + underline on hover. \`size "xs"\` in the footer, headers and beside a field label ("Mostrar chave"); default in the body.
- \`underlined\` for a link inside a sentence: \`ink-hi\`, underline in \`line-ctl\`, offset 4px.
- Pair with an icon on the left ("+ Conectar canal", "‹ Plataformas"). In a list row give it a 44px target with margin, not by changing the row height.`,
  body: `return ${col(14, row(20, `h(P.TextAction, { icon: I('plus', 14) }, 'Conectar canal')`, `h(P.TextAction, {}, 'Ver todos')`, `h(P.TextAction, { size: 'xs' }, 'Teste grátis · 12 dias')`, `h(P.TextAction, { href: 'https://studio.youtube.com' }, 'Abrir o YouTube Studio')`), `h('p', { style: { margin: 0, maxWidth: '60ch', color: 'var(--ink-lo)' } }, 'Nenhuma live agendada. Conecte um canal ou ', h(P.TextAction, { underlined: true }, 'agende o próximo webinar'), '.')`)};` });

C.push({ name: 'Menu', group: 'Actions', height: 220, readme: `Secondary actions behind a "⋯" trigger, so each list row keeps one visible action.

- WAI-ARIA menu button: arrows move, Home/End jump, Esc closes and returns focus to the trigger, clicking outside closes. Choosing an item returns focus to the trigger before the action runs.
- The popover sits on \`raise\` with a \`line\` border and \`shadow-menu\`, \`radius-xl\`, items \`radius-lg\`, hover \`panel\`. A destructive item (\`danger\`) is set in \`sig-texto\`.
- \`header\` pins a line above the items (name and e-mail in the account menu). \`side "up"\` for triggers at the foot of the screen (the tray). \`align "left"\` for triggers at the left edge. \`trigger\` replaces the "⋯" (the avatar, a chevron).`,
  body: `return h('div', { style: { display: 'flex', gap: 48, alignItems: 'flex-start', minHeight: 180 } },
    h('div', null, h('div', { className: 'label ink-lo', style: { marginBottom: 8 } }, 'Ações de um webinar'), h(P.Menu, { label: 'Ações de Lançamento de outubro', defaultOpen: true, align: 'left', items: [{ label: 'Inscrições', icon: I('users', 14) }, { label: 'Criar capa', icon: I('film', 14) }, { label: 'Excluir webinar', icon: I('trash', 14), danger: true }] })),
    h('div', { style: { marginLeft: 'auto' } }, h('div', { className: 'label ink-lo', style: { marginBottom: 8 } }, 'Conta'), h(P.Menu, { label: 'Conta', trigger: h('span', { className: 'pw-avatar' }, 'DG'), triggerClassName: 'pw-header__brand', header: h('div', null, h('div', { className: 'ink-hi', style: { fontWeight: 500 } }, 'Dona da conta'), h('div', { className: 'label ink-lo' }, 'dona@example.test')), items: [{ label: 'Dados de cadastro', icon: I('user', 14) }, { label: 'Plano e cobrança', icon: I('creditCard', 14) }, { label: 'Administração', icon: I('shield', 14) }, { label: 'Sair', icon: I('logOut', 14) }] })));` });

C.push({ name: 'Field', group: 'Forms', height: 300, readme: `A labelled form field with a hint or an error.

- Label in \`body-strong\` \`ink-hi\`; field 44px, \`well\` fill, \`line-ctl\` border, \`radius-xl\`, \`field-inset\` padding; hint in \`label\` \`ink-lo\` 8px below.
- \`error\` replaces the hint, sets \`aria-invalid\` and \`aria-describedby\`, and raises the border and the phrase to \`ink-hi\` with the alert icon. Never carmine: red is the air.
- \`action\` places a text action beside the label ("Mostrar chave"). \`mono\` for keys and URLs. \`as "textarea"\` or \`"select"\` keep the same skin.
- Fields are \`field-gap\` (20px) apart; two short ones (Data, Hora) sit side by side with \`field-inset\` between. Placeholder in \`ink-dim\`.`,
  body: `return ${col(20, `h(P.Field, { label: 'Nome do canal', placeholder: 'YouTube Principal', hint: 'Só você vê este nome.' })`, `h(P.Field, { label: 'Servidor RTMP', mono: true, defaultValue: 'rtmp://a.rtmp.youtube.com/live2', hint: 'Copie do painel da plataforma.' })`, `h(P.Field, { label: 'E-mail', type: 'email', defaultValue: 'dona@example', error: 'Esse e-mail está incompleto. Confira o que vem depois do @.' })`)};` });

C.push({ name: 'StreamKey', group: 'Forms', height: 130, readme: `A stream key or invite link, masked by default, with reveal and copy. Intentional addition for ingest (OBS, vMix) and guest invites.

- The consumer supplies \`value\` and a \`label\`. The field is read-only, mono, masked with bullets; "Mostrar chave" (a text action beside the label) reveals it; "Copiar" (ghost button) copies and says "Copiado" for 1.6s with \`aria-live\`.
- Keys are never shown by default, never logged, and never rendered in a URL. Rotating a key is a danger action in a confirmation dialog.`,
  body: `return h('div', { style: { maxWidth: 520 } }, h(P.StreamKey, { label: 'Chave de transmissão', value: 'pwst-7f3a-91kd-22be-ax0q', hint: 'Cole no OBS ou vMix como chave do servidor rtmp://ingest.pwstreamer.com/live.' }));` });

C.push({ name: 'Switch', group: 'Forms', height: 210, readme: `An on/off switch (\`role="switch"\`) whose "on" is full ink, not the brand colour.

- 40 × 24px pill, 16px thumb. Off: \`panel\` track, \`line-ctl\` border, \`ink-lo\` thumb. On: \`ink-hi\` track, \`bg\` thumb. The state lives in \`aria-checked\` and the thumb position, never in colour alone.
- \`busy\`: saving; the switch stays put at 45% with \`aria-busy\` and \`aria-disabled\` (not \`disabled\`, so keyboard focus is kept) until the database confirms.
- \`SwitchRow\` pairs it with a title and description in a list row with a \`line\` divider (notification settings, "Transmitir para YouTube").`,
  body: `return h('div', { style: { maxWidth: 520 } }, h(P.SwitchRow, { title: 'Transmitir para YouTube Principal', description: 'Entra no ar junto com os outros canais ligados.', checked: true, onChange: function(){} }), h(P.SwitchRow, { title: 'Avisar quando um destino cair', description: 'Um aviso no estúdio e um e-mail.', checked: false, onChange: function(){} }), h(P.SwitchRow, { title: 'Gravar a live na nuvem', description: 'Salvando…', checked: true, busy: true, onChange: function(){} }));` });

C.push({ name: 'Checkbox', group: 'Forms', height: 170, readme: `A checkbox already inside its labelled row: the whole 44px row is the target and the name.

- 20px box, \`radius-check\` (5px, below the scale so it never reads as a radio). Unchecked: \`well\` fill, \`ink-dim\` border (3:1 against every surface). Checked: \`ink-hi\` fill, the tick in \`bg\`. Never brand blue.
- Options in a dialog go in a two-column grid with 12px (16px from \`sm\`) between columns.`,
  body: `return h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px', maxWidth: 520 } }, h(P.Checkbox, { defaultChecked: true }, 'Página de inscrição'), h(P.Checkbox, {}, 'Lembrete por e-mail'), h(P.Checkbox, { defaultChecked: true }, 'Chat ao vivo'), h(P.Checkbox, { disabled: true }, 'Enquetes (em breve)'));` });

C.push({ name: 'Segmented', group: 'Forms', height: 130, readme: `A choice between a few exclusive options, side by side; the active one rises a step on the ramp.

- Outer \`radius-xl\` with a \`line-ctl\` border and 2px padding; options \`radius-md\`, \`ink-lo\`, the pressed one \`raise\` + \`ink-hi\` (\`aria-pressed\`).
- \`full\` divides the width equally for narrow columns (the studio panels). \`disabled\` while nothing may change (the timer while it runs).
- Used for theme, Mensal/Anual, the analytics period, the transition and the camera card shape.`,
  body: `return ${col(16, `h(P.Segmented, { label: 'Período de cobrança', options: [{ value: 'mensal', label: 'Mensal' }, { value: 'anual', label: 'Anual, 20% menos' }], value: 'anual' })`, `h('div', { style: { width: 264 } }, h(P.Segmented, { label: 'Formato do card', full: true, options: [{ value: 'rounded', label: 'Arredondado' }, { value: 'compact', label: 'Compacto' }, { value: 'circle', label: 'Círculo' }], value: 'rounded' }))`)};` });

C.push({ name: 'Slider', group: 'Forms', height: 150, readme: `A range control for the studio panels: a 4px \`line-ctl\` track and a 16px \`ink-hi\` thumb in a 24px target.

- The value reads in \`measure\` to the right of the label. \`format\` turns the number into its unit ("120%", "−6 dB").
- The focus ring is the global one. Disabled at 45%. Never a coloured accent.`,
  body: `return h('div', { style: { maxWidth: 264, display: 'flex', flexDirection: 'column', gap: 16 } }, h(P.Slider, { label: 'Tamanho do card', value: 120, min: 50, max: 200 }), h(P.Slider, { label: 'Volume do clipe', value: 70, format: function(v){ return v + '%'; } }), h(P.Slider, { label: 'Tolerância do croma', value: 35, disabled: true }));` });

C.push({ name: 'Chip', group: 'Destinations', height: 120, readme: `A destination with its state, clickable: the readiness line on the Painel.

- 36px pill, \`line-ctl\` border, name in \`ink-hi\`, platform mark on the left in \`ink-lo\`, hover \`raise\`.
- \`state "ready"\` shows a tick; \`"pending"\` an alert icon and the word (\`stateLabel\`: "sem chave", "sem servidor", "desligado", "não conectado"), always in the name's ink. The \`aria-label\` carries the whole phrase ("YouTube Principal: pronto"). Clicking a pending chip opens that destination's form at the missing field.
- \`add\` is the only dashed chip: "Conectar canal". A pending item never reads as an empty slot.
- Chips wrap with \`chip-gap\` between them (\`ChipRow\`).`,
  body: `return h(P.ChipRow, null, h(P.Chip, { platform: 'youtube', state: 'ready' }, 'YouTube Principal'), h(P.Chip, { platform: 'twitch', state: 'ready' }, 'Twitch'), h(P.Chip, { platform: 'kick', state: 'pending', stateLabel: 'sem chave' }, 'Kick'), h(P.Chip, { platform: 'custom', state: 'pending', stateLabel: 'desligado' }, 'Servidor RTMP próprio'), h(P.Chip, { platform: 'linkedin', state: 'pending', stateLabel: 'não conectado' }, 'LinkedIn'), h(P.Chip, { add: true }, 'Conectar canal'));` });

C.push({ name: 'PlatformIcon', group: 'Destinations', height: 150, readme: `The destination platform's mark in the product's stroke and the context's ink, never the owner's colours.

- Lucide outlines at stroke 1.75: YouTube, Twitch, Facebook, Instagram, LinkedIn, the note for TikTok, the K for Kick (drawn in-house), the round play for Rumble, the bird for X, the server for RTMP destinations, the TV as fallback. Each platform has its own icon; two never share one.
- \`PlatformTile\` frames it in the 40px \`platform-tile\` with \`radius-xl\` and a \`line\` border, for the Canais list.
- The G on the Google sign-in button is the only coloured third-party mark.`,
  body: `var all = ['youtube','twitch','facebook','instagram','linkedin','tiktok','kick','rumble','x','custom']; return ${col(16, `h('div', { style: { display: 'flex', gap: 16, color: 'var(--ink-hi)' } }, all.map(function(p){ return h(P.PlatformIcon, { key: p, platform: p, size: 20 }); }))`, `h('div', { style: { display: 'flex', gap: 8 } }, all.slice(0, 6).map(function(p){ return h(P.PlatformTile, { key: p, platform: p }); }))`)};` });

C.push({ name: 'DestinationHealth', group: 'Destinations', height: 260, theme: 'console', readme: `One row per destination while on air: signal bars on the ramp, the live numbers in mono, and the state in a word. Intentional addition.

- Columns: platform mark, name (\`body-strong\`), a five-bar signal (filled \`ink-hi\`, empty \`chart-5\`), bitrate, fps, dropped frames, latency, all \`measure\` tabular and right-aligned, then the state word.
- States: \`stable\` ("estável", \`ink-lo\`); \`unstable\` ("instável", \`ink-hi\`, two or three bars); \`down\` ("caiu", \`ink-hi\`, alert icon, no bars); \`reconnecting\` (spinner, \`aria-busy\`); \`off\` ("desligado"). Never green, amber or red: red is the air, and health is said by value and a word.
- \`DestinationHealthTable\` adds the column header. Lives in the Destinos tool panel and, summarised, in the studio bar ("Canais: 3 de 4 prontos").`,
  body: `return h(P.DestinationHealthTable, { rows: [
    { platform: 'youtube', name: 'YouTube Principal', bars: 5, bitrate: 6000, fps: 60, dropped: 0, latency: 1840, state: 'stable' },
    { platform: 'twitch', name: 'Twitch', bars: 4, bitrate: 5800, fps: 60, dropped: 3, latency: 2110, state: 'stable' },
    { platform: 'kick', name: 'Kick', bars: 2, bitrate: 2400, fps: 48, dropped: 212, latency: 4360, state: 'unstable' },
    { platform: 'custom', name: 'Servidor RTMP próprio', bars: 0, state: 'down' },
    { platform: 'facebook', name: 'Facebook', bars: 1, bitrate: 900, state: 'reconnecting' }
  ] });` });

C.push({ name: 'AppHeader', group: 'Navigation', height: 100, width: 960, readme: `The shell's header outside the studio: logo, four destinations and the account.

- 56px (\`header\`), \`bg\` with a \`line\` below, content to \`header-max\`. The current destination is \`ink-hi\` with a 2px \`ink-hi\` underline (\`aria-current="page"\`); the others \`ink-lo\`.
- Right side: the trial line as an \`xs\` text action ("Teste grátis · 12 dias"), the "Estúdio" ghost shortcut (hidden on the Painel, where entering the studio is the screen's action), and the account \`Menu\` behind the avatar.
- Under \`md\` the destinations collapse into a menu behind an \`IconButton\`. Sticky at \`z-sticky\`.`,
  pad: 0, body: `return h(P.AppHeader, { current: 'channels', trial: 'Teste grátis · 12 dias', user: { name: 'Dona da conta', email: 'dona@example.test', initials: 'DG' } });` });

C.push({ name: 'PageHeader', group: 'Navigation', height: 150, readme: `The page's title, one line of context and, on the right, the page's action.

- \`display\` h1 in \`ink-hi\` with \`text-wrap: balance\`; description \`chip-gap\` below in \`body\` \`ink-lo\`, \`max-width 65ch\`; the action aligned to the baseline, stacking below under \`sm\`.
- The action is the screen's one primary \`Button\`. Pages that cannot act yet (plans before checkout) pass none and therefore show no colour.`,
  body: `return h(P.PageHeader, { title: 'Canais', description: 'Para onde a live vai. Cada canal precisa de servidor e chave antes de entrar no ar.', action: h(P.Button, { icon: I('plus', 14) }, 'Conectar canal') });` });

C.push({ name: 'Section', group: 'Navigation', height: 230, readme: `A page section: a small title separated by a 1px line, never a card.

- \`section-gap\` above, a \`line\` on top, \`section-inset\` to the \`title\` h2, content \`row-y\` below. \`first\` drops the top margin under a page header.
- \`count\` sits 8px beside the title in \`body\` \`ink-lo\` ("12 cadastrados"). \`action\` sits to the right of the title, centred on its line (Mensal/Anual, a search field), and drops below it under \`sm\`.
- If it seems to need a card, it needs a section.`,
  body: `return h('div', null, h(P.Section, { id: 's1', title: 'Canais', count: '3 conectados', first: true, action: h(P.TextAction, { icon: I('plus', 14) }, 'Conectar canal') }, h(P.ChipRow, null, h(P.Chip, { platform: 'youtube', state: 'ready' }, 'YouTube Principal'), h(P.Chip, { platform: 'twitch', state: 'ready' }, 'Twitch'), h(P.Chip, { platform: 'kick', state: 'pending', stateLabel: 'sem chave' }, 'Kick'))), h(P.Section, { id: 's2', title: 'Próximas lives' }, h(P.EmptyState, { action: { label: 'Agendar webinar', icon: I('calendar', 14) } }, 'Nenhuma live agendada.')));` });

C.push({ name: 'ActionRow', group: 'Lists', height: 230, readme: `A list row that is an action: title, a sentence saying what is there, and an indicator of where it goes.

- \`row-y\` padding, title \`body-strong\` \`ink-hi\`, description \`label\` \`ink-lo\` 4px below, chevron in \`ink-lo\` that moves 2px and rises to \`ink-hi\` on hover. Rows are separated by \`line\` dividers (\`.pw-list\`).
- \`type "expand"\` opens content below (\`aria-expanded\`, \`aria-controls\`; the chevron rotates). \`side\` places a value before the indicator (a plan's price). \`leading\` takes a \`PlatformTile\`.
- Configurações is made of these; before, each item was a card with a coloured icon.`,
  body: `return h('ul', { className: 'pw-list', style: { maxWidth: 640 } }, h('li', null, h(P.ActionRow, { title: 'Ingestão por OBS, vMix ou Streamlabs', description: 'Servidor RTMP e chave de transmissão.' })), h('li', null, h(P.ActionRow, { title: 'Qualidade de vídeo', description: '1080p a 60 quadros, 6 000 kb/s.', side: h('span', { className: 'label ink-lo' }, '1080p60') })), h('li', null, h(P.ActionRow, { leading: h(P.PlatformTile, { platform: 'youtube' }), title: 'YouTube Principal', description: 'YouTube · pronto' })), h('li', null, h(P.ActionRow, { type: 'expand', expanded: true, title: 'Equipe', description: '2 pessoas · dona e operador' })));` });

C.push({ name: 'Modal', group: 'Feedback', height: 360, readme: `The overlay primitive: dialog semantics, focus trap, Esc, scrim click, scroll lock and focus return.

- Panel on \`surface\` with a \`line\` border, \`radius-2xl\`, \`shadow-float\`, entering with \`enter\` + 95% zoom; scrim \`scrim\` with a 2px blur at \`z-scrim\`, panel at \`z-modal\`.
- Sizes: \`sm\` (confirmations), \`md\` (\`modal-md\`, a short form), \`lg\` (\`modal-lg\`, a list), \`xl\` (\`modal-xl\`, master-detail). Header: optional icon, \`title\` h2, \`description\` p, the close button. Footer: ghost "Cancelar" then the verb button, 10px apart.
- \`dismissible false\` for destructive flows; \`busy\` while saving disables close, Esc and the scrim. The title never follows the inner selection: the verb goes on the button.
- A confirmation of something irreversible uses the \`danger\` button and focuses "Cancelar".`,
  pad: 0, body: `return h('div', { style: { position: 'relative', height: 328, background: 'var(--bg)' } }, h(P.Modal, { inline: true, size: 'sm', title: 'Remover canal?', description: 'O YouTube Principal sai da lista. A chave de transmissão fica no YouTube.', footer: [h(P.Button, { key: 'c', variant: 'ghost' }, 'Cancelar'), h(P.Button, { key: 'r', variant: 'danger' }, 'Remover canal')] }));` });

C.push({ name: 'Toast', group: 'Feedback', height: 250, readme: `A non-blocking notice, above every dialog (\`z-toast\`), polite to screen readers.

- On \`raise\` with a \`line-ctl\` border, \`radius-xl\`, \`shadow-float\`, sliding up 8px over \`enter\`. Title \`body-strong\` \`ink-hi\`, detail \`label\` \`ink-lo\`, an optional action underlined in \`ink-hi\`.
- Kinds: \`success\` (check icon), \`error\` (alert icon in \`sig-texto\`, the one place carmine says "failure", and it stays 6s), \`info\` (4s). Success stays 3.2s. At most four at once, bottom right.
- Replaced \`alert()\` and \`confirm()\`, which freeze the encoder mid-live.`,
  body: `return h('div', { className: 'pw-toaststack', style: { alignItems: 'flex-start' } }, h(P.Toast, { kind: 'success', title: 'Canal conectado', detail: 'YouTube Principal está pronto para a próxima live.' }), h(P.Toast, { kind: 'error', title: 'Não deu para salvar', detail: 'Sem conexão agora. Confira a internet e tente de novo.', action: { label: 'Tentar de novo' } }), h(P.Toast, { kind: 'info', title: 'O Kick caiu', detail: 'Reconectando. Os outros canais seguem no ar.', action: { label: 'Ver destinos' } }));` });

C.push({ name: 'EmptyState', group: 'Feedback', height: 120, readme: `A sentence for the absence of data, with the way forward as a text action. Intentional addition (the source says it in prose).

- \`body\` \`ink-lo\`, \`text-wrap: pretty\`, at most 65ch; no illustration, no number, no card. \`boxed\` closes it between two \`line\`s where a list would be.
- Say what is absent and what to do: "Nenhum webinar agendado." + "Agendar webinar". For what is not shipped, say so plainly: "A assinatura abre em breve, por aqui mesmo."`,
  body: `return ${col(8, `h(P.EmptyState, { boxed: true, action: { label: 'Conectar canal', icon: I('plus', 14) } }, 'Nenhum canal conectado.')`, `h(P.EmptyState, null, 'Os comentários das plataformas ainda não chegam ao estúdio. O chat mostra o que é enviado daqui.')`)};` });

C.push({ name: 'Skeleton', group: 'Feedback', height: 200, readme: `A loading placeholder in the shape of the list it replaces, announced with \`aria-busy\`. Intentional addition.

- Blocks in \`panel\`, \`radius-sm\` (the leading tile \`radius-xl\`), rows with \`line\` dividers at \`row-y\`. No shimmer: nothing in the shell loops.
- Show it only while nothing has arrived; never while re-fetching over existing rows.`,
  body: `return h('div', { style: { maxWidth: 560 } }, h(P.Skeleton, { rows: 3, label: 'Carregando canais' }));` });

C.push({ name: 'EventRow', group: 'Lists', height: 260, readme: `A webinar, live or recording in a list: title, the when or how long in mono, and one visible action with the rest behind "⋯". Intentional addition generalising the Painel's live rows.

- Title \`body-strong\` \`ink-hi\`; the metadata line in \`label\` \`ink-lo\` with the hour or duration in \`measure\` (only the number: "Hoje, às 20:00"). "Hoje" and "Amanhã" are derived on screen; the stored value is absolute.
- \`recording\` says "Gravando" with a filled \`ink-hi\` circle and the elapsed in mono. Not a red dot: red is the air.
- \`action\` is the one visible action (ghost \`sm\` "Entrar"); \`menu\` the rest (Inscrições, Criar capa, Baixar, Excluir in \`sig-texto\`).`,
  body: `return h('ul', { className: 'pw-list', style: { maxWidth: 640, listStyle: 'none', padding: 0, margin: 0 } }, h('li', null, h(P.EventRow, { title: 'Lançamento de outubro', when: { text: 'Hoje, às', time: '20:00' }, meta: '3 canais', action: h(P.Button, { variant: 'ghost', size: 'sm' }, 'Entrar'), menu: [{ label: 'Inscrições' }, { label: 'Criar capa' }, { label: 'Excluir webinar', danger: true }] })), h('li', null, h(P.EventRow, { title: 'Aula aberta: fluxo de caixa', when: { text: 'Domingo, 27 de setembro, às', time: '19:30' }, meta: 'YouTube e LinkedIn', menu: [{ label: 'Inscrições' }, { label: 'Excluir webinar', danger: true }] })), h('li', null, h(P.EventRow, { title: 'Bastidores da redação', recording: '00:42:17', action: h(P.Button, { variant: 'ghost', size: 'sm' }, 'Parar') })), h('li', null, h(P.EventRow, { title: 'Perguntas e respostas de setembro', when: { text: '24 de setembro, às', time: '20:00' }, duration: '1:12:40', meta: '1080p', action: h(P.TextAction, { size: 'sm', icon: I('download', 14) }, 'Baixar'), menu: [{ label: 'Publicar no YouTube' }, { label: 'Excluir gravação', danger: true }] })));` });

C.push({ name: 'PlanList', group: 'Account', height: 330, readme: `The plans as action rows: name and limits on the left, the price on the right, each opening its full list.

- Name in \`body-strong\`; the current plan says so in a word ("Standard · seu plano"), never by colour, border or badge. Limits in \`label\` \`ink-lo\` with non-breaking spaces ("3 canais ao mesmo tempo").
- Price in \`price\` (Poppins, tabular) with the yearly total in \`label\` below when annual. Features open below the row with ticks in \`ink-lo\`.
- Same list on the Plano page, in the studio's plans dialog and on the public home. No primary button until checkout exists: "A assinatura abre em breve" is said in words.`,
  body: `return h('div', { style: { maxWidth: 640 } }, h(P.PlanList, { defaultOpen: 'pro', plans: [
    { id: 'free', name: 'Teste grátis', limits: '1 canal · 2 pessoas na tela · 30 dias', price: 'Grátis', sub: 'por 30 dias' },
    { id: 'std', name: 'Standard · seu plano', limits: '3 canais ao mesmo tempo · 4 pessoas na tela · 20 horas de transmissão ao vivo', price: 'R$ 49,90/mês', current: false },
    { id: 'pro', name: 'Professional', limits: '8 canais ao mesmo tempo · 10 pessoas na tela · 60 horas de transmissão ao vivo', price: 'R$ 99,90/mês', features: ['Gravação na nuvem em 1080p', 'Destinos RTMP próprios', 'Sem marca d\\'água'] },
    { id: 'biz', name: 'Business', limits: 'Canais ilimitados · 20 pessoas na tela · horas ilimitadas', price: 'R$ 199,90/mês' }
  ] }));` });

C.push({ name: 'UsageMeter', group: 'Account', height: 260, readme: `Plan consumption as a thin bar on the ramp with the numbers in mono. Intentional addition.

- Title \`body-strong\`; "used de max unit" in \`measure\`; a 4px bar, unfilled in \`chart-5\`, filled in \`ink-lo\`. At 80% the fill and the note rise to \`ink-hi\` with the alert icon and the note says the way out. Never a colour scale.
- Used for streaming hours, destinations, storage, banners and tickers ("49 de 50 banners.").`,
  body: `return h('div', { style: { maxWidth: 560 } }, h(P.UsageMeter, { title: 'Horas de transmissão', used: 12.5, max: 20, unit: 'horas', note: 'Renova em 1 de novembro.' }), h(P.UsageMeter, { title: 'Mídia da conta', used: 171, max: 200, unit: 'MB', note: 'Perto do limite: apague clipes que não usa.' }), h(P.UsageMeter, { title: 'Canais guardados', used: 4, max: 32, unit: 'canais' }));` });

C.push({ name: 'Registry', group: 'Account', height: 260, readme: `The account's registry: label, value and the origin of the value, edited in place.

- Each row: label in \`label\` \`ink-lo\`, value \`hairline-gap\` below in \`ink-hi\`, the origin line \`chip-gap\` below ("É o e-mail com que você entra."), "Editar" as a text action on the right. Rows separated by \`line\`.
- Editing keeps the label, turns the value into a field, moves focus into it and back to "Editar" on close; Esc cancels. Values that come from another system (the sign-in e-mail) are not editable.`,
  body: `return h('div', { style: { maxWidth: 560 } }, h(P.Registry, { rows: [{ label: 'Nome', value: 'Dona da conta', origin: 'Aparece no chat e na página do webinar.', editable: true }, { label: 'E-mail', value: 'dona@example.test', origin: 'É o e-mail com que você entra.' }, { label: 'Plano', value: 'Standard · mensal', origin: 'Renova em 1 de novembro.' }] }));` });

C.push({ name: 'StatTile', group: 'Analytics', height: 170, readme: `A headline number for analytics, in the instrument voice. Intentional addition.

- Label \`label\` \`ink-lo\`; value in \`measure-lg\` (mono, tabular, \`ink-hi\`) with the unit small beside it; the comparison line in \`label\` \`ink-lo\`, in words ("12% a mais que a última live").
- Tiles sit in one row between two \`line\`s, separated by \`line\` dividers: no cards, no icons, no colour. Where there is no data the tile says "—" and the line says why.`,
  body: `return h(P.Stats, null, h(P.StatTile, { label: 'Pico de espectadores', value: '1 284', delta: '12% a mais que a última live' }), h(P.StatTile, { label: 'Média', value: '842' }), h(P.StatTile, { label: 'Tempo assistido', value: '1 930', unit: 'h' }), h(P.StatTile, { label: 'Mensagens no chat', value: '—', delta: 'O chat das plataformas ainda não chega.' }));` });

C.push({ name: 'ValueChart', group: 'Analytics', height: 260, readme: `A line chart whose series are separated by value on the ramp (\`chart-1\` to \`chart-5\`), never by hue. Intentional addition.

- Grid in \`chart-grid\`, axis in \`chart-axis\`, tick labels in \`measure\` \`ink-lo\`. The headline series is \`chart-1\` at 2px; the rest 1.5px, each a step darker. The legend uses the same squares.
- The order survives protanopia, deuteranopia and greyscale. Carmine never enters a chart. Up to five series; more belong in a table.`,
  body: `return h('div', { style: { maxWidth: 640 } }, h(P.ValueChart, { title: 'Espectadores por destino', ticks: ['20:00', '20:30', '21:00', '21:30'], series: [{ name: 'YouTube', values: [120, 380, 720, 1010, 1180, 1284, 1190, 940, 610] }, { name: 'Twitch', values: [60, 190, 330, 420, 470, 460, 410, 320, 240] }, { name: 'Kick', values: [10, 40, 90, 140, 160, 150, 120, 80, 50] }] }));` });

C.push({ name: 'StudioBar', group: 'Studio', height: 120, width: 1100, theme: 'console', readme: `The console's bar: monochrome logo, the session, the destinations count, the on-air control and the exit.

- 48px (\`studio-bar\`), \`surface\` with a \`line\` below. "Estúdio · session" in \`body-strong\`, the session in \`ink-lo\`. "Canais: 3 de 4 prontos" as an \`xs\` text action that opens the destinations panel.
- Before air: \`OnAir\` shows "Ir ao ar" (the one colour in the studio) or, with \`pending\`, a ghost button and what is missing. On air: the LIVE pill, the clock, "Gravando" if recording, and "Encerrar transmissão" in \`danger\`.
- "Sair do estúdio" is ghost \`sm\`. No theme toggle here: the console is invariant.`,
  pad: 0, body: `return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } }, h(P.StudioBar, { session: 'Lançamento de outubro', channels: 'Canais: 3 de 3 prontos' }), h(P.StudioBar, { session: 'Lançamento de outubro', channels: 'Canais: 3 de 4 prontos', live: true, elapsed: '01:42:07', recording: '01:42:07' }));` });

C.push({ name: 'OnAir', group: 'Studio', height: 150, theme: 'console', readme: `Going on air and being on air: the go-live action, the LIVE pill, the clock and the end action. Intentional addition.

- Before air: "Ir ao ar", \`Button\` \`lg\` primary with the radio icon, the one coloured area in the studio. With \`pending\` ("2 canais sem chave") it is ghost and disabled, and the pending phrase shows in \`ink-hi\` with the alert icon.
- On air: the LIVE pill (\`sig\` fill, \`on-sig\` text, \`radius-full\`, a 6px dot), the elapsed clock in \`measure\` (\`large\` for \`measure-lg\`), "Gravando" with its own elapsed, and "Encerrar transmissão" in \`danger\`, which opens a confirmation with cancel focused.
- The pill does not blink: the tally on the program monitor already signals. Reduced motion changes nothing here.`,
  body: `return ${col(20, `h(P.OnAir, { onGoLive: function(){} })`, `h(P.OnAir, { pending: '2 canais sem chave' })`, `h(P.OnAir, { live: true, elapsed: '01:42:07', large: true, recording: '00:12:40' })`)};` });

C.push({ name: 'SceneRail', group: 'Studio', height: 420, theme: 'console', readme: `The console's left rail: the scenes, and below a line, the transition.

- 240px wide, \`line\` on the right. "Cenas" in \`label\` \`ink-lo\`. Each scene is a 56px \`radius-xl\` row: name in \`body\` \`ink-hi\`, the state word below in \`label\` ("preview", "programa", "programa e preview", "sem tela compartilhada"). The one in preview rises to \`raise\` (\`aria-current\`); the one on program has its word in \`ink-hi\` 500. Hover \`panel\`.
- The row's height is fixed so a cut never moves the list under the pointer. Choosing a scene sends it to preview, never straight to program.
- Children (the \`TransitionKeys\`) render under "Transição" after a \`line\`.`,
  body: `return h(P.SceneRail, { scenes: [{ id: 'cam', name: 'Câmera', program: true }, { id: 'pip', name: 'Tela com câmera', preview: true }, { id: 'side', name: 'Câmera e tela lado a lado' }, { id: 'screen', name: 'Tela', noScreen: true }] }, h(P.TransitionKeys, { hasChange: true }));` });

C.push({ name: 'TransitionKeys', group: 'Studio', height: 130, theme: 'console', readme: `Corte and Fusão: the keys that send the preview to the program.

- Raised objects, not ghost buttons: \`raise\` fill, \`line-ctl\` border, 56px, \`radius-xl\`, the name in \`button\` and the duration inside in \`measure\` ("0 ms", "400 ms"). Hover lifts the border to \`ink-lo\`; pressing lights it to \`ink-hi\` and drops the fill to \`panel\`.
- Both disable while nothing differs (\`hasChange false\`) or a cut is running, and the note says "O preview está igual ao programa." Fusão's duration is \`dissolve\`; under reduced motion it becomes a cut.`,
  body: `return h('div', { style: { width: 224, display: 'flex', flexDirection: 'column', gap: 16 } }, h(P.TransitionKeys, { hasChange: true }), h(P.TransitionKeys, { hasChange: false }));` });

C.push({ name: 'Monitor', group: 'Studio', height: 300, width: 960, theme: 'console', readme: `A console monitor: the role and the scene above, the picture below, in a square tally frame.

- Label outside the picture: "Programa" or "Preview" in \`label\` 500 \`ink-hi\`, the scene name in \`ink-lo\`. Inside the picture only what goes to air, plus the guides (\`guia\`, difference blend) when asked.
- The frame (\`.pw-frame\`) is \`tally-ring\` 2px of padding: \`n-14\` on the program at rest, \`n-89\` on the preview (the two differ by value, 3.8:1 against carmine). With \`live\`, the program frame turns \`sig\` and the eight \`tally-mark\` corner marks (\`n-92\`, 10px outside) appear: the ring frames, the marks signal, and the marks are neutral so the state reads under any colour vision and under blur.
- The stage is \`stage\` black, 16:9, \`radius-2xl\`; the frame follows it. The desk keeps the preview row as wide as the program.`,
  pad: 24, body: `return h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 } }, h(P.Monitor, { role: 'program', scene: 'Câmera', layout: 'camera' }), h(P.Monitor, { role: 'program', scene: 'Câmera', layout: 'camera', live: true }), h(P.Monitor, { role: 'preview', scene: 'Tela com câmera', layout: 'pip', guides: true }));` });

C.push({ name: 'NextCut', group: 'Studio', height: 200, theme: 'console', readme: `What the next cut carries from preview to program, in words.

- Label outside like a monitor's ("No próximo corte"); a square box with a \`line\` border on \`panel\`, rows in \`body\` \`ink\` with an arrow in \`ink-lo\`, separated by \`line\`. Scrolls only past the preview's height; never stretched to it.
- Empty: "Nada muda: o preview está igual ao programa." in \`label\` \`ink-lo\`. This is where the approved console once put telemetry; without a transmission those numbers do not exist, and what the operator needs before cutting is what will change.`,
  body: `return h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 640 } }, h(P.NextCut, { changes: ['Entra a tela compartilhada', 'A câmera vai para o card, no canto de baixo à direita', 'Sai o banner "Inscrições abertas"'] }), h(P.NextCut, { changes: [] }));` });

C.push({ name: 'Tray', group: 'Studio', height: 130, width: 960, theme: 'console', readme: `The console's tray: microphone with the real meter, camera, screen, guides, and what is not yet possible, in words.

- \`surface\` with a \`line\` above, 8px gaps. Each control is a ghost \`Button\` with \`aria-pressed\`: on rises to \`raise\` + \`ink-hi\`, off sits in \`well\` + \`ink-lo\`; the icon and the word say the state ("Microfone mudo", "Câmera desligada"). On phones the word goes to screen readers and the control is a 44px square.
- A device picker is a chevron \`Menu\` glued to the control's right (\`radius-xl\` on the outer corner only), opening upward with the device in use ticked.
- The right-hand note says what is absent ("Transmitir para os canais ainda não está no ar.") instead of a disabled control.`,
  pad: 0, body: `return h(P.Tray, { state: { mic: true, camera: true, screen: false, guides: true }, level: 0.62, db: -18, peak: 0.71, mics: [{ label: 'Microfone (Yeti)', icon: I('check', 14) }, { label: 'Microfone do notebook', icon: h('span', { style: { width: 14, display: 'inline-block' } }) }], cameras: [{ label: 'Câmera (Logitech C920)', icon: I('check', 14) }, { label: 'Câmera integrada', icon: h('span', { style: { width: 14, display: 'inline-block' } }) }], note: 'Transmitir para os canais ainda não está no\\u00a0ar.' });` });

C.push({ name: 'AudioMeter', group: 'Studio', height: 140, theme: 'console', readme: `The microphone level from the stream itself: a segmented bar, the peak held one second, and the reading in dB.

- 96px × 8px (\`meter-h\`), square, on \`well\`, segments every 6px with a 1px gap in \`surface\`. Graduated by value, not hue: \`ink-lo\` below −12 dBFS, \`ink-hi\` above (\`db\`). The peak is a 2px \`ink-hi\` line. The reading ("−25 dB") is \`measure\` \`ink-lo\`; "—" when muted or silent.
- Writes straight to the DOM each frame in the product; never \`Math.random\`. Red never enters the meter: it is the air.`,
  body: `return ${col(12, `h(P.AudioMeter, { level: 0.45, db: -28, peak: 0.52 })`, `h(P.AudioMeter, { level: 0.86, db: -6, peak: 0.92 })`, `h(P.AudioMeter, { level: 0 })`)};` });

C.push({ name: 'ToolRail', group: 'Studio', height: 480, theme: 'console', readme: `The vertical tab list on the console's right edge: one tab per tool, the open one raised.

- 72px wide (\`tool-rail\`), \`line\` on the left. Each tab is 56px, \`radius-xl\`, an 18px icon over a \`label\` caption, \`ink-lo\`; hover \`panel\`; the selected one \`raise\` + \`ink-hi\` (\`aria-selected\`). WAI-ARIA tabs, vertical: one Tab stop, arrows move.
- Tools: Chat, Gráficos, Roteiro, QR code, Mídia, Câmera, and the additions Convidados and Destinos. Under \`lg\` the rail is sticky at the top while the panel scrolls.`,
  pad: 0, body: `return h('div', { style: { display: 'flex', justifyContent: 'flex-end', height: 480 } }, h(P.ToolRail, { active: 'destinos' }));` });

C.push({ name: 'LayoutPicker', group: 'Studio', height: 230, theme: 'console', readme: `The stage layouts as tiles: the chosen one rises on the ramp. Intentional addition.

- Four per row, each a \`radius-xl\` button with a \`line-ctl\` border: a 16:9 \`well\` tile with the sources drawn as \`ink-lo\` blocks, and the name in \`label\` below. Pressed: \`raise\`, \`ink-hi\` blocks, \`ink-lo\` border (\`aria-pressed\`).
- Layouts: Câmera, Tela com câmera, Lado a lado, Tela, Dois convidados, Grade, Apresentação, Galeria. Layouts that need a source the studio lacks (a guest, a screen) stay listed and the scene row says "sem tela compartilhada".`,
  body: `return h('div', { style: { maxWidth: 560 } }, h(P.LayoutPicker, { value: 'pip' }));` });

C.push({ name: 'StageGraphics', group: 'Studio', height: 420, width: 960, theme: 'console', readme: `What goes to air over the picture: logo, banner, pinned comment, QR card, timer and ticker, measured in fractions of the stage.

- Positions and sizes in \`cqw\`/\`cqh\` with the stage as container, inside the safe area (7% top and bottom, 6% sides), so the same banner covers the same part of preview and program. Never px.
- Colours are the live's, not the console's: \`g-fundo\` plate, \`g-texto\` and \`g-texto-2\` text, the QR card in \`g-qr\` white. The accent colour of the ticker tag is the operator's choice in Gráficos.
- Corners: logo and QR in the corners; banner and pinned comment stack on the left; timer centred; ticker across the foot (the corners lift above it). Graphics enter with the cut. The ticker runs \`ticker\` and stands still under reduced motion.`,
  pad: 24, body: `return h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 } }, h(P.StageGraphics, { layout: 'camera', graphics: { logo: true, banner: { title: 'Inscrições abertas até sexta', subtitle: 'pwstreamer.com/outubro' }, qr: { title: 'Garanta a vaga', price: 'R$ 197' }, ticker: { tag: 'Ao vivo', text: 'Pergunte no chat · Replay disponível por 7 dias · Cupom OUTUBRO vale até sexta' } } }), h(P.StageGraphics, { layout: 'pip', graphics: { comment: { author: 'Marina · YouTube', text: 'Vai ter replay dessa aula?' }, timer: { title: 'A oferta fecha em', time: '09:41' } } }));` });

C.push({ name: 'ChatMessage', group: 'Chat', height: 300, theme: 'console', readme: `One message of the unified chat: the platform mark, the author, the time in mono, the text, and the actions on hover. Intentional addition over the studio's chat list.

- Mark in \`ink-lo\`, author \`body-strong\` \`ink-hi\`, time \`measure\` \`ink-lo\` on the right, text \`body\` \`ink\` with \`text-wrap: pretty\`. Rows separated by \`line\`; each new one enters 6px up over 250ms.
- \`pinned\`: the row sits on \`panel\` with "Fixado no programa" and the pin icon; the same text goes to the stage as the pinned comment. \`flagged\`: the moderation note in \`ink-hi\` with the alert icon and "Liberar"; the text drops to \`ink-lo\`. Never red.
- Actions (pin, "⋯" with Responder, Ocultar, Banir autor in \`sig-texto\`) appear on hover or focus. Virtualised in the product.`,
  pad: 0, body: `return h('div', { style: { maxWidth: 420 } }, h(P.ChatMessage, { platform: 'youtube', author: 'Marina', time: '20:14', text: 'Vai ter replay dessa aula?', pinned: true }), h(P.ChatMessage, { platform: 'twitch', author: 'joaop_dev', time: '20:15', text: 'O áudio está ótimo hoje 👏' }), h(P.ChatMessage, { platform: 'kick', author: 'anon4421', time: '20:15', text: 'compra seguidor barato no meu perfil', flagged: 'Marcada pela moderação: parece spam.' }), h(P.ChatMessage, { platform: 'linkedin', author: 'Carla Mendes', time: '20:16', text: 'Dá para usar isso num time de 5 pessoas?' }));` });

C.push({ name: 'ChatComposer', group: 'Chat', height: 130, theme: 'console', readme: `The reply box at the foot of the chat, saying where the reply goes. Intentional addition.

- \`surface\` with a \`line\` above; a 44px auto-growing textarea in the field skin (\`well\`, \`line-ctl\`, \`radius-xl\`) and the primary "Enviar" with the send icon.
- \`to\` states the destinations in \`label\` \`ink-lo\` ("Vai para YouTube e Twitch"); when the platforms' chat is not connected it says so instead of promising. Enter sends, Shift+Enter breaks the line.`,
  pad: 0, body: `return h('div', { style: { maxWidth: 420 } }, h(P.ChatComposer, { author: 'Dona', to: 'Vai para YouTube Principal e Twitch.' }));` });

for (const c of C) {
  const dir = join(ROOT, c.name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'README.md'), c.readme.trim() + '\n');
  writeFileSync(join(dir, 'preview.html'), preview(c));
}
console.log('wrote', C.length, 'components:', C.map(c => c.name).join(', '));
