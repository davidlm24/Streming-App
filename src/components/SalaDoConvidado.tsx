import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { getSupabaseBrowserClient } from '../lib/supabase';
import { MalhaDaSala, TOKEN_DE_SALA, type PessoaDaSala } from '../lib/sala/malha';
import { PwStreamLogo } from './PwStreamLogo';
import { Button } from './ui/Button';

/**
 * A página do convidado: quem recebe o link entra aqui, sem conta, como numa
 * chamada do Meet. Vê e ouve quem opera e os outros convidados, com os
 * próprios controles de microfone e câmera. O que vai ao ar (cenas, banners,
 * layouts) é do estúdio; esta página é só a conversa.
 *
 * A entrada tem duas etapas, como no Meet: primeiro a pessoa se vê, escolhe o
 * nome e libera os aparelhos; só então entra na sala. O clique de "Entrar na
 * sala" é o gesto que deixa o navegador tocar o som dos outros.
 */

type Fase = 'preparando' | 'pronto' | 'na-sala' | 'saiu';

/** Um vídeo que segue um MediaStream, sempre mudo: o som vai por <SomDe/>, para não morrer com a câmera desligada. */
function Video16x9({ stream, espelho = false }: { stream: MediaStream | null; espelho?: boolean }) {
  return (
    <video
      ref={(el) => {
        if (el && el.srcObject !== stream) el.srcObject = stream;
      }}
      autoPlay
      playsInline
      muted
      className="h-full w-full object-cover"
      style={espelho ? { transform: 'scaleX(-1)' } : undefined}
    />
  );
}

/** O som de uma pessoa, fora do vídeo: segue tocando com a câmera desligada ou sem tile. */
export function SomDe({ stream }: { stream: MediaStream | null }) {
  if (!stream) return null;
  return (
    <audio
      ref={(el) => {
        if (el && el.srcObject !== stream) el.srcObject = stream;
      }}
      autoPlay
    />
  );
}

function Azulejo({ nome, children, rodape }: { nome: string; children: React.ReactNode; rodape?: React.ReactNode }) {
  return (
    <figure className="relative aspect-video min-w-0 overflow-hidden rounded-2xl bg-[var(--stage)]">
      {children}
      <figcaption className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/55 px-2 py-0.5 text-xs text-white">
        {nome}
        {rodape}
      </figcaption>
    </figure>
  );
}

function Silhueta({ nome }: { nome: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
      <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--raise)] text-lg font-medium text-[var(--ink-hi)]">
        {nome.trim().charAt(0).toUpperCase() || '?'}
      </span>
      <span className="text-xs text-[var(--ink-lo)]">Sem imagem</span>
    </div>
  );
}

