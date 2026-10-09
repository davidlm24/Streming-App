# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Mesmo nicho do Restream: quem transmite ao vivo para várias plataformas ao mesmo tempo (YouTube, Facebook, Twitch e outras) a partir do navegador. São criadores e empresas que fazem lives e webinars.

O produto tem quatro públicos, em situações diferentes:

- **Operador no estúdio, durante a live.** É o momento de maior pressão. A atenção dele está no que vai ao ar: câmeras, cenas, banners, chat. Ele troca de cena (preview → programa), modera comentários e aciona ofertas. Um erro aqui é público.
- **Anfitrião entre as lives, no painel.** Agenda webinars, conecta canais e destinos, configura a ingestão por OBS/vMix, cuida do plano e da conta.
- **Espectador na página pública do webinar** (ainda não está no ar: volta com o link público e a transmissão). Faz a inscrição, espera a contagem regressiva, assiste, conversa no chat e vota em enquetes. Não tem conta no produto.
- **Administração da plataforma** (interno): a lista de clientes. As chaves de transmissão dos clientes ficam na conta de cada um (`studio_settings`) e vão do navegador ao motor de transmissão; o registro de auditoria fica para depois.

## Product Purpose

Transmitir uma live para todos os canais de uma vez, direto do navegador e sem instalar nada. O mesmo produto cobre o ciclo inteiro do webinar: agendar, divulgar a página de inscrição, transmitir com recursos de venda e acompanhar o público. Hoje estão no ar o agendamento, o estúdio e a transmissão para os canais por RTMP; a página de inscrição ainda não.

O produto dá certo quando o operador passa a live inteira sem precisar sair dele e sem errar o que vai ao ar.

## Positioning

- **Um Restream brasileiro:** a interface é em português e o preço é em reais, com PIX entre as formas de pagamento.
- **Webinar completo:** agendamento, página de inscrição, sala do espectador e chat no mesmo lugar da transmissão (a página e a sala ainda não estão no ar).
- **Venda ao vivo:** ofertas, cupons, QR code de produto e banners, feitos para converter durante a live.

## Operating Context

- **Estúdio:** funciona como uma mesa de corte. Tem programa (o que está no ar) e preview (o que vai entrar), troca de cena por "take", tally de "no ar" e chat unificado das plataformas com moderação por IA (Gemini). Também tem banners, tickers, chroma key, teleprompter, compartilhamento de tela e trilha sonora.
- **Transmissão:** o programa do estúdio vai do navegador ao motor de transmissão (`motor/`: Node + ffmpeg no Fly.io, em São Paulo) por WebSocket, e de lá por RTMP/RTMPS a cada canal ligado: YouTube, Facebook, Twitch e qualquer servidor RTMP com URL e chave. Uma transmissão por conta de cada vez, em 720p a 30 qps. A ingestão por OBS/vMix (um servidor RTMP nosso) ainda não existe.
- **Painel:** webinars agendados, canais conectados, integrações (RTMP, redes sociais, webhooks), qualidade de vídeo e capa (thumbnail).
- **Conta:** planos, faturamento, dados de cadastro e consumo do plano.

## Capabilities and Constraints

