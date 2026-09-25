import { Facebook, Instagram, Linkedin, Server, Twitch, Twitter, Tv, Youtube, type LucideIcon } from 'lucide-react';

/**
 * Ícone da plataforma de destino, no traço do resto do app (Lucide) e em
 * `currentColor`. As marcas não entram com as próprias cores: na casca, cor é
 * reservada para a ação da tela. Plataformas de vídeo sem ícone na biblioteca
 * (TikTok, Kick, Rumble) usam a tela; servidores RTMP, o servidor. O sinal
 * de transmissão (Radio) fica só para o atalho do estúdio.
 */
const ICONES: Record<string, LucideIcon> = {
  youtube: Youtube,
  facebook: Facebook,
  twitch: Twitch,
  instagram: Instagram,
  linkedin: Linkedin,
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
