import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

interface BotaoDeIconeProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Obrigatório: um botão só-ícone sem nome é mudo para leitor de tela. */
  rotulo: string;
  children: ReactNode;
}

/**
 * Botão só-ícone. O nome acessível é parte da assinatura, não um detalhe
 * lembrado depois — a auditoria achou 23 botões assim sem nome nenhum.
 * Alvo de 44px (size-11): é o que se toca no celular.
 */
export const BotaoDeIcone = forwardRef<HTMLButtonElement, BotaoDeIconeProps>(function BotaoDeIcone(
  { rotulo, children, className = '', type, ...resto },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      aria-label={rotulo}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-[var(--ink-hi)] transition-colors duration-150 hover:bg-[var(--raise)] cursor-pointer ${className}`}
      {...resto}
    >
      {children}
    </button>
  );
});
