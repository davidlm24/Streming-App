import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { ExternalLink, Pause, Play, RotateCcw } from 'lucide-react';
import { FRASE_DA_FALHA, FRASE_DA_FALHA_AO_LER, type Roteiro } from '../lib/useRoteiro';
import { Deslizante, EscolhaDoPainel, FalhaNoPainel, SecaoDoPainel } from './PecasDoPainel';
import { LeitorDoRoteiro, TAMANHO_NO_PAINEL, type EstadoDoTeleprompter, type TamanhoDoTexto } from './Teleprompter';
import { BotaoDeIcone } from './ui/BotaoDeIcone';
import { Button } from './ui/Button';
import { Segmentado } from './ui/Segmentado';
import { Switch } from './ui/Switch';

const horaDe = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/** O campo de várias linhas do sistema. */
function AreaDeTexto({
  rotulo,
  valor,
  onChange,
  linhas,
  desativada,
  placeholder,
}: {
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  linhas: number;
  desativada?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="sr-only">{rotulo}</span>
      <textarea
        rows={linhas}
        value={valor}
        disabled={desativada}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-xl border border-[var(--line-ctl)] bg-[var(--well)] px-3 py-2 text-sm leading-relaxed text-[var(--ink-hi)] placeholder:text-[var(--ink-dim)] disabled:opacity-60"
      />
    </label>
  );
}

/**
 * O roteiro: o teleprompter, o texto que ele lê e as notas, que ele não lê.
 * O roteiro fica salvo na conta, um por webinar. O leitor fica no painel ou
 * numa janela própria, que se arrasta para perto da câmera; nunca sobre o
 * preview, que mostra o que vai ao ar.
 *
 * Antes o roteiro abria com um texto de boas-vindas pronto, trazia cinco
 * modelos de texto de venda que trocavam o roteiro sem perguntar e não era
 * salvo. As notas moravam no QR code e diziam "salvas localmente" sem salvar.
 */
export function PainelRoteiro({
  roteiro,
  deQue,
  teleprompter,
  onTeleprompter,
  progresso,
  onAbrirJanela,
  onFecharJanela,
}: {
  roteiro: Roteiro;
  /** "do webinar Aula aberta" ou "geral". */
  deQue: string;
  teleprompter: EstadoDoTeleprompter;
  onTeleprompter: Dispatch<SetStateAction<EstadoDoTeleprompter>>;
  progresso: MutableRefObject<number>;
  /** Pedida no próprio clique: o navegador só abre janelas dentro do gesto de quem clica. */
  onAbrirJanela: () => void;
  onFecharJanela: () => void;
}) {
  const mudar = (parcial: Partial<EstadoDoTeleprompter>) => onTeleprompter((atual) => ({ ...atual, ...parcial }));
  const { situacao } = roteiro;
  const carregando = situacao.tipo === 'carregando';

  const linhaDaSituacao = (() => {
    switch (situacao.tipo) {
      case 'carregando':
        return <p className="text-xs text-[var(--ink-lo)]">Abrindo o roteiro salvo…</p>;
      case 'salvando':
        return <p className="text-xs text-[var(--ink-lo)]">Salvando…</p>;
      case 'alterado':
        return <p className="text-xs text-[var(--ink-lo)]">Alterado</p>;
      case 'salvo':
        return <p className="text-xs text-[var(--ink-lo)]">{situacao.em ? `Salvo na sua conta às ${horaDe(situacao.em)}` : 'Ainda não há roteiro salvo.'}</p>;
      case 'falhou':
        return (
          <FalhaNoPainel
            frase={(situacao.aoLer ? FRASE_DA_FALHA_AO_LER : FRASE_DA_FALHA)[situacao.motivo]}
            onTentarDeNovo={roteiro.tentarDeNovo}
          />
        );
    }
  })();

  return (
    <div className="pb-6">
      <SecaoDoPainel
        titulo="Teleprompter"
        dica={teleprompter.janela ? 'Lendo na janela. Arraste a janela para perto da câmera.' : 'Espaço toca e pausa; as setas mudam a velocidade.'}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={teleprompter.tocando ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            onClick={() => mudar({ tocando: !teleprompter.tocando })}
            disabled={!roteiro.texto.trim()}
          >
            {teleprompter.tocando ? 'Pausar' : 'Tocar'}
          </Button>
          <BotaoDeIcone
            rotulo="Voltar ao começo"
            onClick={() => {
              progresso.current = 0;
              onTeleprompter((atual) => ({ ...atual, tocando: false, reinicio: atual.reinicio + 1 }));
            }}
          >
            <RotateCcw size={16} aria-hidden="true" />
          </BotaoDeIcone>
          <Button
            variant="ghost"
            size="sm"
            icon={<ExternalLink size={14} aria-hidden="true" />}
            onClick={() => (teleprompter.janela ? onFecharJanela() : onAbrirJanela())}
            className="ml-auto"
          >
            {teleprompter.janela ? 'Fechar a janela' : 'Abrir em janela'}
          </Button>
        </div>

        {!teleprompter.janela && (
          <LeitorDoRoteiro
            texto={roteiro.texto}
            estado={teleprompter}
            tamanhoPx={TAMANHO_NO_PAINEL[teleprompter.tamanho]}
            progresso={progresso}
            onTocar={(tocando) => mudar({ tocando })}
            onVelocidade={(velocidade) => mudar({ velocidade })}
            className="h-48 rounded-xl border border-[var(--line)] bg-[var(--bg)]"
          />
        )}

        <Deslizante
          rotulo="Velocidade"
          valor={teleprompter.velocidade}
          min={1}
          max={10}
          medida={String(teleprompter.velocidade)}
          onChange={(velocidade) => mudar({ velocidade })}
        />
        <EscolhaDoPainel rotulo="Tamanho do texto">
          <Segmentado<TamanhoDoTexto>
            rotulo="Tamanho do texto"
            largura="cheia"
            opcoes={[
              { valor: 'p', rotulo: 'P' },
              { valor: 'm', rotulo: 'M' },
              { valor: 'g', rotulo: 'G' },
              { valor: 'gg', rotulo: 'GG' },
            ]}
            valor={teleprompter.tamanho}
            onChange={(tamanho) => mudar({ tamanho })}
          />
        </EscolhaDoPainel>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-[var(--ink)]">Espelhar na janela</p>
            <p className="mt-0.5 text-pretty text-xs text-[var(--ink-lo)]">Para ler pelo vidro de um teleprompter.</p>
          </div>
          <Switch rotulo="Espelhar o texto na janela" checked={teleprompter.espelhar} onChange={(espelhar) => mudar({ espelhar })} />
        </div>
      </SecaoDoPainel>

      <SecaoDoPainel titulo={`Roteiro ${deQue}`} dica={linhaDaSituacao}>
        <AreaDeTexto
          rotulo="Roteiro"
          linhas={10}
          valor={roteiro.texto}
          onChange={roteiro.setTexto}
          desativada={carregando}
          placeholder="O que o teleprompter vai mostrar."
        />
      </SecaoDoPainel>

      <SecaoDoPainel titulo="Notas" dica="Só para você. O teleprompter não lê; ficam salvas junto do roteiro.">
        <AreaDeTexto rotulo="Notas" linhas={5} valor={roteiro.notas} onChange={roteiro.setNotas} desativada={carregando} />
      </SecaoDoPainel>
    </div>
  );
}
