import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { subscribeUserProfiles, type PerfilDeCliente } from '../lib/dadosDaConta';
import { getPlan, type PlanId } from '../lib/plans';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { CabecalhoDePagina, Pagina, SecaoDePagina } from './ui/Pagina';

interface SuperAdminPanelProps {
  onBack: () => void;
  /** Sai da conta e volta à entrada: a saída de uma sessão expirada. */
  onSair: () => void;
  user: { email: string; name: string; plan: string; role?: string } | null;
}

/** Sem acento e sem caixa: "joão" acha "Joao". */
const semAcento = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/**
 * O teste em palavras, derivado de `trialEndsAt` na hora de mostrar ("teste
 * até 29 de outubro", "teste encerrado em 14 de outubro"). O documento também
 * guarda `isExpired` e `subscriptionStatus`, mas nada os atualiza quando o
 * teste vence, e o servidor grava o papel e a situação por conta própria: a
 * data é a única coisa que diz a verdade.
 */
function situacaoDoTeste(plano: string, fimDoTeste?: string, agora = new Date()): string | null {
  if (plano !== 'Free Trial' || !fimDoTeste) return null;
  const fim = new Date(fimDoTeste);
  if (Number.isNaN(fim.getTime())) return null;
  const dia = fim.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    ...(fim.getFullYear() !== agora.getFullYear() ? { year: 'numeric' as const } : {}),
  });
  return fim.getTime() > agora.getTime() ? `teste até ${dia}` : `teste encerrado em ${dia}`;
}

type EstadoDaLista = 'carregando' | 'ok' | 'sem-conexao' | 'sem-login' | 'recusado';

/**
 * A administração da plataforma: a lista de clientes, só leitura.
 *
 * Era um "Painel de Controle Mestre" de sete abas, e quase nada nele era de
 * verdade: uso, gravações e tráfego de clientes inventados; um monitor de
 * servidor com CPU e bitrate sorteados; "100% Online · MediaMTX / Nginx RTMP"
 * sem ingestão nenhuma; um disparador de webhooks com histórico de exemplo e
 * receptor simulado; chaves RTMP em texto claro, criadas e revogadas pelo
 * navegador; e uma auditoria gravada pelo próprio navegador, com registros de
 * coisas que não tinham acontecido. As chaves de transmissão e a auditoria
 * voltam quando houver ingestão, feitas pelo servidor.
 */
export function SuperAdminPanel({ onBack, onSair, user }: SuperAdminPanelProps) {
  // O papel abre a tela; quem decide o que a conta lê são as regras do banco
  const podeVer = user?.role === 'super-admin';
  const [clientes, setClientes] = useState<PerfilDeCliente[]>([]);
  const [estado, setEstado] = useState<EstadoDaLista>('carregando');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (!podeVer) return;
    return subscribeUserProfiles(
      (perfis, doCache) => {
        setClientes(perfis);
        // Vazia e só do cache, a lista não prova que não há clientes
        setEstado(doCache && perfis.length === 0 ? 'sem-conexao' : 'ok');
      },
      (motivo) => setEstado(motivo),
    );
  }, [podeVer]);

  // Sem o papel de admin, a administração não existe para a pessoa: sem
  // formulário e sem senha. Era uma tela de "senha master" com as senhas no
  // próprio código, e um e-mail que destravava sem senha nenhuma.
  if (!podeVer) {
    return (
      <Pagina>
        <CabecalhoDePagina titulo="Acesso restrito" descricao="Esta área é só para a administração da plataforma." />
        <AcaoDeTexto onClick={onBack}>Voltar ao painel</AcaoDeTexto>
      </Pagina>
    );
  }

  const termo = semAcento(busca.trim());
  const encontrados = termo
    ? clientes.filter((c) => semAcento(c.name).includes(termo) || semAcento(c.email).includes(termo))
    : clientes;

  const frase = (() => {
    if (estado === 'carregando') return 'Carregando os clientes…';
    if (estado === 'sem-login') return 'Sua sessão expirou, então a lista de clientes não abriu.';
    if (estado === 'recusado') return 'O banco recusou a lista de clientes. Confira se este e-mail está na lista de administradores do servidor.';
    if (estado === 'sem-conexao') return 'Sem conexão com o banco agora. A lista aparece quando ele voltar.';
    if (clientes.length === 0) return 'Nenhum cliente cadastrado ainda.';
    if (encontrados.length === 0) return 'Nenhum cliente com esse nome ou e-mail.';
    return null;
  })();

  return (
    <Pagina>
      <CabecalhoDePagina
        titulo="Administração"
        descricao="Os clientes cadastrados na plataforma, só para leitura. A mudança de plano, as chaves de transmissão e o registro de auditoria voltam quando houver ingestão, feitos pelo servidor."
      />

      <SecaoDePagina
        id="admin-clientes"
        titulo="Clientes"
        contagem={estado === 'ok' && clientes.length > 0 && `${clientes.length} ${clientes.length === 1 ? 'cadastrado' : 'cadastrados'}`}
        acao={
          // A busca só existe com a lista aberta: sobre uma frase de falha, ela ficava pendurada
          estado === 'ok' &&
          clientes.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-lo)]" />
              <input
                type="search"
                aria-label="Buscar cliente por nome ou e-mail"
                placeholder="Nome ou e-mail"
                autoComplete="off"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--line-ctl)] bg-[var(--well)] pl-9 pr-3 text-sm text-[var(--ink-hi)] placeholder:text-[var(--ink-dim)]"
              />
            </div>
          )
        }
      >
        {/* O resultado da busca é anunciado por uma região que fica montada: a
            frase visível troca de lugar com a lista e não seria lida */}
        <p className="sr-only" aria-live="polite">
          {termo && estado === 'ok' ? (encontrados.length === 0 ? 'Nenhum cliente com esse nome ou e-mail.' : encontrados.length === 1 ? '1 encontrado' : `${encontrados.length} encontrados`) : ''}
        </p>
        {frase ? (
          <p className="mt-4 max-w-prose text-pretty text-sm text-[var(--ink-lo)]" role={estado === 'ok' ? undefined : 'status'}>
            {frase}
            {estado === 'sem-login' && (
              <>
                {' '}
                <AcaoDeTexto sublinhada onClick={onSair}>
                  Entrar de novo
                </AcaoDeTexto>
              </>
            )}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {encontrados.map((cliente) => {
              const teste = situacaoDoTeste(cliente.plan, cliente.trialEndsAt);
              return (
                <li key={cliente.uid} className="flex items-start justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--ink-hi)]">{cliente.name || cliente.email}</p>
                    {cliente.name && <p className="mt-1 truncate text-xs text-[var(--ink-lo)]">{cliente.email}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm text-[var(--ink)]">{getPlan(cliente.plan as PlanId)?.name ?? cliente.plan}</p>
                    {teste && <p className="mt-1 text-xs text-[var(--ink-lo)]">{teste}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SecaoDePagina>
    </Pagina>
  );
}
