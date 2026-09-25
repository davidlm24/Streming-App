import { useEffect, useRef, useState } from 'react';
import { CreditCard, LogOut, Menu as IconeMenu, Radio, Shield, UserRound, X } from 'lucide-react';
import { PwStreamLogo } from './PwStreamLogo';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { BotaoDeIcone } from './ui/BotaoDeIcone';
import { Button } from './ui/Button';
import { Menu, type ItemDeMenu } from './ui/Menu';

export type VisaoDoApp =
  | 'dashboard' | 'channels' | 'webinars' | 'settings'
  | 'studio' | 'admin' | 'super-admin' | 'public-webinar' | 'profile' | 'billing';

interface AppHeaderProps {
  user: {
    name: string;
    email: string;
    plan: string;
    isExpired: boolean;
    trialDays: number;
    photoURL?: string;
    role?: string;
  };
  currentView: VisaoDoApp;
  onNavigate: (visao: VisaoDoApp) => void;
  onLogout: () => void;
}

const DESTINOS: { id: VisaoDoApp; rotulo: string }[] = [
  { id: 'dashboard', rotulo: 'Painel' },
  { id: 'channels', rotulo: 'Canais' },
  { id: 'webinars', rotulo: 'Webinars' },
  { id: 'settings', rotulo: 'Configurações' },
];

/**
 * A casca do app fora do estúdio: logo, quatro destinos e a conta.
 *
 * Substitui, nestas telas, o cabeçalho do estúdio — que trazia faixa de teste
 * grátis, "Adicionar canais", o menu de transmissão "LIVE STREAM 1080p", o
 * GO LIVE e o botão de tema para quem só queria agendar um webinar. O que é
 * do ar ficou no estúdio; o que é ajuste foi para Configurações.
 */
export function AppHeader({ user, currentView, onNavigate, onLogout }: AppHeaderProps) {
  const [menuMovelAberto, setMenuMovelAberto] = useState(false);
  const botaoMovel = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuMovelAberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenuMovelAberto(false);
      botaoMovel.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuMovelAberto]);

  const ir = (visao: VisaoDoApp) => {
    setMenuMovelAberto(false);
    onNavigate(visao);
  };

  // O teste grátis dura 30 dias e, quando acaba, o estúdio para de
  // transmitir (PRODUCT.md, Capabilities). Quem vai ao ar precisa saber
  // quantos dias restam antes de ser bloqueado — por isso fica na casca,
  // numa linha discreta, e não numa faixa no topo de toda tela.
  const emTeste = user.plan === 'Free Trial';
  // No painel, entrar no estúdio É a ação da tela; o atalho repetiria o botão.
  const mostrarAtalhoDoEstudio = currentView !== 'dashboard';
  const avisoDeTeste = user.isExpired
    ? 'Teste encerrado · ver planos'
    : `Teste grátis · ${user.trialDays} ${user.trialDays === 1 ? 'dia' : 'dias'}`;

  const itensDaConta: ItemDeMenu[] = [
    { rotulo: 'Dados de cadastro', icone: <UserRound size={14} />, onSelect: () => ir('profile') },
    { rotulo: 'Plano e cobrança', icone: <CreditCard size={14} />, onSelect: () => ir('billing') },
  ];
  if (user.role === 'super-admin') {
    itensDaConta.push({ rotulo: 'Administração', icone: <Shield size={14} />, onSelect: () => ir('super-admin') });
  }
  itensDaConta.push({ rotulo: 'Sair', icone: <LogOut size={14} />, onSelect: onLogout });

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]">
      <div className="mx-auto flex h-14 max-w-6xl items-stretch gap-6 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => ir('dashboard')}
          aria-label="PwStreamer, painel"
          className="flex shrink-0 items-center cursor-pointer"
        >
          <PwStreamLogo iconSize={28} textSize="sm" />
        </button>

        <nav aria-label="Principal" className="hidden items-stretch gap-1 md:flex">
          {DESTINOS.map((d) => {
            const atual = currentView === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => ir(d.id)}
                aria-current={atual ? 'page' : undefined}
                className={`relative inline-flex items-center px-3 text-sm transition-colors duration-150 cursor-pointer ${
                  atual
                    ? 'text-[var(--ink-hi)] after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--ink-hi)]'
                    : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                }`}
              >
                {d.rotulo}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {emTeste && (
            <span className="hidden lg:inline-flex">
              <AcaoDeTexto tamanho="xs" onClick={() => ir('billing')}>
                {avisoDeTeste}
              </AcaoDeTexto>
            </span>
          )}
          {mostrarAtalhoDoEstudio && (
            <Button variant="ghost" size="sm" onClick={() => ir('studio')} icon={<Radio size={14} aria-hidden="true" />} className="hidden sm:inline-flex">
              Estúdio
            </Button>
          )}
          <Menu
            rotulo={`Conta de ${user.name}`}
            itens={itensDaConta}
            classeDoGatilho="flex size-8 items-center justify-center overflow-hidden rounded-full border border-[var(--line-ctl)] bg-[var(--panel)] text-xs font-medium text-[var(--ink)] transition-colors duration-150 hover:border-[var(--ink-lo)] cursor-pointer"
            gatilho={<Avatar nome={user.name} foto={user.photoURL} />}
            cabecalho={
              <>
                <p className="truncate text-sm font-medium text-[var(--ink-hi)]">{user.name}</p>
                <p className="truncate text-xs text-[var(--ink-lo)]">{user.email}</p>
              </>
            }
          />
          {/* Nome fixo; aberto ou fechado quem diz é o aria-expanded */}
          <BotaoDeIcone
            ref={botaoMovel}
            rotulo="Menu de navegação"
            onClick={() => setMenuMovelAberto((a) => !a)}
            aria-expanded={menuMovelAberto}
            aria-controls="menu-do-app"
            className="-mr-2 md:hidden"
          >
            {menuMovelAberto ? <X size={20} aria-hidden="true" /> : <IconeMenu size={20} aria-hidden="true" />}
          </BotaoDeIcone>
        </div>
      </div>

      {menuMovelAberto && (
        <nav id="menu-do-app" aria-label="Principal" className="flex flex-col gap-1 border-t border-[var(--line)] px-4 pb-4 pt-2 md:hidden">
          {DESTINOS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => ir(d.id)}
              aria-current={currentView === d.id ? 'page' : undefined}
              className={`min-h-11 rounded-xl px-3 text-left text-sm transition-colors duration-150 cursor-pointer ${
                currentView === d.id ? 'bg-[var(--panel)] text-[var(--ink-hi)]' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
              }`}
            >
              {d.rotulo}
            </button>
          ))}
          {mostrarAtalhoDoEstudio && (
            <Button variant="ghost" onClick={() => ir('studio')} icon={<Radio size={16} aria-hidden="true" />} className="mt-2 min-h-11">
              Estúdio
            </Button>
          )}
          {emTeste && (
            <AcaoDeTexto tamanho="xs" onClick={() => ir('billing')} className="mt-2 min-h-11 justify-center">
              {avisoDeTeste}
            </AcaoDeTexto>
          )}
        </nav>
      )}
    </header>
  );
}

function Avatar({ nome, foto }: { nome: string; foto?: string }) {
  const [falhou, setFalhou] = useState(false);
  if (foto && !falhou) {
    return <img src={foto} alt="" referrerPolicy="no-referrer" onError={() => setFalhou(true)} className="size-full object-cover" />;
  }
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');
  return <span aria-hidden="true">{iniciais || '?'}</span>;
}
