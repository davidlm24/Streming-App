import React, { useState, useEffect } from 'react';
import { 
  Key, Plus, Trash2, Copy, Check,
  Crown, Share2, Eye, ShieldCheck, Lock, RefreshCw, Radio, RotateCw, Activity
} from 'lucide-react';
import { 
  subscribeClientRtmpKeys, 
  RtmpKeyEntry 
} from '../lib/firestoreService';
import { authenticatedFetch } from '../lib/api.ts';
import { OBSIntegrationModal } from "./OBSIntegrationModal";
import { RTMPConfigModal } from "./RTMPConfigModal";
import { StudioPerformanceMonitor } from './StudioPerformanceMonitor';
import { WebhookPanel } from './WebhookPanel';

interface AdminPanelProps {
  onBack: () => void;
  user: { email: string; name: string; plan: string } | null;
  onNavigateSuperAdmin?: () => void;
}

export function AdminPanel({ onBack, user, onNavigateSuperAdmin }: AdminPanelProps) {
  const [clientTab, setClientTab] = useState<'my-rtmp' | 'destinations' | 'stats' | 'webhooks'>('my-rtmp');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [isRtmpConfigModalOpen, setIsRtmpConfigModalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Firestore Isolated RTMP Keys for this client
  const [clientRtmpKeys, setClientRtmpKeys] = useState<RtmpKeyEntry[]>([]);

  useEffect(() => {
    const email = user?.email;
    if (!email) {
      setClientRtmpKeys([]);
      return;
    }
    const unsubscribe = subscribeClientRtmpKeys(email, (keys) => {
      setClientRtmpKeys(keys);
    });

    return () => unsubscribe();
  }, [user?.email]);

  // Fallback assigned key if Firestore loading
  const primaryKey = clientRtmpKeys[0] || {
    id: '',
    label: 'Nenhuma chave de ingestão provisionada',
    server: 'rtmp://stream.pwstreamer.com/live',
    key: '',
    maxBitrate: '8000 kbps',
    clientEmail: user?.email || '',
    active: false,
    createdAt: ''
  };

  const handleRegenerateKey = async (keyId: string) => {
    if (!window.confirm('Tem certeza de que deseja regenerar sua chave de transmissão? Você precisará atualizar a nova chave no OBS Studio.')) {
      return;
    }
    setIsRegenerating(true);
    try {
      const response = await authenticatedFetch(`/api/rtmp/keys/${encodeURIComponent(keyId)}/regenerate`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok || !result.key) throw new Error(result.error || 'Não foi possível regenerar a chave.');
      setClientRtmpKeys((keys) => keys.map((key) => key.id === keyId ? { ...key, key: result.key, createdAt: result.createdAt } : key));
    } finally {
      setIsRegenerating(false);
    }
  };

  // Client Outbound Destinations (YouTube, Facebook, Twitch, custom RTMP)
  const [clientDestinations, setClientDestinations] = useState([
    { id: 'dest-yt', platform: 'YouTube Live', streamKey: '', rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2', active: true },
    { id: 'dest-fb', platform: 'Facebook Live', streamKey: '', rtmpUrl: 'rtmps://live-api-s.facebook.com:443/rtmp/', active: true },
    { id: 'dest-tw', platform: 'Twitch TV', streamKey: '', rtmpUrl: 'rtmp://live.twitch.tv/app', active: false }
  ]);

  const [newDestPlatform, setNewDestPlatform] = useState('');
  const [newDestKey, setNewDestKey] = useState('');
  const [newDestUrl, setNewDestUrl] = useState('');

  const handleAddClientDestination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDestPlatform || !newDestKey) return;

    const newDest = {
      id: `dest-${Date.now()}`,
      platform: newDestPlatform,
      streamKey: newDestKey,
      rtmpUrl: newDestUrl || 'rtmp://custom.destination.com/live',
      active: true
    };

    setClientDestinations(prev => [...prev, newDest]);
    setNewDestPlatform('');
    setNewDestKey('');
    setNewDestUrl('');
  };

  const handleToggleDestinationActive = (id: string) => {
    setClientDestinations(prev => prev.map(d => d.id === id ? { ...d, active: !d.active } : d));
  };

  const handleDeleteClientDestination = (id: string) => {
    setClientDestinations(prev => prev.filter(d => d.id !== id));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200" id="client-admin-dashboard">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-6">
        <div className="text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Radio className="text-blue-500" /> Painel do Cliente Final - Gestão de Transmissão
          </h1>
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            Consulte sua chave de ingestão atribuída para o OBS Studio e gerencie seus destinos de retransmissão para redes sociais.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className={`p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all text-gray-400 hover:text-white ${isRefreshing ? 'animate-spin' : ''}`}
            title="Atualizar dados do painel"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-[#4683E0] hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            Voltar ao Estúdio
          </button>
        </div>
      </div>

      {/* Client Navigation Tabs */}
      <div className="flex border-b border-slate-800 pb-px gap-1">
        {[
          { id: 'my-rtmp', label: 'Sua Chave de Ingestão OBS / Encoder', icon: Key },
          { id: 'destinations', label: 'Destinos para Redes Sociais (YouTube / Facebook / Twitch)', icon: Share2 },
          { id: 'stats', label: 'Estatísticas & Audiência', icon: Eye },
          { id: 'webhooks', label: 'Validador de Webhooks & Testes', icon: Radio }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setClientTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              clientTab === tab.id 
                ? 'border-blue-500 text-white bg-blue-500/5' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon size={15} className={clientTab === tab.id ? 'text-blue-400' : ''} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* CLIENT TAB 1: MY INGESTION STREAM KEY */}
      {clientTab === 'my-rtmp' && (
        <div className="bg-[#16191E] border border-slate-800 p-6 rounded-2xl text-left space-y-6 shadow-xl">
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock size={18} className="text-amber-400" /> Sua Chave de Ingestão Exclusiva PwStreamer
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Insira estas credenciais no seu OBS Studio, vMix ou encoder externo para enviar seu vídeo ao vivo diretamente para a infraestrutura do PwStreamer.
              </p>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black px-2.5 py-1 rounded-lg shrink-0">
              Isolado para: {user?.email || 'conta não identificada'}
            </span>
          </div>

          <div className="bg-[#0F1115] border border-slate-800 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">{primaryKey.label}</span>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-500/20">
                  {primaryKey.active ? 'Ativa no Server' : 'Suspensa'}
                </span>
                <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded border border-blue-500/20">
                  {primaryKey.maxBitrate}
                </span>
              </div>
            </div>

            <div className="space-y-4 font-mono">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Servidor RTMP Ingest (OBS URL)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={primaryKey.server}
                    className="flex-1 bg-[#16191E] border border-slate-800 rounded-lg px-3 py-2 text-xs text-blue-400 font-bold focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(primaryKey.server);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      copiedUrl ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {copiedUrl ? 'URL Copiada!' : 'Copiar URL'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Sua Chave de Stream Atribuída (Stream Key)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={primaryKey.key}
                    className="flex-1 bg-[#16191E] border border-slate-800 rounded-lg px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(primaryKey.key);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      copiedKey ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {copiedKey ? 'Chave Copiada!' : 'Copiar Chave'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                <span>Chave com acesso restrito e vinculada ao e-mail <strong>{user?.email}</strong></span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsObsModalOpen(true)}
                  className="px-3.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Key size={14} />
                  <span>Como Configurar o OBS</span>
                </button>

                <button
                  onClick={() => handleRegenerateKey(primaryKey.id)}
                  disabled={isRegenerating || !primaryKey.id}
                  className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RotateCw size={14} className={isRegenerating ? 'animate-spin' : ''} />
                  <span>{isRegenerating ? 'Regenerando...' : 'Regenerar Nova Chave RTMP'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLIENT TAB 2: OUTBOUND DESTINATIONS */}
      {clientTab === 'destinations' && (
        <div className="bg-[#16191E] border border-slate-800 p-6 rounded-2xl text-left space-y-6 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Share2 size={18} className="text-blue-500" /> Chaves RTMP dos Seus Canais (Redes Sociais)
            </h3>
            <p className="text-xs text-gray-400 mt-1">Adicione aqui as chaves RTMP que o YouTube, Facebook ou Twitch fornecem para você ao criar uma live nessas plataformas.</p>
          </div>

          {/* Add destination form */}
          <form onSubmit={handleAddClientDestination} className="bg-[#0F1115] border border-slate-800 p-4 rounded-xl space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">Conectar Novo Canal de Transmissão</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Plataforma</label>
                <select
                  value={newDestPlatform}
                  onChange={(e) => setNewDestPlatform(e.target.value)}
                  required
                  className="w-full bg-[#16191E] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecione...</option>
                  <option value="YouTube Live">YouTube Live</option>
                  <option value="Facebook Live">Facebook Live</option>
                  <option value="Twitch TV">Twitch TV</option>
                  <option value="Destino RTMP Customizado">Destino RTMP Customizado</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Chave de Transmissão Fornecida pelo Canal</label>
                <input
                  type="text"
                  required
                  value={newDestKey}
                  onChange={(e) => setNewDestKey(e.target.value)}
                  placeholder="Chave do YouTube/Facebook"
                  className="w-full bg-[#16191E] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">URL Server RTMP (Opcional)</label>
                <input
                  type="text"
                  value={newDestUrl}
                  onChange={(e) => setNewDestUrl(e.target.value)}
                  placeholder="rtmp://a.rtmp.youtube.com/live2"
                  className="w-full bg-[#16191E] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setIsRtmpConfigModalOpen(true)}
                className="px-5 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border border-purple-500/20"
              >
                Configurar via Assistente
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus size={14} /> Adicionar Canal ao Vivo
              </button>
            </div>
          </form>

          {/* Destinations list */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Canais Ativos para Suas Transmissões ({clientDestinations.length})</span>
            {clientDestinations.map(dest => (
              <div key={dest.id} className="p-4 bg-[#0F1115] border border-slate-800/80 rounded-xl flex items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <p className="text-xs font-bold text-white">{dest.platform}</p>
                  <p className="text-[11px] text-gray-400 font-mono">Server: {dest.rtmpUrl} • Chave: {dest.streamKey.substring(0, 10)}***</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleDestinationActive(dest.id)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border cursor-pointer ${
                      dest.active ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {dest.active ? 'Ativo na Live' : 'Pausado'}
                  </button>

                  <button
                    onClick={() => handleDeleteClientDestination(dest.id)}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg border border-red-500/20 transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CLIENT TAB 3: STATS & PERFORMANCE MONITOR */}
      {clientTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Espectadores Conectados', value: '1.240', desc: 'YouTube + Facebook simultâneos', color: 'text-blue-400' },
              { label: 'Comentários Recebidos', value: '482', desc: 'Interações no Chat Unificado', color: 'text-emerald-400' },
              { label: 'Qualidade da Ingestão', value: '1080p 60fps', desc: 'Bitrate estável em 8 Mbps', color: 'text-amber-400' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-[#16191E] border border-slate-800 p-6 rounded-2xl text-left shadow-lg">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-3xl font-black mt-2 ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.desc}</p>
              </div>
            ))}
          </div>

          <StudioPerformanceMonitor />
        </div>
      )}

      {/* CLIENT TAB 4: WEBHOOKS VALIDATOR & DISPATCHER */}
      {clientTab === 'webhooks' && (
        <div className="bg-[#16191E] border border-slate-800 p-6 rounded-2xl text-left space-y-6 shadow-xl">
          <WebhookPanel 
            userId={user?.email || ''}
            isLive={false}
          />
        </div>
      )}

      {/* OBS Integration Modal */}
      <OBSIntegrationModal
        isOpen={isObsModalOpen}
        onClose={() => setIsObsModalOpen(false)}
        rtmpUrl={primaryKey.server}
        streamKey={primaryKey.key}
      />

      {/* RTMP Config Modal */}
      <RTMPConfigModal
        isOpen={isRtmpConfigModalOpen}
        onClose={() => setIsRtmpConfigModalOpen(false)}
        onSave={(url, key) => {
          setNewDestPlatform('Destino RTMP Customizado');
          setNewDestUrl(url);
          setNewDestKey(key);
        }}
        initialUrl={newDestUrl}
        initialKey={newDestKey}
      />
    </div>
  );
}
