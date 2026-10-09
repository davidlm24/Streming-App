import { encode } from 'uqr';
import type { Comment, GraficosDoPalco, TickerNoPalco } from '../../types';
import { corDoTextoSobre, duracaoDoTicker, formatarTempo, restanteDoRelogio, type RelogioDoCronometro } from '../graficos';
import {
  ALTURA_DO_PALCO,
  ESCALA_DE_PX_FIXO,
  LARGURA_DO_PALCO,
  TINTAS_DO_PALCO,
  fonteDoPalco,
  quebrarLinhas,
  umCqh,
  umCqw,
} from './medidas';

/**
 * Os gráficos do palco desenhados em canvas: logo, a pilha de banner e
 * comentário, QR code, cronômetro e ticker. Cada medida vem da regra
 * `.grafico-*` do index.css, com cqw/cqh virando px do canvas — o vídeo
 * composto mostra o que o preview HTML mostra, na mesma fração do palco.
 *
 * O desenho é todo por quadro e sem estado no DOM; o que precisa de relógio
 * (ticker, cronômetro) recebe `agora` de quem chama o laço.
 */
export class GraficosNoCanvas {
  /** O QR de cada link, calculado uma vez (encode é caro para rodar 30× por segundo). */
  private qrs = new Map<string, { lado: number; modulos: boolean[][] }>();
  /** Quando cada ticker entrou no ar: o CSS reinicia a animação quando o corte troca o ticker. */
  private epocas = new WeakMap<TickerNoPalco, number>();

  constructor(private imagem: (url: string) => HTMLImageElement | null) {}

  desenhar(
    ctx: CanvasRenderingContext2D,
    graficos: GraficosDoPalco,
    comentario: Comment | null,
    relogio: RelogioDoCronometro,
    agora: number,
  ) {
    const margemX = 6 * umCqw;
    const margemY = 7 * umCqh;
    const alturaDoTicker = graficos.ticker ? 6.5 * umCqh : 0;
    // "O chão": onde os gráficos de baixo se apoiam, acima do ticker (--g-ticker)
    const chao = ALTURA_DO_PALCO - margemY - alturaDoTicker;
    const corDoTexto = corDoTextoSobre(graficos.cor);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    if (graficos.logo) this.desenharLogo(ctx, graficos.logo, margemX, margemY, chao);

    const vao = 1.4 * umCqh;
    const emCima = (graficos.banner?.posicao ?? 'embaixo') === 'em-cima';
    if (emCima) {
      if (graficos.banner) this.desenharBanner(ctx, graficos, corDoTexto, margemX, margemY, 'do-topo');
      if (comentario) this.desenharComentario(ctx, comentario, margemX, chao);
    } else {
      let base = chao;
      if (graficos.banner) {
        base -= this.desenharBanner(ctx, graficos, corDoTexto, margemX, base, 'do-chao');
        if (comentario) base -= vao;
      }
      if (comentario) this.desenharComentario(ctx, comentario, margemX, base);
    }

    if (graficos.qr) this.desenharQr(ctx, graficos, corDoTexto, margemX, margemY, chao);
    if (graficos.cronometro) this.desenharCronometro(ctx, graficos.cronometro.titulo, graficos.cor, relogio);
    if (graficos.ticker) this.desenharTicker(ctx, graficos.ticker, graficos.cor, corDoTexto, agora);
  }

  private desenharLogo(
    ctx: CanvasRenderingContext2D,
    logo: NonNullable<GraficosDoPalco['logo']>,
    margemX: number,
    margemY: number,
    chao: number,
  ) {
    const img = this.imagem(logo.url);
    if (!img) return;
    // width em cqw, altura livre até o teto de 22cqh (max-height do CSS)
    let w = logo.tamanho * umCqw;
    let h = (w * img.naturalHeight) / img.naturalWidth;
    const teto = 22 * umCqh;
    if (h > teto) {
      w *= teto / h;
      h = teto;
    }
    const x = logo.canto.endsWith('esquerda') ? margemX : LARGURA_DO_PALCO - margemX - w;
    const y = logo.canto.startsWith('cima') ? margemY : chao - h;
    const alfa = ctx.globalAlpha;
    ctx.globalAlpha = alfa * logo.opacidade;
    ctx.drawImage(img, x, y, w, h);
    ctx.globalAlpha = alfa;
  }

