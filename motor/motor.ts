import http from 'node:http';
import crypto from 'node:crypto';
import { WebSocketServer, type WebSocket } from 'ws';
import { conferirBilhete } from '../src/server/tokenDoMotor';
import { resolvePublicAddress } from '../src/server/safe-http';
import { MAX_DESTINOS, URL_DE_CANAL, chaveValida, type EventoDoMotor, type MensagemDoMotor, type MensagemDoNavegador } from '../src/server/protocoloDoMotor';
import { Sessao } from './sessao';

/**
 * O motor de transmissão: o programa composto chega do navegador por
 * WebSocket (pedaços WebM), é codificado uma vez (H.264 + AAC) e empurrado
 * por RTMP para cada canal. Roda fora da Vercel (Fly.io, região gru), porque
 * precisa de ffmpeg e de conexões que duram uma live inteira.
 *
 * Ele confia em duas coisas: no bilhete que a API assinou (MOTOR_SEGREDO) e
 * em nada mais. As chaves dos canais chegam na primeira mensagem, vivem na
 * memória da sessão e morrem com ela: o motor não tem banco. O que ele conta
 * (início, estado de cada canal, fim) vai para a API em POST /api/motor/eventos,
 * com o mesmo segredo, e é a API que grava.
 *
 * Variáveis: PORT (8080), MOTOR_SEGREDO, APP_URL (a API), FFMPEG (binário),
 * MOTOR_MAX_SESSOES (2), MOTOR_PERMITE_REDE_PRIVADA (só nos testes, fora de produção).
 */

const PORTA = Number(process.env.PORT) || 8080;
const SEGREDO = process.env.MOTOR_SEGREDO?.trim() ?? '';
const APP_URL = process.env.APP_URL?.trim().replace(/\/+$/, '') ?? '';
const FFMPEG = process.env.FFMPEG?.trim() || 'ffmpeg';
const MAX_SESSOES = Number(process.env.MOTOR_MAX_SESSOES) || 2;
const PRODUCAO = process.env.NODE_ENV === 'production';
const PERMITE_REDE_PRIVADA = process.env.MOTOR_PERMITE_REDE_PRIVADA === '1' && !PRODUCAO;

/** Sem vídeo por este tempo, a transmissão acabou do lado de lá. */
const PRAZO_SEM_VIDEO_MS = 15_000;
/** Uma conexão que não se apresenta neste tempo sai: ela ocuparia uma vaga e seguraria a máquina ligada. */
const PRAZO_PARA_COMECAR_MS = 10_000;
/** O máximo que uma transmissão pode mandar em 10 s (cerca de 12 Mbit/s). */
const TETO_DE_BYTES_POR_JANELA = 15 * 1024 * 1024;
/** Um pedaço do MediaRecorder tem algumas centenas de KB; mais que isto não é vídeo nosso. */
const PEDACO_MAXIMO = 4 * 1024 * 1024;
/** Quanto o encerramento de uma sessão pode demorar antes de o motor seguir sem ela. */
const PRAZO_PARA_ENCERRAR_MS = 12_000;

if (!SEGREDO) {
  console.error('MOTOR_SEGREDO não está definido: o motor não aceita ninguém sem ele.');
  process.exit(1);
}
if (!APP_URL) {
  // Sem a API, nada do que acontece aqui chega ao banco: em produção é tão grave quanto não ter segredo
  console.error('APP_URL não está definido: o motor não tem a quem relatar as transmissões.');
  if (PRODUCAO) process.exit(1);
}

const registrar = (sessao: string, mensagem: string) => console.log(`[${new Date().toISOString()}] [${sessao}] ${mensagem}`);

/** As transmissões em curso (ou reservadas, enquanto o pedido é conferido), pela conta: uma por pessoa. */
const sessoes = new Map<string, { sessao: Sessao | null; ws: WebSocket }>();
/** Os bilhetes já usados, até vencerem: um bilhete abre uma transmissão só. */
const bilhetesUsados = new Map<string, number>();
/** Os relatos à API ainda em voo: um reinício espera por eles antes de sair. */
const relatosPendentes = new Set<Promise<void>>();
let ultimoErroDaApi: string | null = null;

