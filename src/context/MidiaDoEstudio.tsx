import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useToast } from '../components/ui/Toast';
import {
  LIMITE_DA_CONTA,
  LIMITE_DE_ARQUIVOS,
  LIMITE_DO_ARQUIVO,
  MB,
  baixarArquivo,
  enviarArquivo,
  excluirArquivo,
  lerFichas,
  limparSobras,
  motivoDaFalha,
  type FichaDaMidia,
  type MotivoDaFalha,
  type TipoDeMidia,
} from '../lib/midiaDaConta';
import { apagarCopia, guardarCopia, lerCopia, manterSoAsCopias } from '../lib/midiaDoNavegador';

export type { MotivoDaFalha, TipoDeMidia };

/**
 * Como um arquivo chega a esta aba:
 * - 'abrindo': o navegador procura a cópia dele;
 * - 'na-conta': um clipe sem cópia, que só baixa quando é pedido;
 * - 'na-fila': esperando a vez de vir da conta;
 * - 'baixando': vindo;
 * - 'falhou': não veio.
 */
export type ChegadaDaMidia = 'abrindo' | 'na-conta' | 'na-fila' | 'baixando' | 'pronta' | 'falhou';

/** Uma imagem ou um clipe da biblioteca, com o endereço dele nesta aba quando já chegou. */
export interface ItemDeMidia {
  id: string;
  tipo: TipoDeMidia;
  nome: string;
  bytes: number;
  /** null até o arquivo chegar. */
  url: string | null;
  chegada: ChegadaDaMidia;
  /** De 0 a 100 enquanto baixa; null quando ainda não se sabe. */
  progresso: number | null;
}

export type TipoDeImagem = Exclude<TipoDeMidia, 'clipe'>;

/** 'lendo' até a conta responder; 'indisponivel' quando a lista não abriu. */
export type LeituraDaMidia = 'lendo' | 'pronta' | 'indisponivel';

interface MidiaDoEstudio {
  leitura: LeituraDaMidia;
  /** Por que a lista não abriu. */
  motivoDaLeitura: MotivoDaFalha | null;
  itens: Record<TipoDeMidia, ItemDeMidia[]>;
  /** Quanto a conta guarda, em bytes: a soma dos arquivos da lista. */
  uso: number;
  /** Lê de novo a lista que não abriu e baixa de novo o que não chegou. */
  tentarDeNovo: () => void;
  /** Baixa da conta um clipe que ainda não está nesta aba. */
  baixar: (id: string) => void;
  /** O endereço da imagem escolhida de cada tipo; '' para nenhuma. */
  ativas: Record<TipoDeImagem, string>;
  escolher: (tipo: TipoDeImagem, url: string) => void;
  /** Envia para a conta e só mostra o arquivo depois de ela confirmar. A imagem enviada já fica escolhida. */
  enviar: (tipo: TipoDeMidia, arquivo: File) => Promise<void>;
  /** Os envios em andamento, com o progresso de 0 a 100. */
  enviando: Partial<Record<TipoDeMidia, number>>;
  falhaDoEnvio: { tipo: TipoDeMidia; motivo: MotivoDaFalha } | null;
  /** Apaga da conta e só então tira da lista; false quando a conta não confirmou. */
  excluir: (id: string) => Promise<boolean>;
}

const Contexto = createContext<MidiaDoEstudio | null>(null);

type Ativas = Partial<Record<TipoDeImagem, string>>;

type Arquivo =
  | { estado: 'na-conta' }
  | { estado: 'na-fila' }
  | { estado: 'baixando'; progresso: number | null }
  | { estado: 'pronta'; url: string }
  | { estado: 'falhou' };

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

const emMb = (bytes: number) => `${(Math.ceil((bytes / MB) * 10) / 10).toLocaleString('pt-BR')} MB`;

/** O que a mídia guarda, somada, e quanto cabe na conta. */
export const fraseDoUso = (uso: number) => `${emMb(uso)} de ${emMb(LIMITE_DA_CONTA)}`;