  /** Desenha o banner e devolve a altura dele. Ancorado pelo topo, ou pelo pé (pilha de baixo). */
  private desenharBanner(
    ctx: CanvasRenderingContext2D,
    graficos: GraficosDoPalco,
    corDoTexto: string,
    x: number,
    y: number,
    ancora: 'do-topo' | 'do-chao',
  ): number {
    const banner = graficos.banner!;
    const maxW = 64 * umCqw;
    const padX = 1.6 * umCqw;

    const tituloPx = 2.5 * umCqw;
    const tituloAltura = tituloPx * 1.2;
    const tituloPadY = 0.9 * umCqw;
    ctx.font = fonteDoPalco(tituloPx, 600);
    const titulo = quebrarLinhas(ctx, banner.titulo, maxW - 2 * padX);
    const tituloW = Math.min(maxW, 2 * padX + Math.max(0, ...titulo.map((l) => ctx.measureText(l).width)));
    const tituloH = 2 * tituloPadY + titulo.length * tituloAltura;

    const subPx = 1.5 * umCqw;
    const subAltura = subPx * 1.25;
    const subPadY = 0.55 * umCqw;
    let sub: string[] = [];
    let subW = 0;
    let subH = 0;
    if (banner.subtitulo) {
      ctx.font = fonteDoPalco(subPx, 500);
      sub = quebrarLinhas(ctx, banner.subtitulo, maxW - 2 * padX);
      subW = Math.min(maxW, 2 * padX + Math.max(0, ...sub.map((l) => ctx.measureText(l).width)));
      subH = 2 * subPadY + sub.length * subAltura;
    }

    const altura = tituloH + subH;
    const topo = ancora === 'do-chao' ? y - altura : y;

    ctx.fillStyle = TINTAS_DO_PALCO.fundoDeGrafico;
    ctx.fillRect(x, topo, tituloW, tituloH);
    ctx.fillStyle = TINTAS_DO_PALCO.textoDeGrafico;
    ctx.font = fonteDoPalco(tituloPx, 600);
    titulo.forEach((linha, i) => ctx.fillText(linha, x + padX, topo + tituloPadY + (i + 0.5) * tituloAltura));

    if (banner.subtitulo) {
      const ySub = topo + tituloH;
      ctx.fillStyle = graficos.cor;
      ctx.fillRect(x, ySub, subW, subH);
      ctx.fillStyle = corDoTexto;
      ctx.font = fonteDoPalco(subPx, 500);
      sub.forEach((linha, i) => ctx.fillText(linha, x + padX, ySub + subPadY + (i + 0.5) * subAltura));
    }
    return altura;
  }

  /** O comentário fixado, ancorado pelo pé (ele mora na pilha de baixo, ou sozinho nela). */
  private desenharComentario(ctx: CanvasRenderingContext2D, comentario: Comment, x: number, pe: number) {
    const maxW = 44 * umCqw;
    const padX = 1.4 * umCqw;
    const padY = 1 * umCqw;
    const autorPx = 1.3 * umCqw;
    const textoPx = 1.7 * umCqw;
    const textoAltura = textoPx * 1.3;
    const entre = 0.3 * umCqw;
    // O "(Você)" é das telas de quem opera, não do que vai ao ar
    const autor = comentario.authorName.replace(/\s*\(Você\)$/, '');

    ctx.font = fonteDoPalco(textoPx);
    const texto = quebrarLinhas(ctx, comentario.text, maxW - 2 * padX);
    const textoW = Math.max(0, ...texto.map((l) => ctx.measureText(l).width));
    ctx.font = fonteDoPalco(autorPx, 600);
    const w = Math.min(maxW, 2 * padX + Math.max(ctx.measureText(autor).width, textoW));
    const h = 2 * padY + autorPx * 1.3 + entre + texto.length * textoAltura;
    const topo = pe - h;

    ctx.fillStyle = TINTAS_DO_PALCO.fundoDeGrafico;
    ctx.fillRect(x, topo, w, h);
    ctx.fillStyle = TINTAS_DO_PALCO.textoDeGrafico2;
    ctx.fillText(autor, x + padX, topo + padY + (autorPx * 1.3) / 2);
    ctx.fillStyle = TINTAS_DO_PALCO.textoDeGrafico;
    ctx.font = fonteDoPalco(textoPx);
    texto.forEach((linha, i) => ctx.fillText(linha, x + padX, topo + padY + autorPx * 1.3 + entre + (i + 0.5) * textoAltura));
  }

