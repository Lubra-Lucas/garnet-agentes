---
name: prospeccao-copy
description: Use para escrever rascunhos de mensagem (WhatsApp, e-mail ou texto de Instagram) para leads de influenciadoras, marcas indie e distribuidores, em qualquer passo da cadência, incluindo reativação de quem já respondeu. Acione quando um lead qualificado entra na fila de rascunhos.
---

# prospeccao-copy

## Objetivo
Produzir rascunhos curtos, consultivos e personalizados, prontos para auditoria e aprovação humana.

## Quem usa
`sdr` (instâncias `influenciadoras`, `marcas_indie`, `distribuidores`).

## Referências
- `conhecimento/tom-de-voz.md`: tom, estrutura por canal, exemplos bons/ruins, roteiro de reativação.
- `conhecimento/garnet.md`: fatos permitidos; nada fora dele.
- `conhecimento/icp.md`: dores, gatilhos e objeções do público.
- `conhecimento/lgpd-e-canais.md`: regras de canal.
- Skill `cadencias-crm`: qual passo e quando.

## Ferramentas permitidas
`ai_db.py get ai_v_leads_alvo|ai_leads_qualificacao|ai_rascunhos|ai_interacoes`, `ai_db.py bloqueado`, `ai_db.py post ai_rascunhos`, `ai_db.py evento`, Read. Sem envio de mensagens.

## Entrada
`lead_id`, `canal` (o melhor disponível: whatsapp > e-mail > instagram, respeitando o pedido de quem respondeu), `passo_cadencia` (0–3), `sinais.referencia_personalizacao`, histórico em `ai_interacoes`.

## Saída (insere em `ai_rascunhos`)
```json
{
  "lead_id": "uuid", "agente_id": "sdr", "execucao_id": "uuid",
  "canal": "whatsapp|email|instagram", "passo_cadencia": 0,
  "assunto": "só para e-mail, ≤ 60 caracteres",
  "texto": "mensagem final",
  "justificativa": "origem do contato, referência usada, por que este passo",
  "status": "aguardando_auditoria"
}
```
Para e-mail, o `texto` inclui assinatura e linha de descadastro.

## Regras de decisão
1. Rode `ai_db.py bloqueado <lead_id>`; se `true`, não escreva e registre evento.
2. Verifique em `ai_rascunhos`/`ai_interacoes` se já houve contato hoje (limite 1 por lead/dia) e se o passo já existe (índice único).
3. Se o lead respondeu antes: use o roteiro de **reativação**, no canal que a pessoa pediu.
4. Respeite tamanho (WhatsApp ≤ 600 caracteres; e-mail ≤ 120 palavras).
5. Uma referência específica verificável + um convite único.
6. Sem preço, sem número/cliente/certificação fora de `garnet.md`, sem promessa de resultado, sem urgência falsa.
7. Se o rascunho voltar `reprovado_auditoria`, corrija conforme as `checagens` com `ok=false`. Só uma reescrita; depois escalar ao humano.

## Restrições e aprovações
Todo rascunho passa pelo `auditor` e depois pelo humano. Nunca marcar como enviado. Assinatura: nome do dono em `ai_config.assinatura` (`DB config assinatura`) + "Garnet Cosméticos"; se vazio, "Equipe Garnet Cosméticos". Pode citar o Instagram @garnetcosmeticos.

## Checklist de qualidade
- Passa nas 14 checagens da skill `auditoria-conformidade`.
- Lido em voz alta soa humano, curto, sem exagero.
- Testes: (a) lead bloqueado → nenhum rascunho; (b) lead que respondeu → texto de reativação; (c) pedido de preço no histórico → texto encaminha ao orçamento, sem valor.
