-- O que o servidor lê e grava. Ele fala com o banco pela API, com a chave
-- secreta (o papel service_role). Esse papel pula a RLS, mas não tem acesso a
-- tabela nenhuma sem permissão: nesta versão do Supabase, as tabelas novas do
-- schema public não dão leitura nem escrita aos papéis da API. O servidor
-- recebe só o que usa. As funções abaixo só a chave secreta executa: o revoke
-- é explícito para não depender dos privilégios padrão, que mudaram entre
-- versões do Supabase.

-- ── Perfis e papéis ──────────────────────────────────────────────────────────
-- O servidor lê o perfil que o gatilho criou com a conta, cria de novo o que
-- a administração apagou, e mantém o papel de admin igual ao SUPER_ADMIN_EMAILS.
grant select, insert, update on public.profiles to service_role;
grant select, insert, update on public.user_roles to service_role;

-- O papel de admin de todas as contas, pela lista de e-mails do servidor: é
-- admin quem tem o e-mail confirmado na lista, e quem saiu dela é rebaixado.
-- O servidor chama ao subir. Sem isso, um admin tirado da lista seguia admin
-- no banco (app_private.is_super_admin() lê user_roles) enquanto não passasse
-- pelo servidor, e pela API lia os perfis de todos. Devolve quantos papéis
-- mudaram. Os e-mails chegam em minúsculas.
create function public.sync_super_admins(p_emails text[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  rebaixados integer;
  promovidos integer;
begin
  update public.user_roles r
  set role = 'client', assigned_at = now()
  where r.role = 'super_admin'
    and not exists (
      select 1 from auth.users u
      where u.id = r.user_id
        and u.email_confirmed_at is not null
        and lower(u.email) = any (p_emails)
    );
  get diagnostics rebaixados = row_count;

  insert into public.user_roles (user_id, role)
  select u.id, 'super_admin'
  from auth.users u
  where u.email_confirmed_at is not null
    and lower(u.email) = any (p_emails)
  on conflict (user_id) do update
    set role = 'super_admin', assigned_at = now()
    where public.user_roles.role <> 'super_admin';
  get diagnostics promovidos = row_count;

  return rebaixados + promovidos;
end;
$$;

revoke all on function public.sync_super_admins(text[]) from public, anon, authenticated;
grant execute on function public.sync_super_admins(text[]) to service_role;

-- ── Eventos do Stripe ────────────────────────────────────────────────────────
-- A hora (no Stripe) do último evento aplicado ao perfil
alter table public.profiles add column stripe_synced_at timestamptz;

-- A API não expõe o schema app_private: o registro do evento passa por esta
-- função. Ela grava o evento e a mudança no perfil numa transação só, e
-- devolve se o evento era novo. Os parâmetros nulos deixam o campo como está.
--
-- O Stripe entrega de novo quando não recebe resposta e não garante a ordem.
-- Por isso a mudança só vale:
-- - para um evento que ainda não chegou (a segunda entrega não muda nada);
-- - para um evento mais novo que o último aplicado: uma retentativa atrasada
--   de "assinatura ativa" não desfaz o cancelamento que veio depois;
-- - para a assinatura do perfil (p_subscription_scope): o cancelamento de uma
--   assinatura antiga não cancela a atual. Uma assinatura nova só substitui a
--   do perfil depois de cancelada, ou pelo checkout (escopo nulo).
create function public.apply_stripe_event(
  p_event_id text,
  p_event_type text,
  p_event_created timestamptz,
  p_payload jsonb,
  p_user_id uuid default null,
  p_subscription_scope text default null,
  p_plan public.app_plan default null,
  p_subscription_status text default null,
  p_stripe_customer_id text default null,
  p_stripe_subscription_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into app_private.stripe_events (stripe_event_id, event_type, payload, processed_at)
  values (p_event_id, p_event_type, p_payload, now())
  on conflict (stripe_event_id) do nothing;
  if not found then
    return false;
  end if;

  if p_user_id is not null then
    update public.profiles
    set plan = coalesce(p_plan, plan),
        subscription_status = coalesce(p_subscription_status, subscription_status),
        stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id),
        stripe_subscription_id = coalesce(p_stripe_subscription_id, stripe_subscription_id),
        stripe_synced_at = p_event_created
    where id = p_user_id
      and (stripe_synced_at is null or p_event_created >= stripe_synced_at)
      and (
        p_subscription_scope is null
        or stripe_subscription_id is null
        or stripe_subscription_id = p_subscription_scope
        or (subscription_status = 'canceled' and p_event_type <> 'customer.subscription.deleted')
      );
  end if;
  return true;
end;
$$;

revoke all on function public.apply_stripe_event(text, text, timestamptz, jsonb, uuid, text, public.app_plan, text, text, text)
  from public, anon, authenticated;
grant execute on function public.apply_stripe_event(text, text, timestamptz, jsonb, uuid, text, public.app_plan, text, text, text)
  to service_role;
