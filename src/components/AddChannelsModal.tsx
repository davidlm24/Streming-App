import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight, CircleAlert, ExternalLink, Info, Lock, PenLine } from 'lucide-react';
import type { Destination } from '../types';
import { nomeDaPlataforma, pendenciaCurta } from '../lib/canais';
import { PLANS, getPlan, type PlanId } from '../lib/plans';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { PlataformaIcone } from './ui/PlataformaIcone';
import { useTabs } from './ui/Tabs';
import { useToast } from './ui/Toast';

interface AddChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinations: Destination[];
  onAddOrUpdateDestination: (destination: Destination) => void;
  currentPlan?: PlanId;
  onOpenUpgrade?: () => void;
  /** Abre direto no formulário desta plataforma (ex.: "não conectado" no painel). */
  plataformaInicial?: string;
  /** Abre para editar ESTE canal (menu de Canais, pendência de um canal no painel). */
  canalInicialId?: string;
}

interface Plataforma {
  id: string;
  /** O servidor que a plataforma dá a todo mundo; vazio no servidor próprio. */
  servidorPadrao: string;
  /** Onde achar a chave, pelo caminho da própria plataforma. */
  guia: string;
  painel?: { rotulo: string; url: string };
}

const PLATAFORMAS: Plataforma[] = [
  {
    id: 'youtube',
    servidorPadrao: 'rtmp://a.rtmp.youtube.com/live2',
    guia: 'No YouTube Studio, vá em Criar › Transmitir ao vivo e copie a chave de transmissão.',
    painel: { rotulo: 'Abrir o YouTube Studio', url: 'https://studio.youtube.com' },
  },
  {
    id: 'facebook',
    servidorPadrao: 'rtmps://live-api-s.facebook.com:443/rtmp/',
    guia: 'No Live Producer do Facebook, escolha usar a chave de transmissão e copie a chave.',
    painel: { rotulo: 'Abrir o Live Producer', url: 'https://facebook.com/live/producer' },
  },
  {
    id: 'instagram',
    servidorPadrao: 'rtmps://live-upload.instagram.com:443/rtmp/',
    guia: 'No computador, abra o Live Producer do Instagram em instagram.com e copie o servidor e a chave.',
    painel: { rotulo: 'Abrir o Instagram', url: 'https://www.instagram.com' },
  },
  {
    id: 'tiktok',
    servidorPadrao: 'rtmp://live.tiktok.com/live/',
    guia: 'No TikTok Live Studio ou no Live Producer do TikTok, gere e copie a chave de transmissão.',
    painel: { rotulo: 'Abrir o TikTok Live', url: 'https://www.tiktok.com/live' },
  },
  {
    id: 'twitch',
    servidorPadrao: 'rtmp://live.twitch.tv/app/',
    guia: 'No painel do criador da Twitch, vá em Configurações › Transmissão e copie a chave primária.',
    painel: { rotulo: 'Abrir o painel da Twitch', url: 'https://dashboard.twitch.tv/settings/stream' },
  },
  {
    id: 'kick',
    servidorPadrao: 'rtmps://live.kick.com/app/',
    guia: 'No painel do criador do Kick, copie a chave de transmissão (Stream Key).',
    painel: { rotulo: 'Abrir o painel do Kick', url: 'https://kick.com/dashboard/settings/stream' },
  },
  {
    id: 'linkedin',
    servidorPadrao: 'rtmps://live-api.linkedin.com:443/rtmp/',
    guia: 'No LinkedIn Live, escolha a transmissão personalizada (RTMP) e copie o servidor e a chave.',
    painel: { rotulo: 'Abrir o LinkedIn Live', url: 'https://linkedin.com/video/golive' },
  },
  {
    id: 'rumble',
    servidorPadrao: 'rtmps://live.rumble.com/live/',
    guia: 'No Rumble, vá em Go Live › configuração RTMP e copie a chave.',
    painel: { rotulo: 'Abrir o Rumble', url: 'https://rumble.com' },
  },
  {
    id: 'custom',
    servidorPadrao: '',
    guia: 'Use o endereço e a chave do seu servidor RTMP: NGINX, SRS, Owncast ou outro.',
  },
];

const IDS = PLATAFORMAS.map((p) => p.id);
const plataformaPor = (id: string) => PLATAFORMAS.find((p) => p.id === id) ?? PLATAFORMAS[PLATAFORMAS.length - 1];
/**
 * A linha da lista onde um canal mora. Toda plataforma fora dela é um
 * servidor RTMP (NGINX, SRS, Cloudflare, Restream, criados no estúdio) e cai
 * em "Servidor RTMP próprio" — antes caía na primeira plataforma livre, e
 * salvar ali criava um canal novo em vez de editar o que se pediu.
 */
