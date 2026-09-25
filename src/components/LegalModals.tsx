import React from 'react';
import { Shield, FileText } from 'lucide-react';
import { Modal } from './ui/Modal';

interface LegalModalProps {
  isOpen: boolean;
  type: 'terms' | 'privacy';
  onClose: () => void;
}

export function LegalModal({ isOpen, type, onClose }: LegalModalProps) {
  const isPrivacy = type === 'privacy';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      icon={isPrivacy ? <Shield size={18} className="text-blue-400" /> : <FileText size={18} className="text-blue-400" />}
      title={isPrivacy ? 'Política de Privacidade' : 'Termos e Condições de Uso'}
      description="PW Stream Online — atualizado em julho de 2026"
      footer={
        <button
          onClick={onClose}
          className="px-5 py-2 bg-[var(--raise)] hover:bg-[var(--panel)] text-[var(--ink-hi)] rounded-xl text-xs font-bold active:scale-95 transition-colors cursor-pointer"
        >
          Fechar documento
        </button>
      }
    >
      <div className="space-y-6 leading-relaxed select-text">
          {isPrivacy ? (
            <>
              <div>
                <p className="text-[var(--ink-lo)] text-xs uppercase font-extrabold tracking-wider mb-2">Introdução</p>
                <p>
                  A <strong>PW Stream Online</strong> respeita a privacidade de seus usuários e está comprometida em proteger os dados pessoais coletados por meio do site <a href="https://pwstreamer.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">https://pwstreamer.com</a>.
                </p>
                <p className="mt-3">
                  Esta Política de Privacidade explica como coletamos, utilizamos, armazenamos e protegemos suas informações durante a utilização de nossos serviços.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">1.</span> Quem Somos
                </h4>
                <p>
                  A PW Stream Online é uma plataforma especializada em serviços de streaming de vídeo, webinars, transmissões ao vivo, eventos online e soluções digitais para empresas, produtores de conteúdo e organizações.
                </p>
                <p className="text-xs text-[var(--ink-lo)] bg-[var(--bg)]/40 p-2.5 rounded-lg border border-[var(--line)]/40 font-mono">
                  Contato de privacidade:<br />
                  E-mail: <span className="text-blue-400">contact@pwstreamer.com</span>
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">2.</span> Informações Coletadas
                </h4>
                <p>Podemos coletar informações fornecidas diretamente pelo usuário, incluindo:</p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-[var(--ink-lo)] text-xs">
                  <li>Nome completo;</li>
                  <li>Empresa;</li>
                  <li>Endereço de e-mail;</li>
                  <li>Número de telefone;</li>
                  <li>País;</li>
                  <li>Informações de faturamento (quando aplicável);</li>
                  <li>Dados enviados através de formulários de contato.</li>
                </ul>
                <p className="mt-2">Também coletamos automaticamente:</p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-[var(--ink-lo)] text-xs">
                  <li>Endereço IP;</li>
                  <li>Tipo de navegador;</li>
                  <li>Sistema operacional;</li>
                  <li>Data e horário de acesso;</li>
                  <li>Cookies;</li>
                  <li>Informações sobre utilização da plataforma;</li>
                  <li>Dados estatísticos de navegação.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">3.</span> Finalidade da Coleta
                </h4>
                <p>Os dados poderão ser utilizados para:</p>
                <ul className="list-decimal list-inside space-y-1 pl-2 text-[var(--ink-lo)] text-xs">
                  <li>Prestar nossos serviços;</li>
                  <li>Criar contas de usuários;</li>
                  <li>Processar pagamentos;</li>
                  <li>Fornecer suporte técnico;</li>
                  <li>Melhorar nossos serviços;</li>
                  <li>Enviar comunicações importantes;</li>
                  <li>Informar novidades, produtos e promoções (quando autorizado);</li>
                  <li>Cumprir obrigações legais.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">4.</span> Cookies
                </h4>
                <p>Utilizamos cookies para:</p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-[var(--ink-lo)] text-xs">
                  <li>Autenticação de identidade;</li>
                  <li>Personalização da experiência do painel;</li>
                  <li>Estatísticas agregadas de utilização;</li>
                  <li>Melhoria de desempenho e tempo de carregamento;</li>
                  <li>Segurança geral da plataforma.</li>
                </ul>
                <p className="text-xs text-[var(--ink-lo)] mt-2">
                  O usuário poderá desativar os cookies diretamente em seu navegador, porém alguns recursos poderão deixar de funcionar corretamente.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">5.</span> Compartilhamento de Informações
                </h4>
                <p>
                  Não comercializamos dados pessoais de usuários sob nenhuma hipótese.
                </p>
                <p>Os dados poderão ser compartilhados apenas quando estritamente necessário com parceiros e sub-processadores autorizados:</p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-[var(--ink-lo)] text-xs">
                  <li>Processadores e gateways de pagamento (ex. Stripe);</li>
                  <li>Provedores de hospedagem em nuvem (ex. Google Cloud);</li>
                  <li>Serviços de armazenamento e infraestrutura;</li>
                  <li>Autoridades competentes quando exigido por lei ou ordem judicial.</li>
                </ul>
                <p className="text-xs text-[var(--ink-lo)]">
                  Todos os parceiros são contratualmente obrigados a manter padrões adequados de segurança de dados e confidencialidade estrita.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">6.</span> Segurança
                </h4>
                <p>
                  Empregamos robustas medidas técnicas, físicas e administrativas para proteger suas informações contra acessos não autorizados, perda acidental, destruição, alteração ou divulgação indevida.
                </p>
                <p className="text-xs text-amber-400/80 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                  Apesar dos nossos incansáveis esforços para manter tudo seguro, lembramos que nenhum sistema conectado à Internet é totalmente imune a riscos de segurança.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">7.</span> Retenção dos Dados
                </h4>
                <p>
                  Os dados coletados serão mantidos apenas pelo período necessário para a execução dos serviços contratados, cumprimento de obrigações fiscais ou legais, resolução de eventuais disputas ou prevenção ativa contra fraudes de sistema.
                </p>
                <p className="text-xs text-[var(--ink-lo)]">
                  Após o fim da necessidade de manutenção, os dados serão excluídos definitivamente ou anonimizados.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">8.</span> Direitos do Usuário
                </h4>
                <p>O usuário possui amplos direitos sobre seus dados, podendo solicitar a qualquer momento:</p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-[var(--ink-lo)] text-xs">
                  <li>Acesso e confirmação da existência de tratamento dos dados;</li>
                  <li>Atualização imediata de informações desatualizadas;</li>
                  <li>Correção de dados incompletos ou inexatos;</li>
                  <li>Exclusão permanente de dados desnecessários ou excessivos;</li>
                  <li>Anonimização ou bloqueio temporário;</li>
                  <li>Portabilidade segura, quando regulamentado e aplicável;</li>
                  <li>Revogação imediata do consentimento concedido anteriormente.</li>
                </ul>
                <p className="text-xs">
                  Para exercer seus direitos, realize sua solicitação formal enviando uma mensagem detalhada para: <span className="text-blue-400 font-mono">contact@pwstreamer.com</span>.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">9.</span> Conteúdo Transmitido
                </h4>
                <p>
                  A PW Stream Online atua como fornecedora de infraestrutura tecnológica. <strong>Cada cliente é integralmente e exclusivamente responsável</strong> pelo conteúdo transmitido em sua conta, incluindo vídeos, apresentações, webinars, eventos, transmissões ao vivo, imagens, documentos e materiais correlatos disponibilizados ao público ou parceiros.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">10.</span> Links Externos
                </h4>
                <p>
                  Nosso site poderá conter links para serviços de terceiros. Não somos responsáveis pelas políticas de privacidade ou práticas desses serviços externos. Recomendamos a leitura cuidadosa de suas respectivas diretrizes antes da navegação.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">11.</span> Alterações
                </h4>
                <p>
                  Esta Política poderá ser atualizada a qualquer momento para refletir novos recursos ou exigências legais. A versão mais recente com sua respectiva data de vigência estará sempre disponível de forma transparente em nosso site.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-[var(--ink-lo)] text-xs uppercase font-extrabold tracking-wider mb-2">Introdução</p>
                <p>
                  Ao acessar ou utilizar a plataforma <strong>PW Stream Online</strong>, o usuário concorda integralmente com os presentes Termos e Condições de Uso.
                </p>
                <p className="text-xs text-amber-400 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 mt-3 font-semibold">
                  Caso não concorde com qualquer disposição, deverá interromper imediatamente a utilização dos serviços.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">1.</span> Serviços
                </h4>
                <p>A PW Stream Online disponibiliza serviços especializados relacionados a:</p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-[var(--ink-lo)] text-xs">
                  <li>Streaming de vídeo em tempo real ou sob demanda;</li>
                  <li>Streaming de áudio e monitoramento de canais;</li>
                  <li>Webinars e painéis dinâmicos;</li>
                  <li>Eventos corporativos e educacionais online;</li>
                  <li>Transmissões ao vivo multifuncionais (lives);</li>
                  <li>Hospedagem dedicada de transmissões;</li>
                  <li>Players e janelas interativas incorporáveis (Embeds);</li>
                  <li>Gestão inteligente de conteúdo multimídia e arquivos;</li>
                  <li>Serviços tecnológicos complementares de estúdio virtual.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">2.</span> Cadastro e Contas
                </h4>
                <p>
                  Alguns serviços específicos exigem cadastro de conta de usuário para acesso total. O usuário compromete-se a fornecer informações verdadeiras, atualizadas e completas.
                </p>
                <p className="text-xs text-[var(--ink-lo)]">
                  É de responsabilidade total e exclusiva do usuário manter a confidencialidade e segurança de sua senha e credenciais de acesso.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">3.</span> Responsabilidade pelo Conteúdo
                </h4>
                <p>
                  Cada cliente é exclusivamente e integralmente responsável pelo conteúdo transmitido, publicado ou armazenado em sua conta.
                </p>
                <p>É expressamente proibido utilizar a plataforma para veicular ou gerenciar conteúdo que seja:</p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-[var(--ink-lo)] text-xs">
                  <li>Ilegal, criminoso ou em desacordo com as leis vigentes;</li>
                  <li>Fraudulento ou enganoso;</li>
                  <li>Ofensivo, preconceituoso ou incitador do ódio;</li>
                  <li>Discriminatório contra raça, gênero, orientação ou religião;</li>
                  <li>Difamatório ou injurioso contra marcas ou pessoas;</li>
                  <li>Violador de patentes, segredos comerciais ou direitos autorais;</li>
                  <li>Violador de marcas registradas sem expressa autorização;</li>
                  <li>Incentivador de atividades ilícitas de qualquer natureza;</li>
                  <li>Portador de vírus, códigos maliciosos ou malwares invasivos.</li>
                </ul>
                <p className="text-xs text-[var(--ink-lo)] mt-2">
                  A PW Stream Online reserva-se o direito de remover sumariamente conteúdos que violem estes Termos ou a legislação aplicável, sem aviso prévio.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">4.</span> Direitos Autorais e Propriedade Intelectual
                </h4>
                <p>
                  O usuário declara e garante possuir todos os direitos, autorizações e licenças necessários para transmitir, publicar ou disponibilizar qualquer conteúdo na plataforma.
                </p>
                <p className="text-xs text-[var(--ink-lo)]">
                  A PW Stream Online não assume responsabilidade por infrações de propriedade intelectual cometidas pelos usuários em suas transmissões ou salas virtuais.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">5.</span> Valores e Pagamentos
                </h4>
                <p>Quando aplicável aos planos pagos contratados:</p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-[var(--ink-lo)] text-xs">
                  <li>Os valores exatos dos planos serão apresentados de forma clara antes da contratação;</li>
                  <li>Assinaturas poderão ser cobradas de forma recorrente (mensal ou anual);</li>
                  <li>Impostos federais, estaduais ou municipais poderão ser adicionados conforme a legislação vigente;</li>
                  <li>Atrasos ou falhas de pagamento recorrente poderão ocasionar a suspensão temporária dos serviços de estúdio.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">6.</span> Disponibilidade e Nível de Serviço (SLA)
                </h4>
                <p>
                  Buscamos de forma ativa manter alta disponibilidade global de nossos serviços. Entretanto, poderão ocorrer interrupções inevitáveis decorrentes de:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-[var(--ink-lo)] text-xs">
                  <li>Manutenções programadas de segurança ou expansão;</li>
                  <li>Atualizações críticas de sistema;</li>
                  <li>Instabilidades gerais da rede de internet;</li>
                  <li>Falhas de infraestrutura de telecomunicações do usuário;</li>
                  <li>Eventos imprevistos de força maior ou catástrofes naturais;</li>
                  <li>Ataques cibernéticos distribuídos (DDoS);</li>
                  <li>Problemas ou paralisações de provedores de infraestrutura terceirizados.</li>
                </ul>
                <p className="text-xs text-[var(--ink-lo)]">
                  Não garantimos e não nos responsabilizamos por perdas decorrentes de quedas pontuais, não existindo garantia de disponibilidade ininterrupta de 100%.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">7.</span> Uso Adequado da Plataforma
                </h4>
                <p>O usuário compromete-se rigorosamente a não:</p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-[var(--ink-lo)] text-xs">
                  <li>Vasculhar ou explorar vulnerabilidades de segurança dos servidores;</li>
                  <li>Tentar burlar autenticações ou acessar contas e dados de terceiros;</li>
                  <li>Utilizar robôs, scrapers ou crawlers não autorizados para coleta de dados;</li>
                  <li>Praticar engenharia reversa sobre qualquer código proprietário;</li>
                  <li>Comprometer de qualquer forma a estabilidade operacional da rede;</li>
                  <li>Interferir na infraestrutura global dos servidores e serviços.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">8.</span> Suspensão e Encerramento
                </h4>
                <p>
                  Poderemos suspender preventivamente ou encerrar de forma imediata contas de usuários em caso de indícios razoáveis de fraude, descumprimento destes Termos, uso excessivo ou abusivo de banda de rede, atividades ilegais sob qualquer ótica ou inadimplência financeira superior ao prazo de tolerância.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">9.</span> Limitação de Responsabilidade
                </h4>
                <p className="text-xs text-[var(--ink-lo)] leading-relaxed">
                  Na máxima extensão permitida pela legislação aplicável, a <strong>PW Stream Online não será responsável</strong> por perdas de receita, perda de audiência ao vivo, perda de dados ou arquivos por culpa de terceiros, interrupções inesperadas de rede de internet, indisponibilidade temporária de provedores externos, ou danos indiretos de qualquer natureza.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">10.</span> Modificações destes Termos
                </h4>
                <p>
                  A PW Stream Online poderá alterar estes Termos de Uso sempre que houver necessidade técnica ou comercial. A continuidade de utilização dos serviços de estúdio e painéis pelo usuário representa aceitação tácita e integral da versão mais recente publicada.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[var(--ink-hi)] font-bold text-sm flex items-center gap-2 border-b border-[var(--line)]/80 pb-1">
                  <span className="text-blue-500 font-mono text-xs">11.</span> Legislação e Contato
                </h4>
                <p>
                  Estes termos e regras de utilização do estúdio virtual seguem as normas e regulamentos vigentes, respeitando as leis de proteção de dados (LGPD) e o Marco Civil da Internet.
                </p>
                <p className="text-xs text-[var(--ink-lo)] mt-2">
                  Dúvidas ou solicitações de esclarecimento sobre estes Termos de Uso poderão ser direcionadas para: <span className="text-blue-400 font-mono">contact@pwstreamer.com</span>.
                </p>
              </div>
            </>
          )}
      </div>
    </Modal>
  );
}
