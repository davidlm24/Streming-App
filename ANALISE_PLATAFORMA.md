# Análise e Revisão do Projeto - Plataforma SaaS de Streaming PwStream

Este documento apresenta uma análise técnica profunda do estado atual do projeto **PwStream** (composto por uma interface moderna em **React + Tailwind CSS** e um servidor backend em **Express + Vite** rodando com a SDK **@google/genai**), confrontando os recursos existentes com a especificação técnica fornecida e detalhando o plano de integração, credenciais e chaves de API necessárias para a produção.

---

## 1. ESTADO DE IMPLEMENTAÇÃO E MATURIDADE (MVP vs. REQUISITOS)

Abaixo, analisamos detalhadamente cada módulo da especificação, identificando o que já está implementado funcionalmente na interface de desenvolvimento, o que está simulado e o que resta construir no backend definitivo.

### Módulo 1: Cadastro, Autenticação & Onboarding (Seções 4 & 5)
*   **Estado Atual:** **Altamente Funcional (Simulado em LocalState)**
*   **Implementado:**
    *   Formulário de login, cadastro inicial e fluxo de onboarding estruturados no componente `AuthAndPricing.tsx`.
    *   Fluxo de escolha de planos (Standard, Professional, Business, Free Trial) integrado diretamente ao ciclo de vida da conta.
    *   Persistência local no `localStorage` para manter o usuário logado entre recarregamentos.
*   **A Implementar no Backend:**
    *   Integração real de autenticação durável com banco de dados (recomenda-se **Firebase Authentication** ou JWT tokens sobre PostgreSQL).
    *   Login social com Google, Facebook e Apple (Fluxos OAuth e redirecionamentos seguros).

### Módulo 2: Estúdio Virtual pelo Navegador (Seção 8)
*   **Estado Atual:** **Muito Avançado e Funcional**
*   **Implementado:**
    *   Captura real de webcam e microfone locais através da API `navigator.mediaDevices.getUserMedia` no componente `StudioPreview.tsx`.
    *   Compartilhamento real de tela (`getDisplayMedia`) com modal de escolha de abas/telas.
    *   Transições de vídeo reais e suaves configuráveis em tempo real (Fade, Slide, Zoom, Cut) usando a biblioteca **Motion (Framer Motion)**.
    *   Suporte a chroma-key com regulador de tolerância, suavidade e supressão de cores em tempo real.
    *   Inserção de overlays e fundos de vídeo/imagem interativos.
    *   Contagem regressiva funcional acoplada a gerador de som (Engine de Áudio Web).
    *   Ducking automático (Auto-fade): redução de volume do áudio de fundo quando o apresentador fala (detectado por áudio real de microfone ou simulação inteligente).
    *   Notas de apresentação e sobreposição dinâmica de QR Codes.

### Módulo 3: Multistream & Transmissão por Encoders Externos (Seção 9 & 10)
*   **Estado Atual:** **Painel de Controle Completo**
*   **Implementado:**
    *   Conexão/ativação de canais de destino de redes sociais (Facebook, YouTube, Twitch) com simulação visual de stream ativa.
    *   Geração de chaves RTMP virtuais individuais no painel de administração geral (`AdminPanel.tsx`).
    *   Visualizadores de latência, status de ingestão do sinal e status de conexão.
*   **A Implementar no Servidor de Streaming:**
    *   Servidor RTMP/SRT de ingestão ativo (utilizando **MediaMTX**, **OvenMediaEngine** ou **Nginx RTMP module**).
    *   Serviço de retransmissão transcodificada com **FFmpeg** em servidores dedicados para reencaminhar o sinal às redes sociais (multicasting).

### Módulo 4: Chat Ao Vivo, Moderação Inteligente com IA & Interações (Seção 14 & 15)
*   **Estado Atual:** **Totalmente Funcional & Integrado com Gemini AI**
*   **Implementado:**
    *   Chat integrado no painel do estúdio com bot gerador de mensagens automatizadas simulando audiência real.
    *   **Moderação em tempo real baseada em IA**: integrado de forma nativa ao backend Express com a SDK `@google/genai` (usando o modelo `gemini-3.5-flash`).
    *   Filtro inteligente de spams, palavrões e links com indicação do motivo da moderação e ocultação automática de comentários inadequados.
    *   Sistema local de fixação de comentários e mensagens em destaque.
    *   Enquetes interativas com votação e resultados em tempo real.

### Módulo 5: Gestão de Cobranças e Monetização (Seção 19 & 20)
*   **Estado Atual:** **Interface de Checkout & Faturas Altamente Polida**
*   **Implementado:**
    *   Componente `BillingDashboard.tsx` completo e robusto.
    *   Área para atualização de dados corporativos (Razão Social, CNPJ/CPF, Endereço de Faturamento).
    *   Simulador interativo de checkout com suporte a 3 bandeiras: **Stripe**, **PayPal** e **Mercado Pago** (incluindo geração simulada de chaves Pix e autopreenchimento de cartões de teste).
    *   Histórico de faturas gerado de forma dinâmica com capacidade para **baixar recibos oficiais em formato de texto estruturado**.
    *   Gráficos e medidores de consumo de banda e minutos assistidos por membro do time.

### Módulo 6: Painel Administrativo Geral (Seção 26)
*   **Estado Atual:** **Implementado e Robusto**
*   **Implementado:**
    *   Componente `AdminPanel.tsx` visualizável por administradores.
    *   Gráfico de Área dinâmico do **Recharts** demonstrando tráfego de saída (Egress) e ingestão (Ingress) de dados em tempo real.
    *   Estatísticas de uso de CPU, banda total consumida e armazenamento no Cloudflare R2.
    *   Lista de monitoramento de status técnico de servidores (São Paulo, Frankfurt, Virginia).
    *   Logs técnicos simulados em tempo real de chamadas REST e logs de erro técnico.

