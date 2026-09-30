import { AcaoDeTexto } from './components/ui/AcaoDeTexto';
import { BotaoDeIcone } from './components/ui/BotaoDeIcone';
import { apiFetch } from './lib/apiFetch';
import { useState, useEffect } from 'react';
import { AppHeader, type VisaoDoApp } from './components/AppHeader';
import { Dashboard } from './components/Dashboard';
import { CanaisPagina } from './components/CanaisPagina';
import { WebinarsPagina } from './components/WebinarsPagina';
import { CriarWebinarModal } from './components/CriarWebinarModal';
import { rotuloDoHorario } from './lib/horario';
import { ConfiguracoesPagina } from './components/ConfiguracoesPagina';
import { Estudio } from './components/Estudio';
import { AuthAndPricing } from './components/AuthAndPricing';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { PlansModal } from './components/PlansModal';
import { PlanoPagina } from './components/PlanoPagina';
import { CadastroPagina } from './components/CadastroPagina';
import { AddChannelsModal } from './components/AddChannelsModal';
import { MidiaDoEstudioProvider } from './context/MidiaDoEstudio';

import { Destination, Comment } from './types';
import { INITIAL_DESTINATIONS, INITIAL_COMMENTS } from './data';
import { CircleAlert, X } from 'lucide-react';
import { LegalModal } from './components/LegalModals';
import { useToast } from './components/ui/Toast';
import { limiteDeCanaisLigados } from './lib/plans';
import { cabeLigado } from './lib/canais';
import { COR_PADRAO } from './lib/graficos';
import {
  logoutFirebase,
  subscribeAuth,
  subscribeWebinars,
  agendarWebinar,
  deleteWebinarFromFirestore,
  subscribeTransmissionSettings,
  saveTransmissionSettingsToFirestore,
  saveDestinationsToFirestore,
  subscribeQuotaStatus,
  FIRESTORE_UPGRADE_URL
} from './lib/firestoreService';

