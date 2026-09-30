import { useCallback, useEffect, useRef, useState } from 'react';
import { ErroAoSalvar, lerRoteiro, salvarRoteiro, type FalhaAoSalvar } from './dadosDaConta';

export type SituacaoDoRoteiro =
  | { tipo: 'carregando' }
  | { tipo: 'salvo'; em: string | null }
  | { tipo: 'alterado' }
  | { tipo: 'salvando' }
  /** `aoLer`: o roteiro salvo não abriu. Nada é salvo até ele abrir, para não sobrescrever o que está na conta. */
  | { tipo: 'falhou'; motivo: FalhaAoSalvar; aoLer: boolean };

/** O que a tela diz quando o roteiro não foi salvo, com a saída. */
export const FRASE_DA_FALHA: Record<FalhaAoSalvar, string> = {
  'sem-login': 'Sua sessão expirou, então o roteiro não foi salvo. Entre de novo para salvar.',
  'sem-conexao': 'Sem conexão com a sua conta agora. O roteiro fica nesta tela até salvar.',
  'sem-confirmacao': 'Não deu para confirmar que o roteiro foi salvo. Confira a conexão.',
  recusado: 'Não foi possível salvar o roteiro.',
};

/** O que a tela diz quando o roteiro salvo não abriu. */
export const FRASE_DA_FALHA_AO_LER: Record<FalhaAoSalvar, string> = {
  'sem-login': 'Sua sessão expirou, então o roteiro salvo não abriu. O que você escrever fica só nesta tela.',
  'sem-conexao': 'Sem conexão com a sua conta agora, então o roteiro salvo não abriu. O que você escrever fica só nesta tela.',
  'sem-confirmacao': 'O roteiro salvo não abriu. O que você escrever fica só nesta tela.',
  recusado: 'O roteiro salvo não abriu. O que você escrever fica só nesta tela.',
};

/** Quanto esperar depois da última tecla para salvar. */
const ESPERA_PARA_SALVAR_MS = 1200;

/**
 * O roteiro e as notas de um webinar (ou o geral), lidos da conta e salvos
 * nela pouco depois de cada alteração. "Salvo" só aparece depois de o banco
 * confirmar (Regra do Salvo de Verdade). Antes o roteiro não era salvo em
 * lugar nenhum e já abria com um texto de boas-vindas pronto.
 */
export function useRoteiro(id: string) {
  const [texto, setTextoLocal] = useState('');
  const [notas, setNotasLocal] = useState('');
  const [situacao, setSituacao] = useState<SituacaoDoRoteiro>({ tipo: 'carregando' });
  const [carga, setCarga] = useState(0);
  const atual = useRef({ texto: '', notas: '' });
  const abriu = useRef(false);
  const espera = useRef<number | null>(null);

  useEffect(() => {
    let ativo = true;
    abriu.current = false;
    setSituacao({ tipo: 'carregando' });
    lerRoteiro(id)
      .then((salvo) => {
        if (!ativo) return;
        abriu.current = true;
        atual.current = { texto: salvo?.texto ?? '', notas: salvo?.notas ?? '' };
        setTextoLocal(atual.current.texto);
        setNotasLocal(atual.current.notas);
        setSituacao({ tipo: 'salvo', em: salvo?.atualizadoEm ?? null });
      })
      .catch((err) => {
        if (!ativo) return;
        setSituacao({ tipo: 'falhou', motivo: err instanceof ErroAoSalvar ? err.motivo : 'recusado', aoLer: true });
      });
    return () => {
      ativo = false;
      // Fechar o estúdio (ou trocar de roteiro) antes da pausa não perde a última edição
      if (espera.current) {
        window.clearTimeout(espera.current);
        espera.current = null;
        if (abriu.current) void salvarRoteiro(id, atual.current).catch(() => {});
      }
    };
  }, [id, carga]);

  const salvarAgora = useCallback(async () => {
    if (espera.current) window.clearTimeout(espera.current);
    espera.current = null;
    if (!abriu.current) return;
    setSituacao({ tipo: 'salvando' });
    // Uma edição feita enquanto este salvamento corria tem o seu próprio: a
    // resposta deste não diz "salvo" (nem "falhou") por cima dela
    const enviado = atual.current;
    try {
      await salvarRoteiro(id, enviado);
      if (atual.current !== enviado) return;
      setSituacao({ tipo: 'salvo', em: new Date().toISOString() });
    } catch (err) {
      if (atual.current !== enviado) return;
      setSituacao({ tipo: 'falhou', motivo: err instanceof ErroAoSalvar ? err.motivo : 'recusado', aoLer: false });
    }
  }, [id]);

  const alterar = (parcial: Partial<{ texto: string; notas: string }>) => {
    atual.current = { ...atual.current, ...parcial };
    if (parcial.texto !== undefined) setTextoLocal(parcial.texto);
    if (parcial.notas !== undefined) setNotasLocal(parcial.notas);
    if (!abriu.current) return;
    setSituacao({ tipo: 'alterado' });
    if (espera.current) window.clearTimeout(espera.current);
    espera.current = window.setTimeout(() => void salvarAgora(), ESPERA_PARA_SALVAR_MS);
  };

  return {
    texto,
    notas,
    situacao,
    setTexto: (valor: string) => alterar({ texto: valor }),
    setNotas: (valor: string) => alterar({ notas: valor }),
    /** Depois de uma falha: relê o salvo (se ele não abriu) ou salva de novo. */
    tentarDeNovo: () => (abriu.current ? void salvarAgora() : setCarga((c) => c + 1)),
  };
}

export type Roteiro = ReturnType<typeof useRoteiro>;
