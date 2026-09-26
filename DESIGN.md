---
name: PwStreamer
description: Transmissão ao vivo para vários canais a partir do navegador. A casca do app é um lançador em azul-marinho, com a cor reservada à ação da tela e ao ar.
colors:
  navy-0: "#000000"
  navy-3: "#0A0B0C"
  navy-6: "#111315"
  navy-10: "#181B1F"
  navy-14: "#202429"
  navy-18: "#282D31"
  navy-22: "#30363B"
  navy-28: "#3C4349"
  navy-36: "#4E565E"
  navy-46: "#656E77"
  navy-58: "#838C96"
  navy-70: "#A2ACB7"
  navy-80: "#BEC7D1"
  navy-89: "#D9E1EA"
  navy-92: "#E3E9F0"
  navy-96: "#F0F5F9"
  navy-99: "#FAFCFF"
  navy-100: "#FFFFFF"
  brand: "#4683E0"
  brand-deep: "#2C5FB0"
  brand-lift: "#7FAAEC"
  tally: "#D91F2D"
  tally-deep: "#A81622"
  tally-lift: "#F4666A"
  brand-grad-from: "#4683E0"
  brand-grad-mid: "#9669F2"
  brand-grad-to: "#EC407A"
typography:
  display:
    fontFamily: "Poppins, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Poppins, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Poppins, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  body-strong:
    fontFamily: "Poppins, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
  label:
    fontFamily: "Poppins, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
  button:
    fontFamily: "Poppins, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.2
  measure:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontFeature: "tnum"
rounded:
  focus: "4px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  2xl: "20px"
  3xl: "26px"
  full: "9999px"
spacing:
  chip-gap: "8px"
  row-y: "16px"
  field-gap: "20px"
  inline-actions: "20px"
  section-inset: "24px"
  action-gap: "32px"
  section-gap: "48px"
  page-top: "48px"
  page-top-wide: "64px"
  page-bottom: "96px"
  gutter: "16px"
  gutter-wide: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brand-deep}"
    textColor: "{colors.navy-100}"
    typography: "{typography.button}"
    rounded: "{rounded.xl}"
    padding: "9px 18px"
  button-primary-lg:
    backgroundColor: "{colors.brand-deep}"
    textColor: "{colors.navy-100}"
    rounded: "{rounded.xl}"
    padding: "13px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.navy-89}"
    typography: "{typography.button}"
    rounded: "{rounded.xl}"
    padding: "9px 18px"
  button-ghost-hover:
    backgroundColor: "{colors.navy-18}"
  button-sm:
    rounded: "{rounded.md}"
    padding: "5px 11px"
  button-danger:
    backgroundColor: "{colors.tally}"
    textColor: "{colors.navy-100}"
    rounded: "{rounded.xl}"
    padding: "9px 18px"
  icon-button:
    textColor: "{colors.navy-96}"
    rounded: "{rounded.xl}"
    size: "44px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.navy-96}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    height: "36px"
    padding: "0 10px"
  text-action:
    backgroundColor: "transparent"
    textColor: "{colors.navy-80}"
    typography: "{typography.body}"
  input:
    backgroundColor: "{colors.navy-3}"
    textColor: "{colors.navy-96}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    height: "44px"
    padding: "0 12px"
  input-invalid:
    textColor: "{colors.navy-96}"
  switch-on:
    backgroundColor: "{colors.navy-96}"
    rounded: "{rounded.full}"
    height: "24px"
    width: "40px"
  switch-off:
    backgroundColor: "{colors.navy-14}"
    rounded: "{rounded.full}"
    height: "24px"
    width: "40px"
  checkbox:
    backgroundColor: "{colors.navy-3}"
    rounded: "5px"
    size: "20px"
  checkbox-checked:
    backgroundColor: "{colors.navy-96}"
    textColor: "{colors.navy-6}"
    rounded: "5px"
    size: "20px"
  segmented-active:
    backgroundColor: "{colors.navy-18}"
    textColor: "{colors.navy-96}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  menu:
    backgroundColor: "{colors.navy-18}"
    textColor: "{colors.navy-89}"
    rounded: "{rounded.xl}"
    padding: "4px"
  modal-md:
    backgroundColor: "{colors.navy-10}"
    rounded: "{rounded.2xl}"
    width: "448px"
  modal-lg:
    backgroundColor: "{colors.navy-10}"
    rounded: "{rounded.2xl}"
    width: "672px"
  modal-xl:
    backgroundColor: "{colors.navy-10}"
    rounded: "{rounded.2xl}"
    width: "896px"
  plan-row:
    backgroundColor: "transparent"
    textColor: "{colors.navy-96}"
    typography: "{typography.body-strong}"
    padding: "16px 0"
  record-row:
    backgroundColor: "transparent"
    textColor: "{colors.navy-96}"
    typography: "{typography.body-strong}"
    padding: "16px 0"
  master-row:
    backgroundColor: "transparent"
    textColor: "{colors.navy-96}"
    rounded: "{rounded.xl}"
    height: "56px"
    padding: "8px 12px"
  master-row-active:
    backgroundColor: "{colors.navy-18}"
  master-row-hover:
    backgroundColor: "{colors.navy-14}"
  app-header:
    backgroundColor: "{colors.navy-6}"
    height: "56px"
---

# Design System: PwStreamer

<!-- Registrado a partir do código entregue (casca do app, Painel, Canais, Webinars, Configurações, Plano e cobrança, Dados de cadastro, rodapé, o modal de canais, o modal de planos e o diálogo "Novo webinar"). Onde o mock mockups/design-system.html e o código divergem, vale o código. Valores em hex: os do tema escuro, que é o padrão; a troca por tema está em Colors. -->

## Overview

**Creative North Star: "O Lançador"**

A casca do PwStreamer (tudo fora do estúdio) existe para levar o anfitrião ao ar. Cada tela tem uma ação, e o resto é estado. No Painel, essa ação é "Entrar no estúdio". A tela diz o que vem a seguir, para onde a live vai e o que falta consertar. Não mostra indicadores, cartões nem nada do que o produto sabe fazer sem que a tarefa do momento peça. É uma coluna estreita sobre uma rampa azul-marinho de 18 degraus, em Poppins e em quatro tamanhos. A estrutura é feita de linhas de 1px.

A cor é escassa de propósito. O azul da marca preenche só o botão da ação da tela, e o vermelho do tally pertence ao ar (e, como texto, às ações que apagam algo). Todo o resto, inclusive os estados "ligado", "selecionado" e "atual", sobe ou desce na rampa neutra. O estado é dito por ícone e palavra, e não por matiz. A rampa foi gerada com luminância casada contra o cinza neutro, e por isso o marinho não custa contraste.

A densidade é baixa na casca e alta no estúdio. O estúdio é outro escopo (`[data-surface="console"]`), escuro sempre, mesmo no tema claro, porque o operador se adapta à luminância do entorno do vídeo e ela não pode mudar no meio de uma live.

