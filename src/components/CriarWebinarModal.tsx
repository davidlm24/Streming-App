import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CircleAlert } from 'lucide-react';
import type { Destination } from '../types';
import { PLATAFORMAS_NOMEADAS, estadoDoCanal, nomeDaPlataforma, pendenciaCurta, plataformaPeloNome } from '../lib/canais';
import { ErroAoSalvar, type FalhaAoSalvar } from '../lib/dadosDaConta';
import { horarioPorExtenso } from '../lib/horario';
import { LIMITE_DE_WEBINARS } from '../lib/limitesDaConta';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { Button } from './ui/Button';
import { CaixaDeSelecao } from './ui/CaixaDeSelecao';
import { ErroDeCampo } from './ui/ErroDeCampo';
import { Modal } from './ui/Modal';
import { PlataformaIcone } from './ui/PlataformaIcone';

export interface NovoWebinar {
  id: string;
  title: string;
  /** Só em webinars antigos, e só passa adiante na edição: o campo saiu do formulário. */
  desc?: string;
  /** O horário por extenso, para quem lê só o texto. */
  time: string;
  /** O horário em ISO 8601: dele vêm a ordem da lista e "Hoje/Amanhã". */
  startsAt: string;
  /** Nomes das plataformas ("YouTube"); `plataformaPeloNome` volta deles à plataforma. */
  channels: string[];
  /** Os novos são 'webinar'; a edição mantém o tipo de um webinar antigo. */
  type: 'live' | 'webinar' | 'pre-recorded';
  videoName: string;
}

/** O que a edição precisa saber do webinar que já existe. */
export interface WebinarEditavel {
  id: string;
  title: string;
  desc?: string;
  time: string;
  startsAt?: string;
  channels: string[];
  type: string;
  videoName: string;
}

interface CriarWebinarModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Os canais da página Canais: dizem quais plataformas já estão conectadas. */
  canais: Destination[];
  /** Grava e só resolve depois de o banco confirmar; falha com `ErroAoSalvar`. */
  onAgendar: (webinar: NovoWebinar) => Promise<void>;
  /** Sai da conta e volta à entrada: a saída do aviso de sessão expirada. */
  onSair: () => void;
  /**
   * Editar ou reagendar um webinar que já existe: o formulário abre com os
   * dados dele, e salvar grava no mesmo id. Quem chama monta o modal com
   * `key` no id, para cada edição começar dos dados do banco.
   */
  editando?: WebinarEditavel;
  /** Onde o foco começa: no título (Editar) ou na data (Reagendar). */
  focoInicial?: 'titulo' | 'data';
}

type Plataforma = (typeof PLATAFORMAS_NOMEADAS)[number];
type Erros = { titulo?: string; data?: string; hora?: string };

const CAMPO = 'mt-2 block w-full rounded-xl border px-3 text-sm';

