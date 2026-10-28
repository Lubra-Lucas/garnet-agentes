# Garnet AI — arquitetura e contrato técnico

Este documento é o **contrato** entre as partes do sistema (banco, painel web, agentes e skills).
Qualquer mudança de nome de tabela, coluna, status ou comando precisa ser feita aqui primeiro.

## Visão geral

```
 Supabase (projeto busca-leads, ref papaicnydbcajkfghwem)
 ├── public.leads / segmentos / interacoes  ← Busca Leads (SOMENTE LEITURA para a Garnet AI)
 └── public.ai_*                             ← Garnet AI (único lugar onde os agentes escrevem)

 Execução: tarefas agendadas do Claude Code na nuvem (plano Max) rodando este repositório.
   Orquestrador (sessão principal) → subagentes Sonnet (.claude/agents/*.md)
   Toda leitura/escrita passa por scripts/ai_db.py (bloqueia escrita fora de ai_*).
 Painel: painel/index.html (HTML/CSS/JS puro + supabase-js por CDN), login do Supabase Auth.
 Envio de mensagens: SEMPRE humano (wa.me / e-mail Zimbra), depois de aprovação no painel.
```

Isolamento: tabelas com prefixo `ai_` no schema `public` (não exige configurar "exposed schemas").
Nenhuma automação escreve em `public.leads`, `public.segmentos`, `public.interacoes` ou `public.favoritos`.
Reversão completa: `supabase/rollback/20261028000000_garnet_ai_down.sql`.

## Públicos-alvo (fase atual)

| publico | segmentos do Busca Leads |
|---|---|
| `influenciadora` | `influenciadora`, `maquiador` |
| `marca_indie` | `marca_indie`, `tiktok_perfumaria` |
| `distribuidor` | `distribuidor` |

Prioridade da fila (menor = mais urgente):
1. lead com `status = 'respondeu'` no Busca Leads (já demonstrou interesse)
2. lead com `status = 'contatado'` (follow-up)
3. demais, ordenados por score (ai_leads_qualificacao.score, senão leads.score)

## Agentes (`ai_agentes.id`)

| id | nome | papel |
|---|---|---|
| `orquestrador` | Orquestrador | Abre o turno, escolhe leads, distribui, aplica limites, resume |
| `qualificacao` | Inteligência & Qualificação | Pesquisa sinais públicos e dá score com motivos |
| `sdr` | SDR | Escreve rascunhos (instâncias: `influenciadoras`, `marcas_indie`, `distribuidores`) |
| `atendimento` | Atendimento & Pré-vendas | Classifica respostas, monta briefing, sugere próxima ação |
| `marketing` | Marketing & Social | Calendário, roteiros, legendas, plano de anúncios |
| `performance` | Performance | KPIs do funil e relatório semanal |
| `auditor` | Auditor de Conformidade | Revisa todo texto antes de chegar ao humano |

## Tabelas

Todas: RLS ligado; leitura/escrita para `authenticated` somente se `public.ai_permitido()`
(e-mail do JWT em `ai_operadores`); `service_role` ignora RLS. `created_at timestamptz default now()`.

- **ai_operadores** (`email` text pk) — quem pode usar o painel.
- **ai_config** (`chave` text pk, `valor` jsonb, `descricao` text, `updated_at`)
  Chaves iniciais: `kill_switch` (false), `limite_rascunhos_turno` (20), `limite_contatos_lead_dia` (1),
  `cadencia_dias` ([0,3,8,15]), `orcamento_ads_mes` (1000), `publicos` (["influenciadora","marca_indie","distribuidor"]).
- **ai_agentes** (`id` text pk, `nome`, `papel`, `descricao`, `cor` text hex, `icone` text, `ordem` smallint, `ativo` bool)
- **ai_turnos** (`id` uuid pk, `tipo` text: manha|tarde|marketing|performance|manual,
  `status`: em_andamento|concluido|falhou|interrompido, `iniciado_em`, `finalizado_em`, `resumo` text, `metricas` jsonb)
- **ai_execucoes** (`id` uuid pk, `turno_id` fk, `agente_id` fk, `instancia` text null,
  `status`: na_fila|trabalhando|concluida|falhou|bloqueada, `tarefa` text (o que está fazendo),
  `resultado` text, `iniciado_em`, `finalizado_em`, `erro` text)
- **ai_eventos** (`id` bigint identity pk, `created_at`, `turno_id`, `execucao_id`, `agente_id`, `lead_id` uuid null,
  `tipo`: info|acao|decisao|handoff|alerta|erro, `mensagem` text, `dados` jsonb) — feed "ao vivo" do painel.
- **ai_fila** (`id` uuid pk, `tipo` text, `agente_id`, `lead_id`, `prioridade` smallint 1–5,
  `status`: pendente|em_execucao|concluida|falhou|cancelada, `tentativas` int, `max_tentativas` int default 3,
  `chave_idempotencia` text unique, `payload` jsonb (classificar_resposta: {interacao_id, rascunho_id|null}), `agendada_para` timestamptz, `resultado` jsonb, `updated_at`)
