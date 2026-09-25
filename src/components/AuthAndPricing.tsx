import { PLANS, formatPrice, getPlan } from '../lib/plans';
import { Button } from './ui/Button';
import { useTabs } from './ui/Tabs';
import React, { useState } from 'react';
import { 
  Check, LogIn, UserPlus, CreditCard, ArrowRight, Lock, 
  CheckCircle2, Sparkles, Shield, AlertTriangle, Play, HelpCircle, QrCode,
  Copy, ExternalLink, ShieldCheck
} from 'lucide-react';
import { PwStreamLogo } from './PwStreamLogo';
import { LegalModal } from './LegalModals';
import { FeaturesPage } from './FeaturesPage';
import { loginWithGoogle, createDirectUserProfile } from '../lib/firestoreService';
import { useToast } from './ui/Toast';
import { copyText } from './ui/clipboard';

/** Vite remove o ramo inteiro no build de produção. */
const IS_DEV = import.meta.env.DEV;

interface AuthAndPricingProps {
  onAuthSuccess: (user: { 
    email: string; 
    name: string; 
    plan: 'Standard' | 'Professional' | 'Business' | 'Free Trial'; 
    isExpired: boolean; 
    trialDays: number;
    role?: 'super-admin' | 'admin' | 'client';
  }) => void;
  initialView?: 'landing' | 'pricing' | 'login' | 'register' | 'checkout';
  selectedPlanForCheckout?: 'Standard' | 'Professional' | 'Business' | null;
}

