import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * O botão do sistema.
 *
 * Havia 544 `<button>` em 34 arquivos e nenhuma primitiva: cada um
 * reinventava o seu preenchimento, seu raio e seus estados. A auditoria
 * mediu 920 `hover:` contra 48 `active:` e ZERO `focus-visible:` — o estado
 * que enfeita aparecia dezenove vezes mais que o estado que serve para
 * operar por teclado.
 *
 * A aparência mora em `.btn` no index.css, não aqui. Isso é de propósito:
 * um `<button>` ainda não migrado adota o sistema inteiro acrescentando
 * `className="btn"`, sem precisar trocar de componente. A migração pode ser
 * gradual sem ficar pela metade.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** `primary` preenche com a marca, `ghost` é o secundário, `danger` encerra. */
  variant?: 'primary' | 'ghost' | 'danger';
  /** `sm` para superfícies densas — estúdio, tabelas de faturamento. */
  size?: 'sm' | 'md';
  /**
   * Em progresso. Desabilita E anuncia: `aria-busy` sem `disabled` deixa
   * clicar duas vezes, e `disabled` sozinho não diz ao leitor de tela por
   * que o botão parou de responder.
   */
  loading?: boolean;
  /** Ícone à esquerda do rótulo. Suprimido enquanto `loading`. */
  icon?: React.ReactNode;
}

const VARIANT = {
  primary: '',
  ghost: 'btn--ghost',
  danger: 'btn--danger',
} as const;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, icon, disabled, className = '', children, type, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      // Um `<button>` sem `type` dentro de um `<form>` envia o formulário.
      // Era a causa de recarregamentos inteiros disparados por botões que
      // só queriam abrir um painel.
      type={type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`btn ${VARIANT[variant]} ${size === 'sm' ? 'btn--sm' : ''} ${className}`.replace(/\s+/g, ' ').trim()}
      {...rest}
    >
      {loading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
});
