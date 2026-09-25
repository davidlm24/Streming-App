import type { ComponentType } from 'react';
import { CirclePlay, Facebook, Instagram, Linkedin, Music2, Server, Twitch, Twitter, Tv, Youtube } from 'lucide-react';

type Icone = ComponentType<{ size?: number; strokeWidth?: number; className?: string; 'aria-hidden'?: 'true' }>;

/**
 * Kick não tem ícone no Lucide: um K no mesmo traço (1,75, pontas
 * redondas, `currentColor`) do resto do conjunto.
 */
function Kick({ size = 16, strokeWidth = 1.75, className = '' }: { size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 4v16" />
      <path d="M17 4 9.5 12l7.5 8" />
    </svg>
  );
}

/**
 * Ícone da plataforma de destino, no traço do resto do app (Lucide) e em
 * `currentColor`. As marcas não entram com as próprias cores: na casca, cor é
 * reservada para a ação da tela. TikTok, Kick e Rumble dividiam o mesmo
 * ícone de tela e ficavam iguais na lista; agora cada um tem o seu (a nota
 * do TikTok, o K do Kick, o play redondo do Rumble). Servidores RTMP usam o
 * servidor. O sinal de transmissão (Radio) fica só para o atalho do estúdio.
 */
const ICONES: Record<string, Icone> = {
  youtube: Youtube,
  facebook: Facebook,
  twitch: Twitch,
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Music2,
  kick: Kick,
  rumble: CirclePlay,
  x: Twitter,
  custom: Server,
  nginx: Server,
  srs: Server,
  restream: Server,
  cloudflare: Server,
};

export function PlataformaIcone({ plataforma, size = 16, className = '' }: { plataforma: string; size?: number; className?: string }) {
  const Icone = ICONES[plataforma] ?? Tv;
  return <Icone size={size} strokeWidth={1.75} className={className} aria-hidden="true" />;
}
