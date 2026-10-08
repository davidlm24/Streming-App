import { useEffect, useRef } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { CENAS, precisaDaTela, type Cena } from '../lib/cenas';
import { BotaoDeIcone } from './ui/BotaoDeIcone';
import { Button } from './ui/Button';

export type Transicao = 'corte' | 'fusao';

/** A duração da fusão, em ms. É a que o monitor de programa usa. */
export const DURACAO_DA_FUSAO = 400;

// A tecla de transição é um objeto próprio, não um botão fantasma qualquer:
// elevada pela sombra, com a borda que acende no aperto e a duração dentro
// dela. O contorno pesado saiu; o volume agora é luz, não traço.
const TECLA =
  'min-h-14 flex-col gap-0.5 border-transparent bg-[var(--raise)] text-[var(--ink-hi)] shadow-[var(--shadow-raise)] hover:border-[var(--line-ctl)] active:border-[var(--ink-lo)] active:bg-[var(--panel)]';

/**
 * Corte e Fusão: levam o preview ao programa. Ficam no trilho no desktop e,
 * no celular, logo abaixo do preview.
 */
export function BotoesDeTransicao({
  temMudanca,
  cortando,
  onCortar,
  compacto = false,
}: {
  temMudanca: boolean;
  cortando: boolean;
  onCortar: (transicao: Transicao) => void;
  /** Na coluna recolhida: uma tecla sobre a outra, e a frase só para o leitor de tela. */
  compacto?: boolean;
}) {
  const parado = !temMudanca || cortando;
  return (
    <div>
      <div className={`grid gap-2 ${compacto ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <Button variant="ghost" onClick={() => onCortar('corte')} disabled={parado} className={TECLA}>
          <span>Corte</span>
          <span className="font-mono text-xs font-normal tabular-nums text-[var(--ink-lo)]">0&nbsp;ms</span>
        </Button>
        <Button variant="ghost" onClick={() => onCortar('fusao')} disabled={parado} className={TECLA}>
          <span>Fusão</span>
          <span className="font-mono text-xs font-normal tabular-nums text-[var(--ink-lo)]">{DURACAO_DA_FUSAO}&nbsp;ms</span>
        </Button>
      </div>
      {!temMudanca && (
        <p className={compacto ? 'sr-only' : 'mt-2 text-pretty text-xs text-[var(--ink-lo)]'}>O preview está igual ao programa.</p>
      )}
    </div>
  );
}

interface TrilhoDeCenasProps {
  idDoPrograma: string;
  idDoPreview: string;
  /** A tela está sendo compartilhada: sem ela, as cenas com tela mostram só o vazio. */
  temTela: boolean;
  temMudanca: boolean;
  cortando: boolean;
  onEscolher: (cena: Cena) => void;
  onCortar: (transicao: Transicao) => void;
  /** Só no desktop: a coluna estreita, com o número de cada cena e as teclas uma sobre a outra. */
  recolhido: boolean;
  onRecolher: () => void;
}

/**
 * O trilho da esquerda do console: as cenas e a transição.
 *
 * Escolher uma cena leva a cena ao preview; "Corte" e "Fusão" levam o preview
 * ao programa. Antes as cenas existiam no código e não apareciam em lugar
 * nenhum, e o corte ficava escondido atrás de um "Studio Mode" desligado,
 * com o programa congelado no estado inicial.
 *
 * Recolhida, a coluna guarda o que não pode sumir durante a live: cada cena
 * vira uma tecla com o número e o estado em palavras, e Corte e Fusão ficam
 * uma sobre a outra. O nome inteiro vai no nome acessível e no `title`.
 */
export function TrilhoDeCenas({ idDoPrograma, idDoPreview, temTela, temMudanca, cortando, onEscolher, onCortar, recolhido, onRecolher }: TrilhoDeCenasProps) {
  // Recolher troca a coluna inteira, e o botão que tinha o foco sai com ela:
  // o foco vai ao botão que desfaz, em vez de cair no <body>
  const alternador = useRef<HTMLButtonElement>(null);
  const pediuPeloBotao = useRef(false);
  useEffect(() => {
    if (!pediuPeloBotao.current) return;
    pediuPeloBotao.current = false;
    alternador.current?.focus();
  }, [recolhido]);
  const alternar = () => {
    pediuPeloBotao.current = true;
    onRecolher();
  };

  const descrever = (cena: Cena) => {
    const noPrograma = cena.id === idDoPrograma;
    const noPreview = cena.id === idDoPreview;
    const semTela = precisaDaTela(cena) && !temTela;
    const estado = [noPrograma && 'programa', noPreview && 'preview'].filter(Boolean).join(' e ');
    const legenda = estado ? `${estado}${semTela ? ' · sem tela' : ''}` : semTela ? 'sem tela compartilhada' : '';
    return { noPrograma, noPreview, legenda };
  };

  // Uma tecla por cena, nas duas larguras. Aberta, o nome e o estado embaixo
  // dele, numa linha de altura fixa: com a palavra ao lado, "Tela com câmera"
  // quebrava ao virar programa, e cada corte mexia a lista sob o ponteiro.
  // Recolhida, o número no lugar do nome, que vai no nome acessível e no title.
  const lista = (
    <ul className="space-y-1">
      {CENAS.map((cena, i) => {
        const { noPrograma, noPreview, legenda } = descrever(cena);
        return (
          <li key={cena.id}>
            <button
              type="button"
              onClick={() => onEscolher(cena)}
              aria-current={noPreview ? 'true' : undefined}
              aria-label={recolhido ? (legenda ? `${cena.nome}, ${legenda}` : cena.nome) : undefined}
              title={cena.nome}
              className={`flex w-full flex-col justify-center rounded-xl py-2 transition-colors duration-150 cursor-pointer ${
                recolhido ? 'min-h-16 items-center px-1 text-center' : 'min-h-14 px-2 text-left'
              } ${noPreview ? 'bg-[var(--raise)]' : 'hover:bg-[var(--panel)]'}`}
            >
              {recolhido ? (
                <>
                  <span aria-hidden="true" className="block text-sm font-medium tabular-nums text-[var(--ink-hi)]">
                    {i + 1}
                  </span>
                  {noPrograma && (
                    <span aria-hidden="true" className="block text-xs font-medium text-[var(--ink-hi)]">
                      programa
                    </span>
                  )}
                  {noPreview && (
                    <span aria-hidden="true" className="block text-xs text-[var(--ink-lo)]">
                      preview
                    </span>
                  )}
                </>
              ) : (
                <>
                  {/* Uma linha cada, mesmo com a coluna estreitada: o texto que quebrava fazia a linha crescer */}
                  <span className="block max-w-full truncate text-sm text-[var(--ink-hi)]">{cena.nome}</span>
                  {legenda && (
                    <span className={`block max-w-full truncate text-xs ${noPrograma ? 'font-medium text-[var(--ink-hi)]' : 'text-[var(--ink-lo)]'}`}>
                      {legenda}
                    </span>
                  )}
                </>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  if (recolhido) {
    return (
      <div className="flex flex-col gap-4 px-2 py-3">
        <BotaoDeIcone ref={alternador} rotulo="Mostrar os nomes das cenas" aria-expanded={false} onClick={alternar} className="self-center">
          <PanelLeftOpen size={18} aria-hidden="true" />
        </BotaoDeIcone>
        <section aria-labelledby="estudio-cenas">
          <h2 id="estudio-cenas" className="sr-only">
            Cenas
          </h2>
          {lista}
        </section>
        <section aria-labelledby="estudio-transicao" className="border-t border-[var(--line)] pt-4">
          <h2 id="estudio-transicao" className="sr-only">
            Transição
          </h2>
          <BotoesDeTransicao temMudanca={temMudanca} cortando={cortando} onCortar={onCortar} compacto />
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col py-4">
      <section aria-labelledby="estudio-cenas" className="px-2">
        <div className="flex items-center justify-between gap-2 pb-2 pl-2 lg:-mt-2 lg:pb-0">
          <h2 id="estudio-cenas" className="text-xs text-[var(--ink-lo)]">
            Cenas
          </h2>
          <span className="hidden lg:inline-flex">
            <BotaoDeIcone ref={alternador} rotulo="Recolher as cenas" aria-expanded={true} onClick={alternar}>
              <PanelLeftClose size={18} aria-hidden="true" />
            </BotaoDeIcone>
          </span>
        </div>
        {lista}
      </section>

      {/* No celular a transição fica logo abaixo do preview (MesaDeMonitores) */}
      <section aria-labelledby="estudio-transicao" className="mt-4 hidden border-t border-[var(--line)] px-4 pt-4 lg:block">
        <h2 id="estudio-transicao" className="pb-2 text-xs text-[var(--ink-lo)]">
          Transição
        </h2>
        <BotoesDeTransicao temMudanca={temMudanca} cortando={cortando} onCortar={onCortar} />
      </section>
    </div>
  );
}
