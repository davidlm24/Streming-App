-- O que o app usa hoje e o esquema do controle (20260924121120) não tinha: os
-- roteiros do teleprompter, os banners e os tickers do estúdio e a foto do
-- perfil vinda do Google. O resto do esquema fica como o #9 o escreveu.

-- ── Perfil ─────────────────────────────────────────────────────────────────
-- O login do Google traz o nome e a foto nos metadados, e o perfil nasce com
-- os dois. Nome e foto são cortados nos limites das colunas: um nome maior que
-- 120 caracteres fazia a criação da conta falhar inteira.
alter table public.profiles alter column display_name set default 'Usuário PwStreamer';

create or replace function app_private.handle_auth_user_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  foto text := coalesce(nullif(new.raw_user_meta_data ->> 'avatar_url', ''), nullif(new.raw_user_meta_data ->> 'picture', ''));
begin
  if tg_op = 'INSERT' then
    insert into public.profiles (id, email, display_name, avatar_url)
    values (
      new.id,
      coalesce(new.email, ''),
      left(coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), nullif(new.raw_user_meta_data ->> 'name', ''), 'Usuário PwStreamer'), 120),
      case when char_length(foto) <= 2048 then foto end
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

-- ── Banners e tickers do estúdio ───────────────────────────────────────────
-- Listas inteiras, gravadas de uma vez pelo app, cada uma na sua coluna:
-- gravar os banners não mexe nos tickers. Os canais, com as chaves, e a cor
-- dos gráficos ficam em `transmission`, que só o dono lê.
alter table public.studio_settings
  add column banners jsonb not null default '[]'::jsonb check (jsonb_typeof(banners) = 'array'),
  add column tickers jsonb not null default '[]'::jsonb check (jsonb_typeof(tickers) = 'array');

-- ── Roteiros do teleprompter ───────────────────────────────────────────────
-- Um por webinar e um geral (webinar_id nulo), para quando o estúdio abre sem
-- webinar: o texto que rola e as notas de quem apresenta.
create table public.teleprompter_scripts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  webinar_id uuid references public.webinars(id) on delete cascade,
  script text not null default '' check (char_length(script) <= 100000),
  notes text not null default '' check (char_length(notes) <= 20000),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (owner_id, webinar_id)
);

create index teleprompter_scripts_webinar_id_idx on public.teleprompter_scripts (webinar_id);

create trigger teleprompter_scripts_set_updated_at before update on public.teleprompter_scripts
  for each row execute procedure app_private.set_updated_at();

alter table public.teleprompter_scripts enable row level security;

revoke all on table public.teleprompter_scripts from anon, authenticated;
grant select, insert, update, delete on public.teleprompter_scripts to authenticated;

-- O roteiro de um webinar só se pendura num webinar da própria conta
create policy "owners can read their scripts"
  on public.teleprompter_scripts for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "owners can create their scripts"
  on public.teleprompter_scripts for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and (webinar_id is null or exists (
      select 1 from public.webinars w where w.id = webinar_id and w.owner_id = (select auth.uid())
    ))
  );
create policy "owners can update their scripts"
  on public.teleprompter_scripts for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and (webinar_id is null or exists (
      select 1 from public.webinars w where w.id = webinar_id and w.owner_id = (select auth.uid())
    ))
  );
create policy "owners can delete their scripts"
  on public.teleprompter_scripts for delete to authenticated
  using ((select auth.uid()) = owner_id);
