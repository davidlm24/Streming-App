---
version: 1
slug: "src-components-studiopreview-tsx"
primary_target: "src/components/StudioPreview.tsx"
related_targets: ["src/App.tsx","src/components/BarraDoEstudio.tsx","src/components/TrilhoDeCenas.tsx","src/components/MonitoresDoEstudio.tsx","src/components/PainelDoEstudio.tsx","src/components/BandejaDoEstudio.tsx","src/components/VirtualizedChat.tsx","src/components/LeftSidebar.tsx"]
---

# Estúdio (console de corte)

**Modo:** Operate.

**Quem usa:** o operador, antes da live: monta as cenas, confere câmera e microfone, prepara gráficos e ensaia os cortes.

**Tarefa:** deixar o programa pronto: escolher a cena no preview, cortar para o programa, ligar gráficos e teleprompter, sem sair do estúdio.

**Restrições (decididas com o usuário em 2026-09-28):**
- Base: o console aprovado de `mockups/FINAL-direction.html` (Superfície 01), traduzido para o DESIGN.md: Poppins, a rampa navy no escopo console e as primitivas.
- "Entrar no ar" sai até a transmissão existir: sem tally, relógio de ar, gravação automática nem relatório. A bandeja diz "Transmitir para os canais ainda não está no ar."
- Tudo o que é simulado sai: gravação, dispositivos "Simulado", slides e telas falsas, "+500 msgs", audiência de teste, convite com link morto, indicadores inventados, o rótulo "Gemini" quando não é, "Simular 30 dias".
- O estúdio começa vazio: nenhum ticker, banner, logo, fundo ou overlay de terceiros.
- Câmera e microfone só são pedidos no estúdio e se desligam ao sair.
- Fase 1 é a casca: barra, trilho de cenas, programa e preview, coluna da direita e bandeja. Os painéis de ferramentas e os modais ficam para as fases 2 e 3.

**Momento memorável:** o corte. A cena escolhida vai para o preview, e ao lado dele está a lista do que muda no próximo corte; "Corte" ou "Fusão" leva tudo ao programa.

## Direction contract

THESIS: uma mesa de corte honesta para montar e ensaiar o programa. Recusa o painel que finge estar no ar.

OWN-WORLD: DESIGN.md no escopo console: rampa navy sempre escura, Poppins nos quatro tamanhos, linhas de 1px e nenhuma cor (o carmim é do ar, que ainda não existe).

STORY: abre o estúdio, confere câmera e microfone, escolhe a cena, corta para o programa, prepara os gráficos e sai.

FIRST VIEWPORT: barra de 48px (logo, sessão, "Sair do estúdio"); cenas e transição à esquerda; programa grande no centro, com o preview e o que muda no próximo corte embaixo; chat e ferramentas à direita; bandeja com microfone e medidor real, câmera, tela e guias.

FORM: console aprovado (FINAL-direction.html, Superfície 01); seed dispensada pelo usuário em 2026-09-28.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