const linhaDa = (plataforma: string) => (IDS.includes(plataforma) ? plataforma : 'custom');
/** O primeiro plano que libera servidor próprio, pelo nome da vitrine. */
const PLANO_DO_RTMP_PROPRIO = PLANS.find((p) => p.rtmpProprio)?.name ?? 'Standard';

const SERVIDOR_VALIDO = /^rtmps?:\/\/\S+$/i;
const CAMPO = 'mt-2 block w-full rounded-xl border px-3 text-sm';

type Rascunho = { nome: string; servidor: string; chave: string };
type Erros = { servidor?: string; chave?: string };
type Estado = { texto: string; icone?: ReactNode; alta?: boolean };

/**
 * Conectar ou editar UM canal: escolher a plataforma, colar o servidor e a
 * chave que ela mostra no painel de transmissão dela, salvar.
 *
 * Era uma grade de logos nas cores de cada marca, com selos "UPGRADE" e
 * "LIVE", um segundo diálogo por cima para o formulário, a lista inteira de
 * canais com "Ativar" (repetindo a página Canais e o estúdio) e uma tabela de
 * limites própria que contradizia os planos. Agora é mestre-detalhe: as
 * plataformas numa coluna, o formulário da escolhida ao lado, e o que foi
 * digitado numa plataforma sobrevive à troca para outra.
 */
