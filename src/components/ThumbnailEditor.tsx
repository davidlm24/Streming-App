import React, { useState, useRef, useEffect } from 'react';
import { 
  Image, Type, Download, Palette, Sparkles, Check, 
  RefreshCw, Layers, Sliders, CheckCircle2, FileImage, Trash2
} from 'lucide-react';

interface ThumbnailEditorProps {
  initialTitle?: string;
  onSave?: (dataUrl: string) => void;
}

const BACKGROUND_PRESETS = [
  {
    id: 'gradient-blue',
    name: 'Royal Blue Gradient',
    css: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1d4ed8 100%)',
    startColor: '#1e3a8a',
    midColor: '#3b82f6',
    endColor: '#1d4ed8'
  },
  {
    id: 'gradient-sunset',
    name: 'Sunset Orange & Red',
    css: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #b91c1c 100%)',
    startColor: '#7c2d12',
    midColor: '#ea580c',
    endColor: '#b91c1c'
  },
  {
    id: 'gradient-cyber',
    name: 'Cyberpunk Neon',
    css: 'linear-gradient(135deg, #581c87 0%, #ec4899 60%, #8b5cf6 100%)',
    startColor: '#581c87',
    midColor: '#ec4899',
    endColor: '#8b5cf6'
  },
  {
    id: 'gradient-dark',
    name: 'Minimalist Charcoal',
    css: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    startColor: '#0f172a',
    midColor: '#1e293b',
    endColor: '#0f172a'
  },
  {
    id: 'unsplash-tech',
    name: 'Tecnologia Abstrata',
    css: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80)',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'unsplash-office',
    name: 'Estúdio Profissional',
    css: 'url(https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80)',
    imageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80'
  }
];

