import type { ReactNode } from 'react';

interface AcaoDeTextoProps {
  onClick: () => void;
  children: ReactNode;
  icone?: ReactNode;
  /** `xs` para rodapé e casca; `sm` no corpo das páginas. */
  tamanho?: 'xs' | 'sm';
  /**
   * Sublinhada e em tinta alta: um link no meio de uma frase ("…ou agende o
   * próximo webinar…"). Sem isso, é uma ação discreta de cabeçalho de seção.
   */
  sublinhada?: boolean;
  /**
   * Só margem e tamanho do alvo (`mt-2 min-h-11`) — a voz é fixa. Nunca
   * `display`: a base já é `inline-flex` e um `hidden` passado aqui perde
   * (vazou no cabeçalho do celular). Para esconder, envolva num `<span>`.
   */
  className?: string;
}

/**
 * Ação secundária em texto — sem caixa, sem cor. A cor da tela é da ação
 * principal (o botão); tudo o que é secundário fala nesta voz. Antes cada
 * tela desenhava a sua: "Ver todos" em azul, "PwStreamer →" em azul com
 * seta, links de rodapé em caixa alta.
 */
export function AcaoDeTexto({ onClick, children, icone, tamanho = 'sm', sublinhada = false, className = '' }: AcaoDeTextoProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 underline-offset-4 transition-colors duration-150 cursor-pointer ${className} ${
        tamanho === 'xs' ? 'text-xs' : 'text-sm'
      } ${
        sublinhada
          ? 'text-[var(--ink-hi)] underline decoration-[var(--line-ctl)] hover:decoration-[var(--ink-hi)]'
          : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:underline'
      }`}
    >
      {icone && <span aria-hidden="true" className="inline-flex">{icone}</span>}
      {children}
    </button>
  );
}
