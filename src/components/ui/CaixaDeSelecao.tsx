import type { InputHTMLAttributes, ReactNode } from 'react';
import { Check } from 'lucide-react';

type CaixaDeSelecaoProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children' | 'className'> & {
  /** O rótulo da linha (texto, ícone, palavra de estado). A linha inteira marca e desmarca. */
  children: ReactNode;
  /** Classes da linha (`<label>`), não da caixa. */
  className?: string;
};

/**
 * A caixa de seleção do sistema, já dentro da linha rotulada: a linha inteira
 * é o alvo (44px de altura) e o nome acessível é o próprio texto.
 *
 * A caixa tem 20px e raio de 5px (os raios nomeados, de 8px para cima, a
 * deixariam com cara de botão de rádio). Desmarcada, é só a borda — em
 * --ink-dim, que o portão de contraste confere a 3:1 contra toda superfície;
 * a padrão do navegador ficava no cinza dele. Marcada, o preenchimento em
 * tinta alta com o ✓ na cor do fundo. Marcar é estado, e estado fala na
 * rampa: nunca a cor da marca. O foco é o anel global de `:focus-visible`.
 */
export function CaixaDeSelecao({ children, className = '', ...props }: CaixaDeSelecaoProps) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-center gap-3 py-1.5 ${className}`}>
      <span className="relative inline-flex size-5 shrink-0">
        <input
          type="checkbox"
          {...props}
          className="peer size-5 cursor-pointer appearance-none rounded-[5px] border border-[var(--ink-dim)] bg-[var(--well)] transition-colors duration-150 checked:border-[var(--ink-hi)] checked:bg-[var(--ink-hi)] disabled:cursor-not-allowed disabled:opacity-45"
        />
        <Check
          size={14}
          strokeWidth={3}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-auto text-[var(--bg)] opacity-0 peer-checked:opacity-100"
        />
      </span>
      {children}
    </label>
  );
}
