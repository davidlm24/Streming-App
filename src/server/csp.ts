/**
 * A Content-Security-Policy do app, escrita num só lugar.
 *
 * Por que ela existe: qualquer script que rode dentro de um documento do app lê
 * a sessão do Supabase no localStorage (`sb-<ref>-auth-token`, que guarda o
 * refresh token). A revisão da biblioteca de mídia achou um caminho assim — um
 * logo em SVG aberto numa aba nova é um documento da mesma origem, e um SVG
 * pode levar script — e a etapa 4 fechou aquele caminho convertendo o SVG em
 * PNG antes de subir (`svgEmPng`, em `src/lib/midiaDaConta.ts`). Esta política é
 * a segunda camada: fecha a classe inteira em vez de um caminho só. Sem
 * `script-src 'self'`, o próximo SVG — ou o próximo `innerHTML` — roda.
 *
 * O cabeçalho sai de dois lugares, porque o frontend é servido por dois:
 *   - na Vercel, a CDN serve o `dist` e o cabeçalho vem do `vercel.json`;
 *   - no `npm run dev` e no `npm start` (servidor próprio), vem daqui.
 * O `vercel.json` não interpola variáveis de ambiente, então a cópia de
 * produção é literal lá. `scripts/csp-vercel.ts`, no `npm run verify`, não
 * deixa as duas se separarem.
 */

/**
 * O projeto do Supabase ainda não está ligado a um projeto na nuvem (o README
 * diz isso), então não existe endereço de produção para escrever aqui. Até
 * existir, a política de produção aceita qualquer projeto do Supabase em vez de
 * um endereço inventado que quebraria o login no dia da virada.
 *
 * O que isso custa: um script já rodando poderia mandar dados para um projeto
 * do Supabase de outra pessoa. O que impede o script de existir é o
 * `script-src 'self'` — esta lista é o que ele alcançaria, não o que ele ganha.
 * Trocar por `https://<ref>.supabase.co` e `wss://<ref>.supabase.co` quando o
 * projeto da nuvem existir aperta o último passo.
 */
export const ORIGENS_DO_SUPABASE_EM_PRODUCAO = ['https://*.supabase.co', 'wss://*.supabase.co'] as const;

/**
 * As duas origens de um endereço do Supabase: a de HTTP (Auth, PostgREST e
 * Storage) e a do websocket do Realtime, que `ouvirMudancas` abre em
 * `/realtime/v1/websocket` para os webinars e os ajustes do estúdio.
 *
 * O websocket entra separado porque o CSP compara o esquema: `connect-src
 * https://x` não libera `wss://x`. Em desenvolvimento o Supabase local é
 * `http://`, e aí o websocket é `ws://`.
 */
export function origensDoSupabase(endereco: string): string[] {
  let url: URL;
  try {
    url = new URL(endereco);
  } catch {
    // Melhor parar aqui do que subir com uma política que bloqueia o login
    throw new Error(`VITE_SUPABASE_URL não é um endereço válido: ${endereco}`);
  }
  return [url.origin, `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}`];
}

/**
 * Monta o cabeçalho. `origensDeDados` são as origens do Supabase (de
 * `origensDoSupabase` ou de `ORIGENS_DO_SUPABASE_EM_PRODUCAO`);
 * `desenvolvimento` solta o que só o servidor do Vite precisa.
 */
export function politicaDeSeguranca({
  origensDeDados,
  desenvolvimento,
}: {
  origensDeDados: readonly string[];
  desenvolvimento: boolean;
}): string {
  const diretivas: Record<string, string[]> = {
    // A base: o que nenhuma diretiva abaixo cobrir vem da própria origem
    'default-src': ["'self'"],

    // O app tem um só script, o `/src/main.tsx` do `index.html`, que o build
    // vira um arquivo da própria origem. Não há CDN, nem `eval`, nem
    // WebAssembly, nem script embutido — então nada de `'unsafe-inline'`:
    // é esta linha que impede um SVG ou um `innerHTML` de ler a sessão.
    'script-src': ["'self'"],

    // O CSS do app é um arquivo da própria origem, e a Poppins vem da folha do
    // Google Fonts que o `src/index.css` importa (um `@import` conta como
    // folha de estilo, não como conexão).
    'style-src': [
      "'self'",
      'https://fonts.googleapis.com',
      // O Vite serve o CSS como `<style>` embutido em desenvolvimento, e o
      // teleprompter clona esses `<style>` para a janela que abre. Em produção
      // o build emite um `<link>`, e aí `'self'` basta.
      ...(desenvolvimento ? ["'unsafe-inline'"] : []),
    ],

    // Os .woff2 que a folha do Google Fonts referencia
    'font-src': ["'self'", 'https://fonts.gstatic.com'],

    // `blob:` é a biblioteca de mídia: todo arquivo da conta é baixado com o
    // token da sessão e desenhado a partir de um object URL, nunca de um
    // endereço público do Storage. O `svgEmPng` também carrega o SVG como
    // imagem de um `blob:` para medir e redesenhar.
    // O `googleusercontent.com` é a foto da conta do Google no cabeçalho.
    'img-src': ["'self'", 'blob:', 'https://*.googleusercontent.com'],

    // Os clipes do estúdio, também por object URL. A câmera e a tela não
    // entram aqui: `srcObject` recebe o MediaStream direto, sem endereço.
    'media-src': ["'self'", 'blob:'],

    // A API do próprio app (`/api/...`) e o Supabase
    'connect-src': [
      "'self'",
      ...origensDeDados,
      // O websocket do HMR do Vite. Em `middlewareMode` ele não roda na porta
      // do app (abre uma só dele, 24678 por padrão), e a porta não está escrita
      // em lugar nenhum do projeto para se escrever aqui — daí o curinga de
      // porta, limitado ao próprio computador e só em desenvolvimento.
      ...(desenvolvimento ? ['ws://localhost:*', 'ws://127.0.0.1:*'] : []),
    ],

    // Não há `<object>`, `<embed>` nem plugin
    'object-src': ["'none'"],

    // Não há `<iframe>` em nenhuma tela
    'frame-src': ["'none'"],

    // O único Worker é o do pdf.js, que lê o PDF da apresentação do estúdio
    // fora da linha principal; é um arquivo do build, da própria origem. Não
    // há SharedWorker, service worker nem AudioWorklet. Um `blob:` aqui
    // deixaria um script já rodando abrir um Worker com código qualquer.
    'worker-src': ["'self'"],

    // Os formulários do app são todos `onSubmit`, sem `action`; um formulário
    // sem `action` envia para a própria URL, então `'none'` quebraria qualquer
    // um que esquecesse o `preventDefault`.
    'form-action': ["'self'"],

    // Não há `<base>`: sem isto, um `<base href>` injetado reapontaria todo
    // caminho relativo da página
    'base-uri': ["'none'"],

    // O app não é feito para ser aberto dentro de outra página (clickjacking)
    'frame-ancestors': ["'none'"],
  };

  return Object.entries(diretivas)
    .map(([nome, valores]) => `${nome} ${valores.join(' ')}`)
    .join('; ');
}
