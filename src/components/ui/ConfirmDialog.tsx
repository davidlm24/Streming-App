import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

/**
 * Confirmação, sobre a primitiva de modal.
 *
 * Substitui `window.confirm()`, que bloqueia a thread principal: no meio de
 * uma transmissão isso trava vídeo, chat e encoder até alguém clicar OK.
 *
 * A api é uma Promise para que os pontos de chamada existentes — escritos em
 * volta do retorno booleano de `confirm()` — migrem quase sem reescrita:
 *
 *   if (!window.confirm('Apagar?')) return;   ->   if (!(await confirm({...}))) return;
 */

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Ações irreversíveis recebem o vermelho de sinal e foco no cancelar. */
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>(resolve => { resolver.current = resolve; });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal
        isOpen={options !== null}
        onClose={() => settle(false)}
        title={options?.title}
        description={options?.description}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => settle(false)}>
              {options?.cancelLabel ?? 'Cancelar'}
            </Button>
            <Button
              variant={options?.destructive ? 'danger' : 'primary'}
              onClick={() => settle(true)}
            >
              {options?.confirmLabel ?? 'Confirmar'}
            </Button>
          </>
        }
      >
        {/* O texto vive em `description`, no cabeçalho, ligado por
            aria-describedby. O corpo fica vazio de propósito. */}
        <span className="sr-only">{options?.description}</span>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  // Fora do provider, recusa em vez de prosseguir: para uma ação destrutiva,
  // "não" é o padrão seguro.
  return ctx ?? (async () => false);
}
