-- Pw Streamer durable control plane.
--
-- This migration is deliberately self-contained: it defines application data,
-- authorization, and storage policies but does not provision a media pipeline.
-- Stream ingest, transcode, and fan-out must run in dedicated worker/media
-- infrastructure rather than in an HTTP request process.

create schema if not exists app_private;

create type public.app_plan as enum ('free_trial', 'standard', 'professional', 'business');
create type public.user_role as enum ('client', 'super_admin');
create type public.stream_status as enum ('draft', 'provisioning', 'ready', 'starting', 'live', 'stopping', 'stopped', 'failed');
create type public.destination_status as enum ('idle', 'connecting', 'live', 'reconnecting', 'failed', 'stopped');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null default 'Pw Streamer user' check (char_length(display_name) between 1 and 120),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 2048),
  plan public.app_plan not null default 'free_trial',
  subscription_status text not null default 'trial' check (subscription_status in ('trial', 'active', 'past_due', 'canceled', 'unpaid')),
  entitlements_version integer not null default 1 check (entitlements_version > 0),
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '30 days'),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'client',
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id) on delete set null
);

create table public.webinars (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 10_000),
  public_slug text unique check (public_slug is null or public_slug ~ '^[a-z0-9][a-z0-9-]{2,119}$'),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'live', 'ended', 'canceled')),
  is_public boolean not null default false,
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.studio_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  layout jsonb not null default '{}'::jsonb,
  overlays jsonb not null default '{}'::jsonb,
  scene_layouts jsonb not null default '{}'::jsonb,
  transmission jsonb not null default '{}'::jsonb,
  webhook_configuration jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  asset_url text not null check (char_length(asset_url) <= 2048),
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.audience_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 160),
  email text check (email is null or char_length(email) <= 254),
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique check (char_length(storage_path) between 1 and 1024),
  filename text not null check (char_length(filename) between 1 and 255),
  content_type text not null check (char_length(content_type) <= 255),
  byte_size bigint not null check (byte_size >= 0 and byte_size <= 262144000),
  is_public boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stream_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  webinar_id uuid references public.webinars(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  status public.stream_status not null default 'draft',
  ingest_protocol text not null check (ingest_protocol in ('rtmp', 'rtmps', 'srt', 'whip')),
  resolution text not null check (resolution in ('720p', '1080p', '1440p', '2160p')),
  bitrate_kbps integer not null check (bitrate_kbps between 100 and 50000),
  fps smallint not null check (fps in (24, 25, 30, 50, 60)),
  media_provider text not null default 'cloudflare_stream',
  provider_stream_id text unique,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  stopped_at timestamptz,
  failure_code text,
  failure_detail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stream_destinations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.stream_sessions(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (char_length(platform) between 1 and 80),
  target_url text not null check (char_length(target_url) between 1 and 2048),
  status public.destination_status not null default 'idle',
  position smallint not null default 0 check (position >= 0 and position < 100),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  last_connected_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, position)
);

create table public.rtmp_keys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 120),
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  rotated_at timestamptz,
  revoked_at timestamptz
);

create table public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (char_length(platform) between 1 and 80),
  event_type text not null check (char_length(event_type) between 1 and 120),
  endpoint_url text not null check (char_length(endpoint_url) between 1 and 2048),
  delivery_status integer not null check (delivery_status between 100 and 599),
  duration_ms integer not null check (duration_ms >= 0),
  request_metadata jsonb not null default '{}'::jsonb,
  response_metadata jsonb not null default '{}'::jsonb,
  delivered_at timestamptz not null default now()
);

create table public.webinar_registrations (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  company text check (company is null or char_length(company) <= 120),
  registered_at timestamptz not null default now(),
  unique (webinar_id, email)
);

