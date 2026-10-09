import { CENA_GRADE, precisaDaTela, type Cena } from '../lib/cenas';
import { Button } from './ui/Button';

export type Transicao = 'corte' | 'fusao';

/** A duração da fusão, em ms. É a que o monitor de programa usa (FUSAO_NO_PALCO_MS copia). */
export const DURACAO_DA_FUSAO = 400;

// A tecla de transição é um objeto próprio, não um botão fantasma qualquer:
// elevada pela sombra, com a borda que acende no aperto e a duração dentro
// dela. O contorno pesado saiu; o volume agora é luz, não traço.
const TECLA =
  'min-h-14 flex-col gap-0.5 border-transparent bg-[var(--raise)] text-[var(--ink-hi)] shadow-[var(--shadow-raise)] hover:border-[var(--line-ctl)] active:border-[var(--ink-lo)] active:bg-[var(--panel)]';

/** Corte e Fusão: levam o preview ao programa. Moram na caixa do próximo corte, que diz o que elas levam. */
export function BotoesDeTransicao({
  temMudanca,
  cortando,
  onCortar,
  compacto = false,
}: {
  temMudanca: boolean;
  cortando: boolean;
  onCortar: (transicao: Transicao) => void;
  /** Lado a lado é o normal; `compacto` empilha (não usado hoje; fica para colunas estreitas). */
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
    </div>
  );
}

// ── Os ícones das cenas ──────────────────────────────────────────────────────
// Cada cena é um diagrama do arranjo, não uma frase: uma pessoa é a silhueta,
// a tela é a caixa com linhas, como nos consoles de referência. O nome inteiro
// e o estado ficam no nome acessível e no title.

/** A silhueta de uma pessoa (cabeça e ombros), centrada na caixa dada. */
function Pessoa({ cx, cy, escala = 1 }: { cx: number; cy: number; escala?: number }) {
  const r = 2.1 * escala;
  const ombro = 3.4 * escala;
  return (
    <g fill="currentColor">
      <circle cx={cx} cy={cy - 1.4 * escala} r={r} />
      <path d={`M ${cx - ombro} ${cy + 3.4 * escala} a ${ombro} ${ombro} 0 0 1 ${2 * ombro} 0 Z`} />
    </g>
  );
}

/** O conteúdo de uma tela: duas linhas, como um documento à mostra. */
function Tela({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.7">
      <line x1={x} y1={y} x2={x + w} y2={y} />
      <line x1={x} y1={y + 3.2} x2={x + w * 0.62} y2={y + 3.2} />
    </g>
  );
}

const Caixa = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => (
  <rect x={x} y={y} width={w} height={h} rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
);

