import { useState } from 'react';
import type { PlanId } from '../lib/plans';
import { ListaDePlanos, SeletorDePeriodo, type Periodo } from './ListaDePlanos';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface PlansModalProps {
  onClose: () => void;
  currentPlan: string;
  /** Por que o modal abriu: o estúdio tentou transmitir ou gravar sem plano. */
  reason?: 'live' | 'record' | 'upgrade' | null;
}

/**
 * Os planos por cima do estúdio: quando ele barra uma live ou uma gravação,
 * e nos "Ver planos" de dentro do estúdio (fora dele, `abrirPlanos` leva à
 * página de plano). Mesma lista e mesma regra da página: a assinatura abre
 * em breve, então não há checkout aqui.
 *
 * Era o outro checkout do app: chamava o pagamento de verdade ("Pagar e
 * ativar"), oferecia um PayPal que o servidor nem aceita, e o plano não
 * seria ativado depois do pagamento — a ativação automática não existe em
 * produção.
 */
export function PlansModal({ onClose, currentPlan, reason }: PlansModalProps) {
  const [periodo, setPeriodo] = useState<Periodo>('mensal');

  const barrado = reason === 'live' || reason === 'record';
  const titulo = barrado ? 'Seu teste acabou' : 'Planos';
  const descricao =
    reason === 'live'
      ? 'Transmitir ao vivo pede um plano. O estúdio continua abrindo para você montar cenas.'
      : reason === 'record'
        ? 'Gravar pede um plano. O estúdio continua abrindo para você montar cenas.'
        : undefined;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={titulo}
      description={descricao}
      size="lg"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <p className="text-sm text-[var(--ink-lo)]">A assinatura abre em breve. Hoje nenhuma cobrança é feita.</p>
        <SeletorDePeriodo periodo={periodo} onChange={setPeriodo} />
      </div>
      <div className="mt-4">
        <ListaDePlanos planoAtual={currentPlan as PlanId} periodo={periodo} semLinhaFinal />
      </div>
    </Modal>
  );
}
