import React, { useState } from 'react';
import { Copy, Check, Globe, Lightbulb } from 'lucide-react';
import { copyText } from './ui/clipboard';
import { Modal } from './ui/Modal';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteUrl: string;
}

export function InviteModal({ isOpen, onClose, inviteUrl }: InviteModalProps) {
  const [copiedStudio, setCopiedStudio] = useState(false);

  const handleCopyStudio = async () => {
    // Só marca "Copiado" se copiou de verdade. Antes o estado era ligado
    // incondicionalmente, então a interface confirmava uma cópia que podia
    // ter falhado — a falha agora aparece como aviso, vinda do copyText.
    if (!(await copyText(inviteUrl))) return;
    setCopiedStudio(true);
    setTimeout(() => setCopiedStudio(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      icon={<Globe size={16} className="text-blue-400" />}
      title="Convidar co-palestrantes ou convidados"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2 bg-[var(--raise)] hover:bg-[var(--panel)] text-xs font-semibold rounded-xl text-[var(--ink-hi)] active:scale-95 transition-colors cursor-pointer"
        >
          Fechar
        </button>
      }
    >
      <div className="space-y-4">
        <p className="text-[var(--ink-lo)] leading-relaxed">
          Compartilhe o link abaixo com seus convidados. Eles entram no estúdio com câmera e
          microfone direto pelo navegador, sem instalar nada.
        </p>

        <div className="space-y-1.5">
          <label htmlFor="invite-url" className="block text-xs font-semibold text-blue-400">
            Link de acesso do convidado
          </label>
          <div className="flex gap-2">
            <input
              id="invite-url"
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 bg-[var(--well)] border border-[var(--line-ctl)] rounded-xl px-3 py-2.5 text-xs font-mono text-[var(--ink)] select-all"
            />
            <button
              onClick={handleCopyStudio}
              className={`px-4 rounded-xl font-semibold text-xs flex items-center gap-1.5 active:scale-95 transition-colors cursor-pointer ${
                copiedStudio
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[var(--color-brand-deep)] hover:brightness-110 text-white'
              }`}
            >
              {copiedStudio ? (<><Check size={14} /> Copiado</>) : (<><Copy size={14} /> Copiar</>)}
            </button>
          </div>
        </div>

        {/* O emoji 💡 saiu: a auditoria contou 68 emoji em interface de
            produção, e o lucide-react já está instalado. */}
        <div className="bg-[var(--panel)] border border-[var(--line)] p-3 rounded-xl text-xs text-[var(--ink-lo)] flex gap-2.5">
          <Lightbulb size={14} className="shrink-0 mt-0.5 text-[var(--ink-dim)]" />
          <span>
            <b className="text-[var(--ink)]">Dica:</b> você pode colocar até 4 convidados
            simultâneos no palco usando o layout em grade ou os splits.
          </span>
        </div>
      </div>
    </Modal>
  );
}