/** A falha ao gravar, no verbo do que se fazia: agendar um novo ou salvar as mudanças de um que existe. */
function oQueDizer(falha: FalhaAoSalvar, editando: boolean): string {
  const feito = editando ? 'as mudanças foram salvas' : 'o webinar foi agendado';
  switch (falha) {
    case 'sem-login':
      return editando ? 'Sua sessão expirou, então as mudanças não foram salvas.' : 'Sua sessão expirou, então o webinar não foi agendado.';
    case 'sem-conexao':
      return 'Sem conexão com a sua conta agora. Tente de novo mais tarde.';
    case 'sem-confirmacao':
      return `Não deu para confirmar que ${feito}. Confira a conexão e tente de novo.`;
    case 'limite-da-conta':
      return `A sua conta já guarda ${LIMITE_DE_WEBINARS} webinars, o limite. Exclua um que não usa e agende de novo.`;
    case 'grande-demais':
      return 'Os dados do webinar são grandes demais para salvar. Encurte o título e tente de novo.';
    case 'recusado':
      return editando ? 'Não foi possível salvar as mudanças. Tente de novo.' : 'Não foi possível agendar o webinar. Tente de novo.';
  }
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');
/** A data local no formato do campo nativo (aaaa-mm-dd). */
const dataDoCampo = (d: Date) => `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
/** A hora local no formato do campo nativo (hh:mm). */
const horaDoCampo = (d: Date) => `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;

/** O horário salvo, como data local; nada para os webinars antigos de texto livre. */
const inicioSalvo = (webinar?: WebinarEditavel) => {
  const ms = webinar?.startsAt ? Date.parse(webinar.startsAt) : NaN;
  return Number.isNaN(ms) ? null : new Date(ms);
};

const ehPlataforma = (p: string | undefined): p is Plataforma => !!p && (PLATAFORMAS_NOMEADAS as readonly string[]).includes(p);

/** A palavra de estado da plataforma, no vocabulário da linha de canais do Painel. */
function estadoDaPlataforma(canais: Destination[], plataforma: Plataforma): string {
  const daPlataforma = canais.filter((c) => c.platform === plataforma);
  if (daPlataforma.length === 0) return 'não conectado';
  const ligado = daPlataforma.find((c) => c.selected);
  if (!ligado) return 'desligado';
  return estadoDoCanal(ligado) === 'pronto' ? 'pronto' : pendenciaCurta(ligado) ?? 'pronto';
}

/**
 * Agendar um webinar: quando e para onde.
 *
 * Era um modal de "Agendar Nova Transmissão" com o horário em texto livre
 * ("Ex: Amanhã, às 20:00", e "Hoje, às" + a hora atual quando vazio), um tipo
 * "Transmissão Gravada (Simulada)" com upload de mentira e promessa de
 * transcoding, e uma lista fixa de redes (Instagram, LinkedIn, X/Twitter) com
 * YouTube sempre marcado, sem relação com os canais conectados. E dizia que
 * tinha agendado sem esperar o banco.
 *
 * O título é neutro ("Novo webinar"); o verbo mora no botão. O rascunho fica
 * enquanto o app estiver aberto — fechar sem querer ou uma falha ao gravar não
 * perdem o que foi digitado — e some só depois de o banco confirmar.
 *
 * A Descrição saiu na fase 3, com a página pública, que era a única tela que
 * a mostrava ao público (Regra do Dado com Uso). Volta com o link público.
 *
 * Com `editando`, o mesmo formulário edita e reagenda: um webinar agendado
 * deixava de ser uma entrada só de ida para o estúdio, que só se podia
 * excluir. A edição grava no mesmo id, e o roteiro do webinar fica com ele.
 */
export function CriarWebinarModal({ isOpen, onClose, canais, onAgendar, onSair, editando, focoInicial = 'titulo' }: CriarWebinarModalProps) {
  const inicioOriginal = inicioSalvo(editando);
  // Os canais que a lista de plataformas não conhece passam adiante como estavam
  const canaisSemPlataforma = (editando?.channels ?? []).filter((nome) => !ehPlataforma(plataformaPeloNome(nome)));
  const [titulo, setTitulo] = useState(editando?.title ?? '');
  const [data, setData] = useState(inicioOriginal ? dataDoCampo(inicioOriginal) : '');
  const [hora, setHora] = useState(inicioOriginal ? horaDoCampo(inicioOriginal) : '');
  const [plataformas, setPlataformas] = useState<Plataforma[]>(() =>
    (editando?.channels ?? []).map(plataformaPeloNome).filter(ehPlataforma),
  );
  const [erros, setErros] = useState<Erros>({});
  const [falha, setFalha] = useState<FalhaAoSalvar | null>(null);
  const [salvando, setSalvando] = useState(false);
  // Na edição, os canais já são os do webinar: a abertura não troca pelos ligados hoje
  const tocouNosCanais = useRef(!!editando);
  // O id nasce na primeira tentativa e se repete nas seguintes: uma escrita que
  // chegue atrasada é só repetida, não vira um segundo webinar.
  const idDoRascunho = useRef<string | null>(editando?.id ?? null);
  const refTitulo = useRef<HTMLInputElement>(null);
  const refData = useRef<HTMLInputElement>(null);
  const refHora = useRef<HTMLInputElement>(null);
  const refAgendar = useRef<HTMLButtonElement>(null);
  const refEntrarDeNovo = useRef<HTMLButtonElement>(null);
  const focarNaFalha = useRef(false);

  // Depois de uma falha, o foco vai para a saída: "Entrar de novo" quando a
  // sessão expirou, senão de volta ao botão. Enquanto grava, o botão fica
  // desabilitado e o foco cairia no <body>; espera ele voltar.
  useEffect(() => {
    if (!focarNaFalha.current || salvando || !falha) return;
    focarNaFalha.current = false;
    (falha === 'sem-login' ? refEntrarDeNovo : refAgendar).current?.focus();
  }, [falha, salvando]);

  // Ao abrir: o foco vai ao título (a primitiva o põe no botão de fechar) e,
  // se a pessoa ainda não mexeu nos canais, marca as plataformas dos canais
  // ligados — para onde a live vai hoje. Só na abertura: os canais lidos são
  // os daquele momento.
  useEffect(() => {
    if (!isOpen) return;
    (focoInicial === 'data' ? refData : refTitulo).current?.focus();
    if (!tocouNosCanais.current) {
      setPlataformas(PLATAFORMAS_NOMEADAS.filter((p) => canais.some((c) => c.platform === p && c.selected)));
    }
  }, [isOpen]);

  const alternar = (plataforma: Plataforma) => {
    tocouNosCanais.current = true;
    setPlataformas((atuais) => (atuais.includes(plataforma) ? atuais.filter((p) => p !== plataforma) : [...atuais, plataforma]));
  };

  const limparErro = (campo: keyof Erros) => setErros((atuais) => (atuais[campo] ? { ...atuais, [campo]: undefined } : atuais));

  const agendar = async (e: FormEvent) => {
    e.preventDefault();
    if (salvando) return;
    // O aviso da tentativa anterior não vale para esta.
    setFalha(null);

    const novos: Erros = {};
    if (!titulo.trim()) novos.titulo = 'Falta o título. É o nome que aparece na lista e no estúdio.';
    if (!data) novos.data = 'Falta a data.';
    if (!hora) novos.hora = 'Falta a hora.';
    const inicio = data && hora ? new Date(`${data}T${hora}`) : null;
    // Na edição, um horário que não mudou passa mesmo já tendo passado: corrigir
    // o título de uma live de ontem não obriga a reagendá-la
    const mesmoHorario = !!inicio && !!inicioOriginal && inicio.getTime() === inicioOriginal.getTime();
    if (inicio && !novos.data && !novos.hora && !mesmoHorario && inicio.getTime() <= Date.now()) {
      novos.hora = 'Esse horário já passou. Escolha um a partir de agora.';
    }

    if (novos.titulo || novos.data || novos.hora) {
      setErros(novos);
      (novos.titulo ? refTitulo : novos.data ? refData : refHora).current?.focus();
      return;
    }

    // O id é o do banco (uuid), e a nova tentativa usa o mesmo: não cria outro webinar
    idDoRascunho.current ??= crypto.randomUUID();
    setSalvando(true);
    try {
      await onAgendar({
        id: idDoRascunho.current,
        title: titulo.trim(),
        // O que o formulário não mostra fica como estava no webinar editado
        ...(editando?.desc ? { desc: editando.desc } : {}),
        time: horarioPorExtenso(inicio!),
        startsAt: inicio!.toISOString(),
        channels: [...PLATAFORMAS_NOMEADAS.filter((p) => plataformas.includes(p)).map(nomeDaPlataforma), ...canaisSemPlataforma],
        type: editando?.type === 'live' || editando?.type === 'pre-recorded' ? editando.type : 'webinar',
        videoName: editando?.videoName ?? '',
      });
      // A edição fecha e sai de cena (o modal é montado de novo na próxima); só o rascunho de um novo é limpo
      if (editando) return;
      setTitulo('');
      setData('');
      setHora('');
      setErros({});
      tocouNosCanais.current = false;
      idDoRascunho.current = null;
    } catch (err) {
      focarNaFalha.current = true;
      setFalha(err instanceof ErroAoSalvar ? err.motivo : 'recusado');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      // Enquanto grava, o diálogo não fecha: a falha aparece com o rascunho à vista
      ocupado={salvando}
      title={editando ? 'Editar webinar' : 'Novo webinar'}
      size="md"
      footer={
        // A falha fica no rodapé, logo acima dos botões e fora da área que
        // rola: no celular, no fim do formulário ela ficava escondida.
        <div className="w-full">
          {falha && (
            <p role="alert" className="mb-3 flex items-start gap-2 text-pretty text-sm text-[var(--ink-hi)]">
              <CircleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              <span>
                {oQueDizer(falha, !!editando)}
                {falha === 'sem-login' && (
                  <>
                    {' '}
                    <AcaoDeTexto ref={refEntrarDeNovo} sublinhada onClick={onSair}>
                      Entrar de novo
                    </AcaoDeTexto>
                  </>
                )}
              </span>
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onClose} disabled={salvando}>
              Cancelar
            </Button>
            <Button ref={refAgendar} type="submit" form="agendar-webinar" loading={salvando}>
              {editando ? 'Salvar mudanças' : 'Agendar webinar'}
            </Button>
          </div>
        </div>
      }
    >
      <form id="agendar-webinar" onSubmit={agendar} noValidate className="space-y-5">
        <div>
          <label htmlFor="webinar-titulo" className="block text-sm font-medium text-[var(--ink-hi)]">
            Título
          </label>
          <input
            ref={refTitulo}
            id="webinar-titulo"
            type="text"
            maxLength={120}
            autoComplete="off"
            value={titulo}
            onChange={(e) => {
              setTitulo(e.target.value);
              limparErro('titulo');
            }}
            aria-invalid={erros.titulo ? true : undefined}
            aria-describedby={erros.titulo ? 'webinar-titulo-erro' : undefined}
            className={`${CAMPO} h-11`}
          />
          {erros.titulo && <ErroDeCampo id="webinar-titulo-erro">{erros.titulo}</ErroDeCampo>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="webinar-data" className="block text-sm font-medium text-[var(--ink-hi)]">
              Data
            </label>
            <input
              ref={refData}
              id="webinar-data"
              type="date"
              // Na edição de uma live que já passou, a data dela continua válida no campo
              min={dataDoCampo(inicioOriginal && inicioOriginal.getTime() < Date.now() ? inicioOriginal : new Date())}
              value={data}
              onChange={(e) => {
                setData(e.target.value);
                limparErro('data');
              }}
              aria-invalid={erros.data ? true : undefined}
              aria-describedby={erros.data ? 'webinar-data-erro' : undefined}
              className={`${CAMPO} h-11`}
            />
            {erros.data && <ErroDeCampo id="webinar-data-erro">{erros.data}</ErroDeCampo>}
          </div>
          <div>
            <label htmlFor="webinar-hora" className="block text-sm font-medium text-[var(--ink-hi)]">
              Hora
            </label>
            <input
              ref={refHora}
              id="webinar-hora"
              type="time"
              value={hora}
              onChange={(e) => {
                setHora(e.target.value);
                limparErro('hora');
              }}
              aria-invalid={erros.hora ? true : undefined}
              aria-describedby={erros.hora ? 'webinar-hora-erro' : undefined}
              className={`${CAMPO} h-11`}
            />
            {erros.hora && <ErroDeCampo id="webinar-hora-erro">{erros.hora}</ErroDeCampo>}
          </div>
        </div>

        <fieldset aria-describedby="webinar-canais-dica">
          <legend className="text-sm font-medium text-[var(--ink-hi)]">Canais</legend>
          <p id="webinar-canais-dica" className="mt-2 text-xs text-[var(--ink-lo)]">
            Para onde a live vai.
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-x-3 sm:gap-x-4">
            {PLATAFORMAS_NOMEADAS.map((plataforma) => (
              <li key={plataforma}>
                <CaixaDeSelecao checked={plataformas.includes(plataforma)} onChange={() => alternar(plataforma)}>
                  {/* O ícone vai ao lado do nome, não numa coluna própria: a
                      palavra de estado ganha a largura toda e cabe numa linha
                      também no celular. */}
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm text-[var(--ink-hi)]">
                      <PlataformaIcone plataforma={plataforma} size={14} className="shrink-0 text-[var(--ink-lo)]" />
                      {nomeDaPlataforma(plataforma)}
                    </span>
                    <span className="block text-xs text-[var(--ink-lo)]">{estadoDaPlataforma(canais, plataforma)}</span>
                  </span>
                </CaixaDeSelecao>
              </li>
            ))}
          </ul>
        </fieldset>
      </form>
    </Modal>
  );
}
