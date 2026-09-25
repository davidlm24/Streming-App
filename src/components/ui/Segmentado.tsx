interface SegmentadoProps<T extends string> {
  /** Nome do grupo para leitores de tela ("Tema"). */
  rotulo: string;
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  onChange: (valor: T) => void;
}

/**
 * Escolha entre poucas opções mutuamente exclusivas, lado a lado (tema
 * escuro/claro). A opção ativa sobe um degrau na rampa — sem a cor da marca,
 * que na casca é da ação da tela.
 */
export function Segmentado<T extends string>({ rotulo, opcoes, valor, onChange }: SegmentadoProps<T>) {
  return (
    <div role="group" aria-label={rotulo} className="inline-flex shrink-0 rounded-xl border border-[var(--line-ctl)] p-0.5">
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          aria-pressed={valor === opcao.valor}
          onClick={() => onChange(opcao.valor)}
          className={`rounded-[10px] px-3 py-1.5 text-sm transition-colors duration-150 cursor-pointer ${
            valor === opcao.valor ? 'bg-[var(--raise)] text-[var(--ink-hi)]' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
          }`}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}
