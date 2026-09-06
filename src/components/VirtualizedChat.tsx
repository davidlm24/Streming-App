import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  MessageSquare, Pin, PinOff, ShieldAlert, Send, AlertCircle, 
  Search, ArrowDown, Trash2, Download, Zap, Sliders, CheckCircle2,
  Filter, Sparkles, RefreshCw, Layers
} from 'lucide-react';
import { Comment } from '../types';

interface VirtualizedChatProps {
  comments: Comment[];
  pinnedComment: Comment | null;
  onPinComment: (id: string | null) => void;
  onPostComment: (text: string) => void;
  onApproveComment?: (id: string) => void;
  isAiModerationEnabled?: boolean;
  aiModerationMode?: 'warn' | 'hide';
  isLive?: boolean;
  onBatchAddComments?: (comments: Comment[]) => void;
  onClearComments?: () => void;
}

const ESTIMATED_ITEM_HEIGHT = 74; // Estimated average height of a comment card in px
const OVERSCAN_COUNT = 5; // Number of items to render above and below visible area

export function VirtualizedChat({
  comments,
  pinnedComment,
  onPinComment,
  onPostComment,
  onApproveComment = () => {},
  isAiModerationEnabled = false,
  aiModerationMode = 'warn',
  isLive = false,
  onBatchAddComments,
  onClearComments,
}: VirtualizedChatProps) {
  // State
  const [typedComment, setTypedComment] = useState('');
  const [commentFilter, setCommentFilter] = useState<'all' | 'facebook' | 'youtube' | 'twitch' | 'studio' | 'flagged'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isPerformanceHUDOpen, setIsPerformanceHUDOpen] = useState(false);
  const [bufferLimit, setBufferLimit] = useState<number>(0); // 0 = unlimited with virtualization
  const [displayedCount, setDisplayedCount] = useState<number>(100); // For pagination mode if enabled
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);

  // Virtualization Scroll & Layout State
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);
  const measuredHeightsRef = useRef<Map<string, number>>(new Map());
  const [, setHeightUpdateTick] = useState(0);

  // Previous length to detect new incoming messages
  const prevCommentsLengthRef = useRef(comments.length);

  // Filtered comments memoized
  const filteredComments = useMemo(() => {
    let result = comments;

    // Platform / Flag filter
    if (commentFilter === 'flagged') {
      result = result.filter(c => c.isModerated && (c.isAbusive || c.isIrrelevant));
    } else if (commentFilter !== 'all') {
      result = result.filter(c => c.platform === commentFilter);
    }

    // AI Moderation hide mode
    if (isAiModerationEnabled && aiModerationMode === 'hide') {
      result = result.filter(c => {
        const isFlagged = c.isModerated && (c.isAbusive || c.isIrrelevant);
        return !isFlagged || c.isApprovedByUser;
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.authorName.toLowerCase().includes(q) || 
        c.text.toLowerCase().includes(q) ||
        c.platform.toLowerCase().includes(q)
      );
    }

    // Buffer limit if configured
    if (bufferLimit > 0 && result.length > bufferLimit) {
      result = result.slice(-bufferLimit);
    }

    return result;
  }, [comments, commentFilter, isAiModerationEnabled, aiModerationMode, searchQuery, bufferLimit]);

  // Measure container height with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          setContainerHeight(entry.contentRect.height);
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Compute item positions and virtual window
  const { totalHeight, startIndex, endIndex, virtualItems, topOffset } = useMemo(() => {
    const count = filteredComments.length;
    if (count === 0) {
      return { totalHeight: 0, startIndex: 0, endIndex: 0, virtualItems: [], topOffset: 0 };
    }

    const positions: { top: number; height: number; bottom: number }[] = [];
    let currentTop = 0;

    for (let i = 0; i < count; i++) {
      const item = filteredComments[i];
      const h = measuredHeightsRef.current.get(item.id) || ESTIMATED_ITEM_HEIGHT;
      positions.push({
        top: currentTop,
        height: h,
        bottom: currentTop + h,
      });
      currentTop += h;
    }

    const totalH = currentTop;

    // Find start index (binary search or scan)
    let start = 0;
    let end = count - 1;

    // Binary search for startIndex
    let low = 0;
    let high = count - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (positions[mid].bottom < scrollTop) {
        low = mid + 1;
      } else {
        start = mid;
        high = mid - 1;
      }
    }

    start = Math.max(0, start - OVERSCAN_COUNT);

    // Find endIndex
    const viewportBottom = scrollTop + containerHeight;
    let foundEnd = start;
    for (let i = start; i < count; i++) {
      if (positions[i].top > viewportBottom) {
        foundEnd = i;
        break;
      }
      foundEnd = i;
    }

    end = Math.min(count - 1, foundEnd + OVERSCAN_COUNT);

    const items = [];
    for (let i = start; i <= end; i++) {
      items.push({
        index: i,
        comment: filteredComments[i],
        top: positions[i].top,
        height: positions[i].height,
      });
    }

    const topPad = positions[start]?.top || 0;

    return {
      totalHeight: totalH,
      startIndex: start,
      endIndex: end,
      virtualItems: items,
      topOffset: topPad,
    };
  }, [filteredComments, scrollTop, containerHeight]);

  // Handle scroll events with requestAnimationFrame throttling
  const onScrollHandler = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const currentScrollTop = el.scrollTop;
    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;
    const distanceFromBottom = scrollHeight - currentScrollTop - clientHeight;
    const isAtBottom = distanceFromBottom <= 45;

    setScrollTop(currentScrollTop);
    setIsNearBottom(isAtBottom);

    if (isAtBottom) {
      setUnreadCount(0);
    }
  }, []);

  // Auto-scroll when new comments arrive
  useEffect(() => {
    const currentLength = comments.length;
    const prevLength = prevCommentsLengthRef.current;
    prevCommentsLengthRef.current = currentLength;

    if (currentLength > prevLength) {
      const addedCount = currentLength - prevLength;
      if (isNearBottom) {
        // User was at bottom: scroll down smoothly
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        });
      } else {
        // User is viewing history: accumulate unread badge
        setUnreadCount(prev => prev + addedCount);
      }
    }
  }, [comments.length, isNearBottom]);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setIsNearBottom(true);
      setUnreadCount(0);
    }
  }, []);

  // Measure dynamic height of rendered item
  const setItemRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (!el) return;
    const measuredHeight = el.getBoundingClientRect().height;
    const oldHeight = measuredHeightsRef.current.get(id);
    if (measuredHeight && measuredHeight !== oldHeight && Math.abs(measuredHeight - (oldHeight || 0)) > 2) {
      measuredHeightsRef.current.set(id, measuredHeight);
      setHeightUpdateTick(t => t + 1);
    }
  }, []);

  // Form submit
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedComment.trim()) return;
    onPostComment(typedComment);
    setTypedComment('');
    setTimeout(scrollToBottom, 50);
  };

  // Stress Test / Batch message generator
  const handleGenerateStressTest = (count: number) => {
    if (!onBatchAddComments) return;
    setIsGeneratingBatch(true);

    const names = [
      "Gabriel Lima", "Beatriz Rocha", "Lucas Mendes", "Renata Souza", 
      "Thiago Silva", "Carla Dias", "Felipe Neto", "Patrícia Melo",
      "Mariana Costa", "Bruno Alves", "Juliana Santos", "Rodrigo Ramos",
      "Aline Ferreira", "Diego Martins", "Camila Ribeiro", "Eduardo Castro"
    ];
    const avatars = [
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
    ];
    const messages = [
      "Excelente transmissão! Imagem e áudio em altíssima qualidade 1080p60.",
      "Esse recurso de trocar cenas e layouts instantaneamente é fantástico!",
      "Acompanhando ao vivo de São Paulo, muito aprendizado hoje.",
      "Qual é o microfone utilizado pelo palestrante?",
      "Parabéns pelo estúdio profissional, nota 10!",
      "Muito esclarecedora a explicação sobre multistreaming RTMP.",
      "Compartilhei o link da transmissão com o grupo da empresa!",
      "O chat continua 100% fluido mesmo com centenas de mensagens por minuto."
    ];

    const platforms: Array<'facebook' | 'youtube' | 'twitch' | 'studio'> = ['youtube', 'facebook', 'twitch', 'studio'];
    const generated: Comment[] = [];

    const now = new Date();
    for (let i = 0; i < count; i++) {
      const name = names[Math.floor(Math.random() * names.length)];
      const avatar = avatars[Math.floor(Math.random() * avatars.length)];
      const text = messages[Math.floor(Math.random() * messages.length)];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      generated.push({
        id: `stress-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        authorName: `${name} #${i + 1}`,
        authorAvatar: avatar,
        text,
        platform,
        timestamp: timeStr,
        isModerated: true
      });
    }

    onBatchAddComments(generated);
    setIsGeneratingBatch(false);
    setTimeout(scrollToBottom, 100);
  };

  // Export chat log
  const handleExportChat = () => {
    if (comments.length === 0) return;
    const jsonStr = JSON.stringify(comments, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pwstream-chat-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // DOM node count stats
  const renderedNodesCount = virtualItems.length;
  const totalItemsCount = filteredComments.length;
  const domSavingsPct = totalItemsCount > 0 
    ? Math.max(0, Math.round(((totalItemsCount - renderedNodesCount) / totalItemsCount) * 100)) 
    : 0;

  return (
    <div className="flex flex-col h-full min-h-0 space-y-2.5">
      {/* 1. Header with Stats & Actions */}
      <div className="shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[var(--ink-hi)] flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-500" />
              Chat do Webinar
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                {comments.length.toLocaleString()} msgs
              </span>
            </h2>
            <p className="text-[11px] text-[var(--ink-lo)]">Acompanhe comentários em tempo real com virtualização 60 FPS.</p>
          </div>

          {/* Quick HUD / Tools Toggle */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                isSearchOpen || searchQuery 
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
                  : 'bg-[var(--bg)] border-[var(--line)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
              }`}
              title="Buscar mensagens no chat"
            >
              <Search size={13} />
            </button>

            <button
              type="button"
              onClick={() => setIsPerformanceHUDOpen(!isPerformanceHUDOpen)}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                isPerformanceHUDOpen 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                  : 'bg-[var(--bg)] border-[var(--line)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
              }`}
              title="Painel de Desempenho e Virtualização"
            >
              <Zap size={13} />
            </button>
          </div>
        </div>

        {/* Search Bar (Collapsible) */}
        {isSearchOpen && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por usuário ou mensagem..."
              className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3 py-1.5 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 pr-8"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[var(--ink-dim)] hover:text-[var(--ink-hi)] text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Performance & Virtualization HUD Banner */}
        {isPerformanceHUDOpen && (
          <div className="p-3 bg-[var(--bg)] border border-emerald-500/30 rounded-xl space-y-2 text-left animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                <Zap size={13} className="animate-pulse" />
                <span>Virtualização Ativa (60 FPS)</span>
              </div>
              <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                Economia DOM: {domSavingsPct}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="bg-[var(--surface)] p-1.5 rounded-lg border border-[var(--line)]">
                <p className="text-[var(--ink-lo)]">Total no Histórico</p>
                <p className="font-mono font-bold text-[var(--ink-hi)] text-xs">{comments.length.toLocaleString()}</p>
              </div>
              <div className="bg-[var(--surface)] p-1.5 rounded-lg border border-[var(--line)]">
                <p className="text-[var(--ink-lo)]">Nós no DOM</p>
                <p className="font-mono font-bold text-emerald-400 text-xs">{renderedNodesCount} nós</p>
              </div>
              <div className="bg-[var(--surface)] p-1.5 rounded-lg border border-[var(--line)]">
                <p className="text-[var(--ink-lo)]">Uso de Memória</p>
                <p className="font-mono font-bold text-blue-400 text-xs">Leve (&lt; 2MB)</p>
              </div>
            </div>

            {/* Benchmark / Stress Test Actions */}
            <div className="pt-1 border-t border-[var(--line)]/80 flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleGenerateStressTest(500)}
                  disabled={isGeneratingBatch}
                  className="px-2 py-1 bg-[var(--panel)] hover:bg-[var(--raise)] text-[var(--ink-hi)] rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="Simula 500 mensagens instantâneas para testar performance"
                >
                  <Layers size={10} /> +500 Msgs
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateStressTest(2000)}
                  disabled={isGeneratingBatch}
                  className="px-2 py-1 bg-[var(--panel)] hover:bg-[var(--raise)] text-[var(--ink-hi)] rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="Simula 2.000 mensagens de alta escala"
                >
                  <Layers size={10} /> +2.000 Msgs
                </button>
              </div>

              <div className="flex items-center gap-1">
                {comments.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportChat}
                    className="p-1 text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--panel)] rounded transition-colors"
                    title="Exportar log do chat (.json)"
                  >
                    <Download size={12} />
                  </button>
                )}
                {onClearComments && comments.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearComments}
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors"
                    title="Limpar histórico do chat"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filter chips bar */}
        <div className="flex bg-[var(--bg)] border border-[var(--line)] rounded-xl p-1 gap-1 overflow-x-auto custom-scrollbar">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'youtube', label: 'YouTube' },
            { key: 'facebook', label: 'Facebook' },
            { key: 'twitch', label: 'Twitch' },
            { key: 'studio', label: 'Estúdio' },
            ...(isAiModerationEnabled ? [{ key: 'flagged', label: 'Alertas IA' }] : [])
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setCommentFilter(f.key as any)}
              className={`flex-1 min-w-[50px] text-center py-1 text-[11px] font-semibold rounded-lg capitalize transition-all cursor-pointer truncate ${
                commentFilter === f.key ? 'bg-[var(--color-brand-deep)] text-white shadow-sm' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Virtualized Comments Container */}
      <div className="relative flex-1 min-h-0 bg-[var(--bg)] border border-[var(--line)] rounded-xl overflow-hidden flex flex-col">
        {filteredComments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[var(--ink-dim)] py-8 px-4">
            <MessageSquare size={26} className="mb-2 text-[var(--ink-dim)] opacity-60" />
            <p className="text-xs font-semibold text-[var(--ink-lo)]">Nenhum comentário encontrado.</p>
            <p className="text-[10px] text-[var(--ink-dim)] mt-0.5">
              {searchQuery ? 'Tente ajustar os termos da busca.' : 'As mensagens ao vivo dos espectadores aparecerão aqui.'}
            </p>
          </div>
        ) : (
          <div
            ref={containerRef}
            onScroll={onScrollHandler}
            className="flex-1 overflow-y-auto p-3 custom-scrollbar relative will-change-scroll"
            style={{ contain: 'strict' }}
          >
            {/* Full Height Spacer for perfect scrollbar sizing */}
            <div style={{ height: `${totalHeight}px`, width: '100%', position: 'relative' }}>
              {/* Virtual Slice Window */}
              <div 
                style={{ 
                  transform: `translateY(${topOffset}px)`, 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0 
                }}
                className="space-y-2.5"
              >
                {virtualItems.map(({ comment, index }) => {
                  const isFlagged = comment.isModerated && (comment.isAbusive || comment.isIrrelevant);
                  const shouldShowWarning = isAiModerationEnabled && isFlagged && aiModerationMode === 'warn' && !comment.isApprovedByUser;
                  const isPinned = pinnedComment?.id === comment.id;

                  return (
                    <div
                      key={comment.id}
                      ref={(el) => setItemRef(comment.id, el)}
                      className={`flex gap-2.5 p-2.5 rounded-xl text-xs text-left transition-all border ${
                        isPinned
                          ? 'bg-blue-950/30 border-blue-500 ring-1 ring-blue-500/30'
                          : shouldShowWarning
                            ? 'bg-red-950/25 border-red-900/50 hover:border-red-500/30'
                            : 'bg-[var(--surface)] border-[var(--line)]/90 hover:border-blue-500/30'
                      }`}
                    >
                      <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        className="w-7 h-7 rounded-full object-cover mt-0.5 border border-white/10 shrink-0"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-semibold text-[var(--ink-hi)] truncate text-[11px]">{comment.authorName}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {comment.timestamp && (
                              <span className="text-[9px] text-[var(--ink-dim)] font-mono">{comment.timestamp}</span>
                            )}
                            <button
                              type="button"
                              onClick={() => onPinComment(isPinned ? null : comment.id)}
                              className={`p-1 rounded transition-colors cursor-pointer ${
                                isPinned ? 'bg-blue-500 text-white' : 'text-[var(--ink-dim)] hover:text-[var(--ink-hi)] hover:bg-[var(--raise)]'
                              }`}
                              title={isPinned ? "Desafixar do estúdio" : "Fixar comentário na tela da live"}
                            >
                              {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                            </button>

                            {comment.isModerated === false && (
                              <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse" title="Moderando com Gemini IA..." />
                            )}

                            {isFlagged && isAiModerationEnabled && (
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold tracking-wider uppercase ${
                                comment.isAbusive ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {comment.isAbusive ? 'Abusivo' : 'Irrelevante'}
                              </span>
                            )}

                            <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider ${
                              comment.platform === 'youtube'
                                ? 'bg-red-500/15 text-red-400'
                                : comment.platform === 'facebook'
                                  ? 'bg-blue-500/15 text-blue-400'
                                  : comment.platform === 'twitch'
                                    ? 'bg-purple-500/15 text-purple-400'
                                    : 'bg-emerald-500/15 text-emerald-400'
                            }`}>
                              {comment.platform}
                            </span>
                          </div>
                        </div>

                        {shouldShowWarning ? (
                          <div className="mt-1 space-y-1.5">
                            <p className="text-red-400 italic text-[11px] flex items-center gap-1 font-medium leading-normal">
                              <ShieldAlert size={12} className="shrink-0" />
                              Ocultado: {comment.moderationReason || 'Linguagem imprópria'}
                            </p>
                            <button
                              type="button"
                              onClick={() => onApproveComment(comment.id)}
                              className="px-2 py-0.5 bg-[var(--surface)] hover:bg-[var(--panel)] border border-[var(--line-ctl)] hover:border-[var(--line-ctl)] text-[var(--ink)] rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Mostrar mesmo assim
                            </button>
                          </div>
                        ) : (
                          <p className="text-[var(--ink)] mt-1 break-words text-[11px] leading-relaxed select-text">{comment.text}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Floating "New Messages" Jump Button when Scrolled Up */}
        {(!isNearBottom || unreadCount > 0) && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-2.5 right-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 transition-all z-20 cursor-pointer border border-blue-400/40 animate-bounce"
          >
            <ArrowDown size={13} />
            <span>{unreadCount > 0 ? `${unreadCount} novas mensagens` : 'Rolar para o final'}</span>
          </button>
        )}
      </div>

      {/* 3. Comment Submission Form */}
      <form onSubmit={handleCommentSubmit} className="space-y-1.5 shrink-0 pt-0.5">
        <div className="flex gap-2">
          <input
            type="text"
            value={typedComment}
            onChange={(e) => setTypedComment(e.target.value)}
            placeholder="Responda como Marcos..."
            className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={!typedComment.trim()}
            className="p-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:hover:bg-blue-500 text-white rounded-xl transition-all shadow-md cursor-pointer"
            title="Enviar mensagem para o chat"
          >
            <Send size={14} />
          </button>
        </div>

        <div className="bg-[var(--bg)] border border-[var(--line)] p-2 text-[9px] text-[var(--ink-lo)] flex items-start gap-1.5 rounded-lg">
          <AlertCircle size={12} className="text-[var(--color-brand)] mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            {isLive
              ? "A transmissão está AO VIVO! Suas respostas serão enviadas para as mídias sociais ativas."
              : "Modo Estúdio: Respostas visíveis apenas para os convidados internos do estúdio."
            }
          </p>
        </div>
      </form>
    </div>
  );
}
