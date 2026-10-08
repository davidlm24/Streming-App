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
  nv-3: "#050B1A"
  nv-6: "#091326"
  nv-10: "#101A31"
  nv-14: "#17233D"
  nv-18: "#202C45"
  nv-28: "#35425E"
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
  public-header:
    backgroundColor: "{colors.navy-6}"
    height: "56px"
  button-google:
    backgroundColor: "transparent"
    textColor: "{colors.navy-89}"
    typography: "{typography.button}"
    rounded: "{rounded.xl}"
    padding: "9px 18px"
    width: "100%"
  capture-frame:
    rounded: "{rounded.xl}"
  studio-bar:
    backgroundColor: "{colors.nv-6}"
    textColor: "{colors.navy-96}"
    height: "48px"
  scene-row:
    backgroundColor: "transparent"
    textColor: "{colors.navy-96}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    height: "56px"
    padding: "8px"
  scene-row-preview:
    backgroundColor: "{colors.nv-14}"
  scene-key-collapsed:
    backgroundColor: "transparent"
    textColor: "{colors.navy-96}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.xl}"
    height: "64px"
    padding: "8px 4px"
  transition-key:
    backgroundColor: "{colors.nv-14}"
    textColor: "{colors.navy-96}"
    typography: "{typography.button}"
    rounded: "{rounded.xl}"
    height: "56px"
  transition-key-pressed:
    backgroundColor: "{colors.nv-10}"
  monitor-program:
    backgroundColor: "{colors.navy-14}"
    rounded: "0px"
    padding: "2px"
  monitor-preview:
    backgroundColor: "{colors.navy-89}"
    rounded: "0px"
    padding: "2px"
  next-cut:
    backgroundColor: "{colors.nv-10}"
    textColor: "{colors.navy-89}"
    typography: "{typography.body}"
    rounded: "0px"
    padding: "10px 16px"
  tray-control-on:
    backgroundColor: "{colors.nv-14}"
    textColor: "{colors.navy-96}"
    typography: "{typography.button}"
    rounded: "{rounded.xl}"
    height: "44px"
  tray-control-off:
    backgroundColor: "{colors.navy-0}"
    textColor: "{colors.navy-70}"
    typography: "{typography.button}"
    rounded: "{rounded.xl}"
    height: "44px"
  level-meter:
    backgroundColor: "{colors.navy-0}"
    rounded: "0px"
    height: "8px"
    width: "96px"
  tool-tab-active:
    backgroundColor: "{colors.nv-14}"
    textColor: "{colors.navy-96}"
    typography: "{typography.label}"
    rounded: "{rounded.xl}"
    height: "56px"
  corner-picker-selected:
    backgroundColor: "{colors.nv-14}"
    textColor: "{colors.navy-96}"
    rounded: "{rounded.md}"
    size: "44px"
  panel-slider-thumb:
    backgroundColor: "{colors.navy-96}"
    rounded: "{rounded.full}"
    size: "16px"
  column-divider:
    backgroundColor: "transparent"
    width: "8px"
---

# Design System: PwStreamer

<!-- Registrado a partir do código entregue (casca do app, Painel, Canais, Webinars, Configurações, Plano e cobrança, Dados de cadastro, Administração, rodapé, o modal de canais, o modal de planos, o diálogo "Novo webinar", o site público: início, Entrar e Criar conta, e o console do estúdio, fase 1: barra, trilho de cenas, monitores, coluna da direita e bandeja). Onde o mock mockups/design-system.html e o código divergem, vale o código. Valores em hex: os do tema escuro, que é o padrão; a troca por tema está em Colors. -->

## Overview

**Creative North Star: "O Lançador"**

A casca do PwStreamer (tudo fora do estúdio) existe para levar o anfitrião ao ar. Cada tela tem uma ação, e o resto é estado. No Painel, essa ação é "Entrar no estúdio". A tela diz o que vem a seguir, para onde a live vai e o que falta consertar. Não mostra indicadores, cartões nem nada do que o produto sabe fazer sem que a tarefa do momento peça. É uma coluna estreita sobre uma rampa azul-marinho de 18 degraus, em Poppins e em quatro tamanhos. A estrutura é feita de linhas de 1px.

A cor é escassa de propósito. O azul da marca preenche só o botão da ação da tela, e o vermelho do tally pertence ao ar (e, como texto, às ações que apagam algo). Todo o resto, inclusive os estados "ligado", "selecionado" e "atual", sobe ou desce na rampa neutra. O estado é dito por ícone e palavra, e não por matiz. A rampa foi gerada com luminância casada contra o cinza neutro, e por isso o marinho não custa contraste.

O site público (início, Entrar e Criar conta) fala com a mesma voz. A ação da tela é "Criar conta", a única imagem é uma captura real do Painel, e o que ainda não está no ar é dito em "Em breve", em palavras, sem promessa.

A densidade é baixa na casca e alta no estúdio. O estúdio é outro escopo (`[data-surface="console"]`), escuro sempre, mesmo no tema claro, porque o operador se adapta à luminância do entorno do vídeo e ela não pode mudar no meio de uma live. As superfícies e as linhas dele vão num marinho próprio (`nv-*`), com a mesma luminância da rampa e mais azul, para o console ler como a sala escura do produto e não como grafite; o palco continua preto.

O estúdio é uma mesa de corte para montar e ensaiar o programa: as cenas à esquerda, o programa e o preview no centro, o chat e as ferramentas à direita e a bandeja embaixo. Escolher uma cena a leva ao preview; "Corte" ou "Fusão" leva o preview ao programa. O ar ainda não existe, e por isso o estúdio não tem cor nenhuma: nem ação colorida, nem vermelho. O relógio, a gravação e o relatório saíram até a transmissão existir, e a bandeja diz isso em palavras. O botão de ir ao ar voltou à barra só como "Entrar ao vivo" indisponível, sem cor, dizendo por que não age; é um desvio da Regra da Vitrine sem Balcão, contado em Fora do sistema.

**Key Characteristics:**
- Uma ação colorida por tela; o resto em tinta neutra.
- Vermelho = ar. Não entra em gráfico, em alerta, em erro de campo nem em decoração.
- Linhas de 1px (`--line`) separam seções e linhas de lista; sem cartões na casca.
- Poppins em `text-xs`, `text-sm`, `text-base` e `text-3xl`; mono tabular só para medidas.
- Estado por ícone + texto, sempre com o nome acessível completo.
- Três escopos de tema sobre a mesma rampa: escuro (padrão), claro e console, que troca as superfícies e as linhas pelo marinho de mesma luminância (`nv-*`).
- Um único momento de movimento por página. Na casca, o chip de um canal recém-conectado entra deslizando uma vez; no site público, o contorno desliza sobre a captura do Painel; no estúdio, o programa que sai some na fusão. Diálogos entram só pela primitiva `Modal`.
- No estúdio, o preview mostra exatamente o que o corte leva, e nada que não iria ao ar fica sobre a imagem.

## Colors

Uma rampa azul-marinho de luminância casada carrega quase tudo. Dois acentos cromáticos, cada um com um único lugar.

### Primary
- **Azul da Marca Profundo** (`brand-deep`): o preenchimento do botão primário (`.btn`). É a única área cromática da casca. Texto branco sobre ele. Há um botão primário por tela: "Entrar no estúdio" (tamanho `lg`) no Painel, "Conectar canal" em Canais, "Agendar webinar" em Webinars (e o envio do diálogo "Novo webinar", com o mesmo verbo) e, no modal de canais, o envio do formulário ("Conectar canal" ou "Salvar alterações"; "Ver planos" quando a plataforma está bloqueada pelo plano). Plano e cobrança e o modal de planos não têm botão primário enquanto a assinatura não abre, e por isso não têm cor nenhuma (ver a Regra da Vitrine sem Balcão). Dados de cadastro não tem cor em repouso: o primário "Salvar nome" só existe enquanto o nome está sendo editado. No site público, o primário é "Criar conta" (`lg`), no herói do início e no fecho da página; Entrar e Criar conta não têm cor, porque a ação delas é o botão do Google, fantasma (ver Buttons). O console do estúdio não tem primário nem cor: cortar e montar são operação, e a ação que teria cor, ir ao ar, ainda não existe.
- **Azul da Marca** (`brand`): a cor nominal da marca e a ponta inicial do gradiente do logo. Na casca, não é superfície de nada.
- **Azul da Marca Claro** (`brand-lift`): só o anel de foco (`:focus-visible`, 2px, afastado 2px). O foco precisa ser visível em qualquer superfície, e por isso é a exceção à regra da voz única.

### Secondary
- **Carmim do Tally** (`tally`): o sinal de "no ar". A moldura do programa no ar (`[data-air="on"] .pw-frame--pgm`, com as marcas de canto em `n-92`); hoje nada põe `data-air="on"`, e a moldura nunca acende. E o botão de perigo (`.btn--danger`, 5,02:1 com branco): o fundo do botão de confirmação em diálogos destrutivos (`useConfirm` com `destructive`) e, quando a transmissão existir, o de encerrar.
- **Carmim como texto** (`--sig-texto`: `tally-lift` sobre escuro e console, `tally-deep` sobre claro): itens de menu destrutivos ("Remover canal", "Excluir webinar").

### Tertiary
- **Gradiente da Marca** (`brand-grad-from` → `brand-grad-mid` → `brand-grad-to`): existe só dentro do logo (`PwStreamLogo`). As três paradas têm a mesma luminância (Y ≈ 22,9 %), e o gradiente é uma rotação pura de matiz. Não é usado como fundo, borda nem texto fora do logo. No console, o logo vai monocromático (`PwStreamLogo` com `monocromatico`): o mesmo desenho em `currentColor` (`--ink-hi`), sem gradiente, sem brilho e sem o círculo que pisca.

### Neutral
Os papéis semânticos trocam com o escopo; as primitivas `navy-*` e `nv-*` nunca. Use sempre o papel (`var(--ink)`), nunca a primitiva.

| Papel | Uso | Escuro (`:root`) | Claro | Console |
|---|---|---|---|---|
| `--well` | fundo de campo de formulário, poço | navy-3 | navy-89 | navy-0 |
| `--bg` | fundo da página e do cabeçalho | navy-6 | navy-96 | nv-3 |
| `--surface` | modal, trilha da barra de rolagem | navy-10 | navy-99 | nv-6 |
| `--panel` | esqueleto de carregamento, trilho do switch desligado, item de menu em hover, linha de lista mestre em hover, destino atual no menu móvel | navy-14 | navy-92 | nv-10 |
| `--raise` | hover de botão fantasma/ícone/chip, segmento ativo, linha escolhida da lista mestre, fundo do menu | navy-18 | navy-100 | nv-14 |
| `--line` | todas as linhas de estrutura (1px) | navy-22 | navy-80 | nv-18 |
| `--line-ctl` | borda de controle: chip, segmentado, botão fantasma, campo (abaixo de 3:1; ver a dívida conhecida) | navy-28 | navy-70 | nv-28 |
| `--ink-hi` | títulos, nomes, destino atual, switch ligado, caixa de seleção marcada, pendência, erro de campo (frase e borda) | navy-96 | navy-6 | navy-96 |
| `--ink` | corpo; a hora em mono | navy-89 | navy-18 | navy-89 |
| `--ink-lo` | texto secundário, descrições, dicas de campo, ação de texto em repouso, destinos não atuais | navy-80 | navy-28 | navy-70 |
| `--ink-dim` | placeholder; borda da caixa de seleção desmarcada (3:1 contra toda superfície, conferido pelo portão) | navy-70 | navy-36 | navy-58 |
| `--stage` | letterbox do vídeo; nunca clareia | navy-0 | navy-0 | navy-0 |
| `--guia` | as guias sobre a imagem do monitor, em `mix-blend-difference` | — | — | branco a 60 % |

**O marinho do console (`nv-3` a `nv-28`).** Seis primitivas só do console, em `index.css`. Cada degrau tem a luminância (Y) do degrau `navy-*` que substitui, a ±0,02 ponto, com matiz 264° em OKLCH e croma de 0,035 a 0,052; por isso toda razão de contraste do console continua a mesma. Elas vestem só as superfícies e as linhas (`--bg`, `--surface`, `--panel`, `--raise`, `--line`, `--line-ctl`) e a grade dos gráficos. A tinta continua na rampa neutra, e `--well` e `--stage` ficam no preto (`navy-0`): vídeo não se tinge. O anel dos monitores (`navy-14` e `navy-89`, direto em `.pw-frame`) também não muda.

Gráficos usam a rampa por **valor**, nunca por matiz (`--chart-1..5`, `--chart-grid`, `--chart-axis`). A separação sobrevive a protanopia, deuteranopia e escala de cinza. No console, a grade (`--chart-grid`) é `nv-10`; o eixo e as séries ficam na rampa neutra.

### Named Rules
**Regra da Voz Única.** Numa tela da casca, só o botão da ação da tela tem cor. Ligado, selecionado, atual e pronto são ditos pela rampa (`--ink-hi`, `--raise`), nunca pelo azul. Switch ligado e caixa marcada são tinta cheia; segmento ativo e linha escolhida sobem um degrau; destino atual ganha um traço de 2px em `--ink-hi`. No console, a Voz Única dá zero cor: não há ação da tela enquanto o ar não existe. A cena no preview, a tecla apertada, o controle ligado e a ferramenta aberta sobem na rampa.

**Regra do Ar.** O carmim é o sinal de "no ar". Fora do ar, aparece só onde algo é apagado ou encerrado. Não entra em pendência, em aviso, em erro de campo, em gráfico nem em ícone de marca. Uma pendência de canal ("sem chave") fica na tinta do nome, com ícone de alerta. No estúdio, o vermelho é só da moldura do programa no ar, que hoje nunca acende; o medidor de áudio perto do limite sobe para `--ink-hi`, não fica vermelho.

**Regra da Vitrine sem Balcão.** Uma tela que mostra algo que ainda não se pode fazer (hoje: assinar um plano) não tem ação primária e, portanto, não tem cor. Nada de botão desabilitado, selo "em breve" ou checkout de mentira: o "em breve" é uma frase em palavras simples, em `text-sm` `--ink-lo`, junto do que ainda não abre ("A assinatura abre em breve, por aqui mesmo. Hoje nenhuma cobrança é feita."). O plano atual é dito em palavra ("· seu plano"), não por destaque, e um diálogo assim fecha com "Fechar" fantasma.

**Regra do Erro em Tinta Alta.** O que precisa de atenção (pendência, erro de campo, texto não salvo, falha ao salvar) sobe para `--ink-hi` e ganha um ícone; o que está em ordem fica em `--ink-lo`. A diferença é de degrau na rampa, nunca de matiz.

**Regra da Marca Monocromática.** Ícones de plataforma (YouTube, Twitch…) ficam em `currentColor`, traço 1,75, nunca nas cores do dono da marca. Vêm do Lucide; onde o Lucide não tem a marca, o ícone é desenhado no mesmo traço (o K do Kick). A exceção é o G do botão de entrar com Google, nas quatro cores do Google: ali ele não é ícone de plataforma, é a marca de um login de terceiros, e as regras de marca do Google pedem o G colorido.

## Typography

**Display Font:** Poppins (com system-ui, -apple-system, Segoe UI)
**Body Font:** Poppins
**Label/Mono Font:** a pilha mono padrão do Tailwind (`font-mono`: ui-monospace, SFMono-Regular, Menlo…) com `tabular-nums`

**Character:** Uma geométrica só, em quatro tamanhos e três pesos, com o contraste feito por tamanho e tinta, não por cor. O mono é a voz das medidas: aparece onde há um número que se lê como instrumento.

### Hierarchy
- **Display** (600, `text-3xl`, tracking-tight): uma por tela. É o `h1` das páginas (`CabecalhoDePagina`) e, no Painel, o título da próxima live, com `text-balance`. No site, o `h1` do início (com `text-balance`), de Entrar e de Criar conta.
- **Title** (600, `text-base`): título de seção (`h2` de `SecaoDePagina`, "Canais", "Próximas lives"), título de diálogo e o cabeçalho do painel de detalhe (ícone + nome da plataforma). No site, os `h2` do início ("Já funciona", "Em breve", "Planos", "Comece pelo teste grátis").
- **Abertura** (400, `text-base`, `--ink-lo`, `max-w-prose`): a frase logo abaixo do `h1` do início. É o mesmo degrau do Title, com peso e tinta de corpo.
- **Body** (400 ou 500, `text-sm`): descrições (`max-w-prose`), nomes em linhas de lista (500), rótulos de campo (500, em `--ink-hi`), rótulos de botão e de chip, ações de texto, os itens de um plano aberto (em `--ink`).
- **Label** (400, `text-xs`): a linha de metadados abaixo de um nome (plataforma · estado, horário · canais), a palavra de estado na lista mestre, a linha de origem de um registro ("É o e-mail com que você entra."), dicas e erros de campo, rodapé e aviso de teste no cabeçalho.
- **Button** (600, 14px; `lg` 16px; `sm` 12px): definido em `.btn`, e os três caem sobre os degraus `sm`/`base`/`xs` da escala.
- **Measure** (mono, tabular, na tinta `--ink`): só a hora dentro do rótulo do horário (`Horario` isola `20:00` e deixa "Hoje, às" ou "Domingo, 27 de setembro, às" na fonte do texto). Ver a Regra do Horário Derivado. No estúdio, também a leitura do medidor ("−25 dB"), a duração dentro das teclas de transição ("0 ms", "400 ms") e a hora das mensagens do chat, em `text-xs` `--ink-lo`, e a leitura do card da câmera durante o ajuste ("X 71% · Y 64%", "120%"), em `--ink`.
- **Preço** (Poppins, `text-sm` 500, `tabular-nums`, `--ink-hi`; o total do ano abaixo em `text-xs` `--ink-lo`, também tabular): preço não é instrumento, então fica na fonte do texto, mas em algarismos tabulares para as linhas se lerem em coluna. Sempre por `formatPrice` (BRL, "R$ 39,90").

