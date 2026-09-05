import React, { useState, useEffect } from 'react';
import { 
  User, CreditCard, Shield, Check, Download, FileText, 
  CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, Lock, 
  HelpCircle, QrCode, RefreshCw, Sparkles, BarChart3, Users, 
  Tv, HardDrive, Eye, Settings, Briefcase, Mail, Key,
  Clock, Database, Plus, Zap, Trash2, ArrowUpRight
} from 'lucide-react';
import { authenticatedFetch } from '../lib/api.ts';

interface BillingDashboardProps {
  user: {
    email: string;
    name: string;
    plan: 'Standard' | 'Professional' | 'Business' | 'Free Trial';
    isExpired: boolean;
    trialDays: number;
  } | null;
  onUpdateUser: (updatedUser: any) => void;
  onBackToDashboard: () => void;
  initialTab?: 'profile' | 'billing';
}

interface Invoice {
  id: string;
  date: string;
  plan: string;
  amount: number;
  gateway: 'Stripe' | 'PayPal' | 'Mercado Pago';
  status: 'Pago' | 'Pendente' | 'Cancelado';
}

export function BillingDashboard({ user, onUpdateUser, onBackToDashboard, initialTab = 'billing' }: BillingDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'plans' | 'billing-history' | 'metrics'>(
    initialTab === 'profile' ? 'profile' : 'plans'
  );

  // Resource Consumption States per member (Simulated with Local persistence)
  const [memberMinutes, setMemberMinutes] = useState<{ [key: string]: number }>(() => {
    const saved = localStorage.getItem('pwstream_member_minutes');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      marcos: 75,
      ana: 35,
      lucas: 20
    };
  });

  const [memberStorage, setMemberStorage] = useState<{ [key: string]: number }>(() => {
    const saved = localStorage.getItem('pwstream_member_storage');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      marcos: 2.1,
      ana: 1.2,
      lucas: 0.7
    };
  });

  useEffect(() => {
    localStorage.setItem('pwstream_member_minutes', JSON.stringify(memberMinutes));
  }, [memberMinutes]);

  useEffect(() => {
    localStorage.setItem('pwstream_member_storage', JSON.stringify(memberStorage));
  }, [memberStorage]);

  // Profile Form States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [companyName, setCompanyName] = useState('VineaSX Solutions Ltda');
  const [taxId, setTaxId] = useState('12.345.678/0001-99'); // CNPJ or CPF
  const [billingAddress, setBillingAddress] = useState('Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Plan Selection States
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<'Standard' | 'Professional' | 'Business' | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'none' | 'gateway' | 'details' | 'success'>('none');
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'paypal' | 'mercadopago'>('stripe');

  // Stripe Card State
  const [stripeCardName, setStripeCardName] = useState(user?.name.toUpperCase() || 'MARCOS GONÇALVES');
  const [stripeCardNumber, setStripeCardNumber] = useState('4242 4242 4242 4242');
  const [stripeExpiry, setStripeExpiry] = useState('12/29');
  const [stripeCvc, setStripeCvc] = useState('424');

  // PayPal State
  const [paypalEmail, setPaypalEmail] = useState('marcos-test@pwstreamer.com');
  const [paypalPassword, setPaypalPassword] = useState('••••••••••');
  const [isPaypalAuthorized, setIsPaypalAuthorized] = useState(false);

  // Mercado Pago State
  const [mpMethod, setMpMethod] = useState<'pix' | 'card'>('pix');
  const [mpCardName, setMpCardName] = useState(user?.name.toUpperCase() || 'MARCOS GONÇALVES');
  const [mpCardNumber, setMpCardNumber] = useState('5031 4000 1234 5678');
  const [mpExpiry, setMpExpiry] = useState('08/28');
  const [mpCvc, setMpCvc] = useState('123');
  const [pixCopied, setPixCopied] = useState(false);

  // Checkout Status
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Invoice Simulator
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const savedInvoices = localStorage.getItem('pwstream_invoices');
    if (savedInvoices) {
      try { return JSON.parse(savedInvoices); } catch { }
    }
    return [
      { id: 'FAT-9824', date: '10/06/2026', plan: 'Free Trial', amount: 0, gateway: 'Stripe', status: 'Pago' as const },
      { id: 'FAT-9512', date: '11/05/2026', plan: 'Standard (Mensal)', amount: 14.00, gateway: 'Stripe', status: 'Pago' as const }
    ];
  });

  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Invoice | null>(null);

  useEffect(() => {
    localStorage.setItem('pwstream_invoices', JSON.stringify(invoices));
  }, [invoices]);

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

  // Auto-fill trigger helper
  const handleUseStripeTestCard = () => {
    setStripeCardNumber('4242 4242 4242 4242');
    setStripeExpiry('12/29');
    setStripeCvc('424');
    setStripeCardName((user?.name || 'Marcos Gonçalves').toUpperCase());
  };

  const handleUseMpTestCard = () => {
    setMpCardNumber('5031 4000 1234 5678');
    setMpExpiry('08/28');
    setMpCvc('123');
    setMpCardName((user?.name || 'Marcos Gonçalves').toUpperCase());
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage('');

    setTimeout(() => {
      setIsSavingProfile(false);
      onUpdateUser({
        ...user,
        name: profileName,
        email: user?.email || profileEmail
      });
      setProfileMessage('Perfil e dados corporativos atualizados com sucesso!');
    }, 1200);
  };

  const handleInitCheckout = (planId: 'Free Trial' | 'Standard' | 'Professional' | 'Business') => {
    if (planId === 'Free Trial') {
      alert('O período gratuito é criado uma única vez quando a conta é registrada.');
      return;
    }
    setSelectedUpgradePlan(planId);
    setCheckoutStep('gateway');
  };

  const handleConfirmGateway = () => {
    setCheckoutStep('details');
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUpgradePlan) return;

    setIsProcessingPayment(true);
    setPaymentError('');
    try {
      const response = await authenticatedFetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedUpgradePlan,
          method: selectedGateway === 'mercadopago' && mpMethod === 'pix' ? 'pix' : 'card',
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || 'Falha ao iniciar o checkout.');
      window.location.assign(result.url);
    } catch (error: any) {
      setPaymentError(error?.message || 'Não foi possível abrir o checkout seguro.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    try {
      const response = await authenticatedFetch('/api/billing/portal', { method: 'POST' });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || 'Portal de cobrança indisponível.');
      window.location.assign(result.url);
    } catch (error: any) {
      alert(error?.message || 'Não foi possível abrir o portal de cobrança.');
    }
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Generate simple text invoice download representation
    const invoiceContent = `
========================================
      PWSTREAMER STUDIO - INVOICE RECEIPT
========================================
ID da Fatura: ${invoice.id}
Data: ${invoice.date}
Status: ${invoice.status.toUpperCase()}
Faturado para:
  Nome: ${profileName}
  E-mail: ${profileEmail}
  Empresa: ${companyName}
  Documento Fiscal: ${taxId}
  Endereço: ${billingAddress}
----------------------------------------
Plano Assinado: ${invoice.plan}
Meio de Pagamento: ${invoice.gateway} (Simulado em Ambiente de Testes)
Valor Pago: $${invoice.amount.toFixed(2)} USD
----------------------------------------
Obrigado por assinar o PwStreamer Studio!
Suporte Técnico: suporte@pwstreamer.com
========================================
    `;
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fatura-${invoice.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Usage Metrics Calculator
  const getPlanLimitDestinations = () => {
    if (user?.plan === 'Free Trial') return 2;
    if (user?.plan === 'Standard') return 3;
    if (user?.plan === 'Professional') return 5;
    if (user?.plan === 'Business') return 8;
    return 1;
  };

  const getPlanLimitParticipants = () => {
    if (user?.plan === 'Free Trial') return 3;
    if (user?.plan === 'Standard') return 10;
    if (user?.plan === 'Professional') return 15;
    if (user?.plan === 'Business') return 20;
    return 3;
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Header Path */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-left">
          <button 
            onClick={onBackToDashboard}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-bold mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Voltar para o Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings size={26} className="text-blue-500" /> 
            Configurações da Conta
          </h1>
          <p className="text-sm text-[#a59ebf] mt-1">Gerencie suas informações cadastrais, consulte faturamento e mude seu plano de assinatura.</p>
        </div>

        <button
          onClick={onBackToDashboard}
          className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-gray-300 hover:text-white hover:bg-slate-800 font-bold text-xs transition-all cursor-pointer"
        >
          Ir para Estúdio
        </button>
      </div>

      {/* Horizontal Sub-tabs layout */}
      <div className="flex border-b border-slate-800 pb-px overflow-x-auto scrollbar-none gap-2">
        {[
          { id: 'plans', label: 'Planos & Cobrança', icon: CreditCard },
          { id: 'profile', label: 'Dados de Cadastro', icon: User },
          { id: 'billing-history', label: 'Histórico de Faturas', icon: FileText },
          { id: 'metrics', label: 'Consumo do Plano', icon: BarChart3 }
        ].map(subTab => {
          const isActive = activeSubTab === subTab.id;
          const Icon = subTab.icon;
          return (
            <button
              key={subTab.id}
              onClick={() => {
                setActiveSubTab(subTab.id as any);
                if (subTab.id !== 'plans') {
                  setCheckoutStep('none');
                }
              }}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 shrink-0 ${
                isActive 
                  ? 'border-blue-500 text-blue-400 font-extrabold bg-blue-500/5 rounded-t-xl' 
                  : 'border-transparent text-gray-400 hover:text-white hover:border-slate-700'
              } cursor-pointer`}
            >
              <Icon size={14} />
              {subTab.label}
            </button>
          );
        })}
      </div>

      {/* RENDER VIEW 1: PLANS AND PRICING TAB */}
      {activeSubTab === 'plans' && checkoutStep === 'none' && (
        <div className="space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 inline-flex items-center gap-1.5">
              <Sparkles size={14} /> Cresça seu Público e Multiplique Canais
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Escolha o plano ideal para suas transmissões</h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Gerencie destinos simultâneos no YouTube, Facebook, Twitch e links RTMP customizados sem limite de tempo e com qualidade Full HD.
            </p>

            {/* Billing interval switcher */}
            <div className="inline-flex items-center gap-2 p-1 bg-[#16191E] border border-slate-800 rounded-xl mt-4">
              <button 
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isAnnual ? 'bg-[#4683E0] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Mensal
              </button>
              <button 
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${isAnnual ? 'bg-[#4683E0] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Anual <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/10 font-bold">Economize 20%</span>
              </button>
            </div>
          </div>

          {/* Pricing Cards list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plansData.map(plan => {
              const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
              const isCurrentActivePlan = user?.plan === plan.id;

              return (
                <div 
                  key={plan.id}
                  className={`bg-[#16191E] border rounded-2xl p-6 flex flex-col justify-between relative transition-all ${
                    plan.popular 
                      ? 'border-blue-500 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/20' 
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {plan.badge && (
                    <span className={`absolute -top-3 right-4 px-2.5 py-1 text-[9px] font-black uppercase rounded-full border ${
                      plan.popular 
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                        : 'bg-slate-800 text-gray-400 border-slate-700'
                    }`}>
                      {plan.badge}
                    </span>
                  )}

                  <div className="space-y-4 text-left">
                    <div>
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      <p className="text-xs text-gray-400 mt-1 min-h-[32px]">{plan.description}</p>
                    </div>

                    <div className="py-2.5 border-y border-slate-800/60">
                      <span className="text-3xl font-black text-white font-mono">${price}</span>
                      <span className="text-xs text-gray-400 font-semibold"> /mês</span>
                      {isAnnual && <p className="text-[10px] text-green-400 mt-0.5">Cobrado anualmente (${price * 12}/ano)</p>}
                    </div>

                    <button
                      onClick={() => !isCurrentActivePlan && handleInitCheckout(plan.id)}
                      disabled={isCurrentActivePlan}
                      className={`w-full py-3 text-xs font-bold rounded-xl transition-all ${
                        isCurrentActivePlan
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 cursor-default'
                          : plan.popular
                            ? 'bg-[#4683E0] hover:bg-blue-600 text-white shadow-lg shadow-blue-950/20'
                            : 'bg-[#0F1115] hover:bg-slate-800 border border-slate-800 text-white'
                      }`}
                    >
                      {isCurrentActivePlan ? 'Plano Atual Ativo' : 'Assinar Plano'}
                    </button>

                    {/* Features block */}
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
                </div>
              );
            })}
          </div>

          <div className="bg-[#0F1115] border border-slate-800/60 rounded-2xl p-5 text-left flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-slate-800 text-gray-400 rounded text-[9px] uppercase font-bold">Seu plano atual</span>
              <p className="text-sm font-bold text-white">
                PwStreamer {user ? user.plan : 'Trial'}
                {user?.plan === 'Free Trial' ? ` (${user.trialDays} dias restantes)` : ' - Acesso Completo'}
              </p>
              <p className="text-xs text-gray-500">Seu plano é cobrado de forma automática e transparente. Cancele ou alterne a qualquer momento.</p>
            </div>
            {user?.plan !== 'Free Trial' && (
              <button 
                onClick={handleOpenBillingPortal}
                className="px-4 py-2 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:bg-red-500/5 text-xs font-bold rounded-xl transition-all"
              >
                Gerenciar Assinatura
              </button>
            )}
          </div>
        </div>
      )}

      {/* RENDER VIEW 1.2: REAL TIME INTERACTIVE INTEGRATED CHECKOUT WITH GATEWAYS (Stripe, Paypal, Mercado Pago) */}
      {activeSubTab === 'plans' && checkoutStep !== 'none' && (
        <div className="max-w-xl mx-auto bg-[#16191E] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-left animate-in zoom-in-95 duration-150">
          
          {/* Checkout Steps Indicator */}
          <div className="grid grid-cols-3 bg-[#0F1115] border-b border-slate-800 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
            <div className={`py-3 ${checkoutStep === 'gateway' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : ''}`}>
              1. Meio de Pagamento
            </div>
            <div className={`py-3 ${checkoutStep === 'details' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : ''}`}>
              2. Detalhes de Cobrança
            </div>
            <div className={`py-3 ${checkoutStep === 'success' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5' : ''}`}>
              3. Concluído
            </div>
          </div>

          {/* STEP 1: GATEWAY SELECTION */}
          {checkoutStep === 'gateway' && (
            <div className="p-6 space-y-6">
              <div className="space-y-1.5">
                <span className="text-[10px] text-blue-400 uppercase font-black tracking-wider">Passo 1</span>
                <h3 className="text-lg font-bold text-white">Como deseja pagar sua assinatura?</h3>
                <p className="text-xs text-gray-400">Trabalhamos com os gateways mais seguros do mercado nacional e internacional.</p>
              </div>

              {/* Gateway selector buttons */}
              <div className="space-y-3">
                {/* Stripe Card option */}
                <button
                  type="button"
                  onClick={() => setSelectedGateway('stripe')}
                  className={`w-full p-4 flex items-center justify-between rounded-xl border transition-all text-left ${
                    selectedGateway === 'stripe' 
                      ? 'bg-blue-500/5 border-blue-500 ring-1 ring-blue-500/25' 
                      : 'bg-[#0F1115] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#4F5BFF]/15 border border-[#4F5BFF]/20 rounded-lg flex items-center justify-center font-bold text-[#4F5BFF] tracking-wider text-xs">
                      Stripe
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Stripe Checkout</p>
                      <p className="text-[10px] text-gray-400">Pague com cartão de crédito internacional e aprovação instantânea.</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedGateway === 'stripe' ? 'border-blue-500 bg-blue-500' : 'border-slate-700'}`}>
                    {selectedGateway === 'stripe' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
                </button>

                {/* PayPal option */}
                <button
                  type="button"
                  onClick={() => setSelectedGateway('paypal')}
                  className={`w-full p-4 flex items-center justify-between rounded-xl border transition-all text-left ${
                    selectedGateway === 'paypal' 
                      ? 'bg-blue-500/5 border-blue-500 ring-1 ring-blue-500/25' 
                      : 'bg-[#0F1115] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#003087]/15 border border-[#003087]/20 rounded-lg flex items-center justify-center font-black text-[#0079C1] italic text-xs">
                      PayPal
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">PayPal Checkout</p>
                      <p className="text-[10px] text-gray-400">Pague direto de sua carteira PayPal via saldo ou cartão cadastrado.</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedGateway === 'paypal' ? 'border-blue-500 bg-blue-500' : 'border-slate-700'}`}>
                    {selectedGateway === 'paypal' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
                </button>

                {/* Mercado Pago option */}
                <button
                  type="button"
                  onClick={() => setSelectedGateway('mercadopago')}
                  className={`w-full p-4 flex items-center justify-between rounded-xl border transition-all text-left ${
                    selectedGateway === 'mercadopago' 
                      ? 'bg-blue-500/5 border-blue-500 ring-1 ring-blue-500/25' 
                      : 'bg-[#0F1115] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#009EE3]/15 border border-[#009EE3]/20 rounded-lg flex items-center justify-center font-bold text-[#009EE3] text-[10px] uppercase">
                      MPago
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Mercado Pago</p>
                      <p className="text-[10px] text-gray-400">Pague via PIX nacional instantâneo ou cartão de crédito parcelado.</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedGateway === 'mercadopago' ? 'border-blue-500 bg-blue-500' : 'border-slate-700'}`}>
                    {selectedGateway === 'mercadopago' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
                </button>
              </div>

              {/* Order summary detail card */}
              <div className="bg-[#0F1115] p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
                  <span>Plano selecionado:</span>
                  <span className="text-white font-bold">{selectedUpgradePlan} ({isAnnual ? 'Anual' : 'Mensal'})</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-blue-400 border-t border-slate-800/80 pt-2">
                  <span>Valor do faturamento:</span>
                  <span className="text-sm font-black">
                    ${isAnnual 
                      ? (plansData.find(p => p.id === selectedUpgradePlan)?.priceAnnual || 0) 
                      : (plansData.find(p => p.id === selectedUpgradePlan)?.priceMonthly || 0)
                    }.00 /mês
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('none')}
                  className="py-3 bg-[#0F1115] hover:bg-slate-800 border border-slate-800 text-xs font-bold text-white rounded-xl transition-all text-center"
                >
                  Voltar para Planos
                </button>
                <button
                  type="button"
                  onClick={handleConfirmGateway}
                  className="py-3 bg-[#4683E0] hover:bg-blue-600 text-xs font-bold text-white rounded-xl transition-all text-center flex items-center justify-center gap-1.5"
                >
                  Prosseguir <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS INSERTION & CREDENTIAL HINTS */}
          {checkoutStep === 'details' && (
            <form onSubmit={handleProcessPayment} className="p-6 space-y-6">
              
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <Lock size={14} className="text-emerald-500" />
                    Pagamento {selectedGateway === 'stripe' ? 'Stripe' : selectedGateway === 'paypal' ? 'PayPal' : 'Mercado Pago'}
                  </h3>
                  <p className="text-[11px] text-gray-400">Ambiente de Testes Sandbox Ativo</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutStep('gateway')}
                  className="text-[10px] font-bold text-blue-400 hover:underline"
                >
                  Alterar Gateway
                </button>
              </div>

              {/* RENDER STRIPE METHOD DETAILS */}
              {selectedGateway === 'stripe' && (
                <div className="space-y-4">
                  {/* Test credential card info box */}
                  <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                      <Sparkles size={14} />
                      <span>Dados de Cartão de Testes Stripe</span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Utilize o cartão de testes abaixo para simular o faturamento real sem cobrar taxas:
                    </p>
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg text-[11px] font-mono border border-slate-800/80">
                      <span className="text-white">Nº: 4242 4242 4242 4242 | CVV: 424 | MM/AA: 12/29</span>
                      <button 
                        type="button"
                        onClick={handleUseStripeTestCard}
                        className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-[9px] font-sans font-bold"
                      >
                        Autopreencher
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Número do Cartão</label>
                      <input 
                        type="text" 
                        required
                        value={stripeCardNumber}
                        onChange={(e) => setStripeCardNumber(e.target.value)}
                        className="w-full bg-[#16191E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500">Validade</label>
                        <input 
                          type="text" 
                          required
                          value={stripeExpiry}
                          onChange={(e) => setStripeExpiry(e.target.value)}
                          placeholder="MM/AA"
                          className="w-full bg-[#16191E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500">CVC</label>
                        <input 
                          type="password" 
                          required
                          value={stripeCvc}
                          onChange={(e) => setStripeCvc(e.target.value)}
                          placeholder="424"
                          maxLength={4}
                          className="w-full bg-[#16191E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Nome do Titular</label>
                      <input 
                        type="text" 
                        required
                        value={stripeCardName}
                        onChange={(e) => setStripeCardName(e.target.value.toUpperCase())}
                        className="w-full bg-[#16191E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* RENDER PAYPAL METHOD DETAILS */}
              {selectedGateway === 'paypal' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                      <Sparkles size={14} />
                      <span>Sandbox PayPal Integrado</span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Simule o login na sua carteira digital para aprovar a cobrança recorrente mensal:
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500">E-mail do Sandbox PayPal</label>
                      <input 
                        type="email" 
                        required
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        className="w-full bg-[#16191E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Senha</label>
                      <input 
                        type="password" 
                        required
                        value={paypalPassword}
                        onChange={(e) => setPaypalPassword(e.target.value)}
                        className="w-full bg-[#16191E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPaypalAuthorized(true);
                          alert('Sandbox PayPal: Conta autenticada com sucesso!');
                        }}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                          isPaypalAuthorized 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-[#FFC439] hover:bg-[#ffcf5c] text-slate-950'
                        }`}
                      >
                        {isPaypalAuthorized ? '✓ Autorizado no PayPal' : 'Entrar e Autorizar PayPal Sandbox'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* RENDER MERCADO PAGO METHOD DETAILS */}
              {selectedGateway === 'mercadopago' && (
                <div className="space-y-4">
                  
                  {/* Subtabs to choose Card or PIX */}
                  <div className="flex bg-[#0F1115] border border-slate-800 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setMpMethod('pix')}
                      className={`flex-1 text-center py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        mpMethod === 'pix' ? 'bg-[#4683E0] text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      PIX Instantâneo
                    </button>
                    <button
                      type="button"
                      onClick={() => setMpMethod('card')}
                      className={`flex-1 text-center py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        mpMethod === 'card' ? 'bg-[#4683E0] text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Cartão Mercado Pago
                    </button>
                  </div>

                  {mpMethod === 'pix' ? (
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-4">
                      <div className="flex justify-center">
                        <div className="p-3 bg-white rounded-xl">
                          <QrCode size={140} className="text-slate-950" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-white">Escaneie o QR Code PIX para Teste</p>
                        <p className="text-[10px] text-gray-400 max-w-sm mx-auto">
                          A aprovação é simulada imediatamente ao confirmar o pagamento no botão inferior.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-[#16191E] p-2.5 rounded-xl border border-slate-800/80">
                        <input 
                          type="text" 
                          readOnly 
                          value="00020126580014br.gov.bcb.pix0136pwstreamer-mercado-pago-sandbox-key-98" 
                          className="bg-transparent text-[10px] text-gray-400 select-all font-mono focus:outline-none flex-1 truncate"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPixCopied(true);
                            navigator.clipboard.writeText("00020126580014br.gov.bcb.pix0136pwstreamer-mercado-pago-sandbox-key-98");
                            setTimeout(() => setPixCopied(false), 2000);
                          }}
                          className="px-2.5 py-1 bg-[#4683E0] hover:bg-blue-600 text-white rounded text-[10px] font-bold shrink-0"
                        >
                          {pixCopied ? 'Copiado!' : 'Copiar Chave'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                          <Sparkles size={14} />
                          <span>Mercado Pago Test Card</span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg text-[11px] font-mono border border-slate-800/80">
                          <span className="text-white">Nº: 5031 4000 1234 5678 | CVV: 123</span>
                          <button 
                            type="button"
                            onClick={handleUseMpTestCard}
                            className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-[9px] font-sans font-bold"
                          >
                            Autopreencher
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-500">Número do Cartão</label>
                          <input 
                            type="text" 
                            required
                            value={mpCardNumber}
                            onChange={(e) => setMpCardNumber(e.target.value)}
                            className="w-full bg-[#16191E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">Validade</label>
                            <input 
                              type="text" 
                              required
                              value={mpExpiry}
                              onChange={(e) => setMpExpiry(e.target.value)}
                              className="w-full bg-[#16191E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">CVC</label>
                            <input 
                              type="password" 
                              required
                              value={mpCvc}
                              onChange={(e) => setMpCvc(e.target.value)}
                              className="w-full bg-[#16191E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-gray-500">Nome Completo</label>
                          <input 
                            type="text" 
                            required
                            value={mpCardName}
                            onChange={(e) => setMpCardName(e.target.value.toUpperCase())}
                            className="w-full bg-[#16191E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Secure verification alert info */}
              <div className="flex items-start gap-2 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs text-emerald-400">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span>Sandbox de testes ativo. Nenhuma cobrança real será debitada do seu saldo.</span>
              </div>

              {/* Invoice subtotal summary detail card */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>Subtotal do plano:</span>
                  <span className="font-mono text-white font-bold">
                    ${isAnnual 
                      ? (plansData.find(p => p.id === selectedUpgradePlan)?.priceAnnual || 0) 
                      : (plansData.find(p => p.id === selectedUpgradePlan)?.priceMonthly || 0)
                    }.00
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Descontos / Promoção:</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between text-blue-400 font-extrabold text-sm border-t border-slate-800 pt-1.5 mt-1.5">
                  <span>Valor Total Cobrado:</span>
                  <span>
                    ${isAnnual 
                      ? (plansData.find(p => p.id === selectedUpgradePlan)?.priceAnnual || 0) 
                      : (plansData.find(p => p.id === selectedUpgradePlan)?.priceMonthly || 0)
                    }.00 / mês
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('gateway')}
                  className="py-3 bg-[#0F1115] hover:bg-slate-800 border border-slate-800 text-xs font-bold text-white rounded-xl transition-all text-center"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment || (selectedGateway === 'paypal' && !isPaypalAuthorized)}
                  className="py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white rounded-xl transition-all text-center flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Confirmar Assinatura <Check size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: PAYMENT CONFIRMED SUCCESS VIEW */}
          {checkoutStep === 'success' && (
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white font-sans">Assinatura Ativada com Sucesso!</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Parabéns! O seu pagamento foi processado com sucesso pelo gateway parceiro. Seu plano <strong className="text-white uppercase font-extrabold">{selectedUpgradePlan}</strong> está ativo de imediato.
                </p>
              </div>

              <div className="bg-[#0F1115] p-4 rounded-xl border border-slate-800/80 text-left space-y-2 text-xs">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Resumo do Faturamento</p>
                <div className="flex justify-between text-gray-300">
                  <span>Plano Ativo:</span>
                  <span className="font-bold text-white">{selectedUpgradePlan}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Ciclo de Cobrança:</span>
                  <span>{isAnnual ? 'Cobrança Anual' : 'Cobrança Mensal'}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Valor Recorrente:</span>
                  <span className="font-bold text-blue-400">
                    ${isAnnual 
                      ? (plansData.find(p => p.id === selectedUpgradePlan)?.priceAnnual || 0) 
                      : (plansData.find(p => p.id === selectedUpgradePlan)?.priceMonthly || 0)
                    }.00 /mês
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutStep('none');
                    setActiveSubTab('plans');
                  }}
                  className="w-full py-3 bg-[#4683E0] hover:bg-blue-600 text-xs font-bold text-white rounded-xl transition-all text-center"
                >
                  Concluir e Voltar
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* RENDER VIEW 2: CADASTRE PROFILE AND INVOICE ADDRESS TAB */}
      {activeSubTab === 'profile' && (
        <div className="max-w-2xl mx-auto bg-[#16191E] border border-slate-800 rounded-2xl p-6 text-left space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <User size={18} className="text-blue-500" /> Informações Cadastrais & Fiscais
            </h2>
            <p className="text-xs text-gray-400">Mantenha seus dados atualizados para a correta emissão e envio de faturas e recibos de pagamento.</p>
          </div>

          {profileMessage && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{profileMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Nome Completo</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <User size={14} className="absolute left-3.5 top-3.5 text-gray-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Endereço de E-mail</label>
                <div className="relative">
                  <input 
                    type="email" 
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <Mail size={14} className="absolute left-3.5 top-3.5 text-gray-500" />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/60 pt-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Dados de Emissão Fiscal (Invoice / NF-e)</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Razão Social / Nome de Faturamento</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Ex: Minha Empresa de Tecnologia Ltda"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <Briefcase size={14} className="absolute left-3.5 top-3.5 text-gray-500" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">CNPJ / CPF / Documento Fiscal</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Ex: 00.000.000/0001-00"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <FileText size={14} className="absolute left-3.5 top-3.5 text-gray-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Endereço Completo de Cobrança</label>
                <textarea 
                  rows={2}
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-6 py-3 bg-[#4683E0] hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              {isSavingProfile ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Salvando dados...
                </>
              ) : (
                <>
                  Salvar Alterações <Check size={14} />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* RENDER VIEW 3: BILLING HISTORY AND SIMULATED RECEIPTS TAB */}
      {activeSubTab === 'billing-history' && (
        <div className="bg-[#16191E] border border-slate-800 rounded-2xl p-6 text-left space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText size={18} className="text-blue-500" /> Histórico de Transações & Faturas
            </h2>
            <p className="text-xs text-gray-400">Verifique os comprovantes de pagamentos anteriores e baixe os recibos fiscais de suas mensalidades.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-gray-500 uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">ID da Fatura</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Plano Adquirido</th>
                  <th className="py-3 px-4">Valor Pago</th>
                  <th className="py-3 px-4">Gateway</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {invoices.map((invoice, i) => (
                  <tr key={invoice.id || i} className="hover:bg-slate-800/20 text-gray-300">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{invoice.id}</td>
                    <td className="py-3.5 px-4">{invoice.date}</td>
                    <td className="py-3.5 px-4">{invoice.plan}</td>
                    <td className="py-3.5 px-4 font-bold">${invoice.amount.toFixed(2)} USD</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-gray-300 border border-slate-700/60">
                        {invoice.gateway}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedInvoiceForModal(invoice)}
                          className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-blue-400 hover:text-white transition-all cursor-pointer"
                          title="Visualizar Recibo de Fatura"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(invoice)}
                          className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-emerald-400 hover:text-white transition-all cursor-pointer"
                          title="Baixar comprovante de pagamento"
                        >
                          <Download size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Render Invoice details overlay modal */}
          {selectedInvoiceForModal && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
              <div className="bg-[#16191E] border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl text-left">
                <div className="bg-[#0F1115] px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 font-mono">Detalhes da Fatura {selectedInvoiceForModal.id}</span>
                  <button 
                    onClick={() => setSelectedInvoiceForModal(null)}
                    className="text-gray-400 hover:text-white font-bold"
                  >
                    Fechar
                  </button>
                </div>

                <div className="p-6 space-y-4 text-xs text-gray-300">
                  <div className="flex justify-between border-b border-slate-800/60 pb-2">
                    <span className="text-gray-500 font-bold">PWSTREAMER STUDIO</span>
                    <span className="text-emerald-400 uppercase font-black tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">PAGO</span>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Dados da Fatura</p>
                    <div className="flex justify-between">
                      <span>Código de Transação:</span>
                      <span className="text-white font-mono font-bold">{selectedInvoiceForModal.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data do Faturamento:</span>
                      <span className="text-white">{selectedInvoiceForModal.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gateway de Pagamento:</span>
                      <span className="text-white">{selectedInvoiceForModal.gateway} (Teste)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-800/40 pt-3">
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Faturado Para</p>
                    <div className="flex justify-between">
                      <span>Assinante:</span>
                      <span className="text-white">{profileName || 'Marcos Gonçalves'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Empresa:</span>
                      <span className="text-white">{companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Documento Fiscal:</span>
                      <span className="text-white">{taxId}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-800/40 pt-3">
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Descrição dos Itens</p>
                    <div className="flex justify-between text-white font-semibold bg-[#0F1115] p-2.5 rounded-xl border border-slate-800">
                      <span>Assinatura {selectedInvoiceForModal.plan}</span>
                      <span>${selectedInvoiceForModal.amount.toFixed(2)} USD</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 text-[10px] text-blue-400">
                    <Shield size={14} className="shrink-0" />
                    <span>Esta fatura foi processada sob regulamentações da Vega6 e simula um faturamento real em ambiente seguro.</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(selectedInvoiceForModal)}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all text-center flex items-center justify-center gap-1.5"
                    >
                      <Download size={14} /> Baixar Recibo
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceForModal(null)}
                      className="py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all text-center"
                    >
                      Fechar Janela
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* RENDER VIEW 4: PLANNED CONSUMPTION METRICS */}
      {activeSubTab === 'metrics' && (() => {
        const currentPlan = user?.plan || 'Free Trial';

        const planLimits = {
          'Free Trial': {
            minutes: 120, // 2 hours
            storage: 5.0,  // GB
            destinations: 2,
            seats: 1
          },
          'Standard': {
            minutes: 1200, // 20 hours
            storage: 15.0,  // GB
            destinations: 3,
            seats: 1
          },
          'Professional': {
            minutes: 3600, // 60 hours
            storage: 50.0,  // GB
            destinations: 5,
            seats: 2
          },
          'Business': {
            minutes: 12000, // 200 hours
            storage: 200.0,  // GB
            destinations: 8,
            seats: 5
          }
        };

        const activeLimits = planLimits[currentPlan] || planLimits['Free Trial'];

        const anaActive = activeLimits.seats >= 2;
        const lucasActive = activeLimits.seats >= 5;

        const totalMinutesUsed = memberMinutes.marcos + (anaActive ? memberMinutes.ana : 0) + (lucasActive ? memberMinutes.lucas : 0);
        const totalStorageUsed = Number((memberStorage.marcos + (anaActive ? memberStorage.ana : 0) + (lucasActive ? memberStorage.lucas : 0)).toFixed(1));

        const minutesPercentage = Math.round((totalMinutesUsed / activeLimits.minutes) * 100);
        const storagePercentage = Math.round((totalStorageUsed / activeLimits.storage) * 100);
        const seatsUsed = 1 + (anaActive ? 1 : 0) + (lucasActive ? 1 : 0);

        const getProgressColor = (pct: number) => {
          if (pct >= 95) return 'bg-red-500';
          if (pct >= 75) return 'bg-amber-500';
          return 'bg-blue-500';
        };

        const getProgressTextColor = (pct: number) => {
          if (pct >= 95) return 'text-red-400';
          if (pct >= 75) return 'text-amber-400';
          return 'text-blue-400';
        };

        const handleSimulateMinutes = (member: string, amount: number) => {
          setMemberMinutes(prev => ({
            ...prev,
            [member]: Math.max(0, prev[member] + amount)
          }));
        };

        const handleSimulateStorage = (member: string, amount: number) => {
          setMemberStorage(prev => ({
            ...prev,
            [member]: Math.max(0, Number((prev[member] + amount).toFixed(1)))
          }));
        };

        const handleResetSimulations = () => {
          setMemberMinutes({ marcos: 75, ana: 35, lucas: 20 });
          setMemberStorage({ marcos: 2.1, ana: 1.2, lucas: 0.7 });
        };

        return (
          <div className="space-y-6">
            
            {/* Main stats card header comparing limits */}
            <div className="bg-[#16191E] border border-slate-800 rounded-2xl p-6 text-left space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart3 size={18} className="text-blue-500 animate-pulse" />
                    Painel Consolidado de Consumo de Recursos
                  </h2>
                  <p className="text-xs text-gray-400">
                    Sua equipe está utilizando o plano <strong className="text-blue-400 uppercase font-black">PwStreamer {currentPlan}</strong>. Veja os limites atuais e o consumo por usuário.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold">
                    Sandbox de Teste Ativo
                  </span>
                  <button
                    onClick={handleResetSimulations}
                    className="p-2 bg-[#0F1115] border border-slate-800 hover:bg-slate-900 rounded-lg text-gray-400 hover:text-white transition-all text-xs flex items-center gap-1 cursor-pointer font-bold"
                    title="Restaurar consumos iniciais"
                  >
                    <Trash2 size={13} />
                    Limpar Testes
                  </button>
                </div>
              </div>

              {/* Progress bars & Limits summary visual meters */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Meter 1: Streaming Minutes */}
                <div className="bg-[#0F1115] border border-slate-800/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                      <Clock size={15} className="text-blue-400" />
                      <span>Uso de Minutos</span>
                    </div>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full bg-slate-900/60 ${getProgressTextColor(minutesPercentage)} border border-slate-800`}>
                      {minutesPercentage}%
                    </span>
                  </div>
                  <div className="space-y-1 text-left">
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-black text-white font-mono">{totalMinutesUsed}</p>
                      <span className="text-xs text-gray-500 font-semibold">/ {activeLimits.minutes} min</span>
                    </div>
                    <p className="text-[10px] text-gray-400">Tempo acumulado de lives transmitidas no mês</p>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(minutesPercentage)}`}
                      style={{ width: `${Math.min(100, minutesPercentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500">
                    <span>Disponível: {Math.max(0, activeLimits.minutes - totalMinutesUsed)} min</span>
                    <span>Renova em 20 dias</span>
                  </div>
                </div>

                {/* Meter 2: Video Cloud Storage */}
                <div className="bg-[#0F1115] border border-slate-800/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                      <Database size={15} className="text-emerald-400" />
                      <span>Storage de Vídeos</span>
                    </div>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full bg-slate-900/60 ${getProgressTextColor(storagePercentage)} border border-slate-800`}>
                      {storagePercentage}%
                    </span>
                  </div>
                  <div className="space-y-1 text-left">
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-black text-white font-mono">{totalStorageUsed}</p>
                      <span className="text-xs text-gray-500 font-semibold">/ {activeLimits.storage} GB</span>
                    </div>
                    <p className="text-[10px] text-gray-400">Armazenamento em nuvem de gravações salvas</p>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(storagePercentage)}`}
                      style={{ width: `${Math.min(100, storagePercentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500">
                    <span>Disponível: {Math.max(0, Number((activeLimits.storage - totalStorageUsed).toFixed(1)))} GB</span>
                    <span>Compactação ativa</span>
                  </div>
                </div>

                {/* Meter 3: Active seats inside limit */}
                <div className="bg-[#0F1115] border border-slate-800/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                      <Users size={15} className="text-purple-400" />
                      <span>Membros de Equipe</span>
                    </div>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-900/60 text-purple-400 border border-slate-800">
                      {Math.round((seatsUsed / activeLimits.seats) * 100)}%
                    </span>
                  </div>
                  <div className="space-y-1 text-left">
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-black text-white font-mono">{seatsUsed}</p>
                      <span className="text-xs text-gray-500 font-semibold">/ {activeLimits.seats} {activeLimits.seats === 1 ? 'membro' : 'membros'}</span>
                    </div>
                    <p className="text-[10px] text-gray-400">Co-produtores com acesso simultâneo</p>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(seatsUsed / activeLimits.seats) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500">
                    <span>Vagas livres: {Math.max(0, activeLimits.seats - seatsUsed)}</span>
                    <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/10 font-bold">Multi-assento</span>
                  </div>
                </div>

              </div>

              {/* Warnings & Alerts conditional panel */}
              {(minutesPercentage >= 80 || storagePercentage >= 80) && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-xs text-amber-400 animate-in fade-in duration-250">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-500" />
                  <div className="space-y-1 text-left">
                    <p className="font-bold text-amber-300">Atenção: Limite de recursos se aproximando do teto!</p>
                    <p className="text-[11px] text-gray-400">
                      {minutesPercentage >= 80 && `Você consumiu ${minutesPercentage}% dos minutos de streaming mensais contratados. `}
                      {storagePercentage >= 80 && `O armazenamento de gravações está com ${storagePercentage}% de ocupação máxima. `}
                      Recomendamos fazer o upgrade para o próximo nível para garantir transmissões ininterruptas e sem sobressaltos.
                    </p>
                    <button
                      onClick={() => setActiveSubTab('plans')}
                      className="mt-1.5 text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                    >
                      Ver Opções de Upgrade <ArrowUpRight size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* USER BY USER DETAILED BREAKDOWN PANEL */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Detalhamento do Consumo Individual por Usuário
                  </h3>
                  <span className="text-[10px] text-gray-500">Assentos Ativos: {seatsUsed} de {activeLimits.seats} permitidos</span>
                </div>

                <div className="bg-[#0F1115] border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
                  
                  {/* User 1: Marcos Gonçalves (Owner) */}
                  <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-900/40 transition-colors">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold flex items-center justify-center text-xs">
                        MG
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          {profileName || 'Marcos Gonçalves'}
                          <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/10 px-1.5 py-0.5 rounded-md font-bold uppercase">
                            Proprietário (Você)
                          </span>
                        </p>
                        <p className="text-[10px] text-gray-500">{profileEmail || 'conta@exemplo.com'}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-xs w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Uso de Transmissão</span>
                        <p className="text-xs font-bold text-white font-mono">{memberMinutes.marcos} minutos</p>
                        <p className="text-[9px] text-gray-500">~{Number((memberMinutes.marcos / 60).toFixed(1))} horas</p>
                      </div>
                      <div className="text-left sm:text-right border-l sm:border-l-0 sm:border-r border-slate-800 pl-4 sm:pl-0 sm:pr-4">
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Storage de Vídeo</span>
                        <p className="text-xs font-bold text-white font-mono">{memberStorage.marcos} GB</p>
                        <p className="text-[9px] text-gray-500">~{Math.round(memberStorage.marcos * 2)} arquivos salvos</p>
                      </div>
                      
                      {/* Individual simulation buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSimulateMinutes('marcos', 15)}
                          className="px-2 py-1 bg-[#16191E] hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-[10px] font-bold text-gray-300 hover:text-white rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
                          title="Simular transmissão de +15m"
                        >
                          <Plus size={10} /> 15m
                        </button>
                        <button
                          onClick={() => handleSimulateStorage('marcos', 0.5)}
                          className="px-2 py-1 bg-[#16191E] hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-[10px] font-bold text-gray-300 hover:text-white rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
                          title="Simular gravação de +0.5GB"
                        >
                          <Plus size={10} /> 0.5GB
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* User 2: Ana Beatriz (Co-producer) */}
                  <div className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${!anaActive ? 'opacity-40 bg-slate-950/20' : 'hover:bg-slate-900/40'}`}>
                    <div className="flex items-center gap-3 text-left">
                      <div className={`w-9 h-9 rounded-xl font-extrabold flex items-center justify-center text-xs ${anaActive ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' : 'bg-slate-900 text-gray-500 border border-slate-800'}`}>
                        AB
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          Ana Beatriz
                          <span className={`text-[9px] border px-1.5 py-0.5 rounded-md font-bold uppercase ${anaActive ? 'bg-purple-500/20 text-purple-400 border-purple-500/10' : 'bg-slate-800 text-gray-500 border-slate-700'}`}>
                            Co-Produtor
                          </span>
                          {!anaActive && (
                            <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/10 px-1.5 py-0.5 rounded font-black uppercase">
                              Bloqueado
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-gray-500">ana.beatriz@pwstreamer.com</p>
                      </div>
                    </div>

                    {anaActive ? (
                      <div className="flex flex-wrap items-center gap-6 text-xs w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-left sm:text-right">
                          <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Uso de Transmissão</span>
                          <p className="text-xs font-bold text-white font-mono">{memberMinutes.ana} minutos</p>
                        </div>
                        <div className="text-left sm:text-right border-l sm:border-l-0 sm:border-r border-slate-800 pl-4 sm:pl-0 sm:pr-4">
                          <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Storage de Vídeo</span>
                          <p className="text-xs font-bold text-white font-mono">{memberStorage.ana} GB</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSimulateMinutes('ana', 15)}
                            className="px-2 py-1 bg-[#16191E] hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-[10px] font-bold text-gray-300 hover:text-white rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
                          >
                            <Plus size={10} /> 15m
                          </button>
                          <button
                            onClick={() => handleSimulateStorage('ana', 0.5)}
                            className="px-2 py-1 bg-[#16191E] hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-[10px] font-bold text-gray-300 hover:text-white rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
                          >
                            <Plus size={10} /> 0.5GB
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-gray-500 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="hidden sm:inline">Requer upgrade para plano com mais assentos</span>
                        <button
                          onClick={() => setActiveSubTab('plans')}
                          className="px-3 py-1.5 bg-[#4683E0] hover:bg-blue-600 text-white rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Zap size={11} /> Desbloquear Assento (Professional)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* User 3: Lucas Lima (Moderator) */}
                  <div className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${!lucasActive ? 'opacity-40 bg-slate-950/20' : 'hover:bg-slate-900/40'}`}>
                    <div className="flex items-center gap-3 text-left">
                      <div className={`w-9 h-9 rounded-xl font-extrabold flex items-center justify-center text-xs ${lucasActive ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' : 'bg-slate-900 text-gray-500 border border-slate-800'}`}>
                        LL
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          Lucas Lima
                          <span className={`text-[9px] border px-1.5 py-0.5 rounded-md font-bold uppercase ${lucasActive ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-slate-800 text-gray-500 border-slate-700'}`}>
                            Moderador / Equipe
                          </span>
                          {!lucasActive && (
                            <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/10 px-1.5 py-0.5 rounded font-black uppercase">
                              Bloqueado
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-gray-500">lucas.lima@pwstreamer.com</p>
                      </div>
                    </div>

                    {lucasActive ? (
                      <div className="flex flex-wrap items-center gap-6 text-xs w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-left sm:text-right">
                          <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Uso de Transmissão</span>
                          <p className="text-xs font-bold text-white font-mono">{memberMinutes.lucas} minutos</p>
                        </div>
                        <div className="text-left sm:text-right border-l sm:border-l-0 sm:border-r border-slate-800 pl-4 sm:pl-0 sm:pr-4">
                          <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Storage de Vídeo</span>
                          <p className="text-xs font-bold text-white font-mono">{memberStorage.lucas} GB</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSimulateMinutes('lucas', 15)}
                            className="px-2 py-1 bg-[#16191E] hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-[10px] font-bold text-gray-300 hover:text-white rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
                          >
                            <Plus size={10} /> 15m
                          </button>
                          <button
                            onClick={() => handleSimulateStorage('lucas', 0.5)}
                            className="px-2 py-1 bg-[#16191E] hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-[10px] font-bold text-gray-300 hover:text-white rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
                          >
                            <Plus size={10} /> 0.5GB
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-gray-500 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="hidden sm:inline">Excede os assentos permitidos no seu plano atual</span>
                        <button
                          onClick={() => setActiveSubTab('plans')}
                          className="px-3 py-1.5 bg-[#4683E0] hover:bg-blue-600 text-white rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Zap size={11} /> Desbloquear com Plano Business
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Informational tech parameters specs list card */}
              <div className="bg-[#0F1115] border border-slate-800 p-5 rounded-2xl text-left space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Qualidade Técnica e Limites Estruturais ({currentPlan})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-300">
                  <div className="flex items-center gap-2 bg-[#16191E] p-3 rounded-xl border border-slate-800/60">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Transmissão simultânea: Até {activeLimits.destinations} destinos de canais</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#16191E] p-3 rounded-xl border border-slate-800/60">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Resolução de Transmissão: {currentPlan === 'Free Trial' ? 'HD 720p Max' : 'Full HD 1080p Ultra'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#16191E] p-3 rounded-xl border border-slate-800/60">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Backup RTMP profissional: {currentPlan === 'Business' ? 'Incluso com reconexão' : 'Indisponível neste plano'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#16191E] p-3 rounded-xl border border-slate-800/60">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Suporte técnico prioritário: {currentPlan === 'Business' ? '24/7 via Chat Ativo' : 'Apenas por E-mail regular'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
