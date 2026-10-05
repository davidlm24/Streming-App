import { useCallback, useEffect, useRef, useState } from 'react';
import { ErroAoSalvar, type FalhaAoSalvar } from './dadosDaConta';

export type SituacaoDaLista = { tipo: 'salva' } | { tipo: 'salvando' } | { tipo: 'falhou'; motivo: FalhaAoSalvar };

/** O que a tela diz quando uma mudança numa lista não foi salva, com a saída. */
export const FRASE_DA_FALHA_DA_LISTA: Record<FalhaAoSalvar, string> = {
  'sem-login': 'Sua sessão expirou, então a mudança não foi salva na sua conta. Entre de novo para salvar.',
  'sem-conexao': 'Sem conexão com a sua conta agora. A mudança fica só nesta tela até salvar.',
  'sem-confirmacao': 'Não deu para confirmar que a mudança foi salva. Confira a conexão.',
  'limite-da-conta': 'Não foi possível salvar a mudança.',
  'grande-demais': 'A lista passou do limite que a conta guarda, então a mudança não foi salva. Exclua um item que não usa e tente de novo.',
  recusado: 'Não foi possível salvar a mudança.',
};

export interface ListaDaConta<T> {
  /** A lista desta tela: a da conta mais o que ainda não foi salvo. */
  itens: T[];
  situacao: SituacaoDaLista;
  /** Os itens que a conta ainda não tem como estão aqui (novos ou editados). */
  naoSalvos: ReadonlySet<string>;
  salvar: (item: T) => void;
  excluir: (id: string) => void;
  tentarDeNovo: () => void;
}

/** Igualdade de conteúdo, sem depender da ordem das chaves (o banco devolve na ordem dele). */
function assinatura(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(assinatura).join(',')}]`;
  if (valor && typeof valor === 'object') {
    const obj = valor as Record<string, unknown>;
    return `{${Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${assinatura(obj[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(valor) ?? 'null';
}

/**
 * Uma lista do estúdio guardada na conta (os banners, os tickers), pela Regra
 * do Salvo de Verdade: cada mudança grava a lista inteira e só conta como
 * salva quando o banco confirma. Enquanto não confirma, a tela segue com a
 * mudança (o item novo já vai ao preview), marca o que a conta ainda não tem
 * e, na falha, diz o motivo e oferece tentar de novo. Antes a lista era
 * gravada sem esperar resposta, e uma falha passava calada: o item sumia ao
 * recarregar.
 */
export function useListaDaConta<T extends { id: string }>(
  uid: string | undefined,
  assinar: (uid: string, aoReceber: (lista: T[]) => void) => () => void,
  gravar: (lista: T[]) => Promise<void>,
): ListaDaConta<T> {
  const [itens, setItens] = useState<T[]>([]);
  const [daConta, setDaConta] = useState<T[]>([]);
  const [situacao, setSituacao] = useState<SituacaoDaLista>({ tipo: 'salva' });
  const atual = useRef<T[]>([]);
  // Há uma mudança desta tela que o banco ainda não confirmou
  const pendente = useRef(false);
  // Só a última gravação decide a situação: uma resposta atrasada não a desfaz
  const vez = useRef(0);

  useEffect(() => {
    if (!uid) return;
    return assinar(uid, (lista) => {
      setDaConta(lista);
      // O que vem da conta não apaga uma mudança que esta tela ainda não salvou
      if (pendente.current && assinatura(lista) !== assinatura(atual.current)) return;
      pendente.current = false;
      atual.current = lista;
      setItens(lista);
      setSituacao({ tipo: 'salva' });
    });
  }, [uid, assinar]);

  const enviar = useCallback(
    async (lista: T[]) => {
      const minha = ++vez.current;
      pendente.current = true;
      atual.current = lista;
      setItens(lista);
      setSituacao({ tipo: 'salvando' });
      try {
        await gravar(lista);
        if (minha !== vez.current) return;
        pendente.current = false;
        setDaConta(lista);
        setSituacao({ tipo: 'salva' });
      } catch (err) {
        // A confirmação pode ter chegado pela assinatura antes do fim da espera
        if (minha !== vez.current || !pendente.current) return;
        setSituacao({ tipo: 'falhou', motivo: err instanceof ErroAoSalvar ? err.motivo : 'recusado' });
      }
    },
    [gravar],
  );

  const naoSalvos = new Set(
    itens
      .filter((item) => {
        const salvo = daConta.find((x) => x.id === item.id);
        return !salvo || assinatura(salvo) !== assinatura(item);
      })
      .map((item) => item.id),
  );

  return {
    itens,
    situacao,
    naoSalvos,
    salvar: (item) =>
      void enviar(
        atual.current.some((x) => x.id === item.id)
          ? atual.current.map((x) => (x.id === item.id ? item : x))
          : [...atual.current, item],
      ),
    excluir: (id) => void enviar(atual.current.filter((x) => x.id !== id)),
    tentarDeNovo: () => void enviar(atual.current),
  };
}
