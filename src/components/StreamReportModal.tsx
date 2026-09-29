import React from 'react';
import { Download, FileJson, CheckCircle2, CircleAlert, X, MessageSquare, Clock } from 'lucide-react';
import { Modal } from './ui/Modal';

/**
 * Só o que o app sabe da live. Espectadores e desempenho (CPU, memória, fps,
 * bitrate) não entram: o app não os mede, e o relatório os inventava.
 */
export interface StreamReportData {
  app: string;
  /** O título e a descrição que a pessoa deu à live; `null` quando em branco. */
  streamTitle: string | null;
  streamDescription: string | null;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  formattedDuration: string;
  totalCommentsReceived: number;
  /**
   * Canais que receberam a live (ligados e prontos em algum momento dela),
   * pelo nome do canal. Vazio quando nenhum recebeu — nunca um destino de
   * exemplo.
   */
  destinations: string[];
  /** Canais ligados que não receberam a live, com o que faltava ("sem chave"). */
  destinationsNotReached: Array<{ name: string; reason: string }>;
  comments: Array<{
    id: string;
    user: string;
    text: string;
    time: string;
    channel: string;
    isHighlight?: boolean;
  }>;
}

interface StreamReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: StreamReportData | null;
}

export function downloadStreamReportJSON(report: StreamReportData) {
  const jsonString = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PwStreamer_Relatorio_Live_${new Date().toISOString().slice(0, 10)}_${Date.now().toString(36)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function StreamReportModal({ isOpen, onClose, reportData }: StreamReportModalProps) {
  if (!isOpen || !reportData) return null;

  return (
    <Modal isOpen onClose={() => onClose()} bare ariaLabel="Relatório da transmissão">
      {/* Rola por dentro: o fundo do Modal centraliza sem rolar, e no celular
          um relatório com vários canais escondia o fechar e o baixar. */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl max-w-2xl w-full max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden p-6 text-left shadow-2xl space-y-6 relative">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <FileJson size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--ink-hi)] flex items-center gap-2">
                Relatório da live
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-black uppercase">
                  JSON Gerado
                </span>
              </h3>
              <p className="text-xs text-[var(--ink-lo)] mt-0.5">
                Transmissão encerrada. Baixe o relatório com a duração, os canais e os comentários.
              </p>
            </div>
          </div>

          <button aria-label="Fechar" 
            onClick={onClose}
            className="p-1.5 text-[var(--ink-lo)] hover:text-[var(--ink-hi)] bg-[var(--bg)] hover:bg-[var(--panel)] rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--bg)] p-3.5 border border-[var(--line)]/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--ink-lo)]">
              <span>Duração</span>
              <Clock size={13} />
            </div>
            <p className="text-lg font-black text-[var(--ink-hi)] font-mono tabular-nums">{reportData.formattedDuration}</p>
          </div>

          <div className="bg-[var(--bg)] p-3.5 border border-[var(--line)]/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--ink-lo)]">
              <span>Comentários</span>
              <MessageSquare size={13} />
            </div>
            <p className="text-lg font-black text-[var(--ink-hi)] font-mono tabular-nums">{reportData.totalCommentsReceived}</p>
          </div>
        </div>

        {/* Detailed Info Breakdown */}
        <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[var(--line)]/60 pb-2">
            <span className="shrink-0 text-[var(--ink-lo)]">Título da transmissão</span>
            {/* O título real pode ser longo: quebra em vez de cortar. */}
            {reportData.streamTitle ? (
              <span className="min-w-0 break-words text-[var(--ink-hi)] font-semibold sm:text-right">{reportData.streamTitle}</span>
            ) : (
              <span className="text-[var(--ink-lo)]">Sem título</span>
            )}
          </div>

          {/* Só os canais que receberam a live. Sem nenhum, a frase diz isso:
              a lista vazia deixava a linha em branco, e antes dela o app
              inventava "YouTube Live" e "Facebook Live". */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[var(--line)]/60 pb-2 last:border-b-0 last:pb-0">
            <span className="shrink-0 text-[var(--ink-lo)]">Canais de destino</span>
            {reportData.destinations.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5 sm:justify-end">
                {reportData.destinations.map((destino, i) => (
                  <li key={i} className="rounded-full border border-[var(--line-ctl)] px-2.5 py-0.5 text-[var(--ink-hi)]">
                    {destino}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-[var(--ink-hi)] sm:text-right">
                {reportData.destinationsNotReached.length > 0
                  ? 'Nenhum canal pronto: a live não foi retransmitida'
                  : 'Nenhum canal ligado: a live não foi retransmitida'}
              </span>
            )}
          </div>

          {/* Ligado sem servidor ou chave não recebe a live: aparece com o que
              faltava, na tinta do nome e com alerta — vermelho só no ar. */}
          {reportData.destinationsNotReached.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[var(--line)]/60 pb-2 last:border-b-0 last:pb-0">
              <span className="shrink-0 text-[var(--ink-lo)]">Ligados sem receber a live</span>
              <ul className="flex flex-wrap gap-x-3 gap-y-1.5 sm:justify-end">
                {reportData.destinationsNotReached.map((canal, i) => (
                  <li key={i} className="inline-flex items-center gap-1 text-[var(--ink-hi)]">
                    <CircleAlert size={14} aria-hidden="true" className="shrink-0" />
                    <span>{canal.name}: {canal.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-[var(--ink-lo)] flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span>Estrutura de arquivo válida compatível com BI e análise externa.</span>
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto sm:shrink-0">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] text-[var(--ink)] font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Fechar
            </button>

            <button
              onClick={() => downloadStreamReportJSON(reportData)}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={15} /> Baixar Relatório (JSON)
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