create table app_private.destination_credentials (
  destination_id uuid primary key references public.stream_destinations(id) on delete cascade,
  encrypted_stream_key bytea not null,
  key_version smallint not null default 1 check (key_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app_private.rtmp_key_secrets (
  rtmp_key_id uuid primary key references public.rtmp_keys(id) on delete cascade,
  encrypted_key bytea not null,
  key_version smallint not null default 1 check (key_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app_private.stream_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.stream_sessions(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 1 and 120),
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table app_private.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 1 and 120),
  entity_type text not null check (char_length(entity_type) between 1 and 120),
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table app_private.stripe_events (
  stripe_event_id text primary key,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text
);

create index webinars_owner_id_updated_at_idx on public.webinars (owner_id, updated_at desc);
create index webinars_public_live_idx on public.webinars (is_public, status) where is_public = true;
create index snapshots_user_id_captured_at_idx on public.snapshots (user_id, captured_at desc);
create index audience_members_user_id_idx on public.audience_members (user_id);
create index media_assets_owner_id_created_at_idx on public.media_assets (owner_id, created_at desc);
create index stream_sessions_owner_id_updated_at_idx on public.stream_sessions (owner_id, updated_at desc);
create index stream_destinations_owner_id_idx on public.stream_destinations (owner_id);
create index rtmp_keys_owner_id_idx on public.rtmp_keys (owner_id);
create index webhook_logs_owner_id_delivered_at_idx on public.webhook_logs (owner_id, delivered_at desc);
create index webinar_registrations_webinar_id_idx on public.webinar_registrations (webinar_id);
create index stream_events_session_id_occurred_at_idx on app_private.stream_events (session_id, occurred_at desc);
create index audit_logs_occurred_at_idx on app_private.audit_logs (occurred_at desc);

create or replace function app_private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'super_admin'
  );
$$;

create or replace function app_private.handle_auth_user_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.profiles (id, email, display_name)
    values (
      new.id,
      coalesce(new.email, ''),
      coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Pw Streamer user')
    );
    insert into public.user_roles (user_id, role) values (new.id, 'client');
  elsif tg_op = 'UPDATE' and new.email is distinct from old.email then
    update public.profiles
    set email = coalesce(new.email, ''), updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure app_private.handle_auth_user_change();

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute procedure app_private.handle_auth_user_change();

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute procedure app_private.set_updated_at();
create trigger webinars_set_updated_at before update on public.webinars
  for each row execute procedure app_private.set_updated_at();
create trigger studio_settings_set_updated_at before update on public.studio_settings
  for each row execute procedure app_private.set_updated_at();
create trigger audience_members_set_updated_at before update on public.audience_members
  for each row execute procedure app_private.set_updated_at();
create trigger media_assets_set_updated_at before update on public.media_assets
  for each row execute procedure app_private.set_updated_at();
create trigger stream_sessions_set_updated_at before update on public.stream_sessions
  for each row execute procedure app_private.set_updated_at();
create trigger stream_destinations_set_updated_at before update on public.stream_destinations
  for each row execute procedure app_private.set_updated_at();
create trigger destination_credentials_set_updated_at before update on app_private.destination_credentials
  for each row execute procedure app_private.set_updated_at();
create trigger rtmp_key_secrets_set_updated_at before update on app_private.rtmp_key_secrets
  for each row execute procedure app_private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.webinars enable row level security;
alter table public.studio_settings enable row level security;
alter table public.snapshots enable row level security;
alter table public.audience_members enable row level security;
alter table public.media_assets enable row level security;
alter table public.stream_sessions enable row level security;
alter table public.stream_destinations enable row level security;
alter table public.rtmp_keys enable row level security;
alter table public.webhook_logs enable row level security;
alter table public.webinar_registrations enable row level security;

revoke all on schema app_private from public;
grant usage on schema public to anon, authenticated;
grant usage on schema app_private to authenticated;
revoke all on function app_private.is_super_admin() from public;
grant execute on function app_private.is_super_admin() to authenticated;

revoke all on table public.profiles, public.user_roles, public.webinars, public.studio_settings,
  public.snapshots, public.audience_members, public.media_assets, public.stream_sessions,
  public.stream_destinations, public.rtmp_keys, public.webhook_logs, public.webinar_registrations
  from anon, authenticated;

grant select on public.profiles, public.user_roles, public.webinars, public.studio_settings,
  public.snapshots, public.audience_members, public.media_assets, public.stream_sessions,
  public.stream_destinations, public.rtmp_keys, public.webhook_logs to authenticated;
grant select on public.webinars to anon;
grant insert, update, delete on public.webinars, public.studio_settings, public.snapshots,
  public.audience_members, public.media_assets to authenticated;
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

create policy "profiles are visible to their owner or a super admin"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id or (select app_private.is_super_admin()));
create policy "profile owners can update display details"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "users can view their own role"
  on public.user_roles for select to authenticated
  using ((select auth.uid()) = user_id or (select app_private.is_super_admin()));

create policy "public webinars are readable by anonymous visitors"
  on public.webinars for select to anon
  using (is_public = true);
create policy "authenticated users can read public, own, or admin webinars"
  on public.webinars for select to authenticated
  using (is_public = true or (select auth.uid()) = owner_id or (select app_private.is_super_admin()));
create policy "owners can create webinars"
  on public.webinars for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "owners and admins can update webinars"
  on public.webinars for update to authenticated
  using ((select auth.uid()) = owner_id or (select app_private.is_super_admin()))
  with check ((select auth.uid()) = owner_id or (select app_private.is_super_admin()));
create policy "owners and admins can delete webinars"
  on public.webinars for delete to authenticated
  using ((select auth.uid()) = owner_id or (select app_private.is_super_admin()));

create policy "users can read their own studio settings"
  on public.studio_settings for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users can create their own studio settings"
  on public.studio_settings for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users can update their own studio settings"
  on public.studio_settings for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users can delete their own studio settings"
  on public.studio_settings for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can read their own snapshots"
  on public.snapshots for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users can create their own snapshots"
  on public.snapshots for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users can update their own snapshots"
  on public.snapshots for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users can delete their own snapshots"
  on public.snapshots for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can read their own audience members"
  on public.audience_members for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users can create their own audience members"
  on public.audience_members for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users can update their own audience members"
  on public.audience_members for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users can delete their own audience members"
  on public.audience_members for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "public media metadata is readable by anonymous visitors"
  on public.media_assets for select to anon
  using (is_public = true);
create policy "authenticated users can read public, own, or admin media metadata"
  on public.media_assets for select to authenticated
  using (is_public = true or (select auth.uid()) = owner_id or (select app_private.is_super_admin()));
create policy "owners can create media metadata"
  on public.media_assets for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "owners and admins can update media metadata"
  on public.media_assets for update to authenticated
  using ((select auth.uid()) = owner_id or (select app_private.is_super_admin()))
  with check ((select auth.uid()) = owner_id or (select app_private.is_super_admin()));
create policy "owners and admins can delete media metadata"
  on public.media_assets for delete to authenticated
  using ((select auth.uid()) = owner_id or (select app_private.is_super_admin()));

create policy "owners and admins can read stream sessions"
  on public.stream_sessions for select to authenticated
  using ((select auth.uid()) = owner_id or (select app_private.is_super_admin()));
create policy "owners and admins can read destination metadata"
  on public.stream_destinations for select to authenticated
  using ((select auth.uid()) = owner_id or (select app_private.is_super_admin()));
create policy "owners and admins can read RTMP key metadata"
  on public.rtmp_keys for select to authenticated
  using ((select auth.uid()) = owner_id or (select app_private.is_super_admin()));
create policy "owners and admins can read webhook logs"
  on public.webhook_logs for select to authenticated
  using ((select auth.uid()) = owner_id or (select app_private.is_super_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media-assets',
  'media-assets',
  false,
  262144000,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "media owners can select their objects"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'media-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
create policy "media owners can upload to their folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
create policy "media owners can replace their objects"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'media-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'media-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
create policy "media owners can delete their objects"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'media-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
