import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { registerClipboardErrorHandler } from './clipboard';

/**
 * Camada de avisos.
 *
 * O produto não tinha nenhuma: as 26 chamadas de `alert()` existiam porque
 * não havia outro lugar para dizer algo ao usuário. E um diálogo nativo
 * BLOQUEIA a thread principal — no meio de uma transmissão isso trava vídeo,
 * chat e encoder até alguém clicar OK.
 *
 * Fica acima do modal na escala de camadas, de propósito: um aviso disparado
 * de dentro de um diálogo precisa ser visto.
 */

export type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  detail?: string;
  action?: { label: string; onClick: () => void };
}

interface ToastApi {
  success: (title: string, detail?: string) => void;
  error: (title: string, detail?: string, action?: Toast['action']) => void;
  info: (title: string, detail?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Erros ficam mais tempo: exigem leitura, não só ciência. */
const LIFETIME: Record<ToastKind, number> = { success: 3200, error: 6000, info: 4000 };

const ICON: Record<ToastKind, React.ComponentType<{ size?: number; className?: string }>> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const TONE: Record<ToastKind, string> = {
  success: 'text-emerald-400',
  error: 'text-[var(--color-sig-lift)]',
  info: 'text-[var(--color-brand-lift)]',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback((kind: ToastKind, title: string, detail?: string, action?: Toast['action']) => {
    const id = nextId.current++;
    setToasts(prev => [...prev.slice(-3), { id, kind, title, detail, action }]);
    timers.current.set(id, setTimeout(() => dismiss(id), LIFETIME[kind]));
  }, [dismiss]);

  useEffect(() => {
    const map = timers.current;
    return () => { map.forEach(clearTimeout); map.clear(); };
  }, []);

  // Liga o utilitário de área de transferência a esta camada, sem que ele
  // precise importar React.
  useEffect(() => {
    registerClipboardErrorHandler((title, detail) => push('error', title, detail));
    return () => registerClipboardErrorHandler(null);
  }, [push]);

  const api = useMemo<ToastApi>(() => ({
    success: (t, d) => push('success', t, d),
    error: (t, d, a) => push('error', t, d, a),
    info: (t, d) => push('info', t, d),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed bottom-4 right-4 left-4 sm:left-auto flex flex-col gap-2.5 pointer-events-none"
        style={{ zIndex: 'var(--z-toast)' }}
        // `polite` para não interromper leitor de tela no meio de uma frase.
        role="status"
        aria-live="polite"
      >
        {toasts.map(t => {
          const Icon = ICON[t.kind];
          return (
            <div
              key={t.id}
              className="pointer-events-auto sm:w-80 flex items-start gap-3 bg-[var(--raise)] border border-[var(--line-ctl)] rounded-xl p-3.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <Icon size={16} className={`${TONE[t.kind]} shrink-0 mt-0.5`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--ink-hi)] leading-snug">{t.title}</p>
                {t.detail && <p className="mt-0.5 text-xs text-[var(--ink-lo)] leading-relaxed">{t.detail}</p>}
                {t.action && (
                  <button
                    type="button"
                    onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                    className="mt-1.5 text-xs font-semibold text-[var(--color-brand-lift)] hover:underline cursor-pointer"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dispensar aviso"
                className="shrink-0 p-1 -m-1 rounded-lg text-[var(--ink-dim)] hover:text-[var(--ink-hi)] active:scale-95 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Fora do provider devolve uma api inerte em vez de lançar: um componente
 * renderizado isoladamente (teste, storybook) não deve quebrar por causa de
 * um aviso.
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  return ctx ?? {
    success: (t: string) => console.info('[toast:success]', t),
    error: (t: string) => console.warn('[toast:error]', t),
    info: (t: string) => console.info('[toast:info]', t),
  };
}
