import React, { useState } from 'react';
import { Briefcase, Check, CheckCircle2, FileText, Mail, User } from 'lucide-react';
import { Button } from './ui/Button';
import { CabecalhoDePagina, Pagina } from './ui/Pagina';

/** Dados corporativos do próprio usuário, persistidos localmente. */
const BILLING_KEY = 'pwstream_billing_profile';

function loadBillingProfile() {
  try {
    const raw = localStorage.getItem(BILLING_KEY);
    return raw ? (JSON.parse(raw) as { companyName?: string; taxId?: string; billingAddress?: string }) : {};
  } catch {
    return {};
  }
}

interface CadastroPaginaProps {
  user: { email: string; name: string } | null;
  onUpdateUser: (updatedUser: any) => void;
}

/**
 * Dados de cadastro, agora numa página própria: era a aba "Dados de
 * Cadastro" da tela de conta, que o menu não conseguia abrir quando a tela
 * já estava aberta em "Plano e cobrança".
 *
 * PROVISÓRIO: o formulário veio como estava, para a mudança de lugar não
 * misturar com a correção. O redesenho vem a seguir e acerta o que ele faz
 * — o "salvar" altera só este navegador (não o perfil no banco) e deixa
 * trocar o e-mail sem trocar o do login.
 */
export function CadastroPagina({ user, onUpdateUser }: CadastroPaginaProps) {
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const savedBilling = loadBillingProfile();
  const [companyName, setCompanyName] = useState(savedBilling.companyName ?? '');
  const [taxId, setTaxId] = useState(savedBilling.taxId ?? '');
  const [billingAddress, setBillingAddress] = useState(savedBilling.billingAddress ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage('');

    setTimeout(() => {
      setIsSavingProfile(false);
      onUpdateUser({
        ...user,
        name: profileName,
        email: profileEmail,
      });
      try {
        localStorage.setItem(BILLING_KEY, JSON.stringify({ companyName, taxId, billingAddress }));
      } catch {
        /* armazenamento indisponível: a mensagem abaixo ainda cobre nome e e-mail */
      }
      setProfileMessage('Perfil e dados corporativos atualizados com sucesso!');
    }, 1200);
  };

  return (
    <Pagina>
      <CabecalhoDePagina titulo="Dados de cadastro" />

      <div className="mt-12 space-y-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-left">
        <div className="border-b border-[var(--line)] pb-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-[var(--ink-hi)]">
            <User size={18} className="text-blue-500" /> Informações Cadastrais & Fiscais
          </h2>
          <p className="text-xs text-[var(--ink-lo)]">Mantenha seus dados atualizados para a correta emissão e envio de faturas e recibos de pagamento.</p>
        </div>

        {profileMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-400">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{profileMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="cadastro-nome-completo" className="text-xs font-semibold text-[var(--ink)]">Nome Completo</label>
              <div className="relative">
                <input
                  autoComplete="name"
                  id="cadastro-nome-completo"
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] py-2.5 pl-9 pr-4 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] transition-all focus:border-blue-500 focus:outline-none"
                />
                <User size={14} className="absolute left-3.5 top-3.5 text-[var(--ink-dim)]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cadastro-endereco-de-e-mail" className="text-xs font-semibold text-[var(--ink)]">Endereço de E-mail</label>
              <div className="relative">
                <input
                  autoComplete="email"
                  id="cadastro-endereco-de-e-mail"
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] py-2.5 pl-9 pr-4 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] transition-all focus:border-blue-500 focus:outline-none"
                />
                <Mail size={14} className="absolute left-3.5 top-3.5 text-[var(--ink-dim)]" />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-[var(--line)]/60 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-lo)]">Dados de Emissão Fiscal (Invoice / NF-e)</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="cadastro-razao-social" className="text-xs font-semibold text-[var(--ink)]">Razão Social / Nome de Faturamento</label>
                <div className="relative">
                  <input
                    autoComplete="organization"
                    id="cadastro-razao-social"
                    type="text"
                    placeholder="Ex: Minha Empresa de Tecnologia Ltda"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] py-2.5 pl-9 pr-4 text-xs text-[var(--ink-hi)] focus:border-blue-500 focus:outline-none"
                  />
                  <Briefcase size={14} className="absolute left-3.5 top-3.5 text-[var(--ink-dim)]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cadastro-documento-fiscal" className="text-xs font-semibold text-[var(--ink)]">CNPJ / CPF / Documento Fiscal</label>
                <div className="relative">
                  <input
                    id="cadastro-documento-fiscal"
                    type="text"
                    placeholder="Ex: 00.000.000/0001-00"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] py-2.5 pl-9 pr-4 text-xs text-[var(--ink-hi)] focus:border-blue-500 focus:outline-none"
                  />
                  <FileText size={14} className="absolute left-3.5 top-3.5 text-[var(--ink-dim)]" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cadastro-endereco-de-cobranca" className="text-xs font-semibold text-[var(--ink)]">Endereço Completo de Cobrança</label>
              <textarea
                id="cadastro-endereco-de-cobranca"
                rows={2}
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3.5 py-2.5 text-xs text-[var(--ink-hi)] focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <Button type="submit" loading={isSavingProfile}>
            {isSavingProfile ? 'Salvando dados...' : <>Salvar Alterações <Check size={14} /></>}
          </Button>
        </form>
      </div>
    </Pagina>
  );
}
