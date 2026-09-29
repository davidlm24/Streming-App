import type { Dispatch, SetStateAction } from 'react';
import type { CantoDoPalco } from '../types';
import { normalizarLink } from '../lib/graficos';
import { CampoDoPainel, Deslizante, EstadoNoPalco, SecaoDoPainel, SeletorDeCanto } from './PecasDoPainel';
import { Switch } from './ui/Switch';

/** O QR code que o estúdio está montando. Vai ao preview quando ligado e com um link válido. */
export interface QrDoEstudio {
  link: string;
  titulo: string;
  preco: string;
  canto: CantoDoPalco;
  tamanho: number;
  noPreview: boolean;
}

/**
 * O QR code: o link, um título e um preço opcionais, o canto e o tamanho. O
 * painel é o único editor, e o palco é o único desenho.
 *
 * Havia aqui um modal de 924 linhas com lojas que preenchiam endereços que
 * não existem, produtos de exemplo com foto do Unsplash, temas neon e
 * dourado, "QR Codes dinâmicos" (o QR é estático) e um "Salvo com Sucesso!"
 * que só guardava no navegador. O QR era pedido ao api.qrserver.com a cada
 * tecla, e o mesmo card era desenhado de quatro jeitos diferentes.
 */
export function PainelQrCode({
  qr,
  onQr,
  noPrograma,
}: {
  qr: QrDoEstudio;
  onQr: Dispatch<SetStateAction<QrDoEstudio>>;
  /** Há um QR code no programa. */
  noPrograma: boolean;
}) {
  const mudar = (parcial: Partial<QrDoEstudio>) => onQr((atual) => ({ ...atual, ...parcial }));
  const link = normalizarLink(qr.link);
  const linkInvalido = qr.link.trim() !== '' && !link;

  return (
    <div className="pb-6">
      <SecaoDoPainel
        titulo="QR code"
        estado={<EstadoNoPalco noPrograma={noPrograma} noPreview={qr.noPreview && !!link} />}
        dica="Gerado neste navegador: o link não passa por nenhum serviço."
        acao={
          <Switch
            rotulo="Mostrar o QR code no preview"
            checked={qr.noPreview && !!link}
            disabled={!link}
            onChange={(noPreview) => mudar({ noPreview })}
          />
        }
      >
        <CampoDoPainel
          rotulo="Link"
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="loja.com.br/produto"
          value={qr.link}
          onChange={(e) => mudar({ link: e.target.value })}
          dica='Sem "https://" também vale.'
          erro={linkInvalido ? 'Isso não parece um endereço da web. Confira o link.' : undefined}
        />
        <CampoDoPainel
          rotulo="Título (opcional)"
          placeholder="Curso de fotografia"
          maxLength={60}
          value={qr.titulo}
          onChange={(e) => mudar({ titulo: e.target.value })}
        />
        <CampoDoPainel
          rotulo="Preço (opcional)"
          placeholder="R$ 97,00"
          maxLength={24}
          value={qr.preco}
          onChange={(e) => mudar({ preco: e.target.value })}
        />
      </SecaoDoPainel>

      <SecaoDoPainel titulo="Posição" dica="O QR code fica dentro da área segura, acima do ticker quando há um.">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-[var(--ink)]">Canto</span>
          <SeletorDeCanto rotulo="Canto do QR code" valor={qr.canto} onChange={(canto) => mudar({ canto })} />
        </div>
        <Deslizante
          rotulo="Tamanho"
          valor={qr.tamanho}
          min={8}
          max={24}
          medida={`${qr.tamanho}% da largura`}
          onChange={(tamanho) => mudar({ tamanho })}
        />
      </SecaoDoPainel>
    </div>
  );
}
