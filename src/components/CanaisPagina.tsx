import { useRef } from 'react';
import { CircleAlert, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Destination } from '../types';
import { estadoDoCanal, nomeDaPlataforma, pendenciaDoCanal } from '../lib/canais';
import type { FalhaAoSalvar } from '../lib/dadosDaConta';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { Button } from './ui/Button';
import { useConfirm } from './ui/ConfirmDialog';
import { Menu, useFocoNaLista } from './ui/Menu';
import { CabecalhoDePagina, Pagina } from './ui/Pagina';
import { PlataformaIcone } from './ui/PlataformaIcone';
import { Switch } from './ui/Switch';

/** O que se pediu a um canal nesta página. */
export type MudancaNoCanal = 'ligar' | 'desligar' | 'remover';

/** Um canal gravando uma mudança, ou com a falha da última tentativa (Regra do Salvo de Verdade). */
export type SituacaoDoCanal =
  | { tipo: 'salvando'; mudanca: MudancaNoCanal }
  | { tipo: 'falhou'; mudanca: MudancaNoCanal; motivo: FalhaAoSalvar };

const FEITO: Record<MudancaNoCanal, string> = { ligar: 'ligado', desligar: 'desligado', remover: 'removido' };

/** O que a linha diz quando o banco não confirmou. A saída vem depois, numa ação de texto. */
function fraseDaFalha(nome: string, mudanca: MudancaNoCanal, motivo: FalhaAoSalvar): string {
  const feito = FEITO[mudanca];
  const frases: Record<FalhaAoSalvar, string> = {
    'sem-login': `Sua sessão expirou, então ${nome} não foi ${feito}.`,
    'sem-conexao': `Sem conexão com a sua conta agora, então ${nome} não foi ${feito}.`,
    'sem-confirmacao': `Não deu para confirmar se ${nome} foi ${feito}. Confira a conexão.`,
    recusado: `O banco recusou a mudança, então ${nome} não foi ${feito}.`,
  };
  return frases[motivo];
}

interface CanaisPaginaProps {
  canais: Destination[];
  /** Por canal: a mudança que está gravando, ou a falha da última tentativa. */
  situacaoDosCanais: Record<string, SituacaoDoCanal>;
  /** Sem argumento, conecta um canal novo; com a plataforma, abre direto nela. */
  onConectarCanal: (plataforma?: string) => void;
  /** Abre o modal neste canal — pelo id, que vale também para servidores RTMP. */
  onEditarCanal: (id: string) => void;
  onAlternarCanal: (id: string, ligar: boolean) => void;
  onRemoverCanal: (id: string) => void;
  /** Refaz a mudança que falhou, sem perguntar de novo. */
  onTentarDeNovo: (id: string) => void;
  /** Sai da conta e volta à entrada: a saída da sessão expirada. */
  onSair: () => void;
  /** Canais ligados ao mesmo tempo que o plano permite. */
  limiteDeLigados: number;
}

/**
 * Canais: para onde a live vai. Antes não havia lugar para isso — os
 * canais apareciam como contador no cabeçalho ("Adicionar canais 2") e
 * como lista dentro do estúdio, e não havia como remover um.
 *
 * Ligar, desligar e remover esperam o banco: a linha diz "Salvando…" ou
 * "Removendo…", e o canal só muda depois da confirmação. Na falha nada muda,
 * e uma linha de alerta sob o canal diz o motivo e a saída.
 */
