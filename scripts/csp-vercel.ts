/**
 * O portão que não deixa as duas cópias da Content-Security-Policy se separarem.
 *
 * O frontend é servido por dois lugares: na Vercel pela CDN (e aí o cabeçalho
 * vem do `vercel.json`) e no `npm run dev` / `npm start` pelo servidor próprio
 * (e aí vem de `src/server/csp.ts`). O `vercel.json` é JSON, não interpola
 * variável de ambiente e não aceita comentário, então a cópia de produção mora
 * lá literal — e uma política apertada num lugar e velha no outro é pior que
 * nenhuma, porque passa a ideia de estar protegido.
 *
 * Então aqui a política de produção é gerada do módulo e comparada com a que
 * está no `vercel.json`. Mexer num exige mexer no outro.
 */
import { readFileSync } from 'node:fs';
import { ORIGEM_DO_MOTOR_EM_PRODUCAO, ORIGENS_DO_SUPABASE_EM_PRODUCAO, politicaDeSeguranca } from '../src/server/csp.ts';

const CAMINHO = 'vercel.json';

const esperada = politicaDeSeguranca({
  origensDeDados: [...ORIGENS_DO_SUPABASE_EM_PRODUCAO, ORIGEM_DO_MOTOR_EM_PRODUCAO],
  desenvolvimento: false,
});

type Vercel = { headers?: { source: string; headers: { key: string; value: string }[] }[] };
const vercel: Vercel = JSON.parse(readFileSync(CAMINHO, 'utf8'));

const cabecalhos = (vercel.headers ?? []).flatMap((regra) =>
  regra.headers
    .filter((cabecalho) => cabecalho.key.toLowerCase() === 'content-security-policy')
    .map((cabecalho) => ({ source: regra.source, value: cabecalho.value })),
);

function falhar(motivo: string): never {
  console.error(`${CAMINHO}: ${motivo}`);
  process.exit(1);
}

if (cabecalhos.length === 0) {
  falhar(
    'não manda Content-Security-Policy. Na Vercel é a CDN que serve o frontend,'
    + ' então sem este cabeçalho a produção fica sem política nenhuma. A esperada é:\n'
    + `  ${esperada}`,
  );
}

if (cabecalhos.length > 1) {
  falhar(`manda Content-Security-Policy em ${cabecalhos.length} regras; o navegador aplicaria a interseção. Deixe uma.`);
}

// Toda rota precisa do cabeçalho: o `index.html` responde em qualquer caminho
// (o rewrite para `/index.html`), então uma regra mais estreita deixaria as
// outras rotas do app sem política.
const [{ source, value }] = cabecalhos;
if (source !== '/(.*)') {
  falhar(`manda a política só em "${source}". O app responde em qualquer caminho; use "/(.*)".`);
}

if (value !== esperada) {
  falhar(
    'a Content-Security-Policy saiu da que src/server/csp.ts gera para produção.\n'
    + `  no vercel.json: ${value}\n`
    + `  esperada:       ${esperada}`,
  );
}

console.log('vercel.json: Content-Security-Policy igual à de src/server/csp.ts.');
