import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { ApresentacaoNoPalco, ClipeNoPalco, Comment, Destination, GeometriaDoCard, GraficosDoPalco, Participant, StudioSceneState } from '../types';
import { CENAS, CENA_GRADE, CENA_INICIAL, FONTE_CAMERA, FONTE_TELA, cenaPeloId, layoutUsaCard, lerCardSalvo, precisaDaTela, salvarCard, type Cena } from '../lib/cenas';
import { LOGO_PADRAO, QR_PADRAO, graficosVazios, mudancasNoCorte, normalizarLink, relogioParado, type RelogioDoCronometro } from '../lib/graficos';
import { AJUSTES_PADRAO, dentroDoQuadro, type AjustesDaCamera } from '../lib/camera';
import { useRoteiro } from '../lib/useRoteiro';
import { useListaDaConta } from '../lib/useListaDaConta';
import { EVENTOS_DO_PLAYER, ajustarPlayer, criarPlayer, desenhaATela, situacaoDoClipe, soltarPlayer, tocar, type PlayerDoClipe } from '../lib/playerDoClipe';
import { PALAVRA_DO_CANAL, estadoDoCanal, nomeDaPlataforma } from '../lib/canais';
import { desistirDaTransmissao, pedirTransmissao } from '../lib/transmissao';
import { useTransmissaoDisponivel } from '../lib/useTransmissaoDisponivel';
import { comecarTransmissao, type TransmissaoEmCurso } from '../lib/palco/transmissor';
import type { EstadoDoDestino } from '../server/protocoloDoMotor';
import { formatarTempo, juntar } from '../lib/graficos';
import { salvarBanners, salvarTickers, subscribeBanners, subscribeTickers } from '../lib/dadosDaConta';
import { useMidiaDoEstudio } from '../context/MidiaDoEstudio';
import { getSupabaseBrowserClient } from '../lib/supabase';
import { MalhaDaSala, guardarTokenDaSala, lerOuCriarTokenDaSala, novoTokenDeSala, type PessoaDaSala } from '../lib/sala/malha';
import { PainelConvidados } from './PainelConvidados';
import { SomDe } from './SalaDoConvidado';
import { BarraDoEstudio } from './BarraDoEstudio';
import { PalcoDoPrograma } from './PalcoDoPrograma';
import { CompositorDoPrograma, type SaidaDaFusao } from '../lib/palco/compositor';
import { baixarGravacao, comecarGravacao, type GravacaoEmCurso } from '../lib/palco/gravador';
import { PainelAudio } from './PainelAudio';
import { SecaoDaApresentacao } from './SecaoDaApresentacao';
import { useApresentacao } from '../lib/useApresentacao';
import { CAPTURA_PADRAO, capturaValida, lerCaptura, restricoesDeAudio, restricoesDeVideo, type AjustesDaCaptura } from '../lib/captura';
import { DivisorDeColuna } from './DivisorDeColuna';
import { BotoesDeTransicao, DURACAO_DA_FUSAO, IconesDeCena, type BloqueioDoCorte, type Transicao } from './CenasETransicao';
import { AvisoDoMonitorUnico, MesaDeMonitores, ProximoCorte } from './MonitoresDoEstudio';
import { FERRAMENTA_INICIAL, PainelDoEstudio, type Ferramenta } from './PainelDoEstudio';
import { BandejaDoEstudio } from './BandejaDoEstudio';
import { StudioPreview } from './StudioPreview';
import { VirtualizedChat } from './VirtualizedChat';
import { PainelGraficos, type EscolhaDosGraficos } from './PainelGraficos';
import { PainelRoteiro } from './PainelRoteiro';
import { PainelQrCode, type QrDoEstudio } from './PainelQrCode';
import { PainelMidia } from './PainelMidia';
import { PainelCamera } from './PainelCamera';
import { PainelPreparo } from './PainelPreparo';
import {
  ControlesDaJanela,
  JanelaDoTeleprompter,
  LeitorDoRoteiro,
  TAMANHO_NA_JANELA,
  TELEPROMPTER_INICIAL,
  abrirJanelaDoTeleprompter,
  type EstadoDoTeleprompter,
  type JanelaAberta,
} from './Teleprompter';
import { useToast } from './ui/Toast';
import { useConfirm } from './ui/ConfirmDialog';

