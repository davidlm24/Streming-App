import { useEffect, useId, useRef, useState, type MouseEvent as EventoDeMouse, type ReactNode, type TouchEvent as EventoDeToque } from 'react';
import { Maximize2, User } from 'lucide-react';
import type { GeometriaDoCard, Participant, StudioSceneState } from '../types';
import { ALTURA_DO_PALCO, LARGURA_DO_PALCO, caixasDaGrade } from '../lib/palco/medidas';
import { CARD_PADRAO, FORMATOS_DO_CARD, dentroDoPalco } from '../lib/cenas';
import { matrizDaChave, matrizDoDescarte, suavizacaoEmPx, transformacaoDaCamera, type AjustesDaCamera } from '../lib/camera';
import type { RelogioDoCronometro } from '../lib/graficos';
import type { PlayerDoClipe } from '../lib/playerDoClipe';
import type { PaginaMostrada } from '../lib/useApresentacao';
import { GraficosDoPalco } from './GraficosDoPalco';
import { GuiasDoPalco } from './GuiasDoPalco';
import { Button } from './ui/Button';

/** A espessura do anel da moldura do monitor (`.pw-frame` no index.css). */
const ANEL_DA_MOLDURA = 2;

/**
 * O tamanho do palco em 16:9 dentro do lugar do monitor, descontado o anel
 * da moldura. Sem descontar, a moldura passava 4px do lugar e o anel da
 * direita e o de baixo saíam cortados. O monitor de programa (PalcoDoPrograma)
 * usa a mesma medida para o canvas do compositor.
 */
export function useTamanhoDoPalco() {
  const lugarRef = useRef<HTMLDivElement>(null);
  const [tamanho, setTamanho] = useState({ largura: 0, altura: 0 });

  useEffect(() => {
    const lugar = lugarRef.current;
    if (!lugar) return;
    const medir = () => {
      const r = lugar.getBoundingClientRect();
      const largura = r.width - 2 * ANEL_DA_MOLDURA;
      const altura = r.height - 2 * ANEL_DA_MOLDURA;
      if (largura <= 0 || altura <= 0) return;
      const l = Math.min(largura, (altura * 16) / 9);
      setTamanho((atual) =>
        Math.abs(atual.largura - l) < 0.5 ? atual : { largura: l, altura: (l * 9) / 16 },
      );
    };
    const observador = new ResizeObserver(medir);
    observador.observe(lugar);
    medir();
    return () => observador.disconnect();
  }, []);

  return { lugarRef, tamanho };
}

/**
 * O clipe do programa desenhado noutro monitor: o preview, quando o mesmo
 * clipe está nos dois, e a camada que sai na fusão. Um canvas copia a imagem
 * do player a cada quadro novo do vídeo; o som fica só no programa. Desenhar
 * um vídeo de outra origem só impede ler os pixels, e aqui eles só são
 * mostrados.
 */
function EspelhoDoClipe({ video }: { video: HTMLVideoElement }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const desenhar = () => {
      if (video.readyState < 2 || !video.videoWidth) return;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      ctx.drawImage(video, 0, 0);
    };
    desenhar();
    // Parado, o quadro só muda num salto ou quando os dados chegam
    const eventos = ['loadeddata', 'seeked', 'pause', 'ended'];
    eventos.forEach((e) => video.addEventListener(e, desenhar));
    let vivo = true;
    let pedido = 0;
    const avisaQuadros = typeof (video as { requestVideoFrameCallback?: unknown }).requestVideoFrameCallback === 'function';
    // Tocando, desenha a cada quadro novo do vídeo, e não a cada quadro da tela.
    // Onde o navegador não avisa os quadros do vídeo, desenha quando o tempo anda.
    if (avisaQuadros) {
      const aCadaQuadro = () => {
        if (!vivo) return;
        desenhar();
        pedido = video.requestVideoFrameCallback(aCadaQuadro);
      };
      pedido = video.requestVideoFrameCallback(aCadaQuadro);
    } else {
      let desenhado = video.currentTime;
      const aCadaTela = () => {
        if (!vivo) return;
        if (video.currentTime !== desenhado) {
          desenhar();
          desenhado = video.currentTime;
        }
        pedido = requestAnimationFrame(aCadaTela);
      };
      pedido = requestAnimationFrame(aCadaTela);
    }
    return () => {
      vivo = false;
      if (avisaQuadros) video.cancelVideoFrameCallback(pedido);
      else cancelAnimationFrame(pedido);
      eventos.forEach((e) => video.removeEventListener(e, desenhar));
    };
  }, [video]);
  return <canvas ref={ref} aria-hidden="true" className="h-full w-full object-contain" />;
}

