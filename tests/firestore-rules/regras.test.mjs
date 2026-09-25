// Regras do Firestore, no emulador. Cada fluxo que o app usa tem de PASSAR;
// cada acesso a dado de outra pessoa tem de FALHAR.
//
// Roda com: firebase emulators:exec --only firestore (ver o workflow).
import { after, before, beforeEach, describe, test } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where,
} from 'firebase/firestore';

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-pwstreamer',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  });
});
after(() => env?.cleanup());
beforeEach(() => env.clearFirestore());

// Pessoas. `email_verified` é o que o login Google entrega.
const ANA = { uid: 'uid-ana', email: 'ana@exemplo.com' };
const BRUNO = { uid: 'uid-bruno', email: 'bruno@exemplo.com' };
const ADMIN = { uid: 'uid-admin', email: 'mgdlms@gmail.com' };

const como = (p, verificado = true) =>
  env.authenticatedContext(p.uid, { email: p.email, email_verified: verificado }).firestore();
const anonimo = () => env.unauthenticatedContext().firestore();
const semRegras = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));

// O perfil exatamente como loginWithGoogle cria.
const perfilDeEntrada = (p, extra = {}) => ({
  uid: p.uid,
  email: p.email,
  name: 'Nome',
  photoURL: '',
  plan: 'Free Trial',
  isExpired: false,
  trialDays: 30,
  role: 'client',
  subscriptionStatus: 'trial',
  trialEndsAt: '2026-10-25T00:00:00.000Z',
  ...extra,
});

describe('users', () => {
  test('cria o próprio perfil com os valores de entrada', async () => {
    await assertSucceeds(setDoc(doc(como(ANA), 'users', ANA.uid), perfilDeEntrada(ANA)));
  });

  test('não cria perfil já com plano pago, papel de admin ou campo extra', async () => {
    const db = como(ANA);
    await assertFails(setDoc(doc(db, 'users', ANA.uid), perfilDeEntrada(ANA, { plan: 'Business' })));
    await assertFails(setDoc(doc(db, 'users', ANA.uid), perfilDeEntrada(ANA, { role: 'super-admin' })));
    await assertFails(setDoc(doc(db, 'users', ANA.uid), perfilDeEntrada(ANA, { subscriptionStatus: 'active' })));
    await assertFails(setDoc(doc(db, 'users', ANA.uid), perfilDeEntrada(ANA, { stripeCustomerId: 'cus_x' })));
  });

  test('não cria perfil com e-mail de outra pessoa nem no uid de outra pessoa', async () => {
    const db = como(ANA);
    await assertFails(setDoc(doc(db, 'users', ANA.uid), perfilDeEntrada(ANA, { email: ADMIN.email })));
    await assertFails(setDoc(doc(db, 'users', BRUNO.uid), perfilDeEntrada(BRUNO)));
  });

  test('o admin cria o próprio perfil como super-admin', async () => {
    await assertSucceeds(setDoc(doc(como(ADMIN), 'users', ADMIN.uid), perfilDeEntrada(ADMIN, { role: 'super-admin' })));
  });

  test('e-mail do admin sem verificação não vale como admin', async () => {
    await assertFails(setDoc(doc(como(ADMIN, false), 'users', ADMIN.uid), perfilDeEntrada(ADMIN, { role: 'super-admin' })));
  });

  test('troca nome e foto, mas não plano, papel nem status', async () => {
    await semRegras((db) => setDoc(doc(db, 'users', ANA.uid), perfilDeEntrada(ANA)));
    const ref = doc(como(ANA), 'users', ANA.uid);
    await assertSucceeds(updateDoc(ref, { name: 'Ana Souza', photoURL: 'https://x/y.png' }));
    await assertFails(updateDoc(ref, { plan: 'Business' }));
    await assertFails(updateDoc(ref, { role: 'super-admin' }));
    await assertFails(updateDoc(ref, { subscriptionStatus: 'active' }));
    await assertFails(updateDoc(ref, { isExpired: false, trialEndsAt: '2099-01-01T00:00:00.000Z' }));
    await assertFails(updateDoc(ref, { stripeCustomerId: 'cus_x' }));
  });

  test('lê o próprio perfil; o de outra pessoa e a lista inteira, não', async () => {
    await semRegras(async (db) => {
      await setDoc(doc(db, 'users', ANA.uid), perfilDeEntrada(ANA));
      await setDoc(doc(db, 'users', BRUNO.uid), perfilDeEntrada(BRUNO));
    });
    await assertSucceeds(getDoc(doc(como(ANA), 'users', ANA.uid)));
    await assertFails(getDoc(doc(como(ANA), 'users', BRUNO.uid)));
    await assertFails(getDocs(collection(como(ANA), 'users')));
    await assertFails(getDoc(doc(anonimo(), 'users', ANA.uid)));
  });

  test('o admin lê e altera qualquer perfil', async () => {
    await semRegras((db) => setDoc(doc(db, 'users', ANA.uid), perfilDeEntrada(ANA)));
    await assertSucceeds(getDocs(collection(como(ADMIN), 'users')));
    await assertSucceeds(updateDoc(doc(como(ADMIN), 'users', ANA.uid), { plan: 'Professional' }));
    await assertFails(getDocs(collection(como(ADMIN, false), 'users')));
  });

  test('subcoleções (webinars, cenas...) só do dono', async () => {
    await assertSucceeds(setDoc(doc(como(ANA), 'users', ANA.uid, 'webinars', 'w1'), { title: 'x' }));
    await assertFails(getDoc(doc(como(BRUNO), 'users', ANA.uid, 'webinars', 'w1')));
    await assertFails(setDoc(doc(como(BRUNO), 'users', ANA.uid, 'webinars', 'w2'), { title: 'y' }));
  });
});

