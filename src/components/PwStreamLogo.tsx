import React, { useId } from 'react';

interface PwStreamLogoProps {
  className?: string;
  showText?: boolean;
  iconSize?: number;
  textSize?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Na tinta do contexto, sem gradiente, sem brilho e sem o círculo que pisca:
   * para onde a marca não deve falar (o console era assim até a marca ganhar
   * voz nele; hoje o console usa `discreto`).
   */
  monocromatico?: boolean;
  /**
   * A marca com o gradiente, mas quieta: sem o brilho, sem o círculo que pisca
   * e sem a legenda "online studio". Para a barra do console, onde a marca
   * precisa aparecer sem disputar com o ar.
   */
  discreto?: boolean;
}

export function PwStreamLogo({
  className = '',
  showText = true,
  iconSize = 32,
  textSize = 'md',
  monocromatico = false,
  discreto = false,
}: PwStreamLogoProps) {
  // Ids por instância: com o mesmo id em duas instâncias (a barra do estúdio
  // monta uma por largura), o url(#…) cai na escondida e o gradiente não pinta
  const id = useId();
  const gradiente = `pw-grad${id}`;
  const fundo = `pw-fundo${id}`;
  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  if (monocromatico) {
    return (
      <div className={`flex items-center gap-2.5 select-none text-[var(--ink-hi)] ${className}`}>
        <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" fill="none" aria-hidden="true" className="shrink-0">
          <path d="M50 5 L88 27 L88 73 L50 95 L12 73 L12 27 Z" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
          <path d="M28 50 C28 35, 35 28, 50 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
          <path d="M72 50 C72 65, 65 72, 50 72" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
          <path d="M44 38 L62 50 L44 62 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        {/* O logotipo é o único texto do produto na voz da marca (Poppins) */}
        {showText && <span className={`${textSizes[textSize]} font-display font-black leading-none tracking-tight`}>PwStreamer</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon SVG with custom linear gradients */}
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={discreto ? 'shrink-0' : 'shrink-0 drop-shadow-[0_0_12px_rgba(70,131,224,0.35)]'}
      >
        <defs>
          <linearGradient id={gradiente} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--brand-grad-from)" />
            <stop offset="50%" stopColor="var(--brand-grad-mid)" />
            <stop offset="100%" stopColor="var(--brand-grad-to)" />
          </linearGradient>
          <linearGradient id={fundo} x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
        </defs>

        {/* External glowing outer hexagon frame */}
        <path 
          d="M50 5 L88 27 L88 73 L50 95 L12 73 L12 27 Z" 
          fill={`url(#${fundo})`} 
          stroke={`url(#${gradiente})`} 
          strokeWidth="4" 
          strokeLinejoin="round"
        />

        {/* Live radar waves — o círculo que pisca fica fora do console */}
        {!discreto && (
          <circle cx="50" cy="50" r="14" stroke="#4683E0" strokeWidth="1.5" strokeDasharray="3 3" className="animate-ping" style={{ transformOrigin: 'center' }} />
        )}
        <path d="M28 50 C28 35, 35 28, 50 28" stroke="#4683E0" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <path d="M72 50 C72 65, 65 72, 50 72" stroke="#EC407A" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />

        {/* Core signal symbol/play button combo */}
        <path 
          d="M44 38 L62 50 L44 62 Z" 
          fill={`url(#${gradiente})`} 
          stroke="white" 
          strokeWidth="1.5" 
          strokeLinejoin="round"
        />
      </svg>

      {/* Brand Typographic Text */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className={`${textSizes[textSize]} font-display font-black tracking-tight leading-none text-[var(--ink-hi)] flex items-center`}>
            <span>Pw</span>
            <span className="bg-gradient-to-r from-[var(--brand-grad-from)] via-[var(--brand-grad-mid)] to-[var(--brand-grad-to)] bg-clip-text text-transparent">
              Streamer
            </span>
          </div>
          {!discreto && (
            <span className="text-[9px] font-mono tracking-widest text-[var(--ink-lo)] uppercase font-bold leading-none mt-1">
              online studio
            </span>
          )}
        </div>
      )}
    </div>
  );
}