/**
 * Conta à API. O fim é o evento que não pode se perder (sem ele a transmissão
 * fica "no ar" no banco para sempre), então ele insiste por mais tempo.
 */
function relatar(evento: EventoDoMotor): Promise<void> {
  if (!APP_URL) return Promise.resolve();
  const tentativas = evento.evento === 'fim' ? 8 : 3;
  const envio = (async () => {
    for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
      try {
        const resposta = await fetch(`${APP_URL}/api/motor/eventos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SEGREDO}` },
          body: JSON.stringify(evento),
          signal: AbortSignal.timeout(8000),
        });
        if (resposta.ok) {
          ultimoErroDaApi = null;
          return;
        }
        ultimoErroDaApi = `${resposta.status} ao evento ${evento.evento}`;
        if (resposta.status === 401 || resposta.status === 403) {
          console.error(`[${evento.sessao}] a API recusou o segredo (${resposta.status}): MOTOR_SEGREDO não confere entre o motor e a API.`);
          return;
        }
        registrar(evento.sessao, `a API respondeu ${resposta.status} ao evento ${evento.evento}`);
        if (resposta.status >= 400 && resposta.status < 500) return;
      } catch (erro) {
        ultimoErroDaApi = `${(erro as Error).message} ao evento ${evento.evento}`;
        registrar(evento.sessao, `a API não recebeu o evento ${evento.evento}: ${(erro as Error).message}`);
      }
      // 1, 2, 3… s entre as tentativas; o fim chega a cerca de dois minutos de insistência
      await new Promise((r) => setTimeout(r, Math.min(1000 * tentativa * tentativa, 30_000)));
    }
  })();
  relatosPendentes.add(envio);
  void envio.finally(() => relatosPendentes.delete(envio));
  return envio;
}

function enviar(ws: WebSocket, mensagem: MensagemDoMotor) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(mensagem));
}

function recusar(ws: WebSocket, mensagem: string) {
  enviar(ws, { tipo: 'erro', mensagem });
  ws.close(1008, mensagem.slice(0, 120));
}

function pedidoValido(valor: unknown): valor is MensagemDoNavegador & { tipo: 'comecar' } {
  const m = valor as Partial<Extract<MensagemDoNavegador, { tipo: 'comecar' }>>;
  return (
    !!m &&
    m.tipo === 'comecar' &&
    typeof m.bilhete === 'string' &&
    m.bilhete.length <= 2048 &&
    typeof m.comSom === 'boolean' &&
    !!m.video &&
    Number.isInteger(m.video.largura) &&
    Number.isInteger(m.video.altura) &&
    Number.isInteger(m.video.qps) &&
    m.video.largura >= 320 &&
    m.video.largura <= 1920 &&
    m.video.altura >= 180 &&
    m.video.altura <= 1080 &&
    Array.isArray(m.destinos) &&
    m.destinos.length >= 1 &&
    m.destinos.length <= MAX_DESTINOS &&
    m.destinos.every(
      (d) =>
        !!d &&
        typeof d.id === 'string' &&
        /^[A-Za-z0-9-]{1,64}$/.test(d.id) &&
        typeof d.nome === 'string' &&
        d.nome.length <= 120 &&
        !/[\x00-\x1f\x7f]/.test(d.nome) &&
        typeof d.url === 'string' &&
        URL_DE_CANAL.test(d.url) &&
        d.url.length <= 2048 &&
        typeof d.chave === 'string' &&
        chaveValida(d.chave),
    )
  );
}

/**
 * Os canais só podem apontar para a internet: o motor não serve de ponte para
 * a rede onde roda. O formato de URL_DE_CANAL garante que o host que a URL
 * declara é o mesmo que o ffmpeg vai procurar (sem `\`, `@` nem usuário).
 */
async function conferirEnderecos(urls: string[]) {
  if (PERMITE_REDE_PRIVADA) return;
  for (const url of urls) {
    const host = new URL(url.replace(/^rtmps:/i, 'https:').replace(/^rtmp:/i, 'http:')).hostname;
    await resolvePublicAddress(host);
  }
}

function usarBilhete(sid: string, exp: number): boolean {
  const agora = Date.now();
  for (const [id, vence] of bilhetesUsados) if (vence * 1000 < agora) bilhetesUsados.delete(id);
  if (bilhetesUsados.has(sid)) return false;
  bilhetesUsados.set(sid, exp);
  return true;
}

