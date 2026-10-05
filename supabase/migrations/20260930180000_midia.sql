-- A mídia do estúdio na conta (etapa 4). O bucket aceita só o que o estúdio
-- envia, até 50 MB por arquivo, e cada conta guarda até 200 MB em até 300
-- arquivos. Os limites valem no banco, em cada gravação, e não só na tela.

-- 50 MB por arquivo é o limite do plano grátis do Supabase. O bucket diz o
-- mesmo, para o local e a nuvem recusarem igual. Os formatos são os que o
-- estúdio envia: um logo em SVG vira PNG antes de sair do navegador, porque
-- um SVG pode levar script. Saem o SVG, o áudio e o PDF.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm']
where id = 'media-assets';

-- ── Os limites da conta no bucket ─────────────────────────────────────────
-- O Storage confere as regras numa linha de teste, antes de receber o
-- arquivo, e grava a linha de verdade depois, como superusuário, sem regra
-- nenhuma. Os limites ficam então num gatilho, que roda nas duas e em
-- qualquer caminho de envio (URL assinada, cópia, TUS, S3). Uma trava por
-- pasta faz as gravações de uma conta passarem uma de cada vez: dois envios
-- juntos não passam do limite. A soma roda como o dono da função, para contar
-- a pasta inteira, qualquer que seja a regra de leitura. O Storage devolve só
-- o código do erro, e cada limite tem o seu: MD001 o espaço, MD002 os arquivos.
create function app_private.conferir_limites_da_midia()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pasta text := split_part(new.name, '/', 1);
  tamanho bigint;
  bytes bigint;
  arquivos bigint;
begin
  if new.bucket_id <> 'media-assets' then
    return new;
  end if;
  -- A pasta de outra conta, a regra de envio recusa logo depois. Aqui nada é
  -- somado nem travado: senão a recusa diria quanto a outra conta guarda, e
  -- os pedidos segurariam a trava dela. Na gravação final do Storage não há
  -- conta (a chave de serviço não tem sub), e o limite vale.
  if (select auth.uid()) is not null and pasta <> (select auth.uid())::text then
    return new;
  end if;
  -- Uma mudança que não mexe no arquivo (a data do último acesso, por exemplo)
  if tg_op = 'UPDATE' and new.name = old.name and new.bucket_id = old.bucket_id
     and new.metadata is not distinct from old.metadata then
    return new;
  end if;

  -- O tamanho do arquivo; na linha de teste, antes de o arquivo chegar, o que
  -- o pedido declara. Sem nenhum dos dois, não entra.
  tamanho := coalesce(
    case when new.metadata ->> 'size' ~ '^[0-9]{1,12}$' then (new.metadata ->> 'size')::bigint end,
    case when new.metadata ->> 'contentLength' ~ '^[0-9]{1,12}$' then (new.metadata ->> 'contentLength')::bigint end
  );

  perform pg_advisory_xact_lock(hashtextextended('media-assets/' || pasta, 0));
  -- O LIKE usa o índice do nome; a comparação da pasta tira o que ele pega a mais
  select
    coalesce(sum(case when o.metadata ->> 'size' ~ '^[0-9]{1,12}$' then (o.metadata ->> 'size')::bigint end), 0),
    count(*)
  into bytes, arquivos
  from storage.objects o
  where o.bucket_id = 'media-assets'
    and o.name like pasta || '/%'
    and (storage.foldername(o.name))[1] = pasta
    and o.name <> new.name;

  if arquivos >= 300 then
    raise exception 'media_file_limit: the account keeps up to 300 media files' using errcode = 'MD002';
  end if;
  if tamanho is null or bytes + tamanho > 209715200 then
    raise exception 'media_space_limit: the account keeps up to 200 MB of media' using errcode = 'MD001';
  end if;
  return new;
end;
$$;

revoke all on function app_private.conferir_limites_da_midia() from public, anon, authenticated;

create trigger media_assets_limits
  before insert or update on storage.objects
  for each row execute function app_private.conferir_limites_da_midia();

-- Um envio só entra na pasta da conta e pelo envio comum, o único que o app
-- faz: nada de URL assinada, cópia, TUS ou S3.
drop policy "media owners can upload to their folder" on storage.objects;
create policy "media owners can upload to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media-assets'
    and (select storage.operation()) = 'storage.object.upload'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- O estúdio nunca substitui um arquivo: cada envio tem um nome novo.
-- Substituir deixaria trocar um arquivo pequeno por um grande.
drop policy "media owners can replace their objects" on storage.objects;

-- ── A ficha de cada arquivo ───────────────────────────────────────────────
-- A ficha é só do dono, no formato que o estúdio grava, e só de um arquivo
-- que já está no bucket, com o mesmo tamanho e formato: uma conta não enche o
-- banco com fichas soltas, e o uso que a tela mostra é o do bucket.
alter table public.media_assets
  add constraint media_assets_storage_path_shape
    check (storage_path ~ ('^' || owner_id::text || '/' || id::text || '\.(png|jpg|webp|mp4|webm)$')),
  add constraint media_assets_content_type_allowed
    check (content_type in ('image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm')),
  add constraint media_assets_byte_size_per_file
    check (byte_size <= 52428800),
  add constraint media_assets_metadata_small
    check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 512);

drop policy "public media metadata is readable by anonymous visitors" on public.media_assets;
drop policy "authenticated users can read public, own, or admin media metadata" on public.media_assets;
drop policy "owners can create media metadata" on public.media_assets;
drop policy "owners and admins can update media metadata" on public.media_assets;
drop policy "owners and admins can delete media metadata" on public.media_assets;
-- A ficha não muda depois de gravada
revoke update on public.media_assets from authenticated;

create policy "owners can read their media metadata"
  on public.media_assets for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "owners can describe a file already in their folder"
  on public.media_assets for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1
      from storage.objects o
      where o.bucket_id = 'media-assets'
        and o.name = storage_path
        and o.metadata ->> 'size' = byte_size::text
        and o.metadata ->> 'mimetype' = content_type
    )
  );
create policy "owners can delete their media metadata"
  on public.media_assets for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- Até 300 fichas por conta, como os arquivos: uma ficha cujo arquivo saiu
-- continua contando até sair também.
create function app_private.conferir_fichas_da_midia()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- A ficha de outra conta, a regra recusa logo depois, sem contar as fichas dela
  if (select auth.uid()) is not null and new.owner_id <> (select auth.uid()) then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('media_assets/' || new.owner_id::text, 0));
  if (select count(*) from public.media_assets m where m.owner_id = new.owner_id) >= 300 then
    raise exception 'media_file_limit: the account keeps up to 300 media files' using errcode = 'MD002';
  end if;
  return new;
end;
$$;

revoke all on function app_private.conferir_fichas_da_midia() from public, anon, authenticated;

create trigger media_assets_row_limit
  before insert on public.media_assets
  for each row execute function app_private.conferir_fichas_da_midia();
