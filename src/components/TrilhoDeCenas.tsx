import { CENAS, precisaDaTela, type Cena } from '../lib/cenas';
import { Button } from './ui/Button';

export type Transicao = 'corte' | 'fusao';

/** A duração da fusão, em ms. É a que o monitor de programa usa. */
export const DURACAO_DA_FUSAO = 400;

// A tecla de transição é um objeto próprio, não um botão fantasma qualquer:
// elevada, com a borda que acende no aperto e a duração dentro dela.
const TECLA =
  'min-h-14 flex-col gap-0.5 border-[var(--line-ctl)] bg-[var(--raise)] text-[var(--ink-hi)] hover:border-[var(--ink-lo)] active:border-[var(--ink-hi)] active:bg-[var(--panel)]';

/**
 * Corte e Fusão: levam o preview ao programa. Ficam no trilho no desktop e,
 * no celular, logo abaixo do preview.
 */
export function BotoesDeTransicao({
  temMudanca,
  cortando,
  onCortar,
}: {
  temMudanca: boolean;
  cortando: boolean;
  onCortar: (transicao: Transicao) => void;
}) {
  const parado = !temMudanca || cortando;
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" onClick={() => onCortar('corte')} disabled={parado} className={TECLA}>
          <span>Corte</span>
          <span className="font-mono text-xs font-normal tabular-nums text-[var(--ink-lo)]">0&nbsp;ms</span>
        </Button>
        <Button variant="ghost" onClick={() => onCortar('fusao')} disabled={parado} className={TECLA}>
          <span>Fusão</span>
          <span className="font-mono text-xs font-normal tabular-nums text-[var(--ink-lo)]">{DURACAO_DA_FUSAO}&nbsp;ms</span>
        </Button>
      </div>
      {!temMudanca && <p className="mt-2 text-pretty text-xs text-[var(--ink-lo)]">O preview está igual ao programa.</p>}
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
}

/**
 * O trilho da esquerda do console: as cenas e a transição.
 *
 * Escolher uma cena leva a cena ao preview; "Corte" e "Fusão" levam o preview
 * ao programa. Antes as cenas existiam no código e não apareciam em lugar
 * nenhum, e o corte ficava escondido atrás de um "Studio Mode" desligado,
 * com o programa congelado no estado inicial.
 */
export function TrilhoDeCenas({ idDoPrograma, idDoPreview, temTela, temMudanca, cortando, onEscolher, onCortar }: TrilhoDeCenasProps) {
  return (
    <div className="flex flex-col py-4">
      <section aria-labelledby="estudio-cenas" className="px-2">
        <h2 id="estudio-cenas" className="px-2 pb-2 text-xs text-[var(--ink-lo)]">
          Cenas
        </h2>
        <ul className="space-y-1">
          {CENAS.map((cena) => {
            const noPrograma = cena.id === idDoPrograma;
            const noPreview = cena.id === idDoPreview;
            const semTela = precisaDaTela(cena) && !temTela;
            const estado = [noPrograma && 'programa', noPreview && 'preview'].filter(Boolean).join(' e ');
            const legenda = estado ? `${estado}${semTela ? ' · sem tela' : ''}` : semTela ? 'sem tela compartilhada' : '';
            // O estado vai embaixo do nome, e a linha tem altura fixa: com a
            // palavra ao lado, "Tela com câmera" quebrava quando virava
            // programa, e cada corte mexia a lista embaixo do ponteiro.
            return (
              <li key={cena.id}>
                <button
                  type="button"
                  onClick={() => onEscolher(cena)}
                  aria-current={noPreview ? 'true' : undefined}
                  className={`flex min-h-14 w-full flex-col justify-center rounded-xl px-2 py-2 text-left transition-colors duration-150 cursor-pointer ${
                    noPreview ? 'bg-[var(--raise)]' : 'hover:bg-[var(--panel)]'
                  }`}
                >
                  <span className="block text-sm text-[var(--ink-hi)]">{cena.nome}</span>
                  {legenda && (
                    <span className={`block text-xs ${noPrograma ? 'font-medium text-[var(--ink-hi)]' : 'text-[var(--ink-lo)]'}`}>
                      {legenda}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
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
