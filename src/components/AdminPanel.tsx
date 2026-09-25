import React, { useState, useEffect } from 'react';
import { useTabs } from './ui/Tabs';
import { 
  Key, Plus, Trash2, Copy, Check,
  Crown, Share2, Eye, ShieldCheck, Lock, RefreshCw, Radio, RotateCw, Activity
} from 'lucide-react';
import { 
  subscribeClientRtmpKeys, 
  RtmpKeyEntry 
} from '../lib/firestoreService';
import { apiFetch } from '../lib/apiFetch';
import { OBSIntegrationModal } from "./OBSIntegrationModal";
import { RTMPConfigModal } from "./RTMPConfigModal";
import { StudioPerformanceMonitor } from './StudioPerformanceMonitor';
import { WebhookPanel } from './WebhookPanel';
import { useConfirm } from './ui/ConfirmDialog';
import { copyText } from './ui/clipboard';
import { useToast } from './ui/Toast';

interface AdminPanelProps {
  onBack: () => void;
  user: { email: string; name: string; plan: string } | null;
  onNavigateSuperAdmin?: () => void;
}

export function AdminPanel({ onBack, user, onNavigateSuperAdmin }: AdminPanelProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [clientTab, setClientTab] = useState<'my-rtmp' | 'destinations' | 'stats' | 'webhooks'>('my-rtmp');
  const clienteAbas = useTabs('cliente', ['my-rtmp', 'destinations', 'stats', 'webhooks'] as const, clientTab, setClientTab);
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

  // Enquanto a chave não chega do banco, não há chave: a de antes era
  // inventada ("…_881023a") e dava para copiar para o OBS.
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
    if (!(await confirm({
      title: 'Regenerar a chave de transmissão?',
      description: 'A chave atual para de funcionar imediatamente. Você precisará atualizar o OBS Studio, vMix ou o encoder que estiver usando.',
      confirmLabel: 'Regenerar',
      destructive: true
    }))) {
      return;
    }
    setIsRegenerating(true);
    try {
      // A chave é trocada pelo servidor: as regras do banco não deixam o
      // cliente gravar em rtmpKeys.
      const response = await apiFetch(`/api/rtmp/keys/${encodeURIComponent(keyId)}/regenerate`, { method: 'POST' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.key) throw new Error(result.error || 'Não foi possível regenerar a chave.');
      setClientRtmpKeys((keys) => keys.map((key) => key.id === keyId ? { ...key, key: result.key, createdAt: result.createdAt } : key));
    } catch (err) {
      toast.error('A chave não foi trocada', err instanceof Error ? err.message : 'Tente de novo em instantes.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Client Outbound Destinations (YouTube, Facebook, Twitch, custom RTMP)
  // Nascia com TRÊS canais semeados — chaves inventadas, dois marcados "Ativo
  // na Live" — sob o título "Canais Ativos para Suas Transmissões (3)", na
  // conta de um cliente que nunca conectou nada. Quem confiasse na tela
  // entraria ao vivo achando que transmitia para YouTube e Facebook.
  // Começa vazio. O vazio tem desenho próprio logo abaixo.
  const [clientDestinations, setClientDestinations] = useState<Array<{
    id: string; platform: string; streamKey: string; rtmpUrl: string; active: boolean;
  }>>([]);

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
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200" id="client-admin-dashboard">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--line)] pb-6">
        <div className="text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink-hi)] flex items-center gap-2.5">
            <Radio className="text-blue-500" /> Painel do Cliente Final - Gestão de Transmissão
          </h1>
          <p className="text-xs text-[var(--ink-lo)] mt-1.5 leading-relaxed">
            Consulte sua chave de ingestão atribuída para o OBS Studio e gerencie seus destinos de retransmissão para redes sociais.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className={`p-2.5 bg-[var(--surface)] border border-[var(--line)] rounded-xl hover:bg-[var(--panel)] transition-all text-[var(--ink-lo)] hover:text-[var(--ink-hi)] ${isRefreshing ? 'animate-spin' : ''}`}
            title="Atualizar dados do painel"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-[var(--color-brand-deep)] hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            Voltar ao Estúdio
          </button>
        </div>
      </div>

      {/* Client Navigation Tabs
          Não tinha guarda de transbordo, e os botões não tinham nowrap: com
          rótulos como "Destinos para Redes Sociais (YouTube / Facebook /
          Twitch)", o flex espremia cada aba e o texto quebrava em várias
          linhas — a faixa chegava a 90px de altura. A irmã em
          BillingDashboard já rolava na horizontal; esta agora faz o mesmo. */}
      <div {...clienteAbas.tablist} aria-label="Painel do cliente" className="flex border-b border-[var(--line)] pb-px gap-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'my-rtmp', label: 'Sua Chave de Ingestão OBS / Encoder', icon: Key },
          { id: 'destinations', label: 'Destinos para Redes Sociais (YouTube / Facebook / Twitch)', icon: Share2 },
          { id: 'stats', label: 'Estatísticas & Audiência', icon: Eye },
          { id: 'webhooks', label: 'Validador de Webhooks & Testes', icon: Radio }
        ].map(tab => (
          <button
            key={tab.id}
            {...clienteAbas.tab(tab.id as typeof clientTab)}
            onClick={() => setClientTab(tab.id as typeof clientTab)}
            className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              clientTab === tab.id 
                ? 'border-blue-500 text-[var(--ink-hi)] bg-blue-500/5' 
                : 'border-transparent text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
            }`}
          >
            <tab.icon size={15} className={clientTab === tab.id ? 'text-blue-400' : ''} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* CLIENT TAB 1: MY INGESTION STREAM KEY */}
      {clientTab === 'my-rtmp' && (
        <div {...clienteAbas.panel('my-rtmp')} className="bg-[var(--surface)] border border-[var(--line)] p-6 rounded-2xl text-left space-y-6 shadow-xl">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--ink-hi)] flex items-center gap-2">
                <Lock size={18} className="text-amber-400" /> Sua Chave de Ingestão Exclusiva PwStreamer
              </h3>
              <p className="text-xs text-[var(--ink-lo)] mt-1">
                Insira estas credenciais no seu OBS Studio, vMix ou encoder externo para enviar seu vídeo ao vivo diretamente para a infraestrutura do PwStreamer.
              </p>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black px-2.5 py-1 rounded-lg shrink-0">
              Isolado para: {user?.email || 'conta não identificada'}
            </span>
          </div>

          <div className="bg-[var(--bg)] border border-[var(--line)] p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--ink-hi)] uppercase tracking-wider">{primaryKey.label}</span>
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
                <label htmlFor="adminpanel-servidor-rtmp-ingest-obs-url" className="text-[10px] text-[var(--ink-lo)] font-bold uppercase block mb-1">Servidor RTMP Ingest (OBS URL)</label>
                <div className="flex gap-2">
                  <input id="adminpanel-servidor-rtmp-ingest-obs-url"
                    type="text"
                    readOnly
                    value={primaryKey.server}
                    className="flex-1 bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-blue-400 font-bold focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      copyText(primaryKey.server);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      copiedUrl ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-[var(--panel)] hover:bg-[var(--raise)] text-[var(--ink-hi)]'
                    }`}
                  >
                    {copiedUrl ? 'URL Copiada!' : 'Copiar URL'}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="adminpanel-sua-chave-de-stream-atribuida-stre" className="text-[10px] text-[var(--ink-lo)] font-bold uppercase block mb-1">Sua Chave de Stream Atribuída (Stream Key)</label>
                <div className="flex gap-2">
                  <input id="adminpanel-sua-chave-de-stream-atribuida-stre"
                    type="text"
                    readOnly
                    value={primaryKey.key}
                    placeholder="Carregando sua chave…"
                    className="flex-1 bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none"
                  />
                  <button
                    disabled={!primaryKey.key}
                    onClick={() => {
                      copyText(primaryKey.key);
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

            {/* Vira linha em `sm`, e entre 640 e ~860px o texto com o e-mail
                mais os dois botões não cabiam: o grupo não quebrava e o texto
                não encolhia, então "Regenerar Nova Chave RTMP" empurrava a
                página 62px para fora da tela. `min-w-0` deixa o texto ceder,
                `flex-wrap` deixa os botões descerem. */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[var(--line)]/80">
              <div className="flex items-center gap-2 text-[11px] text-[var(--ink-lo)] min-w-0">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                <span className="min-w-0 break-words">Chave com acesso restrito e vinculada ao e-mail <strong className="break-all">{user?.email}</strong></span>
              </div>
              <div className="flex flex-wrap justify-center sm:justify-end gap-2">
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
        <div {...clienteAbas.panel('destinations')} className="bg-[var(--surface)] border border-[var(--line)] p-6 rounded-2xl text-left space-y-6 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-[var(--ink-hi)] flex items-center gap-2">
              <Share2 size={18} className="text-blue-500" /> Chaves RTMP dos Seus Canais (Redes Sociais)
            </h3>
            <p className="text-xs text-[var(--ink-lo)] mt-1">Adicione aqui as chaves RTMP que o YouTube, Facebook ou Twitch fornecem para você ao criar uma live nessas plataformas.</p>
          </div>

          {/* Add destination form */}
          <form onSubmit={handleAddClientDestination} className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-3">
            <span className="text-xs font-bold text-[var(--ink-hi)] uppercase tracking-wider block">Conectar Novo Canal de Transmissão</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="adminpanel-plataforma" className="text-[10px] text-[var(--ink-lo)] font-bold uppercase block mb-1">Plataforma</label>
                <select id="adminpanel-plataforma"
                  value={newDestPlatform}
                  onChange={(e) => setNewDestPlatform(e.target.value)}
                  required
                  className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecione...</option>
                  <option value="YouTube Live">YouTube Live</option>
                  <option value="Facebook Live">Facebook Live</option>
                  <option value="Twitch TV">Twitch TV</option>
                  <option value="Destino RTMP Customizado">Destino RTMP Customizado</option>
                </select>
              </div>

              <div>
                <label htmlFor="adminpanel-chave-de-transmissao-fornecida-pel" className="text-[10px] text-[var(--ink-lo)] font-bold uppercase block mb-1">Chave de Transmissão Fornecida pelo Canal</label>
                <input id="adminpanel-chave-de-transmissao-fornecida-pel"
                  type="text"
                  required
                  value={newDestKey}
                  onChange={(e) => setNewDestKey(e.target.value)}
                  placeholder="Chave do YouTube/Facebook"
                  className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="adminpanel-url-server-rtmp-opcional" className="text-[10px] text-[var(--ink-lo)] font-bold uppercase block mb-1">URL Server RTMP (Opcional)</label>
                <input id="adminpanel-url-server-rtmp-opcional"
                  type="text"
                  value={newDestUrl}
                  onChange={(e) => setNewDestUrl(e.target.value)}
                  placeholder="rtmp://a.rtmp.youtube.com/live2"
                  className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 font-mono"
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
            <span className="text-xs font-bold text-[var(--ink-lo)] uppercase tracking-wider block">Canais Ativos para Suas Transmissões ({clientDestinations.length})</span>
            {clientDestinations.map(dest => (
              <div key={dest.id} className="p-4 bg-[var(--bg)] border border-[var(--line)]/80 rounded-xl flex items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <p className="text-xs font-bold text-[var(--ink-hi)]">{dest.platform}</p>
                  <p className="text-[11px] text-[var(--ink-lo)] font-mono">Server: {dest.rtmpUrl} • Chave: {dest.streamKey.substring(0, 10)}***</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleDestinationActive(dest.id)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border cursor-pointer ${
                      dest.active ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[var(--panel)] text-[var(--ink-dim)]'
                    }`}
                  >
                    {dest.active ? 'Ativo na Live' : 'Pausado'}
                  </button>

                  <button aria-label={`Excluir destino ${dest.platform}`}
                    onClick={() => handleDeleteClientDestination(dest.id)}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg border border-red-500/20 transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {/* O vazio precisava existir: sem ele, tirar a semente deixaria um
                título seguido de nada, e "nenhum canal" viraria indistinguível
                de "a tela quebrou". */}
            {clientDestinations.length === 0 && (
              <div className="p-6 bg-[var(--bg)] border border-dashed border-[var(--line-ctl)] rounded-xl text-center space-y-1">
                <p className="text-xs font-semibold text-[var(--ink)]">Nenhum canal conectado ainda</p>
                <p className="text-[11px] text-[var(--ink-lo)]">
                  Adicione um destino acima para transmitir para YouTube, Facebook, Twitch ou um servidor RTMP próprio.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CLIENT TAB 3: STATS & PERFORMANCE MONITOR */}
      {clientTab === 'stats' && (
        <div {...clienteAbas.panel('stats')} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Eram três literais — '1.240' espectadores, '482' comentários,
                '1080p 60fps' de ingestão — renderizados com o desenho de um
                KPI medido, na conta de todo cliente. É a recidiva do mesmo
                defeito que a Fase 5 tirou do painel: a correção foi aplicada
                lá e não generalizou para cá.
                Os três dependem de telemetria do servidor de ingestão, que
                ainda não existe. Regra do sistema: valor ausente é travessão,
                nunca um número plausível. */}
            {[
              { label: 'Espectadores Conectados', desc: 'Aguardando telemetria do servidor de ingestão' },
              { label: 'Comentários Recebidos', desc: 'Aguardando telemetria do chat unificado' },
              { label: 'Qualidade da Ingestão', desc: 'Aguardando telemetria do servidor de ingestão' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-[var(--surface)] border border-[var(--line)] p-6 rounded-2xl text-left shadow-lg">
                <p className="text-[10px] font-bold text-[var(--ink-dim)] uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-black mt-2 text-[var(--ink-lo)] tabular-nums">—</p>
                <p className="text-xs text-[var(--ink-lo)] mt-1">{stat.desc}</p>
              </div>
            ))}
          </div>

          <StudioPerformanceMonitor />
        </div>
      )}

      {/* CLIENT TAB 4: WEBHOOKS VALIDATOR & DISPATCHER */}
      {clientTab === 'webhooks' && (
        <div {...clienteAbas.panel('webhooks')} className="bg-[var(--surface)] border border-[var(--line)] p-6 rounded-2xl text-left space-y-6 shadow-xl">
          <WebhookPanel 
            userId={user?.email ?? ''}
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
    </main>
  );
}