export default function App() {
  // User state
  const [user, setUser] = useState<{
    uid?: string;
    email: string;
    name: string;
    plan: 'Standard' | 'Professional' | 'Business' | 'Free Trial';
    isExpired: boolean;
    trialDays: number;
    // `role` vem do perfil gravado no login e já era lido por SuperAdminPanel,
    // mas faltava neste tipo — então o campo existia em tempo de execução e
    // era invisível para quem lê o código.
    role?: 'super-admin' | 'client';
    subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';
    trialEndsAt?: string;
  } | null>(null);

  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [isAddChannelsModalOpen, setIsAddChannelsModalOpen] = useState(false);
  // Plataforma em que o modal de canais abre direto (o "conserta num clique").
  const [plataformaDoModalDeCanais, setPlataformaDoModalDeCanais] = useState<string | undefined>(undefined);
  const [canalDoModalDeCanais, setCanalDoModalDeCanais] = useState<string | undefined>(undefined);
  const toast = useToast();
  const [plansModalReason, setPlansModalReason] = useState<'live' | 'record' | 'upgrade' | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | null>(null);

  // Quando a conta desta aba sai ou dá lugar a outra (sair da conta, a sessão
  // acabar, outra aba entrar com outra conta), a página recarrega: os canais
  // com as chaves, os webinars e o resto da conta moram na memória do app. Sem
  // recarregar, ficavam para quem entrasse depois nesta aba e, se essa pessoa
  // não tivesse canais salvos, eram gravados na conta dela.
  useEffect(() => {
    const unsubscribe = subscribeAuth(
      (userProfile) => setUser(userProfile),
      () => window.location.replace('/'),
    );
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logoutFirebase();
    window.location.replace('/');
  };

  const handleRequirePlan = (feature: 'live' | 'record') => {
    setPlansModalReason(feature);
    setIsPlansModalOpen(true);
  };

  const isTrialExpired = Boolean(
    user && user.plan === 'Free Trial' && (user.isExpired || (user.trialDays !== undefined && user.trialDays <= 0))
  );

  const handleAuthSuccess = (newUser: { uid?: string; email: string; name: string; plan: 'Standard' | 'Professional' | 'Business' | 'Free Trial'; isExpired: boolean; trialDays: number; role?: 'super-admin' | 'client' }) => {
    setUser(newUser);
  };

  // Depois de o banco confirmar o nome (Dados de cadastro): o menu e o palco
  // passam a usar o nome novo sem esperar o próximo login.
  const atualizarNome = (nome: string) => {
    if (!user) return;
    setUser({ ...user, name: nome });
  };

  // Dados que o app guardava só neste navegador e que nada lê mais: a cópia do
  // perfil do login antigo (o perfil agora vem do servidor), os dados fiscais do
  // cadastro antigo (razão social, CPF/CNPJ, endereço; voltam com a cobrança),
  // as faturas e o consumo inventados da cobrança antiga e a configuração do
  // painel de qualidade de vídeo, que não chegava à live.
  useEffect(() => {
    try {
      [
        'pwstream_user', 'pwstream_billing_profile', 'pwstream_invoices', 'pwstream_member_minutes', 'pwstream_member_storage', 'pwstream_video_quality_config',
        // As abas e os recursos do estúdio que saíram na fase 2: a audiência de teste, os modelos de cena, o QR antigo,
        // o seletor de tela com PDF, as posições do logo e do banner de cada monitor e a trilha sonora
        'pwstream_audience_local', 'pwstream_scene_templates_v2', 'pw_qrcode_config', 'pwstreamer_selectedSharedSource',
        'pw_logo_pos', 'pw_logo_scale', 'pw_banner_pos', 'pw_banner_scale', 'pw_banner_width',
        // A página pública que saiu na fase 3 guardava as inscrições só neste navegador
        'webinar_registrations',
        // O painel técnico, que saiu, guardava os perfis de RTMP com as chaves em texto claro; a barra lateral, os presets
        'pw_rtmp_profiles', 'pwstream_custom_presets',
        // A mídia e o QR code do estúdio, guardados sem dono antes de ficarem por conta: a de uma pessoa
        // aparecia para quem entrasse depois no mesmo navegador. Saem, e quem usou envia de novo
        'pwstreamer_customLogos', 'pwstreamer_customWatermarks', 'pwstreamer_customOverlays', 'pwstreamer_customBackgrounds',
        'pwstreamer_customAudios', 'pwstreamer_videoClips', 'pwstreamer_activeVideoClip', 'pwstreamer_activeLogo',
        'pwstreamer_activeWatermark', 'pwstreamer_activeOverlay', 'pwstreamer_activeBackground', 'pw_hidden_templates',
        'pw_qr_do_estudio',
      ].forEach((chave) =>
        localStorage.removeItem(chave)
      );
    } catch {
      /* armazenamento indisponível: não há o que limpar */
    }
  }, []);

  const [currentView, setCurrentView] = useState<VisaoDoApp>('dashboard');

  // Handle direct URL route navigation for /admin or #admin
  useEffect(() => {
    const handleUrlRoute = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;

      // A rota /admin, #admin e ?mode=admin promoviam QUALQUER visitante à
      // visão de super-admin. Agora exigem o papel do perfil, que vem do
      // servidor.
      //
      // Isto é defesa em profundidade, NÃO autorização: qualquer verificação
      // no cliente é contornável. Quem autoriza é o servidor, a cada request
      // (SUPER_ADMIN_EMAILS, em src/middleware/auth.ts), e as regras do banco
      // (isAdmin() em firestore.rules), que precisam listar os mesmos e-mails.
      const isSuperAdmin = user?.role === 'super-admin';
      if (pathname.endsWith('/admin') || hash === '#admin' || search.includes('mode=admin')) {
        if (isSuperAdmin) {
          setCurrentView('super-admin');
        } else {
          // Sem alarde: a rota simplesmente não existe para quem não é admin.
          setCurrentView('dashboard');
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success') {
        setPaymentStatus('success');
        // Clear params without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (urlParams.get('payment') === 'cancelled') {
        setPaymentStatus('cancelled');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleUrlRoute();
    window.addEventListener('hashchange', handleUrlRoute);
    window.addEventListener('popstate', handleUrlRoute);
    return () => {
      window.removeEventListener('hashchange', handleUrlRoute);
      window.removeEventListener('popstate', handleUrlRoute);
    };
    // Depende do papel: com [] o handler fechava sobre o `user` do primeiro
    // render, e um admin que entrasse DEPOIS da montagem seria devolvido ao
    // dashboard ao usar a própria rota.
  }, [user?.role]);

  // Dynamic webinars list
  const [webinars, setWebinars] = useState<Array<{
    id: string; title: string;
    /** Só em webinars antigos: o campo saiu junto com a página pública. */
    desc?: string;
    time: string;
    channels: string[]; type: string; videoName: string;
    /** Horário em ISO 8601: dele vêm a ordem da lista e "Hoje/Amanhã". */
    startsAt?: string;
  // Começa vazio. Eram dois webinars inventados ("Como Alavancar suas
  // Vendas...", "Webinar de Boas-vindas...") que ficavam na tela sempre que
  // o Firestore não respondia — e o painel novo os anunciaria como "a
  // próxima live". A lista real chega pela assinatura abaixo.
  }>>([]);

  const handleDeleteWebinar = async (id: string) => {
    setWebinars(prev => prev.filter(w => w.id !== id));
    try {
      if (user) {
        await deleteWebinarFromFirestore(user.uid, id);
      }
    } catch (e) {
      console.error('Error deleting webinar:', e);
    }
  };

  // Agendar webinar (o rascunho mora no próprio modal)
  const [isCreateWebinarOpen, setIsCreateWebinarOpen] = useState(false);

  const [destinations, setDestinations] = useState<Destination[]>(INITIAL_DESTINATIONS);
  // O webinar pelo qual se entrou no estúdio: dá o nome da sessão e o roteiro dela
  const [webinarNoEstudio, setWebinarNoEstudio] = useState<{ id: string; title: string } | undefined>(undefined);

  // A cor dos gráficos da live (borda do card da câmera, banners, ticker, QR e
  // cronômetro) começa neutra. Era vermelha, e no estúdio o vermelho quer dizer
  // "no ar". Fica na conta, com as preferências de transmissão.
  const [streamColor, setStreamColor] = useState<string>(COR_PADRAO);

  // O chat mora no app para sobreviver às idas e voltas do estúdio
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);

  // Firestore Quota Resilience state
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [isQuotaBannerVisible, setIsQuotaBannerVisible] = useState(true);

  useEffect(() => {
    const unsubQuota = subscribeQuotaStatus((exceeded) => {
      setIsQuotaExceeded(exceeded);
    });
    return () => unsubQuota();
  }, []);

  // Limite de canais ligados ao mesmo tempo, do plano (plans.ts)
  const limiteDeLigados = limiteDeCanaisLigados(user?.plan);
  // Fora do estúdio, "Ver planos" leva à página de plano. No estúdio, o modal
  // por cima não tira ninguém do palco — a câmera e uma live em andamento.
  const abrirPlanos = () => {
    if (currentView === 'studio') {
      setPlansModalReason('upgrade');
      setIsPlansModalOpen(true);
    } else {
      setCurrentView('billing');
    }
  };

  // Legal Modal States
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy'>('terms');

  const [isFirestoreSettingsLoaded, setIsFirestoreSettingsLoaded] = useState(false);
  // O banco já respondeu às configurações de transmissão desta conta (com ou
  // sem o documento). Só então o salvamento automático pode gravar.
  const [configuracoesDoBanco, setConfiguracoesDoBanco] = useState(false);

  // A moderação sempre confere cada mensagem; o interruptor dela ficava numa aba que saiu
  const isAiModerationEnabled = true;

  // AI Moderation fetcher and logic
  const moderateComment = async (text: string) => {
    try {
      const res = await apiFetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('Failed to moderate');
      return await res.json();
    } catch (err) {
      console.error('Moderation error, using offline backup:', err);
      const lowercaseText = text.toLowerCase();
      const isSpam = lowercaseText.includes("compre") || lowercaseText.includes("www.") || lowercaseText.includes("seguidores") || lowercaseText.includes("promoc") || lowercaseText.includes("grátis") || lowercaseText.includes("ganhe") || lowercaseText.includes("bitcoin");
      const isAbusive = lowercaseText.includes("merda") || lowercaseText.includes("idiota") || lowercaseText.includes("burro") || lowercaseText.includes("lixo") || lowercaseText.includes("tonto") || lowercaseText.includes("fdp") || lowercaseText.includes("imbecil") || lowercaseText.includes("bosta");
      const isIrrelevant = lowercaseText.includes("lol") || lowercaseText.includes("jogar") || lowercaseText.includes("futebol") || lowercaseText.includes("free fire");
      return {
        isAbusive,
        isIrrelevant: isSpam || isIrrelevant,
        reason: isAbusive 
          ? "Linguagem ofensiva (Regra local)" 
          : isSpam 
            ? "Propaganda/Spam (Regra local)" 
            : isIrrelevant 
              ? "Assunto fora do tema (Regra local)" 
              : "Comentário limpo",
        moderatedBy: "Local Rules"
      };
    }
  };

  const processNewComment = async (newComment: Comment) => {
    // Add instantly but with isModerated = false (loading state)
    setComments(prev => [...prev, { ...newComment, isModerated: false }]);

    if (!isAiModerationEnabled) {
      // If AI moderation is disabled, mark as moderated with no flags
      setComments(prev => prev.map(c => c.id === newComment.id ? { ...c, isModerated: true } : c));
      return;
    }

    const modResult = await moderateComment(newComment.text);
    setComments(prev => prev.map(c => {
      if (c.id === newComment.id) {
        return {
          ...c,
          isModerated: true,
          isAbusive: modResult.isAbusive,
          isIrrelevant: modResult.isIrrelevant,
          moderationReason: modResult.reason
        };
      }
      return c;
    }));
  };

  // Destinations toggler
  // Ligar além do plano não liga: o canal fica como estava e o aviso diz por
  // quê e o que fazer. Antes o interruptor de Canais e a lista do estúdio
  // ligavam qualquer quantidade.
  const avisarLimiteDeCanais = (nome: string) =>
    toast.info(
      `${nome} continua desligado`,
      `Seu plano transmite para ${limiteDeLigados} canais ao mesmo tempo. Desligue outro antes de ligar este.`,
      { label: 'Ver planos', onClick: abrirPlanos },
    );

  // Os canais só mudam depois de o banco responder. Antes disso a lista na
  // memória é a vazia do começo (ou a cópia deste navegador), e cada mudança
  // grava a lista inteira: salvar por cima dela apagava os canais da conta.
  // Com a cota esgotada o banco não responde, e a mudança fica só neste
  // navegador, como o aviso da cota diz.
  const canaisProntos = configuracoesDoBanco || isQuotaExceeded;
  const avisarCanaisCarregando = () =>
    toast.info('Seus canais ainda estão carregando', 'Espere um instante e tente de novo. Se não carregar, confira sua conexão.');

  const handleToggleDestination = (id: string) => {
    if (!canaisProntos) {
      avisarCanaisCarregando();
      return;
    }
    const canal = destinations.find(d => d.id === id);
    if (canal && !canal.selected && !cabeLigado(destinations, id, limiteDeLigados)) {
      avisarLimiteDeCanais(canal.name);
      return;
    }
    setDestinations(prev => {
      const updated = prev.map(dest => dest.id === id ? { ...dest, selected: !dest.selected } : dest);
      if (user?.uid) {
        saveDestinationsToFirestore(user.uid, updated);
      }
      return updated;
    });
  };

  // Add or Update Destination (from AddChannelsModal). Devolve se salvou: sem
  // os canais carregados, o modal fica aberto com o que foi digitado.
  const handleAddOrUpdateDestination = (newDest: Destination): boolean => {
    if (!canaisProntos) {
      avisarCanaisCarregando();
      return false;
    }
    setDestinations(prev => {
      // Pelo id, só. Casar também pela plataforma sobrescrevia o primeiro canal
      // dela — com dois servidores RTMP, editar o segundo apagava o primeiro.
      const existingIdx = prev.findIndex(d => d.id === newDest.id);
      let updated: Destination[];
      if (existingIdx >= 0) {
        updated = [...prev];
        // Quem decide ligar é o modal: editar não liga um canal desligado, e
        // um canal novo além do limite do plano entra desligado.
        updated[existingIdx] = { ...updated[existingIdx], ...newDest };
      } else {
        updated = [newDest, ...prev];
      }
      if (user?.uid) {
        saveDestinationsToFirestore(user.uid, updated);
      }
      return updated;
    });
    return true;
  };

  // Remover canal: não existia — um canal conectado ficava para sempre.
  const handleRemoveDestination = (id: string) => {
    if (!canaisProntos) {
      avisarCanaisCarregando();
      return;
    }
    setDestinations(prev => {
      const updated = prev.filter(dest => dest.id !== id);
      if (user?.uid) {
        saveDestinationsToFirestore(user.uid, updated);
      }
      return updated;
    });
  };

  // Ações das telas da casca (painel, canais, webinars)
  const conectarCanal = (plataforma?: string) => {
    setCanalDoModalDeCanais(undefined);
    setPlataformaDoModalDeCanais(plataforma);
    setIsAddChannelsModalOpen(true);
  };
  // Editar ESTE canal: pelo id, e não pela plataforma — um servidor RTMP
  // criado no estúdio (NGINX, SRS…) não tem linha própria no modal.
  const editarCanal = (id: string) => {
    setPlataformaDoModalDeCanais(undefined);
    setCanalDoModalDeCanais(id);
    setIsAddChannelsModalOpen(true);
  };
  const entrarNoEstudio = (webinar?: { id: string; title: string }) => {
    setWebinarNoEstudio(webinar ? { id: webinar.id, title: webinar.title } : undefined);
    setCurrentView('studio');
  };

  // -------------------------------------------------------------
  // FIRESTORE SUBSCRIPTIONS & PERSISTENCE
  // -------------------------------------------------------------
  useEffect(() => {
    if (!user?.uid) return;

    setIsFirestoreSettingsLoaded(false);
    setConfiguracoesDoBanco(false);
    const timer = setTimeout(() => setIsFirestoreSettingsLoaded(true), 2000);

    const unsubWebinars = subscribeWebinars(user.uid, (firestoreWebinars) => {
      setWebinars(firestoreWebinars);
    });

    // Banners, tickers e roteiros são do estúdio, que os assina quando abre
    const unsubSettings = subscribeTransmissionSettings(
      user.uid,
      (settings) => {
        if (settings.destinations) setDestinations(prev => JSON.stringify(prev) === JSON.stringify(settings.destinations) ? prev : settings.destinations);
        if (settings.streamColor) setStreamColor(settings.streamColor);
      },
      () => setConfiguracoesDoBanco(true),
    );

    return () => {
      clearTimeout(timer);
      unsubWebinars();
      unsubSettings();
    };
  }, [user?.uid]);

  // Salva os canais e a cor dos gráficos pouco depois de mudarem, e só depois de
  // o banco responder: antes disso a memória tem a lista vazia do começo, e
  // gravá-la por cima apagava os canais da conta quando o banco demorava mais
  // que o salvamento. Com a cota esgotada o banco não responde, e o salvamento
  // guarda só neste navegador. Saíram daqui o servidor e a chave de exemplo
  // (gravados em toda conta), o formato e a qualidade de uma gravação que não
  // existe, as animações antigas do logo e do banner e o estilo de texto, que o
  // palco não lia.
  useEffect(() => {
    if (!user?.uid || !(configuracoesDoBanco || isQuotaExceeded)) return;
    const timeout = setTimeout(() => {
      saveTransmissionSettingsToFirestore(user.uid, {
        destinations,
        streamColor
      });
    }, 1500);
    return () => clearTimeout(timeout);
  }, [user?.uid, destinations, streamColor, configuracoesDoBanco, isQuotaExceeded]);

  // Post chat comments manually
  const handlePostComment = (text: string) => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newComment: Comment = {
      id: `user-comm-${Date.now()}`,
      authorName: user?.name ? `${user.name.split(' ')[0]} (Você)` : 'Você',
      authorAvatar: '',
      text,
      platform: 'studio',
      timestamp
    };
    processNewComment(newComment);
  };

  const handleApproveComment = (id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, isApprovedByUser: true } : c));
  };

  const handleClearComments = () => {
    setComments([]);
  };

  if (!user) {
    return (
      <AuthAndPricing 
        onAuthSuccess={handleAuthSuccess} 
        initialView="landing"
      />
    );
  }

  return (
    <div
      /* No estúdio a tela INTEIRA é o console — cabeçalho incluído. Os chips
         escuros do cabeçalho (LIVE STREAM, 1080p, alternador de tema) ficavam
         fora do escopo e recebiam os tokens de texto do tema claro sobre
         fundo escuro: 2,24–3,55:1. */
      data-surface={currentView === 'studio' ? 'console' : undefined}
      className={`bg-[var(--bg)] font-sans text-[var(--ink-hi)] flex flex-col ${currentView === 'studio' ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'}`}>
      
      {/* O estúdio tem a própria barra, dentro dele. As outras telas, a casca do app. */}
      {currentView !== 'studio' && (
        <AppHeader user={user} currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout} />
      )}

      {/* Cota do banco esgotada. Era um aviso de desenvolvedor para o cliente
          ("Limite diário de gravações do Firestore (Spark Free Tier)"), em
          âmbar, com um link para o cliente fazer upgrade no Firebase — que
          não é dele. Agora diz o que acontece com as alterações; a cota fica
          só para o admin. */}
      {isQuotaExceeded && isQuotaBannerVisible && (
        <div id="firestore-quota-alert-banner" role="status" className="flex min-h-11 shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] pl-4 pr-1 text-xs text-[var(--ink-hi)]">
          <p className="flex items-start gap-2 py-2">
            <CircleAlert size={14} aria-hidden="true" className="mt-px shrink-0" />
            <span>
              Não foi possível salvar na nuvem agora. Suas alterações estão guardadas só neste navegador.
              {user?.role === 'super-admin' && (
                <>
                  {' '}
                  <AcaoDeTexto href={FIRESTORE_UPGRADE_URL} tamanho="xs" sublinhada>
                    Ver a cota no Firebase
                  </AcaoDeTexto>
                </>
              )}
            </span>
          </p>
          <BotaoDeIcone rotulo="Fechar aviso" onClick={() => setIsQuotaBannerVisible(false)}>
            <X size={16} aria-hidden="true" />
          </BotaoDeIcone>
        </div>
      )}

      {currentView === 'studio' ? (
        <MidiaDoEstudioProvider key={user.uid} conta={user.uid}>
          <Estudio
            usuario={{ uid: user.uid, name: user.name }}
            webinar={webinarNoEstudio}
            canais={destinations}
            onCanais={() => setIsAddChannelsModalOpen(true)}
            onSair={() => setCurrentView('dashboard')}
            comentarios={comments}
            onComentar={handlePostComment}
            onAprovarComentario={handleApproveComment}
            onLimparChat={handleClearComments}
            moderacaoLigada={isAiModerationEnabled}
            cor={streamColor}
            onCor={setStreamColor}
          />
        </MidiaDoEstudioProvider>
      ) : currentView === 'super-admin' ? (
        <SuperAdminPanel onBack={() => setCurrentView('dashboard')} onSair={handleLogout} user={user} />
      ) : currentView === 'billing' ? (
        <PlanoPagina user={user} />
      ) : currentView === 'profile' ? (
        <CadastroPagina user={user} onNomeSalvo={atualizarNome} onSair={handleLogout} />
      ) : currentView === 'channels' ? (
        <CanaisPagina
          canais={destinations}
          onConectarCanal={conectarCanal}
          onEditarCanal={editarCanal}
          onAlternarCanal={handleToggleDestination}
          onRemoverCanal={handleRemoveDestination}
          limiteDeLigados={limiteDeLigados}
        />
      ) : currentView === 'webinars' ? (
        <WebinarsPagina
          webinars={webinars}
          carregado={isFirestoreSettingsLoaded}
          onAgendar={() => setIsCreateWebinarOpen(true)}
          onEntrar={entrarNoEstudio}
          onExcluir={(webinar) => handleDeleteWebinar(webinar.id)}
        />
      ) : currentView === 'settings' ? (
        <ConfiguracoesPagina
          ehSuperAdmin={user?.role === 'super-admin'}
          onIrPara={setCurrentView}
        />
      ) : (
        <Dashboard
          webinars={webinars}
          carregado={isFirestoreSettingsLoaded}
          canais={destinations}
          onEntrarNoEstudio={entrarNoEstudio}
          onAgendar={() => setIsCreateWebinarOpen(true)}
          onConectarCanal={conectarCanal}
          onEditarCanal={editarCanal}
          onVerCanais={() => setCurrentView('channels')}
          onVerWebinars={() => setCurrentView('webinars')}
        />
      )}

      {/* Rodapé da casca. Era em inglês ("All Rights Reserved... Developed and
          Maintained by"), com links em caixa alta, um segundo logo e um link
          de suporte para uma página que não existe. */}
      {currentView !== 'studio' && (
        <footer className="border-t border-[var(--line)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-xs text-[var(--ink-lo)] sm:px-6">
            <p>© {new Date().getFullYear()} PW Stream Online</p>
            <div className="flex gap-5">
              <AcaoDeTexto tamanho="xs" onClick={() => { setLegalModalType('terms'); setLegalModalOpen(true); }}>
                Termos de uso
              </AcaoDeTexto>
              <AcaoDeTexto tamanho="xs" onClick={() => { setLegalModalType('privacy'); setLegalModalOpen(true); }}>
                Privacidade
              </AcaoDeTexto>
            </div>
          </div>
        </footer>
      )}

      {/* 4. Agendar webinar */}
      <CriarWebinarModal
        isOpen={isCreateWebinarOpen}
        onClose={() => setIsCreateWebinarOpen(false)}
        canais={destinations}
        onAgendar={async (webinar) => {
          // Só depois de o banco confirmar: se falhar, o modal fica aberto
          // com o rascunho e diz a saída.
          await agendarWebinar(webinar);
          setWebinars((prev) => [webinar, ...prev.filter((w) => w.id !== webinar.id)]);
          setIsCreateWebinarOpen(false);
          toast.success('Webinar agendado', rotuloDoHorario(webinar));
        }}
        onSair={handleLogout}
      />

      {/* Interactive Legal Document Modals */}
      <LegalModal 
        isOpen={legalModalOpen}
        type={legalModalType}
        onClose={() => setLegalModalOpen(false)}
      />

      {/* Add Channels / Multi-Platform Transmission Modal */}
      <AddChannelsModal
        isOpen={isAddChannelsModalOpen}
        onClose={() => { setIsAddChannelsModalOpen(false); setPlataformaDoModalDeCanais(undefined); setCanalDoModalDeCanais(undefined); }}
        plataformaInicial={plataformaDoModalDeCanais}
        canalInicialId={canalDoModalDeCanais}
        destinations={destinations}
        onAddOrUpdateDestination={handleAddOrUpdateDestination}
        currentPlan={user?.plan || 'Free Trial'}
        onOpenUpgrade={() => {
          setIsAddChannelsModalOpen(false);
          abrirPlanos();
        }}
      />

      {/* Plans Modal */}
      {(isPlansModalOpen || paymentStatus === 'success') && user && (
        <PlansModal
          onClose={() => {
            setIsPlansModalOpen(false);
            setPlansModalReason(null);
            setPaymentStatus(null);
          }}
          currentPlan={user.plan}
          reason={plansModalReason}
        />
      )}
    </div>
  );
}
