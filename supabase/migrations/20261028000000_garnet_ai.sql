-- Garnet AI: camada de banco dos agentes (contrato em docs/arquitetura.md).
-- Tudo com prefixo ai_ no schema public. NÃO altera nenhuma tabela do Busca Leads
-- (leads, segmentos, interacoes, favoritos): apenas lê, nas views.
-- Reversão: supabase/rollback/20261028000000_garnet_ai_down.sql

-- =====================================================================
-- Funções auxiliares
-- =====================================================================

create or replace function public.ai_set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.ai_set_atualizado_em() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- =====================================================================
-- Tabelas
-- =====================================================================

create table if not exists public.ai_operadores (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

-- Quem pode usar o painel: e-mail do JWT presente em ai_operadores.
create or replace function public.ai_permitido() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.ai_operadores
    where email = lower(auth.jwt() ->> 'email')
  );
$$;

create table if not exists public.ai_config (
  chave text primary key,
  valor jsonb not null,
  descricao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_agentes (
  id text primary key,
  nome text not null,
  papel text not null,
  descricao text,
  cor text not null default '#C9A227' check (cor ~* '^#[0-9a-f]{6}$'),
  icone text not null default 'bot',
  ordem smallint not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_turnos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('manha', 'tarde', 'marketing', 'performance', 'manual')),
  status text not null default 'em_andamento'
    check (status in ('em_andamento', 'concluido', 'falhou', 'interrompido')),
  iniciado_em timestamptz not null default now(),
  finalizado_em timestamptz,
  resumo text,
  metricas jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_execucoes (
  id uuid primary key default gen_random_uuid(),
  turno_id uuid references public.ai_turnos (id) on delete cascade,
  agente_id text not null references public.ai_agentes (id),
  instancia text,
  status text not null default 'na_fila'
    check (status in ('na_fila', 'trabalhando', 'concluida', 'falhou', 'bloqueada')),
  tarefa text,
  resultado text,
  iniciado_em timestamptz not null default now(),
  finalizado_em timestamptz,
  erro text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_eventos (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  turno_id uuid references public.ai_turnos (id) on delete set null,
  execucao_id uuid references public.ai_execucoes (id) on delete set null,
  agente_id text references public.ai_agentes (id),
  lead_id uuid references public.leads (id) on delete set null,
  tipo text not null default 'info' check (tipo in ('info', 'acao', 'decisao', 'handoff', 'alerta', 'erro')),
  mensagem text not null,
  dados jsonb not null default '{}'::jsonb
);

create table if not exists public.ai_fila (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,  -- ex.: classificar_resposta, payload {"interacao_id": uuid, "rascunho_id": uuid|null}
  agente_id text references public.ai_agentes (id),
  lead_id uuid references public.leads (id) on delete set null,
  prioridade smallint not null default 3 check (prioridade between 1 and 5),
  status text not null default 'pendente'
    check (status in ('pendente', 'em_execucao', 'concluida', 'falhou', 'cancelada')),
  tentativas integer not null default 0,
  max_tentativas integer not null default 3,
  chave_idempotencia text unique,
  payload jsonb not null default '{}'::jsonb,
  agendada_para timestamptz not null default now(),
  resultado jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_leads_qualificacao (
  lead_id uuid primary key references public.leads (id) on delete cascade,
  publico text check (publico in ('influenciadora', 'marca_indie', 'distribuidor')),
  score smallint not null check (score between 0 and 100),
  motivos jsonb not null default '[]'::jsonb,  -- [{criterio, pontos, evidencia, fonte}]
  sinais jsonb not null default '{}'::jsonb,
  resumo text,
  agente_id text references public.ai_agentes (id),
  created_at timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.ai_rascunhos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  execucao_id uuid references public.ai_execucoes (id) on delete set null,
  agente_id text references public.ai_agentes (id),
  canal text not null check (canal in ('whatsapp', 'email', 'instagram')),
  passo_cadencia smallint not null default 0 check (passo_cadencia between 0 and 3),
  assunto text,
  texto text not null,
  justificativa text,
  status text not null default 'aguardando_auditoria'
    check (status in ('aguardando_auditoria', 'reprovado_auditoria', 'aguardando_aprovacao',
                      'aprovado', 'enviado', 'rejeitado', 'descartado')),
  auditoria jsonb,  -- {aprovado, checagens:[{regra, ok, nota}], motivo}
  texto_final text,
  motivo_rejeicao text,
  aprovado_em timestamptz,
  enviado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Um rascunho "vivo" por lead + canal + passo da cadência.
create unique index if not exists ai_rascunhos_unico_vivo
  on public.ai_rascunhos (lead_id, canal, passo_cadencia)
  where status not in ('rejeitado', 'reprovado_auditoria', 'descartado');

create table if not exists public.ai_interacoes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  canal text not null check (canal in ('whatsapp', 'email', 'instagram')),
  direcao text not null check (direcao in ('saida', 'entrada')),
  resumo text,
  conteudo text,
  intencao text check (intencao in ('interessado', 'orcamento', 'amostra', 'duvida', 'nao_agora', 'opt_out', 'outro')),
  rascunho_id uuid references public.ai_rascunhos (id) on delete set null,
  registrado_por text not null default 'humano',  -- 'humano' ou id do agente
  created_at timestamptz not null default now()
);

create table if not exists public.ai_oportunidades (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  etapa text not null default 'conversa'
    check (etapa in ('conversa', 'briefing', 'amostra', 'proposta', 'negociacao', 'ganho', 'perdido')),
  categoria_produto text,
  quantidade_estimada integer,
  valor_estimado numeric,
  briefing jsonb not null default '{}'::jsonb,
  proxima_acao text,
  proxima_acao_em date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_bloqueios (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete set null,
  email text,
  telefone text,
  motivo text,
  created_at timestamptz not null default now(),
  check (lead_id is not null or email is not null or telefone is not null)
);

create table if not exists public.ai_conteudos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('post', 'reels', 'carrossel', 'story', 'anuncio')),
  titulo text not null,
  roteiro text,
  legenda text,
  publico text,
  data_sugerida date,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'reprovado_auditoria', 'aguardando_aprovacao', 'aprovado', 'publicado', 'rejeitado')),
  auditoria jsonb,
  agente_id text references public.ai_agentes (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_campanhas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  plataforma text not null default 'meta' check (plataforma in ('meta', 'google', 'outro')),
  objetivo text,
  publico text,
  orcamento numeric,
  gasto numeric not null default 0,
  status text not null default 'proposta'
    check (status in ('proposta', 'aprovada', 'ativa', 'pausada', 'encerrada')),
  auditoria jsonb,
  criativos jsonb not null default '[]'::jsonb,
  resultados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bloqueio permanente (opt-out): por id do lead, e-mail ou telefone/whatsapp do lead.
create or replace function public.ai_lead_bloqueado(lead uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.leads l
    join public.ai_bloqueios b on (
         b.lead_id = l.id
      or (b.email is not null and l.email is not null and lower(b.email) = lower(l.email))
      -- telefone: compara os 10 últimos dígitos (ignora +55, máscara e 9º dígito inicial)
      or (b.telefone is not null and length(regexp_replace(b.telefone, '\D', '', 'g')) >= 10 and (
             right(regexp_replace(b.telefone, '\D', '', 'g'), 10) = right(regexp_replace(coalesce(l.telefone, ''), '\D', '', 'g'), 10)
          or right(regexp_replace(b.telefone, '\D', '', 'g'), 10) = right(regexp_replace(coalesce(l.whatsapp, ''), '\D', '', 'g'), 10)))
    )
    where l.id = lead
  )
  or exists (select 1 from public.ai_bloqueios where lead_id = lead);
$$;

revoke execute on function public.ai_permitido() from public, anon;
revoke execute on function public.ai_lead_bloqueado(uuid) from public, anon;
grant execute on function public.ai_permitido() to authenticated, service_role;
grant execute on function public.ai_lead_bloqueado(uuid) to authenticated, service_role;

-- =====================================================================
-- Índices
-- =====================================================================

create index if not exists ai_eventos_created_idx on public.ai_eventos (created_at desc);
create index if not exists ai_eventos_agente_idx on public.ai_eventos (agente_id, created_at desc);
create index if not exists ai_eventos_turno_idx on public.ai_eventos (turno_id);
create index if not exists ai_eventos_lead_idx on public.ai_eventos (lead_id);
create index if not exists ai_turnos_iniciado_idx on public.ai_turnos (iniciado_em desc);
create index if not exists ai_execucoes_turno_idx on public.ai_execucoes (turno_id);
create index if not exists ai_execucoes_agente_idx on public.ai_execucoes (agente_id, iniciado_em desc);
create index if not exists ai_fila_busca_idx on public.ai_fila (status, prioridade, agendada_para);
create index if not exists ai_fila_lead_idx on public.ai_fila (lead_id);
create index if not exists ai_rascunhos_status_idx on public.ai_rascunhos (status);
create index if not exists ai_rascunhos_lead_idx on public.ai_rascunhos (lead_id);
create index if not exists ai_interacoes_lead_idx on public.ai_interacoes (lead_id, created_at desc);
create index if not exists ai_oportunidades_lead_idx on public.ai_oportunidades (lead_id);
create index if not exists ai_oportunidades_etapa_idx on public.ai_oportunidades (etapa);
create index if not exists ai_bloqueios_lead_idx on public.ai_bloqueios (lead_id);
create index if not exists ai_bloqueios_email_idx on public.ai_bloqueios (lower(email));
create index if not exists ai_leads_qualificacao_score_idx on public.ai_leads_qualificacao (score desc);

-- =====================================================================
-- Triggers de updated_at
-- =====================================================================

do $$
declare t text;
begin
  foreach t in array array['ai_config', 'ai_fila', 'ai_rascunhos', 'ai_oportunidades', 'ai_conteudos', 'ai_campanhas']
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.ai_set_updated_at()',
                   t || '_updated_at', t);
  end loop;
end $$;

drop trigger if exists ai_leads_qualificacao_atualizado_em on public.ai_leads_qualificacao;
create trigger ai_leads_qualificacao_atualizado_em before update on public.ai_leads_qualificacao
  for each row execute function public.ai_set_atualizado_em();

-- =====================================================================
-- RLS, policies e grants
-- =====================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'ai_operadores', 'ai_config', 'ai_agentes', 'ai_turnos', 'ai_execucoes', 'ai_eventos', 'ai_fila',
    'ai_leads_qualificacao', 'ai_rascunhos', 'ai_interacoes', 'ai_oportunidades', 'ai_bloqueios',
    'ai_conteudos', 'ai_campanhas'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_operadores', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.ai_permitido())) with check ((select public.ai_permitido()))',
      t || '_operadores', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

grant usage, select on sequence public.ai_eventos_id_seq to authenticated, service_role;

-- =====================================================================
-- Views (security_invoker: respeitam o RLS de quem consulta)
-- =====================================================================

create or replace view public.ai_v_leads_alvo with (security_invoker = true) as
select
  l.id,
  l.nome,
  l.segmento_id,
  case l.segmento_id
    when 'influenciadora' then 'influenciadora'
    when 'maquiador' then 'influenciadora'
    when 'marca_indie' then 'marca_indie'
    when 'tiktok_perfumaria' then 'marca_indie'
    when 'distribuidor' then 'distribuidor'
  end as publico,
  l.cidade,
  l.uf,
  l.site,
  l.instagram,
  l.tiktok,
  l.seguidores,
  l.email,
  (l.email is not null and l.email <> '') as tem_email,
  l.whatsapp,
  l.telefone,
  (l.whatsapp is not null and l.whatsapp <> '') as tem_whatsapp,
  l.status as status_busca,
  l.score as score_base,
  q.score as score_ai,
  case l.status when 'respondeu' then 1 when 'contatado' then 2 else 3 end as prioridade,
  public.ai_lead_bloqueado(l.id) as bloqueado,
  (select max(i.created_at) from public.ai_interacoes i
     where i.lead_id = l.id and i.direcao = 'saida') as ultimo_contato_ai,
  (select count(*) from public.ai_rascunhos r
     where r.lead_id = l.id
       and r.status in ('aguardando_auditoria', 'aguardando_aprovacao', 'aprovado'))::int as rascunhos_abertos,
  (select bi.resumo from public.interacoes bi
     where bi.lead_id = l.id order by bi.created_at desc limit 1) as ultima_interacao_resumo
from public.leads l
left join public.ai_leads_qualificacao q on q.lead_id = l.id
where l.segmento_id in ('influenciadora', 'maquiador', 'marca_indie', 'tiktok_perfumaria', 'distribuidor')
  and l.status not in ('ganho', 'perdido', 'descartado');

create or replace view public.ai_v_agentes_status with (security_invoker = true) as
select
  a.id,
  a.nome,
  a.papel,
  a.descricao,
  a.cor,
  a.icone,
  a.ordem,
  a.ativo,
  u.id as execucao_id,
  u.instancia,
  u.status as status_execucao,
  u.tarefa,
  u.resultado,
  u.erro,
  u.iniciado_em,
  u.finalizado_em,
  coalesce(h.execucoes_hoje, 0) as execucoes_hoje,
  coalesce(h.concluidas_hoje, 0) as concluidas_hoje,
  coalesce(h.falhas_hoje, 0) as falhas_hoje
from public.ai_agentes a
left join lateral (
  select e.* from public.ai_execucoes e
  where e.agente_id = a.id
  order by e.iniciado_em desc, e.created_at desc
  limit 1
) u on true
left join lateral (
  select count(*)::int as execucoes_hoje,
         (count(*) filter (where e.status = 'concluida'))::int as concluidas_hoje,
         (count(*) filter (where e.status = 'falhou'))::int as falhas_hoje
  from public.ai_execucoes e
  where e.agente_id = a.id
    and (e.iniciado_em at time zone 'America/Sao_Paulo')::date = (now() at time zone 'America/Sao_Paulo')::date
) h on true;

-- Formato longo (grupo, chave, total) para o painel montar o funil.
create or replace view public.ai_v_funil with (security_invoker = true) as
select 'geral'::text as grupo, 'alvos'::text as chave, count(*) as total from public.ai_v_leads_alvo
union all
select 'geral', 'qualificados', count(*) from public.ai_leads_qualificacao
union all
select 'rascunhos', r.status, count(*) from public.ai_rascunhos r group by r.status
union all
select 'geral', 'enviados', count(*) from public.ai_rascunhos where status = 'enviado'
union all
select 'geral', 'respostas', count(*) from public.ai_interacoes where direcao = 'entrada'
union all
select 'oportunidades', o.etapa, count(*) from public.ai_oportunidades o group by o.etapa;

grant select on public.ai_v_leads_alvo, public.ai_v_agentes_status, public.ai_v_funil to authenticated;
grant select on public.ai_v_leads_alvo, public.ai_v_agentes_status, public.ai_v_funil to service_role;

-- =====================================================================
-- Seeds
-- =====================================================================

insert into public.ai_agentes (id, nome, papel, descricao, cor, icone, ordem) values
  ('orquestrador',  'Orquestrador',                'Coordena o turno',
   'Abre o turno, escolhe leads, distribui, aplica limites, resume', '#C9A227', 'compass', 1),
  ('qualificacao',  'Inteligência & Qualificação', 'Pesquisa e score',
   'Pesquisa sinais públicos e dá score com motivos', '#8A7F6A', 'search', 2),
  ('sdr',           'SDR',                         'Primeiro contato',
   'Escreve rascunhos de abordagem (instâncias: influenciadoras, marcas_indie, distribuidores)', '#A67C52', 'send', 3),
  ('atendimento',   'Atendimento & Pré-vendas',    'Respostas e briefing',
   'Classifica respostas, monta briefing, sugere próxima ação', '#6F8F86', 'message-circle', 4),
  ('marketing',     'Marketing & Social',          'Conteúdo e anúncios',
   'Calendário, roteiros, legendas, plano de anúncios', '#B4637A', 'megaphone', 5),
  ('performance',   'Performance',                 'KPIs e relatórios',
   'KPIs do funil e relatório semanal', '#7A8CA3', 'bar-chart-3', 6),
  ('auditor',       'Auditor de Conformidade',     'Revisão de texto',
   'Revisa todo texto antes de chegar ao humano', '#5E6B5E', 'shield-check', 7)
on conflict (id) do nothing;

insert into public.ai_config (chave, valor, descricao) values
  ('kill_switch', 'false'::jsonb, 'Se true, nenhum turno novo inicia'),
  ('limite_rascunhos_turno', '20'::jsonb, 'Máximo de rascunhos criados por turno'),
  ('limite_contatos_lead_dia', '1'::jsonb, 'Máximo de contatos por lead por dia'),
  ('cadencia_dias', '[0,3,8,15]'::jsonb, 'Dias após o primeiro contato de cada passo da cadência'),
  ('orcamento_ads_mes', '1000'::jsonb, 'Orçamento de anúncios por mês (R$); gasto só com aprovação humana'),
  ('publicos', '["influenciadora","marca_indie","distribuidor"]'::jsonb, 'Públicos-alvo ativos')
on conflict (chave) do nothing;

-- Operadores: NÃO inserimos e-mails aqui (repositório público). O dono roda no SQL Editor:
--   insert into public.ai_operadores (email) values (lower('SEU-EMAIL@exemplo.com')) on conflict do nothing;

-- =====================================================================
-- Realtime (ignora se a publicação não existir)
-- =====================================================================

do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['ai_eventos', 'ai_execucoes', 'ai_rascunhos']
    loop
      begin
        execute format('alter publication supabase_realtime add table public.%I', t);
      exception when duplicate_object then
        null;  -- já estava na publicação
      end;
    end loop;
  end if;
exception when others then
  raise notice 'realtime não configurado: %', sqlerrm;
end $$;
