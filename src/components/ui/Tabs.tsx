import type React from 'react';
import { useRef } from 'react';

/**
 * Abas acessíveis, sem impor aparência.
 *
 * O projeto tinha quatro grupos de abas e ZERO `role="tab"` ou
 * `aria-selected`: o leitor de tela anunciava "botão, Planos & Cobrança"
 * sem dizer que era uma aba, nem qual estava aberta. Os quatro grupos têm
 * desenhos diferentes (sublinhado, pílula, cartão), por isso este é um
 * hook e não um componente: devolve só papel, estado e teclado, e cada
 * grupo continua com o próprio className.
 *
 * Padrão WAI-ARIA Tabs com ativação automática: uma única parada de Tab
 * no grupo (a aba ativa), setas esquerda/direita e Home/End trocam de aba.
 *
 *   const abas = useTabs('faturamento', IDS, ativa, selecionar);
 *   <div {...abas.tablist} aria-label="Conta">
 *     {IDS.map(id => <button {...abas.tab(id)} onClick={() => selecionar(id)}>…)}
 *   </div>
 *   {ativa === 'x' && <div {...abas.panel('x')}>…</div>}
 *
 * `selecionar` recebe também a troca por teclado — ponha nele qualquer
 * efeito colateral da troca (limpar erro, resetar passo), não só no onClick.
 */
export function useTabs<T extends string>(
  prefixo: string,
  ids: readonly NoInfer<T>[],
  // T vem so do estado ativo: inferir tambem do setter alarga para string
  ativa: T,
  selecionar: (id: NoInfer<T>) => void,
  /** `vertical` para a lista ao lado do painel (mestre-detalhe): setas ↑ ↓. */
  orientacao: 'horizontal' | 'vertical' = 'horizontal',
) {
  const refs = useRef(new Map<T, HTMLButtonElement | null>());
  const tabId = (id: T) => `${prefixo}-aba-${id}`;
  const panelId = (id: T) => `${prefixo}-painel-${id}`;
  const [proxima, anterior] = orientacao === 'vertical' ? ['ArrowDown', 'ArrowUp'] : ['ArrowRight', 'ArrowLeft'];

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const i = ids.indexOf(ativa);
    const alvo =
      e.key === proxima ? (i + 1) % ids.length :
      e.key === anterior ? (i - 1 + ids.length) % ids.length :
      e.key === 'Home' ? 0 :
      e.key === 'End' ? ids.length - 1 : -1;
    if (alvo < 0) return;
    e.preventDefault();
    selecionar(ids[alvo]);
    refs.current.get(ids[alvo])?.focus();
  };

  return {
    tablist: { role: 'tablist' as const, 'aria-orientation': orientacao },
    tab: (id: T) => ({
      id: tabId(id),
      role: 'tab' as const,
      'aria-selected': ativa === id,
      // Só a aba ativa aponta para o painel: os outros painéis não estão
      // no DOM, e aria-controls para um id inexistente é referência quebrada.
      'aria-controls': ativa === id ? panelId(id) : undefined,
      tabIndex: ativa === id ? 0 : -1,
      onKeyDown,
      ref: (el: HTMLButtonElement | null) => { refs.current.set(id, el); },
    }),
    panel: (id: T) => ({
      id: panelId(id),
      role: 'tabpanel' as const,
      'aria-labelledby': tabId(id),
    }),
  };
}
