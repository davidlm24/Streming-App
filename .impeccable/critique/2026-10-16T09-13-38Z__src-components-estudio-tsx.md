---
target: o estúdio (console de transmissão)
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:C:\\Dev\\Streming-App\\.claude\\worktrees\\ui-ux-audit-specialized-e9ef0f\\src\\components\\Estudio.tsx"
target_fingerprint: "sha256:5c0feba36a5ef16adf1f2689bdcdcc6b7d1bd452f49820605aefbea1c57b026d"
target_path: "C:\\Dev\\Streming-App\\.claude\\worktrees\\ui-ux-audit-specialized-e9ef0f\\src\\components\\Estudio.tsx"
timestamp: 2026-10-16T09-13-38Z
slug: src-components-estudio-tsx
---
Método: duas avaliações isoladas em paralelo (A: revisão de design · B: detector + navegador). Alvo: o estúdio (src/components/Estudio.tsx e o que ele monta), ramo claude/cor-do-console.

## Nota de saúde do design (heurísticas de Nielsen)

| # | Heurística | Nota | Problema-chave |
|---|---|---|---|
| 1 | Visibilidade do estado | 2 | Microfone e câmera aparecem ligados (azul, `aria-pressed`) com o navegador bloqueando os dois; "no ar" é um anel de 2px e um selo `xs` |
| 2 | Correspondência com o mundo real | 3 | Vocabulário de broadcast certo; "Câmera" quer dizer cinco coisas; a cena diz "no preview" no modo direto |
| 3 | Controle e liberdade | 2 | No modo direto todo clique vai ao ar sem desfazer; "Gerar um link novo" derruba a sala sem confirmar |
| 4 | Consistência e padrões | 2 | A mesa de corte mora no menu de resolução, com o mesmo ✓; o Preparar aponta para botões que somem no celular |
| 5 | Prevenção de erros | 2 | "Transmissão ✓ Pronta" e "Entrar ao vivo" ativos sem câmera nem microfone; a confirmação só nomeia os canais |
| 6 | Reconhecer em vez de lembrar | 2 | Seis cenas e seis controles só com ícone; o nome mora no `title` (sem hover no toque) |
| 7 | Flexibilidade e eficiência | 1 | Nenhum atalho de teclado num console de operação |
| 8 | Estética e minimalismo | 3 | Quieto e disciplinado; "Como a mesa funciona" fixo no Preparar; ~200px mortos sob as cenas |
| 9 | Reconhecer e se recuperar de erros | 3 | Os erros dizem o conserto, mas a saída é "entre de novo no estúdio", sem "Tentar de novo" |
| 10 | Ajuda e documentação | 2 | Ajuda em linha boa; sem guia da primeira live nem folha de atalhos |
| **Total** | | **22/40** | **Aceitável** |

## Veredito de especificidade do design

**Avaliação de design:** a composição é a do StreamYard/Restream, adotada de propósito, e um screenshot sem logo passaria por outro estúdio no navegador. A especificidade mora na linguagem e nas regras: "No próximo corte" em palavras, "Fora do ar: nada está sendo transmitido.", o checklist "Antes de começar" e a disciplina do carmim. O único momento que poderia ser próprio do produto, estar no ar, é o menos desenhado.

**Varredura determinística:** o CLI deu 0 achados nos 14 arquivos do estúdio, mas só com regex (ele mesmo avisa que contraste, texto miúdo e regras de elemento não rodam em .tsx). Na página renderizada, 4 vistas (como abre, Gráficos, mesa de corte ligada, 375px): `gradient-text` no logo (falso positivo: o DESIGN.md o permite só no logo), `overused-font` Inter a 94% (falso positivo de gosto: Inter é a escolha documentada), `flat-type-hierarchy` 12/14px com passo 1,17:1 (verdadeiro mas baixo: cumpre a Regra dos Quatro Tamanhos; os títulos de monitor e de painel só se distinguem pelo peso), `repeating-stripes-gradient` advisory no medidor (falso positivo: são os segmentos funcionais). Nenhum achado de contraste, alvo de toque ou layout.

**Sobreposição visual:** a injeção no painel do navegador foi recusada pela própria CSP do app (`script-src 'self'`), então não há sobreposição confiável visível na aba "[Human] estúdio". A varredura renderizada rodou num Chrome sem janela com a CSP contornada só para o teste.

## Impressão geral

Um console sério e honesto, que se lê bem sob pressão. Os defeitos não são de gosto: são de verdade do estado (dizer pronto quando não está), do momento no ar (tímido) e das bordas (celular, teclado, 1024px). A maior oportunidade é fazer o estado "no ar" e o "o que falta" serem impossíveis de ignorar.

## O que funciona