### Named Rules
**Regra dos Quatro Tamanhos.** A casca usa `text-xs`, `text-sm`, `text-base` e `text-3xl`, e nada mais. Tamanho em px avulso (`text-[13px]`) é dívida contada pela catraca (`tamanho-de-fonte-avulso`).

**Regra do Mono como Medida.** Mono aparece só em medidas (a hora; no estúdio, a leitura em dB do medidor, a duração das transições, a hora do chat e a leitura de posição e tamanho do card da câmera), sempre com `tabular-nums`. Não há bitrate nem contador de rede: sem transmissão, esses números não existem. Nunca como rótulo, sobretítulo ou enfeite. Dinheiro não é medida: preço fica em Poppins com `tabular-nums`.

**Regra do Número Colado.** Entre um número e sua unidade vai um espaço inseparável (U+00A0: "3 horas", "30 dias"), e o último par de palavras de um limite ou de uma frase também ("ao vivo", "no ar"), para que nenhuma linha estreita quebre em "30 | dias" nem deixe uma palavra sozinha. As frases de várias linhas em `text-xs` e `text-sm` que vão a colunas estreitas (erro e dica de campo, linha de origem, linha de falha ao salvar) levam `text-pretty`, que faz o mesmo pela última linha do parágrafo; os dois se somam, um não substitui o outro.

**Regra da Caixa Normal.** Rótulos, links e ações ficam em caixa normal de frase. Caixa alta com espaçamento largo não é voz do sistema.

## Layout

Uma coluna central para todas as páginas da casca (`Pagina`): `max-w-3xl` (768px), centralizada, respiro lateral de 16px (24px a partir de `sm`), topo de 48px (64px a partir de `sm`) e base de 96px. O Painel usa o mesmo esqueleto. O cabeçalho e o rodapé são mais largos (`max-w-6xl`), então a coluna fica recuada em relação à barra.

O ritmo vertical é fixo:
- Cabeçalho de página: título, descrição a 8px e, à direita, a ação da página (empilha abaixo de `sm`).
- Ação da tela: 32px abaixo do título da live.
- Seções: 48px de distância, abertas por uma linha de 1px e 24px de respiro até o título.
- Linhas de lista: 16px de padding vertical, separadas por `divide-y` em `--line`. Listas de página inteira são fechadas por linha em cima e embaixo (`border-y`).
- Ações de texto de um cabeçalho de seção ficam lado a lado, a 20px, alinhadas à linha de base do título.
- Um controle de seção (`acao` de `SecaoDePagina`, ex.: Mensal/Anual, a busca da Administração) fica à direita do título, centrado na linha dele, a pelo menos 16px; em tela estreita desce para baixo do título, a 12px. O conteúdo da seção começa 16px abaixo.
- Uma contagem de seção (`contagem` de `SecaoDePagina`, ex.: "12 cadastrados") vai 8px ao lado do título, em `text-sm` 400 `--ink-lo`, como a contagem dos canais no Painel.
- Chips quebram em linhas com 8px de intervalo.
- Formulários: rótulo, campo a 8px, dica ou erro a 8px abaixo do campo; 20px entre campos; 24px entre a frase de orientação e o primeiro campo.
- Registro (`dl` de dados da conta): 48px abaixo do cabeçalho da página; em cada linha, o valor 4px abaixo do rótulo e a linha de origem a 8px; a ação de texto à direita, a pelo menos 16px. Editando: a linha de falha 16px abaixo da dica, e as ações do formulário 20px abaixo.

**Mestre-detalhe (diálogo `xl`, 896px).** A partir de `md`, duas colunas: a lista a 15rem (240px), com 16px de respiro e uma linha de 1px à direita, e o detalhe no resto, a 24px da linha. O título do detalhe desce 8px para ficar na linha do nome da primeira plataforma. Abaixo de `md`, vira dois passos no mesmo diálogo: a lista (cada linha com um chevron à direita) e, ao escolher, o formulário, com "‹ Plataformas" como ação de texto no topo para voltar. Quem abre o diálogo já num canal cai direto no formulário.

**Diálogo `md` (448px).** Um formulário curto numa coluna: campos a 20px uns dos outros, dois campos curtos lado a lado numa grade de duas colunas a 12px (Data e Hora, também no celular) e uma grade de opções em duas colunas em qualquer largura (12px entre colunas, 16px a partir de `sm`). O corpo rola; o rodapé do `Modal` (linha em cima) não. É o "Novo webinar".

**Diálogo `lg` (672px).** Uma coluna só: a frase de orientação e o controle da lista lado a lado (empilham quando não cabem), a lista 16px abaixo e o rodapé do `Modal`, cuja linha fecha a lista (`semLinhaFinal`). É o modal de planos.

As ações de um formulário ficam no fim dele, alinhadas à direita a partir de `sm` (Cancelar e depois o primário, a 12px). No celular empilham na largura toda, com o primário em cima. Num diálogo, as ações ficam no rodapé do `Modal`, e a linha de falha ao salvar vai no rodapé também, 12px acima delas, fora do corpo que rola: no celular ela fica à vista sem rolar. A exceção é o mestre-detalhe (modal de canais): as ações moram no fim do formulário da plataforma, e a linha de falha fica 12px acima delas, junto do rascunho. Numa lista de página (Canais), a linha de falha fica sob o item, 12px abaixo, recuada até a coluna do nome.

Responsivo: abaixo de `md` (768px) a navegação principal vira um botão de menu (44px) que abre uma lista vertical sob o cabeçalho, com alvos de 44px. O atalho "Estúdio" some abaixo de `sm`; o aviso de teste aparece só a partir de `lg` no cabeçalho e dentro do menu móvel abaixo disso. O botão "Entrar no estúdio" ocupa a largura toda no celular e tem no mínimo 256px a partir de `sm`. A calha da barra de rolagem é reservada (`scrollbar-gutter: stable`) para a casca não pular entre telas que rolam e que não rolam.

**Site público.** Outra largura e o mesmo ritmo de linhas. Tudo fica numa coluna `max-w-6xl` (1152px), a mesma do cabeçalho e do rodapé, com respiro lateral de 16px (24px a partir de `sm`) e base de 96px.
- **Herói:** grade de 12 colunas a partir de `lg`, 5 de texto e 7 da captura, centradas na vertical, a 48px (40px empilhadas); topo de 48px (64px a partir de `sm`). O `h1`, a abertura a 16px, a frase do acesso antecipado a 16px, e a 32px o primário com a frase "30 dias grátis, sem cartão." ao lado (a 20px; quebra para baixo, a 12px). "Já tem conta? Entrar" fica 16px abaixo. Abaixo de `lg`, a captura vem depois do texto.
- **Seções:** 64px entre elas, cada uma aberta por uma linha de 1px e 24px de respiro até o título.
- **"Já funciona" / "Em breve":** duas colunas a partir de `md`, a 48px, cada uma com o seu título e uma lista `divide-y` (itens de 16px de padding, ícone de 16px a 12px do texto, título `text-sm` 500 e a frase a 4px). Empilhadas, a segunda abre com a própria linha, 40px abaixo.
- **Planos:** 4 + 8 colunas a partir de `lg`, a 48px: à esquerda o título, a frase da Vitrine sem Balcão e o `SeletorDePeriodo`; à direita a `ListaDePlanos` com `semLinhaInicial` e subida 16px (`-mt-4`), para o nome do primeiro plano ficar na altura do título e a linha da seção não dobrar. Abaixo de `lg`, a lista desce 24px abaixo do seletor e ganha a linha de cima de volta.
- **Fecho:** em linha a partir de `sm`, o título e a frase à esquerda e o primário à direita; no celular empilham a 24px.
- **Telas de conta (Entrar, Criar conta):** uma coluna `max-w-sm` (384px) centralizada, topo de 48px (64px a partir de `sm`). O `h1`, a frase a 8px, a linha de falha a 24px, o botão do Google a 32px e, a 32px, "Já tem conta? Entrar" (ou "Ainda não tem conta? Criar conta") como ação de texto sublinhada.

**Console do estúdio.** A tela inteira, sem rolar a página (`h-[100dvh]`), no escopo console: a barra de 48px em cima, a bandeja embaixo e, entre elas, a partir de `lg`, uma grade de três colunas (`lg:grid-cols-[var(--col-cenas)_minmax(0,1fr)_var(--col-painel)]`). À esquerda, o trilho de cenas (224px por padrão, em `--surface`, linha à direita); no centro, a mesa de monitores (em `--bg`, 12px de respiro, 16px a partir de `sm`); à direita, a coluna do chat e das ferramentas (368px por padrão, em `--surface`, linha à esquerda). Cada coluna rola sozinha. Abaixo de `lg`, vira uma coluna que rola, na ordem monitores, cenas e coluna da direita (com 576px de altura, `h-[36rem]`, e linha em cima); a barra e a bandeja ficam fixas, fora da rolagem, e a bandeja cabe numa linha só com os ícones.

**Colunas ajustáveis (só a partir de `lg`).** As duas colunas laterais mudam de largura e recolhem, para os monitores ganharem o espaço que a live pede. Os limites estão em `COLUNAS` (`Estudio.tsx`): cenas de 192 a 320px (padrão 224), painel de 304 a 520px (padrão 368). O máximo também é limitado pela janela (`tetoNaJanela`, 0,22 nas cenas e 0,36 no painel, que a grade aplica como `min(largura, 22vw)` e `min(largura, 36vw)`), para os monitores nunca ficarem sem espaço. Recolhidas, as cenas ficam com 88px (`5.5rem`) e o painel só com o trilho de 72px (`4.5rem`). Larguras e recolhimento são uma preferência deste navegador (`pw_colunas_do_estudio`), conferida ao ler: um valor fora dos limites volta para dentro deles. Abaixo de `lg` nada disso existe: o divisor e os botões de recolher somem.

Camadas de empilhamento em quatro degraus nomeados: `--z-sticky` 20, `--z-dropdown` 40, `--z-scrim` 60, `--z-modal` 70, `--z-toast` 80.

## Elevation & Depth

A casca é plana. A profundidade vem da rampa: página em `--bg`, superfícies flutuantes em `--raise` ou `--surface`, e a separação em repouso é sempre uma linha de 1px, nunca uma sombra nem um cartão com fundo. A sombra existe só no que flutua sobre a página e some quando ela fecha. Dentro de um diálogo vale a mesma regra: as colunas do mestre-detalhe são separadas por uma linha, e a linha escolhida sobe para `--raise` sem sombra.

### Shadow Vocabulary
- **Menu ancorado** (`box-shadow: 0 8px 24px -8px rgb(0 0 0 / 0.45)`): o popover do `Menu` (ações "⋯" e conta).
- **Diálogo e aviso** (`shadow-2xl` do Tailwind: `0 25px 50px -12px rgb(0 0 0 / 0.25)`): `Modal`, `ConfirmDialog` e `Toast`.
- **Véu do contorno** (`0 0 0 100vmax rgb(0 0 0 / 0.55)`, recortado pela moldura da captura): não é profundidade. É o escurecimento em volta do contorno na captura do Painel, e só existe enquanto o mouse aponta um item; em repouso fica a 0 % de opacidade.

### Named Rules
**Regra da Linha, Não do Cartão.** Estrutura é uma linha de 1px em `--line`. Seção, lista e rodapé são separados por borda; nenhum bloco da casca tem fundo próprio para se destacar. Se parece precisar de um cartão, precisa de uma seção.

**Regra do Chão Plano.** Nada em repouso na página tem sombra. Sombra só em camada que flutua (menu, diálogo, aviso). O console segue a mesma regra: a barra, as colunas, a mesa e a bandeja se separam por linhas de 1px, e o único flutuante é o menu dos aparelhos.

## Shapes

Cantos generosos e consistentes, e uma geometria que distingue controle de estrutura. Os controles são arredondados (botão 16px, botão denso 10px, botão de ícone 16px, campo de formulário 16px, linha da lista mestre 16px, menu 16px com itens de 12px, segmentado 16px por fora e 10px por dentro, modal 20px). Chips e switches são pílulas completas. A caixa de seleção é a única exceção abaixo da escala: 20px com 5px de raio, porque os raios nomeados (8px para cima) a fariam ler como botão de rádio. A estrutura (linhas, seções, a divisória do mestre-detalhe) é reta e sem raio. O anel de foco tem 4px de raio.

A borda sólida é o padrão de todo controle com contorno (`--line-ctl`). O tracejado é reservado para "adicionar": uma pendência nunca pode parecer uma vaga vazia. O ícone de plataforma na página de Canais fica numa moldura quadrada de 40px, com 16px de raio e borda em `--line`. A captura do Painel fica numa moldura de 16px de raio com borda `--line`, e o contorno dentro dela tem 12px.

No console, o que mostra imagem ou medida é reto, como numa mesa: os monitores (a moldura `.pw-frame` com `--pw-frame-radius: 0px`), a caixa do próximo corte e o trilho do medidor não têm raio. Os controles do console seguem a escala: a linha de cena, a tecla de transição, o controle da bandeja e a aba de ferramenta têm 16px.

## Components

### Buttons
Firmes e sem enfeite. A aparência mora na classe `.btn` do `index.css` (em `@layer base`), e o `<Button>` só escolhe variante e tamanho. Assim, um `<button>` ainda não migrado adota o sistema acrescentando `className="btn"`.
- **Shape:** cantos generosos (16px); o `sm` usa 10px.
- **Primary:** preenchimento em `brand-deep` com texto branco, 9px × 18px, 14px/600, ícone a 8px do rótulo. Uma ação primária por tela, e nunca dois primários no mesmo viewport. O rótulo é o verbo do que ele faz ao objeto à vista ("Conectar canal" para um canal novo, "Salvar alterações" para um existente), e não o título do diálogo. A exceção medida é o início do site: "Criar conta" aparece no herói e no fecho da página. É a mesma ação, e os dois nunca aparecem no mesmo viewport.
- **Large (`lg`):** 13px × 24px, 16px. Reservado à ação da tela, com seta à direita: "Entrar no estúdio" no Painel e "Criar conta" no início do site.
- **Hover / Focus / Active:** só `filter` anima: `brightness(1.1)` no hover e `0.93` no pressionado, 110ms linear. O foco é o anel global em `brand-lift`. Desabilitado fica a 45 % de opacidade. `loading` desabilita **e** marca `aria-busy`, trocando o ícone por um spinner.
- **Indisponível, mas focável (`aria-disabled="true"`):** a mesma aparência do desabilitado (45 %, `cursor: not-allowed`, sem `filter`), e nem o hover nem o aperto reagem; o fantasma também não sobe para `--raise`. É o botão que existe para dizer por que não age: fica no Tab, o motivo vai num `aria-describedby`, e o clique o repete. `disabled` o tiraria do Tab, e quem usa teclado não ouviria o motivo. Hoje só o "Entrar ao vivo" do estúdio o usa (ver Console do estúdio e a dívida conhecida).
- **Ghost (secundário):** transparente, texto `--ink`, borda `--line-ctl`, hover em `--raise`. Usado em "Entrar" nas linhas de webinar (`sm`), no atalho "Estúdio" do cabeçalho, em "Cancelar" nos diálogos e em "Criar conta" no cabeçalho público, onde a cor é da ação da tela. No estúdio, toda ação é fantasma (`sm` na barra e nos painéis).
- **Botão do Google:** fantasma, na largura toda da coluna, com alvo de 44px (`min-h-11`) e o G nas cores do Google (16px) antes do rótulo: "Entrar com Google" em Entrar e "Criar conta com Google" em Criar conta. É a ação dessas telas, e não tem cor (ver a Regra da Marca Monocromática). O clique leva a página ao Google (`loginWithGoogle`, o redirecionamento do Supabase, sem janela por cima), e o botão fica em `loading` até a página sair. Antes de sair, confere se o login com Google está ligado no projeto; se não está, fica e diz. As falhas vão numa linha `role="alert"` acima do botão: `CircleAlert` (16px) e uma frase em `text-sm` `--ink-hi` com `text-pretty`, a mesma da falha ao salvar, tirada de `FRASE_DA_FALHA_AO_ENTRAR` pelo motivo (`FalhaAoEntrar`): "O login com Google ainda não está ligado neste ambiente.", "Sem conexão agora. Confira a internet e tente de novo." ou "Não deu para entrar. Tente de novo." A volta do Google sem sessão (`?error=` ou `#error=` no endereço) abre Entrar com "Não deu para entrar com o Google. Tente de novo." e limpa o endereço. O formulário de e-mail e senha, só em desenvolvimento, diz as falhas pelo mesmo mapa.
- **Danger:** preenchimento carmim, para confirmar exclusões e, quando a transmissão existir, encerrá-la.
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
A casca não tem cartões. Os contêineres são a coluna (`Pagina`), a seção aberta por uma linha (`SecaoDePagina`, com uma `contagem` opcional ao lado do título e um controle opcional `acao` à direita dele) e a lista com `divide-y`. Só os diálogos e avisos flutuantes têm fundo, borda e sombra (ver Elevation & Depth).

