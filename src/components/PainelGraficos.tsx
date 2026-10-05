import { useId, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from 'react';
import { PenLine, Plus } from 'lucide-react';
import type { Banner, CantoDoPalco, StudioSceneState, TickerItem } from '../types';
import { fraseDaFalhaDoEnvio, useMidiaDoEstudio, type TipoDeImagem } from '../context/MidiaDoEstudio';
import { FORMATOS } from '../lib/midiaDaConta';
import { CORES_DOS_GRAFICOS, formatarTempo, relogioParado, restanteDoRelogio, type RelogioDoCronometro } from '../lib/graficos';
import { LIMITE_DE_BANNERS, LIMITE_DE_TICKERS } from '../lib/limitesDaConta';
import { FRASE_DA_FALHA_DA_LISTA, type ListaDaConta } from '../lib/useListaDaConta';
import {
  CampoDoPainel,
  Deslizante,
  EnviarArquivo,
  EscolhaDoPainel,
  EstadoNoPalco,
  FalhaNoPainel,
  GradeDeImagens,
  NotaDaMidia,
  SecaoDoPainel,
  SeletorDeCanto,
  useSetasDoGrupo,
  type ItemDaBiblioteca,
} from './PecasDoPainel';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { Button } from './ui/Button';
import { ErroDeCampo } from './ui/ErroDeCampo';
import { Segmentado } from './ui/Segmentado';
import { Switch } from './ui/Switch';
import { useConfirm } from './ui/ConfirmDialog';

/** O que o estúdio escolheu para os gráficos do preview. O conteúdo vem das listas; o corte leva o conteúdo. */
export interface EscolhaDosGraficos {
  bannerId: string | null;
  bannerPosicao: 'embaixo' | 'em-cima';
  tickerId: string | null;
  tickerVelocidade: 'lenta' | 'normal' | 'rapida';
  tickerDirecao: 'esquerda' | 'direita';
  logo: { canto: CantoDoPalco; tamanho: number; opacidade: number };
  cronometro: { noPreview: boolean; titulo: string };
}

interface PainelGraficosProps {
  escolha: EscolhaDosGraficos;
  onEscolha: Dispatch<SetStateAction<EscolhaDosGraficos>>;
  banners: ListaDaConta<Banner>;
  tickers: ListaDaConta<TickerItem>;
  /** O que está no programa, para cada item dizer onde está. */
  programa: StudioSceneState;
  relogio: RelogioDoCronometro;
  onRelogio: (relogio: RelogioDoCronometro) => void;
  cor: string;
  onCor: (cor: string) => void;
}

// ── Peças da lista ─────────────────────────────────────────────────────────

/**
 * "Novo …": o único controle tracejado do painel, porque adiciona. Diz quantos
 * a conta já tem e para no limite. O banco recusa o item de número 51 com um
 * erro de tamanho, e a tela não deve deixar a pessoa montar o item para só
 * então saber (o painel antigo mostrava um "/50" que nada aplicava).
 * `coisa` é o plural, na frase: "banners", "tickers".
 */
function BotaoDeAdicionar({
  children,
  onClick,
  usados,
  limite,
  coisa,
}: {
  children: ReactNode;
  onClick: () => void;
  usados: number;
  limite: number;
  coisa: string;
}) {
  const idDoAviso = useId();
  const cheio = usados >= limite;
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={cheio}
        aria-describedby={idDoAviso}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line-ctl)] px-3 text-sm text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--panel)] hover:text-[var(--ink-hi)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-[var(--ink)]"
      >
        <Plus size={16} aria-hidden="true" />
        {children}
      </button>
      <p id={idDoAviso} className="text-xs tabular-nums text-[var(--ink-lo)]">
        {cheio
          ? `A sua conta guarda até ${limite} ${coisa}, e já tem ${usados}. Exclua um que não usa para criar outro.`
          : `${usados} de ${limite} ${coisa}.`}
      </p>
    </>
  );
}

