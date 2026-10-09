import { useEffect, useState, type ReactNode } from 'react';
import { Camera, CameraOff, Check, ChevronDown, Circle, Grid3x3, Mic, MicOff, MonitorUp, MonitorX, Square } from 'lucide-react';
import { formatarTempo } from '../lib/graficos';
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
  /** A gravação local do programa: um .webm que baixa neste computador. */
  gravando: boolean;
  inicioDaGravacao: number | null;
  /** O navegador não liberou o áudio: o arquivo sai só com a imagem, e o tempo diz isso. */
  gravandoSemSom: boolean;
  onAlternarGravacao: () => void;
  /** A frase do ar, à direita a partir de `lg`: o que está (ou não) sendo transmitido. */
  fraseDoAr: ReactNode;
}

/** O tempo gravado até agora, no pulso da bandeja (mono, como a leitura do medidor), e "sem som" quando for o caso. */
function TempoDeGravacao({ inicioEm, semSom }: { inicioEm: number; semSom: boolean }) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="text-xs text-[var(--ink-lo)] max-sm:hidden">
      <span className="font-mono tabular-nums">{formatarTempo(Math.floor((agora - inicioEm) / 1000))}</span>
      {semSom && <> · sem&nbsp;som</>}
    </span>
  );
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

// Os controles sob o programa: ligado sobe um degrau na rampa E ganha a
// sombra de controle (afundado = desligado, elevado = ligado — a altura diz
// o estado junto do ícone). Como nas referências, são quadrados de 44px só
// com o ícone: a palavra vai no title e no leitor de tela, e a fileira cabe
// numa linha na largura do programa, sem empurrar o preview para baixo.
const CONTROLE =
  'min-h-11 w-11 justify-center px-0 border-transparent bg-[var(--well)] text-[var(--ink-lo)] shadow-none hover:text-[var(--ink-hi)] aria-pressed:bg-[var(--raise)] aria-pressed:text-[var(--ink-hi)] aria-pressed:shadow-[var(--shadow-ctl)]';

/** A palavra do controle: para o leitor de tela (o olho tem o ícone, o estado e o title). */
const Palavra = ({ children }: { children: ReactNode }) => <span className="sr-only">{children}</span>;

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
          classeDoGatilho="inline-flex min-h-11 w-9 items-center justify-center rounded-r-xl border-l border-[var(--line)] bg-[var(--well)] text-[var(--ink-lo)] transition-colors duration-150 hover:bg-[var(--raise)] hover:text-[var(--ink-hi)] cursor-pointer"
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
  gravando,
  inicioDaGravacao,
  gravandoSemSom,
  onAlternarGravacao,
  fraseDoAr,
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
    // A fileira das referências: sob o monitor de programa, sem moldura própria —
    // a mesa é o fundo, e cada controle fala por preenchimento tonal
    <div role="group" aria-label="Captura e gravação" className="flex flex-wrap items-center gap-2">
      <ComMenu rotulo="Escolher o microfone" itens={itensDoMicrofone}>
        <Button
          variant="ghost"
          aria-pressed={!mudo}
          title={mudo ? 'Microfone mudo' : 'Microfone'}
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
          title={cameraDesligada ? 'Câmera desligada' : 'Câmera'}
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
        title={compartilhando ? 'Parar de compartilhar' : 'Compartilhar tela'}
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
        title="Guias"
        onClick={onAlternarGuias}
        icon={<Grid3x3 size={16} aria-hidden="true" />}
        className={CONTROLE}
      >
        <Palavra>Guias</Palavra>
      </Button>

      {/* Gravar é real: o programa composto vira um .webm baixado. O tempo ao
          lado diz que anda; o estado mora no aria-pressed e na palavra. */}
      <Button
        variant="ghost"
        aria-pressed={gravando}
        onClick={onAlternarGravacao}
        title={gravando ? 'Parar a gravação' : 'Gravar o programa num arquivo .webm, neste computador'}
        icon={gravando ? <Square size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
        className={CONTROLE}
      >
        <Palavra>{gravando ? 'Parar a gravação' : 'Gravar'}</Palavra>
      </Button>
      {gravando && inicioDaGravacao !== null && <TempoDeGravacao inicioEm={inicioDaGravacao} semSom={gravandoSemSom} />}

      <p className="ml-auto hidden min-w-0 flex-1 truncate text-right text-xs text-[var(--ink-lo)] lg:block" title={typeof fraseDoAr === 'string' ? fraseDoAr : undefined}>{fraseDoAr}</p>
    </div>
  );
}
