import React, { useState, useRef } from 'react';
import { 
  X, Compass, Globe, Youtube, Mail, Server, Laptop, Monitor, FileText, 
  Upload, Play, AlertCircle, Check, Copy, ArrowRight, Video, ChevronLeft, ChevronRight,
  Pause, Volume2, VolumeX, Search, Maximize2, Minimize2, LayoutGrid
} from 'lucide-react';

// High fidelity mockup for Adobe Photoshop
function PhotoshopMock() {
  return (
    <div className="w-full aspect-video bg-[var(--surface)] rounded-lg border border-slate-800 overflow-hidden flex flex-col select-none pointer-events-none">
      <div className="bg-[var(--bg)] px-2 py-1 flex items-center justify-between border-b border-[var(--line)]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          <span className="text-[8px] font-bold text-gray-400 ml-1">Photoshop - Poster_Marketing_V6.psd</span>
        </div>
        <span className="text-[7px] text-gray-600 font-bold uppercase tracking-wider">PS 2026</span>
      </div>
      <div className="flex-1 flex bg-[var(--panel)]">
        <div className="w-4 bg-[var(--bg)] border-r border-slate-800/60 flex flex-col gap-1 items-center pt-1.5 text-gray-500">
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div>
          <div className="w-2 h-2 bg-slate-800 rounded-sm"></div>
          <div className="w-2 h-2 bg-slate-800 rounded-sm"></div>
        </div>
        <div className="flex-1 flex items-center justify-center p-2 relative">
          <div className="w-full h-full bg-[var(--bg)] rounded border border-slate-800/80 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 via-purple-900/20 to-transparent flex items-center justify-center">
              <span className="text-[9px] font-black tracking-widest text-blue-400 font-mono animate-pulse">VEGA6 CORPNET</span>
            </div>
            <div className="absolute left-1/3 top-0 bottom-0 w-[0.5px] bg-cyan-500/20"></div>
            <div className="absolute left-0 right-0 top-1/2 h-[0.5px] bg-cyan-500/20"></div>
          </div>
        </div>
        <div className="w-14 bg-[var(--bg)] border-l border-slate-800/60 p-1.5 flex flex-col gap-1 text-[6px] text-gray-500">
          <div className="border-b border-[var(--line)] pb-1 text-gray-400 font-bold">Camadas</div>
          <div className="bg-blue-600/25 text-blue-400 p-0.5 rounded text-[5px] flex items-center justify-between">
            <span>Texto Principal</span>
          </div>
          <div className="bg-[var(--panel)] p-0.5 rounded text-[5px] flex items-center justify-between">
            <span>Gradiente BG</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// High fidelity mockup for OBS Studio
function OBSMock() {
  return (
    <div className="w-full aspect-video bg-[var(--surface)] rounded-lg border border-slate-800 overflow-hidden flex flex-col select-none pointer-events-none">
      <div className="bg-[var(--bg)] px-2 py-1 flex items-center justify-between border-b border-[var(--line)]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          <span className="text-[8px] font-bold text-gray-400 ml-1">OBS Studio 30.2 - Transmissão Ativa</span>
        </div>
      </div>
      <div className="flex-1 bg-[var(--bg)] flex flex-col p-1.5 gap-1.5">
        <div className="flex-1 bg-slate-950 border border-[var(--line)] flex items-center justify-center relative overflow-hidden">
          <div className="border border-slate-800 w-4/5 h-4/5 bg-slate-900 flex items-center justify-center">
            <div className="border border-slate-700 w-3/4 h-3/4 bg-[var(--panel)] flex items-center justify-center">
              <span className="text-[5px] font-mono text-gray-600">Loop Infinito</span>
            </div>
          </div>
          <div className="absolute top-1 left-1 px-1 py-0.5 bg-red-600 text-white font-mono text-[5px] font-black rounded uppercase flex items-center gap-0.5">
            <span className="w-1 h-1 bg-white rounded-full animate-ping" />
            LIVE
          </div>
        </div>
        <div className="h-10 bg-[var(--surface)] border border-[var(--line)] rounded p-1 flex justify-between items-center text-[6px]">
          <div className="space-y-0.5">
            <span className="text-gray-400 block font-bold">Cenas</span>
            <div className="bg-blue-600/20 text-blue-400 px-1 py-0.2 rounded font-bold">Cena Principal</div>
          </div>
          <div className="flex-1 mx-2 space-y-0.5">
            <span className="text-gray-400 block font-bold text-center">Mixer de Áudio</span>
            <div className="h-1 w-full bg-slate-950 rounded overflow-hidden relative">
              <div className="w-3/4 h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded" />
            </div>
            <div className="h-1 w-full bg-slate-950 rounded overflow-hidden relative">
              <div className="w-1/2 h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded" />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 scale-90">
            <span className="bg-emerald-600/25 text-emerald-400 px-1 py-0.2 rounded font-black text-[5px] text-center">TRANSMITINDO</span>
            <span className="bg-slate-800 text-gray-400 px-1 py-0.2 rounded text-[5px] text-center">REC: ATIVO</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// High fidelity mockup for VS Code
function VSCodeMock() {
  return (
    <div className="w-full aspect-video bg-[var(--surface)] rounded-lg border border-slate-800 overflow-hidden flex flex-col select-none pointer-events-none">
      <div className="bg-[var(--bg)] px-2 py-1 flex items-center justify-between border-b border-[var(--line)]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          <span className="text-[8px] font-bold text-gray-400 ml-1">App.tsx - workspace-podcasting - VS Code</span>
        </div>
      </div>
      <div className="flex-1 flex bg-[var(--surface)]">
        <div className="w-3 bg-[var(--surface)] flex flex-col items-center pt-1.5 gap-1.5 text-gray-600 border-r border-[var(--line)]">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-slate-700 rounded-sm"></div>
        </div>
        <div className="w-14 bg-[var(--surface)] border-r border-[var(--line)] p-1 flex flex-col gap-0.5 text-[5px] text-gray-500">
          <span className="font-bold text-gray-400 text-[5px] tracking-wide block truncate uppercase">WORKSPACE</span>
          <span className="text-blue-400 pl-1 font-bold">src/</span>
          <span className="text-amber-500 pl-2">App.tsx</span>
          <span className="text-slate-400 pl-2">index.css</span>
        </div>
        <div className="flex-1 bg-[var(--bg)] p-1.5 font-mono text-[5px] text-gray-400 leading-normal overflow-hidden">
          <div className="text-blue-400">import <span className="text-purple-400">{"{ React }"}</span> from <span className="text-orange-400">'react'</span>;</div>
          <div className="text-purple-400">function <span className="text-yellow-400">WebinarApp</span>() {"{"}</div>
          <div className="pl-2 text-slate-400">const <span className="text-blue-300">{"[live, setLive]"}</span> = useState(true);</div>
          <div className="pl-2 text-emerald-500">// Restream API</div>
          <div className="pl-2 text-purple-400">return (</div>
          <div className="pl-4 text-blue-400">{"<div className="}<span className="text-orange-400">"studio"</span>{">"}</div>
          <div className="pl-6 text-gray-300">{"<StudioView />"}</div>
          <div className="pl-4 text-blue-400">{"</div>"}</div>
          <div className="pl-2 text-purple-400">);</div>
          <div className="text-purple-400">{"}"}</div>
        </div>
      </div>
    </div>
  );
}

// High fidelity mockup for PowerPoint
function PowerPointMock() {
  return (
    <div className="w-full aspect-video bg-[var(--surface)] rounded-lg border border-slate-800 overflow-hidden flex flex-col select-none pointer-events-none">
      <div className="bg-[var(--bg)] px-2 py-1 flex items-center justify-between border-b border-[var(--line)]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          <span className="text-[8px] font-bold text-gray-400 ml-1">Apresentação de Vendas.pptx - PowerPoint</span>
        </div>
      </div>
      <div className="flex-1 flex bg-[var(--panel)]">
        <div className="w-10 bg-[var(--surface)] border-r border-[var(--line)] p-1 flex flex-col gap-1 items-center">
          <div className="w-8 h-4 rounded border border-orange-500 bg-[var(--raise)] text-[4px] text-orange-400 flex items-center justify-center font-bold">Slide 1</div>
          <div className="w-8 h-4 rounded border border-slate-800 bg-[var(--surface)] text-[4px] text-gray-600 flex items-center justify-center">Slide 2</div>
          <div className="w-8 h-4 rounded border border-slate-800 bg-[var(--surface)] text-[4px] text-gray-600 flex items-center justify-center">Slide 3</div>
        </div>
        <div className="flex-1 bg-[var(--surface)] p-2 flex flex-col justify-between">
          <div className="text-center mt-1">
            <span className="text-[4px] text-orange-400 tracking-widest block font-black uppercase">VEGA6 CORPNET</span>
            <h2 className="text-[9px] font-black text-white mt-0.5">Estratégias de Vendas 2026</h2>
            <p className="text-[5px] text-gray-400">Alcançando novos horizontes</p>
          </div>
          <div className="flex gap-1 justify-center mb-1">
            <div className="w-5 h-2.5 bg-blue-500/10 rounded flex items-center justify-center text-[4px] text-blue-400 font-bold border border-blue-500/15">+240%</div>
            <div className="w-5 h-2.5 bg-emerald-500/10 rounded flex items-center justify-center text-[4px] text-emerald-400 font-bold border border-emerald-500/15">SaaS</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ScreenSharePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'tab' | 'window' | 'screen' | 'pdf' | 'video';
  onSelectShare: (source: { 
    type: 'tab' | 'window' | 'screen' | 'pdf' | 'video'; 
    name: string; 
    audioShared: boolean;
    fileUrl?: string;
    fileName?: string;
    pdfPageCount?: number;
    resolution?: '720p' | '1080p';
    frameRate?: '30fps' | '60fps';
    initialPage?: number;
  }) => void;
}

export function ScreenSharePickerModal({ isOpen, onClose, initialTab = 'pdf', onSelectShare }: ScreenSharePickerModalProps) {
  const [activeTab, setActiveTab] = useState<'tab' | 'window' | 'screen' | 'pdf' | 'video'>(initialTab);
  const [selectedItemId, setSelectedItemId] = useState<string | null>('scr-1');

  React.useEffect(() => {
    if (isOpen) {
      const targetTab = initialTab || 'pdf';
      setActiveTab(targetTab);
      if (targetTab === 'tab') setSelectedItemId('tab-1');
      else if (targetTab === 'window') setSelectedItemId('win-1');
      else if (targetTab === 'screen') setSelectedItemId('scr-1');
      else if (targetTab === 'pdf' || targetTab === 'video') {
        setSelectedItemId(uploadedFileUrl ? 'uploaded-file' : 'default-demo');
      }
    }
  }, [isOpen, initialTab]);
  const [audioShared, setAudioShared] = useState<boolean>(true);
  
  // Optimization options states
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [frameRate, setFrameRate] = useState<'30fps' | '60fps'>('60fps');

  // Custom uploaded file states
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [pdfPreviewPage, setPdfPreviewPage] = useState<number>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Video player states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState<boolean>(false);
  const [videoMuted, setVideoMuted] = useState<boolean>(true);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  
  // Search and Expanded view states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!isOpen) return null;

  // Custom Iframe detection helper
  const isInsideIframe = window.self !== window.top;

  // Options for "Guia do Chrome" (Simulated browser tabs)
  const CHROME_TABS = [
    { id: 'tab-1', name: 'Home - Restream Studio', icon: Globe, color: 'text-blue-400', url: 'restream.io' },
    { id: 'tab-2', name: 'PwStreamer - Plataforma profissional para transmissões', icon: Compass, color: 'text-rose-500', url: 'pwstreamer.com' },
    { id: 'tab-3', name: '(19640) PL da Misoginia: entenda os impactos reais', icon: Youtube, color: 'text-red-500', url: 'youtube.com' },
    { id: 'tab-4', name: '(57) marcos@powerstar7.com - Caixa de Correio Corporativa', icon: Mail, color: 'text-sky-400', url: 'webmail.powerstar7.com' },
    { id: 'tab-5', name: 'GoDaddy Domain Search Engine', icon: Globe, color: 'text-emerald-500', url: 'godaddy.com' },
    { id: 'tab-6', name: 'Caixa de entrada (237) - mgdlms@gmail.com - Gmail', icon: Mail, color: 'text-red-400', url: 'mail.google.com' }
  ];

  // Options for "Janela" (Simulated application windows)
  const WINDOWS = [
    { id: 'win-1', name: 'Adobe Photoshop CC 2026', icon: Laptop, color: 'text-blue-600', app: 'Photoshop' },
    { id: 'win-2', name: 'OBS Studio (Transmissão de Alta Performance)', icon: Laptop, color: 'text-slate-400', app: 'OBS Studio' },
    { id: 'win-3', name: 'VS Code (workspace-podcasting)', icon: Laptop, color: 'text-sky-500', app: 'VS Code' },
    { id: 'win-4', name: 'Powerpoint - Apresentação de Vendas.pptx', icon: FileText, color: 'text-orange-500', app: 'PowerPoint' }
  ];

  // Options for "Tela inteira" (Simulated desktop displays)
  const SCREENS = [
    { id: 'scr-1', name: 'Tela 1 - Monitor Principal (Apresentação)', icon: Laptop, color: 'text-slate-200' },
    { id: 'scr-2', name: 'Tela 2 - Monitor Lateral (Feed & Monitoramento)', icon: Monitor, color: 'text-blue-400' }
  ];

  // Filtered lists for search query
  const filteredChromeTabs = CHROME_TABS.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWindows = WINDOWS.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.app.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredScreens = SCREENS.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // File Upload handler (PDF or Video)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileName(file.name);

    // Create a local object URL to stream the video or render pages
    const objectUrl = URL.createObjectURL(file);
    setUploadedFileUrl(objectUrl);
    setSelectedItemId('uploaded-file');
    
    setTimeout(() => {
      setIsUploading(false);
    }, 800);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileName(file.name);

    const objectUrl = URL.createObjectURL(file);
    setUploadedFileUrl(objectUrl);
    setSelectedItemId('uploaded-file');

    setTimeout(() => {
      setIsUploading(false);
    }, 800);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Video player controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoPlaying) {
      videoRef.current.pause();
      setVideoPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setVideoPlaying(true);
      }).catch(err => console.log(err));
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !videoMuted;
    videoRef.current.muted = nextMuted;
    setVideoMuted(nextMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setVideoCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setVideoDuration(videoRef.current.duration || 0);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setVideoCurrentTime(time);
  };

  const formatVideoTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Confirm screen share
  const handleShareClick = () => {
    let name = '';
    let fileUrl = undefined;

    if (activeTab === 'pdf') {
      name = uploadedFileName || 'Apresentação de Estratégias 2026';
      fileUrl = uploadedFileUrl || '';
    } else if (activeTab === 'video') {
      name = uploadedFileName || 'Apresentação Promocional.mp4';
      fileUrl = uploadedFileUrl || '';
    } else if (activeTab === 'tab') {
      name = CHROME_TABS.find(t => t.id === selectedItemId)?.name || '';
    } else if (activeTab === 'window') {
      name = WINDOWS.find(w => w.id === selectedItemId)?.name || '';
    } else {
      name = SCREENS.find(s => s.id === selectedItemId)?.name || 'Monitor Principal';
    }

    onSelectShare({
      type: activeTab,
      name,
      audioShared,
      fileUrl,
      fileName: uploadedFileName || undefined,
      pdfPageCount: activeTab === 'pdf' ? 12 : undefined,
      resolution,
      frameRate,
      initialPage: activeTab === 'pdf' ? pdfPreviewPage : undefined
    });
  };

  const getSelectedItemName = () => {
    if (selectedItemId === 'uploaded-file') return uploadedFileName;
    if (activeTab === 'tab') return CHROME_TABS.find(t => t.id === selectedItemId)?.name;
    if (activeTab === 'window') return WINDOWS.find(w => w.id === selectedItemId)?.name;
    return SCREENS.find(s => s.id === selectedItemId)?.name;
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-sans" id="screen-share-picker-modal">
      
      {/* Chrome Dialog Styled Window */}
      <div className={`w-full ${isExpanded ? 'max-w-5xl h-[600px]' : 'max-w-3xl'} bg-[var(--panel)] border border-slate-800 rounded-2xl shadow-2xl text-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 transition-all duration-300`}>
        
        {/* Windows Header Tabbar */}
        <div className="bg-[var(--bg)] px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              Escolha o que compartilhar com pwstreamer.com / restream
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Selecione uma janela física, guia ou envie um arquivo para apresentação</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-all cursor-pointer"
            id="btn-close-picker"
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning Banner for nested frames */}
        {isInsideIframe && (activeTab === 'screen' || activeTab === 'window' || activeTab === 'tab') && (
          <div className="bg-blue-600/10 border-b border-blue-500/20 px-5 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="text-blue-400 shrink-0" />
              <p className="text-[11px] text-blue-200 leading-normal">
                Você está visualizando o app dentro do editor. Para usar o recurso nativo de capturar sua 
                <strong className="text-white"> Segunda Tela (Dual Monitors)</strong> ou janelas reais do seu PC, abra o app em uma aba dedicada.
              </p>
            </div>
            <button
              onClick={handleOpenInNewTab}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] py-1 px-3 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer shrink-0"
              id="btn-open-tab-warning"
            >
              <span>Abrir em Nova Aba</span>
              <ArrowRight size={11} />
            </button>
          </div>
        )}

        {/* Tabs Row */}
        <div className="flex bg-[var(--bg)]/40 border-b border-slate-800/80 px-4 scrollbar-none overflow-x-auto">
          {[
            { id: 'pdf', label: 'Apresentar PDF / Slides', isNew: true },
            { id: 'video', label: 'Vídeo Local / MP4', isNew: true }
          ].map((tab) => {
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedItemId(null);
                  setIsExpanded(false); // Reset expanded mode on tab change
                  if (tab.id === 'pdf' || tab.id === 'video') {
                    if (uploadedFileUrl) setSelectedItemId('uploaded-file');
                  }
                }}
                className={`py-3.5 px-4 text-xs font-bold relative transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSel ? 'text-blue-400' : 'text-gray-400 hover:text-slate-200'
                }`}
                id={`tab-select-${tab.id}`}
              >
                <span>{tab.label}</span>
                {tab.isNew && (
                  <span className="text-[7px] font-extrabold uppercase px-1 py-0.2 bg-emerald-500/20 text-emerald-400 rounded">
                    Fácil
                  </span>
                )}
                {isSel && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Picker Workspace (Grid Left/Right) */}
        <div className={`flex ${isExpanded ? 'flex-1' : 'h-[340px]'} bg-[var(--surface)]/40 overflow-hidden transition-all duration-300`}>
          
          {/* Left Panel: Content / Picker List */}
          <div className={`${isExpanded ? 'w-full' : 'w-[320px]'} border-r border-slate-800 p-4 overflow-y-auto custom-scrollbar flex flex-col min-h-0 transition-all duration-300`}>
            
            {/* Top controls: Search Bar & Expanded view */}
            <div className="flex flex-col gap-2 mb-3 pb-3 border-b border-slate-800/80 shrink-0">
              {/* Search input */}
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar fontes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-slate-800 text-xs text-white placeholder-gray-500 rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-blue-500 transition-all"
                  id="search-sharing-sources"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Expanded mode toggle (Only for Windows tab) */}
              {activeTab === 'window' && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                    isExpanded 
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-400 shadow-sm' 
                      : 'bg-[var(--bg)] border-slate-800 text-gray-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                  id="btn-toggle-expanded-mode"
                >
                  <span className="flex items-center gap-1.5">
                    <LayoutGrid size={12} />
                    Modo Expandido {isExpanded ? 'Ativo' : 'Inativo'}
                  </span>
                  <span className="text-[8px] uppercase tracking-widest font-extrabold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/10">
                    Grade Grande
                  </span>
                </button>
              )}
            </div>

            {/* List or Grid container */}
            <div className="flex-1 space-y-2">
              
              {/* Guia do Chrome Tab */}
              {activeTab === 'tab' && (
                <div className="space-y-1.5">
                  {filteredChromeTabs.length > 0 ? (
                    filteredChromeTabs.map((item) => {
                      const isSelected = selectedItemId === item.id;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedItemId(item.id)}
                          className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-500/10 border-blue-500 text-white font-bold ring-1 ring-blue-500/20' 
                              : 'bg-[var(--bg)] hover:bg-[var(--surface)] border-slate-800 text-gray-300 hover:border-slate-700'
                          }`}
                          id={`item-tab-${item.id}`}
                        >
                          <Icon size={14} className={`${isSelected ? 'text-blue-400' : item.color} shrink-0 mt-0.5`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold truncate">{item.name}</p>
                            <p className="text-[8px] text-gray-500 font-mono mt-0.5">{item.url}</p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-[11px] font-medium">Nenhuma guia correspondente</p>
                    </div>
                  )}
                </div>
              )}

              {/* Janela Tab */}
              {activeTab === 'window' && (
                <div className={isExpanded ? "grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4" : "space-y-1.5"}>
                  {filteredWindows.length > 0 ? (
                    filteredWindows.map((item) => {
                      const isSelected = selectedItemId === item.id;
                      
                      if (isExpanded) {
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedItemId(item.id)}
                            className={`w-full text-left rounded-xl border transition-all cursor-pointer p-2 flex flex-col gap-2 relative group/card ${
                              isSelected 
                                ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/25 text-white' 
                                : 'bg-[var(--bg)] hover:bg-[var(--surface)] border-slate-800 hover:border-slate-700 text-gray-300'
                            }`}
                            id={`item-win-expanded-${item.id}`}
                          >
                            {/* High fidelity mockups */}
                            {item.id === 'win-1' && <PhotoshopMock />}
                            {item.id === 'win-2' && <OBSMock />}
                            {item.id === 'win-3' && <VSCodeMock />}
                            {item.id === 'win-4' && <PowerPointMock />}

                            {/* Label */}
                            <div className="px-1.5 py-0.5 flex justify-between items-center w-full shrink-0">
                              <div className="min-w-0 flex-1">
                                <p className={`text-[10px] font-black truncate ${isSelected ? 'text-blue-400' : 'text-gray-200'}`}>{item.name}</p>
                                <p className="text-[8px] text-gray-500 font-mono">Software • {item.app}</p>
                              </div>
                              {isSelected ? (
                                <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                                  <Check size={10} strokeWidth={3} />
                                </span>
                              ) : (
                                <span className="w-4 h-4 rounded-full border border-slate-700 group-hover/card:border-slate-500 transition-all shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      }

                      // Normal mode button
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedItemId(item.id)}
                          className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-500/10 border-blue-500 text-white font-bold ring-1 ring-blue-500/20' 
                              : 'bg-[var(--bg)] hover:bg-[var(--surface)] border-slate-800 text-gray-300 hover:border-slate-700'
                          }`}
                          id={`item-win-${item.id}`}
                        >
                          <Icon size={14} className={`${isSelected ? 'text-blue-400' : item.color} shrink-0 mt-0.5`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold truncate">{item.name}</p>
                            <p className="text-[8px] text-gray-500 font-mono mt-0.5">Software • {item.app}</p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500 w-full col-span-2">
                      <p className="text-[11px] font-medium">Nenhuma janela correspondente</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tela inteira (PC Dual Monitor Selector) */}
              {activeTab === 'screen' && (
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-400 leading-normal px-1">
                    Selecione qual monitor deseja compartilhar. Caso seu computador possua 2 telas, escolha abaixo:
                  </p>
                  
                  <div className="space-y-2">
                    {filteredScreens.length > 0 ? (
                      filteredScreens.map((item) => {
                        const isSelected = selectedItemId === item.id;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedItemId(item.id)}
                            className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-blue-500/10 border-blue-500 text-white font-bold ring-1 ring-blue-500/20' 
                                : 'bg-[var(--bg)] hover:bg-[var(--surface)] border-slate-800 text-gray-300 hover:border-slate-700'
                            }`}
                            id={`item-scr-${item.id}`}
                          >
                            <Icon size={16} className={`${isSelected ? 'text-blue-400' : item.color} shrink-0 mt-0.5`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold">{item.name}</p>
                              <p className="text-[8px] text-emerald-400 font-black tracking-wider uppercase mt-0.5">Disponível em 1080p</p>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-[11px] font-medium">Nenhum monitor correspondente</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PDF presentation tab */}
              {activeTab === 'pdf' && (
                <div className="space-y-4">
                  {/* Dropzone PDF - show if matches search or no query */}
                  {(!uploadedFileName && (!searchQuery || "Carregar arquivo PDF Slides".toLowerCase().includes(searchQuery.toLowerCase()))) && (
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={triggerFileInput}
                      className="border-2 border-dashed border-slate-700 hover:border-blue-500/80 bg-[var(--bg)] rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
                      id="dropzone-pdf"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="application/pdf,image/*" 
                        className="hidden" 
                      />
                      <Upload size={24} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                      <p className="text-[11px] font-bold text-gray-300">Arraste ou clique para carregar</p>
                      <p className="text-[8.5px] text-gray-500">Suporta arquivos PDF ou Imagens de Slides</p>
                    </div>
                  )}

                  {uploadedFileName ? (
                    (!searchQuery || uploadedFileName.toLowerCase().includes(searchQuery.toLowerCase())) ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-1 text-left relative overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="text-[7px] font-black uppercase text-blue-400 tracking-wider">Arquivo Ativo</span>
                            <span className="text-[8px] bg-blue-500/10 text-blue-300 font-mono px-1.5 py-0.2 rounded">PDF</span>
                          </div>
                          <p className="text-[11px] font-bold text-white truncate pr-6">{uploadedFileName}</p>
                          <p className="text-[8px] text-gray-400">12 Slides processados e prontos</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedFileName('');
                              setUploadedFileUrl('');
                              setSelectedItemId(null);
                            }}
                            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                            title="Excluir"
                          >
                            <X size={12} />
                          </button>
                        </div>

                        {/* Visualizador de Miniaturas com Setas Laterais */}
                        <div className="space-y-3 bg-[var(--bg)] p-3 rounded-xl border border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visualizador de Slides</span>
                            <span className="text-[9px] font-mono text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/10">
                              Slide {pdfPreviewPage} / 12
                            </span>
                          </div>

                          {/* Main Mini-Slide Preview with Navigation Arrows */}
                          <div className="relative w-full aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-between p-2 group">
                            {/* Left Arrow Button */}
                            <button
                              type="button"
                              onClick={() => setPdfPreviewPage(prev => Math.max(1, prev - 1))}
                              disabled={pdfPreviewPage === 1}
                              className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-white hover:text-orange-400 hover:border-orange-500/30 transition-all shadow-lg z-10 ${
                                pdfPreviewPage === 1 ? 'opacity-25 cursor-not-allowed' : 'opacity-100 cursor-pointer hover:scale-105'
                              }`}
                              title="Slide Anterior"
                              id="pdf-thumb-prev-arrow"
                            >
                              <ChevronLeft size={14} strokeWidth={2.5} />
                            </button>

                            {/* Slide content representation */}
                            <div className="w-full h-full flex flex-col justify-between p-3 select-none text-center">
                              <div className="space-y-1 mt-2">
                                <div className="text-[9px] font-extrabold text-orange-400 uppercase tracking-widest">
                                  {pdfPreviewPage === 1 && "Abertura"}
                                  {pdfPreviewPage === 2 && "Objetivos"}
                                  {pdfPreviewPage === 3 && "Mercado"}
                                  {pdfPreviewPage === 4 && "Métricas"}
                                  {pdfPreviewPage === 5 && "Canais"}
                                  {pdfPreviewPage === 6 && "Concorrência"}
                                  {pdfPreviewPage === 7 && "Receita"}
                                  {pdfPreviewPage === 8 && "Custos"}
                                  {pdfPreviewPage === 9 && "Lucro"}
                                  {pdfPreviewPage === 10 && "Lançamento"}
                                  {pdfPreviewPage === 11 && "Qualidade"}
                                  {pdfPreviewPage === 12 && "Perguntas"}
                                </div>
                                <h4 className="text-[11px] font-bold text-white line-clamp-1">
                                  {pdfPreviewPage === 1 && "Estratégia de Expansão Global Vega6"}
                                  {pdfPreviewPage === 2 && "Maximização de Engajamento & Retenção"}
                                  {pdfPreviewPage === 3 && "Análise Demográfica do Público-Alvo"}
                                  {pdfPreviewPage === 4 && "Resultados e Métricas Trimestrais"}
                                  {pdfPreviewPage === 5 && "Canais de Aquisição Multicanal"}
                                  {pdfPreviewPage === 6 && "Vantagem Competitiva Exclusiva"}
                                  {pdfPreviewPage === 7 && "Escalabilidade de SaaS Recorrente"}
                                  {pdfPreviewPage === 8 && "Eficiência Operacional & Custo de Infra"}
                                  {pdfPreviewPage === 9 && "Crescimento Líquido Projetado"}
                                  {pdfPreviewPage === 10 && "Marcos de Desenvolvimento Q3-Q4"}
                                  {pdfPreviewPage === 11 && "Suporte ao Cliente & SLA de 99.9%"}
                                  {pdfPreviewPage === 12 && "Sessão de Perguntas & Respostas (Q&A)"}
                                </h4>
                              </div>

                              <div className="h-4 bg-orange-500/10 rounded-md w-full flex items-center justify-center border border-orange-500/20">
                                <span className="text-[6px] font-black tracking-widest text-orange-400 font-mono">VEGA6 CORPNET</span>
                              </div>
                            </div>

                            {/* Right Arrow Button */}
                            <button
                              type="button"
                              onClick={() => setPdfPreviewPage(prev => Math.min(12, prev + 1))}
                              disabled={pdfPreviewPage === 12}
                              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-white hover:text-orange-400 hover:border-orange-500/30 transition-all shadow-lg z-10 ${
                                pdfPreviewPage === 12 ? 'opacity-25 cursor-not-allowed' : 'opacity-100 cursor-pointer hover:scale-105'
                              }`}
                              title="Próximo Slide"
                              id="pdf-thumb-next-arrow"
                            >
                              <ChevronRight size={14} strokeWidth={2.5} />
                            </button>
                          </div>

                          {/* Horizontal Thumbnail Track */}
                          <div className="space-y-1.5">
                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block px-0.5">Selecione para saltar</span>
                            <div className="flex gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                              {Array.from({ length: 12 }).map((_, index) => {
                                const pageNum = index + 1;
                                const isSelected = pdfPreviewPage === pageNum;
                                return (
                                  <button
                                    key={pageNum}
                                    type="button"
                                    onClick={() => {
                                      setPdfPreviewPage(pageNum);
                                      setSelectedItemId('uploaded-file');
                                    }}
                                    className={`flex-shrink-0 w-11 h-11 rounded-lg border text-center flex flex-col justify-center items-center transition-all cursor-pointer relative ${
                                      isSelected 
                                        ? 'bg-orange-500/20 border-orange-500 ring-2 ring-orange-500/10' 
                                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                                    }`}
                                    title={`Ir para Página ${pageNum}`}
                                  >
                                    <span className={`text-[9px] font-mono font-black ${isSelected ? 'text-orange-400' : 'text-gray-400'}`}>
                                      {pageNum}
                                    </span>
                                    <span className="text-[5px] text-gray-600 scale-90 uppercase tracking-tighter">
                                      {pageNum === 1 && "Abert"}
                                      {pageNum === 2 && "Objet"}
                                      {pageNum === 3 && "Mercad"}
                                      {pageNum === 4 && "Métr"}
                                      {pageNum === 5 && "Canais"}
                                      {pageNum === 6 && "Conco"}
                                      {pageNum === 7 && "Recei"}
                                      {pageNum === 8 && "Custo"}
                                      {pageNum === 9 && "Lucro"}
                                      {pageNum === 10 && "Lanç"}
                                      {pageNum === 11 && "Quali"}
                                      {pageNum === 12 && "Perg"}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-[11px] font-medium">Nenhum arquivo correspondente</p>
                      </div>
                    )
                  ) : (
                    (!searchQuery || "Plano de Marketing 2026.pdf Estatísticas Consolidadas Vega6".toLowerCase().includes(searchQuery.toLowerCase())) ? (
                      <button
                        onClick={() => {
                          setUploadedFileName('Plano_de_Marketing_2026.pdf');
                          setSelectedItemId('uploaded-file');
                        }}
                        className="w-full bg-[var(--bg)] border border-slate-800 rounded-xl p-3 text-left hover:border-slate-700 transition-all cursor-pointer flex items-center gap-2.5"
                        id="btn-use-mock-pdf"
                      >
                        <FileText size={15} className="text-amber-500 shrink-0" />
                        <div>
                          <p className="text-[11px] font-bold text-white">Usar PDF de Demonstração</p>
                          <p className="text-[8px] text-gray-500">Estatísticas Consolidadas Vega6</p>
                        </div>
                      </button>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-[11px] font-medium">Nenhum arquivo correspondente</p>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Video File tab */}
              {activeTab === 'video' && (
                <div className="space-y-4">
                  {/* Dropzone Video - show if matches search or no query */}
                  {(!uploadedFileName && (!searchQuery || "Carregar arquivo Vídeo Local MP4 WebM".toLowerCase().includes(searchQuery.toLowerCase()))) && (
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={triggerFileInput}
                      className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-[var(--bg)] rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
                      id="dropzone-video"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="video/mp4,video/webm,video/ogg" 
                        className="hidden" 
                      />
                      <Video size={24} className="text-gray-500 group-hover:text-emerald-400 transition-colors" />
                      <p className="text-[11px] font-bold text-gray-300">Arraste ou clique para carregar</p>
                      <p className="text-[8.5px] text-gray-500">Suporta arquivos MP4, WebM ou OGG</p>
                    </div>
                  )}

                  {uploadedFileName ? (
                    (!searchQuery || uploadedFileName.toLowerCase().includes(searchQuery.toLowerCase())) ? (
                      <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1 text-left relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-[7px] font-black uppercase text-emerald-400 tracking-wider">Vídeo Pronto</span>
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-300 font-mono px-1.5 py-0.2 rounded">MP4</span>
                        </div>
                        <p className="text-[11px] font-bold text-white truncate pr-6">{uploadedFileName}</p>
                        <p className="text-[8px] text-gray-400">Stream dinâmico habilitado</p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedFileName('');
                            setUploadedFileUrl('');
                            setSelectedItemId(null);
                          }}
                          className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                          title="Excluir"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-[11px] font-medium">Nenhum arquivo correspondente</p>
                      </div>
                    )
                  ) : (
                    (!searchQuery || "Video_Promocional_Empresarial.mp4 Apresentação Institucional Corporativa".toLowerCase().includes(searchQuery.toLowerCase())) ? (
                      <button
                        onClick={() => {
                          setUploadedFileName('Video_Promocional_Empresarial.mp4');
                          setUploadedFileUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
                          setSelectedItemId('uploaded-file');
                        }}
                        className="w-full bg-[var(--bg)] border border-slate-800 rounded-xl p-3 text-left hover:border-slate-700 transition-all cursor-pointer flex items-center gap-2.5"
                        id="btn-use-mock-video"
                      >
                        <Play size={15} className="text-emerald-400 shrink-0" fill="currentColor" />
                        <div>
                          <p className="text-[11px] font-bold text-white">Usar Vídeo de Demonstração</p>
                          <p className="text-[8px] text-gray-500">Apresentação Institucional Corporativa</p>
                        </div>
                      </button>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-[11px] font-medium">Nenhum arquivo correspondente</p>
                      </div>
                    )
                  )}
                </div>
              )}

            </div>

          </div>

          {/* Right Panel: Live Frame Preview */}
          <div className="flex-1 p-4 flex flex-col bg-[var(--bg)] relative justify-center items-center">
            {selectedItemId ? (
              <div className="w-full h-full flex flex-col border border-slate-800 bg-[var(--bg)] rounded-xl overflow-hidden shadow-inner relative">
                
                {/* Search Bar / Top Ribbon */}
                <div className="bg-[var(--bg)] px-3 py-2 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                    <span className="text-[9px] font-bold text-slate-400 truncate max-w-[180px]">
                      {getSelectedItemName()}
                    </span>
                  </div>
                  <span className="text-[8px] font-black uppercase text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/10 shrink-0">
                    PREVIEW
                  </span>
                </div>

                {/* Simulated Monitor Display */}
                <div className="flex-1 bg-slate-950/80 p-4 flex flex-col justify-center items-center text-center relative overflow-hidden">
                  
                  {/* Chrome Tab: PwStreamer */}
                  {selectedItemId === 'tab-2' && (
                    <div className="space-y-2 w-full max-w-[200px]">
                      <div className="w-8 h-8 rounded-full bg-rose-500/15 flex items-center justify-center mx-auto text-rose-500 animate-pulse">
                        <Compass size={16} />
                      </div>
                      <p className="text-[11px] font-bold text-white leading-tight">PwStreamer - Estúdio Ao Vivo</p>
                      <p className="text-[8px] text-gray-400 leading-normal">Hospede webinars corporativos e lives profissionais em tempo real.</p>
                      <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-rose-500 rounded-full animate-pulse" />
                      </div>
                    </div>
                  )}

                  {/* Chrome Tab: YouTube */}
                  {selectedItemId === 'tab-3' && (
                    <div className="space-y-2 w-full max-w-[200px]">
                      <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center mx-auto text-white">
                        <Play size={14} fill="currentColor" />
                      </div>
                      <p className="text-[11px] font-bold text-white leading-tight">PL da Misoginia: entenda os impactos reais</p>
                      <p className="text-[8px] text-gray-400">Vega6 TV • Transmissão Ativa</p>
                    </div>
                  )}

                  {/* Chrome Tab: Gmail */}
                  {selectedItemId === 'tab-6' && (
                    <div className="w-full max-w-[220px] text-left text-[8px] space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-slate-300 border-b border-slate-900 pb-1.5">
                        <span className="flex items-center gap-1">📥 Caixa de Entrada</span>
                        <span className="text-red-400">237 Novas</span>
                      </div>
                      <div className="bg-[var(--surface)] p-1.5 rounded border border-slate-800 truncate text-slate-300">
                        <strong className="text-white">Marcos:</strong> Confirmado o webinar hoje às 20h.
                      </div>
                      <div className="bg-[var(--surface)] p-1.5 rounded border border-slate-800 truncate text-slate-300">
                        <strong className="text-white">Felipe:</strong> Adorei o layout do estúdio.
                      </div>
                    </div>
                  )}

                  {/* Window: PowerPoint */}
                  {selectedItemId === 'win-4' && (
                    <div className="space-y-2.5 w-full max-w-[220px] text-center">
                      <p className="text-[11px] font-black text-white">Powerpoint - Apresentação de Vendas.pptx</p>
                      <div className="grid grid-cols-3 gap-1 px-1">
                        <div className="h-7 bg-[var(--surface)] border border-slate-800 rounded text-[7px] flex items-center justify-center text-gray-500">Slide 1</div>
                        <div className="h-7 bg-blue-500/10 border border-blue-500 rounded text-[7px] flex items-center justify-center text-blue-400 font-bold">Slide 2</div>
                        <div className="h-7 bg-[var(--surface)] border border-slate-800 rounded text-[7px] flex items-center justify-center text-gray-500">Slide 3</div>
                      </div>
                    </div>
                  )}

                  {/* Simulated screen shares (dual monitor mockups) */}
                  {(selectedItemId === 'scr-1' || selectedItemId === 'scr-2') && (
                    <div className="space-y-2.5 w-full max-w-[220px]">
                      <div className="text-slate-400 text-2xl">🖥️</div>
                      <p className="text-[11px] font-black text-white leading-tight">
                        {selectedItemId === 'scr-1' ? 'Monitor 1 (Principal)' : 'Monitor 2 (Monitor Lateral)'}
                      </p>
                      <p className="text-[8px] text-gray-500">
                        {selectedItemId === 'scr-1' 
                          ? 'Compartilhando Área de Trabalho com todos os aplicativos.' 
                          : 'Compartilhando Janelas de chat e monitoramento lateral.'}
                      </p>
                      <div className="flex gap-1.5 justify-center">
                        <span className="text-[7px] bg-slate-800 text-gray-400 px-1.5 py-0.5 rounded font-mono">1920x1080</span>
                        <span className="text-[7px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded font-mono">60 FPS</span>
                      </div>
                    </div>
                  )}

                  {/* Custom PDF Slide preview */}
                  {activeTab === 'pdf' && (
                    <div className="w-full h-full flex flex-col justify-between p-4 bg-gradient-to-br from-[var(--bg)] to-[var(--well)] rounded-xl text-left border border-orange-500/10 overflow-hidden min-h-0">
                      <div className="flex justify-between items-center border-b border-orange-500/20 pb-2 mb-2 shrink-0">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="p-0.5 px-1.5 rounded bg-orange-600 text-white font-black text-[9px] tracking-wide uppercase shrink-0">PDF</span>
                          <span className="text-[10px] font-bold text-white truncate max-w-[120px]">{uploadedFileName || 'Plano_de_Marketing_2026.pdf'}</span>
                        </div>
                        <span className="text-[8px] text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 shrink-0 uppercase">Pág. {pdfPreviewPage} de 12</span>
                      </div>

                      <div className="flex-1 bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 flex flex-col justify-center text-center space-y-2 relative group overflow-hidden min-h-0">
                        <button 
                          type="button"
                          onClick={() => setPdfPreviewPage(prev => Math.max(1, prev - 1))}
                          disabled={pdfPreviewPage === 1}
                          className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-all shadow z-10 ${
                            pdfPreviewPage === 1 ? 'opacity-20 cursor-not-allowed' : 'opacity-100 cursor-pointer'
                          }`}
                        >
                          <ChevronLeft size={12} />
                        </button>

                        <button 
                          type="button"
                          onClick={() => setPdfPreviewPage(prev => Math.min(12, prev + 1))}
                          disabled={pdfPreviewPage === 12}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-all shadow z-10 ${
                            pdfPreviewPage === 12 ? 'opacity-20 cursor-not-allowed' : 'opacity-100 cursor-pointer'
                          }`}
                        >
                          <ChevronRight size={12} />
                        </button>

                        <div className="space-y-1 animate-in fade-in duration-150">
                          <span className="text-[7px] font-mono tracking-widest text-orange-500 font-extrabold uppercase block">
                            {pdfPreviewPage === 1 && "Apresentação de Abertura"}
                            {pdfPreviewPage === 2 && "Objetivos Estratégicos"}
                            {pdfPreviewPage === 3 && "Mercado e Demografia"}
                            {pdfPreviewPage === 4 && "Estatísticas Consolidadas"}
                            {pdfPreviewPage === 5 && "Plano de Marketing 2026"}
                            {pdfPreviewPage === 6 && "Análise da Concorrência"}
                            {pdfPreviewPage === 7 && "Modelos de Receita"}
                            {pdfPreviewPage === 8 && "Estrutura de Custos"}
                            {pdfPreviewPage === 9 && "Projeção de Lucro Semestral"}
                            {pdfPreviewPage === 10 && "Cronograma de Lançamento"}
                            {pdfPreviewPage === 11 && "Garantia de Qualidade"}
                            {pdfPreviewPage === 12 && "Conclusão & Próximos Passos"}
                          </span>

                          <h3 className="text-[11px] font-black text-white tracking-tight leading-snug">
                            {pdfPreviewPage === 1 && "Estratégia de Expansão Global Vega6"}
                            {pdfPreviewPage === 2 && "Maximização de Engajamento & Retenção"}
                            {pdfPreviewPage === 3 && "Análise Demográfica do Público-Alvo"}
                            {pdfPreviewPage === 4 && "Resultados e Métricas Trimestrais"}
                            {pdfPreviewPage === 5 && "Canais de Aquisição Multicanal"}
                            {pdfPreviewPage === 6 && "Vantagem Competitiva Exclusiva"}
                            {pdfPreviewPage === 7 && "Escalabilidade de SaaS Recorrente"}
                            {pdfPreviewPage === 8 && "Eficiência Operacional & Custo de Infra"}
                            {pdfPreviewPage === 9 && "Crescimento Líquido Projetado"}
                            {pdfPreviewPage === 10 && "Marcos de Desenvolvimento Q3-Q4"}
                            {pdfPreviewPage === 11 && "Suporte ao Cliente & SLA de 99.9%"}
                            {pdfPreviewPage === 12 && "Sessão de Perguntas & Respostas (Q&A)"}
                          </h3>

                          <p className="text-[9px] text-slate-400 max-w-md mx-auto leading-normal">
                            {pdfPreviewPage === 1 && "Bem-vindo à apresentação executiva do plano de aceleração corporativa para o ano de 2026."}
                            {pdfPreviewPage === 2 && "Foco absoluto em diminuir o Churn rate e expandir o Net Promoter Score por meio de ferramentas interativas."}
                            {pdfPreviewPage === 3 && "Identificação dos segmentos de usuários com maior propensão de conversão para planos anuais."}
                            {pdfPreviewPage === 4 && "Análise comparativa das taxas de cliques, retenção em webinars ao vivo e volume de mensagens enviadas."}
                            {pdfPreviewPage === 5 && "Lançamento de campanhas via Google Ads, tráfego orgânico, marketing de influência e parcerias com agências."}
                            {pdfPreviewPage === 6 && "Por que nossa tecnologia de transmissão de baixíssima latência é o pilar principal de retenção."}
                            {pdfPreviewPage === 7 && "Projeção de expansão de pacotes enterprise e expansão de faturamento por assentos adicionais."}
                            {pdfPreviewPage === 8 && "Redução de custos de banda através de otimização de codecs de codificação em tempo real."}
                            {pdfPreviewPage === 9 && "Visão geral de crescimento líquido estimado de 2.4M USD até o fechamento de dezembro."}
                            {pdfPreviewPage === 10 && "Fases de testes beta, auditoria de segurança de dados e implantação em servidores CDN."}
                            {pdfPreviewPage === 11 && "Monitoramento proativo e canais de comunicação direta de alta prioridade para contas VIP."}
                            {pdfPreviewPage === 12 && "Abriremos espaço para que palestrantes e convidados do estúdio tragam suas perguntas."}
                          </p>
                        </div>
                      </div>

                      <div className="text-[8px] text-gray-500 text-center font-mono uppercase tracking-wide shrink-0">
                        Navegação rápida habilitada
                      </div>
                    </div>
                  )}

                  {/* Custom Video file preview */}
                  {activeTab === 'video' && (
                    <div className="w-full h-full flex flex-col justify-between p-4 bg-gradient-to-br from-[var(--bg)] to-[var(--well)] rounded-xl text-left border border-emerald-500/10 overflow-hidden min-h-0">
                      <div className="flex justify-between items-center border-b border-emerald-500/20 pb-2 mb-2 shrink-0">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="p-0.5 px-1.5 rounded bg-emerald-600 text-white font-black text-[9px] tracking-wide uppercase shrink-0">VÍDEO</span>
                          <span className="text-[10px] font-bold text-white truncate max-w-[150px]">{uploadedFileName || 'Apresentação_Institucional.mp4'}</span>
                        </div>
                        <span className="text-[8px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0 uppercase flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                          Pré-visualização
                        </span>
                      </div>

                      {uploadedFileUrl ? (
                        <div className="flex-1 bg-black rounded-lg relative overflow-hidden flex flex-col justify-center min-h-0 group border border-slate-800">
                          {/* Video Tag */}
                          <video
                            ref={videoRef}
                            src={uploadedFileUrl}
                            muted={videoMuted}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onPlay={() => setVideoPlaying(true)}
                            onPause={() => setVideoPlaying(false)}
                            className="w-full h-full object-contain"
                            playsInline
                          />

                          {/* Elegant customized overlay bar */}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-2.5 flex flex-col gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10">
                            {/* Seek slider */}
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={0}
                                max={videoDuration || 100}
                                value={videoCurrentTime}
                                onChange={handleSeekChange}
                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                              />
                            </div>

                            {/* Control row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {/* Play/Pause Button */}
                                <button
                                  type="button"
                                  onClick={togglePlay}
                                  className="text-white hover:text-emerald-400 transition-colors p-1 bg-slate-900/60 rounded-full cursor-pointer"
                                  title={videoPlaying ? "Pausar" : "Reproduzir"}
                                >
                                  {videoPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                </button>

                                {/* Mute/Unmute Button */}
                                <button
                                  type="button"
                                  onClick={toggleMute}
                                  className="text-gray-300 hover:text-emerald-400 transition-colors p-1 cursor-pointer"
                                  title={videoMuted ? "Ativar Áudio" : "Mudar para Mudo"}
                                >
                                  {videoMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                </button>

                                {/* Time display */}
                                <span className="text-[9px] font-mono font-medium text-slate-300 select-none">
                                  {formatVideoTime(videoCurrentTime)} / {formatVideoTime(videoDuration)}
                                </span>
                              </div>

                              <span className="text-[7px] font-mono text-gray-500 uppercase tracking-widest bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                player ativo
                              </span>
                            </div>
                          </div>

                          {/* Centered play overlay on hover/paused */}
                          {!videoPlaying && (
                            <button
                              type="button"
                              onClick={togglePlay}
                              className="absolute inset-0 m-auto w-12 h-12 bg-emerald-600/90 text-white rounded-full flex items-center justify-center hover:bg-emerald-500 hover:scale-105 transition-all shadow-xl shadow-emerald-950/40 z-20 cursor-pointer"
                            >
                              <Play size={20} fill="currentColor" className="ml-0.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex-1 border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center text-center p-4 bg-slate-950/40">
                          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 text-gray-600 mb-2">
                            <Video size={16} />
                          </div>
                          <p className="text-[10px] font-bold text-gray-300">Nenhum vídeo selecionado</p>
                          <p className="text-[8px] text-gray-500 max-w-[160px] mt-1 leading-normal">Carregue um clipe local ou selecione o vídeo de demonstração ao lado para pré-visualizar.</p>
                        </div>
                      )}

                      <div className="text-[8px] text-gray-500 text-center font-mono uppercase tracking-wide shrink-0 mt-2">
                        Controles interativos habilitados
                      </div>
                    </div>
                  )}

                  {/* General Fallback for other items */}
                  {![ 'tab-2', 'tab-3', 'tab-6', 'win-4', 'scr-1', 'scr-2' ].includes(selectedItemId) && activeTab !== 'pdf' && activeTab !== 'video' && (
                    <div className="space-y-1.5">
                      <div className="text-slate-500 text-xl">🖥️</div>
                      <p className="text-[11px] font-bold text-white truncate max-w-[180px] mx-auto">{getSelectedItemName()}</p>
                      <p className="text-[8px] text-gray-500">Transmissão em tempo real ativa disponível.</p>
                    </div>
                  )}

                </div>

                {/* Simulated Bottom strip */}
                <div className="bg-[var(--bg)] px-3 py-1.5 border-t border-slate-800/80 text-[8px] text-gray-500 text-center uppercase tracking-wider font-bold">
                  Clique em Compartilhar para transmitir para o Estúdio
                </div>

              </div>
            ) : (
              <div className="w-full h-full border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-[var(--bg)]/30">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-600 border border-slate-800 mb-3">
                  <Monitor size={20} />
                </div>
                <p className="text-xs font-bold text-gray-300">Selecione uma opção ao lado</p>
                <p className="text-[10px] text-gray-500 max-w-[180px] mt-1.5 leading-normal">
                  Escolha qual guia, janela, monitor, PDF ou vídeo deseja visualizar no estúdio de gravação.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Footer controls */}
        <div className="bg-[var(--bg)] px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-5">
            {/* Audio toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer text-gray-400 hover:text-white transition-all shrink-0">
              <input
                type="checkbox"
                checked={audioShared}
                onChange={(e) => setAudioShared(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0 cursor-pointer"
                id="chk-share-audio"
              />
              <span className="text-[11px] font-bold">Compartilhar áudio da fonte</span>
            </label>

            {/* Separator */}
            <div className="h-6 w-[1.5px] bg-slate-800 hidden md:block" />

            {/* Capture Quality Options */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-gray-500 font-extrabold uppercase tracking-wider">Resolução</span>
                <div className="flex bg-[var(--bg)]/80 rounded-lg p-0.5 border border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setResolution('720p')}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                      resolution === '720p' 
                        ? 'bg-blue-600 text-white shadow' 
                        : 'text-gray-400 hover:text-slate-200'
                    }`}
                    id="opt-res-720"
                  >
                    720p
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolution('1080p')}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                      resolution === '1080p' 
                        ? 'bg-blue-600 text-white shadow' 
                        : 'text-gray-400 hover:text-slate-200'
                    }`}
                    id="opt-res-1080"
                  >
                    1080p
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-gray-500 font-extrabold uppercase tracking-wider">Taxa de Quadros</span>
                <div className="flex bg-[var(--bg)]/80 rounded-lg p-0.5 border border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setFrameRate('30fps')}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                      frameRate === '30fps' 
                        ? 'bg-blue-600 text-white shadow' 
                        : 'text-gray-400 hover:text-slate-200'
                    }`}
                    id="opt-fps-30"
                  >
                    30fps
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrameRate('60fps')}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                      frameRate === '60fps' 
                        ? 'bg-blue-600 text-white shadow' 
                        : 'text-gray-400 hover:text-slate-200'
                    }`}
                    id="opt-fps-60"
                  >
                    60fps
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800 cursor-pointer"
              id="btn-cancel-picker"
            >
              Cancelar
            </button>
            
            <button
              type="button"
              disabled={!selectedItemId}
              onClick={handleShareClick}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${
                selectedItemId 
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/10 hover:scale-[1.02] active:scale-[0.98]' 
                  : 'bg-slate-800 text-gray-500 cursor-not-allowed'
              }`}
              id="btn-confirm-share"
            >
              Compartilhar Tela
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
