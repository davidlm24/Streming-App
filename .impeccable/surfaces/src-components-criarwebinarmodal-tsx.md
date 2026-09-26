---
version: 1
slug: "src-components-criarwebinarmodal-tsx"
primary_target: "src/components/CriarWebinarModal.tsx"
related_targets: ["src/App.tsx","src/lib/horario.ts"]
---

# Agendar webinar

**Modo:** Operate.

**Público:** o anfitrião planejando a próxima live.

**Tarefa:** dar nome, dia e hora, e dizer para onde a live vai.

**Restrições (decididas com o usuário em 2026-09-26):**
- Sai o campo Tipo: tudo vira webinar. O vídeo pré-gravado sai até existir (o upload era simulado e prometia transcoding que não existe); webinar e live não mudavam nada no app.
- Canais: as plataformas nomeadas do modal de canais, com as conectadas marcadas. A planejada e não conectada aparece no Painel como "não conectado".
- Data e hora de verdade (`startsAt`). "Hoje"/"Amanhã" é derivado na tela, nunca gravado.

**Momento memorável:** o formulário já abre com as plataformas dos canais ligados marcadas — começa dizendo para onde a live vai hoje.

## Direction contract

THESIS: agendar é dizer quando e para onde; nada de upload simulado, redes inventadas ou horário em texto livre.

OWN-WORLD: DESIGN.md: `Modal` `md` da primitiva; campos de 44px com rótulo acima; plataformas em duas colunas, com ícone e estado; azul só no botão de agendar.

STORY: dá título, dia e hora, confere as plataformas e agenda; lista e Painel mostram "Amanhã, às 20:00".

FIRST VIEWPORT: "Novo webinar"; Título; Data e Hora lado a lado; Descrição; Canais; rodapé com Cancelar e Agendar webinar.

FORM: extensão do formulário da casca. Sem sorteio: o new-work não roda o concept-seed para "a local extension or a precisely specified narrow request"; tipo e canais vieram do usuário; o horário, do modelo (startsAt).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
