import type { ReactNode, Ref } from 'react';
import { AudioLines, Camera, Eye, Film, Layers, MessageSquare, PanelRightClose, PanelRightOpen, QrCode, ScrollText, Users } from 'lucide-react';
import { BotaoDeIcone } from './ui/BotaoDeIcone';
import { Button } from './ui/Button';
import { useTabs } from './ui/Tabs';

export type Ferramenta = 'chat' | 'convidados' | 'graficos' | 'roteiro' | 'qr' | 'midia' | 'camera' | 'audio';

const FERRAMENTAS: { id: Ferramenta; rotulo: string; descricao: string; Icone: typeof MessageSquare }[] = [
  { id: 'chat', rotulo: 'Chat', descricao: 'Chat do estúdio', Icone: MessageSquare },
  { id: 'convidados', rotulo: 'Sala', descricao: 'Convidados: o link da sala e quem entrou por ele', Icone: Users },
  { id: 'graficos', rotulo: 'Gráficos', descricao: 'Banner, ticker, logo, cronômetro, cor, fundo e sobreposição', Icone: Layers },
  { id: 'roteiro', rotulo: 'Roteiro', descricao: 'Roteiro, teleprompter e notas', Icone: ScrollText },
  { id: 'qr', rotulo: 'QR code', descricao: 'QR code com título e preço', Icone: QrCode },
  { id: 'midia', rotulo: 'Mídia', descricao: 'Clipes de vídeo e apresentação em PDF', Icone: Film },
  { id: 'camera', rotulo: 'Câmera', descricao: 'Qualidade, card, enquadramento, espelho e croma', Icone: Camera },
  { id: 'audio', rotulo: 'Áudio', descricao: 'Redução de ruído, cancelamento de eco e ganho automático', Icone: AudioLines },
];

export const FERRAMENTA_INICIAL: Ferramenta = 'chat';

/**
 * A coluna da direita do console: o painel da ferramenta aberta e, na borda,
 * a lista das ferramentas.
 *
 * Era um trilho de onze botões em caixa alta com 7 e 8px, azul no atual,
 * mais um "SMART" que, durante a "live", escondia tudo menos o chat. Saíram
 * as abas de agenda (agendar é em Webinars), de audiência (só se enchia com
 * um botão de usuário de teste) e de ajustes, que misturava o que já está na
 * bandeja com transmissão, gravação e OBS que ainda não existem. Na fase 2
 * saiu Extras (chat flutuante, lousa e captura, que não chegavam ao
 * programa ou não mostravam o palco), e Estilo virou Câmera.
 *
 * No desktop o painel recolhe e fica só a lista, para os monitores ganharem
 * a largura; escolher uma ferramenta com ele recolhido o abre de novo.
 */
export function PainelDoEstudio({
  ativa,
  onEscolher,
  onVerPreview,
  botaoVerPreviewRef,
  recolhido,
  onRecolher,
  children,
}: {
  ativa: Ferramenta;
  onEscolher: (ferramenta: Ferramenta) => void;
  onVerPreview: () => void;
  botaoVerPreviewRef: Ref<HTMLButtonElement>;
  recolhido: boolean;
  onRecolher: () => void;
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
    // No desktop, a coluna tem a altura do console e o painel rola por dentro.
    // Abaixo de lg, o painel cresce com a página e a lista das ferramentas
    // fica presa no alto enquanto ele passa. A linha entre os dois é do
    // painel, para ir até o fim dele.
    <div className="flex lg:h-full lg:min-h-0">
      <div
        {...abas.panel(ativa)}
        className={`min-w-0 flex-1 border-r border-[var(--line)] lg:overflow-y-auto ${recolhido ? 'lg:hidden' : ''}`}
      >
        <div className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-1 lg:hidden">
          <Button
            ref={botaoVerPreviewRef}
            variant="ghost"
            size="sm"
            icon={<Eye size={16} aria-hidden="true" />}
            onClick={onVerPreview}
            className="min-h-11 w-full"
          >
            Ver preview
          </Button>
        </div>
        {children}
      </div>
      {/* A tablist só tem abas: o botão de recolher fica ao lado dela, no mesmo trilho */}
      <div className="sticky top-0 flex w-[4.5rem] shrink-0 flex-col self-start p-1.5 lg:static lg:self-stretch lg:overflow-y-auto">
        <div {...abas.tablist} aria-label="Ferramentas" className="flex flex-col gap-1">
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
                atual ? 'bg-[var(--raise)] text-[var(--ink-hi)] shadow-[var(--shadow-ctl)]' : 'text-[var(--ink-lo)] hover:bg-[var(--panel)] hover:text-[var(--ink-hi)]'
              }`}
            >
              <Icone size={18} aria-hidden="true" />
              <span className="max-w-full truncate">{rotulo}</span>
            </button>
          );
        })}
        </div>
        <span className="mt-auto hidden justify-center pt-2 lg:flex">
          <BotaoDeIcone rotulo={recolhido ? 'Abrir o painel' : 'Recolher o painel'} aria-expanded={!recolhido} onClick={onRecolher}>
            {recolhido ? <PanelRightOpen size={18} aria-hidden="true" /> : <PanelRightClose size={18} aria-hidden="true" />}
          </BotaoDeIcone>
        </span>
      </div>
    </div>
  );
}
