// O pedido dos aparelhos: um que falha não leva o outro, e cada falha diz por quê.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fraseDaFalha, motivoDaFalha, pedirCaptura } from '../../src/lib/captura.ts';

// O Node não tem MediaStream; a captura só precisa juntar trilhas
class StreamFalso {
  constructor(private trilhas: { kind: string }[]) {}
  getTracks() {
    return this.trilhas;
  }
}
(globalThis as unknown as { MediaStream: unknown }).MediaStream = StreamFalso;

const erro = (name: string) => Object.assign(new Error(name), { name });
const trilha = (kind: 'audio' | 'video') => ({ kind });

/** Aparelhos falsos: cada tipo responde com uma trilha ou com o erro dado. */
function aparelhos({ video, audio }: { video: string | null; audio: string | null }) {
  return {
    async getUserMedia(pedido: MediaStreamConstraints) {
      const querVideo = !!pedido.video;
      const querAudio = !!pedido.audio;
      if (querVideo && video) throw erro(video);
      if (querAudio && audio) throw erro(audio);
      return new StreamFalso([...(querVideo ? [trilha('video')] : []), ...(querAudio ? [trilha('audio')] : [])]) as unknown as MediaStream;
    },
  };
}

test('os dois aparelhos vêm num pedido só', async () => {
  const r = await pedirCaptura(true, true, aparelhos({ video: null, audio: null }));
  assert.equal(r.falhaDaCamera, null);
  assert.equal(r.falhaDoMicrofone, null);
  assert.deepEqual(r.stream?.getTracks().map((t) => t.kind), ['video', 'audio']);
});

test('sem webcam, o microfone vem mesmo assim', async () => {
  const r = await pedirCaptura(true, true, aparelhos({ video: 'NotFoundError', audio: null }));
  assert.equal(r.falhaDaCamera, 'ausente');
  assert.equal(r.falhaDoMicrofone, null);
  assert.deepEqual(r.stream?.getTracks().map((t) => t.kind), ['audio']);
});

test('câmera presa em outro programa: a falha diz "ocupado" e o microfone vem', async () => {
  const r = await pedirCaptura(true, true, aparelhos({ video: 'NotReadableError', audio: null }));
  assert.equal(r.falhaDaCamera, 'ocupado');
  assert.deepEqual(r.stream?.getTracks().map((t) => t.kind), ['audio']);
});

test('os dois negados: nenhum stream e as duas falhas como "negado"', async () => {
  const r = await pedirCaptura(true, true, aparelhos({ video: 'NotAllowedError', audio: 'NotAllowedError' }));
  assert.equal(r.stream, null);
  assert.equal(r.falhaDaCamera, 'negado');
  assert.equal(r.falhaDoMicrofone, 'negado');
});

test('sem mediaDevices (navegador de dentro de app) volta na hora, em vez de nunca', async () => {
  const r = await pedirCaptura(true, true, undefined);
  assert.equal(r.stream, null);
  assert.equal(r.falhaDaCamera, 'sem-suporte');
  assert.equal(r.falhaDoMicrofone, 'sem-suporte');
});

test('um tipo que não foi pedido não vira falha nem pedido', async () => {
  // Tentar de novo só a câmera, com o microfone vivo: o áudio fica de fora
  const pedidos: MediaStreamConstraints[] = [];
  const base = aparelhos({ video: 'NotFoundError', audio: null });
  const r = await pedirCaptura(true, false, {
    getUserMedia: (p) => (pedidos.push(p), base.getUserMedia(p)),
  });
  assert.equal(r.stream, null);
  assert.equal(r.falhaDaCamera, 'ausente');
  assert.equal(r.falhaDoMicrofone, null);
  assert.ok(pedidos.every((p) => !p.audio), 'pediu o microfone sem ninguém pedir');
});

test('cada motivo tem a frase com o conserto', () => {
  assert.equal(motivoDaFalha(erro('NotAllowedError')), 'negado');
  assert.equal(motivoDaFalha(erro('OverconstrainedError')), 'ausente');
  assert.equal(motivoDaFalha('qualquer coisa'), 'outro');
  assert.match(fraseDaFalha('camera', 'negado'), /não liberou a câmera.*tente de novo/);
  assert.match(fraseDaFalha('microfone', 'ocupado'), /^O microfone está em uso/);
  assert.match(fraseDaFalha('camera', 'sem-suporte'), /Chrome ou no Safari/);
  // Os dois juntos concordam no plural
  assert.match(fraseDaFalha('os-dois', 'ocupado'), /^A câmera e o microfone estão em uso/);
  assert.match(fraseDaFalha('os-dois', 'outro'), /não responderam/);
  assert.match(fraseDaFalha('os-dois', 'negado'), /não liberou a câmera e o microfone/);
});
