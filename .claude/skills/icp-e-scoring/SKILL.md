---
name: icp-e-scoring
description: Use para qualificar um lead, calcular o score 0-100 com motivos, classificar o público (influenciadora, marca_indie, distribuidor) e definir prioridade. Acione quando um lead entra na fila de qualificação ou quando o score precisa ser refeito após nova evidência.
---

# icp-e-scoring

## Objetivo
Transformar sinais públicos em score auditável (0–100) com motivos e evidências, e decidir se o lead segue para abordagem.

## Quem usa
`qualificacao` (principal), `orquestrador` (prioridade da fila), `sdr` (leitura).

## Referências
- `conhecimento/icp.md`: perfis, sinais, objeções e **tabelas de pontos por público** (seção 4).
- `conhecimento/garnet.md`: fatos de fit (MOQ, categorias).
- `conhecimento/lgpd-e-canais.md`: dados que nunca entram na pesquisa.

## Ferramentas permitidas
- `python3 -I scripts/ai_db.py get ai_v_leads_alvo "..."`, `get leads ...` (somente leitura do Busca Leads).
- `ai_db.py post|patch ai_leads_qualificacao`, `ai_db.py evento`.
- Read; WebSearch/WebFetch apenas via skill `pesquisa-b2b`.
Proibido escrever em `leads`, `segmentos`, `interacoes`, `favoritos`.

## Entrada
Linha de `ai_v_leads_alvo` (+ `leads.extras`: `nichos`, `contatos`, `tiktok_perfil`, `relacao_garnet`, `marca_propria` etc.) e sinais da pesquisa.

## Saída (grava em `ai_leads_qualificacao`, upsert por `lead_id`)
```json
{
  "lead_id": "uuid",
  "publico": "influenciadora|marca_indie|distribuidor",
  "score": 78,
  "motivos": [
    {"criterio": "base", "pontos": 30, "evidencia": "tem e-mail comercial", "fonte": "leads.extras.contatos"},
    {"criterio": "nicho_maquiagem", "pontos": 15, "evidencia": "bio e posts de make", "fonte": "https://..."},
    {"criterio": "multinacional", "pontos": -20, "evidencia": "grupo X", "fonte": "https://..."}
  ],
  "sinais": {"seguidores": 120000, "em_sp": true, "respondeu_antes": false, "canais": ["email","whatsapp"], "tipo_contato_melhor": "comercial"},
  "resumo": "Duas frases: quem é, por que tem fit, risco principal.",
  "agente_id": "qualificacao"
}
```
Os pontos de `motivos` somam o score (aplicando tetos e limite 0–100). Cada item com evidência e fonte.

## Regras de decisão
1. Classifique o público pelo `segmento_id` (mapa no `icp.md`/arquitetura).
2. Aplique a tabela do público + bônus/penalidades gerais. Sem evidência, sem ponto.
3. Bônus de +25 para quem respondeu antes e prioridade 1 independente do score.
4. Teto 25 sem contato; teto 50 se fonte for `conhecimento_setorial`.
5. Bloqueado (`ai_db.py bloqueado <id>` = true) ou `opt_out`: score 0 e registrar motivo; não seguir.
6. ≥ 80 abordar; 60–79 qualificar mais; 40–59 backlog; < 40 não abordar.
7. Não rebaixar score por falta de informação que não foi pesquisada: registre `sinais.lacunas`.

## Restrições e aprovações
Sem aprovação humana. Mudança nos pesos desta regra: só editando `conhecimento/icp.md` (decisão da Garnet).

## Checklist de qualidade
- Soma dos pontos confere com o score (antes dos tetos).
- Todo motivo tem `fonte` (URL ou campo do banco).
- `publico` ∈ {influenciadora, marca_indie, distribuidor}.
- Teste: lead multinacional sem contato → score ≤ 25; lead que respondeu antes com score base 50 → ganha +25 e prioridade 1.
