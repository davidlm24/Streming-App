import type { StudioSceneState } from '../../types';
import { CARD_PADRAO, FONTE_CAMERA, medidasDoCard } from '../cenas';
import { matrizDaChave, matrizDoDescarte, suavizacaoEmPx, type AjustesDaCamera, type AjustesDoCroma } from '../camera';
import type { RelogioDoCronometro } from '../graficos';
import { desenhaATela, type PlayerDoClipe } from '../playerDoClipe';
import type { PaginaMostrada } from '../useApresentacao';
import { GraficosNoCanvas } from './graficosNoCanvas';
import { SomDoPrograma } from './somDoPrograma';
import {
  ALTURA_DO_PALCO,
  ESCALA_DE_PX_FIXO,
  LARGURA_DO_PALCO,
  QPS_DO_PALCO,
  TINTAS_DO_PALCO,
  caixaContida,
  caixasDaDivisao,
  caixasDaGrade,
  fonteDoPalco,
  recorteDeCapa,
  umCqw,
  type Caixa,
} from './medidas';

/** A duração da fusão. A mesma de `DURACAO_DA_FUSAO` (CenasETransicao); copiada para a lib não importar componente. */
export const FUSAO_NO_PALCO_MS = 400;

export interface SaidaDaFusao {
  estado: StudioSceneState;
  player: PlayerDoClipe | null;
  /** performance.now() do corte: o desenho que sai se dissolve em FUSAO_NO_PALCO_MS. */
  inicioEm: number;
}

export interface EntradaDoCompositor {
  programa: StudioSceneState;
  /** O programa anterior, enquanto a fusão o dissolve; null fora dela. */
  saindo: SaidaDaFusao | null;
  /** O primeiro nome de quem opera, para o lugar da câmera sem imagem. */
  nome: string;
  /** Os convidados da sala que podem estar em cena: o nome fica no lugar da imagem que faltar. */
  convidados: { id: string; nome: string; semVideo: boolean }[];
  cameraDesligada: boolean;
  /** Ao vivo nos dois monitores, como o próprio aparelho (exceções do corte). */
  camera: AjustesDaCamera;
  relogio: RelogioDoCronometro;
  playerDoClipe: PlayerDoClipe | null;
  paginaDaApresentacao: PaginaMostrada | null;
}

/**
 * O compositor do programa: desenha num canvas de 1280 × 720, trinta vezes
 * por segundo, o estado do programa — e é este canvas que o monitor de
 * programa exibe. O que o operador vê e o que a gravação (e, depois, a
 * transmissão) recebem são a MESMA imagem, por construção: a Regra do
 * Preview Fiel deixa de depender de dois desenhistas ficarem iguais.
 *
 * `stream` é o desenho como vídeo de verdade (`captureStream`) mais o som
 * mixado (SomDoPrograma). As guias e qualquer alça de edição ficam FORA
 * daqui: são DOM por cima do canvas, ajuda de operação que não vai ao ar.
 *
 * Nasce passivo (só o canvas, que o monitor já pode exibir) e liga em
 * iniciar(): com o StrictMode, o React cria e descarta uma instância a mais,
 * e ela não pode deixar laço nem AudioContext para trás.
 */
export class CompositorDoPrograma {
  readonly canvas: HTMLCanvasElement;
  /** O vídeo composto com o som da live. Existe entre iniciar() e soltar(). */
  stream: MediaStream | null = null;

  private ctx: CanvasRenderingContext2D;
  private graficos: GraficosNoCanvas;
  private som = new SomDoPrograma();
  private entrada: EntradaDoCompositor | null = null;
  private pedido = 0;
  private ultimoQuadro = 0;
  /** O relógio da aba escondida (relogio.worker.ts); criado na primeira vez que ela some. */
  private relogio: Worker | null = null;
  /** Um quadro que falhou já foi contado no console: não repete trinta vezes por segundo. */
  private quadroFalhou = false;

