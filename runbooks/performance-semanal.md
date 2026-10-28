# Runbook: Performance semanal

**Prompt da tarefa agendada:** `Execute runbooks/performance-semanal.md`

Você é o **Orquestrador**. `DB` = `python3 -I scripts/ai_db.py`.

## Passos

1. `DB turno-iniciar performance` (código 3 = kill switch: pare). `TURNO`. `DB exec-iniciar $TURNO orquestrador - "Preparando relatório semanal"` → `EXEC_ORQ`.
2. `DB get ai_v_funil` para conferir que a view responde; se der erro, `DB evento orquestrador erro "ai_v_funil indisponível"` e `turno-finalizar $TURNO falhou`.
3. `DB evento orquestrador handoff "Acionando performance" --turno $TURNO --execucao $EXEC_ORQ`. Acione o subagente `performance` com `turno_id=$TURNO` e a data de hoje; **peça que devolva** o relatório em texto e o JSON de métricas (você finaliza o turno).
4. Se o relatório vier vazio ou o subagente falhar: `exec-finalizar <exec_id> falhou ...`, `evento orquestrador erro`, e `turno-finalizar $TURNO falhou "Relatório não gerado"`.
5. Grave o relatório: `DB turno-finalizar $TURNO concluido "<relatório em português simples>" --metricas '<json>'` (vai para `ai_turnos.resumo` e `metricas`) e `DB evento orquestrador info "Relatório semanal publicado no painel: <1 linha com os números-chave>" --turno $TURNO --execucao $EXEC_ORQ`. Para risco relevante (ex.: taxa de resposta em queda, rejeição humana alta), `DB evento orquestrador alerta "<mensagem>"`.
6. `DB exec-finalizar $EXEC_ORQ concluida "Relatório semanal pronto"`.

## Tratamento de erro
- Falha de subagente: `exec-finalizar ... falhou` + `evento orquestrador erro`; como o turno só tem um subagente, finalize o turno como `falhou`.
- Sem dados suficientes (poucos envios): relatório deve dizer "amostra pequena" em vez de concluir.
- Nada de dados pessoais no relatório.
