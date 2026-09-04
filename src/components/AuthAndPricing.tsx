import React, { useState } from 'react';
import { 
  Check, LogIn, UserPlus, CreditCard, ArrowRight, Lock, 
  CheckCircle2, Sparkles, Shield, AlertTriangle, Play, HelpCircle, QrCode,
  Copy, ExternalLink, ShieldCheck
} from 'lucide-react';
import { PwStreamLogo } from './PwStreamLogo';
import { LegalModal } from './LegalModals';
import { loginWithGoogle, createDirectUserProfile } from '../lib/firestoreService';

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
  const [view, setView] = useState<'landing' | 'pricing' | 'login' | 'register' | 'checkout'>(initialView);
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

  // Checkout inputs
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/29');
  const [cardCvc, setCardCvc] = useState('424');
  const [cardName, setCardName] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'paypal' | 'mercadopago'>('stripe');
  const [paypalEmail, setPaypalEmail] = useState('marcos-test@pwstreamer.com');
  const [paypalPassword, setPaypalPassword] = useState('••••••••••');
  const [isPaypalAuthorized, setIsPaypalAuthorized] = useState(false);
  const [mpMethod, setMpMethod] = useState<'pix' | 'card'>('pix');
  const [pixCopied, setPixCopied] = useState(false);

  // Pricing descriptions
  const plansData = [
    {
      id: 'Free Trial' as const,
      name: 'Plano Gratuito',
      priceMonthly: 0,
      priceAnnual: 0,
      badge: 'Teste sem compromisso',
      buttonText: 'Iniciar 30 Dias Grátis',
      description: 'Experimente a potência máxima da plataforma gratuitamente.',
      features: [
        'Acesso completo ao estúdio de transmissão',
        '30 dias de teste gratuito',
        'Até 3 participantes simultâneos',
        'Conecte o OBS, vMix, etc.',
        'Gravação de até 15 minutos por live',
        'Transmissão para até 2 destinos',
        'Aviso de renovação opcional'
      ],
      popular: false
    },
    {
      id: 'Standard' as const,
      name: 'Plano Standard',
      priceMonthly: 14,
      priceAnnual: 11,
      badge: 'Para Criadores',
      buttonText: 'Selecionar Plano',
      description: 'Para criadores e streamers independentes que buscam consistência.',
      features: [
        'Transmissão simultânea para 3 canais',
        'Destinos RTMP personalizados',
        'Compartilhamento de tela',
        'Conecte o OBS, vMix, etc.',
        'Gravações na nuvem',
        'Sem marca d\'água da plataforma',
        'Logos, fontes e gráficos personalizados',
        '3 horas da transmissão ao vivo',
        'Até 6 participantes na tela ao vivo',
        'Qualidade máxima 780p',
        'Transmissão em formato Paisagem + Retrato',
        'Teleprompter'
      ],
      popular: false
    },
    {
      id: 'Professional' as const,
      name: 'Plano Pro',
      priceMonthly: 29,
      priceAnnual: 24,
      badge: 'Melhor Custo-Benefício',
      buttonText: 'Selecionar Plano',
      description: 'Melhor custo-benefício para profissionais e estúdios de gravação.',
      features: [
        'Transmissão simultânea para 5 canais',
        'Destinos RTMP personalizados',
        'Compartilhamento de tela',
        'Conecte o OBS, vMix, etc.',
        'Gravações na nuvem',
        'Sem marca d\'água da plataforma',
        'Logos, fontes e gráficos personalizados',
        '6 horas da transmissão ao vivo',
        'Até 8 participantes na tela ao vivo',
        'Qualidade máxima Full HD 1080p',
        'Transmissão em formato Paisagem + Retrato',
        'Teleprompter',
        'Fluxo incorporado'
      ],
      popular: true
    },
    {
      id: 'Business' as const,
      name: 'Business',
      priceMonthly: 49,
      priceAnnual: 40,
      badge: 'Corporativo',
      buttonText: 'Selecionar Plano',
      description: 'Para agências, marcas de renome e grandes empresas.',
      features: [
        'Transmissão simultânea para 8 canais',
        'Destinos RTMP personalizados',
        'Compartilhamento de tela',
        'Conecte o OBS, vMix, etc.',
        'Gravações na nuvem',
        'Sem marca d\'água da plataforma',
        'Logos, fontes e gráficos personalizados',
        '10 horas da transmissão ao vivo',
        'Até 12 participantes na tela ao vivo',
        'Qualidade máxima Full HD 1080p',
        'Transmissão em formato Paisagem + Retrato',
        'Teleprompter',
        'Vendas ao vivo',
        'Fluxo incorporado',
        'Múltiplas câmeras'
      ],
      popular: false
    }
  ];

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
    if (!email || !password) {
      setAuthError('Por favor, preencha todos os campos.');
      return;
    }
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
    if (!email || !password || !name) {
      setAuthError('Por favor, preencha todos os campos.');
      return;
    }
    // Entra diretamente na conta com 30 dias de teste grátis
    onAuthSuccess({
      email,
      name,
      plan: 'Free Trial',
      isExpired: false,
      trialDays: 30
    });
  };

  const handleSelectPlan = (planId: 'Standard' | 'Professional' | 'Business' | 'Free Trial') => {
    setSelectedPlan(planId);
    if (planId === 'Free Trial') {
      // Free trial goes directly to studio
      onAuthSuccess({
        email: email || 'mgdlms@pwstreamer.com',
        name: name || 'Marcos Gonçalves',
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
        email: email || 'mgdlms@pwstreamer.com',
        name: name || 'Marcos Gonçalves',
        plan: selectedPlan || 'Standard',
        isExpired: false,
        trialDays: 30 // Paid plan is unlimited, but we keep active
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden" id="auth-pricing-panel">
      {/* Background Star Lines Aesthetics (Styled like Restream Print 1 background) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-0.5 h-[600px] bg-gradient-to-b from-blue-500/40 via-transparent to-transparent" />
        {/* Radiant lines coming from top red dot */}
        <div className="absolute top-36 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full blur-[4px]" />
        <div className="absolute top-36 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        <svg className="absolute top-36 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] stroke-slate-800/40 stroke-[0.5] fill-none" viewBox="0 0 1200 700">
          <path d="M600,0 L100,700 M600,0 L200,700 M600,0 L300,700 M600,0 L400,700 M600,0 L500,700 M600,0 L600,700 M600,0 L700,700 M600,0 L800,700 M600,0 L900,700 M600,0 L1000,700 M600,0 L1100,700" />
        </svg>
      </div>

      {/* Header Logo Navbar */}
      <header className="relative z-10 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PwStreamLogo iconSize={32} textSize="sm" />
          <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">RESTREAM MODE</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-gray-400">
          <button onClick={() => setView('landing')} className="hover:text-white transition-colors">Início</button>
          <button onClick={() => setView('pricing')} className="hover:text-white transition-colors">Planos</button>
          <button onClick={() => setView('login')} className="px-3.5 py-1.5 border border-slate-800 rounded-lg hover:bg-slate-900 transition-colors text-white">Log In</button>
          <button onClick={() => setView('register')} className="px-3.5 py-1.5 bg-[#4683E0] rounded-lg hover:bg-blue-600 transition-all text-white">Sign Up</button>
        </div>
      </header>

      {/* Main View Switcher */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-7xl mx-auto w-full">
        
        {/* VIEW 1: RESTREAM LANDING PAGE (Print 1 Inspired) */}
        {view === 'landing' && (
          <div className="text-center space-y-12 max-w-4xl mx-auto animate-in fade-in duration-200" id="landing-view">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
                <Sparkles size={14} /> Webinar & Streaming Dashboard de Alta Performance
              </span>
              <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-none">
                One live video <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">30+ destinations</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto uppercase tracking-wider font-semibold leading-relaxed">
                Restream helps you to go live on multiple platforms at the same time, and turn your streams into vertical short videos
              </p>
            </div>

            {/* Actions Panel */}
            <div className="space-y-4 max-w-md mx-auto">
              {isUnauthorizedDomain && (
                <div className="p-4 bg-blue-950/40 border border-blue-500/30 rounded-2xl text-left space-y-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck size={18} className="text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-white text-sm">Autenticação Google no Ambiente Web</p>
                      <p className="text-gray-300 leading-relaxed">
                        O Firebase Authentication requer que este domínio esteja cadastrado em <strong>Domínios Autorizados</strong> no Firebase Console para abrir o pop-up nativo.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-gray-300 truncate select-all">{typeof window !== 'undefined' ? window.location.hostname : ''}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard.writeText(window.location.hostname);
                          setDomainCopied(true);
                          setTimeout(() => setDomainCopied(false), 2000);
                        }
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-white rounded-lg flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    >
                      <Copy size={12} />
                      {domainCopied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDirectDevLogin('mgdlms@gmail.com', 'Marcos Gonçalves')}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Entrar agora como Marcos Gonçalves (mgdlms@gmail.com)</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {authError && (
                <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2 text-left">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#4683E0] to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Entrar com Google <ArrowRight size={16} />
                </button>
                <button 
                  onClick={() => setView('register')}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Criar Conta Grátis
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 font-medium">
              Conta existente? <button onClick={() => setView('login')} className="text-blue-400 hover:underline">Entre aqui</button>
            </p>

            {/* Quick Pricing Preview Grid */}
            <div className="pt-16 border-t border-slate-900/80">
              <p className="text-xs uppercase font-extrabold text-gray-500 tracking-wider mb-6">Nossos Planos de Transmissão Profissional</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                {[
                  { name: 'Standard', price: '$14', desc: 'Perfeito para canais independentes.', label: '3 canais simultâneos' },
                  { name: 'Professional', price: '$29', desc: 'Qualidade máxima e ferramentas pro.', label: '5 canais + Co-produtores' },
                  { name: 'Business', price: '$49', desc: 'Espaço de equipe e proteção de stream.', label: '8 canais + SRT profissional' }
                ].map((p, i) => (
                  <div key={i} className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl space-y-3 relative group hover:border-blue-500/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-base">{p.name}</h3>
                      <span className="text-xs text-[#4683E0] font-black">{p.label}</span>
                    </div>
                    <div>
                      <span className="text-2xl font-black text-white">{p.price}</span>
                      <span className="text-xs text-gray-500 font-bold"> /mês</span>
                    </div>
                    <p className="text-xs text-gray-400">{p.desc}</p>
                    <button 
                      onClick={() => {
                        setSelectedPlan(p.name as any);
                        setView('register');
                      }} 
                      className="w-full py-2 bg-slate-950 hover:bg-[#4683E0] text-xs font-bold rounded-lg border border-slate-800 group-hover:border-transparent transition-colors text-center"
                    >
                      Assinar Plano
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                <button 
                  onClick={() => setView('pricing')} 
                  className="text-xs text-blue-400 font-semibold flex items-center gap-1 hover:underline"
                >
                  Ver tabela comparativa de todos os planos <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: LOGIN VIEW */}
        {view === 'login' && (
          <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 p-8 rounded-3xl space-y-6 animate-in fade-in duration-200" id="login-view">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Bem-vindo de volta!</h2>
              <p className="text-xs text-gray-400">Insira suas credenciais para acessar o painel de transmissões.</p>
            </div>

            {isUnauthorizedDomain && (
              <div className="p-4 bg-blue-950/40 border border-blue-500/30 rounded-2xl text-left space-y-3">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-white text-sm">Autenticação Google no Ambiente Web</p>
                    <p className="text-gray-300 leading-relaxed">
                      O Firebase Authentication requer que este domínio esteja cadastrado em <strong>Domínios Autorizados</strong> no Firebase Console para abrir o pop-up nativo.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-gray-300 truncate select-all">{typeof window !== 'undefined' ? window.location.hostname : ''}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(window.location.hostname);
                        setDomainCopied(true);
                        setTimeout(() => setDomainCopied(false), 2000);
                      }
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-white rounded-lg flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    <Copy size={12} />
                    {domainCopied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDirectDevLogin('mgdlms@gmail.com', 'Marcos Gonçalves')}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>Entrar agora como Marcos Gonçalves (mgdlms@gmail.com)</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {authError && (
              <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-bold transition-all text-white flex items-center justify-center gap-2 cursor-pointer mb-4"
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
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] text-gray-500 font-bold uppercase">ou e-mail</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-gray-400">E-mail</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mgdlms@pwstreamer.com" 
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] uppercase font-bold text-gray-400">Senha</label>
                  <a href="#forgot" className="text-[10px] text-blue-400 hover:underline">Esqueceu a senha?</a>
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-[#4683E0] hover:bg-blue-600 rounded-xl text-sm font-bold transition-all text-white flex items-center justify-center gap-2"
              >
                Entrar no Estúdio <LogIn size={16} />
              </button>
            </form>

            <div className="text-center">
              <p className="text-xs text-gray-400">
                Não tem uma conta? <button onClick={() => setView('register')} className="text-blue-400 hover:underline">Inscreva-se grátis</button>
              </p>
            </div>
          </div>
        )}

        {/* VIEW 3: REGISTER VIEW */}
        {view === 'register' && (
          <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 p-8 rounded-3xl space-y-6 animate-in fade-in duration-200" id="register-view">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white font-sans">Crie sua Conta Grátis</h2>
              <p className="text-xs text-gray-400">Cadastre-se para aproveitar 30 dias de teste grátis com acesso total ao estúdio.</p>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-gray-400">Nome Completo</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Marcos Gonçalves" 
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-gray-400">E-mail Corporativo ou Pessoal</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mgdlms@pwstreamer.com" 
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-gray-400">Senha</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex items-start gap-2 pt-1 text-[11px] text-gray-400">
                <input type="checkbox" id="terms" required className="mt-0.5 rounded border-slate-800 bg-slate-950 text-blue-500 cursor-pointer" />
                <label htmlFor="terms" className="cursor-pointer">Aceito os termos de serviço e políticas de privacidade.</label>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-sm font-bold transition-all text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                Cadastrar e Iniciar 30 Dias de Teste Grátis <ArrowRight size={16} />
              </button>

              <div className="text-center pt-1">
                <button 
                  type="button" 
                  onClick={() => setView('pricing')} 
                  className="text-[11px] text-blue-400/80 hover:text-blue-300 hover:underline cursor-pointer"
                >
                  Deseja assinar um plano direto? Ver planos e preços →
                </button>
              </div>
            </form>

            <div className="text-center pt-2 border-t border-slate-800/40">
              <p className="text-xs text-gray-400">
                Já tem uma conta? <button onClick={() => setView('login')} className="text-blue-400 hover:underline">Log In</button>
              </p>
            </div>
          </div>
        )}

        {/* VIEW 4: PRICING PLANS VIEW (Inspired by Print 2: Upgrade Page) */}
        {view === 'pricing' && (
          <div className="w-full max-w-6xl mx-auto space-y-10 text-center animate-in fade-in duration-200" id="pricing-view">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Upgrade to grow and engage your audience
              </h2>
              <p className="text-sm text-gray-400 max-w-xl mx-auto">
                Escolha o plano ideal para as suas transmissões. Comece com nosso plano de testes gratuito ou assine um plano pago para liberar canais adicionais.
              </p>

              {/* Monthly vs Annual Toggle */}
              <div className="inline-flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl mt-4">
                <button 
                  onClick={() => setIsAnnual(false)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isAnnual ? 'bg-[#4683E0] text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Mensal
                </button>
                <button 
                  onClick={() => setIsAnnual(true)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${isAnnual ? 'bg-[#4683E0] text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Anual <span className="text-[9px] bg-green-500/20 text-green-400 px-1 py-0.5 rounded border border-green-500/10">2 meses grátis</span>
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
                    className={`bg-slate-900/60 border rounded-2xl p-6 flex flex-col justify-between relative transition-all ${
                      plan.popular 
                        ? 'border-blue-500 shadow-xl shadow-blue-500/5 ring-1 ring-blue-400/20' 
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <span className={`absolute -top-3 right-4 px-2.5 py-1 text-[9px] font-black uppercase rounded-full border ${
                        plan.popular 
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                          : 'bg-slate-800 text-gray-400 border-slate-700'
                      }`}>
                        {plan.badge}
                      </span>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-white font-sans">{plan.name}</h3>
                        <p className="text-xs text-gray-500 mt-1 min-h-[32px]">{plan.description}</p>
                      </div>

                      <div className="py-2 border-y border-slate-800/60">
                        <span className="text-3xl font-black text-white font-mono">
                          ${price}
                        </span>
                        <span className="text-xs text-gray-400 font-semibold"> /mês</span>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        className={`w-full py-3 text-xs font-bold rounded-xl transition-all ${
                          plan.id === 'Free Trial'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/20'
                            : plan.popular
                              ? 'bg-[#4683E0] hover:bg-blue-600 text-white shadow-lg shadow-blue-950/20'
                              : 'bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white'
                        }`}
                      >
                        {plan.id === 'Free Trial' ? 'Iniciar 30 Dias Grátis' : 'Selecionar Plano'}
                      </button>

                      {/* Features checklist */}
                      <div className="pt-4 space-y-2.5">
                        <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">Recursos incluídos:</p>
                        {plan.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            <Check size={14} className="text-blue-500 mt-0.5 shrink-0" />
                            <span className="text-gray-300 leading-tight">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {plan.id === 'Free Trial' && (
                      <div className="mt-6 p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-[10px] text-emerald-400 text-center flex items-center gap-1.5 justify-center">
                        <Shield size={12} />
                        <span>Não requer cartão de crédito</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-6 text-xs text-gray-500 flex items-center justify-center gap-1">
              <span>Garantia de reembolso de 7 dias • Transmita para múltiplos canais instantaneamente • Dúvidas?</span>
              <button className="text-blue-400 hover:underline flex items-center gap-0.5">Fale conosco <HelpCircle size={12} /></button>
            </div>
          </div>
        )}

        {/* VIEW 5: CHECKOUT / PAYMENT FORM SIMULATION */}
        {view === 'checkout' && (
          <div className="w-full max-w-lg bg-slate-900/80 border border-slate-800 p-8 rounded-3xl space-y-6 animate-in fade-in duration-200" id="checkout-view">
            
            {/* Header / Step Progress */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="text-left space-y-1">
                <span className="text-[10px] uppercase font-bold text-blue-500">Checkout Seguro</span>
                <h2 className="text-xl font-bold text-white">Finalizar Assinatura</h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400">Plano Selecionado</span>
                <p className="text-sm font-bold text-blue-400">{selectedPlan} - {isAnnual ? 'Anual' : 'Mensal'}</p>
              </div>
            </div>

            {checkoutError && (
              <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Gateway tab selection buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setSelectedGateway('stripe'); setCheckoutError(''); }}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  selectedGateway === 'stripe' 
                    ? 'bg-blue-500/10 border-blue-500 text-white' 
                    : 'bg-slate-950 border-slate-800 text-gray-400 hover:text-white'
                }`}
              >
                Stripe
              </button>
              <button
                type="button"
                onClick={() => { setSelectedGateway('paypal'); setCheckoutError(''); }}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  selectedGateway === 'paypal' 
                    ? 'bg-blue-500/10 border-blue-500 text-white' 
                    : 'bg-slate-950 border-slate-800 text-gray-400 hover:text-white'
                }`}
              >
                PayPal
              </button>
              <button
                type="button"
                onClick={() => { setSelectedGateway('mercadopago'); setCheckoutError(''); }}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  selectedGateway === 'mercadopago' 
                    ? 'bg-blue-500/10 border-blue-500 text-white' 
                    : 'bg-slate-950 border-slate-800 text-gray-400 hover:text-white'
                }`}
              >
                Mercado Pago
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-left">
              
              {/* RENDER STRIPE GATEWAY */}
              {selectedGateway === 'stripe' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-1.5">
                    <p className="text-[10px] text-gray-400">
                      Ambiente de testes ativo. Autofácil de dados de cartão de crédito Stripe:
                    </p>
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg text-[10px] font-mono border border-slate-800/60">
                      <span className="text-white">4242 4242 4242 4242 | MM/AA: 12/29 | CVV: 424</span>
                      <button 
                        type="button"
                        onClick={() => {
                          setCardNumber('4242 4242 4242 4242');
                          setCardExpiry('12/29');
                          setCardCvc('424');
                          setCardName('MARCOS GONÇALVES');
                        }}
                        className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-[9px] font-sans font-bold"
                      >
                        Preencher
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Número do Cartão</label>
                      <input 
                        type="text" 
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500">Validade</label>
                        <input 
                          type="text" 
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/AA" 
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500">CVC</label>
                        <input 
                          type="password" 
                          required
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="424" 
                          maxLength={4}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Nome do Titular</label>
                      <input 
                        type="text" 
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        placeholder="MARCOS GONÇALVES" 
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* RENDER PAYPAL GATEWAY */}
              {selectedGateway === 'paypal' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-[11px] text-gray-400">
                    Aprovação simulada na carteira PayPal. Autentique-se na conta de testes:
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500">PayPal Sandbox E-mail</label>
                      <input 
                        type="email" 
                        required
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Senha</label>
                      <input 
                        type="password" 
                        required
                        value={paypalPassword}
                        onChange={(e) => setPaypalPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none font-mono"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPaypalAuthorized(true);
                        alert('PayPal Sandbox: Login autenticado com sucesso!');
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
                <div className="space-y-4">
                  
                  {/* Mercado Pago method tabs */}
                  <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setMpMethod('pix')}
                      className={`flex-1 text-center py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        mpMethod === 'pix' ? 'bg-[#4683E0] text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      PIX Nacional
                    </button>
                    <button
                      type="button"
                      onClick={() => setMpMethod('card')}
                      className={`flex-1 text-center py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        mpMethod === 'card' ? 'bg-[#4683E0] text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Cartão de Crédito
                    </button>
                  </div>

                  {mpMethod === 'pix' ? (
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-4">
                      <div className="flex justify-center">
                        <div className="p-2.5 bg-white rounded-xl">
                          <QrCode size={120} className="text-slate-950" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">Chave PIX Simulada</p>
                        <p className="text-[10px] text-gray-500">Escaneie ou copie a chave de testes abaixo.</p>
                      </div>

                      <div className="flex items-center gap-2 bg-[#16191E] p-2 rounded-xl border border-slate-800">
                        <input 
                          type="text" 
                          readOnly 
                          value="00020126580014br.gov.bcb.pix0136pwstreamer-mercado-pago-sandbox-key-98" 
                          className="bg-transparent text-[9px] text-gray-400 select-all font-mono focus:outline-none flex-1 truncate"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPixCopied(true);
                            navigator.clipboard.writeText("00020126580014br.gov.bcb.pix0136pwstreamer-mercado-pago-sandbox-key-98");
                            setTimeout(() => setPixCopied(false), 2000);
                          }}
                          className="px-2.5 py-1 bg-[#4683E0] hover:bg-blue-600 text-white rounded text-[9px] font-bold shrink-0"
                        >
                          {pixCopied ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-1.5">
                        <p className="text-[10px] text-gray-400">Cartão de testes do Mercado Pago:</p>
                        <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg text-[10px] font-mono border border-slate-800/60">
                          <span className="text-white">5031 4000 1234 5678 | CVV: 123</span>
                          <button 
                            type="button"
                            onClick={() => {
                              setCardNumber('5031 4000 1234 5678');
                              setCardExpiry('08/28');
                              setCardCvc('123');
                              setCardName('MARCOS GONÇALVES');
                            }}
                            className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-[9px] font-sans font-bold"
                          >
                            Preencher
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-500">Número do Cartão</label>
                          <input 
                            type="text" 
                            required
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">Validade</label>
                            <input 
                              type="text" 
                              required
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">CVC</label>
                            <input 
                              type="password" 
                              required
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value)}
                              placeholder="123" 
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-500">Nome no Cartão</label>
                          <input 
                            type="text" 
                            required
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Order total card */}
              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60 space-y-1.5 text-xs text-gray-300">
                <div className="flex justify-between font-bold">
                  <span>Subtotal do plano:</span>
                  <span>${selectedPlan === 'Standard' ? '14.00' : selectedPlan === 'Professional' ? '29.00' : '49.00'}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Desconto de teste:</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between font-extrabold text-blue-400 border-t border-slate-800/60 pt-1.5 mt-1.5 text-sm">
                  <span>Total Cobrado:</span>
                  <span>${selectedPlan === 'Standard' ? '14.00' : selectedPlan === 'Professional' ? '29.00' : '49.00'} / mês</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-gray-400 bg-blue-950/20 p-3 rounded-xl border border-blue-500/10">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Simulação segura. Clique em confirmar para ativar o plano imediatamente no dashboard.</span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={() => setView('pricing')}
                  className="py-3 bg-slate-950 border border-slate-800 hover:bg-slate-900 rounded-xl text-xs font-bold transition-all text-white text-center"
                >
                  Voltar
                </button>
                <button 
                  type="submit"
                  disabled={isProcessingCheckout || (selectedGateway === 'paypal' && !isPaypalAuthorized)}
                  className="py-3 bg-[#4683E0] hover:bg-blue-600 disabled:opacity-50 rounded-xl text-xs font-bold transition-all text-white flex items-center justify-center gap-2"
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
      <footer className="relative z-10 py-6 border-t border-slate-900/60 bg-slate-950/80 text-xs text-gray-500 text-center space-y-2">
        <p>© 2026 PwStreamer Online Studio. Todos os direitos reservados.</p>
        <div className="flex justify-center gap-4 text-gray-400">
          <button 
            type="button"
            onClick={() => { setLegalModalType('terms'); setLegalModalOpen(true); }}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Termos de Uso
          </button>
          <span>•</span>
          <button 
            type="button"
            onClick={() => { setLegalModalType('privacy'); setLegalModalOpen(true); }}
            className="hover:text-white transition-colors cursor-pointer"
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
