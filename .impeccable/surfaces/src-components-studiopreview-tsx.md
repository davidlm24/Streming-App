---
version: 1
slug: "src-components-studiopreview-tsx"
primary_target: "src/components/StudioPreview.tsx"
related_targets: ["src/App.tsx","src/components/Estudio.tsx","src/components/BarraDoEstudio.tsx","src/components/TrilhoDeCenas.tsx","src/components/MonitoresDoEstudio.tsx","src/components/PainelDoEstudio.tsx","src/components/BandejaDoEstudio.tsx","src/components/VirtualizedChat.tsx","src/components/GraficosDoPalco.tsx","src/components/CodigoQr.tsx","src/components/PecasDoPainel.tsx","src/components/PainelGraficos.tsx","src/components/PainelRoteiro.tsx","src/components/Teleprompter.tsx","src/components/PainelQrCode.tsx","src/components/PainelMidia.tsx","src/components/PainelCamera.tsx","src/lib/graficos.ts","src/lib/camera.ts","src/lib/useRoteiro.ts","src/lib/useListaDaConta.ts","src/lib/playerDoClipe.ts","src/components/Dashboard.tsx","src/components/WebinarLista.tsx","src/components/WebinarsPagina.tsx","src/components/CriarWebinarModal.tsx"]
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
- Fase 1 foi a casca: barra, trilho de cenas, programa e preview, coluna da direita e bandeja.

**Fase 2, os painéis (decidida com o usuário em 2026-09-29):**
- Todo gráfico que vai ao ar passa pelo corte e é medido em fração do palco: logo, banner, ticker, QR code, cronômetro, sobreposição, fundo e a cor dos gráficos. O programa guarda o conteúdo, e não ids.
- Clipes de vídeo são fonte de cena: parados no preview, tocando no programa a partir do corte, com som só ali.
- O teleprompter fica no painel Roteiro e numa janela própria, perto da câmera; nunca sobre o preview. O roteiro é salvo na conta, um por webinar.
- O QR code tem título e preço opcionais e é gerado no navegador.
- Saem capturas, lousa, chat flutuante, trilha sonora, presets de marca, estilo de texto e o modo claro do estúdio. Estilo vira Câmera; Extras sai do trilho.
- Os modais do estúdio ficam para a fase 3.

**Fase 3 (decidida com o usuário em 2026-09-30):** os modais do estúdio já tinham saído na fase 2, órfãos das abas apagadas.
- A página pública do webinar sai até existir o link público: só o anfitrião a abria, a inscrição ficava no navegador dele e a sala nunca recebia vídeo. Saem com ela o item "Página de inscrição", as frases que a prometiam e o campo Descrição do "Novo webinar" (Regra do Dado com Uso).
- O editor de capas sai até a capa ter uso: só baixava um JPG diferente da prévia, com fundos do Unsplash, e a capa não aparecia em lugar nenhum.
- O clipe do programa toca num player só, que muda de caixa entre as cenas sem recomeçar. Numa cena sem tela, pausa e continua quando a tela volta. O preview e a camada que sai na fusão desenham o quadro desse player.

**Momento memorável:** o corte. A cena escolhida vai para o preview, e ao lado dele está a lista do que muda no próximo corte; "Corte" ou "Fusão" leva tudo ao programa.

## Direction contract

THESIS: uma mesa de corte honesta para montar e ensaiar o programa. Recusa o painel que finge estar no ar.

OWN-WORLD: DESIGN.md no escopo console: rampa navy sempre escura, Poppins nos quatro tamanhos, linhas de 1px e nenhuma cor (o carmim é do ar, que ainda não existe).

STORY: abre o estúdio, confere câmera e microfone, escolhe a cena, corta para o programa, prepara os gráficos e sai.

FIRST VIEWPORT: barra de 48px (logo, sessão, "Sair do estúdio"); cenas e transição à esquerda; programa grande no centro, com o preview e o que muda no próximo corte embaixo; chat e ferramentas à direita; bandeja com microfone e medidor real, câmera, tela e guias.

FORM: console aprovado (FINAL-direction.html, Superfície 01); seed dispensada pelo usuário em 2026-09-28.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
