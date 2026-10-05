import { useEffect, useLayoutEffect, useRef, type MutableRefObject, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Minus, Plus } from 'lucide-react';
import { BotaoDeIcone } from './ui/BotaoDeIcone';
import { Button } from './ui/Button';

export type TamanhoDoTexto = 'p' | 'm' | 'g' | 'gg';

export interface EstadoDoTeleprompter {
  tocando: boolean;
  /** 1 a 10. */
  velocidade: number;
  tamanho: TamanhoDoTexto;
  /** Vale na janela: é para ler por um espelho de teleprompter. */
  espelhar: boolean;
  janela: boolean;
  /** Sobe a cada "Voltar ao começo": o leitor aberto (no painel ou na janela) volta ao topo. */
  reinicio: number;
}

export const TELEPROMPTER_INICIAL: EstadoDoTeleprompter = { tocando: false, velocidade: 4, tamanho: 'm', espelhar: false, janela: false, reinicio: 0 };

/** O tamanho do texto em px: no painel, que é estreito, e na janela, que fica perto da câmera. */
export const TAMANHO_NO_PAINEL: Record<TamanhoDoTexto, number> = { p: 16, m: 20, g: 24, gg: 28 };
export const TAMANHO_NA_JANELA: Record<TamanhoDoTexto, number> = { p: 28, m: 40, g: 56, gg: 72 };

/**
 * O roteiro rolando. A velocidade é proporcional ao tamanho do texto, para o
 * ritmo de leitura ser o mesmo no painel e na janela, e a rolagem conta o
 * tempo entre quadros: não depende da taxa de quadros da tela. Quando o texto
 * acaba (ou cabe inteiro), para. Antes eram duas rolagens soltas (a do painel
 * e a do palco), a primeira a chegar ao fim pausava as duas, e um texto curto
 * deixava o leitor "tocando" para sempre.
 *
 * A posição vive numa referência compartilhada, e não no estado: rolar a
 * cada quadro não redesenha o estúdio. Trocar do painel para a janela (ou de
 * volta) continua de onde parou.
 */
export function LeitorDoRoteiro({
  texto,
  estado,
  tamanhoPx,
  progresso,
  onTocar,
  onVelocidade,
  espelhar = false,
  className = '',
}: {
  texto: string;
  estado: EstadoDoTeleprompter;
  tamanhoPx: number;
  progresso: MutableRefObject<number>;
  onTocar: (tocando: boolean) => void;
  onVelocidade: (velocidade: number) => void;
  espelhar?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Onde parou, na abertura e quando o texto ou o tamanho mudam
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = progresso.current * Math.max(0, el.scrollHeight - el.clientHeight);
  }, [tamanhoPx, texto, progresso, estado.reinicio]);

  useEffect(() => {
    if (!estado.tocando) return;
    const el = ref.current;
    if (!el) return;
    const janela = el.ownerDocument.defaultView ?? window;
    let anterior = janela.performance.now();
    let posicao = el.scrollTop;
    let quadro = 0;
    const passo = (agora: number) => {
      const dt = Math.min(0.1, (agora - anterior) / 1000);
      anterior = agora;
      posicao += estado.velocidade * tamanhoPx * 0.12 * dt;
      const fim = el.scrollHeight - el.clientHeight;
      if (posicao >= fim) {
        el.scrollTop = fim;
        onTocar(false);
        return;
      }
      el.scrollTop = posicao;
      quadro = janela.requestAnimationFrame(passo);
    };
    quadro = janela.requestAnimationFrame(passo);
    return () => janela.cancelAnimationFrame(quadro);
    // onTocar muda a cada render do pai; o que reinicia a rolagem é tocar, a velocidade ou o tamanho
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.tocando, estado.velocidade, tamanhoPx]);

  const aoRolar = () => {
    const el = ref.current;
    if (!el) return;
    const fim = el.scrollHeight - el.clientHeight;
    progresso.current = fim > 0 ? el.scrollTop / fim : 0;
  };

  return (
    <div className={`relative ${className}`}>
      {/* A linha dos olhos: onde a frase que se lê fica */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[40%] z-10 h-px bg-[var(--line-ctl)]" />
      <div
        ref={ref}
        tabIndex={0}
        role="region"
        aria-label="Leitor do roteiro. Espaço toca e pausa; as setas para cima e para baixo mudam a velocidade."
        onScroll={aoRolar}
        onKeyDown={(e) => {
          if (e.key === ' ') {
            e.preventDefault();
            onTocar(!estado.tocando);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            onVelocidade(Math.min(10, estado.velocidade + 1));
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            onVelocidade(Math.max(1, estado.velocidade - 1));
          }
        }}
        className="h-full overflow-y-auto px-4"
      >
        <div aria-hidden="true" className="h-[40%]" />
        <p
          className="whitespace-pre-wrap text-pretty font-medium text-[var(--ink-hi)]"
          style={{ fontSize: tamanhoPx, lineHeight: 1.4, transform: espelhar ? 'scaleX(-1)' : undefined }}
        >
          {texto.trim() ? texto : <span className="text-[var(--ink-lo)]">Escreva o roteiro no campo abaixo.</span>}
        </p>
        <div aria-hidden="true" className="h-[60%]" />
      </div>
    </div>
  );
}

