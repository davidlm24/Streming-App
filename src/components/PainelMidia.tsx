import { Film } from 'lucide-react';
import type { ClipeNoPalco } from '../types';
import type { SituacaoDoClipe } from '../lib/playerDoClipe';
import { useMediaManager } from '../context/MediaManagerContext';
import { EnviarArquivo, EstadoNoPalco, FalhaNoPainel, SecaoDoPainel, ondeFicou } from './PecasDoPainel';
import { Button } from './ui/Button';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { ErroDeCampo } from './ui/ErroDeCampo';
import { useConfirm } from './ui/ConfirmDialog';

/**
 * Os clipes de vídeo. Um clipe entra no lugar da tela e toca no programa a
 * partir do corte, com o som só ali, num player só (lib/playerDoClipe):
 * trocar de cena não o recomeça, e numa cena sem tela ele pausa e continua
 * quando a tela volta. No preview, um clipe que ainda não está no programa
 * fica parado no primeiro quadro; o que já está mostra o quadro do programa.
 *
 * Antes o clipe começava a tocar assim que subia e entrava nos dois monitores
 * sem corte, com os controles do navegador por cima da imagem e o som em
 * dobro. O painel aceitava AVI e MKV, que o navegador não toca, e prometia
 * "transmitir". A trilha sonora saiu: tocava só no alto-falante de quem opera.
 */
/** O que vem depois de "no programa": só o que foge do normal, que é tocar. */
const PALAVRA_DA_SITUACAO: Record<SituacaoDoClipe, string | null> = {
  tocando: null,
  pausado: 'pausado',
  'no fim': 'no fim',
  bloqueado: 'parado',
};

export function PainelMidia({
  clipeNoPreview,
  clipeNoPrograma,
  situacaoNoPrograma,
  telaNoPrograma,
  onTocarNoPrograma,
  onClipe,
}: {
  clipeNoPreview: ClipeNoPalco | null;
  /** O id do clipe que está no programa. */
  clipeNoPrograma: string | null;
  /** Como está o clipe do programa; null sem clipe no programa. */
  situacaoNoPrograma: SituacaoDoClipe | null;
  /** A cena do programa desenha a tela. Sem ela, "Tocar de novo" só volta ao começo. */
  telaNoPrograma: boolean;
  /** Toca o clipe do programa: do começo, se chegou ao fim. Vale na hora, como iniciar o cronômetro. */
  onTocarNoPrograma: () => void;
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
        dica="O clipe entra no lugar da tela e toca no programa a partir do corte, com o som. Trocar de cena não o recomeça: numa cena sem tela, ele pausa e continua quando a tela volta."
      >
        {videoClips.length === 0 ? (
          <p className="text-sm text-[var(--ink-lo)]">Nenhum clipe ainda.</p>
        ) : (
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {videoClips.map((clipe) => {
              const noPreview = clipeNoPreview?.id === clipe.id;
              const noPrograma = clipeNoPrograma === clipe.id;
              const situacao = noPrograma ? situacaoNoPrograma : null;
              const aviso = clipe.url ? ondeFicou(clipe.url) : 'O arquivo deste clipe não está disponível.';
              return (
                <li key={clipe.id} className="py-3">
                  <div className="flex items-start gap-3">
                    <Film size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--ink-lo)]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-[var(--ink-hi)]">{clipe.name}</p>
                      <EstadoNoPalco
                        noPrograma={noPrograma}
                        noPreview={noPreview}
                        extra={situacao && PALAVRA_DA_SITUACAO[situacao] && <span className="text-[var(--ink-lo)]">{PALAVRA_DA_SITUACAO[situacao]}</span>}
                      />
                      {situacao === 'bloqueado' && (
                        <div className="mt-2">
                          <FalhaNoPainel frase="O navegador não deixou o clipe tocar no programa." onTentarDeNovo={onTocarNoPrograma} />
                        </div>
                      )}
                      {aviso && <p className="mt-0.5 text-pretty text-xs text-[var(--ink-lo)]">{aviso}</p>}
                    </div>
                  </div>
                  {/* As ações quebram de linha juntas, e o texto de cada uma não parte: na coluna estreita, "Tirar do preview" e "Tocar de novo" viravam duas linhas cada */}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pl-7">
                    {noPreview ? (
                      <Button variant="ghost" size="sm" onClick={() => onClipe(null)} className="whitespace-nowrap">
                        Tirar do preview
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!clipe.url}
                        onClick={() => onClipe({ id: clipe.id, nome: clipe.name, url: clipe.url })}
                        className="whitespace-nowrap"
                      >
                        Pôr no preview
                      </Button>
                    )}
                    <div className="flex items-center gap-4 whitespace-nowrap">
                      {situacao === 'no fim' && (
                        <AcaoDeTexto tamanho="xs" onClick={onTocarNoPrograma}>
                          {telaNoPrograma ? 'Tocar de novo' : 'Voltar ao começo'}
                        </AcaoDeTexto>
                      )}
                      <AcaoDeTexto tamanho="xs" onClick={() => excluir(clipe)}>
                        Excluir
                      </AcaoDeTexto>
                    </div>
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
