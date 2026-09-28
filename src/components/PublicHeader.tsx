import { PwStreamLogo } from './PwStreamLogo';
import { AcaoDeTexto } from './ui/AcaoDeTexto';
import { Button } from './ui/Button';

export type VisaoPublica = 'landing' | 'login' | 'register';

interface PublicHeaderProps {
  /** A tela aberta: a ação que leva a ela sai do cabeçalho. */
  atual: VisaoPublica;
  onNavegar: (visao: VisaoPublica) => void;
  /** Leva à seção de planos do início. */
  onPlanos: () => void;
}

/**
 * Cabeçalho do site público, no desenho do cabeçalho do app: barra de 56px
 * sobre o fundo da página, com uma linha embaixo.
 *
 * Eram três destinos em pílulas (Início, Recursos, Planos) e um botão azul
 * de criar conta disputando cor com o herói. A página de Recursos saiu (o
 * início diz o que já funciona e o que vem), o logo leva ao início e
 * "Criar conta" fica fantasma aqui: a cor é da ação da tela.
 *
 * Cabe inteiro a 375px, então não há menu de celular; "Planos" some abaixo
 * de `sm`, onde a seção fica logo ali, rolando.
 */
export function PublicHeader({ atual, onNavegar, onPlanos }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--line)] bg-[var(--bg)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => onNavegar('landing')}
          aria-label="PwStreamer, início"
          className="flex shrink-0 items-center cursor-pointer"
        >
          <PwStreamLogo iconSize={28} textSize="sm" />
        </button>

        <nav aria-label="Principal" className="ml-auto flex items-center gap-5">
          <span className="hidden sm:inline-flex">
            <AcaoDeTexto onClick={onPlanos} className="min-h-11">
              Planos
            </AcaoDeTexto>
          </span>
          {atual !== 'login' && (
            <AcaoDeTexto onClick={() => onNavegar('login')} className="min-h-11">
              Entrar
            </AcaoDeTexto>
          )}
          {atual !== 'register' && (
            <Button variant="ghost" onClick={() => onNavegar('register')} className="min-h-11">
              Criar conta
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
