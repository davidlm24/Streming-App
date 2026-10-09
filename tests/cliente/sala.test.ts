// A grade do palco e o token da sala: o que dá para conferir sem navegador.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALTURA_DO_PALCO, LARGURA_DO_PALCO, caixasDaGrade } from '../../src/lib/palco/medidas.ts';
import { TOKEN_DE_SALA, novoTokenDeSala } from '../../src/lib/sala/malha.ts';

test('a grade dá uma caixa 16:9 por pessoa, dentro do palco e sem sobreposição', () => {
  for (let n = 1; n <= 12; n++) {
    const caixas = caixasDaGrade(n);
    assert.equal(caixas.length, n, `${n} pessoas`);
    for (const c of caixas) {
      assert.ok(c.x >= -0.01 && c.y >= -0.01 && c.x + c.w <= LARGURA_DO_PALCO + 0.01 && c.y + c.h <= ALTURA_DO_PALCO + 0.01, `${n}: dentro do palco`);
      assert.ok(Math.abs(c.w / c.h - 16 / 9) < 0.01, `${n}: 16:9`);
    }
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const a = caixas[i];
        const b = caixas[j];
        const separadas = a.x + a.w <= b.x + 0.01 || b.x + b.w <= a.x + 0.01 || a.y + a.h <= b.y + 0.01 || b.y + b.h <= a.y + 0.01;
        assert.ok(separadas, `${n}: as caixas ${i} e ${j} não se cobrem`);
      }
  }
});

test('uma pessoa fica com o palco inteiro; duas, lado a lado do mesmo tamanho', () => {
  assert.deepEqual(caixasDaGrade(1), [{ x: 0, y: 0, w: LARGURA_DO_PALCO, h: ALTURA_DO_PALCO }]);
  const [a, b] = caixasDaGrade(2);
  assert.equal(Math.round(a.w), Math.round(b.w));
  assert.equal(a.y, b.y);
  assert.ok(a.x < b.x);
});

test('a última fileira incompleta fica centrada, como no Meet', () => {
  const tres = caixasDaGrade(3);
  const sozinha = tres[2];
  const centro = sozinha.x + sozinha.w / 2;
  assert.ok(Math.abs(centro - LARGURA_DO_PALCO / 2) < 1, `centro em ${centro}`);
});

test('o token da sala é imprevisível e tem a forma que a rota aceita', () => {
  const a = novoTokenDeSala();
  const b = novoTokenDeSala();
  assert.ok(TOKEN_DE_SALA.test(a) && TOKEN_DE_SALA.test(b));
  assert.notEqual(a, b);
  assert.equal(TOKEN_DE_SALA.test('abc'), false);
  assert.equal(TOKEN_DE_SALA.test(`${a.slice(0, 31)}G`), false, 'nada fora de hex');
});