/** A janela aberta e o elemento onde o estúdio desenha dentro dela. */
export interface JanelaAberta {
  janela: Window;
  raiz: HTMLElement;
}

/**
 * Abre a janela do teleprompter, que se arrasta para perto da câmera. Usa o
 * Picture-in-Picture de documento quando o navegador tem (a janela fica por
 * cima das outras) e uma janela comum quando não tem. Tem de ser chamada no
 * próprio clique: o navegador só abre janelas dentro do gesto de quem clica.
 * Devolve null se o navegador não deixou abrir.
 */
export async function abrirJanelaDoTeleprompter(): Promise<JanelaAberta | null> {
  const pip = (window as unknown as { documentPictureInPicture?: { requestWindow: (o: object) => Promise<Window> } })
    .documentPictureInPicture;
  let janela: Window | null = null;
  if (pip) {
    try {
      janela = await pip.requestWindow({ width: 960, height: 360 });
    } catch {
      janela = null;
    }
  }
  if (!janela) janela = window.open('', 'pwstreamer-teleprompter', 'popup,width=960,height=360');
  if (!janela) return null;

  const doc = janela.document;
  doc.title = 'Teleprompter · PwStreamer';
  doc.head.querySelectorAll('link[rel="stylesheet"], style').forEach((n) => n.remove());
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((n) => doc.head.appendChild(n.cloneNode(true)));
  doc.documentElement.setAttribute('data-surface', 'console');
  doc.body.style.margin = '0';
  // A cor já resolvida: `var(--bg)` não resolve no body da janela nova
  const consoleDoEstudio = document.querySelector('[data-surface="console"]') ?? document.body;
  doc.body.style.background = getComputedStyle(consoleDoEstudio).getPropertyValue('--bg').trim() || 'black';
  doc.body.style.fontFamily = getComputedStyle(document.body).fontFamily;
  doc.body.replaceChildren();
  const raiz = doc.createElement('div');
  raiz.style.height = '100vh';
  doc.body.appendChild(raiz);
  return { janela, raiz };
}

/**
 * O que o estúdio desenha dentro da janela aberta, com o mesmo estado: não há
 * duas rolagens. Avisa quando a pessoa fecha a janela por fora.
 */
export function JanelaDoTeleprompter({
  aberta,
  onFechada,
  children,
}: {
  aberta: JanelaAberta;
  onFechada: () => void;
  children: ReactNode;
}) {
  const aoFechar = useRef(onFechada);
  aoFechar.current = onFechada;

  useEffect(() => {
    const fechada = () => aoFechar.current();
    aberta.janela.addEventListener('pagehide', fechada);
    return () => aberta.janela.removeEventListener('pagehide', fechada);
  }, [aberta]);

  return createPortal(children, aberta.raiz);
}

/** A barra de cima da janela: tocar, a velocidade e fechar. */
export function ControlesDaJanela({
  estado,
  onTocar,
  onVelocidade,
  onFechar,
}: {
  estado: EstadoDoTeleprompter;
  onTocar: (tocando: boolean) => void;
  onVelocidade: (velocidade: number) => void;
  onFechar: () => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--surface)] px-3 py-1.5">
      <Button variant="ghost" size="sm" onClick={() => onTocar(!estado.tocando)}>
        {estado.tocando ? 'Pausar' : 'Tocar'}
      </Button>
      <BotaoDeIcone rotulo="Mais devagar" onClick={() => onVelocidade(Math.max(1, estado.velocidade - 1))}>
        <Minus size={16} aria-hidden="true" />
      </BotaoDeIcone>
      <span className="w-20 text-center font-mono text-xs tabular-nums text-[var(--ink-lo)]">
        velocidade {estado.velocidade}
      </span>
      <BotaoDeIcone rotulo="Mais depressa" onClick={() => onVelocidade(Math.min(10, estado.velocidade + 1))}>
        <Plus size={16} aria-hidden="true" />
      </BotaoDeIcone>
      <Button variant="ghost" size="sm" onClick={onFechar} className="ml-auto">
        Fechar a janela
      </Button>
    </div>
  );
}