- **Stack:** React 19, Tailwind v4 e Vite. A API é montada em `server.ts` (`createApiApp`) e roda na Vercel (`api/index.ts`) e no servidor local (`start-server.ts`). O login e os dados são do Supabase (Auth e Postgres, com RLS em cada tabela e as listas em tempo real), e o motor de transmissão roda fora da Vercel, no Fly.io, porque precisa de ffmpeg e de conexões que duram a live. O servidor tem rotas de Cloudflare Stream (criar entradas ao vivo) que nenhum fluxo usa.
- **Login:** em produção é só pelo Google. Por enquanto, e-mail e senha só existem no ambiente de desenvolvimento.
- **Horas do plano:** cada transmissão fica registrada (`stream_sessions`: início, fim, duração, canais); o limite de horas por mês dos planos ainda não é aplicado, e entra com a cobrança.
- **Planos e preços:** a fonte única é `src/lib/plans.ts`. Teste grátis de 30 dias; Standard R$ 49,90, Professional R$ 99,90 e Business R$ 199,90 por mês.
- **Pagamento:** ainda não há cobrança nem checkout. O site público e o app mostram os planos e dizem que a assinatura abre em breve. O webhook do Stripe está no servidor, mas sem checkout nada o aciona.
- **Chat das plataformas:** ainda não chega ao estúdio, porque não há ingestão real de comentários. O chat mostra só o que é enviado do estúdio.
- **Mídia do estúdio:** logos, fundos, sobreposições e clipes ficam na conta (Supabase Storage) e aparecem em qualquer aparelho.
  - Cada conta guarda até 200 MB e 300 arquivos, com até 50 MB por arquivo (o limite do plano grátis), em PNG, JPEG, WebP, MP4 ou WebM. Um logo em SVG vira PNG antes de ir para a conta.
  - As imagens baixam ao abrir o estúdio; um clipe, quando vai para o preview.
  - Cada navegador guarda uma cópia do que baixou, para o estúdio abrir sem baixar de novo, e a cópia sai quando a pessoa sai da conta.
- **Limites da conta no banco:** o plano grátis do Supabase dá 500 MB de banco para o projeto inteiro, não por conta, então o que cada conta grava tem teto: até 50 banners e 50 tickers, 32 canais guardados, 500 webinars, 500 capturas, 1000 pessoas na audiência e 2 MB de roteiro do teleprompter. Os tetos valem no banco, em cada gravação, e não só na tela. Hoje estão muito acima do uso, e a tela mostra os que a pessoa alcança: a contagem nos banners e tickers ("49 de 50 banners."), que fecha o botão de novo item no limite; o contador do roteiro, a partir de 80% do limite; e, quando um teto bate, a frase de qual foi e a saída (apagar o que não usa, ou cortar o texto). Os campos de nome, servidor e chave do canal têm um teto de caracteres alto, só para segurar o que é lixo colado. Capturas e audiência o app ainda não grava, e por isso a tela não os mostra.
- **Terminologia:** "PwStreamer" é o produto; "PW Stream Online" é a razão social, usada no copyright e em textos legais. As grafias são diferentes de propósito.

## Brand Commitments

- O nome do produto é **PwStreamer**, e o logo está em `src/components/PwStreamLogo.tsx`.
- O copyright e os textos legais usam a razão social, **PW Stream Online**.
- Voz em português do Brasil.
- Existe uma direção visual aprovada (`mockups/FINAL-direction.html` e `mockups/design-system.html`). O registro visual fica no DESIGN.md, não aqui.

## Evidence on Hand

**Não existe prova social real.** O produto está em alfa: sem clientes, sem depoimentos, sem métricas de uso, sem logos de clientes e sem imprensa. Nada disso pode ser inventado. Números, audiências e equipes fictícias já foram removidos do app.

A única imagem do site público é uma captura real do Painel, com dados de exemplo ditos na legenda (`src/assets/site/painel-exemplo.png`, com a proveniência embutida no PNG). A página de Recursos saiu: repetia o que o início já diz, com promessas que o produto não cumpre.

## Product Principles

1. **O que vai ao ar vem primeiro.** Durante a live, nada disputa atenção com o programa. A interface serve ao operador, e não o contrário.
2. **Cada tela responde a uma tarefa.** Informação que não ajuda a tarefa do momento sai da tela ou fica a um clique. Mostrar tudo o que o produto sabe fazer não é recurso.
3. **Honestidade antes de efeito.** Nada de números, audiências, clientes ou pagamentos inventados. Onde não há dado, a tela diz isso.
4. **Brasil primeiro.** Linguagem, preço, meios de pagamento e exemplos do público brasileiro.
5. **Do agendamento à venda, sem sair do produto.** O webinar é um ciclo só, e não quatro ferramentas coladas.

## Accessibility & Inclusion

- WCAG 2.1 AA.
- O CI já cobra: contraste texto/superfície nos temas claro, escuro e console; nome acessível em botões só-ícone e em campos de formulário; `autoComplete` em e-mail e senha.
- Tudo precisa ser operável pelo teclado, inclusive as abas e a troca de cena.
