import React, { useEffect, useRef, useState } from 'react';

interface AudioVUMeterProps {
  stream?: MediaStream | null;
  isMuted?: boolean;
  isActive?: boolean;
  simulationType?: 'speech' | 'ambient' | 'silent' | 'music';
}

const SEGMENTS = 15;

export function AudioVUMeter({ stream, isMuted = false, isActive = true, simulationType = 'speech' }: AudioVUMeterProps) {
  // O medidor tem 15 estados visuais. Antes, `level` era estado do React e
  // recebia setLevel a CADA quadro de rAF — ~60 re-renderizações por segundo
  // de 15 nós, durante toda a transmissão. E o suavizador é exponencial:
  // aproxima-se do alvo sem nunca alcançá-lo, então continuava renderizando
  // no silêncio também.
  // Agora o nível vive num ref e só o SEGMENTO vira estado, de modo que o
  // React só trabalha quando o desenho realmente muda — e nada no silêncio.
  const [segments, setSegments] = useState(0);
  const levelRef = useRef(0);
  const segRef = useRef(0);

  const pushRef = useRef((_target: number, _smoothing: number) => {});
  pushRef.current = (target: number, smoothing: number) => {
    const next = levelRef.current * smoothing + target * (1 - smoothing);
    // Trava em zero: sem isto a cauda exponencial nunca assenta.
    levelRef.current = next < 0.5 ? 0 : next;
    const seg = Math.round((levelRef.current / 100) * SEGMENTS);
    if (seg !== segRef.current) {
      segRef.current = seg;
      setSegments(seg);
    }
  };

  useEffect(() => {
    if (isMuted || !isActive) {
      levelRef.current = 0;
      segRef.current = 0;
      setSegments(0);
      return;
    }

    // Try to connect real audio stream if provided
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animationFrameId: number | null = null;

    if (stream && stream.getAudioTracks().length > 0) {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const draw = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let maxVal = 0;
          for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i] > maxVal) {
              maxVal = dataArray[i];
            }
          }
          // Normalize 0-255 to percentage 0-100
          const targetLevel = (maxVal / 255) * 100;
          // Apply standard smoothing
          pushRef.current(targetLevel, 0.4);
          animationFrameId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
          if (animationFrameId) cancelAnimationFrame(animationFrameId);
          if (audioContext) audioContext.close();
        };
      } catch (err) {
        console.warn("Failed to create real-time audio analyser (sandbox limit), falling back to simulation:", err);
      }
    }

    // High quality simulation fallback (simulates actual human speaking patterns with pauses)
    let intervalId: any;
    let phraseTime = 0;
    let state: 'speaking' | 'pause' = 'speaking';
    let target = 0;

    intervalId = setInterval(() => {
      phraseTime += 100;
      if (simulationType === 'silent') {
        pushRef.current(0, 0);
        return;
      }

      if (simulationType === 'ambient') {
        pushRef.current(Math.random() * 4 + 1, 0.3);
        return;
      }

      // Speech simulation logic
      if (state === 'speaking') {
        target = Math.random() * 55 + 15; // 15% - 70% level
        if (Math.random() < 0.15 && phraseTime > 1500) {
          state = 'pause';
          phraseTime = 0;
        }
      } else {
        target = Math.random() * 3 + 1; // 1% - 4% background hum
        if (Math.random() < 0.4 && phraseTime > 400) {
          state = 'speaking';
          phraseTime = 0;
        }
      }

      // Smooth level changes
      pushRef.current(target, 0.3);
    }, 100);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [stream, isMuted, isActive, simulationType]);

  // Os 15 segmentos vêm direto do estado quantizado — nada é recalculado
  // a partir de um nível contínuo no corpo da renderização.
  const segmentsCount = SEGMENTS;
  const activeSegments = segments;

  return (
    <div className="w-full" id="vu-meter-bars">
      <div className="flex items-center gap-[2px] h-2 bg-[var(--well)] border border-[var(--line)] p-[1px] rounded-md overflow-hidden w-full">
        {Array.from({ length: segmentsCount }).map((_, idx) => {
          const isLit = idx < activeSegments;
          // Segment colors: green for idx < 10, yellow for 10-12, red for >= 13
          let litBg = 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]';
          let unlitBg = 'bg-emerald-950/40';

          if (idx >= 12) {
            litBg = 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]';
            unlitBg = 'bg-red-950/30';
          } else if (idx >= 9) {
            litBg = 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.6)]';
            unlitBg = 'bg-amber-950/40';
          }

          return (
            <div 
              key={idx}
              className={`flex-1 h-full rounded-[1px] transition-colors duration-75 ${
                isLit ? litBg : unlitBg
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
