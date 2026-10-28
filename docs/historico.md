# Histórico de decisões e estado do projeto

Registro do que foi decidido e feito, para quem chegar ao projeto. Sem dados pessoais: números agregados apenas.

## 28/10/2026 — Diagnóstico (Fase 0)

- **Busca Leads** (`Lubra-Lucas/busca-leads`, Supabase `busca-leads`): 2.229 leads ativos (2.038 clientes, 169
  fornecedores, 43 investidores), cerca de 1.060 com e-mail e 1.090 com WhatsApp. Só 74 tinham sido trabalhados
  (44 contatados e 30 que responderam), todos influenciadoras; nenhuma reunião ou contrato registrado.
- **Achado principal:** o gargalo não era falta de leads, e sim de follow-up. As 30 respostas eram em sua maioria
  positivas e estavam paradas.
- **Site** (`Lubra-Lucas/garnet-site`): conteúdo B2B confirmado (fundação em 1992, 1.000 m², 50 mil un./mês, +150
  marcas, BPF, 5 categorias, 5 modelos de produção, 8 etapas). Formulários terminam no WhatsApp sem registro.
- **ERP** (`Lubra-Lucas/garnet`): sistema industrial separado (outro Supabase). Não foi tocado.
- Arquiteturas comparadas: GitHub Actions + API, Edge Functions + API, n8n e híbrida. Escolhida a híbrida
  (Supabase + tarefas agendadas do Claude Code na assinatura Max), por custo zero e volume baixo.

## 28/10/2026 — Decisões do dono

- Públicos desta fase: **influenciadoras, marcas indie e distribuidores**. Prioridade: quem já respondeu.
- Fatos comerciais confirmados: pedido mínimo de **1.000 peças (compactados)** e **3.000 (perfumaria, loções e
  demais)**; prazo de referência de **~30 dias**; **preço nunca** é informado (depende de embalagem e personalização).
- Amostras são enviadas a **leads qualificados**; quem combina o envio é o dono.
- Instagram oficial: **@garnetcosmeticos**. O dono aprova e assina as mensagens.
- Orçamento de anúncios: **R$ 1.000 no primeiro mês**, gasto só com aprovação.
- E-mail comercial no Zimbra; envio sempre manual. Busca Leads mantém o acesso como está.
- Mídia social: **3 publicações por dia útil**, publicação manual pelo Meta Business Suite.
- Orquestrador em **Opus**, especialistas em **Sonnet**.

## 28/10/2026 — Implementação

- Tabelas `ai_*`, views, RLS por operador e CLI `scripts/ai_db.py` (validados em Postgres local).
- 8 agentes, 14 skills, base de conhecimento e 6 runbooks.
- Painel web publicado no GitHub Pages, com login, aprovação, oportunidades, mídia social e turnos.
- Renderizador de carrosséis (temas claro e escuro) e bucket público `ai-midia` para as imagens.
- **1º turno de reativação:** 30 influenciadoras que já tinham respondido foram qualificadas; 24 e-mails escritos e
  aprovados pelo auditor; 6 ficaram sem nenhum canal salvo (contatos a recuperar no e-mail antigo).
- **1º turno de mídia social:** 3 peças para 29/10 (carrossel "8 etapas", post "pedido mínimo", carrossel
  "5 mitos"). O auditor barrou uma imagem trocada e uma frase sobre ANVISA sem ressalva; ambas corrigidas.
- Correção aplicada: cada instância do Gestor de Mídia Social usa pasta temporária exclusiva.
- 5 tarefas agendadas criadas na nuvem.

## Pendências

- Nome para a assinatura das mensagens (`ai_config.assinatura`).
- Recuperar no Zimbra os contatos/WhatsApp das influenciadoras que responderam e ficaram sem canal.
- Primeira execução das tarefas agendadas ainda não verificada.
- Atualizar o FAQ do site com o pedido mínimo confirmado.

## Próximos passos propostos

1. **Leitura do Zimbra (IMAP, só leitura)** pelo Atendimento — evita perder respostas. Depende do endereço do servidor.
2. **Registro dos pedidos do site** no banco antes de abrir o WhatsApp — leads mais quentes. Depende de aprovação
   para mexer no site.
3. **Chatbot de WhatsApp** (Cloud API oficial + Supabase Edge Function + Claude API com teto de gasto), primeiro como
   copiloto e depois autônomo para dúvidas e briefing. Depende de: aprovação de gasto, escolha do número e conta Meta
   Business.
4. Mais adiante: prospector de novos leads, pré-proposta para orçamento, respostas a comentários/directs, métricas do
   Instagram.
