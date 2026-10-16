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
  /** Com `action`, o aviso leva ao próximo passo (ex.: "Ver planos"). */
  info: (title: string, detail?: string, action?: Toast['action']) => void;
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
  // A tinta da marca que troca com o tema: brand-lift no escuro, brand-deep no claro
  info: 'text-[var(--sel-ink)]',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  // Quanto falta a cada aviso: a pilha pausa enquanto o mouse ou o foco estão
  // nela, e retoma de onde parou (WCAG 2.2.1 — dá tempo de chegar à ação)
  const vida = useRef(new Map<number, { fim: number; restante: number }>());
  /** Os avisos sob o mouse ou com o foco dentro: enquanto houver um, a pilha não corre. */
  const segurados = useRef(new Set<string>());
  // O dismiss nasce antes de quem retoma a pilha: o ref aponta para a versão atual
  const correrRef = useRef<() => void>(() => {});

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    vida.current.delete(id);
    const seguravam = segurados.current.size;
    segurados.current.delete(`mouse-${id}`);
    segurados.current.delete(`foco-${id}`);
    if (seguravam > 0 && segurados.current.size === 0) correrRef.current();
  }, []);

  const agendar = useCallback((id: number, ms: number) => {
    vida.current.set(id, { fim: Date.now() + ms, restante: ms });
    if (segurados.current.size > 0) return;
    timers.current.set(id, setTimeout(() => dismiss(id), ms));
  }, [dismiss]);

  const congelar = () => {
    const agora = Date.now();
    timers.current.forEach((timer, id) => {
      clearTimeout(timer);
      const v = vida.current.get(id);
      if (v) v.restante = Math.max(0, v.fim - agora);
    });
    timers.current.clear();
  };
  const correr = () => {
    // Ao soltar, cada um ganha pelo menos 1,5 s para não sumir no mesmo instante
    vida.current.forEach((v, id) => {
      if (!timers.current.has(id)) agendar(id, Math.max(1500, v.restante));
    });
  };

  /** `fonte` diz quem segura: o mouse ou o foco, de cada aviso. */
  const segurar = useCallback((fonte: string) => {
    const antes = segurados.current.size;
    segurados.current.add(fonte);
    if (antes === 0) congelar();
  }, []);
  const soltar = useCallback((fonte: string) => {
    if (!segurados.current.delete(fonte)) return;
    if (segurados.current.size === 0) correr();
  }, [agendar]);
  correrRef.current = correr;

  const push = useCallback((kind: ToastKind, title: string, detail?: string, action?: Toast['action']) => {
    const id = nextId.current++;
    setToasts(prev => [...prev.slice(-3), { id, kind, title, detail, action }]);
    // Com ação, o aviso fica até ser usado ou dispensado: é a única porta para ela
    if (!action) agendar(id, LIFETIME[kind]);
  }, [agendar]);

  useEffect(() => {
    const map = timers.current;
    return () => { map.forEach(clearTimeout); map.clear(); };
  }, []);

  // Quem saiu da pilha (pelo limite de quatro, ou dispensado) deixa de contar:
  // o timer, a vida e a mão que o segurava — um aviso que some com o mouse em
  // cima não dispara pointerleave, e a pilha ficaria congelada para sempre
  useEffect(() => {
    const vivos = new Set(toasts.map(t => t.id));
    timers.current.forEach((timer, id) => {
      if (vivos.has(id)) return;
      clearTimeout(timer);
      timers.current.delete(id);
    });
    vida.current.forEach((_, id) => { if (!vivos.has(id)) vida.current.delete(id); });
    const seguravam = segurados.current.size;
    segurados.current.forEach(fonte => {
      if (!vivos.has(Number(fonte.slice(fonte.indexOf('-') + 1)))) segurados.current.delete(fonte);
    });
    if (seguravam > 0 && segurados.current.size === 0) correrRef.current();
  }, [toasts]);

  // Liga o utilitário de área de transferência a esta camada, sem que ele
  // precise importar React.
  useEffect(() => {
    registerClipboardErrorHandler((title, detail) => push('error', title, detail));
    return () => registerClipboardErrorHandler(null);
  }, [push]);

  const api = useMemo<ToastApi>(() => ({
    success: (t, d) => push('success', t, d),
    error: (t, d, a) => push('error', t, d, a),
    info: (t, d, a) => push('info', t, d, a),
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
        // Cada aviso novo é lido sozinho, não a pilha inteira de novo
        aria-atomic="false"
      >
        {toasts.map(t => {
          const Icon = ICON[t.kind];
          return (
            <div
              key={t.id}
              onPointerEnter={() => segurar(`mouse-${t.id}`)}
              onPointerLeave={() => soltar(`mouse-${t.id}`)}
              onFocus={() => segurar(`foco-${t.id}`)}
              onBlur={() => soltar(`foco-${t.id}`)}
              className="pointer-events-auto sm:w-80 flex items-start gap-3 bg-[var(--raise)] border border-[var(--line)] rounded-2xl p-3.5 shadow-[var(--shadow-float)] animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <Icon size={16} className={`${TONE[t.kind]} shrink-0 mt-0.5`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--ink-hi)] leading-snug">{t.title}</p>
                {t.detail && <p className="mt-0.5 text-xs text-[var(--ink-lo)] leading-relaxed">{t.detail}</p>}
                {t.action && (
                  <button
                    type="button"
                    onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                    className="mt-1.5 inline-flex min-h-8 items-center text-xs font-semibold text-[var(--sel-ink)] underline-offset-4 hover:underline cursor-pointer"
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
