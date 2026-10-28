---
name: cadencias-crm
description: Use para decidir quem entra na fila, em que passo da cadência está cada lead, quando é o próximo contato, quando pausar ou encerrar, e como manter ai_fila, ai_interacoes e ai_oportunidades consistentes. Acione na abertura de cada turno e ao registrar envio ou resposta.
---

# cadencias-crm

## Objetivo
Ordenar o trabalho do dia e garantir que nenhum lead receba mais de um contato por dia, que respostas tenham prioridade e que o histórico fique coerente.

## Quem usa
`orquestrador` (principal), `sdr`, `atendimento`.

## Referências
- `docs/arquitetura.md`: tabelas, prioridade da fila, fluxo do rascunho.
- `conhecimento/tom-de-voz.md`: passos 0–3 (materiais por passo) e regra de primeiro contato.
- `conhecimento/lgpd-e-canais.md`: opt-out e limites.
- Skill `custos-e-limites`.

## Ferramentas permitidas
`ai_db.py get ai_v_leads_alvo|ai_rascunhos|ai_interacoes|ai_fila|ai_oportunidades|ai_config`, `ai_db.py config`, `post|patch ai_fila`, `ai_db.py evento`.

## Entrada
`ai_config.cadencia_dias` (padrão [0,3,8,15]), `limite_rascunhos_turno`, `limite_contatos_lead_dia`; `ai_v_leads_alvo` (prioridade, bloqueado, ultimo_contato_ai, rascunhos_abertos).

## Saída
Itens em `ai_fila`:
```json
{"tipo": "gerar_rascunho", "agente_id": "sdr", "lead_id": "uuid", "prioridade": 1,
 "chave_idempotencia": "rascunho:<lead_id>:<passo>:<YYYY-MM-DD>",
 "payload": {"canal": "whatsapp", "passo_cadencia": 1, "reativacao": false, "material": "catalogo"},
 "agendada_para": "2026-11-03T12:00:00Z"}
```
Tipos de fila usados: `qualificar_lead`, `gerar_rascunho`, `classificar_resposta` (este existe no contrato), `reativar_lead` (somente com interação registrada nos últimos 30 dias; ver regra 1b) (nomes dos demais: sugestão, validar com o contrato).

## Regras de decisão
1. Ordem: (1) `status_busca = respondeu`, (2) `contatado` (follow-up), (3) demais por `score_ai`, senão `score_base`.
1b. **Todo lead é primeiro contato (decisão do dono, 28/10/2026)**: quem respondeu há muito tempo à abordagem antiga entra no **passo 0** com o modelo oficial (`reativacao: false`). `reativacao: true` / `reativar_lead` só se houver interação registrada nos últimos 30 dias. Mantém a prioridade 1 na fila (vai à frente), mas com texto de primeiro contato.
1c. **Materiais por passo** (1 por mensagem; `payload.material`): passo 0 `proposta` (no e-mail, também apresentação e catálogo); passo 1 (dia 3) `catalogo` com 1 produto; passo 2 (dia 8) `galeria_marcas`; passo 3 (dia 15) `ponto_equilibrio`. Não repetir a apresentação. Reunião de 15 minutos só para quem demonstrar interesse após ver os números.
1d. **Proposta personalizada**: o `sdr` a gera para influenciadoras com seguidores conhecidos no passo 0 (`.claude/agents/sdr.md`); os passos seguintes reutilizam a mesma URL (buscar no texto do rascunho do passo 0 em `ai_rascunhos`) em vez de gerar outra.
2. Excluir: `bloqueado = true`, `rascunhos_abertos > 0` sem decisão, lead com contato hoje.
3. Passo seguinte = último passo enviado + 1, só quando passaram `cadencia_dias[passo]` dias desde o envio anterior (contados a partir de `ai_rascunhos.enviado_em`).
4. Sem enviar não há avanço: rascunho não enviado não conta como passo.
5. Resposta recebida: parar cadência; criar `classificar_resposta`; intenção `opt_out` → bloqueio.
6. Após o passo 3 sem resposta: marcar como "encerrado" (evento) e não reabordar por 90 dias (hipótese; confirmar com a Garnet).
7. Tentativas: `max_tentativas` 3; falhas repetidas geram `ai_eventos` do tipo `alerta`.
8. Idempotência: sempre use `chave_idempotencia` para não duplicar.

## Restrições e aprovações
Respeitar `kill_switch` (sai com código 3 em `turno-iniciar`). Sem aprovação humana para enfileirar; o envio sempre depende do humano.

## Checklist de qualidade
- Nenhum lead com mais de 1 contato/dia.
- Quem respondeu está sempre na frente.
- Testes: (a) rodar duas vezes o mesmo turno não duplica fila; (b) lead bloqueado nunca entra; (c) passo 1 só aparece após 3 dias do envio do passo 0; (d) lead que respondeu há mais de 30 dias entra no passo 0 com `reativacao: false`.
