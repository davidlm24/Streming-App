import { useEffect, useState, type ReactNode } from 'react';
import { Camera, CameraOff, Check, ChevronDown, Grid3x3, Mic, MicOff, MonitorUp, MonitorX } from 'lucide-react';
import { MedidorDeAudio } from './MedidorDeAudio';
import { Button } from './ui/Button';
import { Menu, type ItemDeMenu } from './ui/Menu';

type Tipo = 'audio' | 'video';

interface BandejaDoEstudioProps {
  stream: MediaStream | null;
  mudo: boolean;
  onAlternarMicrofone: () => void;
  cameraDesligada: boolean;
  onAlternarCamera: () => void;
  compartilhando: boolean;
  onAlternarTela: () => void;
  mostrarGuias: boolean;
  onAlternarGuias: () => void;
  onEscolherDispositivo: (tipo: Tipo, deviceId: string, rotulo: string) => void;
  /** Muda quando a trilha de áudio é trocada dentro do mesmo stream: o medidor passa a ouvir a nova. */
  versaoDoAudio: number;
}

/**
 * Os aparelhos de verdade, com os nomes que o navegador dá. Os nomes só vêm
 * depois da permissão de câmera, então a lista é relida quando o stream muda.
 */
function useDispositivos(stream: MediaStream | null) {
  const [lista, setLista] = useState<MediaDeviceInfo[]>([]);
  useEffect(() => {
    const md = navigator.mediaDevices;
    if (!md?.enumerateDevices) return;
    const ler = () => md.enumerateDevices().then(setLista).catch(() => setLista([]));
    void ler();
    md.addEventListener?.('devicechange', ler);
    return () => md.removeEventListener?.('devicechange', ler);
  }, [stream]);
  return lista;
}

// Os controles da bandeja: ligado sobe um degrau na rampa, desligado fica no
// poço e em tinta baixa, e o ícone e a palavra dizem o estado. No celular a
// palavra fica só para o leitor de tela e o botão vira um quadrado de 44px:
// com ela à vista a bandeja quebrava em três linhas e tomava 165px da tela.
const CONTROLE =
  'min-h-11 max-sm:w-11 max-sm:px-0 border-[var(--line-ctl)] bg-[var(--well)] text-[var(--ink-lo)] aria-pressed:bg-[var(--raise)] aria-pressed:text-[var(--ink-hi)]';

/** A palavra do controle: à vista a partir de `sm`, só para o leitor de tela antes disso. */
const Palavra = ({ children }: { children: ReactNode }) => <span className="max-sm:sr-only">{children}</span>;

// Celulares não compartilham tela (o navegador não tem getDisplayMedia): lá o
// botão some em vez de abrir um seletor que nunca vem.
const podeCompartilharTela = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia;

function ComMenu({ children, rotulo, itens }: { children: ReactNode; rotulo: string; itens: ItemDeMenu[] }) {
  return (
    <div className="inline-flex">
      {children}
      {itens.length > 1 && (
        <Menu
          rotulo={rotulo}
          itens={itens}
          gatilho={<ChevronDown size={14} aria-hidden="true" />}
          lado="cima"
          alinhar="esquerda"
          classeDoGatilho="inline-flex min-h-11 w-9 items-center justify-center rounded-r-xl border border-l-0 border-[var(--line-ctl)] bg-[var(--well)] text-[var(--ink-lo)] transition-colors duration-150 hover:bg-[var(--raise)] hover:text-[var(--ink-hi)] cursor-pointer"
        />
      )}
    </div>
  );
}

/**
 * A bandeja do console: microfone com o medidor real, câmera, tela e guias.
 * À direita, o que ainda não existe, dito em palavras.
 *
 * Era a ControlTray: cinco microfones e cinco câmeras "Simulado" na lista
 * (o aparelho real nunca aparecia selecionado), convidar por um link que
 * não abre nada, gravar sem gravar, e o selo fixo "HD 1080P · 60 FPS ·
 * AUTO-PIPELINE SECURE".
 */
export function BandejaDoEstudio({
  stream,
  mudo,
  onAlternarMicrofone,
  cameraDesligada,
  onAlternarCamera,
  compartilhando,
  onAlternarTela,
  mostrarGuias,
  onAlternarGuias,
  onEscolherDispositivo,
  versaoDoAudio,
}: BandejaDoEstudioProps) {
  const dispositivos = useDispositivos(stream);
  const atual = (tipo: Tipo) =>
    (tipo === 'audio' ? stream?.getAudioTracks()[0] : stream?.getVideoTracks()[0])?.getSettings().deviceId;

  const itens = (tipo: Tipo): ItemDeMenu[] => {
    const tipoDoNavegador = tipo === 'audio' ? 'audioinput' : 'videoinput';
    const doTipo = dispositivos.filter((d) => d.kind === tipoDoNavegador && d.deviceId);
    const emUso = atual(tipo);
    return doTipo.map((d, i) => {
      const rotulo = d.label || `${tipo === 'audio' ? 'Microfone' : 'Câmera'} ${i + 1}`;
      return {
        rotulo,
        icone: d.deviceId === emUso ? <Check size={14} /> : <span className="inline-block size-3.5" />,
        onSelect: () => onEscolherDispositivo(tipo, d.deviceId, rotulo),
      };
    });
  };

  const itensDoMicrofone = itens('audio');
  const itensDaCamera = itens('video');

  return (
    <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--line)] bg-[var(--surface)] px-3 py-2 sm:px-4">
      <ComMenu rotulo="Escolher o microfone" itens={itensDoMicrofone}>
        <Button
          variant="ghost"
          aria-pressed={!mudo}
          onClick={onAlternarMicrofone}
          icon={mudo ? <MicOff size={16} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />}
          className={`${CONTROLE} ${itensDoMicrofone.length > 1 ? 'rounded-r-none' : ''}`}
        >
          <Palavra>{mudo ? 'Microfone mudo' : 'Microfone'}</Palavra>
        </Button>
      </ComMenu>
      <MedidorDeAudio key={versaoDoAudio} stream={stream} mudo={mudo} />

      <ComMenu rotulo="Escolher a câmera" itens={itensDaCamera}>
        <Button
          variant="ghost"
          aria-pressed={!cameraDesligada}
          onClick={onAlternarCamera}
          icon={cameraDesligada ? <CameraOff size={16} aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
          className={`${CONTROLE} ${itensDaCamera.length > 1 ? 'rounded-r-none' : ''}`}
        >
          <Palavra>{cameraDesligada ? 'Câmera desligada' : 'Câmera'}</Palavra>
        </Button>
      </ComMenu>

      {(compartilhando || podeCompartilharTela()) && (
        <Button
          variant="ghost"
          aria-pressed={compartilhando}
          onClick={onAlternarTela}
          icon={compartilhando ? <MonitorX size={16} aria-hidden="true" /> : <MonitorUp size={16} aria-hidden="true" />}
          className={CONTROLE}
        >
          <Palavra>{compartilhando ? 'Parar de compartilhar' : 'Compartilhar tela'}</Palavra>
        </Button>
      )}

      <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-[var(--line)] sm:block" />

      <Button
        variant="ghost"
        aria-pressed={mostrarGuias}
        onClick={onAlternarGuias}
        icon={<Grid3x3 size={16} aria-hidden="true" />}
        className={CONTROLE}
      >
        <Palavra>Guias</Palavra>
      </Button>

      <p className="ml-auto hidden text-pretty text-xs text-[var(--ink-lo)] lg:block">
        Transmitir para os canais ainda não está no&nbsp;ar.
      </p>
    </footer>
  );
}
