import React, { useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import { X, Check, CreditCard, ShieldAlert, Activity, Radio, Disc, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from './ui/Toast';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { PLANS, formatPrice } from '../lib/plans';

/** Vite remove o ramo inteiro no build de produção. Mesmo padrão de
 *  Header.tsx e AuthAndPricing.tsx. */
const IS_DEV = import.meta.env.DEV;

interface PlansModalProps {
  onClose: () => void;
  userEmail: string;
  userId: string;
  currentPlan: string;
  reason?: 'live' | 'record' | 'upgrade' | null;
  onPlanUpgraded?: (planName: 'Standard' | 'Professional' | 'Business') => void;
}

export function PlansModal({ onClose, userEmail, userId, currentPlan, reason, onPlanUpgraded }: PlansModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'card' | 'pix' | 'paypal'>('card');
  const [selectedPlan, setSelectedPlan] = useState<'Standard' | 'Professional' | 'Business'>('Professional');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubscribe = async () => {
    // Reentrância: sem isto, dois cliques rápidos abrem duas sessões de
    // cobrança. `loading` já existia, mas só desabilitava o botão — o que
    // não cobre Enter repetido nem clique durante o repintar.
    if (loading) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Quem assina sai do token de login (apiFetch), não do corpo.
        body: JSON.stringify({
          planId: selectedPlan,
          method: method === 'paypal' ? 'card' : method
        })
      });

      if (!res.ok) throw new Error(`checkout respondeu ${res.status}`);
      const data = await res.json();

      if (data.url) {
        // `loading` FICA ligado: a navegação leva centenas de ms e desligar
        // aqui devolve um botão clicável em cima de um redirect em curso.
        window.location.href = data.url;
        return;
      }

      // Resposta sem URL é resposta malformada, não permissão para ativar.
      // Este caminho concedia o plano pago — e era o mesmo buraco que o botão
      // "(Demo)" tinha aberto antes de ser removido (ver nota abaixo).
      // Em desenvolvimento a ativação direta continua útil; em produção o
      // Vite elimina o ramo inteiro.
      if (IS_DEV && onPlanUpgraded) {
        setSuccessMessage(`[DEV] Plano ${selectedPlan} ativado sem cobrança`);
        setTimeout(() => {
          onPlanUpgraded(selectedPlan);
          onClose();
        }, 1200);
        return;
      }
      throw new Error('checkout não retornou URL de pagamento');
    } catch (err) {
      // Falha de rede NÃO é pagamento aprovado. Antes, todo erro aqui caía
      // em "Plano ativado com sucesso!" e concedia o plano: offline, API
      // ausente, CORS, 500 — qualquer um liberava o pago de graça.
      console.error('Falha no checkout:', err);
      toast.error('Não foi possível iniciar o pagamento. Verifique a conexão e tente de novo.');
      setLoading(false);
    }
  };

  // handleSimulateInstantActivation foi removido junto com o botão "(Demo)"
  // que o chamava. Ele marcava "Pagamento confirmado!" e ativava o plano pago
  // sem cobrar — deixá-lo aqui manteria o caminho vivo para o próximo botão.
  // `onPlanUpgraded` continua sendo chamado pelo fluxo real de checkout.

  // Quarta copia do mesmo preco, agora removida. A modal mostra so os
  // tres planos pagos — o gratuito nao se 'assina'.
  const plans = PLANS.filter(p => p.id !== 'Free Trial');

  return (
    <Modal isOpen onClose={() => onClose()} bare ariaLabel="Escolha de planos">
      <div className="bg-[var(--bg)] rounded-3xl w-full max-w-4xl border border-[var(--line-ctl)]/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--line)] shrink-0 bg-[var(--well)]">
          <div className="flex items-center gap-2.5">
            <Activity className="text-blue-500" size={20} />
            <div>
              <h2 className="text-base font-bold text-[var(--ink-hi)]">Escolha de Planos PwStreamer</h2>
              <p className="text-xs text-[var(--ink-lo)]">Ative um plano para desbloquear transmissões ao vivo e gravações</p>
            </div>
          </div>
          <button aria-label="Fechar" 
            onClick={onClose} 
            className="p-2 hover:bg-[var(--panel)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)] rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Reason Alert Banner */}
        {reason === 'live' && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 text-amber-300 text-xs flex items-center gap-3">
            <Radio size={18} className="text-amber-400 shrink-0 animate-pulse" />
            <div>
              <strong className="font-bold text-[var(--ink-hi)]">Transmissão Ao Vivo Restrita:</strong> Seu período de testes de 30 dias expirou. Assine um plano abaixo para iniciar e transmitir suas lives para YouTube, Facebook, Twitch ou RTMP.
            </div>
          </div>
        )}

        {reason === 'record' && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3 text-red-300 text-xs flex items-center gap-3">
            <Disc size={18} className="text-red-400 shrink-0 animate-pulse" />
            <div>
              <strong className="font-bold text-[var(--ink-hi)]">Gravação de Vídeo Restrita:</strong> Seu período de testes de 30 dias expirou. Assine um plano abaixo para gravar suas transmissões e vídeos em alta resolução.
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-3 text-emerald-300 text-xs flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0 animate-confirm-in" />
            <span className="font-bold text-[var(--ink-hi)]">{successMessage}</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--ink-hi)]">Selecione o plano ideal para as suas transmissões</h3>
            <p className="text-xs text-[var(--ink-lo)]">
              Você pode continuar utilizando o estúdio para testes e montagem de cenas. O plano é requerido apenas para <strong className="text-[var(--ink-hi)]">Transmitir Ao Vivo</strong> e <strong className="text-[var(--ink-hi)]">Gravar</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map(p => {
              const isSelected = selectedPlan === p.id;
              return (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedPlan(p.id as 'Standard' | 'Professional' | 'Business')}
                  className={`relative rounded-2xl border transition-all p-5 cursor-pointer flex flex-col justify-between ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-500/10 shadow-xl ring-1 ring-blue-500' 
                      : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-ctl)]'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-lg">
                      Selecionado
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-bold text-[var(--ink-hi)]">{p.name}</h4>
                    <p className="text-xs text-[var(--ink-lo)] mt-1 mb-3">{p.description}</p>
                    <div className="text-2xl font-black text-[var(--ink-hi)] mb-4">
                      {formatPrice(p.priceMonthly)}<span className="text-xs text-[var(--ink-dim)] font-normal">/mês</span>
                    </div>
                    
                    <ul className="space-y-2.5 mb-4">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[var(--ink)]">
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
                      setSelectedPlan(p.id as 'Standard' | 'Professional' | 'Business');
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-[var(--panel)] hover:bg-[var(--raise)] text-[var(--ink)]'
                    }`}
                  >
                    {isSelected ? 'Plano Selecionado' : 'Escolher ' + p.name}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-[var(--ink-hi)] flex items-center gap-2">
              <CreditCard size={15} className="text-blue-400" />
              Forma de Pagamento
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${method === 'card' ? 'border-blue-500 bg-blue-500/10 text-[var(--ink-hi)]' : 'border-[var(--line)] bg-[var(--bg)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'}`}>
                <input type="radio" name="paymethod" value="card" checked={method === 'card'} onChange={() => setMethod('card')} className="hidden" />
                <CreditCard size={16} className="text-blue-400" />
                <span className="text-xs font-semibold">Cartão de Crédito</span>
              </label>
              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${method === 'pix' ? 'border-blue-500 bg-blue-500/10 text-[var(--ink-hi)]' : 'border-[var(--line)] bg-[var(--bg)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'}`}>
                <input type="radio" name="paymethod" value="pix" checked={method === 'pix'} onChange={() => setMethod('pix')} className="hidden" />
                <Sparkles size={16} className="text-emerald-400" />
                <span className="text-xs font-semibold">PIX Instantâneo</span>
              </label>
              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${method === 'paypal' ? 'border-blue-500 bg-blue-500/10 text-[var(--ink-hi)]' : 'border-[var(--line)] bg-[var(--bg)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'}`}>
                <input type="radio" name="paymethod" value="paypal" checked={method === 'paypal'} onChange={() => setMethod('paypal')} className="hidden" />
                <Activity size={16} className="text-indigo-400" />
                <span className="text-xs font-semibold">PayPal</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--bg)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-[var(--ink-lo)] hover:text-[var(--ink-hi)] transition-colors cursor-pointer"
          >
            Continuar no Estúdio (Modo Exploração)
          </button>
          
          {/* Aqui existia um botão "Ativar Plano X (Demo)" — ativação imediata
              e gratuita do plano pago — ao lado do botão que cobra. Removido:
              é um caminho de contorno do checkout exposto em produção. */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              onClick={handleSubscribe}
              loading={loading}
              className="w-full sm:w-auto"
            >
              {loading ? 'Processando...' : `Pagar e Ativar ${selectedPlan}`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
