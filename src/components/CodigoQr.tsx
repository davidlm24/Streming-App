import { useMemo, type CSSProperties } from 'react';
import { encode } from 'uqr';

/**
 * O QR code, gerado no navegador e desenhado em SVG. Antes a imagem vinha do
 * api.qrserver.com: o link digitado ia a um serviço de terceiros a cada tecla,
 * e sem rede o QR aparecia quebrado no palco.
 *
 * A borda de dois módulos, com o respiro branco de quem o envolve, dá a zona
 * de silêncio que o leitor do celular precisa. A cor é a do texto do pai.
 */
export function CodigoQr({ texto, className = '', style }: { texto: string; className?: string; style?: CSSProperties }) {
  const { tamanho, caminho } = useMemo(() => {
    const { size, data } = encode(texto, { ecc: 'M', border: 2 });
    let d = '';
    data.forEach((linha, y) =>
      linha.forEach((escuro, x) => {
        if (escuro) d += `M${x} ${y}h1v1h-1z`;
      }),
    );
    return { tamanho: size, caminho: d };
  }, [texto]);

  return (
    <svg
      viewBox={`0 0 ${tamanho} ${tamanho}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR code para ${texto}`}
      className={className}
      style={style}
    >
      <path d={caminho} fill="currentColor" />
    </svg>
  );
}
