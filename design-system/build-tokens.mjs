// Rebuilds design-system/project/tokens.json from src/index.css.
//
// The CSS is the source of every value it declares: the navy ramp, the brand
// and tally colours, the semantic roles in the three scopes (dark :root, light,
// console), the chart series, the radius scale, the z-index layers and the
// font stack. Everything else in tokens.json (usage notes, type styles,
// spacing, sizes, motion, the tokens the CSS doesn't declare) is kept as is.
//
//   node design-system/build-tokens.mjs           write tokens.json
//   node design-system/build-tokens.mjs --check   exit 1 if tokens.json is stale
//
// A token the CSS used to declare and no longer does is listed, never removed:
// deleting it is a decision for a person.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const CSS_PATH = join(ROOT, 'src', 'index.css');
const TOKENS_PATH = join(HERE, 'project', 'tokens.json');
const CHECK = process.argv.includes('--check');

const css = readFileSync(CSS_PATH, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

function block(re, label) {
  const m = re.exec(css);
  if (!m) throw new Error(`src/index.css: could not find the ${label} block`);
  return m[1];
}
function decls(text) {
  const out = new Map();
  for (const m of text.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) out.set(m[1], m[2].trim());
  return out;
}

const theme = decls(block(/@theme\s*\{([\s\S]*?)\n\}/, '@theme'));
const scopes = {
  dark: decls(block(/^:root\s*\{([\s\S]*?)^\}/m, ':root')),
  light: decls(block(/^:root\[data-theme="light"\][^{]*\{([\s\S]*?)^\}/m, 'light theme')),
  console: decls(block(/^\[data-surface="console"\]\s*\{([\s\S]*?)^\}/m, 'console scope')),
};

// Tailwind palette re-points (--color-amber-300 and friends) belong to legacy
// utility classes, not to this system.
const TAILWIND = /^color-(amber|blue|cyan|emerald|green|indigo|orange|pink|purple|red|rose|sky|yellow|violet|teal|slate|gray)-\d+$/;

/** A CSS colour value in the grammar tokens.json accepts. */
function colour(v) {
  const ref = /^var\(--(?:color-)?([\w-]+)\)$/.exec(v);
  if (ref) return `{${ref[1]}}`;
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return v.toLowerCase();
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[/,]\s*([\d.]+%?))?\s*\)$/i.exec(v);
  if (rgb) {
    const [, r, g, b, a] = rgb;
    if (a === undefined) return `rgb(${r},${g},${b})`;
    const alpha = a.endsWith('%') ? String(parseFloat(a) / 100) : a;
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return null;
}

// ── What the CSS declares, as tokens.json names ─────────────────────────────
const cssColours = new Map(); // name -> string value (primitives)
const cssRoles = new Map(); // name -> {dark?, light?, console?}
const cssRadius = new Map();
const cssZ = new Map();
let cssFontSans = null;
const skipped = [];

for (const [name, raw] of theme) {
  if (name.startsWith('color-')) {
    const v = colour(raw);
    if (v) cssColours.set(name.slice('color-'.length), v);
    else skipped.push(`--${name}: ${raw}`);
  } else if (name.startsWith('brand-grad-')) {
    const v = colour(raw);
    if (v) cssColours.set(name, v);
  } else if (name.startsWith('radius-')) cssRadius.set(name, raw);
  else if (name.startsWith('z-')) cssZ.set(name, raw);
  else if (name === 'font-sans') cssFontSans = raw;
  else skipped.push(`--${name}: ${raw}`);
}
for (const [themeId, map] of Object.entries(scopes)) {
  for (const [name, raw] of map) {
    if (TAILWIND.test(name)) continue;
    const v = colour(raw);
    if (!v) { skipped.push(`--${name}: ${raw} (${themeId})`); continue; }
    if (!cssRoles.has(name)) cssRoles.set(name, {});
    cssRoles.get(name)[themeId] = v;
  }
}

// ── Merge into tokens.json ───────────────────────────────────────────────────
const before = readFileSync(TOKENS_PATH, 'utf8');
const tokens = JSON.parse(before);
const owned = new Set(tokens.meta?.fromCss ?? []);
const nowOwned = new Set();
const changes = [];
const NEW_USAGE = 'From src/index.css. Write a usage note: where it is used and which grounds it reads on.';

const byName = new Map(tokens.color.tokens.map((t) => [t.name, t]));
function upsertColour(name, value) {
  nowOwned.add(name);
  const t = byName.get(name);
  if (!t) {
    const fresh = { name, value, usage: NEW_USAGE };
    tokens.color.tokens.push(fresh);
    byName.set(name, fresh);
    changes.push(`+ color ${name}`);
    return;
  }
  if (typeof value === 'string') {
    if (JSON.stringify(t.value) !== JSON.stringify(value)) changes.push(`~ color ${name}: ${JSON.stringify(t.value)} -> ${value}`);
    t.value = value;
    return;
  }
  // Per theme: a theme the CSS doesn't declare keeps its current value.
  const current = typeof t.value === 'string' ? { dark: t.value } : { ...t.value };
  const next = { ...current, ...value };
  const ordered = {};
  for (const id of tokens.color.themes.map((x) => x.id)) if (next[id] !== undefined) ordered[id] = next[id];
  if (JSON.stringify(t.value) !== JSON.stringify(ordered)) changes.push(`~ color ${name}: ${JSON.stringify(t.value)} -> ${JSON.stringify(ordered)}`);
  t.value = ordered;
}
for (const [name, v] of cssColours) upsertColour(name, v);
for (const [name, v] of cssRoles) upsertColour(name, v);

function upsertList(family, map) {
  const list = tokens[family].tokens;
  for (const [name, value] of map) {
    nowOwned.add(name);
    const t = list.find((x) => x.name === name);
    if (!t) { list.push({ name, value, usage: NEW_USAGE }); changes.push(`+ ${family} ${name}`); continue; }
    if (t.value !== value) changes.push(`~ ${family} ${name}: ${t.value} -> ${value}`);
    t.value = value;
  }
}
upsertList('radius', cssRadius);
upsertList('zIndex', cssZ);

if (cssFontSans) {
  const stack = cssFontSans.replace(/\s+/g, ' ');
  if (tokens.type.families.sans !== stack) changes.push(`~ type.families.sans -> ${stack}`);
  tokens.type.families.sans = stack;
}

const gone = [...owned].filter((n) => !nowOwned.has(n)).sort();
tokens.meta = { ...tokens.meta, fromCss: [...nowOwned].sort() };

// Compare and write in the file's own line endings (a Windows checkout may hold CRLF).
const eol = before.includes('\r\n') ? '\r\n' : '\n';
const after = (JSON.stringify(tokens, null, 2) + '\n').replace(/\n/g, eol);
const stale = after.replace(/\r\n/g, '\n') !== before.replace(/\r\n/g, '\n');

if (CHECK) {
  if (gone.length) console.log(`Tokens no longer declared in src/index.css (kept; remove by hand if intended):\n  ${gone.join('\n  ')}`);
  if (!stale) { console.log('design-system/project/tokens.json is in sync with src/index.css.'); process.exit(0); }
  console.log('design-system/project/tokens.json is out of date with src/index.css.');
  for (const c of changes) console.log('  ' + c);
  if (!changes.length) console.log('  (formatting or bookkeeping only)');
  console.log('\nRun `npm run ds:build` and commit design-system/.');
  process.exit(1);
}

writeFileSync(TOKENS_PATH, after);
console.log(stale ? `tokens.json updated (${changes.length} change${changes.length === 1 ? '' : 's'}).` : 'tokens.json already in sync.');
for (const c of changes) console.log('  ' + c);
if (gone.length) console.log(`No longer in src/index.css (kept): ${gone.join(', ')}`);
if (skipped.length) console.log(`Not mapped: ${skipped.join('; ')}`);
