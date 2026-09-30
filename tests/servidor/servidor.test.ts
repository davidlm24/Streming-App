// O servidor de verdade (createApiApp) contra o Supabase local: login, perfil,
// papel de admin, teste grátis, webhook do Stripe e portal de cobrança. Cria
// contas de teste e as apaga no fim, então só roda no Supabase local.
//
// Uso: `npm run db:start` e depois `npm run test:servidor`.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function supabaseLocal() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY && process.env.SUPABASE_PUBLISHABLE_KEY) {
    return {
      url: process.env.SUPABASE_URL,
      chaveSecreta: process.env.SUPABASE_SECRET_KEY,
      chavePublicavel: process.env.SUPABASE_PUBLISHABLE_KEY,
    };
  }
  const status = JSON.parse(execSync('npx supabase status -o json', { encoding: 'utf8' }));
  return { url: status.API_URL, chaveSecreta: status.SECRET_KEY, chavePublicavel: status.PUBLISHABLE_KEY };
}

const { url, chaveSecreta, chavePublicavel } = supabaseLocal();
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url)) {
  throw new Error(`Os testes do servidor só rodam no Supabase local, porque criam e apagam contas: ${url}`);
}

const sufixo = Date.now().toString(36);
const SENHA = `senha-de-teste-${sufixo}`;
const EMAIL_DO_ADMIN = `admin-${sufixo}@example.test`;
const SEGREDO_DO_WEBHOOK = 'whsec_teste_local';

process.env.SUPABASE_URL = url;
process.env.SUPABASE_SECRET_KEY = chaveSecreta;
process.env.SUPER_ADMIN_EMAILS = EMAIL_DO_ADMIN;
process.env.STRIPE_SECRET_KEY = 'sk_test_local';
process.env.STRIPE_WEBHOOK_SECRET = SEGREDO_DO_WEBHOOK;
process.env.STRIPE_PRICE_BUSINESS = 'price_business_teste';

// Depois do ambiente: o cliente do servidor lê as variáveis na primeira vez
const { createApiApp } = await import('../../server.ts');
const { isSuperAdmin } = await import('../../src/middleware/auth.ts');

const semSessao = { persistSession: false, autoRefreshToken: false };
const banco = createClient(url, chaveSecreta, { auth: semSessao });

interface Conta {
  id: string;
  token: string;
}

async function criarConta(email: string, nome?: string): Promise<Conta> {
  const criada = await banco.auth.admin.createUser({
    email,
    password: SENHA,
    email_confirm: true,
    user_metadata: nome ? { full_name: nome } : {},
  });
  if (criada.error) throw criada.error;
  const sessao = await createClient(url, chavePublicavel, { auth: semSessao }).auth.signInWithPassword({ email, password: SENHA });
  if (sessao.error || !sessao.data.session) throw sessao.error ?? new Error('sem sessão');
  return { id: criada.data.user.id, token: sessao.data.session.access_token };
}

/** Um cliente da API como a conta, para ver o que a RLS deixa ler. */
const comoConta = (conta: Conta) =>
  createClient(url, chavePublicavel, { auth: semSessao, global: { headers: { Authorization: `Bearer ${conta.token}` } } });

let servidor: Server;
let base = '';
let dona: Conta;
let outra: Conta;
let chefe: Conta;

before(async () => {
  const app = await createApiApp({ serveFrontend: false });
  await app.locals.papeisSincronizados;
  servidor = app.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
  dona = await criarConta(`dona-${sufixo}@example.test`, 'Maria Dona');
  outra = await criarConta(`outra-${sufixo}@example.test`);
  chefe = await criarConta(EMAIL_DO_ADMIN, 'Quem administra');
});

after(async () => {
  servidor?.close();
  for (const conta of [dona, outra, chefe]) {
    if (conta) await banco.auth.admin.deleteUser(conta.id);
  }
});

const pedir = (caminho: string, token?: string, init: RequestInit = {}) =>
  fetch(`${base}${caminho}`, {
    ...init,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) },
  });

const perfilDe = async (conta: Conta) => (await pedir('/api/auth/profile', conta.token)).json();

// ── Login ─────────────────────────────────────────────────────────────────
test('sem token, o perfil responde 401', async () => {
  assert.equal((await pedir('/api/auth/profile')).status, 401);
});

test('um token que o Supabase não emitiu responde 401', async () => {
  assert.equal((await pedir('/api/auth/profile', 'isto-nao-e-um-token')).status, 401);
});

