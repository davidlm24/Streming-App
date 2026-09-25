import { useState } from 'react';
import { PLANS, getPlan, type PlanId } from '../lib/plans';
import { ListaDePlanos, SeletorDePeriodo, type Periodo } from './ListaDePlanos';
import { CabecalhoDePagina, Pagina, SecaoDePagina } from './ui/Pagina';

interface PlanoPaginaProps {
  user: { plan: PlanId; isExpired: boolean; trialDays: number } | null;
}

/** O que acontece sem plano: vale para o teste que acabou e para o que vai acabar. */
const SEM_PLANO = 'o estúdio continua abrindo para montar cenas, mas só transmite e grava com um plano.';

// Só o que a página não diz em outro lugar: cada fato aparece uma vez.
const PERGUNTAS = [
  {
    pergunta: 'O que muda de um plano para outro?',
    resposta: 'Principalmente quantos canais recebem a live ao mesmo tempo, quantas pessoas cabem na tela e o tempo de transmissão. O Business soma vendas ao vivo e múltiplas câmeras. Abra um plano na lista para ver tudo o que ele inclui.',
  },
  {
    pergunta: 'Onde ficam as faturas?',
    resposta: 'Aqui, quando a assinatura abrir. Hoje não há cobranças, então não há faturas.',
  },
];

/**
 * Plano e cobrança: o que eu tenho, o que existe, quando posso assinar.
 *
 * Era a tela de "Configurações da Conta" com abas: um checkout que dava o
 * plano pago sem cobrar e dizia "pagamento processado com sucesso", um
 * PayPal de mentira que pedia a senha da pessoa, faturas e consumo
 * inventados guardados no navegador, e preços em dólar ("$49.9.00"). A
 * cobrança ainda não está ligada, então a página diz isso — e mostra só o
 * que é real: o plano, o teste e os planos de plans.ts.
 */
export function PlanoPagina({ user }: PlanoPaginaProps) {
  const [periodo, setPeriodo] = useState<Periodo>('mensal');
  const plano = getPlan(user?.plan ?? 'Free Trial') ?? PLANS[0];
  const emTeste = plano.id === 'Free Trial';
  const dias = user?.trialDays ?? 0;

  let situacao: string;
  if (emTeste && user?.isExpired) {
    situacao = `Seu teste grátis acabou. Sem assinatura, ${SEM_PLANO}`;
  } else if (emTeste) {
    const prazo = dias <= 0 ? 'termina hoje' : `faltam ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
    situacao = `Teste grátis: ${prazo}. Quando ele acabar, ${SEM_PLANO}`;
  } else {
    situacao = 'Assinatura ativa.';
  }

  return (
    <Pagina>
      <CabecalhoDePagina titulo="Plano e cobrança" />

      <SecaoDePagina id="plano-seu" titulo="Seu plano">
        {/* Os limites do plano ficam na lista, na linha marcada "seu plano" */}
        <p className="mt-4 text-sm font-medium text-[var(--ink-hi)]">{plano.name}</p>
        <p className="mt-1 max-w-prose text-sm text-[var(--ink)]">{situacao}</p>
      </SecaoDePagina>

      <SecaoDePagina id="plano-planos" titulo="Planos" acao={<SeletorDePeriodo periodo={periodo} onChange={setPeriodo} />}>
        <div className="mt-4">
          <ListaDePlanos planoAtual={plano.id} periodo={periodo} />
        </div>
        <p className="mt-4 max-w-prose text-sm text-[var(--ink-lo)]">
          A assinatura abre em breve, por aqui mesmo. Hoje nenhuma cobrança é feita.
        </p>
      </SecaoDePagina>

      <SecaoDePagina id="plano-perguntas" titulo="Perguntas">
        <dl className="mt-2 divide-y divide-[var(--line)]">
          {PERGUNTAS.map(({ pergunta, resposta }) => (
            <div key={pergunta} className="py-4">
              <dt className="text-sm font-medium text-[var(--ink-hi)]">{pergunta}</dt>
              <dd className="mt-1 max-w-prose text-sm text-[var(--ink-lo)]">{resposta}</dd>
            </div>
          ))}
        </dl>
      </SecaoDePagina>
    </Pagina>
  );
}
