import { useId, type Ref } from 'react';
import { Radio } from 'lucide-react';
import { PwStreamLogo } from './PwStreamLogo';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';

interface BarraDoEstudioProps {
  /** O título do webinar pelo qual se entrou no estúdio, quando houver. */
  sessao?: string;
  canaisLigados: number;
  canaisProntos: number;
  onCanais: () => void;
  onSair: () => void;
  onVoltarAosAjustes: () => void;
  mostrarVoltaAosAjustes: boolean;
  botaoVoltarRef: Ref<HTMLButtonElement>;
}

/**
 * A barra do console: logo, a sessão, os canais e a saída.
 *
 * Era o cabeçalho do estúdio: uma faixa de teste com "Simular 30 Dias
 * Expirados", "Adicionar canais" em azul, o menu "LIVE STREAM 1080p ·
 * RECORDING OFF", o GO LIVE em laranja, "Sair do Webinar", o botão de tema
 * (que não muda o console) e a conta. O ar ainda não existe, e o que era de
 * canal virou uma linha que diz quantos estão prontos e abre os canais.
 *
 * "Entrar ao vivo" volta ao lugar do GO LIVE, mas indisponível e dizendo por
 * quê: o botão existe para o operador saber onde o ar vai morar, e nada nele
 * finge que a transmissão existe. Fica focável (`aria-disabled`, não
 * `disabled`) para quem usa teclado ouvir o motivo, e o clique o repete.
 */
export function BarraDoEstudio({ sessao, canaisLigados, canaisProntos, onCanais, onSair, onVoltarAosAjustes, mostrarVoltaAosAjustes, botaoVoltarRef }: BarraDoEstudioProps) {
  const toast = useToast();
  const idDoMotivo = useId();
  const canais =
    canaisLigados === 0
      ? 'Nenhum canal ligado'
      : `Canais: ${canaisProntos} de ${canaisLigados} ${canaisLigados === 1 ? 'pronto' : 'prontos'}`;

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
          <span className="hidden md:inline-flex">
            <AcaoDeTexto tamanho="xs" onClick={onCanais} className="min-h-11">
              {canais}
            </AcaoDeTexto>
          </span>
          <Button
            variant="ghost"
            size="sm"
            aria-disabled="true"
            aria-describedby={idDoMotivo}
            icon={<Radio size={14} aria-hidden="true" />}
            onClick={() =>
              toast.info('A transmissão ainda não existe', 'Quando ela chegar, é por aqui que o estúdio entra no ar nos canais ligados.')
            }
            className="hidden sm:inline-flex"
          >
            Entrar ao vivo
          </Button>
          <span id={idDoMotivo} className="sr-only">
            A transmissão para os canais ainda não está no ar.
          </span>
          <Button variant="ghost" size="sm" onClick={onSair}>
            Sair do estúdio
          </Button>
        </div>
      </header>
      <div className={`flex min-h-11 shrink-0 items-center border-b border-[var(--line)] bg-[var(--surface)] px-3 text-xs text-[var(--ink-hi)] lg:hidden ${mostrarVoltaAosAjustes ? 'justify-between gap-2' : 'justify-center'}`}>
        <span>{mostrarVoltaAosAjustes ? 'Ensaio local · não está no ar.' : 'Ensaio local · nada está sendo transmitido.'}</span>
        {mostrarVoltaAosAjustes && (
          <AcaoDeTexto ref={botaoVoltarRef} tamanho="xs" sublinhada className="-mb-px min-h-11 shrink-0 whitespace-nowrap" onClick={onVoltarAosAjustes}>
            Voltar aos ajustes
          </AcaoDeTexto>
        )}
      </div>
    </>
  );
}
