interface SegmentadoProps<T extends string> {
  /** Nome do grupo para leitores de tela ("Tema"). */
  rotulo: string;
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  onChange: (valor: T) => void;
  /**
   * `cheia` ocupa a largura de quem o contém, com as opções divididas por
   * igual. É para colunas estreitas, como os painéis do estúdio, onde o
   * controle na largura do texto passava da borda e cortava a última opção.
   */
  largura?: 'justa' | 'cheia';
  /** Nenhuma opção responde (ex.: a duração do cronômetro enquanto ele anda). */
  desativado?: boolean;
  /**
   * Aplicando a escolha: as opções ficam a 45 % e ignoram o clique, mas
   * continuam focáveis (`aria-disabled`, como no Switch). Com `disabled`, o
   * botão apertado pelo teclado perdia o foco para o <body>.
   */
  ocupado?: boolean;
}

/**
 * Escolha entre poucas opções mutuamente exclusivas, lado a lado (tema
 * escuro/claro). A opção ativa sobe um degrau na rampa — sem a cor da marca,
 * que na casca é da ação da tela.
 */
export function Segmentado<T extends string>({ rotulo, opcoes, valor, onChange, largura = 'justa', desativado = false, ocupado = false }: SegmentadoProps<T>) {
  const cheia = largura === 'cheia';
  return (
    <div
      role="group"
      aria-label={rotulo}
      aria-busy={ocupado || undefined}
      className={`${cheia ? 'flex w-full' : 'inline-flex'} shrink-0 rounded-xl border border-[var(--line-ctl)] p-0.5`}
    >
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          aria-pressed={valor === opcao.valor}
          disabled={desativado}
          aria-disabled={ocupado || undefined}
          onClick={() => {
            if (!ocupado) onChange(opcao.valor);
          }}
          className={`${cheia ? 'flex-1 px-1' : 'px-3'} rounded-[10px] py-1.5 text-sm transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:cursor-progress aria-disabled:opacity-45 ${
            valor === opcao.valor ? 'bg-[var(--raise)] text-[var(--ink-hi)]' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
          }`}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}
