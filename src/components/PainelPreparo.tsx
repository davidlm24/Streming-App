import type { ReactNode } from 'react';
import { Check, CircleAlert, Minus } from 'lucide-react';
import { fraseDaCamera, type LeituraDaCaptura } from '../lib/captura';
import { AcaoDeTexto } from './ui/AcaoDeTexto';

/** Pronto, pede atenção ou opcional — por ícone e palavra, nunca só por cor. */
type Situacao = 'ok' | 'atencao' | 'opcional';

const ICONES: Record<Situacao, ReactNode> = {
  ok: <Check size={16} aria-hidden="true" />,
  atencao: <CircleAlert size={16} aria-hidden="true" />,
  opcional: <Minus size={16} aria-hidden="true" />,
};

function Item({
  titulo,
  situacao,
  frase,
  acao,
}: {
  titulo: string;
  situacao: Situacao;
  frase: string;
  acao?: { rotulo: string; onClick: () => void };
}) {
  const alta = situacao === 'ok' || situacao === 'atencao';
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className={`mt-0.5 shrink-0 ${alta ? 'text-[var(--ink-hi)]' : 'text-[var(--ink-lo)]'}`}>{ICONES[situacao]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--ink-hi)]">{titulo}</p>
        <p className={`mt-0.5 text-pretty text-xs ${situacao === 'atencao' ? 'text-[var(--ink-hi)]' : 'text-[var(--ink-lo)]'}`}>{frase}</p>
      </div>
      {acao && (
        <AcaoDeTexto tamanho="xs" onClick={acao.onClick} className="min-h-8 shrink-0">
          {acao.rotulo}
        </AcaoDeTexto>
      )}
    </li>
  );
}

/**
 * Preparar: o que o estúdio tem agora e o que falta, com o conserto ao lado.
 * É a primeira ferramenta aberta ao entrar. Antes era o Chat, que no ensaio
 * está sempre vazio e era a primeira coisa que o operador via, enquanto a
 * câmera não liberada só aparecia dentro de Câmera, entre ajustes apagados.
 *
 * No fim, o que Programa, Preview e Corte querem dizer: os monitores assumem
 * que quem opera já conhece a mesa.
 */
