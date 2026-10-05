import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { PwStreamLogo } from './PwStreamLogo';
import { Button } from './ui/Button';

export type DestinoPublico = 'landing' | 'features' | 'pricing' | 'login' | 'register';

interface PublicHeaderProps {
  /** Página aberta agora — marcada com aria-current. */
  atual?: string;
  onNavegar: (destino: DestinoPublico) => void;
  /** Preso ao topo ao rolar (a página de Recursos é longa). */
  fixo?: boolean;
}

const LINKS: { id: DestinoPublico; rotulo: string }[] = [
  { id: 'landing', rotulo: 'Início' },
  { id: 'features', rotulo: 'Recursos' },
  { id: 'pricing', rotulo: 'Planos' },
];

/**
 * Cabeçalho do site público: landing, recursos, planos, login e cadastro.
 *
 * Eram dois — um em AuthAndPricing, outro em FeaturesPage —, com itens e
 * rótulos diferentes ("Sign Up" num, "Criar conta" no outro; o de Recursos
 * nem tinha como entrar). E nenhum cabia no celular: a 375px os botões de
 * entrar e de criar conta ficavam cortados fora da tela, sem rolagem — no
 * aparelho mais comum, a porta de entrada do produto não era alcançável.
 *
 * A partir de `sm` tudo fica em linha. Abaixo, logo + botão de menu, e o
 * menu abre no fluxo, embaixo da barra — o mesmo desenho do Header logado.
 */
export function PublicHeader({ atual, onNavegar, fixo = false }: PublicHeaderProps) {
  const [aberto, setAberto] = useState(false);
  const botaoMenuRef = useRef<HTMLButtonElement>(null);

  // Esc fecha e devolve o foco ao botão que abriu
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setAberto(false);
      botaoMenuRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [aberto]);

  const ir = (destino: DestinoPublico) => {
    setAberto(false);
    onNavegar(destino);
  };

  const classeLink = (id: DestinoPublico) =>
    atual === id
      ? 'text-[var(--ink-hi)] bg-[var(--surface)]'
      : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--surface)]';

  return (
    <header className={`${fixo ? 'sticky top-0' : 'relative'} z-20 w-full border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-md`}>
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => ir('landing')}
          aria-label="PwStreamer, página inicial"
          className="shrink-0 cursor-pointer"
        >
          <PwStreamLogo iconSize={32} textSize="sm" />
        </button>

        <nav aria-label="Principal" className="hidden sm:flex items-center gap-1 text-xs font-semibold">
          {LINKS.map(l => (
            <button
              key={l.id}
              type="button"
              onClick={() => ir(l.id)}
              aria-current={atual === l.id ? 'page' : undefined}
              className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${classeLink(l.id)}`}
            >
              {l.rotulo}
            </button>
          ))}
          <Button variant="ghost" size="sm" className="ml-2" onClick={() => ir('login')}>Entrar</Button>
          <Button size="sm" onClick={() => ir('register')}>Criar conta</Button>
        </nav>

        <button
          ref={botaoMenuRef}
          type="button"
          onClick={() => setAberto(a => !a)}
          aria-expanded={aberto}
          aria-controls="menu-publico"
          aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
          className="sm:hidden -mr-2 w-11 h-11 inline-flex items-center justify-center rounded-xl text-[var(--ink-hi)] hover:bg-[var(--surface)] cursor-pointer"
        >
          {aberto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {aberto && (
        <nav
          id="menu-publico"
          aria-label="Principal"
          className="sm:hidden border-t border-[var(--line)] px-4 pt-2 pb-4 flex flex-col gap-1"
        >
          {LINKS.map(l => (
            <button
              key={l.id}
              type="button"
              onClick={() => ir(l.id)}
              aria-current={atual === l.id ? 'page' : undefined}
              className={`min-h-11 px-3 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${classeLink(l.id)}`}
            >
              {l.rotulo}
            </button>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="ghost" className="min-h-11" onClick={() => ir('login')}>Entrar</Button>
            <Button className="min-h-11" onClick={() => ir('register')}>Criar conta</Button>
          </div>
        </nav>
      )}
    </header>
  );
}
