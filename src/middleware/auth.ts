import { Request, Response, NextFunction } from 'express';
import { getSupabaseUserFromAccessToken, isSupabaseServerConfigured } from '../lib/supabase-admin.ts';

/**
 * Quem fez o pedido, como o serviço de autenticação do Supabase o validou. Os
 * nomes dos campos são os que o servidor já usava com o Firebase.
 */
export interface UsuarioDoPedido {
  uid: string;
  email: string;
  /** O e-mail foi confirmado. No login do Google, sempre. */
  email_verified: boolean;
  name: string;
  picture: string;
}

export interface AuthRequest extends Request {
  user?: UsuarioDoPedido;
}

/** Os e-mails de SUPER_ADMIN_EMAILS, em minúsculas. */
export function configuredSuperAdmins(): Set<string> {
  return new Set(
    (process.env.SUPER_ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Admin é quem tem o e-mail CONFIRMADO na lista SUPER_ADMIN_EMAILS. O servidor
 * decide a cada pedido e mantém public.user_roles igual, para a RLS
 * (app_private.is_super_admin()) dizer o mesmo. Não vem de metadados que o
 * próprio usuário edita, e sem a confirmação uma conta por e-mail e senha
 * poderia se cadastrar com o endereço de um admin.
 */
export function isSuperAdmin(user?: UsuarioDoPedido): boolean {
  if (!user || user.email_verified !== true) return false;
  const email = user.email.trim().toLowerCase();
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
  if (!isSupabaseServerConfigured()) {
    console.error('Supabase server configuration is missing: set SUPABASE_URL and SUPABASE_SECRET_KEY.');
    return res.status(503).json({ error: 'Authentication service unavailable' });
  }
  try {
    // O serviço de autenticação valida o token e recusa o de uma sessão encerrada
    const usuario = await getSupabaseUserFromAccessToken(token);
    if (!usuario) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    const metadados = usuario.user_metadata ?? {};
    req.user = {
      uid: usuario.id,
      email: usuario.email ?? '',
      email_verified: Boolean(usuario.email_confirmed_at),
      name: String(metadados.full_name ?? metadados.name ?? ''),
      picture: String(metadados.avatar_url ?? metadados.picture ?? ''),
    };
    next();
  } catch (error) {
    console.error('Error validating Supabase access token:', error);
    return res.status(503).json({ error: 'Authentication service unavailable' });
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
