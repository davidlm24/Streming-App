import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
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
  /** `cima` para gatilhos no pé da tela (a bandeja do estúdio), onde o menu abrindo para baixo sairia dela. */
  lado?: 'baixo' | 'cima';
  /** De que lado do gatilho o menu se alinha; `esquerda` para gatilhos colados à borda esquerda. */
  alinhar?: 'direita' | 'esquerda';
}

/**
 * Menu de ações secundárias, atrás de um botão "⋯".
 *
 * Existe para que cada linha de lista tenha UMA ação visível: antes, cada
 * webinar do painel carregava três botões (Inscrições, Criar Capa, Acessar
 * Estúdio), cada um de uma cor. Padrão WAI-ARIA Menu Button: setas movem,
 * Home/End vão às pontas, Esc fecha e devolve o foco ao gatilho, clicar fora
 * fecha.
 *
 * Escolher um item também devolve o foco ao gatilho, antes da ação. O diálogo
 * que ela abre (a confirmação de "Remover canal", o modal de canais) guarda
 * quem tem o foco ao abrir e o devolve ali ao fechar. Com o foco no item, que
 * some junto com o menu, ele caía no <body> e o teclado perdia o lugar na lista.
 */
export function Menu({ rotulo, itens, gatilho, classeDoGatilho, cabecalho, lado = 'baixo', alinhar = 'direita' }: MenuProps) {
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
          // O menu nasce do gatilho, não do centro: a origem da escala fica no
          // canto que o ancora, e a entrada é curta (150ms) com fade + zoom.
          className={`absolute ${alinhar === 'esquerda' ? 'left-0' : 'right-0'} ${lado === 'cima' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} ${
            lado === 'cima'
              ? alinhar === 'esquerda' ? 'origin-bottom-left' : 'origin-bottom-right'
              : alinhar === 'esquerda' ? 'origin-top-left' : 'origin-top-right'
          } z-40 min-w-48 rounded-2xl border border-[var(--line)] bg-[var(--raise)] p-1.5 shadow-[var(--shadow-menu)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-150`}
        >
          {cabecalho && <div className="border-b border-[var(--line)] px-3 pb-2.5 pt-2 mb-1">{cabecalho}</div>}
          {itens.map((item, i) => (
            <button
              key={item.rotulo}
              ref={(el) => { itensRef.current[i] = el; }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => { fechar(); item.onSelect(); }}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors duration-150 cursor-pointer hover:bg-[var(--panel)] focus-visible:bg-[var(--panel)] ${
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

/**
 * O foco de uma lista com "⋯" quando a linha que o tem sai dela: o canal
 * removido depois da confirmação do banco, o webinar excluído. Sem isto o foco
 * cai no <body> junto com a linha, e quem usa teclado perde o lugar na lista.
 *
 * Vai ao "⋯" da linha que ficou no lugar dela, ou ao da anterior se ela era a
 * última; com a lista vazia, ao título da página. Só quando o foco saiu junto
 * com a linha: se a pessoa já foi a outro lugar, ele fica lá.
 *
 *   const foco = useFocoNaLista();
 *   <CabecalhoDePagina refDoTitulo={foco.titulo} … />
 *   <ul {...foco.lista}>{cada linha, um <li> com o seu <Menu>}</ul>
 */
export function useFocoNaLista() {
  const lista = useRef<HTMLUListElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  // A última linha que teve o foco, e a posição dela. O diálogo aberto dali
  // (a confirmação) fica fora da lista e não a troca: é a ela que o foco volta.
  const ultima = useRef<{ linha: Element; posicao: number } | null>(null);

  const linhas = () => Array.from(lista.current?.children ?? []);

  const onFocus = (e: React.FocusEvent) => {
    const todas = linhas();
    const linha = todas.find((li) => li.contains(e.target));
    if (linha) ultima.current = { linha, posicao: todas.indexOf(linha) };
  };

  // Sem dependências: a linha sai por qualquer mudança da lista. De layout, e
  // não comum, para o foco chegar à vizinha antes de a tela ser pintada.
  useLayoutEffect(() => {
    const antes = ultima.current;
    if (!antes) return;
    const todas = linhas();
    if (antes.linha.isConnected) {
      // A linha continua; outras podem ter entrado ou saído antes dela
      antes.posicao = todas.indexOf(antes.linha);
      return;
    }
    ultima.current = null;
    const comFoco = document.activeElement;
    if (comFoco && comFoco !== document.body) return;
    const vizinha = todas[Math.min(antes.posicao, todas.length - 1)];
    (vizinha?.querySelector<HTMLElement>('[aria-haspopup="menu"]') ?? titulo.current)?.focus();
  });

  return { lista: { ref: lista, onFocus }, titulo };
}
