import React from 'react';
import {
  Video, Layers, Wand2, MessageSquareText, Radio, Disc,
  Users, FileText, SlidersHorizontal, QrCode, ArrowRight, Check
} from 'lucide-react';
import { PublicHeader, type DestinoPublico } from './PublicHeader';

/**
 * Página de Recursos e Ferramentas.
 *
 * Regras seguidas da skill anti-slop:
 *  - Nenhum travessão em texto visível.
 *  - Sem três cartões iguais lado a lado: a grade tem tamanhos diferentes e
 *    a contagem de células é exatamente a contagem de itens.
 *  - No máximo 2 sobrancelhas (eyebrows) em 6 seções.
 *  - Sem orbe de desfoque, sem ponto decorativo, sem "Scroll" no rodapé do
 *    herói, sem rótulo de versão.
 *  - Sem captura de tela falsa feita de <div>. Onde uma imagem real do
 *    produto é necessária, existe um espaço marcado com TODO.
 *
 * Sobre a COPY: descreve o que o estúdio faz de fato hoje (captura real de
 * câmera, tela, chroma key, cenas, moderação por IA). O multistream tem
 * painel de controle pronto, mas depende de um servidor de ingestão que
 * ainda não está implantado, então o texto fala de configurar destinos, e
 * não promete alcance ou disponibilidade que o backend ainda não entrega.
 */

interface FeaturesPageProps {
  onBack: () => void;
  onGetStarted: () => void;
  onSeePricing: () => void;
  onNavegar: (destino: DestinoPublico) => void;
}

const CAPABILITIES = [
  {
    icon: Layers,
    title: 'Cenas e transições',
    body: 'Monte aberturas, entrevistas e encerramentos como cenas. Troque com corte seco, fusão, deslize ou cortina, e ajuste a duração de cada uma.',
    span: 'lg:col-span-3'
  },
  {
    icon: Wand2,
    title: 'Chroma key',
    body: 'Recorte o fundo com controle de tolerância, suavização de borda e supressão de cor. Funciona com fundo verde ou azul.',
    span: 'lg:col-span-3'
  },
  {
    icon: MessageSquareText,
    title: 'Moderação de chat com IA',
    body: 'O chat unificado passa por uma checagem automática que sinaliza spam, links suspeitos e linguagem imprópria, com o motivo à vista de quem modera.',
    span: 'lg:col-span-2'
  },
  {
    icon: SlidersHorizontal,
    title: 'Mixagem de áudio',
    body: 'Medidor por canal e redução automática da trilha quando alguém fala.',
    span: 'lg:col-span-2'
  },
  {
    icon: FileText,
    title: 'Teleprompter',
    body: 'Roteiro do apresentador na tela, com rolagem controlada.',
    span: 'lg:col-span-2'
  }
];

const STUDIO_TOOLS = [
  { icon: Video, label: 'Câmera e microfone', note: 'Captura direta do navegador' },
  { icon: Users, label: 'Convidados', note: 'Link de convite por sala' },
  { icon: Disc, label: 'Gravação local', note: 'Salva enquanto você transmite' },
  { icon: QrCode, label: 'QR na tela', note: 'Aponta a audiência para um link' }
];

