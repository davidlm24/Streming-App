import { useState } from 'react';
import type { Destination } from '../types';
import { nomeDaPlataforma } from '../lib/canais';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { PlataformaIcone } from './ui/PlataformaIcone';
import { Switch } from './ui/Switch';

interface CanaisAcimaDoPlanoProps {
  aberto: boolean;
  /** Os canais ligados agora — mais do que o plano transmite. */
  ligados: Destination[];
  /** Canais ligados ao mesmo tempo que o plano permite. */
  limite: number;
  onCancelar: () => void;
  /** Desliga estes canais e entra no ar. */
  onEntrarNoAr: (idsParaDesligar: string[]) => void;
  onVerPlanos: () => void;
}

/**
 * A porta de entrada no ar quando há mais canais ligados do que o plano
 * transmite (plano que mudou, dado antigo). Antes o estúdio ia ao ar para
 * todos; barrar só com um aviso deixaria o operador procurando a lista na
 * hora de começar. Aqui ele escolhe quais ficam e entra no ar no mesmo lugar.
 * Nada é desligado até "Entrar no ar"; cancelar não muda canal nenhum.
 */
export function CanaisAcimaDoPlano({ aberto, ligados, limite, onCancelar, onEntrarNoAr, onVerPlanos }: CanaisAcimaDoPlanoProps) {
  const [desligar, setDesligar] = useState<Set<string>>(new Set());

  // Cada abertura começa com todos ligados, como estão de fato
  const [abertoAntes, setAbertoAntes] = useState(aberto);
  if (aberto !== abertoAntes) {
    setAbertoAntes(aberto);
    if (aberto) setDesligar(new Set());
  }

  const ficam = ligados.length - desligar.size;
  const excedente = ficam - limite;
  const alternar = (id: string) =>
    setDesligar((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });

  return (
    <Modal
      isOpen={aberto}
      onClose={onCancelar}
      title="Escolha para onde a live vai"
      description={`Seu plano transmite para ${limite} canais ao mesmo tempo, e ${ligados.length} estão ligados.`}
      footer={
        <>
          <span className="mr-auto self-center">
            <AcaoDeTexto onClick={onVerPlanos}>Ver planos</AcaoDeTexto>
          </span>
          <Button variant="ghost" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button disabled={excedente > 0} onClick={() => onEntrarNoAr([...desligar])}>
            Entrar no ar
          </Button>
        </>
      }
    >
      <p role="status" className="text-sm text-[var(--ink-hi)]">
        {excedente > 0
          ? `Desligue mais ${excedente} para entrar no ar.`
          : `A live vai para ${ficam} ${ficam === 1 ? 'canal' : 'canais'}.`}
      </p>
      <ul className="mt-3 divide-y divide-[var(--line)]">
        {ligados.map((canal) => (
          <li key={canal.id} className="flex items-center gap-3 py-3">
            <PlataformaIcone plataforma={canal.platform} size={18} className="shrink-0 text-[var(--ink-lo)]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-[var(--ink-hi)]">{canal.name}</span>
              <span className="block text-xs text-[var(--ink-lo)]">{nomeDaPlataforma(canal.platform)}</span>
            </span>
            <Switch
              checked={!desligar.has(canal.id)}
              onChange={() => alternar(canal.id)}
              rotulo={`Transmitir para ${canal.name}`}
            />
          </li>
        ))}
      </ul>
    </Modal>
  );
}
