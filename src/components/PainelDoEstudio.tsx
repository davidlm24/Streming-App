import type { ReactNode } from 'react';
import { Film, LayoutGrid, Layers, MessageSquare, QrCode, ScrollText, SlidersHorizontal } from 'lucide-react';
import { useTabs } from './ui/Tabs';

/** Os ids são os das abas do LeftSidebar, que desenha o conteúdo de cada uma. */
export type Ferramenta = 'seven' | 'design' | 'third' | 'apps' | 'video' | 'theme' | 'widgets';

const FERRAMENTAS: { id: Ferramenta; rotulo: string; descricao: string; Icone: typeof MessageSquare }[] = [
  { id: 'seven', rotulo: 'Chat', descricao: 'Chat do estúdio', Icone: MessageSquare },
  { id: 'design', rotulo: 'Gráficos', descricao: 'Logo, banners, tickers, overlays e fundos', Icone: Layers },
  { id: 'third', rotulo: 'Roteiro', descricao: 'Roteiro e teleprompter', Icone: ScrollText },
  { id: 'apps', rotulo: 'QR code', descricao: 'QR code e notas do apresentador', Icone: QrCode },
  { id: 'video', rotulo: 'Mídia', descricao: 'Vídeos e trilha sonora', Icone: Film },
  { id: 'theme', rotulo: 'Estilo', descricao: 'Cores, texto, enquadramento, croma e cronômetro', Icone: SlidersHorizontal },
  { id: 'widgets', rotulo: 'Extras', descricao: 'Chat no palco, lousa e captura de quadro', Icone: LayoutGrid },
];

export const FERRAMENTA_INICIAL: Ferramenta = 'seven';

/**
 * A coluna da direita do console: o painel da ferramenta aberta e, na borda,
 * a lista das ferramentas.
 *
 * Era um trilho de onze botões em caixa alta com 7 e 8px, azul no atual,
 * mais um "SMART" que, durante a "live", escondia tudo menos o chat. Saíram
 * as abas de agenda (agendar é em Webinars), de audiência (só se enchia com
 * um botão de usuário de teste) e de ajustes, que misturava o que já está na
 * bandeja com transmissão, gravação e OBS que ainda não existem.
 */
export function PainelDoEstudio({
  ativa,
  onEscolher,
  children,
}: {
  ativa: Ferramenta;
  onEscolher: (ferramenta: Ferramenta) => void;
  children: ReactNode;
}) {
  const abas = useTabs(
    'estudio-ferramentas',
    FERRAMENTAS.map((f) => f.id),
    ativa,
    onEscolher,
    'vertical',
  );

  return (
    <div className="flex h-full min-h-0">
      <div {...abas.panel(ativa)} className="min-w-0 flex-1 overflow-y-auto">
        {children}
      </div>
      <div
        {...abas.tablist}
        aria-label="Ferramentas"
        className="flex w-[4.5rem] shrink-0 flex-col gap-1 overflow-y-auto border-l border-[var(--line)] p-1.5"
      >
        {FERRAMENTAS.map(({ id, rotulo, descricao, Icone }) => {
          const atual = id === ativa;
          return (
            <button
              key={id}
              type="button"
              {...abas.tab(id)}
              onClick={() => onEscolher(id)}
              title={descricao}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs transition-colors duration-150 cursor-pointer ${
                atual ? 'bg-[var(--raise)] text-[var(--ink-hi)]' : 'text-[var(--ink-lo)] hover:bg-[var(--panel)] hover:text-[var(--ink-hi)]'
              }`}
            >
              <Icone size={18} aria-hidden="true" />
              <span className="max-w-full truncate">{rotulo}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
