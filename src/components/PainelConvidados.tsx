import { useState } from 'react';
import { Check, Copy, MicOff, RefreshCw } from 'lucide-react';
import type { PessoaDaSala } from '../lib/sala/malha';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';

/**
 * O painel Convidados: o link da sala e quem já entrou por ele.
 *
 * O link é o segredo da sala, como no Meet: quem o tem entra na conversa.
 * Entrar na conversa não é ir ao ar — "Pôr no palco" é o que leva o
 * convidado às cenas (a Grade), e o corte é o que o leva ao programa. O
 * limite de pessoas no palco é o do plano, contando quem opera.
 *
 * O retorno da conversa (quem opera ouvindo os convidados) NÃO mora aqui:
 * mora no Estudio (MonitoresDaSala), que fica montado com qualquer
 * ferramenta aberta. Para o ar, a voz de cada um só entra quando ele está
 * no programa (SomDoPrograma.convidadosNoAr).
 */
interface PainelConvidadosProps {
  link: string;
  onNovoLink: () => void;
  conectada: boolean;
  pessoas: PessoaDaSala[];
  noPalco: string[];
  /** Pessoas no palco no máximo, contando quem opera (o plano manda). */
  limiteDePessoas: number;
  onPalco: (id: string, entra: boolean) => void;
}

export function PainelConvidados({ link, onNovoLink, conectada, pessoas, noPalco, limiteDePessoas, onPalco }: PainelConvidadosProps) {
  const toast = useToast();
  const [copiado, setCopiado] = useState(false);
  const lugares = Math.max(0, limiteDePessoas - 1 - noPalco.length);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error('Não deu para copiar', 'Copie o link do campo com Ctrl+C.');
    }
  };

  return (
    <div className="space-y-6 p-4">
      <section aria-labelledby="convite-da-sala">
        <h3 id="convite-da-sala" className="text-sm font-medium text-[var(--ink-hi)]">
          Convite
        </h3>
        <p className="mt-1 text-pretty text-xs text-[var(--ink-lo)]">
          Quem abrir este link entra na conversa com você, sem conta — e fica fora do ar até você pôr no palco.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Link da sala de convidados"
            className="h-11 min-w-0 flex-1 rounded-2xl border border-[var(--line-ctl)] bg-[var(--well)] px-3 font-mono text-xs text-[var(--ink)]"
          />
          <Button variant="ghost" onClick={() => void copiar()} icon={copiado ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} className="min-h-11 shrink-0">
            {copiado ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
        <AcaoDeTexto
          tamanho="xs"
          icone={<RefreshCw size={12} aria-hidden="true" />}
          onClick={onNovoLink}
          className="mt-2 min-h-11"
        >
          Gerar um link novo (o antigo deixa de valer)
        </AcaoDeTexto>
      </section>

      <section aria-labelledby="quem-esta-na-sala">
        <h3 id="quem-esta-na-sala" className="text-sm font-medium text-[var(--ink-hi)]">
          Na sala
        </h3>
        {pessoas.length === 0 ? (
          <p className="mt-1 text-pretty text-xs text-[var(--ink-lo)]">
            {conectada ? 'Ninguém entrou ainda. Mande o link do convite.' : 'Conectando à sala…'}
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {pessoas.map((p) => {
              const estaNoPalco = noPalco.includes(p.id);
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-[var(--panel)] p-2">
                  <div className="h-12 w-[4.75rem] shrink-0 overflow-hidden rounded-lg bg-[var(--stage)]">
                    {p.camera && !p.semVideo ? (
                      <video
                        ref={(el) => {
                          if (el && el.srcObject !== p.camera) el.srcObject = p.camera;
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div aria-hidden="true" className="flex h-full w-full items-center justify-center text-sm font-medium text-[var(--ink-lo)]">
                        {p.nome.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm text-[var(--ink-hi)]">
                      {p.nome}
                      {p.mudo && <MicOff size={12} aria-label="mudo" className="shrink-0 text-[var(--ink-lo)]" />}
                    </p>
                    <p className="truncate text-xs text-[var(--ink-lo)]">{estaNoPalco ? 'No palco: entra nas cenas com convidados' : 'Na conversa, fora do ar'}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPalco(p.id, !estaNoPalco)}
                    disabled={!estaNoPalco && lugares === 0}
                    title={!estaNoPalco && lugares === 0 ? `O plano põe até ${limiteDePessoas} pessoas na tela, contando você.` : undefined}
                    className="shrink-0"
                  >
                    {estaNoPalco ? 'Tirar do palco' : 'Pôr no palco'}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        {pessoas.length > 0 && (
          <p className="mt-2 text-pretty text-xs text-[var(--ink-lo)]">
            {lugares === 0
              ? `O palco está cheio: o plano põe até ${limiteDePessoas} pessoas na tela, contando você.`
              : `Cabem mais ${lugares} no palco (${limiteDePessoas} pessoas na tela pelo plano, contando você).`}
          </p>
        )}
      </section>
    </div>
  );
}
