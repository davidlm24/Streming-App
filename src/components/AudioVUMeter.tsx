import React, { useEffect, useState } from 'react';

interface AudioVUMeterProps {
  stream?: MediaStream | null;
  isMuted?: boolean;
  isActive?: boolean;
  simulationType?: 'speech' | 'ambient' | 'silent' | 'music';
}

export function AudioVUMeter({ stream, isMuted = false, isActive = true, simulationType = 'speech' }: AudioVUMeterProps) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (isMuted || !isActive) {
      setLevel(0);
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
          setLevel(prev => prev * 0.4 + targetLevel * 0.6);
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
        setLevel(0);
        return;
      }

      if (simulationType === 'ambient') {
        setLevel(Math.random() * 4 + 1);
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
      setLevel(prev => prev * 0.3 + target * 0.7);
    }, 100);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [stream, isMuted, isActive, simulationType]);

  // Draw 15 LED segments
  const segmentsCount = 15;
  const activeSegments = Math.round((level / 100) * segmentsCount);

  return (
    <div className="w-full" id="vu-meter-bars">
      <div className="flex items-center gap-[2px] h-2 bg-[#090b0e] border border-slate-950 p-[1px] rounded-md overflow-hidden w-full">
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
              className={`flex-1 h-full rounded-[1px] transition-all duration-75 ${
                isLit ? litBg : unlitBg
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
