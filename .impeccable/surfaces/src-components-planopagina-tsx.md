---
version: 1
slug: "src-components-planopagina-tsx"
primary_target: "src/components/PlanoPagina.tsx"
related_targets: ["src/components/PlansModal.tsx","src/lib/plans.ts","src/App.tsx"]
---

# Plano e cobrança

**Modo:** Operate.

**Público:** o anfitrião em teste grátis (no alpha, todos estão).

**Tarefa:** saber o que o plano dele permite, quanto tempo de teste resta, o que acontece no fim e quanto custa cada plano.

**Restrições (decididas com o usuário em 2026-09-25):**
- A assinatura aparece como "em breve", sem checkout. A ativação automática do plano (webhook do Stripe) não existe em produção, então ninguém pode pagar sem receber o plano.
- Faturas e consumo ficam fora até existirem de verdade.
- "Dados de cadastro" vira página própria, redesenhada em seguida.
- Preços e limites vêm só de `src/lib/plans.ts`.
- O modal de planos do estúdio segue a mesma regra e usa a mesma lista.

**Momento memorável:** trocar Mensal/Anual reescreve os preços das linhas, com o total do ano dito por extenso.

## Direction contract

THESIS: o que eu tenho, o que existe, quando posso assinar. Sem checkout de mentira, faturas inventadas nem consumo de enfeite.

OWN-WORLD: DESIGN.md: coluna de 768px, seções abertas por linha; planos em linhas de ação que expandem a lista completa; o atual dito em palavra; sem cor, porque não há ação primária enquanto a assinatura não abre.

STORY: vê o plano e os dias de teste, entende o fim do teste, compara os planos pelos limites e sabe que a assinatura abre em breve.

FIRST VIEWPORT: "Plano e cobrança"; Seu plano: nome, dias restantes, o que acontece no fim; Planos: Mensal/Anual à direita e quatro linhas com preço e limites. Perguntas abaixo.

FORM: Uma coluna com seções. Quinto na lista ordenada; semente 6ed0d5c6.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
