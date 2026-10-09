import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

/**
 * A sala de convidados: uma malha WebRTC entre navegadores, sem servidor de
 * mídia. Cada pessoa conecta direto a cada outra (quem opera e até meia dúzia
 * de convidados), e a sinalização — ofertas, respostas e presença — passa
 * pelo canal de tempo real do Supabase que o app já usa. O nome do canal
 * carrega um token aleatório: quem tem o link entra, como numa chamada do
 * Meet com o link secreto.
 *
 * O que NÃO passa por aqui: o vídeo e o som, que vão de navegador a
 * navegador (STUN só; redes muito fechadas ficam para um TURN futuro), e
 * qualquer segredo da conta — o convidado não tem login.
 *
 * A negociação é a "perfect negotiation" do WebRTC: os dois lados podem
 * oferecer ao mesmo tempo (os dois criam a conexão ao se descobrirem), e o
 * lado "educado" (o de id maior) recua quando as ofertas se cruzam. As
 * descrições vão completas, sem gotejar candidatos: o Realtime tem teto de
 * mensagens por segundo, e uma rajada de candidatos o estouraria.
 */

export interface PessoaDaSala {
  id: string;
  nome: string;
  anfitriao: boolean;
  mudo: boolean;
  semVideo: boolean;
  /** A câmera com o microfone, quando já chegou. */
  camera: MediaStream | null;
  /** A tela compartilhada (só o anfitrião compartilha hoje). */
  tela: MediaStream | null;
}

export interface EstadoDaMalha {
  conectada: boolean;
  pessoas: PessoaDaSala[];
}

interface Meta {
  nome: string;
  anfitriao: boolean;
  mudo: boolean;
  semVideo: boolean;
  /** O id do MediaStream da tela, para o outro lado saber qual trilha é tela. */
  tela: string | null;
  [chave: string]: unknown;
}

interface Par {
  pc: RTCPeerConnection;
  meta: Meta | null;
  streams: Map<string, MediaStream>;
  /** Os senders que ESTE lado criou, por origem e tipo ("camera:video"…): a troca de aparelho é um replaceTrack neles. */
  senders: Map<string, RTCRtpSender>;
  fazendoOferta: boolean;
  ignorandoOferta: boolean;
  educado: boolean;
  sumiu: ReturnType<typeof setTimeout> | null;
}

/** Um teto defensivo: nenhum plano chega perto, e um link vazado não abre conexões sem fim. */
const MAX_PARES = 16;

const ICE: RTCIceServer[] = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }];

/** A meta vem de outro navegador: só entra o que tem a forma certa, nos tamanhos certos. */
function sanearMeta(bruta: unknown): Meta | null {
  if (!bruta || typeof bruta !== 'object') return null;
  const m = bruta as Record<string, unknown>;
  return {
    nome: typeof m.nome === 'string' ? m.nome.trim().slice(0, 60) : '',
    anfitriao: m.anfitriao === true,
    mudo: m.mudo === true,
    semVideo: m.semVideo === true,
    tela: typeof m.tela === 'string' ? m.tela.slice(0, 80) : null,
  };
}

/** Espera o ICE juntar os candidatos (ou 2 s): a descrição vai completa, numa mensagem só. */
function esperarCandidatos(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((pronto) => {
    const prazo = setTimeout(terminar, 2000);
    function mudou() {
      if (pc.iceGatheringState === 'complete') terminar();
    }
    function terminar() {
      clearTimeout(prazo);
      pc.removeEventListener('icegatheringstatechange', mudou);
      pronto();
    }
    pc.addEventListener('icegatheringstatechange', mudou);
  });
}

