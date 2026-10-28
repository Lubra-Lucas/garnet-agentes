---
name: funil-analytics
description: Use para medir o funil comercial (alvos, qualificados, rascunhos, enviados, respostas, oportunidades), calcular taxas e produzir o relatório semanal com recomendações. Acione no turno de performance e quando o orquestrador precisar de um resumo.
---

# funil-analytics

## Objetivo
Dizer, com números do banco, onde o funil trava e o que ajustar, sem concluir além do que a amostra permite.

## Quem usa
`performance` (principal), `orquestrador` (resumo do turno), `marketing` (insights de conteúdo).

## Referências
`docs/arquitetura.md` (view `ai_v_funil`), `conhecimento/anuncios-mes1.md` (KPIs de anúncios, hipóteses), `conhecimento/icp.md` (faixas de score).

## Ferramentas permitidas
`ai_db.py get ai_v_funil|ai_v_agentes_status|ai_rascunhos|ai_interacoes|ai_oportunidades|ai_campanhas|ai_leads_qualificacao`, `post ai_eventos` via `ai_db.py evento`, `turno-finalizar ... --metricas`. Sem escrita fora de `ai_*`.

## Entrada
Janela (padrão: últimos 7 dias e comparação com os 7 anteriores).

## Saída
`ai_turnos.metricas` e relatório em `ai_turnos.resumo`:
```json
{
  "periodo": {"de": "2026-11-02", "ate": "2026-11-08"},
  "funil": {"alvos": 0, "qualificados": 0, "rascunhos": 0, "aprovados": 0, "enviados": 0, "respostas": 0, "oportunidades": 0},
  "taxas": {"aprovacao_rascunho": null, "resposta": null, "oportunidade_por_resposta": null},
  "por_publico": {"influenciadora": {}, "marca_indie": {}, "distribuidor": {}},
  "rejeicoes": {"auditoria": 0, "humano": 0, "motivos_top": []},
  "anuncios": {"gasto": 0, "leads": 0, "cpl": null, "hipotese": true},
  "recomendacoes": ["texto curto e acionável"],
  "limitacoes": ["amostra pequena"]
}
```
Taxas sem denominador suficiente ficam `null`.

## Regras de decisão
1. Só calcule taxa com ≥ 20 no denominador; abaixo disso, mostre o valor bruto e marque "amostra pequena".
2. Separe por público e por canal; compare passos 0 a 3.
3. Motivos de rejeição humana (`motivo_rejeicao`) alimentam recomendações de copy.
4. Toda recomendação traz o dado que a sustenta.
5. Nunca inventar benchmark; metas de CPL/CTR do mês 1 são hipóteses.
6. Não incluir dados pessoais no relatório (use ids, não nomes).

## Restrições e aprovações
Sem aprovação para ler/relatar. Mudar pesos do score ou cadência exige decisão da Garnet.

## Checklist de qualidade
- Números conferem com `ai_v_funil`.
- Recomendações priorizadas (máx. 5).
- Teste: semana sem envios → relatório diz "sem dados", sem taxas.