interface StudioPreviewProps {
  /** O estado em edição: o que o próximo corte leva ao programa. */
  estado: StudioSceneState;
  /** As fontes do estúdio: a câmera de quem opera e a tela compartilhada. */
  participantes: Participant[];
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  cameraDesligada: boolean;
  /** Os ajustes da câmera valem nos dois monitores ao mesmo tempo, como o aparelho. */
  camera: AjustesDaCamera;
  relogio: RelogioDoCronometro;
  mostrarGuias: boolean;
  /** O player do clipe do programa (lib/playerDoClipe): o preview o espelha quando traz o mesmo clipe. */
  playerDoClipe?: PlayerDoClipe | null;
  /** A página da apresentação aberta: vale em todo monitor cujo estado traz a apresentação. */
  paginaDaApresentacao?: PaginaMostrada | null;
  /** Só no preview: cada ajuste do card da câmera feito à mão sobre a imagem. */
  onCardDaCamera?: (card: GeometriaDoCard) => void;
  /** Só no preview: a saída do palco sem fonte. */
  onPorACamera?: () => void;
}

/**
 * O monitor de preview: desenha em HTML o estado em edição. O programa é o
 * canvas do compositor (lib/palco), que repete as frações deste palco
 * (medidas.ts, graficosNoCanvas.ts); é por isso que o preview mostra
 * exatamente o que o corte leva (DESIGN.md, Regra do Preview Fiel). Mudou
 * uma medida aqui, muda lá também.
 *
 * Era um componente de 3.278 linhas que desenhava também o que não ia ao ar:
 * o teleprompter por cima do preview, botões de chat flutuante, lousa e
 * snapshot, alças de arrastar banner e logo, a barra de zoom do QR e cortinas
 * de transição. Cada gráfico lia o próprio estado, e parte deles mudava o
 * programa sem corte.
 */
