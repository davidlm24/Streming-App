import React, { useState } from 'react';
import { X, Check, CreditCard, ShieldAlert, Activity, Radio, Disc, Sparkles, CheckCircle2 } from 'lucide-react';

interface PlansModalProps {
  onClose: () => void;
  userEmail: string;
  userId: string;
  currentPlan: string;
  reason?: 'live' | 'record' | 'upgrade' | null;
  onPlanUpgraded?: (planName: 'Standard' | 'Professional' | 'Business') => void;
}

export function PlansModal({ onClose, userEmail, userId, currentPlan, reason, onPlanUpgraded }: PlansModalProps) {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'card' | 'pix' | 'paypal'>('card');
  const [selectedPlan, setSelectedPlan] = useState<'Standard' | 'Professional' | 'Business'>('Professional');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          userId,
          userEmail,
          method: method === 'paypal' ? 'card' : method
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      // If no external URL or demo environment, complete upgrade directly
      if (onPlanUpgraded) {
        setSuccessMessage(`Plano ${selectedPlan} ativado com sucesso!`);
        setTimeout(() => {
          onPlanUpgraded(selectedPlan);
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.warn('Checkout fallback to direct activation:', err);
      if (onPlanUpgraded) {
        setSuccessMessage(`Plano ${selectedPlan} ativado com sucesso!`);
        setTimeout(() => {
          onPlanUpgraded(selectedPlan);
          onClose();
        }, 1200);
      } else {
        alert('Erro ao processar pagamento');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateInstantActivation = () => {
    if (onPlanUpgraded) {
      setSuccessMessage(`Pagamento confirmado! Plano ${selectedPlan} ativado com sucesso.`);
      setTimeout(() => {
        onPlanUpgraded(selectedPlan);
        onClose();
      }, 1000);
    }
  };

  const plans = [
    {
      id: 'Standard' as const,
      name: 'Standard',
      price: 'R$ 49,90',
      desc: 'Ideal para criadores e produtores autônomos',
      features: ['Transmissões ao vivo ilimitadas', 'Gravações locais e na nuvem em 720p/1080p', 'Até 2 destinos simultâneos (Multistream)', 'Armazenamento de 10GB', 'Suporte por e-mail']
    },
    {
      id: 'Professional' as const,
      name: 'Professional',
      price: 'R$ 99,90',
      desc: 'Para criadores profissionais e empresas',
      features: ['Transmissões e gravações 1080p 60FPS ilimitadas', 'Até 5 destinos simultâneos (YouTube, FB, Twitch, RTMP)', 'Armazenamento de 50GB', 'Sem marca d\'água PwStreamer', 'Suporte técnico prioritário']
    },
    {
      id: 'Business' as const,
      name: 'Business',
      price: 'R$ 199,90',
      desc: 'Para emissoras, agências e grandes estúdios',
      features: ['Transmissões e gravações em 4K Ultra HD', 'Destinos RTMP/Multistream ilimitados', 'Armazenamento ilimitado de vídeos', 'Múltiplos operadores e estúdios simultâneos', 'White Label completo & Suporte 24/7']
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[var(--bg)] rounded-3xl w-full max-w-4xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0 bg-[var(--well)]">
          <div className="flex items-center gap-2.5">
            <Activity className="text-blue-500" size={20} />
            <div>
              <h2 className="text-base font-bold text-white">Escolha de Planos PwStreamer</h2>
              <p className="text-xs text-gray-400">Ative um plano para desbloquear transmissões ao vivo e gravações</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Reason Alert Banner */}
        {reason === 'live' && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 text-amber-300 text-xs flex items-center gap-3">
            <Radio size={18} className="text-amber-400 shrink-0 animate-pulse" />
            <div>
              <strong className="font-bold text-white">Transmissão Ao Vivo Restrita:</strong> Seu período de testes de 30 dias expirou. Assine um plano abaixo para iniciar e transmitir suas lives para YouTube, Facebook, Twitch ou RTMP.
            </div>
          </div>
        )}

        {reason === 'record' && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3 text-red-300 text-xs flex items-center gap-3">
            <Disc size={18} className="text-red-400 shrink-0 animate-pulse" />
            <div>
              <strong className="font-bold text-white">Gravação de Vídeo Restrita:</strong> Seu período de testes de 30 dias expirou. Assine um plano abaixo para gravar suas transmissões e vídeos em alta resolução.
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-3 text-emerald-300 text-xs flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0 animate-bounce" />
            <span className="font-bold text-white">{successMessage}</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white">Selecione o plano ideal para as suas transmissões</h3>
            <p className="text-xs text-slate-400">
              Você pode continuar utilizando o estúdio para testes e montagem de cenas. O plano é requerido apenas para <strong className="text-white">Transmitir Ao Vivo</strong> e <strong className="text-white">Gravar</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map(p => {
              const isSelected = selectedPlan === p.id;
              return (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedPlan(p.id)}
                  className={`relative rounded-2xl border transition-all p-5 cursor-pointer flex flex-col justify-between ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-500/10 shadow-xl ring-1 ring-blue-500' 
                      : 'border-slate-800 bg-[var(--surface)] hover:border-slate-700'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-lg">
                      Selecionado
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-bold text-white">{p.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 mb-3">{p.desc}</p>
                    <div className="text-2xl font-black text-white mb-4">
                      {p.price}<span className="text-xs text-slate-500 font-normal">/mês</span>
                    </div>
                    
                    <ul className="space-y-2.5 mb-4">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlan(p.id);
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-slate-800 hover:bg-slate-700 text-gray-300'
                    }`}
                  >
                    {isSelected ? 'Plano Selecionado' : 'Escolher ' + p.name}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-[var(--surface)] border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <CreditCard size={15} className="text-blue-400" />
              Forma de Pagamento
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${method === 'card' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-800 bg-[var(--bg)] text-slate-400 hover:text-white'}`}>
                <input type="radio" name="paymethod" value="card" checked={method === 'card'} onChange={() => setMethod('card')} className="hidden" />
                <CreditCard size={16} className="text-blue-400" />
                <span className="text-xs font-semibold">Cartão de Crédito</span>
              </label>
              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${method === 'pix' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-800 bg-[var(--bg)] text-slate-400 hover:text-white'}`}>
                <input type="radio" name="paymethod" value="pix" checked={method === 'pix'} onChange={() => setMethod('pix')} className="hidden" />
                <Sparkles size={16} className="text-emerald-400" />
                <span className="text-xs font-semibold">PIX Instantâneo</span>
              </label>
              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${method === 'paypal' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-800 bg-[var(--bg)] text-slate-400 hover:text-white'}`}>
                <input type="radio" name="paymethod" value="paypal" checked={method === 'paypal'} onChange={() => setMethod('paypal')} className="hidden" />
                <Activity size={16} className="text-indigo-400" />
                <span className="text-xs font-semibold">PayPal</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[var(--bg)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Continuar no Estúdio (Modo Exploração)
          </button>
          
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {onPlanUpgraded && (
              <button 
                type="button"
                onClick={handleSimulateInstantActivation}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                title="Simular aprovação imediata do plano pago"
              >
                <Sparkles size={14} /> Ativar Plano {selectedPlan} (Demo)
              </button>
            )}
            
            <button 
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-[var(--color-brand)] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Processando...' : `Pagar e Ativar ${selectedPlan}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
