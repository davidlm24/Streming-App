/* @ds-bundle: {"format":4,"namespace":"PwStreamer","components":[{"name":"Logo"},{"name":"Button"},{"name":"IconButton"},{"name":"TextAction"},{"name":"Menu"},{"name":"Field"},{"name":"StreamKey"},{"name":"Switch"},{"name":"Checkbox"},{"name":"Segmented"},{"name":"Slider"},{"name":"Chip"},{"name":"PlatformIcon"},{"name":"DestinationHealth"},{"name":"AppHeader"},{"name":"PageHeader"},{"name":"Section"},{"name":"ActionRow"},{"name":"Modal"},{"name":"Toast"},{"name":"EmptyState"},{"name":"Skeleton"},{"name":"EventRow"},{"name":"PlanList"},{"name":"UsageMeter"},{"name":"Registry"},{"name":"StatTile"},{"name":"ValueChart"},{"name":"StudioBar"},{"name":"OnAir"},{"name":"SceneRail"},{"name":"TransitionKeys"},{"name":"Monitor"},{"name":"NextCut"},{"name":"Tray"},{"name":"AudioMeter"},{"name":"ToolRail"},{"name":"LayoutPicker"},{"name":"StageGraphics"},{"name":"ChatMessage"},{"name":"ChatComposer"}]} */
/* PwStreamer Live — component bundle. Classic script: reads window.React and
   window.ReactDOM, assigns window.PwStreamer. Styled by bundle.css over the
   tokens in tokens.css. Hand-written from the shipped primitives in
   src/components/ui and the studio console; the families marked
   "intentional addition" in their guidelines are new. */