/** Os formatos de cada tipo, como a tela os diz. */
const FORMATOS_DITOS: Record<TipoDeMidia, string> = {
  logo: 'PNG, JPEG, WebP ou SVG',
  fundo: 'PNG, JPEG ou WebP',
  sobreposicao: 'PNG ou WebP',
  clipe: 'MP4 ou WebM',
};

/** A frase da falha de um envio, com a saída. */
export function fraseDaFalhaDoEnvio(tipo: TipoDeMidia, motivo: MotivoDaFalha): string {
  const clipe = tipo === 'clipe';
  const oArquivo = clipe ? 'o vídeo' : 'a imagem';
  const enviado = clipe ? 'enviado' : 'enviada';
  switch (motivo) {
    case 'formato':
      return `Este formato não entra aqui. Envie ${FORMATOS_DITOS[tipo]}.`;
    case 'grande-demais':
      return `${clipe ? 'O vídeo' : 'A imagem'} passa de ${emMb(LIMITE_DO_ARQUIVO)}, o limite por arquivo. Envie um arquivo menor.`;
    case 'sem-espaco':
      return `Não há espaço na sua conta para ${oArquivo}: a mídia guarda até ${emMb(LIMITE_DA_CONTA)}. Exclua um arquivo que não usa e envie de novo.`;
    case 'muitos-arquivos':
      return `A sua conta já guarda ${LIMITE_DE_ARQUIVOS} arquivos de mídia, o limite. Exclua um que não usa e envie de novo.`;
    case 'svg-invalido':
      return 'Não deu para converter este SVG em PNG. Envie o logo em PNG.';
    case 'sem-login':
      return `Sua sessão expirou, então ${oArquivo} não foi ${enviado}. Entre de novo para enviar.`;
    case 'sem-conexao':
      return `Sem conexão com a sua conta agora, então ${oArquivo} não foi ${enviado}. Envie de novo.`;
    case 'sem-confirmacao':
      return `Não deu para confirmar que ${oArquivo} foi ${enviado}. Confira a conexão e envie de novo.`;
    default:
      return `A sua conta não aceitou ${oArquivo}. Envie de novo.`;
  }
}

/** A frase de quando a lista da mídia não abriu. */
export function fraseDaLeitura(motivo: MotivoDaFalha | null): string {
  if (motivo === 'sem-login') return 'Sua sessão expirou, então a sua mídia não abriu.';
  if (motivo === 'sem-conexao') return 'Sem conexão com a sua conta agora, então a sua mídia não abriu.';
  return 'A sua mídia não abriu.';
}

function fraseDaExclusao(motivo: MotivoDaFalha): string {
  if (motivo === 'sem-login') return 'Sua sessão expirou. Entre de novo para excluir.';
  if (motivo === 'sem-conexao') return 'Sem conexão com a sua conta agora. Tente de novo.';
  if (motivo === 'sem-confirmacao') return 'Não deu para confirmar a exclusão. Confira a conexão e tente de novo.';
  return 'A sua conta não deixou apagar o arquivo. Tente de novo.';
}

/**
 * A biblioteca de mídia do estúdio, da conta que está no estúdio. Os arquivos
 * ficam na conta (midiaDaConta), e cada conta vê só os seus, em qualquer
 * aparelho. Cada navegador guarda uma cópia do que baixou (midiaDoNavegador).
 * As imagens baixam ao abrir o estúdio; um clipe, só quando é pedido: a cópia
 * sai quando a conta sai, e baixar todos a cada entrada gastaria o tráfego do
 * plano. Antes, a biblioteca ficava só no navegador, sem nuvem.
 */
