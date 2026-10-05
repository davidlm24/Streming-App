/**
 * Cópia para a área de transferência, com falha visível.
 *
 * A auditoria encontrou 26 chamadas de `navigator.clipboard.writeText` e
 * ZERO `.catch()`. A interface marcava "Copiado!" mesmo quando a escrita
 * falhava em silêncio — e um dos valores copiados é a CHAVE RTMP, sem a qual
 * a transmissão simplesmente não sobe. O usuário colava nada no OBS e não
 * tinha como saber por quê.
 *
 * Falha acontece de verdade: contexto sem HTTPS, permissão negada, navegador
 * mais antigo, iframe sem `clipboard-write`.
 *
 * O aviso é registrado pelo ToastProvider em vez de importado aqui, para que
 * este módulo continue sendo utilitário puro, sem depender de React.
 */

type Notify = (title: string, detail?: string) => void;

let notify: Notify | null = null;

export function registerClipboardErrorHandler(fn: Notify | null) {
  notify = fn;
}

/** Devolve `true` se copiou. Nunca lança. */
export async function copyText(value: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard indisponível');
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    notify?.(
      'Não foi possível copiar',
      'Seu navegador bloqueou a área de transferência. Selecione o texto e copie manualmente.'
    );
    return false;
  }
}
