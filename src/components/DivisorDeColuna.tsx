import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

interface DivisorDeColunaProps {
  /** O nome que o leitor de tela diz ("Largura das cenas"). */
  rotulo: string;
  largura: number;
  minimo: number;
  maximo: number;
  padrao: number;
  /** A fração da janela que a coluna pode ocupar (o `min(…, 22vw)` da grade), para o valor dito ser o da tela. */
  tetoNaJanela: number;
  /** De que lado da coluna o divisor fica: arrastar para fora alarga. */
  lado: 'direita' | 'esquerda';
  onLargura: (largura: number) => void;
  className?: string;
}

const PASSO = 16;
const PASSO_LONGO = 64;

/**
 * A borda arrastável de uma coluna do console, só no desktop. É um
 * `separator` com valor: as setas mudam a largura de 16 em 16px (64px com
 * Shift), Home e End vão ao mínimo e ao máximo, e o duplo clique volta ao
 * padrão. A linha só aparece sob o ponteiro, no foco e durante o arrasto;
 * parada, a borda da coluna é a de sempre.
 *
 * Fica por dentro da coluna, com a linha sobre a borda dela: um divisor que
 * passava 4px para fora abria uma rolagem horizontal na coluna das cenas.
 */
export function DivisorDeColuna({ rotulo, largura, minimo, maximo, padrao, tetoNaJanela, lado, onLargura, className = '' }: DivisorDeColunaProps) {
  const [arrastando, setArrastando] = useState(false);
  const inicio = useRef<{ x: number; largura: number } | null>(null);
  // O máximo de verdade é o menor entre o do console e o que a janela deixa:
  // sem isso, as últimas setas não mudavam nada na tela, e o leitor de tela
  // dizia 320 pixels de uma coluna com 282
  const [janela, setJanela] = useState(() => window.innerWidth);
  useEffect(() => {
    const medir = () => setJanela(window.innerWidth);
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);
  const teto = Math.max(minimo, Math.min(maximo, Math.floor(janela * tetoNaJanela)));
  const limitar = (valor: number) => Math.round(Math.min(teto, Math.max(minimo, valor)));
  const naTela = limitar(largura);
  // Na coluna da direita, o divisor fica à esquerda dela: andar para a esquerda alarga
  const sentido = lado === 'direita' ? 1 : -1;

  const comecar = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    // Parte da largura que a coluna tem na tela, que o limite em vw pode ter encolhido
    const coluna = e.currentTarget.parentElement?.getBoundingClientRect().width;
    inicio.current = { x: e.clientX, largura: limitar(coluna ?? largura) };
    setArrastando(true);
  };
  const mover = (e: PointerEvent<HTMLDivElement>) => {
    if (!inicio.current) return;
    onLargura(limitar(inicio.current.largura + (e.clientX - inicio.current.x) * sentido));
  };
  const soltar = (e: PointerEvent<HTMLDivElement>) => {
    if (!inicio.current) return;
    inicio.current = null;
    setArrastando(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const teclado = (e: KeyboardEvent<HTMLDivElement>) => {
    const passo = e.shiftKey ? PASSO_LONGO : PASSO;
    const proxima = {
      ArrowRight: naTela + passo * sentido,
      ArrowLeft: naTela - passo * sentido,
      Home: minimo,
      End: teto,
    }[e.key];
    if (proxima === undefined) return;
    e.preventDefault();
    onLargura(limitar(proxima));
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={rotulo}
      aria-valuenow={naTela}
      aria-valuemin={minimo}
      aria-valuemax={teto}
      aria-valuetext={`${naTela} pixels`}
      tabIndex={0}
      title="Arraste para mudar a largura. Duplo clique volta ao padrão."
      onPointerDown={comecar}
      onPointerMove={mover}
      onPointerUp={soltar}
      onPointerCancel={soltar}
      onDoubleClick={() => onLargura(padrao)}
      onKeyDown={teclado}
      className={`group/divisor absolute inset-y-0 z-20 w-2 cursor-col-resize touch-none ${
        lado === 'direita' ? 'right-0' : 'left-0'
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 w-px transition-colors duration-150 ${lado === 'direita' ? 'right-0' : 'left-0'} ${
          arrastando ? 'bg-[var(--ink-hi)]' : 'group-hover/divisor:bg-[var(--ink-lo)] group-focus-visible/divisor:bg-[var(--ink-hi)]'
        }`}
      />
    </div>
  );
}
