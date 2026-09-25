import { useEffect, useRef } from 'react';
import { ArrowRight, Check, CircleAlert, Plus } from 'lucide-react';
import type { Destination } from '../types';
import { estadoDoCanal, nomeDaPlataforma, pendenciaCurta, plataformaPeloNome } from '../lib/canais';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { Button } from './ui/Button';
import { Chip } from './ui/Chip';
import { Menu } from './ui/Menu';
import { PlataformaIcone } from './ui/PlataformaIcone';
import { Horario, WebinarLinha, acoesDoWebinar, ordenarPorHorario, type WebinarResumo } from './WebinarLista';

interface DashboardProps {
  webinars: WebinarResumo[];
  /** Falso até a lista de webinars chegar — antes disso nada é afirmado. */
  carregado: boolean;
  canais: Destination[];
  onEntrarNoEstudio: (webinar?: WebinarResumo) => void;
  onAgendar: () => void;
  onPaginaPublica: (webinar: WebinarResumo) => void;
  onCriarCapa: (webinar: WebinarResumo) => void;
  /** Sem argumento, conecta um canal novo; com a plataforma, abre direto nela. */
  onConectarCanal: (plataforma?: string) => void;
  /** Abre o modal neste canal, para consertar o que falta. */
  onEditarCanal: (id: string) => void;
  onVerCanais: () => void;
  onVerWebinars: () => void;
}

/**
 * O painel é um lançador: uma ação — entrar no estúdio — e o resto é estado.
 *
 * Era um mural: quatro cartões de indicador (três deles vazios), a lista de
 * webinars com três botões coloridos por linha, um cartão de configurações e
 * o painel inteiro de qualidade de vídeo. Qualidade, integrações e tema
 * foram para Configurações; os indicadores voltam quando houver telemetria.
 */
