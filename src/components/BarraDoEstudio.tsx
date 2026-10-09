import { useEffect, useId, useState, type Ref } from 'react';
import { Radio } from 'lucide-react';
import { formatarTempo } from '../lib/graficos';
import { PwStreamLogo } from './PwStreamLogo';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';

/** O que a barra sabe da transmissão. */
export type TransmissaoNaBarra =
  | { fase: 'parada' }
  | { fase: 'entrando' }
  | { fase: 'no-ar'; inicioEm: number; canaisNoAr: number; canaisQueDesistiram: number; canaisTotal: number }
  | { fase: 'encerrando' };

interface BarraDoEstudioProps {
  /** O título do webinar pelo qual se entrou no estúdio, quando houver. */
  sessao?: string;
  canaisLigados: number;
  canaisProntos: number;
  onCanais: () => void;
  transmissao: TransmissaoNaBarra;
  /** Por que não dá para entrar ao vivo agora, ou null quando dá. */
  impedimento: string | null;
  onEntrarAoVivo: () => void;
  onEncerrar: () => void;
  onSair: () => void;
  onVoltarAosAjustes: () => void;
  mostrarVoltaAosAjustes: boolean;
  botaoVoltarRef: Ref<HTMLButtonElement>;
}

/** O tempo no ar, no pulso de um segundo, em mono como toda leitura. */
function TempoNoAr({ inicioEm }: { inicioEm: number }) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="font-mono tabular-nums">{formatarTempo(Math.floor((agora - inicioEm) / 1000))}</span>;
}

/** O sinal do ar: a palavra no carmim que é só dele, com o ponto que a acompanha nos monitores. */
export function SeloDoAr({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-sig-lift)] ${className}`}>
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--color-sig)]" />
      Ao vivo
    </span>
  );
}

/**
 * A barra do console: logo, a sessão, os canais, o ar e a saída.
 *
 * Fora do ar, "Entrar ao vivo" é a única porta para a transmissão e diz por
 * que não age quando não pode (nenhum canal pronto, o servidor fora): fica
 * focável (`aria-disabled`, não `disabled`), o motivo no `aria-describedby`,
 * e o clique o repete num aviso. No ar, o carmim aparece (Regra do Ar): o
 * selo, o tempo e quantos canais recebem a live, e "Encerrar transmissão",
 * que é a única ação do estúdio sobre o ar e por isso a única em carmim.
 */
export function BarraDoEstudio({
  sessao,
  canaisLigados,
  canaisProntos,
  onCanais,
  transmissao,
  impedimento,
  onEntrarAoVivo,
  onEncerrar,
  onSair,
  onVoltarAosAjustes,
  mostrarVoltaAosAjustes,
  botaoVoltarRef,
}: BarraDoEstudioProps) {
  const toast = useToast();
  const idDoMotivo = useId();
  const canais =
    canaisLigados === 0
      ? 'Nenhum canal ligado'
      : `Canais: ${canaisProntos} de ${canaisLigados} ${canaisLigados === 1 ? 'pronto' : 'prontos'}`;
  const noAr = transmissao.fase === 'no-ar' ? transmissao : null;
  // O carmim só acende com um canal de fato recebendo a live (Regra do Ar);
  // antes disso a barra diz que está conectando, e depois de todos caírem, que não há canal
  const acesa = !!noAr && noAr.canaisNoAr > 0;
  const canaisNoAr = noAr
    ? noAr.canaisNoAr > 0
      ? `${noAr.canaisNoAr} de ${noAr.canaisTotal} ${noAr.canaisTotal === 1 ? 'canal' : 'canais'} no ar`
      : noAr.canaisQueDesistiram === noAr.canaisTotal
        ? 'Nenhum canal no ar'
        : 'Conectando aos canais…'
    : '';

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-4 border-b border-[var(--line)] bg-[var(--surface)] px-3 sm:px-4">
        <button
          type="button"
          onClick={onSair}
          aria-label="PwStreamer, voltar ao Painel"
          className="flex shrink-0 items-center cursor-pointer"
        >
          <span className="hidden sm:inline-flex">
            <PwStreamLogo iconSize={24} textSize="sm" monocromatico />
          </span>
          <span className="inline-flex sm:hidden">
            <PwStreamLogo iconSize={24} showText={false} monocromatico />
          </span>
        </button>

        <h1 className="min-w-0 truncate text-sm font-medium text-[var(--ink-hi)]">
          Estúdio
          {sessao && <span className="font-normal text-[var(--ink-lo)]"> · {sessao}</span>}
        </h1>

        <div className="ml-auto flex shrink-0 items-center gap-4">
          {noAr ? (
            <span className="hidden items-center gap-3 text-xs text-[var(--ink-hi)] md:inline-flex" role="status">
              {acesa && <SeloDoAr />}
              {acesa && <TempoNoAr inicioEm={noAr.inicioEm} />}
              <AcaoDeTexto tamanho="xs" onClick={onCanais} className="min-h-11">
                {canaisNoAr}
              </AcaoDeTexto>
            </span>
          ) : (
            <span className="hidden md:inline-flex">
              <AcaoDeTexto tamanho="xs" onClick={onCanais} className="min-h-11">
                {canais}
              </AcaoDeTexto>
            </span>
          )}

          {transmissao.fase === 'parada' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                aria-disabled={impedimento ? 'true' : undefined}
                aria-describedby={impedimento ? idDoMotivo : undefined}
                icon={<Radio size={14} aria-hidden="true" />}
                onClick={() => (impedimento ? toast.info('Ainda não dá para entrar ao vivo', impedimento) : onEntrarAoVivo())}
                className="hidden sm:inline-flex"
              >
                Entrar ao vivo
              </Button>
              {impedimento && (
                <span id={idDoMotivo} className="sr-only">
                  {impedimento}
                </span>
              )}
            </>
          )}
          {transmissao.fase === 'entrando' && (
            <Button variant="ghost" size="sm" loading icon={<Radio size={14} aria-hidden="true" />} className="hidden sm:inline-flex">
              Entrando ao vivo…
            </Button>
          )}
          {transmissao.fase === 'no-ar' && (
            <Button variant="danger" size="sm" onClick={onEncerrar} className="hidden sm:inline-flex">
              Encerrar transmissão
            </Button>
          )}
          {transmissao.fase === 'encerrando' && (
            <Button variant="danger" size="sm" loading className="hidden sm:inline-flex">
              Encerrando…
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onSair}>
            Sair do estúdio
          </Button>
        </div>
      </header>
      <div
        className={`flex min-h-11 shrink-0 items-center border-b border-[var(--line)] bg-[var(--surface)] px-3 text-xs text-[var(--ink-hi)] lg:hidden ${
          mostrarVoltaAosAjustes ? 'justify-between gap-2' : 'justify-center'
        }`}
      >
        {noAr ? (
          <span className="inline-flex items-center gap-2">
            {acesa && <SeloDoAr />}
            {acesa && <TempoNoAr inicioEm={noAr.inicioEm} />}
            <span>{acesa ? `· ${canaisNoAr}` : canaisNoAr}</span>
          </span>
        ) : (
          <span>{mostrarVoltaAosAjustes ? 'Ensaio local · não está no ar.' : 'Ensaio local · nada está sendo transmitido.'}</span>
        )}
        {mostrarVoltaAosAjustes && (
          <AcaoDeTexto ref={botaoVoltarRef} tamanho="xs" sublinhada className="-mb-px min-h-11 shrink-0 whitespace-nowrap" onClick={onVoltarAosAjustes}>
            Voltar aos ajustes
          </AcaoDeTexto>
        )}
      </div>
    </>
  );
}
