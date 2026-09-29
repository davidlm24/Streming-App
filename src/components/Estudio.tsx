import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ClipeNoPalco, Comment, Destination, GeometriaDoCard, GraficosDoPalco, Participant, StudioSceneState } from '../types';
import { CENA_INICIAL, FONTE_CAMERA, FONTE_TELA, cenaPeloId, layoutUsaCard, lerCardSalvo, precisaDaTela, salvarCard, type Cena } from '../lib/cenas';
import { LOGO_PADRAO, QR_PADRAO, graficosVazios, mudancasNoCorte, normalizarLink, relogioParado, type RelogioDoCronometro } from '../lib/graficos';
import { AJUSTES_PADRAO, dentroDoQuadro, type AjustesDaCamera } from '../lib/camera';
import { useRoteiro } from '../lib/useRoteiro';
import { useListaDaConta } from '../lib/useListaDaConta';
import { estadoDoCanal } from '../lib/canais';
import { salvarBanners, salvarTickers, subscribeBanners, subscribeTickers } from '../lib/firestoreService';
import { useMediaManager } from '../context/MediaManagerContext';
import { BarraDoEstudio } from './BarraDoEstudio';
import { BotoesDeTransicao, DURACAO_DA_FUSAO, TrilhoDeCenas, type Transicao } from './TrilhoDeCenas';
import { MesaDeMonitores, ProximoCorte } from './MonitoresDoEstudio';
import { FERRAMENTA_INICIAL, PainelDoEstudio, type Ferramenta } from './PainelDoEstudio';
import { BandejaDoEstudio } from './BandejaDoEstudio';
import { StudioPreview } from './StudioPreview';
import { VirtualizedChat } from './VirtualizedChat';
import { PainelGraficos, type EscolhaDosGraficos } from './PainelGraficos';
import { PainelRoteiro } from './PainelRoteiro';
import { PainelQrCode, type QrDoEstudio } from './PainelQrCode';
import { PainelMidia } from './PainelMidia';
import { PainelCamera } from './PainelCamera';
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

const QR_INICIAL: QrDoEstudio = { link: '', titulo: '', preco: '', ...QR_PADRAO, noPreview: false };

/**
 * O quadro do clipe no instante do corte. Na fusão, a camada do programa que
 * sai mostra esse quadro enquanto some; antes o clipe dela voltava ao
 * primeiro quadro durante os 400 ms. Desenhar um vídeo de outra origem no
 * canvas só impede ler os pixels, e aqui eles só são mostrados.
 */
function congelarQuadro(video: HTMLVideoElement | null): HTMLCanvasElement | null {
  if (!video || video.readyState < 2 || !video.videoWidth) return null;
  const quadro = document.createElement('canvas');
  quadro.width = video.videoWidth;
  quadro.height = video.videoHeight;
  quadro.getContext('2d')?.drawImage(video, 0, 0);
  quadro.style.cssText = 'display:block;width:100%;height:100%;object-fit:contain';
  return quadro;
}

interface EstudioProps {
  usuario: { uid?: string; name?: string };
  /** O webinar pelo qual se entrou no estúdio, quando houver. O roteiro é dele. */
  webinar?: { id: string; title: string };
  canais: Destination[];
  onCanais: () => void;
  onSair: () => void;
  /** O chat é do app: a página pública do webinar também o usa. */
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
 * edição; o programa, o do último corte. Os dois são desenhados pelo mesmo
 * compositor (StudioPreview) a partir de um StudioSceneState.
 *
 * Morava no App, com cerca de setenta estados, e o LeftSidebar recebia 160
 * props, parte delas de abas que nenhum caminho abria mais.
 */
export function Estudio({
  usuario,
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
  const midia = useMediaManager();

  // ── Fontes: a câmera de quem opera e a tela compartilhada ─────────────────
  const nome = usuario.name?.trim().split(/\s+/)[0] || 'Apresentador';
  const participantes: Participant[] = useMemo(
    () => [
      { id: FONTE_CAMERA, name: nome, avatarUrl: '', isLocal: true, isActive: true, hasVideo: true, hasAudio: true },
      { id: FONTE_TELA, name: 'Tela compartilhada', avatarUrl: '', isLocal: false, isScreenShare: true, isActive: true, hasVideo: true, hasAudio: false },
    ],
    [nome],
  );

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [mudo, setMudo] = useState(false);
  const [cameraDesligada, setCameraDesligada] = useState(false);
  const [aparelhos, setAparelhos] = useState<{ microfone?: string; camera?: string }>({});
  const streamRef = useRef<MediaStream | null>(null);
  const telaRef = useRef<MediaStream | null>(null);
  streamRef.current = localStream;
  telaRef.current = screenStream;

  // Câmera e microfone só no estúdio: pedidos ao entrar, desligados ao sair
  useEffect(() => {
    let saiu = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { width: 1280, height: 720 }, audio: true })
      .then((stream) => {
        if (saiu) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setLocalStream(stream);
      })
      .catch((err) => console.warn('Câmera e microfone não liberados:', err));
    return () => {
      saiu = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      telaRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

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

  // Trocar de aparelho pede um stream novo só com o que mudou e troca a trilha
  const escolherAparelho = async (tipo: 'audio' | 'video', deviceId: string) => {
    const proximos = { ...aparelhos, [tipo === 'audio' ? 'microfone' : 'camera']: deviceId };
    setAparelhos(proximos);
    try {
      const novo = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, ...(proximos.camera ? { deviceId: { exact: proximos.camera } } : {}) },
        audio: proximos.microfone ? { deviceId: { exact: proximos.microfone } } : true,
      });
      novo.getAudioTracks().forEach((t) => (t.enabled = !mudo));
      novo.getVideoTracks().forEach((t) => (t.enabled = !cameraDesligada));
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setLocalStream(novo);
    } catch (err) {
      console.warn('Não foi possível trocar de aparelho:', err);
      toast.info('O aparelho não respondeu', 'Confira se ele está ligado e se outro programa não o está usando.');
    }
  };

