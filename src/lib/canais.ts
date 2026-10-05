import type { Destination } from '../types';

/**
 * Estado de um canal para a próxima live. Uma regra só, lida pelo painel e
 * pela página de Canais — antes cada tela decidia do seu jeito, e o painel
 * nem decidia: mostrava a contagem de canais marcados, prontos ou não.
 */
export type EstadoDoCanal = 'pronto' | 'incompleto' | 'desligado';

export function estadoDoCanal(canal: Destination): EstadoDoCanal {
  if (!canal.selected) return 'desligado';
  return pendenciaDoCanal(canal) ? 'incompleto' : 'pronto';
}

/**
 * O canal cabe ligado? O plano limita quantos transmitem ao mesmo tempo
 * (`destinosSimultaneos` em plans.ts). Conta os OUTROS ligados, não o próprio
 * canal: editar um canal que já está ligado nunca estoura o limite. Desligar
 * é sempre permitido — a regra só é consultada para ligar. `id` indefinido é
 * um canal novo.
 *
 * Uma regra só para as quatro portas: o interruptor de Canais, a lista do
 * estúdio, o modal de canais e o modal de RTMP do estúdio. Antes só o modal
 * de canais conferia, e as outras três ligavam além do plano.
 */
export function cabeLigado(canais: Destination[], id: string | undefined, limite: number): boolean {
  return canais.filter((c) => c.selected && c.id !== id).length < limite;
}

/**
 * O que falta para o canal receber a live — ou `null` quando nada falta.
 * Faltando os dois, diz os dois: dizer só "servidor" mandava a pessoa
 * consertar um e tropeçar no outro ao salvar.
 */
export function pendenciaDoCanal(canal: Destination): string | null {
  const semServidor = !canal.streamUrl?.trim();
  const semChave = !canal.streamKey?.trim();
  if (semServidor && semChave) return 'Falta o servidor e a chave';
  if (semServidor) return 'Falta o servidor';
  if (semChave) return 'Falta a chave';
  return null;
}

/** A pendência em forma curta, para caber num chip ("sem chave"). */
export function pendenciaCurta(canal: Destination): string | null {
  const semServidor = !canal.streamUrl?.trim();
  const semChave = !canal.streamKey?.trim();
  if (semServidor && semChave) return 'sem servidor nem chave';
  if (semServidor) return 'sem servidor';
  if (semChave) return 'sem chave';
  return null;
}

const NOMES: Record<string, string> = {
  youtube: 'YouTube',
  facebook: 'Facebook',
  twitch: 'Twitch',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  x: 'X',
  tiktok: 'TikTok',
  kick: 'Kick',
  rumble: 'Rumble',
  restream: 'Restream',
  cloudflare: 'Cloudflare Stream',
  nginx: 'Servidor NGINX',
  srs: 'Servidor SRS',
  custom: 'Servidor RTMP próprio',
};

/**
 * As plataformas com nome que o modal de canais conecta, na ordem dele. É a
 * lista que o agendamento de webinar oferece (o webinar guarda o nome, e
 * `plataformaPeloNome` volta dele à plataforma). O servidor RTMP próprio fica
 * fora: "Servidor…" não diz qual servidor é.
 */
export const PLATAFORMAS_NOMEADAS = ['youtube', 'facebook', 'instagram', 'tiktok', 'twitch', 'kick', 'linkedin', 'rumble'] as const;

export function nomeDaPlataforma(plataforma: string): string {
  return NOMES[plataforma] ?? 'Servidor RTMP próprio';
}

/**
 * Plataforma a partir do nome que o webinar guarda ("YouTube",
 * "YouTube (Canal Privado)"). `undefined` quando o nome não é de nenhuma.
 */
export function plataformaPeloNome(nome: string): string | undefined {
  // Compara a primeira palavra: "YouTube (Canal Privado)" é YouTube, mas
  // "Xadrez ao vivo" não é X.
  const primeira = (texto: string) => texto.trim().toLowerCase().split(/[\s(]/)[0];
  const alvo = primeira(nome);
  return Object.keys(NOMES).find((id) => alvo === id || alvo === primeira(NOMES[id]));
}
