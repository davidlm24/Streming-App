import type { Dispatch, SetStateAction } from 'react';
import type { GeometriaDoCard } from '../types';
import { CARD_PADRAO, cantoDoCard, dentroDoPalco, lugarDoCanto } from '../lib/cenas';
import { AJUSTES_PADRAO, ZOOM_MAXIMO, ZOOM_MINIMO, deslocamentoMaximo, dentroDoQuadro, type AjustesDaCamera } from '../lib/camera';
import { fraseDaCamera, type AjustesDaCaptura, type LeituraDaCaptura, type QuadrosPorSegundo, type Resolucao } from '../lib/captura';
import { Deslizante, EscolhaDoPainel, SecaoDoPainel, SeletorDeCanto } from './PecasDoPainel';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { Segmentado } from './ui/Segmentado';
import { Switch } from './ui/Switch';

const FORMATOS: { valor: GeometriaDoCard['formato']; rotulo: string }[] = [
  { valor: 'rounded', rotulo: 'Retângulo' },
  { valor: 'compact', rotulo: 'Compacto' },
  { valor: 'circle', rotulo: 'Círculo' },
];

const RESOLUCOES: { valor: Resolucao; rotulo: string }[] = [
  { valor: '720p', rotulo: '720p' },
  { valor: '1080p', rotulo: '1080p' },
];
const QUADROS: { valor: QuadrosPorSegundo; rotulo: string }[] = [
  { valor: '30', rotulo: '30 qps' },
  { valor: '60', rotulo: '60 qps' },
];

const lado = (valor: number, esquerda: string, direita: string) =>
  valor === 0 ? 'centro' : `${Math.abs(valor)}% ${valor < 0 ? esquerda : direita}`;

/**
 * A câmera: a qualidade da captura, o card dela na cena Tela com câmera, o
 * enquadramento, o espelho e o croma. A qualidade é pedida ao aparelho, e a
 * seção diz o que ele entregou. O card é da cena e vai ao programa no corte; os outros ajustes são
 * da câmera e valem nos dois monitores na hora, como o aparelho escolhido.
 *
 * Era o painel "Temas & Aparência", com o modo claro do estúdio (que só
 * clareava os avisos), presets de marca com logos do Unsplash e do Flaticon,
 * um estilo de texto que o palco não lia e os atalhos do card com as contas
 * do card antigo.
 */
