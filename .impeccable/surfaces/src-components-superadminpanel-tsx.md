---
version: 1
slug: "src-components-superadminpanel-tsx"
primary_target: "src/components/SuperAdminPanel.tsx"
related_targets: ["src/App.tsx","src/components/AppHeader.tsx","src/components/ConfiguracoesPagina.tsx","src/lib/firestoreService.ts"]
---

# Administração (super-admin)

**Modo:** Operate.

**Público:** a administração da plataforma (interno), com o papel de super-admin.

**Tarefa:** ver quem está cadastrado na plataforma, com o plano e o teste de cada um.

**Restrições (decididas com o usuário em 2026-09-30):**
- Sai tudo o que não tem dado real nem uso:
  - a aba Uso (clientes, gravações, tráfego e cotas inventados);
  - Servidores e o monitor de desempenho (CPU e bitrate sorteados, "100% Online · MediaMTX / Nginx RTMP" sem ingest);
  - os Webhooks (histórico de exemplo, receptor simulado, segredos no código);
  - a aba Webinars, que só mostrava os webinars do próprio admin. As rotas de webhook no servidor saem depois do #9.
- Enquanto não há ingest, a administração mostra só a lista de clientes, sem ações. As chaves de transmissão e o registro de auditoria voltam com o ingest, feitos pelo servidor (o navegador os gravava direto no banco, e a auditoria tinha registros que não aconteceram).
- O redesenho é só a interface e o trecho do admin no `firestoreService`. Regras, servidor, `api/` e login ficam com o #9, que traz o admin de verdade (papel pelo servidor, `isAdmin()` nas regras). O #17 é fechado: sem webhooks, ele perde o objeto.
- O papel e a situação gravados no perfil não são lidos: o teste sai de `trialEndsAt`, na hora de mostrar (Regra do Horário Derivado).
- As coleções `rtmpKeys` e `auditLogs` antigas são apagadas pelo usuário no console do Firebase; o app não apaga auditoria.

**Momento memorável:** nenhum de propósito. É uma lista honesta, que diz o que ainda não existe.

## Direction contract

THESIS: a administração é uma lista de leitura, na mesma casca das outras páginas. Recusa o "painel de controle mestre" de indicadores inventados.

OWN-WORLD: o sistema do DESIGN.md sem nada próprio: `Pagina`, `CabecalhoDePagina`, seção aberta por linha, lista `divide-y`, um campo de busca do sistema. Nenhuma cor, nenhum cartão.

STORY: o admin abre a Administração pelo menu da conta, busca um cliente pelo nome ou e-mail e vê o plano e até quando vai o teste.

FORM: Registro em lista. Sem rodada de seed: é uma extensão do sistema a partir do código (casca, seção e lista já existentes), com as decisões do usuário de 2026-09-30; o usuário não foi consultado sobre a seed.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
