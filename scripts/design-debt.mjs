#!/usr/bin/env node
/**
 * Catraca de débito de design.
 *
 * Um banimento absoluto reprovaria no primeiro dia — ainda restam 26
 * hexadecimais cromáticos legítimos, 94 utilitários de paleta e mais de mil
 * tamanhos avulsos. Então isto é uma CATRACA: mede, compara com a linha de
 * base versionada e só reprova quando um número SOBE.
 *
 * A dívida pode cair a qualquer momento; nunca pode crescer sem alguém
 * decidir explicitamente (com `--update`, que reescreve a linha de base e
 * aparece no diff da revisão).
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const BASELINE = path.join(ROOT, 'scripts', 'design-debt-baseline.json');
const UPDATE = process.argv.includes('--update');

function walk(dir, test, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, test, out);
    else if (test(e.name)) out.push(p);
  }
  return out;
}

const tsx = walk(path.join(ROOT, 'src'), (n) => /\.(tsx|ts)$/.test(n));
const readAll = (files) => files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
// Remove blocos /* */ e linhas que começam com //. A forma ingênua contava
// a PALAVRA em prosa: primeiro `!important` dentro do comentário que
// explicava aquele !important, depois `confirm()` dentro do comentário que
// explicava por que NÃO se usa confirm(). Duas vezes a catraca pegou a si
// mesma. O `//` só é removido em início de linha para não estragar URLs.
const stripComments = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');

const src = stripComments(readAll(tsx));
// Comentários são removidos antes de medir: a primeira versão contava
// `!important` escrito em PROSA — inclusive dentro do comentário que explicava
// por que aquele !important era legítimo. A catraca pegou a si mesma.
const cssText = stripComments(fs.readFileSync(path.join(ROOT, 'src', 'index.css'), 'utf8'));

const count = (text, re) => (text.match(re) || []).length;

const METRICS = {
  // Cor crua num utilitário Tailwind — deve ser token.
  'hex-arbitrario-em-classe': count(src, /\[#[0-9A-Fa-f]{6}\]/g),

  // Paleta de estoque em papel estrutural — deve ser token semântico.
  'paleta-slate-gray-estrutural': count(
    src,
    /\b(bg|text|border|divide|placeholder|ring)-(slate|gray)-[0-9]{2,3}\b/g
  ),

  // Tamanho de fonte fora da escala.
  'tamanho-de-fonte-avulso': count(src, /\btext-\[\d+(\.\d+)?px\]/g),

  // Diálogos nativos bloqueiam a thread principal — no meio de uma
  // transmissão isso trava vídeo, chat e encoder.
  'dialogo-nativo-bloqueante': count(src, /\b(alert|confirm)\s*\(/g),

  // Foco removido sem substituto visível.
  'outline-none': count(src, /\bfocus:outline-none\b/g),

  // !important na camada de tokens: era como o tema claro antigo funcionava.
  'important-no-css': count(cssText, /!important/g),

  // z-index acima da escala — a guerra de escalada que chegou a z-[99999].
  'z-index-avulso': count(src, /\bz-\[\d+\]/g),
};

const current = Object.fromEntries(Object.entries(METRICS).map(([k, v]) => [k, v]));

if (UPDATE || !fs.existsSync(BASELINE)) {
  fs.writeFileSync(BASELINE, JSON.stringify(current, null, 2) + '\n');
  console.log(`\nLinha de base ${UPDATE ? 'atualizada' : 'criada'} em scripts/design-debt-baseline.json\n`);
  for (const [k, v] of Object.entries(current)) console.log(`  ${k.padEnd(30)} ${v}`);
  console.log();
  process.exit(0);
}

const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
let regressions = 0, improvements = 0;

console.log('\nCatraca de débito de design\n');
for (const [k, now] of Object.entries(current)) {
  const was = base[k];
  if (was === undefined) {
    console.log(`  NOVA     ${k.padEnd(30)} ${now}`);
    continue;
  }
  if (now > was) {
    console.log(`  SUBIU    ${k.padEnd(30)} ${was} -> ${now}   (+${now - was})`);
    regressions++;
  } else if (now < was) {
    console.log(`  caiu     ${k.padEnd(30)} ${was} -> ${now}   (-${was - now})`);
    improvements++;
  } else {
    console.log(`  ok       ${k.padEnd(30)} ${now}`);
  }
}

if (improvements && !regressions) {
  console.log('\n  A dívida caiu. Rode `npm run debt:update` para travar o novo piso.');
}

if (regressions) {
  console.error(
    `\n${regressions} métrica(s) aumentaram. Use um token em vez de um valor cru — ` +
    `ou, se for intencional, rode \`npm run debt:update\` para que a decisão apareça no diff.\n`
  );
  process.exit(1);
}
console.log('\nSem regressões.\n');