async function atender(ws: WebSocket) {
  let sessao: Sessao | null = null;
  let uid = '';
  let comecando = false;
  let bytesNaJanela = 0;
  let inicioDaJanela = Date.now();
  let semVideo: ReturnType<typeof setTimeout> | null = null;
  const id = crypto.randomBytes(4).toString('hex');

  const apresentacao = setTimeout(() => {
    if (!sessao && !comecando) {
      registrar(id, 'a conexão não se apresentou em 10 s');
      ws.close(1008, 'sem pedido de transmissão');
    }
  }, PRAZO_PARA_COMECAR_MS);

  const armarPrazo = () => {
    if (semVideo) clearTimeout(semVideo);
    semVideo = setTimeout(() => {
      registrar(id, 'sem vídeo há 15 s');
      void terminar('O vídeo parou de chegar do navegador.');
    }, PRAZO_SEM_VIDEO_MS);
  };

  const terminar = async (motivo?: string) => {
    if (!sessao) return;
    const atual = sessao;
    sessao = null;
    if (semVideo) clearTimeout(semVideo);
    // A vaga é devolvida mesmo que um ffmpeg se recuse a morrer
    await Promise.race([atual.encerrar(motivo), new Promise((r) => setTimeout(r, PRAZO_PARA_ENCERRAR_MS))]);
    if (sessoes.get(uid)?.ws === ws) sessoes.delete(uid);
    enviar(ws, { tipo: 'encerrado', duracaoS: atual.duracaoS, motivo });
    ws.close(1000, 'encerrado');
  };

  ws.on('message', (dados, binario) => {
    if (binario) {
      if (!sessao) {
        if (!comecando) ws.close(1008, 'vídeo antes do pedido');
        return;
      }
      const pedaco = Buffer.isBuffer(dados) ? dados : Buffer.concat(dados as Buffer[]);
      const agora = Date.now();
      if (agora - inicioDaJanela > 10_000) {
        inicioDaJanela = agora;
        bytesNaJanela = 0;
      }
      bytesNaJanela += pedaco.length;
      if (bytesNaJanela > TETO_DE_BYTES_POR_JANELA) return void terminar('O vídeo passou da taxa que o motor aceita.');
      armarPrazo();
      sessao.receber(pedaco);
      return;
    }

    let mensagem: unknown;
    try {
      mensagem = JSON.parse(String(dados));
    } catch {
      return recusar(ws, 'Mensagem que não é JSON.');
    }
    const tipo = (mensagem as { tipo?: unknown } | null)?.tipo;

    if (tipo === 'parar') {
      void terminar();
      return;
    }
    if (tipo !== 'comecar') return recusar(ws, 'Mensagem desconhecida.');
    if (sessao || comecando) return recusar(ws, 'A transmissão já começou nesta conexão.');
    if (!pedidoValido(mensagem)) return recusar(ws, 'O pedido de transmissão está incompleto.');

    const bilhete = conferirBilhete(mensagem.bilhete, SEGREDO);
    if (!bilhete) return recusar(ws, 'O bilhete da transmissão venceu ou não é válido. Tente entrar ao vivo de novo.');
    if (mensagem.destinos.length > bilhete.n) return recusar(ws, 'Há mais canais do que a API registrou.');
    if (sessoes.has(bilhete.uid)) return recusar(ws, 'Esta conta já está transmitindo. Espere alguns segundos e tente de novo.');
    if (sessoes.size >= MAX_SESSOES) return recusar(ws, 'O servidor de transmissão está cheio agora. Tente em alguns minutos.');
    if (!usarBilhete(bilhete.sid, bilhete.exp)) return recusar(ws, 'Este bilhete já abriu uma transmissão. Entre ao vivo de novo.');
    // A vaga é reservada agora, antes da conferência de endereços (que espera o DNS):
    // dois pedidos ao mesmo tempo não podem passar os dois pelos limites acima
    uid = bilhete.uid;
    comecando = true;
    sessoes.set(uid, { sessao: null, ws });
    const desistir = (motivo: string) => {
      comecando = false;
      if (sessoes.get(uid)?.ws === ws) sessoes.delete(uid);
      // A API já registrou a transmissão: o banco precisa saber que ela não aconteceu
      void relatar({ sessao: bilhete.sid, evento: 'fim', motivo });
      recusar(ws, motivo);
    };

    void (async () => {
      try {
        await conferirEnderecos(mensagem.destinos.map((d) => d.url));
      } catch (erro) {
        registrar(bilhete.sid, `endereço de canal recusado: ${(erro as Error).message}`);
        return desistir('Um dos canais aponta para um endereço que o motor não alcança.');
      }
      if (ws.readyState !== ws.OPEN) return desistir('A conexão fechou antes de começar.');
      const nova = new Sessao(
        bilhete.sid,
        { comSom: mensagem.comSom, video: mensagem.video, destinos: mensagem.destinos },
        {
          ffmpeg: FFMPEG,
          registrar: (m) => registrar(bilhete.sid, m),
          aoEvento: (evento) => {
            if (evento.evento === 'destino') enviar(ws, { tipo: 'destino', id: evento.destino, estado: evento.estado, detalhe: evento.detalhe });
            void relatar({ sessao: bilhete.sid, ...evento });
            if (evento.evento === 'fim' && evento.motivo && sessao === nova) void terminar(evento.motivo);
          },
        },
      );
      try {
        nova.iniciar();
      } catch (erro) {
        // A mensagem do spawn repete os argumentos, com a chave: só o código vai ao registro
        registrar(bilhete.sid, `o ffmpeg não subiu: ${(erro as NodeJS.ErrnoException).code ?? 'erro'}`);
        return desistir('O servidor de transmissão não conseguiu iniciar o vídeo.');
      }
      sessao = nova;
      comecando = false;
      sessoes.set(uid, { sessao: nova, ws });
      registrar(bilhete.sid, `começou: ${mensagem.destinos.length} canais, ${mensagem.video.largura}×${mensagem.video.altura}@${mensagem.video.qps}, ${mensagem.comSom ? 'com' : 'sem'} som`);
      void relatar({ sessao: bilhete.sid, evento: 'inicio' });
      armarPrazo();
      enviar(ws, { tipo: 'pronto' });
    })();
  });

  ws.on('close', (codigo, motivo) => {
    clearTimeout(apresentacao);
    if (sessao) {
      registrar(id, `a conexão fechou com a transmissão em curso (${codigo} ${String(motivo)})`);
      void terminar(codigo === 1009 ? 'Um pedaço de vídeo veio grande demais.' : undefined);
    } else if (comecando) {
      registrar(id, `a conexão fechou enquanto o pedido era conferido (${codigo})`);
    }
  });
  ws.on('error', (erro) => registrar(id, `websocket: ${erro.message}`));
}