/** O formulário de dois campos de um item (banner ou ticker), no lugar dele. */
function FormularioDoItem({
  campos,
  rotuloDoSalvar,
  onSalvar,
  onCancelar,
}: {
  campos: { rotulo: string; valor: string; obrigatorio?: boolean; max: number; placeholder?: string }[];
  rotuloDoSalvar: string;
  onSalvar: (valores: string[]) => void;
  onCancelar: () => void;
}) {
  const [valores, setValores] = useState(campos.map((c) => c.valor));
  const [tentou, setTentou] = useState(false);
  const faltando = campos.map((c, i) => !!c.obrigatorio && !valores[i].trim());

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setTentou(true);
    if (faltando.some(Boolean)) return;
    onSalvar(valores.map((v) => v.trim()));
  };

  return (
    <form onSubmit={enviar} className="space-y-3 rounded-xl border border-[var(--line)] p-3">
      {campos.map((campo, i) => (
        <CampoDoPainel
          key={campo.rotulo}
          rotulo={campo.rotulo}
          value={valores[i]}
          maxLength={campo.max}
          placeholder={campo.placeholder}
          autoFocus={i === 0}
          onChange={(e) => setValores((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
          erro={tentou && faltando[i] ? `Escreva ${campo.rotulo.toLowerCase()} antes de salvar.` : undefined}
        />
      ))}
      <div className="flex items-center gap-4">
        <Button type="submit" variant="ghost" size="sm">
          {rotuloDoSalvar}
        </Button>
        <AcaoDeTexto tamanho="xs" onClick={onCancelar}>
          Cancelar
        </AcaoDeTexto>
      </div>
    </form>
  );
}

/** Uma linha da lista: o texto, onde está, se a conta já tem, e o que se faz com ela. */
function LinhaDoItem({
  titulo,
  detalhe,
  noPrograma,
  noPreview,
  naConta,
  onPreview,
  onEditar,
  onExcluir,
}: {
  titulo: string;
  detalhe?: string;
  noPrograma: boolean;
  noPreview: boolean;
  /** null quando a conta já tem o item como está. */
  naConta: 'salvando…' | 'não salvo' | null;
  onPreview: () => void;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  return (
    <li className="py-3">
      <p className="text-pretty text-sm text-[var(--ink-hi)]">{titulo}</p>
      {detalhe && <p className="mt-0.5 text-pretty text-xs text-[var(--ink-lo)]">{detalhe}</p>}
      <EstadoNoPalco
        noPrograma={noPrograma}
        noPreview={noPreview}
        extra={
          naConta === 'não salvo' ? (
            // O que pede atenção sobe para a tinta alta e ganha o ícone (Regra do Erro em Tinta Alta)
            <span className="inline-flex items-center gap-1 text-[var(--ink-hi)]">
              <PenLine size={12} aria-hidden="true" />
              não salvo
            </span>
          ) : (
            naConta && <span className="text-[var(--ink-lo)]">{naConta}</span>
          )
        }
      />
      <div className="mt-2 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onPreview}>
          {noPreview ? 'Tirar do preview' : 'Pôr no preview'}
        </Button>
        <AcaoDeTexto tamanho="xs" onClick={onEditar}>
          Editar
        </AcaoDeTexto>
        <AcaoDeTexto tamanho="xs" onClick={onExcluir}>
          Excluir
        </AcaoDeTexto>
      </div>
    </li>
  );
}

/** A linha de falha de uma lista da conta, com a saída. */
function FalhaDaLista({ lista }: { lista: ListaDaConta<unknown> }) {
  if (lista.situacao.tipo !== 'falhou') return null;
  return <FalhaNoPainel frase={FRASE_DA_FALHA_DA_LISTA[lista.situacao.motivo]} onTentarDeNovo={lista.tentarDeNovo} />;
}

// ── O painel ───────────────────────────────────────────────────────────────

/**
 * Os gráficos do palco: banner, ticker, logo, cronômetro, a cor dos gráficos,
 * o fundo e a sobreposição. O que entra aqui vai ao preview; o corte leva ao
 * programa. Cada item diz onde está: no programa, no preview ou nos dois.
 *
 * Era um painel de cartões com títulos em caixa alta, uma "Pasta de Ativos:
 * Powerstar7" que não filtrava nada, capturas que não mostravam o palco, o
 * subtítulo "Stream like a Pro - OneStream Live Studio" em todo banner novo,
 * um limite "/50" que o código não aplicava e lixeiras que apagavam sem
 * perguntar. O logo e a marca d'água viraram um logo só.
 */
export function PainelGraficos({ escolha, onEscolha, banners, tickers, programa, relogio, onRelogio, cor, onCor }: PainelGraficosProps) {
  // Sempre a partir do estado atual: dois cliques no mesmo quadro não se desfazem
  const mudar = (parcial: Partial<EscolhaDosGraficos>) => onEscolha((atual) => ({ ...atual, ...parcial }));
  const confirmar = useConfirm();
  const midia = useMidiaDoEstudio();
  const [editandoBanner, setEditandoBanner] = useState<string | 'novo' | null>(null);
  const [editandoTicker, setEditandoTicker] = useState<string | 'novo' | null>(null);
  // O erro do envio aparece embaixo do botão que enviou, e o botão é a nova tentativa
  const erroDoEnvio = (tipo: TipoDeImagem) =>
    midia.falhaDoEnvio?.tipo === tipo ? (
      <ErroDeCampo id={`erro-do-envio-${tipo}`}>{fraseDaFalhaDoEnvio(tipo, midia.falhaDoEnvio.motivo)}</ErroDeCampo>
    ) : null;
  // O envio de uma imagem, no fim da seção: o botão, a falha e onde o arquivo fica
  const envioDeImagem = (tipo: TipoDeImagem, rotulo: string) => (
    <>
      <EnviarArquivo
        rotulo={rotulo}
        aceita={FORMATOS[tipo].join(',')}
        progresso={midia.enviando[tipo]}
        onArquivo={(arquivo) => void midia.enviar(tipo, arquivo)}
      />
      {erroDoEnvio(tipo)}
      {/* A lista que não abriu aparece uma vez, no logo, a primeira seção de mídia */}
      <NotaDaMidia tipo={tipo} anunciaFalha={tipo === 'logo'} />
    </>
  );

  const excluirComConfirmacao = async (
    titulo: string,
    rotulo: string,
    excluir: () => void,
    descricao = 'Sai da lista do estúdio. Se estiver no programa, continua lá até o próximo corte.',
  ) => {
    const ok = await confirmar({ title: titulo, description: descricao, confirmLabel: rotulo, destructive: true });
    if (ok) excluir();
  };

  const naConta = (lista: ListaDaConta<unknown>, id: string) =>
    !lista.naoSalvos.has(id) ? null : lista.situacao.tipo === 'salvando' ? 'salvando…' : 'não salvo';

  // Excluir a imagem escolhida também a tira do preview (a biblioteca desfaz a escolha)
  const excluirImagem = (item: ItemDaBiblioteca, rotulo: string) =>
    excluirComConfirmacao(
      `Excluir ${item.nome}?`,
      rotulo,
      () => void midia.excluir(item.id),
      'O arquivo sai da sua conta, em todos os aparelhos. Se estiver no programa, continua lá até o próximo corte.',
    );

  const restante = restanteDoRelogio(relogio);
  const andando = relogio.fimEm !== null;
  // A duração só troca com o relógio zerado: trocar no meio da contagem
  // zerava, sem corte, o cronômetro que estava no programa
  const emContagem = andando || restante < relogio.duracao;

  const indiceDaCor = CORES_DOS_GRAFICOS.findIndex((c) => c.cor.toLowerCase() === cor.toLowerCase());
  const setasDaCor = useSetasDoGrupo(CORES_DOS_GRAFICOS.length, indiceDaCor, (i) => onCor(CORES_DOS_GRAFICOS[i].cor));

  return (
    <div className="pb-6">
      {/* ── Banner ── */}
      <SecaoDoPainel titulo="Banner" dica="Título e subtítulo, embaixo ou em cima da imagem.">
        {banners.itens.length > 0 && (
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {banners.itens.map((banner) =>
              editandoBanner === banner.id ? (
                <li key={banner.id} className="py-3">
                  <FormularioDoItem
                    campos={[
                      { rotulo: 'Título', valor: banner.text, obrigatorio: true, max: 80 },
                      { rotulo: 'Subtítulo (opcional)', valor: banner.subtitle ?? '', max: 80 },
                    ]}
                    rotuloDoSalvar="Salvar o banner"
                    onSalvar={([text, subtitle]) => {
                      banners.salvar({ ...banner, text, subtitle });
                      setEditandoBanner(null);
                    }}
                    onCancelar={() => setEditandoBanner(null)}
                  />
                </li>
              ) : (
                <LinhaDoItem
                  key={banner.id}
                  titulo={banner.text}
                  detalhe={banner.subtitle || undefined}
                  noPrograma={programa.graficos.banner?.id === banner.id}
                  noPreview={escolha.bannerId === banner.id}
                  naConta={naConta(banners, banner.id)}
                  onPreview={() => mudar({ bannerId: escolha.bannerId === banner.id ? null : banner.id })}
                  onEditar={() => setEditandoBanner(banner.id)}
                  onExcluir={() =>
                    excluirComConfirmacao(`Excluir o banner "${banner.text}"?`, 'Excluir o banner', () => {
                      if (escolha.bannerId === banner.id) mudar({ bannerId: null });
                      banners.excluir(banner.id);
                    })
                  }
                />
              ),
            )}
          </ul>
        )}
        <FalhaDaLista lista={banners} />
        {editandoBanner === 'novo' ? (
          <FormularioDoItem
            campos={[
              { rotulo: 'Título', valor: '', obrigatorio: true, max: 80, placeholder: 'Ana Souza' },
              { rotulo: 'Subtítulo (opcional)', valor: '', max: 80, placeholder: 'Fotógrafa' },
            ]}
            rotuloDoSalvar="Salvar o banner"
            onSalvar={([text, subtitle]) => {
              banners.salvar({ id: `banner-${Date.now()}`, text, subtitle });
              setEditandoBanner(null);
            }}
            onCancelar={() => setEditandoBanner(null)}
          />
        ) : (
          <BotaoDeAdicionar onClick={() => setEditandoBanner('novo')} usados={banners.itens.length} limite={LIMITE_DE_BANNERS} coisa="banners">
            Novo banner
          </BotaoDeAdicionar>
        )}
        <EscolhaDoPainel rotulo="Posição">
          <Segmentado
            rotulo="Posição do banner"
            largura="cheia"
            opcoes={[
              { valor: 'embaixo', rotulo: 'Embaixo' },
              { valor: 'em-cima', rotulo: 'Em cima' },
            ]}
            valor={escolha.bannerPosicao}
            onChange={(bannerPosicao) => mudar({ bannerPosicao })}
          />
        </EscolhaDoPainel>
      </SecaoDoPainel>

      {/* ── Ticker ── */}
      <SecaoDoPainel titulo="Ticker" dica="Uma faixa de texto que passa no pé da imagem.">
        {tickers.itens.length > 0 && (
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {tickers.itens.map((ticker) =>
              editandoTicker === ticker.id ? (
                <li key={ticker.id} className="py-3">
                  <FormularioDoItem
                    campos={[
                      { rotulo: 'Texto', valor: ticker.text, obrigatorio: true, max: 200 },
                      { rotulo: 'Selo (opcional)', valor: ticker.badgeText ?? '', max: 20 },
                    ]}
                    rotuloDoSalvar="Salvar o ticker"
                    onSalvar={([text, badgeText]) => {
                      tickers.salvar({ ...ticker, text, badgeText });
                      setEditandoTicker(null);
                    }}
                    onCancelar={() => setEditandoTicker(null)}
                  />
                </li>
              ) : (
                <LinhaDoItem
                  key={ticker.id}
                  titulo={ticker.text}
                  detalhe={ticker.badgeText ? `Selo: ${ticker.badgeText}` : undefined}
                  noPrograma={programa.graficos.ticker?.id === ticker.id}
                  noPreview={escolha.tickerId === ticker.id}
                  naConta={naConta(tickers, ticker.id)}
                  onPreview={() => mudar({ tickerId: escolha.tickerId === ticker.id ? null : ticker.id })}
                  onEditar={() => setEditandoTicker(ticker.id)}
                  onExcluir={() =>
                    excluirComConfirmacao('Excluir este ticker?', 'Excluir o ticker', () => {
                      if (escolha.tickerId === ticker.id) mudar({ tickerId: null });
                      tickers.excluir(ticker.id);
                    })
                  }
                />
              ),
            )}
          </ul>
        )}
        <FalhaDaLista lista={tickers} />
        {editandoTicker === 'novo' ? (
          <FormularioDoItem
            campos={[
              { rotulo: 'Texto', valor: '', obrigatorio: true, max: 200, placeholder: 'Inscrições abertas até sexta' },
              { rotulo: 'Selo (opcional)', valor: '', max: 20, placeholder: 'Aviso' },
            ]}
            rotuloDoSalvar="Salvar o ticker"
            onSalvar={([text, badgeText]) => {
              tickers.salvar({ id: `ticker-${Date.now()}`, text, badgeText });
              setEditandoTicker(null);
            }}
            onCancelar={() => setEditandoTicker(null)}
          />
        ) : (
          <BotaoDeAdicionar onClick={() => setEditandoTicker('novo')} usados={tickers.itens.length} limite={LIMITE_DE_TICKERS} coisa="tickers">
            Novo ticker
          </BotaoDeAdicionar>
        )}
        <EscolhaDoPainel rotulo="Velocidade">
          <Segmentado
            rotulo="Velocidade do ticker"
            largura="cheia"
            opcoes={[
              { valor: 'lenta', rotulo: 'Lenta' },
              { valor: 'normal', rotulo: 'Normal' },
              { valor: 'rapida', rotulo: 'Rápida' },
            ]}
            valor={escolha.tickerVelocidade}
            onChange={(tickerVelocidade) => mudar({ tickerVelocidade })}
          />
        </EscolhaDoPainel>
        <EscolhaDoPainel rotulo="O texto anda para a">
          <Segmentado
            rotulo="Sentido do ticker"
            largura="cheia"
            opcoes={[
              { valor: 'esquerda', rotulo: 'Esquerda' },
              { valor: 'direita', rotulo: 'Direita' },
            ]}
            valor={escolha.tickerDirecao}
            onChange={(tickerDirecao) => mudar({ tickerDirecao })}
          />
        </EscolhaDoPainel>
      </SecaoDoPainel>

      {/* ── Logo ── */}
      <SecaoDoPainel titulo="Logo" dica="Uma imagem num canto. PNG com fundo transparente fica melhor.">
        <GradeDeImagens
          rotulo="Logo no preview"
          itens={midia.itens.logo}
          selecionada={midia.ativas.logo}
          noPrograma={programa.graficos.logo?.url ?? ''}
          textoDoNenhum="Nenhum"
          onSelecionar={(url) => midia.escolher('logo', url)}
          onExcluir={(item) => excluirImagem(item, 'Excluir o logo')}
        />
        {midia.ativas.logo && (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[var(--ink)]">Canto</span>
              <SeletorDeCanto
                rotulo="Canto do logo"
                valor={escolha.logo.canto}
                onChange={(canto) => mudar({ logo: { ...escolha.logo, canto } })}
              />
            </div>
            <Deslizante
              rotulo="Tamanho"
              valor={escolha.logo.tamanho}
              min={4}
              max={30}
              medida={`${escolha.logo.tamanho}% da largura`}
              onChange={(tamanho) => mudar({ logo: { ...escolha.logo, tamanho } })}
            />
            <Deslizante
              rotulo="Opacidade"
              valor={Math.round(escolha.logo.opacidade * 100)}
              min={20}
              max={100}
              passo={5}
              medida={`${Math.round(escolha.logo.opacidade * 100)}%`}
              onChange={(v) => mudar({ logo: { ...escolha.logo, opacidade: v / 100 } })}
            />
          </>
        )}
        {envioDeImagem('logo', 'Enviar logo')}
      </SecaoDoPainel>

      {/* ── Cronômetro ── */}
      <SecaoDoPainel
        titulo="Cronômetro"
        estado={<EstadoNoPalco noPrograma={!!programa.graficos.cronometro} noPreview={escolha.cronometro.noPreview} />}
        dica="Uma contagem regressiva no meio da imagem. O relógio anda nos dois monitores na hora; o corte leva o cronômetro e o título."
        acao={
          <Switch
            rotulo="Mostrar o cronômetro no preview"
            checked={escolha.cronometro.noPreview}
            onChange={(noPreview) => mudar({ cronometro: { ...escolha.cronometro, noPreview } })}
          />
        }
      >
        <CampoDoPainel
          rotulo="Título (opcional)"
          placeholder="Começamos em"
          maxLength={40}
          value={escolha.cronometro.titulo}
          onChange={(e) => mudar({ cronometro: { ...escolha.cronometro, titulo: e.target.value } })}
        />
        <EscolhaDoPainel rotulo="Duração, em minutos">
          <Segmentado
            rotulo="Duração do cronômetro, em minutos"
            largura="cheia"
            opcoes={[
              { valor: '300', rotulo: '5' },
              { valor: '600', rotulo: '10' },
              { valor: '900', rotulo: '15' },
              { valor: '1800', rotulo: '30' },
            ]}
            valor={String(relogio.duracao)}
            onChange={(v) => onRelogio(relogioParado(Number(v)))}
            desativado={emContagem}
          />
          {emContagem && <p className="mt-1 text-xs text-[var(--ink-lo)]">Zere o cronômetro para trocar a duração.</p>}
        </EscolhaDoPainel>
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-base tabular-nums text-[var(--ink-hi)]" aria-live="off">
            {formatarTempo(restante)}
          </p>
          <div className="flex items-center gap-4">
            {andando ? (
              <Button variant="ghost" size="sm" onClick={() => onRelogio({ ...relogio, fimEm: null, restante })}>
                Pausar
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                disabled={restante <= 0}
                onClick={() => onRelogio({ ...relogio, fimEm: Date.now() + restante * 1000 })}
              >
                {restante < relogio.duracao ? 'Continuar' : 'Iniciar'}
              </Button>
            )}
            <AcaoDeTexto tamanho="xs" onClick={() => onRelogio(relogioParado(relogio.duracao))}>
              Zerar
            </AcaoDeTexto>
          </div>
        </div>
      </SecaoDoPainel>

      {/* ── Cor dos gráficos ── */}
      <SecaoDoPainel
        titulo="Cor dos gráficos"
        dica="Na borda do card da câmera, no subtítulo do banner, no selo do ticker, no preço do QR code e no cronômetro."
      >
        <div className="space-y-2">
          <div role="radiogroup" aria-label="Cor dos gráficos" className="grid grid-cols-6 gap-1">
            {CORES_DOS_GRAFICOS.map((opcao, i) => {
              const marcada = i === indiceDaCor;
              return (
                <button
                  key={opcao.cor}
                  {...setasDaCor(i)}
                  type="button"
                  role="radio"
                  aria-checked={marcada}
                  aria-label={opcao.nome}
                  title={opcao.nome}
                  onClick={() => onCor(opcao.cor)}
                  className={`flex aspect-square w-full items-center justify-center rounded-xl border transition-colors duration-150 cursor-pointer ${
                    marcada ? 'border-[var(--ink-hi)]' : 'border-transparent hover:border-[var(--line-ctl)]'
                  }`}
                >
                  <span aria-hidden="true" className="size-7 rounded-lg border border-[var(--line-ctl)]" style={{ background: opcao.cor }} />
                </button>
              );
            })}
          </div>
          <label
            className={`envio flex h-11 w-fit items-center gap-2 rounded-xl border px-3 text-xs text-[var(--ink)] cursor-pointer hover:bg-[var(--panel)] ${
              indiceDaCor < 0 ? 'border-[var(--ink-hi)]' : 'border-[var(--line-ctl)]'
            }`}
          >
            <span aria-hidden="true" className="size-4 rounded border border-[var(--line-ctl)]" style={{ background: cor }} />
            Outra cor
            <input type="color" value={cor} onChange={(e) => onCor(e.target.value)} className="sr-only" />
          </label>
        </div>
      </SecaoDoPainel>

      {/* ── Fundo ── */}
      <SecaoDoPainel
        titulo="Fundo"
        dica="Aparece atrás da câmera com o croma ligado e nas margens da cena lado a lado."
      >
        <GradeDeImagens
          rotulo="Fundo no preview"
          itens={midia.itens.fundo}
          selecionada={midia.ativas.fundo}
          noPrograma={programa.activeBackground ?? ''}
          textoDoNenhum="Nenhum"
          onSelecionar={(url) => midia.escolher('fundo', url)}
          onExcluir={(item) => excluirImagem(item, 'Excluir o fundo')}
        />
        {envioDeImagem('fundo', 'Enviar fundo')}
      </SecaoDoPainel>

      {/* ── Sobreposição ── */}
      <SecaoDoPainel
        titulo="Sobreposição"
        dica="Uma moldura por cima das fontes. Use um PNG 16:9 com o meio transparente."
      >
        <GradeDeImagens
          rotulo="Sobreposição no preview"
          itens={midia.itens.sobreposicao}
          selecionada={midia.ativas.sobreposicao}
          noPrograma={programa.activeOverlay ?? ''}
          textoDoNenhum="Nenhuma"
          onSelecionar={(url) => midia.escolher('sobreposicao', url)}
          onExcluir={(item) => excluirImagem(item, 'Excluir a sobreposição')}
        />
        {envioDeImagem('sobreposicao', 'Enviar sobreposição')}
      </SecaoDoPainel>
    </div>
  );
}
