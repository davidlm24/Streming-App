-- Os limites de tamanho do que a conta grava (20261001120000): o teto de cada
-- jsonb, o tamanho das listas, o teto de linhas por conta e a soma dos
-- roteiros. O que importa aqui é o par: o que o app grava hoje PASSA, e o que
-- encheria o banco NÃO passa. Um teste só do "não passa" deixaria passar um
-- limite apertado demais, que quebra quem está usando.
begin;
select plan(30);

insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
values
  ('11110000-1111-0000-1111-000000000001', 'dona-dos-limites@rls.test', '{}'::jsonb, '{}'::jsonb),
  ('11110000-1111-0000-1111-000000000002', 'outra-dos-limites@rls.test', '{}'::jsonb, '{}'::jsonb),
  ('11110000-1111-0000-1111-000000000003', 'conta-cheia@rls.test', '{}'::jsonb, '{}'::jsonb);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11110000-1111-0000-1111-000000000001', true);

-- ── O que o app grava hoje ────────────────────────────────────────────────
-- A gravação de verdade, com as formas que src/lib/dadosDaConta.ts manda: os
-- canais com a chave e a cor, um banner e um ticker. Tem de caber.
select lives_ok(
  $$insert into public.studio_settings (user_id, transmission, banners, tickers) values (
      '11110000-1111-0000-1111-000000000001',
      '{"streamColor": "#202429", "destinations": [{"id": "dest-youtube-1790782693899", "name": "YouTube",
        "platform": "youtube", "selected": true, "isCustom": false, "avatarUrl": "",
        "streamKey": "chave-de-teste-local-123", "streamUrl": "rtmp://a.rtmp.youtube.com/live2",
        "updatedAt": "2026-09-30T15:38:13.899Z"}]}'::jsonb,
      '[{"id": "banner-1790782885673", "text": "Banner de teste no Supabase", "subtitle": "Salvo na conta"}]'::jsonb,
      '[{"id": "ticker-1790782885673", "text": "Inscrições abertas até sexta", "badgeText": "Aviso"}]'::jsonb
    )$$,
  'o que o app grava no estúdio hoje cabe nos limites'
);

-- A lista cheia que a tela deixa montar: 50 banners e 50 tickers com os campos
-- no `maxLength` (80/80 e 200/20), em acentuado, que ocupa mais de um byte.
select lives_ok(
  $$update public.studio_settings set
      banners = (select jsonb_agg(jsonb_build_object(
        'id', 'banner-' || i, 'text', repeat('ã', 80), 'subtitle', repeat('ç', 80)))
        from generate_series(1, 50) i),
      tickers = (select jsonb_agg(jsonb_build_object(
        'id', 'ticker-' || i, 'text', repeat('ã', 200), 'badgeText', repeat('ç', 20)))
        from generate_series(1, 50) i)
    where user_id = '11110000-1111-0000-1111-000000000001'$$,
  'as listas cheias que a tela deixa montar, com acento, ainda cabem'
);

-- ── As listas do estúdio ──────────────────────────────────────────────────
select throws_ok(
  $$update public.studio_settings set
      banners = (select jsonb_agg(jsonb_build_object('id', i, 'text', 'x')) from generate_series(1, 51) i)
    where user_id = '11110000-1111-0000-1111-000000000001'$$,
  '23514',
  null,
  'o 51º banner não entra'
);
select throws_ok(
  $$update public.studio_settings set
      tickers = (select jsonb_agg(jsonb_build_object('id', i, 'text', 'x')) from generate_series(1, 51) i)
    where user_id = '11110000-1111-0000-1111-000000000001'$$,
  '23514',
  null,
  'nem o 51º ticker'
);
-- Poucos itens, mas enormes: o teto da coluna pega o que o da lista deixa passar
select throws_ok(
  $$update public.studio_settings set
      banners = (select jsonb_agg(jsonb_build_object('id', i, 'text', repeat('x', 10000))) from generate_series(1, 10) i)
    where user_id = '11110000-1111-0000-1111-000000000001'$$,
  '23514',
  null,
  'dez banners gigantes também não: a lista curta não livra do tamanho'
);

