---
name: prospeccao-copy
description: Use para escrever rascunhos de mensagem (WhatsApp, e-mail ou texto de Instagram) para leads de influenciadoras, marcas indie e distribuidores, em qualquer passo da cadência (todo lead é tratado como primeiro contato; influenciadora recebe SÓ a Apresentação Comercial, sem proposta, simulação nem preço; marca indie/distribuidor, com a Proposta e a simulação na frente). Acione quando um lead qualificado entra na fila de rascunhos.
---

# prospeccao-copy

## Objetivo
Produzir rascunhos curtos, consultivos e personalizados, prontos para auditoria e aprovação humana.

## Quem usa
`sdr` (instâncias `influenciadoras`, `marcas_indie`, `distribuidores`).

## Referências
- `conhecimento/tom-de-voz.md`: tom, estrutura por canal, **modelo oficial de primeiro contato**, follow-ups dia 3/8/15, exemplos bons/ruins.
- `conhecimento/garnet.md`: fatos permitidos; nada fora dele. Seção 2.1 (preço de referência da simulação) e 9.1 (links oficiais).
- `conhecimento/icp.md`: dores, gatilhos e objeções do público.
- `conhecimento/lgpd-e-canais.md`: regras de canal.
- Skill `cadencias-crm`: qual passo e quando.

## Ferramentas permitidas
`ai_db.py get ai_v_leads_alvo|ai_leads_qualificacao|ai_rascunhos|ai_interacoes`, `ai_db.py bloqueado`, `ai_db.py post ai_rascunhos`, `ai_db.py evento`, `ai_db.py config <chave>` (preco_referencia_compacto, revenda_cenarios, custos_venda_pct), `ai_db.py upload` e `node scripts/pdf/render.mjs` (proposta personalizada, ver `.claude/agents/sdr.md`), Read. Sem envio de mensagens.

## Entrada
`lead_id`, `canal` (o melhor disponível: whatsapp > e-mail > instagram, respeitando o pedido de quem respondeu), `links` (influenciadora, passo 0: só a apresentação, anexo no e-mail e link no WhatsApp/direct; marca indie/distribuidor: URL da proposta genérica e, no e-mail, também apresentação e catálogo), `passo_cadencia` (0–3), `sinais.referencia_personalizacao`, histórico em `ai_interacoes`.

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
Para e-mail de **influenciadora**, o `texto` termina em **"Atenciosamente,"** sem assinatura e sem descadastro (o `scripts/zimbra.py` acrescenta ambos) e traz a lista de marcas em linhas "- ". Para e-mail de marca indie/distribuidor, o `texto` inclui assinatura e linha de descadastro. Na `justificativa`, informe o elogio usado e a fonte; se houver número, de onde veio (chave de `ai_config`) e qual proposta foi usada.

## Regras de decisão
1. Rode `ai_db.py bloqueado <lead_id>`; se `true`, não escreva e registre evento.
2. Verifique em `ai_rascunhos`/`ai_interacoes` se já houve contato hoje (limite 1 por lead/dia) e se o passo já existe (índice único).
3. **Todo lead é primeiro contato**, inclusive quem respondeu há muito tempo (passo 0 = modelo oficial de `tom-de-voz.md`). Só use tom de continuidade se houver interação registrada nos últimos 30 dias; mesmo assim, o canal que a pessoa pediu é respeitado.
4. Respeite tamanho (WhatsApp/direct ≤ 700 caracteres contando o link; e-mail ≤ 170 palavras no corpo, sem assinatura, exceto o modelo oficial de influenciadora, que o dono aprovou com a lista de marcas).
5. Uma referência específica verificável + um CTA único. **Influenciadora, passo 0** (modelo oficial, `tom-de-voz.md` 4.1): e-mail pede o WhatsApp e oferece conversa de alinhamento ou envio dos valores; WhatsApp/direct: "Tem interesse em conversar sobre esse projeto?". O gancho "internamente seu nome surgiu como um dos que mais combinam com essa proposta" é aprovado. Marca indie/distribuidor: "Se os números fizerem sentido para vocês, marcamos 15 minutos para desenhar a linha?".
6. **Influenciadora, 1º contato (passos 0 a 3): nenhum preço, simulação, número de margem, proposta ou catálogo no passo 0** (apresentação só); proposta/simulação/catálogo vão no 2º contato, a cargo do `atendimento`. **Marca indie/distribuidor: 1 número da simulação**, lido de `ai_config` (`config preco_referencia_compacto`, `config revenda_cenarios`, `config custos_venda_pct`), sempre com "referência; o valor final depende da embalagem e da personalização". Só compactados; perfumaria/loções sem número. Nenhum outro valor, desconto ou faixa; nunca lucro garantido; sem número/cliente/certificação fora de `garnet.md`; sem urgência falsa. Se a config estiver vazia, escreva sem número e registre `evento ... alerta`.
6b. Links só os oficiais de `garnet.md` seção 9.1. Follow-ups de **influenciadora** (sem preço): dia 3 retoma e pergunta se viu a apresentação; dia 8 destaca 1 case/linha (pode mandar o link do catálogo); dia 15 encerramento educado. Follow-ups de marca indie/distribuidor: dia 3 catálogo com produto, dia 8 galeria de marcas, dia 15 ponto de equilíbrio; 1 material por mensagem, sem repetir a apresentação.
7. Se o rascunho voltar `reprovado_auditoria`, corrija conforme as `checagens` com `ok=false`. Só uma reescrita; depois escalar ao humano.

## Restrições e aprovações
Todo rascunho passa pelo `auditor` e depois pelo humano. Nunca marcar como enviado. Assinatura: nome do dono em `ai_config.assinatura` (`DB config assinatura`) + "Garnet Cosméticos"; se vazio, "Equipe Garnet Cosméticos". Pode citar o Instagram @garnetcosmeticos.

## Checklist de qualidade
- Passa nas 14 checagens da skill `auditoria-conformidade`.
- Lido em voz alta soa humano, curto, sem exagero.
- Testes: (a) lead bloqueado → nenhum rascunho; (b) lead que respondeu há mais de 30 dias → texto de primeiro contato (não reativação); (c) texto de passo 0 de influenciadora não traz nenhum preço/número/proposta/catálogo e termina em "Atenciosamente,"; o de marca indie/distribuidor traz exatamente 1 número da simulação, com a ressalva e o link da proposta; (d) pedido de desconto/outro preço no histórico → texto encaminha ao orçamento, sem novo valor; (e) perfumaria → sem número.
