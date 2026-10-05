import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';

/**
 * O erro de um campo, no lugar da dica: ícone e frase em tinta alta, nunca
 * em carmim. O campo aponta para `id` com `aria-describedby` e recebe
 * `aria-invalid`, e a regra global do index.css sobe a borda dele.
 */
export function ErroDeCampo({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-pretty text-xs text-[var(--ink-hi)]">
      <CircleAlert size={14} aria-hidden="true" className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}
