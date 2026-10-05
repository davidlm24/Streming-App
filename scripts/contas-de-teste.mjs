// Contas de teste no Supabase local, para entrar no app em desenvolvimento pelo
// formulário de e-mail e senha (npm run db:contas). Só roda no Supabase local:
// as senhas abaixo são de teste e não valem em lugar nenhum além dele.
//
// Para a conta de admin, ponha admin@example.test em SUPER_ADMIN_EMAILS no .env.
import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const CONTAS = [
  { email: 'dona@example.test', senha: 'senha-local-da-dona', nome: 'Maria Dona' },
  { email: 'outra@example.test', senha: 'senha-local-da-outra', nome: 'Ana Outra' },
  { email: 'admin@example.test', senha: 'senha-local-do-admin', nome: 'Quem administra' },
];

const status = JSON.parse(execSync('npx supabase status -o json', { encoding: 'utf8' }));
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(status.API_URL)) {
  throw new Error(`As contas de teste só vão para o Supabase local: ${status.API_URL}`);
}

const banco = createClient(status.API_URL, status.SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

for (const conta of CONTAS) {
  const { error } = await banco.auth.admin.createUser({
    email: conta.email,
    password: conta.senha,
    email_confirm: true,
    user_metadata: { full_name: conta.nome },
  });
  if (error && error.code !== 'email_exists') throw error;
  console.log(`${conta.email}: ${error ? 'já existia' : 'criada'}`);
}
