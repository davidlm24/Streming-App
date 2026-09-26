import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CircleAlert } from 'lucide-react';
import type { Destination } from '../types';
import { PLATAFORMAS_NOMEADAS, estadoDoCanal, nomeDaPlataforma, pendenciaCurta } from '../lib/canais';
import { ErroAoSalvar, type FalhaAoSalvar } from '../lib/firestoreService';
import { horarioPorExtenso } from '../lib/horario';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { Button } from './ui/Button';
import { CaixaDeSelecao } from './ui/CaixaDeSelecao';
import { ErroDeCampo } from './ui/ErroDeCampo';
import { Modal } from './ui/Modal';
import { PlataformaIcone } from './ui/PlataformaIcone';

export interface NovoWebinar {
  id: string;
  title: string;
  desc: string;
  /** O horário por extenso, para quem lê só o texto (página pública, estúdio). */
  time: string;
  /** O horário em ISO 8601: dele vêm a ordem da lista, "Hoje/Amanhã" e a contagem regressiva. */
  startsAt: string;
  /** Nomes das plataformas ("YouTube"); `plataformaPeloNome` volta deles à plataforma. */
  channels: string[];
  type: 'webinar';
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
}

type Plataforma = (typeof PLATAFORMAS_NOMEADAS)[number];
type Erros = { titulo?: string; data?: string; hora?: string };

const CAMPO = 'mt-2 block w-full rounded-xl border px-3 text-sm';

const O_QUE_DIZER: Record<FalhaAoSalvar, string> = {
  'sem-login': 'Sua sessão expirou, então o webinar não foi agendado.',
  'sem-conexao': 'Sem conexão com a sua conta agora. Tente de novo mais tarde.',
  'sem-confirmacao': 'Não deu para confirmar que o webinar foi agendado. Confira a conexão e tente de novo.',
  recusado: 'Não foi possível agendar o webinar. Tente de novo.',
};

const doisDigitos = (n: number) => String(n).padStart(2, '0');
/** A data local no formato do campo nativo (aaaa-mm-dd). */
const dataDoCampo = (d: Date) => `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;

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
 */
export function CriarWebinarModal({ isOpen, onClose, canais, onAgendar, onSair }: CriarWebinarModalProps) {
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [descricao, setDescricao] = useState('');
  const [plataformas, setPlataformas] = useState<Plataforma[]>([]);
  const [erros, setErros] = useState<Erros>({});
  const [falha, setFalha] = useState<FalhaAoSalvar | null>(null);
  const [salvando, setSalvando] = useState(false);
  const tocouNosCanais = useRef(false);
  // O id nasce na primeira tentativa e se repete nas seguintes: uma escrita que
  // chegue atrasada é só repetida, não vira um segundo webinar.
  const idDoRascunho = useRef<string | null>(null);
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
    refTitulo.current?.focus();
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
    if (!titulo.trim()) novos.titulo = 'Falta o título. É o nome que aparece na lista e na página de inscrição.';
    if (!data) novos.data = 'Falta a data.';
    if (!hora) novos.hora = 'Falta a hora.';
    const inicio = data && hora ? new Date(`${data}T${hora}`) : null;
    if (inicio && !novos.data && !novos.hora && inicio.getTime() <= Date.now()) {
      novos.hora = 'Esse horário já passou. Escolha um a partir de agora.';
    }

    if (novos.titulo || novos.data || novos.hora) {
      setErros(novos);
      (novos.titulo ? refTitulo : novos.data ? refData : refHora).current?.focus();
      return;
    }

    idDoRascunho.current ??= `webinar-${Date.now()}`;
    setSalvando(true);
    try {
      await onAgendar({
        id: idDoRascunho.current,
        title: titulo.trim(),
        desc: descricao.trim(),
        time: horarioPorExtenso(inicio!),
        startsAt: inicio!.toISOString(),
        channels: PLATAFORMAS_NOMEADAS.filter((p) => plataformas.includes(p)).map(nomeDaPlataforma),
        type: 'webinar',
        videoName: '',
      });
      setTitulo('');
      setData('');
      setHora('');
      setDescricao('');
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
      title="Novo webinar"
      size="md"
      footer={
        // A falha fica no rodapé, logo acima dos botões e fora da área que
        // rola: no celular, no fim do formulário ela ficava escondida.
        <div className="w-full">
          {falha && (
            <p role="alert" className="mb-3 flex items-start gap-2 text-pretty text-sm text-[var(--ink-hi)]">
              <CircleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              <span>
                {O_QUE_DIZER[falha]}
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
              Agendar webinar
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
              min={dataDoCampo(new Date())}
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

        <div>
          <label htmlFor="webinar-descricao" className="block text-sm font-medium text-[var(--ink-hi)]">
            Descrição
          </label>
          <textarea
            id="webinar-descricao"
            rows={3}
            maxLength={1000}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            aria-describedby="webinar-descricao-dica"
            className={`${CAMPO} resize-none py-2.5`}
          />
          <p id="webinar-descricao-dica" className="mt-2 text-pretty text-xs text-[var(--ink-lo)]">
            Opcional. Aparece na página de inscrição.
          </p>
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
