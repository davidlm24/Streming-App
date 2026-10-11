// O TURN da sala de convidados (src/server/turnDaSala.ts): a assinatura do
// token, o filtro da porta 53 e o pedido à Cloudflare, sem rede nem banco.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STUN_PADRAO,
  assinarSala,
  configuracaoDoTurn,
  gerarIceDaCloudflare,
  salaConfere,
  semPorta53,
} from '../../src/server/turnDaSala.ts';

const TOKEN = '0123456789abcdef0123456789abcdef';
const SEGREDO = 'token-da-api-de-teste';

test('a assinatura confere com o mesmo segredo, e só com ele', () => {
  const assinatura = assinarSala(TOKEN, SEGREDO);
  assert.match(assinatura, /^[0-9a-f]{32}$/);
  assert.equal(salaConfere(TOKEN, assinatura, SEGREDO), true);
  assert.equal(salaConfere(TOKEN, assinatura, 'outro-segredo'), false);
  assert.equal(salaConfere('f'.repeat(32), assinatura, SEGREDO), false);
});

test('token ou assinatura fora do formato não conferem', () => {
  const assinatura = assinarSala(TOKEN, SEGREDO);
  assert.equal(salaConfere(TOKEN.toUpperCase(), assinatura, SEGREDO), false);
  assert.equal(salaConfere(TOKEN, assinatura.slice(0, 31), SEGREDO), false);
  assert.equal(salaConfere(TOKEN, undefined, SEGREDO), false);
  assert.equal(salaConfere(42, assinatura, SEGREDO), false);
});

test('sem as duas variáveis, não há TURN configurado', () => {
  assert.equal(configuracaoDoTurn({}), null);
  assert.equal(configuracaoDoTurn({ TURN_KEY_ID: 'id' }), null);
  assert.equal(configuracaoDoTurn({ TURN_KEY_ID: ' ', TURN_KEY_API_TOKEN: 'x' }), null);
  assert.deepEqual(configuracaoDoTurn({ TURN_KEY_ID: ' id ', TURN_KEY_API_TOKEN: ' x ' }), { idDaChave: 'id', tokenDaApi: 'x' });
});

test('a porta 53 sai, e um servidor sem URL nenhuma some da lista', () => {
  const lista = semPorta53([
    { urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.cloudflare.com:53'] },
    {
      urls: ['turn:turn.cloudflare.com:3478?transport=udp', 'turn:turn.cloudflare.com:53?transport=udp', 'turns:turn.cloudflare.com:5349?transport=tcp'],
      username: 'u',
      credential: 'c',
    },
    { urls: 'turn:turn.cloudflare.com:53' },
  ]);
  assert.deepEqual(lista, [
    { urls: ['stun:stun.cloudflare.com:3478'] },
    { urls: ['turn:turn.cloudflare.com:3478?transport=udp', 'turns:turn.cloudflare.com:5349?transport=tcp'], username: 'u', credential: 'c' },
  ]);
});

test('o pedido à Cloudflare leva a chave e o prazo, e a resposta volta sem a porta 53', async () => {
  let pedido: { url: string; init: RequestInit } | null = null;
  const buscar = (async (url: string, init: RequestInit) => {
    pedido = { url, init };
    return new Response(
      JSON.stringify({
        iceServers: [
          { urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.cloudflare.com:53'] },
          { urls: ['turn:turn.cloudflare.com:3478?transport=udp', 'turn:turn.cloudflare.com:53?transport=udp'], username: 'u', credential: 'c' },
        ],
      }),
      { status: 201 },
    );
  }) as unknown as typeof fetch;
  const lista = await gerarIceDaCloudflare({ idDaChave: 'chave-1', tokenDaApi: 'segredo' }, { buscar, vidaS: 600 });
  assert.ok(pedido);
  assert.equal(pedido!.url, 'https://rtc.live.cloudflare.com/v1/turn/keys/chave-1/credentials/generate-ice-servers');
  assert.equal(pedido!.init.method, 'POST');
  assert.equal(new Headers(pedido!.init.headers).get('Authorization'), 'Bearer segredo');
  assert.deepEqual(JSON.parse(String(pedido!.init.body)), { ttl: 600 });
  assert.deepEqual(lista, [
    { urls: ['stun:stun.cloudflare.com:3478'] },
    { urls: ['turn:turn.cloudflare.com:3478?transport=udp'], username: 'u', credential: 'c' },
  ]);
});

test('uma resposta de erro ou fora da forma vira erro, não uma lista vazia', async () => {
  const responde = (status: number, corpo: unknown) => (async () => new Response(JSON.stringify(corpo), { status })) as unknown as typeof fetch;
  const config = { idDaChave: 'k', tokenDaApi: 't' };
  await assert.rejects(gerarIceDaCloudflare(config, { buscar: responde(401, { error: 'x' }) }));
  await assert.rejects(gerarIceDaCloudflare(config, { buscar: responde(201, { iceServers: 'nada' }) }));
  await assert.rejects(gerarIceDaCloudflare(config, { buscar: responde(201, { iceServers: [{ urls: 7 }] }) }));
  await assert.rejects(gerarIceDaCloudflare(config, { buscar: responde(201, { iceServers: [{ urls: ['turn:x:53'] }] }) }));
});

test('o STUN padrão é o de antes', () => {
  assert.deepEqual(STUN_PADRAO, [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }]);
});
