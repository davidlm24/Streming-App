/// <reference types="vite/client" />

// Este arquivo não existia. Sem ele o TypeScript não conhece
// `import.meta.env`, e era por isso que o projeto escrevia
// `Boolean((import.meta as any)?.env?.DEV)` — o cast silenciava o erro de
// tipo, mas o optional chaining impedia o Vite de substituir a expressão por
// `false` no build. Resultado: `IS_DEV` virava variável de runtime e os
// ramos de desenvolvimento (cartão de teste, chave PIX de sandbox, botões de
// simulação) continuavam dentro do bundle de produção, só invisíveis.
//
// Com a referência de tipos correta, `import.meta.env.DEV` é escrito direto,
// o Vite troca por `false` e o esbuild remove o ramo inteiro.
