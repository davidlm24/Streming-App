import { useEffect, useRef, useState } from 'react';
import { ErroDoPdf, abrirPdf, desenharPagina, type ApresentacaoAberta, type FalhaDoPdf } from './apresentacao';

/** A página que os monitores mostram: a atual quando já foi desenhada, senão a anterior, até a nova chegar. */
export interface PaginaMostrada {
  id: string;
  pagina: number;
  url: string;
}

/** Quantas páginas em volta da atual ficam desenhadas, para virar sem espera. */
const VIZINHAS = 2;

/**
 * O PDF aberto no estúdio e a página em que ele está. Desenha a atual e as
 * vizinhas, solta as de longe (cada uma é um PNG de até 1920 × 1080 na
 * memória) e, ao virar, segura a página anterior na tela até a nova ficar
 * pronta, em vez de piscar o palco vazio.
 */
export function useApresentacao() {
  const [aberta, setAberta] = useState<ApresentacaoAberta | null>(null);
  const [pagina, setPagina] = useState(1);
  const [desenhadas, setDesenhadas] = useState<Map<number, string>>(() => new Map());
  const [mostrada, setMostrada] = useState<PaginaMostrada | null>(null);
  const [abrindo, setAbrindo] = useState(false);
  const [falha, setFalha] = useState<FalhaDoPdf | null>(null);

  const abertaRef = useRef(aberta);
  abertaRef.current = aberta;
  const desenhadasRef = useRef(desenhadas);
  desenhadasRef.current = desenhadas;
  const pedidas = useRef(new Set<string>());
  // O pedido de abrir mais recente, e se o estúdio ainda está aberto: um PDF
  // que chega depois de outro pedido, ou depois de sair, é solto na hora
  const ultimoPedido = useRef(0);
  const montado = useRef(false);

  // Desenha a atual e as vizinhas que ainda não estão prontas nem pedidas
  useEffect(() => {
    if (!aberta) return;
    for (let n = pagina - 1; n <= pagina + VIZINHAS; n++) {
      if (n < 1 || n > aberta.paginas) continue;
      const chave = `${aberta.id}:${n}`;
      if (desenhadasRef.current.has(n) || pedidas.current.has(chave)) continue;
      pedidas.current.add(chave);
      desenharPagina(aberta.documento, n)
        .then((url) => {
          // O PDF foi fechado ou trocado enquanto a página era desenhada
          if (abertaRef.current?.id !== aberta.id) return URL.revokeObjectURL(url);
          setDesenhadas((atual) => new Map(atual).set(n, url));
        })
        .catch(() => {
          if (abertaRef.current?.id === aberta.id && n === pagina) setFalha('ilegivel');
        })
        .finally(() => pedidas.current.delete(chave));
    }
  }, [aberta, pagina]);

  // A atual chegou: os monitores passam a mostrá-la
  useEffect(() => {
    const url = desenhadas.get(pagina);
    if (aberta && url) setMostrada({ id: aberta.id, pagina, url });
  }, [aberta, desenhadas, pagina]);

  // Solta as de longe, menos a que ainda está na tela
  useEffect(() => {
    const longe = [...desenhadas.keys()].filter((n) => (n < pagina - 1 || n > pagina + VIZINHAS) && n !== mostrada?.pagina);
    if (longe.length === 0) return;
    setDesenhadas((atual) => {
      const restantes = new Map(atual);
      for (const n of longe) {
        const url = restantes.get(n);
        if (url) URL.revokeObjectURL(url);
        restantes.delete(n);
      }
      return restantes;
    });
  }, [desenhadas, pagina, mostrada]);

  const soltarTudo = () => {
    for (const url of desenhadasRef.current.values()) URL.revokeObjectURL(url);
    abertaRef.current?.soltar();
  };

  // Ao sair do estúdio, o PDF e as páginas saem da memória, e uma página que
  // ainda estava sendo desenhada é solta quando chega (abertaRef nulo)
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      soltarTudo();
      abertaRef.current = null;
    };
  }, []);

  const fechar = () => {
    soltarTudo();
    abertaRef.current = null;
    setAberta(null);
    setDesenhadas(new Map());
    setMostrada(null);
    setPagina(1);
    setFalha(null);
  };

  /** Abre o PDF e diz se ele entrou: falso numa falha ou num pedido que outro passou. */
  const abrir = async (arquivo: File): Promise<boolean> => {
    const pedido = ++ultimoPedido.current;
    setAbrindo(true);
    setFalha(null);
    try {
      const nova = await abrirPdf(arquivo);
      if (!montado.current || pedido !== ultimoPedido.current) {
        nova.soltar();
        return false;
      }
      fechar();
      setAberta(nova);
      return true;
    } catch (err) {
      if (montado.current && pedido === ultimoPedido.current) setFalha(err instanceof ErroDoPdf ? err.motivo : 'ilegivel');
      return false;
    } finally {
      if (montado.current && pedido === ultimoPedido.current) setAbrindo(false);
    }
  };

  const irPara = (numero: number) => {
    if (!aberta) return;
    setFalha(null);
    setPagina(Math.min(aberta.paginas, Math.max(1, numero)));
  };

  return { aberta, pagina, mostrada, abrindo, falha, abrir, fechar, irPara };
}

export type Apresentacao = ReturnType<typeof useApresentacao>;