describe('rtmpKeys', () => {
  const chave = (dono, extra = {}) => ({
    id: `key_${dono.uid}`,
    label: 'Principal',
    clientEmail: dono.email,
    key: 'pw_live_segredo',
    server: 'rtmp://ingest/live',
    maxBitrate: '6000',
    active: true,
    createdAt: '2026-09-25T00:00:00.000Z',
    ...extra,
  });

  test('o dono cria, lê pela consulta do app e regenera a própria chave', async () => {
    const db = como(ANA);
    const ref = doc(db, 'rtmpKeys', 'key_ana');
    await assertSucceeds(setDoc(ref, chave(ANA), { merge: true }));
    await assertSucceeds(getDocs(query(collection(db, 'rtmpKeys'), where('clientEmail', '==', ANA.email))));
    await assertSucceeds(setDoc(ref, { key: 'pw_live_nova', createdAt: '2026-09-26T00:00:00.000Z' }, { merge: true }));
  });

  test('não cria chave em nome de outra pessoa', async () => {
    await assertFails(setDoc(doc(como(BRUNO), 'rtmpKeys', 'key_ana'), chave(ANA)));
  });

  test('não lê, não consulta e não "adota" a chave de outra pessoa', async () => {
    await semRegras((db) => setDoc(doc(db, 'rtmpKeys', 'key_ana'), chave(ANA)));
    const db = como(BRUNO);
    await assertFails(getDoc(doc(db, 'rtmpKeys', 'key_ana')));
    await assertFails(getDocs(query(collection(db, 'rtmpKeys'), where('clientEmail', '==', ANA.email))));
    await assertFails(getDocs(collection(db, 'rtmpKeys')));
    await assertFails(setDoc(doc(db, 'rtmpKeys', 'key_ana'), { userId: BRUNO.uid }, { merge: true }));
    await assertFails(setDoc(doc(db, 'rtmpKeys', 'key_ana'), { clientEmail: BRUNO.email }, { merge: true }));
    await assertFails(deleteDoc(doc(db, 'rtmpKeys', 'key_ana')));
  });

  test('o dono não passa a chave para outro e-mail', async () => {
    await semRegras((db) => setDoc(doc(db, 'rtmpKeys', 'key_ana'), chave(ANA)));
    await assertFails(setDoc(doc(como(ANA), 'rtmpKeys', 'key_ana'), { clientEmail: BRUNO.email }, { merge: true }));
  });

  test('o admin lista, cria para clientes, altera e revoga', async () => {
    await semRegras((db) => setDoc(doc(db, 'rtmpKeys', 'key_ana'), chave(ANA)));
    const db = como(ADMIN);
    await assertSucceeds(getDocs(collection(db, 'rtmpKeys')));
    await assertSucceeds(setDoc(doc(db, 'rtmpKeys', 'key_bruno'), chave(BRUNO)));
    await assertSucceeds(setDoc(doc(db, 'rtmpKeys', 'key_ana'), { active: false }, { merge: true }));
    await assertSucceeds(deleteDoc(doc(db, 'rtmpKeys', 'key_ana')));
  });
});