  private desenharQr(
    ctx: CanvasRenderingContext2D,
    graficos: GraficosDoPalco,
    corDoTexto: string,
    margemX: number,
    margemY: number,
    chao: number,
  ) {
    const qr = graficos.qr!;
    const pad = 0.9 * umCqw;
    const vao = 0.6 * umCqw;
    const lado = qr.tamanho * umCqw;
    const w = lado + 2 * pad;

    const tituloPx = 1.3 * umCqw;
    const tituloAltura = tituloPx * 1.2;
    ctx.font = fonteDoPalco(tituloPx, 600);
    const titulo = qr.titulo ? quebrarLinhas(ctx, qr.titulo, lado) : [];

    const precoPx = 1.5 * umCqw;
    const precoPadX = 0.8 * umCqw;
    const precoPadY = 0.25 * umCqw;
    const precoH = qr.preco ? precoPx * 1.4 + 2 * precoPadY : 0;

    const h = 2 * pad + lado + (titulo.length ? vao + titulo.length * tituloAltura : 0) + (qr.preco ? vao + precoH : 0);
    const x = qr.canto.endsWith('esquerda') ? margemX : LARGURA_DO_PALCO - margemX - w;
    const y = qr.canto.startsWith('cima') ? margemY : chao - h;

    // O cartão branco é o que o celular lê melhor; a zona de silêncio vem do border: 2 do encode
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, w, h);
    let codigo = this.qrs.get(qr.url);
    if (!codigo) {
      const { size, data } = encode(qr.url, { ecc: 'M', border: 2 });
      codigo = { lado: size, modulos: data };
      this.qrs.set(qr.url, codigo);
    }
    const modulo = lado / codigo.lado;
    ctx.fillStyle = '#0B0D10';
    codigo.modulos.forEach((linha, my) =>
      linha.forEach((escuro, mx) => {
        if (escuro) ctx.fillRect(Math.round(x + pad + mx * modulo), Math.round(y + pad + my * modulo), Math.ceil(modulo), Math.ceil(modulo));
      }),
    );