export class MalhaDaSala {
  private canal: RealtimeChannel | null = null;
  private pares = new Map<string, Par>();
  private minhaMeta: Meta;
  private camera = new MediaStream();
  private telaLocal = new MediaStream();
  private viva = false;
  private conectada = false;

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly token: string,
    readonly id: string,
    opcoes: { nome: string; anfitriao: boolean; aoMudar: (estado: EstadoDaMalha) => void },
  ) {
    this.minhaMeta = { nome: opcoes.nome, anfitriao: opcoes.anfitriao, mudo: false, semVideo: false, tela: null };
    this.aoMudar = opcoes.aoMudar;
  }

  private readonly aoMudar: (estado: EstadoDaMalha) => void;
  private avisoAgendado = false;

  /** Entra na sala. O par de sair(); os dois podem se alternar (StrictMode). */
  entrar() {
    if (this.canal) return;
    this.viva = true;
    const canal = this.supabase.channel(`sala:${this.token}`, {
      config: { broadcast: { self: false }, presence: { key: this.id } },
    });
    this.canal = canal;
    canal.on('broadcast', { event: 'sinal' }, ({ payload }) => void this.aoSinal(payload as { de: string; para: string; descricao: RTCSessionDescriptionInit }));
    canal.on('presence', { event: 'sync' }, () => this.aoPresenca());
    canal.on('presence', { event: 'leave' }, ({ key }) => this.aoSair(String(key)));
    canal.subscribe((situacao) => {
      if (situacao === 'SUBSCRIBED') {
        this.conectada = true;
        void canal.track(this.minhaMeta);
        this.avisar();
      } else if (situacao === 'CHANNEL_ERROR' || situacao === 'TIMED_OUT' || situacao === 'CLOSED') {
        this.conectada = false;
        this.avisar();
      }
    });
  }

  sair() {
    this.viva = false;
    this.conectada = false;
    for (const [id] of this.pares) this.fechar(id);
    const canal = this.canal;
    this.canal = null;
    if (canal) void this.supabase.removeChannel(canal);
  }

  /** A câmera com o microfone desta pessoa. Trocar de aparelho troca as trilhas nas conexões. */
  setCamera(stream: MediaStream | null) {
    this.sincronizar(this.camera, stream ? stream.getTracks() : []);
  }

  /** A tela compartilhada (o anfitrião). Os outros a veem como uma tela, pelo id no presence. */
  setTela(stream: MediaStream | null) {
    this.sincronizar(this.telaLocal, stream ? stream.getVideoTracks() : []);
    this.retrack({ tela: stream ? this.telaLocal.id : null });
  }

  /** O estado que os outros mostram ao lado do nome (o som e o vídeo seguem pela trilha, habilitada ou não). */
  setEstado(estado: { mudo?: boolean; semVideo?: boolean }) {
    this.retrack(estado);
  }

  private retrack(parte: Partial<Meta>) {
    this.minhaMeta = { ...this.minhaMeta, ...parte };
    if (this.canal && this.conectada) void this.canal.track(this.minhaMeta);
  }

  /**
   * Deixa o stream local com exatamente estas trilhas e repete isso em cada
   * conexão. Cada origem e tipo ("camera:video", "camera:audio",
   * "tela:video") tem o SEU sender, criado por este lado: trocar de aparelho
   * é um replaceTrack nele (sem renegociar), e uma origem nova é um addTrack
   * (renegociando). Nunca se reaproveita um transceiver criado pela oferta do
   * outro lado: ele nasce recvonly e sem stream, e um replaceTrack ali não
   * envia nada — era o furo que deixava o convidado sem a imagem de quem
   * opera quando a sala enchia antes da câmera.
   */
  private sincronizar(local: MediaStream, trilhas: MediaStreamTrack[]) {
    for (const velha of local.getTracks()) if (!trilhas.includes(velha)) local.removeTrack(velha);
    for (const nova of trilhas) if (!local.getTracks().includes(nova)) local.addTrack(nova);
    for (const par of this.pares.values()) this.sincronizarPar(par);
  }

  private sincronizarPar(par: Par) {
    for (const [origem, local] of [['camera', this.camera], ['tela', this.telaLocal]] as const) {
      const tipos = new Set(local.getTracks().map((t) => t.kind));
      for (const trilha of local.getTracks()) {
        const chave = `${origem}:${trilha.kind}`;
        const sender = par.senders.get(chave);
        if (sender) {
          if (sender.track !== trilha) void sender.replaceTrack(trilha).catch(() => {});
        } else {
          par.senders.set(chave, par.pc.addTrack(trilha, local));
        }
      }
      // A origem que ficou sem trilha deste tipo para de enviar, mas guarda o lugar
      for (const [chave, sender] of par.senders) {
        if (chave.startsWith(`${origem}:`) && !tipos.has(chave.split(':')[1]) && sender.track) {
          void sender.replaceTrack(null).catch(() => {});
        }
      }
    }
  }

  // ── A presença: quem está na sala ────────────────────────────────────────

  private aoPresenca() {
    const canal = this.canal;
    if (!canal || !this.viva) return;
    const presentes = canal.presenceState() as Record<string, unknown[]>;
    for (const [id, metas] of Object.entries(presentes)) {
      if (id === this.id || this.pares.size >= MAX_PARES) continue;
      const par = this.pares.get(id) ?? this.criarPar(id);
      if (par.sumiu) {
        clearTimeout(par.sumiu);
        par.sumiu = null;
      }
      par.meta = sanearMeta(metas[0]) ?? par.meta;
    }
    this.avisar();
  }

  private aoSair(id: string) {
    const par = this.pares.get(id);
    if (!par || par.sumiu) return;
    // A presença pisca em reconexões: só some de verdade quem ficou fora uns segundos
    par.sumiu = setTimeout(() => this.fechar(id), 4000);
    this.avisar();
  }

  private criarPar(id: string): Par {
    const pc = new RTCPeerConnection({ iceServers: ICE });
    const par: Par = {
      pc,
      meta: null,
      streams: new Map(),
      senders: new Map(),
      fazendoOferta: false,
      ignorandoOferta: false,
      educado: this.id > id,
      sumiu: null,
    };
    this.pares.set(id, par);

    pc.ontrack = (evento) => {
      for (const stream of evento.streams) {
        par.streams.set(stream.id, stream);
        stream.onremovetrack = () => this.avisar();
      }
      this.avisar();
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') this.fechar(id);
      else this.avisar();
    };
    pc.onnegotiationneeded = async () => {
      try {
        par.fazendoOferta = true;
        await pc.setLocalDescription();
        await esperarCandidatos(pc);
        // Um recuo educado no meio da espera já mandou a resposta por aoSinal: não repete
        if (pc.signalingState === 'have-local-offer' && pc.localDescription?.type === 'offer') this.enviar(id, pc.localDescription);
      } catch (erro) {
        console.warn('A oferta ao par não saiu:', erro);
      } finally {
        par.fazendoOferta = false;
      }
    };

    this.sincronizarPar(par);
    return par;
  }

  private fechar(id: string) {
    const par = this.pares.get(id);
    if (!par) return;
    if (par.sumiu) clearTimeout(par.sumiu);
    this.pares.delete(id);
    par.pc.close();
    this.avisar();
  }

  // ── A sinalização: descrições completas, uma mensagem por oferta ─────────

  private enviar(para: string, descricao: RTCSessionDescriptionInit) {
    void this.canal?.send({ type: 'broadcast', event: 'sinal', payload: { de: this.id, para, descricao } });
  }

  private async aoSinal(sinal: { de: string; para: string; descricao: RTCSessionDescriptionInit }) {
    if (!this.viva || sinal.para !== this.id || !sinal.de || typeof sinal.descricao?.type !== 'string') return;
    // Só quem está na presença negocia: um "de" inventado não abre conexão nenhuma
    const presente = this.pares.has(sinal.de) || Boolean((this.canal?.presenceState() as Record<string, unknown>)?.[sinal.de]);
    if (!presente || this.pares.size >= MAX_PARES) return;
    const par = this.pares.get(sinal.de) ?? this.criarPar(sinal.de);
    const { pc } = par;
    const descricao = sinal.descricao;
    try {
      const ofertasSeCruzaram = descricao.type === 'offer' && (par.fazendoOferta || pc.signalingState !== 'stable');
      par.ignorandoOferta = !par.educado && ofertasSeCruzaram;
      if (par.ignorandoOferta) return;
      await pc.setRemoteDescription(descricao);
      if (descricao.type === 'offer') {
        await pc.setLocalDescription();
        await esperarCandidatos(pc);
        if (pc.localDescription) this.enviar(sinal.de, pc.localDescription);
      }
    } catch (erro) {
      console.warn('A negociação com o par falhou:', erro);
    }
  }

  // ── O retrato da sala para a tela ────────────────────────────────────────

  private avisar() {
    if (this.avisoAgendado) return;
    this.avisoAgendado = true;
    queueMicrotask(() => {
      this.avisoAgendado = false;
      if (!this.viva) return;
      this.aoMudar({ conectada: this.conectada, pessoas: this.pessoas() });
    });
  }

  pessoas(): PessoaDaSala[] {
    const lista: PessoaDaSala[] = [];
    for (const [id, par] of this.pares) {
      // Quem piscou na presença (reconexão) continua no retrato até o prazo de fechar
      const vivos = [...par.streams.values()].filter((s) => s.getTracks().some((t) => t.readyState === 'live'));
      const tela = vivos.find((s) => s.id === par.meta?.tela) ?? null;
      const camera = vivos.find((s) => s !== tela) ?? null;
      lista.push({
        id,
        nome: par.meta?.nome?.trim() || 'Convidado',
        anfitriao: par.meta?.anfitriao === true,
        mudo: par.meta?.mudo === true,
        semVideo: par.meta?.semVideo === true,
        camera,
        tela,
      });
    }
    return lista.sort((a, b) => (a.anfitriao === b.anfitriao ? a.nome.localeCompare(b.nome) : a.anfitriao ? -1 : 1));
  }
}

