// A regra que traduz um erro do Supabase no motivo que a tela diz. É pura, e é
// o que decide se quem bate num teto da conta lê "o limite é 50, exclua um" ou o
// "não foi possível salvar" de sempre. Não precisa de banco: roda em qualquer
// lugar, e no CI a cada pull request.
//
// Uso: `npm run test:cliente`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { erroDeRede, falhaDoSupabase, type FalhaAoSalvar } from '../../src/lib/falhaDoSupabase.ts';

// A forma que a API devolve de verdade (conferida contra o Supabase local): o
// código do gatilho chega inteiro em `code`, ao lado da mensagem.
const doBanco = (code: string, message: string) => ({ code, details: null, hint: null, message });

test('sem rede é sem-conexao, em cada navegador e no Node', () => {
  for (const mensagem of ['Failed to fetch', 'NetworkError when attempting to fetch resource.', 'Load failed', 'fetch failed']) {
    assert.equal(falhaDoSupabase(new TypeError(mensagem)), 'sem-conexao', mensagem);
    assert.equal(erroDeRede(new TypeError(mensagem)), true, mensagem);
  }
  assert.equal(erroDeRede(doBanco('23514', 'violates check constraint')), false);
});

test('a rede cai antes de qualquer código: sem conexão, a mensagem de teto não vale', () => {
  assert.equal(falhaDoSupabase({ name: 'TypeError', message: 'Failed to fetch', code: '23514' }), 'sem-conexao');
});

test('o token vencido ou recusado é sem-login', () => {
  assert.equal(falhaDoSupabase(doBanco('PGRST301', 'JWT expired')), 'sem-login');
  assert.equal(falhaDoSupabase(doBanco('PGRST303', 'JWT issued at future')), 'sem-login');
});

test('os tetos de quantidade da conta são limite-da-conta', () => {
  const casos: [string, string][] = [
    ['WB001', 'row_limit: a conta guarda até 500 linhas em webinars'],
    ['SN001', 'row_limit: a conta guarda até 500 linhas em snapshots'],
    ['AU001', 'row_limit: a conta guarda até 1000 linhas em audience_members'],
    ['TP001', 'script_text_limit: a conta guarda até 2 MB de roteiro'],
  ];
  for (const [codigo, mensagem] of casos) {
    assert.equal(falhaDoSupabase(doBanco(codigo, mensagem)), 'limite-da-conta', codigo);
  }
});

test('um check do banco recusando o valor é grande-demais', () => {
  assert.equal(
    falhaDoSupabase(doBanco('23514', 'new row for relation "studio_settings" violates check constraint "studio_settings_banners_tamanho"')),
    'grande-demais',
  );
});

test('o resto é recusado, sem virar nenhum dos casos acima', () => {
  for (const codigo of ['42501', '23505', '23503', 'PGRST116', 'PGRST204', '57014']) {
    assert.equal(falhaDoSupabase(doBanco(codigo, 'qualquer')), 'recusado', codigo);
  }
});

test('o código só vale em `code`: citado na mensagem, não faz o motivo', () => {
  // O Storage devolve o código dentro da mensagem ("database error, code: MD001")
  // e tem a sua própria regra (midiaDaConta.ts). Esta lê só `code`; se um dia
  // uma resposta trouxer o código só na mensagem, este teste avisa que a regra
  // passou a ler outra coisa.
  assert.equal(falhaDoSupabase({ message: 'row_limit WB001 em webinars' }), 'recusado');
  assert.equal(falhaDoSupabase({ code: 'wb001' }), 'recusado', 'o código é exato, com maiúsculas');
});

test('um erro que não é um erro não derruba a tela', () => {
  for (const estranho of [null, undefined, '', 'WB001', 42, {}, [], { code: 23514 }, { code: null }]) {
    assert.equal(falhaDoSupabase(estranho), 'recusado', JSON.stringify(estranho));
  }
});

// A trava contra o esquecimento. Cada código que a migração dos tetos levanta
// tem de virar limite-da-conta: se um gatilho novo ganha um código e a regra
// não é avisada, quem bate nele lê o "não foi possível salvar" genérico, que é
// o que a etapa 5 existe para tirar.
test('todo código de teto que a migração levanta é traduzido', () => {
  const migracao = readFileSync(
    new URL('../../supabase/migrations/20261001120000_limites_de_tamanho.sql', import.meta.url),
    'utf8',
  );
  // Os códigos entram como argumento do gatilho ('WB001') ou em `errcode = 'TP001'`
  const codigos = [...new Set([...migracao.matchAll(/'([A-Z]{2}\d{3})'/g)].map((m) => m[1]))];
  assert.deepEqual(codigos.sort(), ['AU001', 'SN001', 'TP001', 'WB001'], 'a migração mudou: confira os códigos e a regra');
  for (const codigo of codigos) {
    const motivo: FalhaAoSalvar = falhaDoSupabase(doBanco(codigo, 'qualquer'));
    assert.equal(motivo, 'limite-da-conta', `${codigo} da migração não vira limite-da-conta`);
  }
});
