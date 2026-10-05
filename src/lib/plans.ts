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
      'Transmissão para até 2 destinos',
      'Aviso de renovação opcional'
    ],
    popular: false
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
      'Qualidade máxima 780p',
      'Transmissão em formato Paisagem + Retrato',
      'Teleprompter'
    ],
    popular: false
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
    popular: true
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
    popular: false
  }
];

export const getPlan = (id: PlanId) => PLANS.find(p => p.id === id);
