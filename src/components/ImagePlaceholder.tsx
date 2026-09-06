import React from 'react';
import { AlertTriangle, UploadCloud } from 'lucide-react';

interface ImagePlaceholderProps {
  onReupload?: () => void;
  className?: string;
  error?: string;
  variant?: 'default' | 'small';
}

export function ImagePlaceholder({ onReupload, className = "", error, variant = 'default' }: ImagePlaceholderProps) {
  if (variant === 'small') {
    return (
      <div className={`flex items-center justify-center bg-[var(--panel)]/50 border border-red-500/30 rounded-lg text-center ${className}`}>
         <AlertTriangle className="text-red-400" size={16} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center bg-[var(--panel)]/50 border border-red-500/30 rounded-lg p-4 text-center ${className}`}>
      <AlertTriangle className="text-red-400 mb-2" size={24} />
      <p className="text-xs text-[var(--text)] font-medium mb-1">Falha ao carregar imagem</p>
      {error && <p className="text-[10px] text-[var(--text-lo)] mb-3 max-w-[150px] truncate">{error}</p>}
      
      {onReupload && (
        <span 
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onReupload(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onReupload(); } }}
          className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-[10px] py-1 px-3 rounded-full transition-colors mt-2 cursor-pointer select-none"
        >
          <UploadCloud size={12} />
          <span>Tentar Novamente</span>
        </span>
      )}
    </div>
  );
}