export function Dashboard({
  webinars,
  carregado,
  canais,
  onEntrarNoEstudio,
  onAgendar,
  onPaginaPublica,
  onCriarCapa,
  onConectarCanal,
  onEditarCanal,
  onVerCanais,
  onVerWebinars,
}: DashboardProps) {
  const ordenados = ordenarPorHorario(webinars);
  const proxima = ordenados[0];
  const demais = ordenados.slice(1);

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
        <h1 className="sr-only">Painel</h1>

        {/* A ação da tela — e só ela */}
        <section aria-labelledby="painel-proxima">
          {!carregado ? (
            <div aria-busy="true" aria-live="polite">
              <span className="sr-only">Carregando seus webinars…</span>
              <div className="h-9 w-3/4 rounded-lg bg-[var(--panel)] motion-safe:animate-pulse" />
              <div className="mt-4 h-4 w-1/3 rounded bg-[var(--panel)] motion-safe:animate-pulse" />
            </div>
          ) : proxima ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <h2 id="painel-proxima" className="text-3xl font-semibold tracking-tight text-balance text-[var(--ink-hi)]">
                  {proxima.title}
                </h2>
                <div className="mt-1 shrink-0">
                  <Menu rotulo={`Ações de ${proxima.title}`} itens={acoesDoWebinar(proxima, { onPaginaPublica, onCriarCapa })} />
                </div>
              </div>
              <p className="mt-3 text-sm text-[var(--ink-lo)]">
                <Horario texto={proxima.time} />
                {proxima.type === 'pre-recorded' && <> · vídeo gravado</>}
              </p>
            </>
          ) : (
            <>
              <h2 id="painel-proxima" className="text-3xl font-semibold tracking-tight text-[var(--ink-hi)]">
                Nenhuma live agendada
              </h2>
              <p className="mt-3 max-w-prose text-sm text-[var(--ink-lo)]">
                Entre no estúdio para transmitir agora, ou{' '}
                <AcaoDeTexto sublinhada onClick={onAgendar}>agende o próximo webinar</AcaoDeTexto>{' '}
                para ter a página de inscrição.
              </p>
            </>
          )}

          <div className="mt-8">
            <Button size="lg" onClick={() => onEntrarNoEstudio(proxima)} className="w-full sm:w-auto sm:min-w-64">
              Entrar no estúdio
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
          </div>
        </section>

        {/* Para onde a live vai — a única fonte dessa resposta na tela */}
        <LinhaDeCanais
          canais={canais}
          planejadas={proxima?.channels ?? []}
          onConectarCanal={onConectarCanal}
          onEditarCanal={onEditarCanal}
          onVerCanais={onVerCanais}
        />

        {/* O que vem depois */}
        {carregado && proxima && (
          <section aria-labelledby="painel-proximos" className="mt-12 border-t border-[var(--line)] pt-6">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="painel-proximos" className="text-base font-semibold text-[var(--ink-hi)]">
                Próximas lives
              </h2>
              <div className="flex gap-5">
                <AcaoDeTexto onClick={onAgendar}>Agendar webinar</AcaoDeTexto>
                {demais.length > 3 && <AcaoDeTexto onClick={onVerWebinars}>Ver todos</AcaoDeTexto>}
              </div>
            </div>

            {demais.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--ink-lo)]">Nenhuma outra live agendada.</p>
            ) : (
              <ul className="mt-1 divide-y divide-[var(--line)]">
                {demais.slice(0, 3).map((w) => (
                  <WebinarLinha
                    key={w.id}
                    webinar={w}
                    onEntrar={onEntrarNoEstudio}
                    onPaginaPublica={onPaginaPublica}
                    onCriarCapa={onCriarCapa}
                  />
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

type Pendencia = { chave: string; nome: string; plataforma?: string; texto: string; acao: () => void };

/**
 * A linha de prontidão. Cada canal ligado diz se recebe a live e, quando não
 * recebe, o que falta — por ícone e texto, nunca por cor. Uma plataforma que
 * a próxima live anuncia mas que está desligada ou nem conectada também
 * aparece aqui como pendência: antes o título dizia "YouTube, Instagram" e a
 * linha mostrava outro par de canais. A contagem ("1 de 3 prontos") cobre
 * exatamente os chips da linha. Clicar numa pendência leva direto a
 * consertá-la. Um canal recém-conectado entra deslizando uma única vez.
 */
function LinhaDeCanais({
  canais,
  planejadas,
  onConectarCanal,
  onEditarCanal,
  onVerCanais,
}: {
  canais: Destination[];
  planejadas: string[];
  onConectarCanal: (plataforma?: string) => void;
  onEditarCanal: (id: string) => void;
  onVerCanais: () => void;
}) {
  const ligados = canais.filter((c) => c.selected);
  const prontos = ligados.filter((c) => estadoDoCanal(c) === 'pronto').length;

  // O que a próxima live anuncia e não vai receber a transmissão
  const pendenciasDaLive: Pendencia[] = planejadas.flatMap((nome) => {
    const plataforma = plataformaPeloNome(nome);
    const destino = canais.find((c) => c.platform === plataforma);
    if (destino?.selected) return []; // já está na linha, com o próprio estado
    // Desligado: o canal existe e tem o nome que a pessoa deu a ele.
    if (destino) return [{ chave: `off-${destino.id}`, nome: destino.name, plataforma, texto: 'desligado', acao: onVerCanais }];
    const nomeCurto = plataforma ? nomeDaPlataforma(plataforma) : nome;
    return [{ chave: `sem-${nome}`, nome: nomeCurto, plataforma, texto: 'não conectado', acao: () => onConectarCanal(plataforma) }];
  });

  const naLinha = ligados.length + pendenciasDaLive.length;
  // Desligados que já aparecem na linha como pendência da live não contam de novo
  const outrosDesligados = canais.length - ligados.length - pendenciasDaLive.filter((p) => p.chave.startsWith('off-')).length;

  const vistos = useRef<Set<string> | null>(null);
  if (vistos.current === null) vistos.current = new Set(canais.map((c) => c.id));
  const novos = new Set(canais.filter((c) => !vistos.current!.has(c.id)).map((c) => c.id));
  useEffect(() => {
    canais.forEach((c) => vistos.current!.add(c.id));
  }, [canais]);

  return (
    <section aria-labelledby="painel-canais" className="mt-12 border-t border-[var(--line)] pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id="painel-canais" className="text-base font-semibold text-[var(--ink-hi)]">
          Canais
          {naLinha > 0 && (
            <span className="ml-2 text-sm font-normal text-[var(--ink-lo)]">
              {prontos} de {naLinha} {naLinha === 1 ? 'pronto' : 'prontos'}
            </span>
          )}
        </h2>
        <div className="flex gap-5">
          {outrosDesligados > 0 && (
            <AcaoDeTexto onClick={onVerCanais}>
              {outrosDesligados} {outrosDesligados === 1 ? 'outro desligado' : 'outros desligados'}
            </AcaoDeTexto>
          )}
          <AcaoDeTexto onClick={() => onConectarCanal()} icone={<Plus size={14} />}>
            Conectar canal
          </AcaoDeTexto>
        </div>
      </div>

      {naLinha === 0 && (
        <p className="mt-3 max-w-prose text-sm text-[var(--ink-lo)]">
          {canais.length === 0
            ? 'Nenhum canal conectado. É para os canais que a live vai: YouTube, Facebook, Twitch ou um servidor RTMP seu.'
            : 'Nenhum canal ligado para a próxima live.'}
        </p>
      )}

      {naLinha > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {ligados.map((canal) => {
            const pendencia = pendenciaCurta(canal);
            return (
              <li
                key={canal.id}
                className={novos.has(canal.id) ? 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-safe:duration-300' : undefined}
              >
                <Chip
                  onClick={pendencia ? () => onEditarCanal(canal.id) : onVerCanais}
                  rotulo={`${canal.name}: ${pendencia ?? 'pronto'}`}
                  icone={<PlataformaIcone plataforma={canal.platform} />}
                  estado={<EstadoDoChip pendencia={pendencia} />}
                >
                  {canal.name}
                </Chip>
              </li>
            );
          })}
          {pendenciasDaLive.map((p) => (
            <li key={p.chave}>
              <Chip
                onClick={p.acao}
                rotulo={`${p.nome}: ${p.texto}`}
                icone={<PlataformaIcone plataforma={p.plataforma ?? 'custom'} />}
                estado={<EstadoDoChip pendencia={p.texto} />}
              >
                {p.nome}
              </Chip>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Pronto: ✓. Pendente: alerta + o que falta, na tinta do nome — vermelho só no ar. */
function EstadoDoChip({ pendencia }: { pendencia: string | null }) {
  if (pendencia === null) return <Check size={14} aria-hidden="true" />;
  return (
    <>
      <CircleAlert size={14} aria-hidden="true" />
      <span>{pendencia}</span>
    </>
  );
}
