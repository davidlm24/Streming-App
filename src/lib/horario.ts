/**
 * O horário de um webinar em palavras, em pt-BR.
 *
 * Os webinars antigos guardam só texto livre em `time` ("Amanhã, às 19:30").
 * Os criados pelo formulário guardam também `startsAt` (ISO 8601), e é dele
 * que a tela deriva o rótulo — um "Amanhã" gravado como texto vira mentira no
 * dia seguinte.
 */

const DIA_EM_MS = 86_400_000;

const maiuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

function hora(data: Date) {
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function diaPorExtenso(data: Date, agora: Date) {
  return data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(data.getFullYear() !== agora.getFullYear() ? { year: 'numeric' as const } : {}),
  });
}

/** "Sábado, 27 de setembro, às 20:00" — o que fica gravado em `time`. */
export function horarioPorExtenso(data: Date, agora = new Date()): string {
  return maiuscula(`${diaPorExtenso(data, agora)}, às ${hora(data)}`);
}

/** O rótulo para a tela: "Hoje, às 20:00", "Amanhã, às 20:00" ou o dia por extenso. */
export function rotuloDoHorario(webinar: { time: string; startsAt?: string }, agora = new Date()): string {
  if (!webinar.startsAt) return webinar.time;
  const data = new Date(webinar.startsAt);
  if (Number.isNaN(data.getTime())) return webinar.time;

  const meiaNoite = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((meiaNoite(data) - meiaNoite(agora)) / DIA_EM_MS);
  if (dias === 0) return `Hoje, às ${hora(data)}`;
  if (dias === 1) return `Amanhã, às ${hora(data)}`;
  return horarioPorExtenso(data, agora);
}
