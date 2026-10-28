-- Reverte supabase/migrations/20261028000000_garnet_ai.sql. Não toca em nada do Busca Leads.

drop view if exists public.ai_v_funil;
drop view if exists public.ai_v_agentes_status;
drop view if exists public.ai_v_leads_alvo;

do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['ai_eventos', 'ai_execucoes', 'ai_rascunhos']
    loop
      begin
        execute format('alter publication supabase_realtime drop table public.%I', t);
      exception when others then
        null;  -- tabela inexistente ou fora da publicação
      end;
    end loop;
  end if;
end $$;

drop table if exists public.ai_campanhas cascade;
drop table if exists public.ai_conteudos cascade;
drop table if exists public.ai_bloqueios cascade;
drop table if exists public.ai_oportunidades cascade;
drop table if exists public.ai_interacoes cascade;
drop table if exists public.ai_rascunhos cascade;
drop table if exists public.ai_leads_qualificacao cascade;
drop table if exists public.ai_fila cascade;
drop table if exists public.ai_eventos cascade;
drop table if exists public.ai_execucoes cascade;
drop table if exists public.ai_turnos cascade;
drop table if exists public.ai_agentes cascade;
drop table if exists public.ai_config cascade;
drop table if exists public.ai_operadores cascade;

drop function if exists public.ai_lead_bloqueado(uuid);
drop function if exists public.ai_permitido();
drop function if exists public.ai_set_updated_at();
drop function if exists public.ai_set_atualizado_em();
