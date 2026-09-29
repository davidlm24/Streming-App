import { Film } from 'lucide-react';
import type { ClipeNoPalco } from '../types';
import { useMediaManager } from '../context/MediaManagerContext';
import { EnviarArquivo, EstadoNoPalco, SecaoDoPainel, ondeFicou } from './PecasDoPainel';
import { Button } from './ui/Button';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { ErroDeCampo } from './ui/ErroDeCampo';
import { useConfirm } from './ui/ConfirmDialog';

/**
 * Os clipes de vídeo. Um clipe entra no lugar da tela: fica parado no
 * primeiro quadro no preview e toca no programa a partir do corte, com o som
 * só ali.
 *
 * Antes o clipe começava a tocar assim que subia e entrava nos dois monitores
 * sem corte, com os controles do navegador por cima da imagem e o som em
 * dobro. O painel aceitava AVI e MKV, que o navegador não toca, e prometia
 * "transmitir". A trilha sonora saiu: tocava só no alto-falante de quem opera.
 */
export function PainelMidia({
  clipeNoPreview,
  clipeNoPrograma,
  onClipe,
}: {
  clipeNoPreview: ClipeNoPalco | null;
  /** O id do clipe que está no programa. */
  clipeNoPrograma: string | null;
  onClipe: (clipe: ClipeNoPalco | null) => void;
}) {
  const { videoClips, uploadVideoClip, deleteVideoClip, isCloudUploading, mediaUploadError } = useMediaManager();
  const confirmar = useConfirm();

  const excluir = async (clipe: { id: string; name: string }) => {
    const ok = await confirmar({
      title: `Excluir ${clipe.name}?`,
      description: 'O arquivo sai do estúdio. Se ele estiver no programa, continua lá até o próximo corte.',
      confirmLabel: 'Excluir o clipe',
      destructive: true,
    });
    if (!ok) return;
    if (clipeNoPreview?.id === clipe.id) onClipe(null);
    deleteVideoClip(clipe.id);
  };

  return (
    <div className="pb-6">
      <SecaoDoPainel
        titulo="Clipes de vídeo"
        dica="O clipe entra no lugar da tela: parado no preview, ele toca no programa a partir do corte, com o som."
      >
        {videoClips.length === 0 ? (
          <p className="text-sm text-[var(--ink-lo)]">Nenhum clipe ainda.</p>
        ) : (
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {videoClips.map((clipe) => {
              const noPreview = clipeNoPreview?.id === clipe.id;
              const aviso = clipe.url ? ondeFicou(clipe.url) : 'O arquivo deste clipe não está disponível.';
              return (
                <li key={clipe.id} className="py-3">
                  <div className="flex items-start gap-3">
                    <Film size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--ink-lo)]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-[var(--ink-hi)]">{clipe.name}</p>
                      <EstadoNoPalco noPrograma={clipeNoPrograma === clipe.id} noPreview={noPreview} />
                      {aviso && <p className="mt-0.5 text-pretty text-xs text-[var(--ink-lo)]">{aviso}</p>}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 pl-7">
                    {noPreview ? (
                      <Button variant="ghost" size="sm" onClick={() => onClipe(null)}>
                        Tirar do preview
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!clipe.url}
                        onClick={() => onClipe({ id: clipe.id, nome: clipe.name, url: clipe.url })}
                      >
                        Pôr no preview
                      </Button>
                    )}
                    <AcaoDeTexto tamanho="xs" onClick={() => excluir(clipe)}>
                      Excluir
                    </AcaoDeTexto>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <EnviarArquivo
          rotulo="Enviar vídeo (MP4 ou WebM)"
          aceita="video/mp4,video/webm"
          enviando={isCloudUploading}
          onArquivo={(arquivo) => void uploadVideoClip(arquivo)}
        />
        {mediaUploadError && (
          <ErroDeCampo id="erro-do-envio-de-video">O vídeo não foi enviado. Confira o arquivo e envie de novo.</ErroDeCampo>
        )}
      </SecaoDoPainel>
    </div>
  );
}
