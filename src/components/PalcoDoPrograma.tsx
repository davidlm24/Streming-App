import { useEffect, useRef } from 'react';
import type { CompositorDoPrograma } from '../lib/palco/compositor';
import { GuiasDoPalco } from './GuiasDoPalco';
import { useTamanhoDoPalco } from './StudioPreview';

/**
 * O monitor de programa: o canvas do compositor, dentro da mesma moldura dos
 * outros monitores. O que aparece aqui É o vídeo composto — a gravação e a
 * transmissão recebem exatamente esta imagem, sem um segundo desenhista.
 *
 * O canvas é um só e vive no compositor; este componente só o encaixa no
 * lugar e o devolve ao sair. As guias são DOM por cima (ajuda de operação,
 * fora do vídeo), e nada aqui recebe clique: o programa é inerte, como era.
 */
export function PalcoDoPrograma({ compositor, mostrarGuias }: { compositor: CompositorDoPrograma; mostrarGuias: boolean }) {
  const { lugarRef, tamanho } = useTamanhoDoPalco();
  const moldura = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lugar = moldura.current;
    if (!lugar) return;
    const canvas = compositor.canvas;
    canvas.style.cssText = 'display:block;width:100%;height:100%';
    lugar.replaceChildren(canvas);
    return () => {
      if (canvas.parentElement === lugar) canvas.remove();
    };
  }, [compositor]);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div ref={lugarRef} className="flex min-h-0 w-full flex-1 items-center justify-start overflow-hidden">
        {/* A mesma moldura do preview (raio padrão); o canvas é cortado pelo
            raio, que fica fora da área segura: nenhum gráfico encosta nele. */}
        <div className="pw-frame pw-frame--pgm" style={{ ['--pw-frame-radius' as string]: 'var(--radius-lg)' }}>
          <div
            className="relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--stage)]"
            style={tamanho.largura > 0 ? { width: tamanho.largura, height: tamanho.altura } : undefined}
          >
            <div ref={moldura} className="absolute inset-0" />
            {mostrarGuias && <GuiasDoPalco />}
          </div>
        </div>
      </div>
    </div>
  );
}
