import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Activity, Zap, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';

interface PerformanceDataPoint {
  time: string;
  cpu: number;      // %
  memory: number;   // %
  memoryGb: number; // GB
}

export function StudioPerformanceMonitor() {
  const [data, setData] = useState<PerformanceDataPoint[]>([
    { time: '12:00', cpu: 14, memory: 22, memoryGb: 1.76 },
    { time: '12:05', cpu: 18, memory: 24, memoryGb: 1.92 },
    { time: '12:10', cpu: 22, memory: 23, memoryGb: 1.84 },
    { time: '12:15', cpu: 31, memory: 27, memoryGb: 2.16 },
    { time: '12:20', cpu: 26, memory: 25, memoryGb: 2.00 },
    { time: '12:25', cpu: 42, memory: 31, memoryGb: 2.48 },
    { time: '12:30', cpu: 35, memory: 29, memoryGb: 2.32 },
    { time: '12:35', cpu: 28, memory: 26, memoryGb: 2.08 },
    { time: '12:40', cpu: 21, memory: 24, memoryGb: 1.92 },
    { time: '12:45', cpu: 19, memory: 22, memoryGb: 1.76 }
  ]);

  const [currentCpu, setCurrentCpu] = useState(19);
  const [currentMemory, setCurrentMemory] = useState(22);
  const [currentRamGb, setCurrentRamGb] = useState(1.76);
  const [isUpdating, setIsUpdating] = useState(true);

  // Simulate live hardware telemetry updates every 3.5 seconds
  useEffect(() => {
    if (!isUpdating) return;

    const interval = setInterval(() => {
      // Fluctuate CPU between 15% and 38%
      const newCpu = Math.floor(Math.random() * 22) + 16;
      // Fluctuate RAM between 20% and 30%
      const newMem = Math.floor(Math.random() * 10) + 20;
      const newRamGb = parseFloat(((newMem / 100) * 8).toFixed(2));

      setCurrentCpu(newCpu);
      setCurrentMemory(newMem);
      setCurrentRamGb(newRamGb);

      setData(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        // Organic transition on last point
        updated[lastIdx] = {
          ...updated[lastIdx],
          cpu: newCpu,
          memory: newMem,
          memoryGb: newRamGb
        };
        return updated;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isUpdating]);

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] p-6 rounded-2xl text-left space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--text-hi)] flex items-center gap-2">
            <Cpu size={20} className="text-blue-400" /> Monitoramento de Saúde do Estúdio (CPU & Memória)
          </h3>
          <p className="text-xs text-[var(--text-lo)] mt-1">
            Telemetria em tempo real do consumo de processamento de áudio, renderização gráfica WebGL e codificação de vídeo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            60 FPS • Estável
          </span>
          <button
            onClick={() => setIsUpdating(!isUpdating)}
            className={`p-2 rounded-lg border border-[var(--line)] text-[var(--text-lo)] hover:text-white transition-all text-xs cursor-pointer ${
              isUpdating ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-[var(--bg)]'
            }`}
            title={isUpdating ? 'Pausar Telemetria em Tempo Real' : 'Ativar Telemetria em Tempo Real'}
          >
            <RefreshCw size={14} className={isUpdating ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg)] border border-[var(--line)]/90 p-4 rounded-xl text-left space-y-1">
          <div className="flex items-center justify-between text-[var(--text-lo)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Uso do Processador (CPU)</span>
            <Cpu size={16} className="text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-black ${currentCpu > 70 ? 'text-red-400' : currentCpu > 40 ? 'text-amber-400' : 'text-blue-400'}`}>
              {currentCpu}%
            </span>
            <span className="text-[10px] text-[var(--text-dim)] font-mono">4 Cores vCPU</span>
          </div>
          <div className="w-full bg-[var(--surface)] h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className={`h-full transition-all duration-500 ${currentCpu > 70 ? 'bg-red-500' : currentCpu > 40 ? 'bg-amber-500' : 'bg-blue-500'}`}
              style={{ width: `${currentCpu}%` }}
            />
          </div>
        </div>

        <div className="bg-[var(--bg)] border border-[var(--line)]/90 p-4 rounded-xl text-left space-y-1">
          <div className="flex items-center justify-between text-[var(--text-lo)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Memória RAM Alocada</span>
            <HardDrive size={16} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-400">
              {currentRamGb} GB
            </span>
            <span className="text-[10px] text-[var(--text-dim)] font-mono">/ 8.00 GB ({currentMemory}%)</span>
          </div>
          <div className="w-full bg-[var(--surface)] h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${currentMemory}%` }}
            />
          </div>
        </div>

        <div className="bg-[var(--bg)] border border-[var(--line)]/90 p-4 rounded-xl text-left space-y-1">
          <div className="flex items-center justify-between text-[var(--text-lo)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Renderizador de Vídeo</span>
            <Zap size={16} className="text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400">60 FPS</span>
            <span className="text-[10px] text-emerald-400 font-bold">0 Dropped</span>
          </div>
          <p className="text-[10px] text-[var(--text-dim)]">Aceleração de Hardware GPU Ativa</p>
        </div>

        <div className="bg-[var(--bg)] border border-[var(--line)]/90 p-4 rounded-xl text-left space-y-1">
          <div className="flex items-center justify-between text-[var(--text-lo)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Bitrate do Encoder</span>
            <Activity size={16} className="text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-indigo-400">8.120 kbps</span>
          </div>
          <p className="text-[10px] text-[var(--text-dim)]">Cabo Ingest Ininterrupto</p>
        </div>
      </div>

      {/* Recharts Performance Area Chart */}
      <div className="pt-2">
        <span className="text-xs font-bold text-[var(--text-lo)] uppercase tracking-wider block mb-3">
          Histórico Telemétrico de CPU (%) vs Memória RAM (%)
        </span>

        <div className="h-64 w-full bg-[var(--bg)] p-3 border border-[var(--line)] rounded-xl">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E222B" />
              <XAxis dataKey="time" stroke="#6B7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6B7280" unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#16191E', 
                  borderColor: '#374151', 
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '12px'
                }} 
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
              <Area 
                type="monotone" 
                dataKey="cpu" 
                name="Uso de CPU (%)" 
                stroke="#3B82F6" 
                fillOpacity={1} 
                fill="url(#colorCpu)" 
                strokeWidth={2.5} 
              />
              <Area 
                type="monotone" 
                dataKey="memory" 
                name="Memória RAM (%)" 
                stroke="#10B981" 
                fillOpacity={1} 
                fill="url(#colorMemory)" 
                strokeWidth={2.5} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
