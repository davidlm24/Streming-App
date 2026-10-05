import { useId, useRef, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowDownLeft, ArrowDownRight, ArrowUpLeft, ArrowUpRight, CircleAlert, Plus } from 'lucide-react';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { ErroDeCampo } from './ui/ErroDeCampo';
import type { CantoDoPalco } from '../types';
import { CANTOS } from '../lib/graficos';
import { fraseDaLeitura, fraseDoUso, useMidiaDoEstudio, type ChegadaDaMidia, type TipoDeMidia } from '../context/MidiaDoEstudio';

/**
 * As peças dos painéis do estúdio. Os painéis são uma coluna de ~260px ao
 * lado do trilho de ferramentas: seções abertas por uma linha, sem cartões,
 * na caixa normal. Antes cada seção era um cartão com título em caixa alta,
 * alvos de 16 a 28px e o azul da marca como seleção.
 */

export function SecaoDoPainel({
  titulo,
  acao,
  estado,
  dica,
  children,
}: {
  titulo: string;
  acao?: ReactNode;
  /** Onde o gráfico da seção está (`EstadoNoPalco`), logo embaixo do título. */
  estado?: ReactNode;
  dica?: ReactNode;
  children?: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="border-t border-[var(--line)] px-4 py-4 first:border-t-0">
      <div className="flex min-h-8 items-center justify-between gap-3">
        <h3 id={id} className="text-sm font-medium text-[var(--ink-hi)]">
          {titulo}
        </h3>
        {acao}
      </div>
      {estado}
      {dica && <p className="mt-1 text-pretty text-xs text-[var(--ink-lo)]">{dica}</p>}
      {children && <div className="mt-3 space-y-3">{children}</div>}
    </section>
  );
}

/** Onde um gráfico está, nas palavras das cenas: "no programa", "no preview" ou "no programa e no preview". */
export function ondeEsta(noPrograma: boolean, noPreview: boolean): string | null {
  if (noPrograma && noPreview) return 'no programa e no preview';
  if (noPrograma) return 'no programa';
  if (noPreview) return 'no preview';
  return null;
}

/**
 * O estado de um gráfico num painel, com o peso das cenas: no programa, em
 * 500 `--ink-hi`; só no preview, em `--ink-lo`. `extra` vem depois de um
 * ponto (ex.: "não salvo"). Antes os painéis diziam só "no preview", e o que
 * estava no programa não aparecia em lugar nenhum.
 */
export function EstadoNoPalco({ noPrograma, noPreview, extra }: { noPrograma: boolean; noPreview: boolean; extra?: ReactNode }) {
  const onde = ondeEsta(noPrograma, noPreview);
  if (!onde && !extra) return null;
  return (
    <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-xs">
      {onde && <span className={noPrograma ? 'font-medium text-[var(--ink-hi)]' : 'text-[var(--ink-lo)]'}>{onde}</span>}
      {onde && extra && (
        <>
          <span aria-hidden="true" className="text-[var(--ink-lo)]">
            ·
          </span>
          <span className="sr-only">,</span>
        </>
      )}
      {extra}
    </p>
  );
}

/**
 * A linha de falha ao salvar de um painel, como a do sistema: o alerta de
 * 16px e a frase em `text-sm` `--ink-hi`, terminada por "Tentar de novo".
 * Sem `onTentarDeNovo` a frase fica sem o botão: quando a única saída é mudar
 * o conteúdo (um texto grande demais), tentar de novo só falharia outra vez.
 */
export function FalhaNoPainel({ frase, onTentarDeNovo }: { frase: string; onTentarDeNovo?: () => void }) {
  return (
    <p role="alert" className="flex items-start gap-2 text-pretty text-sm text-[var(--ink-hi)]">
      <CircleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
      <span>
        {frase}
        {onTentarDeNovo && (
          <>
            {' '}
            <AcaoDeTexto sublinhada onClick={onTentarDeNovo}>
              Tentar de novo
            </AcaoDeTexto>
          </>
        )}
      </span>
    </p>
  );
}

/**
 * As setas num grupo de opções (`role="radiogroup"`), como num grupo de
 * rádios do sistema: só a opção marcada entra no Tab, e as setas levam o foco
 * à vizinha e a marcam. Numa grade, ↑ e ↓ pulam uma linha. Antes cada opção
 * era uma parada do Tab.
 */
