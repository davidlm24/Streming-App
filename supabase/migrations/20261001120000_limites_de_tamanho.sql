-- Os limites de tamanho do que a conta grava (etapa 5). O plano grátis do
-- Supabase dá 500 MB de banco para o projeto INTEIRO, não por conta: uma conta
-- que gravasse um jsonb de megabytes em laço enchia o banco, e o projeto passa
-- a só-leitura para todo mundo. As colunas jsonb que a API aceita da conta não
-- tinham limite nenhum.
--
-- São dois buracos diferentes, e por isso duas travas:
--   1. o tamanho de cada valor — um `check` com `pg_column_size`;
--   2. a quantidade de linhas — um gatilho por conta, como o da mídia (etapa 4).
--
-- Sobre o `pg_column_size` num `check`: ele mede o valor CRU, antes de o
-- Postgres comprimir e mandar para o TOAST. 100 KB de 'x' repetido ocupam 1 KB
-- no disco, mas o `check` vê os 100 KB e recusa. É o lado certo do erro: o
-- limite vale sobre o que a conta manda, e não sobre o que por acaso comprime
-- bem — senão um jsonb repetitivo passaria por qualquer limite. Na prática, o
-- número é o tamanho do JSON em caracteres.
--
-- Os números saíram do uso de verdade, medido neste banco, e dos limites que a
-- tela já aplica (os `maxLength` dos campos). A folga é larga de propósito: um
-- limite apertado demais quebra quem está usando, e o risco aqui é a conta que
-- grava em laço, não a que escreve um texto comprido. Cada bloco anota o uso
-- medido ao lado do limite.
--
-- O que NÃO está aqui, de propósito: travar quais chaves cada jsonb aceita, ou
-- o tamanho de cada campo dentro dele. O teto da coluna já limita o estrago, e
-- uma lista de chaves no banco quebraria o app no dia em que a tela gravasse um
-- campo novo — o banco passaria a recusar a gravação sem ninguém entender.

-- ── As configurações do estúdio ───────────────────────────────────────────
-- É uma linha por conta (a chave primária é user_id), então aqui a conta não
-- multiplica linhas: só o tamanho de cada coluna precisa de trava. Somadas, as
-- sete colunas dão no máximo 272 KB por conta.