- **ai_leads_qualificacao** (`lead_id` uuid pk → leads, `publico`, `score` smallint 0–100,
  `motivos` jsonb [{criterio, pontos, evidencia, fonte}], `sinais` jsonb, `resumo` text, `agente_id`, `atualizado_em`)
- **ai_rascunhos** (`id` uuid pk, `lead_id`, `execucao_id`, `agente_id`, `canal`: whatsapp|email|instagram,
  `passo_cadencia` smallint 0–3, `assunto` text, `texto` text, `justificativa` text,
  `status`: aguardando_auditoria|reprovado_auditoria|aguardando_aprovacao|aprovado|enviado|rejeitado|descartado,
  `auditoria` jsonb {aprovado, checagens:[{regra, ok, nota}], motivo}, `texto_final` text (editado pelo humano),
  `motivo_rejeicao`, `aprovado_em`, `enviado_em`, `updated_at`)
  Índice único (lead_id, canal, passo_cadencia) onde status não é rejeitado/reprovado_auditoria/descartado.
- **ai_interacoes** (`id` uuid pk, `lead_id`, `canal`, `direcao`: saida|entrada, `resumo`, `conteudo`,
  `intencao`: interessado|orcamento|amostra|duvida|nao_agora|opt_out|outro (null), `rascunho_id`,
  `registrado_por` text (humano | id do agente))
- **ai_oportunidades** (`id` uuid pk, `lead_id`, `etapa`: conversa|briefing|amostra|proposta|negociacao|ganho|perdido,
  `categoria_produto`, `quantidade_estimada` int, `valor_estimado` numeric, `briefing` jsonb,
  `proxima_acao` text, `proxima_acao_em` date, `updated_at`)
- **ai_bloqueios** (`id` uuid pk, `lead_id` null, `email` null, `telefone` null, `motivo`) — opt-out permanente.
- **ai_conteudos** (`id` uuid pk, `tipo`: post|reels|carrossel|story|anuncio, `titulo`, `roteiro`, `legenda`,
  `publico`, `data_sugerida` date, `status`: rascunho|reprovado_auditoria|aguardando_aprovacao|aprovado|publicado|rejeitado,
  `auditoria` jsonb, `agente_id`, `updated_at`)
- **ai_campanhas** (`id` uuid pk, `nome`, `plataforma`: meta|google|outro, `objetivo`, `publico`,
  `orcamento` numeric, `gasto` numeric default 0, `status`: proposta|aprovada|ativa|pausada|encerrada,
  `criativos` jsonb, `resultados` jsonb, `auditoria` jsonb, `updated_at`)

Funções: `ai_permitido()` (bool), `ai_lead_bloqueado(lead uuid)` (bool: bloqueio por id, e-mail ou telefone do lead).

Views (security_invoker):
- **ai_v_leads_alvo** — leads ativos dos públicos-alvo: id, nome, segmento_id, publico, cidade, uf, site, instagram,
  tiktok, seguidores, email (tem_email bool), whatsapp/telefone (tem_whatsapp bool), status_busca (leads.status),
  score_base (leads.score), score_ai, prioridade (1/2/3), bloqueado bool, ultimo_contato_ai timestamptz,
  rascunhos_abertos int, ultima_interacao_resumo (de public.interacoes).
- **ai_v_agentes_status** — por agente: última execução (status, tarefa, resultado, horários) e contagem do dia.
- **ai_v_funil** — contagens: alvos, qualificados, rascunhos por status, enviados, respostas, oportunidades por etapa.

## CLI `scripts/ai_db.py` (Python 3 stdlib, rodar com `python3 -I`)