### Inputs / Fields
- **Style:** campos nativos seguem os tokens globalmente: fundo `--well`, texto `--ink-hi`, borda `--line-ctl`, placeholder `--ink-dim`. Na casca redesenhada, o campo de uma linha tem 44px de altura (`h-11`), 16px de raio, 12px de respiro lateral e texto `text-sm`. O rótulo fica acima, em `text-sm` 500 `--ink-hi`, ligado por `htmlFor`; uma ação de texto `xs` pode ficar na mesma linha, à direita ("Mostrar chave").
- **Dica:** uma frase em `text-xs` `--ink-lo`, 8px abaixo do campo, ligada por `aria-describedby`.
- **Focus:** o anel global de 2px em `brand-lift`, com afastamento de 2px.
- **Error (`ErroDeCampo`):** a primitiva única do erro de campo, usada no modal de canais, em Dados de cadastro e no "Novo webinar"; nenhuma tela desenha o seu. O ícone `CircleAlert` (14px) e uma frase em `text-xs` `--ink-hi` com `text-pretty`, 8px abaixo do campo, no lugar da dica. O campo recebe `aria-invalid="true"` e `aria-describedby` apontando para a frase, e a regra global do `index.css` (`input`, `textarea` e `select` com `aria-invalid="true"`) sobe a borda para `--ink-hi`. Nunca carmim. A frase diz o que falta e como resolver ("Falta o servidor. O padrão da plataforma é …"). Ao enviar com erro, o foco vai ao primeiro campo inválido; digitar no campo limpa o erro dele.
- **Falha ao salvar:** quando o campo passou mas o salvamento não, uma linha `role="alert"` acima das ações: `CircleAlert` (16px) e uma frase em `text-sm` `--ink-hi` com `text-pretty`. Nunca carmim. A frase diz o que aconteceu e a saída, e pode terminar com **uma** `AcaoDeTexto` sublinhada que executa a saída que ela nomeia ("Sua sessão expirou, então o nome não foi salvo. Entrar de novo"). Um novo envio apaga a linha da tentativa anterior. Num diálogo, a linha fica no rodapé, logo acima das ações; no modal de canais, logo acima das ações do detalhe (ver Layout). Depois da falha, o foco vai à saída: "Entrar de novo" quando a sessão expirou, senão de volta ao primário. Numa linha de lista (Canais), a falha fica sob o item e termina com "Tentar de novo" ou "Entrar de novo"; ali o foco fica onde está, e a linha é anunciada pelo `role="alert"` (ver O Salvo de Verdade nos canais).
- **Endereço longo (servidor RTMP):** um `textarea` de uma linha que cresce com o conteúdo (`rows=1`, sem redimensionar, sem rolagem, quebra em qualquer caractere), com a mesma altura mínima de 44px. É um valor só: Enter envia o formulário e quebras de linha coladas são removidas. Assim o endereço inteiro fica à vista a 375px, onde a pessoa precisa conferi-lo.
- **Caixa de seleção (`CaixaDeSelecao`):** a primitiva única de marcar, já dentro da linha rotulada: o `<label>` inteiro (no mínimo 44px, `min-h-11`, caixa a 12px do texto) é o alvo e o nome acessível. A caixa tem 20px e 5px de raio. Desmarcada, é borda `--ink-dim` sobre `--well`; marcada, preenchimento e borda em `--ink-hi` com o ✓ (`Check` 14px, traço 3) em `--bg`. A cor muda em 150ms. Foco: o anel global. Desabilitada, 45 %. Nunca o azul da marca: marcar é estado.
- **Switch:** trilho de 40 × 24px. Ligado é tinta cheia (`--ink-hi`) com botão em `--bg`; desligado é `--panel` com borda `--line-ctl` e botão em `--ink-lo`. Estado em `aria-checked` e na posição, nunca só na cor. O nome diz o que liga ("Transmitir para YouTube Principal"). **Ocupado** (`ocupado`), enquanto a mudança grava: fica onde estava até a confirmação, a 45 %, com `aria-busy` e `aria-disabled` (e não `disabled`, que tiraria o foco de quem usa o teclado), e ignora o clique.
- **Segmentado:** grupo de poucas opções exclusivas (`role="group"` com nome), borda `--line-ctl`, 16px por fora e 10px por dentro, opções em `text-sm` a 6px × 12px. A opção ativa sobe para `--raise` e `--ink-hi`, com `aria-pressed`; as outras ficam em `--ink-lo`. Usos: tema (Configurações) e período de cobrança (`SeletorDePeriodo`: "Mensal" e "Anual, 20% menos", onde o rótulo diz a vantagem em palavras em vez de um selo de desconto). Dois estados de espera: `desativado` é o `disabled` de verdade (nenhuma opção responde, sai do Tab); `ocupado`, enquanto uma escolha é aplicada, deixa as opções a 45 % com `cursor: progress`, ignora o clique e marca `aria-busy` no grupo e `aria-disabled` nas opções, que continuam focáveis, como o Switch ocupado. Com `disabled`, a opção apertada pelo teclado perdia o foco para o `<body>`.
- **Disabled:** 45 % de opacidade.

### Navigation
Barra fixa de 56px em `--bg`, com linha de 1px embaixo: o logo (leva ao Painel), quatro destinos (Painel, Canais, Webinars, Configurações), um aviso discreto de teste grátis, o atalho fantasma "Estúdio" (oculto no Painel, onde entrar no estúdio já é a ação da tela) e o avatar de 32px que abre o menu da conta. Os destinos ficam em `text-sm`: os não atuais em `--ink-lo` e o atual em `--ink-hi` com traço de 2px na base e `aria-current="page"`. No celular, a navegação vira o botão de menu descrito em Layout. O rodapé repete a lógica: linha em cima, "© PW Stream Online" e duas ações de texto `xs`.
- **Plano e cobrança** não é destino da barra: entra-se pelo menu da conta ("Plano e cobrança") e pelo aviso de teste.
- **Cabeçalho público:** a mesma barra de 56px em `--bg`, com linha de 1px embaixo, sticky em `--z-sticky` e na coluna `max-w-6xl`. O logo (28px, `aria-label` "PwStreamer, início") leva ao início. À direita, a 20px uma da outra: "Planos" e "Entrar" como ações de texto (`text-sm`, alvo de 44px) e "Criar conta" fantasma. "Planos" rola até a seção de planos do início e põe o foco no título dela. Não há menu de celular: a barra cabe inteira a 375px, e "Planos" some abaixo de `sm`, onde a seção fica logo ali, rolando. A ação da tela aberta sai do cabeçalho: em Entrar some "Entrar", em Criar conta some "Criar conta". Trocar de tela leva ao topo e põe o foco no `h1` da nova tela. O rodapé é o mesmo do app.
- **"Ver planos"** passa sempre por `abrirPlanos`: fora do estúdio leva à página Plano e cobrança; dentro do estúdio abre o modal de planos por cima do palco, para ninguém sair da câmera nem de uma live em andamento. Nenhuma tela decide sozinha para onde "Ver planos" vai.

### Linha de ação (`LinhaDeAcao`)
É a unidade de Configurações: título (`text-sm` 500), uma frase do que há ali (`text-xs` `--ink-lo`) e o indicador de destino. `avancar` mostra um chevron à direita que se desloca 2px no hover. `expandir` mostra um chevron para baixo que gira 180° e abre o conteúdo logo abaixo, com `aria-expanded` e `aria-controls`. `lateral` (opcional) põe um valor curto à direita, alinhado à direita e antes do indicador (o preço de um plano); o título e a frase encolhem, o valor não.

### Registro (dados da conta)
Uma lista do que a conta é, não um formulário a preencher. É a página Dados de cadastro: um `dl` de página inteira, fechado por linha em cima e embaixo (`border-y`) e com `divide-y` em `--line`.
- **Linha:** rótulo (`dt`, `text-sm` 500 `--ink-hi`) sobre o valor (`dd`, `text-sm` `--ink`, quebrando palavras longas como um e-mail); sem valor, "Sem nome" em `--ink-lo`. Opcionalmente, uma linha de origem (`text-xs` `--ink-lo`) que diz de onde o valor vem. No máximo **uma** ação de texto à direita ("Editar", com o objeto em `sr-only`), num `dd` próprio, com alvo de 44px pela margem negativa.
- **Só leitura:** um valor que vem de outro sistema (o e-mail vem do login) não tem ação; a linha de origem diz de onde ele vem.
- **Editar no lugar:** a linha editável vira o próprio campo. O rótulo fica onde estava e passa a ser o `<label>`; o valor vira o campo de 44px; a dica embaixo; depois as ações do formulário (Cancelar fantasma e o primário com verbo e objeto, "Salvar nome"), à direita a partir de `sm` e empilhadas na largura toda no celular, com o primário em cima. Abrir põe o foco no campo com o cursor no fim; fechar (Salvar, Cancelar ou Esc) devolve o foco a "Editar". Salvar sem mudança só fecha.
- **Cor e movimento:** nenhuma cor em repouso; o azul aparece só no primário, durante a edição. Nenhum movimento: a troca de linha para campo é instantânea, e a entrada do chip continua sendo a única entrada da casca.

**Regra do Salvo de Verdade.** Uma tela só diz "salvo" (o aviso "Nome salvo") depois de o banco confirmar a escrita. Cada falha tem a sua frase com a saída: sem conexão, "tente de novo mais tarde"; sem confirmação em 10 s, "não deu para confirmar"; sessão expirada, "Entrar de novo"; recusa, "tente de novo". A restauração da sessão é esperada (`esperarSessao`) antes de se declarar uma sessão expirada. Nada de espera de enfeite nem de "salvo" local que o banco não viu. A regra tem uma implementação só, `gravarComConfirmacao` em `src/lib/dadosDaConta.ts`: o Supabase só responde depois de gravar, e a resposta é a confirmação; a espera de 10 s cobre a resposta que não chega. Falha com `ErroAoSalvar` (motivo `FalhaAoSalvar`): `sem-login` (sem sessão, a conta desta aba trocada por outra, ou o token recusado pela API, `PGRST301`/`PGRST303`), `sem-conexao` (aparelho offline ou falha de rede), `sem-confirmacao` (a espera acabou) e `recusado` (o resto, inclusive a troca de nome em que a RLS não atualizou linha nenhuma). `salvarNomeDoPerfil`, `agendarWebinar`, `excluirWebinar`, `salvarRoteiro`, `gravarLista` (banners e tickers do estúdio) e `salvarTransmissao` (com `salvarCanais`) passam por ela, e toda gravação nova também passa. Os canais também esperam, uma mudança de cada vez (ver O Salvo de Verdade nos canais, logo abaixo). Enquanto o banco não respondeu às configurações da conta, mudar os canais é bloqueado com o aviso "Seus canais ainda estão carregando". Excluir um webinar tira a linha na hora; se o banco não confirmar, ela volta à lista e um `toast.error` "O webinar não foi excluído" diz o motivo (`FRASE_DA_EXCLUSAO`, em `App.tsx`). Nas listas e no roteiro, que salvam sem diálogo, a regra vale como está em O Salvo de Verdade nas listas (Painéis do estúdio). Enquanto grava, o primário fica em `loading`, Cancelar desabilita e o diálogo não fecha (`ocupado` do `Modal`: o X desabilita, e Esc e o clique no fundo esperam); o rascunho só se apaga depois da confirmação. Uma nova tentativa de criar algo reusa o id do rascunho, e uma escrita atrasada é repetida, nunca duplicada.

**O Salvo de Verdade nos canais.** Conectar, editar, ligar, desligar e remover um canal esperam o banco, como o "Novo webinar". Antes o canal mudava na hora, o modal dizia "… conectado" e fechava, e a falha chegava depois, num aviso "Os canais não foram salvos".
- **Uma mudança de cada vez:** `mudarCanais` (`App.tsx`) põe as mudanças numa fila. Cada uma parte da lista que a conta tem (a última confirmada, ou a que chegou pelo tempo real) e grava a lista inteira por `salvarCanais`: duas gravações ao mesmo tempo, cada uma com a sua lista, apagariam uma a outra. O canal só muda na tela depois da confirmação. Ligar confere o limite do plano no clique e de novo na vez da mudança ("{nome} continua desligado").
- **Um escritor só:** o salvamento automático do `App` grava só a cor dos gráficos. Gravava também a lista dos canais, sem esperar e calado na falha, e desfazia por trás a mudança já confirmada por outra aba.
- **Modal de canais:** o diálogo espera a gravação e, na falha, fica aberto com o rascunho (ver Salvar, no Mestre-detalhe).
- **Página Canais:** enquanto grava, a linha diz "Salvando…" (ligar ou desligar) ou "Removendo…" no lugar do estado, em `--ink-lo`, e o interruptor fica ocupado (ver Switch); a linha removida só sai depois da confirmação. Até lá o foco fica no "⋯" dela, e depois vai ao da vizinha (ver Foco, em Menu). Outro canal pode mudar ao mesmo tempo: entra na fila e diz "Salvando…" também.
- **Falha na página:** nada muda, e uma linha `role="alert"` sob o canal, 12px abaixo e recuada até a coluna do nome (56px), diz o que não mudou, por quê e a saída: "Sem conexão com a sua conta agora, então YouTube não foi ligado." ("desligado", "removido"), "Não deu para confirmar se YouTube foi desligado. Confira a conexão.", "O banco recusou a mudança, então YouTube não foi removido." e "Sua sessão expirou, então YouTube não foi ligado." Termina com "Tentar de novo", que refaz a mesma mudança sem perguntar de novo, ou, na sessão expirada, "Entrar de novo". O foco fica onde está: no interruptor, que não o perde, ou no "⋯", aonde a confirmação de "Remover canal" o devolveu. "Tentar de novo" é a própria ação de texto que some quando a linha volta a gravar; antes de refazer a mudança, o foco vai ao interruptor (ligar/desligar) ou ao "⋯" (remover), para não cair no `<body>` junto com ela. A linha sai com uma nova tentativa ou quando o canal chega ao que se pediu (por outra aba, ou pela gravação que chegou depois da espera), e continua à vista ao ir a outra tela e voltar: a situação de cada canal mora no `App`.

**Regra do Dado com Uso.** Um registro só pede o que algo no app já usa. Campo guardado "para depois" não entra; volta junto com o que o usa.

### Lista de planos (`ListaDePlanos`)
A mesma lista na página Plano e cobrança, no modal de planos do estúdio e na seção Planos do início do site; não existe outra tabela de preços no app nem no site.
- **Linha:** uma `LinhaDeAcao` `expandir` por plano, na ordem de `PLANS`. Título: o nome do plano, e no plano atual o nome seguido de "· seu plano" (em palavra, sem cor, sem borda, sem selo). Frase: os limites, separados por " · ": canais ao mesmo tempo e pessoas na tela em todos os planos, e as horas de transmissão ao vivo só nos pagos. O gratuito não tem limite de tempo na frase.
- **Preço (`lateral`):** o preço por mês do período escolhido, e no Anual o total do ano embaixo ("R$ 478,80 por ano"). Ver Preço em Typography.
- **Aberta:** a lista completa do plano (`features`), um item por linha com ✓ (`Check` 14px, `--ink-lo`) e o texto em `text-sm` `--ink`, 8px entre itens e 20px antes da próxima linha. Uma linha aberta por vez.
- **Período:** o `SeletorDePeriodo` fica fora da lista (na `acao` da seção, ou ao lado da frase no diálogo) e reescreve os preços de todas as linhas.
- **Bordas:** linha em cima e embaixo na página. `semLinhaFinal` dentro de um diálogo, onde o rodapé já traz a linha de baixo. `semLinhaInicial`, o espelho, quando a linha de cima já existe fora da lista: no início do site, a partir de `lg`, a lista fica ao lado do título, logo abaixo da linha da seção.
- **Sem ação de compra na linha** enquanto a assinatura não abre (Regra da Vitrine sem Balcão). Quando abrir, o sistema ganha um botão primário por tela, não um por linha.

### Menu (`Menu`)
Ações secundárias atrás de um "⋯", para que cada linha de lista tenha **uma** ação visível. Segue o padrão WAI-ARIA Menu Button: setas, Home/End, Esc devolve o foco ao gatilho e clicar fora fecha. O popover fica em `--raise`, com borda `--line`, cantos de 16px e itens de 12px em `text-sm`. Itens destrutivos ficam em `--sig-texto` e sempre passam por `useConfirm`, nunca `confirm()`. O popover abre abaixo do gatilho e alinhado à direita dele; `lado="cima"` o abre acima, para gatilhos no pé da tela (a bandeja do estúdio), e `alinhar="esquerda"` o alinha pela borda esquerda, para gatilhos colados à borda esquerda. Sem ação para oferecer, não há "⋯": a linha fica só com a ação visível.

