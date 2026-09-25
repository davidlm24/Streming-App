import { PLANS, formatPrice } from '../lib/plans';
import React, { useState, useEffect } from 'react';
import { useToast } from './ui/Toast';
import { Button } from './ui/Button';
import { useTabs } from './ui/Tabs';
import { useConfirm } from './ui/ConfirmDialog';
import { copyText } from './ui/clipboard';
import { Modal } from './ui/Modal';

/** O Vite remove o ramo inteiro no build de produção. */
const IS_DEV = import.meta.env.DEV;

/** Dados corporativos do próprio usuário, persistidos localmente. */
const BILLING_KEY = 'pwstream_billing_profile';
function loadBillingProfile() {
  try {
    const raw = localStorage.getItem(BILLING_KEY);
    return raw ? JSON.parse(raw) as { companyName?: string; taxId?: string; billingAddress?: string } : {};
  } catch { return {}; }
}
import { 
  User, CreditCard, Shield, Check, Download, FileText, 
  CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, Lock, 
  HelpCircle, QrCode, RefreshCw, Sparkles, BarChart3, Users, 
  Tv, HardDrive, Eye, Settings, Briefcase, Mail, Key,
  Clock, Database, Plus, Zap, Trash2, ArrowUpRight
} from 'lucide-react';

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
  const toast = useToast();
  const confirm = useConfirm();
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'plans' | 'billing-history' | 'metrics'>(
    initialTab === 'profile' ? 'profile' : 'plans'
  );

  // Resource Consumption States per member (Simulated with Local persistence)
  const [memberMinutes, setMemberMinutes] = useState<{ [key: string]: number }>(() => {
    const saved = localStorage.getItem('pwstream_member_minutes');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    // `ana` e `lucas` saíram junto com os dois membros fabricados que os
    // consumiam. Sobra o proprietário, único membro real.
    return { marcos: 75 };
  });

  const [memberStorage, setMemberStorage] = useState<{ [key: string]: number }>(() => {
    const saved = localStorage.getItem('pwstream_member_storage');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return { marcos: 2.1 };
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
  // Estes três eram identidade fiscal de OUTRA empresa, fixa no código e
  // exibida na conta de todo cliente. Agora vêm do que o próprio usuário
  // salvou, e começam vazios.
  const savedBilling = loadBillingProfile();
  const [companyName, setCompanyName] = useState(savedBilling.companyName ?? '');
  const [taxId, setTaxId] = useState(savedBilling.taxId ?? '');
  const [billingAddress, setBillingAddress] = useState(savedBilling.billingAddress ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Plan Selection States
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<'Standard' | 'Professional' | 'Business' | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'none' | 'gateway' | 'details' | 'success'>('none');

  // Trocar de aba fora de "Planos" abandona o checkout em andamento — pelo
  // clique ou pelas setas do teclado, o mesmo caminho.
  const selecionarSubAba = (id: typeof activeSubTab) => {
    setActiveSubTab(id);
    if (id !== 'plans') setCheckoutStep('none');
  };
  const subAbas = useTabs('conta', ['plans', 'profile', 'billing-history', 'metrics'] as const, activeSubTab, selecionarSubAba);
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'paypal' | 'mercadopago'>('stripe');

  // Stripe Card State
  const [stripeCardName, setStripeCardName] = useState(user?.name?.toUpperCase() || '');
  const [stripeCardNumber, setStripeCardNumber] = useState(IS_DEV ? '4242 4242 4242 4242' : '');
  const [stripeExpiry, setStripeExpiry] = useState(IS_DEV ? '12/29' : '');
  const [stripeCvc, setStripeCvc] = useState(IS_DEV ? '424' : '');

  // PayPal State
  const [paypalEmail, setPaypalEmail] = useState(IS_DEV ? 'marcos-test@pwstreamer.com' : '');
  const [paypalPassword, setPaypalPassword] = useState('');
  const [isPaypalAuthorized, setIsPaypalAuthorized] = useState(false);

  // Mercado Pago State
  const [mpMethod, setMpMethod] = useState<'pix' | 'card'>('pix');
  const [mpCardName, setMpCardName] = useState(user?.name?.toUpperCase() || '');
  const [mpCardNumber, setMpCardNumber] = useState(IS_DEV ? '5031 4000 1234 5678' : '');
  const [mpExpiry, setMpExpiry] = useState(IS_DEV ? '08/28' : '');
  const [mpCvc, setMpCvc] = useState(IS_DEV ? '123' : '');
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

  // A tabela local (14/29/49 em USD) foi removida: divergia da vitrine
  // publica, que anuncia R$ 49,90/99,90/199,90. Fonte unica em lib/plans.
  const plansData = PLANS;

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
        email: profileEmail
      });
      // A mensagem dizia 'dados corporativos atualizados' e estes três campos
      // eram DESCARTADOS: o usuário preenchia, via sucesso e perdia tudo.
      try {
        localStorage.setItem(BILLING_KEY, JSON.stringify({ companyName, taxId, billingAddress }));
      } catch { /* armazenamento indisponível: a mensagem abaixo ainda cobre nome e e-mail */ }
      setProfileMessage('Perfil e dados corporativos atualizados com sucesso!');
    }, 1200);
  };

  const handleInitCheckout = (planId: 'Free Trial' | 'Standard' | 'Professional' | 'Business') => {
    if (planId === 'Free Trial') {
      onUpdateUser({
        ...user,
        plan: 'Free Trial',
        trialDays: 30,
        isExpired: false
      });
      toast.success('Seu plano foi alterado para o Plano Gratuito (30 dias de teste)!');
      return;
    }
    setSelectedUpgradePlan(planId);
    setCheckoutStep('gateway');
  };

  const handleConfirmGateway = () => {
    setCheckoutStep('details');
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUpgradePlan) return;

    setIsProcessingPayment(true);
    setPaymentError('');

    // Simulate standard payment authorization latency
    setTimeout(() => {
      setIsProcessingPayment(false);
      
      const newPlanName = selectedUpgradePlan;
      const price = isAnnual 
        ? plansData.find(p => p.id === selectedUpgradePlan)?.priceAnnual || 0
        : plansData.find(p => p.id === selectedUpgradePlan)?.priceMonthly || 0;

      const updatedUser = {
        ...user,
        plan: newPlanName,
        isExpired: false,
        trialDays: 30 // reset trial if any, but now they are premium
      };

      // Register invoice log
      const newInvoice: Invoice = {
        id: `FAT-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleDateString('pt-BR'),
        plan: `${newPlanName} (${isAnnual ? 'Anual' : 'Mensal'})`,
        amount: price,
        gateway: selectedGateway === 'stripe' ? 'Stripe' : selectedGateway === 'paypal' ? 'PayPal' : 'Mercado Pago',
        status: 'Pago'
      };

      setInvoices(prev => [newInvoice, ...prev]);
      onUpdateUser(updatedUser);
      setCheckoutStep('success');
    }, 2000);
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
Valor Pago: ${formatPrice(invoice.amount)}
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
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Header Path */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-left">
          <button 
            onClick={onBackToDashboard}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-bold mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Voltar para o Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink-hi)] flex items-center gap-2">
            <Settings size={26} className="text-blue-500" /> 
            Configurações da Conta
          </h1>
          <p className="text-sm text-[var(--ink-lo)] mt-1">Gerencie suas informações cadastrais, consulte faturamento e mude seu plano de assinatura.</p>
        </div>

        <button
          onClick={onBackToDashboard}
          className="px-5 py-2.5 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-[var(--ink)] hover:text-[var(--ink-hi)] hover:bg-[var(--panel)] font-bold text-xs transition-all cursor-pointer"
        >
          Ir para Estúdio
        </button>
      </div>

      {/* Horizontal Sub-tabs layout */}
      <div {...subAbas.tablist} aria-label="Conta" className="flex border-b border-[var(--line)] pb-px overflow-x-auto scrollbar-none gap-2">
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
              {...subAbas.tab(subTab.id as typeof activeSubTab)}
              onClick={() => selecionarSubAba(subTab.id as typeof activeSubTab)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 shrink-0 ${
                isActive 
                  ? 'border-blue-500 text-blue-400 font-extrabold bg-blue-500/5 rounded-t-xl' 
                  : 'border-transparent text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:border-[var(--line-ctl)]'
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
        <div {...subAbas.panel('plans')} className="space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 inline-flex items-center gap-1.5">
              <Sparkles size={14} /> Cresça seu Público e Multiplique Canais
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-hi)]">Escolha o plano ideal para suas transmissões</h2>
            <p className="text-xs sm:text-sm text-[var(--ink-lo)]">
              Gerencie destinos simultâneos no YouTube, Facebook, Twitch e links RTMP customizados sem limite de tempo e com qualidade Full HD.
            </p>

            {/* Billing interval switcher */}
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
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${isAnnual ? 'bg-[var(--color-brand-deep)] text-white' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'}`}
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
                  className={`bg-[var(--surface)] border rounded-2xl p-6 flex flex-col justify-between relative transition-all ${
                    plan.popular 
                      ? 'border-blue-500 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/20' 
                      : 'border-[var(--line)]/80 hover:border-[var(--line-ctl)]'
                  }`}
                >
                  {plan.badge && (
                    <span className={`absolute -top-3 right-4 px-2.5 py-1 text-[9px] font-black uppercase rounded-full border ${
                      plan.popular 
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                        : 'bg-[var(--panel)] text-[var(--ink-lo)] border-[var(--line-ctl)]'
                    }`}>
                      {plan.badge}
                    </span>
                  )}

                  <div className="space-y-4 text-left">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--ink-hi)]">{plan.name}</h3>
                      <p className="text-xs text-[var(--ink-lo)] mt-1 min-h-[32px]">{plan.description}</p>
                    </div>

                    <div className="py-2.5 border-y border-[var(--line)]/60">
                      <span className="text-3xl font-black text-[var(--ink-hi)] font-mono tabular-nums">{formatPrice(price)}</span>
                      <span className="text-xs text-[var(--ink-lo)] font-semibold"> /mês</span>
                      {isAnnual && <p className="text-[10px] text-green-400 mt-0.5">Cobrado anualmente ({formatPrice(price * 12)}/ano)</p>}
                    </div>

                    <button
                      onClick={() => !isCurrentActivePlan && handleInitCheckout(plan.id)}
                      disabled={isCurrentActivePlan}
                      className={`w-full py-3 text-xs font-bold rounded-xl transition-all ${
                        isCurrentActivePlan
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 cursor-default'
                          : plan.popular
                            ? 'bg-[var(--color-brand-deep)] hover:bg-blue-600 text-white shadow-lg shadow-blue-950/20'
                            : 'bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] text-[var(--ink-hi)]'
                      }`}
                    >
                      {isCurrentActivePlan ? 'Plano Atual Ativo' : 'Assinar Plano'}
                    </button>

                    {/* Features block */}
                    <div className="pt-4 space-y-2.5">
                      <p className="text-[10px] uppercase font-bold text-[var(--ink-dim)] tracking-wide">Recursos incluídos:</p>
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <Check size={14} className="text-blue-500 mt-0.5 shrink-0" />
                          <span className="text-[var(--ink)] leading-tight">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[var(--bg)] border border-[var(--line)]/60 rounded-2xl p-5 text-left flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-[var(--panel)] text-[var(--ink-lo)] rounded text-[9px] uppercase font-bold">Seu plano atual</span>
              <p className="text-sm font-bold text-[var(--ink-hi)]">
                PwStreamer {user ? user.plan : 'Trial'}
                {user?.plan === 'Free Trial' ? ` (${user.trialDays} dias restantes)` : ' - Acesso Completo'}
              </p>
              <p className="text-xs text-[var(--ink-dim)]">Seu plano é cobrado de forma automática e transparente. Cancele ou alterne a qualquer momento.</p>
            </div>
            {/* Isto rebaixava o plano NA HORA, num clique, sem confirmar — a
                ação mais destrutiva desta tela era a mais fácil de disparar
                por engano. Agora passa pelo ConfirmDialog, que existe
                exatamente para isto.
                Fica `ghost` e não `danger`: cancelar não deve ser o botão mais
                gritante da página. O peso vem da confirmação. */}
            {user?.plan !== 'Free Trial' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Cancelar assinatura?',
                    description: `O plano ${user?.plan} volta para o Gratuito e os recursos pagos deixam de funcionar.`,
                    confirmLabel: 'Cancelar assinatura',
                    cancelLabel: 'Manter plano',
                    destructive: true,
                  });
                  if (!ok) return;
                  onUpdateUser({ ...user, plan: 'Free Trial', trialDays: 30 });
                  toast.success('Sua assinatura foi alterada de volta para o Plano Gratuito.');
                }}
              >
                Cancelar Assinatura
              </Button>
            )}
          </div>
        </div>
      )}

      {/* RENDER VIEW 1.2: REAL TIME INTERACTIVE INTEGRATED CHECKOUT WITH GATEWAYS (Stripe, Paypal, Mercado Pago) */}
      {activeSubTab === 'plans' && checkoutStep !== 'none' && (
        <div {...subAbas.panel('plans')} className="max-w-xl mx-auto bg-[var(--surface)] border border-[var(--line)] rounded-2xl overflow-hidden shadow-2xl text-left animate-in zoom-in-95 duration-150">
          
          {/* Checkout Steps Indicator */}
          <div className="grid grid-cols-3 bg-[var(--bg)] border-b border-[var(--line)] text-center text-[10px] font-bold uppercase tracking-wider text-[var(--ink-dim)]">
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
                <h3 className="text-lg font-bold text-[var(--ink-hi)]">Como deseja pagar sua assinatura?</h3>
                <p className="text-xs text-[var(--ink-lo)]">Trabalhamos com os gateways mais seguros do mercado nacional e internacional.</p>
              </div>

              {/* Gateway selector buttons */}
              <div className="space-y-3">
                {/* Stripe Card option */}
                <button
                  type="button"
                  aria-pressed={selectedGateway === 'stripe'}
                  onClick={() => setSelectedGateway('stripe')}
                  className={`w-full p-4 flex items-center justify-between rounded-xl border transition-all text-left ${
                    selectedGateway === 'stripe' 
                      ? 'bg-blue-500/5 border-blue-500 ring-1 ring-blue-500/25' 
                      : 'bg-[var(--bg)] border-[var(--line)] hover:border-[var(--line-ctl)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#4F5BFF]/15 border border-[#4F5BFF]/20 rounded-lg flex items-center justify-center font-bold text-[#4F5BFF] tracking-wider text-xs">
                      Stripe
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--ink-hi)]">Stripe Checkout</p>
                      <p className="text-[10px] text-[var(--ink-lo)]">Pague com cartão de crédito internacional e aprovação instantânea.</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedGateway === 'stripe' ? 'border-blue-500 bg-blue-500' : 'border-[var(--line-ctl)]'}`}>
                    {selectedGateway === 'stripe' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
                </button>

                {/* PayPal option */}
                <button
                  type="button"
                  aria-pressed={selectedGateway === 'paypal'}
                  onClick={() => setSelectedGateway('paypal')}
                  className={`w-full p-4 flex items-center justify-between rounded-xl border transition-all text-left ${
                    selectedGateway === 'paypal' 
                      ? 'bg-blue-500/5 border-blue-500 ring-1 ring-blue-500/25' 
                      : 'bg-[var(--bg)] border-[var(--line)] hover:border-[var(--line-ctl)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#003087]/15 border border-[#003087]/20 rounded-lg flex items-center justify-center font-black text-[#0079C1] italic text-xs">
                      PayPal
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--ink-hi)]">PayPal Checkout</p>
                      <p className="text-[10px] text-[var(--ink-lo)]">Pague direto de sua carteira PayPal via saldo ou cartão cadastrado.</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedGateway === 'paypal' ? 'border-blue-500 bg-blue-500' : 'border-[var(--line-ctl)]'}`}>
                    {selectedGateway === 'paypal' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
                </button>

                {/* Mercado Pago option */}
                <button
                  type="button"
                  aria-pressed={selectedGateway === 'mercadopago'}
                  onClick={() => setSelectedGateway('mercadopago')}
                  className={`w-full p-4 flex items-center justify-between rounded-xl border transition-all text-left ${
                    selectedGateway === 'mercadopago' 
                      ? 'bg-blue-500/5 border-blue-500 ring-1 ring-blue-500/25' 
                      : 'bg-[var(--bg)] border-[var(--line)] hover:border-[var(--line-ctl)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#009EE3]/15 border border-[#009EE3]/20 rounded-lg flex items-center justify-center font-bold text-[#009EE3] text-[10px] uppercase">
                      MPago
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--ink-hi)]">Mercado Pago</p>
                      <p className="text-[10px] text-[var(--ink-lo)]">Pague via PIX nacional instantâneo ou cartão de crédito parcelado.</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedGateway === 'mercadopago' ? 'border-blue-500 bg-blue-500' : 'border-[var(--line-ctl)]'}`}>
                    {selectedGateway === 'mercadopago' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
                </button>
              </div>

              {/* Order summary detail card */}
              <div className="bg-[var(--bg)] p-4 rounded-xl border border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink-lo)]">
                  <span>Plano selecionado:</span>
                  <span className="text-[var(--ink-hi)] font-bold">{selectedUpgradePlan} ({isAnnual ? 'Anual' : 'Mensal'})</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-blue-400 border-t border-[var(--line)]/80 pt-2">
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
                  className="py-3 bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] text-xs font-bold text-[var(--ink-hi)] rounded-xl transition-all text-center"
                >
                  Voltar para Planos
                </button>
                <button
                  type="button"
                  onClick={handleConfirmGateway}
                  className="py-3 bg-[var(--color-brand-deep)] hover:bg-blue-600 text-xs font-bold text-white rounded-xl transition-all text-center flex items-center justify-center gap-1.5"
                >
                  Prosseguir <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS INSERTION & CREDENTIAL HINTS */}
          {checkoutStep === 'details' && (
            <form onSubmit={handleProcessPayment} className="p-6 space-y-6">
              
              <div className="flex justify-between items-center border-b border-[var(--line)] pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-[var(--ink-hi)] uppercase tracking-wider flex items-center gap-1">
                    <Lock size={14} className="text-emerald-500" />
                    Pagamento {selectedGateway === 'stripe' ? 'Stripe' : selectedGateway === 'paypal' ? 'PayPal' : 'Mercado Pago'}
                  </h3>
                  <p className="text-[11px] text-[var(--ink-lo)]">Ambiente de Testes Sandbox Ativo</p>
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
                  {/* Credencial de teste é ferramenta de desenvolvimento e sai
                      do build de produção. O aviso de que não há cobrança
                      real continua visível para todos, logo abaixo. */}
                  {IS_DEV && <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                      <Sparkles size={14} />
                      <span>Dados de Cartão de Testes Stripe</span>
                    </div>
                    <p className="text-[10px] text-[var(--ink-lo)]">
                      Utilize o cartão de testes abaixo para simular o faturamento real sem cobrar taxas:
                    </p>
                    <div className="flex items-center justify-between bg-[var(--bg)] p-2 rounded-lg text-[11px] font-mono border border-[var(--line)]/80">
                      <span className="text-[var(--ink-hi)]">Nº: 4242 4242 4242 4242 | CVV: 424 | MM/AA: 12/29</span>
                      <button 
                        type="button"
                        onClick={handleUseStripeTestCard}
                        className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-[9px] font-sans font-bold"
                      >
                        Autopreencher
                      </button>
                    </div>
                  </div>}

                  <div className="p-4 bg-[var(--bg)] rounded-2xl border border-[var(--line)] space-y-3">
                    <div className="space-y-1">
                      <label htmlFor="billingdashboard-numero-do-cartao" className="text-[10px] uppercase font-bold text-[var(--ink-dim)]">Número do Cartão</label>
                      <input autoComplete="cc-number" id="billingdashboard-numero-do-cartao" 
                        type="text" 
                        required
                        value={stripeCardNumber}
                        onChange={(e) => setStripeCardNumber(e.target.value)}
                        className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="billingdashboard-validade" className="text-[10px] uppercase font-bold text-[var(--ink-dim)]">Validade</label>
                        <input autoComplete="cc-exp" id="billingdashboard-validade" 
                          type="text" 
                          required
                          value={stripeExpiry}
                          onChange={(e) => setStripeExpiry(e.target.value)}
                          placeholder="MM/AA"
                          className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="billingdashboard-cvc" className="text-[10px] uppercase font-bold text-[var(--ink-dim)]">CVC</label>
                        <input autoComplete="cc-csc" id="billingdashboard-cvc" 
                          type="password" 
                          required
                          value={stripeCvc}
                          onChange={(e) => setStripeCvc(e.target.value)}
                          placeholder="424"
                          maxLength={4}
                          className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="billingdashboard-nome-do-titular" className="text-[10px] uppercase font-bold text-[var(--ink-dim)]">Nome do Titular</label>
                      <input autoComplete="cc-name" id="billingdashboard-nome-do-titular" 
                        type="text" 
                        required
                        value={stripeCardName}
                        onChange={(e) => setStripeCardName(e.target.value.toUpperCase())}
                        className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink-hi)] uppercase focus:outline-none focus:border-blue-500 transition-all"
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
                    <p className="text-[10px] text-[var(--ink-lo)]">
                      Simule o login na sua carteira digital para aprovar a cobrança recorrente mensal:
                    </p>
                  </div>

                  <div className="p-4 bg-[var(--bg)] rounded-2xl border border-[var(--line)] space-y-3 text-left">
                    <div className="space-y-1">
                      <label htmlFor="billingdashboard-e-mail-do-sandbox-paypal" className="text-[10px] uppercase font-bold text-[var(--ink-dim)]">E-mail do Sandbox PayPal</label>
                      <input autoComplete="off" id="billingdashboard-e-mail-do-sandbox-paypal" 
                        type="email" 
                        required
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[var(--ink-hi)] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="billingdashboard-senha" className="text-[10px] uppercase font-bold text-[var(--ink-dim)]">Senha</label>
                      <input autoComplete="off" id="billingdashboard-senha" 
                        type="password" 
                        required
                        value={paypalPassword}
                        onChange={(e) => setPaypalPassword(e.target.value)}
                        className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[var(--ink-hi)] focus:outline-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPaypalAuthorized(true);
                          toast.success('Sandbox PayPal: Conta autenticada com sucesso!');
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
                  <div className="flex bg-[var(--bg)] border border-[var(--line)] rounded-xl p-1">
                    <button
                      type="button"
                      aria-pressed={mpMethod === 'pix'}
                      onClick={() => setMpMethod('pix')}
                      className={`flex-1 text-center py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        mpMethod === 'pix' ? 'bg-[var(--color-brand-deep)] text-white' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                      }`}
                    >
                      PIX Instantâneo
                    </button>
                    <button
                      type="button"
                      aria-pressed={mpMethod === 'card'}
                      onClick={() => setMpMethod('card')}
                      className={`flex-1 text-center py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        mpMethod === 'card' ? 'bg-[var(--color-brand-deep)] text-white' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                      }`}
                    >
                      Cartão Mercado Pago
                    </button>
                  </div>

                  {mpMethod === 'pix' ? (
                    <div className="p-4 bg-[var(--bg)] rounded-2xl border border-[var(--line)] text-center space-y-4">
                      <div className="flex justify-center">
                        <div className="p-3 bg-white rounded-xl">
                          <QrCode size={140} className="text-slate-950" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-[var(--ink-hi)]">Escaneie o QR Code PIX para Teste</p>
                        <p className="text-[10px] text-[var(--ink-lo)] max-w-sm mx-auto">
                          A aprovação é simulada imediatamente ao confirmar o pagamento no botão inferior.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--line)]/80">
                        <input aria-label="Chave PIX" 
                          type="text" 
                          readOnly 
                          value="00020126580014br.gov.bcb.pix0136pwstreamer-mercado-pago-sandbox-key-98" 
                          className="bg-transparent text-[10px] text-[var(--ink-lo)] select-all font-mono focus:outline-none flex-1 truncate"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPixCopied(true);
                            copyText("00020126580014br.gov.bcb.pix0136pwstreamer-mercado-pago-sandbox-key-98");
                            setTimeout(() => setPixCopied(false), 2000);
                          }}
                          className="px-2.5 py-1 bg-[var(--color-brand-deep)] hover:bg-blue-600 text-white rounded text-[10px] font-bold shrink-0"
                        >
                          {pixCopied ? 'Copiado!' : 'Copiar Chave'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {IS_DEV && <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                          <Sparkles size={14} />
                          <span>Cartão de teste Mercado Pago</span>
                        </div>
                        <div className="flex items-center justify-between bg-[var(--bg)] p-2 rounded-lg text-[11px] font-mono border border-[var(--line)]/80">
                          <span className="text-[var(--ink-hi)]">Nº: 5031 4000 1234 5678 | CVV: 123</span>
                          <button 
                            type="button"
                            onClick={handleUseMpTestCard}
                            className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-[9px] font-sans font-bold"
                          >
                            Autopreencher
                          </button>
                        </div>
                      </div>}

                      <div className="p-4 bg-[var(--bg)] rounded-2xl border border-[var(--line)] space-y-3">
                        <div className="space-y-1">
                          <label htmlFor="billingdashboard-numero-do-cartao-2" className="text-[10px] uppercase font-bold text-[var(--ink-dim)]">Número do Cartão</label>
                          <input autoComplete="cc-number" id="billingdashboard-numero-do-cartao-2" 
                            type="text" 
                            required
                            value={mpCardNumber}
                            onChange={(e) => setMpCardNumber(e.target.value)}
                            className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[var(--ink-hi)] focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label htmlFor="billingdashboard-validade-2" className="text-[10px] uppercase font-bold text-[var(--ink-dim)]">Validade</label>
                            <input autoComplete="cc-exp" id="billingdashboard-validade-2" 
                              type="text" 
                              required
                              value={mpExpiry}
                              onChange={(e) => setMpExpiry(e.target.value)}
                              className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[var(--ink-hi)] focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="billingdashboard-cvc-2" className="text-[10px] uppercase font-bold text-[var(--ink-dim)]">CVC</label>
                            <input autoComplete="cc-csc" id="billingdashboard-cvc-2" 
                              type="password" 
                              required
                              value={mpCvc}
                              onChange={(e) => setMpCvc(e.target.value)}
                              className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[var(--ink-hi)] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="billingdashboard-nome-completo" className="text-[10px] uppercase font-bold text-[var(--ink-dim)]">Nome Completo</label>
                          <input autoComplete="cc-name" id="billingdashboard-nome-completo" 
                            type="text" 
                            required
                            value={mpCardName}
                            onChange={(e) => setMpCardName(e.target.value.toUpperCase())}
                            className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink-hi)] uppercase focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Secure verification alert info */}
              {/* Verde com tique é o vocabulário de "aprovado". Usá-lo para
                  dizer que NÃO há cobrança faz o comprador ler o aviso como
                  confirmação. Âmbar e triângulo dizem "atenção", que é o que
                  esta frase é. Mesma troca feita no checkout público. */}
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-xs text-amber-200">
                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-bold text-[var(--ink-hi)]">Nenhuma cobrança será feita.</strong>{' '}
                  Este fluxo ainda não processa pagamento real — nenhum valor é debitado.
                </span>
              </div>

              {/* Invoice subtotal summary detail card */}
              <div className="p-3.5 bg-[var(--bg)] rounded-xl border border-[var(--line)]/80 space-y-1 text-xs text-[var(--ink)]">
                <div className="flex justify-between">
                  <span>Subtotal do plano:</span>
                  <span className="font-mono text-[var(--ink-hi)] font-bold">
                    ${isAnnual 
                      ? (plansData.find(p => p.id === selectedUpgradePlan)?.priceAnnual || 0) 
                      : (plansData.find(p => p.id === selectedUpgradePlan)?.priceMonthly || 0)
                    }.00
                  </span>
                </div>
                <div className="flex justify-between text-[var(--ink-dim)]">
                  <span>Descontos / Promoção:</span>
                  <span>{formatPrice(0)}</span>
                </div>
                <div className="flex justify-between text-blue-400 font-extrabold text-sm border-t border-[var(--line)] pt-1.5 mt-1.5">
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
                  className="py-3 bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] text-xs font-bold text-[var(--ink-hi)] rounded-xl transition-all text-center"
                >
                  Voltar
                </button>
                {/* Era `bg-emerald-600`. O sistema tem dois matizes — marca e
                    sinal — e verde não é um deles. Confirmar pagamento é a
                    ação primária da tela, então ela usa a marca. O `disabled`
                    composto continua: PayPal exige autorização antes. */}
                <Button
                  type="submit"
                  loading={isProcessingPayment}
                  disabled={selectedGateway === 'paypal' && !isPaypalAuthorized}
                >
                  {isProcessingPayment ? 'Processando...' : <>Confirmar Assinatura <Check size={14} /></>}
                </Button>
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
                <h3 className="text-xl font-bold text-[var(--ink-hi)] font-sans">Assinatura Ativada com Sucesso!</h3>
                <p className="text-xs text-[var(--ink-lo)] max-w-sm mx-auto leading-relaxed">
                  Parabéns! O seu pagamento foi processado com sucesso pelo gateway parceiro. Seu plano <strong className="text-[var(--ink-hi)] uppercase font-extrabold">{selectedUpgradePlan}</strong> está ativo de imediato.
                </p>
              </div>

              <div className="bg-[var(--bg)] p-4 rounded-xl border border-[var(--line)]/80 text-left space-y-2 text-xs">
                <p className="text-[10px] font-bold text-[var(--ink-dim)] uppercase tracking-wider">Resumo do Faturamento</p>
                <div className="flex justify-between text-[var(--ink)]">
                  <span>Plano Ativo:</span>
                  <span className="font-bold text-[var(--ink-hi)]">{selectedUpgradePlan}</span>
                </div>
                <div className="flex justify-between text-[var(--ink)]">
                  <span>Ciclo de Cobrança:</span>
                  <span>{isAnnual ? 'Cobrança Anual' : 'Cobrança Mensal'}</span>
                </div>
                <div className="flex justify-between text-[var(--ink)]">
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
                  className="w-full py-3 bg-[var(--color-brand-deep)] hover:bg-blue-600 text-xs font-bold text-white rounded-xl transition-all text-center"
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
        <div {...subAbas.panel('profile')} className="max-w-2xl mx-auto bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 text-left space-y-6">
          <div className="border-b border-[var(--line)] pb-4">
            <h2 className="text-base font-bold text-[var(--ink-hi)] flex items-center gap-2">
              <User size={18} className="text-blue-500" /> Informações Cadastrais & Fiscais
            </h2>
            <p className="text-xs text-[var(--ink-lo)]">Mantenha seus dados atualizados para a correta emissão e envio de faturas e recibos de pagamento.</p>
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
                <label htmlFor="billingdashboard-nome-completo-2" className="text-xs font-semibold text-[var(--ink)]">Nome Completo</label>
                <div className="relative">
                  <input autoComplete="name" id="billingdashboard-nome-completo-2" 
                    type="text" 
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <User size={14} className="absolute left-3.5 top-3.5 text-[var(--ink-dim)]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="billingdashboard-endereco-de-e-mail" className="text-xs font-semibold text-[var(--ink)]">Endereço de E-mail</label>
                <div className="relative">
                  <input autoComplete="email" id="billingdashboard-endereco-de-e-mail" 
                    type="email" 
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <Mail size={14} className="absolute left-3.5 top-3.5 text-[var(--ink-dim)]" />
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--line)]/60 pt-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-lo)]">Dados de Emissão Fiscal (Invoice / NF-e)</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="billingdashboard-razao-social-nome-de-faturamento" className="text-xs font-semibold text-[var(--ink)]">Razão Social / Nome de Faturamento</label>
                  <div className="relative">
                    <input autoComplete="organization" id="billingdashboard-razao-social-nome-de-faturamento" 
                      type="text" 
                      placeholder="Ex: Minha Empresa de Tecnologia Ltda"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500"
                    />
                    <Briefcase size={14} className="absolute left-3.5 top-3.5 text-[var(--ink-dim)]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="billingdashboard-cnpj-cpf-documento-fiscal" className="text-xs font-semibold text-[var(--ink)]">CNPJ / CPF / Documento Fiscal</label>
                  <div className="relative">
                    <input id="billingdashboard-cnpj-cpf-documento-fiscal" 
                      type="text" 
                      placeholder="Ex: 00.000.000/0001-00"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500"
                    />
                    <FileText size={14} className="absolute left-3.5 top-3.5 text-[var(--ink-dim)]" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="billingdashboard-endereco-completo-de-cobranca" className="text-xs font-semibold text-[var(--ink)]">Endereço Completo de Cobrança</label>
                <textarea id="billingdashboard-endereco-completo-de-cobranca" 
                  rows={2}
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* O spinner manual saiu: `loading` já desenha o dele e ainda
                marca `aria-busy`, que faltava aqui. */}
            <Button type="submit" loading={isSavingProfile}>
              {isSavingProfile ? 'Salvando dados...' : <>Salvar Alterações <Check size={14} /></>}
            </Button>
          </form>
        </div>
      )}

      {/* RENDER VIEW 3: BILLING HISTORY AND SIMULATED RECEIPTS TAB */}
      {activeSubTab === 'billing-history' && (
        <div {...subAbas.panel('billing-history')} className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 text-left space-y-6">
          <div className="border-b border-[var(--line)] pb-4">
            <h2 className="text-base font-bold text-[var(--ink-hi)] flex items-center gap-2">
              <FileText size={18} className="text-blue-500" /> Histórico de Transações & Faturas
            </h2>
            <p className="text-xs text-[var(--ink-lo)]">Verifique os comprovantes de pagamentos anteriores e baixe os recibos fiscais de suas mensalidades.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--line)]/80 text-[var(--ink-dim)] uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">ID da Fatura</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Plano Adquirido</th>
                  <th className="py-3 px-4">Valor Pago</th>
                  <th className="py-3 px-4">Gateway</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]/40">
                {invoices.map((invoice, i) => (
                  <tr key={invoice.id || i} className="hover:bg-[var(--panel)]/20 text-[var(--ink)]">
                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--ink-hi)]">{invoice.id}</td>
                    <td className="py-3.5 px-4">{invoice.date}</td>
                    <td className="py-3.5 px-4">{invoice.plan}</td>
                    <td className="py-3.5 px-4 font-bold">{formatPrice(invoice.amount)}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--panel)] text-[var(--ink)] border border-[var(--line-ctl)]/60">
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
                          className="p-1.5 bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] rounded-lg text-blue-400 hover:text-[var(--ink-hi)] transition-all cursor-pointer"
                          title="Visualizar Recibo de Fatura"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(invoice)}
                          className="p-1.5 bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] rounded-lg text-emerald-400 hover:text-[var(--ink-hi)] transition-all cursor-pointer"
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
            <Modal isOpen onClose={() => setSelectedInvoiceForModal(null)} bare ariaLabel="Detalhes da fatura">
              <div className="bg-[var(--surface)] border border-[var(--line)] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl text-left">
                <div className="bg-[var(--bg)] px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 font-mono">Detalhes da Fatura {selectedInvoiceForModal.id}</span>
                  <button 
                    onClick={() => setSelectedInvoiceForModal(null)}
                    className="text-[var(--ink-lo)] hover:text-[var(--ink-hi)] font-bold"
                  >
                    Fechar
                  </button>
                </div>

                <div className="p-6 space-y-4 text-xs text-[var(--ink)]">
                  <div className="flex justify-between border-b border-[var(--line)]/60 pb-2">
                    <span className="text-[var(--ink-dim)] font-bold">PWSTREAMER STUDIO</span>
                    <span className="text-emerald-400 uppercase font-black tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">PAGO</span>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase font-bold text-[var(--ink-dim)] tracking-wider">Dados da Fatura</p>
                    <div className="flex justify-between">
                      <span>Código de Transação:</span>
                      <span className="text-[var(--ink-hi)] font-mono font-bold">{selectedInvoiceForModal.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data do Faturamento:</span>
                      <span className="text-[var(--ink-hi)]">{selectedInvoiceForModal.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gateway de Pagamento:</span>
                      <span className="text-[var(--ink-hi)]">{selectedInvoiceForModal.gateway} (Teste)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-[var(--line)]/40 pt-3">
                    <p className="text-[10px] uppercase font-bold text-[var(--ink-dim)] tracking-wider">Faturado Para</p>
                    <div className="flex justify-between">
                      <span>Assinante:</span>
                      <span className="text-[var(--ink-hi)]">{profileName || 'Marcos Gonçalves'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Empresa:</span>
                      <span className="text-[var(--ink-hi)]">{companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Documento Fiscal:</span>
                      <span className="text-[var(--ink-hi)]">{taxId}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-[var(--line)]/40 pt-3">
                    <p className="text-[10px] uppercase font-bold text-[var(--ink-dim)] tracking-wider">Descrição dos Itens</p>
                    <div className="flex justify-between text-[var(--ink-hi)] font-semibold bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--line)]">
                      <span>Assinatura {selectedInvoiceForModal.plan}</span>
                      <span>{formatPrice(selectedInvoiceForModal.amount)}</span>
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
                      className="py-2.5 bg-[var(--bg)] border border-[var(--line)] hover:bg-[var(--panel)] text-[var(--ink-hi)] text-xs font-bold rounded-xl transition-all text-center"
                    >
                      Fechar Janela
                    </button>
                  </div>
                </div>
              </div>
            </Modal>
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

        // O consumo somava o de dois colegas que não existem. Some só o do
        // proprietário, que é o único membro real — e o único assento em uso.
        const totalMinutesUsed = memberMinutes.marcos;
        const totalStorageUsed = Number(memberStorage.marcos.toFixed(1));

        const minutesPercentage = Math.round((totalMinutesUsed / activeLimits.minutes) * 100);
        const storagePercentage = Math.round((totalStorageUsed / activeLimits.storage) * 100);
        const seatsUsed = 1;

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
          <div {...subAbas.panel('metrics')} className="space-y-6">
            
            {/* Main stats card header comparing limits */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 text-left space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--line)] pb-4">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-[var(--ink-hi)] flex items-center gap-2">
                    <BarChart3 size={18} className="text-blue-500 animate-pulse" />
                    Painel Consolidado de Consumo de Recursos
                  </h2>
                  <p className="text-xs text-[var(--ink-lo)]">
                    Sua equipe está utilizando o plano <strong className="text-blue-400 uppercase font-black">PwStreamer {currentPlan}</strong>. Veja os limites atuais e o consumo por usuário.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {IS_DEV && <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold">
                    Sandbox de Teste Ativo
                  </span>}
                  {IS_DEV && <button
                    onClick={handleResetSimulations}
                    className="p-2 bg-[var(--bg)] border border-[var(--line)] hover:bg-[var(--surface)] rounded-lg text-[var(--ink-lo)] hover:text-[var(--ink-hi)] transition-all text-xs flex items-center gap-1 cursor-pointer font-bold"
                    title="Restaurar consumos iniciais"
                  >
                    <Trash2 size={13} />
                    Limpar Testes
                  </button>}
                </div>
              </div>

              {/* Progress bars & Limits summary visual meters */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Meter 1: Streaming Minutes */}
                <div className="bg-[var(--bg)] border border-[var(--line)]/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink-lo)]">
                      <Clock size={15} className="text-blue-400" />
                      <span>Uso de Minutos</span>
                    </div>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full bg-[var(--surface)]/60 ${getProgressTextColor(minutesPercentage)} border border-[var(--line)]`}>
                      {minutesPercentage}%
                    </span>
                  </div>
                  <div className="space-y-1 text-left">
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-black text-[var(--ink-hi)] font-mono">{totalMinutesUsed}</p>
                      <span className="text-xs text-[var(--ink-dim)] font-semibold">/ {activeLimits.minutes} min</span>
                    </div>
                    <p className="text-[10px] text-[var(--ink-lo)]">Tempo acumulado de lives transmitidas no mês</p>
                  </div>
                  <div className="w-full bg-[var(--panel)] h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(minutesPercentage)}`}
                      style={{ width: `${Math.min(100, minutesPercentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[var(--ink-dim)]">
                    <span>Disponível: {Math.max(0, activeLimits.minutes - totalMinutesUsed)} min</span>
                    <span>Renova em 20 dias</span>
                  </div>
                </div>

                {/* Meter 2: Video Cloud Storage */}
                <div className="bg-[var(--bg)] border border-[var(--line)]/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink-lo)]">
                      <Database size={15} className="text-emerald-400" />
                      <span>Storage de Vídeos</span>
                    </div>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full bg-[var(--surface)]/60 ${getProgressTextColor(storagePercentage)} border border-[var(--line)]`}>
                      {storagePercentage}%
                    </span>
                  </div>
                  <div className="space-y-1 text-left">
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-black text-[var(--ink-hi)] font-mono">{totalStorageUsed}</p>
                      <span className="text-xs text-[var(--ink-dim)] font-semibold">/ {activeLimits.storage} GB</span>
                    </div>
                    <p className="text-[10px] text-[var(--ink-lo)]">Armazenamento em nuvem de gravações salvas</p>
                  </div>
                  <div className="w-full bg-[var(--panel)] h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(storagePercentage)}`}
                      style={{ width: `${Math.min(100, storagePercentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[var(--ink-dim)]">
                    <span>Disponível: {Math.max(0, Number((activeLimits.storage - totalStorageUsed).toFixed(1)))} GB</span>
                    <span>Compactação ativa</span>
                  </div>
                </div>

                {/* Meter 3: Active seats inside limit */}
                <div className="bg-[var(--bg)] border border-[var(--line)]/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink-lo)]">
                      <Users size={15} className="text-purple-400" />
                      <span>Membros de Equipe</span>
                    </div>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-[var(--surface)]/60 text-purple-400 border border-[var(--line)]">
                      {Math.round((seatsUsed / activeLimits.seats) * 100)}%
                    </span>
                  </div>
                  <div className="space-y-1 text-left">
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-black text-[var(--ink-hi)] font-mono">{seatsUsed}</p>
                      <span className="text-xs text-[var(--ink-dim)] font-semibold">/ {activeLimits.seats} {activeLimits.seats === 1 ? 'membro' : 'membros'}</span>
                    </div>
                    <p className="text-[10px] text-[var(--ink-lo)]">Co-produtores com acesso simultâneo</p>
                  </div>
                  <div className="w-full bg-[var(--panel)] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(seatsUsed / activeLimits.seats) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[var(--ink-dim)]">
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
                    <p className="text-[11px] text-[var(--ink-lo)]">
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-lo)]">
                    Detalhamento do Consumo Individual por Usuário
                  </h3>
                  <span className="text-[10px] text-[var(--ink-dim)]">Assentos Ativos: {seatsUsed} de {activeLimits.seats} permitidos</span>
                </div>

                <div className="bg-[var(--bg)] border border-[var(--line)] rounded-2xl overflow-hidden divide-y divide-[var(--line)]/60">
                  
                  {/* User 1: Marcos Gonçalves (Owner) */}
                  <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-[var(--surface)]/40 transition-colors">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold flex items-center justify-center text-xs">
                        MG
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--ink-hi)] flex items-center gap-1.5">
                          {profileName || 'Marcos Gonçalves'}
                          <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/10 px-1.5 py-0.5 rounded-md font-bold uppercase">
                            Proprietário (Você)
                          </span>
                        </p>
                        <p className="text-[10px] text-[var(--ink-dim)]">{profileEmail || 'mgdlms@gmail.com'}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-xs w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <span className="text-[9px] text-[var(--ink-dim)] uppercase font-bold tracking-wider">Uso de Transmissão</span>
                        <p className="text-xs font-bold text-[var(--ink-hi)] font-mono">{memberMinutes.marcos} minutos</p>
                        <p className="text-[9px] text-[var(--ink-dim)]">~{Number((memberMinutes.marcos / 60).toFixed(1))} horas</p>
                      </div>
                      <div className="text-left sm:text-right border-l sm:border-l-0 sm:border-r border-[var(--line)] pl-4 sm:pl-0 sm:pr-4">
                        <span className="text-[9px] text-[var(--ink-dim)] uppercase font-bold tracking-wider">Storage de Vídeo</span>
                        <p className="text-xs font-bold text-[var(--ink-hi)] font-mono">{memberStorage.marcos} GB</p>
                        <p className="text-[9px] text-[var(--ink-dim)]">~{Math.round(memberStorage.marcos * 2)} arquivos salvos</p>
                      </div>
                      
                      {/* Controles de simulação: deixam o usuário inflar o
                          próprio consumo na tela de cobrança. Ferramenta de
                          desenvolvimento, sai do build de produção. */}
                      {IS_DEV && <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSimulateMinutes('marcos', 15)}
                          className="px-2 py-1 bg-[var(--surface)] hover:bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--line-ctl)] text-[10px] font-bold text-[var(--ink)] hover:text-[var(--ink-hi)] rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
                          title="Simular transmissão de +15m"
                        >
                          <Plus size={10} /> 15m
                        </button>
                        <button
                          onClick={() => handleSimulateStorage('marcos', 0.5)}
                          className="px-2 py-1 bg-[var(--surface)] hover:bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--line-ctl)] text-[10px] font-bold text-[var(--ink)] hover:text-[var(--ink-hi)] rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
                          title="Simular gravação de +0.5GB"
                        >
                          <Plus size={10} /> 0.5GB
                        </button>
                      </div>}
                    </div>
                  </div>


                  {/* Aqui viviam dois colegas de equipe fixos no codigo —
                      "Ana Beatriz · Co-Produtor" e "Lucas Lima · Moderador",
                      com e-mail @pwstreamer.com e consumo semeado — na conta
                      de TODO cliente. Pior: quando o plano nao cobria o
                      assento, apareciam marcados "Bloqueado" ao lado de
                      "Desbloquear Assento (Professional)". Era prova social
                      fabricada usada como argumento de venda: o cliente pagava
                      para liberar pessoas que nunca existiram.
                      Nao ha backend de equipe — so o proprietario e real. */}
                  <div className="p-6 text-center space-y-1">
                    <p className="text-xs font-semibold text-[var(--ink)]">Nenhum membro convidado ainda</p>
                    <p className="text-[11px] text-[var(--ink-lo)]">
                      Seu plano permite {activeLimits.seats} {activeLimits.seats === 1 ? 'assento' : 'assentos'}.
                      Voce esta usando 1.
                    </p>
                  </div>

                </div>
              </div>

              {/* Informational tech parameters specs list card */}
              <div className="bg-[var(--bg)] border border-[var(--line)] p-5 rounded-2xl text-left space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-lo)]">Qualidade Técnica e Limites Estruturais ({currentPlan})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[var(--ink)]">
                  <div className="flex items-center gap-2 bg-[var(--surface)] p-3 rounded-xl border border-[var(--line)]/60">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Transmissão simultânea: Até {activeLimits.destinations} destinos de canais</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[var(--surface)] p-3 rounded-xl border border-[var(--line)]/60">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Resolução de Transmissão: {currentPlan === 'Free Trial' ? 'HD 720p Max' : 'Full HD 1080p Ultra'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[var(--surface)] p-3 rounded-xl border border-[var(--line)]/60">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Backup RTMP profissional: {currentPlan === 'Business' ? 'Incluso com reconexão' : 'Indisponível neste plano'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[var(--surface)] p-3 rounded-xl border border-[var(--line)]/60">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Suporte técnico prioritário: {currentPlan === 'Business' ? '24/7 via Chat Ativo' : 'Apenas por E-mail regular'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </main>
  );
}
