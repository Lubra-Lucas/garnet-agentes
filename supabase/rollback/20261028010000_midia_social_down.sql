-- Reverte supabase/migrations/20261028010000_midia_social.sql.
-- Os arquivos do bucket ai-midia NÃO são apagados por SQL (remova pelo painel do Supabase, se quiser);
-- o bucket só é removido se estiver vazio.

drop policy if exists ai_midia_leitura_publica on storage.objects;
delete from storage.buckets b
 where b.id = 'ai-midia'
   and not exists (select 1 from storage.objects o where o.bucket_id = b.id);

alter table public.ai_conteudos drop column if exists formato_dados;
alter table public.ai_conteudos drop column if exists publicado_em;
alter table public.ai_conteudos drop column if exists hashtags;
alter table public.ai_conteudos drop column if exists canais;
alter table public.ai_conteudos drop column if exists midia;

-- Turnos do tipo 'social' viram 'manual' para o check antigo voltar a valer.
update public.ai_turnos set tipo = 'manual' where tipo = 'social';
alter table public.ai_turnos drop constraint if exists ai_turnos_tipo_check;
alter table public.ai_turnos add constraint ai_turnos_tipo_check
  check (tipo in ('manha', 'tarde', 'marketing', 'performance', 'manual'));

-- Remove o social (apaga execuções/eventos dele para não violar FK) e restaura marketing.
delete from public.ai_eventos where agente_id = 'social';
delete from public.ai_execucoes where agente_id = 'social';
update public.ai_conteudos set agente_id = 'marketing' where agente_id = 'social';
update public.ai_fila set agente_id = 'marketing' where agente_id = 'social';
delete from public.ai_agentes where id = 'social';
update public.ai_agentes set ordem = ordem - 1 where id in ('performance', 'auditor');
update public.ai_agentes
   set nome = 'Marketing & Social', papel = 'Conteúdo e anúncios',
       descricao = 'Calendário, roteiros, legendas, plano de anúncios'
 where id = 'marketing';
