import React from 'react';
import { Download, FileJson, CheckCircle2, X, Users, MessageSquare, Clock, ShieldCheck, Video, Radio } from 'lucide-react';
import { Modal } from './ui/Modal';

export interface StreamReportData {
  app: string;
  version: string;
  streamTitle: string;
  streamDescription: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  formattedDuration: string;
  peakViewers: number;
  averageViewers: number;
  totalCommentsReceived: number;
  destinations: string[];
  comments: Array<{
    id: string;
    user: string;
    text: string;
    time: string;
    channel: string;
    isHighlight?: boolean;
  }>;
  systemPerformance: {
    averageCpuUsage: string;
    averageMemoryUsage: string;
    fps: number;
    droppedFrames: number;
    bitrateKbps: number;
    status: string;
  };
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
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl max-w-2xl w-full p-6 text-left shadow-2xl space-y-6 relative overflow-hidden">
        
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
                Relatório de Estatísticas da Live
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-black uppercase">
                  JSON Gerado
                </span>
              </h3>
              <p className="text-xs text-[var(--ink-lo)] mt-0.5">
                Transmissão encerrada. Baixe o relatório completo de telemetria, interações e dados de audiência.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-[var(--ink-lo)] hover:text-[var(--ink-hi)] bg-[var(--bg)] hover:bg-[var(--panel)] rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[var(--bg)] p-3.5 border border-[var(--line)]/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[var(--ink-lo)] text-[10px] font-bold uppercase">
              <span>Duração Live</span>
              <Clock size={13} className="text-blue-400" />
            </div>
            <p className="text-lg font-black text-[var(--ink-hi)] font-mono">{reportData.formattedDuration}</p>
          </div>

          <div className="bg-[var(--bg)] p-3.5 border border-[var(--line)]/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[var(--ink-lo)] text-[10px] font-bold uppercase">
              <span>Pico Espectadores</span>
              <Users size={13} className="text-amber-400" />
            </div>
            <p className="text-lg font-black text-amber-400">{reportData.peakViewers}</p>
          </div>

          <div className="bg-[var(--bg)] p-3.5 border border-[var(--line)]/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[var(--ink-lo)] text-[10px] font-bold uppercase">
              <span>Comentários</span>
              <MessageSquare size={13} className="text-emerald-400" />
            </div>
            <p className="text-lg font-black text-emerald-400">{reportData.totalCommentsReceived}</p>
          </div>

          <div className="bg-[var(--bg)] p-3.5 border border-[var(--line)]/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[var(--ink-lo)] text-[10px] font-bold uppercase">
              <span>Quadros (FPS)</span>
              <ShieldCheck size={13} className="text-indigo-400" />
            </div>
            <p className="text-lg font-black text-indigo-400">{reportData.systemPerformance.fps} FPS</p>
          </div>
        </div>

        {/* Detailed Info Breakdown */}
        <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[var(--line)]/60 pb-2">
            <span className="text-[var(--ink-lo)] font-bold uppercase text-[10px]">Título da Transmissão:</span>
            <span className="text-[var(--ink-hi)] font-semibold truncate">{reportData.streamTitle}</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[var(--line)]/60 pb-2">
            <span className="text-[var(--ink-lo)] font-bold uppercase text-[10px]">Canais de Destino:</span>
            <div className="flex flex-wrap gap-1.5">
              {reportData.destinations.map((dest, i) => (
                <span key={i} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] px-2 py-0.5 rounded font-bold">
                  {dest}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <span className="text-[var(--ink-lo)] font-bold uppercase text-[10px]">Saúde do Hardware Estúdio:</span>
            <span className="text-emerald-400 font-mono font-bold">
              CPU: {reportData.systemPerformance.averageCpuUsage} • RAM: {reportData.systemPerformance.averageMemoryUsage}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-[var(--ink-lo)] flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span>Estrutura de arquivo válida compatível com BI e análise externa.</span>
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
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
