import { useEffect, useRef, type CSSProperties } from 'react';

/** O nível abaixo do qual o medidor fica vazio, em dBFS. */
const PISO_DB = -60;
/** A partir daqui a barra clareia: a voz está perto do limite. */
const MARGEM_DB = -12;
/** Quanto tempo o pico fica marcado antes de cair. */
const PICO_MS = 1000;
/** De quanto em quanto tempo a leitura em dB muda (a barra anda a cada quadro). */
const LEITURA_MS = 120;

const paraNivel = (db: number) => Math.min(1, Math.max(0, (db - PISO_DB) / -PISO_DB));

/**
 * O nível do microfone, lido do próprio stream pelo Web Audio: uma barra
 * segmentada, o pico retido por um segundo e a leitura em dB.
 *
 * O medidor antigo da bandeja e da barra lateral era `Math.random` imitando
 * fala, com o rótulo "Real-time". Este mede o RMS do sinal a cada quadro e
 * escreve direto no DOM, sem re-render do React. A graduação é de valor, não
 * de matiz: tinta baixa no nominal, tinta alta perto do limite. O vermelho é
 * do ar e não entra aqui.
 */
export function MedidorDeAudio({ stream, mudo }: { stream: MediaStream | null; mudo: boolean }) {
  const barraRef = useRef<HTMLSpanElement>(null);
  const picoRef = useRef<HTMLSpanElement>(null);
  const leituraRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const barra = barraRef.current;
    const pico = picoRef.current;
    const leitura = leituraRef.current;
    const trilha = stream?.getAudioTracks()[0];
    if (!barra || !pico || !leitura) return;
    const zerar = () => {
      barra.style.setProperty('--nivel', '0');
      barra.dataset.margem = 'nao';
      pico.style.opacity = '0';
      leitura.textContent = '—';
    };
    zerar();
    if (!stream || !trilha || mudo) return;

    let contexto: AudioContext | null = null;
    let quadro = 0;
    try {
      contexto = new AudioContext();
      void contexto.resume();
      const fonte = contexto.createMediaStreamSource(new MediaStream([trilha]));
      const analisador = contexto.createAnalyser();
      analisador.fftSize = 1024;
      fonte.connect(analisador);
      const amostras = new Float32Array(analisador.fftSize);
      let picoDb = PISO_DB;
      let picoEm = 0;
      let ultimaLeitura = 0;

      const medir = (agora: number) => {
        analisador.getFloatTimeDomainData(amostras);
        let soma = 0;
        for (let i = 0; i < amostras.length; i++) soma += amostras[i] * amostras[i];
        const rms = Math.sqrt(soma / amostras.length);
        const db = rms > 0 ? Math.max(PISO_DB, 20 * Math.log10(rms)) : PISO_DB;

        barra.style.setProperty('--nivel', paraNivel(db).toFixed(3));
        barra.dataset.margem = db > MARGEM_DB ? 'sim' : 'nao';

        if (db >= picoDb || agora - picoEm > PICO_MS) {
          picoDb = db;
          picoEm = agora;
        }
        pico.style.left = `calc(${(paraNivel(picoDb) * 100).toFixed(1)}% - 2px)`;
        pico.style.opacity = picoDb > PISO_DB ? '1' : '0';

        if (agora - ultimaLeitura > LEITURA_MS) {
          ultimaLeitura = agora;
          leitura.textContent = db <= PISO_DB ? '—' : `−${Math.abs(Math.round(db))} dB`;
        }
        quadro = requestAnimationFrame(medir);
      };
      quadro = requestAnimationFrame(medir);
    } catch {
      // Sem Web Audio (ou sem permissão), o medidor fica vazio em vez de inventar um nível.
    }

    return () => {
      cancelAnimationFrame(quadro);
      void contexto?.close();
    };
  }, [stream, mudo]);

  return (
    <span aria-hidden="true" className="flex items-center gap-2">
      <span className="relative block h-2 w-16 overflow-hidden rounded-full bg-[var(--well)] sm:w-24">
        <span
          ref={barraRef}
          style={{ '--nivel': 0 } as CSSProperties}
          className="absolute inset-y-0 left-0 w-full origin-left scale-x-[var(--nivel)] bg-[var(--ink-lo)] data-[margem=sim]:bg-[var(--ink-hi)]"
        />
        <span ref={picoRef} className="absolute inset-y-0 w-0.5 bg-[var(--ink-hi)] opacity-0" />
        {/* Os segmentos: vãos na cor da bandeja, por cima da barra */}
        <span
          className="absolute inset-0"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 5px, var(--surface) 5px 6px)' }}
        />
      </span>
      {/* No celular fica só a barra: a leitura em dB não cabe na bandeja de uma linha */}
      <span ref={leituraRef} className="hidden w-12 font-mono text-xs tabular-nums text-[var(--ink-lo)] sm:inline">
        —
      </span>
    </span>
  );
}
