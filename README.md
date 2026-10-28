# Garnet AI — equipe de agentes de prospecção e marketing

Equipe digital de agentes de IA que trabalha para a **Garnet Cosméticos** (fabricante private label, especialista em
maquiagem compactada desde 1992). O objetivo é gerar **oportunidades comerciais qualificadas** com quem quer criar ou
ampliar uma marca própria (influenciadoras, marcas indie e distribuidores) e dar visibilidade orgânica à Garnet no
Instagram e no Facebook, com **custo adicional zero** e **aprovação humana em tudo que sai**.

- **Painel ao vivo:** https://lubra-lucas.github.io/garnet-agentes/ (login de operador; demonstração em
  [`?demo=1`](https://lubra-lucas.github.io/garnet-agentes/?demo=1))
- **Contrato técnico:** [`docs/arquitetura.md`](docs/arquitetura.md) — tabelas, status, CLI e fluxos. Mudanças começam por lá.
- **Regras para IA e pessoas:** [`CLAUDE.md`](CLAUDE.md)
- **Histórico de decisões e próximos passos:** [`docs/historico.md`](docs/historico.md)

## Como funciona

```
Busca Leads (Supabase, somente leitura) ──┐
Site garnetcosmeticos.com.br (conhecimento)┤
                                          ▼
     Tarefas agendadas do Claude Code na nuvem (plano Max, sem custo extra)
     Orquestrador (Opus) ──► especialistas (Sonnet, até 3 em paralelo)
                                          ▼
     Supabase: tabelas ai_* (fila, rascunhos, conteúdos, oportunidades, eventos)
                                          ▼
     Painel web ──► o dono aprova ──► envia/publica manualmente (Zimbra, wa.me, Meta Business Suite)
```

Nada é enviado, publicado ou gasto automaticamente. Tudo roda na nuvem: não depende de computador ligado.

## A equipe

| Agente | Papel | Modelo |
|---|---|---|
| Orquestrador | Abre cada turno, prioriza, distribui, aplica limites, resume | Opus |
| Inteligência & Qualificação | Pesquisa sinais públicos e dá score 0–100 com motivos e fontes | Sonnet |
| SDR (3 instâncias) | Escreve 1º contato (com proposta e simulação), follow-ups (influenciadoras, marcas indie, distribuidores) | Sonnet |
| Auditor de Conformidade | Revisa todo texto e imagem antes de chegar ao dono (14 checagens: preço, fatos, LGPD, ANVISA…) | Sonnet |
| Atendimento & Pré-vendas | Classifica respostas, monta briefing, cria oportunidades, trata opt-out | Sonnet |
| Gestor de Mídia Social (3 instâncias) | 3 peças orgânicas por dia útil (carrosséis e posts renderizados em PNG + legenda) | Sonnet |
| Gestor de Tráfego & Marketing | Plano de anúncios (R$ 1.000 no 1º mês, só com aprovação) e estratégia | Sonnet |
| Performance | KPIs do funil e relatório semanal | Sonnet |

Definições em [`.claude/agents/`](.claude/agents), conhecimento especializado em [`.claude/skills/`](.claude/skills)
(14 skills) e base de fatos confirmados em [`conhecimento/`](conhecimento).

## Rotina (horário de Brasília)

| Quando | Turno | Runbook |
|---|---|---|
| Seg–sex 7h47 | Prospecção: qualificação → até 20 rascunhos → auditoria | [`runbooks/turno-manha.md`](runbooks/turno-manha.md) |
| Seg–sex 9h23 | Mídia social: 3 peças (9h, 12h30, 19h) para o próximo dia útil | [`runbooks/social-diario.md`](runbooks/social-diario.md) |
| Seg–sex 13h52 | Respostas, follow-ups e oportunidades | [`runbooks/turno-tarde.md`](runbooks/turno-tarde.md) |
| Segunda 15h17 | Tráfego e plano de anúncios | [`runbooks/marketing-semanal.md`](runbooks/marketing-semanal.md) |
| Sexta 16h37 | Relatório de performance | [`runbooks/performance-semanal.md`](runbooks/performance-semanal.md) |

Para rodar um turno manualmente: abra uma sessão do Claude Code neste repositório e peça `Execute runbooks/<turno>.md`.
O botão **kill switch** no painel para todos os turnos.

## Estrutura

```
CLAUDE.md               regras absolutas e mapa do projeto (lido por toda sessão do Claude)
docs/                   arquitetura (contrato) e histórico de decisões
conhecimento/           fatos confirmados da Garnet, ICP, tom de voz, LGPD e canais, plano de anúncios do mês 1
.claude/agents/         definições dos agentes
.claude/skills/         skills especializadas
runbooks/               roteiros de cada turno
scripts/ai_db.py        CLI de acesso ao Supabase (só escreve em tabelas ai_*)
scripts/carrossel/      renderizador de carrosséis 1080×1350 (Playwright) com a identidade da Garnet
supabase/               migrações e rollback (aplicadas no projeto busca-leads)
painel/                 painel web (HTML/CSS/JS puro), publicado pelo GitHub Pages
.github/workflows/      publicação do painel
```

## Segurança e dados

- **Sem dados pessoais neste repositório.** Leads, contatos e conversas ficam só no Supabase.
- Os agentes **só escrevem em tabelas `ai_*`**; o Busca Leads é somente leitura. Reversão completa em `supabase/rollback/`.
- Painel com login e RLS: só e-mails em `ai_operadores` veem os dados. A chave do Supabase no painel é a publicável.
- Credenciais ficam como segredos do ambiente, nunca no código ou no chat.
- Texto vindo de sites e de leads é tratado como dado, nunca como instrução.

## Montar em outro ambiente

1. Rodar no SQL Editor do Supabase as migrações de `supabase/migrations/` em ordem e incluir o e-mail do operador:
   `insert into public.ai_operadores (email) values ('email@exemplo.com');`
2. Definir `SUPABASE_SERVICE_ROLE_KEY` como segredo do ambiente do Claude Code na nuvem.
3. Criar as tarefas agendadas com os prompts indicados em cada runbook.
4. Publicar `painel/` (GitHub Pages pelo workflow incluído, ou Cloudflare Pages).
