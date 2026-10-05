import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ArrowDown, CircleAlert, Pin, PinOff, Search, Send, X } from 'lucide-react';
import { Comment } from '../types';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { BotaoDeIcone } from './ui/BotaoDeIcone';
import { Button } from './ui/Button';
import { useConfirm } from './ui/ConfirmDialog';
import { Menu, type ItemDeMenu } from './ui/Menu';

interface VirtualizedChatProps {
  comments: Comment[];
  pinnedComment: Comment | null;
  onPinComment: (id: string | null) => void;
  onPostComment: (text: string) => void;
  onApproveComment?: (id: string) => void;
  isAiModerationEnabled?: boolean;
  aiModerationMode?: 'warn' | 'hide';
  /** Sem uso desde que o estúdio não entra mais no ar; sai com a limpeza da barra lateral. */
  isLive?: boolean;
  /** Sem uso: era o gerador de "+500 / +2.000 mensagens" de teste. */
  onBatchAddComments?: (comments: Comment[]) => void;
  onClearComments?: () => void;
  /** Primeiro nome de quem está logado, o autor das respostas. */
  authorName?: string;
}

const ESTIMATED_ITEM_HEIGHT = 64; // altura média de uma linha, em px
const OVERSCAN_COUNT = 5; // linhas desenhadas acima e abaixo da área visível

/**
 * O chat do estúdio, numa lista virtualizada.
 *
 * Hoje ele mostra só o que é enviado do estúdio: os comentários das
 * plataformas ainda não chegam, e a tela diz isso. Saíram:
 * - o painel "Virtualização Ativa (60 FPS)", com "Uso de Memória: Leve";
 * - os botões "+500 / +2.000 Msgs", que injetavam mensagens falsas de
 *   YouTube, Facebook e Twitch;
 * - os filtros por plataforma, que não tinham o que filtrar;
 * - o ponto amarelo "Moderando com Gemini IA", que aparecia mesmo quando
 *   quem conferia era uma lista de palavras;
 * - o aviso "Suas respostas serão enviadas para as mídias sociais ativas".
 */