  private videoDaCamera = videoDeFonte();
  private videoDaTela = videoDeFonte();
  /** Um vídeo por convidado da sala, pelo id dele na cena (g-…). */
  private videosDosConvidados = new Map<string, HTMLVideoElement>();
  /** O último nome conhecido de cada convidado: quem saiu da sala ainda é nomeado no programa até o corte. */
  private nomesDosConvidados = new Map<string, string>();
  private imagens = new Map<string, { img: HTMLImageElement; pronta: boolean; falhou: boolean }>();
  /** A página da apresentação no cache: uma só, para não guardar o PDF inteiro decodificado. */
  private paginaEmCache: string | null = null;

  // O croma é o mesmo filtro SVG dos monitores HTML, com um id próprio do compositor
  private svgDoCroma: SVGSVGElement | null = null;
  private idDoCroma = `croma-video-${Math.random().toString(36).slice(2, 8)}`;
  private cromaAplicado = '';
  private readonly temFiltro: boolean;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = LARGURA_DO_PALCO;
    this.canvas.height = ALTURA_DO_PALCO;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('O navegador não deu o contexto 2d do palco.');
    this.ctx = ctx;
    this.temFiltro = typeof ctx.filter === 'string';
    this.graficos = new GraficosNoCanvas((url) => this.imagem(url));
    // As fontes dos gráficos, pedidas já: sem isto o primeiro quadro sai na fonte do sistema
    [400, 500, 600].forEach((peso) => void document.fonts?.load?.(fonteDoPalco(32, peso)).catch(() => {}));
  }

  iniciar() {
    if (this.stream) return;
    this.montarCroma();
    const video = this.canvas.captureStream(QPS_DO_PALCO);
    this.stream = new MediaStream([...video.getVideoTracks(), this.som.iniciar()]);
    document.addEventListener('visibilitychange', this.escolherRelogio);
    this.escolherRelogio();
  }

  soltar() {
    document.removeEventListener('visibilitychange', this.escolherRelogio);
    cancelAnimationFrame(this.pedido);
    this.pedido = 0;
    this.relogio?.terminate();
    this.relogio = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.som.soltar();
    this.svgDoCroma?.remove();
    this.svgDoCroma = null;
    this.cromaAplicado = '';
    this.videoDaCamera.srcObject = null;
    this.videoDaTela.srcObject = null;
    for (const video of this.videosDosConvidados.values()) video.srcObject = null;
    this.videosDosConvidados.clear();
    this.nomesDosConvidados.clear();
    this.imagens.clear();
    this.paginaEmCache = null;
  }

  /** O estado que o próximo quadro desenha. Chamado a cada render do estúdio. */
  atualizar(entrada: EntradaDoCompositor) {
    this.entrada = entrada;
    // A apresentação solta as páginas longe da atual; o cache faz o mesmo e fica só com a da vez
    const pagina = entrada.paginaDaApresentacao?.url ?? null;
    if (pagina !== this.paginaEmCache) {
      if (this.paginaEmCache) this.imagens.delete(this.paginaEmCache);
      this.paginaEmCache = pagina;
    }
    this.som.acordar();
    if (entrada.playerDoClipe) this.som.ligarClipe(entrada.playerDoClipe.video);
    if (entrada.saindo?.player) this.som.ligarClipe(entrada.saindo.player.video);
    const telaNoAr = desenhaATela(entrada.programa) && !entrada.programa.clipe && !entrada.programa.apresentacao;
    this.som.telaNoAr(telaNoAr);
    for (const c of entrada.convidados) this.nomesDosConvidados.set(c.id, c.nome);
    // A voz de um convidado entra na mistura enquanto ele está no programa —
    // e segue na fusão enquanto o desenho que sai ainda o mostra
    const noAr = new Set([...entrada.programa.activeParticipantIds, ...(entrada.saindo?.estado.activeParticipantIds ?? [])]);
    this.som.convidadosNoAr(new Set([...noAr].filter((id) => this.videosDosConvidados.has(id))));
    this.ajustarCroma(entrada.camera.croma);
  }

  /**
   * Prepara o som para gravar ou transmitir, dentro do gesto que pediu (o
   * clique em Gravar). Devolve se o som está rodando: sem ele, quem chama
   * grava só o vídeo, em vez de um arquivo que nunca começa.
   */
  async prepararSom(): Promise<boolean> {
    return this.som.retomar();
  }

  setCamera(stream: MediaStream | null) {
    this.videoDaCamera.srcObject = stream;
    if (stream) void this.videoDaCamera.play().catch(avisarSeNaoTocou('a câmera'));
  }

  setTela(stream: MediaStream | null) {
    this.videoDaTela.srcObject = stream;
    if (stream) void this.videoDaTela.play().catch(avisarSeNaoTocou('a tela'));
    this.som.setTela(stream);
  }

  setMicrofone(trilha: MediaStreamTrack | null) {
    this.som.setMicrofone(trilha);
  }

  /** A câmera e a voz de um convidado da sala; null quando ele sai. */
  setConvidado(id: string, stream: MediaStream | null) {
    let video = this.videosDosConvidados.get(id);
    if (!stream) {
      if (video) video.srcObject = null;
      this.videosDosConvidados.delete(id);
      this.som.setConvidado(id, null);
      return;
    }
    if (!video) {
      video = videoDeFonte();
      this.videosDosConvidados.set(id, video);
    }
    if (video.srcObject !== stream) {
      video.srcObject = stream;
      void video.play().catch(avisarSeNaoTocou('um convidado'));
    }
    this.som.setConvidado(id, stream.getAudioTracks()[0] ?? null);
  }

  // ── O laço: rAF à vista, o worker escondido, segurado em 30 qps ──────────

  /** À vista, o rAF, no ritmo da tela; escondida, o relógio do worker, que o navegador não para. */
  private escolherRelogio = () => {
    if (!this.stream) return;
    if (!document.hidden) {
      this.relogio?.postMessage(0);
      if (!this.pedido) this.pedido = requestAnimationFrame(this.aCadaQuadro);
      return;
    }
    cancelAnimationFrame(this.pedido);
    this.pedido = 0;
    if (!this.relogio) {
      try {
        this.relogio = new Worker(new URL('./relogio.worker.ts', import.meta.url), { type: 'module' });
        this.relogio.onmessage = () => this.quadro(performance.now(), true);
      } catch (erro) {
        console.warn('Sem relógio para a aba escondida: o programa para enquanto o estúdio não aparece.', erro);
        return;
      }
    }
    this.relogio.postMessage(1000 / QPS_DO_PALCO);
  };

  private aCadaQuadro = (agora: number) => {
    this.pedido = requestAnimationFrame(this.aCadaQuadro);
    this.quadro(agora, false);
  };

  /** O worker já bate no ritmo do palco; o rAF, no da tela, é segurado em 30 qps. */
  private quadro(agora: number, noRitmo: boolean) {
    if (!noRitmo && agora - this.ultimoQuadro < 1000 / QPS_DO_PALCO - 1) return;
    this.ultimoQuadro = agora;
    try {
      this.desenhar(agora);
      this.quadroFalhou = false;
    } catch (erro) {
      // Um save() sem restore() deixaria recorte, transformação ou opacidade
      // em todos os quadros seguintes: redimensionar zera o contexto inteiro
      this.canvas.width = LARGURA_DO_PALCO;
      if (!this.quadroFalhou) console.error('Um quadro do programa falhou:', erro);
      this.quadroFalhou = true;
    }
  }

  private desenhar(agora: number) {
    const { ctx } = this;
    ctx.fillStyle = TINTAS_DO_PALCO.palco;
    ctx.fillRect(0, 0, LARGURA_DO_PALCO, ALTURA_DO_PALCO);
    const e = this.entrada;
    if (!e) return;

    this.desenharEstado(e.programa, e.playerDoClipe, e, agora);

    // A fusão: o programa que sai, inteiro e opaco sobre o que entra (o fundo
    // dele também, ou as faixas pretas do que sai mostrariam o que entra em
    // cheio desde o começo), dissolvendo em ease-out. O clique do corte pode
    // vir depois do instante do quadro: o tempo começa em zero, sem salto.
    if (e.saindo) {
      const t = Math.max(0, (agora - e.saindo.inicioEm) / FUSAO_NO_PALCO_MS);
      if (t < 1) {
        ctx.save();
        ctx.globalAlpha = (1 - t) * (1 - t);
        ctx.fillStyle = TINTAS_DO_PALCO.palco;
        ctx.fillRect(0, 0, LARGURA_DO_PALCO, ALTURA_DO_PALCO);
        this.desenharEstado(e.saindo.estado, e.saindo.player, e, agora);
        ctx.restore();
      }
    }
  }

  private desenharEstado(estado: StudioSceneState, player: PlayerDoClipe | null, e: EntradaDoCompositor, agora: number) {
    const fundo = estado.activeBackground ? this.imagem(estado.activeBackground) : null;
    if (fundo) this.desenharCapa(fundo, { x: 0, y: 0, w: LARGURA_DO_PALCO, h: ALTURA_DO_PALCO });

    this.desenharComposicao(estado, player, e);

    const sobre = estado.activeOverlay ? this.imagem(estado.activeOverlay) : null;
    if (sobre) this.desenharCapa(sobre, { x: 0, y: 0, w: LARGURA_DO_PALCO, h: ALTURA_DO_PALCO });

    this.graficos.desenhar(this.ctx, estado.graficos, estado.pinnedComment, e.relogio, agora);
  }

  private desenharComposicao(estado: StudioSceneState, player: PlayerDoClipe | null, e: EntradaDoCompositor) {
    const temCamera = estado.activeParticipantIds.includes(FONTE_CAMERA);
    const temTela = desenhaATela(estado);
    const inteira: Caixa = { x: 0, y: 0, w: LARGURA_DO_PALCO, h: ALTURA_DO_PALCO };

    // A grade: todos os que estão na cena, em caixas iguais, como numa chamada.
    // Quem saiu da sala CONTINUA com a caixa dele até o próximo corte: o
    // programa não se recompõe sozinho no ar (vira a silhueta com "Saiu da sala").
    if (estado.layout === 'grid') {
      const pessoas = estado.activeParticipantIds.filter((id) => id === FONTE_CAMERA || id.startsWith('g-'));
      const caixas = caixasDaGrade(Math.max(1, pessoas.length));
      pessoas.forEach((id, i) => {
        if (id === FONTE_CAMERA) this.desenharCamera(e, caixas[i], estado);
        else this.desenharConvidado(id, caixas[i], e);
      });
      if (pessoas.length === 0) this.aviso('Nenhuma fonte nesta cena.', inteira, TINTAS_DO_PALCO.ink);
      return;
    }

    if (!temCamera && !temTela) {
      this.aviso('Nenhuma fonte nesta cena.', inteira, TINTAS_DO_PALCO.ink);
      return;
    }
    if (temCamera && !temTela) {
      this.desenharCamera(e, inteira, estado);
      return;
    }
    if (!temCamera) {
      this.desenharTela(estado, player, inteira);
      return;
    }

    switch (estado.layout) {
      case 'picture-in-picture':
      case 'presentation': {
        this.desenharTela(estado, player, inteira);
        this.desenharCard(estado, e);
        return;
      }
      case 'dual': {
        const { primeira, segunda } = caixasDaDivisao('metades');
        this.desenharCamera(e, primeira, estado);
        this.desenharTela(estado, player, segunda);
        return;
      }
      case 'camera-em-destaque': {
        const { primeira, segunda } = caixasDaDivisao('maior-e-menor');
        this.desenharCamera(e, primeira, estado);
        this.desenharTela(estado, player, segunda);
        return;
      }
      default: {
        // screen-share: a tela com três quartos e a câmera ao lado
        const { primeira, segunda } = caixasDaDivisao('maior-e-menor');
        this.desenharTela(estado, player, primeira);
        this.desenharCamera(e, segunda, estado);
      }
    }
  }

  // ── Câmera: cover + zoom, deslocamento e espelho, e o croma do CSS ───────

  private desenharCamera(e: EntradaDoCompositor, caixa: Caixa, estado: StudioSceneState) {
    const { ctx } = this;
    const video = this.videoDaCamera;
    const croma = e.camera.croma;

    ctx.save();
    ctx.beginPath();
    ctx.rect(caixa.x, caixa.y, caixa.w, caixa.h);
    ctx.clip();

    // Com croma, o pano atrás da pessoa é a imagem de fundo da cena; sem
    // croma, a caixa é preta como o contêiner HTML (bg --stage)
    const fundo = croma.ligado && estado.activeBackground ? this.imagem(estado.activeBackground) : null;
    if (fundo) this.desenharCapa(fundo, caixa);
    else {
      ctx.fillStyle = TINTAS_DO_PALCO.palco;
      ctx.fillRect(caixa.x, caixa.y, caixa.w, caixa.h);
    }

    // Uma trilha que acabou (aparelho desligado, outro programa a tomou) deixa
    // o último quadro no elemento: sem esta conta, o programa congelava o rosto
    const trilha = (video.srcObject as MediaStream | null)?.getVideoTracks()[0];
    const pronta = !e.cameraDesligada && trilha?.readyState === 'live' && video.readyState >= 2 && video.videoWidth > 0;
    if (!pronta) {
      this.desenharCameraSemImagem(e, caixa);
      ctx.restore();
      return;
    }

    // scale(zoom) translate(−x/zoom%, −y/zoom%) scaleX(espelho), origem no centro — transformacaoDaCamera
    const a = e.camera;
    ctx.translate(caixa.x + caixa.w / 2, caixa.y + caixa.h / 2);
    ctx.scale(a.zoom, a.zoom);
    if (a.zoom > 1) ctx.translate((-a.x / a.zoom / 100) * caixa.w, (-a.y / a.zoom / 100) * caixa.h);
    if (a.espelhar) ctx.scale(-1, 1);
    if (croma.ligado && this.temFiltro) ctx.filter = `url(#${this.idDoCroma})`;
    const { sx, sy, sw, sh } = recorteDeCapa(video.videoWidth, video.videoHeight, caixa.w, caixa.h);
    ctx.drawImage(video, sx, sy, sw, sh, -caixa.w / 2, -caixa.h / 2, caixa.w, caixa.h);
    ctx.filter = 'none';
    ctx.restore();
  }

  /** Um convidado da sala numa caixa: a imagem em cover, ou o nome com a silhueta quando ela falta. */
  private desenharConvidado(id: string, caixa: Caixa, e: EntradaDoCompositor) {
    const { ctx } = this;
    ctx.save();
    ctx.beginPath();
    ctx.rect(caixa.x, caixa.y, caixa.w, caixa.h);
    ctx.clip();
    ctx.fillStyle = TINTAS_DO_PALCO.palco;
    ctx.fillRect(caixa.x, caixa.y, caixa.w, caixa.h);
    const video = this.videosDosConvidados.get(id);
    const presente = e.convidados.find((c) => c.id === id);
    const nome = presente?.nome ?? this.nomesDosConvidados.get(id) ?? 'Convidado';
    const trilha = (video?.srcObject as MediaStream | null)?.getVideoTracks()[0];
    // A câmera desligada do convidado manda quadros pretos: a silhueta vem do semVideo dele, como no preview
    if (presente && !presente.semVideo && video && trilha?.readyState === 'live' && video.readyState >= 2 && video.videoWidth > 0) {
      const { sx, sy, sw, sh } = recorteDeCapa(video.videoWidth, video.videoHeight, caixa.w, caixa.h);
      ctx.drawImage(video, sx, sy, sw, sh, caixa.x, caixa.y, caixa.w, caixa.h);
    } else {
      this.desenharPessoaSemImagem(nome, presente ? (presente.semVideo ? 'Câmera desligada' : 'Sem imagem da câmera') : 'Saiu da sala', caixa);
    }
    ctx.restore();
  }

  private desenharCameraSemImagem(e: EntradaDoCompositor, caixa: Caixa) {
    this.desenharPessoaSemImagem(e.nome, e.cameraDesligada ? 'Câmera desligada' : 'Sem imagem da câmera', caixa);
  }

  private desenharPessoaSemImagem(nome: string, frase: string, caixa: Caixa) {
    const { ctx } = this;
    const cx = caixa.x + caixa.w / 2;
    const d = Math.min(caixa.h * 0.4, 64 * ESCALA_DE_PX_FIXO);
    const cy = caixa.y + caixa.h / 2 - d * 0.4;
    ctx.fillStyle = TINTAS_DO_PALCO.raise;
    ctx.beginPath();
    ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
    ctx.fill();
    // A silhueta no lugar do ícone: cabeça e ombros, recortados no círculo
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = TINTAS_DO_PALCO.inkLo;
    ctx.beginPath();
    ctx.arc(cx, cy - d * 0.12, d * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy + d * 0.42, d * 0.28, Math.PI, 0);
    ctx.fill();
    ctx.restore();

    const nomePx = Math.min(1.75 * umCqw, caixa.h * 0.1);
    const estadoPx = Math.min(1.5 * umCqw, caixa.h * 0.085);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = TINTAS_DO_PALCO.inkHi;
    ctx.font = fonteDoPalco(nomePx, 500);
    ctx.fillText(nome, cx, cy + d * 0.5 + nomePx);
    ctx.fillStyle = TINTAS_DO_PALCO.inkLo;
    ctx.font = fonteDoPalco(estadoPx);
    ctx.fillText(frase, cx, cy + d * 0.5 + nomePx + estadoPx * 1.6);
    ctx.textAlign = 'left';
  }

  // ── Tela: o clipe, a página da apresentação ou a tela compartilhada ──────

  private desenharTela(estado: StudioSceneState, player: PlayerDoClipe | null, caixa: Caixa) {
    const { ctx } = this;
    ctx.fillStyle = TINTAS_DO_PALCO.palco;
    ctx.fillRect(caixa.x, caixa.y, caixa.w, caixa.h);

    if (estado.clipe) {
      const video = player && player.id === estado.clipe.id ? player.video : null;
      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        const dentro = caixaContida(video.videoWidth, video.videoHeight, caixa);
        ctx.drawImage(video, dentro.x, dentro.y, dentro.w, dentro.h);
      }
      return;
    }
    if (estado.apresentacao) {
      const pagina = this.entrada?.paginaDaApresentacao;
      const daVez = pagina && pagina.id === estado.apresentacao.id ? pagina.url : null;
      const img = daVez ? this.imagem(daVez) : null;
      if (img) {
        const dentro = caixaContida(img.naturalWidth, img.naturalHeight, caixa);
        ctx.drawImage(img, dentro.x, dentro.y, dentro.w, dentro.h);
      } else if (daVez && this.imagens.get(daVez)?.falhou) {
        this.aviso('A página não pôde ser desenhada.', caixa, TINTAS_DO_PALCO.inkLo);
      } else {
        this.aviso('Desenhando a página…', caixa, TINTAS_DO_PALCO.inkLo);
      }
      return;
    }
    const tela = this.videoDaTela;
    if (tela.srcObject && tela.readyState >= 2 && tela.videoWidth > 0) {
      const dentro = caixaContida(tela.videoWidth, tela.videoHeight, caixa);
      ctx.drawImage(tela, dentro.x, dentro.y, dentro.w, dentro.h);
    } else {
      this.aviso('Nenhuma tela compartilhada.', caixa, TINTAS_DO_PALCO.inkLo);
    }
  }

  // ── O card da câmera sobre a tela ────────────────────────────────────────

  private desenharCard(estado: StudioSceneState, e: EntradaDoCompositor) {
    const { ctx } = this;
    const card = estado.cardDaCamera ?? CARD_PADRAO;
    const { largura, altura } = medidasDoCard(card);
    const caixa: Caixa = {
      x: (card.x / 100) * LARGURA_DO_PALCO,
      y: (card.y / 100) * ALTURA_DO_PALCO,
      w: (largura / 100) * LARGURA_DO_PALCO,
      h: (altura / 100) * ALTURA_DO_PALCO,
    };
    const borda = 2 * ESCALA_DE_PX_FIXO;
    const raio =
      card.formato === 'circle' ? caixa.w / 2 : (card.formato === 'compact' ? 8 : 12) * ESCALA_DE_PX_FIXO;

    // A borda é gráfico da live, na cor dos gráficos; a sombra é a do card HTML
    ctx.save();
    ctx.shadowColor = 'rgb(0 0 0 / 0.45)';
    ctx.shadowBlur = 12 * ESCALA_DE_PX_FIXO;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = estado.graficos.cor;
    trilhaArredondada(ctx, caixa, raio);
    ctx.fill();
    ctx.restore();

    ctx.save();
    const dentro: Caixa = { x: caixa.x + borda, y: caixa.y + borda, w: caixa.w - 2 * borda, h: caixa.h - 2 * borda };
    trilhaArredondada(ctx, dentro, Math.max(0, raio - borda));
    ctx.clip();
    this.desenharCamera(e, dentro, estado);
    ctx.restore();
  }

  // ── Miúdos ───────────────────────────────────────────────────────────────

  private aviso(frase: string, caixa: Caixa, cor: string) {
    const { ctx } = this;
    ctx.font = fonteDoPalco(Math.min(1.6 * umCqw, caixa.h * 0.12));
    ctx.fillStyle = cor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(frase, caixa.x + caixa.w / 2, caixa.y + caixa.h / 2);
    ctx.textAlign = 'left';
  }

  /** A imagem do cache, ou null enquanto carrega. Os URLs vêm da biblioteca da conta (object URLs). */
  private imagem(url: string): HTMLImageElement | null {
    let guardada = this.imagens.get(url);
    if (!guardada) {
      const img = new Image();
      const nova = { img, pronta: false, falhou: false };
      guardada = nova;
      this.imagens.set(url, nova);
      img.onload = () => {
        nova.pronta = true;
      };
      // Sem o aviso, um fundo ou um logo que não carregou só faltava no ar, sem dizer por quê
      img.onerror = () => {
        nova.falhou = true;
        console.warn('O palco não carregou a imagem:', url);
      };
      img.src = url;
    }
    return guardada.pronta && guardada.img.naturalWidth > 0 ? guardada.img : null;
  }

  /** object-fit: cover dentro da caixa. */
  private desenharCapa(img: HTMLImageElement, caixa: Caixa) {
    const { sx, sy, sw, sh } = recorteDeCapa(img.naturalWidth, img.naturalHeight, caixa.w, caixa.h);
    this.ctx.drawImage(img, sx, sy, sw, sh, caixa.x, caixa.y, caixa.w, caixa.h);
  }

  // ── O filtro do croma: a mesma cadeia SVG do StudioPreview ───────────────

  private montarCroma() {
    if (this.svgDoCroma || !this.temFiltro) return;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
    svg.innerHTML =
      `<defs><filter id="${this.idDoCroma}" color-interpolation-filters="sRGB">` +
      `<feColorMatrix type="matrix" in="SourceGraphic" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="chave"/>` +
      `<feColorMatrix type="matrix" in="SourceGraphic" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="corrigida"/>` +
      `<feColorMatrix type="matrix" in="chave" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="alfa"/>` +
      `<feGaussianBlur in="alfa" stdDeviation="0" result="alfaSuave"/>` +
      `<feComposite in="corrigida" in2="alfaSuave" operator="in"/>` +
      `</filter></defs>`;
    document.body.appendChild(svg);
    this.svgDoCroma = svg;
  }

  private ajustarCroma(croma: AjustesDoCroma) {
    if (!this.svgDoCroma) return;
    const chave = JSON.stringify(croma);
    if (chave === this.cromaAplicado) return;
    this.cromaAplicado = chave;
    const matrizes = this.svgDoCroma.querySelectorAll('feColorMatrix');
    matrizes[0]?.setAttribute('values', matrizDaChave(croma));
    matrizes[1]?.setAttribute('values', matrizDoDescarte(croma));
    this.svgDoCroma.querySelector('feGaussianBlur')?.setAttribute('stdDeviation', String(suavizacaoEmPx(croma, LARGURA_DO_PALCO)));
  }
}

/** O play() de um srcObject trocado depressa rejeita com AbortError, que é normal; o resto vai ao console. */
function avisarSeNaoTocou(fonte: string) {
  return (erro: unknown) => {
    if ((erro as { name?: string } | null)?.name !== 'AbortError') console.warn(`O palco não tocou ${fonte}:`, erro);
  };
}

/** Vídeo escondido que toca um MediaStream só para o drawImage ler. */
function videoDeFonte(): HTMLVideoElement {
  const v = document.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.autoplay = true;
  return v;
}

function trilhaArredondada(ctx: CanvasRenderingContext2D, caixa: Caixa, raio: number) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(caixa.x, caixa.y, caixa.w, caixa.h, Math.min(raio, caixa.w / 2, caixa.h / 2));
  else ctx.rect(caixa.x, caixa.y, caixa.w, caixa.h);
}
