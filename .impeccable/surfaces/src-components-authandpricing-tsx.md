---
version: 1
slug: "src-components-authandpricing-tsx"
primary_target: "src/components/AuthAndPricing.tsx"
related_targets: ["src/components/InicioPublico.tsx","src/components/PublicHeader.tsx","src/components/ListaDePlanos.tsx","src/lib/plans.ts"]
---

# Site público (início, planos, entrada)

**Modo:** Persuade.

**Público:** criadores e empresas brasileiras que fazem lives e webinars em vários canais; chegam sem conta.

**Tarefa do visitante:** entender o que o PwStreamer já faz hoje e o que entra em breve, quanto vai custar, e criar a conta para montar a primeira live.

**Restrições (decididas com o usuário em 2026-09-26):**
- Acesso antecipado dito com todas as letras. Já funciona: estúdio no navegador (câmera, tela, cenas, chroma key, banners, teleprompter), canais com o que falta em cada um, webinars agendados com data, hora e canais. Em breve: transmitir para os canais, link público de inscrição, OBS e vMix, assinatura.
- Planos: a mesma lista do app (`ListaDePlanos`, `plans.ts`), assinatura em breve, sem checkout; o convite é criar a conta com o teste grátis. Em 2026-09-27 o usuário decidiu tirar de `plans.ts` o OBS e a gravação (o estúdio não grava arquivo), no site e no app.
- Imagem: captura real do Painel redesenhado, com dados de exemplo ditos como exemplo.
- Sem prova social (PRODUCT.md): nenhum número, cliente ou depoimento.

**Momento memorável:** a lista do que já funciona aponta para a captura: passar o mouse num item contorna a região dele no Painel. Só o mouse aciona: os itens não são controles e não viram paradas de foco sem ação, e no toque a captura fica acima da lista, fora da tela. Onde há mouse, a legenda dá a pista.

## Direction contract

THESIS: o produto como está: o Painel de verdade ao lado da promessa, e o que já funciona e o que vem, lado a lado. Recusa promessas e números inventados.

OWN-WORLD: DESIGN.md: rampa navy, Poppins nos quatro tamanhos, linhas em vez de cartões, azul só em "Criar conta"; a captura do Painel é a única imagem.

STORY: entende o que é, vê o Painel, lê o que já funciona e o que vem, confere os planos e cria a conta.

FIRST VIEWPORT: à esquerda, título, frase de acesso antecipado, "Criar conta" e "Entrar"; à direita, a captura do Painel em meia largura. Gesto: cada item de "Já funciona" contorna sua região na captura.

FORM: herói dividido, índice 1 da lista (semente 9cb80a6e: 6, 1, 7; 2ª carta).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