  // ── Cenas, preview e programa ─────────────────────────────────────────────
  const [idDaCena, setIdDaCena] = useState(CENA_INICIAL.id);
  const cena = cenaPeloId(idDaCena) ?? CENA_INICIAL;
  const escolherCena = (c: Cena) => setIdDaCena(c.id);

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
  const [qr, setQr] = usePreferencia<QrDoEstudio>('pw_qr_do_estudio', QR_INICIAL, (q) => ({ ...q, noPreview: false }));
  const [clipeNoPreview, setClipeNoPreview] = useState<ClipeNoPalco | null>(null);
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
      logo: midia.activeLogo ? { url: midia.activeLogo, ...escolha.logo } : null,
      banner: banner ? { id: banner.id, titulo: banner.text, subtitulo: banner.subtitle ?? '', posicao: escolha.bannerPosicao } : null,
      ticker: ticker
        ? { id: ticker.id, texto: ticker.text, selo: ticker.badgeText ?? '', velocidade: escolha.tickerVelocidade, direcao: escolha.tickerDirecao }
        : null,
      qr: qr.noPreview && link ? { url: link, titulo: qr.titulo.trim(), preco: qr.preco.trim(), canto: qr.canto, tamanho: qr.tamanho } : null,
      cronometro: escolha.cronometro.noPreview ? { titulo: escolha.cronometro.titulo.trim() } : null,
    };
  }, [cor, midia.activeLogo, escolha, banners.itens, tickers.itens, qr]);

  const estadoDoPreview: StudioSceneState = {
    sceneId: cena.id,
    layout: cena.layout,
    activeParticipantIds: cena.fontes,
    cardDaCamera,
    activeBackground: midia.activeBackground,
    activeOverlay: midia.activeOverlay,
    pinnedComment: comentarioFixado,
    graficos: graficosDoPreview,
    clipe: clipeNoPreview,
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
  }));
  // Na fusão, o programa que sai e o quadro do clipe dele no instante do corte
  const [programaQueSai, setProgramaQueSai] = useState<{ estado: StudioSceneState; quadro: HTMLCanvasElement | null } | null>(null);
  const videoDoClipe = useRef<HTMLVideoElement | null>(null);
  const guardarVideoDoClipe = useCallback((el: HTMLVideoElement | null) => {
    videoDoClipe.current = el;
  }, []);
  const mudancas = mudancasNoCorte(programa, estadoDoPreview);
  const temMudanca = mudancas.length > 0;

  // Corte: o preview vai ao programa na hora. Fusão: o programa que sai fica
  // por cima e some em DURACAO_DA_FUSAO.
  const fusaoRef = useRef<number | null>(null);
  const cortar = (transicao: Transicao) => {
    if (fusaoRef.current) window.clearTimeout(fusaoRef.current);
    if (transicao === 'fusao') {
      setProgramaQueSai({ estado: programa, quadro: programa.clipe ? congelarQuadro(videoDoClipe.current) : null });
      fusaoRef.current = window.setTimeout(() => {
        setProgramaQueSai(null);
        fusaoRef.current = null;
      }, DURACAO_DA_FUSAO);
    } else {
      setProgramaQueSai(null);
    }
    setPrograma(estadoDoPreview);
  };

  // ── Tela compartilhada ────────────────────────────────────────────────────
  const cenaDoPreviewRef = useRef(cena);
  cenaDoPreviewRef.current = cena;
  const clipeRef = useRef(clipeNoPreview);
  clipeRef.current = clipeNoPreview;

  // Parar a tela pela bandeja ou pelo "Parar compartilhamento" do navegador.
  // Se o preview dependia dela (e não há um clipe no lugar), volta para a câmera.
  const pararTela = () => {
    telaRef.current?.getTracks().forEach((t) => t.stop());
    setScreenStream(null);
    if (precisaDaTela(cenaDoPreviewRef.current) && !clipeRef.current) escolherCena(CENA_INICIAL);
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
    // A tela entra no preview, pronta para o corte
    const comTela = cenaPeloId('cena-tela-e-camera');
    if (comTela) escolherCena(comTela);
  };

  // Um clipe entra no lugar da tela: se a cena do preview não usa a tela, vai para a cena Tela
  const porClipe = (clipe: ClipeNoPalco | null) => {
    setClipeNoPreview(clipe);
    if (clipe && !precisaDaTela(cena)) {
      const soTela = cenaPeloId('cena-tela');
      if (soTela) escolherCena(soTela);
    }
  };

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

  const painel = (() => {
    switch (ferramenta) {
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
        return <PainelMidia clipeNoPreview={clipeNoPreview} clipeNoPrograma={programa.clipe?.id ?? null} onClipe={porClipe} />;
      case 'camera':
        return (
          <PainelCamera
            ajustes={ajustes}
            onAjustes={setAjustes}
            card={cardDaCamera}
            onCard={setCardDaCamera}
            cenaTemCard={layoutUsaCard(cena.layout)}
          />
        );
    }
  })();

  const monitor = (papel: 'preview' | 'programa', estado: StudioSceneState, extra: Partial<Parameters<typeof StudioPreview>[0]> = {}) => (
    <StudioPreview
      papel={papel}
      estado={estado}
      participantes={participantes}
      localStream={localStream}
      screenStream={screenStream}
      cameraDesligada={cameraDesligada}
      camera={ajustes}
      relogio={relogio}
      mostrarGuias={mostrarGuias}
      {...extra}
    />
  );

  const ligados = canais.filter((d) => d.selected);

  return (
    <>
      <BarraDoEstudio
        sessao={webinar?.title}
        canaisLigados={ligados.length}
        canaisProntos={ligados.filter((d) => estadoDoCanal(d) === 'pronto').length}
        onCanais={onCanais}
        onSair={onSair}
      />

      {/* O console: cenas e transição, programa e preview, chat e ferramentas, e
          a bandeja. Abaixo de lg vira uma coluna que rola, e o painel da
          ferramenta cresce com ela: numa caixa de altura fixa, metade de
          Gráficos ficava numa rolagem dentro da rolagem. */}
      <main className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[14rem_minmax(0,1fr)_23rem] lg:overflow-hidden">
        <aside
          aria-label="Cenas e transição"
          className="order-2 border-t border-[var(--line)] bg-[var(--surface)] lg:order-1 lg:overflow-y-auto lg:border-r lg:border-t-0"
        >
          <TrilhoDeCenas
            idDoPrograma={programa.sceneId || CENA_INICIAL.id}
            idDoPreview={cena.id}
            temTela={!!screenStream || !!clipeNoPreview}
            temMudanca={temMudanca}
            cortando={programaQueSai !== null}
            onEscolher={escolherCena}
            onCortar={cortar}
          />
        </aside>

        <div className="order-1 min-w-0 p-3 sm:p-4 lg:order-2 lg:min-h-0">
          <MesaDeMonitores
            cenaDoPrograma={cenaPeloId(programa.sceneId)?.nome ?? ''}
            cenaDoPreview={cena.nome}
            programa={
              <>
                {monitor('programa', programa, { onVideoDoClipe: guardarVideoDoClipe })}
                {programaQueSai && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{ animation: `fusao-sai ${DURACAO_DA_FUSAO}ms ease-out forwards` }}
                  >
                    {monitor('programa', programaQueSai.estado, { semSom: true, quadroDoClipe: programaQueSai.quadro })}
                  </div>
                )}
              </>
            }
            preview={monitor('preview', estadoDoPreview, {
              onCardDaCamera: setCardDaCamera,
              onPorACamera: () => escolherCena(CENA_INICIAL),
            })}
            proximoCorte={<ProximoCorte mudancas={mudancas} />}
            transicaoNoCelular={<BotoesDeTransicao temMudanca={temMudanca} cortando={programaQueSai !== null} onCortar={cortar} />}
          />
        </div>

        <aside
          aria-label="Chat e ferramentas"
          className="order-3 border-t border-[var(--line)] bg-[var(--surface)] lg:min-h-0 lg:border-l lg:border-t-0"
        >
          <PainelDoEstudio ativa={ferramenta} onEscolher={setFerramenta}>
            {painel}
          </PainelDoEstudio>
        </aside>
      </main>

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
      />

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
