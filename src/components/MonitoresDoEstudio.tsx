import { useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Um monitor do console: o papel e a cena em cima, a imagem embaixo. O
 * rótulo fica fora da imagem, como numa mesa: dentro dela só vai o que iria
 * ao ar. Antes o preview trazia selos "PRÉVIA", "AO VIVO" e "PUSH TO LIVE"
 * desenhados sobre o vídeo.
 */
export function Monitor({
  papel,
  cena,
  aoVivo = false,
  children,
  className = '',
  monitorRef,
}: {
  papel: 'programa' | 'preview';
  cena: string;
  /** O programa está indo aos canais: a palavra do ar no rótulo, no carmim que é só dele. */
  aoVivo?: boolean;
  children: ReactNode;
  className?: string;
  monitorRef?: Ref<HTMLElement>;
}) {
  const nome = papel === 'programa' ? 'Programa' : 'Preview';
  return (
    <section ref={monitorRef} aria-label={`${nome}: ${cena}${aoVivo ? ', ao vivo' : ''}`} className={`flex min-w-0 flex-col ${className}`}>
      <div className="mb-2 flex h-4 min-w-0 items-baseline gap-2">
        <h2 className="shrink-0 text-xs font-medium leading-4 text-[var(--ink-hi)]">{nome}</h2>
        {aoVivo && <span className="shrink-0 text-xs font-medium leading-4 text-[var(--color-sig-lift)]">Ao vivo</span>}
        <span className="truncate text-xs leading-4 text-[var(--ink-lo)]">{cena}</span>
      </div>
      {children}
    </section>
  );
}

/**
 * O que o próximo corte leva do preview ao programa. É o lugar que o console
 * aprovado dava à telemetria (taxa, bitrate, RTT, perda): sem transmissão,
 * esses números não existem, e o que o operador precisa saber antes de
 * cortar é o que vai mudar. Um painel regrado, como o da telemetria.
 *
 * O rótulo fica fora, como o dos monitores, e a caixa tem o canto reto da
 * mesa e a altura do que lista; rola só se passar da altura do preview.
 * Esticada até a altura do preview, com uma linha só, parecia uma vaga vazia.
 */
export function ProximoCorte({ mudancas }: { mudancas: string[] }) {
  return (
    <section aria-labelledby="estudio-proximo-corte" className="flex min-h-0 min-w-0 flex-col">
      <h2 id="estudio-proximo-corte" className="mb-2 h-4 shrink-0 text-xs font-medium leading-4 text-[var(--ink-hi)]">
        No próximo corte
      </h2>
      {/* A caixa acompanha a mesa soft-modern: canto generoso e fundo em
          --panel, sem contorno — a separação é tonal, como nos painéis. */}
      <div className="min-h-0 overflow-y-auto rounded-2xl bg-[var(--panel)]">
        {mudancas.length === 0 ? (
          <p className="px-4 py-3 text-pretty text-xs text-[var(--ink-lo)]">Nada muda: o preview está igual ao programa.</p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {mudancas.map((mudanca) => (
              <li key={mudanca} className="flex items-start gap-2 px-4 py-2.5 text-sm text-[var(--ink)]">
                <ArrowRight size={14} aria-hidden="true" className="mt-1 shrink-0 text-[var(--ink-lo)]" />
                <span className="min-w-0">{mudanca}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// Medidas da mesa: o rótulo de cada monitor (16px + 8px) e o vão entre as linhas
const ROTULO = 24;
const VAO = 16;
/** A menor largura do painel do próximo corte, ao lado do preview. */
const PAINEL_MINIMO = 224;
/** A parte da altura das imagens que fica com o programa. */
const PARTE_DO_PROGRAMA = 0.6;
/** O anel da moldura do monitor (`.pw-frame`), de cada lado do palco em 16:9. */
const ANEL = 2;

// A moldura é o palco em 16:9 mais o anel. Com 16:9 puro no lugar do monitor,
// a moldura passava 4px e o anel da direita e o de baixo saíam cortados.
const alturaDaMoldura = (largura: number) => ((largura - 2 * ANEL) * 9) / 16 + 2 * ANEL;
const larguraDaMoldura = (altura: number) => ((altura - 2 * ANEL) * 16) / 9 + 2 * ANEL;

interface Medidas {
  desktop: boolean;
  largura: number;
  alturaDoPrograma: number;
  larguraDoPreview: number;
  alturaDoPreview: number;
}

/**
 * A mesa de monitores. No desktop ela mede a própria coluna e dimensiona o
 * programa pela altura que sobra, sem passar da largura; a linha de baixo
 * tem a mesma largura do programa, com o preview medido pela imagem e o
 * painel do próximo corte encostado nele até a borda. Antes o preview ficava
 * centrado na célula, com vãos dos dois lados, e o painel solto na ponta.
 * No celular, tudo empilha na largura da coluna, com a transição logo
 * abaixo do preview. Nos dois casos o lugar de cada monitor é a moldura
 * inteira, palco e anel.
 */
export function MesaDeMonitores({
  cenaDoPrograma,
  programaAoVivo = false,
  cenaDoPreview,
  programa,
  preview,
  proximoCorte,
  transicaoNoCelular,
  refDoPreview,
}: {
  cenaDoPrograma: string;
  programaAoVivo?: boolean;
  cenaDoPreview: string;
  programa: ReactNode;
  preview: ReactNode;
  proximoCorte: ReactNode;
  transicaoNoCelular: ReactNode;
  refDoPreview?: Ref<HTMLElement>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [medidas, setMedidas] = useState<Medidas | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const desktop = window.matchMedia('(min-width: 1024px)');
    const calcular = () => {
      const W = el.clientWidth;
      if (W === 0) return;
      let proximas: Medidas;
      if (!desktop.matches) {
        const altura = alturaDaMoldura(W);
        proximas = { desktop: false, largura: W, alturaDoPrograma: altura, larguraDoPreview: W, alturaDoPreview: altura };
      } else {
        const H = el.clientHeight;
        if (H === 0) return;
        const alturaDasImagens = H - 2 * ROTULO - VAO;
        const largura = Math.min(W, larguraDaMoldura(alturaDasImagens * PARTE_DO_PROGRAMA));
        const alturaDoPrograma = alturaDaMoldura(largura);
        const alturaLivre = alturaDasImagens - alturaDoPrograma;
        const larguraDoPreview = Math.max(0, Math.min(larguraDaMoldura(alturaLivre), largura - PAINEL_MINIMO - VAO));
        proximas = { desktop: true, largura, alturaDoPrograma, larguraDoPreview, alturaDoPreview: alturaDaMoldura(larguraDoPreview) };
      }
      const numeros = ['largura', 'alturaDoPrograma', 'larguraDoPreview', 'alturaDoPreview'] as const;
      setMedidas((atuais) =>
        atuais && atuais.desktop === proximas.desktop && numeros.every((k) => Math.abs(atuais[k] - proximas[k]) < 0.5)
          ? atuais
          : proximas,
      );
    };
    const observador = new ResizeObserver(calcular);
    observador.observe(el);
    desktop.addEventListener('change', calcular);
    calcular();
    return () => {
      observador.disconnect();
      desktop.removeEventListener('change', calcular);
    };
  }, []);

  return (
    <div ref={ref} className="lg:h-full">
      {medidas?.desktop ? (
        <div className="mx-auto flex flex-col" style={{ width: medidas.largura, gap: VAO }}>
          <Monitor papel="programa" cena={cenaDoPrograma} aoVivo={programaAoVivo}>
            <div className="relative" style={{ height: medidas.alturaDoPrograma }}>
              {programa}
            </div>
          </Monitor>
          <div className="flex" style={{ gap: VAO }}>
            <Monitor papel="preview" cena={cenaDoPreview} className="shrink-0">
              <div className="relative" style={{ width: medidas.larguraDoPreview, height: medidas.alturaDoPreview }}>
                {preview}
              </div>
            </Monitor>
            <div className="flex min-w-0 flex-1 flex-col" style={{ maxHeight: ROTULO + medidas.alturaDoPreview }}>
              {proximoCorte}
            </div>
          </div>
        </div>
      ) : (
        // Até a primeira medida, 16:9 puro; depois, a moldura inteira
        <div className="flex flex-col gap-4">
          <Monitor papel="programa" cena={cenaDoPrograma} aoVivo={programaAoVivo}>
            <div
              className={`relative w-full ${medidas ? '' : 'aspect-video'}`}
              style={medidas ? { height: medidas.alturaDoPrograma } : undefined}
            >
              {programa}
            </div>
          </Monitor>
          <Monitor papel="preview" cena={cenaDoPreview} monitorRef={refDoPreview}>
            <div
              className={`relative w-full ${medidas ? '' : 'aspect-video'}`}
              style={medidas ? { height: medidas.alturaDoPreview } : undefined}
            >
              {preview}
            </div>
          </Monitor>
          {transicaoNoCelular}
          {proximoCorte}
        </div>
      )}
    </div>
  );
}