export function ThumbnailEditor({ initialTitle = 'Como Alavancar suas Vendas com webinars interativos', onSave }: ThumbnailEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState('WEBINAR AO VIVO');
  const [selectedBg, setSelectedBg] = useState(BACKGROUND_PRESETS[0]);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(36);
  const [showLogo, setShowLogo] = useState(true);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [overlayOpacity, setOverlayOpacity] = useState(0.4);
  const [isGenerated, setIsGenerated] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');

  const previewRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync initialTitle if it changes externally
  useEffect(() => {
    if (initialTitle) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);

  const handleCustomImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customImageUrl.trim()) {
      const customBg = {
        id: `custom-${Date.now()}`,
        name: 'Imagem Customizada',
        css: `url(${customImageUrl.trim()})`,
        imageUrl: customImageUrl.trim()
      };
      setSelectedBg(customBg);
    }
  };

  const handleGenerateAndDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high resolution size for standard 16:9 thumbnail (1280x720)
    canvas.width = 1280;
    canvas.height = 720;

    const renderTextAndOverlays = () => {
      // 2. Draw overlay tint
      ctx.fillStyle = `rgba(15, 17, 21, ${overlayOpacity})`;
      ctx.fillRect(0, 0, 1280, 720);

      // 3. Draw branding logo if requested
      if (showLogo) {
        ctx.fillStyle = '#4683E0';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('PWSTREAMER STUDIO', 80, 100);

        // draw small rect indicator
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(80, 115, 60, 4);
      }

      // 4. Draw Subtitle (Live Badge)
      ctx.fillStyle = '#ff8f4b';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(subtitle.toUpperCase(), 80, 240);

      // 5. Draw Title wrapped correctly
      ctx.fillStyle = textColor;
      // Convert textSize to scaled size on 1280x720 (approx 2x preview size)
      const scaledTextSize = Math.floor(textSize * 1.8);
      ctx.font = `extrabold ${scaledTextSize}px sans-serif`;

      const words = title.split(' ');
      let line = '';
      const maxWidth = 1100;
      let y = 310;
      const lineHeight = scaledTextSize * 1.25;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, 80, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 80, y);

      // 6. Footer badge decoration
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(80, 620, 1120, 1);

      ctx.fillStyle = '#a59ebf';
      ctx.font = '16px sans-serif';
      ctx.fillText('Capa gerada automaticamente via Editor de Miniaturas Webinar.gg', 80, 660);

      // Export to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setGeneratedUrl(dataUrl);
      setIsGenerated(true);
      if (onSave) {
        onSave(dataUrl);
      }

      // Download
      const link = document.createElement('a');
      link.download = `capa-webinar-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
    };

    // 1. Draw background
    if (selectedBg.imageUrl) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Draw image covering canvas aspect ratio
        const imgRatio = img.width / img.height;
        const canvasRatio = 1280 / 720;
        let dWidth = 1280;
        let dHeight = 720;
        let dx = 0;
        let dy = 0;

        if (imgRatio > canvasRatio) {
          dWidth = 720 * imgRatio;
          dx = (1280 - dWidth) / 2;
        } else {
          dHeight = 1280 / imgRatio;
          dy = (720 - dHeight) / 2;
        }

        ctx.drawImage(img, dx, dy, dWidth, dHeight);
        renderTextAndOverlays();
      };
      img.onerror = () => {
        // Fallback to solid color if unsplash image fails due to CORS or network
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(0, 0, 1280, 720);
        renderTextAndOverlays();
      };
      img.src = selectedBg.imageUrl;
    } else {
      // It's a gradient background
      const grad = ctx.createLinearGradient(0, 0, 1280, 720);
      grad.addColorStop(0, selectedBg.startColor || '#1e3a8a');
      grad.addColorStop(0.5, selectedBg.midColor || '#3b82f6');
      grad.addColorStop(1, selectedBg.endColor || '#1d4ed8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);
      renderTextAndOverlays();
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 space-y-6" id="thumbnail-editor-container">
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h3 className="text-sm font-bold text-[var(--ink-hi)] flex items-center gap-1.5">
            <Sparkles size={16} className="text-blue-500" /> Editor de Miniaturas (Capas)
          </h3>
          <p className="text-[11px] text-[var(--ink-lo)]">Crie a capa perfeita e de alto impacto para engajar seus espectadores.</p>
        </div>
        <div className="flex items-center gap-2">
          {isGenerated && (
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Check size={10} /> Gerada!
            </span>
          )}
        </div>
      </div>

      {/* Editor Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: Controls (7 cols) */}
        <div className="lg:col-span-5 space-y-4 text-left">
          {/* 1. Title Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider flex items-center gap-1">
              <Type size={12} /> Título Principal
            </label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsGenerated(false);
              }}
              placeholder="Ex: Como Alavancar suas Vendas..."
              className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* 2. Subtitle Tag */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider flex items-center gap-1">
              <Layers size={12} /> Tag / Subtítulo
            </label>
            <input 
              type="text" 
              value={subtitle}
              onChange={(e) => {
                setSubtitle(e.target.value);
                setIsGenerated(false);
              }}
              placeholder="Ex: WEBINAR AO VIVO"
              className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 3. Choose Background Preset */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider flex items-center gap-1">
              <Palette size={12} /> Imagem de Fundo / Gradiente
            </label>
            <div className="grid grid-cols-3 gap-2">
              {BACKGROUND_PRESETS.map((bg) => {
                const isActive = selectedBg.id === bg.id;
                return (
                  <button
                    key={bg.id}
                    onClick={() => {
                      setSelectedBg(bg);
                      setIsGenerated(false);
                    }}
                    style={{ 
                      background: bg.imageUrl ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), ${bg.css}` : bg.css,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                    className={`h-14 rounded-lg relative overflow-hidden transition-all text-[9px] font-bold flex items-end p-1 border text-left ${
                      isActive ? 'border-blue-500 ring-2 ring-blue-500/35 scale-95' : 'border-[var(--line)] hover:border-[var(--line-ctl)]'
                    }`}
                  >
                    <span className="bg-black/70 px-1 py-0.5 rounded text-[8px] text-[var(--ink-hi)] leading-none truncate max-w-full block">
                      {bg.name}
                    </span>
                    {isActive && (
                      <span className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center text-white text-[7px]">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Custom background URL */}
          <form onSubmit={handleCustomImageSubmit} className="space-y-1">
            <label className="text-[9px] text-[var(--ink-dim)] font-semibold">Ou insira URL de imagem customizada:</label>
            <div className="flex gap-2">
              <input 
                type="url" 
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..." 
                className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[10px] text-[var(--ink-hi)] focus:outline-none focus:border-blue-500"
              />
              <button 
                type="submit"
                className="px-3 bg-[var(--panel)] hover:bg-[var(--raise)] text-[10px] font-bold rounded-lg text-[var(--ink-hi)]"
              >
                Aplicar
              </button>
            </div>
          </form>

          {/* 5. Sliders & Switches */}
          <div className="bg-[var(--bg)] border border-[var(--line)]/60 p-3 rounded-xl space-y-3 text-xs">
            {/* Opacity slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-[var(--ink-lo)] font-bold">
                <span>Escurecimento de Fundo</span>
                <span>{Math.round(overlayOpacity * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="0.9" 
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-full accent-blue-500 h-1 bg-[var(--panel)] rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Font size slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-[var(--ink-lo)] font-bold">
                <span>Tamanho da Fonte</span>
                <span>{textSize}px</span>
              </div>
              <input 
                type="range" 
                min="20" 
                max="54" 
                step="1"
                value={textSize}
                onChange={(e) => setTextSize(parseInt(e.target.value))}
                className="w-full accent-blue-500 h-1 bg-[var(--panel)] rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Color circles & switches */}
            <div className="flex items-center justify-between pt-1 border-t border-[var(--line)]/60">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[var(--ink-lo)]">Cor do Texto:</span>
                {['#ffffff', '#fde047', '#60a5fa', '#f87171', '#4ade80'].map((color) => (
                  <button 
                    key={color}
                    type="button"
                    onClick={() => setTextColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-4 h-4 rounded-full border ${
                      textColor === color ? 'border-white ring-2 ring-blue-500/50' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-[var(--ink-lo)] font-bold">
                <input 
                  type="checkbox" 
                  checked={showLogo} 
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="rounded border-[var(--line)] bg-[var(--surface)] text-blue-500"
                />
                <span>Mostrar Logo</span>
              </label>
            </div>
          </div>

          {/* Generate trigger action button */}
          <button
            type="button"
            onClick={handleGenerateAndDownload}
            className="w-full py-3 bg-gradient-to-r from-[var(--color-brand)] to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Download size={14} /> Gerar Capa da Live (Download JPG)
          </button>
        </div>

        {/* RIGHT COLUMN: Visual Live Preview & Hidden Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider flex items-center gap-1">
              <FileImage size={12} /> Pré-visualização Real-time (16:9)
            </span>
            
            {/* Interactive Preview Canvas wrapper */}
            <div 
              ref={previewRef}
              style={{ 
                backgroundImage: selectedBg.imageUrl ? `url(${selectedBg.imageUrl})` : selectedBg.css,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                aspectRatio: '16/9'
              }}
              className="w-full rounded-2xl border border-[var(--line)] overflow-hidden relative shadow-2xl flex flex-col justify-between p-6 sm:p-8 select-none text-left"
            >
              {/* Overlay shading */}
              <div 
                className="absolute inset-0 z-0 pointer-events-none transition-all"
                style={{ backgroundColor: `rgba(15, 17, 21, ${overlayOpacity})` }}
              />

              {/* Top Row: PwStreamer Branding Logo overlay */}
              <div className="relative z-10 flex items-start justify-between">
                {showLogo ? (
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] tracking-widest text-blue-400 font-black">PWSTREAMER STUDIO</span>
                    <div className="w-8 h-0.5 bg-blue-500" />
                  </div>
                ) : <div />}
                
                <span className="text-[9px] font-black uppercase bg-red-600 text-white px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                  LIVE PREVIEW
                </span>
              </div>

              {/* Middle Row: Content & customizable text */}
              <div className="relative z-10 space-y-1 text-left my-auto">
                <p className="text-[10px] font-bold tracking-widest text-orange-400 font-mono uppercase">
                  {subtitle}
                </p>
                <h4 
                  style={{ 
                    color: textColor,
                    fontSize: `${textSize}px`,
                    lineHeight: '1.2'
                  }}
                  className="font-extrabold tracking-tight drop-shadow-md truncate-lines"
                >
                  {title || 'Título da Transmissão...'}
                </h4>
              </div>

              {/* Bottom Row: Footer credentials */}
              <div className="relative z-10 border-t border-white/10 pt-2 flex items-center justify-between text-left">
                <span className="text-[9px] text-[var(--ink-lo)] font-semibold">Capa oficial do Webinar agendado</span>
                <span className="text-[9px] font-mono font-bold text-[var(--ink-dim)]">1280 x 720 px</span>
              </div>
            </div>
          </div>

          {/* Quick info alert */}
          <div className="mt-4 p-3 bg-blue-950/20 border border-blue-500/10 rounded-xl text-left flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold text-[var(--ink)]">Pronto para Divulgar nas Redes</p>
              <p className="text-[10px] text-[var(--ink-lo)] leading-normal">
                Clique no botão de geração para renderizar a imagem final no formato de alta fidelidade e anexá-la automaticamente ao seu convite ou banner.
              </p>
            </div>
          </div>

          {/* Hidden HTML5 Canvas used strictly for high-res downloading */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

      </div>
    </div>
  );
}
