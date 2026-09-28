import { useState } from 'react';
import { ArrowRight, Check, Clock } from 'lucide-react';
import painelExemplo from '../assets/site/painel-exemplo.png';
import { ListaDePlanos, SeletorDePeriodo, type Periodo } from './ListaDePlanos';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { Button } from './ui/Button';

type Regiao = 'estudio' | 'canais' | 'webinars';

/**
 * Onde cada item de "Já funciona" está na captura, em % da imagem, com uma
 * folga em volta. Medido no próprio Painel, com os dados de exemplo e na
 * janela da captura (954 × 680 px CSS). Se a captura for refeita, meça de
 * novo: o texto embutido no PNG diz como ela foi feita.
 */
const REGIOES: Record<Regiao, { x: number; y: number; w: number; h: number }> = {
  estudio: { x: 11.43, y: 31.47, w: 28.51, h: 9.26 }, // o botão "Entrar no estúdio"
  canais: { x: 11.22, y: 48.82, w: 77.57, h: 14.12 }, // "Canais · 2 de 3 prontos" e os chips
  webinars: { x: 11.22, y: 70.74, w: 77.57, h: 28.38 }, // "Próximas lives"
};

const JA_FUNCIONA: { regiao: Regiao; titulo: string; texto: string }[] = [
  {
    regiao: 'estudio',
    titulo: 'Estúdio no navegador',
    texto: 'Câmera, tela, cenas, chroma key, banners e teleprompter, a um clique do Painel.',
  },
  {
    regiao: 'canais',
    titulo: 'Canais',
    texto: 'YouTube, Facebook, Instagram e outros, cada um dizendo o que falta para ficar pronto.',
  },
  {
    regiao: 'webinars',
    titulo: 'Webinars agendados',
    texto: 'Com data, hora e os canais de cada um.',
  },
];

const EM_BREVE: { titulo: string; texto: string }[] = [
  {
    titulo: 'Transmitir para os canais',
    texto: 'A live sai do estúdio para o YouTube, o Facebook e os outros canais ao mesmo tempo.',
  },
  { titulo: 'Link público de inscrição', texto: 'Uma página para cada webinar, para divulgar e receber inscrições.' },
  { titulo: 'OBS e vMix', texto: 'Transmitir a partir de um programa no seu computador.' },
  // A assinatura também é "em breve", mas quem diz isso é a seção Planos,
  // com a frase da Vitrine sem Balcão; repetida aqui, ela ainda deixava esta
  // coluna mais comprida que a do que já funciona.
];

const DESCRICAO_DA_CAPTURA =
  'O Painel do PwStreamer com dados de exemplo: a próxima live, Lançamento do curso de fotografia, no sábado, 14 de novembro, às 20:00, ' +
  'com o botão Entrar no estúdio; os canais, dois de três prontos, com o Instagram não conectado; e as próximas lives agendadas.';

/**
 * A captura do Painel, com o contorno que aponta o item de "Já funciona" sob
 * o mouse. É uma captura real, com dados de exemplo, e a legenda diz isso.
 */
function CapturaDoPainel({ regiao, visivel }: { regiao: Regiao; visivel: boolean }) {
  const r = REGIOES[regiao];
  return (
    <figure>
      {/* A captura é o Painel no tema escuro, em qualquer tema do site. O
          escopo console deixa a moldura e o contorno escuros e claros também
          quando o site está no tema claro. */}
      <div data-surface="console" className="relative overflow-hidden rounded-xl border border-[var(--line)]">
        <img
          src={painelExemplo}
          width={1280}
          height={912}
          alt={DESCRICAO_DA_CAPTURA}
          fetchPriority="high"
          decoding="async"
          className="block h-auto w-full"
        />
        {/* O contorno desliza de uma região para outra e escurece o resto da
            captura. Some no lugar em que estava, sem voltar a um canto. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute rounded-lg transition-[left,top,width,height,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            visivel ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            left: `${r.x}%`,
            top: `${r.y}%`,
            width: `${r.w}%`,
            height: `${r.h}%`,
            outline: '2px solid var(--ink-hi)',
            boxShadow: '0 0 0 100vmax rgb(0 0 0 / 0.55)',
          }}
        />
      </div>
      <figcaption className="mt-3 text-pretty text-xs text-[var(--ink-lo)]">
        O Painel de verdade, com dados de exemplo.
        {/* A pista só aparece onde há mouse: é o único jeito de acionar o contorno. */}
        <span className="hidden pointer-fine:inline"> Passe o mouse em “Já funciona”, abaixo, para ver cada parte nele.</span>
      </figcaption>
    </figure>
  );
}

interface InicioPublicoProps {
  onCriarConta: () => void;
  onEntrar: () => void;
}

/**
 * O início do site público: o que o PwStreamer é, o Painel de verdade, o que
 * já funciona e o que vem, os planos e o convite para criar a conta.
 *
 * Era um herói com "Transmita ao vivo para YouTube, Facebook e Twitch ao mesmo
 * tempo", que o produto ainda não faz, um espaço vazio escrito "Captura do
 * estúdio" e três preços em cartões. O acesso antecipado agora é dito com
 * todas as letras, e os planos são a mesma lista do app, sem checkout.
 */