**Foco.** Escolher um item devolve o foco ao gatilho antes de a ação rodar, como o Esc. Assim o diálogo que ela abre (a confirmação, o modal de canais) guarda o gatilho e o devolve ali ao fechar, e um item que troca de tela deixa o foco no gatilho (o avatar da conta continua no cabeçalho). Antes o foco ficava no item, que some com o menu, e caía no `<body>`: quem usa teclado perdia o lugar na lista. Quando a ação tira a linha da lista (o canal removido, depois da confirmação do banco; o webinar excluído), o foco vai ao "⋯" da linha que ficou no lugar dela, ou ao da anterior se ela era a última; com a lista vazia, ao título da página (o `h1`, focável por `refDoTitulo`), de onde o Tab segue para a ação da página. Só quando o foco saiu junto com a linha: se a pessoa já foi a outro lugar, ele fica lá. A regra mora em `useFocoNaLista` (`Menu.tsx`), nas listas de Canais e Webinars.

**Linhas de webinar (`WebinarLinha`).** O título em `text-sm` 500 `--ink-hi` e, embaixo, em `text-xs` `--ink-lo`, o horário (`Horario`) e os canais; à direita, uma ação visível, "Entrar" (fantasma `sm`). O "⋯" existe só na página Webinars e tem um item, "Excluir webinar" (`acoesDoWebinar`), que pergunta antes: "Excluir “{título}”?", com "O webinar sai da lista, com o horário e os canais planejados." Confirmada, a linha sai na hora e o foco vai ao "⋯" da vizinha (ver Foco); se o banco não confirmar, ela volta à lista e o foco fica onde está. No Painel, nem a próxima live nem as próximas têm "⋯". "Página de inscrição" e "Criar capa" saíram: a página só abria para o próprio anfitrião, e a capa não aparecia em lugar nenhum. Voltam com o link público e com um lugar onde a capa apareça.
- **Webinars:** a frase do cabeçalho é "Cada webinar guarda o horário, os canais e o roteiro de uma live." Vazia, a lista diz "Nenhum webinar agendado. Agende um para guardar o horário, os canais e o roteiro da próxima live."
- **Painel sem live agendada:** "Nenhuma live agendada", com "Entre no estúdio para preparar a live agora, ou agende o próximo webinar." ("agende o próximo webinar" é a ação de texto sublinhada que abre o "Novo webinar").

### Linha de prontidão (assinatura do Painel)
É a resposta a "para onde a live vai". O título "Canais" traz a contagem honesta ("1 de 3 prontos", que cobre exatamente os chips mostrados). Seguem os chips dos canais ligados e as pendências da próxima live (plataforma anunciada mas desligada ou não conectada). À direita, "N outros desligados" e "+ Conectar canal" como ações de texto. O estado de cada canal vem de uma regra só, `src/lib/canais.ts` (`pronto` | `incompleto` | `desligado`), lida pelo Painel, pela página de Canais e pelo modal de canais.

**Movimento.** Um chip de canal recém-conectado entra uma vez: fade + deslize de 8px da esquerda, 300ms, `cubic-bezier(0.16, 1, 0.3, 1)`, só com `motion-safe`. É o único movimento de entrada no conteúdo da casca. Diálogos entram pela primitiva `Modal` (fundo em fade de 150ms; painel em fade + escala de 95 % a 100 %, 200ms) e nenhum diálogo acrescenta uma entrada própria. O resto é retorno de estado: cor em 150ms, `filter` do botão em 110ms, o chevron em 200ms `ease-out` e o pulso do esqueleto de carregamento (`motion-safe`). `prefers-reduced-motion` zera animações e transições globalmente.

### Captura do Painel (assinatura do início do site)
A única imagem do site: uma captura real do Painel (`src/assets/site/painel-exemplo.png`, 1280 × 912), numa `figure` com legenda. O `alt` descreve o que está na tela, com os dados de exemplo.
- **Moldura:** 16px de raio, borda `--line`, no escopo `data-surface="console"`, para a moldura e o contorno ficarem escuros também quando o site está no tema claro. A captura é o Painel no tema escuro, em qualquer tema.
- **Legenda:** `text-xs` `--ink-lo` com `text-pretty`, 12px abaixo: "O Painel de verdade, com dados de exemplo." A pista "Passe o mouse em “Já funciona”, abaixo, para ver cada parte nele." só aparece com `pointer-fine`, porque só o mouse aciona o contorno.
- **Contorno:** passar o mouse num item de "Já funciona" desenha um contorno de 2px em `--ink-hi` em volta da parte do Painel que ele nomeia (o botão "Entrar no estúdio", os canais, as próximas lives) e escurece o resto (ver o Véu do contorno em Elevation & Depth). O ✓ do item sobe para `--ink-hi` em 150ms.
- **Regiões:** `REGIOES`, em % da imagem, medidas no próprio Painel na janela da captura.
- **Acessibilidade:** o contorno é `aria-hidden`. Os itens não viram paradas de foco, porque não são controles; o que eles apontam já está no `alt` e no texto do item.

**Movimento.** O contorno é o único movimento do site. Ele desliza de uma região para outra e some no lugar em que estava, sem voltar a um canto: `left`, `top`, `width`, `height` e `opacity` em 300ms, `cubic-bezier(0.16, 1, 0.3, 1)`, a mesma curva da entrada do chip. Aciona só com `pointerType` `mouse`; no toque, a captura fica acima da lista, fora da tela. `prefers-reduced-motion` zera pela regra global, e o contorno passa a saltar.

**Regra da Captura de Verdade.** O site mostra o produto só por captura real do app, nunca por ilustração, espaço reservado ou tela montada. Os dados de exemplo são ditos na legenda. As datas na captura são absolutas ("sábado, 14 de novembro"), nunca "Hoje" ou "Amanhã", que num raster viram mentira no dia seguinte (Regra do Horário Derivado). A proveniência vai embutida no PNG (commit, janela, escala, tema e dados). Ao refazer a captura, as `REGIOES` do contorno são medidas de novo.

### Mestre-detalhe (assinatura do modal de canais)
Conectar ou editar **um** canal: escolher a plataforma, colar o servidor e a chave que ela mostra, salvar. Vive num `Modal` `size="xl"` com o título fixo e neutro "Canais"; o título não muda com a linha escolhida, e o verbo mora no botão de envio.
- **Lista (mestre):** uma `tablist` vertical (`useTabs` com `orientacao: 'vertical'`: ↑/↓, Home/End e `aria-orientation="vertical"`), rotulada "Plataformas". Uma linha de 56px (mínimo) por plataforma: ícone em `--ink-lo`, nome em `text-sm` 500 `--ink-hi` (truncado) e, abaixo, a palavra de estado em `text-xs`. A linha escolhida sobe para `--raise` (a partir de `md`); as outras ganham `--panel` no hover, em 150ms.
- **Palavras de estado, em ordem de precedência:** "Não salvo" (lápis, `--ink-hi`) quando há texto digitado e não salvo; "A partir do Standard" (cadeado, `--ink-lo`) quando o plano não libera a plataforma; "Não conectado" (`--ink-lo`) sem canal; a pendência curta com a inicial maiúscula ("Sem servidor nem chave", "Sem servidor", "Sem chave"; alerta, `--ink-hi`); e só num canal completo, "Pronto" (✓, `--ink-lo`) ou "Desligado" (`--ink-lo`). O que falta vem antes de ligado/desligado; ligar e desligar não se faz aqui.
- **Detalhe:** um `tabpanel` com o cabeçalho (ícone de 18px + nome, `text-base` 600), a frase de onde achar a chave pelo caminho da própria plataforma (`text-sm` `--ink-lo`, `max-w-prose`) terminada pelo link externo "Abrir …" (`AcaoDeTexto` `href` sublinhada), e os campos Nome do canal, Servidor e Chave de transmissão. O servidor vem preenchido com o padrão da plataforma, e a dica diz isso.
- **Plataforma bloqueada pelo plano:** no lugar do formulário, uma frase do que o plano permite e o botão primário "Ver planos".
- **Limite do plano:** um canal novo que passaria do número de canais ligados ao mesmo tempo do plano é salvo desligado. Uma linha com o ícone `Info` em `text-sm` `--ink-lo`, acima dos botões, diz quantos o plano transmite e quantos já estão ligados, com "Ver planos" sublinhado; o aviso depois de salvar repete o porquê. Editar um canal nunca o liga nem o desliga.
- **Abertura:** aberto por uma pendência ou por "Editar servidor e chave", abre **naquele canal** (pelo id, o que vale também para servidores NGINX/SRS criados no estúdio) e põe o foco no campo que só a pessoa pode preencher. Aberto por "Conectar canal", começa na primeira plataforma sem canal, com o foco na lista.
- **Assinatura: o rascunho fica.** O que foi digitado numa plataforma sobrevive à troca para outra (e aparece como "Não salvo" na lista). Salvar com outras linhas ainda sujas não fecha o diálogo: ele segue para a próxima delas, com o foco no primário, e mostra, no topo do detalhe, uma linha `role="status"` com ✓ em `text-sm` `--ink-hi` ("YouTube salvo. Falta salvar: Facebook."). Fecha só quando não resta rascunho.
- **Salvar:** pela Regra do Salvo de Verdade. Só depois da confirmação o canal muda na lista, o aviso ("YouTube conectado", "YouTube salvo", "Kick conectado, mas desligado") sai e o diálogo fecha ou segue para o próximo rascunho. Enquanto grava, o primário fica em `loading`, e o diálogo fica parado na plataforma que está gravando: Cancelar e o X desabilitam, Esc e o clique no fundo não fecham (`ocupado` do `Modal`), as linhas da lista desabilitam, os campos ficam só leitura, e "‹ Plataformas" e "Ver planos" esperam. O diálogo começa do zero a cada abertura: fechar no meio levaria o rascunho e a falha. Na falha, ele fica aberto na mesma plataforma, com o rascunho ("Não salvo" na lista), e a linha de falha fica acima das ações do detalhe. A frase é a de `O_QUE_DIZER`, para um canal novo ou para um existente: "Sem conexão com a sua conta agora, então o canal não foi conectado. Tente de novo mais tarde.", "Não deu para confirmar que as alterações foram salvas. Confira a conexão e tente de novo." Em `sem-login` ela termina com "Entrar de novo" sublinhado, que recebe o foco; senão o foco volta ao primário. Uma nova tentativa de um canal novo reusa o id da primeira. Sem os canais da conta carregados, nada é gravado: o diálogo fica com o que foi digitado, e o aviso "Seus canais ainda estão carregando" vem do app.
- **Movimento:** nenhum além da entrada da primitiva `Modal` e da cor em 150ms das linhas. O servidor cresce sem transição.

### Novo webinar (diálogo de agendar)
Dizer quando e para onde. Vive num `Modal` `size="md"` com o título neutro "Novo webinar"; o verbo mora só no envio, "Agendar webinar". Abre com o foco no Título. É aberto por "Agendar webinar" em Webinars e no Painel.
- **Campos:** Título (44px); Data e Hora lado a lado (campos nativos `date` e `time`, 44px, a data com mínimo em hoje). A Descrição saiu com a página pública, a única tela que a mostrava, pela Regra do Dado com Uso; `desc` fica opcional só para os webinars antigos.
- **Canais:** um `fieldset` com a legenda "Canais" (rótulo de campo) e a dica de uma linha "Para onde a live vai.", seguidos de uma grade de duas colunas de `CaixaDeSelecao`, em qualquer largura. As opções são as oito plataformas de `PLATAFORMAS_NOMEADAS`, na ordem do modal de canais; o servidor RTMP próprio fica fora, porque "Servidor…" não diz qual servidor é para `plataformaPeloNome`.
- **Linha de canal:** o ícone da plataforma (14px, `--ink-lo`) na mesma linha, antes do nome (`text-sm` `--ink-hi`), e embaixo a palavra de estado em `text-xs` `--ink-lo`, no vocabulário de `src/lib/canais.ts`, em minúscula: "pronto", a pendência curta ("sem chave"…), "desligado" ou "não conectado". O ícone não ganha coluna própria, para a palavra de estado caber numa linha no celular.
- **Pré-marcação:** ao abrir, as plataformas dos canais ligados vêm marcadas (para onde a live vai hoje), a menos que a pessoa já tenha mexido nelas neste rascunho.
- **Validação:** `ErroDeCampo` em Título, Data e Hora, e o foco no primeiro inválido. Sem título, "Falta o título. É o nome que aparece na lista e no estúdio." Horário no passado é erro na Hora ("Esse horário já passou. Escolha um a partir de agora.").
- **Salvar:** pela Regra do Salvo de Verdade. Só depois da confirmação a linha entra na lista, o diálogo fecha e o aviso "Webinar agendado" mostra o rótulo do horário. Enquanto grava, o diálogo não fecha (`ocupado`): o X e Cancelar desabilitam, e Esc e o clique no fundo esperam. Na falha, o diálogo fica aberto com o rascunho e a linha de falha no rodapé; em `sem-login` ela termina com "Entrar de novo" sublinhado.
- **Movimento:** nenhum além da entrada da primitiva `Modal` e dos 150ms da caixa.

**Regra do Horário Derivado.** "Hoje, às…" e "Amanhã, às…" são derivados na hora de mostrar, a partir de `startsAt` (ISO 8601), por `rotuloDoHorario` em `src/lib/horario.ts`, e nunca gravados: um "Amanhã" gravado vira mentira no dia seguinte. O campo `time` guarda a frase absoluta ("Domingo, 27 de setembro, às 20:00", por `horarioPorExtenso`) para quem só tem o texto: `rotuloDoHorario` cai nele quando o webinar é antigo, sem `startsAt` (e mostra o seu texto livre), ou quando `startsAt` não é uma data; nenhuma outra tela lê `time`. Lista de webinars, Painel e aviso usam o mesmo rótulo, e a hora vai em mono pelo `Horario`.

### Administração (lista de clientes)
A administração da plataforma é uma lista de leitura, na mesma casca das outras páginas: quem está cadastrado, com o plano e o teste de cada um. Vive em `SuperAdminPanel.tsx` e em `subscribeUserProfiles` (`src/lib/dadosDaConta.ts`), que lê `public.profiles`. Não é um painel de controle: nenhum indicador, nenhum cartão, nenhuma cor e nenhuma ação sobre o cliente. O que ainda não existe é dito no cabeçalho, em palavras (Regra da Vitrine sem Balcão).
- **Página:** `Pagina` com o `CabecalhoDePagina` "Administração" e a frase "Os clientes cadastrados na plataforma, só para leitura. A mudança de plano, as chaves de transmissão e o registro de auditoria voltam quando houver ingestão, feitos pelo servidor."
- **Seção "Clientes":** a `SecaoDePagina` do sistema, aberta por linha de 1px em `--line`, 48px abaixo do cabeçalho e 24px até o título. O h2 "Clientes" em `text-base` 600 `--ink-hi` e, na `contagem`, "N cadastrados" ("1 cadastrado") em `text-sm` 400 `--ink-lo`, só quando a lista abriu e tem gente.
- **Busca:** a `acao` da seção, à direita do título e centrada na linha dele a partir de `sm` (288px), na largura toda e abaixo do título no celular, como todo controle de seção (16px entre eles na linha, 12px empilhados). É o campo do sistema: `type="search"`, 44px, `--well`, borda `--line-ctl`, 16px de raio, `text-sm`, com o ícone `Search` de 16px em `--ink-lo` à esquerda, `aria-hidden`, e o texto a 36px da borda. O placeholder é "Nome ou e-mail" em `--ink-dim`; o nome acessível vem do `aria-label` "Buscar cliente por nome ou e-mail". Busca no nome e no e-mail, sem acento e sem caixa ("joão" acha "Joao"). Só aparece com a lista aberta e com clientes: sobre uma frase de falha, ela ficaria pendurada.
- **Lista:** um `ul` `divide-y` em `--line`, com linha em cima e embaixo (`border-y`), 16px abaixo do título. Em ordem alfabética pelo nome, ou pelo e-mail de quem não tem nome (`localeCompare` em pt-BR).
- **Linha:** 16px em cima e embaixo, dois lados a 16px. À esquerda, o nome em `text-sm` 500 `--ink-hi` e, 4px abaixo, o e-mail em `text-xs` `--ink-lo`, os dois truncados; sem nome, o e-mail sobe para o lugar do nome e não se repete. À direita, alinhado à direita e sem encolher, o nome do plano (de `getPlan`) em `text-sm` `--ink` e, só no teste grátis, a situação do teste em `text-xs` `--ink-lo`: "teste até 29 de outubro" ou "teste encerrado em 14 de outubro", com o ano só quando não é o corrente. A linha não é clicável, não tem "⋯" nem ação.
- **Estados:** uma frase no lugar da lista, em `text-sm` `--ink-lo`, `max-w-prose`; no carregamento e nas falhas, com `role="status"`. Carregando: "Carregando os clientes…". Sem sessão: "Sua sessão expirou, então a lista de clientes não abriu." seguida da `AcaoDeTexto` sublinhada "Entrar de novo", que sai da conta e volta à entrada. Recusado: "O banco recusou a lista de clientes. Confira se este e-mail está na lista de administradores do servidor." Sem conexão: "Sem conexão com o banco agora. A lista aparece quando ele voltar." Vazio: "Nenhum cliente cadastrado ainda." Busca vazia: "Nenhum cliente com esse nome ou e-mail." A RLS só entrega os perfis de todos a um admin (`app_private.is_super_admin()`, pelo papel que o servidor mantém igual a `SUPER_ADMIN_EMAILS`); a outra conta, só o próprio. `subscribeUserProfiles` devolve o motivo: sem sessão depois de esperar a sessão voltar (`esperarSessao`), ou o token recusado pela API (`PGRST301`/`PGRST303`), vira `sem-login`; falha de rede vira `sem-conexao`; o resto vira `recusado`. O resultado da busca é anunciado por uma região `sr-only` que fica montada ("N encontrados" ou "Nenhum cliente com esse nome ou e-mail."), porque a frase visível troca de lugar com a lista e não seria lida.
- **Sem o papel:** quem não é admin vê "Acesso restrito", com "Esta área é só para a administração da plataforma." e a ação de texto "Voltar ao painel". Sem formulário e sem senha.
- **Entradas:** o item "Administração" (`Shield` 14px) no menu da conta, antes de "Sair"; a linha "Administração da plataforma" em Configurações › Avançado ("Os clientes cadastrados, só para leitura."), seção que só existe para o admin; e a rota `/admin` (também `#admin` e `?mode=admin`), que leva quem não tem o papel ao Painel, sem aviso. As três dependem de `role === 'super-admin'` no usuário da sessão; o papel abre a tela, e quem decide o que a conta lê é a RLS do banco.