test('o token de uma sessão encerrada responde 401', async () => {
  const email = `saiu-${sufixo}@example.test`;
  const criada = await banco.auth.admin.createUser({ email, password: SENHA, email_confirm: true });
  assert.equal(criada.error, null);
  try {
    const cliente = createClient(url, chavePublicavel, { auth: semSessao });
    const sessao = await cliente.auth.signInWithPassword({ email, password: SENHA });
    const token = sessao.data.session!.access_token;
    assert.equal((await pedir('/api/auth/profile', token)).status, 200);
    await cliente.auth.signOut();
    assert.equal((await pedir('/api/auth/profile', token)).status, 401);
  } finally {
    await banco.auth.admin.deleteUser(criada.data.user!.id);
  }
});

// ── Perfil e papel ────────────────────────────────────────────────────────
test('o perfil vem do banco, com o nome do login e o teste de 30 dias', async () => {
  const resposta = await pedir('/api/auth/profile', dona.token);
  assert.equal(resposta.status, 200);
  const perfil = await resposta.json();
  assert.equal(perfil.uid, dona.id);
  assert.equal(perfil.name, 'Maria Dona');
  assert.equal(perfil.plan, 'Free Trial');
  assert.equal(perfil.role, 'client');
  assert.equal(perfil.isExpired, false);
  assert.ok(perfil.trialDays >= 29 && perfil.trialDays <= 30, `trialDays: ${perfil.trialDays}`);
});

test('o e-mail da lista vira admin, e a RLS deixa o admin ler todos os perfis', async () => {
  assert.equal((await perfilDe(chefe)).role, 'super-admin');
  const doAdmin = await comoConta(chefe).from('profiles').select('id');
  assert.ok((doAdmin.data ?? []).length >= 3, 'o admin lê os perfis de todos');
  const daDona = await comoConta(dona).from('profiles').select('id');
  assert.deepEqual((daDona.data ?? []).map((p) => p.id), [dona.id], 'a dona lê só o dela');
});

test('fora da lista, o papel volta a cliente, no perfil e no banco', async () => {
  process.env.SUPER_ADMIN_EMAILS = '';
  try {
    assert.equal((await perfilDe(chefe)).role, 'client');
    const papel = await banco.from('user_roles').select('role').eq('user_id', chefe.id).single();
    assert.equal(papel.data?.role, 'client');
    const lidos = await comoConta(chefe).from('profiles').select('id');
    assert.deepEqual((lidos.data ?? []).map((p) => p.id), [chefe.id], 'sem o papel, só o próprio perfil');
  } finally {
    process.env.SUPER_ADMIN_EMAILS = EMAIL_DO_ADMIN;
  }
});

test('ao subir sem o e-mail na lista, o servidor tira o papel de admin no banco', async () => {
  assert.equal((await perfilDe(chefe)).role, 'super-admin');
  process.env.SUPER_ADMIN_EMAILS = '';
  try {
    // Um servidor novo, e nenhuma chamada à rota do perfil
    const outroServidor = await createApiApp({ serveFrontend: false });
    await outroServidor.locals.papeisSincronizados;
    const papel = await banco.from('user_roles').select('role').eq('user_id', chefe.id).single();
    assert.equal(papel.data?.role, 'client');
    const lidos = await comoConta(chefe).from('profiles').select('id');
    assert.deepEqual((lidos.data ?? []).map((p) => p.id), [chefe.id], 'pela API, o ex-admin lê só o próprio perfil');
  } finally {
    process.env.SUPER_ADMIN_EMAILS = EMAIL_DO_ADMIN;
  }
});

test('um e-mail da lista sem confirmação não é admin', () => {
  const quem = { uid: chefe.id, email: EMAIL_DO_ADMIN.toUpperCase(), name: '', picture: '' };
  assert.equal(isSuperAdmin({ ...quem, email_verified: false }), false);
  assert.equal(isSuperAdmin({ ...quem, email_verified: true }), true);
});

// ── Teste grátis ──────────────────────────────────────────────────────────
test('com o teste vencido, a live não começa', async () => {
  let situacao = await (await pedir('/api/validate-trial', dona.token, { method: 'POST' })).json();
  assert.equal(situacao.canBroadcast, true);
  const vencido = await banco
    .from('profiles')
    .update({ trial_ends_at: new Date(Date.now() - 86_400_000).toISOString() })
    .eq('id', dona.id);
  assert.equal(vencido.error, null);
  situacao = await (await pedir('/api/validate-trial', dona.token, { method: 'POST' })).json();
  assert.equal(situacao.isExpired, true);
  assert.equal(situacao.canBroadcast, false);
});