export function AddChannelsModal({
  isOpen,
  onClose,
  destinations,
  onAddOrUpdateDestination,
  currentPlan = 'Free Trial',
  onOpenUpgrade,
  plataformaInicial,
  canalInicialId,
}: AddChannelsModalProps) {
  const toast = useToast();
  const plano = getPlan(currentPlan) ?? PLANS[0];
  const ligados = destinations.filter((d) => d.selected).length;
  const canalInicial = canalInicialId ? destinations.find((d) => d.id === canalInicialId) : undefined;

  // O canal de cada linha. Aberto para um canal certo, a linha dele é ele.
  const existenteDe = (id: string) =>
    canalInicial && linhaDa(canalInicial.platform) === id ? canalInicial : destinations.find((d) => linhaDa(d.platform) === id);

  // "Conectar canal" quer um canal novo: começa na primeira plataforma sem canal
  const escolhaInicial = () => {
    if (canalInicial) return linhaDa(canalInicial.platform);
    if (plataformaInicial) return linhaDa(plataformaInicial);
    return PLATAFORMAS.find((p) => !existenteDe(p.id))?.id ?? IDS[0];
  };
  const abertoNumCanal = Boolean(canalInicial || plataformaInicial);

  const [ativa, setAtiva] = useState(escolhaInicial);
  // Só no celular: a lista e o formulário não cabem lado a lado
  const [noFormulario, setNoFormulario] = useState(abertoNumCanal);
  const [rascunhos, setRascunhos] = useState<Record<string, Rascunho>>({});
  const [erros, setErros] = useState<Erros>({});
  const [chaveVisivel, setChaveVisivel] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const refServidor = useRef<HTMLTextAreaElement>(null);

  // O componente fica montado entre aberturas; cada abertura começa do zero.
  // Acertado durante a renderização, e não num efeito, para a abertura não
  // piscar com a plataforma da vez anterior.
  const [abertoAntes, setAbertoAntes] = useState(isOpen);
  if (isOpen !== abertoAntes) {
    setAbertoAntes(isOpen);
    if (isOpen) {
      setAtiva(escolhaInicial());
      setNoFormulario(abertoNumCanal);
      setRascunhos({});
      setErros({});
      setChaveVisivel(false);
      setAviso(null);
    }
  }

  const inicialDe = (id: string): Rascunho => {
    const canal = existenteDe(id);
    return {
      nome: canal?.name ?? nomeDaPlataforma(id),
      servidor: canal?.streamUrl?.trim() || plataformaPor(id).servidorPadrao,
      chave: canal?.streamKey ?? '',
    };
  };
  // Tem texto que ainda não foi salvo?
  const sujo = (id: string) => {
    const r = rascunhos[id];
    if (!r) return false;
    const i = inicialDe(id);
    return r.nome !== i.nome || r.servidor !== i.servidor || r.chave !== i.chave;
  };
  const bloqueadoEm = (id: string) => id === 'custom' && !plano.rtmpProprio && !existenteDe(id);

  const plataforma = plataformaPor(ativa);
  const nome = nomeDaPlataforma(ativa);
  const existente = existenteDe(ativa);
  const rascunho = rascunhos[ativa] ?? inicialDe(ativa);
  const bloqueado = bloqueadoEm(ativa);
  // Canal novo com o limite do plano já ocupado: salva, mas desligado
  const salvaDesligado = !existente && ligados >= plano.destinosSimultaneos;

  const noPadrao = Boolean(plataforma.servidorPadrao) && rascunho.servidor.trim() === plataforma.servidorPadrao;
  const dicaDoServidor = noPadrao
    ? existente && !existente.streamUrl?.trim()
      ? 'Preenchido com o servidor padrão da plataforma. Confira e salve.'
      : 'É o servidor padrão da plataforma.'
    : ativa === 'custom'
      ? 'O endereço RTMP do seu servidor, com o aplicativo no fim (rtmp://servidor/live).'
      : undefined;

  // O estado de cada linha fala da conexão, não de ligar e desligar (isso é
  // da página Canais): o que falta vem primeiro; "Desligado" só num canal
  // completo; e o que está sendo digitado aparece como "Não salvo".
  const estadoDa = (id: string): Estado => {
    if (sujo(id)) return { texto: 'Não salvo', icone: <PenLine size={12} />, alta: true };
    if (bloqueadoEm(id)) return { texto: `A partir do ${PLANO_DO_RTMP_PROPRIO}`, icone: <Lock size={12} /> };
    const canal = existenteDe(id);
    if (!canal) return { texto: 'Não conectado' };
    // A forma curta dos chips do painel: a longa ("Falta o servidor e a
    // chave") quebrava em duas linhas na coluna e desigualava a lista.
    const pendencia = pendenciaCurta(canal);
    if (pendencia) return { texto: pendencia[0].toUpperCase() + pendencia.slice(1), icone: <CircleAlert size={12} />, alta: true };
    return canal.selected ? { texto: 'Pronto', icone: <Check size={12} /> } : { texto: 'Desligado' };
  };

  const selecionar = (id: string) => {
    setAtiva(id);
    setErros({});
    setChaveVisivel(false);
    setAviso(null);
  };
  const abas = useTabs('canais', IDS, ativa, selecionar, 'vertical');

  const editar = (campo: keyof Rascunho, valor: string) => {
    setRascunhos((r) => ({ ...r, [ativa]: { ...(r[ativa] ?? rascunho), [campo]: valor } }));
    if (campo !== 'nome' && erros[campo]) setErros((e) => ({ ...e, [campo]: undefined }));
  };

  // O servidor é um campo de várias linhas que cresce com o endereço: no
  // celular o endereço inteiro cabe à vista, e a dica pede para conferi-lo.
  useLayoutEffect(() => {
    const el = refServidor.current;
    if (!el) return;
    const ajustar = () => {
      const borda = el.offsetHeight - el.clientHeight;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight + borda}px`;
    };
    ajustar();
    window.addEventListener('resize', ajustar);
    return () => window.removeEventListener('resize', ajustar);
  }, [rascunho.servidor, ativa, noFormulario, isOpen, bloqueado]);

  // Ao abrir num canal, o foco vai ao que só a pessoa pode preencher: faltando
  // só o servidor, ao servidor (preenchido com o padrão, para conferir);
  // faltando a chave, à chave. Sem canal escolhido, à plataforma, para as
  // setas percorrerem a lista.
  useEffect(() => {
    if (!isOpen) return;
    let alvo = `canais-aba-${ativa}`;
    if (abertoNumCanal && !bloqueado) {
      const semServidor = !existente?.streamUrl?.trim();
      const semChave = !existente?.streamKey?.trim();
      alvo = semServidor && (!plataforma.servidorPadrao || !semChave) ? 'canal-servidor' : 'canal-chave';
    }
    document.getElementById(alvo)?.focus();
    // Só na abertura: depois, o foco é de quem está digitando.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    const servidor = rascunho.servidor.trim();
    const chave = rascunho.chave.trim();
    const novos: Erros = {};
    if (!servidor) {
      novos.servidor = plataforma.servidorPadrao
        ? `Falta o servidor. O padrão da plataforma é ${plataforma.servidorPadrao}`
        : 'Falta o servidor. Use o endereço RTMP do seu servidor, como rtmp://servidor/live.';
    } else if (!SERVIDOR_VALIDO.test(servidor)) {
      novos.servidor = 'O endereço precisa começar com rtmp:// ou rtmps://.';
    }
    if (!chave) novos.chave = 'Falta a chave. Sem ela o canal não recebe a live.';
    if (novos.servidor || novos.chave) {
      setErros(novos);
      document.getElementById(novos.servidor ? 'canal-servidor' : 'canal-chave')?.focus();
      return;
    }

    // Editar não liga nem desliga; um canal novo liga se o plano comporta
    const ligar = existente ? existente.selected : !salvaDesligado;
    const nomeDoCanal = rascunho.nome.trim() || nome;
    onAddOrUpdateDestination({
      ...existente,
      id: existente?.id ?? `dest-${ativa}-${Date.now()}`,
      name: nomeDoCanal,
      // Um servidor NGINX continua NGINX ao ser editado pela linha RTMP
      platform: existente?.platform ?? ativa,
      avatarUrl: existente?.avatarUrl ?? '',
      selected: ligar,
      streamUrl: servidor,
      streamKey: chave,
      isCustom: existente?.isCustom ?? ativa === 'custom',
      updatedAt: new Date().toISOString(),
    });

    if (ligar) {
      toast.success(existente ? `${nomeDoCanal} salvo` : `${nomeDoCanal} conectado`, existente ? undefined : 'Ligado para a próxima live.');
    } else if (existente) {
      toast.info(`${nomeDoCanal} salvo`, 'Continua desligado. Ligue na página Canais quando quiser transmitir para ele.');
    } else {
      toast.info(
        `${nomeDoCanal} conectado, mas desligado`,
        `Seu plano transmite para ${plano.destinosSimultaneos} canais ao mesmo tempo. Desligue outro em Canais ou veja os planos.`,
      );
    }

    // Outras plataformas com texto não salvo: o diálogo fica, na próxima
    // delas, em vez de fechar e jogar fora o que foi digitado.
    const pendentes = IDS.filter((id) => id !== ativa && sujo(id));
    setRascunhos(({ [ativa]: _salvo, ...resto }) => resto);
    if (pendentes.length === 0) {
      onClose();
      return;
    }
    selecionar(pendentes[0]);
    setNoFormulario(true);
    setAviso(`${nomeDoCanal} salvo. Falta salvar: ${pendentes.map(nomeDaPlataforma).join(', ')}.`);
  };

  return (
    // Título neutro e fixo. Seguir a linha escolhida trocava "Conectar" por
    // "Editar" a cada seta e nomeava, na lista do celular, uma escolha que não
    // estava à vista. O verbo mora no botão, junto do formulário que ele salva.
    <Modal isOpen={isOpen} onClose={onClose} title="Canais" size="xl">
      <div className="md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
        <div
          {...abas.tablist}
          aria-label="Plataformas"
          className={`flex-col gap-0.5 md:flex md:border-r md:border-[var(--line)] md:pr-4 ${noFormulario ? 'hidden' : 'flex'}`}
        >
          {PLATAFORMAS.map((p) => {
            const estado = estadoDa(p.id);
            return (
              <button
                key={p.id}
                type="button"
                {...abas.tab(p.id)}
                onClick={() => {
                  selecionar(p.id);
                  setNoFormulario(true);
                }}
                className={`flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-150 cursor-pointer ${
                  ativa === p.id ? 'md:bg-[var(--raise)]' : 'hover:bg-[var(--panel)]'
                }`}
              >
                <PlataformaIcone plataforma={p.id} size={18} className="shrink-0 text-[var(--ink-lo)]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-[var(--ink-hi)]">{nomeDaPlataforma(p.id)}</span>
                  <span className={`mt-0.5 flex items-center gap-1 text-xs ${estado.alta ? 'text-[var(--ink-hi)]' : 'text-[var(--ink-lo)]'}`}>
                    {estado.icone && <span aria-hidden="true" className="inline-flex">{estado.icone}</span>}
                    {estado.texto}
                  </span>
                </span>
                <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-[var(--ink-lo)] md:hidden" />
              </button>
            );
          })}
        </div>

        {/* md:pt-2 põe o título na linha do nome da primeira plataforma */}
        <section {...abas.panel(ativa)} className={`md:block md:pl-6 md:pt-2 ${noFormulario ? 'block' : 'hidden'}`}>
          <div className="mb-4 md:hidden">
            <AcaoDeTexto onClick={() => setNoFormulario(false)} icone={<ChevronLeft size={14} />}>
              Plataformas
            </AcaoDeTexto>
          </div>

          {aviso && (
            <p role="status" className="mb-4 flex items-start gap-2 text-sm text-[var(--ink-hi)]">
              <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              <span>{aviso}</span>
            </p>
          )}

          <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--ink-hi)]">
            <PlataformaIcone plataforma={ativa} size={18} className="shrink-0 text-[var(--ink-lo)]" />
            {nome}
          </h3>

          {bloqueado ? (
            <div className="mt-2 max-w-prose">
              <p className="text-sm text-[var(--ink-lo)]">
                Transmitir para um servidor RTMP seu (NGINX, SRS, Owncast ou outro) está nos planos a partir do{' '}
                {PLANO_DO_RTMP_PROPRIO}. No seu plano, a live vai para as plataformas desta lista.
              </p>
              {onOpenUpgrade && (
                <Button className="mt-6" onClick={onOpenUpgrade}>
                  Ver planos
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="mt-2 max-w-prose text-sm text-[var(--ink-lo)]">
                {plataforma.guia}
                {plataforma.painel && (
                  <>
                    {' '}
                    <AcaoDeTexto href={plataforma.painel.url} sublinhada>
                      {plataforma.painel.rotulo}
                      <ExternalLink size={12} aria-hidden="true" />
                    </AcaoDeTexto>
                  </>
                )}
              </p>

              <form onSubmit={salvar} noValidate className="mt-6 space-y-5">
                <div>
                  <label htmlFor="canal-nome" className="block text-sm font-medium text-[var(--ink-hi)]">
                    Nome do canal
                  </label>
                  <input
                    id="canal-nome"
                    type="text"
                    autoComplete="off"
                    value={rascunho.nome}
                    onChange={(e) => editar('nome', e.target.value)}
                    placeholder={nome}
                    className={`${CAMPO} h-11`}
                  />
                </div>

                <div>
                  <label htmlFor="canal-servidor" className="block text-sm font-medium text-[var(--ink-hi)]">
                    Servidor
                  </label>
                  <textarea
                    id="canal-servidor"
                    ref={refServidor}
                    rows={1}
                    inputMode="url"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={rascunho.servidor}
                    // Um endereço não tem quebra de linha: colar com uma não a leva junto
                    onChange={(e) => editar('servidor', e.target.value.replace(/[\r\n]+/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }}
                    placeholder={plataforma.servidorPadrao || 'rtmp://servidor/live'}
                    aria-invalid={erros.servidor ? true : undefined}
                    aria-describedby={erros.servidor ? 'canal-servidor-erro' : dicaDoServidor ? 'canal-servidor-dica' : undefined}
                    className={`${CAMPO} resize-none overflow-hidden break-all py-[11px] leading-5`}
                  />
                  {erros.servidor ? (
                    <Erro id="canal-servidor-erro">{erros.servidor}</Erro>
                  ) : (
                    dicaDoServidor && (
                      <p id="canal-servidor-dica" className="mt-2 text-xs text-[var(--ink-lo)]">
                        {dicaDoServidor}
                      </p>
                    )
                  )}
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-4">
                    <label htmlFor="canal-chave" className="block text-sm font-medium text-[var(--ink-hi)]">
                      Chave de transmissão
                    </label>
                    <AcaoDeTexto tamanho="xs" onClick={() => setChaveVisivel((v) => !v)}>
                      {chaveVisivel ? 'Ocultar chave' : 'Mostrar chave'}
                    </AcaoDeTexto>
                  </div>
                  <input
                    id="canal-chave"
                    type={chaveVisivel ? 'text' : 'password'}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={rascunho.chave}
                    onChange={(e) => editar('chave', e.target.value)}
                    placeholder="Cole aqui a chave de transmissão"
                    aria-invalid={erros.chave ? true : undefined}
                    aria-describedby={erros.chave ? 'canal-chave-erro' : undefined}
                    className={`${CAMPO} h-11`}
                  />
                  {erros.chave && <Erro id="canal-chave-erro">{erros.chave}</Erro>}
                </div>

                {salvaDesligado && (
                  <p className="flex items-start gap-2 text-sm text-[var(--ink-lo)]">
                    <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                    <span>
                      Seu plano transmite para {plano.destinosSimultaneos} canais ao mesmo tempo, e {ligados} já estão ligados.
                      Este canal será salvo desligado.
                      {onOpenUpgrade && (
                        <>
                          {' '}
                          <AcaoDeTexto sublinhada onClick={onOpenUpgrade}>
                            Ver planos
                          </AcaoDeTexto>
                        </>
                      )}
                    </span>
                  </p>
                )}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <Button variant="ghost" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit">{existente ? 'Salvar alterações' : 'Conectar canal'}</Button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </Modal>
  );
}

/** Erro de campo: ícone e frase na tinta alta, e a borda do campo sobe junto (index.css). */
function Erro({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-xs text-[var(--ink-hi)]">
      <CircleAlert size={14} aria-hidden="true" className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}