**O papel e a situação do perfil não são lidos.** O papel mora em `public.user_roles`, mantido pelo servidor; `public.profiles` não tem coluna de papel. A situação (`subscription_status`) fica fora da lista: nada a atualiza quando o teste vence. `PerfilDeCliente` traz só `uid`, `name`, `email`, `plan` (o enum do banco, `free_trial`, `standard`, `professional`, `business`, com o nome do app: Free Trial, Standard, Professional, Business) e `trialEndsAt`, e o teste é derivado da data na hora de mostrar (Regra do Horário Derivado). As chaves de transmissão e o registro de auditoria saíram da tela e do módulo de dados da conta: o navegador os gravava direto no banco, e a auditoria tinha registros que não aconteceram. Voltam quando houver ingestão, feitos pelo servidor.

### Console do estúdio (assinatura do estúdio)
Uma mesa de corte para montar e ensaiar o programa: escolher a cena no preview, ver o que muda e cortar. Vive em `Estudio.tsx`, o dono do estado do estúdio (o `App` só o renderiza), e em `BarraDoEstudio`, `TrilhoDeCenas`, `MonitoresDoEstudio`, `PainelDoEstudio`, `DivisorDeColuna`, `BandejaDoEstudio`, `MedidorDeAudio` e `src/lib/cenas.ts`; o palco é o `StudioPreview`, e o que vai sobre a imagem, `GraficosDoPalco`. Os painéis de ferramentas estão em Painéis do estúdio, logo abaixo. O que o estúdio ainda não faz é dito em palavras (Regra da Vitrine sem Balcão): a frase da bandeja no lugar do ar, e o próximo corte no lugar da telemetria.
- **Barra (`BarraDoEstudio`):** 48px em `--surface`, com linha embaixo. O logo monocromático (24px; só o ícone abaixo de `sm`) leva ao Painel ("PwStreamer, voltar ao Painel"). O `h1` é "Estúdio" em `text-sm` 500 `--ink-hi`, seguido de " · {sessão}" (o título do webinar) em 400 `--ink-lo`, truncado. À direita, a 16px: a ação de texto `xs` dos canais ("Nenhum canal ligado" ou "Canais: 2 de 3 prontos"), que abre o modal de canais, só a partir de `md`; "Entrar ao vivo", fantasma `sm` com o ícone `Radio` (14px), só a partir de `sm`; e "Sair do estúdio", fantasma `sm`. "Entrar ao vivo" fica no lugar do antigo GO LIVE, indisponível (`aria-disabled`, ver Buttons): o motivo vai no `aria-describedby` ("A transmissão para os canais ainda não está no ar."), e o clique o repete num aviso (`toast.info`: "A transmissão ainda não existe", "Quando ela chegar, é por aqui que o estúdio entra no ar nos canais ligados."). Nada nele finge o ar: sem cor, sem carmim, nada acende e nada é simulado. Mesmo assim é um botão desabilitado de algo que ainda não existe, o que a Regra da Vitrine sem Balcão não prevê, e por isso fica contado em Fora do sistema. Abaixo de `lg`, uma linha de 44px sob a barra diz "Ensaio local · nada está sendo transmitido.", para que "Programa" não pareça um sinal já no ar quando a frase da bandeja não cabe. Depois de "Ver preview", a mesma linha mantém "Ensaio local · não está no ar." e oferece "Voltar aos ajustes", com alvo de 44px.
- **Cenas (`TrilhoDeCenas`):** as seis cenas de `CENAS` (Câmera; Tela com câmera; Câmera e tela lado a lado; Câmera e tela iguais; Câmera grande e tela; Tela), sob o título "Cenas" em `text-xs` `--ink-lo`. Cada linha tem altura fixa (`min-h-14`, 16px de raio): o nome em cima, em `text-sm` `--ink-hi`, e o estado embaixo, cada um numa linha só, truncado (`truncate`), para a linha não crescer quando a coluna estreita; o nome inteiro fica no `title`. O estado vai em palavras e em `text-xs`: "programa", "preview" ou "programa e preview", com "· sem tela" quando a cena precisa da tela e ninguém compartilha; fora dos dois, "sem tela compartilhada". O estado da cena no programa fica em 500 `--ink-hi`, os outros em `--ink-lo`. A linha no preview sobe para `--raise` e leva `aria-current`; as outras ganham `--panel` no hover. Escolher uma cena a leva ao preview, nunca ao programa. A altura é fixa para o corte não mexer a lista embaixo do ponteiro.
- **Cenas recolhidas:** só no desktop (`useDesktop`, `matchMedia('(min-width: 64rem)')`): abaixo de `lg`, um recolhimento guardado é ignorado, os nomes voltam e Corte e Fusão ficam só sob o preview. "Recolher as cenas" (`BotaoDeIcone` com `PanelLeftClose` e `aria-expanded`, na linha do título "Cenas") estreita a coluna e guarda só o que não pode sumir durante a live. Cada cena vira uma tecla de 64px (`min-h-16`, 16px de raio) com o número dela (`text-sm` 500 `tabular-nums` `--ink-hi`) e, embaixo, o estado em palavra: "programa" em `text-xs` 500 `--ink-hi`, "preview" em `text-xs` `--ink-lo`. O nome e a legenda vão no nome acessível ("Tela com câmera, preview") e no `title`; a cena no preview continua em `--raise` com `aria-current`. Corte e Fusão ficam uma sobre a outra (`compacto`), e "O preview está igual ao programa." vai só para o leitor de tela. "Mostrar os nomes das cenas" (`PanelLeftOpen`) desfaz. Recolher troca a coluna inteira, e o botão que tinha o foco sai com ela: o foco vai ao botão que desfaz, em vez de cair no `<body>`.
- **Divisor (`DivisorDeColuna`):** a borda arrastável de cada coluna lateral, por dentro dela e sobre a linha que dá para os monitores (um divisor que passava para fora abria rolagem horizontal). É um `separator` vertical com valor (`aria-valuenow`, `-valuemin`, `-valuemax` e "N pixels" no `aria-valuetext`), nomeado "Largura das cenas" ou "Largura do painel de ferramentas" e focável. Ele diz a largura que está na tela, não a guardada: o máximo de verdade é o menor entre `maximo` e a largura da janela vezes `tetoNaJanela` (arredondada para baixo), e é ele que vai no `aria-valuemax`, em End e no limite das setas; o `aria-valuenow` é a largura na tela. O alvo do ponteiro tem 8px e `cursor: col-resize`; a linha de 1px só aparece sob o ponteiro (`--ink-lo`), no foco e no arrasto (`--ink-hi`), e parada a borda é a de sempre. As setas mudam a largura de 16 em 16px (64px com Shift), Home e End vão ao mínimo e ao máximo, e o duplo clique volta ao padrão (o `title` diz isso). O arrasto parte da largura que a coluna tem na tela, que o limite em vw pode ter encolhido. Com a coluna recolhida, o divisor não existe.
- **Transição (`BotoesDeTransicao`):** "Corte" e "Fusão", duas teclas lado a lado a 8px (uma sobre a outra com as cenas recolhidas), sob uma linha e o título "Transição". A tecla (`TECLA`) é o `Button` fantasma com 56px de altura, fundo `--raise` e borda `--line-ctl`; no hover a borda sobe para `--ink-lo`, e no aperto (`:active`) para `--ink-hi`, com o fundo descendo para `--panel`. A duração vai dentro, sob o nome, em mono `xs` `--ink-lo` ("0 ms", "400 ms"). As duas ficam desativadas quando nada muda e durante a fusão; sem mudança, a frase "O preview está igual ao programa." vem embaixo. No celular, as teclas ficam logo abaixo do preview.
- **Fusão:** real. O programa que sai é desenhado por cima do que entra e some em 400ms (`@keyframes fusao-sai`, `ease-out`; a duração é `DURACAO_DA_FUSAO`), inerte e `aria-hidden`. Com movimento reduzido, a regra global a faz virar corte. É o único movimento do console.
- **Mesa de monitores (`MesaDeMonitores`):** no desktop, a mesa mede a própria coluna. O programa fica centralizado, com 60 % da altura das imagens e largura = altura × 16/9, limitada pela coluna. A linha de baixo tem a largura do programa: o preview, medido pela imagem na altura que sobra, e ao lado, a 16px, o próximo corte, com no mínimo 224px. O lugar de cada monitor é a moldura inteira, o palco em 16:9 mais o anel de 2px (`alturaDaMoldura`), no desktop e no celular. No celular, tudo empilha na largura da coluna, a 16px: programa, preview, as teclas de transição e o próximo corte. O atalho dos ajustes rola diretamente para o preview, sem mudar o tamanho dos monitores.
- **Monitor (`Monitor`):** o rótulo fica fora da imagem, 8px acima dela: o papel ("Programa", "Preview") em `text-xs` 500 `--ink-hi` e a cena em `text-xs` `--ink-lo`, truncada. A imagem fica na moldura `.pw-frame`, de canto reto, com o anel de 2px: `n-14` no programa em repouso e `n-89` no preview, o que aponta o monitor que se edita sem usar cor. O programa é inerte (`inert`): nenhum controle e nenhum clique.
- **No próximo corte (`ProximoCorte`):** o rótulo fica fora, como o dos monitores. A caixa tem canto reto, fundo `--panel`, borda e divisões de 1px em `--line`, e a altura do que lista; rola só se passar da altura do preview. Cada linha diz em palavras o que o corte leva, com uma seta (`ArrowRight` 14px, `--ink-lo`) e o texto em `text-sm` `--ink`. As frases são as de `mudancasNoCorte` (`src/lib/graficos.ts`), e é por essa lista que Corte e Fusão se acendem. Cada gráfico diz uma coisa só: se entra, se sai, se troca ou o que muda nele.
  - **Ordem:** a cena ("Cena: Tela com câmera") ou, na mesma cena, "Fontes em cena"; o card; o clipe; a apresentação; o fundo; a sobreposição; o logo; o banner; o ticker; o QR code; o cronômetro; o comentário fixado; e a cor dos gráficos.
  - **Entra:** banner, ticker, clipe e apresentação dizem qual ("Entra o banner: Ana Souza", "Entra o ticker: Inscrições abertas até sexta, com 20%…", "Entra o clipe: Abertura", "Entra a apresentação: Aula 3"). Logo, fundo, sobreposição, QR code, cronômetro e comentário fixado entram sem nome ("Entra o QR code").
  - **Troca:** quando o preview traz outro item no lugar do que está no programa. Banner, ticker, clipe e apresentação dizem qual ("Troca o banner: {título}", "Troca o ticker: {começo do texto}", "Troca o clipe: {nome}", "Troca a apresentação: {nome}"); virar a página não é troca, porque a página não passa pelo corte; "Troca o logo", "Troca o fundo", "Troca a sobreposição" e "Troca o comentário fixado" vão sem nome.
  - **Muda no mesmo item:** "{Item}: partes", só com as partes que mudam, juntadas por vírgula e "e" (`juntar`): "Card da câmera: posição, tamanho e formato" (só quando o programa e o preview têm card), "Logo: canto, tamanho e opacidade", "Banner: texto e posição", "Ticker: texto, velocidade e direção", "QR code: link, título, preço, canto e tamanho" e "Cronômetro: título".
  - **Sai:** "Sai o banner", "Sai a sobreposição" e assim por diante.
  - **Cor dos gráficos:** a linha "Cor dos gráficos" só aparece quando há no preview algo desenhado com ela (banner, ticker, QR code, cronômetro ou o card da câmera).
  - **Resumo:** o texto do ticker aparece resumido em 40 caracteres, cortado entre palavras, com "…".
  - **Vazia:** "Nada muda: o preview está igual ao programa." em `text-xs` `--ink-lo`.
  É o lugar que o console aprovado dava à telemetria, que não existe sem transmissão.
- **Preview e programa:** o preview é o estado em edição. O programa mostra o estado do último corte, desenhado pelo mesmo `StudioPreview`, com `papel="programa"`. A mesma composição e a mesma proporção nos dois monitores. O corte copia `estadoDoPreview` para o programa; o programa abre na cena inicial, sem gráficos (`graficosVazios`), e o que o preview já traz entra pelo corte. Ver a Regra do Preview Fiel.
  - **`StudioSceneState`:** `sceneId`, `layout`, `activeParticipantIds` (as fontes), `cardDaCamera`, `activeBackground`, `activeOverlay`, `pinnedComment`, `graficos`, `clipe` (`ClipeNoPalco`: `id`, `nome`, `url`, ou `null`) e `apresentacao` (`ApresentacaoNoPalco`: `id` e `nome`, ou `null`; a página não está no estado, porque é da fonte). `layout` é um de `1-cam`, `picture-in-picture`, `screen-share`, `dual` e `camera-em-destaque` nas cenas de hoje; `presentation`, `grid` e `gallery` existem no tipo e nenhuma cena os usa.
  - **`graficos` (`GraficosDoPalco`):** `cor`, `logo` (`url`, `canto`, `tamanho`, `opacidade`), `banner` (`titulo`, `subtitulo`, `posicao`), `ticker` (`texto`, `selo`, `velocidade`, `direcao`), `qr` (`url`, `titulo`, `preco`, `canto`, `tamanho`) e `cronometro` (`titulo`); cada um é `null` quando está fora.
  - **Conteúdo, não ids:** o programa guarda o conteúdo. Editar ou apagar um item da lista não muda o programa até o próximo corte. `banner` e `ticker` levam um `id` opcional só para os painéis dizerem onde cada item está; o desenho usa o texto.