Credenciais por ambiente: `SUPABASE_URL` (padrão https://papaicnydbcajkfghwem.supabase.co) e
`SUPABASE_SERVICE_ROLE_KEY`. Escrita (post/patch) **só** em tabelas `ai_*` — qualquer outra é recusada.
JSON pode ser passado inline ou como `@caminho/arquivo.json`. Saída sempre JSON em stdout.

```
get <tabela|view> [query-postgrest]                 # leitura (qualquer tabela/view)
post <tabela_ai> <json> [--upsert] [--on-conflict col]  # insere (lista ou objeto); --upsert faz merge pela pk/col
patch <tabela_ai> <query> <json>                    # atualiza, retorna linhas
config <chave>                                      # valor de ai_config
turno-iniciar <tipo>                                # sai com código 3 se kill_switch = true; imprime {id}
turno-finalizar <turno_id> <status> <resumo> [--metricas JSON]
exec-iniciar <turno_id> <agente_id> <instancia|-> <tarefa>   # imprime {id}; status = trabalhando
exec-atualizar <execucao_id> <tarefa>               # muda o "fazendo agora"
exec-finalizar <execucao_id> <status> <resultado> [--erro TEXTO]
evento <agente_id> <tipo> <mensagem> [--turno ID] [--execucao ID] [--lead ID] [--dados JSON]
bloqueado <lead_id>                                 # true/false
```

## Convenções

- Cadência: `cadencia_dias` = dias desde o 1º envio (passo 0) até cada passo; próximo passo = maior passo enviado + 1, máximo 3; para ao receber resposta ou opt-out.
- O orquestrador passa `turno_id` (e a instância, para o SDR) no prompt de cada subagente; só o orquestrador chama `turno-finalizar`.
- Opt-out: cria ai_bloqueios e descarta rascunhos abertos do lead (`status=descartado`, `motivo_rejeicao='opt_out'`).

## Fluxo de um rascunho

`sdr` cria (aguardando_auditoria) → `auditor` aprova (aguardando_aprovacao) ou reprova (reprovado_auditoria, volta ao SDR
uma vez) → humano no painel aprova/edita (aprovado) ou rejeita → humano envia por wa.me/e-mail e marca **enviado**
(gera ai_interacoes saida) → resposta colada no painel (ai_interacoes entrada + ai_fila tipo `classificar_resposta`)
→ `atendimento` classifica, cria/atualiza ai_oportunidades; `opt_out` cria ai_bloqueios.

## Fatos comerciais confirmados (resumo; fonte completa em `conhecimento/garnet.md`)

Pedido mínimo: 1.000 peças (compactados); 3.000 peças (perfumaria, loções e demais). Prazo de referência: ~30 dias.
Preço: depende de embalagem e personalização → nunca informar; encaminhar para orçamento.
Orçamento de anúncios: R$ 1.000 no primeiro mês, gasto só com aprovação humana.

## Mídia social (adicionado em 28/10/2026)

Novo agente **`social` — Gestor de Mídia Social**: produz todo dia útil 1 peça orgânica pronta para Instagram e
Facebook (prioridade: **carrossel** de 5–8 lâminas; também post único e roteiro de Reels), com imagens renderizadas,
legenda e hashtags. Publicação é **manual** pelo dono (Meta Business Suite, grátis) depois da aprovação no painel.
O agente `marketing` passa a se chamar **Gestor de Tráfego & Marketing** (anúncios pagos, orçamento, campanhas,
calendário estratégico); o `social` executa o orgânico.

Mudanças no banco (migração `20261028010000_midia_social.sql`, aplicada pelo dono no SQL Editor):
- `ai_agentes`: insere `social` (nome "Gestor de Mídia Social", ícone `image`); renomeia `marketing` para
  "Gestor de Tráfego & Marketing".
- `ai_conteudos` ganha: `midia jsonb not null default '[]'` (lista `[{url, ordem, alt}]` das lâminas/imagens),
  `canais text[] not null default '{instagram,facebook}'`, `hashtags text`, `publicado_em timestamptz`,
  `formato_dados jsonb` (o JSON de origem do carrossel, para re-renderizar).
- Storage: bucket público `ai-midia` (leitura pública; escrita só `service_role`). Caminho:
  `conteudos/<AAAA-MM-DD>/<id-do-conteudo>/<NN>.png`.

Renderizador: `node scripts/carrossel/render.mjs <spec.json> <pasta_saida>` → PNGs 1080×1350 (`01.png`, `02.png`…),
identidade Garnet (off-white, ink, dourado, Montserrat 300 + Cormorant itálico). Spec:
```json
{"tema":"claro|escuro","lâminas":[
  {"tipo":"capa","titulo":"…","destaque":"palavra em itálico dourado","subtitulo":"…","imagem":"url opcional"},
  {"tipo":"texto","numero":"01","titulo":"…","texto":"…"},
  {"tipo":"lista","titulo":"…","itens":["…","…"]},
  {"tipo":"etapas","titulo":"…","etapas":[{"n":"01","nome":"Briefing","texto":"…"}]},
  {"tipo":"dado","valor":"1.000","rotulo":"peças de pedido mínimo em compactados","texto":"…"},
  {"tipo":"imagem","imagem":"url","legenda":"…"},
  {"tipo":"cta","titulo":"…","texto":"…","acao":"Fale com a gente: link na bio"}]}
```
Imagens permitidas: logo e fotos de produto da vitrine/site (`https://garnetcosmeticos.com.br/assets/img/...`);
imagens de conceito geradas por IA só com selo "imagem ilustrativa"; **fotos da fábrica não** (pedido da Garnet).

CLI novo: `upload <arquivo_local> <caminho_no_bucket>` → envia ao bucket `ai-midia` e imprime `{"url": "<url pública>"}`
(só aceita o bucket `ai-midia`).

Fluxo: `social` cria `ai_conteudos` (status `rascunho`, com `midia`, legenda, hashtags) → `auditor` →
`aguardando_aprovacao` → dono aprova no painel, baixa as lâminas, copia a legenda e publica → marca **publicado**
(`publicado_em`). Runbook: `runbooks/social-diario.md` (seg–sex).
