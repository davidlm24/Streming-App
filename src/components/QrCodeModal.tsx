import React, { useState, useRef } from 'react';
import { X, QrCode, ShoppingBag, Link as LinkIcon, Sparkles, Copy, Check, Download, Eye, EyeOff, LayoutTemplate, Layers, Palette, Tag, DollarSign, ExternalLink, RefreshCw, Smartphone, Image as ImageIcon, ArrowRight, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCodeConfig } from '../types';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: QrCodeConfig;
  onSaveConfig: (newConfig: QrCodeConfig) => void;
  showQrCodeOnStream: boolean;
  onToggleShowQrCode: (show: boolean) => void;
  streamColor?: string;
}

// Preset products for streamers to test or use instantly
const PRESET_PRODUCTS: Array<Partial<QrCodeConfig> & { label: string; icon: string }> = [
  {
    label: 'Smartphone Pro Max',
    icon: '📱',
    title: 'Smartphone Pro Max 256GB',
    subtitle: 'Lançamento Exclusivo da Live',
    price: 'R$ 1.899,00',
    originalPrice: 'R$ 2.499,00',
    discountBadge: '24% OFF + FRETE GRÁTIS',
    storeUrl: 'https://shopee.com.br/smartphone-pro-max-live',
    storeName: 'Shopee',
    ctaLabel: 'Compre com Desconto',
    imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&auto=format&fit=crop&q=80',
    cardTheme: 'dark',
    orientation: 'horizontal'
  },
  {
    label: 'Fone Wireless Noise Cancelling',
    icon: '🎧',
    title: 'Headphone Studio Wireless Pro',
    subtitle: 'Áudio Hi-Res & Bateria 40h',
    price: 'R$ 349,90',
    originalPrice: 'R$ 599,00',
    discountBadge: 'CUPOM: LIVEAUDIO',
    storeUrl: 'https://mercadolivre.com.br/headphone-studio-pro',
    storeName: 'Mercado Livre',
    ctaLabel: 'Garantir Oferta',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80',
    cardTheme: 'brand',
    orientation: 'vertical'
  },
  {
    label: 'Curso / Infoproduto',
    icon: '🎓',
    title: 'Formação Completa Streamer Pro',
    subtitle: 'Acesso Vitalício + Comunidade VIP',
    price: '12x R$ 47,90',
    originalPrice: 'R$ 997,00',
    discountBadge: 'VAGAS LIMITADAS',
    storeUrl: 'https://hotmart.com/pt-br/streamer-pro-live',
    storeName: 'Hotmart',
    ctaLabel: 'Inscreva-se Agora',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop&q=80',
    cardTheme: 'neon',
    orientation: 'horizontal'
  },
  {
    label: 'Tênis Streetwear Urban',
    icon: '👟',
    title: 'Tênis Runner Stealth V2',
    subtitle: 'Edição Limitada Coleção 2025',
    price: 'R$ 279,00',
    originalPrice: 'R$ 399,00',
    discountBadge: '30% OFF SÓ HOJE',
    storeUrl: 'https://lojaexemplo.com.br/tenis-runner-v2',
    storeName: 'Nuvemshop',
    ctaLabel: 'Acessar Loja',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80',
    cardTheme: 'gold',
    orientation: 'vertical'
  },
  {
    label: 'Cafeteira Espresso Italiana',
    icon: '☕',
    title: 'Cafeteira Espresso Barista Pro',
    subtitle: 'Pressão 19 Bar + Moedor Integrado',
    price: 'R$ 499,00',
    originalPrice: 'R$ 799,00',
    discountBadge: 'CUPOM: CAFEVIP',
    storeUrl: 'https://amazon.com.br/cafeteira-barista-pro',
    storeName: 'Amazon',
    ctaLabel: 'Ver no Site',
    imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&auto=format&fit=crop&q=80',
    cardTheme: 'dark',
    orientation: 'horizontal'
  }
];