- **Card da câmera:** na cena Tela com câmera (layout `picture-in-picture`, a única com card; `layoutUsaCard` também aceita `presentation`, que nenhuma cena usa), a câmera fica num card que é geometria da cena (`GeometriaDoCard`): `x` e `y` em % do palco, `escala` (de 0,6 a 1,8) e `formato`, com a largura em % da largura do palco (`FORMATOS_DO_CARD`: `rounded` 26 %, `compact` 21,6 % e `circle` 19,4 %, cada um com a sua proporção). `dentroDoPalco` mantém o card inteiro dentro do palco depois de qualquer ajuste. O padrão fica embaixo à direita (`x` 71, `y` 64). O card do preview é o que se monta, e o corte o leva ao programa. No palco, o editor é só a mão: arrastar o card o move; a alça neutra do canto (20px, borda `--ink-hi` sobre `--surface`, só no hover e no ajuste, e sem alça no círculo) muda o tamanho; o anel de edição é `--ink-hi`; e, só durante o ajuste, uma leitura em mono `xs` `--ink` sobre `--surface` diz "X 71% · Y 64%" ou "120%". Cantos, formato e tamanho exato ficam no painel Câmera. A borda do card é gráfico da live, na cor dos gráficos.
- **Lado a lado:** com as mesmas duas fontes cabem três divisões, todas com margem e vão de 1,6 % da largura, para o preview e o programa terem a mesma composição. "Câmera e tela lado a lado" (`screen-share`): a tela com três quartos da largura e a câmera em 16:9 ao lado, centrada na altura. "Câmera e tela iguais" (`dual`): as duas em 16:9 do mesmo tamanho, a câmera à esquerda, centradas na altura. "Câmera grande e tela" (`camera-em-destaque`): o espelho da primeira, a câmera com três quartos da largura e a tela em 16:9 ao lado. A grade e a galeria do mockup só fazem sentido com convidados, e voltam com eles.
- **Espelho:** é propriedade da câmera, como o zoom e o enquadramento, e vale nos dois monitores na hora, sem corte (ver as exceções da Regra do Preview Fiel). Liga no painel Câmera e começa desligado.
- **Guias:** ligadas pelo controle "Guias" da bandeja, valem nos dois monitores. São os terços, a área segura (7 % em cima e embaixo, 6 % dos lados) e a cruz central de 18px, em linhas de 1px no token `--guia` (branco a 60 %) com `mix-blend-difference`, para aparecerem sobre imagem clara ou escura sem cor própria. São `aria-hidden` e não recebem clique.
- **Bandeja (`BandejaDoEstudio`):** em `--surface`, com linha em cima e controles a 8px: Microfone (com o medidor ao lado), Câmera, Compartilhar tela, um separador de 1px em `--line` (a partir de `sm`) e Guias. Cada controle é um `Button` fantasma de 44px com ícone e palavra, e o estado mora em `aria-pressed`: ligado sobe para `--raise` com `--ink-hi`; desligado fica no `--well` com `--ink-lo`, e o ícone e a palavra mudam ("Microfone mudo", "Câmera desligada", "Parar de compartilhar"). Abaixo de `sm`, o controle vira um quadrado de 44px só com o ícone, e a palavra vai para `sr-only`. Microfone e câmera ganham, colado, um gatilho de chevron (mesma borda e mesmo fundo) que abre um `Menu` para cima com os aparelhos reais (`enumerateDevices`), o atual marcado com ✓; o gatilho só aparece com mais de um aparelho. O botão de tela some onde o navegador não tem `getDisplayMedia`. À direita, a partir de `lg`, a frase do ar em `text-xs` `--ink-lo`: "Transmitir para os canais ainda não está no ar."
- **Medidor (`MedidorDeAudio`):** o nível do microfone, lido do próprio stream pelo Web Audio (RMS, piso de −60 dB) e escrito direto no DOM a cada quadro. É um trilho reto de 8px em `--well` (96px; 64px abaixo de `sm`), segmentado por vãos de 1px a cada 6px, na cor da bandeja. A barra é `--ink-lo` e sobe para `--ink-hi` acima de −12 dB: graduação de valor, sem vermelho. O pico fica retido por 1s num marcador de 2px em `--ink-hi`. A leitura ("−25 dB", mono `xs` `--ink-lo`) muda a cada 120ms e some abaixo de `sm`; em silêncio, no mudo ou sem Web Audio, diz "—". O medidor é `aria-hidden`. Ele é remontado a cada troca de trilha de áudio (`key` em `versaoDoAudio`), para ouvir a trilha nova.
- **Coluna da direita (`PainelDoEstudio`):** o painel da ferramenta aberta e, na borda direita, o trilho de ferramentas, de 72px (`w-[4.5rem]`): um contêiner com a `tablist` vertical ("Ferramentas", só abas) e, no pé, o botão de recolher, que fica fora dela. A `tablist` vem com sete abas: Chat, Gráficos, Roteiro, QR code, Mídia, Câmera e Áudio. Câmera substituiu Estilo, e Extras saiu. Cada aba tem 56px, o ícone de 18px sobre a palavra em `text-xs` e 16px de raio; a aberta sobe para `--raise` e `--ink-hi`, as outras ficam em `--ink-lo`, com `--panel` no hover. O `title` da aba diz o que há nela ("Qualidade, card, enquadramento, espelho e croma"; "Clipes de vídeo e apresentação em PDF"). A linha entre painel e trilho é do painel (`border-r` em `--line`), para ir até o fim dele. No desktop, a coluna tem a altura do console, e o painel e o trilho rolam cada um por dentro. Abaixo de `lg`, o painel cresce com a rolagem da página e o trilho fica `sticky top-0`, preso no alto enquanto o painel passa; o chat tem `h-[36rem]` só abaixo de `lg` (no desktop, a altura da coluna). No topo do painel, só abaixo de `lg`, "Ver preview" fica preso à rolagem e abre o monitor de preview; o retorno guarda a posição exata nos ajustes. Os dois controles têm alvo mínimo de 44px.
  - **Painel recolhido:** no pé do trilho, só a partir de `lg`, "Recolher o painel" (`BotaoDeIcone` com `PanelRightClose` e `aria-expanded`) esconde o painel e deixa só o trilho, para os monitores ganharem a largura. "Abrir o painel" (`PanelRightOpen`) o devolve, e escolher qualquer aba com o painel recolhido também o abre, porque escolher uma ferramenta é querer vê-la. É o mesmo botão nos dois estados, e o foco fica nele.
- **Chat (`VirtualizedChat`):** o cabeçalho traz "Chat" (`text-sm` 500 `--ink-hi`) e a contagem ao lado ("1 mensagem", "12 mensagens", em `text-xs` `--ink-lo`), a busca (um `BotaoDeIcone` que abre o campo "Nome ou mensagem") e, havendo mensagens, o "⋯" com "Exportar o chat (.json)" e "Limpar o chat" (em `--sig-texto`, com confirmação). Vazio, diz "Nenhuma mensagem ainda." e que os comentários dos canais ainda não chegam ao estúdio. Cada mensagem é uma linha com divisória em `--line`: o nome em `text-xs` 500 `--ink-hi`, a hora em mono `--ink-lo` e o botão de fixar ("Fixar no palco a mensagem de …", com `aria-pressed`); a fixada sobe para `--raise` e diz "fixado". Embaixo, o campo "Mensagem" de 44px e o envio por ícone, com a nota "Você escreve como {nome}. As mensagens ficam só neste estúdio." Confirmar "Limpar o chat" esvazia a lista, e o "⋯" some junto (sem mensagem, não há o que exportar ou limpar): se o foco estava nele, o foco vai à busca, que continua sempre no cabeçalho.

**Regra do Preview Fiel.** O preview mostra exatamente o que o corte leva: a mesma composição, a mesma proporção e o mesmo espelho do programa, desenhados pelo mesmo compositor. Nada vai sobre a imagem que não iria ao ar: o papel, a cena e o estado ficam no rótulo, fora dela. Sobre a imagem só entram, sob a mão, a alça e a leitura do card enquanto ele é ajustado, e as guias, que o operador liga e que valem nos dois monitores. Os gráficos do palco são medidos em fração do palco (`cqw`, `cqh` ou %), nunca em px, para ocuparem a mesma parte da imagem num monitor pequeno e num grande. Tudo passa pelo corte, com cinco exceções, que valem nos dois monitores na hora, sem corte, porque são propriedades da fonte ao vivo, como a própria câmera e a tela: o enquadramento (zoom, `x`, `y`), o espelho, o croma, o relógio do cronômetro (um só, `RelogioDoCronometro`; o corte leva o cronômetro e o título, não o tempo) e a página da apresentação em PDF (virar a página é como rolar a tela compartilhada; o corte leva a apresentação, não a página). Todo o resto passa pelo corte: cena, card, clipe, apresentação, fundo, sobreposição, logo, banner, ticker, QR code, cronômetro, comentário fixado e cor dos gráficos. Os painéis dizem isso nas dicas ("Vale no preview e no programa na hora, sem esperar o corte, como a própria câmera."; "O corte leva ao programa.").

### Painéis do estúdio (fase 2)
O que se monta para o programa, na coluna de cerca de 260px ao lado do trilho (no padrão; de 200 a 416px com o divisor). O que um painel liga vai ao preview, e o corte leva ao programa (fora as exceções da Regra do Preview Fiel). O painel é o único editor, e o palco, o único desenho: nenhum gráfico tem alça, botão ou barra sobre a imagem. Movimento, nenhum além da cor em 150ms; o ticker e a rolagem do teleprompter são conteúdo, não interface.

**As peças (`PecasDoPainel`).** Servem a qualquer coluna estreita.
- **`SecaoDoPainel`:** uma `section` aberta por uma linha de 1px em `--line` (a primeira sem linha), sem cartão e sem fundo, com 16px de respiro. O título, em `text-sm` 500 `--ink-hi`, fica numa linha de 32px com a `acao` à direita (um `Switch` ou uma ação de texto `xs`, como "Voltar ao padrão"). Logo sob o título vem o `estado` (`EstadoNoPalco`), depois a dica em `text-xs` `--ink-lo` com `text-pretty`, e o conteúdo 12px abaixo, com 12px entre as peças.
- **`EscolhaDoPainel`:** o nome em cima, em `text-xs` `--ink`, e o controle embaixo, porque numa coluna estreita os dois não cabem lado a lado. O nome é `aria-hidden`; o controle leva o próprio rótulo.
- **`Deslizante`:** o campo mora dentro do `label`. O nome fica à esquerda, em `text-xs` `--ink`, e a medida à direita, em mono `xs` `tabular-nums` `--ink-lo` ("12% da largura", "1,50×", "centro"), que também é o `aria-valuetext`. O controle é `.deslizante`: trilho de 4px em `--line-ctl`, polegar de 16px em `--ink-hi` e alvo de 24px; desativado, a 45 %.
- **`SeletorDeCanto`:** um `radiogroup` 2×2 com os quatro cantos na posição em que ficam na imagem. Cada opção tem 44px, 10px de raio e a seta do canto em 16px, dentro de uma borda `--line-ctl` de 16px de raio. A marcada sobe para `--raise` `--ink-hi`, e as outras ficam em `--ink-lo`. Sem valor (o card fora de um canto), nenhuma fica marcada.
- **`EnviarArquivo`:** um `label` de 44px com borda tracejada em `--line-ctl`, o `+` de 16px e a frase ("Enviar logo", "Enviar vídeo (MP4 ou WebM, até 50 MB)"), que vira "Enviando… N%" em `tabular-nums`, a 60 %, enquanto o arquivo sobe para a conta; o campo fica desativado até a conta responder. É tracejado porque adiciona, como "Novo banner" e "Novo ticker". O foco de teclado aparece no rótulo (`.envio`, com o anel global). A falha do envio fica logo embaixo, em `ErroDeCampo`, com a frase de `fraseDaFalhaDoEnvio`, e o próprio botão é a nova tentativa.
- **`GradeDeImagens`:** a biblioteca de um gráfico de imagem (logo, fundo, sobreposição), num `radiogroup` de três colunas quadradas em `--well`, com "Nenhum" primeiro; a marcada ganha borda e anel de 1px em `--ink-hi`. No grupo só entra a imagem que já chegou a esta aba. As outras ficam numa lista à parte, logo abaixo ("Imagens que ainda não abriram nesta tela"), na mesma grade de quadrados em `--well` com borda `--line-ctl`, em `text-xs` `--ink-lo`, dizendo como vêm: "Na fila", "Baixando…" com o N% embaixo, em `tabular-nums`, ou, quando não veio, `CircleAlert` 16px em `--ink-hi`, "Não abriu" e "Excluir". Enquanto procura a cópia, o quadrado fica vazio, e só o leitor de tela ouve "abrindo". Embaixo vem uma linha para a imagem do preview e outra para a do programa, quando é outra. Cada linha traz o nome, onde a imagem está e "Excluir", que pergunta antes. Onde o arquivo fica não se diz por item: diz a `NotaDaMidia`, uma vez por seção.
- **`CampoDoPainel`:** o campo de 44px em `--well`, com o rótulo em `text-xs` `--ink` em cima, dentro do `label`. Embaixo vem a dica ou, no lugar dela, o `ErroDeCampo`, ligados por `aria-describedby`.
- **`EstadoNoPalco` e `ondeEsta`:** onde um item está, sob o nome dele (ver a Regra do Onde Está).
- **`NotaDaMidia`:** onde a mídia fica, numa linha em `text-xs` `tabular-nums` `--ink-lo`, no fim de cada seção de mídia, depois do envio e do erro dele: "Fica na sua conta: 12,4 MB de 200 MB." (`fraseDoUso`, a soma dos arquivos da lista, arredondada para cima em 0,1 MB), ou só "Fica na sua conta." enquanto a lista não abriu. Quando a lista não abre, vira a `FalhaNoPainel` com a frase de `fraseDaLeitura`: "Sua sessão expirou, então a sua mídia não abriu.", "Sem conexão com a sua conta agora, então a sua mídia não abriu." ou "A sua mídia não abriu.". A lista que não abre é uma falha só, anunciada uma vez por painel (`anunciaFalha`): em Gráficos, só na seção Logo; Fundo e Sobreposição não mostram nada nesse estado. Já o arquivo que não chega a esta aba é da seção dele (`tipo`), e cada seção diz os seus, perto do quadrado que falhou: "Uma imagem não abriu nesta tela." ou "N imagens não abriram nesta tela." (no clipe, "Um clipe não abriu nesta tela." ou "N clipes não abriram nesta tela."). Nos dois casos, "Tentar de novo" lê a lista de novo e baixa de novo todo arquivo que não veio.
- **`FalhaNoPainel`:** a linha de falha de um painel (ao salvar, ao abrir a mídia ou um arquivo dela, ao tocar o clipe), com `role="alert"`: `CircleAlert` 16px e a frase em `text-sm` `--ink-hi`, terminada por "Tentar de novo" sublinhado.
- **`useSetasDoGrupo`:** o teclado de todo `radiogroup` de painel (cantos, imagens, cores). Só a opção marcada entra no Tab. As setas levam o foco à vizinha e a marcam, e Home/End vão às pontas. Numa grade, ↑/↓ pulam uma linha.
- **`Segmentado`:** ganhou `largura="cheia"`, que divide a largura da coluna por igual (nos painéis, todo segmentado é cheio), `desativado`, que apaga todas as opções a 45 % (a duração do cronômetro enquanto ele conta), e `ocupado`, que as deixa a 45 % e focáveis enquanto o pedido anda (a qualidade da câmera).

**Os painéis.**
- **Gráficos (`PainelGraficos`):** Banner, Ticker, Logo, Cronômetro, Cor dos gráficos, Fundo e Sobreposição.
  - **Banners e tickers:** listas da conta, com `divide-y`. Cada item mostra o texto (`text-sm` `--ink-hi`), o detalhe (`text-xs` `--ink-lo`: o subtítulo, "Selo: Aviso"), o estado e as ações: "Pôr no preview" ou "Tirar do preview" (fantasma `sm`), e "Editar" e "Excluir" (ações de texto `xs`). Excluir pergunta e avisa que o item no programa fica lá até o próximo corte. "Editar" e "Novo banner" abrem, no lugar, um formulário de dois campos numa borda `--line` de 16px de raio, com "Salvar o banner" fantasma e "Cancelar".
  - **Posição, velocidade e sentido:** segmentados cheios. Banner: Embaixo ou Em cima. Ticker: Lenta, Normal ou Rápida, e o texto anda para a Esquerda ou a Direita.
  - **Logo:** `GradeDeImagens`; com um logo escolhido, os ajustes dele: canto, tamanho (4 a 30 % da largura) e opacidade (20 a 100 %); depois o envio ("Enviar logo" e o erro dele) e a `NotaDaMidia`. Aceita PNG, JPEG, WebP ou SVG, e o SVG vai para a conta como PNG. A imagem enviada já fica escolhida.
  - **Cronômetro:** liga por `Switch`, com título opcional e duração em minutos (5, 10, 15 ou 30). A duração só troca com o relógio zerado ("Zere o cronômetro para trocar a duração."). O tempo fica em mono `text-base` `--ink-hi`, ao lado de "Iniciar", "Pausar" ou "Continuar" e de "Zerar".
  - **Cor dos gráficos:** mora em Gráficos. São seis cores prontas (`CORES_DOS_GRAFICOS`: Grafite, Branco, Azul, Verde, Amarelo e Roxo) num `radiogroup` de `grid-cols-6`, a marcada com borda `--ink-hi`, e "Outra cor", o seletor nativo em 44px, com a amostra. O padrão é o Grafite (`COR_PADRAO`), neutro, porque no estúdio o vermelho é do ar. A cor pinta a borda do card da câmera, o subtítulo do banner, o selo do ticker, o preço do QR code e a barra do cronômetro, com o texto em preto ou branco, o que tiver mais contraste (`corDoTextoSobre`). É cor da live, não do console: a Voz Única vale para os controles, não para a imagem que vai ao ar.
  - **Fundo e sobreposição:** `GradeDeImagens`, o envio ("Enviar fundo", "Enviar sobreposição"), o erro dele e a `NotaDaMidia`. O fundo aceita PNG, JPEG ou WebP; a sobreposição, que fica por cima do palco, só PNG ou WebP, os formatos com transparência. A dica diz onde cada um aparece. Excluir uma imagem pergunta antes: "O arquivo sai da sua conta, em todos os aparelhos. Se estiver no programa, continua lá até o próximo corte."