export function InicioPublico({ onCriarConta, onEntrar }: InicioPublicoProps) {
  const [periodo, setPeriodo] = useState<Periodo>('mensal');
  const [regiao, setRegiao] = useState<Regiao>('estudio');
  const [contornoVisivel, setContornoVisivel] = useState(false);

  // Só o mouse aponta: no toque a captura fica acima da lista, fora da tela.
  const apontar = (alvo: Regiao | null) => {
    if (alvo) setRegiao(alvo);
    setContornoVisivel(alvo !== null);
  };

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <section
          aria-labelledby="inicio-titulo"
          className="grid gap-10 pt-12 sm:pt-16 lg:grid-cols-12 lg:items-center lg:gap-12"
        >
          <div className="lg:col-span-5">
            <h1
              id="inicio-titulo"
              tabIndex={-1}
              className="text-balance text-3xl font-semibold tracking-tight text-[var(--ink-hi)]"
            >
              Monte sua live sem instalar nada.
            </h1>
            <p className="mt-4 max-w-prose text-pretty text-base text-[var(--ink-lo)]">
              Câmera, tela, cenas, chroma key e banners num estúdio que abre no navegador, e um Painel com a próxima
              live e os seus canais.
            </p>
            <p className="mt-4 max-w-prose text-pretty text-sm text-[var(--ink)]">
              <span className="font-medium text-[var(--ink-hi)]">Acesso antecipado.</span> O estúdio, os canais e o
              agendamento de webinars já funcionam. Transmitir para os canais ainda não está no&nbsp;ar.
            </p>
            {/* Um botão só: "Entrar" é de quem já tem conta e fala na voz das
                ações de texto, sem disputar peso com a ação da tela. */}
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button size="lg" onClick={onCriarConta}>
                Criar conta <ArrowRight size={18} aria-hidden="true" />
              </Button>
              <p className="text-sm text-[var(--ink-lo)]">30&nbsp;dias grátis, sem cartão.</p>
            </div>
            <p className="mt-4 text-sm text-[var(--ink-lo)]">
              Já tem conta?{' '}
              <AcaoDeTexto sublinhada onClick={onEntrar} className="-my-3 min-h-11">
                Entrar
              </AcaoDeTexto>
            </p>
          </div>

          <div className="lg:col-span-7">
            <CapturaDoPainel regiao={regiao} visivel={contornoVisivel} />
          </div>
        </section>

        <section
          aria-label="O que já funciona e o que vem"
          className="mt-16 grid gap-x-12 border-t border-[var(--line)] pt-6 md:grid-cols-2"
        >
          <div>
            <h2 id="inicio-ja-funciona" className="text-base font-semibold text-[var(--ink-hi)]">
              Já funciona
            </h2>
            <ul aria-labelledby="inicio-ja-funciona" className="mt-2 divide-y divide-[var(--line)]">
              {JA_FUNCIONA.map((item) => (
                <li
                  key={item.regiao}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && apontar(item.regiao)}
                  onPointerLeave={(e) => e.pointerType === 'mouse' && apontar(null)}
                  className="group flex gap-3 py-4"
                >
                  <Check
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-[var(--ink-lo)] transition-colors duration-150 group-hover:text-[var(--ink-hi)]"
                  />
                  <div>
                    <h3 className="text-sm font-medium text-[var(--ink-hi)]">{item.titulo}</h3>
                    <p className="mt-1 text-pretty text-sm text-[var(--ink-lo)]">{item.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 border-t border-[var(--line)] pt-6 md:mt-0 md:border-t-0 md:pt-0">
            <h2 id="inicio-em-breve" className="text-base font-semibold text-[var(--ink-hi)]">
              Em breve
            </h2>
            <ul aria-labelledby="inicio-em-breve" className="mt-2 divide-y divide-[var(--line)]">
              {EM_BREVE.map((item) => (
                <li key={item.titulo} className="flex gap-3 py-4">
                  <Clock size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--ink-lo)]" />
                  <div>
                    <h3 className="text-sm font-medium text-[var(--ink-hi)]">{item.titulo}</h3>
                    <p className="mt-1 text-pretty text-sm text-[var(--ink-lo)]">{item.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="planos"
          aria-labelledby="inicio-planos"
          className="mt-16 scroll-mt-20 border-t border-[var(--line)] pt-6 lg:grid lg:grid-cols-12 lg:gap-12"
        >
          <div className="lg:col-span-4">
            <h2 id="inicio-planos" tabIndex={-1} className="text-base font-semibold text-[var(--ink-hi)]">
              Planos
            </h2>
            <p className="mt-2 max-w-prose text-pretty text-sm text-[var(--ink-lo)]">
              A assinatura abre em breve, por aqui mesmo. Hoje nenhuma cobrança é feita.
            </p>
            <div className="mt-4">
              <SeletorDePeriodo periodo={periodo} onChange={setPeriodo} />
            </div>
          </div>
          {/* No desktop a lista fica ao lado do título, logo abaixo da linha
              da seção: sem a própria linha de cima (seriam duas paralelas) e
              subida 16px, para o nome do primeiro plano ficar na altura do
              título. No celular ela vem abaixo do seletor e fica com a linha. */}
          <div className="mt-6 border-t border-[var(--line)] lg:col-span-8 lg:-mt-4 lg:border-t-0">
            <ListaDePlanos periodo={periodo} semLinhaInicial />
          </div>
        </section>

        <section
          aria-labelledby="inicio-fecho"
          className="mt-16 flex flex-col gap-6 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 id="inicio-fecho" className="text-base font-semibold text-[var(--ink-hi)]">
              Comece pelo teste grátis
            </h2>
            <p className="mt-1 text-pretty text-sm text-[var(--ink-lo)]">
              30&nbsp;dias com o estúdio, os canais e os webinars. Sem cartão.
            </p>
          </div>
          <Button size="lg" onClick={onCriarConta} className="shrink-0">
            Criar conta <ArrowRight size={18} aria-hidden="true" />
          </Button>
        </section>
      </div>
    </main>
  );
}