**Key Characteristics:**
- Uma ação colorida por tela; o resto em tinta neutra.
- Vermelho = ar. Não entra em gráfico, em alerta, em erro de campo nem em decoração.
- Linhas de 1px (`--line`) separam seções e linhas de lista; sem cartões na casca.
- Poppins em `text-xs`, `text-sm`, `text-base` e `text-3xl`; mono tabular só para medidas.
- Estado por ícone + texto, sempre com o nome acessível completo.
- Três escopos de tema sobre as mesmas primitivas: escuro (padrão), claro e console.
- Um único momento de movimento na página: o chip de um canal recém-conectado entra deslizando uma vez. Diálogos entram só pela primitiva `Modal`.

## Colors

Uma rampa azul-marinho de luminância casada carrega quase tudo. Dois acentos cromáticos, cada um com um único lugar.

### Primary
- **Azul da Marca Profundo** (`brand-deep`): o preenchimento do botão primário (`.btn`). É a única área cromática da casca. Texto branco sobre ele. Há um botão primário por tela: "Entrar no estúdio" (tamanho `lg`) no Painel, "Conectar canal" em Canais, "Agendar webinar" em Webinars (e o envio do diálogo "Novo webinar", com o mesmo verbo) e, no modal de canais, o envio do formulário ("Conectar canal" ou "Salvar alterações"; "Ver planos" quando a plataforma está bloqueada pelo plano). Plano e cobrança e o modal de planos não têm botão primário enquanto a assinatura não abre, e por isso não têm cor nenhuma (ver a Regra da Vitrine sem Balcão). Dados de cadastro não tem cor em repouso: o primário "Salvar nome" só existe enquanto o nome está sendo editado.
- **Azul da Marca** (`brand`): a cor nominal da marca e a ponta inicial do gradiente do logo. Na casca, não é superfície de nada.
- **Azul da Marca Claro** (`brand-lift`): só o anel de foco (`:focus-visible`, 2px, afastado 2px). O foco precisa ser visível em qualquer superfície, e por isso é a exceção à regra da voz única.

### Secondary
- **Carmim do Tally** (`tally`): o sinal de "no ar". Moldura PGM ao vivo (`[data-air="on"] .pw-frame--pgm`) e o botão de encerrar (`.btn--danger`, 5,02:1 com branco). Também é o fundo do botão de confirmação em diálogos destrutivos (`useConfirm` com `destructive`).
- **Carmim como texto** (`--sig-texto`: `tally-lift` sobre escuro e console, `tally-deep` sobre claro): itens de menu destrutivos ("Remover canal", "Excluir webinar").

### Tertiary
- **Gradiente da Marca** (`brand-grad-from` → `brand-grad-mid` → `brand-grad-to`): existe só dentro do logo (`PwStreamLogo`). As três paradas têm a mesma luminância (Y ≈ 22,9 %), e o gradiente é uma rotação pura de matiz. Não é usado como fundo, borda nem texto fora do logo.

### Neutral
Os papéis semânticos trocam com o escopo; as primitivas `navy-*` nunca. Use sempre o papel (`var(--ink)`), nunca a primitiva.

| Papel | Uso | Escuro (`:root`) | Claro | Console |
|---|---|---|---|---|
| `--well` | fundo de campo de formulário, poço | navy-3 | navy-89 | navy-0 |
| `--bg` | fundo da página e do cabeçalho | navy-6 | navy-96 | navy-3 |
| `--surface` | modal, trilha da barra de rolagem | navy-10 | navy-99 | navy-6 |
| `--panel` | esqueleto de carregamento, trilho do switch desligado, item de menu em hover, linha de lista mestre em hover, destino atual no menu móvel | navy-14 | navy-92 | navy-10 |
| `--raise` | hover de botão fantasma/ícone/chip, segmento ativo, linha escolhida da lista mestre, fundo do menu | navy-18 | navy-100 | navy-14 |
| `--line` | todas as linhas de estrutura (1px) | navy-22 | navy-80 | navy-18 |
| `--line-ctl` | borda de controle: chip, segmentado, botão fantasma, campo (abaixo de 3:1; ver a dívida conhecida) | navy-28 | navy-70 | navy-28 |
| `--ink-hi` | títulos, nomes, destino atual, switch ligado, caixa de seleção marcada, pendência, erro de campo (frase e borda) | navy-96 | navy-6 | navy-96 |
| `--ink` | corpo; a hora em mono | navy-89 | navy-18 | navy-89 |
| `--ink-lo` | texto secundário, descrições, dicas de campo, ação de texto em repouso, destinos não atuais | navy-80 | navy-28 | navy-70 |
| `--ink-dim` | placeholder; borda da caixa de seleção desmarcada (3:1 contra toda superfície, conferido pelo portão) | navy-70 | navy-36 | navy-58 |
| `--stage` | letterbox do vídeo; nunca clareia | navy-0 | navy-0 | navy-0 |

Gráficos usam a rampa por **valor**, nunca por matiz (`--chart-1..5`, `--chart-grid`, `--chart-axis`). A separação sobrevive a protanopia, deuteranopia e escala de cinza.

### Named Rules
**Regra da Voz Única.** Numa tela da casca, só o botão da ação da tela tem cor. Ligado, selecionado, atual e pronto são ditos pela rampa (`--ink-hi`, `--raise`), nunca pelo azul. Switch ligado e caixa marcada são tinta cheia; segmento ativo e linha escolhida sobem um degrau; destino atual ganha um traço de 2px em `--ink-hi`.

**Regra do Ar.** O carmim é o sinal de "no ar". Fora do ar, aparece só onde algo é apagado ou encerrado. Não entra em pendência, em aviso, em erro de campo, em gráfico nem em ícone de marca. Uma pendência de canal ("sem chave") fica na tinta do nome, com ícone de alerta.

**Regra da Vitrine sem Balcão.** Uma tela que mostra algo que ainda não se pode fazer (hoje: assinar um plano) não tem ação primária e, portanto, não tem cor. Nada de botão desabilitado, selo "em breve" ou checkout de mentira: o "em breve" é uma frase em palavras simples, em `text-sm` `--ink-lo`, junto do que ainda não abre ("A assinatura abre em breve, por aqui mesmo. Hoje nenhuma cobrança é feita."). O plano atual é dito em palavra ("· seu plano"), não por destaque, e um diálogo assim fecha com "Fechar" fantasma.

**Regra do Erro em Tinta Alta.** O que precisa de atenção (pendência, erro de campo, texto não salvo, falha ao salvar) sobe para `--ink-hi` e ganha um ícone; o que está em ordem fica em `--ink-lo`. A diferença é de degrau na rampa, nunca de matiz.

**Regra da Marca Monocromática.** Ícones de plataforma (YouTube, Twitch…) ficam em `currentColor`, traço 1,75, nunca nas cores do dono da marca. Vêm do Lucide; onde o Lucide não tem a marca, o ícone é desenhado no mesmo traço (o K do Kick).

