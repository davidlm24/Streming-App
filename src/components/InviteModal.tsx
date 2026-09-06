import React, { useState } from 'react';
import { X, Copy, Check, Globe } from 'lucide-react';
import { copyText } from './ui/clipboard';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteUrl: string;
}

export function InviteModal({ isOpen, onClose, inviteUrl }: InviteModalProps) {
  const [copiedStudio, setCopiedStudio] = useState(false);

  if (!isOpen) return null;

  const handleCopyStudio = () => {
    copyText(inviteUrl);
    setCopiedStudio(true);
    setTimeout(() => setCopiedStudio(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] border border-[var(--line)] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--line)] bg-[var(--bg)]">
          <h3 className="text-sm font-bold text-[var(--ink-hi)] flex items-center gap-2">
            <Globe size={16} className="text-blue-400" />
            Convidar Co-palestrantes ou Convidados
          </h3>
          <button 
            onClick={onClose}
            className="text-[var(--ink-lo)] hover:text-[var(--ink-hi)] p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-[var(--ink-lo)] leading-relaxed">
            Compartilhe o link abaixo com seus convidados. Eles poderão entrar no estúdio de transmissão com webcam e microfone diretamente pelo navegador, sem precisar instalar nada!
          </p>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-blue-400">Link de Acesso do Convidado</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3 py-2.5 text-xs font-mono text-[var(--ink)] focus:outline-none select-all"
              />
              <button
                onClick={handleCopyStudio}
                className={`px-4 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  copiedStudio 
                    ? 'bg-green-600 text-white' 
                    : 'bg-[var(--color-brand-deep)] hover:bg-blue-600 text-white'
                }`}
              >
                {copiedStudio ? (
                  <>
                    <Check size={14} /> Copiado
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copiar
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-[var(--bg)] border border-[var(--line)]/40 p-3 rounded-xl text-[10px] text-[var(--ink-lo)]">
            💡 <b>Dica do Estúdio</b>: Você pode adicionar até 4 convidados simultâneos no palco de transmissão usando o layout em grade (Bento) ou splits.
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[var(--bg)]/50 p-4 border-t border-[var(--line)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--panel)] hover:bg-[var(--raise)] text-xs font-semibold rounded-lg text-[var(--ink-hi)] transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}

