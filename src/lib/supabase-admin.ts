import 'dotenv/config';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

let adminClient: SupabaseClient | undefined;

function serverConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secretKey) {
    throw new Error('Supabase server configuration is missing. Set SUPABASE_URL and SUPABASE_SECRET_KEY.');
  }

  return { url, secretKey };
}

export function isSupabaseServerConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SECRET_KEY?.trim());
}

/**
 * Privileged client for Express-only work such as Stripe entitlement writes.
 * It bypasses RLS and therefore must never be imported into client code or
 * exposed as a VITE_ environment variable.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (!adminClient) {
    const { url, secretKey } = serverConfig();
    adminClient = createClient(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  return adminClient;
}

/**
 * Validates a bearer token against Supabase Auth. Unlike decoding a JWT in the
 * application process, getUser performs an Auth service request and can be
 * used as an authorization decision.
 */
export async function getSupabaseUserFromAccessToken(accessToken: string): Promise<User | null> {
  const { data, error } = await getSupabaseAdminClient().auth.getUser(accessToken);
  if (error) return null;
  return data.user;
}