-- ── Os canais ─────────────────────────────────────────────────────────────
select lives_ok(
  $$update public.studio_settings set
      transmission = jsonb_build_object('destinations', (select jsonb_agg(jsonb_build_object(
        'id', 'dest-' || i, 'name', 'Canal ' || i, 'platform', 'custom', 'selected', false,
        'streamUrl', 'rtmp://ingest.exemplo.test/live', 'streamKey', repeat('k', 200)))
        from generate_series(1, 32) i))
    where user_id = '11110000-1111-0000-1111-000000000001'$$,
  '32 canais com chave comprida cabem'
);
select throws_ok(
  $$update public.studio_settings set
      transmission = jsonb_build_object('destinations', (select jsonb_agg(jsonb_build_object('id', i)) from generate_series(1, 33) i))
    where user_id = '11110000-1111-0000-1111-000000000001'$$,
  '23514',
  null,
  'o 33º canal não entra'
);
select throws_ok(
  $$update public.studio_settings set transmission = '[]'::jsonb
    where user_id = '11110000-1111-0000-1111-000000000001'$$,
  '23514',
  null,
  'e a transmissão é um objeto, não uma lista'
);

-- ── As colunas que ninguém grava ──────────────────────────────────────────
select throws_ok(
  $$update public.studio_settings set scene_layouts = jsonb_build_object('x', repeat('y', 40000))
    where user_id = '11110000-1111-0000-1111-000000000001'$$,
  '23514',
  null,
  'uma coluna sem uso não vira buraco: scene_layouts tem teto'
);
select throws_ok(
  $$update public.studio_settings set webhook_configuration = jsonb_build_object('x', repeat('y', 20000))
    where user_id = '11110000-1111-0000-1111-000000000001'$$,
  '23514',
  null,
  'nem webhook_configuration'
);

-- ── update_transmission, a porta que o app usa ────────────────────────────
-- A função junta o pedaço ao que já está gravado com `||`: o teto tem de valer
-- na soma, senão a conta grava 40 KB de cada vez, sem fim.
select lives_ok(
  $$select public.update_transmission(jsonb_build_object('streamColor', '#1F6FEB'))$$,
  'o app grava a cor pela função, sem apagar os canais'
);
select is(
  (select jsonb_array_length(transmission -> 'destinations') from public.studio_settings
    where user_id = '11110000-1111-0000-1111-000000000001'),
  32,
  'e os canais continuam lá depois de gravar só a cor'
);
select lives_ok(
  $$select public.update_transmission(jsonb_build_object('a', repeat('x', 40000)))$$,
  'um pedaço de 40 KB ainda cabe'
);
select throws_ok(
  $$select public.update_transmission(jsonb_build_object('b', repeat('x', 40000)))$$,
  '23514',
  null,
  'mas o segundo pedaço de 40 KB não: o teto vale na soma, não em cada pedaço'
);

-- ── Os webinars ───────────────────────────────────────────────────────────
select lives_ok(
  $$insert into public.webinars (owner_id, title, settings) values (
      '11110000-1111-0000-1111-000000000001',
      'Webinar da dona',
      '{"time": "Quinta-feira, 15 de outubro, às 19:00", "type": "webinar",
        "channels": ["YouTube", "Facebook", "Instagram", "TikTok", "Twitch", "Kick", "LinkedIn", "Rumble"],
        "videoName": ""}'::jsonb
    )$$,
  'o webinar que o formulário agenda, com as 8 plataformas, cabe'
);
select throws_ok(
  $$insert into public.webinars (owner_id, title, settings)
    values ('11110000-1111-0000-1111-000000000001', 'Grande', jsonb_build_object('x', repeat('y', 5000)))$$,
  '23514',
  null,
  'um settings de 5 KB não'
);

-- ── A audiência ───────────────────────────────────────────────────────────
select throws_ok(
  $$insert into public.audience_members (user_id, display_name, attributes)
    values ('11110000-1111-0000-1111-000000000001', 'Ana', jsonb_build_object('x', repeat('y', 3000)))$$,
  '23514',
  null,
  'uma ficha de audiência de 3 KB não entra'
);