export function VirtualizedChat({
  comments,
  pinnedComment,
  onPinComment,
  onPostComment,
  onApproveComment = () => {},
  isAiModerationEnabled = false,
  aiModerationMode = 'warn',
  onClearComments,
  authorName,
}: VirtualizedChatProps) {
  const confirmar = useConfirm();
  // "Ações do chat" some quando "Limpar o chat" esvazia a lista: a confirmação
  // tira a própria ação de onde está o foco, que cairia no <body>. A busca é o
  // botão estável do cabeçalho, que não some com as ações.
  const refBuscar = useRef<HTMLButtonElement>(null);
  const [typedComment, setTypedComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Virtualização
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);
  const measuredHeightsRef = useRef<Map<string, number>>(new Map());
  const [, setHeightUpdateTick] = useState(0);
  const prevCommentsLengthRef = useRef(comments.length);

  const filteredComments = useMemo(() => {
    let result = comments;
    // Moderação no modo "ocultar": some o que foi marcado e não foi liberado
    if (isAiModerationEnabled && aiModerationMode === 'hide') {
      result = result.filter((c) => {
        const isFlagged = c.isModerated && (c.isAbusive || c.isIrrelevant);
        return !isFlagged || c.isApprovedByUser;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.authorName.toLowerCase().includes(q) || c.text.toLowerCase().includes(q));
    }
    return result;
  }, [comments, isAiModerationEnabled, aiModerationMode, searchQuery]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [filteredComments.length === 0]);

  const { totalHeight, virtualItems, topOffset } = useMemo(() => {
    const count = filteredComments.length;
    if (count === 0) return { totalHeight: 0, virtualItems: [], topOffset: 0 };

    const positions: { top: number; bottom: number }[] = [];
    let currentTop = 0;
    for (let i = 0; i < count; i++) {
      const h = measuredHeightsRef.current.get(filteredComments[i].id) || ESTIMATED_ITEM_HEIGHT;
      positions.push({ top: currentTop, bottom: currentTop + h });
      currentTop += h;
    }

    // Busca binária da primeira linha visível
    let start = 0;
    let low = 0;
    let high = count - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (positions[mid].bottom < scrollTop) low = mid + 1;
      else {
        start = mid;
        high = mid - 1;
      }
    }
    start = Math.max(0, start - OVERSCAN_COUNT);

    const viewportBottom = scrollTop + containerHeight;
    let foundEnd = start;
    for (let i = start; i < count; i++) {
      foundEnd = i;
      if (positions[i].top > viewportBottom) break;
    }
    const end = Math.min(count - 1, foundEnd + OVERSCAN_COUNT);

    const items = [];
    for (let i = start; i <= end; i++) items.push({ comment: filteredComments[i] });
    return { totalHeight: currentTop, virtualItems: items, topOffset: positions[start]?.top || 0 };
  }, [filteredComments, scrollTop, containerHeight]);

  const onScrollHandler = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 45;
    setScrollTop(el.scrollTop);
    setIsNearBottom(isAtBottom);
    if (isAtBottom) setUnreadCount(0);
  }, []);

  // Mensagem nova: desce junto se já estava no fim; senão, conta como nova
  useEffect(() => {
    const currentLength = comments.length;
    const prevLength = prevCommentsLengthRef.current;
    prevCommentsLengthRef.current = currentLength;
    if (currentLength > prevLength) {
      if (isNearBottom) {
        requestAnimationFrame(() => {
          if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
        });
      } else {
        setUnreadCount((prev) => prev + (currentLength - prevLength));
      }
    }
  }, [comments.length, isNearBottom]);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduzir ? 'auto' : 'smooth' });
    setIsNearBottom(true);
    setUnreadCount(0);
  }, []);

  const setItemRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (!el) return;
    const measuredHeight = el.getBoundingClientRect().height;
    const oldHeight = measuredHeightsRef.current.get(id);
    if (measuredHeight && Math.abs(measuredHeight - (oldHeight || 0)) > 2) {
      measuredHeightsRef.current.set(id, measuredHeight);
      setHeightUpdateTick((t) => t + 1);
    }
  }, []);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedComment.trim()) return;
    onPostComment(typedComment);
    setTypedComment('');
    setTimeout(scrollToBottom, 50);
  };

  const handleExportChat = () => {
    if (comments.length === 0) return;
    const blob = new Blob([JSON.stringify(comments, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pwstreamer-chat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const acoes: ItemDeMenu[] = [];
  if (comments.length > 0) {
    acoes.push({ rotulo: 'Exportar o chat (.json)', onSelect: handleExportChat });
    if (onClearComments) {
      acoes.push({
        rotulo: 'Limpar o chat',
        perigo: true,
        onSelect: async () => {
          const ok = await confirmar({
            title: 'Limpar o chat?',
            description: 'As mensagens deste estúdio somem desta tela e do arquivo exportado.',
            confirmLabel: 'Limpar o chat',
            destructive: true,
          });
          if (ok) onClearComments();
        },
      });
    }
  }

  const fecharBusca = () => {
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  // O valor anterior de verdade, não uma flag de "já montou": o StrictMode
  // roda este efeito duas vezes ao montar, e uma flag não sobrevive a isso
  // (a segunda chamada já a vê marcada, com a lista ainda vazia, e rouba o
  // foco de um chat que nunca teve mensagem nenhuma).
  const acoesAntes = useRef(acoes.length);
  useEffect(() => {
    if (acoesAntes.current > 0 && acoes.length === 0 && document.activeElement === document.body) {
      refBuscar.current?.focus();
    }
    acoesAntes.current = acoes.length;
  }, [acoes.length]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--line)] py-1 pl-4 pr-1">
        <h2 className="text-sm font-medium text-[var(--ink-hi)]">Chat</h2>
        <span className="text-xs text-[var(--ink-lo)]">
          {comments.length === 1 ? '1 mensagem' : `${comments.length.toLocaleString('pt-BR')} mensagens`}
        </span>
        <div className="ml-auto flex items-center">
          <BotaoDeIcone
            ref={refBuscar}
            rotulo={isSearchOpen ? 'Fechar a busca' : 'Buscar no chat'}
            aria-expanded={isSearchOpen}
            onClick={() => (isSearchOpen ? fecharBusca() : setIsSearchOpen(true))}
            className="text-[var(--ink-lo)]"
          >
            {isSearchOpen ? <X size={16} aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
          </BotaoDeIcone>
          {acoes.length > 0 && <Menu rotulo="Ações do chat" itens={acoes} />}
        </div>
      </div>

      {isSearchOpen && (
        <div className="shrink-0 border-b border-[var(--line)] px-4 py-3">
          <input
            aria-label="Buscar no chat"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && fecharBusca()}
            placeholder="Nome ou mensagem"
            className="h-11 w-full rounded-xl border px-3 text-sm"
            autoFocus
          />
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col">
        {filteredComments.length === 0 ? (
          <div className="px-4 py-6">
            <p className="text-sm text-[var(--ink-hi)]">{searchQuery ? 'Nenhuma mensagem com esse termo.' : 'Nenhuma mensagem ainda.'}</p>
            {!searchQuery && (
              <p className="mt-1 max-w-prose text-pretty text-xs text-[var(--ink-lo)]">
                Os comentários do YouTube, do Facebook e dos outros canais ainda não chegam ao estúdio. Aqui aparecem as
                mensagens que você envia.
              </p>
            )}
          </div>
        ) : (
          <div
            ref={containerRef}
            onScroll={onScrollHandler}
            className="relative flex-1 overflow-y-auto"
            style={{ contain: 'strict' }}
          >
            <div style={{ height: `${totalHeight}px`, width: '100%', position: 'relative' }}>
              <div style={{ transform: `translateY(${topOffset}px)`, position: 'absolute', top: 0, left: 0, right: 0 }}>
                {virtualItems.map(({ comment }) => {
                  const isFlagged = comment.isModerated && (comment.isAbusive || comment.isIrrelevant);
                  const shouldShowWarning = isAiModerationEnabled && isFlagged && aiModerationMode === 'warn' && !comment.isApprovedByUser;
                  const isPinned = pinnedComment?.id === comment.id;
                  return (
                    <div
                      key={comment.id}
                      ref={(el) => setItemRef(comment.id, el)}
                      className={`border-b border-[var(--line)] px-4 py-2.5 ${isPinned ? 'bg-[var(--raise)]' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 truncate text-xs font-medium text-[var(--ink-hi)]">{comment.authorName}</span>
                        {comment.timestamp && (
                          <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--ink-lo)]">{comment.timestamp}</span>
                        )}
                        {comment.isModerated === false && <span className="shrink-0 text-xs text-[var(--ink-lo)]">conferindo…</span>}
                        {isPinned && <span className="shrink-0 text-xs text-[var(--ink-hi)]">fixado</span>}
                        <BotaoDeIcone
                          rotulo={isPinned ? `Desafixar a mensagem de ${comment.authorName}` : `Fixar no palco a mensagem de ${comment.authorName}`}
                          aria-pressed={isPinned}
                          onClick={() => onPinComment(isPinned ? null : comment.id)}
                          className="-my-2 ml-auto size-9 text-[var(--ink-lo)]"
                        >
                          {isPinned ? <PinOff size={14} aria-hidden="true" /> : <Pin size={14} aria-hidden="true" />}
                        </BotaoDeIcone>
                      </div>
                      {shouldShowWarning ? (
                        <div className="mt-1">
                          <p className="flex items-start gap-1.5 text-pretty text-xs text-[var(--ink-hi)]">
                            <CircleAlert size={14} aria-hidden="true" className="mt-px shrink-0" />
                            <span>Ocultada: {comment.moderationReason || 'linguagem imprópria'}.</span>
                          </p>
                          <AcaoDeTexto tamanho="xs" sublinhada onClick={() => onApproveComment(comment.id)} className="-my-3 min-h-11">
                            Mostrar mesmo assim
                          </AcaoDeTexto>
                        </div>
                      ) : (
                        <p className="mt-0.5 select-text break-words text-sm text-[var(--ink)]">{comment.text}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {(!isNearBottom || unreadCount > 0) && filteredComments.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollToBottom}
            icon={<ArrowDown size={14} aria-hidden="true" />}
            className="absolute bottom-3 right-4 bg-[var(--raise)]"
          >
            {unreadCount > 0 ? `${unreadCount} ${unreadCount === 1 ? 'nova' : 'novas'}` : 'Ir para o fim'}
          </Button>
        )}
      </div>

      <form onSubmit={handleCommentSubmit} className="shrink-0 border-t border-[var(--line)] px-4 py-3">
        <div className="flex gap-2">
          <input
            aria-label="Mensagem para o chat"
            type="text"
            value={typedComment}
            onChange={(e) => setTypedComment(e.target.value)}
            placeholder="Mensagem"
            className="h-11 min-w-0 flex-1 rounded-xl border px-3 text-sm"
          />
          <BotaoDeIcone
            type="submit"
            rotulo="Enviar a mensagem"
            disabled={!typedComment.trim()}
            className="border border-[var(--line-ctl)] text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Send size={16} aria-hidden="true" />
          </BotaoDeIcone>
        </div>
        <p className="mt-2 text-pretty text-xs text-[var(--ink-lo)]">
          {authorName ? `Você escreve como ${authorName}. ` : ''}As mensagens ficam só neste estúdio.
        </p>
      </form>
    </div>
  );
}