export function PainelPreparo({
  camera,
  cameraDesligada,
  onLigarCamera,
  microfone,
  mudo,
  onLigarMicrofone,
  compartilhando,
  podeCompartilhar,
  onCompartilhar,
  canaisLigados,
  canaisProntos,
  impedimento,
  noAr,
  onCanais,
  onAbrir,
}: {
  camera: LeituraDaCaptura['camera'];
  cameraDesligada: boolean;
  onLigarCamera: () => void;
  microfone: LeituraDaCaptura['microfone'];
  mudo: boolean;
  onLigarMicrofone: () => void;
  compartilhando: boolean;
  podeCompartilhar: boolean;
  onCompartilhar: () => void;
  canaisLigados: number;
  canaisProntos: number;
  /** Por que "Entrar ao vivo" não age agora (o mesmo texto da barra), ou null. */
  impedimento: string | null;
  /** Há uma transmissão em curso. */
  noAr: boolean;
  onCanais: () => void;
  /** Abre a ferramenta dos ajustes finos (Câmera ou Áudio). */
  onAbrir: (ferramenta: 'camera' | 'audio') => void;
}) {
  const semPermissao = 'O navegador não liberou. Permita no cadeado da barra de endereço e entre de novo no estúdio.';
  const faltamCanais = canaisLigados - canaisProntos;

  return (
    <div className="pb-6">
      <section aria-labelledby="preparo-lista" className="pt-4">
        <h3 id="preparo-lista" className="px-4 text-sm font-medium text-[var(--ink-hi)]">
          Antes de começar
        </h3>
        <ul className="mt-1 divide-y divide-[var(--line)]">
          <Item
            titulo="Câmera"
            {...(!camera
              ? { situacao: 'atencao' as const, frase: semPermissao }
              : cameraDesligada
                ? { situacao: 'atencao' as const, frase: 'Desligada: o programa mostra o seu nome no lugar da imagem.', acao: { rotulo: 'Ligar', onClick: onLigarCamera } }
                : {
                    situacao: 'ok' as const,
                    frase: [camera.nome || 'Câmera sem nome', fraseDaCamera(camera)].filter(Boolean).join(' · '),
                    acao: { rotulo: 'Ajustar', onClick: () => onAbrir('camera') },
                  })}
          />
          <Item
            titulo="Microfone"
            {...(!microfone
              ? { situacao: 'atencao' as const, frase: semPermissao }
              : mudo
                ? { situacao: 'atencao' as const, frase: 'Mudo: nada do seu som entra no programa.', acao: { rotulo: 'Ligar', onClick: onLigarMicrofone } }
                : { situacao: 'ok' as const, frase: microfone.nome || 'Microfone sem nome', acao: { rotulo: 'Ajustar', onClick: () => onAbrir('audio') } })}
          />
          <Item
            titulo="Tela"
            {...(compartilhando
              ? { situacao: 'ok' as const, frase: 'Compartilhada. As cenas com tela já têm o que mostrar.' }
              : {
                  situacao: 'opcional' as const,
                  frase: 'Só as cenas com tela precisam dela.',
                  acao: podeCompartilhar ? { rotulo: 'Compartilhar', onClick: onCompartilhar } : undefined,
                })}
          />
          <Item
            titulo="Canais"
            {...(canaisLigados === 0
              ? { situacao: 'atencao' as const, frase: 'Nenhum canal ligado.', acao: { rotulo: 'Ver canais', onClick: onCanais } }
              : faltamCanais > 0
                ? {
                    situacao: 'atencao' as const,
                    frase: `${canaisProntos} de ${canaisLigados} prontos. Falta o servidor ou a chave de ${faltamCanais === 1 ? 'um deles' : faltamCanais}.`,
                    acao: { rotulo: 'Consertar', onClick: onCanais },
                  }
                : {
                    situacao: 'ok' as const,
                    frase: `${canaisLigados === 1 ? 'O canal ligado está pronto' : `Os ${canaisLigados} canais ligados estão prontos`}.`,
                    acao: { rotulo: 'Ver', onClick: onCanais },
                  })}
          />
          <Item
            titulo="Transmissão"
            {...(noAr
              ? { situacao: 'ok' as const, frase: 'No ar. "Encerrar transmissão", no alto, tira o programa dos canais.' }
              : impedimento
                ? { situacao: 'atencao' as const, frase: `${impedimento} Até lá, o estúdio ensaia e grava neste computador.` }
                : { situacao: 'ok' as const, frase: 'Pronta. "Entrar ao vivo", no alto, leva o programa aos canais prontos.' })}
          />
        </ul>
      </section>

      <section aria-labelledby="preparo-mesa" className="mt-2 border-t border-[var(--line)] px-4 pt-4">
        <h3 id="preparo-mesa" className="text-sm font-medium text-[var(--ink-hi)]">
          Como a mesa funciona
        </h3>
        <dl className="mt-2 space-y-2 text-pretty text-xs text-[var(--ink-lo)]">
          <div>
            <dt className="inline font-medium text-[var(--ink-hi)]">Programa</dt>
            <dd className="inline"> é a saída: o que vai aos canais e o que a gravação registra.</dd>
          </div>
          <div>
            <dt className="inline font-medium text-[var(--ink-hi)]">Preview</dt>
            <dd className="inline"> é a próxima saída. Cenas e gráficos que você escolhe entram aqui primeiro.</dd>
          </div>
          <div>
            <dt className="inline font-medium text-[var(--ink-hi)]">Corte</dt>
            <dd className="inline"> leva o preview ao programa na hora; Fusão faz a troca dissolvendo.</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