## Typography

**Display Font:** Poppins (com system-ui, -apple-system, Segoe UI)
**Body Font:** Poppins
**Label/Mono Font:** a pilha mono padrão do Tailwind (`font-mono`: ui-monospace, SFMono-Regular, Menlo…) com `tabular-nums`

**Character:** Uma geométrica só, em quatro tamanhos e três pesos, com o contraste feito por tamanho e tinta, não por cor. O mono é a voz das medidas: aparece onde há um número que se lê como instrumento.

### Hierarchy
- **Display** (600, `text-3xl`, tracking-tight): uma por tela. É o `h1` das páginas (`CabecalhoDePagina`) e, no Painel, o título da próxima live, com `text-balance`.
- **Title** (600, `text-base`): título de seção (`h2` de `SecaoDePagina`, "Canais", "Próximas lives"), título de diálogo e o cabeçalho do painel de detalhe (ícone + nome da plataforma).
- **Body** (400 ou 500, `text-sm`): descrições (`max-w-prose`), nomes em linhas de lista (500), rótulos de campo (500, em `--ink-hi`), rótulos de botão e de chip, ações de texto, os itens de um plano aberto (em `--ink`).
- **Label** (400, `text-xs`): a linha de metadados abaixo de um nome (plataforma · estado, horário · canais), a palavra de estado na lista mestre, a linha de origem de um registro ("É o e-mail com que você entra."), dicas e erros de campo, rodapé e aviso de teste no cabeçalho.
- **Button** (600, 14px; `lg` 16px; `sm` 12px): definido em `.btn`, e os três caem sobre os degraus `sm`/`base`/`xs` da escala.
- **Measure** (mono, tabular, na tinta `--ink`): só a hora dentro do rótulo do horário (`Horario` isola `20:00` e deixa "Hoje, às" ou "Domingo, 27 de setembro, às" na fonte do texto). Ver a Regra do Horário Derivado.
- **Preço** (Poppins, `text-sm` 500, `tabular-nums`, `--ink-hi`; o total do ano abaixo em `text-xs` `--ink-lo`, também tabular): preço não é instrumento, então fica na fonte do texto, mas em algarismos tabulares para as linhas se lerem em coluna. Sempre por `formatPrice` (BRL, "R$ 39,90").

### Named Rules
**Regra dos Quatro Tamanhos.** A casca usa `text-xs`, `text-sm`, `text-base` e `text-3xl`, e nada mais. Tamanho em px avulso (`text-[13px]`) é dívida contada pela catraca (`tamanho-de-fonte-avulso`).

**Regra do Mono como Medida.** Mono aparece só em medidas (hora, e no estúdio bitrate e contadores), sempre com `tabular-nums`. Nunca como rótulo, sobretítulo ou enfeite. Dinheiro não é medida: preço fica em Poppins com `tabular-nums`.

**Regra do Número Colado.** Entre um número e sua unidade vai um espaço inseparável (U+00A0: "3 horas", "15 min"), e o último par de palavras de um limite também ("ao vivo"), para que nenhuma linha estreita quebre em "15 | min" nem deixe uma palavra sozinha. As frases de várias linhas em `text-xs` e `text-sm` que vão a colunas estreitas (erro e dica de campo, linha de origem, linha de falha ao salvar) levam `text-pretty`, que faz o mesmo pela última linha do parágrafo; os dois se somam, um não substitui o outro.

**Regra da Caixa Normal.** Rótulos, links e ações ficam em caixa normal de frase. Caixa alta com espaçamento largo não é voz do sistema.

## Layout

Uma coluna central para todas as páginas da casca (`Pagina`): `max-w-3xl` (768px), centralizada, respiro lateral de 16px (24px a partir de `sm`), topo de 48px (64px a partir de `sm`) e base de 96px. O Painel usa o mesmo esqueleto. O cabeçalho e o rodapé são mais largos (`max-w-6xl`), então a coluna fica recuada em relação à barra.

O ritmo vertical é fixo:
- Cabeçalho de página: título, descrição a 8px e, à direita, a ação da página (empilha abaixo de `sm`).
- Ação da tela: 32px abaixo do título da live.
- Seções: 48px de distância, abertas por uma linha de 1px e 24px de respiro até o título.
- Linhas de lista: 16px de padding vertical, separadas por `divide-y` em `--line`. Listas de página inteira são fechadas por linha em cima e embaixo (`border-y`).
- Ações de texto de um cabeçalho de seção ficam lado a lado, a 20px, alinhadas à linha de base do título.
- Um controle de seção (`acao` de `SecaoDePagina`, ex.: Mensal/Anual) fica à direita do título, centrado na linha dele, a pelo menos 16px; em tela estreita desce para baixo do título, a 12px. O conteúdo da seção começa 16px abaixo.
- Chips quebram em linhas com 8px de intervalo.
- Formulários: rótulo, campo a 8px, dica ou erro a 8px abaixo do campo; 20px entre campos; 24px entre a frase de orientação e o primeiro campo.
- Registro (`dl` de dados da conta): 48px abaixo do cabeçalho da página; em cada linha, o valor 4px abaixo do rótulo e a linha de origem a 8px; a ação de texto à direita, a pelo menos 16px. Editando: a linha de falha 16px abaixo da dica, e as ações do formulário 20px abaixo.

**Mestre-detalhe (diálogo `xl`, 896px).** A partir de `md`, duas colunas: a lista a 15rem (240px), com 16px de respiro e uma linha de 1px à direita, e o detalhe no resto, a 24px da linha. O título do detalhe desce 8px para ficar na linha do nome da primeira plataforma. Abaixo de `md`, vira dois passos no mesmo diálogo: a lista (cada linha com um chevron à direita) e, ao escolher, o formulário, com "‹ Plataformas" como ação de texto no topo para voltar. Quem abre o diálogo já num canal cai direto no formulário.

**Diálogo `md` (448px).** Um formulário curto numa coluna: campos a 20px uns dos outros, dois campos curtos lado a lado numa grade de duas colunas a 12px (Data e Hora, também no celular) e uma grade de opções em duas colunas em qualquer largura (12px entre colunas, 16px a partir de `sm`). O corpo rola; o rodapé do `Modal` (linha em cima) não. É o "Novo webinar".

**Diálogo `lg` (672px).** Uma coluna só: a frase de orientação e o controle da lista lado a lado (empilham quando não cabem), a lista 16px abaixo e o rodapé do `Modal`, cuja linha fecha a lista (`semLinhaFinal`). É o modal de planos.

As ações de um formulário ficam no fim dele, alinhadas à direita a partir de `sm` (Cancelar e depois o primário, a 12px). No celular empilham na largura toda, com o primário em cima. Num diálogo, as ações ficam no rodapé do `Modal`, e a linha de falha ao salvar vai no rodapé também, 12px acima delas, fora do corpo que rola: no celular ela fica à vista sem rolar.

