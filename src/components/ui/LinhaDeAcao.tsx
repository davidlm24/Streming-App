import { ChevronDown, ChevronRight } from 'lucide-react';

interface LinhaDeAcaoProps {
  titulo: string;
  descricao: string;
  onClick: () => void;
  /**
   * `avancar` leva a outra tela ou painel; `expandir` abre conteúdo logo
   * abaixo (passe `expandido` e o id do conteúdo em `controla`).
   */
  tipo?: 'avancar' | 'expandir';
  expandido?: boolean;
  controla?: string;
}

/**
 * Linha de lista que é uma ação: título, uma frase dizendo o que há ali e o
 * indicador de para onde vai. Configurações é feita disso — antes eram
 * cartões com fundo, borda e ícone colorido cada um.
 */
export function LinhaDeAcao({ titulo, descricao, onClick, tipo = 'avancar', expandido, controla }: LinhaDeAcaoProps) {
  const Indicador = tipo === 'expandir' ? ChevronDown : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={tipo === 'expandir' ? expandido : undefined}
      aria-controls={tipo === 'expandir' ? controla : undefined}
      className="group flex w-full items-center gap-4 py-4 text-left cursor-pointer"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-[var(--ink-hi)]">{titulo}</span>
        <span className="mt-1 block text-xs text-[var(--ink-lo)]">{descricao}</span>
      </span>
      <Indicador
        size={16}
        aria-hidden="true"
        className={`shrink-0 text-[var(--ink-lo)] transition-transform duration-200 ease-out group-hover:text-[var(--ink-hi)] ${
          tipo === 'expandir' ? (expandido ? 'rotate-180' : '') : 'group-hover:translate-x-0.5'
        }`}
      />
    </button>
  );
}