export function useSetasDoGrupo(total: number, marcada: number, escolher: (indice: number) => void, colunas = total) {
  const opcoes = useRef<(HTMLButtonElement | null)[]>([]);
  const naVez = marcada >= 0 && marcada < total ? marcada : 0;
  const aoTeclar = (indice: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    let alvo: number | null = null;
    if (e.key === 'ArrowRight') alvo = (indice + 1) % total;
    else if (e.key === 'ArrowLeft') alvo = (indice - 1 + total) % total;
    else if (e.key === 'ArrowDown') alvo = indice + colunas < total ? indice + colunas : null;
    else if (e.key === 'ArrowUp') alvo = indice - colunas >= 0 ? indice - colunas : null;
    else if (e.key === 'Home') alvo = 0;
    else if (e.key === 'End') alvo = total - 1;
    else return;
    e.preventDefault();
    if (alvo === null) return;
    opcoes.current[alvo]?.focus();
    escolher(alvo);
  };
  return (indice: number) => ({
    ref: (el: HTMLButtonElement | null) => {
      opcoes.current[indice] = el;
    },
    tabIndex: indice === naVez ? 0 : -1,
    onKeyDown: aoTeclar(indice),
  });
}

/** Uma escolha com o nome em cima: numa coluna estreita, nome e controle lado a lado não cabem. */
export function EscolhaDoPainel({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <p aria-hidden="true" className="mb-1 text-xs text-[var(--ink)]">
        {rotulo}
      </p>
      {children}
    </div>
  );
}

/** Um valor numérico com o nome em cima e a medida em mono à direita. */
export function Deslizante({
  rotulo,
  valor,
  min,
  max,
  passo = 1,
  medida,
  onChange,
  desativado = false,
}: {
  rotulo: string;
  valor: number;
  min: number;
  max: number;
  passo?: number;
  /** O valor como se lê: "12%", "1,5×". */
  medida: string;
  onChange: (valor: number) => void;
  desativado?: boolean;
}) {
  // O campo mora dentro do rótulo: o nome vem do texto dele, sem depender de id
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-[var(--ink)]">{rotulo}</span>
        <span aria-hidden="true" className="font-mono text-xs tabular-nums text-[var(--ink-lo)]">
          {medida}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={passo}
        value={valor}
        disabled={desativado}
        aria-valuetext={medida}
        onChange={(e) => onChange(Number(e.target.value))}
        className="deslizante mt-1 w-full"
      />
    </label>
  );
}

const ICONE_DO_CANTO: Record<CantoDoPalco, typeof ArrowUpLeft> = {
  'cima-esquerda': ArrowUpLeft,
  'cima-direita': ArrowUpRight,
  'baixo-esquerda': ArrowDownLeft,
  'baixo-direita': ArrowDownRight,
};

