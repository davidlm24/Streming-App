-- Os acréscimos do app ao esquema (20260930150000): o perfil com o nome e a
-- foto do Google, os roteiros do teleprompter e as configurações do estúdio,
-- onde ficam os canais com as chaves, que só a dona lê.
begin;
select plan(13);

insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
values
  ('33333333-3333-3333-3333-333333333333', 'dona@example.test', '{}'::jsonb,
   '{"full_name": "Maria Dona", "avatar_url": "https://example.test/maria.png"}'::jsonb),
  ('44444444-4444-4444-4444-444444444444', 'outra@example.test', '{}'::jsonb, '{}'::jsonb),
  ('55555555-5555-5555-5555-555555555555', 'longa@example.test', '{}'::jsonb,
   jsonb_build_object('name', repeat('Nome', 40)));

insert into public.webinars (id, owner_id, title)
values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'Webinar da dona');

select is(
  (select display_name || ' | ' || coalesce(avatar_url, '') from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
  'Maria Dona | https://example.test/maria.png',
  'o perfil nasce com o nome e a foto do Google'
);
select is(
  (select display_name from public.profiles where id = '44444444-4444-4444-4444-444444444444'),
  'Usuário PwStreamer',
  'sem nome no login, o perfil nasce com o nome padrão em português'
);
select is(
  (select char_length(display_name) from public.profiles where id = '55555555-5555-5555-5555-555555555555'),
  120,
  'um nome longo é cortado, e a conta nasce'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.teleprompter_scripts'::regclass),
  'os roteiros têm RLS'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);

select lives_ok(
  $$insert into public.teleprompter_scripts (owner_id, webinar_id, script) values
      ('33333333-3333-3333-3333-333333333333', null, 'Roteiro geral'),
      ('33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Roteiro do webinar')$$,
  'a dona grava o roteiro geral e o do webinar'
);
select throws_ok(
  $$insert into public.teleprompter_scripts (owner_id, webinar_id, script)
    values ('33333333-3333-3333-3333-333333333333', null, 'Outro geral')$$,
  '23505',
  null,
  'há um roteiro geral por conta'
);
select lives_ok(
  $$insert into public.studio_settings (user_id, transmission, banners) values (
      '33333333-3333-3333-3333-333333333333',
      '{"destinations": [{"id": "yt", "streamKey": "chave-secreta"}], "streamColor": "#202429"}'::jsonb,
      '[{"id": "b1", "text": "Banner"}]'::jsonb
    )$$,
  'a dona grava os canais, com a chave, e os banners'
);
select throws_ok(
  $$update public.studio_settings set tickers = '{"nao": "lista"}'::jsonb
    where user_id = '33333333-3333-3333-3333-333333333333'$$,
  '23514',
  null,
  'os tickers são uma lista'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', true);

select is(
  (select count(*) from public.studio_settings),
  0::bigint,
  'outra conta não lê os canais nem as chaves da dona'
);
select is(
  (select count(*) from public.teleprompter_scripts),
  0::bigint,
  'outra conta não lê os roteiros da dona'
);
select throws_ok(
  $$insert into public.teleprompter_scripts (owner_id, webinar_id, script)
    values ('44444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Intruso')$$,
  '42501',
  null,
  'outra conta não pendura um roteiro no webinar da dona'
);
select throws_ok(
  $$insert into public.studio_settings (user_id) values ('33333333-3333-3333-3333-333333333333')$$,
  '42501',
  null,
  'outra conta não grava as configurações da dona'
);

reset role;

select ok(
  not has_table_privilege('anon', 'public.studio_settings', 'select')
  and not has_table_privilege('anon', 'public.teleprompter_scripts', 'select'),
  'visitantes não leem configurações nem roteiros'
);

select * from finish();
rollback;