/** O diagrama de uma cena, pelo id dela. */
export function IconeDaCena({ id }: { id: string }) {
  const desenho = (() => {
    switch (id) {
      case 'cena-camera':
        return (
          <>
            <Caixa x={1} y={1} w={34} h={18} />
            <Pessoa cx={18} cy={10} escala={1.4} />
          </>
        );
      case 'cena-tela-e-camera':
        return (
          <>
            <Caixa x={1} y={1} w={34} h={18} />
            <Tela x={5} y={6} w={17} />
            <rect x={22.5} y={10.5} width={10} height={6.5} rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <Pessoa cx={27.5} cy={14.4} escala={0.62} />
          </>
        );
      case 'cena-lado-a-lado':
        return (
          <>
            <Caixa x={1} y={1} w={24} h={18} />
            <Tela x={5} y={7} w={16} />
            <Caixa x={27} y={6} w={8} h={8} />
            <Pessoa cx={31} cy={10.4} escala={0.62} />
          </>
        );
      case 'cena-metades':
        return (
          <>
            <Caixa x={1} y={5} w={16} h={10} />
            <Pessoa cx={9} cy={10.4} escala={0.85} />
            <Caixa x={19} y={5} w={16} h={10} />
            <Tela x={22} y={9} w={10} />
          </>
        );
      case 'cena-camera-em-destaque':
        return (
          <>
            <Caixa x={1} y={1} w={24} h={18} />
            <Pessoa cx={13} cy={10} escala={1.2} />
            <Caixa x={27} y={6} w={8} h={8} />
            <Tela x={28.6} y={9} w={4.8} />
          </>
        );
      case 'cena-tela':
        return (
          <>
            <Caixa x={1} y={1} w={34} h={18} />
            <Tela x={6} y={7} w={24} />
          </>
        );
      case CENA_GRADE.id:
        return (
          <>
            <Caixa x={1} y={1} w={16} h={8.5} />
            <Pessoa cx={9} cy={5.6} escala={0.62} />
            <Caixa x={19} y={1} w={16} h={8.5} />
            <Pessoa cx={27} cy={5.6} escala={0.62} />
            <Caixa x={1} y={10.5} w={16} h={8.5} />
            <Pessoa cx={9} cy={15.1} escala={0.62} />
            <Caixa x={19} y={10.5} w={16} h={8.5} />
            <Pessoa cx={27} cy={15.1} escala={0.62} />
          </>
        );
      default:
        return <Caixa x={1} y={1} w={34} h={18} />;
    }
  })();
  return (
    <svg viewBox="0 0 36 20" width="36" height="20" aria-hidden="true" focusable="false">
      {desenho}
    </svg>
  );
}

interface IconesDeCenaProps {
  cenas: Cena[];
  idDoPrograma: string;
  idDoPreview: string;
  /** A tela está sendo compartilhada (ou um clipe/PDF no lugar dela): sem ela, as cenas com tela avisam no title. */
  temTela: boolean;
  /** O programa está indo aos canais: o ponto da cena no programa fica no carmim do ar. */
  aoVivo: boolean;
  onEscolher: (cena: Cena) => void;
}

/**
 * As cenas como uma fileira de diagramas sob o preview — é nele que a cena
 * escolhida entra. A que está no preview fica elevada; a que está no programa
 * carrega um ponto (carmim só no ar, Regra do Ar). Tudo o mais vai em
 * palavras no nome acessível, não na tela: a fileira é o lugar mais olhado e
 * o mais apertado do console.
 */
export function IconesDeCena({ cenas, idDoPrograma, idDoPreview, temTela, aoVivo, onEscolher }: IconesDeCenaProps) {
  return (
    <section aria-label="Cenas">
      <ul className="flex flex-wrap items-center gap-1.5">
        {cenas.map((cena) => {
          const noPreview = cena.id === idDoPreview;
          const noPrograma = cena.id === idDoPrograma;
          const semTela = precisaDaTela(cena) && !temTela;
          const estado = [noPrograma && 'no programa', noPreview && 'no preview', semTela && 'sem tela compartilhada']
            .filter(Boolean)
            .join(', ');
          return (
            <li key={cena.id}>
              <button
                type="button"
                onClick={() => onEscolher(cena)}
                aria-current={noPreview ? 'true' : undefined}
                aria-label={estado ? `${cena.nome} (${estado})` : cena.nome}
                title={estado ? `${cena.nome} · ${estado}` : cena.nome}
                className={`relative flex h-11 w-14 items-center justify-center rounded-xl transition-colors duration-150 cursor-pointer ${
                  noPreview
                    ? 'bg-[var(--raise)] text-[var(--ink-hi)] shadow-[var(--shadow-ctl)]'
                    : 'text-[var(--ink-lo)] hover:bg-[var(--panel)] hover:text-[var(--ink)]'
                } ${semTela ? 'opacity-60' : ''}`}
              >
                <IconeDaCena id={cena.id} />
                {noPrograma && (
                  <span
                    aria-hidden="true"
                    className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${aoVivo ? 'bg-[var(--color-sig)]' : 'bg-[var(--ink-hi)]'}`}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
