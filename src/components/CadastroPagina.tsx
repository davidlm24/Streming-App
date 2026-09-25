import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { CircleAlert } from 'lucide-react';
import { ErroAoSalvarNome, entrouComGoogle, esperarSessao, salvarNomeDoPerfil, type FalhaAoSalvarNome } from '../lib/firestoreService';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { Button } from './ui/Button';
import { ErroDeCampo } from './ui/ErroDeCampo';
import { CabecalhoDePagina, Pagina } from './ui/Pagina';
import { useToast } from './ui/Toast';

interface CadastroPaginaProps {
  user: { email: string; name: string } | null;
  /** O banco confirmou o nome novo: o app troca o nome no menu, no palco e no cache do login. */
  onNomeSalvo: (nome: string) => void;
  /** Sai da conta e volta à entrada: a saída do aviso de sessão expirada. */
  onSair: () => void;
}

/** Nome colado de outro lugar vem com espaços sobrando. */
const limparNome = (nome: string) => nome.replace(/\s+/g, ' ').trim();

const O_QUE_DIZER: Record<FalhaAoSalvarNome, string> = {
  'sem-login': 'Sua sessão expirou, então o nome não foi salvo.',
  'sem-conexao': 'Sem conexão com a sua conta agora. Tente de novo mais tarde.',
  'sem-confirmacao': 'Não deu para confirmar que o nome foi salvo. Confira a conexão e tente de novo.',
  recusado: 'Não foi possível salvar o nome. Tente de novo.',
};

/**
 * Dados de cadastro: como você aparece no app e com que conta entra.
 *
 * Era um formulário de "Informações Cadastrais & Fiscais" cujo "salvar"
 * esperava 1,2 s de enfeite, mudava só este navegador e dizia "atualizados
 * com sucesso". O e-mail era editável sem mudar o do login (e passava por
 * cima dele no app), e razão social, CPF/CNPJ e endereço ficavam guardados
 * aqui sem nada que os usasse. Os dados fiscais voltam com a cobrança.
 *
 * Agora são duas linhas. O nome vira campo no lugar e só se diz salvo depois
 * de o banco confirmar; o e-mail é o do login.
 */
