import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Users, ArrowRight, CheckCircle2, MessageSquare, 
  Send, HelpCircle, Sparkles, Award, ExternalLink, Play, AlertCircle, 
  Share2, Volume2, ThumbsUp, BarChart3, Bell, Lock
} from 'lucide-react';
import { PwStreamLogo } from './PwStreamLogo';
import { LegalModal } from './LegalModals';
import { CLOUDFLARE_STREAM_CONFIG } from '../lib/cloudflareStreamConfig';

interface Registration {
  id: string;
  name: string;
  email: string;
  company: string;
  registeredAt: string;
}

interface WebinarPublicPageProps {
  webinarTitle: string;
  webinarDesc: string;
  webinarDate: string;
  isLive: boolean;
  thumbnailUrl?: string;
  onBackToDashboard: () => void;
  streamColor?: string;
  comments: any[];
  onAddComment: (text: string, authorName: string) => void;
}

export function WebinarPublicPage({
  webinarTitle,
  webinarDesc,
  webinarDate,
  isLive,
  thumbnailUrl,
  onBackToDashboard,
  streamColor = '#4683E0',
  comments,
  onAddComment
}: WebinarPublicPageProps) {
  const [view, setView] = useState<'landing' | 'room'>('landing');
  // Os links legais do formulário de inscrição eram <span> sem ação.
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [registered, setRegistered] = useState(false);

  // Contagem REAL de inscritos, do mesmo storage que o formulário grava.
  // Antes a página mostrava '382 participando' e '1.282 assistindo' fixos —
  // prova social inventada, exibida para a audiência do próprio cliente.
  const [registrationCount, setRegistrationCount] = useState(0);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('webinar_registrations');
      setRegistrationCount(saved ? (JSON.parse(saved) as unknown[]).length : 0);
    } catch { setRegistrationCount(0); }
  }, [registered]);
  const [chatInput, setChatInput] = useState('');
  
  // Interactive Poll State
  const [pollVoted, setPollVoted] = useState<string | null>(null);
  const [pollVotes, setPollVotes] = useState({ optionA: 42, optionB: 28, optionC: 15 });

  // Q&A State
  const [qaQuestions, setQaQuestions] = useState([
    { id: '1', author: 'Roberto Santos', text: 'Existe previsão de disponibilizar a gravação do webinar depois?', votes: 12 },
    { id: '2', author: 'Fernanda Lima', text: 'Quais os requisitos de banda de internet para transmitir em 1080p sem quedas?', votes: 7 }
  ]);
  const [newQuestionText, setNewQuestionText] = useState('');

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 12 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const newRegistration: Registration = {
      id: `reg-${Date.now()}`,
      name,
      email,
      company: company || 'Independente',
      registeredAt: new Date().toLocaleDateString('pt-BR')
    };

    // Save registration in localStorage
    const saved = localStorage.getItem('webinar_registrations');
    let currentRegs = [];
    if (saved) {
      try {
        currentRegs = JSON.parse(saved);
      } catch (e) {}
    }
    currentRegs.push(newRegistration);
    localStorage.setItem('webinar_registrations', JSON.stringify(currentRegs));

    setRegistered(true);
    // Auto redirect to public room
    setTimeout(() => {
      setView('room');
    }, 1500);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onAddComment(chatInput, name || 'Espectador Anônimo');
    setChatInput('');
  };

  const handleVotePoll = (option: 'optionA' | 'optionB' | 'optionC') => {
    if (pollVoted) return;
    setPollVoted(option);
    setPollVotes(prev => ({
      ...prev,
      [option]: prev[option] + 1
    }));
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    setQaQuestions(prev => [
      ...prev,
      {
        id: `q-${Date.now()}`,
        author: name || 'Espectador Anônimo',
        text: newQuestionText,
        votes: 1
      }
    ]);
    setNewQuestionText('');
  };

  const handleUpvoteQuestion = (id: string) => {
    setQaQuestions(prev => prev.map(q => q.id === id ? { ...q, votes: q.votes + 1 } : q));
  };

  const totalVotes = pollVotes.optionA + pollVotes.optionB + pollVotes.optionC;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink-hi)] flex flex-col relative overflow-hidden" id="public-webinar-view">
      {/* Dynamic color orb */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px]" />
      </div>

      {/* Header bar */}
      <header className="relative z-10 w-full border-b border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur-md px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PwStreamLogo iconSize={30} textSize="sm" />
          <span className="text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">Webinar Público</span>
        </div>
        <button
          onClick={onBackToDashboard}
          className="px-3.5 py-1.5 border border-[var(--line)] hover:bg-[var(--surface)] text-xs text-[var(--ink)] rounded-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <ArrowRight className="rotate-180" size={14} /> Painel Administrativo
        </button>
      </header>

      {/* Main View Container */}
      <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        
        {view === 'landing' ? (
          /* 1. REGISTRATION / LANDING PAGE VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-center my-auto">
            {/* Left Column: Webinar Info */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">
                <Sparkles size={14} />
                <span>Webinar Exclusivo do PwStreamer</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--ink-hi)] leading-tight">
                {webinarTitle || 'Como Alavancar suas Vendas com webinars interativos'}
              </h1>

              <p className="text-base text-[var(--ink)] leading-relaxed max-w-2xl">
                {webinarDesc || 'Aprenda os segredos e técnicas para engajar audiências com transmissões ao vivo de altíssimo nível, gerando conexões reais e impulsionando vendas de infoprodutos.'}
              </p>

              <div className="flex flex-wrap gap-4 sm:gap-6 text-sm text-[var(--ink)] pt-2">
                <div className="flex items-center gap-2.5 bg-[var(--surface)]/60 border border-[var(--line)] p-3.5 rounded-xl">
                  <Calendar size={18} className="text-blue-500" />
                  <div>
                    <p className="text-[10px] text-[var(--ink-lo)] font-bold uppercase tracking-wider">Data do Webinar</p>
                    <p className="font-semibold text-[var(--ink-hi)] mt-0.5">{webinarDate || 'Amanhã, às 19:30'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-[var(--surface)]/60 border border-[var(--line)] p-3.5 rounded-xl">
                  <Clock size={18} className="text-blue-500" />
                  <div>
                    <p className="text-[10px] text-[var(--ink-lo)] font-bold uppercase tracking-wider">Duração Estimada</p>
                    <p className="font-semibold text-[var(--ink-hi)] mt-0.5">60 a 90 minutos</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-[var(--surface)]/60 border border-[var(--line)] p-3.5 rounded-xl">
                  <Users size={18} className="text-blue-500" />
                  <div>
                    <p className="text-[10px] text-[var(--ink-lo)] font-bold uppercase tracking-wider">Inscritos Ativos</p>
                    <p className="font-semibold text-[var(--ink-hi)] mt-0.5">{registrationCount === 0 ? 'Seja o primeiro' : registrationCount === 1 ? '1 inscrito' : `${registrationCount} inscritos`}</p>
                  </div>
                </div>
              </div>

              {/* Countdown or Live Banner */}
              {isLive ? (
                <div className="inline-flex items-center gap-3 bg-red-600/15 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-sm font-extrabold animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  O WEBINAR ESTÁ AO VIVO NESTE MOMENTO!
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--ink-lo)] font-bold uppercase">A transmissão começará em:</p>
                  <div className="flex items-center gap-2 font-mono text-xl sm:text-2xl font-bold text-blue-400">
                    <span className="bg-[var(--surface)] px-3 py-1.5 border border-[var(--line)] rounded-lg">{String(timeLeft.hours).padStart(2, '0')}h</span>
                    <span>:</span>
                    <span className="bg-[var(--surface)] px-3 py-1.5 border border-[var(--line)] rounded-lg">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                    <span>:</span>
                    <span className="bg-[var(--surface)] px-3 py-1.5 border border-[var(--line)] rounded-lg text-emerald-400">{String(timeLeft.seconds).padStart(2, '0')}s</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Registration Form */}
            <div className="lg:col-span-5 bg-[var(--surface)]/80 border border-[var(--line)] p-6 sm:p-8 rounded-3xl shadow-2xl relative">
              <div className="absolute top-0 right-10 -translate-y-1/2 bg-blue-500 text-white px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                Inscrição Gratuita
              </div>

              {registered ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={36} className="animate-bounce" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--ink-hi)]">Vaga Garantida!</h3>
                  <p className="text-xs text-[var(--ink-lo)] leading-relaxed">Sua inscrição foi confirmada. Redirecionando para a sala de transmissão...</p>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="text-left space-y-1 mb-4">
                    <h2 className="text-lg font-bold text-[var(--ink-hi)]">Reserve seu Lugar</h2>
                    <p className="text-xs text-[var(--ink-lo)]">Preencha o formulário para receber os materiais extras e o acesso ao webinar.</p>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs text-[var(--ink-lo)] font-semibold">Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Albuquerque"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs text-[var(--ink-lo)] font-semibold">E-mail Corporativo</label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: carlos@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs text-[var(--ink-lo)] font-semibold">Empresa / Cargo</label>
                    <input
                      type="text"
                      placeholder="Ex: VineaSX Solutions / Diretor"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Consentimento LGPD.
                      `defaultChecked` saiu: sob o Art. 8 da LGPD o
                      consentimento tem de ser uma manifestação AFIRMATIVA do
                      titular — uma caixa pré-marcada não é consentimento.
                      Os dois links eram <span> mortos, embora o componente
                      LegalModal já existisse e estivesse pronto no projeto. */}
                  <div className="flex items-start gap-2 pt-2 text-left">
                    <input type="checkbox" required id="privacy-check" className="mt-1 accent-blue-500" />
                    <label htmlFor="privacy-check" className="text-[10px] text-[var(--ink-lo)] leading-relaxed">
                      Concordo em receber convites de webinars e aceito a{' '}
                      <button
                        type="button"
                        onClick={() => setLegalModal('privacy')}
                        className="text-blue-400 hover:underline cursor-pointer"
                      >
                        Política de Privacidade
                      </button>{' '}
                      e os{' '}
                      <button
                        type="button"
                        onClick={() => setLegalModal('terms')}
                        className="text-blue-400 hover:underline cursor-pointer"
                      >
                        Termos de Uso
                      </button>{' '}
                      da plataforma.
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[var(--color-brand-deep)] hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-xl hover:shadow-blue-500/10 cursor-pointer text-xs mt-2 flex items-center justify-center gap-2"
                  >
                    Confirmar Minha Inscrição <ArrowRight size={14} />
                  </button>

                  <div className="pt-4 border-t border-[var(--line)]/60 flex items-center justify-center gap-4 text-[11px] text-[var(--ink-lo)]">
                    <span className="flex items-center gap-1"><Award size={12} className="text-blue-500" /> Certificado</span>
                    <span className="text-[var(--ink-dim)]">•</span>
                    <span className="flex items-center gap-1"><Sparkles size={12} className="text-blue-500" /> Material Complementar</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* 2. WEBINAR TRANSMISSION ROOM VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch mt-2">
            
            {/* Left Column: Live stream preview & metadata (8 cols on desktop) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              
              {/* Live Video Box */}
              <div className="relative aspect-video bg-black border border-[var(--line)] rounded-2xl overflow-hidden flex items-center justify-center group shadow-2xl">
                {isLive ? (
                  /* Cloudflare Stream Player Live Embed */
                  <div className="w-full h-full relative">
                    <iframe
                      src={CLOUDFLARE_STREAM_CONFIG.playerUrl}
                      style={{ border: 'none', position: 'absolute', top: 0, left: 0, height: '100%', width: '100%' }}
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                      allowFullScreen={true}
                      title="Cloudflare Stream Live Player"
                    />
                    {/* Live overlay header */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                      <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md animate-pulse shadow-md pointer-events-auto">
                        AO VIVO
                      </span>
                      <span className="bg-[var(--surface)]/90 border border-[var(--line)]/80 px-2.5 py-1 rounded-lg text-[10px] font-bold text-[var(--ink-hi)] flex items-center gap-1.5 backdrop-blur-sm pointer-events-auto">
                        <Users size={12} className="text-blue-400" /> Transmissão ao vivo
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Offline state placeholder */
                  <div className="p-8 text-center space-y-4 max-w-md">
                    <div className="w-16 h-16 bg-[var(--surface)] border border-[var(--line)] rounded-full flex items-center justify-center mx-auto">
                      <Lock size={24} className="text-[var(--ink-lo)]" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-[var(--ink-hi)]">Transmissão Offline</h3>
                      <p className="text-xs text-[var(--ink-lo)] leading-relaxed">
                        A transmissão ainda não começou ou foi concluída. Fique de olho nesta sala para o início do evento programado.
                      </p>
                    </div>
                    <div className="inline-block px-4 py-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-xs font-semibold text-blue-400">
                      Horário: {webinarDate || 'Amanhã, às 19:30'}
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Info Panel */}
              <div className="bg-[var(--surface)]/60 border border-[var(--line)] p-5 rounded-2xl text-left space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-[var(--ink-hi)] leading-tight">{webinarTitle}</h2>
                  <button className="px-3 py-1.5 bg-[var(--panel)] hover:bg-[var(--panel)] text-xs font-semibold text-[var(--ink)] border border-[var(--line)]/60 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer">
                    <Share2 size={12} /> Compartilhar
                  </button>
                </div>
                <p className="text-xs text-[var(--ink)] leading-relaxed">{webinarDesc}</p>
                
                {/* CTA Active block (Simulates real-time Call To Action pushed by presentation host) */}
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-[var(--bg)]/40 border border-blue-500/30 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1 text-left">
                    <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">Oferta Especial</span>
                    <p className="text-xs font-bold text-[var(--ink-hi)]">Adquira o PwStreamer Completo com 30% Off</p>
                    <p className="text-[10px] text-[var(--ink-lo)]">Oferta válida exclusivamente para os participantes do webinar de hoje.</p>
                  </div>
                  <a 
                    href="#pricing-checkout" 
                    onClick={(e) => { e.preventDefault(); onBackToDashboard(); }}
                    className="px-4 py-2 bg-[var(--color-brand-deep)] hover:bg-blue-600 text-white font-bold text-xs rounded-lg transition-all shadow-md shrink-0 flex items-center gap-1.5"
                  >
                    Garantir Desconto <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Sidebar tabs (Chat, Polls, Q&A) (4 cols on desktop) */}
            <div className="lg:col-span-4 flex flex-col bg-[var(--bg)] border border-[var(--line)]/80 rounded-2xl overflow-hidden shadow-2xl h-[480px] sm:h-auto">
              
              {/* Tab Header Selector */}
              <div className="grid grid-cols-3 border-b border-[var(--line)] bg-[var(--bg)] text-xs font-semibold text-[var(--ink-lo)]">
                <button className="py-3.5 border-b-2 border-blue-500 text-[var(--ink-hi)] flex items-center justify-center gap-1.5">
                  <MessageSquare size={13} /> Chat
                </button>
                <div className="py-3.5 flex items-center justify-center gap-1.5 text-[var(--ink-dim)] border-x border-[var(--line)]/60">
                  <BarChart3 size={13} /> Enquete
                </div>
                <div className="py-3.5 flex items-center justify-center gap-1.5 text-[var(--ink-dim)]">
                  <HelpCircle size={13} /> Q&A
                </div>
              </div>

              {/* Chat tab body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-3 overflow-y-auto max-h-[300px] flex-1 custom-scrollbar">
                  {comments.length > 25 && (
                    <div className="text-center py-1">
                      <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                        Exibindo as 25 mensagens mais recentes ({comments.length.toLocaleString()} no total)
                      </span>
                    </div>
                  )}
                  {comments.slice(-25).map((comm, idx) => (
                    <div key={comm.id || idx} className="flex gap-2 text-xs text-left text-[var(--ink)] animate-in fade-in duration-150">
                      <img 
                        src={comm.authorAvatar} 
                        alt={comm.authorName} 
                        className="w-6 h-6 rounded-full object-cover shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[var(--ink-hi)] truncate">{comm.authorName}</span>
                          <span className="text-[10px] text-[var(--ink-dim)] font-mono">{comm.timestamp}</span>
                        </div>
                        <p className="text-[var(--ink)] mt-0.5 break-words leading-relaxed">{comm.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Question form/poll integration in sidebar drawer */}
                <div className="border-t border-[var(--line)]/60 pt-3 space-y-2">
                  {/* Interactive Quick Poll inside Chat Sidebar */}
                  <div className="bg-[var(--surface)] border border-[var(--line)] p-3 rounded-xl space-y-2 text-left">
                    <p className="text-[10px] text-blue-400 font-black tracking-wider uppercase">Votação Rápida</p>
                    <p className="text-xs font-semibold text-[var(--ink-hi)]">Qual rede social você mais utiliza para live streams?</p>
                    <div className="space-y-1.5">
                      {[
                        { key: 'optionA', label: 'YouTube Live', count: pollVotes.optionA },
                        { key: 'optionB', label: 'Instagram / Meta', count: pollVotes.optionB },
                        { key: 'optionC', label: 'TikTok RTMP', count: pollVotes.optionC }
                      ].map((opt) => {
                        const pct = totalVotes > 0 ? Math.round((opt.count / totalVotes) * 100) : 0;
                        const isVoted = pollVoted === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => handleVotePoll(opt.key as any)}
                            disabled={pollVoted !== null}
                            className={`w-full relative overflow-hidden rounded-lg p-2.5 border text-xs text-left transition-all ${
                              isVoted 
                                ? 'bg-blue-500/10 border-blue-500 font-semibold' 
                                : 'bg-[var(--bg)] border-[var(--line)] hover:border-[var(--line-ctl)]'
                            }`}
                          >
                            <div 
                              className="absolute top-0 left-0 bottom-0 bg-blue-500/10 transition-all duration-500" 
                              style={{ width: `${pct}%` }}
                            />
                            <div className="relative flex justify-between items-center">
                              <span className="text-[var(--ink)] truncate">{opt.label}</span>
                              <span className="font-mono text-[var(--ink-lo)]">{pct}% ({opt.count})</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submission form */}
                  <form onSubmit={handleSendChat} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Envie uma mensagem..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="p-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl transition-all"
                    >
                      <Send size={13} />
                    </button>
                  </form>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* O componente já existia e nunca era montado nesta página. */}
      <LegalModal
        isOpen={legalModal !== null}
        type={legalModal ?? 'privacy'}
        onClose={() => setLegalModal(null)}
      />
    </div>
  );
}
