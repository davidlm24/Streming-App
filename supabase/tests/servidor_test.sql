-- O que o servidor lê e grava (20260930160000): perfis e papéis, com a chave
-- secreta; o papel de admin pela lista de e-mails; e os eventos do Stripe,
-- aplicados uma vez só, em ordem, e só à assinatura do perfil.
begin;
select plan(19);

insert into auth.users (id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
values
  ('66666666-6666-6666-6666-666666666666', 'assinante@example.test', now(), '{}'::jsonb, '{}'::jsonb),
  ('77777777-7777-7777-7777-777777777777', 'chefe@example.test', now(), '{}'::jsonb, '{}'::jsonb),
  ('88888888-8888-8888-8888-888888888888', 'ex-chefe@example.test', now(), '{}'::jsonb, '{}'::jsonb),
  ('99999999-9999-9999-9999-999999999999', 'nao-confirmado@example.test', null, '{}'::jsonb, '{}'::jsonb);

-- Um admin de antes, que saiu da lista
update public.user_roles set role = 'super_admin' where user_id = '88888888-8888-8888-8888-888888888888';

-- ── Permissões ─────────────────────────────────────────────────────────────
select ok(
  has_table_privilege('service_role', 'public.profiles', 'select')
  and has_table_privilege('service_role', 'public.profiles', 'update')
  and has_table_privilege('service_role', 'public.user_roles', 'insert')
  and has_table_privilege('service_role', 'public.user_roles', 'update'),
  'o servidor lê e grava perfis e papéis'
);
select ok(
  not has_table_privilege('service_role', 'public.profiles', 'delete')
  and not has_table_privilege('service_role', 'public.studio_settings', 'select'),
  'o servidor não apaga perfis nem lê as configurações do estúdio, com as chaves dos canais'
);
select ok(
  not has_function_privilege('authenticated', 'public.apply_stripe_event(text, text, timestamptz, jsonb, uuid, text, public.app_plan, text, text, text)', 'execute')
  and not has_function_privilege('anon', 'public.apply_stripe_event(text, text, timestamptz, jsonb, uuid, text, public.app_plan, text, text, text)', 'execute'),
  'nem uma conta logada nem um visitante gravam eventos do Stripe'
);
select ok(
  not has_function_privilege('authenticated', 'public.sync_super_admins(text[])', 'execute')
  and not has_function_privilege('anon', 'public.sync_super_admins(text[])', 'execute'),
  'nem uma conta logada nem um visitante mexem nos papéis'
);

set local role service_role;

-- ── Papel de admin ─────────────────────────────────────────────────────────
select ok(
  public.sync_super_admins(array['chefe@example.test', 'nao-confirmado@example.test']) >= 2,
  'a lista promove um e rebaixa outro'
);
-- chefe (7…), ex-chefe (8…) e o e-mail não confirmado (9…)
select is(
  (select string_agg(role::text, ', ' order by user_id)
     from public.user_roles
     where user_id in ('77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999')),
  'super_admin, client, client',
  'é admin quem tem o e-mail confirmado na lista; quem saiu dela volta a cliente'
);
select is(
  public.sync_super_admins(array['chefe@example.test']),
  0,
  'com a mesma lista, nada muda'
);

-- ── Eventos do Stripe ──────────────────────────────────────────────────────
select is(
  public.apply_stripe_event('evt_1', 'checkout.session.completed', to_timestamp(100), '{}'::jsonb,
    '66666666-6666-6666-6666-666666666666', null, 'standard', 'active', 'cus_1', 'sub_1'),
  true,
  'o primeiro evento é registrado'
);
select is(
  (select plan::text || ' ' || subscription_status || ' ' || stripe_customer_id || ' ' || stripe_subscription_id
     from public.profiles where id = '66666666-6666-6666-6666-666666666666'),
  'standard active cus_1 sub_1',
  'o checkout pago ativa o plano com os ids do Stripe'
);
select is(
  public.apply_stripe_event('evt_1', 'checkout.session.completed', to_timestamp(100), '{}'::jsonb,
    '66666666-6666-6666-6666-666666666666', null, 'business', 'active', null, null),
  false,
  'o mesmo evento de novo não é registrado'
);
select is(
  (select plan::text from public.profiles where id = '66666666-6666-6666-6666-666666666666'),
  'standard',
  'a segunda entrega não muda o plano'
);

select is(
  public.apply_stripe_event('evt_3', 'customer.subscription.deleted', to_timestamp(300), '{}'::jsonb,
    '66666666-6666-6666-6666-666666666666', 'sub_1', 'free_trial', 'canceled', null, null),
  true,
  'o cancelamento é registrado'
);
select is(
  (select plan::text || ' ' || subscription_status || ' ' || stripe_customer_id
     from public.profiles where id = '66666666-6666-6666-6666-666666666666'),
  'free_trial canceled cus_1',
  'o cancelamento volta ao teste e guarda o cliente do Stripe, para o portal'
);

select is(
  public.apply_stripe_event('evt_2', 'customer.subscription.updated', to_timestamp(200), '{}'::jsonb,
    '66666666-6666-6666-6666-666666666666', 'sub_1', 'standard', 'active', 'cus_1', 'sub_1'),
  true,
  'um evento mais velho que chega depois é registrado'
);
select is(
  (select plan::text || ' ' || subscription_status from public.profiles where id = '66666666-6666-6666-6666-666666666666'),
  'free_trial canceled',
  'mas não desfaz o cancelamento que veio depois dele'
);

select lives_ok(
  $$select public.apply_stripe_event('evt_4', 'customer.subscription.updated', to_timestamp(400), '{}'::jsonb,
      '66666666-6666-6666-6666-666666666666', 'sub_2', 'business', 'active', 'cus_1', 'sub_2')$$,
  'uma assinatura nova, depois do cancelamento, é registrada'
);
select is(
  (select plan::text || ' ' || subscription_status || ' ' || stripe_subscription_id
     from public.profiles where id = '66666666-6666-6666-6666-666666666666'),
  'business active sub_2',
  'e passa a ser a assinatura do perfil'
);

select lives_ok(
  $$select public.apply_stripe_event('evt_5', 'customer.subscription.deleted', to_timestamp(500), '{}'::jsonb,
      '66666666-6666-6666-6666-666666666666', 'sub_1', 'free_trial', 'canceled', null, null)$$,
  'o cancelamento atrasado da assinatura antiga é registrado'
);
select is(
  (select plan::text || ' ' || subscription_status || ' ' || stripe_subscription_id
     from public.profiles where id = '66666666-6666-6666-6666-666666666666'),
  'business active sub_2',
  'mas não cancela a assinatura atual'
);

reset role;
select * from finish();
rollback;