export function CadastroPagina({ user, onNomeSalvo, onSair }: CadastroPaginaProps) {
  const toast = useToast();
  const nome = user?.name ?? '';
  // De onde vem o e-mail. Logo depois de recarregar a sessão ainda não voltou;
  // a frase se acerta quando ela volta.
  const [google, setGoogle] = useState(entrouComGoogle);
  useEffect(() => {
    let ativa = true;
    esperarSessao().then(() => {
      if (ativa) setGoogle(entrouComGoogle());
    });
    return () => {
      ativa = false;
    };
  }, []);
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState('');
  const [erro, setErro] = useState('');
  const [falha, setFalha] = useState<FalhaAoSalvarNome | null>(null);
  const [salvando, setSalvando] = useState(false);
  const refCampo = useRef<HTMLInputElement>(null);
  const refEditar = useRef<HTMLButtonElement>(null);
  const devolverFoco = useRef(false);

  // Abrir põe o foco no campo, com o cursor no fim; fechar devolve o foco a "Editar".
  useEffect(() => {
    if (editando) {
      const campo = refCampo.current;
      campo?.focus();
      campo?.setSelectionRange(campo.value.length, campo.value.length);
    } else if (devolverFoco.current) {
      devolverFoco.current = false;
      refEditar.current?.focus();
    }
  }, [editando]);

  const abrir = () => {
    setRascunho(nome);
    setErro('');
    setFalha(null);
    setEditando(true);
  };

  const fechar = () => {
    devolverFoco.current = true;
    setEditando(false);
  };

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (salvando) return;
    // O aviso da tentativa anterior não vale para esta.
    setFalha(null);
    const novo = limparNome(rascunho);
    if (!novo) {
      setErro('Falta o nome. Escreva como você quer aparecer no estúdio.');
      refCampo.current?.focus();
      return;
    }
    if (novo === nome) {
      fechar();
      return;
    }
    setSalvando(true);
    try {
      await salvarNomeDoPerfil(novo);
      onNomeSalvo(novo);
      toast.success('Nome salvo');
      fechar();
    } catch (err) {
      setFalha(err instanceof ErroAoSalvarNome ? err.motivo : 'recusado');
    } finally {
      setSalvando(false);
    }
  };

  const cancelarComEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !salvando) {
      e.preventDefault();
      fechar();
    }
  };

  return (
    <Pagina>
      <CabecalhoDePagina titulo="Dados de cadastro" />

      <dl className="mt-12 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {editando ? (
          <div className="py-4">
            <dt>
              <label htmlFor="cadastro-nome" className="block text-sm font-medium text-[var(--ink-hi)]">
                Nome
              </label>
            </dt>
            <dd>
              <form onSubmit={salvar} onKeyDown={cancelarComEsc} noValidate>
                <input
                  ref={refCampo}
                  id="cadastro-nome"
                  type="text"
                  autoComplete="name"
                  maxLength={80}
                  value={rascunho}
                  onChange={(e) => {
                    setRascunho(e.target.value);
                    if (erro) setErro('');
                  }}
                  aria-invalid={erro ? true : undefined}
                  aria-describedby={erro ? 'cadastro-nome-erro' : 'cadastro-nome-dica'}
                  className="mt-2 block h-11 w-full rounded-xl border px-3 text-sm"
                />
                {erro ? (
                  <ErroDeCampo id="cadastro-nome-erro">{erro}</ErroDeCampo>
                ) : (
                  <p id="cadastro-nome-dica" className="mt-2 text-pretty text-xs text-[var(--ink-lo)]">
                    O primeiro nome aparece no palco do estúdio.
                  </p>
                )}
                {falha && (
                  <p role="alert" className="mt-4 flex items-start gap-2 text-pretty text-sm text-[var(--ink-hi)]">
                    <CircleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                    <span>
                      {O_QUE_DIZER[falha]}
                      {falha === 'sem-login' && (
                        <>
                          {' '}
                          <AcaoDeTexto sublinhada onClick={onSair}>
                            Entrar de novo
                          </AcaoDeTexto>
                        </>
                      )}
                    </span>
                  </p>
                )}
                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button variant="ghost" onClick={fechar} disabled={salvando}>
                    Cancelar
                  </Button>
                  <Button type="submit" loading={salvando}>
                    Salvar nome
                  </Button>
                </div>
              </form>
            </dd>
          </div>
        ) : (
          // A ação fica num `dd` próprio (um `dl` só aceita `dt` e `dd` no grupo), depois do valor na leitura e à direita na tela.
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-4">
            <dt className="text-sm font-medium text-[var(--ink-hi)]">Nome</dt>
            <dd className="col-start-1 mt-1 break-words text-sm text-[var(--ink)]">
              {nome || <span className="text-[var(--ink-lo)]">Sem nome</span>}
            </dd>
            <dd className="col-start-2 row-span-2 row-start-1">
              {/* Alvo de 44px sem empurrar a linha: a margem negativa devolve a altura extra. */}
              <AcaoDeTexto ref={refEditar} onClick={abrir} className="-my-3 min-h-11">
                Editar<span className="sr-only"> nome</span>
              </AcaoDeTexto>
            </dd>
          </div>
        )}

        <div className="py-4">
          <dt className="text-sm font-medium text-[var(--ink-hi)]">E-mail</dt>
          <dd className="mt-1 break-words text-sm text-[var(--ink)]">
            {user?.email || <span className="text-[var(--ink-lo)]">Sem e-mail</span>}
          </dd>
          <dd className="mt-2 text-pretty text-xs text-[var(--ink-lo)]">
            {google ? 'Vem da conta Google com que você entra.' : 'É o e-mail com que você entra.'}
          </dd>
        </div>
      </dl>
    </Pagina>
  );
}
