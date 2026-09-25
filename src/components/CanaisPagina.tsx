import { CircleAlert, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Destination } from '../types';
import { estadoDoCanal, nomeDaPlataforma, pendenciaDoCanal } from '../lib/canais';
import { Button } from './ui/Button';
import { useConfirm } from './ui/ConfirmDialog';
import { Menu } from './ui/Menu';
import { CabecalhoDePagina, Pagina } from './ui/Pagina';
import { PlataformaIcone } from './ui/PlataformaIcone';
import { Switch } from './ui/Switch';

interface CanaisPaginaProps {
  canais: Destination[];
  /** Sem argumento, conecta um canal novo; com a plataforma, abre direto nela. */
  onConectarCanal: (plataforma?: string) => void;
  onAlternarCanal: (id: string) => void;
  onRemoverCanal: (id: string) => void;
}

/**
 * Canais: para onde a live vai. Antes não havia lugar para isso — os
 * canais apareciam como contador no cabeçalho ("Adicionar canais 2") e
 * como lista dentro do estúdio, e não havia como remover um.
 */
export function CanaisPagina({ canais, onConectarCanal, onAlternarCanal, onRemoverCanal }: CanaisPaginaProps) {
  const confirmar = useConfirm();

  const removerComConfirmacao = async (canal: Destination) => {
    const ok = await confirmar({
      title: `Remover ${canal.name}?`,
      description: 'O servidor e a chave deste canal serão apagados. Para transmitir para ele de novo, será preciso conectá-lo outra vez.',
      confirmLabel: 'Remover canal',
      destructive: true,
    });
    if (ok) onRemoverCanal(canal.id);
  };

  return (
    <Pagina>
      <CabecalhoDePagina
        titulo="Canais"
        descricao="Os canais ligados recebem a transmissão quando você entra no ar."
        acao={
          <Button onClick={() => onConectarCanal()} icon={<Plus size={16} aria-hidden="true" />}>
            Conectar canal
          </Button>
        }
      />

      {canais.length === 0 ? (
        <div className="mt-12 border-t border-[var(--line)] pt-6">
          <p className="max-w-prose text-sm text-[var(--ink-lo)]">
            Nenhum canal conectado ainda. Conecte o YouTube, o Facebook, a Twitch ou um servidor RTMP seu — a live vai para todos ao mesmo tempo.
          </p>
        </div>
      ) : (
        <ul className="mt-12 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {canais.map((canal) => {
            const estado = estadoDoCanal(canal);
            const pendencia = pendenciaDoCanal(canal);
            return (
              <li key={canal.id} className="flex items-center gap-4 py-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] text-[var(--ink)]">
                  <PlataformaIcone plataforma={canal.platform} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--ink-hi)]">{canal.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--ink-lo)]">
                    <span>{nomeDaPlataforma(canal.platform)} ·</span>
                    {estado === 'incompleto' ? (
                      // Pendência na tinta do nome, com ícone: não pode ler igual a "Desligado"
                      <span className="inline-flex items-center gap-1 text-[var(--ink-hi)]">
                        <CircleAlert size={12} aria-hidden="true" />
                        {pendencia}
                      </span>
                    ) : (
                      <span>{estado === 'pronto' ? 'Pronto' : 'Desligado'}</span>
                    )}
                  </p>
                </div>
                <Switch
                  checked={canal.selected}
                  onChange={() => onAlternarCanal(canal.id)}
                  rotulo={`Transmitir para ${canal.name}`}
                />
                <Menu
                  rotulo={`Ações de ${canal.name}`}
                  itens={[
                    { rotulo: 'Editar servidor e chave', icone: <Pencil size={14} />, onSelect: () => onConectarCanal(canal.platform) },
                    { rotulo: 'Remover canal', icone: <Trash2 size={14} />, perigo: true, onSelect: () => removerComConfirmacao(canal) },
                  ]}
                />
              </li>
            );
          })}
        </ul>
      )}
    </Pagina>
  );
}
