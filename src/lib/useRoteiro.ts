import { useCallback, useEffect, useRef, useState } from 'react';
import { ErroAoSalvar, lerRoteiro, salvarRoteiro, type FalhaAoSalvar } from './dadosDaConta';
import {
  LIMITE_DAS_NOTAS_DO_ROTEIRO,
  LIMITE_DO_TEXTO_DO_ROTEIRO,
  LIMITE_DOS_ROTEIROS_DA_CONTA,
  pontosDeCodigo,
} from './limitesDaConta';

const emMb = (bytes: number) => `${bytes / 1_048_576} MB`;

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
  // O teto é a soma de todos os roteiros da conta, e não deste: a saída é
  // apagar texto de outro, e dizer só "passou do limite" mandaria cortar o
  // roteiro certo
  'limite-da-conta': `Os roteiros da sua conta já somam ${emMb(LIMITE_DOS_ROTEIROS_DA_CONTA)} de texto, o limite, então este não foi salvo. Apague texto de um roteiro que não usa.`,
  'grande-demais': `Este roteiro passou do limite (${LIMITE_DO_TEXTO_DO_ROTEIRO.toLocaleString('pt-BR')} caracteres no texto e ${LIMITE_DAS_NOTAS_DO_ROTEIRO.toLocaleString('pt-BR')} nas notas), então não foi salvo. Corte um trecho.`,
  recusado: 'Não foi possível salvar o roteiro.',
};

/** O que a tela diz quando o roteiro salvo não abriu. */
export const FRASE_DA_FALHA_AO_LER: Record<FalhaAoSalvar, string> = {
  'sem-login': 'Sua sessão expirou, então o roteiro salvo não abriu. O que você escrever fica só nesta tela.',
  'sem-conexao': 'Sem conexão com a sua conta agora, então o roteiro salvo não abriu. O que você escrever fica só nesta tela.',
  'sem-confirmacao': 'O roteiro salvo não abriu. O que você escrever fica só nesta tela.',
  'limite-da-conta': 'O roteiro salvo não abriu. O que você escrever fica só nesta tela.',
  'grande-demais': 'O roteiro salvo não abriu. O que você escrever fica só nesta tela.',
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
    const enviado = atual.current;
    // Passou do limite do roteiro ou das notas: o banco recusaria, e cada pausa
    // na digitação mandaria de novo. Nada vai até o texto voltar a caber, e o
    // texto continua inteiro na tela.
    if (pontosDeCodigo(enviado.texto) > LIMITE_DO_TEXTO_DO_ROTEIRO || pontosDeCodigo(enviado.notas) > LIMITE_DAS_NOTAS_DO_ROTEIRO) {
      setSituacao({ tipo: 'falhou', motivo: 'grande-demais', aoLer: false });
      return;
    }
    setSituacao({ tipo: 'salvando' });
    // Uma edição feita enquanto este salvamento corria tem o seu próprio: a
    // resposta deste não diz "salvo" (nem "falhou") por cima dela
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