Responsivo: abaixo de `md` (768px) a navegação principal vira um botão de menu (44px) que abre uma lista vertical sob o cabeçalho, com alvos de 44px. O atalho "Estúdio" some abaixo de `sm`; o aviso de teste aparece só a partir de `lg` no cabeçalho e dentro do menu móvel abaixo disso. O botão "Entrar no estúdio" ocupa a largura toda no celular e tem no mínimo 256px a partir de `sm`. A calha da barra de rolagem é reservada (`scrollbar-gutter: stable`) para a casca não pular entre telas que rolam e que não rolam.

Camadas de empilhamento em quatro degraus nomeados: `--z-sticky` 20, `--z-dropdown` 40, `--z-scrim` 60, `--z-modal` 70, `--z-toast` 80.

## Elevation & Depth

A casca é plana. A profundidade vem da rampa: página em `--bg`, superfícies flutuantes em `--raise` ou `--surface`, e a separação em repouso é sempre uma linha de 1px, nunca uma sombra nem um cartão com fundo. A sombra existe só no que flutua sobre a página e some quando ela fecha. Dentro de um diálogo vale a mesma regra: as colunas do mestre-detalhe são separadas por uma linha, e a linha escolhida sobe para `--raise` sem sombra.

### Shadow Vocabulary
- **Menu ancorado** (`box-shadow: 0 8px 24px -8px rgb(0 0 0 / 0.45)`): o popover do `Menu` (ações "⋯" e conta).
- **Diálogo e aviso** (`shadow-2xl` do Tailwind: `0 25px 50px -12px rgb(0 0 0 / 0.25)`): `Modal`, `ConfirmDialog` e `Toast`.

### Named Rules
**Regra da Linha, Não do Cartão.** Estrutura é uma linha de 1px em `--line`. Seção, lista e rodapé são separados por borda; nenhum bloco da casca tem fundo próprio para se destacar. Se parece precisar de um cartão, precisa de uma seção.

**Regra do Chão Plano.** Nada em repouso na página tem sombra. Sombra só em camada que flutua (menu, diálogo, aviso).

## Shapes

Cantos generosos e consistentes, e uma geometria que distingue controle de estrutura. Os controles são arredondados (botão 16px, botão denso 10px, botão de ícone 16px, campo de formulário 16px, linha da lista mestre 16px, menu 16px com itens de 12px, segmentado 16px por fora e 10px por dentro, modal 20px). Chips e switches são pílulas completas. A caixa de seleção é a única exceção abaixo da escala: 20px com 5px de raio, porque os raios nomeados (8px para cima) a fariam ler como botão de rádio. A estrutura (linhas, seções, a divisória do mestre-detalhe) é reta e sem raio. O anel de foco tem 4px de raio.

A borda sólida é o padrão de todo controle com contorno (`--line-ctl`). O tracejado é reservado para "adicionar": uma pendência nunca pode parecer uma vaga vazia. O ícone de plataforma na página de Canais fica numa moldura quadrada de 40px, com 16px de raio e borda em `--line`.

## Components

### Buttons
Firmes e sem enfeite. A aparência mora na classe `.btn` do `index.css` (em `@layer base`), e o `<Button>` só escolhe variante e tamanho. Assim, um `<button>` ainda não migrado adota o sistema acrescentando `className="btn"`.
- **Shape:** cantos generosos (16px); o `sm` usa 10px.
- **Primary:** preenchimento em `brand-deep` com texto branco, 9px × 18px, 14px/600, ícone a 8px do rótulo. Um por tela, no máximo. O rótulo é o verbo do que ele faz ao objeto à vista ("Conectar canal" para um canal novo, "Salvar alterações" para um existente), e não o título do diálogo.
- **Large (`lg`):** 13px × 24px, 16px. Reservado à ação da tela: "Entrar no estúdio", com seta à direita.
- **Hover / Focus / Active:** só `filter` anima: `brightness(1.1)` no hover e `0.93` no pressionado, 110ms linear. O foco é o anel global em `brand-lift`. Desabilitado fica a 45 % de opacidade. `loading` desabilita **e** marca `aria-busy`, trocando o ícone por um spinner.
- **Ghost (secundário):** transparente, texto `--ink`, borda `--line-ctl`, hover em `--raise`. Usado em "Entrar" nas linhas de webinar (`sm`), no atalho "Estúdio" do cabeçalho e em "Cancelar" nos diálogos.
- **Danger:** preenchimento carmim, para encerrar a transmissão e confirmar exclusões.
- **Botão de ícone (`BotaoDeIcone`):** 44 × 44px, sem fundo, hover em `--raise`. O nome acessível (`rotulo`) é obrigatório na assinatura.

### Text actions (`AcaoDeTexto`)
A voz de tudo o que é secundário: sem caixa, sem cor. Fica em `--ink-lo` e passa a `--ink-hi` com sublinhado no hover, em `text-sm` no corpo e `text-xs` no rodapé, no cabeçalho e ao lado de um rótulo de campo ("Mostrar chave"). A variante `sublinhada` serve para o link no meio de uma frase: tinta alta, sublinhado em `--line-ctl`, afastado 4px. Um ícone opcional à esquerda (ex.: `+` em "Conectar canal", `‹` em "Plataformas"). `className` só acerta margem e alvo: numa linha de lista, `-my-3 min-h-11` dá o alvo de 44px sem empurrar a altura da linha.
- **`ref` (só na forma botão):** para devolver o foco a ela quando o que ela abriu fecha ("Editar" depois de Salvar ou Cancelar).
- **Com `onClick`** é um `<button>`. **Com `href`** é um link para fora do app (o painel oficial da plataforma): abre em outra aba (`target="_blank"`, `rel="noopener noreferrer"`) e anuncia isso ao leitor de tela com um "(abre em outra aba)" em `sr-only`. Visualmente, o ícone de link externo (12px) vai depois do rótulo, como em "Abrir o YouTube Studio ↗". As duas formas são exclusivas na assinatura.

### Chips
- **Style:** pílula de 36px de altura, borda `--line-ctl`, fundo transparente, nome em `--ink-hi` `text-sm`, ícone da plataforma à esquerda em `--ink-lo`. Hover em `--raise`.
- **State:** à direita, um ✓ para pronto, ou um ícone de alerta com a pendência em palavra ("sem servidor nem chave", "sem servidor", "sem chave", "desligado", "não conectado"), sempre na tinta do nome. O `aria-label` carrega a frase inteira ("YouTube Principal: pronto"). Clicar numa pendência abre o modal de canais **naquele canal** (pelo id), com o foco no campo que falta.
- **Vocabulário da pendência:** uma regra só, em `src/lib/canais.ts`. Faltando os dois, diz os dois. A forma curta (`pendenciaCurta`) vai nos chips e na lista mestre; a longa (`pendenciaDoCanal`: "Falta o servidor e a chave", "Falta o servidor", "Falta a chave") vai na página de Canais. O canal sem plataforma conhecida se chama "Servidor RTMP próprio".