-- `transmission` guarda os canais (com as chaves) e a cor dos gráficos. Quem
-- grava é `update_transmission`, e o app passa o pedaço por `semSegredos`
-- (src/lib/dadosDaConta.ts), que só deixa passar `destinations` e
-- `streamColor`. Mas a função junta o pedaço ao que já está gravado com `||`,
-- e quem fala com a API não é obrigado a passar pelo app: por isso o teto vale
-- na coluna, e não na tela. O `check` pega as duas portas, porque quem grava na
-- tabela é a função.
--
-- Um canal é {id, name, platform, selected, isCustom, avatarUrl, streamKey,
-- streamUrl, updatedAt} — 300 bytes com os valores de hoje. O uso medido neste
-- banco é 356 bytes, com um canal. Nenhum dos três campos que a pessoa digita
-- (nome, servidor, chave) tem `maxLength` na tela, então 64 KB divididos por 32
-- canais deixam 2 KB por canal: cabe uma URL de RTMP e uma chave longas.
--
-- 32 canais é folga sobre os dois tetos reais: a tela monta uma linha por
-- plataforma, e são 9 (AddChannelsModal), e o plano deixa transmitir para no
-- máximo 8 ao mesmo tempo (destinosSimultaneos, em src/lib/plans.ts). O teto do
-- plano é dos canais LIGADOS; a conta guarda a lista inteira, ligada ou não.
alter table public.studio_settings
  add constraint studio_settings_transmission_objeto
    check (jsonb_typeof(transmission) = 'object' and pg_column_size(transmission) <= 65536),
  add constraint studio_settings_transmission_canais
    check (
      jsonb_typeof(transmission -> 'destinations') is distinct from 'array'
      or jsonb_array_length(transmission -> 'destinations') <= 32
    ),
  -- Os banners e os tickers são listas que o app grava inteiras, a cada
  -- mudança. A tela não limita quantos itens entram — o painel antigo mostrava
  -- um limite "/50" que o código nunca aplicou. 50 passa a ser o limite de
  -- verdade, agora no banco, que é onde ele vale para quem fala com a API
  -- direto.
  --
  -- Um banner é {id, text, subtitle}, com text e subtitle em 80 caracteres cada
  -- (PainelGraficos); um ticker é {id, text, badgeText}, com 200 e 20. Em UTF-8
  -- um caractere pode ocupar 4 bytes, então o pior ticker dá cerca de 900 bytes
  -- e 50 deles, 45 KB: 64 KB cabem até a lista cheia de emoji. O uso medido é
  -- um banner de 107 bytes.
  add constraint studio_settings_banners_tamanho
    check (pg_column_size(banners) <= 65536 and jsonb_array_length(banners) <= 50),
  add constraint studio_settings_tickers_tamanho
    check (pg_column_size(tickers) <= 65536 and jsonb_array_length(tickers) <= 50),
  -- Estas quatro ninguém grava: não há uma linha sequer em src/ que escreva
  -- nelas, e as quatro estão em '{}' neste banco. São do desenho do controle
  -- (#9), carregadas sem uso. Ficam com um teto modesto em vez de ficarem sem
  -- nenhum — uma coluna que ninguém usa, mas que a API aceita, é um buraco
  -- aberto à toa. O dia em que o estúdio gravar o palco de verdade, o teto sobe
  -- junto com o código que o usar.
  add constraint studio_settings_layout_tamanho
    check (jsonb_typeof(layout) = 'object' and pg_column_size(layout) <= 16384),
  add constraint studio_settings_overlays_tamanho
    check (jsonb_typeof(overlays) = 'object' and pg_column_size(overlays) <= 16384),
  add constraint studio_settings_scene_layouts_tamanho
    check (jsonb_typeof(scene_layouts) = 'object' and pg_column_size(scene_layouts) <= 32768),
  add constraint studio_settings_webhook_configuration_tamanho
    check (jsonb_typeof(webhook_configuration) = 'object' and pg_column_size(webhook_configuration) <= 16384);

-- ── Os webinars ───────────────────────────────────────────────────────────
-- `settings` guarda {time, channels, type, videoName}, e nada mais: `time` é a
-- data por extenso, `channels` são nomes de plataforma (no máximo 8, da lista
-- PLATAFORMAS_NOMEADAS), `type` e `videoName` são curtos. Dá menos de 250 bytes
-- sempre; o uso medido é 124. 4 KB é muitas vezes isso.
alter table public.webinars
  add constraint webinars_settings_tamanho
    check (jsonb_typeof(settings) = 'object' and pg_column_size(settings) <= 4096);

-- ── A audiência ───────────────────────────────────────────────────────────
-- Nada no app grava `attributes` (a tabela está vazia). 2 KB bastam para a
-- ficha de uma pessoa, e fecham a coluna enquanto ela não tem dono.
alter table public.audience_members
  add constraint audience_members_attributes_tamanho
    check (jsonb_typeof(attributes) = 'object' and pg_column_size(attributes) <= 2048);

-- ── Quantas linhas cada conta cria ────────────────────────────────────────
-- Webinars, snapshots e pessoas da audiência a conta insere à vontade: a RLS
-- diz de quem é a linha, não quantas cabem. Sem teto, um laço de `insert` enche
-- o banco do mesmo jeito que um jsonb grande — e mais barato.
--
-- O gatilho segue o da mídia (etapa 4): roda como dono da função, para contar a
-- conta inteira qualquer que seja a regra de leitura; pula a linha de outra
-- conta, que a RLS recusa logo depois (contar ali diria quantas linhas a outra
-- conta tem, e os pedidos segurariam a trava dela); e trava por conta, para
-- dois `insert` ao mesmo tempo não passarem juntos pelo teto.
--
-- Um gatilho só, com a coluna da dona, o teto e o código do erro como
-- argumentos: as três tabelas só diferem nisso. Um código de erro por limite,
-- como MD001/MD002 da mídia, para a tela saber qual teto bateu.
--
-- A contagem tira a própria linha (id <> new.id), e isso não é detalhe: o app
-- grava o webinar com `upsert` na id (agendarWebinar, em src/lib/dadosDaConta.ts),
-- que é um `insert ... on conflict do update`, e um gatilho BEFORE INSERT roda
-- ANTES de o Postgres descobrir o conflito. Sem tirar a própria linha, a conta
-- no teto não conseguiria mais EDITAR um webinar que já tem — só criar é que
-- devia parar.
create function app_private.conferir_teto_de_linhas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  coluna text := tg_argv[0];
  teto integer := tg_argv[1]::integer;
  codigo text := tg_argv[2];
  dona uuid := (to_jsonb(new) ->> coluna)::uuid;
  quantas bigint;
begin
  if (select auth.uid()) is not null and dona <> (select auth.uid()) then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(tg_table_name || '/' || dona::text, 0));
  -- O nome da tabela e o da coluna vêm da definição do gatilho, logo abaixo,
  -- e não de quem chama; o %I fecha o resto.
  execute format('select count(*) from public.%I where %I = $1 and id <> $2', tg_table_name, coluna)
    into quantas using dona, (to_jsonb(new) ->> 'id')::uuid;
  if quantas >= teto then
    raise exception 'row_limit: a conta guarda até % linhas em %', teto, tg_table_name
      using errcode = codigo;
  end if;
  return new;
