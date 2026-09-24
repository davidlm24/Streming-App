> ## Nota de verificação independente
>
> Auditoria gerada por seis agentes de lente exclusiva, cada achado submetido a
> uma passada adversarial. **71 achados sobreviveram** (18 P0 · 36 P1 · 17 P2).
>
> Antes de publicar, abri os arquivos e conferi os P0 de maior consequência.
> Quatro se confirmaram; **dois tinham evidência errada** e estão corrigidos abaixo.
> O relatório original das lentes segue íntegro a partir da próxima seção — esta
> nota é o que a verificação mudou, não uma reescrita.
>
> | P0 | veredito | observação |
> |---|---|---|
> | Plano liberado no `catch` (`PlansModal.tsx:48`) | **confirmado** | Pior que o descrito: o ramo `if (data.url)` também concede o plano quando a resposta vem sem URL. |
> | Rótulos de sandbox em produção (`AuthAndPricing.tsx:870,951,983,1023`) | **confirmado** | `IS_DEV` existe na linha 16 e gateia só o preenchimento de cartão (53-55, 60). Os rótulos ficaram de fora. |
> | Telemetria fabricada (`AdminPanel.tsx:414`) | **confirmado** | `'1.240'`, `'482'`, `'1080p 60fps'` são literais. É a recidiva do defeito que a Fase 5 corrigiu no dashboard — a correção não generalizou. |
> | Login direto sem credencial (`AuthAndPricing.tsx:521`) | **substância confirmada, evidência errada** | O agente afirmou "não há `IS_DEV` neste arquivo (grep: zero)" — **falso**, está na linha 16. O achado real é mais forte: o padrão era conhecido e aplicado no mesmo arquivo, mas não nestes dois botões. |
> | Divergência de moeda (`AuthAndPricing.tsx:1125,1133`) | **localização errada, problema maior** | Os literais `$14.00/$29.00/$49.00` **não existem** ali. O defeito real: `AuthAndPricing.tsx:90,114,139` define R$ 49,90/99,90/199,90 e `BillingDashboard.tsx:172,196,221` define 14/29/49 em USD — `BillingDashboard` não tem nenhuma ocorrência de `R$`. Não é rótulo divergente: são **duas tabelas de preço inteiras** para as mesmas três assinaturas. |
>
> Lição para quem ler os demais achados: a **direção** das lentes se mostrou
> confiável, mas `arquivo:linha` precisa ser conferido antes de agir.

# Auditoria de UI/UX — PwStreamer
## Site público e dashboard · síntese de seis lentes independentes

A camada de sistema está à frente do produto que ela veste: tokens, portão de contraste e primitivas existem, funcionam e são citados corretamente pelos próprios arquivos. O que falha são as telas que nunca passaram por eles — e, principalmente, o que essas telas **dizem**. As cinco superfícies auditadas (landing, checkout, inscrição pública, dashboard, faturamento e painel do cliente) compartilham três defeitos de origem: ficção apresentada como dado real, preço sem fonte única, e uma camada semântica que nunca foi escrita sob um visual maduro. No tema claro o item selecionado fica invisível; abaixo de 1.280px o cabeçalho sai da tela. Nada disso é polimento pendente — são portas trancadas e informação falsa em telas de cobrança.

---

## 1. O que precisa mudar antes de mais nada

Ordenado por dano ao usuário, não por esforço.

### P0-1 · O botão "Pagar e Ativar" libera o plano pago de graça em qualquer falha de rede
`src/components/PlansModal.tsx:48` (e o ramo sem `url`, 40-47)

O `catch` chama `onPlanUpgraded(selectedPlan)` e exibe "Plano Professional ativado com sucesso!". Qualquer `fetch` que falhe — offline, `/api/checkout` ausente, CORS — concede o plano. O comentário das linhas 64-67 registra que o botão "(Demo)" foi removido exatamente para fechar esse caminho; ele continua aberto, agora sem rótulo que o denuncie.

Somado a isso, na mesma função: `finally { setLoading(false) }` (linha 59) roda antes de o navegador concluir `window.location.href = data.url` (36-38), e o ramo de demonstração deixa 1,2s de janela clicável — dois `POST /api/checkout`, duas sessões de cobrança. *(Duas lentes, independentes: copy e estados chegaram ao mesmo handler por caminhos diferentes — uma pelo rótulo, outra pelo ciclo de vida.)*

**Correção:** no `catch` e no caso sem `url`, não ativar nada — erro acionável, plano mantido. Tirar `setLoading(false)` do `finally` e mantê-lo ligado no ramo de redirect. `if (loading) return;` na primeira linha do handler. Trocar o `<button>` cru pela primitiva `Button` com `loading`.

### P0-2 · O site vende em reais e o checkout cobra em dólares, com outro número
`src/components/AuthAndPricing.tsx:1125` e `:1133`

A vitrine imprime `R$ 49,90 / 99,90 / 199,90` (`AuthAndPricing.tsx:90,113,139`, renderizado na 754). Duas telas adiante o resumo do mesmo pedido é literal inline: `$14.00 / $29.00 / $49.00`, com "Total Cobrado: $14.00 / mês". O dashboard confirma a segunda tabela (`BillingDashboard.tsx:172,196,221`) e o histórico imprime `USD` (1244). Nenhum texto explica a troca. No fallback, `selectedPlan` nulo ou `Free Trial` cai no ramo final e mostra $49.00.

**Correção:** `src/lib/plans.ts` como fonte única com moeda explícita, importada por AuthAndPricing, BillingDashboard e PlansModal. O resumo formata a partir dela, nunca de literais.

### P0-3 · O checkout de produção diz ao comprador que é sandbox — e pede o cartão mesmo assim
`src/components/AuthAndPricing.tsx:870`

"Ambiente de testes ativo. Autofácil de dados de cartão de crédito Stripe:" (a frase também está quebrada em pt-BR), seguida de `4242 4242 4242 4242 | 12/29 | CVV 424` e um botão "Preencher" (873-885). Aba Mercado Pago: "Chave PIX Simulada" (1023-1024) com `...mercado-pago-sandbox-key-98` (1031). PayPal: "Entrar e Autorizar PayPal Sandbox" (983). Acima do botão final: "Simulação segura. Clique em confirmar para ativar o plano imediatamente" (1139). O mesmo no faturamento: `BillingDashboard.tsx:733, 940, 1009`. Nada disso está sob `IS_DEV` — a constante existe em `AuthAndPricing.tsx:16` e gateia apenas o preenchimento dos campos.

**Correção:** `{IS_DEV && …}` em todo bloco de credencial de teste e em todos os rótulos "Sandbox"/"Simulada"/"Test Card". Em produção, o checkout ou cobra ou não pede cartão. Corrigir "Autofácil de dados".

### P0-4 · Botão de login direto em conta nomeada, sem credencial, com o e-mail impresso na tela
`src/components/AuthAndPricing.tsx:521` (idêntico em 373-380)

`handleDirectDevLogin('mgdlms@gmail.com', 'Marcos Gonçalves')` com rótulo visível "Entrar agora como Marcos Gonçalves (mgdlms@gmail.com)". A condição de render é `isUnauthorizedDomain` — ou seja, **qualquer** domínio fora da lista do Firebase: preview de deploy, staging, domínio novo. Não há `IS_DEV` neste arquivo (grep: zero), ao contrário de `Header.tsx:12`, que documenta exatamente esse cuidado nas linhas 7-11.

**Correção:** `const IS_DEV = Boolean(import.meta.env?.DEV)` e `{IS_DEV && isUnauthorizedDomain && …}` nos dois blocos, para o Vite eliminar o ramo no build. E-mail vem de variável de ambiente; rótulo vira "Entrar como usuário de teste". O painel de diagnóstico (355-371 / 501-517) pode ficar.

### P0-5 · O dashboard entrega ao cliente pagante o roteiro interno de engenharia — e uma chave "_prod_" compartilhada
`src/App.tsx:3440`

