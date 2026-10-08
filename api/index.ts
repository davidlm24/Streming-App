import type { Request, Response } from 'express';
// `.js`, e não `.ts`: a Vercel compila cada arquivo para .js e mantém o caminho
// do import como está. Com `.ts`, a função procurava um server.ts que não existe
// em produção e caía antes de responder (ERR_MODULE_NOT_FOUND). O TypeScript, o
// tsx e o esbuild resolvem o `.js` para o .ts do código-fonte.
import { createApiApp } from '../server.js';

const appPromise = createApiApp({ serveFrontend: false });

export default async function handler(req: Request, res: Response) {
  const app = await appPromise;
  return app(req, res);
}