(function () {
  'use strict';
  var React = window.React;
  if (!React) { console.warn('PwStreamer bundle: React 18 must load first.'); return; }
  var h = React.createElement;
  var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef, useId = React.useId;

  function cx() { var out = []; for (var i = 0; i < arguments.length; i++) { var a = arguments[i]; if (!a) continue; if (typeof a === 'string') out.push(a); else if (Array.isArray(a)) out.push(cx.apply(null, a)); else for (var k in a) if (a[k]) out.push(k); } return out.join(' '); }
  function omit(obj, keys) { var o = {}; for (var k in obj) if (keys.indexOf(k) < 0) o[k] = obj[k]; return o; }

  /* ── Icons: Lucide outlines in the product's stroke (1.75, round) ──────── */
  var PATHS = {
    check: ['M20 6 9 17l-5-5'],
    x: ['M18 6 6 18', 'm6 6 12 12'],
    chevronRight: ['m9 18 6-6-6-6'],
    chevronDown: ['m6 9 6 6 6-6'],
    chevronLeft: ['m15 18-6-6 6-6'],
    more: ['M12 12h.01', 'M19 12h.01', 'M5 12h.01'],
    arrowRight: ['M5 12h14', 'm12 5 7 7-7 7'],
    circleAlert: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', 'M12 8v4', 'M12 16h.01'],
    triangleAlert: ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4', 'M12 17h.01'],
    info: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', 'M12 16v-4', 'M12 8h.01'],
    circleCheck: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', 'm9 12 2 2 4-4'],
    eye: ['M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'],
    eyeOff: ['M9.88 9.88a3 3 0 1 0 4.24 4.24', 'M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68', 'M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61', 'm2 2 20 20'],
    copy: ['M9 9h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V11a2 2 0 0 1 0 0Z', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'],
    mic: ['M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z', 'M19 10v2a7 7 0 0 1-14 0v-2', 'M12 19v3'],
    micOff: ['m2 2 20 20', 'M18.89 13.23A7.12 7.12 0 0 0 19 12v-2', 'M5 10v2a7 7 0 0 0 12 5', 'M15 9.34V5a3 3 0 0 0-5.68-1.33', 'M9 9v3a3 3 0 0 0 5.12 2.12', 'M12 19v3'],
    camera: ['M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z', 'M12 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'],
    cameraOff: ['m2 2 20 20', 'M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16', 'M9.5 4h5L17 7h3a2 2 0 0 1 2 2v7.5', 'M14.121 15.121A3 3 0 1 1 9.88 10.88'],
    monitorUp: ['m9 10 3-3 3 3', 'M12 13V7', 'M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z', 'M12 17v4', 'M8 21h8'],
    grid: ['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z', 'M3 9h18', 'M3 15h18', 'M9 3v18', 'M15 3v18'],
    youtube: ['M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17', 'm10 15 5-3-5-3z'],
    twitch: ['M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7'],
    facebook: ['M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'],
    instagram: ['M2 7a5 5 0 0 1 5-5h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5Z', 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z', 'M17.5 6.5h.01'],
    linkedin: ['M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z', 'M2 9h4v12H2z', 'M4 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
    music: ['M8 14a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M12 18V2l7 4'],
    server: ['M2 4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z', 'M2 16a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z', 'M6 6h.01', 'M6 18h.01'],
    bird: ['M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z'],
    circlePlay: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', 'm10 8 6 4-6 4Z'],
    tv: ['M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z', 'm17 2-5 5-5-5'],
    kick: ['M7 4v16', 'M17 4 9.5 12l7.5 8'],
    message: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
    layers: ['m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z', 'm22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65', 'm22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65'],
    scroll: ['M15 12h-5', 'M15 8h-5', 'M19 17V5a2 2 0 0 0-2-2H4', 'M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3'],
    qr: ['M3 4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z', 'M16 4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1Z', 'M3 17a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z', 'M21 16h-3a2 2 0 0 0-2 2v3', 'M21 21v.01', 'M12 7v3a2 2 0 0 1-2 2H7', 'M3 12h.01', 'M12 3h.01', 'M12 16v.01', 'M16 12h1', 'M21 12v.01', 'M12 21v-1'],
    film: ['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z', 'M7 3v18', 'M3 7.5h4', 'M3 12h18', 'M3 16.5h4', 'M17 3v18', 'M17 7.5h4', 'M17 16.5h4'],
    users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
    radio: ['M4.9 19.1C1 15.2 1 8.8 4.9 4.9', 'M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5', 'M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z', 'M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5', 'M19.1 4.9C23 8.8 23 15.1 19.1 19'],
    pin: ['M12 17v5', 'M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z'],
    loader: ['M21 12a9 9 0 1 1-6.219-8.56'],
    plus: ['M5 12h14', 'M12 5v14'],
    external: ['M15 3h6v6', 'M10 14 21 3', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'],
    search: ['M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z', 'm21 21-4.3-4.3'],
    send: ['M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z', 'm21.854 2.147-10.94 10.939'],
    creditCard: ['M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z', 'M2 10h20'],
    logOut: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
    user: ['M12 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z', 'M20 21a8 8 0 0 0-16 0'],
    shield: ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'],
    download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'],
    trash: ['M3 6h18', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2', 'M10 11v6', 'M14 11v6'],
    calendar: ['M8 2v4', 'M16 2v4', 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z', 'M3 10h18'],
    link: ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'],
    circle: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z'],
    square: ['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z'],
    sun: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'],
    pencil: ['M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z', 'm15 5 4 4'],
    clock: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', 'M12 6v6l4 2']
  };
  function Icon(props) {
    var size = props.size || 16;
    var paths = PATHS[props.name] || PATHS.circle;
    return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: props.strokeWidth || 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true', className: props.className, style: props.style },
      paths.map(function (d, i) { return h('path', { key: i, d: d }); }));
  }
  var I = function (name, size, extra) { return h(Icon, Object.assign({ name: name, size: size }, extra || {})); };

  /* ── Logo ─────────────────────────────────────────────────────────────── */
  function Mark(props) {
    var size = props.size || 32, mono = props.mono;
    if (mono) return h('svg', { width: size, height: size, viewBox: '0 0 100 100', fill: 'none', 'aria-hidden': 'true' },
      h('path', { d: 'M50 5 L88 27 L88 73 L50 95 L12 73 L12 27 Z', stroke: 'currentColor', strokeWidth: 5, strokeLinejoin: 'round' }),
      h('path', { d: 'M28 50 C28 35, 35 28, 50 28', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', opacity: 0.55 }),
      h('path', { d: 'M72 50 C72 65, 65 72, 50 72', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', opacity: 0.55 }),
      h('path', { d: 'M44 38 L62 50 L44 62 Z', fill: 'currentColor', stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round' }));
    var id = 'pwg' + size;
    return h('svg', { width: size, height: size, viewBox: '0 0 100 100', fill: 'none', 'aria-hidden': 'true', className: 'pw-logo__mark--glow' },
      h('defs', null,
        h('linearGradient', { id: id, x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
          h('stop', { offset: '0%', stopColor: 'var(--brand-grad-from)' }), h('stop', { offset: '50%', stopColor: 'var(--brand-grad-mid)' }), h('stop', { offset: '100%', stopColor: 'var(--brand-grad-to)' })),
        h('linearGradient', { id: id + 'i', x1: '100%', y1: '100%', x2: '0%', y2: '0%' },
          h('stop', { offset: '0%', stopColor: 'var(--n-18)' }), h('stop', { offset: '100%', stopColor: 'var(--n-6)' }))),
      h('path', { d: 'M50 5 L88 27 L88 73 L50 95 L12 73 L12 27 Z', fill: 'url(#' + id + 'i)', stroke: 'url(#' + id + ')', strokeWidth: 4, strokeLinejoin: 'round' }),
      h('circle', { cx: 50, cy: 50, r: 14, stroke: 'var(--brand)', strokeWidth: 1.5, strokeDasharray: '3 3' }),
      h('path', { d: 'M28 50 C28 35, 35 28, 50 28', stroke: 'var(--brand)', strokeWidth: 2.5, strokeLinecap: 'round', opacity: 0.6 }),
      h('path', { d: 'M72 50 C72 65, 65 72, 50 72', stroke: 'var(--brand-grad-to)', strokeWidth: 2.5, strokeLinecap: 'round', opacity: 0.6 }),
      h('path', { d: 'M44 38 L62 50 L44 62 Z', fill: 'url(#' + id + ')', stroke: 'var(--n-100)', strokeWidth: 1.5, strokeLinejoin: 'round' }));
  }
  function Logo(props) {
    var showText = props.showText !== false, mono = !!props.monochrome, size = props.iconSize || 32, t = props.textSize || 'md';
    var wordCls = cx('pw-logo__word', t === 'sm' && 'pw-logo__word--sm', t === 'lg' && 'pw-logo__word--lg', t === 'xl' && 'pw-logo__word--xl');
    if (mono) return h('span', { className: cx('pw-logo pw-logo--mono', props.className) }, h(Mark, { size: size, mono: true }), showText && h('span', { className: wordCls }, 'PwStreamer'));
    return h('span', { className: cx('pw-logo', props.className) }, h(Mark, { size: size }),
      showText && h('span', { className: 'pw-logo__text' },
        h('span', { className: wordCls }, h('span', null, 'Pw'), h('span', { className: 'pw-logo__grad' }, 'Streamer')),
        h('span', { className: 'pw-logo__tag' }, 'online studio')));
  }

  /* ── Actions ──────────────────────────────────────────────────────────── */
  var Button = React.forwardRef(function (props, ref) {
    var variant = props.variant || 'primary', size = props.size || 'md', loading = !!props.loading;
    var rest = omit(props, ['variant', 'size', 'loading', 'icon', 'className', 'children', 'type', 'disabled']);
    return h('button', Object.assign({ ref: ref, type: props.type || 'button', disabled: props.disabled || loading, 'aria-busy': loading || undefined,
      className: cx('pw-btn', variant === 'ghost' && 'pw-btn--ghost', variant === 'danger' && 'pw-btn--danger', size === 'sm' && 'pw-btn--sm', size === 'lg' && 'pw-btn--lg', props.className) }, rest),
      loading ? I('loader', 14, { className: 'pw-spin' }) : props.icon, props.children);
  });
  function IconButton(props) {
    var rest = omit(props, ['label', 'className', 'children', 'type']);
    return h('button', Object.assign({ type: props.type || 'button', 'aria-label': props.label, className: cx('pw-iconbtn', props.className) }, rest), props.children);
  }
  function TextAction(props) {
    var cls = cx('pw-textaction', props.size === 'xs' && 'pw-textaction--xs', props.underlined && 'pw-textaction--underlined', props.className);
    var inner = [props.icon && h('span', { key: 'i', 'aria-hidden': 'true', style: { display: 'inline-flex' } }, props.icon), props.children];
    if (props.href) return h('a', { href: props.href, target: '_blank', rel: 'noopener noreferrer', className: cls }, inner, I('external', 12), h('span', { className: 'sr-only' }, ' (abre em outra aba)'));
    return h('button', { type: 'button', onClick: props.onClick, className: cls }, inner);
  }
  function Menu(props) {
    var _s = useState(!!props.defaultOpen), open = _s[0], setOpen = _s[1];
    var root = useRef(null), id = useId();
    useEffect(function () {
      if (!open) return;
      var out = function (e) { if (root.current && !root.current.contains(e.target)) setOpen(false); };
      var key = function (e) { if (e.key === 'Escape') setOpen(false); };
      document.addEventListener('pointerdown', out); document.addEventListener('keydown', key);
      return function () { document.removeEventListener('pointerdown', out); document.removeEventListener('keydown', key); };
    }, [open]);
    return h('div', { ref: root, className: cx('pw-menu', props.className) },
      h('button', { type: 'button', 'aria-label': props.label, 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': open ? id : undefined, onClick: function () { setOpen(!open); }, className: props.triggerClassName || 'pw-menu__trigger' }, props.trigger || I('more', 16)),
      open && h('div', { id: id, role: 'menu', 'aria-label': props.label, className: cx('pw-menu__pop', props.side === 'up' && 'pw-menu__pop--up', props.align === 'left' && 'pw-menu__pop--left') },
        props.header && h('div', { className: 'pw-menu__head' }, props.header),
        (props.items || []).map(function (it, i) {
          return h('button', { key: i, type: 'button', role: 'menuitem', tabIndex: -1, className: cx('pw-menu__item', it.danger && 'pw-menu__item--danger'), onClick: function () { setOpen(false); it.onSelect && it.onSelect(); } }, it.icon, it.label);
        })));
  }

  /* ── Forms ────────────────────────────────────────────────────────────── */
  function Field(props) {
    var id = useId(), hintId = id + '-h', errId = id + '-e';
    var rest = omit(props, ['label', 'hint', 'error', 'action', 'className', 'mono', 'as']);
    var Tag = props.as || 'input';
    return h('div', { className: cx('pw-field', props.className) },
      h('label', { htmlFor: id, className: 'pw-field__label' }, h('span', null, props.label), props.action),
      h(Tag, Object.assign({ id: id, className: cx('pw-input', props.mono && 'mono'), 'aria-invalid': props.error ? 'true' : undefined, 'aria-describedby': props.error ? errId : props.hint ? hintId : undefined }, rest)),
      props.error ? h('p', { id: errId, className: 'pw-field__error' }, I('circleAlert', 14), h('span', null, props.error))
        : props.hint ? h('p', { id: hintId, className: 'pw-field__hint' }, props.hint) : null);
  }
  function StreamKey(props) {
    var _s = useState(false), shown = _s[0], setShown = _s[1];
    var _c = useState(false), copied = _c[0], setCopied = _c[1];
    var id = useId();
    var value = props.value || '';
    var masked = shown ? value : value.replace(/./g, '•');
    function copy() { try { navigator.clipboard && navigator.clipboard.writeText(value); } catch (e) {} setCopied(true); setTimeout(function () { setCopied(false); }, 1600); }
    return h('div', { className: 'pw-field' },
      h('label', { htmlFor: id, className: 'pw-field__label' }, h('span', null, props.label || 'Chave de transmissão'),
        h(TextAction, { size: 'xs', onClick: function () { setShown(!shown); }, icon: I(shown ? 'eyeOff' : 'eye', 12) }, shown ? 'Ocultar chave' : 'Mostrar chave')),
      h('div', { className: 'pw-streamkey' },
        h('input', { id: id, className: 'pw-input mono', readOnly: true, value: masked, 'aria-label': props.label || 'Chave de transmissão' }),
        h(Button, { variant: 'ghost', onClick: copy, icon: I(copied ? 'check' : 'copy', 14), 'aria-live': 'polite' }, copied ? 'Copiado' : 'Copiar')),
      props.hint && h('p', { className: 'pw-field__hint' }, props.hint));
  }
  function Switch(props) {
    return h('button', { type: 'button', role: 'switch', 'aria-checked': !!props.checked, 'aria-label': props.label, 'aria-busy': props.busy || undefined, 'aria-disabled': props.busy || undefined, disabled: props.disabled,
      onClick: function () { if (!props.busy && props.onChange) props.onChange(!props.checked); }, className: 'pw-switch' },
      h('span', { 'aria-hidden': 'true', className: 'pw-switch__thumb' }));
  }
  function SwitchRow(props) {
    return h('div', { className: 'pw-switchrow' },
      h('div', { className: 'pw-switchrow__text' }, h('span', { className: 'pw-switchrow__title' }, props.title), props.description && h('span', { className: 'pw-switchrow__desc' }, props.description)),
      h(Switch, { checked: props.checked, onChange: props.onChange, label: props.label || props.title, busy: props.busy, disabled: props.disabled }));
  }
  function Checkbox(props) {
    var rest = omit(props, ['children', 'className']);
    return h('label', { className: cx('pw-check', props.className) },
      h('span', { className: 'pw-check__box' }, h('input', Object.assign({ type: 'checkbox' }, rest)), I('check', 14, { className: 'pw-check__mark', strokeWidth: 3 })),
      h('span', null, props.children));
  }
  function Segmented(props) {
    var _s = useState(props.value), v = props.value !== undefined && props.onChange ? props.value : _s[0];
    var set = function (x) { _s[1](x); props.onChange && props.onChange(x); };
    return h('div', { role: 'group', 'aria-label': props.label, className: cx('pw-seg', props.full && 'pw-seg--full', props.className) },
      (props.options || []).map(function (o) { return h('button', { key: o.value, type: 'button', 'aria-pressed': v === o.value, disabled: props.disabled, onClick: function () { set(o.value); }, className: 'pw-seg__opt' }, o.label); }));
  }
  function Slider(props) {
    var _s = useState(props.value != null ? props.value : 50), v = _s[0];
    var rest = omit(props, ['label', 'format', 'className', 'value', 'onChange']);
    return h('div', { className: cx('pw-sliderrow', props.className) },
      h('div', { className: 'pw-sliderrow__head' }, h('span', null, props.label), h('span', { className: 'mono ink-hi' }, props.format ? props.format(v) : v + '%')),
      h('input', Object.assign({ type: 'range', className: 'pw-slider', 'aria-label': props.label, value: v, onChange: function (e) { _s[1](Number(e.target.value)); props.onChange && props.onChange(Number(e.target.value)); } }, rest)));
  }

  /* ── Platforms, chips, destinations ───────────────────────────────────── */
  var PLATFORM_ICON = { youtube: 'youtube', facebook: 'facebook', twitch: 'twitch', instagram: 'instagram', linkedin: 'linkedin', tiktok: 'music', kick: 'kick', rumble: 'circlePlay', x: 'bird', custom: 'server', rtmp: 'server', nginx: 'server', srs: 'server', cloudflare: 'server' };
  function PlatformIcon(props) { return I(PLATFORM_ICON[props.platform] || 'tv', props.size || 16, { className: props.className }); }
  function PlatformTile(props) { return h('span', { className: 'pw-platform' }, h(PlatformIcon, { platform: props.platform, size: props.size || 18 })); }
  function Chip(props) {
    if (props.add) return h('button', { type: 'button', onClick: props.onClick, className: 'pw-chip pw-chip--add' }, I('plus', 14), h('span', { className: 'pw-chip__text' }, props.children));
    var ready = props.state === 'ready';
    var stateEl = props.state ? h('span', { className: 'pw-chip__state' }, ready ? I('check', 14) : I('circleAlert', 14), !ready && props.stateLabel) : null;
    return h('button', { type: 'button', onClick: props.onClick, 'aria-label': props.label || (props.children + (props.state ? ': ' + (ready ? 'pronto' : props.stateLabel) : '')), className: 'pw-chip' },
      props.platform && h('span', { className: 'pw-chip__icon', 'aria-hidden': 'true' }, h(PlatformIcon, { platform: props.platform, size: 14 })),
      h('span', { className: 'pw-chip__text' }, props.children), stateEl);
  }
  function ChipRow(props) { return h('div', { className: 'pw-chiprow' }, props.children); }
  var HEALTH_WORD = { stable: 'estável', unstable: 'instável', down: 'caiu', reconnecting: 'reconectando', off: 'desligado' };
  function Signal(props) { var n = props.bars || 0; var bars = []; for (var i = 1; i <= 5; i++) bars.push(h('i', { key: i, className: i <= n ? 'on' : '' })); return h('span', { className: 'pw-signal', 'aria-hidden': 'true' }, bars); }
  function DestinationHealth(props) {
    var d = props;
    var hi = d.state === 'unstable' || d.state === 'down';
    var word = HEALTH_WORD[d.state] || d.state;
    return h('div', { className: cx('pw-health', hi && 'pw-health--hi'), role: 'row', 'aria-label': d.name + ': ' + word, 'aria-busy': d.state === 'reconnecting' || undefined },
      h('span', { className: 'ink-lo' }, h(PlatformIcon, { platform: d.platform, size: 16 })),
      h('span', { className: 'pw-health__name' }, d.name),
      h(Signal, { bars: d.bars }),
      h('span', { className: 'pw-health__num' }, d.bitrate != null ? [d.bitrate, h('small', { key: 'u' }, ' kb/s')] : '—'),
      h('span', { className: 'pw-health__num' }, d.fps != null ? [d.fps, h('small', { key: 'u' }, ' fps')] : '—'),
      h('span', { className: 'pw-health__num' }, d.dropped != null ? [d.dropped, h('small', { key: 'u' }, ' perd.')] : '—'),
      h('span', { className: 'pw-health__num' }, d.latency != null ? [d.latency, h('small', { key: 'u' }, ' ms')] : '—'),
      h('span', { className: 'pw-health__state' }, d.state === 'down' ? I('circleAlert', 14) : d.state === 'reconnecting' ? I('loader', 14, { className: 'pw-spin' }) : null, word));
  }
  function DestinationHealthTable(props) {
    return h('div', { role: 'table', 'aria-label': 'Destinos no ar' },
      h('div', { className: 'pw-health__head', 'aria-hidden': 'true' }, h('span'), h('span', null, 'Destino'), h('span', null, 'Sinal'), h('span', null, 'Taxa'), h('span', null, 'Quadros'), h('span', null, 'Perdidos'), h('span', null, 'Latência'), h('span', { style: { textAlign: 'right' } }, 'Estado')),
      (props.rows || []).map(function (r, i) { return h(DestinationHealth, Object.assign({ key: i }, r)); }));
  }

  /* ── Navigation and page ──────────────────────────────────────────────── */
  function AppHeader(props) {
    var items = props.items || [{ id: 'dashboard', label: 'Painel' }, { id: 'channels', label: 'Canais' }, { id: 'webinars', label: 'Webinars' }, { id: 'settings', label: 'Configurações' }];
    var cur = props.current || 'dashboard';
    return h('header', { className: 'pw-header' }, h('div', { className: 'pw-header__in' },
      h('button', { type: 'button', 'aria-label': 'PwStreamer, painel', className: 'pw-header__brand' }, h(Logo, { iconSize: 28, textSize: 'sm' })),
      h('nav', { 'aria-label': 'Principal', className: 'pw-nav' }, items.map(function (it) { return h('button', { key: it.id, type: 'button', 'aria-current': it.id === cur ? 'page' : undefined, className: 'pw-nav__item', onClick: function () { props.onNavigate && props.onNavigate(it.id); } }, it.label); })),
      h('div', { className: 'pw-header__end' },
        props.trial && h(TextAction, { size: 'xs' }, props.trial),
        props.studio !== false && cur !== 'dashboard' && h(Button, { variant: 'ghost', size: 'sm', icon: I('radio', 14) }, 'Estúdio'),
        h(Menu, { label: 'Conta', trigger: h('span', { className: 'pw-avatar' }, (props.user && props.user.initials) || 'PW'), triggerClassName: 'pw-header__brand',
          header: h('div', null, h('div', { className: 'ink-hi', style: { fontWeight: 500 } }, (props.user && props.user.name) || 'Conta'), h('div', { className: 'label ink-lo' }, (props.user && props.user.email) || '')),
          items: [{ label: 'Dados de cadastro', icon: I('user', 14) }, { label: 'Plano e cobrança', icon: I('creditCard', 14) }, { label: 'Sair', icon: I('logOut', 14) }] }))));
  }
  function PageHeader(props) {
    return h('div', { className: 'pw-pagehead' }, h('div', { style: { minWidth: 0 } }, h('h1', null, props.title), props.description && h('p', null, props.description)), props.action && h('div', { style: { flexShrink: 0 } }, props.action));
  }
  function Section(props) {
    var head = h('h2', { id: props.id }, props.title, props.count != null && h('span', { className: 'pw-section__count' }, props.count));
    return h('section', { 'aria-labelledby': props.id, className: cx('pw-section', props.first && 'pw-section--first', props.className) },
      props.action ? h('div', { className: 'pw-section__head' }, head, props.action) : head,
      h('div', { className: 'pw-section__body' }, props.children));
  }
  function ActionRow(props) {
    var expand = props.type === 'expand';
    return h('button', { type: 'button', onClick: props.onClick, 'aria-expanded': expand ? !!props.expanded : undefined, 'aria-controls': expand ? props.controls : undefined, className: 'pw-actionrow' },
      props.leading && h('span', { style: { flexShrink: 0 } }, props.leading),
      h('span', { className: 'pw-actionrow__text' }, h('span', { className: 'pw-actionrow__title' }, props.title), props.description && h('span', { className: 'pw-actionrow__desc' }, props.description)),
      props.side && h('span', { className: 'pw-actionrow__side' }, props.side),
      I(expand ? 'chevronDown' : 'chevronRight', 16, { className: 'pw-actionrow__chev' }));
  }

  /* ── Feedback ─────────────────────────────────────────────────────────── */
  function Modal(props) {
    if (props.isOpen === false) return null;
    var id = useId();
    var close = function () { if (props.dismissible !== false && !props.busy && props.onClose) props.onClose(); };
    return h('div', { className: cx('pw-modal', !props.inline && 'pw-modal--fixed') },
      h('div', { className: 'pw-modal__scrim', onClick: close, 'aria-hidden': 'true' }),
      h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': props.title ? id : undefined, 'aria-label': props.title ? undefined : props.ariaLabel, 'aria-describedby': props.description ? id + 'd' : undefined, tabIndex: -1,
        className: cx('pw-modal__panel', 'pw-modal__panel--' + (props.size || 'md')) },
        (props.title || props.dismissible !== false) && h('header', { className: 'pw-modal__head' },
          props.icon && h('span', { className: 'pw-modal__icon' }, props.icon),
          h('div', { style: { minWidth: 0, flex: 1 } }, props.title && h('h2', { id: id }, props.title), props.description && h('p', { id: id + 'd' }, props.description)),
          props.dismissible !== false && h('button', { type: 'button', 'aria-label': 'Fechar', disabled: props.busy, onClick: props.onClose, className: 'pw-modal__close' }, I('x', 18))),
        h('div', { className: 'pw-modal__body' }, props.children),
        props.footer && h('footer', { className: 'pw-modal__foot' }, props.footer)));
  }
  var TOAST_ICON = { success: 'circleCheck', error: 'triangleAlert', info: 'info' };
  function Toast(props) {
    var kind = props.kind || 'info';
    return h('div', { role: 'status', className: cx('pw-toast', 'pw-toast--' + kind) },
      h('span', { className: 'pw-toast__icon' }, I(TOAST_ICON[kind], 16)),
      h('div', { style: { minWidth: 0, flex: 1 } }, h('p', { className: 'pw-toast__title' }, props.title), props.detail && h('p', { className: 'pw-toast__detail' }, props.detail),
        props.action && h('button', { type: 'button', className: 'pw-toast__action', onClick: props.action.onClick }, props.action.label)),
      h('button', { type: 'button', 'aria-label': 'Dispensar aviso', className: 'pw-toast__close', onClick: props.onDismiss }, I('x', 14)));
  }
  function EmptyState(props) {
    return h('p', { className: cx('pw-empty', props.boxed && 'pw-empty--boxed') }, props.children, props.action && h(TextAction, { onClick: props.action.onClick, icon: props.action.icon }, props.action.label));
  }
  function Skeleton(props) {
    var rows = props.rows || 3, out = [];
    for (var i = 0; i < rows; i++) out.push(h('div', { key: i, className: 'pw-skel--row' }, h('span', { className: 'pw-skel' }), h('div', { className: 'pw-skel__lines' }, h('span', { className: 'pw-skel', style: { width: (55 + (i * 17) % 30) + '%' } }), h('span', { className: 'pw-skel', style: { width: (30 + (i * 11) % 25) + '%', height: 10 } }))));
    return h('div', { 'aria-busy': 'true', 'aria-label': props.label || 'Carregando' }, out);
  }

  /* ── Lists ────────────────────────────────────────────────────────────── */
  function EventRow(props) {
    var meta = [];
    if (props.when) meta.push(h('span', { key: 'w' }, props.when.text, ' ', h('span', { className: 'mono' }, props.when.time)));
    if (props.meta) meta.push(h('span', { key: 'm' }, ' · ', props.meta));
    if (props.duration) meta.push(h('span', { key: 'd' }, ' · ', h('span', { className: 'mono' }, props.duration)));
    return h('div', { className: 'pw-eventrow' },
      props.leading && h('span', { style: { flexShrink: 0 } }, props.leading),
      h('div', { className: 'pw-eventrow__text' },
        h('span', { className: 'pw-eventrow__title' }, props.title),
        h('span', { className: 'pw-eventrow__meta' }, props.recording ? h('span', { className: 'pw-eventrow__rec' }, 'Gravando ', h('span', { className: 'mono' }, props.recording)) : meta)),
      h('div', { className: 'pw-eventrow__side' }, props.action, props.menu && h(Menu, { label: 'Ações de ' + props.title, items: props.menu })));
  }
  function PlanList(props) {
    var _o = useState(props.defaultOpen || null), open = _o[0], setOpen = _o[1];
    return h('ul', { className: 'pw-planlist' }, (props.plans || []).map(function (p) {
      var isOpen = open === p.id, id = 'plan-' + p.id;
      return h('li', { key: p.id },
        h(ActionRow, { type: 'expand', expanded: isOpen, controls: id, title: p.current ? p.name + ' · seu plano' : p.name, description: p.limits,
          side: h('span', { className: 'pw-price' }, p.price, p.sub && h('small', null, p.sub)), onClick: function () { setOpen(isOpen ? null : p.id); } }),
        isOpen && h('ul', { id: id, className: 'pw-plan__items' }, (p.features || []).map(function (f, i) { return h('li', { key: i }, I('check', 14), h('span', null, f)); })));
    }));
  }
  function UsageMeter(props) {
    var pct = props.max ? Math.min(100, Math.round((props.used / props.max) * 100)) : 0, near = pct >= 80;
    return h('div', { className: cx('pw-usage', near && 'pw-usage--near') },
      h('div', { className: 'pw-usage__head' }, h('span', { className: 'pw-usage__title' }, props.title), h('span', { className: 'pw-usage__num' }, props.used, h('small', null, ' de ', props.max, ' ', props.unit))),
      h('div', { className: 'pw-usage__bar', role: 'progressbar', 'aria-valuenow': props.used, 'aria-valuemin': 0, 'aria-valuemax': props.max, 'aria-label': props.title }, h('div', { className: 'pw-usage__fill', style: { width: pct + '%' } })),
      props.note && h('p', { className: 'pw-usage__note' }, near && I('circleAlert', 14), h('span', null, props.note)));
  }
  function Registry(props) {
    return h('dl', { className: 'pw-registry' }, (props.rows || []).map(function (r, i) {
      return h('div', { key: i, className: 'pw-registry__row' },
        h('div', null, h('dt', null, r.label), h('dd', null, r.value), r.origin && h('div', { className: 'pw-registry__origin' }, r.origin)),
        r.editable && h(TextAction, { size: 'sm', icon: I('pencil', 12) }, 'Editar'));
    }));
  }

  /* ── Analytics ────────────────────────────────────────────────────────── */
  function StatTile(props) {
    return h('div', { className: 'pw-stat' }, h('div', { className: 'pw-stat__label' }, props.label), h('div', { className: 'pw-stat__value' }, props.value, props.unit && h('small', null, props.unit)), props.delta && h('div', { className: 'pw-stat__delta' }, props.delta));
  }
  function Stats(props) { return h('div', { className: 'pw-stats' }, props.children); }
  function ValueChart(props) {
    var W = 560, H = 160, padL = 36, padB = 20, series = props.series || [], n = Math.max.apply(null, series.map(function (s) { return s.values.length; }).concat([1]));
    var max = props.max || Math.max.apply(null, series.reduce(function (a, s) { return a.concat(s.values); }, [1]));
    var x = function (i) { return padL + (i / Math.max(1, n - 1)) * (W - padL); }, y = function (v) { return H - padB - (v / max) * (H - padB - 8); };
    var grid = [0, 0.5, 1].map(function (t) { return h('g', { key: t }, h('line', { x1: padL, x2: W, y1: y(max * t), y2: y(max * t), stroke: 'var(--chart-grid)' }), h('text', { x: padL - 6, y: y(max * t) + 4, textAnchor: 'end' }, Math.round(max * t))); });
    var paths = series.map(function (s, k) {
      var d = s.values.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
      return h('path', { key: k, d: d, fill: 'none', stroke: 'var(--chart-' + (k + 1) + ')', strokeWidth: k === 0 ? 2 : 1.5, strokeLinejoin: 'round', strokeLinecap: 'round' });
    });
    var ticks = (props.ticks || []).map(function (t, i) { return h('text', { key: i, x: x(Math.round(i * (n - 1) / Math.max(1, (props.ticks.length - 1)))), y: H - 4, textAnchor: i === 0 ? 'start' : i === props.ticks.length - 1 ? 'end' : 'middle' }, t); });
    return h('div', { className: 'pw-chart' },
      h('div', { className: 'pw-chart__head' }, h('span', { className: 'pw-chart__title' }, props.title), h('span', { className: 'pw-chart__legend' }, series.map(function (s, k) { return h('span', { key: k }, h('i', { style: { background: 'var(--chart-' + (k + 1) + ')' } }), s.name); }))),
      h('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': props.title }, h('line', { x1: padL, x2: W, y1: H - padB, y2: H - padB, stroke: 'var(--chart-axis)' }), grid, paths, ticks));
  }

  /* ── Studio ───────────────────────────────────────────────────────────── */
  function OnAir(props) {
    if (props.live) return h('span', { className: 'pw-onair' }, h('span', { className: 'pw-live', 'aria-label': 'No ar' }, 'AO VIVO'), h('span', { className: cx('pw-clock', props.large && 'pw-clock--lg'), 'aria-label': 'Tempo no ar' }, props.elapsed || '00:00:00'),
      props.recording && h('span', { className: 'pw-rec' }, 'Gravando ', h('span', { className: 'mono' }, props.recording)),
      props.showEnd !== false && h(Button, { variant: 'danger', size: props.size || 'md', onClick: props.onEnd }, 'Encerrar transmissão'));
    return h('span', { className: 'pw-onair' }, props.pending && h('span', { className: 'label ink-hi', style: { display: 'inline-flex', gap: 6, alignItems: 'center' } }, I('circleAlert', 14), props.pending),
      h(Button, { size: props.size || 'lg', variant: props.pending ? 'ghost' : 'primary', disabled: !!props.pending, onClick: props.onGoLive, icon: I('radio', 16) }, 'Ir ao ar'));
  }
  function StudioBar(props) {
    return h('header', { className: 'pw-studiobar' },
      h('button', { type: 'button', 'aria-label': 'PwStreamer, voltar ao Painel', className: 'pw-header__brand' }, h(Logo, { iconSize: 24, textSize: 'sm', monochrome: true })),
      h('h1', { className: 'pw-studiobar__title' }, 'Estúdio', props.session && h('span', null, ' · ', props.session)),
      h('div', { className: 'pw-studiobar__end' },
        props.channels && h(TextAction, { size: 'xs', onClick: props.onChannels }, props.channels),
        h(OnAir, { live: props.live, elapsed: props.elapsed, recording: props.recording, pending: props.pending, size: 'sm', onGoLive: props.onGoLive, onEnd: props.onEnd }),
        h(Button, { variant: 'ghost', size: 'sm', onClick: props.onExit }, 'Sair do estúdio')));
  }
  function SceneRail(props) {
    var scenes = props.scenes || [];
    return h('div', { className: 'pw-scenerail' },
      h('section', { 'aria-labelledby': 'pw-cenas' }, h('h2', { id: 'pw-cenas' }, 'Cenas'),
        h('ul', null, scenes.map(function (s) {
          var state = [s.program && 'programa', s.preview && 'preview'].filter(Boolean).join(' e ');
          var legend = state ? state + (s.noScreen ? ' · sem tela' : '') : s.noScreen ? 'sem tela compartilhada' : '';
          return h('li', { key: s.id }, h('button', { type: 'button', 'aria-current': s.preview ? 'true' : undefined, className: 'pw-scene', onClick: function () { props.onChoose && props.onChoose(s); } },
            h('span', { className: 'pw-scene__name' }, s.name), legend && h('span', { className: cx('pw-scene__state', s.program && 'pw-scene__state--pgm') }, legend)));
        }))),
      props.children && h('section', { className: 'pw-scenerail__sep', 'aria-labelledby': 'pw-trans' }, h('h2', { id: 'pw-trans' }, 'Transição'), props.children));
  }
  function TransitionKeys(props) {
    var stop = !props.hasChange || props.cutting;
    return h('div', null, h('div', { className: 'pw-keys' },
      h('button', { type: 'button', className: 'pw-key', disabled: stop, onClick: function () { props.onCut && props.onCut('corte'); } }, h('span', null, 'Corte'), h('span', { className: 'pw-key__ms' }, '0 ms')),
      h('button', { type: 'button', className: 'pw-key', disabled: stop, onClick: function () { props.onCut && props.onCut('fusao'); } }, h('span', null, 'Fusão'), h('span', { className: 'pw-key__ms' }, (props.dissolve || 400) + ' ms'))),
      !props.hasChange && h('p', { className: 'pw-keys__note' }, 'O preview está igual ao programa.'));
  }
  function Guides() { return h('div', { className: 'pw-guides', 'aria-hidden': 'true' }, h('i', { className: 'v1' }), h('i', { className: 'v2' }), h('i', { className: 'h1' }), h('i', { className: 'h2' }), h('i', { className: 'safe' }), h('i', { className: 'cx' }), h('i', { className: 'cy' })); }
  function Stage(props) {
    var layout = props.layout || 'camera';
    return h('div', { className: cx('pw-stage', props.ticker && 'pw-stage--ticker', props.className), style: props.style },
      layout === 'empty' ? h('div', { className: 'pw-stage__fill' }, 'Nenhuma fonte nesta cena.')
        : layout === 'screen' ? h('div', { className: 'pw-stage__screen' })
        : layout === 'pip' ? [h('div', { key: 's', className: 'pw-stage__screen' }), h('div', { key: 'c', className: 'pw-stage__card' })]
        : h('div', { className: 'pw-stage__cam' }),
      props.children, props.guides && h(Guides));
  }
  function Monitor(props) {
    var pgm = props.role === 'program';
    return h('section', { 'aria-label': (pgm ? 'Programa' : 'Preview') + ': ' + (props.scene || ''), className: cx('pw-monitor', props.className), style: props.style },
      h('div', { className: 'pw-monitor__label' }, h('h2', null, pgm ? 'Programa' : 'Preview'), h('span', null, props.scene)),
      h('div', { className: cx('pw-frame', pgm ? 'pw-frame--pgm' : 'pw-frame--pvw'), 'data-air': props.live ? 'on' : undefined },
        props.children || h(Stage, { layout: props.layout, guides: props.guides })));
  }
  function NextCut(props) {
    var list = props.changes || [];
    return h('section', { 'aria-labelledby': 'pw-nextcut', className: cx('pw-nextcut', props.className), style: props.style },
      h('div', { className: 'pw-monitor__label' }, h('h2', { id: 'pw-nextcut' }, 'No próximo corte')),
      h('div', { className: 'pw-nextcut__box' }, list.length === 0 ? h('p', null, 'Nada muda: o preview está igual ao programa.') : h('ul', null, list.map(function (c, i) { return h('li', { key: i }, I('arrowRight', 14), h('span', null, c)); }))));
  }
  function AudioMeter(props) {
    var level = props.level != null ? props.level : 0, db = props.db, near = db != null && db > -12;
    return h('span', { className: 'pw-meter', 'aria-hidden': 'true' },
      h('span', { className: 'pw-meter__track' }, h('span', { className: 'pw-meter__bar', 'data-margem': near ? 'sim' : 'nao', style: { '--nivel': level } }), props.peak != null && h('span', { className: 'pw-meter__peak', style: { left: 'calc(' + (props.peak * 100) + '% - 2px)' } }), h('span', { className: 'pw-meter__segs' })),
      h('span', { className: 'pw-meter__read' }, db == null ? '—' : '−' + Math.abs(Math.round(db)) + ' dB'));
  }
  function Tray(props) {
    var s = props.state || {};
    function ctl(key, onIcon, offIcon, onLabel, offLabel, menuItems, menuLabel) {
      var on = !!s[key];
      var btn = h(Button, { variant: 'ghost', 'aria-pressed': on, className: 'pw-tray__ctl', icon: I(on ? onIcon : offIcon, 16), onClick: function () { props.onToggle && props.onToggle(key); } }, on ? onLabel : offLabel);
      if (!menuItems) return btn;
      return h('span', { className: 'pw-tray__group' }, btn, h(Menu, { label: menuLabel, items: menuItems, side: 'up', align: 'left', trigger: I('chevronDown', 14), triggerClassName: 'pw-tray__chev' }));
    }
    return h('footer', { className: 'pw-tray' },
      ctl('mic', 'mic', 'micOff', 'Microfone', 'Microfone mudo', props.mics, 'Escolher o microfone'),
      h(AudioMeter, { level: props.level, db: props.db, peak: props.peak }),
      ctl('camera', 'camera', 'cameraOff', 'Câmera', 'Câmera desligada', props.cameras, 'Escolher a câmera'),
      ctl('screen', 'monitorUp', 'monitorUp', 'Parar de compartilhar', 'Compartilhar tela'),
      h('span', { className: 'pw-tray__sep', 'aria-hidden': 'true' }),
      ctl('guides', 'grid', 'grid', 'Guias', 'Guias'),
      props.note && h('p', { className: 'pw-tray__note' }, props.note));
  }
  var TOOLS = [{ id: 'chat', label: 'Chat', icon: 'message' }, { id: 'graficos', label: 'Gráficos', icon: 'layers' }, { id: 'roteiro', label: 'Roteiro', icon: 'scroll' }, { id: 'qr', label: 'QR code', icon: 'qr' }, { id: 'midia', label: 'Mídia', icon: 'film' }, { id: 'camera', label: 'Câmera', icon: 'camera' }, { id: 'convidados', label: 'Convidados', icon: 'users' }, { id: 'destinos', label: 'Destinos', icon: 'radio' }];
  function ToolRail(props) {
    var _s = useState(props.active || 'chat'), act = props.active && props.onChange ? props.active : _s[0];
    var tools = props.tools || TOOLS;
    return h('div', { role: 'tablist', 'aria-orientation': 'vertical', 'aria-label': 'Ferramentas', className: 'pw-toolrail' }, tools.map(function (t) {
      var on = t.id === act;
      return h('button', { key: t.id, type: 'button', role: 'tab', 'aria-selected': on, tabIndex: on ? 0 : -1, title: t.description, className: 'pw-tooltab', onClick: function () { _s[1](t.id); props.onChange && props.onChange(t.id); } }, I(t.icon, 18), h('span', null, t.label));
    }));
  }
  var LAYOUTS = [
    { id: '1-cam', label: 'Câmera', tiles: [[0, 0, 100, 100]] },
    { id: 'pip', label: 'Tela com câmera', tiles: [[0, 0, 100, 100], [66, 60, 30, 34]] },
    { id: 'side', label: 'Lado a lado', tiles: [[0, 12, 64, 76], [68, 30, 32, 40]] },
    { id: 'screen', label: 'Tela', tiles: [[0, 0, 100, 100]] },
    { id: 'dual', label: 'Dois convidados', tiles: [[0, 10, 48, 80], [52, 10, 48, 80]] },
    { id: 'grid', label: 'Grade', tiles: [[0, 0, 48, 48], [52, 0, 48, 48], [0, 52, 48, 48], [52, 52, 48, 48]] },
    { id: 'presentation', label: 'Apresentação', tiles: [[0, 0, 100, 100], [4, 64, 22, 32]] },
    { id: 'gallery', label: 'Galeria', tiles: [[0, 0, 100, 66], [0, 70, 30, 30], [35, 70, 30, 30], [70, 70, 30, 30]] }
  ];
  function LayoutPicker(props) {
    var _s = useState(props.value || '1-cam'), v = props.value && props.onChange ? props.value : _s[0];
    return h('div', { role: 'group', 'aria-label': 'Layout do palco', className: 'pw-layouts' }, (props.layouts || LAYOUTS).map(function (l) {
      return h('button', { key: l.id, type: 'button', 'aria-pressed': v === l.id, className: 'pw-layout', onClick: function () { _s[1](l.id); props.onChange && props.onChange(l.id); } },
        h('span', { className: 'pw-layout__tile', 'aria-hidden': 'true' }, l.tiles.map(function (t, i) { return h('i', { key: i, style: { left: t[0] + '%', top: t[1] + '%', width: t[2] + '%', height: t[3] + '%', opacity: i === 0 && l.tiles.length > 1 && t[2] === 100 ? 0.45 : 1 } }); })),
        h('span', null, l.label));
    }));
  }
  function StageGraphics(props) {
    var g = props.graphics || {};
    return h(Stage, { layout: props.layout || 'camera', ticker: !!g.ticker, guides: props.guides },
      g.logo && h('div', { className: 'pw-g pw-g--tl', style: { color: 'var(--g-texto)' } }, h('svg', { className: 'pw-g-logo', viewBox: '0 0 100 100', fill: 'none', 'aria-hidden': 'true' }, h('path', { d: 'M50 5 L88 27 L88 73 L50 95 L12 73 L12 27 Z', stroke: 'currentColor', strokeWidth: 5, strokeLinejoin: 'round' }), h('path', { d: 'M44 38 L62 50 L44 62 Z', fill: 'currentColor' }))),
      g.banner && h('div', { className: 'pw-g pw-g--bl' }, h('div', { className: 'pw-g-banner' }, h('span', { className: 'pw-g-banner__t' }, g.banner.title), g.banner.subtitle && h('span', { className: 'pw-g-banner__s' }, g.banner.subtitle))),
      g.comment && h('div', { className: 'pw-g pw-g--tl', style: { top: g.logo ? '24cqh' : undefined } }, h('div', { className: 'pw-g-comment' }, h('div', { className: 'pw-g-comment__a' }, g.comment.author), h('div', { className: 'pw-g-comment__x' }, g.comment.text))),
      g.qr && h('div', { className: 'pw-g pw-g--br' }, h('div', { className: 'pw-g-qr' }, h('div', { className: 'pw-g-qr__code' }), h('div', { className: 'pw-g-qr__t' }, g.qr.title), g.qr.price && h('div', { className: 'pw-g-qr__p' }, g.qr.price))),
      g.timer && h('div', { className: 'pw-g pw-g-timer' }, h('div', { className: 'pw-g-timer__t' }, g.timer.title), h('div', { className: 'pw-g-timer__n' }, g.timer.time), h('div', { className: 'pw-g-timer__bar' })),
      g.ticker && h('div', { className: 'pw-g-ticker' }, h('span', { className: 'pw-g-ticker__tag' }, g.ticker.tag || 'Ao vivo'), h('span', { className: 'pw-g-ticker__rail' }, h('span', { className: 'pw-g-ticker__text' }, g.ticker.text))));
  }

  /* ── Chat ─────────────────────────────────────────────────────────────── */
  function ChatMessage(props) {
    var m = props;
    return h('div', { className: cx('pw-chat-msg', m.pinned && 'pw-chat-msg--pinned', m.flagged && 'pw-chat-msg--flag') },
      h('span', { className: 'pw-chat-msg__icon' }, h(PlatformIcon, { platform: m.platform, size: 16 })),
      h('div', { className: 'pw-chat-msg__body' },
        m.pinned && h('div', { className: 'pw-chat-msg__pin' }, I('pin', 12), 'Fixado no programa'),
        h('div', { className: 'pw-chat-msg__head' }, h('span', { className: 'pw-chat-msg__author' }, m.author), h('span', { className: 'pw-chat-msg__time' }, m.time)),
        h('p', { className: 'pw-chat-msg__text' }, m.text),
        m.flagged && h('div', { className: 'pw-chat-msg__flag' }, I('circleAlert', 14), m.flagged, h(TextAction, { size: 'xs' }, 'Liberar'))),
      h('div', { className: 'pw-chat-msg__actions' }, h(IconButton, { label: m.pinned ? 'Desafixar' : 'Fixar no programa', style: { width: 32, height: 32 } }, I('pin', 14)), h(Menu, { label: 'Ações da mensagem', items: [{ label: 'Responder' }, { label: 'Ocultar' }, { label: 'Banir autor', danger: true }] })));
  }
  function ChatComposer(props) {
    return h('div', null, h('div', { className: 'pw-composer' },
      h('textarea', { rows: 1, placeholder: props.placeholder || 'Responder como ' + (props.author || 'você'), 'aria-label': 'Mensagem' }),
      h(Button, { icon: I('send', 14), 'aria-label': 'Enviar' }, 'Enviar')),
      props.to && h('p', { className: 'pw-composer__to' }, props.to));
  }

  window.PwStreamer = {
    Icon: Icon, Mark: Mark, Logo: Logo,
    Button: Button, IconButton: IconButton, TextAction: TextAction, Menu: Menu,
    Field: Field, StreamKey: StreamKey, Switch: Switch, SwitchRow: SwitchRow, Checkbox: Checkbox, Segmented: Segmented, Slider: Slider,
    Chip: Chip, ChipRow: ChipRow, PlatformIcon: PlatformIcon, PlatformTile: PlatformTile, DestinationHealth: DestinationHealth, DestinationHealthTable: DestinationHealthTable, Signal: Signal,
    AppHeader: AppHeader, PageHeader: PageHeader, Section: Section, ActionRow: ActionRow,
    Modal: Modal, Toast: Toast, EmptyState: EmptyState, Skeleton: Skeleton,
    EventRow: EventRow, PlanList: PlanList, UsageMeter: UsageMeter, Registry: Registry,
    StatTile: StatTile, Stats: Stats, ValueChart: ValueChart,
    StudioBar: StudioBar, OnAir: OnAir, SceneRail: SceneRail, TransitionKeys: TransitionKeys, Monitor: Monitor, Stage: Stage, Guides: Guides, NextCut: NextCut, Tray: Tray, AudioMeter: AudioMeter, ToolRail: ToolRail, LayoutPicker: LayoutPicker, StageGraphics: StageGraphics,
    ChatMessage: ChatMessage, ChatComposer: ChatComposer,
    LAYOUTS: LAYOUTS, TOOLS: TOOLS
  };
})();
