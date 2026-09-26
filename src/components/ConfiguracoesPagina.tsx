import { useTheme } from '../context/ThemeContext';
import { LinhaDeAcao } from './ui/LinhaDeAcao';
import { CabecalhoDePagina, Pagina, SecaoDePagina } from './ui/Pagina';
import { Segmentado } from './ui/Segmentado';

type AbaDeIntegracao = 'rtmp' | 'social' | 'webhooks';

interface ConfiguracoesPaginaProps {
  ehSuperAdmin: boolean;
  onAbrirIntegracao: (aba: AbaDeIntegracao) => void;
  onIrPara: (visao: 'billing' | 'profile' | 'super-admin') => void;
}

const TEMAS = [
  { valor: 'dark', rotulo: 'Escuro' },
  { valor: 'light', rotulo: 'Claro' },
] as const satisfies readonly { valor: 'dark' | 'light'; rotulo: string }[];

/**
 * Tudo o que não é tarefa de todo dia. Saiu do painel ("Configurações &
 * Chaves") e do cabeçalho (tema, painel técnico).
 *
 * A seção "Transmissão" saiu com o painel de qualidade de vídeo: resolução,
 * bitrate, encoder, áudio e keyframe não chegavam a lugar nenhum (o navegador
 * ainda não codifica vídeo), e "Salvar e Aplicar no Estúdio" dizia
 * "Configurações Aplicadas!" sem aplicar nada. Os limites por plano dele
 * também contradiziam plans.ts. Volta quando a live existir, com os limites de
 * plans.ts.
 *
 * O "Painel técnico" também saiu. A chave de ingestão apontava para um
 * servidor que não existe (stream.pwstreamer.com não resolve), os destinos
 * repetiam a página Canais sem salvar nada, as estatísticas eram vazias ou
 * inventadas, e os webhooks já estão em Integrações.
 */
export function ConfiguracoesPagina({ ehSuperAdmin, onAbrirIntegracao, onIrPara }: ConfiguracoesPaginaProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Pagina>
      <CabecalhoDePagina titulo="Configurações" />

      <SecaoDePagina id="config-integracoes" titulo="Integrações">
        <ul className="mt-2 divide-y divide-[var(--line)]">
          <li>
            <LinhaDeAcao
              titulo="OBS, vMix e RTMP externo"
              descricao="Transmitir de um programa no seu computador. Ainda não está no ar."
              onClick={() => onAbrirIntegracao('rtmp')}
            />
          </li>
          <li>
            <LinhaDeAcao
              titulo="Redes sociais"
              descricao="Conectar contas do YouTube, do Facebook e da Twitch pelo login de cada uma."
              onClick={() => onAbrirIntegracao('social')}
            />
          </li>
          <li>
            <LinhaDeAcao
              titulo="Webhooks"
              descricao="Avisos para outros sistemas quando a live começa, termina ou recebe um evento."
              onClick={() => onAbrirIntegracao('webhooks')}
            />
          </li>
        </ul>
      </SecaoDePagina>

      <SecaoDePagina id="config-aparencia" titulo="Aparência">
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-[var(--ink-hi)]">Tema</span>
            <span className="mt-1 block text-xs text-[var(--ink-lo)]">
              O estúdio fica sempre escuro — é o console, e a imagem precisa do entorno sem cor.
            </span>
          </span>
          <Segmentado rotulo="Tema" opcoes={[...TEMAS]} valor={theme} onChange={setTheme} />
        </div>
      </SecaoDePagina>

      <SecaoDePagina id="config-conta" titulo="Conta">
        <ul className="mt-2 divide-y divide-[var(--line)]">
          <li>
            <LinhaDeAcao titulo="Plano e cobrança" descricao="Seu plano e o que cada plano inclui." onClick={() => onIrPara('billing')} />
          </li>
          <li>
            <LinhaDeAcao titulo="Dados de cadastro" descricao="Seu nome e o e-mail da conta." onClick={() => onIrPara('profile')} />
          </li>
        </ul>
      </SecaoDePagina>

      {/* Sem o painel técnico, Avançado só tem a administração: só aparece para quem é admin */}
      {ehSuperAdmin && (
        <SecaoDePagina id="config-avancado" titulo="Avançado">
          <ul className="mt-2 divide-y divide-[var(--line)]">
            <li>
              <LinhaDeAcao
                titulo="Administração da plataforma"
                descricao="Clientes, chaves de transmissão e registro de auditoria."
                onClick={() => onIrPara('super-admin')}
              />
            </li>
          </ul>
        </SecaoDePagina>
      )}
    </Pagina>
  );
}