/** O token da sala: aleatório e impossível de adivinhar; o link é o segredo, como no Meet. */
export function novoTokenDeSala(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export const TOKEN_DE_SALA = /^[0-9a-f]{32}$/;

// ── O token do anfitrião, por conta ─────────────────────────────────────────
// Fica no navegador: o link sobrevive a recarregar a página, e "gerar um link
// novo" invalida o antigo (a sala é o canal com o token no nome).
const CHAVE_DO_TOKEN = (uid: string) => `pw_sala_do_estudio_${uid}`;

export function lerOuCriarTokenDaSala(uid: string): string {
  try {
    const salvo = localStorage.getItem(CHAVE_DO_TOKEN(uid));
    if (salvo && TOKEN_DE_SALA.test(salvo)) return salvo;
  } catch {
    // Sem armazenamento (aba privada): um token só desta sessão
  }
  const novo = novoTokenDeSala();
  try {
    localStorage.setItem(CHAVE_DO_TOKEN(uid), novo);
  } catch {
    // Idem: o link vale enquanto o estúdio estiver aberto
  }
  return novo;
}

export function guardarTokenDaSala(uid: string, token: string) {
  try {
    localStorage.setItem(CHAVE_DO_TOKEN(uid), token);
  } catch {
    // Sem armazenamento, o link novo vale só nesta sessão
  }
}