    ctx.textAlign = 'center';
    let cursor = y + pad + lado;
    if (titulo.length) {
      cursor += vao;
      ctx.fillStyle = '#0B0D10';
      ctx.font = fonteDoPalco(tituloPx, 600);
      titulo.forEach((linha, i) => ctx.fillText(linha, x + w / 2, cursor + (i + 0.5) * tituloAltura));
      cursor += titulo.length * tituloAltura;
    }
    if (qr.preco) {
      cursor += vao;
      ctx.font = fonteDoPalco(precoPx, 600);
      const precoW = ctx.measureText(qr.preco).width + 2 * precoPadX;
      const xPreco = x + (w - precoW) / 2;
      ctx.fillStyle = graficos.cor;
      ctx.fillRect(xPreco, cursor, precoW, precoH);
      // O anel de dentro do CSS (inset 1px), para o preço claro não sumir no cartão branco
      ctx.strokeStyle = 'rgb(0 0 0 / 0.12)';
      ctx.lineWidth = ESCALA_DE_PX_FIXO;
      ctx.strokeRect(xPreco + ctx.lineWidth / 2, cursor + ctx.lineWidth / 2, precoW - ctx.lineWidth, precoH - ctx.lineWidth);
      ctx.fillStyle = corDoTexto;
      ctx.fillText(qr.preco, x + w / 2, cursor + precoH / 2);
    }
    ctx.textAlign = 'left';
  }

  private desenharCronometro(ctx: CanvasRenderingContext2D, titulo: string, cor: string, relogio: RelogioDoCronometro) {
    const restante = restanteDoRelogio(relogio);
    const fracao = relogio.duracao > 0 ? Math.max(0, Math.min(1, restante / relogio.duracao)) : 0;
    const tempo = formatarTempo(restante);

    const padX = 3.2 * umCqw;
    const padY = 2 * umCqw;
    const tituloPx = 1.7 * umCqw;
    const tituloH = titulo ? tituloPx * 1.4 : 0;
    const tempoPx = 6.4 * umCqw;
    const tempoH = tempoPx * 1.1;
    const barraH = 0.6 * umCqh;
    const barraM = 1.2 * umCqh;

    ctx.font = fonteDoPalco(tempoPx, 600);
    const tempoW = ctx.measureText(tempo).width;
    ctx.font = fonteDoPalco(tituloPx, 500);
    const tituloW = titulo ? ctx.measureText(titulo).width : 0;
    const w = Math.max(26 * umCqw, Math.max(tempoW, tituloW) + 2 * padX);
    const h = 2 * padY + tituloH + tempoH + barraM + barraH;
    const x = (LARGURA_DO_PALCO - w) / 2;
    const y = (ALTURA_DO_PALCO - h) / 2;

    ctx.fillStyle = TINTAS_DO_PALCO.fundoDeGrafico;
    ctx.fillRect(x, y, w, h);
    ctx.textAlign = 'center';
    if (titulo) {
      ctx.fillStyle = TINTAS_DO_PALCO.textoDeGrafico2;
      ctx.fillText(titulo, x + w / 2, y + padY + tituloH / 2);
    }
    ctx.fillStyle = TINTAS_DO_PALCO.textoDeGrafico;
    ctx.font = fonteDoPalco(tempoPx, 600);
    ctx.fillText(tempo, x + w / 2, y + padY + tituloH + tempoH / 2);
    ctx.textAlign = 'left';

    const yBarra = y + padY + tituloH + tempoH + barraM;
    ctx.fillStyle = 'rgb(255 255 255 / 0.16)';
    ctx.fillRect(x + padX, yBarra, w - 2 * padX, barraH);
    ctx.fillStyle = cor;
    ctx.fillRect(x + padX, yBarra, (w - 2 * padX) * fracao, barraH);
  }

  private desenharTicker(ctx: CanvasRenderingContext2D, ticker: TickerNoPalco, cor: string, corDoTexto: string, agora: number) {
    const h = 6.5 * umCqh;
    const y = ALTURA_DO_PALCO - h;
    ctx.fillStyle = TINTAS_DO_PALCO.fundoDeGrafico;
    ctx.fillRect(0, y, LARGURA_DO_PALCO, h);

    let inicioDoTrilho = 0;
    if (ticker.selo) {
      const seloPx = 1.6 * umCqw;
      const seloPadX = 1.4 * umCqw;
      ctx.font = fonteDoPalco(seloPx, 600);
      const seloW = ctx.measureText(ticker.selo).width + 2 * seloPadX;
      ctx.fillStyle = cor;
      ctx.fillRect(0, y, seloW, h);
      ctx.fillStyle = corDoTexto;
      ctx.fillText(ticker.selo, seloPadX, y + h / 2);
      inicioDoTrilho = seloW;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(inicioDoTrilho, y, LARGURA_DO_PALCO - inicioDoTrilho, h);
    ctx.clip();
    ctx.font = fonteDoPalco(1.9 * umCqw, 500);
    ctx.fillStyle = TINTAS_DO_PALCO.textoDeGrafico;

    // translateX de 100cqw até −100% do texto, linear, na duração do ticker.
    // Corre mesmo com movimento reduzido: o canvas é o vídeo, e o público
    // recebe o que o operador escolheu, não a preferência do computador dele
    // (o preview, que é console, continua obedecendo à regra do CSS).
    let epoca = this.epocas.get(ticker);
    if (epoca === undefined) {
      epoca = agora;
      this.epocas.set(ticker, epoca);
    }
    const duracao = duracaoDoTicker(ticker) * 1000;
    const progresso = ((agora - epoca) % duracao) / duracao;
    const textoW = ctx.measureText(ticker.texto).width;
    const curso = LARGURA_DO_PALCO + textoW;
    const x =
      ticker.direcao === 'direita'
        ? inicioDoTrilho - textoW + progresso * curso
        : inicioDoTrilho + LARGURA_DO_PALCO - progresso * curso;
    ctx.fillText(ticker.texto, x, y + h / 2);
    ctx.restore();
  }
}
