import React, { useState, useEffect } from 'react';
import { 
  Crown, Server, ShieldAlert, Activity, Users, Database, Globe, 
  Terminal, ShieldCheck, Cpu, HardDrive, RefreshCw, Key, 
  Plus, Trash2, Code, FileText, Ban, AlertTriangle, Copy, Check,
  ExternalLink, Lock, Eye, Settings, Video, Edit3, ArrowLeft,
  Search, Filter, CheckCircle2, XCircle, Unlock, RotateCw, History,
  BarChart3, Mail, Radio
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';
import { 
  subscribeAuditLogs, 
  addAuditLogToFirestore, 
  subscribeAllRtmpKeys, 
  saveRtmpKeyToFirestore, 
  deleteRtmpKeyFromFirestore, 
  regenerateRtmpKeyInFirestore,
  subscribeUserProfiles,
  gerarChaveDeTransmissao,
  AuditLogEntry,
  RtmpKeyEntry,
  PerfilDeCliente
} from '../lib/firestoreService';
import { getPlan, type PlanId } from '../lib/plans';
import { SuperAdminAnalytics } from './SuperAdminAnalytics';
import { StudioPerformanceMonitor } from './StudioPerformanceMonitor';
import { WebhookPanel } from './WebhookPanel';
import { useConfirm } from './ui/ConfirmDialog';
import { copyText } from './ui/clipboard';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { CabecalhoDePagina, Pagina } from './ui/Pagina';

interface SuperAdminPanelProps {
  onBack: () => void;
  user: { email: string; name: string; plan: string; role?: string } | null;
  allWebinars: Array<{ id: string; title: string; desc: string; time: string; type: string; channels: string[]; ownerId?: string }>;
  onDeleteWebinar?: (id: string) => void;
}

/** Linha da tabela de clientes: o perfil como está no banco, sem nada inventado. */
type ClientRow = PerfilDeCliente;

/** Situação da assinatura em palavra, a partir do que o perfil guarda. */
const situacaoDe = (c: ClientRow) =>
  c.isExpired || c.subscriptionStatus === 'expired' ? 'Expirado' : c.subscriptionStatus === 'active' ? 'Ativo' : 'Em teste';

export function SuperAdminPanel({ onBack, user, allWebinars, onDeleteWebinar }: SuperAdminPanelProps) {
  const confirm = useConfirm();
  // Só o papel do perfil abre o painel. O papel vem do banco, e as regras não
  // deixam ninguém se promover; o que o navegador decide aqui é só a tela.
  const isUnlocked = user?.role === 'super-admin';
  // Quem age é quem está logado: os registros assinam com o e-mail da sessão.
  const eu = user?.email ?? '';

  // Tabs for Super Admin
  const [activeTab, setActiveTab] = useState<'analytics' | 'clients' | 'webinars' | 'master-rtmp' | 'servers' | 'webhooks' | 'logs'>('analytics');

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Firestore Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Firestore Master Global RTMP Keys
  const [masterRtmpKeys, setMasterRtmpKeys] = useState<RtmpKeyEntry[]>([]);

  useEffect(() => {
    if (!isUnlocked) return;
    const unsubLogs = subscribeAuditLogs((logs) => {
      setAuditLogs(logs);
    });

    // Coleção vazia fica vazia. Antes, sem chaves, o painel gravava duas
    // chaves de exemplo no banco real, uma delas em nome de outra empresa.
    const unsubKeys = subscribeAllRtmpKeys(setMasterRtmpKeys);

    return () => {
      unsubLogs();
      unsubKeys();
    };
  }, [isUnlocked]);

  // Clientes de verdade, lidos dos perfis. Era uma lista fixa de empresas
  // inventadas, com ações que só mudavam a tela e ainda gravavam na auditoria
  // uma troca de plano que não tinha acontecido.
  const [clients, setClients] = useState<ClientRow[]>([]);
  // A lista vazia só diz "nenhum perfil" quando o banco respondeu que não há
  const [estadoDosClientes, setEstadoDosClientes] = useState<'carregando' | 'ok' | 'sem-conexao' | 'sem-permissao'>('carregando');
  useEffect(() => {
    if (!isUnlocked) return;
    return subscribeUserProfiles(
      (perfis, doCache) => {
        setClients(perfis);
        setEstadoDosClientes(doCache && perfis.length === 0 ? 'sem-conexao' : 'ok');
      },
      () => setEstadoDosClientes('sem-permissao'),
    );
  }, [isUnlocked]);

  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeyClientEmail, setNewKeyClientEmail] = useState('');
  const [newKeyBitrate, setNewKeyBitrate] = useState('8000 kbps');

  // Server Bandwidth Usage Data
  const bandwidthData = [
    { hour: '00:00', ingress: 120, egress: 850 },
    { hour: '04:00', ingress: 80, egress: 540 },
    { hour: '08:00', ingress: 150, egress: 1200 },
    { hour: '12:00', ingress: 310, egress: 2800 },
    { hour: '16:00', ingress: 450, egress: 4300 },
    { hour: '20:00', ingress: 580, egress: 5900 },
    { hour: '24:00', ingress: 200, egress: 1800 }
  ];

  const externalAdminUrl = `${window.location.origin}/admin`;

  const handleCopyExternalLink = () => {
    copyText(externalAdminUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleGenerateMasterKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyLabel.trim() || !newKeyClientEmail.trim()) return;

    const newKey: RtmpKeyEntry = {
      id: `key-${Date.now()}`,
      label: newKeyLabel,
      clientEmail: newKeyClientEmail,
      key: gerarChaveDeTransmissao(),
      server: 'rtmp://stream.pwstreamer.com/live',
      maxBitrate: newKeyBitrate,
      active: true,
      createdAt: new Date().toISOString().split('T')[0]
    };

    await saveRtmpKeyToFirestore(newKey, eu);
    setNewKeyLabel('');
    setNewKeyClientEmail('');
  };

  const handleRegenerateClientKey = async (key: RtmpKeyEntry) => {
    if (!(await confirm({ title: 'Regenerar a chave deste cliente?', description: `A chave atual de ${key.clientEmail} para de funcionar imediatamente.`, confirmLabel: 'Regenerar', destructive: true }))) return;
    await regenerateRtmpKeyInFirestore(
      key.id, 
      key.clientEmail, 
      eu, 
      key.label
    );
  };

  const handleToggleKeyActive = async (key: RtmpKeyEntry) => {
    const updated = { ...key, active: !key.active };
    await saveRtmpKeyToFirestore(updated);
    await addAuditLogToFirestore({
      action: 'TOGGLE_CLIENT_STATUS',
      actorEmail: eu,
      targetEmail: key.clientEmail,
      details: `Chave RTMP '${key.label}' (${key.clientEmail}) ${updated.active ? 'ativada' : 'suspensa'} no servidor`
    });
  };

  const handleDeleteMasterKey = async (key: RtmpKeyEntry) => {
    if (!(await confirm({ title: 'Revogar esta chave?', description: `A chave '${key.label}' é apagada permanentemente e não pode ser recuperada.`, confirmLabel: 'Revogar', destructive: true }))) return;
    await deleteRtmpKeyFromFirestore(key.id, eu, key.clientEmail, key.label);
  };

  const handleDeleteWebinarAdmin = async (webinarId: string, webinarTitle: string) => {
    if (!(await confirm({ title: 'Excluir este webinar?', description: `'${webinarTitle}' e seus dados de inscrição são apagados permanentemente.`, confirmLabel: 'Excluir', destructive: true }))) return;
    if (onDeleteWebinar) {
      onDeleteWebinar(webinarId);
    }
    await addAuditLogToFirestore({
      action: 'DELETE_WEBINAR',
      actorEmail: eu,
      details: `Excluído webinar '${webinarTitle}' (ID: ${webinarId}) via Painel Mestre Super Admin`
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sem o papel de admin, o painel não existe para a pessoa: sem formulário
  // e sem senha. Era uma tela de "senha master" com as senhas no próprio
  // código — e um e-mail que destravava sem senha nenhuma.
  if (!isUnlocked) {
    return (
      <Pagina>
        <CabecalhoDePagina titulo="Acesso restrito" descricao="Esta área é só para a administração da plataforma." />
        <AcaoDeTexto onClick={onBack}>Voltar ao painel</AcaoDeTexto>
      </Pagina>
    );
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200" id="super-admin-dashboard">
      
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-amber-950/80 via-[var(--surface)] to-blue-950/80 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3 text-left">
          <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 shrink-0">
            <Crown size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[var(--ink-hi)]">ÁREA EXCLUSIVA - ADMIN PRINCIPAL (MASTER)</span>
              <span className="bg-amber-500/20 text-amber-400 text-[9px] font-black px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                Acesso Externo /admin
              </span>
            </div>
            <p className="text-[11px] text-[var(--ink)] font-mono mt-0.5 select-all">
              {externalAdminUrl}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={handleCopyExternalLink}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              copiedLink
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-[var(--panel)] hover:bg-[var(--raise)] border-[var(--line-ctl)] text-[var(--ink-hi)]'
            }`}
          >
            {copiedLink ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link /admin'}</span>
          </button>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--line)] pb-6">
        <div className="text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink-hi)] flex items-center gap-2.5">
            <Crown className="text-amber-400" /> Painel de Controle Mestre - Admin Principal
          </h1>
          <p className="text-xs text-[var(--ink-lo)] mt-1.5 leading-relaxed">
            Gerenciamento centralizado de todos os clientes, transmissões de webinars, atribuição de chaves RTMP master e telemetria de servidores de mídia.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className={`p-2.5 bg-[var(--surface)] border border-[var(--line)] rounded-xl hover:bg-[var(--panel)] transition-all text-[var(--ink-lo)] hover:text-[var(--ink-hi)] ${isRefreshing ? 'animate-spin' : ''}`}
            title="Atualizar dados do servidor"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Voltar ao Estúdio
          </button>
        </div>
      </div>

      {/* Infrastructure KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Clientes Ativos',
            value: estadoDosClientes === 'ok' ? clients.filter(c => situacaoDe(c) !== 'Expirado').length.toString() : '—',
            desc: estadoDosClientes === 'ok' ? 'Total cadastrados: ' + clients.length : 'Lista indisponível agora',
            color: 'text-amber-400',
            icon: Users
          },
          { label: 'Transmissões / Webinars', value: allWebinars.length.toString(), desc: 'Agendadas e ao vivo', color: 'text-blue-400', icon: Video },
          { label: 'Chaves RTMP Master', value: masterRtmpKeys.length.toString(), desc: masterRtmpKeys.filter(k => k.active).length + ' Ativas no Ingest', color: 'text-emerald-400', icon: Key },
          { label: 'Status da Rede Ingest', value: '100% Online', desc: 'MediaMTX / Nginx RTMP', color: 'text-indigo-400', icon: Server }
        ].map((met, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--line)] p-5 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="text-left">
              <p className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">{met.label}</p>
              <p className={`text-2xl font-black mt-1 ${met.color}`}>{met.value}</p>
              <p className="text-[10px] text-[var(--ink-dim)] mt-1">{met.desc}</p>
            </div>
            <div className="w-10 h-10 bg-[var(--bg)] rounded-xl flex items-center justify-center border border-[var(--line)] text-[var(--ink-lo)]">
              <met.icon size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-[var(--line)] pb-px gap-1 overflow-x-auto">
        {[
          { id: 'analytics', label: 'Uso da Plataforma & Quotas', icon: BarChart3 },
          { id: 'clients', label: 'Lista de Clientes Final', icon: Users },
          { id: 'webinars', label: 'Todos os Webinars & Transmissões', icon: Video },
          { id: 'master-rtmp', label: 'Gerenciador Global de Chaves RTMP', icon: Key },
          { id: 'servers', label: 'Monitor de Servidores', icon: Server },
          { id: 'webhooks', label: 'Disparador & Webhooks API', icon: Radio },
          { id: 'logs', label: 'Audit Logs & API', icon: Terminal }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
              activeTab === tab.id 
                ? 'border-amber-500 text-[var(--ink-hi)] bg-amber-500/5' 
                : 'border-transparent text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
            }`}
          >
            <tab.icon size={15} className={activeTab === tab.id ? 'text-amber-400' : ''} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 0: ANALYTICS & USAGE */}
      {activeTab === 'analytics' && (
        <SuperAdminAnalytics allWebinarsCount={allWebinars.length} />
      )}

      {/* TAB 1: CLIENTS MANAGEMENT */}
      {activeTab === 'clients' && (
        <div className="bg-[var(--surface)] border border-[var(--line)] p-6 rounded-2xl text-left space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-[var(--ink-hi)] flex items-center gap-2">
                <Users size={18} className="text-amber-400" /> Gerenciamento Completo de Clientes
              </h3>
              <p className="text-xs text-[var(--ink-lo)] mt-1">Todos os perfis cadastrados, com plano e situação da assinatura. Mudar plano ou suspender um cliente ainda não é feito por aqui.</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-3 text-[var(--ink-dim)]" />
              <input aria-label="Buscar clientes"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por cliente ou email..."
                className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-[var(--line)] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg)] text-[var(--ink-lo)] font-bold uppercase text-[10px] border-b border-[var(--line)]">
                <tr>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">E-mail</th>
                  <th className="p-3.5">Plano</th>
                  <th className="p-3.5">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]/60 text-[var(--ink)]">
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-3.5 text-[var(--ink-lo)]">
                      {estadoDosClientes === 'carregando'
                        ? "Carregando os perfis…"
                        : estadoDosClientes === 'sem-permissao'
                          ? "Não foi possível ler os perfis. As regras do banco só liberam esta lista para o admin."
                          : estadoDosClientes === 'sem-conexao'
                            ? "Sem conexão com o banco agora. A lista aparece quando ele voltar."
                            : searchQuery
                              ? "Nenhum cliente com esse nome ou e-mail."
                              : "Nenhum perfil cadastrado ainda."}
                    </td>
                  </tr>
                )}
                {filteredClients.map(client => (
                  <tr key={client.uid} className="hover:bg-[var(--panel)]/30 transition-colors">
                    <td className="p-3.5 font-semibold text-[var(--ink-hi)]">
                      {client.name || client.email}
                      {client.role === 'super-admin' && <span className="ml-2 font-normal text-[var(--ink-lo)]">· admin</span>}
                    </td>
                    <td className="p-3.5 text-[var(--ink-lo)]">{client.email}</td>
                    <td className="p-3.5">{getPlan(client.plan as PlanId)?.name ?? client.plan}</td>
                    <td className="p-3.5">{situacaoDe(client)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: WEBINARS MANAGEMENT */}
      {activeTab === 'webinars' && (
        <div className="bg-[var(--surface)] border border-[var(--line)] p-6 rounded-2xl text-left space-y-6">
          <div>
            <h3 className="text-base font-bold text-[var(--ink-hi)] flex items-center gap-2">
              <Video size={18} className="text-blue-400" /> Todas as Transmissões & Webinars do Sistema ({allWebinars.length})
            </h3>
            <p className="text-xs text-[var(--ink-lo)] mt-1">Visão geral e moderação global de todos os eventos criados pelos clientes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allWebinars.map(webinar => (
              <div key={webinar.id} className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--ink-hi)]">{webinar.title}</h4>
                    <p className="text-xs text-[var(--ink-lo)] mt-0.5">{webinar.desc}</p>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                    webinar.type === 'live' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {webinar.type}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]/80 text-[11px] text-[var(--ink-lo)]">
                  <span>Canais: <strong className="text-[var(--ink)]">{webinar.channels?.join(', ') || 'Sem canais'}</strong></span>
                  <span>{webinar.time}</span>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleDeleteWebinarAdmin(webinar.id, webinar.title)}
                    className="px-3 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} /> Excluir Evento (Com Audit Log)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL MASTER RTMP KEYS */}
      {activeTab === 'master-rtmp' && (
        <div className="bg-[var(--surface)] border border-[var(--line)] p-6 rounded-2xl text-left space-y-6">
          <div>
            <h3 className="text-base font-bold text-[var(--ink-hi)] flex items-center gap-2">
              <Key size={18} className="text-amber-400" /> Controle Global de Chaves RTMP Master (Ingestão)
            </h3>
            <p className="text-xs text-[var(--ink-lo)] mt-1">
              Como Admin Principal, você é o único com permissão para provisionar e alterar as chaves RTMP que os clientes usam para conectar seus encoders externos (OBS Studio/vMix) ao servidor PwStreamer.
            </p>
          </div>

          {/* Form to provision new key */}
          <form onSubmit={handleGenerateMasterKey} className="bg-[var(--bg)] border border-[var(--line)] p-5 rounded-xl space-y-3">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">Provisionar Nova Chave Master para Cliente</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="superadminpanel-identificador-rotulo" className="text-[10px] text-[var(--ink-lo)] font-bold uppercase block mb-1">Identificador / Rótulo</label>
                <input id="superadminpanel-identificador-rotulo"
                  type="text"
                  required
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  placeholder="Ex: Câmera Principal Estúdio A"
                  className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label htmlFor="superadminpanel-e-mail-do-cliente-atribuido" className="text-[10px] text-[var(--ink-lo)] font-bold uppercase block mb-1">E-mail do Cliente Atribuído</label>
                <input autoComplete="off" id="superadminpanel-e-mail-do-cliente-atribuido"
                  type="email"
                  required
                  value={newKeyClientEmail}
                  onChange={(e) => setNewKeyClientEmail(e.target.value)}
                  placeholder="cliente@empresa.com"
                  className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label htmlFor="superadminpanel-limite-de-bitrate-maximo" className="text-[10px] text-[var(--ink-lo)] font-bold uppercase block mb-1">Limite de Bitrate Máximo</label>
                <select id="superadminpanel-limite-de-bitrate-maximo"
                  value={newKeyBitrate}
                  onChange={(e) => setNewKeyBitrate(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-amber-500"
                >
                  <option value="4000 kbps">4000 kbps (HD 720p)</option>
                  <option value="6000 kbps">6000 kbps (Full HD 1080p)</option>
                  <option value="8000 kbps">8000 kbps (Full HD High Quality)</option>
                  <option value="12000 kbps">12000 kbps (4K Ultra HD)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-[var(--color-n-6)] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Gerar e Atribuir Chave Master
              </button>
            </div>
          </form>

          {/* Master Keys list */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-[var(--ink-lo)] uppercase tracking-wider block">Chaves de Ingestão Ativas no Servidor MediaMTX ({masterRtmpKeys.length})</span>
            {masterRtmpKeys.map(key => (
              <div key={key.id} className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--ink-hi)]">{key.label}</span>
                    <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[9px] font-black px-2 py-0.5 rounded">
                      {key.clientEmail}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--ink-lo)] font-mono">
                    <span>Server URL: <strong className="text-[var(--ink)] select-all">{key.server}</strong></span>
                    <span>|</span>
                    <span>Chave Ingest: <strong className="text-amber-400 select-all">{key.key}</strong></span>
                    <span>|</span>
                    <span>Bitrate: <strong className="text-emerald-400">{key.maxBitrate}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRegenerateClientKey(key)}
                    className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                    title="Regenerar nova chave para este cliente"
                  >
                    <RotateCw size={12} /> Regenerar
                  </button>

                  <button
                    onClick={() => handleToggleKeyActive(key)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border cursor-pointer ${
                      key.active 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}
                  >
                    {key.active ? 'Ativa no Ingest' : 'Suspensa'}
                  </button>

                  <button
                    onClick={() => handleDeleteMasterKey(key)}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg border border-red-500/20 transition-all cursor-pointer"
                    title="Revogar chave permanentemente"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SERVERS & INFRASTRUCTURE */}
      {activeTab === 'servers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--line)] p-6 rounded-2xl text-left space-y-4">
              <h3 className="text-base font-bold text-[var(--ink-hi)] flex items-center gap-2">
                <Activity size={18} className="text-blue-500" /> Tráfego de Banda do Servidor Principal
              </h3>

              <div className="h-64 text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bandwidthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEgressSuper" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis dataKey="hour" stroke="var(--chart-axis)" />
                    <YAxis stroke="var(--chart-axis)" unit=" Mbps" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--line)' }} />
                    <Area type="monotone" dataKey="egress" name="Saída Mídia (Mbps)" stroke="var(--chart-1)" fillOpacity={1} fill="url(#colorEgressSuper)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--line)] p-6 rounded-2xl text-left space-y-4">
              <h3 className="text-base font-bold text-[var(--ink-hi)] flex items-center gap-2">
                <Globe size={18} className="text-blue-500" /> Cluster de Ingestão MediaMTX
              </h3>
              
              <div className="space-y-3 text-xs">
                {[
                  { name: 'Gateway Frankfurt', status: 'Online', latency: '12ms' },
                  { name: 'Gateway São Paulo', status: 'Online', latency: '24ms' },
                  { name: 'CDN Edge Anycast', status: 'Online', latency: '15ms' }
                ].map((s, i) => (
                  <div key={i} className="p-3 bg-[var(--bg)] border border-[var(--line)] rounded-xl flex justify-between items-center">
                    <span className="font-bold text-[var(--ink-hi)]">{s.name}</span>
                    <span className="text-emerald-400 font-bold">{s.status} ({s.latency})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <StudioPerformanceMonitor />
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-[var(--surface)] border border-[var(--line)] p-6 rounded-2xl text-left space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--ink-hi)] flex items-center gap-2">
                <Terminal size={18} className="text-amber-400" /> Logs de Auditoria do Servidor Principal (Firestore)
              </h3>
              <p className="text-xs text-[var(--ink-lo)] mt-1">
                Registro imutável em tempo real de ações administrativas críticas (exclusão de webinars, regeneração de chaves RTMP, trocas de plano e acessos do Super Admin).
              </p>
            </div>
            <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-black px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1.5">
              <History size={12} /> {auditLogs.length} Registros de Segurança
            </span>
          </div>

          <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-4 font-mono text-[11px] leading-relaxed text-[var(--ink)] space-y-2.5 max-h-96 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-[var(--ink-dim)] py-4 text-center italic">Nenhum evento crítico registrado no Firestore até o momento.</p>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} className="p-3 bg-[var(--surface)] border border-[var(--line)]/80 rounded-lg space-y-1.5 hover:border-[var(--line-ctl)] transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                        log.action === 'DELETE_WEBINAR' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        log.action === 'REGENERATE_RTMP_KEY' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        log.action === 'CHANGE_PLAN' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        log.action === 'SUPER_ADMIN_LOGIN' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-[var(--ink-hi)] font-bold text-xs">{log.actorEmail}</span>
                      {log.targetEmail && (
                        <span className="text-[var(--ink-lo)] text-[10px]">➜ {log.targetEmail}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--ink-dim)] font-sans">{log.timestamp}</span>
                  </div>
                  <p className="text-xs text-[var(--ink)] pl-1 border-l-2 border-amber-500/50">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: WEBHOOKS DISPATCHER & EVENTSUB */}
      {activeTab === 'webhooks' && (
        <div className="bg-[var(--surface)] border border-[var(--line)] p-6 rounded-2xl text-left space-y-6">
          <WebhookPanel 
            userId={user?.email || 'admin@pwstreamer.com'}
            isLive={false}
            onSaveToFirestore={async (logItem) => {
              await addAuditLogToFirestore({
                action: 'WEBHOOK_MANUAL_TEST' as any,
                actorEmail: user?.email || 'admin@pwstreamer.com',
                details: `Webhook de teste [${logItem.platform.toUpperCase()} - ${logItem.eventType}] disparado. Status: ${logItem.status} (${logItem.latencyMs}ms)`
              });
            }}
          />
        </div>
      )}

    </main>
  );
}
