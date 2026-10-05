import type { Request, Response } from 'express';
import { createApiApp } from '../server.ts';

const appPromise = createApiApp({ serveFrontend: false });

export default async function handler(req: Request, res: Response) {
  const app = await appPromise;
  return app(req, res);
}
