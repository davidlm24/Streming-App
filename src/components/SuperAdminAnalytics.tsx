import React, { useState } from 'react';
import { 
  HardDrive, Video, Database, Users, BarChart3, AlertTriangle, 
  TrendingUp, FolderArchive, Layers, RefreshCw, CheckCircle,
  ShieldAlert, ArrowUpRight, Cpu
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

export interface ClientStorageUsage {
  id: string;
  clientName: string;
  clientEmail: string;
  plan: 'Standard' | 'Professional' | 'Business' | 'Free Trial';
  activeWebinars: number;
  totalRecordingsCount: number;
  storageUsedGb: number;
  storageLimitGb: number;
  bandwidthEgressGb: number;
  lastActive: string;
  assetBreakdown: {
    recordingsGb: number;
    bannersAndLogosGb: number;
    videoOverlaysGb: number;
  };
}

interface SuperAdminAnalyticsProps {
  clientsList?: Array<{ id: string; name: string; email: string; plan: string; webinarsCount: number; status: string }>;
  allWebinarsCount?: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function SuperAdminAnalytics({ clientsList, allWebinarsCount }: SuperAdminAnalyticsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high-usage' | 'active-only'>('all');

  // Client Storage Usage Data
  const [clientUsageData, setClientUsageData] = useState<ClientStorageUsage[]>([
    {
      id: 'usr-1',
      clientName: 'Miguel Ramos (PwStreamer Owner)',
      clientEmail: 'mgdlms@gmail.com',
      plan: 'Business',
      activeWebinars: 6,
      totalRecordingsCount: 14,
      storageUsedGb: 84.2,
      storageLimitGb: 200,
      bandwidthEgressGb: 412.5,
      lastActive: 'Hoje, 10:45',
      assetBreakdown: {
        recordingsGb: 72.0,
        bannersAndLogosGb: 4.2,
        videoOverlaysGb: 8.0
      }
    },
    {
      id: 'usr-2',
      clientName: 'Tech Live Brasil Studio',
      clientEmail: 'contato@techlivebr.com.br',
      plan: 'Professional',
      activeWebinars: 4,
      totalRecordingsCount: 9,
      storageUsedGb: 48.6,
      storageLimitGb: 100,
      bandwidthEgressGb: 215.0,
      lastActive: 'Hoje, 09:12',
      assetBreakdown: {
        recordingsGb: 42.0,
        bannersAndLogosGb: 2.1,
        videoOverlaysGb: 4.5
      }
    },
    {
      id: 'usr-3',
      clientName: 'Estúdio Digital Marketing',
      clientEmail: 'financeiro@estudiodigital.com',
      plan: 'Standard',
      activeWebinars: 3,
      totalRecordingsCount: 5,
      storageUsedGb: 38.9,
      storageLimitGb: 50,
      bandwidthEgressGb: 120.4,
      lastActive: 'Ontem, 18:30',
      assetBreakdown: {
        recordingsGb: 35.0,
        bannersAndLogosGb: 1.4,
        videoOverlaysGb: 2.5
      }
    },
    {
      id: 'usr-4',
      clientName: 'Canal Gamer BR',
      clientEmail: 'streamer@gamerbr.tv',
      plan: 'Free Trial',
      activeWebinars: 1,
      totalRecordingsCount: 2,
      storageUsedGb: 14.1,
      storageLimitGb: 15,
      bandwidthEgressGb: 45.0,
      lastActive: '05/08/2026',
      assetBreakdown: {
        recordingsGb: 12.8,
        bannersAndLogosGb: 0.5,
        videoOverlaysGb: 0.8
      }
    }
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 700);
  };

  // Calculations
  const totalStorageUsed = clientUsageData.reduce((acc, c) => acc + c.storageUsedGb, 0);
  const totalStorageAllocated = clientUsageData.reduce((acc, c) => acc + c.storageLimitGb, 0);
  const totalActiveWebinars = allWebinarsCount ?? clientUsageData.reduce((acc, c) => acc + c.activeWebinars, 0);
  const totalRecordings = clientUsageData.reduce((acc, c) => acc + c.totalRecordingsCount, 0);
  const totalBandwidthGb = clientUsageData.reduce((acc, c) => acc + c.bandwidthEgressGb, 0);

  // Clients nearing storage limit (>75%)
  const highUsageClients = clientUsageData.filter(c => (c.storageUsedGb / c.storageLimitGb) >= 0.75);

  // Filtered clients list for the table
  const filteredData = clientUsageData.filter(c => {
    if (selectedFilter === 'high-usage') return (c.storageUsedGb / c.storageLimitGb) >= 0.75;
    if (selectedFilter === 'active-only') return c.activeWebinars > 0;
    return true;
  });

  // Recharts Chart Data
  const chartStorageByClient = clientUsageData.map(c => ({
    name: c.clientEmail.split('@')[0],
    Ocupado: Number(c.storageUsedGb.toFixed(1)),
    Limite: c.storageLimitGb
  }));

  const chartStorageTypeDistribution = [
    { name: 'Gravações em Vídeo (MP4/HLS)', value: Number(clientUsageData.reduce((a, c) => a + c.assetBreakdown.recordingsGb, 0).toFixed(1)) },
    { name: 'Overlays & Vinhetas', value: Number(clientUsageData.reduce((a, c) => a + c.assetBreakdown.videoOverlaysGb, 0).toFixed(1)) },
    { name: 'Logos & Banners', value: Number(clientUsageData.reduce((a, c) => a + c.assetBreakdown.bannersAndLogosGb, 0).toFixed(1)) }
  ];

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-200" id="super-admin-analytics-component">
      
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#16191E] border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-md border border-blue-500/20">
              Telemetria Global de Armazenamento
            </span>
            <span className="text-gray-500 text-xs">• Mídia & Cloud Storage</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <BarChart3 className="text-amber-400" size={22} /> Resumo de Uso da Plataforma & Quotas por Cliente
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Monitoramento centralizado de espaço em disco ocupado, transmissão de tráfego (Egress) e total de webinars ativos por conta de cliente.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className={`px-4 py-2 bg-[#0F1115] hover:bg-slate-800 border border-slate-800 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shrink-0 ${isRefreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={14} /> Atualizar Métricas
        </button>
      </div>

      {/* Alert Banner if any client is nearing storage limit */}
      {highUsageClients.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-red-950/60 border border-amber-500/40 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300">
                Atenção: {highUsageClients.length} cliente(s) próximo(s) do limite de armazenamento quota
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {highUsageClients.map(c => `${c.clientEmail} (${((c.storageUsedGb / c.storageLimitGb) * 100).toFixed(0)}%)`).join(', ')}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedFilter('high-usage')}
            className="px-3 py-1.5 bg-amber-500 text-slate-950 font-black text-xs rounded-lg hover:bg-amber-400 transition-all cursor-pointer shrink-0"
          >
            Filtrar Alertas
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#16191E] border border-slate-800 p-5 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Webinars Ativos no Servidor</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Video size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-blue-400">{totalActiveWebinars}</p>
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-400" /> Transmissões ao vivo & gravadas
          </p>
        </div>

        <div className="bg-[#16191E] border border-slate-800 p-5 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Armazenamento Ocupado Total</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <HardDrive size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-400">{totalStorageUsed.toFixed(1)} <span className="text-sm font-semibold text-gray-400">/ {totalStorageAllocated} GB</span></p>
          <div className="w-full bg-[#0F1115] h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalStorageUsed / totalStorageAllocated) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-[#16191E] border border-slate-800 p-5 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gravações em Nuvem</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <FolderArchive size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-400">{totalRecordings}</p>
          <p className="text-[11px] text-gray-400">Arquivos MP4/HLS gerados</p>
        </div>

        <div className="bg-[#16191E] border border-slate-800 p-5 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tráfego Egress (Bandwidth)</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Cpu size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-purple-400">{(totalBandwidthGb / 1024).toFixed(2)} <span className="text-sm font-semibold text-gray-400">TB</span></p>
          <p className="text-[11px] text-gray-400">Transferência para CDN/Redes</p>
        </div>

      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart: Storage by Client */}
        <div className="lg:col-span-2 bg-[#16191E] border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-400" /> Comparativo de Espaço em Disco por Cliente (GB)
              </h3>
              <p className="text-[11px] text-gray-400">Ocupado vs Quota total do Plano</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartStorageByClient} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F1115', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                />
                <Bar dataKey="Ocupado" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Limite" fill="#1E293B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Storage Asset Type Distribution */}
        <div className="bg-[#16191E] border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers size={16} className="text-amber-400" /> Distribuição por Tipo de Mídia
            </h3>
            <p className="text-[11px] text-gray-400">Proporção dos arquivos armazenados</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartStorageTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartStorageTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F1115', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px]">
            {chartStorageTypeDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-bold text-white">{item.value} GB</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Client Storage Breakdown Table */}
      <div className="bg-[#16191E] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database size={18} className="text-emerald-400" /> Detalhamento de Armazenamento Ocupado por Cliente
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Lista individualizada de consumo de espaço e webinars ativos por e-mail cadastrado.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0F1115] border border-slate-800 p-1 rounded-xl text-xs font-bold">
            {(['all', 'high-usage', 'active-only'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedFilter === filter 
                    ? 'bg-amber-500 text-slate-950 font-black' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {filter === 'all' ? 'Todos os Clientes' : filter === 'high-usage' ? '⚠️ >75% Quota' : 'Com Webinars Ativos'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="p-3">Cliente / E-mail</th>
                <th className="p-3">Plano</th>
                <th className="p-3 text-center">Webinars Ativos</th>
                <th className="p-3 text-center">Gravações</th>
                <th className="p-3">Espaço Ocupado</th>
                <th className="p-3">% Uso da Quota</th>
                <th className="p-3 text-right">Egress Tráfego</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredData.map(client => {
                const percentUsed = (client.storageUsedGb / client.storageLimitGb) * 100;
                const statusColor = percentUsed > 85 ? 'bg-red-500' : percentUsed > 65 ? 'bg-amber-500' : 'bg-emerald-500';

                return (
                  <tr key={client.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div>
                        <p className="font-bold text-white">{client.clientName}</p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">{client.clientEmail}</p>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border ${
                        client.plan === 'Business' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                        client.plan === 'Professional' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        client.plan === 'Standard' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-gray-800 text-gray-400 border-gray-700'
                      }`}>
                        {client.plan}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <span className="font-black text-blue-400 text-sm">{client.activeWebinars}</span>
                    </td>

                    <td className="p-3 text-center">
                      <span className="font-bold text-gray-300">{client.totalRecordingsCount} arquivos</span>
                    </td>

                    <td className="p-3 font-mono">
                      <span className="font-bold text-white">{client.storageUsedGb.toFixed(1)} GB</span>
                      <span className="text-[10px] text-gray-500 block">de {client.storageLimitGb} GB</span>
                    </td>

                    <td className="p-3 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className={percentUsed > 85 ? 'text-red-400' : 'text-gray-300'}>
                            {percentUsed.toFixed(0)}%
                          </span>
                          {percentUsed > 85 && (
                            <span className="text-red-400 text-[9px] uppercase font-black">Quota Limite</span>
                          )}
                        </div>
                        <div className="w-full bg-[#0F1115] h-2 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className={`h-full rounded-full ${statusColor}`}
                            style={{ width: `${Math.min(100, percentUsed)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-purple-300">
                      {client.bandwidthEgressGb.toFixed(1)} GB
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
