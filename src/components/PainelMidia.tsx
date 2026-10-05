import { useEffect, useState } from 'react';
import { Film } from 'lucide-react';
import type { ClipeNoPalco } from '../types';
import type { SituacaoDoClipe } from '../lib/playerDoClipe';
import { fraseDaFalhaDoEnvio, useMidiaDoEstudio, type ItemDeMidia } from '../context/MidiaDoEstudio';
import { FORMATOS } from '../lib/midiaDaConta';
import { EnviarArquivo, EstadoNoPalco, FalhaNoPainel, NotaDaMidia, SecaoDoPainel } from './PecasDoPainel';
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
 * Um clipe que não está neste navegador baixa da conta quando vai para o
 * preview, e entra nele assim que chega: baixar todos a cada entrada gastaria
 * o tráfego do plano.
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

/** Um clipe que ainda não está nesta aba diz como vem; o que já chegou não diz nada. */
function chegadaDoClipe(clipe: ItemDeMidia): string | null {
  if (clipe.chegada === 'na-conta') return 'Baixa da sua conta ao ir para o preview.';
  if (clipe.chegada === 'na-fila') return 'Na fila para baixar da sua conta.';
  if (clipe.chegada === 'baixando') return clipe.progresso === null ? 'Baixando da sua conta…' : `Baixando da sua conta… ${clipe.progresso}%`;
  if (clipe.chegada === 'falhou') return 'Não abriu nesta tela.';
  return null;
}

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
  const midia = useMidiaDoEstudio();
  const clipes = midia.itens.clipe;
  const falha = midia.falhaDoEnvio?.tipo === 'clipe' ? midia.falhaDoEnvio : null;
  const confirmar = useConfirm();
  // O clipe pedido no preview que ainda está chegando da conta
  const [pedido, setPedido] = useState<string | null>(null);

  // Chegou: entra no preview. Não veio (ou saiu da lista): o pedido acaba, e a linha diz por quê
  useEffect(() => {
    if (!pedido) return;
    const clipe = clipes.find((c) => c.id === pedido);
    if (clipe?.url) onClipe({ id: clipe.id, nome: clipe.nome, url: clipe.url });
    if (!clipe || clipe.url || clipe.chegada === 'falhou') setPedido(null);
  }, [pedido, clipes, onClipe]);

  const porNoPreview = (clipe: ItemDeMidia) => {
    if (clipe.url) {
      setPedido(null);
      onClipe({ id: clipe.id, nome: clipe.nome, url: clipe.url });
      return;
    }
    setPedido(clipe.id);
    midia.baixar(clipe.id);
  };

  const excluir = async (clipe: { id: string; nome: string }) => {
    const ok = await confirmar({
      title: `Excluir ${clipe.nome}?`,
      description: 'O arquivo sai da sua conta, em todos os aparelhos. Se estiver no programa, continua lá até o próximo corte.',
      confirmLabel: 'Excluir o clipe',
      destructive: true,
    });
    if (!ok || !(await midia.excluir(clipe.id))) return;
    if (clipeNoPreview?.id === clipe.id) onClipe(null);
  };

  return (
    <div className="pb-6">
      <SecaoDoPainel
        titulo="Clipes de vídeo"
        dica="O clipe entra no lugar da tela e toca no programa a partir do corte, com o som. Trocar de cena não o recomeça: numa cena sem tela, ele pausa e continua quando a tela volta."
      >
        {/* Enquanto a conta não responde, nada: dizer "nenhum" antes de saber seria mentira */}
        {midia.leitura !== 'pronta' ? null : clipes.length === 0 ? (
          <p className="text-sm text-[var(--ink-lo)]">Nenhum clipe ainda.</p>
        ) : (
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {clipes.map((clipe) => {
              const noPreview = clipeNoPreview?.id === clipe.id;
              const noPrograma = clipeNoPrograma === clipe.id;
              const situacao = noPrograma ? situacaoNoPrograma : null;
              const chegada = chegadaDoClipe(clipe);
              return (
                <li key={clipe.id} className="py-3">
                  <div className="flex items-start gap-3">
                    <Film size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--ink-lo)]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-[var(--ink-hi)]">{clipe.nome}</p>
                      <EstadoNoPalco
                        noPrograma={noPrograma}
                        noPreview={noPreview}
                        extra={situacao && PALAVRA_DA_SITUACAO[situacao] && <span className="text-[var(--ink-lo)]">{PALAVRA_DA_SITUACAO[situacao]}</span>}
                      />
                      {chegada && <p className="mt-0.5 text-xs tabular-nums text-[var(--ink-lo)]">{chegada}</p>}
                      {situacao === 'bloqueado' && (
                        <div className="mt-2">
                          <FalhaNoPainel frase="O navegador não deixou o clipe tocar no programa." onTentarDeNovo={onTocarNoPrograma} />
                        </div>
                      )}
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
                        // Enquanto procura a cópia ou baixa, espera; sem cópia, baixa e entra ao chegar
                        disabled={clipe.chegada === 'abrindo' || clipe.chegada === 'na-fila' || clipe.chegada === 'baixando'}
                        onClick={() => porNoPreview(clipe)}
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
          rotulo="Enviar vídeo (MP4 ou WebM, até 50 MB)"
          aceita={FORMATOS.clipe.join(',')}
          progresso={midia.enviando.clipe}
          onArquivo={(arquivo) => void midia.enviar('clipe', arquivo)}
        />
        {falha && <ErroDeCampo id="erro-do-envio-de-video">{fraseDaFalhaDoEnvio('clipe', falha.motivo)}</ErroDeCampo>}
        <NotaDaMidia tipo="clipe" />
      </SecaoDoPainel>
    </div>
  );
}