describe('auditLogs', () => {
  const registro = (id, ator, extra = {}) => ({
    id,
    timestamp: '2026-09-25T00:00:00.000Z',
    action: 'REGENERATE_RTMP_KEY',
    actorEmail: ator.email,
    targetEmail: ator.email,
    details: 'regenerada',
    ...extra,
  });

  test('grava registro assinado com o próprio e-mail', async () => {
    await assertSucceeds(setDoc(doc(como(ANA), 'auditLogs', 'l1'), registro('l1', ANA)));
  });

  test('não grava registro em nome de outra pessoa nem com id trocado', async () => {
    await assertFails(setDoc(doc(como(ANA), 'auditLogs', 'l1'), registro('l1', ADMIN)));
    await assertFails(setDoc(doc(como(ANA), 'auditLogs', 'l1'), registro('outro', ANA)));
  });

  test('só o admin lê; ninguém edita nem apaga', async () => {
    await semRegras((db) => setDoc(doc(db, 'auditLogs', 'l1'), registro('l1', ANA)));
    await assertFails(getDocs(collection(como(ANA), 'auditLogs')));
    await assertFails(getDoc(doc(como(ANA), 'auditLogs', 'l1')));
    await assertSucceeds(getDocs(collection(como(ADMIN), 'auditLogs')));
    await assertFails(updateDoc(doc(como(ADMIN), 'auditLogs', 'l1'), { details: 'editado' }));
    await assertFails(deleteDoc(doc(como(ADMIN), 'auditLogs', 'l1')));
  });
});

describe('media_assets', () => {
  const asset = (dono, extra = {}) => ({
    id: 'a1',
    name: 'logo.png',
    url: 'https://x/logo.png',
    type: 'logo',
    ownerEmail: dono.email,
    storagePath: 'media/a1',
    createdAt: '2026-09-25T00:00:00.000Z',
    ...extra,
  });

  test('o dono cria, lista pela consulta do app, renomeia e apaga', async () => {
    const db = como(ANA);
    await assertSucceeds(setDoc(doc(db, 'media_assets', 'a1'), asset(ANA)));
    await assertSucceeds(getDocs(query(collection(db, 'media_assets'), where('ownerEmail', '==', ANA.email))));
    await assertSucceeds(updateDoc(doc(db, 'media_assets', 'a1'), { name: 'logo-novo.png' }));
    await assertSucceeds(deleteDoc(doc(db, 'media_assets', 'a1')));
  });

  test('não cria em nome de outra pessoa nem troca o dono', async () => {
    await assertFails(setDoc(doc(como(BRUNO), 'media_assets', 'a2'), asset(ANA)));
    await semRegras((db) => setDoc(doc(db, 'media_assets', 'a1'), asset(ANA)));
    await assertFails(updateDoc(doc(como(ANA), 'media_assets', 'a1'), { ownerEmail: BRUNO.email }));
  });

  test('outra pessoa não lê nem apaga; asset público é legível por quem está logado', async () => {
    await semRegras(async (db) => {
      await setDoc(doc(db, 'media_assets', 'a1'), asset(ANA));
      await setDoc(doc(db, 'media_assets', 'pub'), asset(ANA, { id: 'pub', isPublic: true }));
    });
    await assertFails(getDoc(doc(como(BRUNO), 'media_assets', 'a1')));
    await assertFails(getDocs(query(collection(como(BRUNO), 'media_assets'), where('ownerEmail', '==', ANA.email))));
    await assertFails(deleteDoc(doc(como(BRUNO), 'media_assets', 'a1')));
    await assertSucceeds(getDoc(doc(como(BRUNO), 'media_assets', 'pub')));
    await assertFails(getDoc(doc(anonimo(), 'media_assets', 'pub')));
  });

  test('documentos antigos com ownerId seguem do dono', async () => {
    await semRegras((db) => setDoc(doc(db, 'media_assets', 'velho'), { name: 'x', ownerId: ANA.uid }));
    await assertSucceeds(getDoc(doc(como(ANA), 'media_assets', 'velho')));
    await assertFails(getDoc(doc(como(BRUNO), 'media_assets', 'velho')));
  });
});

describe('coleções que o app não usa', () => {
  test('ninguém grava nem lê webinars, webinarRegistrations ou streamSessions no topo', async () => {
    await assertFails(setDoc(doc(anonimo(), 'webinarRegistrations', 'r1'), { email: 'x@y.com' }));
    await assertFails(setDoc(doc(como(ANA), 'webinarRegistrations', 'r1'), { email: 'x@y.com' }));
    await assertFails(getDocs(collection(como(ANA), 'webinarRegistrations')));
    await assertFails(setDoc(doc(como(ANA), 'webinars', 'w1'), { hostId: ANA.uid }));
    await assertFails(getDoc(doc(anonimo(), 'webinars', 'w1')));
    await assertFails(setDoc(doc(como(ANA), 'streamSessions', 's1'), { userId: ANA.uid }));
  });

  test('coleção desconhecida: negado', async () => {
    await assertFails(setDoc(doc(como(ADMIN), 'qualquer', 'x'), { a: 1 }));
  });
});
