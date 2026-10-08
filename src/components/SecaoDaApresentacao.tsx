import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { fraseDaFalhaDoPdf } from '../lib/apresentacao';
import type { Apresentacao } from '../lib/useApresentacao';
import { EnviarArquivo, EstadoNoPalco, SecaoDoPainel } from './PecasDoPainel';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { Button } from './ui/Button';
import { ErroDeCampo } from './ui/ErroDeCampo';

/**
 * A apresentação em PDF, na aba Mídia, logo abaixo dos clipes. Ela entra no
 * lugar da tela, como o clipe, e vai ao programa no corte. Virar a página é
 * da fonte, como rolar a tela compartilhada: vale na hora nos dois monitores.
 *
 * O PDF abre só neste navegador e fecha com o estúdio. No programa ele não
 * fecha: o palco ficaria sem a página no ar.
 *
 * Abrir e fechar trocam o que está na seção, e o controle que tinha o foco
 * sai com ela: o foco vai a "Pôr no preview" depois de abrir e de volta ao
 * campo do arquivo depois de fechar (ou de uma falha), em vez de cair no
 * <body>. "Anterior" e "Próxima" ficam focáveis na primeira e na última
 * página, pelo mesmo motivo.
 */
export function SecaoDaApresentacao({
  apresentacao,
  noPreview,
  noPrograma,
  onPreview,
}: {
  apresentacao: Apresentacao;
  noPreview: boolean;
  noPrograma: boolean;
  onPreview: (entra: boolean) => void;
}) {
  const { aberta, pagina, mostrada, abrindo, falha } = apresentacao;
  const campo = useRef<HTMLInputElement>(null);
  const porNoPreview = useRef<HTMLButtonElement>(null);
  // Quem pediu a troca: abrir (o foco vai aonde o resultado deixar) ou fechar
  const focarDepois = useRef<'abrir' | 'fechar' | null>(null);

  useEffect(() => {
    if (!focarDepois.current || abrindo) return;
    if (aberta && focarDepois.current === 'abrir') porNoPreview.current?.focus();
    else if (!aberta) campo.current?.focus();
    focarDepois.current = null;
  }, [aberta, abrindo]);

  const abrir = (arquivo: File) => {
    focarDepois.current = 'abrir';
    void apresentacao.abrir(arquivo);
  };

  const primeira = pagina <= 1;
  const ultima = !!aberta && pagina >= aberta.paginas;

  return (
    <SecaoDoPainel
      titulo="Apresentação em PDF"
      estado={aberta ? <EstadoNoPalco noPrograma={noPrograma} noPreview={noPreview} /> : undefined}
      dica="Abre só neste navegador: o PDF não vai para a sua conta e fecha com o estúdio. Ela entra no lugar da tela; a página vale na hora nos dois monitores."
    >
      {aberta ? (
        <>
          <div className="flex items-start gap-3">
            <FileText size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--ink-lo)]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-[var(--ink-hi)]">{aberta.nome}</p>
              <p aria-live="polite" className="text-xs tabular-nums text-[var(--ink-lo)]">
                Página {pagina} de {aberta.paginas}
              </p>
            </div>
          </div>

          <div className="relative aspect-video w-full overflow-hidden border border-[var(--line)] bg-[var(--stage)]">
            {mostrada ? (
              <img src={mostrada.url} alt={`Página ${mostrada.pagina} de ${aberta.nome}`} className="h-full w-full object-contain" />
            ) : (
              <p className="flex h-full items-center justify-center text-xs text-[var(--ink-lo)]">Desenhando a página…</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<ChevronLeft size={14} aria-hidden="true" />}
              aria-disabled={primeira || undefined}
              onClick={() => !primeira && apresentacao.irPara(pagina - 1)}
              className="min-h-11"
            >
              Anterior
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-disabled={ultima || undefined}
              onClick={() => !ultima && apresentacao.irPara(pagina + 1)}
              className="min-h-11 flex-row-reverse"
              icon={<ChevronRight size={14} aria-hidden="true" />}
            >
              Próxima
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <Button ref={porNoPreview} variant="ghost" size="sm" onClick={() => onPreview(!noPreview)} className="whitespace-nowrap">
              {noPreview ? 'Tirar do preview' : 'Pôr no preview'}
            </Button>
            {noPrograma ? (
              <p className="text-xs text-[var(--ink-lo)]">No programa: tire com um corte para fechar.</p>
            ) : (
              <AcaoDeTexto
                tamanho="xs"
                onClick={() => {
                  if (noPreview) onPreview(false);
                  focarDepois.current = 'fechar';
                  apresentacao.fechar();
                }}
              >
                Fechar o PDF
              </AcaoDeTexto>
            )}
          </div>
        </>
      ) : (
        <EnviarArquivo
          rotulo={abrindo ? 'Abrindo o PDF…' : 'Abrir um PDF do computador'}
          aceita="application/pdf,.pdf"
          progresso={undefined}
          ocupado={abrindo}
          refDoCampo={campo}
          onArquivo={abrir}
        />
      )}
      {/* A falha é anunciada: ela chega depois da escolha do arquivo, sem o foco ir até ela */}
      <div aria-live="polite">{falha && <ErroDeCampo id="erro-da-apresentacao">{fraseDaFalhaDoPdf(falha)}</ErroDeCampo>}</div>
    </SecaoDoPainel>
  );
}
