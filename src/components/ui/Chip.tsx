import type { ReactNode } from 'react';

interface ChipProps {
  onClick: () => void;
  children: ReactNode;
  /** Ícone à esquerda (ex.: a plataforma). */
  icone?: ReactNode;
  /** Estado à direita (ex.: ✓, ou alerta + "sem chave"). */
  estado?: ReactNode;
  /** Nome acessível completo quando o estado é só ícone ("YouTube: pronto"). */
  rotulo?: string;
}

/**
 * Um item com estado, clicável — os canais na linha de prontidão do painel.
 * Borda sólida sempre: o tracejado é reservado a "adicionar", para uma
 * pendência nunca ler como vaga vazia.
 */
export function Chip({ onClick, children, icone, estado, rotulo }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      className="inline-flex h-9 max-w-full items-center gap-1 rounded-full border border-[var(--line-ctl)] px-2.5 text-sm text-[var(--ink-hi)] transition-colors duration-150 hover:bg-[var(--raise)] cursor-pointer"
    >
      {icone && <span aria-hidden="true" className="inline-flex text-[var(--ink-lo)]">{icone}</span>}
      <span className="truncate">{children}</span>
      {estado && <span className="ml-0.5 inline-flex shrink-0 items-center gap-1">{estado}</span>}
    </button>
  );
}
