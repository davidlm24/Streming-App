import type { ReactNode, Ref } from 'react';

interface Base {
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
 * Com `onClick` é um botão; com `href` é um link para fora do app (o painel
 * oficial da plataforma), que abre em outra aba e diz isso ao leitor de tela.
 */
type AcaoDeTextoProps = Base &
  // `ref` no botão, para devolver o foco a ele (ex.: "Editar" depois de salvar).
  ({ onClick: () => void; href?: never; ref?: Ref<HTMLButtonElement> } | { href: string; onClick?: never; ref?: never });

/**
 * Ação secundária em texto — sem caixa, sem cor. A cor da tela é da ação
 * principal (o botão); tudo o que é secundário fala nesta voz. Antes cada
 * tela desenhava a sua: "Ver todos" em azul, "PwStreamer →" em azul com
 * seta, links de rodapé em caixa alta.
 */
export function AcaoDeTexto({ onClick, href, ref, children, icone, tamanho = 'sm', sublinhada = false, className = '' }: AcaoDeTextoProps) {
  const classe = `inline-flex items-center gap-1.5 underline-offset-4 transition-colors duration-150 cursor-pointer ${className} ${
    tamanho === 'xs' ? 'text-xs' : 'text-sm'
  } ${
    sublinhada
      ? 'text-[var(--ink-hi)] underline decoration-[var(--line-ctl)] hover:decoration-[var(--ink-hi)]'
      : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:underline'
  }`;
  const conteudo = (
    <>
      {icone && <span aria-hidden="true" className="inline-flex">{icone}</span>}
      {children}
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classe}>
        {conteudo}
        <span className="sr-only"> (abre em outra aba)</span>
      </a>
    );
  }
  return (
    <button ref={ref} type="button" onClick={onClick} className={classe}>
      {conteudo}
    </button>
  );
}
