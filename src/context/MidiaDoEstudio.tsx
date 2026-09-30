import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useToast } from '../components/ui/Toast';
import {
  apagarMidia,
  guardarMidia,
  lerMidiaDaConta,
  motivoDaFalha,
  type MidiaGuardada,
  type MotivoDaFalha,
  type TipoDeMidia,
} from '../lib/midiaDoNavegador';

export type { MotivoDaFalha, TipoDeMidia };

/** Uma imagem ou um clipe da biblioteca, com o endereço dele nesta aba. */
export interface ItemDeMidia {
  id: string;
  tipo: TipoDeMidia;
  nome: string;
  url: string;
}

export type TipoDeImagem = Exclude<TipoDeMidia, 'clipe'>;

/** 'lendo' até o navegador responder; 'indisponivel' quando ele não deixa abrir a biblioteca. */
export type LeituraDaMidia = 'lendo' | 'pronta' | 'indisponivel';

interface MidiaDoEstudio {
  leitura: LeituraDaMidia;
  lerDeNovo: () => void;
  itens: Record<TipoDeMidia, ItemDeMidia[]>;
  /** O endereço da imagem escolhida de cada tipo; '' para nenhuma. */
  ativas: Record<TipoDeImagem, string>;
  escolher: (tipo: TipoDeImagem, url: string) => void;
  /** Guarda o arquivo e só o mostra depois de o navegador confirmar. A imagem enviada já fica escolhida. */
  enviar: (tipo: TipoDeMidia, arquivo: File) => Promise<void>;
  /** Os tipos com um envio em andamento. */
  enviando: TipoDeMidia[];
  falhaDoEnvio: { tipo: TipoDeMidia; motivo: MotivoDaFalha } | null;
  /** Apaga do navegador e só então tira da lista; false quando o navegador não deixou. */
  excluir: (id: string) => Promise<boolean>;
}

const Contexto = createContext<MidiaDoEstudio | null>(null);

type Ativas = Partial<Record<TipoDeImagem, string>>;

// A escolha de cada tipo, pelo id, por conta. O endereço do arquivo muda a cada
// visita, então a escolha não pode ser guardada por ele
const chaveDasAtivas = (conta: string) => `pw_midia_ativa_${conta}`;

function lerAtivas(conta: string): Ativas {
  try {
    const salvas = JSON.parse(localStorage.getItem(chaveDasAtivas(conta)) ?? '{}');
    return salvas && typeof salvas === 'object' ? salvas : {};
  } catch {
    return {};
  }
}

const semExtensao = (nome: string) => nome.replace(/\.[^/.]+$/, '') || nome;

/** A frase da falha de um envio, com a saída. */
export function fraseDaFalhaDoEnvio(tipo: TipoDeMidia, motivo: MotivoDaFalha): string {
  const arquivo = tipo === 'clipe' ? 'o vídeo' : 'a imagem';
  return motivo === 'sem-espaco'
    ? `${tipo === 'clipe' ? 'O vídeo' : 'A imagem'} não coube no navegador, que está sem espaço. Exclua um clipe que não usa e envie de novo.`
    : `O navegador não deixou guardar ${arquivo}. Envie de novo; se continuar, confira se ele permite que este site guarde dados.`;
}

/**
 * A biblioteca de mídia do estúdio, da conta que está no estúdio. Os arquivos
 * ficam neste navegador (midiaDoNavegador), e cada conta vê só os seus. Antes,
 * a biblioteca ficava no localStorage sem dono, e quem entrasse depois no mesmo
 * navegador via a mídia de quem saiu.
 */
