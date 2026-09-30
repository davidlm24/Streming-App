begin;
select plan(15);

-- These fixtures cause the auth-user trigger to create the matching profile
-- and initial client role. The transaction is rolled back after the test.
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.test', '{}'::jsonb, '{}'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'other@example.test', '{}'::jsonb, '{}'::jsonb);

insert into public.webinars (id, owner_id, title, status, is_public)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Owner private webinar', 'draft', false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Other private webinar', 'draft', false),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Public webinar', 'scheduled', true);

insert into public.stream_sessions (
  id, owner_id, title, ingest_protocol, resolution, bitrate_kbps, fps
)
values (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '11111111-1111-1111-1111-111111111111',
  'Owner stream',
  'rtmps',
  '1080p',
  6000,
  30
);

select is(
  (
    select count(*)
    from pg_class
    join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public'
      and pg_class.relname in (
        'profiles', 'user_roles', 'webinars', 'studio_settings', 'snapshots',
        'audience_members', 'media_assets', 'stream_sessions',
        'stream_destinations', 'rtmp_keys', 'webhook_logs', 'webinar_registrations'
      )
      and pg_class.relrowsecurity
  ),
  12::bigint,
  'every exposed application table has RLS enabled'
);

select ok(
  not has_schema_privilege('anon', 'app_private', 'usage'),
  'anonymous users cannot use the private schema'
);

select is(
  (select count(*) from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  1::bigint,
  'the auth trigger creates an owner profile'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select is(
  (select count(*) from public.profiles),
  1::bigint,
  'an owner can read only their profile'
);
select is(
  (select count(*) from public.webinars where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1::bigint,
  'an owner can read their private webinar'
);
select is(
  (select count(*) from public.webinars where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0::bigint,
  'an owner cannot read another user private webinar'
);
select is(
  (select count(*) from public.webinars where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  1::bigint,
  'an owner can read a public webinar'
);
select is(
  (select count(*) from public.stream_sessions),
  1::bigint,
  'an owner can read their stream session'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

select is(
  (select count(*) from public.stream_sessions where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  0::bigint,
  'another user cannot read the owner stream session'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select ok(
  not has_table_privilege('anon', 'public.profiles', 'select'),
  'anonymous users cannot read profiles'
);
select is(
  (select count(*) from public.webinars),
  1::bigint,
  'anonymous users can read only public webinars'
);

reset role;

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'plan', 'update'),
  'clients cannot update their own plan'
);
select ok(
  not has_table_privilege('authenticated', 'public.stream_sessions', 'insert'),
  'stream session lifecycle is server managed'
);
select ok(
  not has_table_privilege('authenticated', 'public.webinar_registrations', 'insert'),
  'webinar registrations require the validated server endpoint'
);
select ok(
  exists (select 1 from storage.buckets where id = 'media-assets' and public = false),
  'the media bucket is private'
);

select * from finish();
rollback;
