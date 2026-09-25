---
version: 1
slug: "src-components-dashboard-tsx"
primary_target: "src/components/Dashboard.tsx"
related_targets: ["src/components/Header.tsx","src/App.tsx"]
---

# Casca + Painel

**Modo:** Operate.

**Público:** o anfitrião entre as lives.

**Tarefas:** ir ao ar e conectar canais. Agendar webinars é secundário, e a tela não mostra resultados (não há dados reais).

**Restrições:**
- Qualidade de vídeo, integrações, tema e admin saem do painel e do cabeçalho para Configurações.
- Canais começam vazios (sem os semeados).
- Nada de números inventados.
- O visual é o design system aprovado.

## Direction contract

THESIS: o painel é um lançador. Uma ação, entrar no estúdio, e o resto vira status. Recusa o painel de cartões de indicadores com tudo o que o produto sabe fazer.

OWN-WORLD:
- Rampa navy de 18 degraus.
- Cor só no botão de entrar (azul da marca) e no vermelho de "no ar".
- Linhas de 1px no lugar de cartões.
- Poppins em quatro tamanhos.
- Horários em mono tabular.

STORY: o anfitrião vê a próxima live, confere quais canais estão prontos, conserta o que falta num clique e entra no estúdio.

FIRST VIEWPORT:
- Barra fina: logo, Painel, Canais, Webinars, Configurações e conta.
- Coluna central estreita: título da próxima live grande, horário e canais da live, e "Entrar no estúdio" como botão largo.
- Logo abaixo, a linha de canais com o estado de cada um e "+ Conectar canal".

FORM: Lançador. Sexto na lista ordenada; semente 13186a15.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