end;
$$;

revoke all on function app_private.conferir_teto_de_linhas() from public, anon, authenticated;

-- 500 webinars é muito acima do uso (há 1 neste banco) e acima de anos de uso
-- pesado; quem passar disso apaga os antigos.
create trigger webinars_row_limit
  before insert on public.webinars
  for each row execute function app_private.conferir_teto_de_linhas('owner_id', '500', 'WB001');

-- Os snapshots o app ainda não grava; 500 é teto de sobra para a tela que vier.
create trigger snapshots_row_limit
  before insert on public.snapshots
  for each row execute function app_private.conferir_teto_de_linhas('user_id', '500', 'SN001');

-- A audiência também não é gravada hoje; 1000 pessoas por conta é folga.
create trigger audience_members_row_limit
  before insert on public.audience_members
  for each row execute function app_private.conferir_teto_de_linhas('user_id', '1000', 'AU001');

-- ── Os roteiros do teleprompter ───────────────────────────────────────────
-- Aqui o buraco não é a quantidade de linhas: há um roteiro por webinar (a
-- chave única (owner_id, webinar_id)) e mais um geral, então o teto dos
-- webinars já limita as linhas. O buraco é o tamanho. Cada roteiro aceita
-- 100.000 caracteres de texto e 20.000 de notas, e 501 roteiros cheios dariam
-- 60 MB numa conta só — mais do que todo o resto desta migração somado.
--
-- Apertar o limite de cada roteiro resolveria, mas cortaria o roteiro de um
-- webinar longo: 100.000 caracteres são cerca de duas horas de fala, que é o
-- que o limite da etapa 3 quis permitir, e a tela nem mostra um `maxLength`
-- para a pessoa ver que passou. Então o teto é a soma da conta, como os 200 MB
-- da mídia: 2 MB de texto, que dão um roteiro enorme ou duzentos de tamanho
-- normal. O uso medido é um roteiro de algumas dezenas de bytes.
create function app_private.conferir_texto_dos_roteiros()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  usados bigint;
begin
  if (select auth.uid()) is not null and new.owner_id <> (select auth.uid()) then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('teleprompter_scripts/' || new.owner_id::text, 0));
  select coalesce(sum(char_length(s.script) + char_length(s.notes)), 0)
  into usados
  from public.teleprompter_scripts s
  where s.owner_id = new.owner_id
    and s.id <> new.id;
  if usados + char_length(new.script) + char_length(new.notes) > 2097152 then
    raise exception 'script_text_limit: a conta guarda até 2 MB de roteiro'
      using errcode = 'TP001';
  end if;
  return new;
end;
$$;

revoke all on function app_private.conferir_texto_dos_roteiros() from public, anon, authenticated;

-- Vale no insert e no update: o app grava o roteiro com `upsert` enquanto a
-- pessoa digita, e um roteiro cresce ao ser editado.
create trigger teleprompter_scripts_text_limit
  before insert or update on public.teleprompter_scripts
  for each row execute function app_private.conferir_texto_dos_roteiros();