const STORE_PRESETS = [
  { name: 'Shopee', color: '#ee4d2d', domain: 'shopee.com.br' },
  { name: 'Mercado Livre', color: '#ffe600', domain: 'mercadolivre.com.br' },
  { name: 'Amazon', color: '#ff9900', domain: 'amazon.com.br' },
  { name: 'Nuvemshop', color: '#2d3277', domain: 'loja.nuvemshop.com.br' },
  { name: 'Shopify', color: '#96bf48', domain: 'loja.myshopify.com' },
  { name: 'Hotmart', color: '#f04e23', domain: 'hotmart.com' },
  { name: 'Kiwify', color: '#00e575', domain: 'kiwify.com.br' },
  { name: 'Magalu', color: '#0086ff', domain: 'magazineluiza.com.br' },
  { name: 'Loja Própria / Link Direto', color: '#4683E0', domain: 'minhaloja.com.br' },
];

export function QrCodeModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  showQrCodeOnStream,
  onToggleShowQrCode,
  streamColor = '#4683E0'
}: QrCodeModalProps) {
  const [form, setForm] = useState<QrCodeConfig>(config || {
    title: 'Smartphone Pro Max 256GB',
    subtitle: 'Lançamento Exclusivo da Live',
    price: 'R$ 1.899,00',
    originalPrice: 'R$ 2.499,00',
    discountBadge: '24% OFF + FRETE GRÁTIS',
    storeUrl: 'https://shopee.com.br/smartphone-pro-max-live',
    storeName: 'Shopee',
    ctaLabel: 'Compre Agora',
    imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&auto=format&fit=crop&q=80',
    orientation: 'horizontal',
    cardTheme: 'dark',
    qrColor: '#000000',
    qrBgColor: '#ffffff',
    showProductImage: true,
    showPrice: true,
    showDiscountBadge: true,
    showStoreName: true,
    showScanPrompt: true,
    scale: 1,
    x: 75,
    y: 65
  });

  const [activeTab, setActiveTab] = useState<'product' | 'appearance' | 'presets'>('product');
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize when config changes
  React.useEffect(() => {
    if (config) {
      setForm(config);
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(form.storeUrl || 'https://pwstreamer.com')}&color=${(form.qrColor || '#000000').replace('#', '')}&bgcolor=${(form.qrBgColor || '#ffffff').replace('#', '')}`;

  const handleCopyLink = () => {
    if (!form.storeUrl) return;
    navigator.clipboard.writeText(form.storeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSave = () => {
    onSaveConfig(form);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleSaveAndActivate = () => {
    onSaveConfig(form);
    onToggleShowQrCode(true);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleApplyPreset = (preset: Partial<QrCodeConfig>) => {
    setForm(prev => ({
      ...prev,
      ...preset
    }));
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setForm(prev => ({ ...prev, imageUrl: uploadEvent.target?.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadQrImage = () => {
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `qrcode-${(form.title || 'produto').toLowerCase().replace(/\s+/g, '-')}.png`;
    link.target = '_blank';
    link.click();
  };

  // Card theme helper
  const getThemeStyles = () => {
    switch (form.cardTheme) {
      case 'light':
        return {
          bg: 'bg-white/95 text-slate-900 border-slate-200 shadow-2xl',
          subtext: 'text-[var(--text-dim)]',
          priceColor: 'text-emerald-600',
          border: 'border-slate-300'
        };
      case 'brand':
        return {
          bg: 'bg-[var(--bg)]/95 text-[var(--text-hi)] border-blue-500/40 shadow-[0_10px_30px_rgba(70,131,224,0.3)]',
          subtext: 'text-blue-200/70',
          priceColor: 'text-blue-400',
          border: 'border-blue-500/30'
        };
      case 'glass':
        return {
          bg: 'bg-[var(--bg)]/75 backdrop-blur-xl text-[var(--text-hi)] border-white/20 shadow-2xl',
          subtext: 'text-[var(--text)]',
          priceColor: 'text-emerald-400',
          border: 'border-white/15'
        };
      case 'neon':
        return {
          bg: 'bg-[var(--well)]/95 text-[var(--text-hi)] border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.35)]',
          subtext: 'text-cyan-200/80',
          priceColor: 'text-cyan-400',
          border: 'border-cyan-500/40'
        };
      case 'gold':
        return {
          bg: 'bg-[var(--bg)]/95 text-[var(--text-hi)] border-amber-500/50 shadow-[0_10px_30px_rgba(245,158,11,0.25)]',
          subtext: 'text-amber-200/80',
          priceColor: 'text-amber-400',
          border: 'border-amber-500/40'
        };
      case 'dark':
      default:
        return {
          bg: 'bg-[var(--bg)]/95 text-[var(--text-hi)] border-[var(--line)] shadow-2xl',
          subtext: 'text-[var(--text-lo)]',
          priceColor: 'text-emerald-400',
          border: 'border-[var(--line)]'
        };
    }
  };

  const theme = getThemeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto" id="qr-code-modal-overlay">
      <div className="relative w-full max-w-5xl bg-[var(--bg)] border border-[var(--line)] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-[var(--text-hi)] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)] bg-[var(--bg)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <QrCode size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--text-hi)] leading-tight">Configurador de QR Code & Loja Online</h3>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live Commerce
                </span>
              </div>
              <p className="text-xs text-[var(--text-lo)] mt-0.5">
                Crie e configure QR Codes dinâmicos com links de lojas para exibir produtos e direcionar os espectadores ao vivo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Live Toggle Button in Header */}
            <button
              type="button"
              onClick={() => onToggleShowQrCode(!showQrCodeOnStream)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                showQrCodeOnStream
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'bg-[var(--panel)] border-[var(--line-ctl)] text-[var(--text-lo)] hover:text-[var(--text-hi)]'
              }`}
            >
              {showQrCodeOnStream ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Exibindo na Live</span>
                </>
              ) : (
                <>
                  <EyeOff size={13} />
                  <span>Oculto na Live</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[var(--text-lo)] hover:text-[var(--text-hi)] hover:bg-[var(--panel)] rounded-xl transition-colors cursor-pointer"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Subtabs */}
        <div className="flex bg-[var(--well)] border-b border-[var(--line)] px-5 pt-2 gap-2 shrink-0">
          {[
            { id: 'product', label: '1. Produto & Link da Loja', icon: ShoppingBag },
            { id: 'appearance', label: '2. Orientação & Estilo Visual', icon: LayoutTemplate },
            { id: 'presets', label: '3. Modelos Prontos & Exemplos', icon: Sparkles }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
                    : 'border-transparent text-[var(--text-lo)] hover:text-[var(--text-hi)]'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Grid: Left Form & Right Live Preview */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-[var(--line)]">
          
          {/* LEFT PANEL: Form Configuration (7 cols) */}
          <div className="lg:col-span-7 p-5 space-y-5 overflow-y-auto custom-scrollbar">
            
            {/* TAB 1: PRODUCT & STORE LINK */}
            {activeTab === 'product' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Store URL & Destination */}
                <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                      <LinkIcon size={14} className="text-blue-400" />
                      Link da Loja / Destino do QR Code *
                    </label>
                    <span className="text-[10px] text-[var(--text-dim)] font-mono">Destino escaneado</span>
                  </div>

                  <div className="relative">
                    <input
                      type="url"
                      value={form.storeUrl}
                      onChange={(e) => setForm(prev => ({ ...prev, storeUrl: e.target.value }))}
                      placeholder="https://sualoja.com/produto-exemplo"
                      className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-hi)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-blue-500 font-mono"
                    />
                    {form.storeUrl && (
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[var(--panel)] hover:bg-[var(--raise)] text-[10px] font-bold text-[var(--text)] hover:text-[var(--text-hi)] rounded-lg flex items-center gap-1 transition-colors"
                      >
                        {copiedLink ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        {copiedLink ? 'Copiado' : 'Copiar'}
                      </button>
                    )}
                  </div>

                  {/* Store platform shortcut buttons */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-semibold text-[var(--text-lo)]">Plataforma / Marketplace da Loja:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {STORE_PRESETS.map((store) => (
                        <button
                          key={store.name}
                          type="button"
                          onClick={() => setForm(prev => ({
                            ...prev,
                            storeName: store.name,
                            storeUrl: prev.storeUrl && !prev.storeUrl.includes('exemplo') ? prev.storeUrl : `https://${store.domain}/produto-promocao`
                          }))}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                            form.storeName === store.name
                              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                              : 'bg-[var(--surface)] text-[var(--text-lo)] border-[var(--line)] hover:border-[var(--line-ctl)] hover:text-[var(--text-hi)]'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: store.color }} />
                          {store.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Product Title & Subtitle */}
                <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag size={14} className="text-blue-400" />
                    Informações do Produto
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-lo)] uppercase tracking-wider block mb-1">Título do Produto *</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ex: Smartphone Pro Max 256GB"
                        className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--text-hi)] focus:outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-lo)] uppercase tracking-wider block mb-1">Subtítulo / Chamada Curta</label>
                      <input
                        type="text"
                        value={form.subtitle || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="Ex: Oferta exclusiva durante a transmissão ao vivo"
                        className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--text-hi)] focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Price, Original Price & Discount Badge */}
                <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                    <Tag size={14} className="text-emerald-400" />
                    Preços & Cupom Promocional
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-lo)] uppercase tracking-wider block mb-1">Preço Promocional</label>
                      <input
                        type="text"
                        value={form.price || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="Ex: R$ 1.899,00"
                        className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-lo)] uppercase tracking-wider block mb-1">Preço Original (De)</label>
                      <input
                        type="text"
                        value={form.originalPrice || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                        placeholder="Ex: R$ 2.499,00"
                        className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--text-lo)] line-through focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-lo)] uppercase tracking-wider block mb-1">Selo / Cupom</label>
                      <input
                        type="text"
                        value={form.discountBadge || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, discountBadge: e.target.value }))}
                        placeholder="Ex: 30% OFF / CUPOM: LIVE"
                        className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Image & CTA Button Label */}
                <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-blue-400" />
                    Imagem do Produto & Botão CTA
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-lo)] uppercase tracking-wider block mb-1">URL da Foto do Produto</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={form.imageUrl || ''}
                          onChange={(e) => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                          placeholder="https://..."
                          className="flex-1 bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--text-hi)] focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-2 bg-[var(--panel)] hover:bg-[var(--raise)] text-xs font-bold rounded-xl text-[var(--text)] hover:text-[var(--text-hi)] transition-colors flex items-center gap-1.5"
                        >
                          <ImageIcon size={13} />
                          Upload
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-lo)] uppercase tracking-wider block mb-1">Texto do Botão / Chamada (CTA)</label>
                      <input
                        type="text"
                        value={form.ctaLabel || 'Compre Agora'}
                        onChange={(e) => setForm(prev => ({ ...prev, ctaLabel: e.target.value }))}
                        placeholder="Ex: Compre Agora / Escanear QR"
                        className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-hi)] focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ORIENTATION & APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                
                {/* Orientation Selector: Horizontal vs Vertical (Matches user requirements directly) */}
                <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                      <LayoutTemplate size={14} className="text-blue-400" />
                      Orientação do Card na Transmissão
                    </label>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-bold uppercase">
                      {form.orientation === 'horizontal' ? 'Horizontal (Banner Lateral)' : 'Vertical (Totem / Card)'}
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-lo)] leading-normal">
                    Selecione o formato de apresentação do card do produto com o QR Code na tela da transmissão.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Horizontal Option */}
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, orientation: 'horizontal' }))}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-2.5 cursor-pointer ${
                        form.orientation === 'horizontal'
                          ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/30'
                          : 'bg-[var(--surface)] border-[var(--line)] hover:border-[var(--line-ctl)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[var(--text-hi)] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          Horizontal (Card Retangular)
                        </span>
                        {form.orientation === 'horizontal' && <CheckCircle2 size={15} className="text-blue-400" />}
                      </div>

                      {/* Mini visual mockup of horizontal card */}
                      <div className="w-full h-14 bg-[var(--well)] border border-[var(--line)] rounded-lg p-1.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded bg-blue-500/20 border border-blue-500/30 shrink-0 flex items-center justify-center text-[10px]">
                            🖼️
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="w-16 h-2 bg-slate-600 rounded" />
                            <div className="w-10 h-1.5 bg-emerald-400/80 rounded" />
                          </div>
                        </div>
                        <div className="w-9 h-9 rounded bg-white p-0.5 shrink-0 flex items-center justify-center">
                          <QrCode size={20} className="text-black" />
                        </div>
                      </div>

                      <p className="text-[10px] text-[var(--text-lo)]">Ideal para a parte inferior da tela sem cobrir o palestrante.</p>
                    </button>

                    {/* Vertical Option */}
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, orientation: 'vertical' }))}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-2.5 cursor-pointer ${
                        form.orientation === 'vertical'
                          ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/30'
                          : 'bg-[var(--surface)] border-[var(--line)] hover:border-[var(--line-ctl)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[var(--text-hi)] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-400" />
                          Vertical (Totem em Pé)
                        </span>
                        {form.orientation === 'vertical' && <CheckCircle2 size={15} className="text-blue-400" />}
                      </div>

                      {/* Mini visual mockup of vertical card */}
                      <div className="w-full h-14 bg-[var(--well)] border border-[var(--line)] rounded-lg p-1.5 flex items-center justify-center gap-2">
                        <div className="w-14 h-full bg-[var(--panel)]/80 rounded flex flex-col items-center justify-center p-0.5 gap-0.5">
                          <div className="w-8 h-1.5 bg-slate-600 rounded" />
                          <div className="w-5 h-1 bg-emerald-400/80 rounded" />
                          <div className="w-5 h-5 bg-white rounded-xs p-0.5 flex items-center justify-center">
                            <QrCode size={12} className="text-black" />
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] text-[var(--text-lo)]">Ideal para cantos laterais do estúdio, destacando a foto e o código.</p>
                    </button>
                  </div>
                </div>

                {/* Card Themes & Styling */}
                <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                    <Palette size={14} className="text-blue-400" />
                    Tema Visual & Cores do Card
                  </h4>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'dark', label: 'Dark Studio', desc: 'Preto & Grafite', bg: 'bg-[var(--bg)]' },
                      { id: 'brand', label: 'Brand Azul', desc: 'Sleek Broadcast', bg: 'bg-[var(--bg)] border-blue-500' },
                      { id: 'light', label: 'Clean Claro', desc: 'Fundo Branco', bg: 'bg-white text-slate-900' },
                      { id: 'glass', label: 'Glassmorphism', desc: 'Vidro Translúcido', bg: 'bg-[var(--surface)]/60' },
                      { id: 'neon', label: 'Cyber Neon', desc: 'Ciano Vibrante', bg: 'bg-cyan-950/40 border-cyan-500' },
                      { id: 'gold', label: 'Gold Premium', desc: 'Dourado Luxo', bg: 'bg-amber-950/40 border-amber-500' },
                    ].map(thm => (
                      <button
                        key={thm.id}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, cardTheme: thm.id as any }))}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          form.cardTheme === thm.id
                            ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-500/10 font-bold'
                            : 'border-[var(--line)] bg-[var(--surface)] text-[var(--text-lo)] hover:border-[var(--line-ctl)] hover:text-[var(--text-hi)]'
                        }`}
                      >
                        <div className={`w-full h-3 rounded mb-1.5 ${thm.bg}`} />
                        <span className="text-[11px] font-bold block truncate">{thm.label}</span>
                        <span className="text-[8.5px] text-[var(--text-dim)] block truncate">{thm.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibility Toggles */}
                <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                    <Eye size={14} className="text-blue-400" />
                    Elementos Visíveis no Card
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { key: 'showProductImage', label: 'Exibir Foto do Produto', state: form.showProductImage },
                      { key: 'showPrice', label: 'Exibir Preço Promocional', state: form.showPrice },
                      { key: 'showDiscountBadge', label: 'Exibir Selo / Cupom', state: form.showDiscountBadge },
                      { key: 'showStoreName', label: 'Exibir Nome da Loja', state: form.showStoreName },
                      { key: 'showScanPrompt', label: 'Instrução ("Aponte a Câmera")', state: form.showScanPrompt },
                    ].map(toggle => (
                      <label key={toggle.key} className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface)] border border-[var(--line)] cursor-pointer">
                        <span className="text-xs font-semibold text-[var(--text)]">{toggle.label}</span>
                        <input
                          type="checkbox"
                          checked={toggle.state}
                          onChange={(e) => setForm(prev => ({ ...prev, [toggle.key]: e.target.checked }))}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-[var(--panel)] border-[var(--line-ctl)] cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PRESETS */}
            {activeTab === 'presets' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-blue-400" />
                    Modelos Rápidos de Produtos (1-Clique)
                  </h4>
                  <p className="text-[11px] text-[var(--text-lo)] leading-normal">
                    Carregue um dos modelos pré-configurados para testar o formato do QR Code imediatamente na transmissão.
                  </p>

                  <div className="space-y-2 pt-1">
                    {PRESET_PRODUCTS.map((preset, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[var(--surface)] border border-[var(--line)] hover:border-blue-500/50 rounded-xl flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-2xl shrink-0">{preset.icon}</span>
                          <div className="overflow-hidden">
                            <h5 className="text-xs font-bold text-[var(--text-hi)] truncate">{preset.title}</h5>
                            <p className="text-[10px] text-[var(--text-lo)] truncate">{preset.subtitle} &bull; <strong className="text-emerald-400">{preset.price}</strong></p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
                        >
                          Carregar Modelo
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Live Interactive Preview (5 cols) */}
          <div className="lg:col-span-5 p-5 bg-[var(--bg)] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className="text-xs font-bold text-[var(--text-hi)] uppercase tracking-wider">Prévia em Tempo Real no Estúdio</h4>
                </div>
                <span className="text-[10px] text-[var(--text-dim)] font-mono">16:9 Stage View</span>
              </div>

              {/* Mock Broadcast Stage Frame */}
              <div className="mt-4 bg-[var(--well)] border-2 border-[var(--line)]/80 rounded-xl p-3 relative aspect-video flex flex-col justify-end items-center overflow-hidden shadow-2xl">
                {/* Mock Stream Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface)] via-[var(--bg)] to-[var(--well)] flex items-center justify-center opacity-70">
                  <div className="text-center text-slate-700">
                    <p className="text-[10px] font-mono uppercase tracking-widest">[ Feed da Câmera do Apresentador ]</p>
                  </div>
                </div>

                {/* THE LIVE QR CODE OVERLAY (Horizontal vs Vertical) */}
                <div className="relative z-10 w-full flex justify-end items-end p-1">
                  
                  {/* HORIZONTAL CARD PRESENTATION */}
                  {form.orientation === 'horizontal' ? (
                    <div className={`p-3 rounded-2xl border ${theme.bg} ${theme.border} flex items-center gap-3 max-w-full shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                      {/* Product Image */}
                      {form.showProductImage && form.imageUrl && (
                        <img
                          src={form.imageUrl}
                          alt={form.title}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-white/10 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}

                      {/* Product Texts */}
                      <div className="flex-1 min-w-0 text-left">
                        {form.showStoreName && form.storeName && (
                          <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 inline-block mb-1">
                            {form.storeName}
                          </span>
                        )}
                        <h5 className="text-xs sm:text-sm font-extrabold leading-snug truncate">{form.title || 'Título do Produto'}</h5>
                        {form.subtitle && (
                          <p className={`text-[9px] ${theme.subtext} truncate`}>{form.subtitle}</p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-1">
                          {form.showPrice && form.price && (
                            <span className={`text-xs sm:text-sm font-black ${theme.priceColor}`}>{form.price}</span>
                          )}
                          {form.showPrice && form.originalPrice && (
                            <span className="text-[9px] text-[var(--text-dim)] line-through">{form.originalPrice}</span>
                          )}
                        </div>

                        {form.showDiscountBadge && form.discountBadge && (
                          <span className="text-[8px] font-black uppercase text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1 py-0.2 rounded inline-block mt-0.5">
                            {form.discountBadge}
                          </span>
                        )}
                      </div>

                      {/* QR Code */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="p-1.5 bg-white rounded-xl shadow-md border border-slate-200">
                          <img
                            src={qrImageUrl}
                            alt="QR Code"
                            className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        {form.showScanPrompt && (
                          <span className="text-[7.5px] font-extrabold uppercase tracking-tight text-center opacity-80 whitespace-nowrap">
                            Aponte a Câmera
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* VERTICAL CARD PRESENTATION */
                    <div className={`p-3 rounded-2xl border ${theme.bg} ${theme.border} flex flex-col items-center text-center gap-2 w-44 sm:w-48 shadow-2xl animate-in fade-in slide-in-from-right-2 duration-200`}>
                      {/* Store badge */}
                      {form.showStoreName && form.storeName && (
                        <span className="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {form.storeName}
                        </span>
                      )}

                      {/* Product Image */}
                      {form.showProductImage && form.imageUrl && (
                        <img
                          src={form.imageUrl}
                          alt={form.title}
                          className="w-20 h-20 rounded-xl object-cover border border-white/10 shadow"
                          referrerPolicy="no-referrer"
                        />
                      )}

                      {/* Product info */}
                      <div className="w-full space-y-0.5">
                        <h5 className="text-xs font-black leading-tight line-clamp-2">{form.title || 'Título do Produto'}</h5>
                        
                        <div className="flex items-center justify-center gap-1.5 pt-0.5">
                          {form.showPrice && form.price && (
                            <span className={`text-xs font-black ${theme.priceColor}`}>{form.price}</span>
                          )}
                          {form.showPrice && form.originalPrice && (
                            <span className="text-[9px] text-[var(--text-dim)] line-through">{form.originalPrice}</span>
                          )}
                        </div>

                        {form.showDiscountBadge && form.discountBadge && (
                          <div className="pt-0.5">
                            <span className="text-[7.5px] font-black uppercase text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded">
                              {form.discountBadge}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* QR Code Container */}
                      <div className="p-1.5 bg-white rounded-xl shadow-md border border-slate-200 mt-1">
                        <img
                          src={qrImageUrl}
                          alt="QR Code"
                          className="w-20 h-20 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {form.showScanPrompt && (
                        <div className="w-full bg-blue-600/20 border border-blue-500/30 py-1 px-2 rounded-lg">
                          <span className="text-[8px] font-black uppercase tracking-wider text-blue-300 block truncate">
                            {form.ctaLabel || 'Aponte a Câmera'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Scannable test helper */}
              <div className="mt-3 p-3 bg-[var(--bg)] border border-[var(--line)] rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[var(--text-lo)]">
                  <Smartphone size={14} className="text-blue-400" />
                  <span className="text-[11px]">Teste com a câmera do seu celular!</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadQrImage}
                  className="text-[10px] font-bold text-blue-400 hover:text-[var(--text-hi)] flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Download size={11} /> Baixar QR PNG
                </button>
              </div>
            </div>

            {/* Bottom Actions inside Right Panel */}
            <div className="pt-3 border-t border-[var(--line)] space-y-2">
              <button
                type="button"
                onClick={handleSaveAndActivate}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles size={14} />
                {savedSuccess ? 'Salvo com Sucesso!' : 'Salvar & Ativar na Live'}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-2 bg-[var(--panel)] hover:bg-[var(--raise)] text-[var(--text-hi)] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Salvar Sem Ativar
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-transparent hover:bg-[var(--panel)] text-[var(--text-lo)] hover:text-[var(--text-hi)] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
