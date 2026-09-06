import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, Monitor, UserPlus, Film, LogOut, Disc, 
  ChevronUp, ChevronDown, Check, Settings, Plus, Music, Star, Volume2, 
  Sparkles, AlertCircle, Camera, HelpCircle, CheckCircle2, Tv, Layout, Wifi, WifiOff, Lock
} from 'lucide-react';
import { AudioVUMeter } from './AudioVUMeter';

interface ControlTrayProps {
  isMuted: boolean;
  onToggleMute: () => void;
  isCamStopped: boolean;
  onToggleCam: () => void;
  isScreenSharing: boolean;
  onToggleScreenShare: (initialTab?: 'tab' | 'window' | 'screen' | 'pdf' | 'video') => void;
  onInviteOpen: () => void;
  isLive: boolean;
  onToggleLive: () => void;
  onExit: () => void;
  onSelectDevice?: (kind: 'audio' | 'video', deviceId: string, label: string) => void;
  isTrialExpired?: boolean;
  onRequirePlan?: (feature: 'live' | 'record') => void;
  isRecording?: boolean;
  onToggleRecording?: () => void;
  recordingTime?: number;
}

export function ControlTray({
  isMuted,
  onToggleMute,
  isCamStopped,
  onToggleCam,
  isScreenSharing,
  onToggleScreenShare,
  onInviteOpen,
  isLive,
  onToggleLive,
  onExit,
  onSelectDevice,
  isTrialExpired = false,
  onRequirePlan,
  isRecording: externalIsRecording,
  onToggleRecording: externalOnToggleRecording,
  recordingTime: externalRecordingTime
}: ControlTrayProps) {
  // Dropdown states
  const [isMicDropdownOpen, setIsMicDropdownOpen] = useState(false);
  const [isCamDropdownOpen, setIsCamDropdownOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [rtmpConnected, setRtmpConnected] = useState(true);

  // Simulate RTMP connection status for visual purposes
  useEffect(() => {
    const interval = setInterval(() => {
      setRtmpConnected(Math.random() > 0.1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Local Recording State (fallback if not controlled externally)
  const [localIsRecording, setLocalIsRecording] = useState(false);
  const [localRecordingTime, setLocalRecordingTime] = useState(0);
  const [autoRecordOnLive, setAutoRecordOnLive] = useState(true);

  const isRecording = externalIsRecording !== undefined ? externalIsRecording : localIsRecording;
  const recordingTime = externalRecordingTime !== undefined ? externalRecordingTime : localRecordingTime;

  // Auto-recording when transmission status changes to 'Ao Vivo'
  useEffect(() => {
    if (isLive && autoRecordOnLive && !isRecording && !isTrialExpired && !externalOnToggleRecording) {
      setLocalIsRecording(true);
    }
  }, [isLive, autoRecordOnLive, isTrialExpired, externalOnToggleRecording, isRecording]);

  const handleToggleRecording = () => {
    if (externalOnToggleRecording) {
      externalOnToggleRecording();
      return;
    }
    if (!localIsRecording) {
      if (isTrialExpired) {
        onRequirePlan?.('record');
        return;
      }
      setLocalIsRecording(true);
    } else {
      setLocalIsRecording(false);
    }
  };

  // Local Recording Timer Logic (only if uncontrolled)
  useEffect(() => {
    if (externalRecordingTime !== undefined) return;
    let interval: NodeJS.Timeout | null = null;
    if (localIsRecording) {
      interval = setInterval(() => {
        setLocalRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setLocalRecordingTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [localIsRecording, externalRecordingTime]);

  // Selected device states
  const [selectedMic, setSelectedMic] = useState('Microfone Padrão (Yeti Stereo Microphone)');
  const [selectedCam, setSelectedCam] = useState('c922 Pro Stream Webcam');

  const micDropdownRef = useRef<HTMLDivElement>(null);
  const camDropdownRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const formatRecordingTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // Dispatch custom window event to trigger visual recordings or floating emojis
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('studio-recording-state', {
      detail: {
        isRecording,
        formattedTime: formatRecordingTime(recordingTime)
      }
    }));
  }, [isRecording, recordingTime]);


  // Mock definitions
  const MOCK_MICS = [
    { id: 'mock-mic-1', label: 'Microfone Padrão (Yeti Stereo Microphone)', isReal: false },
    { id: 'mock-mic-2', label: 'c922 Pro Stream Webcam Mic', isReal: false },
    { id: 'mock-mic-3', label: 'Microfone Interno (Built-in Audio)', isReal: false },
    { id: 'mock-mic-4', label: 'ByteCast VirtualAudioDriver', isReal: false },
    { id: 'mock-mic-5', label: 'Auscultadores Virtuais (WebinarGG Line)', isReal: false }
  ];

  const MOCK_CAMS = [
    { id: 'mock-cam-1', label: 'c922 Pro Stream Webcam', isReal: false },
    { id: 'mock-cam-2', label: 'Logi Capture Virtual Camera', isReal: false },
    { id: 'mock-cam-3', label: 'ByteCast VirtualCamera1', isReal: false },
    { id: 'mock-cam-4', label: 'ByteCast VirtualCamera2', isReal: false },
    { id: 'mock-cam-5', label: 'ByteCast VirtualCamera3', isReal: false }
  ];

  // Device lists state
  const [micSources, setMicSources] = useState(MOCK_MICS);
  const [camSources, setCamSources] = useState(MOCK_CAMS);
  const [hasRealDevices, setHasRealDevices] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // Fetch real inputs detected by browser
  const loadDevices = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const realMics = devices
        .filter(d => d.kind === 'audioinput')
        .map((d, index) => ({
          id: d.deviceId || `real-mic-${index}`,
          label: d.label || `Microfone Real #${index + 1}`,
          isReal: true
        }));

      const realCams = devices
        .filter(d => d.kind === 'videoinput')
        .map((d, index) => ({
          id: d.deviceId || `real-cam-${index}`,
          label: d.label || `Câmera Real #${index + 1}`,
          isReal: true
        }));

      const hasPermissions = devices.some(d => d.label !== '');
      setPermissionsGranted(hasPermissions);

      if (realMics.length > 0 || realCams.length > 0) {
        setHasRealDevices(true);
        
        // Put real devices on top, followed by mock fallbacks
        const mergedMics = [
          ...realMics,
          ...MOCK_MICS
        ];
        const mergedCams = [
          ...realCams,
          ...MOCK_CAMS
        ];

        setMicSources(mergedMics);
        setCamSources(mergedCams);

        // Auto-select if selected name is not in current sources
        if (hasPermissions) {
          if (realMics.length > 0 && !mergedMics.some(m => m.label === selectedMic)) {
            setSelectedMic(realMics[0].label);
          }
          if (realCams.length > 0 && !mergedCams.some(c => c.label === selectedCam)) {
            setSelectedCam(realCams[0].label);
          }
        }
      }
    } catch (err) {
      console.warn("Could not enumerate browser media devices:", err);
    }
  };

  // Request browser camera & mic permission to unlock exact device labels
  const requestBrowserAccess = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Acesso a dispositivos de mídia não suportado neste navegador.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      // Stop stream immediately so it doesn't leave the camera on
      stream.getTracks().forEach(track => track.stop());
      
      // Reload devices
      await loadDevices();
    } catch (err) {
      console.warn("User denied permission or failed to acquire device list:", err);
      alert("Para listar seus dispositivos reais, por favor autorize o acesso à câmera e microfone no seu navegador.");
    }
  };

  useEffect(() => {
    loadDevices();

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    }

    return () => {
      if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
      }
    };
  }, []);

  // Close dropdowns if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (micDropdownRef.current && !micDropdownRef.current.contains(event.target as Node)) {
        setIsMicDropdownOpen(false);
      }
      if (camDropdownRef.current && !camDropdownRef.current.contains(event.target as Node)) {
        setIsCamDropdownOpen(false);
      }
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-[var(--bg)] sm:bg-[var(--surface)] border border-[var(--line)]/90 rounded-xl sm:rounded-2xl px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 flex items-center justify-between gap-1 sm:gap-2 md:gap-3 select-none relative shadow-xl">
      
      {/* 1. Left side: Studio Status Indicator (Hidden on small mobile screens) */}
      <div className="hidden sm:flex items-center gap-1.5 md:gap-2 shrink-0">
        <span className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full animate-pulse ${isLive ? 'bg-red-500' : 'bg-[var(--color-brand-deep)]'}`}></span>
        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-[var(--ink-lo)]">
          {isLive ? 'LIVE' : 'PRONTO'}
        </span>
      </div>

      {/* 2. Center: Operator Controls (Compact Dock layout) */}
      <div className="flex-1 flex items-center justify-between sm:justify-center gap-1 sm:gap-2 md:gap-3 py-0.5 w-full">
        
        {/* 1. STOP VIDEO BUTTON GROUP (Camera) */}
        <div className="relative shrink-0" ref={camDropdownRef}>
          <div className={`flex items-center rounded-full p-0.5 bg-[var(--well)] border ${
            isCamStopped ? 'border-red-500/70 bg-red-500/10' : 'border-[var(--line)] hover:border-[var(--line-ctl)]'
          } transition-all`}>
            {/* Main Toggle Button */}
            <button
              onClick={onToggleCam}
              className={`w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                isCamStopped 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'text-[var(--ink)] hover:text-[var(--ink-hi)]'
              }`}
              title={isCamStopped ? "Ativar Câmera" : "Desativar Câmera"}
            >
              {isCamStopped ? <VideoOff size={14} className="sm:w-4 sm:h-4" /> : <Video size={14} className="sm:w-4 sm:h-4 text-blue-400" />}
            </button>

            {/* Chevron Dropdown trigger */}
            <button
              onClick={() => setIsCamDropdownOpen(!isCamDropdownOpen)}
              className="w-3.5 h-7.5 sm:w-4 sm:h-8.5 md:w-4 md:h-9 rounded-r-full flex items-center justify-center text-[var(--ink-dim)] hover:text-[var(--ink-hi)] transition-all border-l border-[var(--line)]/80 pr-0.5 cursor-pointer"
              title="Escolher Câmera"
            >
              <ChevronUp size={9} className={`transition-transform duration-200 ${isCamDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Cam Dropdown list floating above */}
          {isCamDropdownOpen && (
            <div className="absolute bottom-12 sm:bottom-14 left-0 z-50 w-72 sm:w-80 bg-[var(--panel)] border border-[var(--line-ctl)]/80 rounded-xl shadow-2xl p-2 text-left mb-1">
              <div className="flex items-center justify-between px-2 py-1 border-b border-[var(--line)]/80 mb-1">
                <span className="text-[10px] uppercase font-bold text-[var(--ink-lo)]">Câmera</span>
                {!permissionsGranted && (
                  <button 
                    onClick={requestBrowserAccess}
                    className="text-[9px] text-[var(--color-brand)] hover:text-blue-400 font-extrabold flex items-center gap-0.5"
                  >
                    ⚡ Ativar Dispositivos Reais
                  </button>
                )}
              </div>
              <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
                {camSources.map(source => {
                  const isSelected = selectedCam === source.label;
                  return (
                    <button
                      key={source.id}
                      onClick={() => {
                        setSelectedCam(source.label);
                        setIsCamDropdownOpen(false);
                        if (onSelectDevice) {
                          onSelectDevice('video', source.id, source.label);
                        }
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                        isSelected 
                          ? 'bg-blue-500 text-white font-bold' 
                          : 'text-[var(--ink)] hover:bg-[var(--panel)]'
                      }`}
                    >
                      <span className="truncate pr-2 flex items-center gap-1.5">
                        <span className="truncate">{source.label}</span>
                        {source.isReal ? (
                          <span className="text-[7px] font-black uppercase px-1 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/20 shrink-0">Real</span>
                        ) : (
                          <span className="text-[7px] font-black uppercase px-1 py-0.5 rounded bg-[var(--panel)] text-[var(--ink-dim)] border border-[var(--line-ctl)]/40 shrink-0">Simulado</span>
                        )}
                      </span>
                      {isSelected && <Check size={12} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. CENTRALIZED MUTE BUTTON GROUP */}
        <div className="relative shrink-0" ref={micDropdownRef}>
          <div className={`flex items-center rounded-full p-0.5 bg-[var(--well)] border ${
            isMuted 
              ? 'border-red-500/70 bg-red-500/10' 
              : 'border-[var(--line)] hover:border-[var(--line-ctl)]'
          } transition-all`}>
            {/* Main Toggle Button */}
            <button
              onClick={onToggleMute}
              className={`w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                isMuted 
                  ? 'bg-red-600 text-white hover:bg-red-500 shadow-md' 
                  : 'bg-blue-500/10 text-white hover:bg-blue-500/20'
              }`}
              title={isMuted ? "Ativar Microfone" : "Mutar Microfone"}
            >
              {isMuted ? <MicOff size={14} className="sm:w-4 sm:h-4" /> : <Mic size={14} className="sm:w-4 sm:h-4 text-blue-400" />}
            </button>

            {/* Chevron Dropdown trigger */}
            <button
              onClick={() => setIsMicDropdownOpen(!isMicDropdownOpen)}
              className="w-3.5 h-7.5 sm:w-4 sm:h-8.5 md:w-4 md:h-9 rounded-r-full flex items-center justify-center text-[var(--ink-dim)] hover:text-[var(--ink-hi)] transition-all border-l border-[var(--line)]/80 pr-0.5 cursor-pointer"
              title="Escolher Microfone"
            >
              <ChevronUp size={9} className={`transition-transform duration-200 ${isMicDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Mic Dropdown list floating above */}
          {isMicDropdownOpen && (
            <div className="absolute bottom-12 sm:bottom-14 left-1/2 -translate-x-1/2 z-50 w-72 sm:w-80 bg-[var(--panel)] border border-[var(--line-ctl)]/80 rounded-xl shadow-2xl p-2 text-left mb-1">
              <div className="flex items-center justify-between px-2 py-1 border-b border-[var(--line)]/80 mb-1">
                <span className="text-[10px] uppercase font-bold text-[var(--ink-lo)]">Microfone</span>
                {!permissionsGranted && (
                  <button 
                    onClick={requestBrowserAccess}
                    className="text-[9px] text-[var(--color-brand)] hover:text-blue-400 font-extrabold flex items-center gap-0.5"
                  >
                    ⚡ Ativar Dispositivos Reais
                  </button>
                )}
              </div>

              {/* VU Meter */}
              <div className="p-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg mb-2 mx-1 select-none">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] font-black tracking-wider text-[var(--ink-lo)] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    VU METER
                  </span>
                  <span className={`text-[8px] font-extrabold px-1 rounded ${isMuted ? 'text-red-500 bg-red-500/10' : 'text-green-400 bg-green-500/10'}`}>
                    {isMuted ? 'MUDO' : 'OK'}
                  </span>
                </div>
                <AudioVUMeter isMuted={isMuted} isActive={true} simulationType="speech" />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
                {micSources.map(source => {
                  const isSelected = selectedMic === source.label;
                  return (
                    <button
                      key={source.id}
                      onClick={() => {
                        setSelectedMic(source.label);
                        setIsMicDropdownOpen(false);
                        if (onSelectDevice) {
                          onSelectDevice('audio', source.id, source.label);
                        }
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                        isSelected 
                          ? 'bg-blue-500 text-white font-bold' 
                          : 'text-[var(--ink)] hover:bg-[var(--panel)]'
                      }`}
                    >
                      <span className="truncate pr-2 flex items-center gap-1.5">
                        <span className="truncate">{source.label}</span>
                        {source.isReal ? (
                          <span className="text-[7px] font-black uppercase px-1 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/20 shrink-0">Real</span>
                        ) : (
                          <span className="text-[7px] font-black uppercase px-1 py-0.5 rounded bg-[var(--panel)] text-[var(--ink-dim)] border border-[var(--line-ctl)]/40 shrink-0">Simulado</span>
                        )}
                      </span>
                      {isSelected && <Check size={12} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. CENTRALIZED SHARE BUTTON GROUP */}
        <div className="relative shrink-0" ref={shareMenuRef}>
          <div className={`flex items-center rounded-full p-0.5 bg-[var(--well)] border ${
            isScreenSharing 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-[var(--line)] hover:border-[var(--line-ctl)]'
          } transition-all`}>
            {/* Main Toggle Button */}
            <button
              onClick={() => onToggleScreenShare()}
              className={`w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                isScreenSharing 
                  ? 'bg-[var(--color-brand-deep)] text-white shadow-md' 
                  : 'bg-blue-500/10 text-white hover:bg-blue-500/20'
              }`}
              title={isScreenSharing ? "Parar Compartilhamento" : "Escolher o que compartilhar"}
            >
              <Monitor size={14} className={isScreenSharing ? 'text-[var(--ink-hi)] sm:w-4 sm:h-4' : 'text-blue-400 sm:w-4 sm:h-4'} />
            </button>

            {/* Chevron trigger */}
            <button
              onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
              className="w-3.5 h-7.5 sm:w-4 sm:h-8.5 md:w-4 md:h-9 rounded-r-full flex items-center justify-center text-[var(--ink-dim)] hover:text-[var(--ink-hi)] transition-all border-l border-[var(--line)]/80 pr-0.5 cursor-pointer"
              title="Opções extras"
            >
              <ChevronUp size={9} className={`transition-transform duration-200 ${isShareMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Custom Share Menu Dropdown */}
          {isShareMenuOpen && (
            <div className="absolute bottom-12 sm:bottom-14 left-1/2 -translate-x-1/2 z-50 w-64 sm:w-72 bg-[var(--panel)] border border-[var(--line-ctl)]/80 rounded-xl shadow-2xl p-1.5 text-left mb-1">
              
              {/* Screen option */}
              <button
                onClick={() => {
                  onToggleScreenShare('screen');
                  setIsShareMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2 hover:bg-[var(--panel)] rounded-lg text-left text-xs font-semibold text-[var(--ink-hi)] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Monitor size={15} className="text-blue-400" />
                  <span>Screen</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">Monitor / Guia</span>
              </button>

              {/* Slides option */}
              <button
                onClick={() => {
                  onToggleScreenShare('pdf');
                  setIsShareMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2 hover:bg-[var(--panel)] rounded-lg text-left text-xs font-semibold text-[var(--ink-hi)] hover:text-[var(--ink-hi)] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Tv size={15} className="text-indigo-400" />
                  <span>Slides</span>
                  <Star size={11} fill="currentColor" className="text-amber-400 inline" />
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold">Apresentar PDF</span>
              </button>

              {/* Video option */}
              <button
                onClick={() => {
                  onToggleScreenShare('video');
                  setIsShareMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2 hover:bg-[var(--panel)] rounded-lg text-left text-xs font-semibold text-[var(--ink-hi)] hover:text-[var(--ink-hi)] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Film size={15} className="text-emerald-400" />
                  <span>Video</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">Arquivo MP4</span>
              </button>

              {/* Background Audio option */}
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('switch-studio-subtab', { detail: { tab: 'audios' } }));
                  setIsShareMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 p-2 hover:bg-[var(--panel)] rounded-lg text-left text-xs font-semibold text-[var(--ink)] hover:text-[var(--ink-hi)] transition-colors border-t border-[var(--line)] mt-1 pt-2 cursor-pointer"
              >
                <Volume2 size={15} className="text-pink-400" />
                <span>Background Audio</span>
              </button>

            </div>
          )}
        </div>

        {/* 4. INVITE GUEST BUTTON */}
        <div className="relative shrink-0">
          <button
            onClick={onInviteOpen}
            className="w-8.5 h-8.5 sm:w-9 sm:h-9 md:w-9.5 md:h-9.5 rounded-full bg-[var(--well)] hover:bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:text-[var(--ink-hi)] flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-md"
            title="Convidar Participante para o Estúdio"
          >
            <UserPlus size={14} className="sm:w-4 sm:h-4 text-[var(--ink)]" />
          </button>
        </div>

        {/* 5. RECORD BUTTON */}
        <div className={`relative flex items-center gap-1.5 bg-[var(--well)] border rounded-full px-2 sm:px-3 py-0.5 sm:py-1 shadow-md h-8.5 sm:h-9 shrink-0 ${isTrialExpired ? 'border-amber-500/30' : 'border-[var(--line)]'}`}>
          <button
            onClick={handleToggleRecording}
            className={`w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full border flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${
              isRecording 
                ? 'bg-red-600 border-red-500 text-white animate-pulse' 
                : isTrialExpired
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-transparent border-[var(--line)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:border-[var(--line-ctl)]'
            }`}
            title={isRecording ? "Parar Gravação Local" : isTrialExpired ? "Gravação restrita - Assine um plano para gravar transmissões" : "Iniciar Gravação Local"}
          >
            {isTrialExpired && !isRecording ? (
              <Lock size={11} className="text-amber-400" />
            ) : (
              <div className="relative flex items-center justify-center">
                <Disc size={13} className={isRecording ? 'animate-spin text-[var(--ink-hi)]' : ''} />
                <span className={`absolute w-1 h-1 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`}></span>
              </div>
            )}
          </button>
          <span className={`text-[9px] sm:text-[10px] font-mono font-bold tracking-wider ${isRecording ? 'text-red-500 font-extrabold' : isTrialExpired ? 'text-amber-400 font-semibold' : 'text-[var(--ink-lo)]'}`}>
            {isRecording ? formatRecordingTime(recordingTime) : isTrialExpired ? 'REC 🔒' : 'RECORD'}
          </span>
        </div>

      </div>

      {/* 3. Right side: saída + indicador de qualidade */}
      <div className="shrink-0 flex items-center gap-2 md:gap-3">
        {/* A SAÍDA. `onExit` era declarado, recebido e nunca renderizado — e a
            navegação do cabeçalho é `hidden lg:flex`, a saída dele é
            `hidden xl:flex` e o menu sanduíche é `md:hidden`. Entre 768 e
            1279 px o operador não tinha nenhuma forma de sair do estúdio a
            não ser recarregar, o que derrubava a transmissão em silêncio.
            Por isso este botão não tem breakpoint: aparece em toda largura. */}
        <button
          type="button"
          onClick={onExit}
          title="Sair do estúdio"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-[var(--line-ctl)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--raise)] active:scale-95 transition-colors cursor-pointer touch-target-btn"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Sair</span>
        </button>

        <div className="text-right hidden md:block space-y-0.5">
          <span className="text-[10px] text-[var(--ink-dim)] font-mono tracking-widest uppercase block">HD 1080P • 60 FPS</span>
          <span className="text-[9px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded uppercase tracking-wider block">AUTO-PIPELINE SECURE</span>
        </div>
      </div>

    </div>
  );
}

