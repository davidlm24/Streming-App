import React, { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Primitiva de sobreposição.
 *
 * A auditoria encontrou 20 raízes de modal feitas à mão, e entre todas elas:
 * zero `role="dialog"`, zero `aria-modal`, zero ESC, zero clique no fundo,
 * zero trava de rolagem, zero armadilha de foco, zero devolução de foco — e
 * 11 valores avulsos de z-index escalando até `z-[99999]`.
 *
 * As duas frentes da auditoria chegaram aqui por caminhos diferentes: uma
 * apontou a falta de semântica de diálogo, a outra a falta de mecânica. É o
 * mesmo componente ausente.
 */

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Larguras nomeadas em vez de um número avulso por chamada. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Fluxos destrutivos podem exigir escolha explícita. */
  dismissible?: boolean;
  /** Rótulo acessível quando não há `title` visível. */
  ariaLabel?: string;
  /** Ícone à esquerda do título. Vários diálogos do produto usam um. */
  icon?: React.ReactNode;
  /** Sem cromo: o conteúdo desenha o próprio cabeçalho e rodapé.
      Necessário para os diálogos grandes, que têm layout interno próprio. */
  bare?: boolean;
}

const SIZES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/** Elementos que podem receber foco dentro do diálogo. */
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Conta quantos diálogos estão abertos, para não destravar a rolagem cedo. */
let openCount = 0;

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
  ariaLabel,
  icon,
  bare = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useRef(`modal-title-${Math.round(performance.now() * 1000)}`).current;
  const descId = `${titleId}-desc`;

  const handleClose = useCallback(() => {
    if (dismissible) onClose();
  }, [dismissible, onClose]);

  // ── trava de rolagem ────────────────────────────────────────────────────
  // Contada: com dois diálogos abertos, fechar o de cima não pode devolver a
  // rolagem enquanto o de baixo continua aberto.
  useEffect(() => {
    if (!isOpen) return;
    openCount += 1;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      openCount -= 1;
      if (openCount === 0) document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // ── foco: prende dentro, devolve ao fechar ──────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    if (panel) {
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter(el => el.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      // Devolve o foco a quem abriu — sem isto o teclado volta ao topo da
      // página, que é como se perde o lugar numa lista longa.
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-150"
      style={{ zIndex: 'var(--z-scrim)' }}
    >
      <div
        className="absolute inset-0 bg-[var(--color-n-0)]/70 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`relative flex flex-col animate-in fade-in zoom-in-95 duration-200 ${
          bare
            ? 'w-full items-center'
            : `w-full ${SIZES[size]} bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl max-h-[calc(100dvh-2rem)]`
        }`}
        style={{ zIndex: 'var(--z-modal)' }}
      >
        {!bare && (title || dismissible) && (
          <header className="flex items-start gap-4 px-5 pt-5 pb-3 border-b border-[var(--line)]">
            {icon && <span className="shrink-0 mt-0.5 text-[var(--ink-lo)]">{icon}</span>}
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id={titleId} className="text-base font-semibold text-[var(--ink-hi)] leading-snug">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="mt-1 text-sm text-[var(--ink-lo)] leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="shrink-0 -mt-1 -mr-1 p-2 rounded-xl text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--raise)] active:scale-95 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </header>
        )}

        {bare ? children : (
          <div className="px-5 py-4 overflow-y-auto text-sm text-[var(--ink)]">{children}</div>
        )}

        {!bare && footer && (
          <footer className="flex flex-wrap justify-end gap-2.5 px-5 pb-5 pt-3 border-t border-[var(--line)]">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