### Platform icons (`PlataformaIcone`)
Cada plataforma tem o seu ícone, e nenhum é repetido entre duas plataformas de vídeo: YouTube, Facebook, Instagram, LinkedIn e Twitch pelo Lucide; TikTok pela nota musical (`Music2`); Rumble pelo play redondo (`CirclePlay`); Kick por um K desenhado para o conjunto (duas retas, `viewBox` 24, traço 1,75, pontas e juntas redondas, `currentColor`); servidores RTMP (próprio, NGINX, SRS…) pelo servidor. O sinal de transmissão fica só para o atalho do estúdio. Na casca, o ícone fica em `--ink-lo`, a 18px nas linhas da lista mestre e no cabeçalho do detalhe, e a 16px nos chips.

### Cards / Containers
A casca não tem cartões. Os contêineres são a coluna (`Pagina`), a seção aberta por uma linha (`SecaoDePagina`, com um controle opcional `acao` à direita do título) e a lista com `divide-y`. Só os diálogos e avisos flutuantes têm fundo, borda e sombra (ver Elevation & Depth).

### Inputs / Fields
- **Style:** campos nativos seguem os tokens globalmente: fundo `--well`, texto `--ink-hi`, borda `--line-ctl`, placeholder `--ink-dim`. Na casca redesenhada, o campo de uma linha tem 44px de altura (`h-11`), 16px de raio, 12px de respiro lateral e texto `text-sm`. O rótulo fica acima, em `text-sm` 500 `--ink-hi`, ligado por `htmlFor`; uma ação de texto `xs` pode ficar na mesma linha, à direita ("Mostrar chave").
- **Dica:** uma frase em `text-xs` `--ink-lo`, 8px abaixo do campo, ligada por `aria-describedby`.
- **Focus:** o anel global de 2px em `brand-lift`, com afastamento de 2px.
- **Error (`ErroDeCampo`):** a primitiva única do erro de campo, usada no modal de canais, em Dados de cadastro e no "Novo webinar"; nenhuma tela desenha o seu. O ícone `CircleAlert` (14px) e uma frase em `text-xs` `--ink-hi` com `text-pretty`, 8px abaixo do campo, no lugar da dica. O campo recebe `aria-invalid="true"` e `aria-describedby` apontando para a frase, e a regra global do `index.css` (`input`, `textarea` e `select` com `aria-invalid="true"`) sobe a borda para `--ink-hi`. Nunca carmim. A frase diz o que falta e como resolver ("Falta o servidor. O padrão da plataforma é …"). Ao enviar com erro, o foco vai ao primeiro campo inválido; digitar no campo limpa o erro dele.
- **Falha ao salvar:** quando o campo passou mas o salvamento não, uma linha `role="alert"` acima das ações: `CircleAlert` (16px) e uma frase em `text-sm` `--ink-hi` com `text-pretty`. Nunca carmim. A frase diz o que aconteceu e a saída, e pode terminar com **uma** `AcaoDeTexto` sublinhada que executa a saída que ela nomeia ("Sua sessão expirou, então o nome não foi salvo. Entrar de novo"). Um novo envio apaga a linha da tentativa anterior. Num diálogo, a linha fica no rodapé, logo acima das ações (ver Layout). Depois da falha, o foco vai à saída: "Entrar de novo" quando a sessão expirou, senão de volta ao primário.
- **Endereço longo (servidor RTMP):** um `textarea` de uma linha que cresce com o conteúdo (`rows=1`, sem redimensionar, sem rolagem, quebra em qualquer caractere), com a mesma altura mínima de 44px. É um valor só: Enter envia o formulário e quebras de linha coladas são removidas. Assim o endereço inteiro fica à vista a 375px, onde a pessoa precisa conferi-lo.
- **Caixa de seleção (`CaixaDeSelecao`):** a primitiva única de marcar, já dentro da linha rotulada: o `<label>` inteiro (no mínimo 44px, `min-h-11`, caixa a 12px do texto) é o alvo e o nome acessível. A caixa tem 20px e 5px de raio. Desmarcada, é borda `--ink-dim` sobre `--well`; marcada, preenchimento e borda em `--ink-hi` com o ✓ (`Check` 14px, traço 3) em `--bg`. A cor muda em 150ms. Foco: o anel global. Desabilitada, 45 %. Nunca o azul da marca: marcar é estado.
- **Switch:** trilho de 40 × 24px. Ligado é tinta cheia (`--ink-hi`) com botão em `--bg`; desligado é `--panel` com borda `--line-ctl` e botão em `--ink-lo`. Estado em `aria-checked` e na posição, nunca só na cor. O nome diz o que liga ("Transmitir para YouTube Principal").
- **Segmentado:** grupo de poucas opções exclusivas (`role="group"` com nome), borda `--line-ctl`, 16px por fora e 10px por dentro, opções em `text-sm` a 6px × 12px. A opção ativa sobe para `--raise` e `--ink-hi`, com `aria-pressed`; as outras ficam em `--ink-lo`. Usos: tema (Configurações) e período de cobrança (`SeletorDePeriodo`: "Mensal" e "Anual, 20% menos", onde o rótulo diz a vantagem em palavras em vez de um selo de desconto).
- **Disabled:** 45 % de opacidade.

### Navigation
Barra fixa de 56px em `--bg`, com linha de 1px embaixo: o logo (leva ao Painel), quatro destinos (Painel, Canais, Webinars, Configurações), um aviso discreto de teste grátis, o atalho fantasma "Estúdio" (oculto no Painel, onde entrar no estúdio já é a ação da tela) e o avatar de 32px que abre o menu da conta. Os destinos ficam em `text-sm`: os não atuais em `--ink-lo` e o atual em `--ink-hi` com traço de 2px na base e `aria-current="page"`. No celular, a navegação vira o botão de menu descrito em Layout. O rodapé repete a lógica: linha em cima, "© PW Stream Online" e duas ações de texto `xs`.
- **Plano e cobrança** não é destino da barra: entra-se pelo menu da conta ("Plano e cobrança") e pelo aviso de teste.
- **"Ver planos"** passa sempre por `abrirPlanos`: fora do estúdio leva à página Plano e cobrança; dentro do estúdio abre o modal de planos por cima do palco, para ninguém sair da câmera nem de uma live em andamento. Nenhuma tela decide sozinha para onde "Ver planos" vai.

### Linha de ação (`LinhaDeAcao`)
É a unidade de Configurações: título (`text-sm` 500), uma frase do que há ali (`text-xs` `--ink-lo`) e o indicador de destino. `avancar` mostra um chevron à direita que se desloca 2px no hover. `expandir` mostra um chevron para baixo que gira 180° e abre o conteúdo logo abaixo, com `aria-expanded` e `aria-controls`. `lateral` (opcional) põe um valor curto à direita, alinhado à direita e antes do indicador (o preço de um plano); o título e a frase encolhem, o valor não.

