import { Fragment } from 'react';
import { CalendarClock, PenLine, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Menu, type ItemDeMenu } from './ui/Menu';
import { rotuloDoHorario } from '../lib/horario';

export interface WebinarResumo {
  id: string;
  title: string;
  /** Só em webinars antigos: não aparece, mas a edição o mantém. */
  desc?: string;
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
  onExcluir?: (webinar: WebinarResumo) => void;
  /** Editar abre no título; reagendar, na data. */
  onEditar?: (webinar: WebinarResumo, foco: 'titulo' | 'data') => void;
}

/**
 * O que mais se faz com um webinar, no "⋯". Sem nada para fazer, não há
 * menu. "Página de inscrição" e "Criar capa" saíram na fase 3: a página só
 * abria para o próprio anfitrião, e a capa não aparecia em lugar nenhum.
 * Editar e Reagendar abrem o mesmo formulário do agendamento: antes, o
 * único caminho de um webinar agendado era o estúdio ou a lixeira.
 */
export function acoesDoWebinar(webinar: WebinarResumo, { onExcluir, onEditar }: Pick<WebinarLinhaProps, 'onExcluir' | 'onEditar'>): ItemDeMenu[] {
  return [
    ...(onEditar
      ? [
          { rotulo: 'Editar', icone: <PenLine size={14} />, onSelect: () => onEditar(webinar, 'titulo') },
          { rotulo: 'Reagendar', icone: <CalendarClock size={14} />, onSelect: () => onEditar(webinar, 'data') },
        ]
      : []),
    ...(onExcluir ? [{ rotulo: 'Excluir webinar', icone: <Trash2 size={14} />, perigo: true, onSelect: () => onExcluir(webinar) }] : []),
  ];
}

/** Uma linha de webinar: uma ação visível (entrar), o resto no menu. */
export function WebinarLinha({ webinar, onEntrar, onExcluir, onEditar }: WebinarLinhaProps) {
  const acoes = acoesDoWebinar(webinar, { onExcluir, onEditar });
  return (
    <li className="flex items-center gap-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--ink-hi)] text-pretty">{webinar.title}</p>
        <p className="mt-1 text-xs text-[var(--ink-lo)]">
          <Horario texto={rotuloDoHorario(webinar)} />
          {webinar.channels.length > 0 && <> · {webinar.channels.join(', ')}</>}
          {webinar.type === 'pre-recorded' && <> · vídeo gravado</>}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEntrar(webinar)}>
          Entrar
        </Button>
        {acoes.length > 0 && <Menu rotulo={`Ações de ${webinar.title}`} itens={acoes} />}
      </div>
    </li>
  );
}
