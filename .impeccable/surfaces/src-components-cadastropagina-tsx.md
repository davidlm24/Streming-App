---
version: 1
slug: "src-components-cadastropagina-tsx"
primary_target: "src/components/CadastroPagina.tsx"
related_targets: ["src/lib/firestoreService.ts","src/App.tsx"]
---

# Dados de cadastro

**Modo:** Operate.

**Público:** quem tem conta (no alpha, o dono testando). Visita rara: conferir, às vezes trocar o nome.

**Tarefa:** saber como aparece no app e com que conta entra; trocar o nome quando precisar.

**Restrições (decididas com o usuário em 2026-09-25):**
- Os dados fiscais (razão social, CPF/CNPJ, endereço de cobrança) saem até a cobrança abrir. O que o formulário antigo guardou no navegador é apagado.
- O nome é salvo no perfil no banco (as regras deixam o dono trocar só nome e foto), e a página só diz "salvo" depois de o banco confirmar.
- O e-mail é o do login com Google: só leitura, com a frase de onde ele vem.

**Momento memorável:** a linha do nome vira o campo no mesmo lugar. O rótulo fica, o valor vira o campo, e Cancelar e Salvar aparecem embaixo.

## Direction contract

THESIS: um registro de quem você é no app, não um formulário para preencher. Duas linhas de fato; editar é a exceção.

OWN-WORLD: DESIGN.md: coluna de 768px, lista fechada por linhas; rótulo `text-sm` 500 em tinta alta, valor em `--ink`; "Editar" como ação de texto. Sem cor em repouso: o azul só aparece em "Salvar nome", durante a edição.

STORY: confere nome e e-mail, entende de onde vem o e-mail, troca o nome e vê a troca confirmada só depois de gravada.

FIRST VIEWPORT: "Dados de cadastro"; 48px abaixo, a lista: Nome (valor, "Editar" à direita) e E-mail (valor e a frase da conta Google).

FORM: extensão da coluna de páginas da casca, sem sorteio (pedido estreito).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