export function AuthAndPricing({ onAuthSuccess, initialView = 'landing', selectedPlanForCheckout = null }: AuthAndPricingProps) {
  const toast = useToast();
  const [view, setView] = useState<'landing' | 'features' | 'pricing' | 'login' | 'register' | 'checkout'>(initialView);
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'Standard' | 'Professional' | 'Business' | 'Free Trial' | null>(selectedPlanForCheckout);
  
  // Legal Modal States
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy'>('terms');

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

  // Checkout inputs
  const [cardNumber, setCardNumber] = useState(IS_DEV ? '4242 4242 4242 4242' : '');
  const [cardExpiry, setCardExpiry] = useState(IS_DEV ? '12/29' : '');
  const [cardCvc, setCardCvc] = useState(IS_DEV ? '424' : '');
  const [cardName, setCardName] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'paypal' | 'mercadopago'>('stripe');
  const selecionarGateway = (g: 'stripe' | 'paypal' | 'mercadopago') => {
    setSelectedGateway(g);
    setCheckoutError('');
  };
  const gatewayAbas = useTabs('pagamento', ['stripe', 'paypal', 'mercadopago'] as const, selectedGateway, selecionarGateway);
  const [paypalEmail, setPaypalEmail] = useState(IS_DEV ? 'marcos-test@pwstreamer.com' : '');
  const [paypalPassword, setPaypalPassword] = useState('');
  const [isPaypalAuthorized, setIsPaypalAuthorized] = useState(false);
  const [mpMethod, setMpMethod] = useState<'pix' | 'card'>('pix');
  const [pixCopied, setPixCopied] = useState(false);

  // Pricing descriptions
  // Tabela local removida: era uma das tres copias do mesmo preco.
  // Fonte unica em lib/plans.
  const plansData = PLANS;

  const handleGoogleLogin = async () => {
    try {
      setAuthError('');
      setIsUnauthorizedDomain(false);
      const userProfile = await loginWithGoogle();
      onAuthSuccess(userProfile);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setIsUnauthorizedDomain(true);
        setAuthError('');
      } else {
        setAuthError(err.message || 'Erro ao autenticar com o Google.');
      }
    }
  };

  const handleDirectDevLogin = (targetEmail = 'mgdlms@gmail.com', targetName = 'Marcos Gonçalves') => {
    const profile = createDirectUserProfile(targetEmail, targetName);
    onAuthSuccess(profile);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
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
    if (isSubmittingAuth) return;
    if (!email || !password || !name) {
      setAuthError('Por favor, preencha todos os campos.');
      return;
    }
    // Veio de um plano pago: agora que há nome e e-mail, segue para o checkout
    if (selectedPlan && selectedPlan !== 'Free Trial') {
      setAuthError('');
      setView('checkout');
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

  // Sem conta, o plano não é de ninguém. Era: `email || 'mgdlms@pwstreamer.com'`,
  // `name || 'Marcos Gonçalves'` — qualquer visitante que clicasse em
  // "Iniciar 30 Dias Grátis", ou concluísse o checkout, entrava no app como o
  // dono. Agora quem não se cadastrou vai para o cadastro, com o plano
  // escolhido guardado; o cadastro segue para o checkout se o plano for pago.
  const semIdentidade = !email.trim() || !name.trim();

  const handleSelectPlan = (planId: 'Standard' | 'Professional' | 'Business' | 'Free Trial') => {
    setSelectedPlan(planId);
    if (semIdentidade) {
      setAuthError('');
      setView('register');
      return;
    }
    if (planId === 'Free Trial') {
      onAuthSuccess({
        email,
        name,
        plan: 'Free Trial',
        isExpired: false,
        trialDays: 30
      });
    } else {
      // Paid plans require checkout simulation
      setView('checkout');
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (semIdentidade) {
      setView('register');
      return;
    }
    if (selectedGateway === 'stripe' && !cardName) {
      setCheckoutError('Por favor, digite o nome impresso no cartão.');
      return;
    }
    if (selectedGateway === 'paypal' && !isPaypalAuthorized) {
      setCheckoutError('Por favor, faça login e autorize a sua conta PayPal Sandbox primeiro.');
      return;
    }
    if (selectedGateway === 'mercadopago' && mpMethod === 'card' && !cardName) {
      setCheckoutError('Por favor, digite o nome impresso no cartão.');
      return;
    }

    setIsProcessingCheckout(true);
    setCheckoutError('');

    setTimeout(() => {
      setIsProcessingCheckout(false);
      onAuthSuccess({
        email,
        name,
        plan: selectedPlan || 'Standard',
        isExpired: false,
        trialDays: 30 // Paid plan is unlimited, but we keep active
      });
    }, 1500);
  };

  // A página de Recursos traz o próprio cabeçalho e rodapé, então substitui a
  // casca inteira em vez de ser renderizada dentro dela (senão aparecem duas
  // barras de navegação empilhadas).
  if (view === 'features') {
    return (
      <FeaturesPage
        onBack={() => setView('landing')}
        onGetStarted={() => setView('register')}
        onSeePricing={() => setView('pricing')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink-hi)] flex flex-col justify-between relative overflow-hidden" id="auth-pricing-panel">
      {/*
        Aqui existia um plano de fundo decorativo copiado da referência da
        Restream: um orbe de desfoque de 800px, onze linhas radiantes em SVG
        saindo de um ponto vermelho e um ponto branco pulsando para sempre.
        Removido inteiro. Eram quatro marcas de design gerado por IA de uma
        vez (orbe de desfoque, linhas de grade decorativas, ponto de status
        decorativo, animação infinita) e nenhuma delas organizava conteúdo.
      */}

      {/* Header Logo Navbar */}
      <header className="relative z-10 w-full border-b border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* O selo "RESTREAM MODE" saiu daqui: era o nome de um concorrente
              impresso na barra de navegação do próprio produto. */}
          <PwStreamLogo iconSize={32} textSize="sm" />
        </div>
        <nav aria-label="Principal" className="flex items-center gap-4 text-xs font-semibold text-[var(--ink-lo)]">
          <button onClick={() => setView('landing')} className="hover:text-[var(--ink-hi)] transition-colors">Início</button>
          <button onClick={() => setView('features')} className="hover:text-[var(--ink-hi)] transition-colors">Recursos</button>
          <button onClick={() => setView('pricing')} className="hover:text-[var(--ink-hi)] transition-colors">Planos</button>
          <button onClick={() => setView('login')} className="px-3.5 py-1.5 border border-[var(--line)] rounded-lg hover:bg-[var(--surface)] transition-colors text-[var(--ink-hi)]">Log In</button>
          <button onClick={() => setView('register')} className="px-3.5 py-1.5 bg-[var(--color-brand-deep)] rounded-lg hover:bg-blue-600 transition-all text-white">Sign Up</button>
        </nav>
      </header>

      {/* Main View Switcher */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-7xl mx-auto w-full">
        
        {/* VIEW 1: LANDING
            A manchete e o subtítulo eram a copy da Restream, em inglês, num
            produto em português. Substituídos por texto original pt-BR.
            O gradiente no título também saiu: era decorativo e o próprio
            sistema reserva cor para significado, não para ornamento. */}
        {view === 'landing' && (
          <div className="w-full max-w-[1200px] mx-auto" id="landing-view">
            {/* HERÓI ASSIMÉTRICO.
                Era centralizado, com o texto, os botões e a prévia de planos
                todos no eixo do meio. Agora a mensagem e a ação ficam à
                esquerda e a imagem do produto à direita, que é o que dá
                hierarquia de leitura em vez de simetria. */}
            <section className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center py-14 lg:py-20">
              <div className="lg:col-span-7 space-y-6 text-left">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
                  <Sparkles size={14} /> Estúdio de webinars e transmissão ao vivo
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--ink-hi)] leading-[1.04] text-balance">
                  Uma transmissão.<br />Todos os seus canais.
                </h1>
                <p className="text-base sm:text-lg text-[var(--ink-lo)] max-w-[52ch] leading-relaxed">
                  Transmita ao vivo para YouTube, Facebook e Twitch ao mesmo tempo, direto do
                  navegador. Sem instalar nada.
                </p>

            {/* Actions Panel */}
            <div className="space-y-4 max-w-md">
              {isUnauthorizedDomain && (
                <div className="p-4 bg-blue-950/40 border border-blue-500/30 rounded-2xl text-left space-y-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck size={18} className="text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-[var(--ink-hi)] text-sm">Autenticação Google no Ambiente Web</p>
                      <p className="text-[var(--ink)] leading-relaxed">
                        O Firebase Authentication requer que este domínio esteja cadastrado em <strong>Domínios Autorizados</strong> no Firebase Console para abrir o pop-up nativo.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[var(--bg)]/80 p-2.5 rounded-xl border border-[var(--line)] flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-[var(--ink)] truncate select-all">{typeof window !== 'undefined' ? window.location.hostname : ''}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          copyText(window.location.hostname);
                          setDomainCopied(true);
                          setTimeout(() => setDomainCopied(false), 2000);
                        }
                      }}
                      className="px-2.5 py-1 bg-[var(--panel)] hover:bg-[var(--raise)] text-[0.625rem] font-bold text-[var(--ink-hi)] rounded-lg flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    >
                      <Copy size={12} />
                      {domainCopied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>

                  {/* Login sem credencial numa conta nomeada. A condicao era so
                      isUnauthorizedDomain — qualquer dominio fora da lista do
                      Firebase: preview de deploy, staging, dominio novo. Agora sai do
                      build de producao. */}

                  {IS_DEV && <button
                    type="button"
                    onClick={() => handleDirectDevLogin('mgdlms@gmail.com', 'Marcos Gonçalves')}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Entrar agora como Marcos Gonçalves (mgdlms@gmail.com)</span>
                    <ArrowRight size={14} />
                  </button>}
                </div>
              )}

              {authError && (
                <div role="alert" className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2 text-left">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Um botão sólido, não gradiente: `bg-gradient-to-r from-blue
                  to-blue` num CTA primário é a receita mais reconhecível de
                  interface gerada por IA. */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleGoogleLogin}
                  className="px-7 py-3.5 bg-[var(--color-brand-deep)] hover:brightness-110 active:brightness-95 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Entrar com Google <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => setView('register')}
                  className="px-7 py-3.5 bg-transparent hover:bg-[var(--surface)] border border-[var(--line-ctl)] text-[var(--ink-hi)] font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Criar conta
                </button>
              </div>

              <p className="text-xs text-[var(--ink-dim)] font-medium">
                Já tem conta? <button onClick={() => setView('login')} className="text-blue-400 hover:underline">Entre aqui</button>
              </p>
            </div>
              </div>

              {/* Espaço de imagem real do produto, no lugar do vazio simétrico
                  que existia à direita. Sem screenshot falso feito de <div>. */}
              <div className="lg:col-span-5">
                {/* TODO(imagem): captura real do estúdio em transmissão,
                    1200x900, com monitor de programa e bandeja de controles. */}
                <div className="aspect-[4/3] rounded-xl border border-[var(--line)] bg-[var(--surface)] flex items-center justify-center">
                  <span className="text-xs text-[var(--ink-dim)] font-medium">Captura do estúdio</span>
                </div>
              </div>
            </section>

            {/* PRÉVIA DE PLANOS.
                Eram três cartões idênticos lado a lado, o layout mais
                reconhecível de página gerada por IA. Agora o plano recomendado
                ocupa o dobro e os outros dois dividem a coluna: mesma
                informação, hierarquia de verdade.
                O botão de cada cartão também saiu: "Assinar Plano" repetia a
                intenção de cadastro que os botões do herói já cobrem. Um
                rótulo por intenção. */}
            <section className="pb-20 border-t border-[var(--line)] pt-14">
              <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--ink-hi)]">
                  Planos
                </h2>
                <button
                  onClick={() => setView('pricing')}
                  className="text-sm text-blue-400 font-semibold flex items-center gap-1.5 hover:underline"
                >
                  Comparar todos os planos <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                <div className="lg:col-span-2 lg:row-span-2 bg-[var(--surface)] border border-[var(--color-brand)] rounded-xl p-6 flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-[var(--ink-hi)] text-lg">Professional</h3>
                    <span className="text-xs font-semibold text-[var(--color-brand)] bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">Recomendado</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-[var(--ink-hi)] tabular-nums">{formatPrice(getPlan('Professional')!.priceMonthly)}</span>
                    <span className="text-sm text-[var(--ink-dim)] font-semibold">/mês</span>
                  </div>
                  <p className="text-sm text-[var(--ink-lo)] leading-relaxed">
                    Para criadores profissionais e empresas. Até 5 destinos simultâneos, 1080p a 60fps
                    e sem marca da plataforma.
                  </p>
                </div>

                {[
                  { name: 'Standard', price: formatPrice(getPlan('Standard')!.priceMonthly), desc: 'Criadores e produtores autônomos. Até 2 destinos simultâneos.' },
                  { name: 'Business', price: formatPrice(getPlan('Business')!.priceMonthly), desc: 'Emissoras, agências e estúdios. Destinos ilimitados e 4K.' }
                ].map(p => (
                  <div key={p.name} className="lg:col-span-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5 flex flex-col gap-2">
                    <h3 className="font-bold text-[var(--ink-hi)]">{p.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-[var(--ink-hi)] tabular-nums">{p.price}</span>
                      <span className="text-xs text-[var(--ink-dim)] font-semibold">/mês</span>
                    </div>
                    <p className="text-sm text-[var(--ink-lo)] leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: LOGIN VIEW */}
        {view === 'login' && (
          <div className="w-full max-w-md bg-[var(--surface)]/80 border border-[var(--line)] p-8 rounded-3xl space-y-6 animate-in fade-in duration-200" id="login-view">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-[var(--ink-hi)]">Bem-vindo de volta!</h1>
              <p className="text-xs text-[var(--ink-lo)]">Insira suas credenciais para acessar o painel de transmissões.</p>
            </div>

            {isUnauthorizedDomain && (
              <div className="p-4 bg-blue-950/40 border border-blue-500/30 rounded-2xl text-left space-y-3">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-[var(--ink-hi)] text-sm">Autenticação Google no Ambiente Web</p>
                    <p className="text-[var(--ink)] leading-relaxed">
                      O Firebase Authentication requer que este domínio esteja cadastrado em <strong>Domínios Autorizados</strong> no Firebase Console para abrir o pop-up nativo.
                    </p>
                  </div>
                </div>

                <div className="bg-[var(--bg)]/80 p-2.5 rounded-xl border border-[var(--line)] flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-[var(--ink)] truncate select-all">{typeof window !== 'undefined' ? window.location.hostname : ''}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        copyText(window.location.hostname);
                        setDomainCopied(true);
                        setTimeout(() => setDomainCopied(false), 2000);
                      }
                    }}
                    className="px-2.5 py-1 bg-[var(--panel)] hover:bg-[var(--raise)] text-[0.625rem] font-bold text-[var(--ink-hi)] rounded-lg flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    <Copy size={12} />
                    {domainCopied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>

                {/* Login sem credencial numa conta nomeada. A condicao era so
                      isUnauthorizedDomain — qualquer dominio fora da lista do
                      Firebase: preview de deploy, staging, dominio novo. Agora sai do
                      build de producao. */}

                {IS_DEV && <button
                  type="button"
                  onClick={() => handleDirectDevLogin('mgdlms@gmail.com', 'Marcos Gonçalves')}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>Entrar agora como Marcos Gonçalves (mgdlms@gmail.com)</span>
                  <ArrowRight size={14} />
                </button>}
              </div>
            )}

            {authError && (
              <div role="alert" className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 bg-[var(--panel)] hover:bg-[var(--raise)] border border-[var(--line-ctl)] rounded-xl text-sm font-bold transition-all text-[var(--ink-hi)] flex items-center justify-center gap-2 cursor-pointer mb-4"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"/>
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
              </svg>
              Entrar com Google
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[var(--line)]"></div>
              <span className="flex-shrink mx-3 text-[0.625rem] text-[var(--ink-dim)] font-bold uppercase">ou e-mail</span>
              <div className="flex-grow border-t border-[var(--line)]"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label htmlFor="campo-0-e-mail" className="text-xs font-semibold text-[var(--ink-lo)]">E-mail</label>
                <input autoComplete="email" id="campo-0-e-mail" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com" 
                  className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink-hi)] focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="campo-1-senha" className="text-xs font-semibold text-[var(--ink-lo)]">Senha</label>
                  {/* Aqui havia um link "Esqueceu a senha?" apontando para
                      #forgot, uma âncora que não existe. Não há fluxo de
                      recuperação implementado, então o link prometia algo que
                      o produto não faz. Volta quando o fluxo existir. */}
                </div>
                <input autoComplete="current-password" id="campo-1-senha" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink-hi)] focus:border-blue-500 transition-colors"
                />
              </div>

              <Button type="submit" loading={isSubmittingAuth} className="w-full">
                {isSubmittingAuth ? 'Entrando...' : <>Entrar no Estúdio <LogIn size={16} /></>}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-xs text-[var(--ink-lo)]">
                Não tem uma conta? <button onClick={() => setView('register')} className="text-blue-400 hover:underline">Inscreva-se grátis</button>
              </p>
            </div>
          </div>
        )}

        {/* VIEW 3: REGISTER VIEW */}
        {view === 'register' && (
          <div className="w-full max-w-md bg-[var(--surface)]/80 border border-[var(--line)] p-8 rounded-3xl space-y-6 animate-in fade-in duration-200" id="register-view">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-[var(--ink-hi)] font-sans">Crie sua Conta Grátis</h1>
              <p className="text-xs text-[var(--ink-lo)]">Cadastre-se para aproveitar 30 dias de teste grátis com acesso total ao estúdio.</p>
            </div>

            {authError && (
              <div role="alert" className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label htmlFor="campo-2-nome-completo" className="text-xs font-semibold text-[var(--ink-lo)]">Nome Completo</label>
                <input autoComplete="name" id="campo-2-nome-completo" 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo" 
                  required
                  className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink-hi)] focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="campo-3-e-mail-corporativo-o" className="text-xs font-semibold text-[var(--ink-lo)]">E-mail Corporativo ou Pessoal</label>
                <input autoComplete="email" id="campo-3-e-mail-corporativo-o" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com" 
                  required
                  className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink-hi)] focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="campo-4-senha" className="text-xs font-semibold text-[var(--ink-lo)]">Senha</label>
                <input autoComplete="new-password" id="campo-4-senha" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                  className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink-hi)] focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex items-start gap-2 pt-1 text-xs text-[var(--ink-lo)]">
                <input type="checkbox" id="terms" required className="mt-0.5 rounded border-[var(--line)] bg-[var(--bg)] text-blue-500 cursor-pointer" />
                <label htmlFor="terms" className="cursor-pointer">Aceito os termos de serviço e políticas de privacidade.</label>
              </div>

              {/* Antes: gradiente azul-para-índigo, sombra colorida azul e
                  hover:scale sem gate de ponteiro, com um rótulo de sete
                  palavras que quebrava em duas linhas. O prazo de teste
                  agora fica na frase abaixo do botão, que é onde ele informa
                  sem competir com a ação. O rótulo é o mesmo "Criar conta"
                  usado no menu: um rótulo por intenção. */}
              {/* O `hover:scale-[1.01]` que estava aqui saiu: o sistema move
                  brilho, não geometria. Botão que cresce ao passar o mouse é
                  o mesmo vocabulário que a passada de movimento removeu das
                  confirmações. */}
              <Button type="submit" loading={isSubmittingAuth} className="w-full">
                {isSubmittingAuth ? 'Criando conta...' : <>Criar conta <ArrowRight size={16} /></>}
              </Button>
              <p className="text-xs text-[var(--ink-dim)] text-center">
                30 dias de teste. Sem cartão de crédito.
              </p>

              <div className="text-center pt-1">
                <button 
                  type="button" 
                  onClick={() => setView('pricing')} 
                  className="text-xs text-blue-400/80 hover:text-blue-300 hover:underline cursor-pointer"
                >
                  Deseja assinar um plano direto? Ver planos e preços →
                </button>
              </div>
            </form>

            <div className="text-center pt-2 border-t border-[var(--line)]/40">
              <p className="text-xs text-[var(--ink-lo)]">
                Já tem uma conta? <button onClick={() => setView('login')} className="text-blue-400 hover:underline">Log In</button>
              </p>
            </div>
          </div>
        )}

        {/* VIEW 4: PRICING PLANS VIEW (Inspired by Print 2: Upgrade Page) */}
        {view === 'pricing' && (
          <div className="w-full max-w-6xl mx-auto space-y-10 text-center animate-in fade-in duration-200" id="pricing-view">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--ink-hi)]">
                Upgrade to grow and engage your audience
              </h1>
              <p className="text-sm text-[var(--ink-lo)] max-w-xl mx-auto">
                Escolha o plano ideal para as suas transmissões. Comece com nosso plano de testes gratuito ou assine um plano pago para liberar canais adicionais.
              </p>

              {/* Monthly vs Annual Toggle */}
              <div className="inline-flex items-center gap-2 p-1 bg-[var(--surface)] border border-[var(--line)] rounded-xl mt-4">
                <button 
                  type="button"
                  aria-pressed={!isAnnual}
                  onClick={() => setIsAnnual(false)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isAnnual ? 'bg-[var(--color-brand-deep)] text-white' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'}`}
                >
                  Mensal
                </button>
                <button 
                  type="button"
                  aria-pressed={isAnnual}
                  onClick={() => setIsAnnual(true)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${isAnnual ? 'bg-[var(--color-brand-deep)] text-white' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'}`}
                >
                  Anual <span className="text-[0.625rem] bg-green-500/20 text-green-400 px-1 py-0.5 rounded border border-green-500/10">Economize 20%</span>
                </button>
              </div>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
              {plansData.map((plan) => {
                const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
                const isSelected = selectedPlan === plan.id;
                
                return (
                  <div 
                    key={plan.id}
                    className={`bg-[var(--surface)]/60 border rounded-2xl p-6 flex flex-col justify-between relative transition-all ${
                      plan.popular 
                        ? 'border-blue-500 shadow-xl shadow-blue-500/5 ring-1 ring-blue-400/20' 
                        : 'border-[var(--line)] hover:border-[var(--line-ctl)]'
                    }`}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <span className={`absolute -top-3 right-4 px-2.5 py-1 text-[0.625rem] font-black uppercase rounded-full border ${
                        plan.popular 
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                          : 'bg-[var(--panel)] text-[var(--ink-lo)] border-[var(--line-ctl)]'
                      }`}>
                        {plan.badge}
                      </span>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-[var(--ink-hi)] font-sans">{plan.name}</h3>
                        <p className="text-xs text-[var(--ink-dim)] mt-1 min-h-[32px]">{plan.description}</p>
                      </div>

                      <div className="py-2 border-y border-[var(--line)]/60">
                        <span className="text-3xl font-black text-[var(--ink-hi)] font-mono tabular-nums">
                          {price === 0 ? 'Grátis' : formatPrice(price)}
                        </span>
                        <span className="text-xs text-[var(--ink-lo)] font-semibold"> /mês</span>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        className={`w-full py-3 text-xs font-bold rounded-xl transition-all ${
                          plan.id === 'Free Trial'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/20'
                            : plan.popular
                              ? 'bg-[var(--color-brand-deep)] hover:bg-blue-600 text-white shadow-lg shadow-blue-950/20'
                              : 'bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] text-[var(--ink-hi)]'
                        }`}
                      >
                        {plan.id === 'Free Trial' ? 'Iniciar 30 Dias Grátis' : 'Selecionar Plano'}
                      </button>

                      {/* Features checklist */}
                      <div className="pt-4 space-y-2.5">
                        <p className="text-[0.625rem] uppercase font-bold text-[var(--ink-dim)] tracking-wide">Recursos incluídos:</p>
                        {plan.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            <Check size={14} className="text-blue-500 mt-0.5 shrink-0" />
                            <span className="text-[var(--ink)] leading-tight">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {plan.id === 'Free Trial' && (
                      <div className="mt-6 p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-[0.625rem] text-emerald-400 text-center flex items-center gap-1.5 justify-center">
                        <Shield size={12} />
                        <span>Não requer cartão de crédito</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-6 text-xs text-[var(--ink-dim)] flex items-center justify-center gap-1">
              <span>Garantia de reembolso de 7 dias • Transmita para múltiplos canais instantaneamente • Dúvidas?</span>
              <button className="text-blue-400 hover:underline flex items-center gap-0.5">Fale conosco <HelpCircle size={12} /></button>
            </div>
          </div>
        )}

        {/* VIEW 5: CHECKOUT / PAYMENT FORM SIMULATION */}
        {view === 'checkout' && (
          <div className="w-full max-w-lg bg-[var(--surface)]/80 border border-[var(--line)] p-8 rounded-3xl space-y-6 animate-in fade-in duration-200" id="checkout-view">
            
            {/* Header / Step Progress */}
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
              <div className="text-left space-y-1">
                <span className="text-[0.625rem] uppercase font-bold text-blue-500">Checkout Seguro</span>
                <h1 className="text-xl font-bold text-[var(--ink-hi)]">Finalizar Assinatura</h1>
              </div>
              <div className="text-right">
                <span className="text-xs text-[var(--ink-lo)]">Plano Selecionado</span>
                <p className="text-sm font-bold text-blue-400">{selectedPlan} - {isAnnual ? 'Anual' : 'Mensal'}</p>
              </div>
            </div>

            {checkoutError && (
              <div role="alert" className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Gateway tab selection buttons */}
            <div {...gatewayAbas.tablist} aria-label="Forma de pagamento" className="grid grid-cols-3 gap-2">
              <button
                type="button"
                {...gatewayAbas.tab('stripe')}
                onClick={() => selecionarGateway('stripe')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  selectedGateway === 'stripe' 
                    ? 'bg-blue-500/10 border-blue-500 text-[var(--ink-hi)]' 
                    : 'bg-[var(--bg)] border-[var(--line)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                }`}
              >
                Stripe
              </button>
              <button
                type="button"
                {...gatewayAbas.tab('paypal')}
                onClick={() => selecionarGateway('paypal')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  selectedGateway === 'paypal' 
                    ? 'bg-blue-500/10 border-blue-500 text-[var(--ink-hi)]' 
                    : 'bg-[var(--bg)] border-[var(--line)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                }`}
              >
                PayPal
              </button>
              <button
                type="button"
                {...gatewayAbas.tab('mercadopago')}
                onClick={() => selecionarGateway('mercadopago')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  selectedGateway === 'mercadopago' 
                    ? 'bg-blue-500/10 border-blue-500 text-[var(--ink-hi)]' 
                    : 'bg-[var(--bg)] border-[var(--line)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                }`}
              >
                Mercado Pago
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-left">
              
              {/* RENDER STRIPE GATEWAY */}
              {selectedGateway === 'stripe' && (
                <div {...gatewayAbas.panel('stripe')} className="space-y-4">
                  {/* Credencial de teste é ferramenta de desenvolvimento, não
                      informação de produto: sai do build de produção.
                      O AVISO de que não há cobrança real continua visível para
                      todo mundo — ver o rodapé do formulário. Esconder o aviso
                      enquanto o pagamento segue simulado não corrige nada:
                      troca uma simulação declarada por uma que finge cobrar. */}
                  {IS_DEV && <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-1.5">
                    <p className="text-[0.625rem] text-[var(--ink-lo)]">
                      Ambiente de desenvolvimento. Preenchimento automático do cartão de teste Stripe:
                    </p>
                    <div className="flex items-center justify-between bg-[var(--bg)] p-2 rounded-lg text-[0.625rem] font-mono border border-[var(--line)]/60">
                      <span className="text-[var(--ink-hi)]">4242 4242 4242 4242 | MM/AA: 12/29 | CVV: 424</span>
                      <button 
                        type="button"
                        onClick={() => {
                          setCardNumber('4242 4242 4242 4242');
                          setCardExpiry('12/29');
                          setCardCvc('424');
                          setCardName('MARCOS GONÇALVES');
                        }}
                        className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-[0.625rem] font-sans font-bold"
                      >
                        Preencher
                      </button>
                    </div>
                  </div>}

                  <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-2xl space-y-3">
                    <div className="space-y-1">
                      <label htmlFor="campo-6-numero-do-cartao" className="text-[0.625rem] uppercase font-bold text-[var(--ink-dim)]">Número do Cartão</label>
                      <input autoComplete="cc-number" id="campo-6-numero-do-cartao" 
                        type="text" 
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-xs font-mono text-[var(--ink-hi)]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="campo-7-validade" className="text-[0.625rem] uppercase font-bold text-[var(--ink-dim)]">Validade</label>
                        <input autoComplete="cc-exp" id="campo-7-validade" 
                          type="text" 
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/AA" 
                          className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-xs font-mono text-[var(--ink-hi)]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="campo-8-cvc" className="text-[0.625rem] uppercase font-bold text-[var(--ink-dim)]">CVC</label>
                        <input autoComplete="cc-csc" id="campo-8-cvc" 
                          type="password" 
                          required
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="424" 
                          maxLength={4}
                          className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-xs font-mono text-[var(--ink-hi)]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="campo-9-nome-do-titular" className="text-[0.625rem] uppercase font-bold text-[var(--ink-dim)]">Nome do Titular</label>
                      <input autoComplete="cc-name" id="campo-9-nome-do-titular" 
                        type="text" 
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        placeholder="NOME COMO NO CARTÃO" 
                        className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-xs text-[var(--ink-hi)] uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* RENDER PAYPAL GATEWAY */}
              {selectedGateway === 'paypal' && (
                <div {...gatewayAbas.panel('paypal')} className="space-y-4">
                  <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-xs text-[var(--ink-lo)]">
                    Aprovação simulada na carteira PayPal. Autentique-se na conta de testes:
                  </div>

                  <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-2xl space-y-3">
                    <div className="space-y-1">
                      <label htmlFor="campo-10-paypal-sandbox-e-mai" className="text-[0.625rem] uppercase font-bold text-[var(--ink-dim)]">PayPal Sandbox E-mail</label>
                      <input autoComplete="off" id="campo-10-paypal-sandbox-e-mai" 
                        type="email" 
                        required
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-xs text-[var(--ink-hi)] font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="campo-11-senha" className="text-[0.625rem] uppercase font-bold text-[var(--ink-dim)]">Senha</label>
                      <input autoComplete="off" id="campo-11-senha" 
                        type="password" 
                        required
                        value={paypalPassword}
                        onChange={(e) => setPaypalPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-xs text-[var(--ink-hi)] font-mono"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPaypalAuthorized(true);
                        toast.success('PayPal Sandbox: Login autenticado com sucesso!');
                      }}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                        isPaypalAuthorized 
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                          : 'bg-[#FFC439] hover:bg-[#ffcf5c] text-slate-950'
                      }`}
                    >
                      {isPaypalAuthorized ? '✓ Autorizado no PayPal' : 'Entrar e Autorizar PayPal Sandbox'}
                    </button>
                  </div>
                </div>
              )}

              {/* RENDER MERCADO PAGO GATEWAY */}
              {selectedGateway === 'mercadopago' && (
                <div {...gatewayAbas.panel('mercadopago')} className="space-y-4">
                  
                  {/* Mercado Pago method tabs */}
                  <div className="flex bg-[var(--bg)] border border-[var(--line)] rounded-xl p-1">
                    <button
                      type="button"
                      aria-pressed={mpMethod === 'pix'}
                      onClick={() => setMpMethod('pix')}
                      className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all ${
                        mpMethod === 'pix' ? 'bg-[var(--color-brand-deep)] text-white' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                      }`}
                    >
                      PIX Nacional
                    </button>
                    <button
                      type="button"
                      aria-pressed={mpMethod === 'card'}
                      onClick={() => setMpMethod('card')}
                      className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all ${
                        mpMethod === 'card' ? 'bg-[var(--color-brand-deep)] text-white' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                      }`}
                    >
                      Cartão de Crédito
                    </button>
                  </div>

                  {mpMethod === 'pix' ? (
                    <div className="p-4 bg-[var(--bg)] rounded-2xl border border-[var(--line)] text-center space-y-4">
                      <div className="flex justify-center">
                        <div className="p-2.5 bg-white rounded-xl">
                          <QrCode size={120} className="text-slate-950" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="authandpricing-chave-pix-simulada" className="block text-xs font-bold text-[var(--ink-hi)]">Chave PIX Simulada</label>
                        <p className="text-[0.625rem] text-[var(--ink-dim)]">Escaneie ou copie a chave de testes abaixo.</p>
                      </div>

                      <div className="flex items-center gap-2 bg-[var(--surface)] p-2 rounded-xl border border-[var(--line)]">
                        <input id="authandpricing-chave-pix-simulada" 
                          type="text" 
                          readOnly 
                          value="00020126580014br.gov.bcb.pix0136pwstreamer-mercado-pago-sandbox-key-98" 
                          className="bg-transparent text-[0.625rem] text-[var(--ink-lo)] select-all font-mono flex-1 truncate"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPixCopied(true);
                            copyText("00020126580014br.gov.bcb.pix0136pwstreamer-mercado-pago-sandbox-key-98");
                            setTimeout(() => setPixCopied(false), 2000);
                          }}
                          className="px-2.5 py-1 bg-[var(--color-brand-deep)] hover:bg-blue-600 text-white rounded text-[0.625rem] font-bold shrink-0"
                        >
                          {pixCopied ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-1.5">
                        <p className="text-[0.625rem] text-[var(--ink-lo)]">Cartão de testes do Mercado Pago:</p>
                        <div className="flex items-center justify-between bg-[var(--bg)] p-2 rounded-lg text-[0.625rem] font-mono border border-[var(--line)]/60">
                          <span className="text-[var(--ink-hi)]">5031 4000 1234 5678 | CVV: 123</span>
                          <button 
                            type="button"
                            onClick={() => {
                              setCardNumber('5031 4000 1234 5678');
                              setCardExpiry('08/28');
                              setCardCvc('123');
                              setCardName('MARCOS GONÇALVES');
                            }}
                            className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-[0.625rem] font-sans font-bold"
                          >
                            Preencher
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-2xl space-y-3">
                        <div className="space-y-1">
                          <label htmlFor="campo-12-numero-do-cartao" className="text-[0.625rem] uppercase font-bold text-[var(--ink-dim)]">Número do Cartão</label>
                          <input autoComplete="cc-number" id="campo-12-numero-do-cartao" 
                            type="text" 
                            required
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-xs font-mono text-[var(--ink-hi)]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label htmlFor="campo-13-validade" className="text-[0.625rem] uppercase font-bold text-[var(--ink-dim)]">Validade</label>
                            <input autoComplete="cc-exp" id="campo-13-validade" 
                              type="text" 
                              required
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-xs font-mono text-[var(--ink-hi)]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="campo-14-cvc" className="text-[0.625rem] uppercase font-bold text-[var(--ink-dim)]">CVC</label>
                            <input autoComplete="cc-csc" id="campo-14-cvc" 
                              type="password" 
                              required
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value)}
                              placeholder="123" 
                              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-xs font-mono text-[var(--ink-hi)]"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="campo-15-nome-no-cartao" className="text-[0.625rem] uppercase font-bold text-[var(--ink-dim)]">Nome no Cartão</label>
                          <input autoComplete="cc-name" id="campo-15-nome-no-cartao" 
                            type="text" 
                            required
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-xs text-[var(--ink-hi)] uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Order total card */}
              <div className="bg-[var(--surface)]/40 p-3.5 rounded-xl border border-[var(--line)]/60 space-y-1.5 text-xs text-[var(--ink)]">
                {/* Este resumo imprimia $14.00 / $29.00 / $49.00 em dólar,
                    enquanto a vitrine anunciava R$ 49,90 / 99,90 / 199,90 pelo
                    MESMO plano. Era a quinta copia do preco, e a unica que o
                    comprador via no momento de pagar. Agora sai da fonte. */}
                <div className="flex justify-between font-bold">
                  <span>Subtotal do plano:</span>
                  <span className="tabular-nums">{formatPrice(getPlan(selectedPlan ?? 'Standard')!.priceMonthly)}</span>
                </div>
                <div className="flex justify-between text-[var(--ink-dim)]">
                  <span>Desconto de teste:</span>
                  <span className="tabular-nums">{formatPrice(0)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-blue-400 border-t border-[var(--line)]/60 pt-1.5 mt-1.5 text-sm">
                  <span>Total Cobrado:</span>
                  <span className="tabular-nums">{formatPrice(getPlan(selectedPlan ?? 'Standard')!.priceMonthly)} / mês</span>
                </div>
              </div>

              {/* Era "Simulação segura" com um tique verde — o vocabulário de
                  "deu certo" para avisar que NADA é cobrado. Um comprador lê
                  tique verde como confirmação, não como ressalva.
                  A auditoria propôs esconder este aviso em produção. O
                  contrário: enquanto a cobrança não for real, escondê-lo
                  transforma uma simulação declarada numa tela que finge
                  cobrar. O aviso fica, e fica legível. Quando o pagamento for
                  real, ele sai junto com a simulação — não antes. */}
              <div className="flex items-start gap-2 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-200 p-3 rounded-xl">
                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-bold text-[var(--ink-hi)]">Nenhuma cobrança será feita.</strong>{' '}
                  Este checkout ainda não processa pagamento real — o plano é ativado na sua conta
                  para demonstração e nenhum valor é debitado do seu cartão ou conta.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={() => setView('pricing')}
                  className="py-3 bg-[var(--bg)] border border-[var(--line)] hover:bg-[var(--surface)] rounded-xl text-xs font-bold transition-all text-[var(--ink-hi)] text-center"
                >
                  Voltar
                </button>
                <button 
                  type="submit"
                  disabled={isProcessingCheckout || (selectedGateway === 'paypal' && !isPaypalAuthorized)}
                  className="py-3 bg-[var(--color-brand-deep)] hover:bg-blue-600 disabled:opacity-50 rounded-xl text-xs font-bold transition-all text-white flex items-center justify-center gap-2"
                >
                  {isProcessingCheckout ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Processando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Confirmar Pagamento <Check size={16} />
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Auth Footer */}
      <footer className="relative z-10 py-6 border-t border-[var(--line)]/60 bg-[var(--bg)]/80 text-xs text-[var(--ink-dim)] text-center space-y-2">
        <p>© 2026 PW Stream Online. Todos os direitos reservados.</p>
        <div className="flex justify-center gap-4 text-[var(--ink-lo)]">
          <button 
            type="button"
            onClick={() => { setLegalModalType('terms'); setLegalModalOpen(true); }}
            className="hover:text-[var(--ink-hi)] transition-colors cursor-pointer"
          >
            Termos de Uso
          </button>
          <span>•</span>
          <button 
            type="button"
            onClick={() => { setLegalModalType('privacy'); setLegalModalOpen(true); }}
            className="hover:text-[var(--ink-hi)] transition-colors cursor-pointer"
          >
            Política de Privacidade
          </button>
        </div>
      </footer>

      {/* Legal Modal overlay */}
      <LegalModal 
        isOpen={legalModalOpen}
        type={legalModalType}
        onClose={() => setLegalModalOpen(false)}
      />
    </div>
  );
}
