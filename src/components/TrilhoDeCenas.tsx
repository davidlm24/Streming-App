import { useEffect, useRef } from 'react';
import { CircleAlert, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { CARD_PADRAO, CENAS, FONTE_CAMERA, medidasDoCard, precisaDaTela, type Cena } from '../lib/cenas';
import { ALTURA_DO_PALCO, LARGURA_DO_PALCO, caixasDaDivisao, type Caixa } from '../lib/palco/medidas';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
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

const GRUPOS = [
  { id: 'uma-fonte', titulo: 'Uma fonte', cenas: CENAS.filter((c) => c.fontes.length === 1) },
  { id: 'camera-e-tela', titulo: 'Câmera e tela', cenas: CENAS.filter((c) => c.fontes.length > 1) },
];

type Fonte = 'camera' | 'tela';

/** Onde cada fonte fica na cena, em px do palco: as contas do compositor, para a miniatura ser a cena. */
function caixasDaCena(cena: Cena): { fonte: Fonte; caixa: Caixa; card?: boolean }[] {
  const inteira: Caixa = { x: 0, y: 0, w: LARGURA_DO_PALCO, h: ALTURA_DO_PALCO };
  const temCamera = cena.fontes.includes(FONTE_CAMERA);
  if (!precisaDaTela(cena)) return [{ fonte: 'camera', caixa: inteira }];
  if (!temCamera) return [{ fonte: 'tela', caixa: inteira }];
  switch (cena.layout) {
    case 'picture-in-picture':
    case 'presentation': {
      const { largura, altura } = medidasDoCard(CARD_PADRAO);
      const card: Caixa = {
        x: (CARD_PADRAO.x / 100) * LARGURA_DO_PALCO,
        y: (CARD_PADRAO.y / 100) * ALTURA_DO_PALCO,
        w: (largura / 100) * LARGURA_DO_PALCO,
        h: (altura / 100) * ALTURA_DO_PALCO,
      };
      return [
        { fonte: 'tela', caixa: inteira },
        { fonte: 'camera', caixa: card, card: true },
      ];
    }
    case 'dual': {
      const { primeira, segunda } = caixasDaDivisao('metades');
      return [
        { fonte: 'camera', caixa: primeira },
        { fonte: 'tela', caixa: segunda },
      ];
    }
    case 'camera-em-destaque': {
      const { primeira, segunda } = caixasDaDivisao('maior-e-menor');
      return [
        { fonte: 'camera', caixa: primeira },
        { fonte: 'tela', caixa: segunda },
      ];
    }
    default: {
      const { primeira, segunda } = caixasDaDivisao('maior-e-menor');
      return [
        { fonte: 'tela', caixa: primeira },
        { fonte: 'camera', caixa: segunda },
      ];
    }
  }
}

/**
 * A cena em miniatura: onde a câmera (cheia, com uma cabeça) e a tela (mais
 * clara, com a barra de uma janela) ficam no palco. A tela que falta vira um
 * contorno tracejado, sem preenchimento: a cena escolhida assim mostraria o
 * vazio. Só nomes, como antes, "Câmera e tela iguais" e "Câmera e tela lado
 * a lado" não se distinguiam de relance durante a live.
 */
function MiniaturaDaCena({ cena, semTela, noPrograma, className = '' }: { cena: Cena; semTela: boolean; noPrograma: boolean; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${LARGURA_DO_PALCO} ${ALTURA_DO_PALCO}`}
      aria-hidden="true"
      className={`aspect-video shrink-0 overflow-visible rounded-[3px] bg-[var(--stage)] ${
        noPrograma ? 'outline outline-2 outline-offset-1 outline-[var(--ink-hi)]' : ''
      } ${className}`}
    >
      {caixasDaCena(cena).map(({ fonte, caixa, card }) => {
        const r = card ? 40 : 16;
        if (fonte === 'tela') {
          if (semTela) {
            const meio = 18;
            return (
              <rect
                key={fonte}
                x={caixa.x + meio}
                y={caixa.y + meio}
                width={caixa.w - 2 * meio}
                height={caixa.h - 2 * meio}
                rx={r}
                fill="none"
                stroke="var(--ink-lo)"
                strokeWidth={28}
                strokeDasharray="70 50"
              />
            );
          }
          return (
            <g key={fonte}>
              <rect x={caixa.x} y={caixa.y} width={caixa.w} height={caixa.h} rx={r} fill="var(--ink-lo)" opacity={0.35} />
              <rect x={caixa.x} y={caixa.y} width={caixa.w} height={Math.min(90, caixa.h * 0.14)} rx={r} fill="var(--ink-lo)" opacity={0.6} />
            </g>
          );
        }
        // A câmera: o quadro e uma pessoa (cabeça e ombros), centrada no quadro
        const cx = caixa.x + caixa.w / 2;
        const lado = Math.min(caixa.w, caixa.h);
        return (
          <g key={fonte}>
            <rect
              x={caixa.x}
              y={caixa.y}
              width={caixa.w}
              height={caixa.h}
              rx={r}
              fill="var(--raise)"
              stroke={card ? 'var(--stage)' : undefined}
              strokeWidth={card ? 16 : undefined}
            />
            <circle cx={cx} cy={caixa.y + caixa.h * 0.42} r={lado * 0.17} fill="var(--ink-lo)" />
            <path
              d={`M ${cx - lado * 0.32} ${caixa.y + caixa.h} a ${lado * 0.32} ${lado * 0.26} 0 0 1 ${lado * 0.64} 0 Z`}
              fill="var(--ink-lo)"
            />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * O que impede o corte: a cena do preview depende de uma fonte que não está
 * chegando. Sem isto, "Tela com câmera" sem tela ia ao programa como uma
 * moldura escrita "Nenhuma tela compartilhada", com o Corte aceso.
 */
export interface BloqueioDoCorte {
  motivo: string;
  acao?: { rotulo: string; onClick: () => void };
}

/** Alerta + frase na tinta alta, e o conserto ao lado quando houver um. */
export function AvisoDoBloqueio({ bloqueio, className = '' }: { bloqueio: BloqueioDoCorte; className?: string }) {
  return (
    <div className={`text-pretty text-xs text-[var(--ink-hi)] ${className}`}>
      <p className="flex items-start gap-1.5">
        <CircleAlert size={14} aria-hidden="true" className="mt-px shrink-0" />
        <span>{bloqueio.motivo}</span>
      </p>
      {bloqueio.acao && (
        <AcaoDeTexto tamanho="xs" sublinhada onClick={bloqueio.acao.onClick} className="ml-5 mt-1 min-h-8">
          {bloqueio.acao.rotulo}
        </AcaoDeTexto>
      )}
    </div>
  );
}

/**
 * Corte e Fusão: levam o preview ao programa. Ficam no trilho no desktop e,
 * no celular, logo abaixo do preview.
 */
export function BotoesDeTransicao({
  temMudanca,
  cortando,
  bloqueio = null,
  onCortar,
  compacto = false,
}: {
  temMudanca: boolean;
  cortando: boolean;
  /** A cena do preview não tem o que mostrar: as teclas apagam e dizem por quê. */
  bloqueio?: BloqueioDoCorte | null;
  onCortar: (transicao: Transicao) => void;
  /** Na coluna recolhida: uma tecla sobre a outra, e a frase só para o leitor de tela. */
  compacto?: boolean;
}) {
  const parado = !temMudanca || cortando || bloqueio !== null;
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
      {bloqueio && temMudanca ? (
        compacto ? (
          <p className="sr-only">{bloqueio.motivo}</p>
        ) : (
          <AvisoDoBloqueio bloqueio={bloqueio} className="mt-2" />
        )
      ) : (
        !temMudanca && (
          <p className={compacto ? 'sr-only' : 'mt-2 text-pretty text-xs text-[var(--ink-lo)]'}>O preview está igual ao programa.</p>
        )
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
  bloqueio: BloqueioDoCorte | null;
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
export function TrilhoDeCenas({ idDoPrograma, idDoPreview, temTela, temMudanca, cortando, bloqueio, onEscolher, onCortar, recolhido, onRecolher }: TrilhoDeCenasProps) {
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
    return { noPrograma, noPreview, semTela, legenda };
  };

  // Uma tecla por cena, nas duas larguras, com a miniatura da composição.
  // Aberta, o nome (até duas linhas: ele não muda no corte) e o estado embaixo,
  // numa linha só: com a palavra ao lado, "Tela com câmera" quebrava ao virar
  // programa, e cada corte mexia a lista sob o ponteiro. Recolhida, a
  // miniatura no lugar do nome, que vai no nome acessível e no title.
  const tecla = (cena: Cena) => {
    const { noPrograma, noPreview, semTela, legenda } = descrever(cena);
    return (
      <li key={cena.id}>
        <button
          type="button"
          onClick={() => onEscolher(cena)}
          aria-current={noPreview ? 'true' : undefined}
          aria-label={recolhido ? (legenda ? `${cena.nome}, ${legenda}` : cena.nome) : undefined}
          title={cena.nome}
          className={`flex w-full rounded-xl py-2 transition-colors duration-150 cursor-pointer ${
            recolhido ? 'min-h-16 flex-col items-center justify-center gap-1 px-1 text-center' : 'min-h-14 items-center gap-2.5 px-2 text-left'
          } ${noPreview ? 'bg-[var(--raise)]' : 'hover:bg-[var(--panel)]'}`}
        >
          <MiniaturaDaCena cena={cena} semTela={semTela} noPrograma={noPrograma} className={recolhido ? 'w-14' : 'w-12'} />
          {recolhido ? (
            <>
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
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-sm leading-snug text-[var(--ink-hi)]">{cena.nome}</span>
              {legenda && (
                <span
                  className={`flex max-w-full items-center gap-1 text-xs ${noPrograma || (noPreview && semTela) ? 'font-medium text-[var(--ink-hi)]' : 'text-[var(--ink-lo)]'}`}
                >
                  {/* Sem a fonte, um alerta junto da palavra: a cena escolhida assim não vai ao programa */}
                  {semTela && <CircleAlert size={12} aria-hidden="true" className="shrink-0" />}
                  <span className="truncate">{legenda}</span>
                </span>
              )}
            </span>
          )}
        </button>
      </li>
    );
  };

  // As seis cenas em dois grupos: as de uma fonte só e as que juntam câmera e
  // tela. Antes, seis nomes numa lista corrida, quatro deles quase iguais.
  const lista = (
    <div className="space-y-3">
      {GRUPOS.map((grupo) => (
        <section key={grupo.id} aria-labelledby={`estudio-cenas-${grupo.id}`}>
          <h3
            id={`estudio-cenas-${grupo.id}`}
            className={recolhido ? 'sr-only' : 'px-2 pb-1 text-xs text-[var(--ink-lo)]'}
          >
            {grupo.titulo}
          </h3>
          <ul className="space-y-1">{grupo.cenas.map(tecla)}</ul>
        </section>
      ))}
    </div>
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
          <BotoesDeTransicao temMudanca={temMudanca} cortando={cortando} bloqueio={bloqueio} onCortar={onCortar} compacto />
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
        <BotoesDeTransicao temMudanca={temMudanca} cortando={cortando} bloqueio={bloqueio} onCortar={onCortar} />
      </section>
    </div>
  );
}
