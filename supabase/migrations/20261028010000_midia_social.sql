-- Garnet AI — Mídia social (docs/arquitetura.md, seção "Mídia social").
-- Idempotente: pode ser reexecutada. Aplicar no SQL Editor do Supabase.

-- ---------------------------------------------------------------------
-- Agentes: novo "social" e renomeação do "marketing"
-- ---------------------------------------------------------------------
-- Libera a ordem 6 para o social (performance 6→7, auditor 7→8). Só mexe se ainda não foi aplicado.
update public.ai_agentes set ordem = ordem + 1
 where id in ('performance', 'auditor')
   and not exists (select 1 from public.ai_agentes where id = 'social');

insert into public.ai_agentes (id, nome, papel, descricao, cor, icone, ordem) values
  ('social', 'Gestor de Mídia Social', 'Conteúdo orgânico diário',
   'Produz 1 peça por dia útil para Instagram e Facebook (carrossel, post único ou roteiro de Reels), com imagens, legenda e hashtags; a publicação é manual pelo dono após aprovação',
   '#8E6C8A', 'image', 6)
on conflict (id) do nothing;

update public.ai_agentes
   set nome = 'Gestor de Tráfego & Marketing',
       papel = 'Anúncios e estratégia',
       descricao = 'Anúncios pagos, orçamento, campanhas e calendário estratégico de conteúdo (o orgânico diário fica com o Gestor de Mídia Social)'
 where id = 'marketing';

-- Turno do social (runbooks/social-diario.md): amplia o check de ai_turnos.tipo.
do $$
begin
  alter table public.ai_turnos drop constraint if exists ai_turnos_tipo_check;
  alter table public.ai_turnos add constraint ai_turnos_tipo_check
    check (tipo in ('manha', 'tarde', 'marketing', 'performance', 'manual', 'social'));
end $$;

-- ---------------------------------------------------------------------
-- ai_conteudos: mídia, canais, hashtags, publicação e spec do carrossel
-- ---------------------------------------------------------------------
alter table public.ai_conteudos add column if not exists midia jsonb not null default '[]'::jsonb;  -- [{url, ordem, alt}]
alter table public.ai_conteudos add column if not exists canais text[] not null default '{instagram,facebook}';
alter table public.ai_conteudos add column if not exists hashtags text;
alter table public.ai_conteudos add column if not exists publicado_em timestamptz;
alter table public.ai_conteudos add column if not exists formato_dados jsonb;  -- spec JSON do carrossel (re-renderizar)

-- ---------------------------------------------------------------------
-- Storage: bucket público ai-midia (leitura pública; escrita só service_role, sem policy de escrita)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('ai-midia', 'ai-midia', true)
on conflict (id) do nothing;

do $$
begin
  create policy ai_midia_leitura_publica on storage.objects
    for select to public using (bucket_id = 'ai-midia');
exception when duplicate_object then
  null;  -- policy já existe
end $$;
