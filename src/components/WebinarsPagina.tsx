import { Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { useConfirm } from './ui/ConfirmDialog';
import { CabecalhoDePagina, Pagina } from './ui/Pagina';
import { WebinarLinha, ordenarPorHorario, type WebinarResumo } from './WebinarLista';

interface WebinarsPaginaProps {
  webinars: WebinarResumo[];
  carregado: boolean;
  onAgendar: () => void;
  onEntrar: (webinar: WebinarResumo) => void;
  onPaginaPublica: (webinar: WebinarResumo) => void;
  onCriarCapa: (webinar: WebinarResumo) => void;
  onExcluir: (webinar: WebinarResumo) => void;
}

/** Todos os webinars. No painel ficavam espremidos, com um "Ver todos" que não levava a lugar nenhum. */
export function WebinarsPagina({ webinars, carregado, onAgendar, onEntrar, onPaginaPublica, onCriarCapa, onExcluir }: WebinarsPaginaProps) {
  const confirmar = useConfirm();

  const excluirComConfirmacao = async (webinar: WebinarResumo) => {
    const ok = await confirmar({
      title: `Excluir "${webinar.title}"?`,
      description: 'A página de inscrição deixa de existir e quem se inscreveu não verá mais o webinar.',
      confirmLabel: 'Excluir webinar',
      destructive: true,
    });
    if (ok) onExcluir(webinar);
  };

  return (
    <Pagina>
      <CabecalhoDePagina
        titulo="Webinars"
        descricao="Cada webinar tem a própria página de inscrição para divulgar."
        acao={
          <Button onClick={onAgendar} icon={<Plus size={16} aria-hidden="true" />}>
            Agendar webinar
          </Button>
        }
      />

      {!carregado ? (
        <div className="mt-12 space-y-4 border-t border-[var(--line)] pt-6" aria-busy="true">
          <span className="sr-only">Carregando seus webinars…</span>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-[var(--panel)] motion-safe:animate-pulse" />
          ))}
        </div>
      ) : webinars.length === 0 ? (
        <p className="mt-12 max-w-prose border-t border-[var(--line)] pt-6 text-sm text-[var(--ink-lo)]">
          Nenhum webinar agendado. Agende um para ter a página de inscrição e começar a divulgar.
        </p>
      ) : (
        <ul className="mt-12 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {ordenarPorHorario(webinars).map((w) => (
            <WebinarLinha
              key={w.id}
              webinar={w}
              onEntrar={onEntrar}
              onPaginaPublica={onPaginaPublica}
              onCriarCapa={onCriarCapa}
              onExcluir={excluirComConfirmacao}
            />
          ))}
        </ul>
      )}
    </Pagina>
  );
}