1. **"No próximo corte" em palavras** ("Entra o banner: …"; "Nada muda: o preview está igual ao programa."), com Corte e Fusão acendendo só quando há o que levar. O elemento mais específico e útil sob pressão.
2. **Disciplina de cor:** carmim só no ar, azul só na ação e na seleção, o resto na rampa; o palco em preto puro salta do marinho.
3. **Honestidade operacional:** "Fora do ar", "Ensaio local", a cena sem tela que explica o conserto, a resolução travada com a saída em uso.

## Problemas prioritários

1. **[P0] A pílula e o Preparar mentem sobre câmera e microfone, e o estúdio deixa entrar ao vivo assim.** `BandejaDoEstudio.tsx:156, 173` (`aria-pressed={!mudo}` sem olhar a trilha); `PainelPreparo.tsx:148-153` e o impedimento do `Estudio` só olham canais e motor. Com o navegador bloqueando, o operador vê tudo azul e "Pronta", entra ao vivo, e o público recebe uma live muda com "Sem imagem da câmera" desenhado no vídeo. → terceiro estado "indisponível" na pílula (ícone de alerta, `--ink-hi`, nunca `--sel`); "Transmissão" em atenção sem câmera/microfone; a confirmação lista o que falta e vira "Entrar mesmo assim"; "Tentar de novo" no Preparar. `/impeccable harden`
2. **[P1] O estado "no ar" é o momento menos desenhado.** Só um anel carmim de 2px e um selo `xs`; a visão periférica não pega isso em horas de live. → faixa carmim de 2–3px na borda de baixo da barra, "Ao vivo" e o tempo em `text-sm` 600 junto de "Encerrar", ponto do tally maior na cena do programa — tudo dentro da Regra do Ar. `/impeccable bolder`
3. **[P1] No celular não dá para entrar, encerrar nem sair.** "Entrar ao vivo", "Encerrar" e a saída são `hidden sm:inline-flex`; "Sair do estúdio" sai da tela a 375px (o `h1` é `shrink-0`); a pílula some ao rolar até as ferramentas. → ação do ar sempre visível na faixa de 44px; `h1` com `min-w-0`; pílula fixa no pé da tela. `/impeccable adapt`
4. **[P1] Zero atalhos de teclado num console de operação.** → 1–6 para as cenas, Enter/Espaço para Corte/Fusão na mesa de corte, M e V para mudo e câmera, com `aria-keyshortcuts`, a tecla no `title` e uma folha "?"; desligados dentro de campos de texto. `/impeccable shape`
5. **[P2] A 1024px a hierarquia se inverte, e a mesa de corte encolhe o programa.** Programa de 343×195 menor que o painel de 368px; a pílula quebra em duas linhas. Com a mesa ligada a 1366, o programa cai de ~810 para 500×283. → abaixo de 1280 o trilho da sala recolhe e o painel abre a 304px; na mesa larga, programa e preview lado a lado. `/impeccable layout`

## Alertas por persona

- **Alex (usuário avançado):** nenhum atalho; a mesa de corte enterrada no menu "Saída"; Corte e Fusão só por mouse ou Tab; cenas sem número nem nome visível.
- **Sam (depende de acessibilidade):** o menu "Saída" não diz qual resolução está ativa nem se a mesa de corte está ligada (`menuitem` com ✓ `aria-hidden`); a pílula anuncia "Microfone, pressionado" sem microfone; as cenas dizem "no preview" no modo direto.
- **Casey (distraída, no celular):** não entra nem encerra o ar; "Sair do estúdio" fora da tela; a pílula some ao rolar; as cenas quebram em 5 + 1; os nomes dependem de `title`.
- **Operador na primeira live, nervoso:** vê "Transmissão ✓ Pronta" e a pílula azul com o microfone bloqueado; no modo direto, qualquer clique em cena, "Pôr no programa" ou tile do trilho vai ao ar sem aviso de que o ensaio acabou; "Gerar um link novo" ejeta o convidado; o fim da live é um aviso que some.

## Observações menores

Texto de operador vai ao público ("Sem imagem da câmera", "Câmera desligada", "Saiu da sala" desenhados no canvas do programa), e a silhueta tem proporção diferente no preview e no canvas; o menu "Saída" quebra "Saída em 720p / (HD)" e não separa a resolução do interruptor da mesa; o Painel no celular cita um botão que não existe nessa largura; os controles de zoom e enquadramento ficam ativos sem câmera; "Como a mesa funciona" deveria recolher depois da primeira sessão; Gráficos pede rolagem longa no meio da live.

## Perguntas para pensar

1. Se o padrão é cortar direto, onde o operador ensaia depois que já está no ar? Entrar ao vivo não deveria oferecer a mesa de corte, ou ao menos mudar o tom dos cliques que vão ao ar?
2. Se a geometria é a do Restream, o que faria alguém reconhecer o PwStreamer num screenshot? Por que o candidato óbvio, o estado no ar, é hoje o momento mais tímido da interface?
3. Das nove ferramentas, quais o operador toca durante a live? O trilho não deveria se reorganizar quando o estado passa de ensaio para no ar?
