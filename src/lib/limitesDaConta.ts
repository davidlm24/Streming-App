/**
 * Os tetos que o banco aplica ao que a conta grava, para a tela mostrá-los
 * antes de a conta bater neles. Os números são os da migração
 * 20261001120000_limites_de_tamanho.sql: se um muda lá, muda aqui — o banco
 * continua mandando, e a tela só avisa antes. O plano grátis do Supabase dá
 * 500 MB de banco para o projeto inteiro, e é por isso que a conta tem teto.
 */

/** Banners e tickers: a lista cheia que o painel antigo mostrava como "/50" sem aplicar. */
export const LIMITE_DE_BANNERS = 50;
export const LIMITE_DE_TICKERS = 50;

/** Os canais que a conta guarda, ligados ou não. Há 9 plataformas na tela; o plano limita só os ligados. */
export const LIMITE_DE_CANAIS_GUARDADOS = 32;

/**
 * Cada campo que a pessoa digita num canal. O browser corta em silêncio o que
 * passa do `maxLength`, e uma chave cortada falha no ar sem dizer por quê: por
 * isso os números ficam muito acima de qualquer endereço ou chave de verdade
 * (dezenas a poucas centenas de caracteres) e só seguram o que é lixo colado.
 * A tela monta no máximo 9 canais, um por plataforma, e 9 canais com os três
 * campos no limite dão uns 24 KB: cabem nos 64 KB que o banco aceita na coluna.
 */
export const LIMITE_DO_NOME_DO_CANAL = 100;
export const LIMITE_DO_SERVIDOR_DO_CANAL = 1024;
export const LIMITE_DA_CHAVE_DO_CANAL = 1024;

/** O roteiro e as notas de uma linha, que já tinham teto no banco desde a etapa 3. */
export const LIMITE_DO_TEXTO_DO_ROTEIRO = 100_000;
export const LIMITE_DAS_NOTAS_DO_ROTEIRO = 20_000;
/** A soma do texto de todos os roteiros da conta. */
export const LIMITE_DOS_ROTEIROS_DA_CONTA = 2_097_152;

export const LIMITE_DE_WEBINARS = 500;

/**
 * Quantos caracteres tem o texto, contados como o `char_length` do Postgres
 * conta: por ponto de código. O `.length` do JavaScript conta por unidade de
 * 16 bits, e um emoji vale 2 nele e 1 no banco: um roteiro cheio de emoji seria
 * recusado na tela com folga de sobra no banco.
 */
export function pontosDeCodigo(texto: string): number {
  let n = 0;
  for (const _ of texto) n++;
  return n;
}