### Registro (dados da conta)
Uma lista do que a conta é, não um formulário a preencher. É a página Dados de cadastro: um `dl` de página inteira, fechado por linha em cima e embaixo (`border-y`) e com `divide-y` em `--line`.
- **Linha:** rótulo (`dt`, `text-sm` 500 `--ink-hi`) sobre o valor (`dd`, `text-sm` `--ink`, quebrando palavras longas como um e-mail); sem valor, "Sem nome" em `--ink-lo`. Opcionalmente, uma linha de origem (`text-xs` `--ink-lo`) que diz de onde o valor vem. No máximo **uma** ação de texto à direita ("Editar", com o objeto em `sr-only`), num `dd` próprio, com alvo de 44px pela margem negativa.
- **Só leitura:** um valor que vem de outro sistema (o e-mail vem do login) não tem ação; a linha de origem diz de onde ele vem.
- **Editar no lugar:** a linha editável vira o próprio campo. O rótulo fica onde estava e passa a ser o `<label>`; o valor vira o campo de 44px; a dica embaixo; depois as ações do formulário (Cancelar fantasma e o primário com verbo e objeto, "Salvar nome"), à direita a partir de `sm` e empilhadas na largura toda no celular, com o primário em cima. Abrir põe o foco no campo com o cursor no fim; fechar (Salvar, Cancelar ou Esc) devolve o foco a "Editar". Salvar sem mudança só fecha.
- **Cor e movimento:** nenhuma cor em repouso; o azul aparece só no primário, durante a edição. Nenhum movimento: a troca de linha para campo é instantânea, e a entrada do chip continua sendo a única entrada da casca.

**Regra do Salvo de Verdade.** Uma tela só diz "salvo" (o aviso "Nome salvo") depois de o banco confirmar a escrita. Cada falha tem a sua frase com a saída: sem conexão ou sem cota, "tente de novo mais tarde"; sem confirmação em 10 s, "não deu para confirmar"; sessão expirada, "Entrar de novo"; recusa, "tente de novo". A restauração da sessão é esperada (`esperarSessao`) antes de se declarar uma sessão expirada. Nada de espera de enfeite nem de "salvo" local que o banco não viu. A regra tem uma implementação só, `gravarComConfirmacao` em `src/lib/firestoreService.ts`, que falha com `ErroAoSalvar` (motivo `FalhaAoSalvar`: `sem-login`, `sem-conexao`, `sem-confirmacao`, `recusado`); `salvarNomeDoPerfil` e `agendarWebinar` passam por ela, e toda gravação nova também passa. Enquanto grava, o primário fica em `loading` e Cancelar desabilita; o rascunho só se apaga depois da confirmação. Uma nova tentativa de criar algo reusa o id do rascunho, e uma escrita atrasada é repetida, nunca duplicada.

**Regra do Dado com Uso.** Um registro só pede o que algo no app já usa. Campo guardado "para depois" não entra; volta junto com o que o usa.

### Lista de planos (`ListaDePlanos`)
A mesma lista na página Plano e cobrança e no modal de planos do estúdio; não existe outra tabela de preços no app.
- **Linha:** uma `LinhaDeAcao` `expandir` por plano, na ordem de `PLANS`. Título: o nome do plano, e no plano atual o nome seguido de "· seu plano" (em palavra, sem cor, sem borda, sem selo). Frase: os três limites, separados por " · ": canais ao mesmo tempo, pessoas na tela e o tempo (horas de transmissão ao vivo nos pagos; gravação de até N min por live no gratuito).
- **Preço (`lateral`):** o preço por mês do período escolhido, e no Anual o total do ano embaixo ("R$ 478,80 por ano"). Ver Preço em Typography.
- **Aberta:** a lista completa do plano (`features`), um item por linha com ✓ (`Check` 14px, `--ink-lo`) e o texto em `text-sm` `--ink`, 8px entre itens e 20px antes da próxima linha. Uma linha aberta por vez.
- **Período:** o `SeletorDePeriodo` fica fora da lista (na `acao` da seção, ou ao lado da frase no diálogo) e reescreve os preços de todas as linhas.
- **Bordas:** linha em cima e embaixo na página; `semLinhaFinal` dentro de um diálogo, onde o rodapé já traz a linha de baixo.
- **Sem ação de compra na linha** enquanto a assinatura não abre (Regra da Vitrine sem Balcão). Quando abrir, o sistema ganha um botão primário por tela, não um por linha.

### Menu (`Menu`)
Ações secundárias atrás de um "⋯", para que cada linha de lista tenha **uma** ação visível. Segue o padrão WAI-ARIA Menu Button: setas, Home/End, Esc devolve o foco ao gatilho e clicar fora fecha. O popover fica em `--raise`, com borda `--line`, cantos de 16px e itens de 12px em `text-sm`. Itens destrutivos ficam em `--sig-texto` e sempre passam por `useConfirm`, nunca `confirm()`.

### Linha de prontidão (assinatura do Painel)
É a resposta a "para onde a live vai". O título "Canais" traz a contagem honesta ("1 de 3 prontos", que cobre exatamente os chips mostrados). Seguem os chips dos canais ligados e as pendências da próxima live (plataforma anunciada mas desligada ou não conectada). À direita, "N outros desligados" e "+ Conectar canal" como ações de texto. O estado de cada canal vem de uma regra só, `src/lib/canais.ts` (`pronto` | `incompleto` | `desligado`), lida pelo Painel, pela página de Canais e pelo modal de canais.

**Movimento.** Um chip de canal recém-conectado entra uma vez: fade + deslize de 8px da esquerda, 300ms, `cubic-bezier(0.16, 1, 0.3, 1)`, só com `motion-safe`. É o único movimento de entrada no conteúdo da casca. Diálogos entram pela primitiva `Modal` (fundo em fade de 150ms; painel em fade + escala de 95 % a 100 %, 200ms) e nenhum diálogo acrescenta uma entrada própria. O resto é retorno de estado: cor em 150ms, `filter` do botão em 110ms, o chevron em 200ms `ease-out` e o pulso do esqueleto de carregamento (`motion-safe`). `prefers-reduced-motion` zera animações e transições globalmente.

