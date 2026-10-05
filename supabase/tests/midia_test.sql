-- A mídia do estúdio na conta (20260930180000): o bucket, os limites da conta
-- (200 MB e 300 arquivos, também na gravação final do Storage, que roda fora
-- das regras), o envio só pelo caminho comum e a ficha presa ao arquivo.
--
-- O Storage grava duas vezes: uma linha de teste, como a conta e com o
-- tamanho que o pedido declara (contentLength), que ele desfaz; e a de
-- verdade, como superusuário, com o tamanho do arquivo (size).
begin;
select plan(25);

insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
values
  ('cccc3333-cccc-3333-cccc-333333333333', 'midia@rls.test', '{}'::jsonb, '{}'::jsonb),
  ('dddd4444-dddd-4444-dddd-444444444444', 'vizinha-da-midia@rls.test', '{}'::jsonb, '{}'::jsonb),
  ('eeee5555-eeee-5555-eeee-555555555555', 'chefe-da-midia@rls.test', '{}'::jsonb, '{}'::jsonb);
insert into public.user_roles (user_id, role) values ('eeee5555-eeee-5555-eeee-555555555555', 'super_admin')
on conflict (user_id) do update set role = excluded.role;

-- ── O bucket ──
select is(
  (select file_size_limit from storage.buckets where id = 'media-assets'),
  52428800::bigint,
  'o bucket aceita até 50 MB por arquivo, como o plano grátis'
);
select is(
  (select allowed_mime_types from storage.buckets where id = 'media-assets'),
  array['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm'],
  'e só as imagens e os vídeos que o estúdio envia, sem SVG'
);
select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and cmd = 'UPDATE'
      and coalesce(qual, '') || coalesce(with_check, '') like '%media-assets%'
  ),
  'ninguém substitui um arquivo da mídia'
);

-- ── A gravação final, como superusuário ──
set local role service_role;
select lives_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('media-assets', 'cccc3333-cccc-3333-cccc-333333333333/ffff6666-ffff-6666-ffff-666666666666.png', '{"size": 1000, "mimetype": "image/png"}')$$,
  'a gravação final de um arquivo entra'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('media-assets', 'cccc3333-cccc-3333-cccc-333333333333/grande.mp4', '{"size": 209714300, "mimetype": "video/mp4"}')$$,
  'MD001',
  null,
  'mesmo fora das regras, a gravação final não passa dos 200 MB da conta'
);
reset role;

-- ── A linha de teste, como a conta ──
set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccc3333-cccc-3333-cccc-333333333333', true);
select set_config('storage.operation', 'storage.object.upload', true);

select lives_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('media-assets', 'cccc3333-cccc-3333-cccc-333333333333/b.png', '{"mimetype": "image/png", "contentLength": 1000}')$$,
  'a conta envia para a própria pasta'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('media-assets', 'dddd4444-dddd-4444-dddd-444444444444/b.png', '{"mimetype": "image/png", "contentLength": 1000}')$$,
  '42501',
  null,
  'e não para a pasta de outra conta'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('media-assets', 'cccc3333-cccc-3333-cccc-333333333333/c.png', '{"mimetype": "image/png", "contentLength": 209714300}')$$,
  'MD001',
  null,
  'o tamanho declarado já conta: um envio que passaria dos 200 MB não entra'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('media-assets', 'cccc3333-cccc-3333-cccc-333333333333/d.png', '{"mimetype": "image/png"}')$$,
  'MD001',
  null,
  'sem tamanho nenhum, não entra'
);
select set_config('storage.operation', 'storage.object.sign_upload_url', true);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('media-assets', 'cccc3333-cccc-3333-cccc-333333333333/e.png', '{"mimetype": "image/png", "contentLength": 0}')$$,
  '42501',
  null,
  'uma URL assinada de envio não é feita: só o envio comum entra'
);
select set_config('storage.operation', 'storage.object.copy', true);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('media-assets', 'cccc3333-cccc-3333-cccc-333333333333/f.png', '{"size": 1000, "mimetype": "image/png"}')$$,
  '42501',
  null,
  'nem uma cópia'
);
reset role;

-- ── Os 300 arquivos ──
-- Já há dois (o arquivo e a linha de teste); 297 mais chegam a 299
insert into storage.objects (bucket_id, name, metadata)
select 'media-assets', 'cccc3333-cccc-3333-cccc-333333333333/muitos-' || i || '.png', '{"size": 1, "mimetype": "image/png"}'
from generate_series(1, 297) i;
set local role service_role;
select lives_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('media-assets', 'cccc3333-cccc-3333-cccc-333333333333/300.png', '{"size": 1, "mimetype": "image/png"}')$$,
  'o 300º arquivo entra'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('media-assets', 'cccc3333-cccc-3333-cccc-333333333333/301.png', '{"size": 1, "mimetype": "image/png"}')$$,
  'MD002',
  null,
  'o 301º não'
);
select lives_ok(
  $$update storage.objects set last_accessed_at = now() where name = 'cccc3333-cccc-3333-cccc-333333333333/300.png'$$,
  'no limite, o que não mexe no arquivo segue passando'
);
reset role;

-- ── A ficha ──
set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccc3333-cccc-3333-cccc-333333333333', true);