---

## 2. MAPEAMENTO DE CHAVES DE API E CREDENCIAIS DE SERVIÇOS

Para colocar a plataforma em produção com todas as integrações solicitadas, serão necessárias as seguintes chaves de API e variáveis de ambiente (que devem ser documentadas no `.env.example` e configuradas de forma segura no painel de segredos do servidor backend):

### 2.1. Inteligência Artificial e Moderação
*   `GEMINI_API_KEY`: Necessária para a validação inteligente e classificação dos chats usando o modelo `gemini-3.5-flash`. Exposta de forma segura apenas do lado do servidor (sem prefixo `VITE_`).

### 2.2. Gateway de Pagamento e Monetização
*   **Stripe**:
    *   `STRIPE_PUBLISHABLE_KEY`: Chave pública para carregar o Stripe Elements no formulário de pagamento.
    *   `STRIPE_SECRET_KEY`: Chave secreta de autenticação do backend com a API do Stripe para cobrança e renovação de assinaturas.
    *   `STRIPE_WEBHOOK_SECRET`: Token de validação de webhooks para o servidor Express saber quando um pagamento recorrente foi compensado com sucesso.
*   **PayPal**:
    *   `PAYPAL_CLIENT_ID`: Identificador público de cliente da carteira PayPal.
    *   `PAYPAL_CLIENT_SECRET`: Segredo de credencial para realizar chamadas de autenticação e registrar transações em sandbox ou produção.
*   **Mercado Pago (Ideal para PIX e Cartões no Brasil)**:
    *   `MERCADO_PAGO_PUBLIC_KEY`: Credencial pública do cliente.
    *   `MERCADO_PAGO_ACCESS_TOKEN`: Token de acesso de alta segurança do backend para registrar intenções de pagamento de boletos ou gerar chaves Pix dinâmicas imediatas.

### 2.3. Infraestrutura de Streaming, Transcoding e CDN
*   **AWS IVS (Interactive Video Service) ou Cloudflare Stream**:
    *   `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`: Credenciais para controlar a ingestão de RTMP e distribuição HLS escalável.
    *   `CLOUDFLARE_API_TOKEN` & `CLOUDFLARE_ACCOUNT_ID`: Utilizadas para gerenciar o armazenamento sob demanda no Cloudflare R2 e distribuição de mídia através de domínios customizados.
*   **Servidor Proprietário (MediaMTX / OvenMediaEngine / Nginx)**:
    *   `RTMP_AUTH_SECRET`: Segredo compartilhado de segurança para autenticar transmissões iniciadas por encoders externos via OBS ou Streamlabs, protegendo o servidor contra transmissões não autorizadas.

### 2.4. Integrações de Redes Sociais (OAuth & Multistream)
Para obter tokens que permitam transmitir simultaneamente, o usuário final precisará realizar login via OAuth, gerando as seguintes chaves no painel da plataforma:
*   **Facebook Developers (Meta)**:
    *   `FACEBOOK_APP_ID` e `FACEBOOK_APP_SECRET`: Para abrir a janela de permissão de streaming de Páginas e Grupos (`publish_video`).
*   **Google Developer Console (YouTube)**:
    *   `YOUTUBE_CLIENT_ID` e `YOUTUBE_CLIENT_SECRET`: Para integração com a API Live Streaming do YouTube, permitindo criar eventos de stream, iniciar transmissões automáticas e recuperar o chat ao vivo em tempo real (`youtube.force-ssl`).
*   **Twitch Developer Portal**:
    *   `TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET`: Para obter tokens de integração rápida com o canal do streamer.

---

## 3. O QUE ESTÁ EM FALTA & PRÓXIMOS PASSOS PARA PRODUÇÃO

O front-end atual representa um **sistema de alta fidelidade técnica** capaz de demonstrar exatamente como o produto se comporta. Para migrá-lo para um produto SaaS real (Fases 1 a 5 da especificação), restam implementar os seguintes componentes de infraestrutura física:

1.  **Banco de Dados Relacional (PostgreSQL + Prisma/Drizzle)**:
    *   Criação das tabelas descritas na Seção 30 (`users`, `subscriptions`, `broadcasts`, `chat_rooms`, etc.) para substituir o uso de `localStorage` da sessão.
2.  **Serviço de Ingestão de Vídeo Dedicado**:
    *   Instanciar um container Docker rodando **MediaMTX** ou **OvenMediaEngine** em um provedor de nuvem (Cloud Run, AWS ECS ou VPS com IP público fixo).
    *   Mapear as URLs de transmissão RTMP (`rtmp://...`) para o container de ingestão.
3.  **Processo de Transcoding e Encapsulamento FFmpeg**:
    *   Backend para acionar comandos FFmpeg assíncronos no servidor de streaming sempre que um sinal for recebido:
        ```bash
        ffmpeg -i rtmp://localhost/live/key -c:v libx264 -preset veryfast -b:v 3000k \
          -f flv rtmp://a.rtmp.youtube.com/live2/YOUTUBE_KEY \
          -f flv rtmps://live-api-s.facebook.com:443/rtmp/FACEBOOK_KEY
        ```
4.  **Sistema de Envio de E-mails Transacionais (Seção 24)**:
    *   Configurar provedor SMTP (como **Brevo** ou **SendGrid**) para o disparo de emails automáticos pós-webinars e certificados.

---

Este projeto encontra-se em um excelente nível técnico de maturidade funcional e visual, respeitando as exigências estéticas e arquiteturais premium estabelecidas.
