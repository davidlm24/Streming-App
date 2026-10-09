import type { Destination } from '../types';
import { apiFetch } from './apiFetch';
import { estadoDoCanal, nomeDaPlataforma } from './canais';
import type { DestinoDaTransmissao } from '../server/protocoloDoMotor';

/**
 * O pedido de transmissão à API: ela registra a transmissão e os canais no
 * banco e devolve o bilhete do motor. As chaves dos canais NÃO vão para a
 * API: ficam no navegador até a mensagem `comecar` ao motor.
 */
export interface TransmissaoAutorizada {
  id: string;
  bilhete: string;
  motor: string;
  /** Os canais prontos, já com o id que o banco deu a cada um. */
  destinos: DestinoDaTransmissao[];
}

/** Diz à API que a transmissão registrada não aconteceu (o motor não a aceitou, o navegador não chegou nele). */
export async function desistirDaTransmissao(id: string, motivo: string): Promise<void> {
  try {
    const resposta = await apiFetch(`/api/transmissoes/${id}/encerrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo: motivo.slice(0, 500) }),
    });
    if (!resposta.ok) console.warn('A transmissão que não começou ficou registrada como começando:', resposta.status);
  } catch (erro) {
    console.warn('A transmissão que não começou ficou registrada como começando:', erro);
  }
}

export async function pedirTransmissao(canais: Destination[], titulo?: string, webinarId?: string): Promise<TransmissaoAutorizada> {
  const prontos = canais.filter((c) => estadoDoCanal(c) === 'pronto');
  if (prontos.length === 0) throw new Error('Nenhum canal está pronto para receber a live.');
  const resposta = await apiFetch('/api/transmissoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      titulo,
      webinarId,
      destinos: prontos.map((c) => ({ canal: c.id, nome: c.name || nomeDaPlataforma(c.platform), plataforma: c.platform, url: c.streamUrl!.trim() })),
    }),
  });
  const corpo = (await resposta.json().catch(() => null)) as
    | { id: string; bilhete: string; motor: string; destinos: { canal: string; id: string }[] }
    | { error?: string }
    | null;
  if (!resposta.ok || !corpo || !('id' in corpo)) {
    console.error('POST /api/transmissoes', resposta.status, corpo);
    if (resposta.status === 401) throw new Error('Sua sessão expirou. Entre de novo.');
    if (resposta.status === 429) throw new Error('Muitas tentativas seguidas. Espere um minuto.');
    throw new Error((corpo && 'error' in corpo && corpo.error) || 'A transmissão não pôde ser registrada agora. Tente de novo.');
  }
  const porCanal = new Map(corpo.destinos.map((d) => [d.canal, d.id]));
  if (prontos.some((c) => !porCanal.has(c.id))) throw new Error('A API não devolveu o registro de um canal. Tente de novo.');
  return {
    id: corpo.id,
    bilhete: corpo.bilhete,
    motor: corpo.motor,
    destinos: prontos.map((c) => ({
      id: porCanal.get(c.id)!,
      nome: c.name || nomeDaPlataforma(c.platform),
      url: c.streamUrl!.trim(),
      chave: c.streamKey!.trim(),
    })),
  };
}