O card "Análise de Requisitos & Chaves" (3103) abre um modal que lista, para quem paga: "Painel de Cobranças e Faturas — Pronto / **Simulação Premium** — simula pagamentos Stripe, PayPal, Mercado Pago" (3440); "Servidores de Ingestão RTMP/SRT — **Requer Produção** — substituir as chaves simuladas por ingestão real" (3445); "Durable Database (PostgreSQL) — substituir a persistência de localStorage atual" (3444). Abaixo, os nomes das variáveis secretas: `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `MERCADO_PAGO_ACCESS_TOKEN`, `AWS_ACCESS_KEY_ID`, `CLOUDFLARE_API_TOKEN`, `BREVO_SMTP_KEY` (3455-3462). A aba RTMP oferece `value="live_5427901_pw_prod_99a8x72cd"` sob "Parâmetros de Conexão Ativos" (3509) — a **mesma chave fixa para todo usuário**, contradizendo o AdminPanel, que promete "Chave de Ingestão Exclusiva / Isolado para: {user.email}" (`AdminPanel.tsx:203,210`) e ainda usa outro servidor (`:1935/live` × `/live`).

A lente de cor chegou ao mesmo card pelo outro lado: a linha que o abre (`App.tsx:3098-3107`) é a única das três irmãs pintada de esmeralda, com `Sparkles animate-pulse` — o vocabulário de "novidade boa" aplicado ao item que confessa que o faturamento é simulado. *(Duas lentes, independentes.)*

**Correção:** remover a aba "Análise de Requisitos" e a lista de variáveis de ambiente do produto; manter "Ingestão OBS & RTMP" e "Mídias Sociais", com a aba RTMP lendo a chave real do usuário (a mesma fonte do AdminPanel). Remover a linha 3093-3108. Enquanto a ingestão não existir, o lugar de dizer isso é um estado vazio honesto.

### P0-6 · Números fabricados apresentados como telemetria, equipe, audiência e registro financeiro
`src/components/AdminPanel.tsx:414` · `src/components/BillingDashboard.tsx:1650` · `src/components/WebinarPublicPage.tsx:74`

Três telas, o mesmo defeito, com vítimas diferentes:

- **Painel do cliente** — "Espectadores Conectados 1.240", "Comentários Recebidos 482", "Qualidade da Ingestão 1080p 60fps / Bitrate estável em 8 Mbps": três literais num array, renderizados com o desenho dos KPIs reais. Ao lado, `clientDestinations` já semeado com três canais que o cliente nunca conectou, dois marcados "Ativo na Live", com chaves falsas (`AdminPanel.tsx:95-97`) sob o rótulo "Canais Ativos para Suas Transmissões (3)".
- **Consumo do Plano** — dois colegas de equipe fixos no código para todo cliente: "Ana Beatriz — Co-Produtor — ana.beatriz@pwstreamer.com" (1657,1667) e "Lucas Lima" (1717,1727), com consumo semeado (62-78), usados como argumento no aviso "Bloqueado / Desbloquear Assento (Professional)". É prova social fabricada vendendo upgrade. Os botões `+15m` e `+0.5GB` (1631-1644) e o selo "Sandbox de Teste Ativo" (1459-1469) não estão sob `IS_DEV`, embora o arquivo declare a constante na linha 9.
- **Página pública do webinar** — o contador sob "A transmissão começará em:" é `useState({ hours: 2, minutes: 45, seconds: 12 })` (74) e **não deriva de `webinarDate`**, que a mesma página imprime dois blocos acima como texto (209). Todo visitante, a qualquer hora, vê 02h:45m:12s, e o número reinicia a cada F5. Somam-se 85 votos de enquete inventados (64) e duas perguntas de pessoas que não existem, com 12 e 7 votos (67-70). O formulário promete "materiais extras" (268) e exibe selos "Certificado" e "Material Complementar" (343-345), enquanto `handleRegister` só grava em localStorage — e o próprio `App.tsx:3446` classifica "Disparo real de convites e certificados" como "Requer Produção".

Este último é o pior: os números não são vistos pelo cliente, são vistos pela **audiência do cliente**.

**Correção:** a regra já adotada em `App.tsx:2946-2951` (sem fonte → travessão + "Aguardando telemetria") vale para as três telas. `clientDestinations`, `memberMinutes`, `memberStorage`, `pollVotes` e `qaQuestions` iniciam vazios, com estados vazios desenhados. `timeLeft` deriva de `webinarDate`; se não for parseável, o contador some. Remover os selos de certificado até que o envio exista.

### P0-7 · Um caractere digitado dentro de qualquer Modal joga o foco no "X" — e a tecla seguinte fecha e descarta o formulário
`src/components/ui/Modal.tsx:130`

O efeito de foco tem deps `[isOpen, handleClose]`, e `handleClose` é um `useCallback` sobre `onClose` (69-71). Todos os call sites passam arrow inline (`App.tsx:3205`), e o estado do formulário mora no mesmo componente (`newWebinarTitle`, `App.tsx:243`). Cada tecla → re-render → nova identidade de `onClose` → cleanup + re-setup do efeito → `panel.querySelector(FOCUSABLE)` (93-96) refoca o primeiro focável, que é o botão de fechar (`App.tsx:3216`).

Medido no app rodando (modal "Agendar Nova Transmissão"): foco no input, um caractere, 300ms → `document.activeElement` é um `<button>` cujo SVG é `lucide-x`. Acionando-o — o que Espaço ou Enter fazem num botão focado — `dialogStillOpen: false`, com o texto digitado perdido. Atinge 8 call sites: `App.tsx:3130, 3205, 3383`; `LeftSidebar.tsx:5350, 5383`; `WebhookPanel.tsx:1336`; `StreamReportModal.tsx:59`; `PlansModal.tsx:94`.

**Correção:** `onClose` num ref atualizado por efeito sem deps; efeito de foco/ESC com deps `[isOpen]` apenas. Mover `restoreFocusRef.current?.focus?.()` para o desmonte do diálogo, não para o cleanup de cada render. Priorizar `input,textarea,select` antes de `button` na busca do primeiro focável.

### P0-8 · A inscrição pública pode falhar em silêncio absoluto
`src/components/WebinarPublicPage.tsx:115`

`localStorage.setItem('webinar_registrations', …)` sem proteção, e só depois `setRegistered(true)` (117). Se o setItem lançar (Safari privado, cota, política de cookies), a exceção sobe e a linha 117 nunca roda. O próprio arquivo prova que o autor sabe que esse storage falha: o **read** está em try/catch nas linhas 54-58. O botão (335-340) é um `<button type="submit">` cru — sem `disabled`, sem `loading`, sem variante pendente — e não existe nenhum estado de erro no componente.

O usuário preenche nome, e-mail, empresa, marca o consentimento, clica, e a página não faz absolutamente nada. Esta é a **única conversão da superfície pública** do produto.

**Correção:** try/catch em volta da gravação e três saídas explícitas do submit: pendente (`Button` com `loading`, que já marca `aria-busy`), sucesso (o painel "Vaga Garantida!" existente), erro (faixa com instrução), preservando os campos digitados.

### P0-9 · A navegação do cabeçalho está fora da tela abaixo de 1.274px — e desaparece por completo entre 768 e 1.023px
`src/components/Header.tsx:210` e `:196`

Dois defeitos que se somam no mesmo elemento:

O agrupamento de controles é `flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0` — `shrink-0` e `min-w-0` se contradizem, e `shrink-0` vence. Medido no dev server: a 1024px, `header.scrollWidth` = 1190 (166px fora da tela) e `#user-menu-button` tem `right` = 1190; a 768px, scrollWidth = 958 e `right` = 958. Só a 1280px o cabeçalho cabe (1274). A varredura de nós com `right > innerWidth` retornou 11, todos dentro do header. O tratamento responsivo existente cuida apenas dos **rótulos** (`hidden sm:inline` em 437/439), nunca do agrupamento.

E os dois blocos de navegação usam pontos de corte incompatíveis: `<nav className="hidden lg:flex">` (196) aparece só ≥1024px, enquanto o hambúrguer (512) e seu painel (522) são `md:hidden` e somem a partir de 768px. Medido a 820px: `nav` com `display: none` e hambúrguer com `offsetParent` null. O dropdown do avatar não contém "Painel" nem "Estúdio de Transmissão" — eles existem só nos dois blocos mutuamente excludentes.

Em iPad retrato (768/820/834), Surface (912) e qualquer janela de laptop reduzida, o assinante perde o único link para o Estúdio e para o Painel, e o menu da própria conta nasce fora do viewport.

**Correção:** trocar `shrink-0` por `min-w-0` real e colapsar "Adicionar canais", o dropdown LIVE STREAM/RECORDING e o bloco de perfil em ícone-só abaixo de `xl` (ou movê-los para o painel móvel). Unificar os dois blocos em `lg`: `hidden lg:flex` na nav, `lg:hidden` no hambúrguer e no painel.

### P0-10 · O teclado e o leitor de tela não alcançam o produto
`src/App.tsx:3065` · `src/components/BillingDashboard.tsx:770` · `src/components/AdminPanel.tsx:396`

Três varreduras, o mesmo resultado:

- **Quatro `<div onClick>`** em `App.tsx:3065, 3079, 3093` e `3320`, sem `role`, sem `tabIndex`, sem `onKeyDown`. Os três primeiros são o **único** ponto de entrada do dashboard para o modal de Integrações — chaves de ingestão OBS/RTMP e OAuth de redes sociais: `setIsIntegrationsModalOpen(true)` não é chamado de nenhum `<button>` no ramo de dashboard. WCAG 2.1.1; não é degradação, é uma porta trancada. Como nada é focável, nem o `:focus-visible` global de `index.css:335` tem onde se aplicar.
- **31 campos sem rótulo programático**: `<label>` sem `htmlFor` e sem controle aninhado em BillingDashboard (15 de 15: 770, 782, 793, 807, 835, 845, 956, 968, 978, 990, 1134, 1148, 1167, 1181, 1196), WebinarPublicPage (272, 284, 296), AdminPanel (229, 253, 321, 337, 349), App (3258, 3271, 3284, 3295, 3311, 3333) e Header (269, 302). O campo "Número do Cartão" é anunciado como "editar texto, em branco". No cadastro público de webinar, só o placeholder nomeia — e ele desaparece ao digitar. `AuthAndPricing.tsx` tem 16 labels e **zero** órfãos: o padrão certo já existe no projeto.
- **Sete botões só de ícone sem nome acessível**. `lucide-react` adiciona `aria-hidden="true"` quando o ícone não tem filhos nem prop de a11y, então um `<button>` cujo único conteúdo é um ícone tem nome vazio. Sem `aria-label`, `title` ou texto: `AdminPanel.tsx:396` (`Trash2`, **destrutivo**), `Header.tsx:509` (`Menu` — a navegação inteira no celular), `WebinarPublicPage.tsx:521` (enviar mensagem), `App.tsx:3140, 3216, 3394` e `PlansModal.tsx:105` (fechar modal). `Header.tsx:434` mostra que o app sabe fazer certo.

