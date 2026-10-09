// O bilhete do motor (src/server/tokenDoMotor.ts) e os comandos do ffmpeg
// (motor/ffmpeg.ts): o que dá para conferir sem ffmpeg nem rede.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRAZO_DO_BILHETE_S, conferirBilhete, emitirBilhete, segredoConfere } from '../../src/server/tokenDoMotor.ts';
import { argumentosDoCodificador, argumentosDoEmpurrador, enderecoComChave, semAChave, taxaDeVideoKbps } from '../../motor/ffmpeg.ts';

const SEGREDO = 'um-segredo-de-teste';
const DADOS = { sid: '3852b365-6f34-4f44-bd2f-e212983c2018', uid: 'c0ffee00-0000-4000-8000-000000000001', n: 3 };

test('o bilhete volta inteiro com o segredo certo', () => {
  const agora = Date.now();
  const bilhete = emitirBilhete(DADOS, SEGREDO, agora);
  assert.equal(bilhete.split('.').length, 3, 'é um JWT compacto');
  const lido = conferirBilhete(bilhete, SEGREDO, agora + 1000);
  assert.deepEqual(lido, { ...DADOS, exp: Math.floor(agora / 1000) + PRAZO_DO_BILHETE_S });
});

test('o bilhete é recusado com outro segredo, vencido, mexido ou malformado', () => {
  const agora = Date.now();
  const bilhete = emitirBilhete(DADOS, SEGREDO, agora);
  assert.equal(conferirBilhete(bilhete, 'outro-segredo', agora), null);
  assert.equal(conferirBilhete(bilhete, SEGREDO, agora + (PRAZO_DO_BILHETE_S + 1) * 1000), null, 'vencido');
  const [cabecalho, carga, assinatura] = bilhete.split('.');
  const cargaMexida = Buffer.from(JSON.stringify({ ...DADOS, n: 10, exp: Math.floor(agora / 1000) + 60 })).toString('base64url');
  assert.equal(conferirBilhete(`${cabecalho}.${cargaMexida}.${assinatura}`, SEGREDO, agora), null, 'a carga mudou');
  assert.equal(conferirBilhete('nada', SEGREDO, agora), null);
  assert.equal(conferirBilhete('', SEGREDO, agora), null);
});

test('o segredo do motor compara sem vazar nada e sem aceitar vazio', () => {
  assert.equal(segredoConfere(SEGREDO, SEGREDO), true);
  assert.equal(segredoConfere('um-segredo-de-testE', SEGREDO), false);
  assert.equal(segredoConfere(undefined, SEGREDO), false);
  assert.equal(segredoConfere('', SEGREDO), false);
});

test('o codificador pede H.264 + AAC em MPEG-TS, com quadro-chave a cada 2 s e silêncio quando não há som', () => {
  const comSom = argumentosDoCodificador({ largura: 1280, altura: 720, qps: 30 }, true);
  assert.ok(comSom.includes('libx264') && comSom.includes('aac') && comSom.includes('mpegts'));
  assert.equal(comSom[comSom.indexOf('-g') + 1], '60');
  assert.equal(comSom[comSom.indexOf('-b:v') + 1], '3000k');
  assert.ok(!comSom.includes('anullsrc'));
  const semSom = argumentosDoCodificador({ largura: 1280, altura: 720, qps: 30 }, false);
  assert.ok(semSom.some((a) => a.startsWith('anullsrc')), 'a trilha de silêncio entra no lugar do som');
  assert.equal(semSom[semSom.indexOf('-map', semSom.indexOf('-map') + 1) + 1], '1:a:0');
  assert.equal(taxaDeVideoKbps(1080), 4500);
});

test('o empurrador copia sem recodificar para o endereço com a chave, e a chave some dos registros', () => {
  const args = argumentosDoEmpurrador('rtmp://a.rtmp.youtube.com/live2/', 'abcd-1234');
  assert.equal(args[args.length - 1], 'rtmp://a.rtmp.youtube.com/live2/abcd-1234');
  assert.ok(args.includes('copy') && args.includes('flv'));
  assert.equal(enderecoComChave('rtmp://x/live', 'k'), 'rtmp://x/live/k');
  assert.equal(semAChave("Output #0, flv, to 'rtmp://x/live/abcd-1234': erro abcd-1234", 'abcd-1234'), "Output #0, flv, to 'rtmp://x/live/•••': erro •••");
  assert.equal(semAChave('sem chave', ''), 'sem chave');
});

test('a URL de canal só aceita um host que o ffmpeg vai procurar de verdade', async () => {
  const { URL_DE_CANAL, chaveValida } = await import('../../src/server/protocoloDoMotor.ts');
  for (const boa of ['rtmp://a.rtmp.youtube.com/live2/', 'rtmps://live-api-s.facebook.com:443/rtmp/', 'rtmp://[::1]:1935/live']) assert.ok(URL_DE_CANAL.test(boa), boa);
  // Para o new URL o host é example.com; para o ffmpeg, o que vem depois do "@": 127.0.0.1
  for (const ruim of ['rtmp://example.com\\@127.0.0.1:1935/live', 'rtmp://user@example.com/live', 'rtmp://x/live/\u0000', 'rtmp://x/live com espaço', 'http://x/live']) {
    assert.equal(URL_DE_CANAL.test(ruim), false, ruim);
  }
  assert.equal(chaveValida('abcd-1234_xyz'), true);
  for (const ruim of ['a/b', 'a@b', 'a\\b', 'a b', '', 'x'.repeat(1025)]) assert.equal(chaveValida(ruim), false, ruim);
});