export function MidiaDoEstudioProvider({ conta, children }: { conta: string; children: ReactNode }) {
  const toast = useToast();
  const [guardadas, setGuardadas] = useState<ItemDeMidia[]>([]);
  const [leitura, setLeitura] = useState<LeituraDaMidia>('lendo');
  const [tentativa, setTentativa] = useState(0);
  const [ativasIds, setAtivasIds] = useState<Ativas>(() => lerAtivas(conta));
  const [enviando, setEnviando] = useState<TipoDeMidia[]>([]);
  const [falhaDoEnvio, setFalhaDoEnvio] = useState<MidiaDoEstudio['falhaDoEnvio']>(null);

  // Um endereço por arquivo, desfeito quando o estúdio fecha. Excluir não o
  // desfaz: um clipe excluído que está no programa segue lá até o próximo corte
  const enderecos = useRef(new Map<string, string>());
  const enderecoDe = useCallback((midia: MidiaGuardada) => {
    let url = enderecos.current.get(midia.id);
    if (!url) {
      url = URL.createObjectURL(midia.arquivo);
      enderecos.current.set(midia.id, url);
    }
    return url;
  }, []);

  useEffect(() => {
    const mapa = enderecos.current;
    return () => {
      mapa.forEach((url) => URL.revokeObjectURL(url));
      mapa.clear();
    };
  }, []);

  useEffect(() => {
    let vivo = true;
    setLeitura('lendo');
    lerMidiaDaConta(conta)
      .then((lidas) => {
        if (!vivo) return;
        setGuardadas(lidas.map((m) => ({ id: m.id, tipo: m.tipo, nome: m.nome, url: enderecoDe(m) })));
        setLeitura('pronta');
      })
      .catch(() => {
        if (vivo) setLeitura('indisponivel');
      });
    return () => {
      vivo = false;
    };
  }, [conta, tentativa, enderecoDe]);

  useEffect(() => {
    try {
      localStorage.setItem(chaveDasAtivas(conta), JSON.stringify(ativasIds));
    } catch {
      // Sem armazenamento, a escolha vale só nesta visita
    }
  }, [conta, ativasIds]);

  const itens = useMemo(() => {
    const porTipo: Record<TipoDeMidia, ItemDeMidia[]> = { logo: [], fundo: [], sobreposicao: [], clipe: [] };
    guardadas.forEach((item) => porTipo[item.tipo]?.push(item));
    return porTipo;
  }, [guardadas]);

  const ativas = useMemo(() => {
    const endereco = (tipo: TipoDeImagem) => itens[tipo].find((i) => i.id === ativasIds[tipo])?.url ?? '';
    return { logo: endereco('logo'), fundo: endereco('fundo'), sobreposicao: endereco('sobreposicao') };
  }, [itens, ativasIds]);

  const escolher = useCallback(
    (tipo: TipoDeImagem, url: string) => {
      const id = url ? itens[tipo].find((i) => i.url === url)?.id : undefined;
      setAtivasIds((atuais) => ({ ...atuais, [tipo]: id }));
    },
    [itens],
  );

  const enviar = useCallback(
    async (tipo: TipoDeMidia, arquivo: File) => {
      setEnviando((atuais) => [...atuais, tipo]);
      setFalhaDoEnvio((atual) => (atual?.tipo === tipo ? null : atual));
      const midia: MidiaGuardada = {
        conta,
        id: `${tipo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        tipo,
        nome: semExtensao(arquivo.name),
        guardadaEm: new Date().toISOString(),
        arquivo,
      };
      try {
        await guardarMidia(midia);
        setGuardadas((atuais) => [...atuais, { id: midia.id, tipo, nome: midia.nome, url: enderecoDe(midia) }]);
        if (tipo !== 'clipe') setAtivasIds((atuais) => ({ ...atuais, [tipo]: midia.id }));
        // Com a biblioteca ainda sem ler (ou com a leitura recusada), lê de novo: a
        // leitura em andamento pode ter começado antes deste arquivo e o apagaria da lista
        if (leitura !== 'pronta') setTentativa((n) => n + 1);
      } catch (erro) {
        setFalhaDoEnvio({ tipo, motivo: motivoDaFalha(erro) });
      } finally {
        setEnviando((atuais) => {
          const i = atuais.indexOf(tipo);
          return i < 0 ? atuais : [...atuais.slice(0, i), ...atuais.slice(i + 1)];
        });
      }
    },
    [conta, enderecoDe, leitura],
  );

  const excluir = useCallback(
    async (id: string) => {
      const item = guardadas.find((i) => i.id === id);
      if (!item) return true;
      try {
        await apagarMidia(conta, id);
      } catch {
        toast.error(`Não foi possível excluir ${item.nome}`, 'O navegador não deixou apagar o arquivo. Tente de novo.');
        return false;
      }
      setGuardadas((atuais) => atuais.filter((i) => i.id !== id));
      if (item.tipo !== 'clipe') {
        const tipo = item.tipo;
        setAtivasIds((atuais) => (atuais[tipo] === id ? { ...atuais, [tipo]: undefined } : atuais));
      }
      return true;
    },
    [conta, guardadas, toast],
  );

  const lerDeNovo = useCallback(() => setTentativa((n) => n + 1), []);

  const valor = useMemo<MidiaDoEstudio>(
    () => ({ leitura, lerDeNovo, itens, ativas, escolher, enviar, enviando, falhaDoEnvio, excluir }),
    [leitura, lerDeNovo, itens, ativas, escolher, enviar, enviando, falhaDoEnvio, excluir],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useMidiaDoEstudio(): MidiaDoEstudio {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useMidiaDoEstudio precisa de MidiaDoEstudioProvider');
  return contexto;
}
