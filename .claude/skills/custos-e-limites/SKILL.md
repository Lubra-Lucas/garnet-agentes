---
name: custos-e-limites
description: Use para aplicar limites operacionais (kill switch, rascunhos por turno, contatos por lead/dia, tentativas, buscas por lead, orçamento de anúncios) e para decidir quando parar, reduzir escopo ou escalar ao humano. Acione na abertura de cada turno e antes de gastar recursos.
---

# custos-e-limites

## Objetivo
Manter a operação dentro do que foi aprovado: poucas tarefas, previsíveis e baratas, sem estourar nenhum limite.

## Quem usa
`orquestrador` (principal); todos os agentes respeitam.

## Referências
`docs/arquitetura.md` (tabela `ai_config`), `conhecimento/anuncios-mes1.md` (verba), `conhecimento/lgpd-e-canais.md` (1 contato/dia).

## Ferramentas permitidas
`ai_db.py config <chave>`, `turno-iniciar`, `turno-finalizar`, `evento`, `get ai_fila|ai_rascunhos|ai_campanhas`.

## Limites (valores iniciais de `ai_config`; ler sempre do banco)
| Chave | Padrão | Uso |
|---|---|---|
| `kill_switch` | false | `turno-iniciar` sai com código 3 se true: encerrar sem trabalhar |
| `limite_rascunhos_turno` | 20 | máx. de rascunhos por turno |
| `limite_contatos_lead_dia` | 1 | máx. de contatos por lead por dia |
| `cadencia_dias` | [0,3,8,15] | intervalos entre passos |
| `orcamento_ads_mes` | 1000 | teto de anúncios; gasto só com aprovação |
Limites adicionais sugeridos (hipóteses; podem virar chaves de `ai_config` com decisão da Garnet): 5 buscas/páginas por lead por turno de qualificação; 3 tentativas por item da fila; 1 reescrita por rascunho reprovado.

## Entrada e saída
- Entrada: configuração e estado do banco.
- Saída: decisão e registro: `{"limite": "limite_rascunhos_turno", "atingido": true, "acao": "parar_e_resumir"}` em `ai_eventos.dados` (tipo `decisao`), e `ai_turnos.metricas` com contadores usados.

## Regras de decisão
1. Kill switch ligado: nenhum agente trabalha; registrar evento e finalizar o turno como `interrompido`.
2. Atingiu o limite de rascunhos: parar de gerar, priorizar quem respondeu, resumir.
3. Falhou 3 vezes: marcar `falhou`, evento `alerta`, seguir adiante.
4. Qualquer gasto de anúncio: só com aprovação humana; soma ≤ `orcamento_ads_mes`.
5. Preferir menos tarefas bem feitas: quem respondeu primeiro, depois maior score.
6. Em erro de credencial ou rede: parar e registrar `erro`; não tentar contornar.

## Restrições e aprovações
Mudar limites ou ligar/desligar o kill switch: só o humano (painel). Agentes nunca alteram `ai_config`.

## Checklist de qualidade
- Todo turno termina com `turno-finalizar` e métricas.
- Testes: kill switch true → turno não inicia; 25 leads elegíveis → 20 rascunhos e 5 ficam na fila.