const servidor = http.createServer((req, res) => {
  if (req.url === '/saude') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, sessoes: sessoes.size, max: MAX_SESSOES, relata: Boolean(APP_URL), ultimoErroDaApi }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: servidor, path: '/transmitir', maxPayload: PEDACO_MAXIMO });
wss.on('connection', (ws) => void atender(ws));

servidor.listen(PORTA, () => console.log(`motor de transmissão na porta ${PORTA} (até ${MAX_SESSOES} transmissões)`));

// Um reinício (deploy, máquina do Fly parando) encerra o que está no ar com
// aviso, em vez de sumir: o navegador recebe `encerrado` e diz à pessoa, e a
// API recebe o fim antes de o processo sair (fly.toml dá 30 s para isto).
for (const sinal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(sinal, () => {
    console.log(`${sinal}: encerrando ${sessoes.size} transmissões`);
    const motivo = 'O servidor de transmissão foi reiniciado.';
    const todas = [...sessoes.values()].map(async ({ sessao, ws }) => {
      if (sessao) {
        await sessao.encerrar(motivo);
        enviar(ws, { tipo: 'encerrado', duracaoS: sessao.duracaoS, motivo });
      }
      ws.close(1012, 'reiniciando');
    });
    const tudo = Promise.all(todas).then(() => Promise.all(relatosPendentes));
    void Promise.race([tudo, new Promise((r) => setTimeout(r, 25_000))]).then(() => process.exit(0));
  });
}
