// De um erro do Supabase para o motivo que a tela diz. Mora aqui, e não em
// dadosDaConta.ts, porque aquele arquivo cria o cliente do Supabase ao ser
// importado e não carrega fora do navegador: esta regra é pura e tem teste
// (tests/cliente/falhaDoSupabase.test.ts).

/**
 * Por que uma gravação não foi confirmada. A tela diz cada caso com a sua saída.
 * 'limite-da-conta' é um teto de quantidade (webinars, roteiros) e 'grande-demais'
 * um de tamanho (uma lista ou uma coluna passou do que o banco aceita): a saída
 * de um é apagar o que não usa, a do outro é escrever menos.
 */
export type FalhaAoSalvar = 'sem-login' | 'sem-conexao' | 'sem-confirmacao' | 'limite-da-conta' | 'grande-demais' | 'recusado';

export function erroDeRede(erro: unknown): boolean {
  const e = erro as { name?: string; message?: string } | null;
  return /Failed to fetch|NetworkError|Load failed|fetch failed/i.test(`${e?.name ?? ''} ${e?.message ?? ''}`);
}

/** O motivo de uma falha do Supabase, na língua da tela. */
export function falhaDoSupabase(erro: unknown): FalhaAoSalvar {
  if (erroDeRede(erro)) return 'sem-conexao';
  // O token venceu ou foi recusado: a API responde com esses códigos
  const codigo = (erro as { code?: string } | null)?.code;
  if (codigo === 'PGRST301' || codigo === 'PGRST303') return 'sem-login';
  // Os tetos da conta (migração 20261001120000): WB001 os webinars, SN001 as
  // capturas, AU001 a audiência e TP001 o texto dos roteiros. O código chega
  // inteiro em `code`, e não só dentro da mensagem.
  if (codigo === 'WB001' || codigo === 'SN001' || codigo === 'AU001' || codigo === 'TP001') return 'limite-da-conta';
  // 23514 é um `check` do banco recusando o valor. Os que a tela alcança são os
  // de tamanho (listas, canais, roteiro), e os campos soltos já têm maxLength:
  // o que passa até aqui é grande demais.
  if (codigo === '23514') return 'grande-demais';
  return 'recusado';
}
