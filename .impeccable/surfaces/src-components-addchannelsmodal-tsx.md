---
version: 1
slug: "src-components-addchannelsmodal-tsx"
primary_target: "src/components/AddChannelsModal.tsx"
related_targets: ["src/App.tsx","src/lib/plans.ts"]
---

# Modal de canais

**Modo:** Operate.

**Público:** o anfitrião preparando a live, com o painel de transmissão da plataforma aberto em outra aba.

**Entradas:** pendência de canal e "+ Conectar canal" no Painel; "Conectar canal" e "Editar servidor e chave" em Canais; "Adicionar canais" no estúdio.

**Tarefa:** conectar ou editar um canal. Escolher a plataforma, colar o servidor e a chave que ela mostra e salvar. Quem chega por uma pendência já vem com a plataforma escolhida e o foco no campo que falta.

**Restrições (decididas com o usuário em 2026-09-25):**
- Só conectar e editar. Ligar e desligar ficam na página Canais e no estúdio.
- "Servidor próprio (RTMP)" é a nona opção, a partir do Standard.
- No limite de canais ligados do plano, o canal é salvo desligado e a tela explica por quê.
- Limites e disponibilidade vêm de `src/lib/plans.ts`.
- Um canal por plataforma.

**Momento memorável:** trocar de plataforma à esquerda troca o formulário à direita sem perder o que já foi digitado nas outras.

**Em aberto:** o limite do plano ainda não vale no liga/desliga (Canais e estúdio).

## Direction contract

THESIS: colar a chave que a plataforma mostra. Mestre-detalhe no lugar da grade de logos coloridos, do diálogo aninhado e da lista repetida.

OWN-WORLD: DESIGN.md: --surface e linhas de 1px; plataformas em linhas, ícone monocromático e estado em palavra; escolhida em --raise; cor só em Salvar; Poppins xs/sm/base.

STORY: chega pela pendência já no campo que falta, ou escolhe, abre o painel oficial, cola e salva; a tela diz se ficou ligado ou desligado pelo plano.

FIRST VIEWPORT: diálogo xl: título e fechar; um terço, nove plataformas; dois terços, onde achar a chave, Nome, Servidor, Chave; rodapé Cancelar e Salvar. Assinatura: trocar de plataforma guarda o rascunho. Celular: lista, depois formulário.

FORM: Mestre-detalhe. Quarto na lista ordenada; semente 6a3eecbe.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