### Mestre-detalhe (assinatura do modal de canais)
Conectar ou editar **um** canal: escolher a plataforma, colar o servidor e a chave que ela mostra, salvar. Vive num `Modal` `size="xl"` com o título fixo e neutro "Canais"; o título não muda com a linha escolhida, e o verbo mora no botão de envio.
- **Lista (mestre):** uma `tablist` vertical (`useTabs` com `orientacao: 'vertical'`: ↑/↓, Home/End e `aria-orientation="vertical"`), rotulada "Plataformas". Uma linha de 56px (mínimo) por plataforma: ícone em `--ink-lo`, nome em `text-sm` 500 `--ink-hi` (truncado) e, abaixo, a palavra de estado em `text-xs`. A linha escolhida sobe para `--raise` (a partir de `md`); as outras ganham `--panel` no hover, em 150ms.
- **Palavras de estado, em ordem de precedência:** "Não salvo" (lápis, `--ink-hi`) quando há texto digitado e não salvo; "A partir do Standard" (cadeado, `--ink-lo`) quando o plano não libera a plataforma; "Não conectado" (`--ink-lo`) sem canal; a pendência curta com a inicial maiúscula ("Sem servidor nem chave", "Sem servidor", "Sem chave"; alerta, `--ink-hi`); e só num canal completo, "Pronto" (✓, `--ink-lo`) ou "Desligado" (`--ink-lo`). O que falta vem antes de ligado/desligado; ligar e desligar não se faz aqui.
- **Detalhe:** um `tabpanel` com o cabeçalho (ícone de 18px + nome, `text-base` 600), a frase de onde achar a chave pelo caminho da própria plataforma (`text-sm` `--ink-lo`, `max-w-prose`) terminada pelo link externo "Abrir …" (`AcaoDeTexto` `href` sublinhada), e os campos Nome do canal, Servidor e Chave de transmissão. O servidor vem preenchido com o padrão da plataforma, e a dica diz isso.
- **Plataforma bloqueada pelo plano:** no lugar do formulário, uma frase do que o plano permite e o botão primário "Ver planos".
- **Limite do plano:** um canal novo que passaria do número de canais ligados ao mesmo tempo do plano é salvo desligado. Uma linha com o ícone `Info` em `text-sm` `--ink-lo`, acima dos botões, diz quantos o plano transmite e quantos já estão ligados, com "Ver planos" sublinhado; o aviso depois de salvar repete o porquê. Editar um canal nunca o liga nem o desliga.
- **Abertura:** aberto por uma pendência ou por "Editar servidor e chave", abre **naquele canal** (pelo id, o que vale também para servidores NGINX/SRS criados no estúdio) e põe o foco no campo que só a pessoa pode preencher. Aberto por "Conectar canal", começa na primeira plataforma sem canal, com o foco na lista.
- **Assinatura: o rascunho fica.** O que foi digitado numa plataforma sobrevive à troca para outra (e aparece como "Não salvo" na lista). Salvar com outras linhas ainda sujas não fecha o diálogo: ele segue para a próxima delas e mostra, no topo do detalhe, uma linha `role="status"` com ✓ em `text-sm` `--ink-hi` ("YouTube salvo. Falta salvar: Facebook."). Fecha só quando não resta rascunho.
- **Movimento:** nenhum além da entrada da primitiva `Modal` e da cor em 150ms das linhas. O servidor cresce sem transição.

### Novo webinar (diálogo de agendar)
Dizer quando e para onde. Vive num `Modal` `size="md"` com o título neutro "Novo webinar"; o verbo mora só no envio, "Agendar webinar". Abre com o foco no Título. É aberto por "Agendar webinar" em Webinars e no Painel.
- **Campos:** Título (44px); Data e Hora lado a lado (campos nativos `date` e `time`, 44px, a data com mínimo em hoje); Descrição (`textarea` de 3 linhas, sem redimensionar), com a dica "Opcional. Aparece na página de inscrição."
- **Canais:** um `fieldset` com a legenda "Canais" (rótulo de campo) e a dica de uma linha "Para onde a live vai.", seguidos de uma grade de duas colunas de `CaixaDeSelecao`, em qualquer largura. As opções são as oito plataformas de `PLATAFORMAS_NOMEADAS`, na ordem do modal de canais; o servidor RTMP próprio fica fora, porque "Servidor…" não diz qual servidor é para `plataformaPeloNome`.
- **Linha de canal:** o ícone da plataforma (14px, `--ink-lo`) na mesma linha, antes do nome (`text-sm` `--ink-hi`), e embaixo a palavra de estado em `text-xs` `--ink-lo`, no vocabulário de `src/lib/canais.ts`, em minúscula: "pronto", a pendência curta ("sem chave"…), "desligado" ou "não conectado". O ícone não ganha coluna própria, para a palavra de estado caber numa linha no celular.
- **Pré-marcação:** ao abrir, as plataformas dos canais ligados vêm marcadas (para onde a live vai hoje), a menos que a pessoa já tenha mexido nelas neste rascunho.
- **Validação:** `ErroDeCampo` em Título, Data e Hora, e o foco no primeiro inválido. Horário no passado é erro na Hora ("Esse horário já passou. Escolha um a partir de agora.").
- **Salvar:** pela Regra do Salvo de Verdade. Só depois da confirmação a linha entra na lista, o diálogo fecha e o aviso "Webinar agendado" mostra o rótulo do horário. Na falha, o diálogo fica aberto com o rascunho e a linha de falha no rodapé; em `sem-login` ela termina com "Entrar de novo" sublinhado.
- **Movimento:** nenhum além da entrada da primitiva `Modal` e dos 150ms da caixa.

**Regra do Horário Derivado.** "Hoje, às…" e "Amanhã, às…" são derivados na hora de mostrar, a partir de `startsAt` (ISO 8601), por `rotuloDoHorario` em `src/lib/horario.ts`, e nunca gravados: um "Amanhã" gravado vira mentira no dia seguinte. O campo `time` guarda a frase absoluta ("Domingo, 27 de setembro, às 20:00", por `horarioPorExtenso`) para quem lê só o texto (página pública, estúdio). Webinar antigo sem `startsAt` mostra o seu texto livre. Lista de webinars, Painel e aviso usam o mesmo rótulo, e a hora vai em mono pelo `Horario`.

### Limites do plano
`src/lib/plans.ts` é a fonte única dos limites e dos preços. Os campos estruturados decidem; as frases de `features` só descrevem:
- `destinosSimultaneos`: canais ligados ao mesmo tempo (Plano Gratuito 2, Standard 3, Professional 5, Business 8).
- `participantes`: pessoas na tela (3, 6, 8, 12).
- `horasDeTransmissao`: horas de transmissão ao vivo dos pagos (3, 6, 10); `minutosDeGravacaoPorLive`: o limite de gravação do gratuito (15).
- `rtmpProprio`: servidor RTMP próprio como destino, a partir do Standard.
- `priceMonthly` e `priceAnnual` (o anual é o preço por mês cobrado no ano, 20% menor em todos os pagos), sempre exibidos por `formatPrice` (BRL, `pt-BR`).

As linhas da lista de planos mostram exatamente três limites (canais, pessoas, tempo), montados desses campos por `limitesDoPlano`. Nenhuma tela mantém a própria tabela de limites ou de preços nem escreve o nome do plano à mão: o nome vem do primeiro plano que libera o recurso.

## Do's and Don'ts

