import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CircleAlert, Copy } from 'lucide-react';
import { LegalModal } from './LegalModals';
import { InicioPublico } from './InicioPublico';
import { PublicHeader, type VisaoPublica } from './PublicHeader';
import { loginWithGoogle } from '../lib/firestoreService';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { Button } from './ui/Button';
import { copyText } from './ui/clipboard';

/** Vite remove o ramo inteiro no build de produção. */
const IS_DEV = import.meta.env.DEV;

/** O título de cada tela, que recebe o foco quando a tela troca. */
const TITULO_DA_VISAO: Record<VisaoPublica, string> = {
  landing: 'inicio-titulo',
  login: 'entrar-titulo',
  register: 'criar-conta-titulo',
};

/** O "G" do Google fica nas cores dele: é o que as regras da marca pedem num botão de entrar com Google. */
function LogoDoGoogle() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
      <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"/>
      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
    </svg>
  );
}

/**
 * A frase de cada falha do login com Google. Antes a tela mostrava a
 * mensagem crua do Firebase ("Firebase: Error (auth/popup-blocked).").
 * Fechar a janela de propósito não é erro: não diz nada.
 */
function mensagemDoGoogle(err: any): string | null {
  switch (err?.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null;
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela do Google. Permita janelas para este site e tente de novo.';
    case 'auth/network-request-failed':
      return 'Sem conexão com o Google. Confira a internet e tente de novo.';
    default:
      return 'Não deu para entrar com o Google. Tente de novo.';
  }
}

interface AuthAndPricingProps {
  onAuthSuccess: (user: {
    email: string;
    name: string;
    plan: 'Standard' | 'Professional' | 'Business' | 'Free Trial';
    isExpired: boolean;
    trialDays: number;
    role?: 'super-admin' | 'admin' | 'client';
  }) => void;
  initialView?: VisaoPublica;
}

/**
 * O site público: o início (com os planos), entrar e criar conta.
 *
 * Saíram a página de preços em inglês ("Upgrade to grow and engage your
 * audience", com "Garantia de reembolso de 7 dias" e "Fale conosco" que não
 * levava a lugar nenhum) e o checkout, que dava o plano pago sem cobrar: um
 * formulário de cartão, um PayPal de teste que pedia a senha da pessoa e um
 * PIX com chave de mentira. Os planos agora são a lista do app, e a
 * assinatura é dita como "em breve", como dentro do app.
 */