select throws_ok(
  $$insert into public.media_assets (id, owner_id, storage_path, filename, content_type, byte_size)
    values ('aaaa7777-aaaa-7777-aaaa-777777777777', 'cccc3333-cccc-3333-cccc-333333333333',
            'cccc3333-cccc-3333-cccc-333333333333/aaaa7777-aaaa-7777-aaaa-777777777777.png', 'x.png', 'image/png', 1000)$$,
  '42501',
  null,
  'uma ficha sem arquivo no bucket não entra'
);
select throws_ok(
  $$insert into public.media_assets (id, owner_id, storage_path, filename, content_type, byte_size)
    values ('ffff6666-ffff-6666-ffff-666666666666', 'cccc3333-cccc-3333-cccc-333333333333',
            'cccc3333-cccc-3333-cccc-333333333333/ffff6666-ffff-6666-ffff-666666666666.png', 'logo.png', 'image/png', 999)$$,
  '42501',
  null,
  'nem com um tamanho diferente do arquivo'
);
select lives_ok(
  $$insert into public.media_assets (id, owner_id, storage_path, filename, content_type, byte_size, metadata)
    values ('ffff6666-ffff-6666-ffff-666666666666', 'cccc3333-cccc-3333-cccc-333333333333',
            'cccc3333-cccc-3333-cccc-333333333333/ffff6666-ffff-6666-ffff-666666666666.png', 'logo.png', 'image/png', 1000, '{"tipo": "logo"}')$$,
  'a ficha do próprio arquivo, com o tamanho e o formato dele, entra'
);
select ok(
  not has_table_privilege('authenticated', 'public.media_assets', 'UPDATE'),
  'a ficha não muda depois de gravada'
);
reset role;

select throws_ok(
  $$insert into public.media_assets (id, owner_id, storage_path, filename, content_type, byte_size)
    values ('bbbb8888-bbbb-8888-bbbb-888888888888', 'cccc3333-cccc-3333-cccc-333333333333',
            'dddd4444-dddd-4444-dddd-444444444444/bbbb8888-bbbb-8888-bbbb-888888888888.png', 'x.png', 'image/png', 1)$$,
  '23514',
  null,
  'a ficha aponta para {dona}/{id}.{extensão}, e para nada mais'
);
select throws_ok(
  $$insert into public.media_assets (id, owner_id, storage_path, filename, content_type, byte_size, metadata)
    values ('bbbb8888-bbbb-8888-bbbb-888888888888', 'cccc3333-cccc-3333-cccc-333333333333',
            'cccc3333-cccc-3333-cccc-333333333333/bbbb8888-bbbb-8888-bbbb-888888888888.png', 'x.png', 'image/png', 1,
            jsonb_build_object('tipo', repeat('x', 600)))$$,
  '23514',
  null,
  'e não leva um metadata grande'
);

-- As 300 fichas: já há uma; 299 mais chegam ao limite
insert into public.media_assets (id, owner_id, storage_path, filename, content_type, byte_size)
select f.id, 'cccc3333-cccc-3333-cccc-333333333333', 'cccc3333-cccc-3333-cccc-333333333333/' || f.id || '.png', 'x.png', 'image/png', 1
from (select gen_random_uuid() as id from generate_series(1, 299)) f;
select throws_ok(
  $$insert into public.media_assets (id, owner_id, storage_path, filename, content_type, byte_size)
    values ('bbbb8888-bbbb-8888-bbbb-888888888888', 'cccc3333-cccc-3333-cccc-333333333333',
            'cccc3333-cccc-3333-cccc-333333333333/bbbb8888-bbbb-8888-bbbb-888888888888.png', 'x.png', 'image/png', 1)$$,
  'MD002',
  null,
  'a conta guarda até 300 fichas'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'dddd4444-dddd-4444-dddd-444444444444', true);
select is(
  (select count(*) from public.media_assets where owner_id = 'cccc3333-cccc-3333-cccc-333333333333'),
  0::bigint,
  'outra conta não vê as fichas'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'eeee5555-eeee-5555-eeee-555555555555', true);
select is(
  (select count(*) from public.media_assets where owner_id = 'cccc3333-cccc-3333-cccc-333333333333'),
  0::bigint,
  'nem a administração: a mídia é só da conta'
);

-- ── A pasta cheia de outra conta ──
-- A recusa tem de ser a da regra (42501), e não a do limite: a do limite diria
-- quanto a outra conta guarda
reset role;
select set_config('request.jwt.claim.sub', '', true);
insert into storage.objects (bucket_id, name, metadata)
select 'media-assets', 'dddd4444-dddd-4444-dddd-444444444444/cheia-' || i || '.png', '{"size": 1, "mimetype": "image/png"}'
from generate_series(1, 300) i;
insert into public.media_assets (id, owner_id, storage_path, filename, content_type, byte_size)
select f.id, 'dddd4444-dddd-4444-dddd-444444444444', 'dddd4444-dddd-4444-dddd-444444444444/' || f.id || '.png', 'x.png', 'image/png', 1
from (select gen_random_uuid() as id from generate_series(1, 300)) f;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccc3333-cccc-3333-cccc-333333333333', true);
select set_config('storage.operation', 'storage.object.upload', true);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('media-assets', 'dddd4444-dddd-4444-dddd-444444444444/sonda.png', '{"mimetype": "image/png", "contentLength": 1}')$$,
  '42501',
  null,
  'a pasta cheia de outra conta recusa pela regra, sem dizer quanto ela guarda'
);
select throws_ok(
  $$insert into public.media_assets (id, owner_id, storage_path, filename, content_type, byte_size)
    values ('bbbb9999-bbbb-9999-bbbb-999999999999', 'dddd4444-dddd-4444-dddd-444444444444',
            'dddd4444-dddd-4444-dddd-444444444444/bbbb9999-bbbb-9999-bbbb-999999999999.png', 'x.png', 'image/png', 1)$$,
  '42501',
  null,
  'e as fichas de outra conta também'
);

reset role;
select * from finish();
rollback;