- **Roteiro (`PainelRoteiro`):** Teleprompter, "Roteiro do webinar …" (ou "Roteiro geral") e Notas, que o teleprompter não lê. Há um roteiro por webinar, salvo na conta.
- **QR code (`PainelQrCode`):** link, título e preço opcionais, canto e tamanho (8 a 24 % da largura). O `Switch` só liga com um link válido; sem esquema, o link ganha `https://` (`normalizarLink`). Um link inválido diz "Isso não parece um endereço da web. Confira o link." Sem link, a dica explica o `Switch` apagado: "Gerado neste navegador: o link não passa por nenhum serviço. Para mostrar o QR code, escreva o link abaixo." O canto padrão é em cima à esquerda (`QR_PADRAO`), o que o card, o logo e o banner deixam livre.
- **Mídia (`PainelMidia`):** os clipes de vídeo (MP4 ou WebM) numa lista `divide-y`. Cada linha tem o ícone `Film` de 16px, o nome, o estado, "Pôr no preview" ou "Tirar do preview" e "Excluir". As ações quebram de linha juntas, sem partir o texto de nenhuma (`whitespace-nowrap`). O clipe do programa diz, depois do ponto, o que foge de tocar: "pausado" (numa cena sem tela), "no fim" (com "Tocar de novo", que o recomeça do zero na hora, como iniciar o cronômetro; numa cena sem tela, "Voltar ao começo", que só volta, e o clipe toca quando a tela voltar, nunca som sem imagem) ou "parado", quando o navegador recusou o som numa cena com tela, com a `FalhaNoPainel` "O navegador não deixou o clipe tocar no programa." e "Tentar de novo". Um clipe que ainda não está nesta aba diz como vem, sob o estado, em `text-xs` `tabular-nums` `--ink-lo`: "Baixa da sua conta ao ir para o preview.", "Na fila para baixar da sua conta.", "Baixando da sua conta… N%" ou, quando não veio, "Não abriu nesta tela."; o que já chegou não diz nada. "Pôr no preview" num clipe sem cópia o baixa e o põe no preview assim que chega, e num clipe que não veio tenta de novo; enquanto o clipe procura a cópia, espera na fila ou baixa, o botão fica desativado. Vazio, diz "Nenhum clipe ainda."; enquanto a lista da conta não abre, a área da lista fica vazia, sem dizer "nenhum" antes de saber. Embaixo, o envio ("Enviar vídeo (MP4 ou WebM, até 50 MB)"), o erro dele e a `NotaDaMidia`. Excluir pergunta antes, com a mesma frase das imagens ("O arquivo sai da sua conta, em todos os aparelhos. Se estiver no programa, continua lá até o próximo corte.") e "Excluir o clipe". Excluir o clipe do preview também o tira do preview; o do programa segue lá até o próximo corte. A dica diz que o clipe toca no programa a partir do corte, com o som, e que trocar de cena não o recomeça: numa cena sem tela, ele pausa e continua quando a tela volta.
- **Apresentação em PDF (`SecaoDaApresentacao`, na aba Mídia, abaixo dos clipes):** um PDF do computador, aberto só neste navegador: o arquivo não vai para a conta e fecha com o estúdio, e a dica diz isso e que a página vale na hora nos dois monitores. Fechada, a seção é o `EnviarArquivo` tracejado "Abrir um PDF do computador", que vira "Abrindo o PDF…" e fica `ocupado` (sem aceitar outro arquivo) enquanto abre: um PDF de cada vez. Aberta, mostra o estado (`EstadoNoPalco`), o `FileText` de 16px, o nome truncado e "Página N de M" em `text-xs` `tabular-nums` `--ink-lo` (`aria-live="polite"`); a página numa caixa 16:9 de canto reto em `--stage` com borda `--line` ("Desenhando a página…" enquanto ela não chega); "Anterior" e "Próxima" fantasma `sm` lado a lado, com alvo de 44px, indisponíveis (`aria-disabled`, focáveis) na primeira e na última página; e "Pôr no preview" ou "Tirar do preview" (fantasma `sm`) com "Fechar o PDF" (ação de texto `xs`). Ela entra no lugar da tela, como o clipe, e um tira o outro do preview; se a cena do preview não usa a tela, vai para a cena Tela, e com ela no preview as cenas com tela não dizem "sem tela". O corte a leva ao programa. No programa, ela não fecha: no lugar de "Fechar o PDF", "No programa: tire com um corte para fechar.", porque o palco ficaria sem a página no ar. Foco: depois de abrir, vai a "Pôr no preview"; depois de fechar ou de uma falha, volta ao campo do arquivo. As falhas vão num `ErroDeCampo`, numa região `aria-live="polite"`, com a frase de `fraseDaFalhaDoPdf` e a saída: mais de 100 MB ("Exporte a apresentação com imagens menores e abra de novo."), não é PDF, pede senha ("Salve uma cópia sem senha e abra de novo."), o leitor não carregou ("Confira a conexão e tente de novo.") ou ilegível.
- **Câmera (`PainelCamera`):**
  - **Qualidade da câmera:** Resolução (720p ou 1080p) e Quadros por segundo (30 ou 60 qps), em segmentados cheios. São pedidos ao aparelho (`ideal`, por `src/lib/captura.ts`), e a dica diz o que ele entrega, lido da trilha: "A câmera entrega 1280 × 720 a 30 quadros por segundo. Cada aparelho chega até onde pode." Enquanto pede, "Pedindo à câmera…", e os dois ficam `ocupado` (a 45 %, focáveis); sem câmera, ficam `desativado`, e a dica diz "O navegador não liberou a câmera."; sem leitura, "A câmera não disse o que entrega." Um ajuste que o aparelho recusa avisa ("O aparelho não aceitou o ajuste", "O painel mostra o que ele está entregando agora."). Vale na hora, nos dois monitores, como o aparelho escolhido. O padrão é 720p a 30, o que o estúdio sempre pediu.
  - **Card da câmera:** canto, formato (Retângulo, Compacto ou Círculo) e tamanho (60 a 180 %), com "Voltar ao padrão". Só aparece na cena com card; fora dela, a dica diz onde o card aparece. O card vai pelo corte.
  - **Enquadramento:** zoom de 1 a 2,5×. Horizontal e vertical andam até onde o zoom deixa (`deslocamentoMaximo`); com zoom 1, os dois ficam desativados, e a frase diz "Aumente o zoom para mover o quadro."
  - **Espelhar a câmera** e **Croma:** o croma é verde ou azul, com tolerância, suavização da borda e reflexo, e "Voltar ao padrão do croma".
  - **Na hora:** enquadramento, espelho e croma valem na hora nos dois monitores.
- **Áudio (`PainelAudio`):** a seção Microfone diz qual aparelho capta ("{nome}. Para trocar, use o menu ao lado do microfone, na bandeja.") e, em palavras, que "O som ainda não vai para os canais, porque a transmissão não existe. Estes ajustes já valem no medidor da bandeja." Depois, uma `SecaoDoPainel` por processamento do navegador, com um `Switch` e a dica do que ele faz: Redução de ruído, Cancelamento de eco e Ganho automático, os três ligados por padrão, como o navegador faz sozinho. Mudar um troca a trilha de áudio por uma nova dentro do mesmo stream (`removeTrack` e `addTrack`), pedida ao microfone que a trilha usa de verdade (`getSettings().deviceId`), e não ao último pedido: o vídeo dos monitores não recarrega, e o medidor passa a ouvir a trilha nova. Um pedido de aparelho de cada vez: trocar de aparelho na bandeja e mudar a captura esperam um ao outro, e enquanto isso os três ficam ocupados. Um pedido que termina depois de sair do estúdio, ou noutro stream, fecha o que abriu. Mudo e câmera desligada valem em qualquer trilha que o stream tenha, inclusive a que chega no meio de um pedido. Quando a trilha lida diz outra coisa do que se pediu, a seção diz "Este microfone não aceitou a mudança." em `text-xs` `--ink-hi`, em vez de mostrar o pedido como feito. Se a trilha nova não vem, o microfone volta como estava ("O microfone não aceitou o ajuste", "Ele voltou como estava."); se nem isso vem, "O microfone parou", com a saída: escolher o microfone de novo na bandeja ou sair e entrar no estúdio. A leitura (`lerCaptura`) ignora trilhas que não estão `live`. Sem microfone, os três ficam desativados, e a frase diz como permitir o acesso.
- **Preferências:** os ajustes da câmera, a qualidade da captura e o processamento do som (`pw_captura_do_estudio`, conferidos por `capturaValida`), as larguras e o recolhimento das colunas (`pw_colunas_do_estudio`) e as escolhas dos painéis ficam neste navegador (`usePreferencia`). O QR code (link, título, preço, canto e tamanho) fica por conta (`pw_qr_do_estudio_{uid}`), e a imagem escolhida de logo, fundo e sobreposição também, guardada pelo id (`pw_midia_ativa_{uid}`), porque o endereço do arquivo nesta aba muda a cada visita. A escolha fica neste navegador; a imagem, na conta. O que estava no preview não volta sozinho: cada visita começa sem gráficos. As chaves antigas, sem dono (`pwstreamer_*` da mídia, `pw_hidden_templates`, `pw_qr_do_estudio`), o app apaga ao abrir.

**Os gráficos do palco (`GraficosDoPalco`).** O mesmo componente desenha o preview e o programa, cada um com o seu estado.
- **Medidas:** o palco (`.palco`) é um contêiner `palco / size`, e tudo se mede em `cqw` e `cqh`.
- **Área segura:** a das guias, com `--g-margem-x` em 6cqw e `--g-margem-y` em 7cqh.
- **Ticker:** `.palco--com-ticker` põe `--g-ticker` em 6,5cqh, e o que fica embaixo sobe acima dele.
- **Cores:** são da imagem, não do console. O fundo é `rgb(11 13 16 / 0.92)`, o texto é branco (e branco a 78 % no que é secundário), e o destaque vem na cor dos gráficos.
- **Mouse:** nada recebe o mouse (`pointer-events: none`).
- **Cantos:** logo e QR code ficam nos quatro cantos (`.grafico--{canto}`), dentro da área segura. O logo tem a largura em `cqw` e no máximo 22cqh.
- **Pilha do banner:** o banner e o comentário fixado ficam à esquerda, sem se cobrir (vão de 1,4cqh, no máximo 64cqw). Com o banner embaixo, ele fica colado à área segura, e o comentário sobe; com o banner em cima, cada um fica no seu lugar. O título do banner vai em 2,5cqw 600 sobre o fundo, e o subtítulo em 1,5cqw 500 na cor dos gráficos. O comentário mostra o autor sem "(Você)", que é das telas de quem opera.
- **Ticker:** a faixa inteira no pé da imagem (6,5cqh), com o selo em 1,6cqw 600 na cor e o texto em 1,9cqw 500. A travessia leva um tempo que cresce com o texto, não com o monitor (`duracaoDoTicker`), para o preview e o programa andarem igual. Com movimento reduzido, o texto fica parado, lido da esquerda.
- **QR code:** um cartão branco, que é o que o celular lê melhor, com o código em SVG, o título em 1,3cqw 600 e o preço em 1,5cqw 600 `tabular-nums`, na cor dos gráficos.
- **Cronômetro:** no meio da imagem, só com o título (1,7cqw) e o tempo (6,4cqw 600 `tabular-nums`), e uma barra de 0,6cqh na cor dos gráficos que encolhe com o que resta.

**O teleprompter (`Teleprompter.tsx`).** O leitor (`LeitorDoRoteiro`) fica no painel Roteiro, numa caixa de 192px em `--bg` com borda `--line` e 16px de raio, ou numa janela própria; nunca sobre o preview.
- **Janela:** "Abrir em janela" a abre no próprio clique, porque o navegador só abre janelas no gesto de quem clica. É um Picture-in-Picture de documento quando o navegador tem, e um popup quando não tem (960 × 360), no escopo console. Em cima ficam os controles: Tocar ou Pausar, − e + da velocidade, "velocidade N" em mono e "Fechar a janela".
- **Um estado só:** o leitor e a janela têm o mesmo estado, e trocar de um para o outro continua de onde parou.
- **Texto:** a linha dos olhos (1px em `--line-ctl`) fica a 40 % da altura. O texto vai em `--ink-hi` 500, com entrelinha 1,4, nos tamanhos P, M, G e GG (16, 20, 24 e 28px no painel; 28, 40, 56 e 72px na janela).
- **Velocidade:** de 1 a 10, proporcional ao tamanho do texto, para o ritmo ser o mesmo no painel e na janela. Conta o tempo entre quadros e para quando o texto acaba.
- **Espelho:** vale só na janela ("Espelhar na janela", para ler pelo vidro de um teleprompter).
- **Teclado:** no leitor, Espaço toca e pausa, e ↑/↓ mudam a velocidade.

**O clipe.** É fonte de cena, no lugar da tela. No programa, toca com som a partir do corte, sem os controles do navegador, num player só (`src/lib/playerDoClipe.ts`).
- **O player:** um `<video>` só, que nasce no corte que põe o clipe no programa (`criarPlayer`) e é solto no corte que o tira ou ao sair do estúdio (`soltarPlayer`). Um corte com outro clipe cria um player novo, que começa do zero; um corte com o mesmo clipe mantém o player, que segue de onde está.
- **A troca de cena:** o palco do programa encaixa o elemento na caixa da tela, e trocar de cena só muda a caixa: o clipe não recomeça. Numa cena sem tela (Câmera; `desenhaATela`), `ajustarPlayer` pausa o clipe, que continua de onde parou quando a tela volta. No fim, fica no último quadro: o evento `ended` zera o `tocando`, para uma caixa remontada (a janela passando do desktop ao celular) não recomeçar o clipe, e só "Tocar de novo", na Mídia, o recomeça. A situação (`situacaoDoClipe`: tocando, pausado, no fim ou bloqueado) vem dos eventos do próprio vídeo; numa cena sem tela é "pausado", mesmo depois de uma recusa do navegador, que pausar apaga. Nada toca o clipe numa cena sem tela.
- **Um de cada vez:** o clipe e a apresentação disputam o mesmo lugar, o da tela. Pôr um no preview tira o outro dele.
- **Os outros monitores:** o preview, quando traz o mesmo clipe, e a camada do programa que sai na Fusão desenham o quadro desse player num canvas (`EspelhoDoClipe`), a cada quadro novo e sem som. Um clipe que ainda não está no programa fica parado e mudo no primeiro quadro, que é de onde o corte o começa.

**A apresentação.** É fonte de cena, no lugar da tela, como o clipe, por `src/lib/apresentacao.ts` e `src/lib/useApresentacao.ts`. O pdf.js (cerca de 1,8 MB com o Worker) só baixa quando alguém abre um PDF; quem nunca usa a apresentação não o carrega ao entrar no estúdio, e uma falha de rede não fica guardada. É o build `legacy` (`pdfjs-dist/legacy/build/…`): o moderno do pdf.js 6 chama `Map.prototype.getOrInsertComputed`, `Math.sumPrecise` e `Promise.try` sem polyfill, e no Safari 18 o PDF abria e nenhuma página desenhava. Uma abertura que falha destrói a tarefa de carga, sem deixar Worker aberto, e um PDF que chega depois de outro pedido ou depois de sair do estúdio é solto na hora. Limite conhecido: imagens JPEG2000 e JBIG2 dentro de alguns PDFs não são decodificadas, porque os decodificadores em wasm do pdf.js não são servidos e a CSP não tem `'wasm-unsafe-eval'`. Cada página é desenhada uma vez, inteira dentro de 1920 × 1080, num PNG, e mostrada como imagem (`object-contain`, letterbox em `--stage`) em todo monitor cujo estado traz a apresentação. A atual, a anterior e as duas seguintes ficam prontas, para virar sem espera; as de longe são soltas. Ao virar, a página anterior fica na tela até a nova chegar, em vez de piscar o palco vazio. A página é uma só para a fonte (`PaginaMostrada`), e por isso o preview e o programa viram juntos.

**O QR code.** `CodigoQr` gera o código no navegador, com `uqr` (correção M e borda de dois módulos), e o desenha em SVG na cor do texto, sem serviço de terceiros e sem rede. A dica do painel diz isso: "Gerado neste navegador: o link não passa por nenhum serviço."

**Regra do Entregue, Não do Pedido.** Um ajuste pedido a um aparelho (resolução, quadros por segundo, processamento do som) é pedido, não garantia. O painel diz o que o aparelho entrega, lido da trilha (`lerCaptura`), e não o que se pediu: a câmera em "1280 × 720 a 30 quadros por segundo", o microfone em "Este microfone não aceitou a mudança." quando a leitura difere do interruptor. Um pedido recusado avisa em palavras e não deixa o aparelho pior do que estava.

**Regra do Onde Está.** Todo item que um painel põe no palco diz onde está, com as palavras das cenas: "no programa", "no preview" ou "no programa e no preview" (`ondeEsta`), logo sob o nome dele (`EstadoNoPalco`). O peso é o das cenas: com o item no programa, a frase fica em 500 `--ink-hi`; só no preview, em `--ink-lo`. Fora dos dois, nada. O que o item precisa vem depois de um ponto ("no preview · não salvo"). Vale para banners, tickers, clipes, imagens, o QR code e o cronômetro.