/** Os quatro cantos do palco, na posição em que ficam na imagem. Sem valor, nenhum marcado: o gráfico está solto. */
export function SeletorDeCanto({
  rotulo,
  valor,
  onChange,
}: {
  rotulo: string;
  valor: CantoDoPalco | null;
  onChange: (canto: CantoDoPalco) => void;
}) {
  const setas = useSetasDoGrupo(
    CANTOS.length,
    CANTOS.findIndex((c) => c.valor === valor),
    (i) => onChange(CANTOS[i].valor),
    2,
  );
  return (
    <div role="radiogroup" aria-label={rotulo} className="grid w-fit grid-cols-2 gap-1 rounded-xl border border-[var(--line-ctl)] p-0.5">
      {CANTOS.map(({ valor: canto, rotulo: nome }, i) => {
        const Icone = ICONE_DO_CANTO[canto];
        const marcado = valor === canto;
        return (
          <button
            key={canto}
            {...setas(i)}
            type="button"
            role="radio"
            aria-checked={marcado}
            aria-label={nome}
            title={nome}
            onClick={() => onChange(canto)}
            className={`flex size-11 items-center justify-center rounded-[10px] transition-colors duration-150 cursor-pointer ${
              marcado ? 'bg-[var(--raise)] text-[var(--ink-hi)]' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
            }`}
          >
            <Icone size={16} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

/** Os arquivos de uma seção que não abriram, contados. */
function fraseDasFalhas(tipo: TipoDeMidia, quantos: number): string {
  if (tipo === 'clipe') return quantos === 1 ? 'Um clipe não abriu nesta tela.' : `${quantos} clipes não abriram nesta tela.`;
  return quantos === 1 ? 'Uma imagem não abriu nesta tela.' : `${quantos} imagens não abriram nesta tela.`;
}

/**
 * Onde a mídia fica, numa linha, no fim da seção: na conta, com quanto ela já
 * guarda do limite. Quando a lista não abre, a falha com a nova tentativa; e
 * quando um arquivo da seção não chega a esta aba, a falha dela, perto do
 * quadro que não abriu. Antes a mídia ficava só no navegador, e a nota dizia
 * isso.
 */
export function NotaDaMidia({
  tipo,
  anunciaFalha = true,
}: {
  tipo: TipoDeMidia;
  /** A lista que não abriu é uma falha só: num painel com várias seções de mídia, só a primeira a diz. */
  anunciaFalha?: boolean;
}) {
  const midia = useMidiaDoEstudio();
  if (midia.leitura === 'indisponivel') {
    return anunciaFalha ? <FalhaNoPainel frase={fraseDaLeitura(midia.motivoDaLeitura)} onTentarDeNovo={midia.tentarDeNovo} /> : null;
  }
  const falhas = midia.itens[tipo].filter((item) => item.chegada === 'falhou').length;
  if (falhas > 0) return <FalhaNoPainel frase={fraseDasFalhas(tipo, falhas)} onTentarDeNovo={midia.tentarDeNovo} />;
  return (
    <p className="text-xs tabular-nums text-[var(--ink-lo)]">
      {midia.leitura === 'pronta' ? `Fica na sua conta: ${fraseDoUso(midia.uso)}.` : 'Fica na sua conta.'}
    </p>
  );
}

/** "Adicionar" um arquivo: o único lugar do painel com borda tracejada. */
export function EnviarArquivo({
  rotulo,
  aceita,
  progresso,
  onArquivo,
}: {
  rotulo: string;
  aceita: string;
  /** O envio em andamento, de 0 a 100; undefined sem envio. */
  progresso: number | undefined;
  onArquivo: (arquivo: File) => void;
}) {
  const enviando = progresso !== undefined;
  return (
    <label
      className={`envio flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line-ctl)] px-3 text-sm text-[var(--ink)] transition-colors duration-150 ${
        enviando ? 'cursor-progress opacity-60' : 'cursor-pointer hover:bg-[var(--panel)] hover:text-[var(--ink-hi)]'
      }`}
    >
      <Plus size={16} aria-hidden="true" />
      {enviando ? <span className="tabular-nums">Enviando… {progresso}%</span> : rotulo}
      <input
        type="file"
        accept={aceita}
        disabled={enviando}
        className="sr-only"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (arquivo) onArquivo(arquivo);
          e.target.value = '';
        }}
      />
    </label>
  );
}

export interface ItemDaBiblioteca {
  id: string;
  nome: string;
  /** null até o arquivo chegar a esta aba. */
  url: string | null;
  chegada: ChegadaDaMidia;
  /** De 0 a 100 enquanto baixa. */
  progresso: number | null;
}

/**
 * A biblioteca de imagens de um gráfico (logo, fundo, sobreposição): a
 * escolhida vai ao preview, e "Nenhum" tira. Embaixo, uma linha para a
 * imagem do preview e outra para a do programa, quando é outra, cada uma com
 * onde está e o que se faz com ela. As imagens que ainda não abriram nesta
 * aba ficam numa lista logo abaixo, fora do grupo (só se escolhe o que já
 * chegou), dizendo como vêm; a que não abriu tem "Excluir". Antes cada imagem
 * tinha a lixeira escondida num `div` dentro do botão, que só aparecia com o
 * mouse e apagava sem perguntar.
 */
export function GradeDeImagens({
  rotulo,
  itens,
  selecionada,
  noPrograma,
  textoDoNenhum,
  onSelecionar,
  onExcluir,
}: {
  rotulo: string;
  itens: ItemDaBiblioteca[];
  /** A imagem do preview; '' para nenhuma. */
  selecionada: string;
  /** A imagem do programa; '' para nenhuma. */
  noPrograma: string;
  textoDoNenhum: string;
  onSelecionar: (url: string) => void;
  onExcluir: (item: ItemDaBiblioteca) => void;
}) {
  const prontas = itens.flatMap((item) => (item.url ? [{ ...item, url: item.url }] : []));
  const chegando = itens.filter((item) => !item.url);
  const opcoes = [{ id: '', nome: textoDoNenhum, url: '' }, ...prontas];
  const setas = useSetasDoGrupo(
    opcoes.length,
    opcoes.findIndex((o) => o.url === selecionada),
    (i) => onSelecionar(opcoes[i].url),
    3,
  );
  const opcao = (marcado: boolean) =>
    `relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border bg-[var(--well)] transition-colors duration-150 cursor-pointer ${
      marcado ? 'border-[var(--ink-hi)] ring-1 ring-[var(--ink-hi)]' : 'border-[var(--line-ctl)] hover:border-[var(--ink-lo)]'
    }`;

  // A do preview primeiro; a do programa só quando é outra
  const linhas = [selecionada, noPrograma]
    .filter((url, i, todas) => url && todas.indexOf(url) === i)
    .map((url) => ({ url, item: itens.find((i) => i.url === url) }));

  return (
    <div>
      <div role="radiogroup" aria-label={rotulo} className="grid grid-cols-3 gap-2">
        {opcoes.map((item, i) => (
          <button
            key={item.id || 'nenhum'}
            {...setas(i)}
            type="button"
            role="radio"
            aria-checked={item.url === selecionada}
            aria-label={item.url ? item.nome : undefined}
            title={item.url ? item.nome : undefined}
            onClick={() => onSelecionar(item.url)}
            className={opcao(item.url === selecionada)}
          >
            {item.url ? (
              <img src={item.url} alt="" className="h-full w-full object-contain p-1.5" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-xs text-[var(--ink-lo)]">{textoDoNenhum}</span>
            )}
          </button>
        ))}
      </div>
      {chegando.length > 0 && (
        <ul aria-label="Imagens que ainda não abriram nesta tela" className="mt-2 grid grid-cols-3 gap-2">
          {chegando.map((item) => (
            <li
              key={item.id}
              title={item.nome}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-[var(--line-ctl)] bg-[var(--well)] p-1.5 text-center text-xs text-[var(--ink-lo)]"
            >
              <span className="sr-only">{item.nome}:</span>
              {item.chegada === 'falhou' ? (
                <>
                  <CircleAlert size={16} aria-hidden="true" className="text-[var(--ink-hi)]" />
                  Não abriu
                  <AcaoDeTexto tamanho="xs" onClick={() => onExcluir(item)}>
                    Excluir
                  </AcaoDeTexto>
                </>
              ) : item.chegada === 'baixando' ? (
                <>
                  Baixando…
                  {item.progresso !== null && <span className="tabular-nums">{item.progresso}%</span>}
                </>
              ) : item.chegada === 'na-fila' ? (
                'Na fila'
              ) : (
                <span className="sr-only">abrindo</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {linhas.map(({ url, item }) => {
        return (
          <div key={url} className="mt-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs text-[var(--ink)]">{item?.nome ?? 'Uma imagem que saiu da lista'}</p>
              <EstadoNoPalco noPrograma={url === noPrograma} noPreview={url === selecionada} />
            </div>
            {item && (
              <AcaoDeTexto tamanho="xs" onClick={() => onExcluir(item)}>
                Excluir
              </AcaoDeTexto>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** O campo de uma linha do sistema, com o rótulo em cima e a dica (ou o erro, no lugar dela) embaixo. */
export function CampoDoPainel({
  rotulo,
  dica,
  erro,
  ...resto
}: { rotulo: string; dica?: string; erro?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const idDaNota = useId();
  const nota = erro || dica;
  return (
    <div>
      {/* O campo mora dentro do rótulo: o nome vem do texto dele, sem depender de id */}
      <label className="block">
        <span className="text-xs text-[var(--ink)]">{rotulo}</span>
        <input
          aria-invalid={erro ? true : undefined}
          aria-describedby={nota ? idDaNota : undefined}
          className="mt-1 h-11 w-full rounded-xl border border-[var(--line-ctl)] bg-[var(--well)] px-3 text-sm text-[var(--ink-hi)] placeholder:text-[var(--ink-dim)]"
          {...resto}
        />
      </label>
      {erro ? (
        <ErroDeCampo id={idDaNota}>{erro}</ErroDeCampo>
      ) : (
        dica && (
          <p id={idDaNota} className="mt-1 text-xs text-[var(--ink-lo)]">
            {dica}
          </p>
        )
      )}
    </div>
  );
}
