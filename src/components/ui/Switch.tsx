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
  /**
   * Gravando a mudança: o interruptor fica onde está até o banco confirmar.
   * Anuncia `aria-busy`, fica a 45 % e ignora o clique. É `aria-disabled`, e
   * não `disabled`, para não tirar o foco de quem usa o teclado.
   */
  ocupado?: boolean;
}

export function Switch({ checked, onChange, rotulo, disabled = false, ocupado = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={rotulo}
      aria-busy={ocupado || undefined}
      aria-disabled={ocupado || undefined}
      disabled={disabled}
      onClick={() => {
        if (!ocupado) onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors duration-150 ease-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 aria-busy:cursor-progress aria-busy:opacity-45 ${
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
