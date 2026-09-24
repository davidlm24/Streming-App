// Portao de CI: <button> so-icone sem NENHUM nome acessivel (aria-label,
// aria-labelledby ou title) falha o build.
//
// Por AST e nao por regex: regex nao ve texto dentro de
// {cond ? <>...Salvo!</> : ...} — chaves aninhadas quebram qualquer padrao.
// A primeira versao, por regex, acusou 67 botoes, com dezenas de falsos
// positivos. O compilador do TypeScript le o JSX como o React le.
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

const tagName = (el) => el.tagName.getText();

/** O no (ou qualquer descendente) produz texto visivel? */
function produzTexto(node) {
  let achou = false;
  (function visita(n) {
    if (achou) return;
    if (ts.isJsxText(n) && n.text.trim()) { achou = true; return; }
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateExpression(n)) {
      // string literal so conta se for FILHO renderizado, nao atributo (className etc.)
      if (!temAncestralAtributo(n)) { achou = true; return; }
    }
    if (ts.isPropertyAccessExpression(n) && ts.isJsxExpression(n.parent)) { achou = true; return; }
    if (ts.isIdentifier(n) && ts.isJsxExpression(n.parent)) { achou = true; return; }
    if ((ts.isJsxSelfClosingElement(n) || ts.isJsxOpeningElement(n)) && tagName(n) === 'PwStreamLogo') {
      achou = true; return;
    }
    // aria-label / title num filho (ex.: <span aria-label>) tambem nomeia
    ts.forEachChild(n, visita);
  })(node);
  return achou;
}

function temAncestralAtributo(n) {
  for (let p = n.parent; p; p = p.parent) {
    if (ts.isJsxAttribute(p)) return true;
    if (ts.isJsxElement(p) || ts.isJsxFragment(p)) return false;
  }
  return false;
}

function temIcone(node) {
  let achou = false;
  (function visita(n) {
    if (achou) return;
    if (ts.isJsxSelfClosingElement(n) && /^[A-Z]/.test(tagName(n))) { achou = true; return; }
    ts.forEachChild(n, visita);
  })(node);
  return achou;
}

const achados = [];
for (const arq of walkDir('src')) {
  const src = fs.readFileSync(arq, 'utf8');
  const sf = ts.createSourceFile(arq, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  (function visita(n) {
    if (ts.isJsxElement(n) && tagName(n.openingElement) === 'button') {
      const attrs = n.openingElement.attributes.properties
        .filter(ts.isJsxAttribute).map(a => a.name.getText());
      const temNome = attrs.some(a => ['aria-label', 'aria-labelledby', 'title'].includes(a));
      const filhos = n.children;
      const texto = filhos.some(produzTexto);
      const icone = filhos.some(temIcone);
      if (!temNome && !texto && icone) {
        const { line } = sf.getLineAndCharacterOfPosition(n.getStart());
        const oc = n.openingElement.attributes.properties
          .find(a => ts.isJsxAttribute(a) && a.name.getText() === 'onClick');
        const ic = (n.getText().match(/<([A-Z][A-Za-z0-9]*)/) || [])[1];
        achados.push(`${arq.split(path.sep).join('/').replace('src/', '')}:${line + 1}  <${ic}>  ${oc ? oc.getText().slice(8, 80) : '(submit/sem onClick)'}`);
      }
    }
    ts.forEachChild(n, visita);
  })(sf);
}
achados.forEach(a => console.log(a));
console.log(`\ntotal: ${achados.length}`);
if (achados.length) {
  console.log('\nBotao so-icone precisa de aria-label dizendo o que ele FAZ.');
  process.exit(1);
}
