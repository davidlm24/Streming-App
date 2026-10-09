/**
 * As guias do palco: os terços, a área segura (7% em cima e embaixo, 6% dos
 * lados) e a cruz central, em linhas de 1px no token --guia com mistura por
 * diferença, visíveis sobre imagem clara ou escura.
 *
 * São ajuda de operação, desenhadas por cima do monitor no DOM — nunca
 * dentro do vídeo composto: nada vai ao ar que não fosse ao ar. Valem nos
 * dois monitores (preview e programa), aria-hidden e sem clique.
 */
export function GuiasDoPalco() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-40 mix-blend-difference">
      <span className="absolute inset-y-0 left-1/3 w-px bg-[var(--guia)]" />
      <span className="absolute inset-y-0 left-2/3 w-px bg-[var(--guia)]" />
      <span className="absolute inset-x-0 top-1/3 h-px bg-[var(--guia)]" />
      <span className="absolute inset-x-0 top-2/3 h-px bg-[var(--guia)]" />
      <span className="absolute border border-[var(--guia)]" style={{ inset: '7% 6%' }} />
      <span className="absolute left-1/2 top-1/2 h-px w-[18px] -translate-x-1/2 -translate-y-1/2 bg-[var(--guia)]" />
      <span className="absolute left-1/2 top-1/2 h-[18px] w-px -translate-x-1/2 -translate-y-1/2 bg-[var(--guia)]" />
    </div>
  );
}