-- ── Os roteiros ───────────────────────────────────────────────────────────
-- O limite de cada roteiro (etapa 3) continua valendo, e o novo é a soma: 2 MB
-- por conta. 20 roteiros cheios dão 2.000.000 de caracteres.
insert into public.webinars (id, owner_id, title)
select ('22220000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
       '11110000-1111-0000-1111-000000000001', 'W' || i
from generate_series(1, 21) i;

select lives_ok(
  $$insert into public.teleprompter_scripts (owner_id, webinar_id, script)
    values ('11110000-1111-0000-1111-000000000001', '22220000-0000-0000-0000-000000000001', repeat('a', 100000))$$,
  'um roteiro de 100.000 caracteres, o de um webinar de duas horas, cabe'
);
insert into public.teleprompter_scripts (owner_id, webinar_id, script)
select '11110000-1111-0000-1111-000000000001',
       ('22220000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, repeat('a', 100000)
from generate_series(2, 20) i;

select lives_ok(
  $$insert into public.teleprompter_scripts (owner_id, webinar_id, script)
    values ('11110000-1111-0000-1111-000000000001', '22220000-0000-0000-0000-000000000021', repeat('a', 90000))$$,
  'no limite da conta, um roteiro que ainda cabe entra'
);
select throws_ok(
  $$update public.teleprompter_scripts set script = repeat('a', 100000)
    where owner_id = '11110000-1111-0000-1111-000000000001'
      and webinar_id = '22220000-0000-0000-0000-000000000021'$$,
  'TP001',
  null,
  'e crescer esse roteiro além dos 2 MB da conta, não'
);
select throws_ok(
  $$insert into public.teleprompter_scripts (owner_id, webinar_id, script)
    values ('11110000-1111-0000-1111-000000000001', null, repeat('a', 100000))$$,
  'TP001',
  null,
  'nem um roteiro novo além dos 2 MB'
);

reset role;

-- ── Os tetos de linhas ────────────────────────────────────────────────────
-- Fora das regras (sem conta), o gatilho também vale: é a mesma trava que a
-- chave secreta encontra. O `reset role` tira o papel mas não a conta: sem
-- limpar o `sub`, o gatilho veria as linhas como de outra conta e as deixaria
-- passar sem contar — que é o caminho certo dele, e o errado para este teste.
select set_config('request.jwt.claim.sub', '', true);
insert into public.webinars (owner_id, title)
select '11110000-1111-0000-1111-000000000003', 'W' || i from generate_series(1, 499) i;
select lives_ok(
  $$insert into public.webinars (owner_id, title) values ('11110000-1111-0000-1111-000000000003', 'O 500º')$$,
  'o 500º webinar da conta entra'
);
select throws_ok(
  $$insert into public.webinars (owner_id, title) values ('11110000-1111-0000-1111-000000000003', 'O 501º')$$,
  'WB001',
  null,
  'o 501º não'
);
-- No teto, EDITAR o que já existe tem de continuar passando. O app grava o
-- webinar com `upsert` na id, que é um `insert ... on conflict do update`, e o
-- gatilho BEFORE INSERT roda antes de o Postgres ver o conflito: sem tirar a
-- própria linha da contagem, a conta cheia não conseguia mais mudar o título
-- de um webinar que já tinha.
select lives_ok(
  $$insert into public.webinars (id, owner_id, title)
    select id, owner_id, 'Título editado' from public.webinars
    where owner_id = '11110000-1111-0000-1111-000000000003' limit 1
    on conflict (id) do update set title = excluded.title$$,
  'no teto, editar um webinar que já existe continua passando'
);

insert into public.snapshots (user_id, name, asset_url)
select '11110000-1111-0000-1111-000000000003', 'S' || i, 'https://exemplo.test/s.png' from generate_series(1, 499) i;
select lives_ok(
  $$insert into public.snapshots (user_id, name, asset_url)
    values ('11110000-1111-0000-1111-000000000003', 'O 500º', 'https://exemplo.test/s.png')$$,
  'o 500º snapshot entra'
);
select throws_ok(
  $$insert into public.snapshots (user_id, name, asset_url)
    values ('11110000-1111-0000-1111-000000000003', 'O 501º', 'https://exemplo.test/s.png')$$,
  'SN001',
  null,
  'o 501º não'
);

insert into public.audience_members (user_id, display_name)
select '11110000-1111-0000-1111-000000000003', 'P' || i from generate_series(1, 999) i;
select lives_ok(
  $$insert into public.audience_members (user_id, display_name)
    values ('11110000-1111-0000-1111-000000000003', 'A milésima')$$,
  'a milésima pessoa da audiência entra'
);
select throws_ok(
  $$insert into public.audience_members (user_id, display_name)
    values ('11110000-1111-0000-1111-000000000003', 'A milésima primeira')$$,
  'AU001',
  null,
  'a seguinte não'
);

-- ── A conta cheia de outra pessoa ─────────────────────────────────────────
-- A recusa tem de ser a da regra (42501), e não a do teto: a do teto diria
-- quantas linhas a outra conta tem, e o pedido seguraria a trava dela.
set local role authenticated;
select set_config('request.jwt.claim.sub', '11110000-1111-0000-1111-000000000002', true);
select throws_ok(
  $$insert into public.webinars (owner_id, title) values ('11110000-1111-0000-1111-000000000003', 'Sonda')$$,
  '42501',
  null,
  'a conta cheia de outra pessoa recusa pela regra, sem dizer quantos webinars ela tem'
);
select throws_ok(
  $$insert into public.audience_members (user_id, display_name)
    values ('11110000-1111-0000-1111-000000000003', 'Sonda')$$,
  '42501',
  null,
  'e a audiência dela também'
);

reset role;
select * from finish();
rollback;
