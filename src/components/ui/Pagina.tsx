import type { ReactNode } from 'react';

/**
 * Esqueleto das páginas da casca (Painel, Canais, Webinars, Configurações):
 * uma coluna só, a mesma largura e o mesmo respiro em todas. Antes cada
 * tela escolhia o seu `max-w-*`, o seu padding e o tamanho do seu título.
 */
export function Pagina({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 w-full">
      <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">{children}</div>
    </main>
  );
}

/** Título da página, uma linha de contexto e, à direita, a ação da página. */
export function CabecalhoDePagina({ titulo, descricao, acao }: { titulo: string; descricao?: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink-hi)]">{titulo}</h1>
        {descricao && <p className="mt-2 max-w-prose text-sm text-[var(--ink-lo)]">{descricao}</p>}
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </div>
  );
}

/** Seção de página: título pequeno, separada por uma linha — nunca por cartão. */
export function SecaoDePagina({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12 border-t border-[var(--line)] pt-6">
      <h2 id={id} className="text-base font-semibold text-[var(--ink-hi)]">{titulo}</h2>
      {children}
    </section>
  );
}
