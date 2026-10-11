import { MicOff, UserPlus } from 'lucide-react';
import type { PessoaDaSala } from '../lib/sala/malha';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { Button } from './ui/Button';

/**
 * O trilho da sala, na borda esquerda do console (como a coluna das
 * referências, mas de GENTE): quem está na chamada, começando por quem
 * opera. Clicar num convidado o põe no palco ou o tira — a conversa continua
 * de qualquer jeito; palco é quem entra nas cenas. Só existe em telas
 * largas: no celular as pessoas moram na ferramenta Sala.
 */
interface TrilhoDaSalaProps {
  /** A câmera de quem opera, para o tile "Você". */
  localStream: MediaStream | null;
  cameraDesligada: boolean;
  mudo: boolean;
  pessoas: PessoaDaSala[];
  noPalco: string[];
  /** Pessoas no palco no máximo, contando quem opera (o plano manda). */
  limiteDePessoas: number;
  onPalco: (id: string, entra: boolean) => void;
  /** Copia o link da sala. */
  onConvidar: () => void;
  /** Abre a ferramenta Sala (link novo, detalhes). */
  onAbrirSala: () => void;
}

function Miniatura({ stream, semVideo, inicial }: { stream: MediaStream | null; semVideo: boolean; inicial: string }) {
  return (
    <span className="block aspect-video w-full overflow-hidden rounded-lg bg-[var(--stage)]">
      {stream && !semVideo ? (
        <video
          ref={(el) => {
            if (el && el.srcObject !== stream) el.srcObject = stream;
          }}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true" className="flex h-full w-full items-center justify-center text-sm font-medium text-[var(--ink-lo)]">
          {inicial}
        </span>
      )}
    </span>
  );
}

export function TrilhoDaSala({
  localStream,
  cameraDesligada,
  mudo,
  pessoas,
  noPalco,
  limiteDePessoas,
  onPalco,
  onConvidar,
  onAbrirSala,
}: TrilhoDaSalaProps) {
  const lugares = Math.max(0, limiteDePessoas - 1 - noPalco.length);
  return (
    <aside aria-label="Pessoas na chamada" className="hidden w-36 min-h-0 shrink-0 flex-col gap-3 overflow-y-auto border-r border-[var(--line)] bg-[var(--surface)] p-2.5 lg:flex">
      <Button variant="ghost" size="sm" icon={<UserPlus size={14} aria-hidden="true" />} onClick={onConvidar} className="w-full">
        Convidar
      </Button>

      {/* Quem opera abre a fila: a câmera dele está sempre nas cenas */}
      <div>
        <Miniatura stream={localStream} semVideo={cameraDesligada} inicial="V" />
        <p className="mt-1 flex items-center gap-1 text-xs text-[var(--ink)]">
          <span className="truncate">Você</span>
          {mudo && <MicOff size={12} aria-label="mudo" className="shrink-0 text-[var(--ink-lo)]" />}
        </p>
      </div>

      {pessoas.length === 0 ? (
        <p className="text-pretty text-xs text-[var(--ink-lo)]">Convide alguém: quem abrir o link entra aqui.</p>
      ) : (
        <ul className="space-y-3">
          {pessoas.map((p) => {
            const estaNoPalco = noPalco.includes(p.id);
            const semLugar = !estaNoPalco && lugares === 0;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onPalco(p.id, !estaNoPalco)}
                  disabled={semLugar}
                  aria-pressed={estaNoPalco}
                  title={
                    semLugar
                      ? `O palco está cheio: o plano põe até ${limiteDePessoas} pessoas na tela, contando você.`
                      : estaNoPalco
                        ? `${p.nome} está no palco — clique para tirar`
                        : `Pôr ${p.nome} no palco (entra nas cenas com convidados)`
                  }
                  className={`relative block w-full rounded-xl p-1 text-left transition-colors duration-150 ${
                    estaNoPalco ? 'bg-[var(--raise)] shadow-[var(--shadow-ctl)]' : 'hover:bg-[var(--panel)]'
                  } ${semLugar ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <Miniatura stream={p.camera} semVideo={!!p.semVideo} inicial={p.nome.charAt(0).toUpperCase()} />
                  <span className="mt-1 flex items-center gap-1 text-xs text-[var(--ink)]">
                    <span className="truncate">{p.nome}</span>
                    {p.mudo && <MicOff size={12} aria-label="mudo" className="shrink-0 text-[var(--ink-lo)]" />}
                  </span>
                  <span className="block text-xs text-[var(--ink-lo)]">{estaNoPalco ? 'No palco' : 'Na conversa'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <AcaoDeTexto tamanho="xs" sublinhada onClick={onAbrirSala} className="mt-auto min-h-8 shrink-0">
        Abrir a sala
      </AcaoDeTexto>
    </aside>
  );
}
