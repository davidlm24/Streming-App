#!/usr/bin/env node
/**
 * Portão de contraste — CI.
 *
 * Lê src/index.css, resolve a camada de tokens em cada escopo (claro, escuro,
 * console) e calcula a razão de contraste de cada par texto/superfície. Falha
 * o build se algum par reprovar.
 *
 * Existe porque a direção JÁ TINHA a regra escrita ("nenhum estado por cor
 * sozinha") e mesmo assim despachou uma violação — com um comentário
 * explicando a violação. Uma frase no guia não segura nada. Um script que lê
 * o arquivo, calcula os números e recusa deixar o comentário ser o argumento,
 * segura.
 */
import fs from 'fs';
import path from 'path';

const CSS = path.join(process.cwd(), 'src', 'index.css');

// ── colorimetria ──────────────────────────────────────────────────────────
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
};
const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

// ── parsing ───────────────────────────────────────────────────────────────
const css = fs.readFileSync(CSS, 'utf8');

/** Extrai um bloco `selector { ... }` de nível superior pelo seu seletor. */
function block(startPattern) {
  const i = css.search(startPattern);
  if (i === -1) return null;
  const open = css.indexOf('{', i);
  let depth = 0;
  for (let j = open; j < css.length; j++) {
    if (css[j] === '{') depth++;
    else if (css[j] === '}' && --depth === 0) return css.slice(open + 1, j);
  }
  return null;
}

const decls = (text) => {
  const out = {};
  if (!text) return out;
  const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(text))) out[m[1]] = m[2].trim();
  return out;
};

const themeBlock = block(/@theme\s*\{/);
const primitives = decls(themeBlock);

const SCOPES = {
  'escuro (:root)':        decls(block(/^:root\s*\{/m)),
  'claro ([data-theme])':  decls(block(/^:root\[data-theme="light"\]/m)),
  'console ([data-surface])': decls(block(/^\[data-surface="console"\]\s*\{/m)),
};

/** Resolve um valor de token até um hexadecimal, seguindo var() por escopo. */
function resolve(value, scope, depth = 0) {
  if (!value || depth > 10) return null;
  const v = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v.toUpperCase();
  const m = v.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (!m) return null;
  const name = m[1];
  const next = scope[name] ?? primitives[name] ?? SCOPES['escuro (:root)'][name];
  return resolve(next, scope, depth + 1);
}

// ── o manifesto de pares ──────────────────────────────────────────────────
// Todo passo de texto contra toda superfície em que ele pode pousar.
const INKS = ['--ink-hi', '--ink', '--ink-lo', '--ink-dim'];
const SURFACES = ['--well', '--bg', '--surface', '--panel', '--raise'];
const MIN_TEXT = 4.5;   // WCAG AA, texto normal
const MIN_UI = 3.0;     // AA, componentes de interface e texto grande

let failures = 0, checked = 0;
const rows = [];

for (const [scopeName, scopeDecls] of Object.entries(SCOPES)) {
  if (!Object.keys(scopeDecls).length) {
    console.error(`  ! escopo não encontrado em index.css: ${scopeName}`);
    failures++;
    continue;
  }
  const merged = { ...SCOPES['escuro (:root)'], ...scopeDecls };
  for (const ink of INKS) {
    for (const surf of SURFACES) {
      const fg = resolve(merged[ink], merged);
      const bg = resolve(merged[surf], merged);
      if (!fg || !bg) continue;
      checked++;
      const r = ratio(fg, bg);
      const ok = r >= MIN_TEXT;
      if (!ok) failures++;
      rows.push({ scopeName, ink, surf, fg, bg, r, ok });
    }
  }
}

// ── guarda extra: comentário afirmando luminâncias casadas ────────────────
// O defeito do tally foi despachado com o comentário "casado com o tally".
// Igualar de propósito a luminância de dois ESTADOS do mesmo controle nunca é
// uma decisão de design; é o defeito.
// Permissivo de propósito: o comentário real era "casado com o tally", com
// palavras no meio. Uma versão estrita não teria pegado o defeito que este
// guarda existe para pegar.
const MATCH_WORDS = /\b(casad[oa]|matched|igual(?:ad[oa])?|equal|same)\b[^*\n]{0,30}\b(tally|luminânc\w*|luminanc\w*|estado|state)\b/i;
const suspicious = css
  .split('\n')
  .map((line, i) => ({ line: line.trim(), n: i + 1 }))
  .filter(({ line }) => /\/\*|\*\//.test(line) && MATCH_WORDS.test(line));

// ── relatório ─────────────────────────────────────────────────────────────
console.log('\nPortão de contraste — pares texto/superfície\n');
let currentScope = null;
for (const row of rows.sort((a, b) => a.scopeName.localeCompare(b.scopeName) || a.r - b.r)) {
  if (row.scopeName !== currentScope) {
    currentScope = row.scopeName;
    console.log(`  ${currentScope}`);
  }
  if (!row.ok) {
    console.log(
      `    FALHA  ${row.ink.padEnd(9)} on ${row.surf.padEnd(9)} ` +
      `${row.fg} / ${row.bg}  ${row.r.toFixed(2)}:1  (mínimo ${MIN_TEXT})`
    );
  }
}

if (suspicious.length) {
  console.log('\n  Comentários afirmando luminância casada entre estados:');
  for (const s of suspicious) console.log(`    FALHA  index.css:${s.n}  ${s.line.slice(0, 80)}`);
  failures += suspicious.length;
}

console.log(`\n  ${checked} pares verificados · ${failures} falha(s)\n`);

if (failures) {
  console.error('Portão de contraste REPROVADO. Corrija o token, não o comentário.\n');
  process.exit(1);
}
console.log('Portão de contraste aprovado.\n');