### Do:
- **Do** usar os papéis semânticos (`var(--bg)`, `var(--ink-lo)`, `var(--line)`) e nunca as primitivas `navy-*` nem hexadecimais em componentes. Hex cru só nos blocos de token do `index.css` (o stylelint cobra).
- **Do** dar a cada tela uma única ação primária em `<Button>`; o secundário vai em `<AcaoDeTexto>` ou `variant="ghost"`, e o terciário num `<Menu>`.
- **Do** separar seções com `<SecaoDePagina>` (linha de 1px, 48px acima, 24px abaixo) e listas com `divide-y divide-[var(--line)]`.
- **Do** dizer cada estado com ícone + palavra e nome acessível completo; a cor nunca carrega o estado sozinha.
- **Do** pôr horas e outras medidas em `font-mono tabular-nums`, e só a medida, não a frase.
- **Do** usar `<BotaoDeIcone rotulo="…">` (44px) para qualquer botão só-ícone.
- **Do** dizer "nenhum…" em texto quando não há dado, sem número inventado, e mostrar esqueleto `aria-busy` enquanto nada chegou.
- **Do** marcar erro de campo com `aria-invalid` + `aria-describedby` e a frase por `<ErroDeCampo>`; a borda sobe sozinha pela regra global.
- **Do** dizer "salvo" só depois de o banco confirmar, e dar a cada falha a sua frase com a saída, numa linha `role="alert"` em `--ink-hi` acima das ações.
- **Do** editar um registro no lugar: o rótulo fica, o valor vira o campo, o foco vai ao campo e volta a "Editar" ao fechar, e Esc cancela.
- **Do** pôr `text-pretty` nas frases de várias linhas em `text-xs`/`text-sm` que vão a colunas estreitas.
- **Do** ler limites e disponibilidade por plano de `src/lib/plans.ts`, e pendências e nomes de plataforma de `src/lib/canais.ts`.
- **Do** formatar todo preço com `formatPrice` (BRL) e, em lista, com `tabular-nums`; nunca `$`, `toFixed` nem cifra escrita à mão.
- **Do** mostrar planos só por `<ListaDePlanos>` e abrir planos só por `abrirPlanos` (página fora do estúdio, modal dentro dele).
- **Do** dizer em palavras o que ainda não abre ("A assinatura abre em breve…") e deixar a tela sem ação primária até abrir.
- **Do** colar número e unidade com espaço inseparável em textos que vão a linhas estreitas.
- **Do** marcar opções com `<CaixaDeSelecao>` (a linha inteira é o alvo e o nome), e nunca com um `<input type="checkbox">` solto.
- **Do** gravar horário como `startsAt` e derivar "Hoje/Amanhã" na tela com `rotuloDoHorario`.
- **Do** gravar só por `gravarComConfirmacao`, com a falha no rodapé do diálogo, acima das ações.
- **Do** abrir o modal de canais por id (`editarCanal(id)`) quando a origem é um canal, e nunca pela plataforma.
- **Do** levar links para fora do app por `<AcaoDeTexto href>`, que abre em outra aba e avisa o leitor de tela.
- **Do** checar todo par novo de texto/superfície nos três escopos: `npm run verify` roda tipos, stylelint, o portão de contraste (WCAG AA em escuro, claro e console), a catraca de dívida, os botões só-ícone e os rótulos de formulário. O mesmo roda no CI (`.github/workflows/design-system.yml`).

### Don't:
- **Don't** usar o azul da marca em estado, seleção, link, ícone ou destaque; ele é do botão da ação da tela.
- **Don't** usar o carmim fora do ar e das ações que apagam ou encerram: nada de vermelho em pendência, aviso, erro de campo, gráfico ou decoração.
- **Don't** montar a casca com cartões de indicador, fundos de bloco ou sombras em repouso.
- **Don't** usar tamanho de fonte em px avulso nem um quinto tamanho na casca; a catraca `tamanho-de-fonte-avulso` só pode descer.
- **Don't** pôr mais de uma ação visível por linha de lista; o resto vai para o "⋯".
- **Don't** colorir ícones de plataforma com as cores das marcas, nem dar o mesmo ícone a duas plataformas.
- **Don't** usar borda tracejada para nada além de "adicionar".
- **Don't** fazer o tema claro alcançar o estúdio: o escopo console é invariante.
- **Don't** fazer o título de um diálogo seguir a seleção interna; o verbo vai no botão.
- **Don't** simular cobrança: sem checkout, "pagamento processado", fatura ou consumo que não existam de verdade.
- **Don't** marcar o plano atual ou um plano "popular" com cor, borda ou selo; o atual é dito em palavra.
- **Don't** descartar texto digitado ao trocar de plataforma ou ao salvar outra.
- **Don't** pedir nem guardar dado que nada no app usa ainda, nem tornar editável um valor que vem de outro sistema (o e-mail do login).
- **Don't** gravar "Hoje" ou "Amanhã" em dado nenhum; só a frase absoluta.
- **Don't** pintar a caixa marcada de azul da marca; marcada é tinta cheia.
- **Don't** simular um salvamento: sem espera de enfeite, sem "atualizado com sucesso" antes da confirmação do banco.
- **Don't** subir número nenhum de `scripts/design-debt-baseline.json`. A catraca deixa a dívida cair e nunca crescer sem um `--update` visível na revisão.

### Fora do sistema (dívida conhecida)
Estas partes ainda carregam o visual herdado do Google AI Studio e **não** são referência: o estúdio (`Header.tsx`, `LeftSidebar`, o palco), admin e super-admin, o site público e os preços. A lista de canais do estúdio já mostra o ícone da plataforma no lugar da foto de banco de imagens, mas o resto do `LeftSidebar` continua fora. Os sinais típicos são tamanhos em px avulsos, `slate`/`gray`/`blue-500` crus, rótulos em caixa alta e sombras de brilho. A catraca mede essa dívida (na linha de base atual: 909 tamanhos avulsos, 415 `<button>` crus fora das primitivas, 76 usos estruturais de `slate`/`gray`, 89 `outline-none`, 7 hex arbitrários em classe, 19 em atributo JSX, 7 `z-index` avulsos e 6 `!important` no CSS; nenhum diálogo nativo bloqueante). Ao tocar numa dessas telas, migre para as primitivas e os papéis deste documento, sem copiar o que está lá.

Dentro das superfícies redesenhadas, alguns desvios também ficam fora do sistema: o gatilho "⋯" do `Menu` (32px), o avatar da conta (32px) e o botão de fechar do `Modal` (cerca de 34px) estão abaixo do alvo de 44px, o chip tem 36px, o cabeçalho usa `z-30` em vez de `--z-sticky`, a borda de campo e de controle (`--line-ctl`) fica entre 1,38:1 e 2,30:1 contra as cinco superfícies nos três escopos (1,72–2,24:1 contra `--bg` e `--surface`, onde os campos pousam), abaixo dos 3:1 da WCAG 1.4.11 (o campo se lê pelo preenchimento `--well` e pelo rótulo, e a caixa de seleção não usa essa borda), e o polegar da barra de rolagem fica azul no hover. A linha "ONLINE STUDIO" do logo (9px, mono, caixa alta) faz parte da marca e não é modelo de rótulo.
