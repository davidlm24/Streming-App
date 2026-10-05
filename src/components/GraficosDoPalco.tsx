import { useEffect, useState } from 'react';
import type { Comment, GraficosDoPalco as Graficos } from '../types';
import { corDoTextoSobre, duracaoDoTicker, formatarTempo, restanteDoRelogio, type RelogioDoCronometro } from '../lib/graficos';
import { CodigoQr } from './CodigoQr';

/** O que resta no relógio, relido quatro vezes por segundo enquanto ele anda. */
function useRestante(relogio: RelogioDoCronometro) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    if (relogio.fimEm === null) return;
    const id = window.setInterval(() => setAgora(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [relogio.fimEm]);
  return restanteDoRelogio(relogio, agora);
}

function Cronometro({ titulo, cor, relogio }: { titulo: string; cor: string; relogio: RelogioDoCronometro }) {
  const restante = useRestante(relogio);
  const fracao = relogio.duracao > 0 ? restante / relogio.duracao : 0;
  return (
    <div className="grafico grafico-cronometro">
      {titulo && <p className="grafico-cronometro__titulo">{titulo}</p>}
      <p className="grafico-cronometro__tempo">{formatarTempo(restante)}</p>
      <div className="grafico-cronometro__barra">
        <div className="grafico-cronometro__resto" style={{ width: `${fracao * 100}%`, background: cor }} />
      </div>
    </div>
  );
}

/**
 * Os gráficos de um monitor, desenhados a partir do estado dele. O preview e
 * o programa usam este mesmo componente, com estados diferentes: é assim que
 * o preview mostra exatamente o que o corte leva.
 *
 * Nada aqui recebe o mouse. Os gráficos se editam nos painéis; sobre a imagem
 * havia alças de arrastar banner, botão de esconder logo e barra de zoom do
 * QR, que o preview mostrava e o programa não.
 */
export function GraficosDoPalco({
  graficos,
  comentario,
  relogio,
}: {
  graficos: Graficos;
  comentario: Comment | null;
  relogio: RelogioDoCronometro;
}) {
  const { cor, logo, banner, ticker, qr, cronometro } = graficos;
  const textoSobreACor = corDoTextoSobre(cor);
  const bannerNaPilha = banner?.posicao ?? 'embaixo';

  const blocoDoBanner = banner && (
    <div key={`banner-${banner.titulo}-${banner.subtitulo}`} className="grafico-banner">
      <p className="grafico-banner__titulo">{banner.titulo}</p>
      {banner.subtitulo && (
        <p className="grafico-banner__subtitulo" style={{ background: cor, color: textoSobreACor }}>
          {banner.subtitulo}
        </p>
      )}
    </div>
  );

  // O "(Você)" é das telas de quem opera, não do que vai ao ar
  const blocoDoComentario = comentario && (
    <div key={`comentario-${comentario.id}`} className="grafico-comentario">
      <p className="grafico-comentario__autor">{comentario.authorName.replace(/\s*\(Você\)$/, '')}</p>
      <p className="grafico-comentario__texto">{comentario.text}</p>
    </div>
  );

  return (
    <>
      {logo && (
        <img
          src={logo.url}
          alt=""
          className={`grafico grafico-logo grafico--${logo.canto}`}
          style={{ width: `${logo.tamanho}cqw`, opacity: logo.opacidade }}
          referrerPolicy="no-referrer"
        />
      )}

      {/* Embaixo, o banner fica colado à área segura e o comentário sobe; em cima, cada um no seu lugar */}
      {bannerNaPilha === 'embaixo' ? (
        (blocoDoBanner || blocoDoComentario) && (
          <div className="grafico-pilha grafico-pilha--embaixo">
            {blocoDoBanner}
            {blocoDoComentario}
          </div>
        )
      ) : (
        <>
          {blocoDoBanner && <div className="grafico-pilha grafico-pilha--em-cima">{blocoDoBanner}</div>}
          {blocoDoComentario && <div className="grafico-pilha grafico-pilha--embaixo">{blocoDoComentario}</div>}
        </>
      )}

      {qr && (
        <div className={`grafico grafico-qr grafico--${qr.canto}`}>
          <CodigoQr texto={qr.url} className="grafico-qr__codigo" style={{ width: `${qr.tamanho}cqw` }} />
          {qr.titulo && <p className="grafico-qr__titulo" style={{ maxWidth: `${qr.tamanho}cqw` }}>{qr.titulo}</p>}
          {qr.preco && (
            <p className="grafico-qr__preco" style={{ background: cor, color: textoSobreACor }}>
              {qr.preco}
            </p>
          )}
        </div>
      )}

      {cronometro && <Cronometro titulo={cronometro.titulo} cor={cor} relogio={relogio} />}

      {ticker && (
        <div className="grafico-ticker">
          {ticker.selo && (
            <span className="grafico-ticker__selo" style={{ background: cor, color: textoSobreACor }}>
              {ticker.selo}
            </span>
          )}
          <div className="grafico-ticker__trilho">
            <span
              key={`${ticker.texto}-${ticker.velocidade}-${ticker.direcao}`}
              className={`grafico-ticker__texto ${ticker.direcao === 'direita' ? 'grafico-ticker__texto--direita' : ''}`}
              style={{ ['--duracao' as string]: `${duracaoDoTicker(ticker)}s` }}
            >
              {ticker.texto}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
