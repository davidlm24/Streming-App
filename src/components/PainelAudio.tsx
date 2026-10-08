import type { AjustesDaCaptura, LeituraDaCaptura } from '../lib/captura';
import { SecaoDoPainel } from './PecasDoPainel';
import { Switch } from './ui/Switch';

type Processamento = 'reducaoDeRuido' | 'cancelamentoDeEco' | 'ganhoAutomatico';

const PROCESSAMENTOS: { chave: Processamento; titulo: string; dica: string }[] = [
  { chave: 'reducaoDeRuido', titulo: 'Redução de ruído', dica: 'Tira o ruído constante do fundo, como ventilador e ar-condicionado.' },
  { chave: 'cancelamentoDeEco', titulo: 'Cancelamento de eco', dica: 'Corta o som das caixas que volta pelo microfone. Com fone, pode desligar.' },
  {
    chave: 'ganhoAutomatico',
    titulo: 'Ganho automático',
    dica: 'Sobe a voz baixa e segura a alta. Desligado, o volume é o do microfone e do sistema.',
  },
];

/**
 * O som do microfone: qual aparelho capta e o que o navegador faz com ele.
 * Cada interruptor pede um processamento; o painel lê a trilha depois e diz
 * quando o microfone não aceitou, em vez de mostrar o pedido como feito.
 *
 * O aparelho se escolhe na bandeja, ao lado do microfone, como antes. O som
 * ainda não sai do estúdio, e o painel diz isso: os ajustes já valem no
 * medidor da bandeja.
 */
export function PainelAudio({
  captura,
  onCaptura,
  microfone,
  aplicando,
}: {
  captura: AjustesDaCaptura;
  onCaptura: (proxima: AjustesDaCaptura) => void;
  microfone: LeituraDaCaptura['microfone'];
  /** Um pedido ainda em andamento: os interruptores esperam a trilha nova. */
  aplicando: boolean;
}) {
  return (
    <div className="pb-6">
      <SecaoDoPainel
        titulo="Microfone"
        dica={
          microfone
            ? `${microfone.nome || 'Microfone sem nome'}. Para trocar, use o menu ao lado do microfone, na bandeja.`
            : 'O navegador não liberou o microfone. Permita o acesso nas configurações do site e entre de novo no estúdio.'
        }
      >
        <p className="text-pretty text-xs text-[var(--ink-lo)]">
          O som ainda não vai para os canais, porque a transmissão não existe. Estes ajustes já valem no medidor da bandeja.
        </p>
      </SecaoDoPainel>

      {PROCESSAMENTOS.map(({ chave, titulo, dica }) => {
        const lido = microfone?.[chave];
        // O microfone respondeu outra coisa: o pedido não foi aceito
        const recusado = !aplicando && lido !== undefined && lido !== captura[chave];
        return (
          <SecaoDoPainel
            key={chave}
            titulo={titulo}
            acao={
              <Switch
                rotulo={titulo}
                checked={captura[chave]}
                disabled={!microfone}
                ocupado={aplicando}
                onChange={(ligado) => onCaptura({ ...captura, [chave]: ligado })}
              />
            }
            estado={
              recusado ? (
                <p className="mt-0.5 text-xs text-[var(--ink-hi)]">
                  Este microfone não aceitou a mudança.
                </p>
              ) : undefined
            }
            dica={dica}
          />
        );
      })}
    </div>
  );
}