export function MidiaDoEstudioProvider({ conta, children }: { conta: string; children: ReactNode }) {
  const toast = useToast();
  const [fichas, setFichas] = useState<FichaDaMidia[]>([]);
  const [arquivos, setArquivos] = useState<Record<string, Arquivo>>({});
  const [leitura, setLeitura] = useState<LeituraDaMidia>('lendo');
  const [motivoDaLeitura, setMotivoDaLeitura] = useState<MotivoDaFalha | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [ativasIds, setAtivasIds] = useState<Ativas>(() => lerAtivas(conta));
  const [enviando, setEnviando] = useState<MidiaDoEstudio['enviando']>({});
  const [falhaDoEnvio, setFalhaDoEnvio] = useState<MidiaDoEstudio['falhaDoEnvio']>(null);

  const vivo = useRef(true);
  // O estado de agora, para as funções que não mudam a cada mudança dele
  const fichasAgora = useRef(fichas);
  fichasAgora.current = fichas;
  const arquivosAgora = useRef(arquivos);
  arquivosAgora.current = arquivos;
  const leituraAgora = useRef(leitura);
  leituraAgora.current = leitura;
  // Um endereço por arquivo, desfeito quando o estúdio fecha. Excluir não o
  // desfaz: um clipe excluído que está no programa segue lá até o próximo corte
  const enderecos = useRef(new Map<string, string>());
  // Os arquivos procurando a cópia, e os na fila ou baixando, com o que os para
  const abrindo = useRef(new Set<string>());
  const descidas = useRef(new Map<string, AbortController>());
  const fila = useRef<{ ficha: FichaDaMidia; controle: AbortController }[]>([]);
  const rodando = useRef(false);
  // Os envios em andamento: contam nos limites, para quatro envios juntos (um de
  // cada tipo) não passarem deles
  const emEnvio = useRef({ bytes: 0, arquivos: 0 });

  useEffect(() => {
    vivo.current = true;
    const mapa = enderecos.current;
    const procurando = abrindo.current;
    const emCurso = descidas.current;
    return () => {
      vivo.current = false;
      emCurso.forEach((controle) => controle.abort());
      emCurso.clear();
      procurando.clear();
      fila.current = [];
      mapa.forEach((url) => URL.revokeObjectURL(url));
      mapa.clear();
      // Montado de novo (o StrictMode faz isso em desenvolvimento), a lista é
      // lida de novo e traz tudo de novo
      setArquivos({});
    };
  }, []);

  const marcar = useCallback((id: string, arquivo: Arquivo) => {
    if (vivo.current) setArquivos((atuais) => ({ ...atuais, [id]: arquivo }));
  }, []);

  const pronta = useCallback(
    (id: string, arquivo: Blob) => {
      let url = enderecos.current.get(id);
      if (!url) {
        url = URL.createObjectURL(arquivo);
        enderecos.current.set(id, url);
      }
      marcar(id, { estado: 'pronta', url });
    },
    [marcar],
  );

  const soltar = useCallback((id: string, controle: AbortController) => {
    if (descidas.current.get(id) === controle) descidas.current.delete(id);
  }, []);

  const descer = useCallback(
    async (ficha: FichaDaMidia, controle: AbortController) => {
      try {
        marcar(ficha.id, { estado: 'baixando', progresso: null });
        const arquivo = await baixarArquivo(
          conta,
          ficha.caminho,
          (progresso) => {
            if (!controle.signal.aborted) marcar(ficha.id, { estado: 'baixando', progresso });
          },
          controle.signal,
        );
        if (controle.signal.aborted) return;
        void guardarCopia(ficha.caminho, arquivo);
        pronta(ficha.id, arquivo);
      } catch {
        // Um arquivo que não veio fica na lista como "não abriu": nada é apagado
        // por causa disso, e excluir fica com a pessoa
        if (!controle.signal.aborted) marcar(ficha.id, { estado: 'falhou' });
      } finally {
        soltar(ficha.id, controle);
      }
    },
    [conta, marcar, pronta, soltar],
  );

  // Um arquivo de cada vez, na ordem em que entraram na fila
  const rodarFila = useCallback(async () => {
    if (rodando.current) return;
    rodando.current = true;
    try {
      for (let proximo = fila.current.shift(); proximo; proximo = fila.current.shift()) {
        if (proximo.controle.signal.aborted) soltar(proximo.ficha.id, proximo.controle);
        else await descer(proximo.ficha, proximo.controle);
      }
    } finally {
      rodando.current = false;
    }
  }, [descer, soltar]);

  const enfileirar = useCallback(
    (ficha: FichaDaMidia) => {
      if (descidas.current.has(ficha.id)) return;
      const controle = new AbortController();
      descidas.current.set(ficha.id, controle);
      marcar(ficha.id, { estado: 'na-fila' });
      fila.current.push({ ficha, controle });
      void rodarFila();
    },
    [marcar, rodarFila],
  );

  useEffect(() => {
    let ativo = true;
    setLeitura('lendo');
    lerFichas(conta)
      .then((lidas) => {
        if (!ativo) return;
        setFichas(lidas);
        setMotivoDaLeitura(null);
        setLeitura('pronta');
        // Arrumação, sem esperar nem avisar: as cópias do que saiu da lista e os
        // arquivos que ficaram sem ficha
        void manterSoAsCopias(lidas.map((ficha) => ficha.caminho));
        void limparSobras(conta).catch(() => {});
      })
      .catch((erro) => {
        if (!ativo) return;
        setMotivoDaLeitura(motivoDaFalha(erro));
        setLeitura('indisponivel');
      });
    return () => {
      ativo = false;
    };
  }, [conta, tentativa]);

  // Os arquivos novos da lista: primeiro as cópias deste navegador, todas de
  // uma vez; o que não tem cópia vem da conta, as imagens já, e um clipe só
  // quando é pedido
  useEffect(() => {
    const novas = fichas.filter(
      (ficha) => !arquivosAgora.current[ficha.id] && !abrindo.current.has(ficha.id) && !descidas.current.has(ficha.id),
    );
    if (novas.length === 0) return;
    novas.forEach((ficha) => abrindo.current.add(ficha.id));
    void Promise.all(novas.map((ficha) => lerCopia(ficha.caminho))).then((copias) => {
      novas.forEach((ficha, i) => {
        if (!abrindo.current.delete(ficha.id) || !vivo.current) return;
        const copia = copias[i];
        if (copia) pronta(ficha.id, copia);
        else if (ficha.tipo === 'clipe') marcar(ficha.id, { estado: 'na-conta' });
        else enfileirar(ficha);
      });
    });
  }, [fichas, pronta, marcar, enfileirar]);

  useEffect(() => {
    try {
      localStorage.setItem(chaveDasAtivas(conta), JSON.stringify(ativasIds));
    } catch {
      // Sem armazenamento, a escolha vale só nesta visita
    }
  }, [conta, ativasIds]);

  const itens = useMemo(() => {
    const porTipo: Record<TipoDeMidia, ItemDeMidia[]> = { logo: [], fundo: [], sobreposicao: [], clipe: [] };
    fichas.forEach((ficha) => {
      const arquivo = arquivos[ficha.id];
      porTipo[ficha.tipo].push({
        id: ficha.id,
        tipo: ficha.tipo,
        nome: ficha.nome,
        bytes: ficha.bytes,
        url: arquivo?.estado === 'pronta' ? arquivo.url : null,
        chegada: arquivo?.estado ?? 'abrindo',
        progresso: arquivo?.estado === 'baixando' ? arquivo.progresso : null,
      });
    });
    return porTipo;
  }, [fichas, arquivos]);

  const uso = useMemo(() => fichas.reduce((soma, ficha) => soma + ficha.bytes, 0), [fichas]);

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

  const baixar = useCallback(
    (id: string) => {
      const ficha = fichasAgora.current.find((f) => f.id === id);
      const estado = arquivosAgora.current[id]?.estado;
      if (ficha && (estado === 'na-conta' || estado === 'falhou')) enfileirar(ficha);
    },
    [enfileirar],
  );

  const enviar = useCallback(
    async (tipo: TipoDeMidia, original: File) => {
      setFalhaDoEnvio((atual) => (atual?.tipo === tipo ? null : atual));
      setEnviando((atuais) => ({ ...atuais, [tipo]: 0 }));
      const uso = {
        bytes: fichasAgora.current.reduce((soma, ficha) => soma + ficha.bytes, 0) + emEnvio.current.bytes,
        arquivos: fichasAgora.current.length + emEnvio.current.arquivos,
      };
      emEnvio.current = { bytes: emEnvio.current.bytes + original.size, arquivos: emEnvio.current.arquivos + 1 };
      try {
        const { ficha, arquivo } = await enviarArquivo(conta, tipo, original, uso, (progresso) => {
          // O navegador avisa muitas vezes por segundo; a tela só muda com o número
          if (vivo.current) {
            setEnviando((atuais) => (atuais[tipo] === undefined || atuais[tipo] === progresso ? atuais : { ...atuais, [tipo]: progresso }));
          }
        });
        if (!vivo.current) return;
        // O arquivo que foi (um SVG vai como PNG), e não o escolhido
        void guardarCopia(ficha.caminho, arquivo);
        pronta(ficha.id, arquivo);
        setFichas((atuais) => [...atuais, ficha]);
        if (tipo !== 'clipe') setAtivasIds((atuais) => ({ ...atuais, [tipo]: ficha.id }));
        // Com a lista sendo lida (ou com a leitura recusada), lê de novo: a
        // leitura em andamento pode ter começado antes desta ficha e a tiraria da lista
        if (leituraAgora.current !== 'pronta') setTentativa((n) => n + 1);
      } catch (erro) {
        if (vivo.current) setFalhaDoEnvio({ tipo, motivo: motivoDaFalha(erro) });
      } finally {
        emEnvio.current = { bytes: emEnvio.current.bytes - original.size, arquivos: emEnvio.current.arquivos - 1 };
        if (vivo.current) {
          setEnviando((atuais) => {
            const resto = { ...atuais };
            delete resto[tipo];
            return resto;
          });
        }
      }
    },
    [conta, pronta],
  );

  const excluir = useCallback(
    async (id: string) => {
      const ficha = fichasAgora.current.find((f) => f.id === id);
      if (!ficha) return true;
      try {
        await excluirArquivo(ficha);
      } catch (erro) {
        toast.error(`Não foi possível excluir ${ficha.nome}`, fraseDaExclusao(motivoDaFalha(erro)));
        return false;
      }
      descidas.current.get(id)?.abort();
      void apagarCopia(ficha.caminho);
      setFichas((atuais) => atuais.filter((f) => f.id !== id));
      // Uma leitura em andamento pode ter começado antes da exclusão e traria o arquivo de volta
      if (leituraAgora.current === 'lendo') setTentativa((n) => n + 1);
      if (ficha.tipo !== 'clipe') {
        const tipo = ficha.tipo;
        setAtivasIds((atuais) => (atuais[tipo] === id ? { ...atuais, [tipo]: undefined } : atuais));
      }
      return true;
    },
    [toast],
  );

  const tentarDeNovo = useCallback(() => {
    if (leituraAgora.current === 'indisponivel') setTentativa((n) => n + 1);
    fichasAgora.current.forEach((ficha) => {
      if (arquivosAgora.current[ficha.id]?.estado === 'falhou') enfileirar(ficha);
    });
  }, [enfileirar]);

  const valor = useMemo<MidiaDoEstudio>(
    () => ({ leitura, motivoDaLeitura, itens, uso, tentarDeNovo, baixar, ativas, escolher, enviar, enviando, falhaDoEnvio, excluir }),
    [leitura, motivoDaLeitura, itens, uso, tentarDeNovo, baixar, ativas, escolher, enviar, enviando, falhaDoEnvio, excluir],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useMidiaDoEstudio(): MidiaDoEstudio {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useMidiaDoEstudio precisa de MidiaDoEstudioProvider');
  return contexto;
}
