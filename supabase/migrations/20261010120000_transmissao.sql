-- A transmissão de verdade: o programa composto sai do navegador por
-- WebSocket (pedaços WebM) para o motor de transmissão (motor/), que codifica
-- uma vez e empurra para cada canal por RTMP. Cada transmissão é uma linha de
-- stream_sessions, cada canal dela uma de stream_destinations; o servidor da
-- API grava as duas pelas funções abaixo (só a chave secreta as executa, como
-- em 20260930160000_servidor.sql), e o dono lê pelas RLS que já existem.
--
-- O protocolo de entrada ganha o nome do que o motor recebe. As chaves de
-- transmissão dos canais NÃO passam por aqui: vão do navegador ao motor, e o
-- motor as esquece ao encerrar (app_private.destination_credentials fica para
-- quando as chaves morarem no servidor).

alter table public.stream_sessions
  drop constraint if exists stream_sessions_ingest_protocol_check;
alter table public.stream_sessions
  add constraint stream_sessions_ingest_protocol_check
  check (ingest_protocol in ('rtmp', 'rtmps', 'srt', 'whip', 'websocket'));

-- O dono lista as suas transmissões da mais recente para a mais antiga
create index if not exists stream_sessions_owner_requested_idx
  on public.stream_sessions (owner_id, requested_at desc);

-- A duração em segundos de uma transmissão encerrada, para o uso do plano
-- somar sem repetir a conta em cada tela
alter table public.stream_sessions
  add column if not exists duration_seconds integer
  generated always as (
    case when started_at is not null and stopped_at is not null
      then greatest(0, floor(extract(epoch from (stopped_at - started_at)))::integer)
    end
  ) stored;

-- ── O servidor registra a transmissão ────────────────────────────────────────
-- Uma transmissão e os seus canais numa transação só. O webinar só entra se
-- for da mesma conta. p_destinos é uma lista de {platform, target_url}, na
-- ordem da tela; devolve o id da transmissão e o id de cada canal, na mesma
-- ordem, para a API dizer ao navegador qual é qual.
create function public.registrar_transmissao(
  p_owner_id uuid,
  p_webinar_id uuid,
  p_title text,
  p_destinos jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  sessao uuid;
  webinar uuid;
  ids jsonb;
begin
  if p_destinos is null or jsonb_typeof(p_destinos) <> 'array' or jsonb_array_length(p_destinos) between 1 and 10 = false then
    raise exception 'a transmissão precisa de 1 a 10 canais';
  end if;
  select w.id into webinar from public.webinars w where w.id = p_webinar_id and w.owner_id = p_owner_id;

  insert into public.stream_sessions (owner_id, webinar_id, title, status, ingest_protocol, resolution, bitrate_kbps, fps, media_provider)
  values (p_owner_id, webinar, p_title, 'starting', 'websocket', '720p', 3000, 30, 'motor')
  returning id into sessao;

  with destinos as (
    insert into public.stream_destinations (session_id, owner_id, platform, target_url, status, position)
    select sessao, p_owner_id, d->>'platform', d->>'target_url', 'connecting', (ordem - 1)::smallint
    from jsonb_array_elements(p_destinos) with ordinality as t(d, ordem)
    returning id, position
  )
  select jsonb_agg(jsonb_build_object('id', id, 'position', position) order by position) into ids from destinos;

  return jsonb_build_object('id', sessao, 'destinos', coalesce(ids, '[]'::jsonb));
end;
$$;

revoke all on function public.registrar_transmissao(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.registrar_transmissao(uuid, uuid, text, jsonb) to service_role;

-- ── O motor conta o que aconteceu ────────────────────────────────────────────
-- 'inicio' põe a transmissão no ar; 'destino' muda o estado de um canal
-- (p_estado é um public.destination_status); 'fim' encerra: com p_detalhe é
-- uma falha, sem ele um encerramento pedido. Um fim repetido não mexe em
-- nada: a transmissão só sai de 'starting' ou 'live'. Devolve se mudou algo.
-- Com p_owner_id (o fim pedido pelo dono, pela API), só a transmissão dele.
create function public.evento_do_motor(
  p_sessao uuid,
  p_evento text,
  p_destino uuid default null,
  p_estado text default null,
  p_detalhe text default null,
  p_owner_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  mudou integer := 0;
begin
  if p_evento = 'inicio' then
    update public.stream_sessions set status = 'live', started_at = now()
    where id = p_sessao and status = 'starting';
  elsif p_evento = 'destino' then
    update public.stream_destinations
    set status = p_estado::public.destination_status,
        -- O motivo da última queda fica guardado até o canal voltar ao ar
        last_error = case when p_estado = 'live' then null else coalesce(p_detalhe, last_error) end,
        last_connected_at = case when p_estado = 'live' then now() else last_connected_at end
    where id = p_destino and session_id = p_sessao;
  elsif p_evento = 'fim' then
    update public.stream_sessions
    set status = (case when p_detalhe is null then 'stopped' else 'failed' end)::public.stream_status,
        stopped_at = now(),
        failure_detail = p_detalhe
    where id = p_sessao and status in ('starting', 'live')
      and (p_owner_id is null or owner_id = p_owner_id);
  else
    raise exception 'evento desconhecido: %', p_evento;
  end if;
  get diagnostics mudou = row_count;
  return mudou > 0;
end;
$$;

revoke all on function public.evento_do_motor(uuid, text, uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.evento_do_motor(uuid, text, uuid, text, text, uuid) to service_role;