export function StudioPreview({
  estado,
  participantes,
  localStream,
  screenStream,
  cameraDesligada,
  camera,
  relogio,
  mostrarGuias,
  playerDoClipe = null,
  paginaDaApresentacao = null,
  onCardDaCamera,
  onPorACamera,
}: StudioPreviewProps) {
  const { lugarRef, tamanho } = useTamanhoDoPalco();
  const palcoRef = useRef<HTMLDivElement>(null);
  const idDoFiltro = `croma-${useId().replace(/:/g, '')}`;
  const croma = camera.croma;
  const fundo = estado.activeBackground || '';

  const ativos = participantes.filter((p) => estado.activeParticipantIds.includes(p.id));
  const fonteDaCamera = ativos.find((p) => p.isLocal);
  const fonteDaTela = ativos.find((p) => p.isScreenShare);

  // ── Câmera ──────────────────────────────────────────────────────────────
  const desenharCamera = (nome: string) => (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[var(--stage)]"
      style={croma.ligado && fundo ? { backgroundImage: `url(${fundo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {!cameraDesligada && localStream ? (
        <video
          ref={(el) => {
            if (el && el.srcObject !== localStream) el.srcObject = localStream;
          }}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
          style={{
            transform: transformacaoDaCamera(camera),
            transformOrigin: 'center',
            filter: croma.ligado ? `url(#${idDoFiltro})` : undefined,
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-[var(--raise)] text-[var(--ink-lo)]">
            <User size={32} aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-[var(--ink-hi)]">{nome}</p>
          {/* Desligada é escolha de quem opera; sem stream é a câmera que não veio (permissão ou aparelho) */}
          <p className="text-xs text-[var(--ink-lo)]">{cameraDesligada ? 'Câmera desligada' : 'Sem imagem da câmera'}</p>
        </div>
      )}
    </div>
  );

  // ── Tela (ou o clipe, ou a página, no lugar dela) ────────────────────────
  // O clipe toca no programa a partir do corte, com som só ali, num player só
  // (o compositor o desenha no vídeo). Se o preview traz o mesmo clipe,
  // espelha o quadro desse player; um clipe que ainda não está no programa
  // fica parado no primeiro quadro, que é de onde o corte o começa.
  const desenharTela = () => {
    const clipe = estado.clipe;
    const doPlayer = clipe && playerDoClipe?.id === clipe.id ? playerDoClipe : null;
    const apresentacao = estado.apresentacao;
    const pagina = apresentacao && paginaDaApresentacao?.id === apresentacao.id ? paginaDaApresentacao : null;
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[var(--stage)]">
        {clipe ? (
          doPlayer ? (
            <EspelhoDoClipe video={doPlayer.video} />
          ) : (
            <video key={clipe.id} src={clipe.url} muted playsInline preload="auto" className="h-full w-full object-contain" />
          )
        ) : apresentacao ? (
          pagina ? (
            <img src={pagina.url} alt="" className="h-full w-full object-contain" />
          ) : (
            <p className="p-4 text-center text-sm text-[var(--ink-lo)]">Desenhando a página…</p>
          )
        ) : screenStream ? (
          <video
            ref={(el) => {
              if (el && el.srcObject !== screenStream) el.srcObject = screenStream;
            }}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-contain"
          />
        ) : (
          <p className="p-4 text-center text-sm text-[var(--ink-lo)]">Nenhuma tela compartilhada.</p>
        )}
      </div>
    );
  };

  // ── Card da câmera (cena Tela com câmera) ────────────────────────────────
  const card = estado.cardDaCamera ?? CARD_PADRAO;
  const cardAtual = useRef(card);
  cardAtual.current = card;
  const podeEditarCard = !!onCardDaCamera;
  const mudarCard = (parcial: Partial<GeometriaDoCard>) => {
    if (!podeEditarCard) return;
    const novo = dentroDoPalco({ ...cardAtual.current, ...parcial });
    cardAtual.current = novo;
    onCardDaCamera?.(novo);
  };
  const [arrastando, setArrastando] = useState(false);
  const [redimensionando, setRedimensionando] = useState(false);
  const emAjuste = arrastando || redimensionando;

  const posicaoDoPonteiro = (e: MouseEvent | TouchEvent | EventoDeMouse | EventoDeToque) =>
    'touches' in e ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };

  const acompanhar = (aoMover: (dx: number, dy: number, palco: DOMRect) => void, aoSoltar: () => void, inicio: { x: number; y: number }) => {
    const mover = (evento: MouseEvent | TouchEvent) => {
      const palco = palcoRef.current?.getBoundingClientRect();
      if (!palco || palco.width === 0) return;
      const p = posicaoDoPonteiro(evento);
      aoMover(p.x - inicio.x, p.y - inicio.y, palco);
    };
    const soltar = () => {
      aoSoltar();
      window.removeEventListener('mousemove', mover);
      window.removeEventListener('mouseup', soltar);
      window.removeEventListener('touchmove', mover);
      window.removeEventListener('touchend', soltar);
    };
    window.addEventListener('mousemove', mover);
    window.addEventListener('mouseup', soltar);
    window.addEventListener('touchmove', mover);
    window.addEventListener('touchend', soltar);
  };

  const comecarArrasto = (e: EventoDeMouse | EventoDeToque) => {
    if (!podeEditarCard) return;
    e.stopPropagation();
    e.preventDefault();
    setArrastando(true);
    const inicial = { ...cardAtual.current };
    acompanhar(
      (dx, dy, palco) => mudarCard({ x: inicial.x + (dx / palco.width) * 100, y: inicial.y + (dy / palco.height) * 100 }),
      () => setArrastando(false),
      posicaoDoPonteiro(e),
    );
  };

  const comecarRedimensionar = (e: EventoDeMouse | EventoDeToque) => {
    if (!podeEditarCard) return;
    e.stopPropagation();
    e.preventDefault();
    setRedimensionando(true);
    const escalaInicial = cardAtual.current.escala;
    acompanhar(
      (dx, dy, palco) => {
        // A mão anda na diagonal; meio palco de arrasto dobra o tamanho
        const delta = ((dx + dy) / palco.width) * 2;
        mudarCard({ escala: Math.max(0.6, Math.min(1.8, Number((escalaInicial + delta).toFixed(2)))) });
      },
      () => setRedimensionando(false),
      posicaoDoPonteiro(e),
    );
  };

  const desenharCard = (nome: string) => {
    const formato = FORMATOS_DO_CARD[card.formato];
    const circulo = card.formato === 'circle';
    const raio = circulo ? 'rounded-full' : card.formato === 'compact' ? 'rounded-lg' : 'rounded-xl';
    return (
      <div
        className="group/card absolute z-10 select-none"
        style={{
          left: `${card.x}%`,
          top: `${card.y}%`,
          // Em % da largura do palco: o mesmo card no preview e no programa
          width: `${formato.largura * card.escala}%`,
          aspectRatio: formato.proporcao,
          touchAction: 'none',
        }}
      >
        {/* A borda é gráfico da live, na cor dos gráficos; o destaque de edição é neutro */}
        <div
          className={`relative h-full w-full overflow-hidden border-2 bg-[var(--bg)] shadow-2xl ${raio} ${
            podeEditarCard ? 'group-hover/card:ring-2 group-hover/card:ring-[var(--ink-hi)]' : ''
          } ${emAjuste ? 'ring-2 ring-[var(--ink-hi)]' : ''}`}
          style={{ borderColor: estado.graficos.cor }}
        >
          {desenharCamera(nome)}
          {podeEditarCard && (
            <div
              onMouseDown={comecarArrasto}
              onTouchStart={comecarArrasto}
              title="Arraste para mudar o card de lugar"
              className={`absolute inset-0 z-10 cursor-grab active:cursor-grabbing ${arrastando ? 'bg-[var(--ink-hi)]/10' : ''}`}
            />
          )}
        </div>

        {/* No palco, a edição do card é só a mão: arrastar move, a alça muda o
            tamanho, e a leitura aparece enquanto se ajusta. Os cantos, o
            formato e o tamanho exato ficam no painel Câmera, com teclado. */}
        {podeEditarCard && emAjuste && (
          <span className="pointer-events-none absolute left-1/2 top-1.5 z-20 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--line-ctl)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-xs tabular-nums text-[var(--ink)]">
            {redimensionando ? `${Math.round(card.escala * 100)}%` : `X ${Math.round(card.x)}% · Y ${Math.round(card.y)}%`}
          </span>
        )}
        {podeEditarCard && !circulo && (
          <div
            onMouseDown={comecarRedimensionar}
            onTouchStart={comecarRedimensionar}
            title="Arraste para mudar o tamanho do card"
            className={`absolute -bottom-1.5 -right-1.5 z-20 flex size-5 cursor-nwse-resize items-center justify-center rounded-full border border-[var(--ink-hi)] bg-[var(--surface)] text-[var(--ink-hi)] transition-opacity duration-150 ${
              emAjuste ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'
            }`}
          >
            <Maximize2 size={10} aria-hidden="true" />
          </div>
        )}
      </div>
    );
  };

  // Um convidado da sala: a imagem em cover, ou o nome com a inicial quando falta
  const desenharConvidado = (p: Participant) => (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[var(--stage)]">
      {p.stream && p.hasVideo ? (
        <video
          ref={(el) => {
            if (el && el.srcObject !== p.stream) el.srcObject = p.stream;
          }}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--raise)] text-base font-medium text-[var(--ink-hi)]">
            {p.name.charAt(0).toUpperCase()}
          </span>
          <p className="text-xs text-[var(--ink-lo)]">{p.name}</p>
        </div>
      )}
    </div>
  );

  // ── A composição da cena ────────────────────────────────────────────────
  const composicao = () => {
    // A Grade: as MESMAS caixas do compositor, em % do palco (Regra do Preview Fiel)
    if (estado.layout === 'grid') {
      const pessoas = estado.activeParticipantIds
        .map((id) => participantes.find((p) => p.id === id))
        .filter((p): p is Participant => !!p && !p.isScreenShare);
      const caixas = caixasDaGrade(Math.max(1, pessoas.length));
      return (
        <div className="relative h-full w-full">
          {pessoas.map((p, i) => {
            const c = caixas[i];
            return (
              <div
                key={p.id}
                className="absolute overflow-hidden"
                style={{
                  left: `${(c.x / LARGURA_DO_PALCO) * 100}%`,
                  top: `${(c.y / ALTURA_DO_PALCO) * 100}%`,
                  width: `${(c.w / LARGURA_DO_PALCO) * 100}%`,
                  height: `${(c.h / ALTURA_DO_PALCO) * 100}%`,
                }}
              >
                {p.isLocal ? desenharCamera(p.name) : desenharConvidado(p)}
              </div>
            );
          })}
        </div>
      );
    }
    if (!fonteDaCamera && !fonteDaTela) {
      return (
        // Era "Transmissão Vazia" com um escudo de alerta na cor da marca e um
        // botão azul: o palco sem fonte não é um alerta, e não há transmissão.
        <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
          <p className="text-sm text-[var(--ink)]">Nenhuma fonte nesta cena.</p>
          {onPorACamera && (
            <Button variant="ghost" size="sm" onClick={onPorACamera} className="mt-3">
              Pôr a câmera no palco
            </Button>
          )}
        </div>
      );
    }
    if (fonteDaCamera && fonteDaTela) {
      if (estado.layout === 'picture-in-picture') {
        return (
          <div className="relative h-full w-full">
            {desenharTela()}
            {desenharCard(fonteDaCamera.name)}
          </div>
        );
      }
      // Lado a lado: a fonte maior com três quartos da largura e a outra em
      // 16:9 ao lado, centrada na altura; em metades, as duas em 16:9 do mesmo
      // tamanho. Margem e vão em % da largura, para o preview e o programa
      // terem a mesma composição.
      const emCaixa = (fonte: ReactNode) => <div className="aspect-video w-full shrink-0">{fonte}</div>;
      if (estado.layout === 'dual') {
        return (
          <div className="flex h-full w-full items-center gap-[1.6%] p-[1.6%]">
            <div className="flex-1">{emCaixa(desenharCamera(fonteDaCamera.name))}</div>
            <div className="flex-1">{emCaixa(desenharTela())}</div>
          </div>
        );
      }
      if (estado.layout === 'camera-em-destaque') {
        return (
          <div className="flex h-full w-full gap-[1.6%] p-[1.6%]">
            <div className="h-full flex-[3]">{desenharCamera(fonteDaCamera.name)}</div>
            <div className="flex flex-1 flex-col justify-center">{emCaixa(desenharTela())}</div>
          </div>
        );
      }
      return (
        <div className="flex h-full w-full gap-[1.6%] p-[1.6%]">
          <div className="h-full flex-[3]">{desenharTela()}</div>
          <div className="flex flex-1 flex-col justify-center">{emCaixa(desenharCamera(fonteDaCamera.name))}</div>
        </div>
      );
    }
    return fonteDaCamera ? desenharCamera(fonteDaCamera.name) : desenharTela();
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div ref={lugarRef} className="flex min-h-0 w-full flex-1 items-center justify-start overflow-hidden">
        {/* A mesa quadrada aposentou-se com a direção soft-modern: a moldura
            volta ao raio padrão (radius-lg + 2px) e o palco acompanha. As
            marcas de canto do tally continuam retas — o sinal não mora no
            raio. O raio fica fora da área segura: nenhum gráfico encosta nele. */}
        <div
          className="pw-frame pw-frame--pvw"
          style={{ ['--pw-frame-radius' as string]: 'var(--radius-lg)' }}
        >
          <div
            ref={palcoRef}
            style={tamanho.largura > 0 ? { width: tamanho.largura, height: tamanho.altura } : undefined}
            className={`palco relative flex items-center justify-center overflow-hidden rounded-[var(--radius-lg)] bg-[var(--stage)] ${
              estado.graficos.ticker ? 'palco--com-ticker' : ''
            }`}
          >
            {fundo && (
              <img src={fundo} alt="" className="absolute inset-0 h-full w-full object-cover" referrerPolicy="no-referrer" />
            )}

            <div className="relative h-full w-full">{composicao()}</div>

            {estado.activeOverlay && (
              <img
                src={estado.activeOverlay}
                alt=""
                className="pointer-events-none absolute inset-0 z-10 h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}

            <GraficosDoPalco graficos={estado.graficos} comentario={estado.pinnedComment} relogio={relogio} />

            {/* Guias: ajuda de operação, DOM por cima da imagem (GuiasDoPalco) */}
            {mostrarGuias && <GuiasDoPalco />}

            {/* O croma de cada monitor: a chave sai da imagem original, e o
                descarte do reflexo vem depois dela. Com suavização, o alfa da
                chave é desfocado e aplicado à imagem original corrigida; antes
                ele era composto com a imagem já recortada, e a borda continuava
                dura. Um filtro por monitor, com id próprio: antes eram dois
                (três na fusão) com o mesmo id. */}
            {croma.ligado && (
              <svg aria-hidden="true" className="invisible absolute h-0 w-0">
                <defs>
                  <filter id={idDoFiltro} colorInterpolationFilters="sRGB">
                    <feColorMatrix type="matrix" in="SourceGraphic" values={matrizDaChave(croma)} result="chave" />
                    {croma.suavizacao > 0 ? (
                      <>
                        <feColorMatrix type="matrix" in="SourceGraphic" values={matrizDoDescarte(croma)} result="corrigida" />
                        <feColorMatrix type="matrix" in="chave" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="alfa" />
                        <feGaussianBlur in="alfa" stdDeviation={suavizacaoEmPx(croma, tamanho.largura)} result="alfaSuave" />
                        <feComposite in="corrigida" in2="alfaSuave" operator="in" />
                      </>
                    ) : (
                      <feColorMatrix type="matrix" in="chave" values={matrizDoDescarte(croma)} />
                    )}
                  </filter>
                </defs>
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
