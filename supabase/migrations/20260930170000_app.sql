-- O que o app usa do banco além das tabelas: a gravação por partes das
-- configurações de transmissão e as mudanças em tempo real.

-- ── Configurações de transmissão ────────────────────────────────────────────
-- Os canais (com as chaves) e a cor dos gráficos moram juntos em
-- studio_settings.transmission, e o app grava um sem o outro: salvar os canais
-- não pode apagar a cor. A função junta as chaves do pedaço às que já estão
-- gravadas, numa instrução só, e devolve o resultado. Roda com a conta de quem
-- chama (security invoker): a RLS de studio_settings decide, e a linha é sempre
-- a da própria conta.
create function public.update_transmission(p_patch jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  resultado jsonb;
begin
  if jsonb_typeof(p_patch) is distinct from 'object' then
    raise exception 'as configurações de transmissão são um objeto' using errcode = '22023';
  end if;

  insert into public.studio_settings (user_id, transmission)
  values ((select auth.uid()), p_patch)
  on conflict (user_id) do update
    set transmission = public.studio_settings.transmission || excluded.transmission
  returning transmission into resultado;

  return resultado;
end;
$$;

revoke all on function public.update_transmission(jsonb) from public, anon;
grant execute on function public.update_transmission(jsonb) to authenticated;

-- ── Tempo real ───────────────────────────────────────────────────────────────
-- A lista de webinars, os canais, a cor, os banners e os tickers que outra aba
-- ou outro aparelho mudou chegam sem recarregar, como no Firestore. A RLS vale
-- também aqui: cada conta só recebe as mudanças das próprias linhas.
alter publication supabase_realtime add table public.webinars, public.studio_settings;
