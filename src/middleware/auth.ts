import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

function configuredSuperAdmins(): Set<string> {
  return new Set(
    (process.env.SUPER_ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Admin é quem tem o e-mail VERIFICADO na lista SUPER_ADMIN_EMAILS — a mesma
 * lista de `isAdmin()` nas regras do Firestore (firestore.rules). Não há claim
 * personalizada: uma claim gravada no login ficava para sempre, mesmo depois de
 * o e-mail sair da lista, e sem verificação uma conta por e-mail e senha podia
 * se cadastrar com o endereço de um admin.
 */
export function isSuperAdmin(user?: DecodedIdToken): boolean {
  if (!user || user.email_verified !== true) return false;
  const email = user.email?.trim().toLowerCase() || '';
  return configuredSuperAdmins().has(email);
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
  }
  next();
};
