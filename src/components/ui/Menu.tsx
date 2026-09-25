import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';

export interface ItemDeMenu {
  rotulo: string;
  onSelect: () => void;
  icone?: ReactNode;
  /** Ação destrutiva (remover, excluir): texto no tom de alarme. */
  perigo?: boolean;
}

interface MenuProps {
  /** Nome acessível do gatilho — diga de quê são as ações ("Ações de <título>"). */
  rotulo: string;
  itens: ItemDeMenu[];
  /** Conteúdo do gatilho no lugar do "⋯" (ex.: o avatar da conta). */
  gatilho?: ReactNode;
  classeDoGatilho?: string;
  /** Linha fixa no topo do menu, fora dos itens (ex.: nome e e-mail). */
  cabecalho?: ReactNode;
}

/**
 * Menu de ações secundárias, atrás de um botão "⋯".
 *
 * Existe para que cada linha de lista tenha UMA ação visível: antes, cada
 * webinar do painel carregava três botões (Inscrições, Criar Capa, Acessar
 * Estúdio), cada um de uma cor. Padrão WAI-ARIA Menu Button: setas movem,
 * Home/End vão às pontas, Esc fecha e devolve o foco ao gatilho, clicar fora
 * fecha.
 */
export function Menu({ rotulo, itens, gatilho, classeDoGatilho, cabecalho }: MenuProps) {
  const [aberto, setAberto] = useState(false);
  const idMenu = useId();
  const raiz = useRef<HTMLDivElement>(null);
  const refGatilho = useRef<HTMLButtonElement>(null);
  const itensRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!aberto) return;
    itensRef.current[0]?.focus();
    const foraDoMenu = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('pointerdown', foraDoMenu);
    return () => document.removeEventListener('pointerdown', foraDoMenu);
  }, [aberto]);

  const fechar = (devolverFoco = true) => {
    setAberto(false);
    if (devolverFoco) refGatilho.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const lista = itensRef.current.filter(Boolean) as HTMLButtonElement[];
    const atual = lista.indexOf(document.activeElement as HTMLButtonElement);
    const ir = (i: number) => { e.preventDefault(); lista[(i + lista.length) % lista.length]?.focus(); };
    if (e.key === 'ArrowDown') ir(atual + 1);
    else if (e.key === 'ArrowUp') ir(atual - 1);
    else if (e.key === 'Home') ir(0);
    else if (e.key === 'End') ir(lista.length - 1);
    else if (e.key === 'Escape') { e.preventDefault(); fechar(); }
    else if (e.key === 'Tab') fechar(false);
  };

  return (
    <div ref={raiz} className="relative">
      <button
        ref={refGatilho}
        type="button"
        aria-label={rotulo}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? idMenu : undefined}
        onClick={() => setAberto((a) => !a)}
        className={classeDoGatilho ?? 'inline-flex size-8 items-center justify-center rounded-lg text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--raise)] transition-colors duration-150 cursor-pointer'}
      >
        {gatilho ?? <MoreHorizontal size={16} aria-hidden="true" />}
      </button>

      {aberto && (
        <div
          id={idMenu}
          role="menu"
          aria-label={rotulo}
          onKeyDown={onKeyDown}
          className="absolute right-0 top-full z-40 mt-1 min-w-48 rounded-xl border border-[var(--line)] bg-[var(--raise)] p-1 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.45)]"
        >
          {cabecalho && <div className="border-b border-[var(--line)] px-3 pb-2.5 pt-2 mb-1">{cabecalho}</div>}
          {itens.map((item, i) => (
            <button
              key={item.rotulo}
              ref={(el) => { itensRef.current[i] = el; }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => { fechar(false); item.onSelect(); }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 cursor-pointer hover:bg-[var(--panel)] focus-visible:bg-[var(--panel)] ${
                item.perigo ? 'text-[var(--sig-texto)]' : 'text-[var(--ink)] hover:text-[var(--ink-hi)]'
              }`}
            >
              {item.icone && <span aria-hidden="true" className="shrink-0 text-[var(--ink-lo)]">{item.icone}</span>}
              {item.rotulo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
