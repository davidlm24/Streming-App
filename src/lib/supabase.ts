import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | undefined;

function browserConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    throw new Error('Supabase browser configuration is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  }

  return { url, publishableKey };
}

export function isSupabaseBrowserConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL?.trim()
    && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  );
}

/**
 * Returns the single browser client used after the Supabase cutover. The
 * publishable key is safe to bundle; the server secret key must never be used
 * in a Vite environment variable or imported by browser code.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const { url, publishableKey } = browserConfig();
    browserClient = createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // O retorno do Google traz um código que só este navegador troca pela
        // sessão (PKCE). No fluxo implícito, o padrão, a sessão vinha no próprio
        // link: um link com os tokens da conta de outra pessoa entrava nela, e o
        // que se salvasse depois (as chaves dos canais) ia para a conta dela.
        flowType: 'pkce',
      },
    });
  }

  return browserClient;
}
