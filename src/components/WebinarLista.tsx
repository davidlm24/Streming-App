import { Fragment } from 'react';
import { ExternalLink, Palette, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Menu, type ItemDeMenu } from './ui/Menu';

export interface WebinarResumo {
  id: string;
  title: string;
  desc: string;
  time: string;
  channels: string[];
  type: string;
  videoName: string;
  /** Horário em ISO 8601, quando o webinar foi criado com ele. */
  startsAt?: string;
}

/**
 * A próxima live primeiro: quem tem horário (`startsAt`) entra em ordem de
 * horário; quem só tem o texto livre ("Amanhã, às 19:30") mantém a ordem da
 * lista, que já é a de criação.
 */
export function ordenarPorHorario(webinars: WebinarResumo[]): WebinarResumo[] {
  const quando = (w: WebinarResumo) => (w.startsAt ? Date.parse(w.startsAt) : Number.POSITIVE_INFINITY);
  return [...webinars].sort((a, b) => quando(a) - quando(b));
}

/**
 * O horário em mono tabular: é medida, e medida no sistema tem voz própria.
 * O texto vem livre ("Hoje, às 20:00 (Horário de Brasília)"), então só a
 * hora em si ganha a fonte mono; as palavras ficam na fonte do texto.
 */
export function Horario({ texto }: { texto: string }) {
  const partes = texto.split(/(\d{1,2}(?::|h)\d{2})/);
  return (
    <>
      {partes.map((parte, i) =>
        i % 2 === 1 ? (
          <span key={i} className="font-mono tabular-nums text-[var(--ink)]">{parte}</span>
        ) : (
          <Fragment key={i}>{parte}</Fragment>
        ),
      )}
    </>
  );
}

interface WebinarLinhaProps {
  webinar: WebinarResumo;
  onEntrar: (webinar: WebinarResumo) => void;
  onPaginaPublica: (webinar: WebinarResumo) => void;
  onCriarCapa: (webinar: WebinarResumo) => void;
  onExcluir?: (webinar: WebinarResumo) => void;
}

export function acoesDoWebinar(
  webinar: WebinarResumo,
  { onPaginaPublica, onCriarCapa, onExcluir }: Pick<WebinarLinhaProps, 'onPaginaPublica' | 'onCriarCapa' | 'onExcluir'>,
): ItemDeMenu[] {
  const acoes: ItemDeMenu[] = [
    { rotulo: 'Página de inscrição', icone: <ExternalLink size={14} />, onSelect: () => onPaginaPublica(webinar) },
    { rotulo: 'Criar capa', icone: <Palette size={14} />, onSelect: () => onCriarCapa(webinar) },
  ];
  if (onExcluir) {
    acoes.push({ rotulo: 'Excluir webinar', icone: <Trash2 size={14} />, perigo: true, onSelect: () => onExcluir(webinar) });
  }
  return acoes;
}

/** Uma linha de webinar: uma ação visível (entrar), o resto no menu. */
export function WebinarLinha({ webinar, onEntrar, onPaginaPublica, onCriarCapa, onExcluir }: WebinarLinhaProps) {
  return (
    <li className="flex items-center gap-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--ink-hi)] text-pretty">{webinar.title}</p>
        <p className="mt-1 text-xs text-[var(--ink-lo)]">
          <Horario texto={webinar.time} />
          {webinar.channels.length > 0 && <> · {webinar.channels.join(', ')}</>}
          {webinar.type === 'pre-recorded' && <> · vídeo gravado</>}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEntrar(webinar)}>
          Entrar
        </Button>
        <Menu rotulo={`Ações de ${webinar.title}`} itens={acoesDoWebinar(webinar, { onPaginaPublica, onCriarCapa, onExcluir })} />
      </div>
    </li>
  );
}
