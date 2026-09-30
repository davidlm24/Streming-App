-- O que o app usa do banco (20260930170000): a gravação por partes das
-- configurações de transmissão, só na própria conta, e o tempo real.
begin;
select plan(9);

insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
values
  ('aaaa1111-aaaa-1111-aaaa-111111111111', 'canais@example.test', '{}'::jsonb, '{}'::jsonb),
  ('bbbb2222-bbbb-2222-bbbb-222222222222', 'vizinha@example.test', '{}'::jsonb, '{}'::jsonb);

select ok(
  not has_function_privilege('anon', 'public.update_transmission(jsonb)', 'execute'),
  'um visitante não grava configurações de transmissão'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaa1111-aaaa-1111-aaaa-111111111111', true);

select is(
  public.update_transmission('{"destinations": [{"id": "yt", "streamKey": "chave"}]}'::jsonb),
  '{"destinations": [{"id": "yt", "streamKey": "chave"}]}'::jsonb,
  'a primeira gravação cria a linha da conta com os canais'
);
select is(
  public.update_transmission('{"streamColor": "#202429"}'::jsonb),
  '{"destinations": [{"id": "yt", "streamKey": "chave"}], "streamColor": "#202429"}'::jsonb,
  'gravar a cor não apaga os canais'
);
select is(
  public.update_transmission('{"destinations": []}'::jsonb) ->> 'streamColor',
  '#202429',
  'gravar os canais não apaga a cor'
);
select throws_ok(
  $$select public.update_transmission('[1, 2]'::jsonb)$$,
  '22023',
  null,
  'só um objeto entra nas configurações'
);
select lives_ok(
  $$update public.studio_settings set banners = '[{"id": "b1"}]'::jsonb where user_id = 'aaaa1111-aaaa-1111-aaaa-111111111111'$$,
  'os banners seguem gravados na mesma linha'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbb2222-bbbb-2222-bbbb-222222222222', true);

select is(
  public.update_transmission('{"streamColor": "#ffffff"}'::jsonb),
  '{"streamColor": "#ffffff"}'::jsonb,
  'outra conta grava na própria linha'
);

reset role;

select is(
  (select transmission ->> 'streamColor' from public.studio_settings where user_id = 'aaaa1111-aaaa-1111-aaaa-111111111111'),
  '#202429',
  'e não mexe na da primeira'
);
select is(
  (select count(*) from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename in ('webinars', 'studio_settings')),
  2::bigint,
  'webinars e configurações do estúdio mudam em tempo real'
);

select * from finish();
rollback;