export function PainelCamera({
  ajustes,
  onAjustes,
  card,
  onCard,
  cenaTemCard,
  captura,
  onCaptura,
  camera,
  aplicando,
}: {
  ajustes: AjustesDaCamera;
  onAjustes: Dispatch<SetStateAction<AjustesDaCamera>>;
  card: GeometriaDoCard;
  onCard: Dispatch<SetStateAction<GeometriaDoCard>>;
  /** A cena do preview desenha o card (Tela com câmera). */
  cenaTemCard: boolean;
  captura: AjustesDaCaptura;
  onCaptura: (proxima: AjustesDaCaptura) => void;
  /** O que a câmera está entregando agora. */
  camera: LeituraDaCaptura['camera'];
  aplicando: boolean;
}) {
  const limite = deslocamentoMaximo(ajustes.zoom);
  // Sempre a partir do estado atual: dois ajustes no mesmo quadro não se desfazem
  const mudar = (parcial: Partial<AjustesDaCamera>) => onAjustes((atual) => dentroDoQuadro({ ...atual, ...parcial }));
  const mudarCroma = (parcial: Partial<AjustesDaCamera['croma']>) =>
    onAjustes((atual) => ({ ...atual, croma: { ...atual.croma, ...parcial } }));
  const mudarCard = (parcial: Partial<GeometriaDoCard>) => onCard((atual) => dentroDoPalco({ ...atual, ...parcial }));
  const canto = cantoDoCard(card);
  const entregue = fraseDaCamera(camera);

  return (
    <div className="pb-6">
      <SecaoDoPainel
        titulo="Qualidade da câmera"
        dica={
          !camera
            ? 'O navegador não liberou a câmera.'
            : aplicando
              ? 'Pedindo à câmera…'
              : entregue
                ? `A câmera entrega ${entregue}. Cada aparelho chega até onde pode.`
                : 'A câmera não disse o que entrega.'
        }
      >
        <EscolhaDoPainel rotulo="Resolução">
          <Segmentado
            rotulo="Resolução"
            largura="cheia"
            opcoes={RESOLUCOES}
            valor={captura.resolucao}
            desativado={!camera}
            ocupado={aplicando}
            onChange={(resolucao) => onCaptura({ ...captura, resolucao })}
          />
        </EscolhaDoPainel>
        <EscolhaDoPainel rotulo="Quadros por segundo">
          <Segmentado
            rotulo="Quadros por segundo"
            largura="cheia"
            opcoes={QUADROS}
            valor={captura.quadros}
            desativado={!camera}
            ocupado={aplicando}
            onChange={(quadros) => onCaptura({ ...captura, quadros })}
          />
        </EscolhaDoPainel>
      </SecaoDoPainel>

      <SecaoDoPainel
        titulo="Card da câmera"
        dica={
          cenaTemCard
            ? 'Arraste o card no preview ou ajuste aqui. O corte leva ao programa.'
            : 'O card aparece na cena Tela com câmera.'
        }
        acao={
          cenaTemCard && (
            <AcaoDeTexto tamanho="xs" onClick={() => onCard(CARD_PADRAO)}>
              Voltar ao padrão
            </AcaoDeTexto>
          )
        }
      >
        {cenaTemCard && (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[var(--ink)]">Canto</span>
              <SeletorDeCanto
                rotulo="Levar o card a um canto"
                valor={canto}
                onChange={(c) => mudarCard(lugarDoCanto(card, c))}
              />
            </div>
            <EscolhaDoPainel rotulo="Formato">
              <Segmentado rotulo="Formato do card" largura="cheia" opcoes={FORMATOS} valor={card.formato} onChange={(formato) => mudarCard({ formato })} />
            </EscolhaDoPainel>
            <Deslizante
              rotulo="Tamanho"
              valor={Math.round(card.escala * 100)}
              min={60}
              max={180}
              passo={5}
              medida={`${Math.round(card.escala * 100)}%`}
              onChange={(v) => mudarCard({ escala: v / 100 })}
            />
          </>
        )}
      </SecaoDoPainel>

      <SecaoDoPainel
        titulo="Enquadramento"
        dica="Vale no preview e no programa na hora, sem esperar o corte, como a própria câmera."
        acao={
          (ajustes.zoom !== 1 || ajustes.x !== 0 || ajustes.y !== 0) && (
            <AcaoDeTexto tamanho="xs" onClick={() => mudar({ zoom: 1, x: 0, y: 0 })}>
              Voltar ao padrão
            </AcaoDeTexto>
          )
        }
      >
        <Deslizante
          rotulo="Zoom"
          valor={ajustes.zoom}
          min={ZOOM_MINIMO}
          max={ZOOM_MAXIMO}
          passo={0.05}
          medida={`${ajustes.zoom.toFixed(2).replace('.', ',')}×`}
          onChange={(zoom) => mudar({ zoom })}
        />
        <Deslizante
          rotulo="Horizontal"
          valor={ajustes.x}
          min={-limite}
          max={limite}
          medida={lado(ajustes.x, 'à esquerda', 'à direita')}
          onChange={(x) => mudar({ x })}
          desativado={limite === 0}
        />
        <Deslizante
          rotulo="Vertical"
          valor={ajustes.y}
          min={-limite}
          max={limite}
          medida={lado(ajustes.y, 'para cima', 'para baixo')}
          onChange={(y) => mudar({ y })}
          desativado={limite === 0}
        />
        {limite === 0 && <p className="text-xs text-[var(--ink-lo)]">Aumente o zoom para mover o quadro.</p>}
      </SecaoDoPainel>

      <SecaoDoPainel
        titulo="Espelhar a câmera"
        dica="Vira a imagem no preview e no programa na hora: o público também vê espelhado, e os textos atrás de você ficam ao contrário."
        acao={<Switch rotulo="Espelhar a câmera" checked={ajustes.espelhar} onChange={(espelhar) => mudar({ espelhar })} />}
      />

      <SecaoDoPainel
        titulo="Croma"
        dica="Tira o fundo verde ou azul atrás de você e mostra no lugar o fundo escolhido em Gráficos, ou o palco escuro. Vale no preview e no programa na hora, como o enquadramento."
        acao={<Switch rotulo="Ligar o croma" checked={ajustes.croma.ligado} onChange={(ligado) => mudarCroma({ ligado })} />}
      >
        {ajustes.croma.ligado && (
          <>
            <Segmentado
              rotulo="Cor do fundo"
              largura="cheia"
              opcoes={[
                { valor: 'verde', rotulo: 'Verde' },
                { valor: 'azul', rotulo: 'Azul' },
              ]}
              valor={ajustes.croma.cor}
              onChange={(cor) => mudarCroma({ cor })}
            />
            <Deslizante
              rotulo="Tolerância"
              valor={ajustes.croma.tolerancia}
              min={0}
              max={100}
              medida={`${ajustes.croma.tolerancia}%`}
              onChange={(tolerancia) => mudarCroma({ tolerancia })}
            />
            <Deslizante
              rotulo="Suavização da borda"
              valor={ajustes.croma.suavizacao}
              min={0}
              max={100}
              medida={`${ajustes.croma.suavizacao}%`}
              onChange={(suavizacao) => mudarCroma({ suavizacao })}
            />
            <Deslizante
              rotulo="Reflexo da cor na pele e na roupa"
              valor={ajustes.croma.descarte}
              min={0}
              max={100}
              medida={`${ajustes.croma.descarte}%`}
              onChange={(descarte) => mudarCroma({ descarte })}
            />
            <AcaoDeTexto tamanho="xs" onClick={() => mudarCroma({ ...AJUSTES_PADRAO.croma, ligado: true, cor: ajustes.croma.cor })}>
              Voltar ao padrão do croma
            </AcaoDeTexto>
          </>
        )}
      </SecaoDoPainel>
    </div>
  );
}