**Correção:** os quatro divs viram `<button type="button" className="w-full text-left">` (as classes de layout são compatíveis); `id`/`htmlFor` em cada par, com `<fieldset><legend>` onde o label é de grupo (`App.tsx:3333`, `AdminPanel.tsx:381`); `aria-label` nos sete botões. Acrescentar a contagem de labels órfãos como décima métrica em `scripts/design-debt.mjs`.

### P0-11 · No tema claro, o rótulo do item SELECIONADO fica em 1,15–1,22:1
`src/components/AuthAndPricing.tsx:833` *(duas lentes, independentes: a11y e responsivo mediram o mesmo par por caminhos diferentes e chegaram ao mesmo número)*

Oito lugares, todos estados de seleção: `AuthAndPricing.tsx:833, 844, 855` (abas de gateway do checkout), `PlansModal.tsx:208, 213, 218` (método de pagamento), `AdminPanel.tsx:187` (aba ativa do painel), `App.tsx:3341` (canais marcados no modal de agendar webinar). Todos são `text-white` sobre `bg-blue-500/10` ou `/5`.

`text-white` é literal (#FFF), e o bloco de remapeamento de `--ink` em `index.css:288-312` usa `[class~="bg-blue-500"]`, que **não casa** com o token de classe `bg-blue-500/10` — o próprio comentário do arquivo diz isso. Sondado ao vivo em `data-theme="light"`: `text-white` resolve `rgb(255,255,255)` e `bg-blue-500/10` resolve `oklab(… / 0.1)`, nenhum reapontado. Base do cartão `bg-[var(--surface)]/80` (n-99 #FAFCFF) sobre `--bg` (n-96 #F0F5F9) → (248,251,254); composto com #3B82F6 a 10% → (229,239,253), Y = 0,8545; contraste do branco = **1,16:1**. Exigido 4,5:1. Os mesmos pares no tema escuro dão 15,38:1. Captura em tela confirma: a aba ativa "SUA CHAVE DE INGESTÃO OBS / ENCODER" aparece como texto fantasma.

É o único estado do produto em que a informação **escolhida** desaparece: qual gateway, qual aba, qual método, qual canal.

**Correção:** `text-[var(--ink-hi)]` nos oito pontos — o preenchimento a 5–10% e a borda `border-blue-500` já carregam a seleção. Se o branco tiver de ficar, o fundo ativo precisa ser sólido (`bg-[var(--color-brand-deep)]`). Não estender a regra `[class~=…]` para variantes com alfa: ali o texto deve seguir o tema.

### P0-12 · As quatro abas do AdminPanel viram um bloco de 90px de altura
`src/components/AdminPanel.tsx:175`

`<div className="flex border-b border-[var(--line)] pb-px gap-1">` — sem `overflow-x-auto`, sem `flex-wrap`, e os botões (183/185) sem `shrink-0` e sem `whitespace-nowrap`, com rótulos de até 56 caracteres ("Destinos para Redes Sociais (YouTube / Facebook / Twitch)") em `text-xs uppercase tracking-wider`.

Largura intrínseca calculada: 146 caracteres em caixa alta com tracking ≈ 1.110–1.170px de texto, mais o cromo de cada aba (63px × 4) e os gaps → **≈1.370–1.430px**, contra um container `max-w-7xl px-4 sm:px-6 lg:px-8` cujo teto é 1.216px. Por ser `max-w`, transborda em 1280, 1440 e 1920px igualmente — 12 a 18% de excesso em **toda** largura de desktop. Medido a 695px: `clientWidth` 641, `scrollWidth` 641, `overflow-x: visible` — nada rolou, tudo comprimiu; as quatro abas ficaram com **90px de altura cada** (o esperado em `py-3 text-xs` é ~38px), com o `border-b-2` do estado ativo nascendo em alturas diferentes entre vizinhas. *(Duas lentes, independentes: uma pela largura intrínseca, outra pela medição no viewport.)*

**Correção:** copiar a solução já validada da irmã direta — `overflow-x-auto scrollbar-none` no container e `shrink-0 whitespace-nowrap` em cada botão, como em `BillingDashboard.tsx:420/434`. Encurtar o rótulo de 56 caracteres para "Destinos", com as plataformas no corpo da aba.

---

## 2. Padrões, não incidentes

Oito causas explicam a maior parte do que as seis lentes encontraram. Esta é a seção que vale mais que a lista: corrigir a causa fecha dezenas de pontos de uma vez e impede a regressão.

### A · O tema claro é uma lista de exceções, não uma regra
**Causa:** o bloco de reapontamento cromático (`src/index.css:159-171`) cobre **apenas os tons 300 e 400** de 13 matizes, e o remapeamento de tinta (`288-312`) casa por `[class~="bg-blue-500"]`, que ignora variantes com alfa. Tudo que está fora dessa janela passa cru para o tema claro. O portão de contraste do CI não vê nada disso porque compara pares token×token, e aqui o par é classe crua sobre superfície composta.

Membros medidos, todos no tema claro:

| Onde | Medido | Arquivo |
|---|---|---|
| Caixas de erro do site público (auth, login, cadastro, checkout) — `bg-red-950/40` + `text-red-400` | **2,49:1** | `AuthAndPricing.tsx:385, 531, 608, 820` |
| 48 usos de `text-*-500/600/700` (43 blue-500, 2 emerald-500, 2 blue-600, 1 amber-500) | **3,58:1** | `LegalModals.tsx:46` (22×), Header 7, BillingDashboard 7, WebinarPublicPage 5, AuthAndPricing 3, AdminPanel 2, PlansModal 2 |
| Faixa de teste expirado — `text-amber-200` sobre a parada central `var(--surface)` | **1,21:1** (13,87:1 no escuro) | `Header.tsx:156-157` |
| Contador de dias restantes — `text-emerald-400` sobre o gradiente composto na posição x=283 | **3,28:1** (o resto da faixa, em tokens, dá 6,36–11,03:1) | `Header.tsx:139` |
| Barra de assinatura ativa — `via-slate-950` sem alfa, 950 não é remapeado | salto de valor **17,8:1** contra o papel: tarja preta atravessando o topo | `Header.tsx:178` |
| `hover:text-*-300` é no-op: o bloco define 300 e 400 com o **mesmo hexadecimal** | 5 controles sem retorno de hover, dois deles as ações primárias de cada webinar | `App.tsx:3019, 3033`; `BillingDashboard.tsx:400, 1581`; `AuthAndPricing.tsx:677` |

O P0-11 (`text-white`) é o caso extremo do mesmo buraco.

**Correção estrutural:** estender `index.css:159-171` aos tons 500/600/700 e 950 dos mesmos 13 matizes, medidos contra `--bg` e `--surface` como os outros — é uma regra, não 60 edições. Onde a intenção é marca, trocar `text-blue-500` por `text-[var(--color-brand)]`. Acrescentar ao `scripts/contrast-gate.mjs` uma família de pares "texto literal / classe crua × superfície composta por alfa", senão a regressão volta inteira.

Nota lateral que o mesmo grupo revela: **três faixas de estado do Header são gradientes decorativos** (`134`, `156`, `178`) que atravessam o próprio token de superfície. Nenhum organiza informação, e o único caso que o sistema admite para gradiente é o logotipo (`index.css:57-66`, isoluminante de propósito). A correção é a mesma para as três: fundo chapado `bg-[var(--panel)]` com `border-l-4 border-[var(--color-sig)]` e texto em `--ink-hi`, deixando o estado ser carregado por ícone e texto.

### B · Seed de desenvolvimento e estado inicial são a mesma coisa no código
**Causa:** não existe `IS_DEV` em `App.tsx` nem em `AuthAndPricing.tsx` (grep: zero), embora `Header.tsx:12` e `BillingDashboard.tsx:9` declarem e usem a constante. Onde falta a guarda, os dados de demonstração são literalmente o estado inicial — e nenhuma dessas listas tem estado vazio desenhado, de modo que remover o seed deixaria um buraco. As duas omissões se sustentam uma na outra.

Além dos P0-5 e P0-6, os membros ainda abertos:

- **`AdminPanel.tsx:63`** — `primaryKey` cai num objeto literal de fallback quando `clientRtmpKeys` está vazio, com sufixo fixo `_881023a` e `active: true`. A assinatura do Firestore é assíncrona e, no ramo `keys.length === 0`, nem chama `setClientRtmpKeys`. Não existe nenhum `isLoading` no componente. Medido no app: o campo "Sua Chave de Stream Atribuída" mostra `pw_live_testeexemplocom_881023a` com o selo **"Ativa no Server"**, copiável, e ainda repassado ao `OBSIntegrationModal` (452). Uma credencial de produção não pode ter um valor de espera indistinguível do verdadeiro.
- **`BillingDashboard.tsx:137`** — toda conta nova abre o histórico com duas faturas "Pago", uma delas afirmando $14.00 via Stripe em 11/05/2026, sob a promessa "baixe os recibos fiscais de suas mensalidades" (1222), com download gerando um arquivo com "Valor Pago: $14.00 USD" e os dados fiscais do usuário (341-373). Enquanto o download for um `.txt`, o rótulo não pode ser "recibo fiscal" nem o cabeçalho "Dados de Emissão Fiscal (Invoice / NF-e)" (1163).
- **`App.tsx:2979`** — dois webinares fictícios (208-227) piscam por algumas centenas de milissegundos até `setWebinars(firestoreWebinars)` (1519) substituí-los, e sobra uma caixa de altura quase nula sem convite para criar o primeiro. O time já tratou o caso zero no KPI ao lado (`2948`: `webinars.length === 0 ? 'Nenhum ainda' : …`); a lista, que é o painel herói da tela, não recebeu o mesmo cuidado.

**Correção estrutural:** a regra já escrita em `App.tsx:2946-2951` vira norma — sem fonte, travessão e "Aguardando telemetria". Todo seed vira `[]` com estado vazio desenhado e um `isLoading` explícito com esqueleto; tudo que é simulação vai para trás de `IS_DEV`.

### C · Não existe fonte única de planos
**Causa:** preço, limites, resolução, destinos e lista de recursos são literais escritos à mão em quatro arquivos. Nada impede que divirjam, e eles divergem.

- `Header.tsx:181` exibe a todo assinante "acesso **ilimitado** a transmissões e gravações", enquanto `BillingDashboard.tsx:185-187` vende "3 horas da transmissão ao vivo" e a aba de consumo define `'Standard': { minutes: 1200 }` (1379-1383), disparando "Você consumiu X% dos minutos contratados" a partir de 80% (1569). Três afirmações incompatíveis sobre o mesmo plano, a um clique de distância.
- A mesma aba diz `Resolução de Transmissão: Full HD 1080p Ultra` (1782) para o Standard que o cartão vendeu como **"780p"** — resolução que não existe; o valor pretendido é 720p, e o erro já saiu para o público em duas telas (`BillingDashboard.tsx:187`, `AuthAndPricing.tsx:105`).
- A prévia da landing promete "Até 5 destinos simultâneos, 1080p **a 60fps**" e "Destinos **ilimitados e 4K**" (`AuthAndPricing.tsx:457-465`), enquanto o `plansData` do mesmo arquivo diz 3 e 8 canais (96, 227) e máximo 1080p (236). O seletor de qualidade do produto só oferece 720p e 1080p (`Header.tsx:283,295`). São quatro especificações erradas em três frases, na primeira dobra da página que vende.

Somem-se o P0-2 (moeda) e a divergência já conhecida de ~34 strings entre `PlansModal` e a view de preços.

**Correção estrutural:** `src/lib/plans.ts` com `{ id, nome, precoMensal, moeda, horas, resolucao, destinos, assentos, recursos[] }`. Todas as cinco telas derivam dela, inclusive as frases de prévia (`Até ${destinos} destinos simultâneos, até ${resolucao}`). Uma divergência futura passa a ser erro de tipo, não de revisão.

### D · O DOM não diz o que a tela mostra
**Causa:** as primitivas migradas resolveram aparência e comportamento de foco (Button, Modal, Toast, ConfirmDialog), mas não existe primitiva de **campo** nem de **abas** — e os 485 `<button>` crus da catraca são exatamente onde falta a semântica. O defeito tem duas faces simétricas.

**Face 1 — controles reais sem nome, estado ou marco de navegação:**

- `grep -rn "aria-selected|role=\"tab|aria-pressed|aria-current|aria-expanded|aria-controls" src/` retorna **zero** ocorrências em todo o projeto. Quatro grupos de abas (`BillingDashboard.tsx:419-447`, `AdminPanel.tsx:174-193`, `App.tsx:3403-3422`, `AuthAndPricing.tsx:826-859`) e cinco alternadores (`AuthAndPricing.tsx:705-720` e `984-1006`, `BillingDashboard.tsx:462`, `Header.tsx:272-296`) não anunciam nada. O mais caro é Mensal × Anual: reescreve o preço de quatro planos e o usuário de leitor de tela não recebe confirmação do período ativo antes de assinar.
- `grep -c "<main"` → **0, 0, 0** em `App.tsx`, `BillingDashboard.tsx` e `AdminPanel.tsx`. As três superfícies autenticadas abrem em `<div>` (`App.tsx:2911`, `BillingDashboard.tsx:392`, `AdminPanel.tsx:143`); só o site público tem landmark. E quatro das cinco views públicas começam em `<h2>` — o único `<h1>` de `AuthAndPricing.tsx` está dentro de `{view === 'landing'}` (333), deixando login (486), cadastro (604), planos (700) e checkout (811) sem título de página. O cabeçalho público (298-312) também não usa `<nav>`, embora `FeaturesPage.tsx:83` use.

**Face 2 — não-controles com aparência de controle** (três lentes independentes chegaram aqui: a11y pela affordance, estados pelo handler ausente, copy pelo rótulo que mente):

- `App.tsx:2975` — "Ver todos" é um `<span>` com cor de link, `hover:underline` e `cursor-pointer`, **sem `onClick`**. Não é focável, não tem destino.
- `App.tsx:3114-3115` — sob "Precisa de ajuda imediata?", o único destino é um `<p>` com "PwStreamer →", também sem handler. Uma promessa quebrada exatamente no painel de suporte.
- `App.tsx:2983` — o título de cada webinar muda de cor no hover e mostra cursor de mão, sem ação e sem foco.
- `Header.tsx:496` — `<a href="#support">Central de Ajuda</a>`, e não existe nenhum `id="support"` no projeto. É o mesmo defeito que motivou a remoção do link "Esqueceu a senha?" (comentado em `AuthAndPricing.tsx:572-575`).
- `AuthAndPricing.tsx:798` — `<button>Fale conosco</button>` sem `onClick`.
- `App.tsx:3153` — o editor de capas devolve `onSave={(dataUrl) => { console.log("Miniatura do dashboard gerada!"); }}`: o usuário salva e nada acontece.
- `WebinarPublicPage.tsx:435/438` — as abas "Enquete" e "Q&A" são `<div>` sem handler. Medido: os três filhos do grid retornam `[{BUTTON, 'Chat', tabindex 0}, {DIV, 'Enquete', -1}, {DIV, 'Q&A', -1}]`. E o Q&A está **construído e morto**: `qaQuestions` (67-70), `newQuestionText` (71), `handleAddQuestion` (140-153) e `handleUpvoteQuestion` (155-157) não têm uma única referência no JSX — enquanto `FeaturesPage.tsx:223` vende "Perguntas e respostas com votos".

O projeto já corrigiu essa classe uma vez, em `WebinarPublicPage.tsx:312-328`, onde dois `<span>` mortos viraram `<button>` ligados ao LegalModal.

**Correção estrutural:** uma primitiva `Field` (label+input+erro, com `id` gerado) e uma primitiva `Tabs` (`role="tablist"/"tab"/"tabpanel"`, `aria-selected`, `aria-controls`, seta esquerda/direita) fecham as duas faces de uma vez e dão onde aplicar a regra. `<main>` nas três superfícies (as classes não mudam) e um `<h1>` por view. Para cada pseudo-link: se tem destino, vira `<button type="button">` com o onClick real; se não tem, perde `cursor-pointer`, `hover:underline` e a cor de link — texto informativo deve parecer texto. As duas abas mortas: montar o Q&A que já existe ou removê-las — uma aba só é melhor que três das quais duas mentem.

### E · Corrigido num componente, nunca promovido a regra — o irmão continua quebrado
**Causa:** este é o padrão mais recorrente da auditoria e o mais barato de eliminar. Toda correção virou uma edição local; nenhuma virou hook, utilitário ou métrica. O resultado é um repositório onde a resposta certa está a algumas centenas de linhas do defeito.

| Resolvido em | Continua quebrado em |
|---|---|
| `BillingDashboard.tsx:420/434` — abas com `overflow-x-auto scrollbar-none` + `shrink-0` | `AdminPanel.tsx:175` *(P0-12)* |
| `VirtualizedChat.tsx:231-234` — `scrollToBottom` com guarda de "só rola se já estava no fim" (194-220) | `WebinarPublicPage.tsx:445` — chat público sem ref e sem scroll. Medido: após 14 mensagens, `clientHeight: 300`, `scrollHeight: 681`, `scrollTop: 0` — a mensagem recém-enviada fica **344px fora da vista**. Antes da primeira mensagem, `children.length: 0` e `clientHeight: 0` — um retângulo de zero pixel onde deveria haver "seja o primeiro a comentar" |
| `Header.tsx:117-128` — `streamDropdownRef` + listener de `mousedown` | `Header.tsx:463` (menu da conta) e `:511` (menu móvel): sem ref, sem clique-fora, sem ESC. Medido: `stillOpenAfterOutsideClick: true`, `stillOpenAfterEscape: true`. O gatilho (444) também não tem `aria-expanded`/`aria-haspopup`/`aria-controls`, e o painel não tem `role="menu"`. Como o header é `sticky top-0 z-50`, o menu persegue o usuário pela página. *(Duas lentes, independentes: a11y e estados.)* Único `addEventListener` do arquivo: a linha 126 |
| `Modal.tsx:98-103, 128` — ESC e devolução de foco | os três dropdowns do cabeçalho, que ficaram fora da primitiva |
| `AdminPanel.tsx:75` — `useConfirm` na ação **reversível** (regenerar chave) | `AdminPanel.tsx:134` — apagar um destino de transmissão é `setClientDestinations(prev => prev.filter(...))` e nada mais: sem confirm, sem toast, sem desfazer, disparado direto de um ícone `Trash2` sem nome acessível (396). O estado é local, então o item some sem trilha. A lista também não tem estado vazio (379) |
| `index.css:523-526` + `animate-confirm-in`, usado em `WebinarPublicPage.tsx:259` e `PlansModal.tsx:135` | `BillingDashboard.tsx:1064` — o visto de pagamento confirmado ainda usa `animate-bounce`, exatamente o que a keyframe substituta foi criada para eliminar; e `:1348` ainda tem `bg-emerald-600` no "Baixar Recibo", três linhas abaixo do comentário (1046-1049) que declara esse padrão corrigido |
| `AuthAndPricing.tsx:397` — `bg-[var(--color-brand-deep)] hover:brightness-110`, sob o comentário (391-393) que declara o gradiente azul→índigo "a receita mais reconhecível de interface gerada por IA" | `AuthAndPricing.tsx:376` e `:522` — o mesmo gradiente proibido, 15 linhas **acima** da declaração; sobrevive também em `WebinarPublicPage.tsx:410` e `Header.tsx:134` |
| `index.css:556/565` — `touch-action-btn` / `touch-target-btn`, piso de 44×44 em `(pointer: coarse)`, usado 10 vezes no estúdio (`LeftSidebar` 7, `ControlTray` 1, `App.tsx:2417/2431`) | **zero** usos em AuthAndPricing, FeaturesPage, WebinarPublicPage, LegalModals, BillingDashboard, AdminPanel, PlansModal, Header e no ramo dashboard. Alvos medidos: `BillingDashboard.tsx:761` **≈17,5px**, `AuthAndPricing.tsx:877/1058` **≈19px**, `AuthAndPricing.tsx:1041` e `BillingDashboard.tsx:929` (o "Copiar" da chave PIX — único caminho para concluir o pagamento) **≈23px**, `AdminPanel.tsx:396` 25px, `App.tsx:3216` 28px, `WebinarPublicPage.tsx:523` 33px, abas de gateway 34px. Mínimo WCAG 2.5.5: 44×44; os três primeiros ficam abaixo até dos 24×24 do SC 2.5.8. *(Duas lentes, independentes: uma calculou as alturas a partir das classes, outra localizou o utilitário existente e contou os usos.)* |
| `AuthAndPricing.tsx` — 16 labels, 0 órfãos, todos com `htmlFor="campo-N-…"` | 31 labels órfãos nas outras cinco superfícies *(P0-10)* |

**Correção estrutural:** um `useDismissable(ref, onDismiss)` para os três menus; reusar `scrollToBottom` do `VirtualizedChat` em vez de duplicá-lo; aplicar `touch-action-btn` aos controles de ação do checkout, do chat público e da tabela de faturas. E a prescrição geral: **toda correção que já existe em dois lugares vira primitiva, utilitário ou linha na catraca** — `scripts/design-debt.mjs` já tem nove métricas e o mecanismo de piso; acrescentar `bg-gradient-to-*` com `indigo|purple|violet`, `animate-bounce`, `autoComplete` ausente e labels órfãos custa pouco e trava a regressão.

### F · Escrita assíncrona sem as três saídas
**Causa:** nenhuma das operações que gravam tem o trio pendente / sucesso / erro completo. Cada uma falha de um jeito diferente, mas todas pela mesma omissão.

- `AdminPanel.tsx:83` — `handleRegenerateKey` faz `setIsRegenerating(true)`, `await regenerateRtmpKeyInFirestore(...)` **sem try/catch**, e `setTimeout(() => setIsRegenerating(false), 600)`. Se o await rejeitar (offline, regra de segurança, timeout), a linha 90 nunca é alcançada e o botão fica preso em `disabled` com `animate-spin` permanente. O usuário não sabe se a chave antiga ainda vale — no meio de uma preparação de live, é a pior dúvida possível. O `setTimeout(…, 600)` ainda cobra 600ms de espera artificial **depois** de o trabalho ter terminado.
- `BillingDashboard.tsx:278` — `handleSaveProfile` tem um `catch` vazio em volta da gravação de CNPJ, razão social e endereço (277), e a linha seguinte roda incondicionalmente: `setProfileMessage('Perfil e dados corporativos atualizados com sucesso!')`. O comentário das linhas 274-275 registra que **este mesmo bug já foi corrigido uma vez**; o ramo do catch o reintroduz. É a tela que alimenta a emissão de nota fiscal. Agravante: `profileMessage` nunca é limpo, então o painel verde de sucesso paira sobre alterações não salvas.
- Os P0-1 (`finally` cedo) e P0-8 (write nu) são a mesma omissão em outro ponto do funil.

**Correção estrutural:** `try/catch/finally` em toda escrita, com `finally` desligando o pendente e `catch` emitindo `toast.error` acionável (o `useToast` já existe). Nenhum `setTimeout` decorativo: o estado pendente dura o tempo real da operação. Onde a mensagem cobre vários campos, ramificar por campo salvo (`let corporateSaved = true`), nunca afirmar o conjunto.

### G · Matiz como decoração — o sistema tem dois, o produto usa oito
**Causa:** o sistema declara exatamente dois matizes de propósito, marca (`--color-brand` / `--color-brand-deep`) e sinal (`--color-sig`, reservado ao ar). A camada de gráficos já foi resolvida por valor, não por matiz (`index.css:114-124`). As telas não seguiram: esmeralda soma 77 usos nas superfícies auditadas, roxo 22, índigo 8.

- **`Header.tsx:357-362` — o GO LIVE é o único controle para o qual o matiz de sinal existe, e o único que não o usa.** No ar: `bg-red-600` (#DC2626), enquanto `--color-sig` é #D91F2D (`index.css:48`). Teste expirado: âmbar. Ocioso: `border-[#D9480F] bg-[#D9480F]/15 text-[#FF922B] shadow-orange-500/10` — **dois hexadecimais crus de laranja**, um sétimo matiz, mais uma sombra colorida, mais `hover:scale-[1.03]`, tudo 143 linhas depois do comentário (214-215) que declara esses dois tiques corrigidos. O operador aprende que carmim significa "no ar" pela moldura de tally (`index.css:424`) e então olha para o botão e vê outra cor. **Correção:** ocioso `border-[var(--color-sig)] bg-[var(--color-sig)]/12`; no ar `bg-[var(--color-sig)]` com texto `--color-n-100`; expirado, ghost neutro — bloqueio é ausência de permissão, não aviso cromático. O `.btn` já anima por `filter: brightness()` (`index.css:391`).
- **`AuthAndPricing.tsx:764` — na grade de preços, o botão visualmente mais forte é o do plano grátis, e ele é esmeralda.** `bg-emerald-600 shadow-emerald-950/20` no Free Trial contra `--color-brand-deep` no plano recomendado e ghost nos demais. Na mesma seção, `bg-green-500/20` no selo de desconto (715) e esmeralda de novo em "Não requer cartão" (786): **dois verdes diferentes para a mesma ideia**, o que prova que não é convenção, é escolha de momento. O produto está apontando para a receita zero. Repete-se em `BillingDashboard.tsx:475/514`.
- **`BillingDashboard.tsx:1556` — o terceiro medidor ignora a função de limiar que os outros dois usam.** `getProgressColor`/`getProgressTextColor` (1411-1421) dão azul <75%, âmbar ≥75%, vermelho ≥95%; minutos e storage as chamam, assentos não: `bg-purple-500` fixo (1556), `text-purple-400` no selo (1543). **3 de 3 assentos ocupados renderiza o mesmo roxo que 1 de 3** — justamente no momento de upsell. O painel de alerta (1569) também ignora assentos. E o ícone do medidor 2 é `text-emerald-400` (1510) enquanto a barra dele é azul/âmbar/vermelha: ícone e barra discordam dentro do mesmo cartão.
- **`AdminPanel.tsx:364` — roxo significa duas coisas sem relação, em dois arquivos.** "Configurar via Assistente" em roxo ao lado de um submit azul na mesma linha (370); o mesmo roxo significa "membros de equipe" em `BillingDashboard.tsx:1540`. Em `PlansModal.tsx:210/215/220`, três formas de pagamento equivalentes recebem três matizes (blue / emerald / indigo) e todas selecionam para `border-blue-500` — a cor de repouso briga com a cor de seleção.
- **`WebinarPublicPage.tsx:163-167`** mantém os dois orbes de desfoque (`blur-[100px]` num elemento de 500px) que `AuthAndPricing.tsx:288-295` documenta como removidos por serem "quatro marcas de design gerado por IA de uma vez". E o contador (244) pinta horas e minutos de `text-blue-400` e **só os segundos** de `text-emerald-400`: matiz diferente para o terceiro campo do mesmo número.
- **`Header.tsx:399/321` — emoji como ícone no botão de maior peso da interface:** `'GO LIVE 🔒'` e `'🔒 Bloqueado'`, num arquivo que importa `Lock` do lucide na linha 3 e o usa normalmente em outros pontos. O emoji renderiza com a fonte do sistema — amarelo no Windows, cinza no macOS — uma cor que nenhum token controla, num produto que gastou 18 degraus de rampa para controlar cor.

**Correção estrutural:** matiz só por significado, separação por valor onde há níveis. Acrescentar `purple|violet|indigo|fuchsia` como piso zero em `scripts/design-debt.mjs` (30 usos, uma varredura de uma tarde) e a mesma regra para hex cru em classe.

### H · Nenhuma escala é token: tipo, recuo e breakpoint são escolhidos por elemento
**Causa:** `src/index.css` tem rampa de cor, raios, z-index nomeado e keyframes — e **nenhuma escala tipográfica, nenhuma escala de espaçamento e nenhum conjunto acordado de breakpoints**. A catraca conta 1.043 tamanhos avulsos, mas conta ocorrências, não degraus. Sem degrau declarado, cada componente inventa o seu.

**Tipo.** Em `BillingDashboard.tsx` (1.802 linhas), 171 das 191 declarações de tamanho — **89,5%** — vivem entre 9 e 12px: `text-xs` 94, `text-[10px]` 50, `text-[9px]` 20, `text-[11px]` 7. Acima de 12px sobram 20 declarações. As razões desses "degraus" são 1,11× / 1,10× / 1,09× — todas abaixo de ~1,125×, o limiar em que uma diferença de corpo começa a ser lida como nível: quatro tamanhos que o olho lê como um só. Medido numa única região (passo 1 do checkout, 591-715): entre 18px e 9px não existe valor intermediário. O mesmo em `WebinarPublicPage.tsx`: seis tamanhos entre 10 e 18px dentro do cartão de inscrição, e o **CTA de conversão em `text-xs` (12px)** — 4px **menor** que o parágrafo descritivo ao lado (`:201`, `text-base`) — num botão de ≈424×40px onde o texto ocupa ~2,8% da área. O item de 10px é justamente o consentimento LGPD. **Correção:** descartar `text-[9px]` e `text-[11px]` (27 ocorrências só no faturamento), 12px como piso absoluto para selos e metadados, valores e rótulos promovidos a 14px, CTA em `text-sm font-bold py-3.5` (a medida que `AuthAndPricing.tsx:400` já usa). Declarar 12/14/16/20/30 (razão ≈1,2×) como tokens em `index.css`, para que a catraca trave o piso também aqui.

**Recuo.** O mesmo desencontro de 4px em três painéis, sempre cabeçalho `p-5` contra corpo `p-6`, sempre com um `border-b` no meio tornando o degrau diretamente comparável: `VideoQualityPanel.tsx:169`×`:202`, `App.tsx:3209`×`:3254`, `PlansModal.tsx:98`×`:140`. O padrão certo existe no mesmo repositório — `App.tsx:3133` usa `px-6 py-4` no cabeçalho e `p-6` no corpo. Em `PlansModal` são **quatro** recuos descendo o diálogo (20 → 24 → 24 → 16), cada divisória entregando o conteúdo seguinte num x diferente. E em `AuthAndPricing.tsx:447`, dois cartões irmãos que **compartilham a mesma borda superior** têm `p-6 gap-3` (448) e `p-5 gap-2` (467): o `<h3>` "Professional" começa 4px mais baixo que o "Standard" ao lado. A hierarquia entre eles já está corretamente feita por escala de tipo e peso de borda; variar também o padding não acrescenta ênfase, só tira o prumo. **Correção:** 24px em tudo (`p-6`, ou `px-6 py-4` onde a altura preocupa).

**Breakpoint.** `AuthAndPricing.tsx:721` é `grid-cols-1 md:grid-cols-4` — nenhum degrau entre 1 e 4 colunas, num `<main>` com `px-4` sem `sm:px-6`. A 768px: 736px úteis, menos 3×24 de gap, ÷4 = **166px por cartão**, menos `p-6` = **118px de caixa de conteúdo**. Três consequências medidas nesses 118px: (1) o preço `text-3xl font-black font-mono` precisa de ~160px para "R$ 199,90" e quebra em duas linhas; (2) o selo "Melhor Custo-Benefício" precisa de ~170px num bloco de 166px ancorado a 16px da direita, começando em x = −20px — **invade o cartão vizinho** ou quebra sobre o `<h3>`; (3) sobram 96px para texto de 12px ≈ 18 caracteres por linha, e o plano Business tem 14 itens. *(Duas lentes, independentes: hierarquia e responsivo mediram os mesmos 118px por caminhos distintos.)* Os irmãos usam cortes diferentes para a mesma forma: `AuthAndPricing.tsx:447` é `lg:grid-cols-4`, `PlansModal.tsx:148` é `md:grid-cols-3`, `BillingDashboard.tsx:481` é `md:grid-cols-3` para três planos. O vão de navegação do P0-9 (`md:hidden` contra `lg:flex`) é o mesmo problema com consequência maior. **Correção:** `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` na grade de preços, `sm:px-6 lg:px-8` no `<main>` (314), `whitespace-nowrap` no selo (737), e **um** ponto de corte documentado para navegação, usado pelos dois blocos do Header.

---

## 3. Achados restantes, por lente

### Acessibilidade
1. **Zero `autoComplete` no projeto inteiro** — `src/components/AuthAndPricing.tsx:560`. `grep -rn "autoComplete" src/` retorna zero. Campos afetados: login (562, 579), cadastro (620, 632, 644), cartão Stripe (908/920/931/944), cartão Mercado Pago (1053/1067/1080/1093), cartão do faturamento (`BillingDashboard.tsx:771, 785, 796, 809`), cadastro corporativo (1136, 1150) e a inscrição pública (`WebinarPublicPage.tsx:273, 285, 297`). WCAG 1.3.5 é AA na 2.1. Sem isso o gerenciador de senhas não funciona, o que penaliza de forma desproporcional quem tem limitação motora ou cognitiva — e a inscrição em webinar pede nome, e-mail e empresa a cada visita sem nunca preencher sozinha. **Correção:** ~22 atributos (`email`, `current-password`, `new-password`, `name`, `organization-title`, `cc-number`, `cc-exp`, `cc-csc`, `cc-name`), e a décima métrica da catraca com piso em 0.
2. **Erros de formulário não são anunciados nem ligados aos campos** — `src/components/AuthAndPricing.tsx:530` (e 607, 819). `grep -rn "role=\"alert\"|aria-live|role=\"status\"" src/` só encontra `ui/Toast.tsx:95-96`. Os três blocos de erro são `<div>` mudos inseridos no DOM, e `grep -rn "aria-describedby|aria-invalid" src/` não devolve um único campo. A mensagem ainda é genérica — `setAuthError('Por favor, preencha todos os campos.')` (186, 205) — embora o código já saiba qual campo está vazio em `if (!email || !password)` (185). No checkout são até 5 campos. **Correção:** `role="alert"` nos três blocos, `aria-invalid` + `aria-describedby` nos campos, e erro por campo.
3. **`<button>` aninhado dentro de `<label>` no consentimento LGPD** — `src/components/WebinarPublicPage.tsx:311` (bloco 310-330). O modelo de conteúdo de `<label>` proíbe descendentes rotuláveis que não sejam o controle rotulado. Efeito prático: o nome acessível do checkbox `privacy-check` passa a ser a frase inteira **com os rótulos dos dois botões embutidos**. O comentário das linhas 305-309 mostra que o projeto tratou a LGPD com cuidado (removeu o `defaultChecked` porque consentimento tem de ser afirmativo); o nome do controle que carrega esse consentimento não deveria conter os rótulos de outros dois controles. **Correção:** tirar os dois botões do `<label>` e pô-los numa linha logo abaixo, com `min-h-11` cada.

### Hierarquia
1. **Modal legal com 856px de medida e corpo em 12px: ≈134 caracteres por linha** — `src/components/LegalModals.tsx:31`. `size="xl"` (18) mapeia para `max-w-4xl` = 896px em `Modal.tsx:41`, e o corpo `px-5 py-4` (188) deixa 856px úteis. Dentro deles, LegalModals sobrescreve o `text-sm` padrão do Modal para `text-xs` em **49 ocorrências** (51, 62, 72, 88, 105, 112, 125, 131, 143, 155, 165, 174…). A 12px em Poppins (≈6,4px/glifo), 856 ÷ 6,4 = **≈134 ch**, contra a faixa legível de 45–75. Agravante no mesmo componente: a linha de metadado ("PW Stream Online — atualizado em julho de 2026", `Modal.tsx:169`) é `text-sm` = **2px maior** que o corpo inteiro do documento jurídico. É o único documento que o usuário é juridicamente esperado a ler, e onde o consentimento da página pública se apoia. **Correção:** limitar a medida, não a largura do diálogo — `max-w-[68ch] mx-auto` no `<div className="space-y-6">` (31) e remover as 49 sobrescritas, voltando ao `text-sm` que o Modal já define. A 14px com 68ch a caixa fica em ~520px e o resto vira margem.
2. **Duas manchetes disputando a primeira posição em Faturamento, e a subordinada é mais pesada** — `src/components/BillingDashboard.tsx:458`. O `<h1>` (404) é `text-2xl sm:text-3xl font-bold`, à esquerda; o `<h2>` (458) é `text-2xl sm:text-3xl font-extrabold`, centralizado (`text-center max-w-2xl mx-auto`, 454). Mesmo tamanho, **um grau a mais de peso no menor da hierarquia**, e eixos diferentes. Empilhando a régua vertical do container, o h2 nasce a ≈290px do topo: os dois convivem na primeira dobra em qualquer viewport acima de ~600px. Quem chega em "Configurações da Conta" lê primeiro uma chamada de venda. **Correção:** `text-lg sm:text-xl font-semibold text-left` na 458 e remover `text-center max-w-2xl mx-auto` da 454.
3. **No PlansModal, o título do diálogo é o menor dos três cabeçalhos e o h3 do corpo o repete** — `src/components/PlansModal.tsx:102`. `<h2 className="text-base font-bold">Escolha de Planos PwStreamer</h2>` (16px) no cabeçalho, contra `<h3 className="text-xl sm:text-2xl font-bold">Selecione o plano ideal para as suas transmissões</h3>` (24px) cerca de 100px abaixo: o subordinado é **50% maior** e diz a mesma coisa em outras palavras. O modal aparece quando o teste expira — o momento de maior atrito do produto — e a leitura começa duplicada. **Correção:** escolher um. Se o h2 fica, apagar o bloco 141-146 e deixar o parágrafo da 143 subir para o `description` do cabeçalho; o corpo começa direto na grade.
4. **A coluna de valores da tabela de faturas está alinhada à esquerda e sem `tabular-nums`** — `src/components/BillingDashboard.tsx:1244`. A tabela (1226) é `text-left` para as sete colunas, e o `<td>` monetário é `py-3.5 px-4 font-bold` sobre Poppins, que tem algarismos proporcionais. Para 49.90 / 99.90 / 199.90 a vírgula cai em três posições x diferentes: a única coluna que precisa ser comparada verticalmente é a única que não pode ser. O vocabulário já existe no projeto (`tabular-nums` em `AuthAndPricing.tsx:454, 471, 753`), e a intenção de tratar colunas por tipo também (a coluna "Ações", 1235/1255, recebeu `text-center`) — parou antes do número. **Correção:** `text-right tabular-nums` no `<td>` e `text-right` no `<th>` correspondente (1232).
5. **Cartões de recurso sem teto de medida entre 640 e 1023px, e o ritmo de seção cai pela metade antes do CTA** — `src/components/FeaturesPage.tsx:163`. A grade é `grid gap-4 lg:grid-cols-6`: abaixo de 1024px os cinco cartões empilham em largura total e o parágrafo (173) é `text-sm leading-relaxed` **sem `max-w`**. A 1023px: `<main>` `max-w-[1200px] px-6` → 975px, cartão com `p-6` → **927px de medida ≈ 125 ch**. O arquivo conhece a regra e a aplica em **nove** outros pontos (`max-w-[52ch]` 107, `[60ch]` 159, `[46ch]` 186/240, `[50ch]` 218, `[22ch]`/`[20ch]`/`[18ch]` nos h2); os cartões da seção 3 são a exceção — e são o único texto que explica o que o produto faz. Separadamente: as seções 3→4 e 4→5 se separam por 160px (`py-20`+`py-20`), mas a seção 6 (234) é `mb-20` **sem padding superior**, caindo para 80px justamente antes do bloco que pede a ação, o que a faz parecer rodapé da seção anterior. **Correção:** `max-w-[62ch]` na 173 (inócuo em `lg`, decisivo abaixo) e `py-20` no lugar de `mb-20` na 234.

### Cor
1. **A tela de fatura cita outra marca como reguladora e avisa que a cobrança é simulada** — `src/components/BillingDashboard.tsx:1341`. Dentro do modal de detalhe, num bloco de aparência oficial (`bg-blue-500/5 border border-blue-500/10` com ícone `Shield`): "Esta fatura foi processada sob regulamentações da **Vega6** e simula um faturamento real em ambiente seguro." Vega6 não aparece no logotipo, nos termos nem na razão social; fora daqui só existe em fixtures de demonstração (`StudioPreview.tsx`, `ScreenSharePickerModal.tsx`). O escudo e o azul institucional fazem o texto parecer declaração de conformidade, o que piora: o vocabulário visual promete garantia e o texto entrega o contrário. **Correção:** substituir por informação verdadeira de cobrança (processador, moeda, CNPJ emissor) ou remover o bloco. `grep -n "Vega6"` fora de StudioPreview/ScreenSharePicker antes do deploy.

### Estados
1. **Trocar de view na SPA não devolve o scroll** — `src/components/AuthAndPricing.tsx:237`. `handleSelectPlan` (226-240) faz só `setView('checkout')`. `grep` por `window.scrollTo|scrollIntoView` em todo o `src/`: nenhuma ocorrência em nenhum componente de página — vale para os 6 estados de `view` em AuthAndPricing, para `onBack`/`onSeePricing`/`onGetStarted` de `FeaturesPage.tsx` (80-88, 244, 257-258) e para o `setCurrentView` do App. Medido a 375×812: a view de planos tem `scrollHeight` 3206px; rolando até 2394 e clicando em "Selecionar Plano" do último cartão, o documento encolhe para 1178px, o navegador trava em `scrollY: 366`, e `#checkout-view.getBoundingClientRect().top = -239` — o `<h2>Finalizar Assinatura</h2>` fica a **-178px, fora da tela**. O usuário cai no meio do formulário de pagamento: o nome do plano que está comprando e as três abas de gateway (inclusive PIX) estão todos acima da dobra. **Correção:** `useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [view])` em AuthAndPricing, e o equivalente em FeaturesPage e no `currentView` do App. `instant`, não `smooth` — a troca de view já é instantânea.

### Copy
1. **Inglês solto no meio do pt-BR, inclusive na manchete da página de preços** — `src/components/AuthAndPricing.tsx:697`. O `<h2>` da view de planos é "Upgrade to grow and engage your audience", com o subtítulo imediatamente abaixo em português (700). Na mesma navegação, `Início / Recursos / Planos` seguidos de `Log In` e `Sign Up` (308-309); "Log In" reaparece na 686 ao lado de "Inscreva-se grátis" (593) e "Criar conta" (405) — **três rótulos para duas intenções**. O rodapé do dashboard é integralmente em inglês (`App.tsx:3193`: "© 2026, All Rights Reserved to PW Stream Online. Developed and Maintained by PwStreamer") enquanto o rodapé público diz o mesmo em português (`AuthAndPricing.tsx:1174`). No cabeçalho compartilhado, `LIVE STREAM` (242), `RECORDING ON/OFF` (252), `GO LIVE` e `END LIVE` (396, 399) descrevem ações que o resto do produto chama de "Transmitir Ao Vivo" e "Gravar" (`Header.tsx:160`, `PlansModal.tsx:144`) — e o próprio botão alterna idioma entre os próprios estados: `GO LIVE` / `END LIVE (mm:ss)` contra `Entrando no ar…` / `Encerrando…` / `Segure…`. A manchete em inglês está no topo da página que fecha venda, para um público brasileiro. **Correção:** traduzir 697 e `App.tsx:3193`; padronizar "Entrar" e "Criar conta" em toda parte, "AO VIVO"/"ENCERRAR (mm:ss)"/"GRAVANDO"/"GRAVAÇÃO DESLIGADA" no cabeçalho.
2. **Dois "Sair do…" no mesmo cabeçalho, fazendo coisas diferentes** — `src/components/Header.tsx:419` e `:503`. "Sair do Webinar" apenas volta ao dashboard; "Sair do Estúdio" faz **logout**. Rótulos quase idênticos, mesma região da tela: um apresentador com transmissão no ar que erre o alvo perde a sessão. **Correção:** "Voltar ao painel" (419) e "Sair da conta" (503).

### Responsivo
1. **O motivo do assento bloqueado é escondido só no mobile, sem alternativa** — `src/components/BillingDashboard.tsx:1698` (e 1758). `<span className="hidden sm:inline">Requer upgrade para plano com mais assentos</span>` e "Excede os assentos permitidos no seu plano atual". Abaixo de 640px sobra apenas o botão de upsell, com a linha do colega em `opacity-40 bg-[var(--bg)]/20` (1670, 1749) e **nenhum** `title`, `aria-label` ou texto curto alternativo. No telefone o usuário vê um membro apagado e um botão para pagar, sem a frase que transforma o cinza numa decisão. **Correção:** rótulo curto sempre visível ("Sem assento no plano atual") com a frase longa em `sm:inline`, ou mover o motivo para `aria-describedby` no botão.

---

## 4. O que eu faria primeiro

Ordenado por dano evitado sobre esforço. Cada passo diz o que destrava.

**1 · Fechar os dois caminhos que custam dinheiro e identidade (≈30 min, dois arquivos).** No `catch` e no ramo sem `url` do `PlansModal`, não ativar nada; `IS_DEV` nos dois blocos de login direto do `AuthAndPricing`. → Destrava mostrar o produto em qualquer preview público sem entregar uma conta nomeada e um plano pago de graça. É o único passo cujo custo de adiar é irreversível.

**2 · `src/lib/plans.ts` como fonte única (≈1h).** Preço + moeda + horas + resolução + destinos + assentos + recursos, importado por AuthAndPricing, BillingDashboard, PlansModal e Header. → Destrava o P0 da moeda, os P1 de "acesso ilimitado", "4K/60fps" e "780p", e as ~34 strings já conhecidas de divergência entre PlansModal e a view de preços. Divergência futura vira erro de tipo.

**3 · Varrer a ficção (≈2h, cinco arquivos).** `IS_DEV` em todo bloco de sandbox/simulação/preenchimento de teste; seeds → `[]` com estado vazio desenhado; remover a aba "Análise de Requisitos" e a lista de variáveis de ambiente; a aba RTMP lê a chave real; `isLoadingKeys` no AdminPanel com esqueleto no lugar da chave fabricada; apagar "Vega6". → Destrava poder cobrar: o produto para de afirmar, dentro da conta paga, que o faturamento é simulado e a ingestão não existe. Também é pré-requisito para qualquer teste de usuário honesto.

**4 · `Modal.tsx`: estabilizar o efeito de foco (≈30 min, um arquivo).** `onClose` em ref, deps `[isOpen]`, `restoreFocus` no desmonte, e priorizar `input,textarea,select` antes de `button`. → Destrava os 8 call sites de uma vez, incluindo o formulário de criação de webinar. É pré-requisito de qualquer trabalho posterior em formulários dentro de diálogo — hoje não dá nem para testá-los.

**5 · `Header.tsx`: largura, breakpoint e dispensa (≈1h, um arquivo).** `min-w-0` real no agrupamento com colapso para ícone-só abaixo de `xl`; `hidden lg:flex` / `lg:hidden` nos dois blocos de navegação; extrair `useDismissable(ref, onDismiss)` e aplicá-lo aos três menus. → Destrava o produto inteiro entre 768 e 1280px (iPad retrato, Surface, laptop com janela reduzida) e torna os três dropdowns descartáveis por ESC e por clique fora.

**6 · Fechar o buraco do tema claro como regra, não como edição (≈2h).** Estender `index.css:159-171` aos tons 500/600/700 e 950 dos 13 matizes; trocar `text-white` por `text-[var(--ink-hi)]` nos oito estados selecionados; trocar as quatro caixas de erro `bg-red-950/40` e as três faixas de gradiente do Header por fundo chapado com token; acrescentar ao `contrast-gate.mjs` a família "classe crua × superfície composta por alfa". → Destrava ~60 pontos medidos de uma vez e, mais importante, faz o CI passar a enxergar essa classe inteira de defeito. Sem o último item, tudo isto regride.

**7 · Escrever a camada semântica mínima (≈meio dia).** `<main>` nas três superfícies autenticadas e um `<h1>` por view pública; `id`/`htmlFor` nos 31 campos; `aria-label` nos sete botões de ícone; os quatro `<div onClick>` viram `<button>`; `role="tab"`/`aria-selected`/`aria-controls` nos quatro grupos de abas; `role="alert"` nos três blocos de erro; ~22 atributos `autoComplete`. → Destrava o produto para teclado, leitor de tela e controle por voz — hoje as chaves de ingestão e a configuração de OAuth simplesmente não existem para esses usuários. Acrescentar labels órfãos e `autoComplete` como décima e décima primeira métricas da catraca trava o piso no lugar.

**8 · Honestidade de estado nas duas superfícies que o cliente mostra para terceiros (≈meio dia).** `try/catch/finally` nas quatro escritas assíncronas (inscrição pública, regenerar chave, salvar perfil, checkout) com pendente e erro reais; auto-scroll do chat público reusando `VirtualizedChat.tsx:194-234`; estado vazio do chat; `confirm` destrutivo no delete de destino; montar o Q&A que já existe ou remover as duas abas mortas; dar destino ou tirar a aparência de link dos sete pseudo-controles. → Destrava a inscrição pública (única conversão da superfície pública) e a sala ao vivo, que é literalmente o que o cliente do PwStreamer entrega à audiência dele.

Os itens de hierarquia (escala tipográfica, recuos, medida do modal legal, grade de preços) entram depois do passo 6: são os de maior razão esforço/dano desta lista, e a grade de preços em particular só compensa depois que os tokens de escala existirem, senão vira mais uma edição local.

---

## 5. Onde a auditoria não chegou

Explicitamente, para que ninguém leia este relatório como cobertura completa.

- **O estúdio de transmissão não foi auditado.** `LeftSidebar.tsx` (5.483 linhas, 161 props, atrás de decisão de arquitetura), `StudioPreview`, `ControlTray`, `VirtualizedChat`, `ScreenSharePickerModal` e `WebhookPanel` aparecem neste relatório **apenas como referência do padrão correto**. O escopo invariante `[data-surface=console]` não recebeu nenhuma lente — e é justamente onde o operador passa o tempo no ar.
- **Nada foi executado com tecnologia assistiva real.** Os achados de a11y vêm de leitura de código, inspeção de DOM e cálculo de contraste. Ninguém percorreu as telas com NVDA, JAWS ou VoiceOver: a ordem de foco real, a qualidade da leitura das tabelas e o comportamento do modo de navegação continuam desconhecidos. Um `role="tablist"` correto no código ainda pode ler mal na prática.
- **Nenhuma medição em dispositivo físico.** As larguras vieram de emulação no dev server (1280, 1024, 912, 820, 768, 695, 375). Não houve teste em iOS Safari nem em Android, onde o teclado virtual, a barra de endereço retrátil, o alvo de toque real e a renderização do emoji se comportam diferente do emulado.
- **O caminho de pagamento real não foi exercitado.** `/api/checkout`, retorno do gateway, webhook de confirmação, idempotência do lado do servidor: tudo que este relatório diz sobre cobrança foi observado do cliente para fora. O duplo `POST` foi inferido do ciclo de vida do componente, não de logs de servidor.
- **Firestore não foi auditado.** Regras de segurança, comportamento offline, latência real das assinaturas e o que acontece quando `regenerateRtmpKeyInFirestore` falha do lado do servidor ficaram fora. O achado da chave fabricada é sobre a UI, não sobre a regra.
- **Performance não foi medida.** Nenhum Lighthouse, nenhum profiler, nenhuma medição de bundle ou de re-render. Os dois `blur-[100px]` da página pública são citados por serem decoração que o sistema já rejeitou, não por um custo de repintura medido.
- **A camada de animação e os gráficos não tiveram lente própria.** Motion e Recharts só apareceram de raspão (a paleta já tokenizada, as keyframes `animate-confirm-in` × `animate-bounce`). Curvas, durações, `prefers-reduced-motion` e o comportamento dos gráficos com dados reais não foram olhados.
- **i18n é inventário, não cobertura.** O achado de idioma lista strings encontradas; não existe infraestrutura de tradução no projeto, e ninguém verificou se o produto se propõe a ser bilíngue.
- **Saídas fora da tela ficaram de fora:** o recibo `.txt` gerado em `BillingDashboard.tsx:341-373`, qualquer template de e-mail, e o comportamento de impressão das telas de fatura.
- **Telas e fluxos não visitados:** `WebhookPanel`, `StreamReportModal`, `VideoQualityPanel` além do recuo do cabeçalho, o fluxo de recuperação de senha (que não existe — o link foi removido, ver `AuthAndPricing.tsx:572-575`), e qualquer estado de erro de rede em tela cheia.
- **Itens já conhecidos e deixados como contexto, não contados como achado:** as duas imagens `TODO(imagem)` em `FeaturesPage.tsx`, a `GEMINI_API_KEY` com formato real em `.env.example`, e a decisão de arquitetura pendente sobre `LeftSidebar.tsx`.