export function AuthAndPricing({ onAuthSuccess, initialView = 'landing' }: AuthAndPricingProps) {
  const [view, setView] = useState<VisaoPublica>(initialView);

  // Legal Modal States
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy'>('terms');
  const abrirDocumento = (tipo: 'terms' | 'privacy') => {
    setLegalModalType(tipo);
    setLegalModalOpen(true);
  };

  // Auth inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [domainCopied, setDomainCopied] = useState(false);
  // Nem o login nem o cadastro tinham estado pendente: dava para enviar o
  // formulario varias vezes sem nenhum retorno visual.
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [entrandoComGoogle, setEntrandoComGoogle] = useState(false);

  const handleGoogleLogin = async () => {
    if (entrandoComGoogle) return;
    setAuthError('');
    setIsUnauthorizedDomain(false);
    setEntrandoComGoogle(true);
    try {
      const userProfile = await loginWithGoogle();
      onAuthSuccess(userProfile);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setIsUnauthorizedDomain(true);
      } else {
        setAuthError(mensagemDoGoogle(err) ?? '');
      }
    } finally {
      setEntrandoComGoogle(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // CONTENÇÃO. Este formulário não autentica: não chama o Firebase nem
    // servidor nenhum, só confere se os campos estão preenchidos. Qualquer
    // e-mail com qualquer senha entrava — e 'mgdlms@gmail.com' ganhava o
    // papel de super-admin. Em produção o formulário nem é renderizado e só
    // o Google (autenticação real) entra. Volta quando o login por e-mail
    // for do Firebase (signInWithEmailAndPassword).
    if (!IS_DEV) return;
    if (isSubmittingAuth) return;
    if (!email || !password) {
      setAuthError('Por favor, preencha todos os campos.');
      return;
    }
    setIsSubmittingAuth(true);
    // Validação estrita de super-admin
    const isSuperAdmin = email.trim().toLowerCase() === 'mgdlms@gmail.com';
    const userRole = isSuperAdmin ? 'super-admin' : 'client';
    onAuthSuccess({
      email,
      name: name || (isSuperAdmin ? 'Marcos Gonçalves' : email.split('@')[0]),
      role: userRole,
      plan: 'Free Trial',
      isExpired: false,
      trialDays: 30
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Mesma contenção de handleLogin: este cadastro não cria conta nenhuma.
    if (!IS_DEV) return;
    if (isSubmittingAuth) return;
    if (!email || !password || !name) {
      setAuthError('Por favor, preencha todos os campos.');
      return;
    }
    setIsSubmittingAuth(true);
    // Entra diretamente na conta com 30 dias de teste grátis
    onAuthSuccess({
      email,
      name,
      plan: 'Free Trial',
      isExpired: false,
      trialDays: 30
    });
  };

  // Trocar de tela leva ao topo e põe o foco no título da nova tela; "Planos"
  // leva à seção de planos do início. Compara com a tela anterior (e não com
  // "primeira vez"): no StrictMode o efeito roda duas vezes ao montar, e a
  // segunda punha o foco no título do início logo ao abrir o site.
  const telaAnterior = useRef(view);
  const irAosPlanosDepois = useRef(false);

  const mostrarPlanos = () => {
    const titulo = document.getElementById('inicio-planos');
    if (!titulo) return;
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    titulo.closest('section')?.scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth', block: 'start' });
    titulo.focus({ preventScroll: true });
  };

  const irPara = (destino: VisaoPublica) => {
    setAuthError('');
    setIsUnauthorizedDomain(false);
    setView(destino);
  };

  const irAosPlanos = () => {
    if (view === 'landing') {
      mostrarPlanos();
      return;
    }
    irAosPlanosDepois.current = true;
    irPara('landing');
  };

  useEffect(() => {
    if (telaAnterior.current === view) return;
    telaAnterior.current = view;
    if (irAosPlanosDepois.current) {
      irAosPlanosDepois.current = false;
      mostrarPlanos();
      return;
    }
    window.scrollTo(0, 0);
    document.getElementById(TITULO_DA_VISAO[view])?.focus({ preventScroll: true });
  }, [view]);

  const copiarEndereco = () => {
    copyText(window.location.hostname);
    setDomainCopied(true);
    setTimeout(() => setDomainCopied(false), 2000);
  };

  // As falhas ficam acima do botão do Google, que é a ação da tela.
  const avisos = (
    <>
      {isUnauthorizedDomain && (
        <div role="alert" className="mt-6 text-pretty">
          <p className="flex items-start gap-2 text-sm text-[var(--ink-hi)]">
            <CircleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>O login com Google ainda não está liberado neste endereço.</span>
          </p>
          <p className="mt-2 text-xs text-[var(--ink-lo)]">
            Quem administra o PwStreamer precisa incluir{' '}
            <span className="break-all text-[var(--ink)]">{window.location.hostname}</span> em Domínios autorizados, no
            Firebase Authentication.
          </p>
          <AcaoDeTexto tamanho="xs" icone={<Copy size={12} />} onClick={copiarEndereco} className="mt-1 min-h-11">
            {domainCopied ? 'Endereço copiado' : 'Copiar endereço'}
          </AcaoDeTexto>
        </div>
      )}
      {authError && (
        <p role="alert" className="mt-6 flex items-start gap-2 text-pretty text-sm text-[var(--ink-hi)]">
          <CircleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>{authError}</span>
        </p>
      )}
    </>
  );

  const classeDoCampo = 'mt-2 h-11 w-full rounded-xl border px-3 text-sm';
  const classeDoRotulo = 'block text-sm font-medium text-[var(--ink-hi)]';

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--ink)]" id="auth-pricing-panel">
      <PublicHeader atual={view} onNavegar={irPara} onPlanos={irAosPlanos} />

      {view === 'landing' && <InicioPublico onCriarConta={() => irPara('register')} onEntrar={() => irPara('login')} />}

      {view === 'login' && (
        <main className="flex-1">
          <div className="mx-auto max-w-sm px-4 pb-24 pt-12 sm:pt-16">
            <h1 id="entrar-titulo" tabIndex={-1} className="text-3xl font-semibold tracking-tight text-[var(--ink-hi)]">
              Entrar
            </h1>
            <p className="mt-2 text-sm text-[var(--ink-lo)]">Com a conta Google do seu cadastro.</p>

            {avisos}

            <Button
              variant="ghost"
              onClick={handleGoogleLogin}
              loading={entrandoComGoogle}
              icon={<LogoDoGoogle />}
              className="mt-8 min-h-11 w-full"
            >
              Entrar com Google
            </Button>

            {IS_DEV && (
              <form onSubmit={handleLogin} className="mt-8 border-t border-[var(--line)] pt-6">
                <p className="text-xs text-[var(--ink-lo)]">Só em desenvolvimento: e-mail e senha.</p>
                <div className="mt-4 space-y-5">
                  <div>
                    <label htmlFor="entrar-email" className={classeDoRotulo}>E-mail</label>
                    <input
                      id="entrar-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={classeDoCampo}
                    />
                  </div>
                  <div>
                    <label htmlFor="entrar-senha" className={classeDoRotulo}>Senha</label>
                    <input
                      id="entrar-senha"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={classeDoCampo}
                    />
                  </div>
                </div>
                <Button type="submit" loading={isSubmittingAuth} className="mt-6 w-full">
                  Entrar
                </Button>
              </form>
            )}

            <p className="mt-8 text-sm text-[var(--ink-lo)]">
              Ainda não tem conta?{' '}
              <AcaoDeTexto sublinhada onClick={() => irPara('register')}>
                Criar conta
              </AcaoDeTexto>
            </p>
          </div>
        </main>
      )}

      {view === 'register' && (
        <main className="flex-1">
          <div className="mx-auto max-w-sm px-4 pb-24 pt-12 sm:pt-16">
            <h1 id="criar-conta-titulo" tabIndex={-1} className="text-3xl font-semibold tracking-tight text-[var(--ink-hi)]">
              Criar conta
            </h1>
            <p className="mt-2 text-pretty text-sm text-[var(--ink-lo)]">
              30&nbsp;dias grátis, sem cartão. O PwStreamer está em acesso antecipado: transmitir para os canais ainda
              não está no&nbsp;ar.
            </p>

            {avisos}

            <Button
              variant="ghost"
              onClick={handleGoogleLogin}
              loading={entrandoComGoogle}
              icon={<LogoDoGoogle />}
              className="mt-8 min-h-11 w-full"
            >
              Criar conta com Google
            </Button>
            <p className="mt-3 text-pretty text-xs text-[var(--ink-lo)]">
              Ao criar a conta, você aceita os{' '}
              <AcaoDeTexto tamanho="xs" sublinhada onClick={() => abrirDocumento('terms')}>
                Termos de uso
              </AcaoDeTexto>{' '}
              e a{' '}
              <AcaoDeTexto tamanho="xs" sublinhada onClick={() => abrirDocumento('privacy')}>
                Política de privacidade
              </AcaoDeTexto>
              .
            </p>

            {IS_DEV && (
              <form onSubmit={handleRegister} className="mt-8 border-t border-[var(--line)] pt-6">
                <p className="text-xs text-[var(--ink-lo)]">Só em desenvolvimento: nome, e-mail e senha.</p>
                <div className="mt-4 space-y-5">
                  <div>
                    <label htmlFor="criar-nome" className={classeDoRotulo}>Nome</label>
                    <input
                      id="criar-nome"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={classeDoCampo}
                    />
                  </div>
                  <div>
                    <label htmlFor="criar-email" className={classeDoRotulo}>E-mail</label>
                    <input
                      id="criar-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={classeDoCampo}
                    />
                  </div>
                  <div>
                    <label htmlFor="criar-senha" className={classeDoRotulo}>Senha</label>
                    <input
                      id="criar-senha"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={classeDoCampo}
                    />
                  </div>
                </div>
                <Button type="submit" loading={isSubmittingAuth} className="mt-6 w-full">
                  Criar conta <ArrowRight size={16} aria-hidden="true" />
                </Button>
              </form>
            )}

            <p className="mt-8 text-sm text-[var(--ink-lo)]">
              Já tem conta?{' '}
              <AcaoDeTexto sublinhada onClick={() => irPara('login')}>
                Entrar
              </AcaoDeTexto>
            </p>
          </div>
        </main>
      )}

      {/* O mesmo rodapé do app */}
      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-xs text-[var(--ink-lo)] sm:px-6">
          <p>© {new Date().getFullYear()} PW Stream Online</p>
          <div className="flex gap-5">
            <AcaoDeTexto tamanho="xs" onClick={() => abrirDocumento('terms')}>
              Termos de uso
            </AcaoDeTexto>
            <AcaoDeTexto tamanho="xs" onClick={() => abrirDocumento('privacy')}>
              Privacidade
            </AcaoDeTexto>
          </div>
        </div>
      </footer>

      <LegalModal isOpen={legalModalOpen} type={legalModalType} onClose={() => setLegalModalOpen(false)} />
    </div>
  );
}
