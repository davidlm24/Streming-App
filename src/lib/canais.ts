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
