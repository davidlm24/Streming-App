import React, { useState, useRef, useEffect } from 'react';
import { User, Key, Users, PlusSquare, HelpCircle, LogOut, ChevronDown, Menu, ShieldCheck, Crown, Sun, Moon, Lock, Radio, Check, Disc } from 'lucide-react';
import { PwStreamLogo } from './PwStreamLogo';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onExit: () => void;
  user: { email: string; name: string; plan: 'Standard' | 'Professional' | 'Business' | 'Free Trial'; isExpired: boolean; trialDays: number; role?: string } | null;
  onLogout: () => void;
  onSimulateExpiration?: () => void;
  onRestoreTrial?: () => void;
  onOpenPricing?: () => void;
  onViewChange?: (view: 'dashboard' | 'studio' | 'admin' | 'super-admin' | 'public-webinar' | 'profile' | 'billing') => void;
  currentView?: 'dashboard' | 'studio' | 'admin' | 'super-admin' | 'public-webinar' | 'profile' | 'billing';
  isLive?: boolean;
  onToggleLive?: () => void;
  liveTime?: number;
  isTrialExpired?: boolean;
  onOpenAddChannelsModal?: () => void;
  activeDestinationsCount?: number;
  recordingQuality?: '720p' | '1080p';
  onQualityChange?: (quality: '720p' | '1080p') => void;
  isRecording?: boolean;
  onToggleRecording?: () => void;
  recordingTime?: number;
}

function formatHeaderTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function Header({ 
  onExit, 
  user, 
  onLogout, 
  onSimulateExpiration, 
  onRestoreTrial,
  onOpenPricing,
  onViewChange, 
  currentView,
  isLive = false,
  onToggleLive,
  liveTime = 0,
  isTrialExpired = false,
  onOpenAddChannelsModal,
  activeDestinationsCount = 0,
  recordingQuality = '720p',
  onQualityChange,
  isRecording = false,
  onToggleRecording,
  recordingTime = 0
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [streamMenuOpen, setStreamMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const streamDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (streamDropdownRef.current && !streamDropdownRef.current.contains(event.target as Node)) {
        setStreamMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b border-[var(--line)] bg-[var(--surface)] sticky top-0 z-50">
      {/* 30-day Free Trial Active simulated notification bar */}
      {user && user.plan === 'Free Trial' && !user.isExpired && (
        <div className="bg-gradient-to-r from-blue-900/60 via-[var(--surface)] to-indigo-950/60 px-4 py-2 border-b border-blue-500/20 flex flex-col sm:flex-row items-center justify-between text-xs gap-2 select-none">
          <div className="flex items-center gap-2 text-[var(--text)]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-[var(--text-hi)]">Plano de Testes Ativo</span>
            <span>•</span>
            <span>Você possui <strong className="text-emerald-400 font-mono">{user.trialDays} dias</strong> restantes na sua avaliação de 30 dias do PwStreamer.</span>
          </div>
          <div className="flex items-center gap-2">
            {onSimulateExpiration && (
              <button 
                onClick={onSimulateExpiration}
                className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer"
                title="Simular fim do prazo de 30 dias para testar o bloqueio de live e gravação"
              >
                ⚡ Simular 30 Dias Expirados
              </button>
            )}
          </div>
        </div>
      )}

      {/* 30-day Free Trial Expired notification bar (Studio remains accessible, Live and Record are gated) */}
      {user && user.plan === 'Free Trial' && user.isExpired && (
        <div className="bg-gradient-to-r from-amber-950/80 via-[var(--surface)] to-amber-950/80 px-4 py-2 border-b border-amber-500/30 flex flex-col sm:flex-row items-center justify-between text-xs gap-2 select-none">
          <div className="flex items-center gap-2 text-amber-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="font-bold text-[var(--text-hi)]">Período de Testes de 30 Dias Finalizado</span>
            <span>•</span>
            <span>Acesso ao estúdio liberado para montagem. Para <strong>Transmitir Ao Vivo</strong> ou <strong>Gravar</strong>, escolha um plano.</span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenPricing && (
              <button 
                onClick={onOpenPricing}
                className="px-3 py-1 bg-[var(--color-brand)] hover:bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Escolher Plano
              </button>
            )}
            {onRestoreTrial && (
              <button 
                onClick={onRestoreTrial}
                className="px-2.5 py-1 bg-[var(--panel)] text-[var(--text)] hover:text-[var(--text-hi)] border border-[var(--line-ctl)] rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                title="Restaurar 30 dias de teste gratuito (Demo)"
              >
                ↺ Restaurar 30 Dias (Demo)
              </button>
            )}
          </div>
        </div>
      )}

      {user && user.plan !== 'Free Trial' && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-950 to-emerald-950/40 px-4 py-1.5 border-b border-emerald-500/20 flex items-center justify-between text-xs select-none text-emerald-400">
          <div className="flex items-center gap-1.5 mx-auto text-[11px] font-bold">
            <ShieldCheck size={14} className="text-emerald-400 animate-pulse" />
            <span>Assinatura ativa no plano <strong className="uppercase font-extrabold">{user.plan}</strong> com acesso ilimitado a transmissões e gravações!</span>
          </div>
        </div>
      )}

      <div className={`${currentView === 'studio' ? 'w-full px-2 sm:px-4 md:px-6' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'}`}>
        <div className="flex h-16 items-center justify-between gap-1 sm:gap-2">
          
          {/* LEFT CONTAINER: Logo and Navigation */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
            <button onClick={() => onViewChange?.('dashboard')} className="flex items-center gap-2 cursor-pointer focus:outline-none shrink-0">
              <PwStreamLogo iconSize={32} textSize="md" />
            </button>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-3 border-l border-[var(--line)] pl-3 xl:pl-6 h-8 shrink-0 min-w-0">
              <button 
                onClick={() => onViewChange?.('studio')}
                className={`transition-colors text-xs font-semibold uppercase tracking-wider cursor-pointer py-1.5 px-3 rounded-lg ${
                  currentView === 'studio' 
                    ? 'text-blue-400 bg-blue-500/10 border border-blue-500/10' 
                    : 'text-[var(--text-lo)] hover:text-white'
                }`}
              >
                Estúdio de Transmissão
              </button>
            </nav>
          </div>

          {/* RIGHT CONTAINER: Control buttons, trial indicator, live triggers, and profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
            
            {/* 1. Botão Adicionar Canais (Reduzido conforme solicitado) */}
            <button
              type="button"
              onClick={onOpenAddChannelsModal}
              id="btn-add-streaming-channels"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-[11px] sm:text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer border border-blue-400/30 shrink-0"
              title="Adicionar e gerenciar canais de transmissão (YouTube, Facebook, Instagram, TikTok, Twitch, Kick, LinkedIn, Rumble)"
            >
              <Radio size={14} className="text-[var(--text-hi)] animate-pulse shrink-0" />
              <span>Adicionar canais</span>
              {activeDestinationsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[var(--text-hi)] text-[10px] font-black leading-none ml-0.5">
                  {activeDestinationsCount}
                </span>
              )}
            </button>

            {/* 2. LIVE STREAM 720p ⌵ & RECORDING OFF/ON Menu Dropdown */}
            <div className="relative" ref={streamDropdownRef}>
              <button
                type="button"
                onClick={() => setStreamMenuOpen(!streamMenuOpen)}
                id="btn-stream-recording-dropdown"
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[var(--bg)] hover:bg-[var(--panel)]/90 border border-[var(--line)] hover:border-[var(--line-ctl)] transition-all cursor-pointer text-left select-none group shrink-0"
                title="Configurações de Transmissão e Gravação"
              >
                <div className="flex flex-col justify-center leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] sm:text-xs font-black tracking-wider uppercase ${isLive ? 'text-red-400' : 'text-blue-400'}`}>
                      LIVE STREAM
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-[var(--text-lo)] font-mono">
                      {recordingQuality}
                    </span>
                    <ChevronDown size={13} className={`text-[var(--text-lo)] group-hover:text-[var(--text-hi)] transition-transform ${streamMenuOpen ? 'rotate-180' : ''}`} />
                  </div>
                  <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase">
                    <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-cyan-500'}`}></span>
                    <span className={isRecording ? 'text-red-400 font-extrabold' : 'text-cyan-400'}>
                      {isRecording ? `RECORDING ON (${formatHeaderTime(recordingTime)})` : 'RECORDING OFF'}
                    </span>
                  </div>
                </div>
              </button>

              {streamMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[var(--surface)] border border-[var(--line)] shadow-2xl p-3 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="pb-2 mb-2 border-b border-[var(--line)] flex items-center justify-between">
                    <span className="font-extrabold text-[var(--text-hi)] uppercase text-[10px] tracking-wider">Configurações de Stream</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${isLive ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/10 text-blue-400'}`}>
                      {isLive ? 'Ao Vivo' : 'Pronto'}
                    </span>
                  </div>

                  {/* Resolução de Stream */}
                  <div className="mb-3">
                    <label className="text-[var(--text-lo)] text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                      Resolução da Transmissão
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => { onQualityChange?.('720p'); }}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                          recordingQuality === '720p'
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                            : 'bg-[var(--surface)] border-[var(--line)] text-[var(--text-lo)] hover:text-white hover:border-[var(--line-ctl)]'
                        }`}
                      >
                        {recordingQuality === '720p' && <Check size={12} className="text-blue-400" />}
                        720p HD
                      </button>
                      <button
                        type="button"
                        onClick={() => { onQualityChange?.('1080p'); }}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                          recordingQuality === '1080p'
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                            : 'bg-[var(--surface)] border-[var(--line)] text-[var(--text-lo)] hover:text-white hover:border-[var(--line-ctl)]'
                        }`}
                      >
                        {recordingQuality === '1080p' && <Check size={12} className="text-blue-400" />}
                        1080p FHD
                      </button>
                    </div>
                  </div>

                  {/* Gravação Local Toggle */}
                  <div className="mb-3 pt-2 border-t border-[var(--line)]/80">
                    <label className="text-[var(--text-lo)] text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                      Gravação Local
                    </label>
                    <button
                      type="button"
                      onClick={() => { onToggleRecording?.(); }}
                      className={`w-full px-3 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-between border ${
                        isRecording
                          ? 'bg-red-500/20 border-red-500 text-red-300'
                          : isTrialExpired
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-[var(--surface)] border-[var(--line)] text-[var(--text)] hover:bg-[var(--panel)] hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Disc size={14} className={isRecording ? 'text-red-400 animate-spin' : 'text-[var(--text-lo)]'} />
                        <span>{isRecording ? 'Parar Gravação' : 'Gravar Transmissão'}</span>
                      </span>
                      <span className="font-mono text-[10px]">
                        {isRecording ? formatHeaderTime(recordingTime) : isTrialExpired ? '🔒 Bloqueado' : 'OFF'}
                      </span>
                    </button>
                  </div>

                  {/* Canais Conectados Link */}
                  <div className="pt-2 border-t border-[var(--line)]/80">
                    <button
                      type="button"
                      onClick={() => { setStreamMenuOpen(false); onOpenAddChannelsModal?.(); }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-[var(--text)] hover:text-[var(--text-hi)] hover:bg-[var(--panel)] rounded-lg transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Radio size={14} className="text-blue-400" />
                        <span>Gerenciar Canais ({activeDestinationsCount})</span>
                      </span>
                      <span className="text-[10px] text-blue-400 font-bold uppercase">Abrir</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Botão GO LIVE / END LIVE */}
            <button
              type="button"
              onClick={onToggleLive}
              id="btn-header-go-live"
              className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shadow-md hover:scale-[1.03] active:scale-95 shrink-0 ${
                isLive
                  ? 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-500 shadow-red-600/30 animate-pulse'
                  : isTrialExpired
                    ? 'border-2 border-amber-500/80 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white'
                    : 'border-2 border-[#D9480F] bg-[#D9480F]/15 hover:bg-[#D9480F] text-[#FF922B] hover:text-white shadow-orange-500/10'
              }`}
              title={isLive ? "Encerrar transmissão ao vivo" : isTrialExpired ? "Assine um plano para transmitir ao vivo" : "Iniciar transmissão ao vivo em todos os canais"}
            >
              {isLive ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  <span>END LIVE ({formatHeaderTime(liveTime)})</span>
                </>
              ) : (
                <span>{isTrialExpired ? 'GO LIVE 🔒' : 'GO LIVE'}</span>
              )}
            </button>

            {/* Sair do Webinar - Styled with two lines matching the reference */}
            {currentView === 'studio' && (
              <button
                onClick={onExit}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-[var(--text-lo)] hover:text-red-400 border border-[var(--line)] hover:border-red-500/20 hover:bg-red-500/5 rounded-lg transition-all cursor-pointer h-[38px] shrink-0"
              >
                <LogOut size={14} className="shrink-0" />
                <div className="text-left leading-none text-[8px] uppercase font-black tracking-wider shrink-0">
                  <div>Sair do</div>
                  <div className="mt-0.5 text-[9px] font-black">Webinar</div>
                </div>
              </button>
            )}

            {/* Theme Toggle Button (Light/Dark Mode) */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--line)] hover:border-[var(--line-ctl)] bg-[var(--bg)] hover:bg-[var(--panel)] text-[var(--text)] hover:text-[var(--text-hi)] transition-all cursor-pointer shadow-sm text-xs font-bold shrink-0"
              title={theme === 'dark' ? 'Alternar para Tema Claro' : 'Alternar para Tema Escuro'}
              aria-label="Alternar Tema Claro/Escuro"
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={15} className="text-amber-400 animate-pulse" />
                  <span className="hidden sm:inline text-[10px] uppercase tracking-wider font-extrabold text-amber-400">Tema Claro</span>
                </>
              ) : (
                <>
                  <Moon size={15} className="text-blue-600 animate-pulse" />
                  <span className="hidden sm:inline text-[10px] uppercase tracking-wider font-extrabold text-blue-600">Tema Escuro</span>
                </>
              )}
            </button>

            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 text-left hover:bg-[var(--panel)] p-2 rounded-lg transition-all focus:outline-none cursor-pointer"
                id="user-menu-button"
              >
                <img 
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80" 
                  alt="Profile" 
                  className="w-9 h-9 rounded-full border-2 border-blue-500"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden sm:block">
                  <p className="text-xs text-[var(--text-lo)] leading-tight font-medium">Conta de</p>
                  <p className="text-sm font-semibold text-[var(--text-hi)] leading-tight flex items-center gap-1">
                    {user ? user.name : 'Visitante'} <ChevronDown size={14} className="text-[var(--text-lo)]" />
                  </p>
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--surface)] border border-[var(--line)] shadow-2xl py-2 z-50 text-sm animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-[var(--line)] mb-1">
                    <p className="font-semibold text-[var(--text-hi)]">{user ? user.name : 'Visitante'}</p>
                    <p className="text-xs text-[var(--text-lo)]">{user ? user.email : 'visitante@pwstreamer.com'}</p>
                  </div>
                  <button 
                    onClick={() => { onViewChange?.('profile'); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-[var(--text-hi)] hover:bg-[var(--panel)] transition-colors text-left cursor-pointer"
                  >
                    <User size={16} className="text-blue-500" /> Minha Conta
                  </button>
                  <button 
                    onClick={() => { onViewChange?.('billing'); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-[var(--text-hi)] hover:bg-[var(--panel)] transition-colors text-left cursor-pointer"
                  >
                    <PlusSquare size={16} className="text-blue-500" /> Planos & Cobrança
                  </button>
                  
                  {/* Theme Switcher in Dropdown */}
                  <button 
                    onClick={() => { toggleTheme(); setDropdownOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2 text-[var(--text-hi)] hover:bg-[var(--panel)] transition-colors text-left cursor-pointer border-t border-b border-[var(--line)]/80 my-1"
                  >
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-blue-500" />}
                      <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                      {theme === 'dark' ? 'Ativar' : 'Ativar'}
                    </span>
                  </button>

                  <a href="#support" className="flex items-center gap-3 px-4 py-2 text-[var(--text-hi)] hover:bg-[var(--panel)] transition-colors">
                    <HelpCircle size={16} className="text-blue-500" /> Central de Ajuda
                  </a>
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-950/20 transition-colors text-left border-t border-[#2d2159] mt-1 cursor-pointer"
                  >
                    <LogOut size={16} /> Sair do Estúdio
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-[var(--text-hi)] p-2 hover:bg-[var(--panel)] rounded cursor-pointer"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Links dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--line)] bg-[var(--surface)] px-4 pt-2 pb-4 space-y-1">
          <button onClick={() => { onViewChange?.('dashboard'); setMenuOpen(false); }} className="block w-full text-left text-[var(--text)] hover:text-[var(--text-hi)] px-3 py-2 rounded text-base font-medium cursor-pointer">
            Dashboard
          </button>
          <button onClick={() => { onViewChange?.('studio'); setMenuOpen(false); }} className="block w-full text-left text-[var(--text-hi)] bg-[var(--panel)] px-3 py-2 rounded text-base font-medium cursor-pointer">
            Estúdio de Transmissão
          </button>
          <button onClick={() => { onViewChange?.('profile'); setMenuOpen(false); }} className="block w-full text-left text-[var(--text)] hover:text-[var(--text-hi)] px-3 py-2 rounded text-base font-medium cursor-pointer">
            Minha Conta
          </button>
          <button onClick={() => { onViewChange?.('billing'); setMenuOpen(false); }} className="block w-full text-left text-[var(--text)] hover:text-[var(--text-hi)] px-3 py-2 rounded text-base font-medium cursor-pointer">
            Planos & Cobrança
          </button>
          <button 
            onClick={() => { toggleTheme(); setMenuOpen(false); }} 
            className="flex items-center justify-between w-full text-left text-[var(--text)] hover:text-[var(--text-hi)] px-3 py-2 rounded text-base font-medium cursor-pointer border border-[var(--line)] my-1 bg-[var(--bg)]"
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-500" />}
              {theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
            </span>
            <span className="text-xs font-bold text-blue-400 uppercase">Alternar</span>
          </button>
          {currentView === 'studio' && (
            <button 
              onClick={() => { onExit(); setMenuOpen(false); }} 
              className="block w-full text-left text-red-400 hover:bg-red-950/20 px-3 py-2 rounded text-base font-medium cursor-pointer"
            >
              Sair do Webinar
            </button>
          )}
        </div>
      )}
    </header>
  );
}