export function SalaDoConvidado({ token }: { token: string }) {
  const valido = TOKEN_DE_SALA.test(token);
  const [fase, setFase] = useState<Fase>('preparando');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mudo, setMudo] = useState(false);
  const [semVideo, setSemVideo] = useState(false);
  const [pessoas, setPessoas] = useState<PessoaDaSala[]>([]);
  const [conectada, setConectada] = useState(false);
  const malhaRef = useRef<MalhaDaSala | null>(null);

  // A câmera e o microfone, pedidos já na preparação, como no Meet
  useEffect(() => {
    if (!valido) return;
    let desta = true;
    let aberto: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: { echoCancellation: true, noiseSuppression: true } })
      .then((s) => {
        if (!desta) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        aberto = s;
        setStream(s);
        setFase('pronto');
      })
      .catch((e) => {
        console.warn('Câmera e microfone não liberados:', e);
        if (desta) setErro('A câmera e o microfone não foram liberados. Libere no cadeado da barra de endereço e recarregue a página.');
      });
    return () => {
      desta = false;
      aberto?.getTracks().forEach((t) => t.stop());
    };
  }, [valido]);

  const entrar = () => {
    if (!stream || malhaRef.current) return;
    const malha = new MalhaDaSala(getSupabaseBrowserClient(), token, crypto.randomUUID(), {
      nome: nome.trim() || 'Convidado',
      anfitriao: false,
      aoMudar: (estado) => {
        setPessoas(estado.pessoas);
        setConectada(estado.conectada);
      },
    });
    malhaRef.current = malha;
    malha.entrar();
    malha.setCamera(stream);
    setFase('na-sala');
  };

  const sairDaSala = () => {
    malhaRef.current?.sair();
    malhaRef.current = null;
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setFase('saiu');
  };
  // Fechar a aba também desmonta a malha (o canal avisa os outros pela presença)
  useEffect(() => () => malhaRef.current?.sair(), []);

  const alternarMudo = () => {
    const proximo = !mudo;
    setMudo(proximo);
    stream?.getAudioTracks().forEach((t) => (t.enabled = !proximo));
    malhaRef.current?.setEstado({ mudo: proximo });
  };
  const alternarVideo = () => {
    const proximo = !semVideo;
    setSemVideo(proximo);
    stream?.getVideoTracks().forEach((t) => (t.enabled = !proximo));
    malhaRef.current?.setEstado({ semVideo: proximo });
  };

  const anfitriao = pessoas.find((p) => p.anfitriao);
  const telas = pessoas.filter((p) => p.tela);

  if (!valido) {
    return (
      <Moldura>
        <p className="text-sm text-[var(--ink)]">Este link de sala não existe. Peça um link novo a quem convidou você.</p>
      </Moldura>
    );
  }
  if (fase === 'saiu') {
    return (
      <Moldura>
        <p className="text-sm text-[var(--ink)]">Você saiu da sala. Pode fechar esta aba, ou entrar de novo pelo mesmo link.</p>
      </Moldura>
    );
  }
  if (fase !== 'na-sala') {
    return (
      <Moldura>
        <h1 className="text-xl font-semibold text-[var(--ink-hi)]">Pronto para entrar?</h1>
        <div className="mt-4 w-full max-w-sm overflow-hidden rounded-2xl bg-[var(--stage)]">
          <div className="aspect-video">
            {stream && !semVideo ? <Video16x9 stream={stream} espelho /> : <Silhueta nome={nome || 'Você'} />}
          </div>
        </div>
        {erro ? (
          <p className="mt-4 max-w-sm text-pretty text-sm text-[var(--ink)]" role="alert">
            {erro}
          </p>
        ) : (
          <form
            className="mt-4 flex w-full max-w-sm flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              entrar();
            }}
          >
            <label className="flex flex-col gap-1 text-sm text-[var(--ink-hi)]">
              Seu nome
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={60}
                required
                autoFocus
                placeholder="Como vão chamar você"
                className="h-11 rounded-2xl border border-[var(--line-ctl)] bg-[var(--well)] px-3 text-sm text-[var(--ink-hi)] placeholder:text-[var(--ink-dim)]"
              />
            </label>
            <Button type="submit" disabled={fase !== 'pronto'} loading={fase === 'preparando'} className="w-full">
              Entrar na sala
            </Button>
          </form>
        )}
      </Moldura>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-[var(--bg)]">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-4">
        <PwStreamLogo iconSize={24} textSize="sm" monocromatico />
        <span className="truncate text-sm text-[var(--ink-lo)]">Sala de convidados</span>
        <span className="ml-auto text-xs text-[var(--ink-lo)]">
          {conectada ? (anfitriao ? `Com ${anfitriao.nome}` : 'Esperando quem convidou você abrir o estúdio…') : 'Conectando…'}
        </span>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {telas.map((p) => (
            <Azulejo key={`tela-${p.id}`} nome={`Tela de ${p.nome}`}>
              <video
                ref={(el) => {
                  if (el && el.srcObject !== p.tela) el.srcObject = p.tela;
                }}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-contain"
              />
            </Azulejo>
          ))}
          <Azulejo nome={`${nome.trim() || 'Você'} (você)`} rodape={mudo && <MicOff size={12} aria-label="mudo" />}>
            {stream && !semVideo ? <Video16x9 stream={stream} espelho /> : <Silhueta nome={nome || 'Você'} />}
          </Azulejo>
          {pessoas.map((p) => (
            <Azulejo key={p.id} nome={p.anfitriao ? `${p.nome} · anfitrião` : p.nome} rodape={p.mudo && <MicOff size={12} aria-label="mudo" />}>
              {p.camera && !p.semVideo ? <Video16x9 stream={p.camera} /> : <Silhueta nome={p.nome} />}
              <SomDe stream={p.camera} />
            </Azulejo>
          ))}
        </div>
      </main>

      <footer className="flex shrink-0 items-center justify-center gap-2 border-t border-[var(--line)] bg-[var(--surface)] p-3">
        <Button variant="ghost" aria-pressed={mudo} onClick={alternarMudo} icon={mudo ? <MicOff size={16} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />} className="min-h-11">
          {mudo ? 'Mudo' : 'Microfone'}
        </Button>
        <Button
          variant="ghost"
          aria-pressed={semVideo}
          onClick={alternarVideo}
          icon={semVideo ? <VideoOff size={16} aria-hidden="true" /> : <Video size={16} aria-hidden="true" />}
          className="min-h-11"
        >
          {semVideo ? 'Câmera desligada' : 'Câmera'}
        </Button>
        <Button variant="danger" onClick={sairDaSala} className="min-h-11">
          Sair da sala
        </Button>
      </footer>
    </div>
  );
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-[var(--bg)] px-6 text-center">
      <PwStreamLogo iconSize={28} textSize="sm" monocromatico />
      <div className="mt-6 flex w-full flex-col items-center">{children}</div>
    </div>
  );
}