/** Uma preferência do estúdio guardada neste navegador (posições, velocidades, ajustes da câmera). */
function usePreferencia<T>(chave: string, inicial: T, aoLer: (salvo: T) => T = (v) => v) {
  const [valor, setValor] = useState<T>(() => {
    try {
      const salvo = localStorage.getItem(chave);
      return salvo ? aoLer({ ...inicial, ...JSON.parse(salvo) }) : inicial;
    } catch {
      return inicial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch {
      // Sem armazenamento, a preferência volta ao padrão na próxima visita
    }
  }, [chave, valor]);
  return [valor, setValor] as const;
}

const ESCOLHA_INICIAL: EscolhaDosGraficos = {
  bannerId: null,
  bannerPosicao: 'embaixo',
  tickerId: null,
  tickerVelocidade: 'normal',
  tickerDirecao: 'esquerda',
  logo: { ...LOGO_PADRAO },
  cronometro: { noPreview: false, titulo: '' },
};

// As larguras das colunas do console no desktop, em px. O máximo também é
// limitado pela janela (tetoNaJanela: 22vw e 36vw), para os monitores nunca
// ficarem sem espaço; o padrão é o de antes do divisor (14rem e 23rem).
const COLUNAS = {
  cenas: { minimo: 192, maximo: 320, padrao: 224, tetoNaJanela: 0.22 },
  painel: { minimo: 304, maximo: 520, padrao: 368, tetoNaJanela: 0.36 },
} as const;

interface Colunas {
  painel: number;
  painelRecolhido: boolean;
}
const COLUNAS_INICIAIS: Colunas = { painel: COLUNAS.painel.padrao, painelRecolhido: false };
const entre = (valor: unknown, { minimo, maximo, padrao }: { minimo: number; maximo: number; padrao: number; tetoNaJanela: number }) =>
  typeof valor === 'number' && Number.isFinite(valor) ? Math.min(maximo, Math.max(minimo, Math.round(valor))) : padrao;

const QR_INICIAL: QrDoEstudio = { link: '', titulo: '', preco: '', ...QR_PADRAO, noPreview: false };

interface EstudioProps {
  /** A conta: a mídia, o QR code, os banners e os tickers do estúdio são dela. */
  usuario: { uid: string; name?: string };
  /** Pessoas na tela no máximo, contando quem opera (plans.participantes). */
  limiteDePessoas: number;
  /** O webinar pelo qual se entrou no estúdio, quando houver. O roteiro é dele. */
  webinar?: { id: string; title: string };
  canais: Destination[];
  onCanais: () => void;
  onSair: () => void;
  /** O chat mora no app: sobrevive às idas e voltas do estúdio. */
  comentarios: Comment[];
  onComentar: (texto: string) => void;
  onAprovarComentario: (id: string) => void;
  onLimparChat: () => void;
  moderacaoLigada: boolean;
  /** A cor dos gráficos, guardada na conta com as outras preferências de transmissão. */
  cor: string;
  onCor: (cor: string) => void;
}

/**
 * O estúdio: cenas e transição, programa e preview, chat e ferramentas, e a
 * bandeja. Ele é dono do que o console monta. O preview é o estado em
 * edição; o programa, o do último corte. O preview é desenhado em HTML pelo
 * StudioPreview; o programa, no canvas do compositor (lib/palco), que é o
 * vídeo gravado. Os dois partem de um StudioSceneState, com as mesmas medidas.
 *
 * Morava no App, com cerca de setenta estados, e o LeftSidebar recebia 160
 * props, parte delas de abas que nenhum caminho abria mais.
 */
export function Estudio({
  usuario,
  limiteDePessoas,
  webinar,
  canais,
  onCanais,
  onSair,
  comentarios,
  onComentar,
  onAprovarComentario,
  onLimparChat,
  moderacaoLigada,
  cor,
  onCor,
}: EstudioProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const midia = useMidiaDoEstudio();

  // ── Fontes: a câmera de quem opera e a tela compartilhada ─────────────────
  const nome = usuario.name?.trim().split(/\s+/)[0] || 'Apresentador';
// ── A sala de convidados: a chamada em volta do programa ─────────────────
  // O link é o segredo, como no Meet; a malha (lib/sala) conecta navegador a
  // navegador, e quem está na sala mora neste estado, para o painel, as cenas
  // e o compositor. Os efeitos que ligam a câmera e a tela à malha ficam mais
  // abaixo, depois de a captura existir.
  const [tokenDaSala, setTokenDaSala] = useState(() => lerOuCriarTokenDaSala(usuario.uid));
  const [pessoasDaSala, setPessoasDaSala] = useState<PessoaDaSala[]>([]);
  const [salaConectada, setSalaConectada] = useState(false);
  const criarMalha = (token: string) =>
    new MalhaDaSala(getSupabaseBrowserClient(), token, crypto.randomUUID(), {
      nome,
      anfitriao: true,
      aoMudar: (estado) => {
        // Outro anfitrião (uma segunda aba desta conta) não é convidado
        setPessoasDaSala(estado.pessoas.filter((p) => !p.anfitriao));
        setSalaConectada(estado.conectada);
      },
    });
  const [malha, setMalha] = useState(() => criarMalha(tokenDaSala));
  const novoLinkDaSala = () => {
    const token = novoTokenDeSala();
    guardarTokenDaSala(usuario.uid, token);
    setTokenDaSala(token);
    setPessoasDaSala([]);
    setMalha(criarMalha(token)); // o efeito sai da malha antiga e entra na nova
  };
  const linkDaSala = `${window.location.origin}/sala/${tokenDaSala}`;
  /** Quem está no palco entra nas cenas com convidados (a Grade); sair da sala tira do palco. */
  const [convidadosNoPalco, setConvidadosNoPalco] = useState<string[]>([]);
  useEffect(() => {
    setConvidadosNoPalco((atuais) => atuais.filter((id) => pessoasDaSala.some((p) => p.id === id)));
  }, [pessoasDaSala]);

  const participantes: Participant[] = useMemo(
    () => [
      { id: FONTE_CAMERA, name: nome, avatarUrl: '', isLocal: true, isActive: true, hasVideo: true, hasAudio: true },
      { id: FONTE_TELA, name: 'Tela compartilhada', avatarUrl: '', isLocal: false, isScreenShare: true, isActive: true, hasVideo: true, hasAudio: false },
      ...pessoasDaSala.map((p) => ({
        id: `g-${p.id}`,
        name: p.nome,
        avatarUrl: '',
        isLocal: false,
        isActive: true,
        hasVideo: !p.semVideo,
        hasAudio: !p.mudo,
        stream: p.camera,
      })),
    ],
    [nome, pessoasDaSala],
  );

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [mudo, setMudo] = useState(false);
  const [cameraDesligada, setCameraDesligada] = useState(false);
  const [captura, setCaptura] = usePreferencia<AjustesDaCaptura>('pw_captura_do_estudio', CAPTURA_PADRAO, capturaValida);
  // Um pedido aos aparelhos de cada vez: trocar de microfone no meio de um
  // ajuste de som deixava duas trilhas abertas, e o stream com a trilha parada
  const [aplicandoCaptura, setAplicandoCaptura] = useState(false);
  const aplicandoRef = useRef(false);
  // A trilha de áudio é trocada dentro do mesmo stream (a câmera não pisca);
  // isto refaz a leitura das trilhas e o medidor da bandeja
  const [versaoDoAudio, setVersaoDoAudio] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const telaRef = useRef<MediaStream | null>(null);
  streamRef.current = localStream;
  telaRef.current = screenStream;
  // Um pedido que volta depois de sair do estúdio fecha o que abriu, em vez de
  // deixar o microfone ligado no Painel
  const noEstudioRef = useRef(false);

  // Câmera e microfone só no estúdio: pedidos ao entrar, desligados ao sair.
  //
  // Um pedido só por entrada no estúdio. O StrictMode desmonta e remonta na
  // hora, e antes cada montagem abria o seu pedido: encerrar o primeiro
  // derrubava a captura do aparelho que o segundo tinha herdado, e a câmera
  // chegava com a trilha já terminada (ended, sem nenhum stop nela). Agora a
  // desmontagem só AGENDA o encerramento; uma remontagem logo em seguida o
  // cancela e segue com o mesmo pedido, e só a saída de verdade fecha tudo.
  const pedidoDaCaptura = useRef<Promise<MediaStream | null> | null>(null);
  const encerramento = useRef<number | null>(null);
  useEffect(() => {
    noEstudioRef.current = true;
    if (encerramento.current !== null) {
      window.clearTimeout(encerramento.current);
      encerramento.current = null;
    }
    let desta = true;
    pedidoDaCaptura.current ??=
      navigator.mediaDevices?.getUserMedia({ video: restricoesDeVideo(captura), audio: restricoesDeAudio(captura) }).catch((err) => {
        console.warn('Câmera e microfone não liberados:', err);
        return null;
      }) ?? Promise.resolve(null);
    void pedidoDaCaptura.current.then((stream) => {
      if (desta && stream) setLocalStream(stream);
    });
    return () => {
      desta = false;
      noEstudioRef.current = false;
      encerramento.current = window.setTimeout(() => {
        encerramento.current = null;
        const pedido = pedidoDaCaptura.current;
        pedidoDaCaptura.current = null;
        // O pedido pode ainda não ter voltado: o que ele abrir é fechado ao chegar
        void pedido?.then((stream) => stream?.getTracks().forEach((t) => t.stop()));
        streamRef.current?.getTracks().forEach((t) => t.stop());
        telaRef.current?.getTracks().forEach((t) => t.stop());
      }, 0);
    };
  }, []);

  // Mudo e câmera desligada valem em qualquer trilha, inclusive a que chega
  // depois de um pedido em andamento: com o valor do clique, uma trilha nova
  // podia entrar ligada com a bandeja dizendo "Microfone mudo"
  useEffect(() => {
    localStream?.getAudioTracks().forEach((t) => (t.enabled = !mudo));
    localStream?.getVideoTracks().forEach((t) => (t.enabled = !cameraDesligada));
  }, [localStream, mudo, cameraDesligada, versaoDoAudio]);

  const alternarMicrofone = () => {
    const proximo = !mudo;
    localStream?.getAudioTracks().forEach((t) => (t.enabled = !proximo));
    setMudo(proximo);
  };

  const alternarCamera = () => {
    const proxima = !cameraDesligada;
    localStream?.getVideoTracks().forEach((t) => (t.enabled = !proxima));
    setCameraDesligada(proxima);
  };

  /** O pedido acabou num estúdio que já fechou, ou noutro stream: o que ele abriu é fechado. */
  const pedidoVencido = (stream: MediaStream | null, abertos: MediaStream | null) => {
    if (noEstudioRef.current && streamRef.current === stream) return false;
    abertos?.getTracks().forEach((t) => t.stop());
    return true;
  };

  const comecarPedido = () => {
    if (aplicandoRef.current) return false;
    aplicandoRef.current = true;
    setAplicandoCaptura(true);
    return true;
  };
  const acabarPedido = () => {
    aplicandoRef.current = false;
    setAplicandoCaptura(false);
    setVersaoDoAudio((n) => n + 1);
  };

  // O aparelho que a trilha usa de verdade, e não o último pedido: um pedido
  // que falhou não muda o aparelho em uso
  const aparelhoDe = (trilha: MediaStreamTrack | undefined) => trilha?.getSettings().deviceId || undefined;

  // Trocar de aparelho pede um stream novo só com o que mudou e troca a trilha
  const escolherAparelho = async (tipo: 'audio' | 'video', deviceId: string) => {
    const stream = streamRef.current;
    if (!comecarPedido()) return;
    let novo: MediaStream | null = null;
    try {
      novo = await navigator.mediaDevices.getUserMedia({
        video: restricoesDeVideo(captura, tipo === 'video' ? deviceId : aparelhoDe(stream?.getVideoTracks()[0])),
        audio: restricoesDeAudio(captura, tipo === 'audio' ? deviceId : aparelhoDe(stream?.getAudioTracks()[0])),
      });
      if (pedidoVencido(stream, novo)) return;
      stream?.getTracks().forEach((t) => t.stop());
      setLocalStream(novo);
    } catch (err) {
      console.warn('Não foi possível trocar de aparelho:', err);
      toast.info('O aparelho não respondeu', 'Confira se ele está ligado e se outro programa não o está usando.');
    } finally {
      acabarPedido();
    }
  };

  // A qualidade da câmera muda a trilha de vídeo que já existe
  // (applyConstraints). O processamento do som não muda numa trilha aberta em
  // todo navegador, então a trilha de áudio é trocada por uma nova, no mesmo
  // stream: os monitores seguem com o mesmo vídeo, sem piscar.
  const mudarCaptura = async (proxima: AjustesDaCaptura) => {
    const stream = streamRef.current;
    const anterior = captura;
    if (!stream) {
      setCaptura(proxima);
      return;
    }
    if (!comecarPedido()) return;
    setCaptura(proxima);
    try {
      const video = stream.getVideoTracks()[0];
      if (video && (proxima.resolucao !== anterior.resolucao || proxima.quadros !== anterior.quadros)) {
        await video.applyConstraints(restricoesDeVideo(proxima, aparelhoDe(video)));
      }
      const somMudou =
        proxima.reducaoDeRuido !== anterior.reducaoDeRuido ||
        proxima.cancelamentoDeEco !== anterior.cancelamentoDeEco ||
        proxima.ganhoAutomatico !== anterior.ganhoAutomatico;
      const audioAntigo = stream.getAudioTracks()[0];
      if (!somMudou || !audioAntigo || pedidoVencido(stream, null)) return;

      // A trilha velha fecha antes: com ela aberta, o Chrome dá à nova o
      // processamento da captura que já existe, e o pedido não vale
      const microfone = aparelhoDe(audioAntigo);
      audioAntigo.stop();
      stream.removeTrack(audioAntigo);
      const pedir = (ajustes: AjustesDaCaptura) =>
        navigator.mediaDevices.getUserMedia({ audio: restricoesDeAudio(ajustes, microfone) }).catch(() => null);
      let som = await pedir(proxima);
      // O pedido novo falhou: o microfone volta como estava, em vez de ficar mudo
      const voltou = !som;
      if (!som) {
        setCaptura(anterior);
        som = await pedir(anterior);
      }
      if (pedidoVencido(stream, som)) return;
      if (!som) {
        toast.info('O microfone parou', 'Ele não voltou depois do ajuste. Escolha o microfone de novo na bandeja ou saia e entre no estúdio.');
        return;
      }
      som.getAudioTracks().forEach((t) => stream.addTrack(t));
      if (voltou) toast.info('O microfone não aceitou o ajuste', 'Ele voltou como estava.');
    } catch (err) {
      console.warn('A câmera ou o microfone não aceitou o ajuste:', err);
      toast.info('O aparelho não aceitou o ajuste', 'O painel mostra o que ele está entregando agora.');
    } finally {
      acabarPedido();
    }
  };
  const leitura = lerCaptura(localStream);

  // A malha vive com o estúdio; a câmera, a tela e o estado (mudo, sem vídeo) a seguem
  useEffect(() => {
    malha.entrar();
    return () => malha.sair();
  }, [malha]);
  useEffect(() => malha.setCamera(localStream), [malha, localStream, versaoDoAudio]);
  useEffect(() => malha.setTela(screenStream), [malha, screenStream]);
  useEffect(() => malha.setEstado({ mudo, semVideo: cameraDesligada }), [malha, mudo, cameraDesligada]);

  // ── Cenas, preview e programa ─────────────────────────────────────────────
  const [idDaCena, setIdDaCena] = useState(CENA_INICIAL.id);
  const cena = cenaPeloId(idDaCena) ?? CENA_INICIAL;
  const escolherCena = (c: Cena) => setIdDaCena(c.id);
  // A Grade sem ninguém no palco não é cena: volta para a câmera
  useEffect(() => {
    if (idDaCena === CENA_GRADE.id && convidadosNoPalco.length === 0) setIdDaCena(CENA_INICIAL.id);
  }, [idDaCena, convidadosNoPalco]);
  /** As cenas desta sessão: as seis de sempre e, com convidado no palco, a Grade. */
  const cenasDoEstudio = convidadosNoPalco.length > 0 ? [...CENAS, CENA_GRADE] : CENAS;
  const porNoPalco = (id: string, entra: boolean) => {
    setConvidadosNoPalco((atuais) => (entra ? [...atuais.filter((x) => x !== id), id] : atuais.filter((x) => x !== id)));
    // O convidado entra no preview, pronto para o corte — como a tela compartilhada
    if (entra && cena.id !== CENA_GRADE.id) escolherCena(CENA_GRADE);
  };

  const [cardDaCamera, setCardDaCamera] = useState<GeometriaDoCard>(lerCardSalvo);
  useEffect(() => salvarCard(cardDaCamera), [cardDaCamera]);

  const [ajustes, setAjustes] = usePreferencia<AjustesDaCamera>('pw_ajustes_da_camera', AJUSTES_PADRAO, (a) =>
    dentroDoQuadro({ ...a, croma: { ...AJUSTES_PADRAO.croma, ...a.croma } }),
  );
  const [escolha, setEscolha] = usePreferencia<EscolhaDosGraficos>('pw_graficos_do_estudio', ESCOLHA_INICIAL, (e) => ({
    ...e,
    // O que estava no preview não volta sozinho: cada visita começa sem gráficos
    bannerId: null,
    tickerId: null,
    cronometro: { ...e.cronometro, noPreview: false },
  }));
  // O QR code é da conta, como a mídia: outra conta no mesmo navegador não vê o link nem o preço
  const [qr, setQr] = usePreferencia<QrDoEstudio>(`pw_qr_do_estudio_${usuario.uid}`, QR_INICIAL, (q) => ({ ...q, noPreview: false }));
  const [clipeNoPreview, setClipeNoPreview] = useState<ClipeNoPalco | null>(null);
  const apresentacao = useApresentacao();
  const [apresentacaoNoPreview, setApresentacaoNoPreview] = useState<ApresentacaoNoPalco | null>(null);
  const [comentarioFixado, setComentarioFixado] = useState<Comment | null>(null);
  const [relogio, setRelogio] = useState<RelogioDoCronometro>(() => relogioParado(300));

  // Quando o cronômetro chega a zero, ele para em 0:00
  useEffect(() => {
    if (relogio.fimEm === null) return;
    const falta = relogio.fimEm - Date.now();
    const id = window.setTimeout(() => setRelogio((r) => ({ ...r, fimEm: null, restante: 0 })), Math.max(0, falta));
    return () => window.clearTimeout(id);
  }, [relogio.fimEm]);

  // Banners e tickers da conta, salvos com a confirmação do banco
  const banners = useListaDaConta(usuario.uid, subscribeBanners, salvarBanners);
  const tickers = useListaDaConta(usuario.uid, subscribeTickers, salvarTickers);

  // O que o preview mostra: o conteúdo das escolhas. O id vai junto só para
  // os painéis dizerem onde cada item está
  const graficosDoPreview: GraficosDoPalco = useMemo(() => {
    const banner = escolha.bannerId ? banners.itens.find((b) => b.id === escolha.bannerId) : undefined;
    const ticker = escolha.tickerId ? tickers.itens.find((t) => t.id === escolha.tickerId) : undefined;
    const link = normalizarLink(qr.link);
    return {
      cor,
      logo: midia.ativas.logo ? { url: midia.ativas.logo, ...escolha.logo } : null,
      banner: banner ? { id: banner.id, titulo: banner.text, subtitulo: banner.subtitle ?? '', posicao: escolha.bannerPosicao } : null,
      ticker: ticker
        ? { id: ticker.id, texto: ticker.text, selo: ticker.badgeText ?? '', velocidade: escolha.tickerVelocidade, direcao: escolha.tickerDirecao }
        : null,
      qr: qr.noPreview && link ? { url: link, titulo: qr.titulo.trim(), preco: qr.preco.trim(), canto: qr.canto, tamanho: qr.tamanho } : null,
      cronometro: escolha.cronometro.noPreview ? { titulo: escolha.cronometro.titulo.trim() } : null,
    };
  }, [cor, midia.ativas.logo, escolha, banners.itens, tickers.itens, qr]);

  const estadoDoPreview: StudioSceneState = {
    sceneId: cena.id,
    layout: cena.layout,
    activeParticipantIds: cena.id === CENA_GRADE.id ? [FONTE_CAMERA, ...convidadosNoPalco.map((id) => `g-${id}`)] : cena.fontes,
    cardDaCamera,
    activeBackground: midia.ativas.fundo,
    activeOverlay: midia.ativas.sobreposicao,
    pinnedComment: comentarioFixado,
    graficos: graficosDoPreview,
    clipe: clipeNoPreview,
    apresentacao: apresentacaoNoPreview,
  };

  // O programa começa na cena inicial, sem gráficos: o que o preview já traz entra pelo corte
  const [programa, setPrograma] = useState<StudioSceneState>(() => ({
    sceneId: CENA_INICIAL.id,
    layout: CENA_INICIAL.layout,
    activeParticipantIds: CENA_INICIAL.fontes,
    cardDaCamera,
    activeBackground: '',
    activeOverlay: '',
    pinnedComment: null,
    graficos: graficosVazios(cor),
    clipe: null,
    apresentacao: null,
  }));
  // O clipe do programa toca num player só (lib/playerDoClipe). Na fusão, o
  // compositor dissolve o programa que sai, desenhando-o pelo player dele.
  const [player, setPlayer] = useState<PlayerDoClipe | null>(null);
  const playerRef = useRef<PlayerDoClipe | null>(null);
  playerRef.current = player;
  const [programaQueSai, setProgramaQueSai] = useState<SaidaDaFusao | null>(null);
  // Tocar, pausar, chegar ao fim e o navegador recusar mudam o que a Mídia diz do clipe
  const [, setMudancasDoPlayer] = useState(0);
  useEffect(() => {
    if (!player) return;
    const mudou = () => setMudancasDoPlayer((n) => n + 1);
    EVENTOS_DO_PLAYER.forEach((evento) => player.video.addEventListener(evento, mudou));
    return () => EVENTOS_DO_PLAYER.forEach((evento) => player.video.removeEventListener(evento, mudou));
  }, [player]);
  const mudancas = mudancasNoCorte(programa, estadoDoPreview);
  const temMudanca = mudancas.length > 0;
  // O clipe ou a apresentação no preview ocupam o lugar da tela: com um deles, a cena com tela tem o que mostrar
  const temTela = !!screenStream || !!clipeNoPreview || !!apresentacaoNoPreview;
  // Uma cena com tela e nada no lugar dela não vai ao programa: iria uma moldura vazia
  const faltaATela = precisaDaTela(cena) && !temTela;
  // Com o preview igual ao programa, um monitor só; a mesa de corte volta
  // quando há o que cortar, ou fica sempre, na visão de quem produz
  const [monitores, setMonitores] = usePreferencia('pw_monitores_do_estudio', { sempreDois: false }, (m) => ({
    sempreDois: m.sempreDois === true,
  }));
  // Durante a fusão os dois ficam: a mesa não muda de tamanho no meio da dissolução
  const monitorUnico = !temMudanca && programaQueSai === null && !monitores.sempreDois;

  // Corte: o preview vai ao programa na hora. Fusão: o programa que sai fica
  // por cima e some em DURACAO_DA_FUSAO.
  const fusaoRef = useRef<number | null>(null);
  const saindoRef = useRef<PlayerDoClipe | null>(null);

  // Ao sair do estúdio, o clipe para e os arquivos são soltos
  useEffect(
    () => () => {
      if (fusaoRef.current) window.clearTimeout(fusaoRef.current);
      if (saindoRef.current) soltarPlayer(saindoRef.current);
      if (playerRef.current) soltarPlayer(playerRef.current);
    },
    [],
  );

  const cortar = (transicao: Transicao) => {
    if (faltaATela) return;
    if (fusaoRef.current) window.clearTimeout(fusaoRef.current);
    // Um player que ainda saía de uma fusão anterior já pode ser solto
    if (saindoRef.current && saindoRef.current !== playerRef.current) soltarPlayer(saindoRef.current);
    saindoRef.current = null;

    const entra = estadoDoPreview;
    const atual = playerRef.current;
    // O mesmo clipe segue no mesmo player, de onde está; outro clipe começa do zero num player novo
    const proximo = entra.clipe ? (atual?.id === entra.clipe.id ? atual : criarPlayer(entra.clipe)) : null;
    const sai = atual && atual !== proximo ? atual : null;
    if (proximo) ajustarPlayer(proximo, entra);
    if (sai) sai.video.pause();

    if (transicao === 'fusao') {
      setProgramaQueSai({ estado: programa, player: atual, inicioEm: performance.now() });
      saindoRef.current = sai;
      fusaoRef.current = window.setTimeout(() => {
        setProgramaQueSai(null);
        fusaoRef.current = null;
        if (saindoRef.current) soltarPlayer(saindoRef.current);
        saindoRef.current = null;
      }, DURACAO_DA_FUSAO);
    } else {
      setProgramaQueSai(null);
      if (sai) soltarPlayer(sai);
    }
    setPlayer(proximo);
    setPrograma(entra);
  };

  // ── Tela compartilhada ────────────────────────────────────────────────────
  const cenaDoPreviewRef = useRef(cena);
  cenaDoPreviewRef.current = cena;
  // O clipe ou a apresentação no lugar da tela: com um deles, a cena com tela continua tendo o que mostrar
  const substitutoRef = useRef(!!clipeNoPreview || !!apresentacaoNoPreview);
  substitutoRef.current = !!clipeNoPreview || !!apresentacaoNoPreview;

  // Parar a tela pela bandeja ou pelo "Parar compartilhamento" do navegador.
  // Se o preview dependia dela (e não há um clipe no lugar), volta para a câmera.
  const pararTela = () => {
    telaRef.current?.getTracks().forEach((t) => t.stop());
    setScreenStream(null);
    if (precisaDaTela(cenaDoPreviewRef.current) && !substitutoRef.current) escolherCena(CENA_INICIAL);
  };

  const alternarTela = async () => {
    if (screenStream) {
      pararTela();
      return;
    }
    // Cancelar o seletor do navegador não muda nada
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).catch(() => null);
    if (!stream) return;
    setScreenStream(stream);
    stream.getVideoTracks()[0]?.addEventListener('ended', pararTela);
    // A tela entra no preview, pronta para o corte. Se o preview já tem uma
    // cena com tela (a que esperava por ela), fica a que foi escolhida
    if (precisaDaTela(cenaDoPreviewRef.current)) return;
    const comTela = cenaPeloId('cena-tela-e-camera');
    if (comTela) escolherCena(comTela);
  };

  // Um clipe ou a apresentação entra no lugar da tela, um de cada vez: se a
  // cena do preview não usa a tela, vai para a cena Tela
  const irParaUmaCenaComTela = () => {
    if (precisaDaTela(cena)) return;
    const soTela = cenaPeloId('cena-tela');
    if (soTela) escolherCena(soTela);
  };
  const porClipe = (clipe: ClipeNoPalco | null) => {
    setClipeNoPreview(clipe);
    if (!clipe) return;
    setApresentacaoNoPreview(null);
    irParaUmaCenaComTela();
  };
  const porApresentacao = (entra: boolean) => {
    const aberta = apresentacao.aberta;
    if (!entra || !aberta) {
      setApresentacaoNoPreview(null);
      return;
    }
    setApresentacaoNoPreview({ id: aberta.id, nome: aberta.nome });
    setClipeNoPreview(null);
    irParaUmaCenaComTela();
  };

  const bloqueio: BloqueioDoCorte | null = faltaATela
    ? {
        motivo: `A cena “${cena.nome}” precisa da tela compartilhada, e nenhuma tela está chegando.`,
        acao: navigator.mediaDevices?.getDisplayMedia
          ? { rotulo: 'Compartilhar tela', onClick: () => void alternarTela() }
          : { rotulo: 'Voltar à câmera', onClick: () => escolherCena(CENA_INICIAL) },
      }
    : null;

  // ── Roteiro e teleprompter ────────────────────────────────────────────────
  const roteiro = useRoteiro(webinar?.id ?? 'geral');
  // A velocidade, o tamanho e o espelho ficam guardados; tocar e a janela começam desligados
  const [preferencias, setPreferencias] = usePreferencia('pw_teleprompter', {
    velocidade: TELEPROMPTER_INICIAL.velocidade,
    tamanho: TELEPROMPTER_INICIAL.tamanho,
    espelhar: TELEPROMPTER_INICIAL.espelhar,
  });
  const [teleprompter, setTeleprompter] = useState<EstadoDoTeleprompter>(() => ({ ...TELEPROMPTER_INICIAL, ...preferencias }));
  useEffect(
    () => setPreferencias({ velocidade: teleprompter.velocidade, tamanho: teleprompter.tamanho, espelhar: teleprompter.espelhar }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teleprompter.velocidade, teleprompter.tamanho, teleprompter.espelhar],
  );
  const progresso = useRef(0);

  // A janela do teleprompter é pedida no clique (o navegador só abre janelas
  // dentro do gesto) e fechada ao sair do estúdio
  const [janelaAberta, setJanelaAberta] = useState<JanelaAberta | null>(null);
  const janelaRef = useRef<JanelaAberta | null>(null);
  janelaRef.current = janelaAberta;
  useEffect(() => () => janelaRef.current?.janela.close(), []);

  const abrirJanela = async () => {
    const aberta = await abrirJanelaDoTeleprompter();
    if (!aberta) {
      toast.info('A janela do teleprompter não abriu', 'O navegador bloqueou a janela. Permita janelas deste site e tente de novo.');
      return;
    }
    setJanelaAberta(aberta);
    setTeleprompter((t) => ({ ...t, janela: true }));
  };
  const janelaFechada = () => {
    setJanelaAberta(null);
    setTeleprompter((t) => ({ ...t, janela: false, tocando: false }));
  };
  const fecharJanela = () => {
    janelaRef.current?.janela.close();
    janelaFechada();
  };

  // ── O painel da ferramenta aberta ─────────────────────────────────────────
  const [ferramenta, setFerramenta] = useState<Ferramenta>(FERRAMENTA_INICIAL);
  const [mostrarGuias, setMostrarGuias] = useState(false);

  // ── O programa em vídeo (lib/palco) ───────────────────────────────────────
  // O canvas do compositor É o monitor de programa: o que o operador vê é o
  // que a gravação baixa e a transmissão enviará. Nasce passivo e liga no
  // efeito, porque o StrictMode cria e descarta uma instância a mais.
  const [compositor] = useState(() => new CompositorDoPrograma());

  // ── A gravação local: o vídeo composto num arquivo baixado ───────────────
  const [gravacao, setGravacao] = useState<GravacaoEmCurso | null>(null);
  const gravacaoRef = useRef<GravacaoEmCurso | null>(null);
  gravacaoRef.current = gravacao;
  const baixar = (arquivo: Blob) => {
    try {
      return baixarGravacao(arquivo);
    } catch (erro) {
      console.error('O download da gravação falhou:', erro);
      return null;
    }
  };
  const pararEGuardar = async () => {
    const atual = gravacaoRef.current;
    if (!atual) return;
    // O ref zera já: sair do estúdio logo depois não pede um segundo arquivo
    gravacaoRef.current = null;
    setGravacao(null);
    const arquivo = await atual.parar();
    if (!arquivo) {
      toast.error('Nada foi gravado', 'O navegador não entregou nenhum trecho do programa. Grave de novo.');
      return;
    }
    // O app não sabe se o download terminou (o navegador pode perguntar onde
    // salvar): diz que começou e deixa baixar de novo enquanto o aviso está aberto
    const deNovo = { label: 'Baixar de novo', onClick: () => void baixar(arquivo) };
    const nome = baixar(arquivo);
    if (nome) toast.info('Gravação pronta', `O download de ${nome} começou.`, deNovo);
    else toast.error('O download não começou', 'O navegador não baixou a gravação.', deNovo);
  };
  const comecando = useRef(false);
  const alternarGravacao = async () => {
    if (gravacaoRef.current) {
      void pararEGuardar();
      return;
    }
    if (!compositor.stream || comecando.current) return;
    comecando.current = true;
    try {
      // O clique é o gesto que libera o som; sem ele, grava só a imagem e diz isso
      const comSom = await compositor.prepararSom();
      if (!compositor.stream) return;
      const nova = comecarGravacao(compositor.stream, {
        comSom,
        aoParar: (erro) => {
          if (gravacaoRef.current !== nova) return;
          console.error('A gravação parou sozinha:', erro);
          toast.error('A gravação parou', 'O navegador interrompeu a gravação. O que foi gravado até aqui vai ser baixado.');
          void pararEGuardar();
        },
      });
      gravacaoRef.current = nova;
      setGravacao(nova);
      if (!comSom) toast.info('Gravando sem som', 'O navegador não liberou o áudio. A imagem do programa está sendo gravada.');
    } catch (erro) {
      console.error('A gravação não começou:', erro);
      toast.error('A gravação não começou', 'Este navegador não conseguiu gravar o programa. Tente no Chrome ou no Edge atualizados.');
    } finally {
      comecando.current = false;
    }
  };
  // Uma gravação que não recebe nada há segundos travou: melhor saber agora que no fim da live
  useEffect(() => {
    if (!gravacao) return;
    let avisou = false;
    const id = window.setInterval(() => {
      if (avisou || Date.now() - gravacao.ultimoPedacoEm() < 5000) return;
      avisou = true;
      toast.error('A gravação não está recebendo nada', 'Nenhum trecho chega ao arquivo há alguns segundos. Pare e grave de novo.');
    }, 2000);
    return () => window.clearInterval(id);
  }, [gravacao, toast]);
  // Fechar ou recarregar a aba gravando perderia tudo: o navegador pergunta antes
  useEffect(() => {
    if (!gravacao) return;
    const avisar = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
      evento.returnValue = ''; // o Safari e os Chromes antigos só perguntam com isto
    };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [gravacao]);
  // ── A transmissão: o programa vai aos canais ─────────────────────────────
  // Pedir à API (que registra e assina o bilhete), abrir o motor, mandar o
  // vídeo. O estado de cada canal vem do motor e mora aqui para a barra, a
  // bandeja e os avisos; o carmim do ar só acende com um canal de fato no ar.
  interface CanalNoAr { id: string; nome: string; estado: EstadoDoDestino; detalhe?: string }
  const [faseDoAr, setFaseDoAr] = useState<'parada' | 'entrando' | 'no-ar' | 'encerrando'>('parada');
  const [transmissao, setTransmissao] = useState<{ id: string; curso: TransmissaoEmCurso; canais: CanalNoAr[] } | null>(null);
  // O ref é a verdade entre um render e outro: é preenchido antes do setState
  // (um fim que chega nesse meio tempo não pode se perder) e zerado por quem
  // encerra (o setState vem depois e não o repõe)
  const transmissaoRef = useRef<{ id: string; curso: TransmissaoEmCurso; canais: CanalNoAr[] } | null>(null);
  /** O estúdio ainda está montado: uma transmissão que só chegou depois de sair é encerrada na hora. */
  const montadoRef = useRef(true);
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);
  const canaisProntos = canais.filter((d) => d.selected && estadoDoCanal(d) === 'pronto');
  // Sem o motor no servidor, nenhum canal adianta: esse impedimento vem antes
  const transmissaoDisponivel = useTransmissaoDisponivel();
  const impedimento =
    transmissaoDisponivel === false
      ? 'A transmissão para os canais ainda não está configurada neste servidor.'
      : canaisProntos.length === 0
        ? canais.some((d) => d.selected)
          ? 'Falta o servidor ou a chave de um canal ligado. Complete o canal em Canais.'
          : 'Nenhum canal ligado. Ligue um canal com servidor e chave em Canais.'
        : null;
  const canaisNoAr = transmissao?.canais.filter((c) => c.estado === 'no-ar').length ?? 0;
  const canaisQueDesistiram = transmissao?.canais.filter((c) => c.estado === 'falhou').length ?? 0;
  const aoVivo = faseDoAr !== 'parada' && canaisNoAr > 0;

  const entrarAoVivo = async () => {
    if (faseDoAr !== 'parada' || impedimento || !compositor.stream) return;
    const nomes = canaisProntos.map((c) => c.name || nomeDaPlataforma(c.platform));
    const ok = await confirm({
      title: canaisProntos.length === 1 ? `Entrar ao vivo em ${nomes[0]}?` : `Entrar ao vivo em ${canaisProntos.length} canais?`,
      description: `O programa começa a ir para ${juntar(nomes)} assim que o servidor conectar. O que está no preview continua fora do ar até o corte.`,
      confirmLabel: 'Entrar ao vivo',
    });
    if (!ok || faseDoAr !== 'parada') return;
    setFaseDoAr('entrando');
    let autorizada: Awaited<ReturnType<typeof pedirTransmissao>> | null = null;
    try {
      // O clique na confirmação é o gesto que libera o som
      const comSom = await compositor.prepararSom();
      autorizada = await pedirTransmissao(canais, webinar?.title, webinar?.id);
      if (!compositor.stream) throw new Error('O programa não está mais disponível.');
      const registrada = autorizada;
      const curso = await comecarTransmissao({
        stream: compositor.stream,
        comSom,
        motor: autorizada.motor,
        bilhete: autorizada.bilhete,
        destinos: autorizada.destinos,
        aoDestino: (id, estado, detalhe) => {
          const atual = transmissaoRef.current;
          if (atual?.id === registrada.id) {
            atual.canais = atual.canais.map((c) => (c.id === id ? { ...c, estado, detalhe } : c));
            setTransmissao({ ...atual });
          }
          const canal = registrada.destinos.find((d) => d.id === id);
          const outrosNoAr = (atual?.canais ?? []).filter((c) => c.id !== id && c.estado === 'no-ar').length;
          const osOutros = outrosNoAr > 0 ? ' Os outros canais seguem no ar.' : ' Nenhum canal está recebendo a live agora.';
          if (estado === 'falhou') toast.error(`${canal?.nome ?? 'Um canal'} caiu e não voltou`, `${detalhe ?? 'O servidor desistiu desse canal.'}${osOutros}`);
          else if (estado === 'reconectando') toast.info(`${canal?.nome ?? 'Um canal'} caiu`, `O servidor está religando.${osOutros}`);
        },
        aoEncerrar: (motivo, duracaoS) => {
          if (transmissaoRef.current?.id !== registrada.id) return;
          transmissaoRef.current = null;
          setTransmissao(null);
          setFaseDoAr('parada');
          toast.error('A transmissão caiu', `${motivo} Os canais pararam de receber a live${duracaoS ? ` depois de ${formatarTempo(duracaoS)}` : ''}.`);
        },
      });
      if (!montadoRef.current) {
        // A pessoa saiu do estúdio enquanto o motor conectava: a transmissão nasceu órfã e morre aqui
        void curso.parar();
        return;
      }
      transmissaoRef.current = { id: registrada.id, curso, canais: registrada.destinos.map((d) => ({ id: d.id, nome: d.nome, estado: 'conectando' })) };
      setTransmissao(transmissaoRef.current);
      setFaseDoAr('no-ar');
      if (!comSom) toast.info('Entrando no ar sem som', 'O navegador não liberou o áudio. O programa vai aos canais só com a imagem.');
    } catch (erro) {
      console.error('Não deu para entrar ao vivo:', erro);
      // A API já registrou a transmissão: o banco precisa saber que ela não aconteceu
      if (autorizada) void desistirDaTransmissao(autorizada.id, erro instanceof Error ? erro.message : 'A transmissão não começou.');
      if (montadoRef.current) {
        setFaseDoAr('parada');
        toast.error('Não deu para entrar ao vivo', erro instanceof Error ? erro.message : 'Tente de novo.');
      }
    }
  };

  const pararTransmissao = async () => {
    const atual = transmissaoRef.current;
    if (!atual) return;
    transmissaoRef.current = null;
    setFaseDoAr('encerrando');
    const n = atual.canais.filter((c) => c.estado === 'no-ar').length;
    const { confirmado } = await atual.curso.parar();
    setTransmissao(null);
    setFaseDoAr('parada');
    const tempo = formatarTempo(Math.floor((Date.now() - atual.curso.inicioEm) / 1000));
    if (!confirmado) toast.info('Transmissão encerrada', 'O servidor não confirmou o fim; os canais podem levar alguns segundos para parar.');
    else if (n === 0) toast.info('Transmissão encerrada', 'Nenhum canal chegou a receber a live.');
    else toast.success('Transmissão encerrada', `${tempo} no ar em ${n} ${n === 1 ? 'canal' : 'canais'}.`);
  };
  const encerrarTransmissao = async () => {
    if (faseDoAr !== 'no-ar') return;
    const ok = await confirm({
      title: 'Encerrar a transmissão?',
      description: 'Os canais param de receber a live agora. O estúdio continua aberto.',
      confirmLabel: 'Encerrar transmissão',
      destructive: true,
    });
    if (ok) await pararTransmissao();
  };
  // O carmim do ar nos monitores (`[data-air="on"]` no index.css) e a aba que pergunta antes de fechar
  useEffect(() => {
    document.body.dataset.air = aoVivo ? 'on' : 'off';
    return () => {
      delete document.body.dataset.air;
    };
  }, [aoVivo]);
  useEffect(() => {
    if (!transmissao) return;
    const avisar = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
      evento.returnValue = '';
    };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [transmissao]);
  const pararTransmissaoRef = useRef(pararTransmissao);
  pararTransmissaoRef.current = pararTransmissao;

  const fraseDoAr = transmissao
    ? (() => {
        const noAr = transmissao.canais.filter((c) => c.estado === 'no-ar').map((c) => c.nome);
        const outros = transmissao.canais.filter((c) => c.estado !== 'no-ar').map((c) => `${c.nome}: ${PALAVRA_DO_CANAL[c.estado]}`);
        const todosDesistiram = transmissao.canais.every((c) => c.estado === 'falhou');
        return [noAr.length ? `No ar em ${juntar(noAr)}` : todosDesistiram ? 'Nenhum canal no ar' : 'Conectando aos canais', ...outros].join(' · ');
      })()
    : 'Fora do ar: nada está sendo transmitido.';

  // Sair do estúdio gravando ou transmitindo, por qualquer caminho (o botão, a
  // sessão que cai, outra rota), encerra antes de soltar as trilhas que os dois leem
  const pararEGuardarRef = useRef(pararEGuardar);
  pararEGuardarRef.current = pararEGuardar;
  useEffect(() => {
    compositor.iniciar();
    return () => {
      if (gravacaoRef.current) void pararEGuardarRef.current();
      if (transmissaoRef.current) void pararTransmissaoRef.current();
      compositor.soltar();
    };
  }, [compositor]);
  useEffect(() => compositor.setCamera(localStream), [compositor, localStream]);
  useEffect(() => compositor.setTela(screenStream), [compositor, screenStream]);
  // versaoDoAudio: a trilha trocada dentro do mesmo stream (ajustes de som)
  useEffect(() => {
    compositor.setMicrofone(localStream?.getAudioTracks()[0] ?? null);
  }, [compositor, localStream, versaoDoAudio]);
  // Os convidados da sala chegam ao vídeo e à mistura; quem saiu, sai de lá também
  const convidadosNoCompositor = useRef<Set<string>>(new Set());
  useEffect(() => {
    const atuais = new Set(pessoasDaSala.map((p) => `g-${p.id}`));
    for (const antigo of convidadosNoCompositor.current) if (!atuais.has(antigo)) compositor.setConvidado(antigo, null);
    for (const p of pessoasDaSala) compositor.setConvidado(`g-${p.id}`, p.camera);
    convidadosNoCompositor.current = atuais;
  }, [compositor, pessoasDaSala]);

  // A câmera ou o microfone que param no meio (aparelho desligado, outro
  // programa os tomou) param o programa: quem opera fica sabendo na hora.
  // O stop() das trocas de aparelho não dispara `ended`, então não avisa.
  useEffect(() => {
    if (!localStream) return;
    const tirar = localStream.getTracks().map((trilha) => {
      const aoAcabar = () =>
        toast.error(
          trilha.kind === 'video' ? 'A câmera parou' : 'O microfone parou',
          'O aparelho foi desligado ou outro programa o tomou. Escolha o aparelho de novo na bandeja.',
        );
      trilha.addEventListener('ended', aoAcabar);
      return () => trilha.removeEventListener('ended', aoAcabar);
    });
    return () => tirar.forEach((f) => f());
  }, [localStream, versaoDoAudio, toast]);

  const sairDoEstudio = async () => {
    if (faseDoAr === 'entrando') {
      toast.info('A transmissão está começando', 'Espere ela entrar no ar para encerrar e sair.');
      return;
    }
    if (transmissaoRef.current) {
      const ok = await confirm({
        title: 'Encerrar a transmissão e sair?',
        description: 'Os canais param de receber a live agora.',
        confirmLabel: 'Encerrar e sair',
        destructive: true,
      });
      if (!ok) return;
      await pararTransmissao();
    }
    if (gravacaoRef.current) void pararEGuardar();
    onSair();
  };
  const [colunas, setColunas] = usePreferencia<Colunas>('pw_colunas_do_estudio', COLUNAS_INICIAIS, (c) => ({
    painel: entre(c.painel, COLUNAS.painel),
    painelRecolhido: c.painelRecolhido === true,
  }));
  const larguraDasColunas = {
    '--col-painel': colunas.painelRecolhido ? '4.5rem' : `min(${colunas.painel}px, ${COLUNAS.painel.tetoNaJanela * 100}vw)`,
  } as CSSProperties;
  const areaDoEstudioRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const botaoVerPreviewRef = useRef<HTMLButtonElement>(null);
  const botaoVoltarRef = useRef<HTMLButtonElement>(null);
  const [posicaoDosAjustes, setPosicaoDosAjustes] = useState<number | null>(null);

  const rolarAoPreview = () => {
    const area = areaDoEstudioRef.current;
    const preview = previewRef.current;
    if (!area || !preview) return;
    area.scrollTo({
      top: area.scrollTop + preview.getBoundingClientRect().top - area.getBoundingClientRect().top - 8,
      behavior: 'instant',
    });
    botaoVoltarRef.current?.focus({ preventScroll: true });
  };

  const verPreview = () => {
    const area = areaDoEstudioRef.current;
    if (!area || !previewRef.current) return;
    // Num segundo toque a posição guardada é a dos ajustes, não a do preview
    if (posicaoDosAjustes !== null) return rolarAoPreview();
    setPosicaoDosAjustes(area.scrollTop);
  };

  const voltarAosAjustes = () => {
    const area = areaDoEstudioRef.current;
    if (!area || posicaoDosAjustes === null) return;
    area.scrollTo({ top: posicaoDosAjustes, behavior: 'instant' });
    setPosicaoDosAjustes(null);
    requestAnimationFrame(() => botaoVerPreviewRef.current?.focus({ preventScroll: true }));
  };

  useLayoutEffect(() => {
    if (posicaoDosAjustes === null) return;
    const quadro = requestAnimationFrame(rolarAoPreview);
    return () => cancelAnimationFrame(quadro);
  }, [posicaoDosAjustes]);

  const ligados = canais.filter((d) => d.selected);

  const painel = (() => {
    switch (ferramenta) {
      case 'preparar':
        return (
          <PainelPreparo
            camera={leitura.camera}
            cameraDesligada={cameraDesligada}
            onLigarCamera={alternarCamera}
            microfone={leitura.microfone}
            mudo={mudo}
            onLigarMicrofone={alternarMicrofone}
            compartilhando={!!screenStream}
            podeCompartilhar={!!navigator.mediaDevices?.getDisplayMedia}
            onCompartilhar={() => void alternarTela()}
            canaisLigados={ligados.length}
            canaisProntos={canaisProntos.length}
            impedimento={impedimento}
            noAr={faseDoAr !== 'parada'}
            onCanais={onCanais}
            onAbrir={setFerramenta}
          />
        );
      case 'chat':
        return (
          <div className="flex h-[36rem] flex-col p-4 lg:h-full">
            <VirtualizedChat
              comments={comentarios}
              pinnedComment={comentarioFixado}
              onPinComment={(id) => setComentarioFixado(id ? comentarios.find((c) => c.id === id) ?? null : null)}
              onPostComment={onComentar}
              onApproveComment={onAprovarComentario}
              isAiModerationEnabled={moderacaoLigada}
              aiModerationMode="warn"
              onClearComments={() => {
                onLimparChat();
                setComentarioFixado(null);
              }}
              authorName={nome}
            />
          </div>
        );
      case 'graficos':
        return (
          <PainelGraficos
            escolha={escolha}
            onEscolha={setEscolha}
            banners={banners}
            tickers={tickers}
            programa={programa}
            relogio={relogio}
            onRelogio={setRelogio}
            cor={cor}
            onCor={onCor}
          />
        );
      case 'roteiro':
        return (
          <PainelRoteiro
            roteiro={roteiro}
            deQue={webinar ? `do webinar ${webinar.title}` : 'geral'}
            teleprompter={teleprompter}
            onTeleprompter={setTeleprompter}
            progresso={progresso}
            onAbrirJanela={() => void abrirJanela()}
            onFecharJanela={fecharJanela}
          />
        );
      case 'qr':
        return <PainelQrCode qr={qr} onQr={setQr} noPrograma={!!programa.graficos.qr} />;
      case 'midia':
        return (
          <>
          <PainelMidia
            clipeNoPreview={clipeNoPreview}
            clipeNoPrograma={programa.clipe?.id ?? null}
            situacaoNoPrograma={player ? situacaoDoClipe(player, programa) : null}
            telaNoPrograma={desenhaATela(programa)}
            // Tocar de novo o clipe do programa é da fonte, como iniciar o cronômetro: vale na hora.
            // Numa cena sem tela, só volta ao começo: tocar ali seria som sem imagem, e o clipe
            // toca quando a tela voltar
            onTocarNoPrograma={() => {
              if (!player) return;
              if (player.video.ended) player.video.currentTime = 0;
              if (desenhaATela(programa)) tocar(player);
            }}
            onClipe={porClipe}
          />
          <SecaoDaApresentacao
            apresentacao={apresentacao}
            noPreview={!!apresentacaoNoPreview && apresentacaoNoPreview.id === apresentacao.aberta?.id}
            noPrograma={!!programa.apresentacao && programa.apresentacao.id === apresentacao.aberta?.id}
            onPreview={porApresentacao}
          />
          </>
        );
      case 'convidados':
        return (
          <PainelConvidados
            link={linkDaSala}
            onNovoLink={novoLinkDaSala}
            conectada={salaConectada}
            pessoas={pessoasDaSala}
            noPalco={convidadosNoPalco}
            limiteDePessoas={limiteDePessoas}
            onPalco={porNoPalco}
          />
        );
      case 'camera':
        return (
          <PainelCamera
            ajustes={ajustes}
            onAjustes={setAjustes}
            card={cardDaCamera}
            onCard={setCardDaCamera}
            cenaTemCard={layoutUsaCard(cena.layout)}
            captura={captura}
            onCaptura={(proxima) => void mudarCaptura(proxima)}
            camera={leitura.camera}
            aplicando={aplicandoCaptura}
          />
        );
      case 'audio':
        return (
          <PainelAudio
            captura={captura}
            onCaptura={(proxima) => void mudarCaptura(proxima)}
            microfone={leitura.microfone}
            aplicando={aplicandoCaptura}
          />
        );
    }
  })();

  // Só o preview segue em HTML (interativo: o card se arrasta); o programa é o compositor
  const monitor = (estado: StudioSceneState, extra: Partial<Parameters<typeof StudioPreview>[0]> = {}) => (
    <StudioPreview
      estado={estado}
      participantes={participantes}
      localStream={localStream}
      screenStream={screenStream}
      cameraDesligada={cameraDesligada}
      camera={ajustes}
      relogio={relogio}
      mostrarGuias={mostrarGuias}
      playerDoClipe={player}
      paginaDaApresentacao={apresentacao.mostrada}
      {...extra}
    />
  );

  // O que o próximo quadro do vídeo desenha; roda a cada render do estúdio
  useEffect(() => {
    compositor.atualizar({
      programa,
      saindo: programaQueSai,
      nome,
      cameraDesligada,
      camera: ajustes,
      relogio,
      playerDoClipe: player,
      paginaDaApresentacao: apresentacao.mostrada,
      convidados: pessoasDaSala.map((p) => ({ id: `g-${p.id}`, nome: p.nome, semVideo: p.semVideo })),
    });
  });

  return (
    <>
      {/* O retorno da conversa: quem opera ouve os convidados com QUALQUER
          ferramenta aberta — o som não pode morar numa aba */}
      {pessoasDaSala.map((p) => (
        <SomDe key={p.id} stream={p.camera} />
      ))}
      <BarraDoEstudio
        sessao={webinar?.title}
        canaisLigados={ligados.length}
        canaisProntos={canaisProntos.length}
        onCanais={onCanais}
        transmissao={
          faseDoAr === 'no-ar' && transmissao
            ? { fase: 'no-ar', inicioEm: transmissao.curso.inicioEm, canaisNoAr, canaisQueDesistiram, canaisTotal: transmissao.canais.length }
            : { fase: faseDoAr === 'no-ar' ? 'entrando' : faseDoAr }
        }
        impedimento={impedimento}
        onEntrarAoVivo={() => void entrarAoVivo()}
        onEncerrar={() => void encerrarTransmissao()}
        onSair={() => void sairDoEstudio()}
        onVoltarAosAjustes={voltarAosAjustes}
        mostrarVoltaAosAjustes={posicaoDosAjustes !== null}
        botaoVoltarRef={botaoVoltarRef}
      />

      {/* O console, como nas referências: o programa com os controles da
          captura logo abaixo, o preview com as cenas em ícones sob ele, o
          Corte e a Fusão na caixa do próximo corte, e o chat e as ferramentas
          à direita. Abaixo de lg vira uma coluna que rola, e o painel da
          ferramenta cresce com ela: numa caixa de altura fixa, metade de
          Gráficos ficava numa rolagem dentro da rolagem. */}
      <main
        ref={areaDoEstudioRef}
        style={larguraDasColunas}
        className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_var(--col-painel)] lg:overflow-hidden"
      >
        <div className="order-1 min-w-0 p-3 sm:p-4 lg:min-h-0">
          <MesaDeMonitores
            cenaDoPrograma={cenaPeloId(programa.sceneId)?.nome ?? ''}
            programaAoVivo={aoVivo}
            cenaDoPreview={cena.nome}
            programa={<PalcoDoPrograma compositor={compositor} mostrarGuias={mostrarGuias} />}
            preview={monitor(estadoDoPreview, {
              onCardDaCamera: setCardDaCamera,
              onPorACamera: () => escolherCena(CENA_INICIAL),
            })}
            proximoCorte={
              <ProximoCorte
                mudancas={mudancas}
                bloqueio={bloqueio}
                onJuntar={monitores.sempreDois ? () => setMonitores({ sempreDois: false }) : undefined}
                transicao={<BotoesDeTransicao temMudanca={temMudanca} cortando={programaQueSai !== null} bloqueio={bloqueio} onCortar={cortar} />}
              />
            }
            controles={
              <BandejaDoEstudio
                stream={localStream}
                mudo={mudo}
                onAlternarMicrofone={alternarMicrofone}
                cameraDesligada={cameraDesligada}
                onAlternarCamera={alternarCamera}
                compartilhando={!!screenStream}
                onAlternarTela={() => void alternarTela()}
                mostrarGuias={mostrarGuias}
                onAlternarGuias={() => setMostrarGuias((v) => !v)}
                onEscolherDispositivo={(tipo, deviceId) => void escolherAparelho(tipo, deviceId)}
                versaoDoAudio={versaoDoAudio}
                gravando={gravacao !== null}
                inicioDaGravacao={gravacao?.inicioEm ?? null}
                gravandoSemSom={gravacao !== null && !gravacao.comSom}
                onAlternarGravacao={() => void alternarGravacao()}
                fraseDoAr={fraseDoAr}
              />
            }
            cenas={
              <IconesDeCena
                cenas={cenasDoEstudio}
                idDoPrograma={programa.sceneId || CENA_INICIAL.id}
                idDoPreview={cena.id}
                temTela={temTela}
                aoVivo={aoVivo}
                onEscolher={escolherCena}
              />
            }
            unico={monitorUnico}
            avisoDoUnico={<AvisoDoMonitorUnico onSempreDois={() => setMonitores({ sempreDois: true })} />}
            refDoPreview={previewRef}
          />
        </div>

        <aside
          aria-label="Chat e ferramentas"
          className="relative order-2 border-t border-[var(--line)] bg-[var(--surface)] lg:min-h-0 lg:border-l lg:border-t-0"
        >
          <PainelDoEstudio
            ativa={ferramenta}
            onEscolher={(proxima) => {
              setFerramenta(proxima);
              setPosicaoDosAjustes(null);
              // Escolher uma ferramenta com o painel recolhido é querer vê-la
              setColunas((c) => (c.painelRecolhido ? { ...c, painelRecolhido: false } : c));
            }}
            onVerPreview={verPreview}
            rotuloVerPreview={monitorUnico ? 'Ver o programa' : 'Ver preview'}
            botaoVerPreviewRef={botaoVerPreviewRef}
            recolhido={colunas.painelRecolhido}
            onRecolher={() => setColunas((c) => ({ ...c, painelRecolhido: !c.painelRecolhido }))}
          >
            {painel}
          </PainelDoEstudio>
          {!colunas.painelRecolhido && (
            <DivisorDeColuna
              rotulo="Largura do painel de ferramentas"
              lado="esquerda"
              largura={colunas.painel}
              {...COLUNAS.painel}
              onLargura={(painel) => setColunas((c) => ({ ...c, painel }))}
              className="hidden lg:block"
            />
          )}
        </aside>
      </main>

      {janelaAberta && (
        <JanelaDoTeleprompter aberta={janelaAberta} onFechada={janelaFechada}>
          <div className="flex h-full flex-col bg-[var(--bg)]">
            <ControlesDaJanela
              estado={teleprompter}
              onTocar={(tocando) => setTeleprompter((t) => ({ ...t, tocando }))}
              onVelocidade={(velocidade) => setTeleprompter((t) => ({ ...t, velocidade }))}
              onFechar={fecharJanela}
            />
            <LeitorDoRoteiro
              texto={roteiro.texto}
              estado={teleprompter}
              tamanhoPx={TAMANHO_NA_JANELA[teleprompter.tamanho]}
              progresso={progresso}
              espelhar={teleprompter.espelhar}
              onTocar={(tocando) => setTeleprompter((t) => ({ ...t, tocando }))}
              onVelocidade={(velocidade) => setTeleprompter((t) => ({ ...t, velocidade }))}
              className="min-h-0 flex-1"
            />
          </div>
        </JanelaDoTeleprompter>
      )}
    </>
  );
}
