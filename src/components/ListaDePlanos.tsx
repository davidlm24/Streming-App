import { useState } from 'react';
import { Check } from 'lucide-react';
import { PLANS, descontoAnual, formatPrice, type Plan, type PlanId } from '../lib/plans';
import { LinhaDeAcao } from './ui/LinhaDeAcao';
import { Segmentado } from './ui/Segmentado';

export type Periodo = 'mensal' | 'anual';

/**
 * O preço no período: a cifra que se compara e, no anual, o total do ano
 * logo abaixo. Números tabulares, para as linhas se lerem em coluna.
 */
function Preco({ plano, periodo }: { plano: Plan; periodo: Periodo }) {
  if (plano.priceMonthly === 0) {
    return (
      <>
        <span className="block text-sm font-medium text-[var(--ink-hi)]">Grátis</span>
        {plano.diasDeTeste && <span className="block text-xs text-[var(--ink-lo)]">por {plano.diasDeTeste}&nbsp;dias</span>}
      </>
    );
  }
  const mensal = periodo === 'mensal' ? plano.priceMonthly : plano.priceAnnual;
  return (
    <>
      <span className="block text-sm font-medium tabular-nums text-[var(--ink-hi)]">{formatPrice(mensal)}/mês</span>
      {periodo === 'anual' && (
        <span className="block text-xs tabular-nums text-[var(--ink-lo)]">{formatPrice(plano.priceAnnual * 12)} por ano</span>
      )}
    </>
  );
}

/**
 * Os limites que decidem a escolha, dos campos do plano (e não das
 * frases da vitrine): canais, pessoas na tela e, nos pagos, as horas de
 * transmissão. O limite de gravação do gratuito saiu com a gravação, que o
 * estúdio ainda não faz (o botão só conta o tempo).
 */
export function limitesDoPlano(plano: Plan): string {
  // Espaço inseparável ( ) entre número e unidade e no fim de cada
  // limite: no celular a linha quebrava em "3 | horas" e deixava "vivo" sozinho.
  const partes = [`${plano.destinosSimultaneos} canais ao mesmo tempo`, `${plano.participantes} pessoas na tela`];
  if (plano.horasDeTransmissao) partes.push(`${plano.horasDeTransmissao} horas de transmissão ao vivo`);
  return partes.join(' · ');
}

/** Mensal ou anual. O desconto do rótulo vem dos preços de plans.ts. */
export function SeletorDePeriodo({ periodo, onChange }: { periodo: Periodo; onChange: (p: Periodo) => void }) {
  return (
    <Segmentado
      rotulo="Período de cobrança"
      opcoes={[
        { valor: 'mensal', rotulo: 'Mensal' },
        { valor: 'anual', rotulo: `Anual, ${descontoAnual()}% menos` },
      ]}
      valor={periodo}
      onChange={onChange}
    />
  );
}

/**
 * Os quatro planos em linhas de ação: nome e limites à esquerda, o preço à
 * direita. Cada linha abre a lista completa do plano, com as frases da
 * vitrine. A mesma lista na página de plano e no modal do estúdio — eram
 * duas tabelas de preço, uma em dólar, e dois checkouts.
 *
 * `semLinhaFinal`: dentro de um diálogo o rodapé já traz a linha de baixo.
 * `semLinhaInicial`: quando a linha de cima já existe fora da lista (no
 * início do site, ao lado do título da seção, ela dobraria a linha da seção).
 */
export function ListaDePlanos({
  planoAtual,
  periodo,
  semLinhaInicial = false,
  semLinhaFinal = false,
}: {
  planoAtual?: PlanId;
  periodo: Periodo;
  semLinhaInicial?: boolean;
  semLinhaFinal?: boolean;
}) {
  const [aberto, setAberto] = useState<PlanId | null>(null);

  return (
    <ul
      className={`divide-y divide-[var(--line)] border-[var(--line)] ${semLinhaInicial ? '' : 'border-t'} ${semLinhaFinal ? '' : 'border-b'}`}
    >
      {PLANS.map((plano) => {
        const idDaLista = `plano-${plano.id.replace(/\s+/g, '-').toLowerCase()}-itens`;
        const expandido = aberto === plano.id;
        const atual = plano.id === planoAtual;
        return (
          <li key={plano.id}>
            <LinhaDeAcao
              tipo="expandir"
              expandido={expandido}
              controla={idDaLista}
              titulo={atual ? `${plano.name} · seu plano` : plano.name}
              descricao={limitesDoPlano(plano)}
              lateral={<Preco plano={plano} periodo={periodo} />}
              onClick={() => setAberto(expandido ? null : plano.id)}
            />
            {expandido && (
              <ul id={idDaLista} className="space-y-2 pb-5">
                {plano.features.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[var(--ink)]">
                    <Check size={14} aria-hidden="true" className="mt-1 shrink-0 text-[var(--ink-lo)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
