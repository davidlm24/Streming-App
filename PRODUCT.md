# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Mesmo nicho do Restream: quem transmite ao vivo para várias plataformas ao mesmo tempo (YouTube, Facebook, Twitch e outras) a partir do navegador. São criadores e empresas que fazem lives e webinars.

O produto tem quatro públicos, em situações diferentes:

- **Operador no estúdio, durante a live.** É o momento de maior pressão. A atenção dele está no que vai ao ar: câmeras, cenas, banners, chat. Ele troca de cena (preview → programa), modera comentários e aciona ofertas. Um erro aqui é público.
- **Anfitrião entre as lives, no painel.** Agenda webinars, conecta canais e destinos, configura a ingestão por OBS/vMix, cuida do plano e da conta.
- **Espectador na página pública do webinar.** Faz a inscrição, espera a contagem regressiva, assiste, conversa no chat e vota em enquetes. Não tem conta no produto.
- **Administração da plataforma** (interno): chaves de transmissão dos clientes e visão geral dos clientes.

## Product Purpose

Transmitir uma live para todos os canais de uma vez, direto do navegador e sem instalar nada. O mesmo produto cobre o ciclo inteiro do webinar: agendar, divulgar a página de inscrição, transmitir com recursos de venda e acompanhar o público.

O produto dá certo quando o operador passa a live inteira sem precisar sair dele e sem errar o que vai ao ar.

## Positioning

- **Um Restream brasileiro:** a interface é em português e o preço é em reais, com PIX entre as formas de pagamento.
- **Webinar completo:** agendamento, página de inscrição, sala do espectador e chat no mesmo lugar da transmissão.
- **Venda ao vivo:** ofertas, cupons, QR code de produto e banners, feitos para converter durante a live.

## Operating Context

- **Estúdio:** funciona como uma mesa de corte. Tem programa (o que está no ar) e preview (o que vai entrar), troca de cena por "take", tally de "no ar" e chat unificado das plataformas com moderação por IA (Gemini). Também tem banners, tickers, chroma key, teleprompter, compartilhamento de tela e trilha sonora.
- **Ingestão externa:** servidor RTMP e chave de transmissão para OBS, vMix e Streamlabs. Destinos personalizados por RTMP/RTMPS.
- **Painel:** webinars agendados, canais conectados, integrações (RTMP, redes sociais, webhooks), qualidade de vídeo e capa (thumbnail).
- **Conta:** planos, faturamento, dados de cadastro e consumo do plano.

## Capabilities and Constraints

- **Stack:** React 19, Tailwind v4 e Vite. A API roda na Vercel (`api/index.ts`) e o servidor local em `server.ts`. Firebase Auth e Firestore usam um banco com nome, e há integração com Cloudflare Stream.
- **Login:** em produção é só pelo Google. Por enquanto, e-mail e senha só existem no ambiente de desenvolvimento.
- **Planos e preços:** a fonte única é `src/lib/plans.ts`. Teste grátis de 30 dias; Standard R$ 49,90, Professional R$ 99,90 e Business R$ 199,90 por mês.
- **Pagamento:** ainda não processa cobrança real, e o checkout diz isso ao usuário. O webhook do Stripe só existe no servidor local.
- **Chat das plataformas:** ainda não chega ao estúdio, porque não há ingestão real de comentários. O chat mostra só o que é enviado do estúdio.
- **Terminologia:** "PwStreamer" é o produto; "PW Stream Online" é a razão social, usada no copyright e em textos legais. As grafias são diferentes de propósito.

## Brand Commitments

- O nome do produto é **PwStreamer**, e o logo está em `src/components/PwStreamLogo.tsx`.
- O copyright e os textos legais usam a razão social, **PW Stream Online**.
- Voz em português do Brasil.
- Existe uma direção visual aprovada (`mockups/FINAL-direction.html` e `mockups/design-system.html`). O registro visual fica no DESIGN.md, não aqui.

## Evidence on Hand

**Não existe prova social real.** O produto está em alfa: sem clientes, sem depoimentos, sem métricas de uso, sem logos de clientes e sem imprensa. Nada disso pode ser inventado. Números, audiências e equipes fictícias já foram removidos do app.

A captura do estúdio na landing e as imagens da página de Recursos ainda são placeholders (`TODO(imagem)`).

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
