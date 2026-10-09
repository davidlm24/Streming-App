import { useEffect, useState } from 'react';
import { apiFetch } from './apiFetch';

/**
 * Se o servidor tem o motor de transmissão configurado (MOTOR_URL e
 * MOTOR_SEGREDO). Sem ele, "Entrar ao vivo" só recebe um 503, e o Painel e o
 * estúdio não podem dizer "pronto para entrar ao vivo".
 *
 * Uma pergunta por sessão do app, dividida entre quem pergunta: a
 * configuração do servidor não muda sem um deploy. Uma resposta que falha
 * (rede, sessão) não fica guardada, e a próxima tela pergunta de novo.
 */
let pergunta: Promise<boolean | null> | null = null;

function perguntar(): Promise<boolean | null> {
  pergunta ??= apiFetch('/api/transmissoes/disponivel')
    .then(async (resposta) => {
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      const corpo = (await resposta.json()) as { disponivel?: unknown };
      if (typeof corpo.disponivel !== 'boolean') throw new Error('resposta sem "disponivel"');
      return corpo.disponivel;
    })
    .catch((erro) => {
      console.warn('Não deu para saber se a transmissão está disponível:', erro);
      pergunta = null;
      return null;
    });
  return pergunta;
}

/**
 * true ou false quando o servidor respondeu; null enquanto não se sabe. Quem
 * usa trata null como "não afirmar nada": não promete o ar nem o nega, e o
 * clique em "Entrar ao vivo" continua dizendo o que o servidor responder.
 */
export function useTransmissaoDisponivel(): boolean | null {
  const [disponivel, setDisponivel] = useState<boolean | null>(null);
  useEffect(() => {
    let vivo = true;
    void perguntar().then((resposta) => {
      if (vivo) setDisponivel(resposta);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return disponivel;
}