export function CanaisPagina({
  canais,
  situacaoDosCanais,
  onConectarCanal,
  onEditarCanal,
  onAlternarCanal,
  onRemoverCanal,
  onTentarDeNovo,
  onSair,
  limiteDeLigados,
}: CanaisPaginaProps) {
  const confirmar = useConfirm();
  // O canal removido sai da lista só depois da confirmação do banco, com o
  // foco ainda no "⋯" dele: o foco vai ao "⋯" do vizinho, ou ao título
  const foco = useFocoNaLista();
  // "Tentar de novo" é um AcaoDeTexto na linha de falha, que some assim que a
  // mudança volta a gravar: sem isto o foco cairia no <body> junto com ela.
  // Vai ao interruptor (ligar/desligar, que fica na tela) ou ao "⋯" (remover,
  // onde useFocoNaLista pega o relevo se a remoção for confirmada).
  const linhasRef = useRef(new Map<string, HTMLLIElement | null>());
  const tentarDeNovoComFoco = (id: string, mudanca: MudancaNoCanal) => {
    const linha = linhasRef.current.get(id);
    const seletor = mudanca === 'remover' ? '[aria-haspopup="menu"]' : '[role="switch"]';
    linha?.querySelector<HTMLElement>(seletor)?.focus();
    onTentarDeNovo(id);
  };
  const ligados = canais.filter((c) => c.selected).length;
  // O limite dito antes de alguém esbarrar nele. Acima dele (plano que mudou,
  // dado antigo), diz quantos desligar — nada é desligado sem a pessoa.
  const sobreOLimite =
    ligados > limiteDeLigados
      ? `No seu plano, até ${limiteDeLigados} ao mesmo tempo, e ${ligados} estão ligados: desligue ${ligados - limiteDeLigados}.`
      : `No seu plano, até ${limiteDeLigados} ao mesmo tempo.`;

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
        refDoTitulo={foco.titulo}
        titulo="Canais"
        descricao={`Os canais ligados recebem a transmissão quando você entra no ar. ${sobreOLimite}`}
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
        <ul {...foco.lista} className="mt-12 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {canais.map((canal) => {
            const estado = estadoDoCanal(canal);
            const pendencia = pendenciaDoCanal(canal);
            const situacao = situacaoDosCanais[canal.id];
            const gravando = situacao?.tipo === 'salvando' ? situacao : null;
            // A falha sai quando o canal chega ao que se pediu: por outra aba, ou
            // pela gravação que chegou depois de a espera acabar
            const falha =
              situacao?.tipo === 'falhou' &&
              !(situacao.mudanca === 'ligar' && canal.selected) &&
              !(situacao.mudanca === 'desligar' && !canal.selected)
                ? situacao
                : null;
            return (
              <li key={canal.id} ref={(el) => { linhasRef.current.set(canal.id, el); }} className="py-4">
                <div className="flex items-center gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] text-[var(--ink)]">
                    <PlataformaIcone plataforma={canal.platform} size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--ink-hi)]">{canal.name}</p>
                    {/* Quebra como texto: no celular, "Falta o servidor e a chave"
                        desce inteira para a linha de baixo em vez de se espremer
                        em três ao lado do interruptor. */}
                    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[var(--ink-lo)]">
                      <span>{nomeDaPlataforma(canal.platform)} ·</span>
                      {gravando ? (
                        // Enquanto o banco não confirma, o estado de antes não vale mais
                        <span>{gravando.mudanca === 'remover' ? 'Removendo…' : 'Salvando…'}</span>
                      ) : estado === 'incompleto' ? (
                        // Pendência na tinta do nome, com ícone: não pode ler igual a "Desligado"
                        <span className="inline-flex items-start gap-1 text-[var(--ink-hi)]">
                          <CircleAlert size={12} aria-hidden="true" className="mt-0.5 shrink-0" />
                          {pendencia}
                        </span>
                      ) : (
                        <span>{estado === 'pronto' ? 'Pronto' : 'Desligado'}</span>
                      )}
                    </p>
                  </div>
                  <Switch
                    checked={canal.selected}
                    onChange={(ligar) => onAlternarCanal(canal.id, ligar)}
                    rotulo={`Transmitir para ${canal.name}`}
                    ocupado={Boolean(gravando)}
                  />
                  <Menu
                    rotulo={`Ações de ${canal.name}`}
                    itens={[
                      { rotulo: 'Editar servidor e chave', icone: <Pencil size={14} />, onSelect: () => onEditarCanal(canal.id) },
                      { rotulo: 'Remover canal', icone: <Trash2 size={14} />, perigo: true, onSelect: () => removerComConfirmacao(canal) },
                    ]}
                  />
                </div>
                {/* A falha ao salvar, na coluna do nome: o que não mudou, por quê, e a saída */}
                {falha && (
                  <p role="alert" className="mt-3 flex items-start gap-2 pl-14 text-pretty text-sm text-[var(--ink-hi)]">
                    <CircleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                    <span>
                      {fraseDaFalha(canal.name, falha.mudanca, falha.motivo)}{' '}
                      {falha.motivo === 'sem-login' ? (
                        <AcaoDeTexto sublinhada onClick={onSair}>
                          Entrar de novo
                        </AcaoDeTexto>
                      ) : (
                        <AcaoDeTexto sublinhada onClick={() => tentarDeNovoComFoco(canal.id, falha.mudanca)}>
                          Tentar de novo
                        </AcaoDeTexto>
                      )}
                    </span>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Pagina>
  );
}