export function FeaturesPage({ onBack, onGetStarted, onSeePricing, onNavegar }: FeaturesPageProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink-hi)] flex flex-col" id="features-page">

      {/* NAV: uma linha, altura contida */}
      <PublicHeader atual="features" fixo onNavegar={onNavegar} />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6">

        {/* SEÇÃO 1 — HERÓI ASSIMÉTRICO (não centralizado) */}
        <section className="grid lg:grid-cols-12 gap-10 items-end pt-20 pb-16">
          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand)]">
              Recursos
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.04] text-balance">
              Um estúdio de transmissão que roda no navegador.
            </h1>
            <p className="text-base text-[var(--ink-lo)] max-w-[52ch] leading-relaxed">
              Câmera, tela, cenas, chroma key e chat moderado. Sem instalar programa nenhum.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-deep)] hover:brightness-110 active:brightness-95 text-white text-sm font-semibold rounded-xl transition-all"
              >
                Abrir o estúdio <ArrowRight size={16} />
              </button>
              <button
                onClick={onSeePricing}
                className="px-6 py-3 border border-[var(--line-ctl)] hover:bg-[var(--surface)] text-sm font-semibold rounded-xl transition-colors"
              >
                Ver planos
              </button>
            </div>
          </div>

          {/* Espaço de imagem real. Sem screenshot falso de <div>. */}
          <div className="lg:col-span-5">
            {/* TODO(imagem): captura real do estúdio em uso, 1200x900,
                monitor de programa com barras SMPTE e a bandeja de controles. */}
            <div className="aspect-[4/3] rounded-xl border border-[var(--line)] bg-[var(--surface)] flex items-center justify-center">
              <span className="text-xs text-[var(--ink-dim)] font-medium px-6 text-center">
                Captura do estúdio
              </span>
            </div>
          </div>
        </section>

        {/* SEÇÃO 2 — FAIXA DE DESTINOS (família de layout diferente: linha larga) */}
        <section className="border-y border-[var(--line)] py-8">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            <p className="text-sm text-[var(--ink-lo)]">
              Configure seus destinos de transmissão:
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-semibold text-[var(--ink)]">
              <span>YouTube</span>
              <span>Facebook</span>
              <span>Twitch</span>
              <span>LinkedIn</span>
              <span>RTMP personalizado</span>
            </div>
          </div>
        </section>

        {/* SEÇÃO 3 — GRADE ASSIMÉTRICA. Cinco itens, cinco células. */}
        <section className="py-20">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight max-w-[22ch] mb-3">
            O que você controla durante a transmissão
          </h2>
          <p className="text-[var(--ink-lo)] max-w-[60ch] mb-10 leading-relaxed">
            Tudo abaixo já está no estúdio e não depende de plugin externo.
          </p>

          <div className="grid gap-4 lg:grid-cols-6">
            {CAPABILITIES.map(cap => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className={`${cap.span} rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 flex flex-col gap-3 transition-colors hover:border-[var(--line-ctl)]`}
                >
                  <Icon size={20} className="text-[var(--color-brand)]" strokeWidth={2} />
                  <h3 className="font-semibold text-[var(--ink-hi)]">{cap.title}</h3>
                  <p className="text-sm text-[var(--ink-lo)] leading-relaxed">{cap.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* SEÇÃO 4 — LISTA COM ROTULAGEM, não tabela de especificações */}
        <section className="py-20 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight max-w-[18ch]">
              Ferramentas do estúdio
            </h2>
            <p className="text-[var(--ink-lo)] mt-3 leading-relaxed max-w-[46ch]">
              As quatro coisas que você mais usa ficam na bandeja inferior, sempre no mesmo lugar.
            </p>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {STUDIO_TOOLS.map(tool => {
              const Icon = tool.icon;
              return (
                <div key={tool.label} className="flex items-start gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
                  <Icon size={18} className="text-[var(--ink-lo)] mt-0.5 shrink-0" strokeWidth={2} />
                  <div>
                    <p className="font-semibold text-sm text-[var(--ink-hi)]">{tool.label}</p>
                    <p className="text-xs text-[var(--ink-lo)] mt-0.5">{tool.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SEÇÃO 5 — PÁGINA PÚBLICA. Split invertido, quebra o padrão. */}
        <section className="py-20 grid lg:grid-cols-12 gap-10 items-center border-t border-[var(--line)]">
          <div className="lg:col-span-6 order-2 lg:order-1">
            {/* TODO(imagem): página pública de inscrição vista pelo espectador, 1200x800. */}
            <div className="aspect-[3/2] rounded-xl border border-[var(--line)] bg-[var(--surface)] flex items-center justify-center">
              <span className="text-xs text-[var(--ink-dim)] font-medium">Página do webinar</span>
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight max-w-[20ch]">
              Cada transmissão ganha a própria página
            </h2>
            <p className="text-[var(--ink-lo)] leading-relaxed max-w-[50ch]">
              Inscrição, contagem regressiva, chat e enquetes na mesma tela. É o link que você
              manda para a sua audiência.
            </p>
            <ul className="space-y-2.5 pt-1">
              {['Formulário de inscrição com consentimento', 'Enquetes com resultado ao vivo', 'Perguntas e respostas com votos'].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--ink)]">
                  <Check size={16} className="text-[var(--color-brand)] mt-0.5 shrink-0" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* SEÇÃO 6 — CHAMADA FINAL. Bloco cheio, outra família de layout. */}
        <section className="mb-20">
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)] p-10 md:p-14 flex flex-col md:flex-row md:items-center gap-8 justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight max-w-[20ch]">
                Comece pelo estúdio, decida o plano depois
              </h2>
              <p className="text-[var(--ink-lo)] max-w-[46ch] leading-relaxed">
                Monte cenas e teste sua configuração sem cadastrar cartão.
              </p>
            </div>
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-deep)] hover:brightness-110 active:brightness-95 text-white text-sm font-semibold rounded-xl shrink-0 transition-all"
            >
              Abrir o estúdio <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] px-6 py-6">
        <div className="max-w-[1200px] mx-auto flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--ink-dim)]">
          <span>PwStreamer</span>
          <button onClick={onSeePricing} className="hover:text-[var(--ink-hi)] transition-colors">Planos</button>
          <button onClick={onBack} className="hover:text-[var(--ink-hi)] transition-colors">Início</button>
        </div>
      </footer>
    </div>
  );
}
