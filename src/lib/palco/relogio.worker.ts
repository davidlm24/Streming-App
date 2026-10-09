/**
 * O relógio do palco com a aba escondida. O navegador para o
 * requestAnimationFrame de uma página que não aparece (outra aba, a janela
 * minimizada ou, no Windows, coberta pelo programa que se compartilha), mas
 * não o setInterval de um worker. Sem ele, a gravação guardava um quadro
 * congelado com o som andando enquanto o estúdio estava escondido.
 *
 * Recebe o intervalo em ms (0 para) e responde um tique a cada intervalo.
 */
const escopo = self as unknown as { onmessage: ((evento: MessageEvent<number>) => void) | null; postMessage: (m: number) => void };
let id: ReturnType<typeof setInterval> | undefined;

escopo.onmessage = (evento) => {
  if (id !== undefined) clearInterval(id);
  id = evento.data > 0 ? setInterval(() => escopo.postMessage(0), evento.data) : undefined;
};
