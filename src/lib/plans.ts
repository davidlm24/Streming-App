/**
 * Fonte única de preço e conteúdo dos planos.
 *
 * Havia TRÊS tabelas independentes para as mesmas três assinaturas:
 *   AuthAndPricing.tsx    49,90 / 99,90 / 199,90  em R$
 *   PlansModal.tsx        49,90 / 99,90 / 199,90  em R$  (literais próprios)
 *   BillingDashboard.tsx     14 /    29 /     49  em USD
 *
 * O cliente via um preço na vitrine, assinava, e encontrava outro número em
 * outra moeda na tela de cobrança. Não era rótulo divergente — eram tabelas
 * diferentes, e nenhuma sabia da existência das outras.
 *
 * O real é o canônico: é o que a vitrine anuncia, é a moeda do PIX e do
 * Mercado Pago, e o produto é pt-BR. A tabela em dólar era a defeituosa.
 *
 * Preço novo entra AQUI. Se uma tela precisar de algo que este módulo não
 * expõe, estenda o módulo — não reintroduza um literal na tela.
 */

export type PlanId = 'Free Trial' | 'Standard' | 'Professional' | 'Business';

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  badge: string;
  buttonText: string;
  description: string;
  features: string[];
  popular: boolean;
  /**
   * Canais ligados ao mesmo tempo. O modal de canais tinha a própria tabela
   * (Standard com 2, "Business ilimitado") contradizendo a vitrine (3 e 8).
   * A frase em `features` descreve; este número decide.
   */
  destinosSimultaneos: number;
  /** Servidor RTMP próprio como destino ("Destinos RTMP personalizados"). */
  rtmpProprio: boolean;
  /** Pessoas na tela ao mesmo tempo. Como os outros números: `features` descreve, este decide. */
  participantes: number;
  /** Horas de transmissão ao vivo que o plano anuncia ("3 horas da transmissão ao vivo"). */
  horasDeTransmissao?: number;
  /** Limite de gravação por live, quando o plano tem um (o gratuito: 15 minutos). */
  minutosDeGravacaoPorLive?: number;
  /** Duração do teste, no plano que é teste. */
  diasDeTeste?: number;
}

export const CURRENCY = 'BRL' as const;

/**
 * Formata em pt-BR. Usar SEMPRE isto. Um `toFixed(2)` com cifrão escrito à
 * mão na frente foi exatamente como a tela de faturamento passou a exibir
 * dólar sem ninguém ter decidido isso.
 */
export function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 2,
  });
}

export const PLANS: Plan[] = [
  {
    id: 'Free Trial',
    name: 'Plano Gratuito',
    priceMonthly: 0,
    priceAnnual: 0,
    badge: 'Teste sem compromisso',
    buttonText: 'Iniciar 30 Dias Grátis',
    description: 'Experimente a potência máxima da plataforma gratuitamente.',
    features: [
      'Acesso completo ao estúdio de transmissão',
      '30 dias de teste gratuito',
      'Até 3 participantes simultâneos',
      'Conecte o OBS, vMix, etc.',
      'Gravação de até 15 minutos por live',
      'Transmissão para até 2 destinos'
    ],
    popular: false,
    destinosSimultaneos: 2,
    rtmpProprio: false,
    participantes: 3,
    minutosDeGravacaoPorLive: 15,
    diasDeTeste: 30
  },
  {
    id: 'Standard',
    name: 'Standard',
    priceMonthly: 49.90,
    priceAnnual: 39.90,
    badge: 'Para Criadores',
    buttonText: 'Selecionar Plano',
    description: 'Para criadores e streamers independentes que buscam consistência.',
    features: [
      'Transmissão simultânea para 3 canais',
      'Destinos RTMP personalizados',
      'Compartilhamento de tela',
      'Conecte o OBS, vMix, etc.',
      'Gravações na nuvem',
      'Sem marca d\'água da plataforma',
      'Logos, fontes e gráficos personalizados',
      '3 horas da transmissão ao vivo',
      'Até 6 participantes na tela ao vivo',
      'Qualidade máxima 720p',
      'Transmissão em formato Paisagem + Retrato',
      'Teleprompter'
    ],
    popular: false,
    destinosSimultaneos: 3,
    rtmpProprio: true,
    participantes: 6,
    horasDeTransmissao: 3
  },
  {
    id: 'Professional',
    name: 'Professional',
    priceMonthly: 99.90,
    priceAnnual: 79.90,
    badge: 'Melhor Custo-Benefício',
    buttonText: 'Selecionar Plano',
    description: 'Melhor custo-benefício para profissionais e estúdios de gravação.',
    features: [
      'Transmissão simultânea para 5 canais',
      'Destinos RTMP personalizados',
      'Compartilhamento de tela',
      'Conecte o OBS, vMix, etc.',
      'Gravações na nuvem',
      'Sem marca d\'água da plataforma',
      'Logos, fontes e gráficos personalizados',
      '6 horas da transmissão ao vivo',
      'Até 8 participantes na tela ao vivo',
      'Qualidade máxima Full HD 1080p',
      'Transmissão em formato Paisagem + Retrato',
      'Teleprompter',
      'Fluxo incorporado'
    ],
    popular: true,
    destinosSimultaneos: 5,
    rtmpProprio: true,
    participantes: 8,
    horasDeTransmissao: 6
  },
  {
    id: 'Business',
    name: 'Business',
    priceMonthly: 199.90,
    priceAnnual: 159.90,
    badge: 'Corporativo',
    buttonText: 'Selecionar Plano',
    description: 'Para agências, marcas de renome e grandes empresas.',
    features: [
      'Transmissão simultânea para 8 canais',
      'Destinos RTMP personalizados',
      'Compartilhamento de tela',
      'Conecte o OBS, vMix, etc.',
      'Gravações na nuvem',
      'Sem marca d\'água da plataforma',
      'Logos, fontes e gráficos personalizados',
      '10 horas da transmissão ao vivo',
      'Até 12 participantes na tela ao vivo',
      'Qualidade máxima Full HD 1080p',
      'Transmissão em formato Paisagem + Retrato',
      'Teleprompter',
      'Vendas ao vivo',
      'Fluxo incorporado',
      'Múltiplas câmeras'
    ],
    popular: false,
    destinosSimultaneos: 8,
    rtmpProprio: true,
    participantes: 12,
    horasDeTransmissao: 10
  }
];

export const getPlan = (id: PlanId) => PLANS.find(p => p.id === id);

/**
 * Quanto o anual economiza por mês, em %, arredondado — o menor entre os
 * planos pagos, para o rótulo nunca prometer mais do que algum plano dá.
 */
export const descontoAnual = () =>
  Math.round(Math.min(...PLANS.filter(p => p.priceMonthly > 0).map(p => 1 - p.priceAnnual / p.priceMonthly)) * 100);

/** Quantos canais o plano deixa ligados ao mesmo tempo. Sem plano, o do teste. */
export const limiteDeCanaisLigados = (id?: PlanId) => (getPlan(id ?? 'Free Trial') ?? PLANS[0]).destinosSimultaneos;