// ── Stripe ────────────────────────────────────────────────────────────────
const stripe = new Stripe('sk_test_local');
const AGORA = Math.floor(Date.now() / 1000);
const entregar = (evento: object) => {
  const payload = JSON.stringify(evento);
  return fetch(`${base}/api/webhooks/stripe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': stripe.webhooks.generateTestHeaderString({ payload, secret: SEGREDO_DO_WEBHOOK }),
    },
    body: payload,
  });
};

test('sem uma assinatura válida, o webhook recusa', async () => {
  const resposta = await fetch(`${base}/api/webhooks/stripe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': 't=1,v1=errada' },
    body: '{}',
  });
  assert.equal(resposta.status, 400);
});

test('o checkout pago ativa o plano, e a segunda entrega não muda nada', async () => {
  const evento = {
    id: `evt_${sufixo}_checkout`,
    object: 'event',
    type: 'checkout.session.completed',
    created: AGORA - 300,
    data: {
      object: {
        object: 'checkout.session',
        client_reference_id: dona.id,
        payment_status: 'paid',
        customer: `cus_${sufixo}`,
        subscription: `sub_${sufixo}`,
        metadata: { userId: dona.id, planId: 'Standard' },
      },
    },
  };
  let resposta = await entregar(evento);
  assert.equal(resposta.status, 200);
  assert.deepEqual(await resposta.json(), { received: true, duplicate: false });
  const perfil = await perfilDe(dona);
  assert.equal(perfil.plan, 'Standard');
  assert.equal(perfil.subscriptionStatus, 'active');
  assert.equal(perfil.isExpired, false);

  resposta = await entregar(evento);
  assert.deepEqual(await resposta.json(), { received: true, duplicate: true });
});

test('o cancelamento volta ao teste, que já venceu', async () => {
  const resposta = await entregar({
    id: `evt_${sufixo}_cancelamento`,
    object: 'event',
    type: 'customer.subscription.deleted',
    created: AGORA - 100,
    data: { object: { object: 'subscription', id: `sub_${sufixo}`, customer: `cus_${sufixo}`, metadata: { userId: dona.id } } },
  });
  assert.equal(resposta.status, 200);
  const perfil = await perfilDe(dona);
  assert.equal(perfil.plan, 'Free Trial');
  assert.equal(perfil.isExpired, true);
});

test('um evento mais velho que chega depois do cancelamento não devolve o plano', async () => {
  const resposta = await entregar({
    id: `evt_${sufixo}_atrasado`,
    object: 'event',
    type: 'customer.subscription.updated',
    created: AGORA - 200,
    data: {
      object: {
        object: 'subscription',
        id: `sub_${sufixo}`,
        customer: `cus_${sufixo}`,
        status: 'active',
        metadata: { userId: dona.id, planId: 'Standard' },
      },
    },
  });
  assert.deepEqual(await resposta.json(), { received: true, duplicate: false });
  const perfil = await perfilDe(dona);
  assert.equal(perfil.plan, 'Free Trial');
  assert.equal(perfil.isExpired, true);
});

test('uma assinatura nova, com o plano trocado no portal, vale pelo preço', async () => {
  const resposta = await entregar({
    id: `evt_${sufixo}_nova`,
    object: 'event',
    type: 'customer.subscription.updated',
    created: AGORA,
    data: {
      object: {
        object: 'subscription',
        id: `sub_${sufixo}_nova`,
        customer: `cus_${sufixo}`,
        status: 'active',
        items: { data: [{ price: { id: 'price_business_teste' } }] },
        metadata: { userId: dona.id, planId: 'Standard' },
      },
    },
  });
  assert.deepEqual(await resposta.json(), { received: true, duplicate: false });
  const perfil = await perfilDe(dona);
  assert.equal(perfil.plan, 'Business');
  assert.equal(perfil.isExpired, false);
});

test('um evento com um id que não é do Supabase só fica registrado', async () => {
  const resposta = await entregar({
    id: `evt_${sufixo}_antigo`,
    object: 'event',
    type: 'checkout.session.completed',
    data: { object: { object: 'checkout.session', client_reference_id: 'uidDoFirebase123', payment_status: 'paid', metadata: { planId: 'Business' } } },
  });
  assert.equal(resposta.status, 200);
  assert.deepEqual(await resposta.json(), { received: true, duplicate: false });
});

test('sem cliente do Stripe, o portal de cobrança responde 404', async () => {
  assert.equal((await pedir('/api/billing/portal', outra.token, { method: 'POST' })).status, 404);
});

test('a rota de gerar de novo uma chave RTMP saiu', async () => {
  assert.equal((await pedir('/api/rtmp/keys/qualquer/regenerate', dona.token, { method: 'POST' })).status, 404);
});