**O Salvo de Verdade nas listas.** Banners e tickers são listas da conta (`useListaDaConta`), cada uma numa coluna de `studio_settings`, gravadas inteiras por `gravarLista`, que passa por `gravarComConfirmacao`.
- **Preview antes, salvo depois:** o item novo ou editado já vai ao preview, mas só conta como salvo quando o banco confirma.
- **A última gravação decide:** uma resposta atrasada não desfaz a situação.
- **A assinatura segue a conta:** `assinarLista` lê a coluna e ouve o que outras abas e aparelhos gravam (Supabase Realtime, inserções e alterações); uma mudança que chega antes da leitura vale mais que ela. As exclusões não chegam por ali: quem exclui é a própria aba, que já tira o item. O que vem da conta não apaga uma mudança que a tela ainda não salvou. Os webinars e os canais da conta chegam do mesmo jeito (`subscribeWebinars`, `subscribeTransmissionSettings`).
- **A cópia do aparelho:** guarda só o que o banco confirmou, para a lista abrir antes de a conta responder. O que não foi salvo some ao recarregar, e a tela avisa.
- **Sob o item:** "não salvo", com `PenLine` 12px em `--ink-hi` (Regra do Erro em Tinta Alta), ou "salvando…" em `--ink-lo`.
- **Falha:** uma `FalhaNoPainel` embaixo da lista, com as frases de `FRASE_DA_FALHA_DA_LISTA`.
- **Roteiro:** fica em `public.teleprompter_scripts` (um por webinar, e o geral sem webinar) e é salvo por `salvarRoteiro` 1,2 s depois da última tecla. A linha sob o título diz "Abrindo o roteiro salvo…", "Alterado", "Salvando…" e, só depois da confirmação, "Salvo na sua conta às HH:MM"; sem roteiro, "Ainda não há roteiro salvo." As falhas usam `FRASE_DA_FALHA` ao salvar e `FRASE_DA_FALHA_AO_LER` quando o roteiro salvo não abriu. Nesse caso nada é salvo, para não sobrescrever o que está na conta. A resposta de um salvamento só muda a linha se nada foi digitado depois dele (a edição nova tem o seu próprio), e fechar o estúdio ou trocar de roteiro antes da pausa salva a última edição.

**Regra da Mídia na Conta.** A mídia do estúdio (logos, fundos, sobreposições e clipes) fica na conta, por `src/lib/midiaDaConta.ts`: o arquivo no bucket `media-assets` do Supabase, em `{uid}/{id}.{extensão}`, e uma ficha em `media_assets` com o tipo, o nome e o tamanho. As regras do banco e do bucket deixam cada conta ler, enviar e apagar só o que é dela, em qualquer aparelho. Um arquivo nunca é substituído: cada envio tem um caminho novo. A biblioteca (`MidiaDoEstudioProvider`, em volta só do `Estudio`, com `key` no uid) dá a cada arquivo que chegou um endereço desta aba.
- **A cópia do navegador:** cada navegador guarda uma cópia do que baixou ou enviou, no IndexedDB (`pwstreamer-midia`, versão 2, loja `copias`, chave no caminho do bucket), por `src/lib/midiaDoNavegador.ts`, para o estúdio abrir sem baixar tudo de novo. Como o caminho nunca muda, uma cópia nunca fica velha. Ao ler a lista, saem as cópias que não estão nela (de outra conta, ou excluídas em outro aparelho). Todas saem quando a pessoa sai da conta, quando a sessão acaba e quando outra conta entra noutra aba; daí até recarregar, nada mais é copiado. A cópia não trava nada: quando falha ou demora mais de 3 s, o arquivo vem da conta, sem aviso. A versão 2 apagou a mídia de antes, que ficava só no navegador e era das contas do Firebase.
- **A chegada (`ChegadaDaMidia`):** `abrindo` (procura a cópia), `na-conta` (um clipe sem cópia), `na-fila`, `baixando` (com o progresso de 0 a 100), `pronta` ou `falhou`. As imagens sem cópia baixam ao abrir o estúdio, uma de cada vez; um clipe sem cópia só baixa quando vai ao preview, porque baixar todos a cada entrada gastaria o tráfego do plano. Sem notícia por 30 s, o envio ou a descida conta como sem conexão. Um arquivo que não veio fica na lista como "não abriu": nada é apagado por isso, e excluir fica com a pessoa.
- **Salvo de Verdade:** um envio só conta quando o Storage e o banco confirmam (`gravarComConfirmacao`); só então o arquivo entra na lista, e a imagem enviada já fica escolhida. Se a ficha não entra, o arquivo sai do bucket. Excluir apaga o arquivo e depois a ficha, e só tira o item da lista quando os dois confirmam; excluir a imagem escolhida desfaz a escolha. Se a conta não confirma, o aviso "Não foi possível excluir {nome}" diz "Sua sessão expirou. Entre de novo para excluir.", "Sem conexão com a sua conta agora. Tente de novo.", "Não deu para confirmar a exclusão. Confira a conexão e tente de novo." ou "A sua conta não deixou apagar o arquivo. Tente de novo.", e o item fica.
- **Os limites:** 50 MB por arquivo (o limite do plano grátis do Supabase), 200 MB e 300 arquivos por conta. O envio recusa antes de subir o que passaria deles, contando os envios em andamento, e o banco cobra de novo (`MD001` para o espaço, `MD002` para os arquivos).
- **Os formatos:** logo em PNG, JPEG, WebP ou SVG; fundo em PNG, JPEG ou WebP; sobreposição em PNG ou WebP; clipe em MP4 ou WebM. O bucket não guarda SVG: o logo em SVG vira PNG antes de sair do navegador, com o maior lado em 2048px, desenhado como imagem, que não roda script. É o PNG que fica na conta, na cópia e na tela.
- **Falhas:** `formato`, `grande-demais`, `sem-espaco`, `muitos-arquivos`, `svg-invalido`, `sem-login`, `sem-conexao`, `sem-confirmacao` e `recusado`. `fraseDaFalhaDoEnvio` diz cada uma com a saída, com "a imagem" ou "o vídeo": "Este formato não entra aqui. Envie PNG, JPEG, WebP ou SVG." (os formatos do tipo), "A imagem passa de 50 MB, o limite por arquivo. Envie um arquivo menor.", "Não há espaço na sua conta para a imagem: a mídia guarda até 200 MB. Exclua um arquivo que não usa e envie de novo.", "A sua conta já guarda 300 arquivos de mídia, o limite. Exclua um que não usa e envie de novo.", "Não deu para converter este SVG em PNG. Envie o logo em PNG.", "Sua sessão expirou, então a imagem não foi enviada. Entre de novo para enviar.", "Sem conexão com a sua conta agora, então a imagem não foi enviada. Envie de novo.", "Não deu para confirmar que a imagem foi enviada. Confira a conexão e envie de novo." e "A sua conta não aceitou a imagem. Envie de novo." Um envio que dá certo com a lista ainda sem ler, ou com a leitura recusada, lê a lista de novo.
- **Sobras:** ao abrir, a conta desta aba tira da própria pasta os arquivos sem ficha, de envios que pararam no meio, só os com o nome que o estúdio dá e com mais de um dia. Sem nenhuma ficha, ou com a lista talvez cortada, nada sai.
- **Antes:** até a etapa 4 da migração, a mídia ficava só no navegador; antes disso, o envio "para a nuvem" caía, calado, em base64 no `localStorage` do aparelho, porque o Storage do Firebase nunca existiu. Agora a `NotaDaMidia` diz onde o arquivo fica e quanto a conta já guarda.

### Limites do plano
`src/lib/plans.ts` é a fonte única dos limites e dos preços. Os campos estruturados decidem; as frases de `features` só descrevem:
- `destinosSimultaneos`: canais ligados ao mesmo tempo (Plano Gratuito 2, Standard 3, Professional 5, Business 8).
- `participantes`: pessoas na tela (3, 6, 8, 12).
- `horasDeTransmissao`: horas de transmissão ao vivo dos pagos (3, 6, 10). O gratuito não tem.
- `rtmpProprio`: servidor RTMP próprio como destino, a partir do Standard.
- `priceMonthly` e `priceAnnual` (o anual é o preço por mês cobrado no ano, 20% menor em todos os pagos), sempre exibidos por `formatPrice` (BRL, `pt-BR`).

A frase de cada linha da lista de planos é montada desses campos por `limitesDoPlano`: canais e pessoas em todos os planos, e as horas de transmissão só nos pagos. As `features` só dizem o que o produto faz ou fará com o plano; nada de gravação nem de OBS e vMix enquanto não existirem. Nenhuma tela mantém a própria tabela de limites ou de preços nem escreve o nome do plano à mão: o nome vem do primeiro plano que libera o recurso.

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
- **Do** mostrar planos só por `<ListaDePlanos>` (também no site) e abrir planos só por `abrirPlanos` (página fora do estúdio, modal dentro dele).
- **Do** mostrar o produto no site só por captura real do app, com os dados de exemplo ditos na legenda, as datas absolutas e a proveniência no PNG; ao refazer a captura, medir as `REGIOES` de novo.
- **Do** dizer no site, em "Em breve", o que ainda não está no ar, e deixar em "Já funciona" só o que funciona.
- **Do** dizer em palavras o que ainda não abre ("A assinatura abre em breve…") e deixar a tela sem ação primária até abrir.
- **Do** colar número e unidade com espaço inseparável em textos que vão a linhas estreitas.
- **Do** marcar opções com `<CaixaDeSelecao>` (a linha inteira é o alvo e o nome), e nunca com um `<input type="checkbox">` solto.
- **Do** gravar horário como `startsAt` e derivar "Hoje/Amanhã" na tela com `rotuloDoHorario`.
- **Do** gravar só por `gravarComConfirmacao`, com a falha acima das ações (no rodapé do diálogo; no modal de canais, no detalhe) ou sob o item de uma lista, e mudar os canais só por `mudarCanais`, uma mudança de cada vez.
- **Do** abrir o modal de canais por id (`editarCanal(id)`) quando a origem é um canal, e nunca pela plataforma.
- **Do** levar links para fora do app por `<AcaoDeTexto href>`, que abre em outra aba e avisa o leitor de tela.
- **Do** desenhar o programa com o mesmo `StudioPreview` do preview (`papel="programa"`), alimentado pelo estado do último corte, e dizer em palavras, no próximo corte, o que o corte leva.
- **Do** pôr o papel e a cena de cada monitor no rótulo, fora da imagem, e dar a cada monitor o lugar da moldura inteira (palco em 16:9 mais o anel).
- **Do** medir a posição e o tamanho de todo gráfico do palco em fração do palco (`cqw`, `cqh` ou %), dentro da área segura, e manter o card da câmera dentro dele por `dentroDoPalco`.
- **Do** fazer todo gráfico passar pelo corte; só o enquadramento, o espelho, o croma, o relógio do cronômetro e a página da apresentação valem na hora, e a dica do painel diz qual é qual.
- **Do** dizer o que o aparelho entrega, lido da trilha, e não o que se pediu a ele.
- **Do** levar o foco ao controle seguinte quando o que tinha o foco sai da tela: ao que desfaz, nas cenas recolhidas; a "Pôr no preview" depois de abrir o PDF, e ao campo do arquivo depois de fechá-lo ou de uma falha.
- **Do** manter focável o controle que espera ou que está no limite (`ocupado`, `aria-disabled`), e reservar `disabled` ao que não responde.
- **Do** montar painel de coluna estreita com as peças de `PecasDoPainel`, com todo segmentado em `largura="cheia"`, e dizer sob cada item onde ele está (`EstadoNoPalco`).
- **Do** dar a todo `radiogroup` de painel o teclado de `useSetasDoGrupo`: uma parada no Tab, setas entre as opções.
- **Do** dizer o estado de uma cena e de um controle da bandeja em palavra, com `aria-current` ou `aria-pressed`, e a subida na rampa.
- **Do** checar todo par novo de texto/superfície nos três escopos: `npm run verify` roda tipos, stylelint, o portão de contraste (WCAG AA em escuro, claro e console), a catraca de dívida, os botões só-ícone e os rótulos de formulário. O mesmo roda no CI (`.github/workflows/design-system.yml`).

### Don't:
- **Don't** usar o azul da marca em estado, seleção, link, ícone ou destaque; ele é do botão da ação da tela.
- **Don't** usar o carmim fora do ar e das ações que apagam ou encerram: nada de vermelho em pendência, aviso, erro de campo, gráfico ou decoração.
- **Don't** montar a casca com cartões de indicador, fundos de bloco ou sombras em repouso.
- **Don't** usar tamanho de fonte em px avulso nem um quinto tamanho na casca; a catraca `tamanho-de-fonte-avulso` só pode descer.
- **Don't** pôr mais de uma ação visível por linha de lista; o resto vai para o "⋯".
- **Don't** colorir ícones de plataforma com as cores das marcas, nem dar o mesmo ícone a duas plataformas. O G do botão do Google é a única marca colorida.
- **Don't** pôr dois primários no mesmo viewport, nem dar cor a "Criar conta" no cabeçalho público.
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
- **Don't** espelhar só um monitor: o espelho é da câmera e vale no preview e no programa.
- **Don't** desenhar selo, etiqueta ou botão sobre a imagem de um monitor ("PRÉVIA", "AO VIVO", "PUSH TO LIVE"); o rótulo fica fora.
- **Don't** dimensionar gráfico do palco em px.
- **Don't** editar gráfico sobre a imagem, nem pôr o teleprompter sobre o preview: o painel edita, e o teleprompter lê no painel ou na janela.
- **Don't** guardar no aparelho, como salva, uma lista que o banco não confirmou, nem deixar mídia, a cópia dela ou QR code do estúdio sem dono, visível para quem entrar depois no mesmo navegador, nem apagar da conta um arquivo porque ele não baixou, nem mandar o link de um QR code a serviço de terceiros.
- **Don't** mostrar no estúdio o que ainda não existe: nada de ir ao ar, relógio de ar, gravação, telemetria nem aparelho "Simulado". O que falta vira frase.
- **Don't** pôr cor no console: nem no controle ligado, nem na tecla de transição, nem no medidor perto do limite.
- **Don't** subir número nenhum de `scripts/design-debt-baseline.json`. A catraca deixa a dívida cair e nunca crescer sem um `--update` visível na revisão.

### Fora do sistema (dívida conhecida)
Não sobra tela fora do sistema. A última que carregava o visual herdado do Google AI Studio, o super-admin, virou a Administração, e com ele saíram as análises, o monitor de desempenho e os webhooks. Os modais do estúdio saíram na fase 2, e a fase 3 fechou o estúdio; com ela saíram também a página pública do webinar e o editor de capas. Os sinais daquele visual eram tamanhos em px avulsos, `slate`/`gray`/`blue-500` crus, rótulos em caixa alta e sombras de brilho: se aparecerem numa tela, é dívida nova. A catraca continua medindo. Na linha de base atual, travada em `scripts/design-debt-baseline.json`:
- 1 tamanho avulso, o "ONLINE STUDIO" do logo;
- 13 `<button>` crus fora das primitivas;
- nenhum uso estrutural de `slate`/`gray`;
- nenhum `outline-none`;
- nenhum hex arbitrário em classe e 9 em atributo JSX;
- nenhum `z-index` avulso;
- 6 `!important` no CSS;
- nenhum diálogo nativo bloqueante.

As quatro cores do G do Google entram nos 9 em atributo JSX e ficam: são a marca do Google. Uma tela nova nasce das primitivas e dos papéis deste documento.

Dentro das superfícies redesenhadas, alguns desvios também ficam fora do sistema: o gatilho "⋯" do `Menu` (32px), o avatar da conta (32px) e o botão de fechar do `Modal` (cerca de 34px) estão abaixo do alvo de 44px, o chip tem 36px, o cabeçalho do app usa `z-30` em vez de `--z-sticky` (o público já usa o degrau), a borda de campo e de controle (`--line-ctl`) fica entre 1,38:1 e 2,30:1 contra as cinco superfícies nos três escopos (1,72–2,24:1 contra `--bg` e `--surface`, onde os campos pousam), abaixo dos 3:1 da WCAG 1.4.11 (o campo se lê pelo preenchimento `--well` e pelo rótulo, e a caixa de seleção não usa essa borda), e o polegar da barra de rolagem fica azul no hover. No console, o botão de fixar do chat (36px) e o gatilho de chevron dos aparelhos (36px de largura) também ficam abaixo dos 44px, o divisor de coluna tem 8px de alvo para o ponteiro (o teclado o alcança inteiro), e a borda do card da câmera vai na cor dos gráficos, escolhida em Gráficos. "Entrar ao vivo", na barra do estúdio, é um botão indisponível (`aria-disabled`) de algo que ainda não existe: a Regra da Vitrine sem Balcão pede uma frase no lugar de botão desabilitado, e os Don'ts pedem nada de ir ao ar. Ele não tem cor, não acende e diz o motivo, mas não é modelo de botão desabilitado para outra tela; sai quando a transmissão existir e ele virar o botão de ir ao ar, ou quando a decisão for revista. Nos painéis, as cores dos gráficos, em `grid-cols-6`, ficam com cerca de 41px no desktop (coluna de 264px), abaixo do alvo de 44px; no celular, cerca de 44px.

A linha "ONLINE STUDIO" do logo (9px, mono, caixa alta) faz parte da marca e não é modelo de rótulo. No site, o formulário de e-mail e senha de Entrar e Criar conta existe só em desenvolvimento, não autentica ninguém e não é modelo: o primário azul dele não conta como a ação da tela.
