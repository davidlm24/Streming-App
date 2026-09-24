// Portao de CI: campo de formulario (input/select/textarea) sem nome
// acessivel falha o build. Sem nome, o leitor de tela anuncia so
// "caixa de edicao" ou "controle deslizante, 50" — nao diz o que o campo e.
//
// Tem nome se: aria-label, aria-labelledby, title, id apontado por um
// <label htmlFor> do mesmo arquivo, ou esta dentro de um <label>.
// placeholder NAO conta: some ao digitar e costuma ser exemplo
// ("Ex: Carlos"), nao rotulo.
//
// Tambem falha htmlFor / aria-labelledby apontando para um id que nao
// existe no arquivo — o rotulo "ligado" que nao liga nada.
//
// Por AST e nao por regex, pelo mesmo motivo de icon-buttons.cjs: a
// versao por regex deixou de fora os 21 sliders (type="range").
const ts = require(require.resolve('typescript', { paths: [process.cwd()] }));
const fs = require('fs');
const path = require('path');

function walkDir(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walkDir(p, acc);
    else if (e.name.endsWith('.tsx')) acc.push(p);
  }
  return acc;
}

const CAMPOS = new Set(['input', 'textarea', 'select']);
const SEM_ROTULO = new Set(['hidden', 'submit', 'button', 'reset', 'image']);

const temAttr = (el, nome) =>
  el.attributes.properties.some(p => ts.isJsxAttribute(p) && p.name.getText() === nome);
// so valor literal: id={algo} / aria-labelledby={x} nao da para conferir estaticamente
const lit = (el, nome) => {
  const a = el.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText() === nome);
  return a && a.initializer && ts.isStringLiteral(a.initializer) ? a.initializer.text : undefined;
};
const ehEl = n => ts.isJsxSelfClosingElement(n) || ts.isJsxOpeningElement(n);

/** O elemento renderiza algum texto? (JsxText ou {expressao} filha, nao atributo) */
function temTexto(el) {
  let achou = false;
  (function v(x) {
    if (achou) return;
    if (ts.isJsxText(x) && x.text.trim()) { achou = true; return; }
    if (ts.isJsxExpression(x) && x.expression && !ts.isJsxAttribute(x.parent)) { achou = true; return; }
    ts.forEachChild(x, v);
  })(el);
  return achou;
}

const achados = [];
for (const arq of walkDir('src')) {
  const src = fs.readFileSync(arq, 'utf8');
  const sf = ts.createSourceFile(arq, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const onde = n => `${arq.split(path.sep).join('/').replace('src/', '')}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;

  const ids = new Set();
  const refs = []; // [no, id] de htmlFor / aria-labelledby literais
  (function v(n) {
    if (ehEl(n)) {
      const id = lit(n, 'id');
      if (id) ids.add(id);
      if (n.tagName.getText() === 'label' && lit(n, 'htmlFor')) refs.push([n, lit(n, 'htmlFor')]);
      const lb = lit(n, 'aria-labelledby');
      if (lb) lb.split(/\s+/).forEach(r => refs.push([n, r]));
    }
    ts.forEachChild(n, v);
  })(sf);
  const htmlFors = new Set(refs.filter(([n]) => n.tagName.getText() === 'label').map(([, id]) => id));

  for (const [n, id] of refs) {
    if (!ids.has(id)) achados.push(`${onde(n)}  aponta para id="${id}", que nao existe no arquivo`);
  }

  (function v(n) {
    if (ehEl(n) && CAMPOS.has(n.tagName.getText())) {
      const tipo = lit(n, 'type');
      // className="hidden" = display:none: fora da arvore de acessibilidade.
      // (O <input type="file"> escondido e acionado por um botao — o botao
      // e que precisa de nome, e icon-buttons.cjs cobre isso.)
      const oculto = /(^|\s)hidden(\s|$)/.test(lit(n, 'className') || '');
      if (!(tipo && SEM_ROTULO.has(tipo)) && !oculto) {
        const id = lit(n, 'id');
        // <label> que envolve o campo so nomeia se tiver texto: o toggle
        // <label><input class="sr-only peer"/><div/></label> nao tem nenhum
        // (a primeira versao deste portao aceitava e deixou 7 toggles passar)
        let dentroDeLabel = false;
        for (let p = n.parent; p; p = p.parent) {
          if (ts.isJsxElement(p) && p.openingElement.tagName.getText() === 'label') { dentroDeLabel = temTexto(p); break; }
        }
        const temNome = temAttr(n, 'aria-label') || temAttr(n, 'aria-labelledby') ||
          temAttr(n, 'title') || (id && htmlFors.has(id)) || dentroDeLabel;
        if (!temNome) {
          const ph = lit(n, 'placeholder');
          achados.push(`${onde(n)}  <${n.tagName.getText()}${tipo ? ` type="${tipo}"` : ''}>${ph ? `  placeholder="${ph}"` : ''}`);
        }
      }
    }
    ts.forEachChild(n, v);
  })(sf);
}

achados.forEach(a => console.log(a));
console.log(`\ntotal: ${achados.length}`);
if (achados.length) {
  console.log('\nCampo precisa de nome: ligue o texto visivel com <label htmlFor> + id,');
  console.log('ou use aria-label quando nao houver rotulo na tela.');
  process.exit(1);
}
