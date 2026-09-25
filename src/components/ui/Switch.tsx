/**
 * Interruptor liga/desliga (`role="switch"`).
 *
 * Ligado é tinta cheia (--ink-hi), não a cor da marca: na casca do app a
 * cor fica reservada para a ação da tela. O estado também está no
 * `aria-checked` e na posição do botão, nunca só na cor.
 */
export interface SwitchProps {
  checked: boolean;
  onChange: (proximo: boolean) => void;
  /** Nome acessível — diga o que o interruptor liga ("Transmitir para YouTube"). */
  rotulo: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, rotulo, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={rotulo}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors duration-150 ease-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 ${
        checked
          ? 'bg-[var(--ink-hi)] border-[var(--ink-hi)]'
          : 'bg-[var(--panel)] border-[var(--line-ctl)]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute size-4 rounded-full transition-transform duration-150 ease-out ${
          checked ? 'translate-x-[1.125rem] bg-[var(--bg)]' : 'translate-x-[0.1875rem] bg-[var(--ink-lo)]'
        }`}
      />
    </button>
  );
}
