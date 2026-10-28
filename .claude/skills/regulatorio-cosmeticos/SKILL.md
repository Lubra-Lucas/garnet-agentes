---
name: regulatorio-cosmeticos
description: Use quando um texto, resposta ou conteúdo tocar em ANVISA, registro/notificação de cosméticos, rotulagem, alegações de produto, certificações ou segurança. Serve para orientar em termos gerais e evitar promessas; a equipe técnica da Garnet sempre confirma.
---

# regulatorio-cosmeticos

## Objetivo
Evitar que os agentes afirmem algo regulatório incorreto ou prometam aprovação. Orientação **geral**; nunca parecer técnico.

## Quem usa
`atendimento`, `marketing`, `auditor`, `sdr` (consulta).

## Referências
- `conhecimento/garnet.md`: o que a Garnet confirma ("apoiamos a adequação técnica e regulatória", etapa 5; BPF).
- `conhecimento/tom-de-voz.md`.

## Ferramentas permitidas
Read. WebFetch apenas de fontes oficiais (site da ANVISA) para consulta; sem registrar números de norma sem marcar "verificar".

## Conteúdo de apoio (resumo geral, sempre com ressalva)
- A ANVISA classifica produtos de higiene pessoal, cosméticos e perfumes em **grau 1** (risco mínimo) e **grau 2** (risco potencial; exige comprovação de eficácia/segurança conforme a alegação). Em termos gerais, produtos grau 1 passam por **notificação** e grau 2 por **registro** (verificar a regra vigente e a classificação de cada produto).
- Há regras para **rotulagem** (informações obrigatórias em português, composição, lote, validade, responsável etc.) e para **alegações** (o que se pode afirmar sobre efeito do produto): verificar a norma vigente.
- A empresa responsável (titular) e as responsabilidades entre marca e fabricante variam conforme o modelo de produção: **a confirmar com a Garnet**.
- Normas citadas (RDC): não citar números sem confirmação; se necessário, escrever "RDC (verificar o número e a versão vigente)".
- A classificação de grau, necessidade de notificação/registro e prazos são definidos pela equipe técnica da Garnet em cada projeto.

## Entrada e saída
- Entrada: dúvida ou texto com tema regulatório.
- Saída: resposta/ajuste em linguagem simples + ressalva padrão. Para o auditor, uma checagem `{"regra": "regulatorio_sem_promessa", "ok": true|false, "nota": "..."}` dentro de `auditoria.checagens`.
Ressalva padrão: "Em termos gerais, [explicação]. A classificação e as exigências do seu produto são confirmadas pela nossa equipe técnica na análise do briefing."

## Regras de decisão
1. Nunca prometer aprovação, registro, prazo de registro ou "100% adequado à ANVISA".
2. Não afirmar que um produto é grau 1 ou 2, nem que dispensa registro: isso é decisão da equipe técnica.
3. Alegações de eficácia (clareia, anti-idade, hidrata em X horas, "dermatologicamente testado", "vegano", "natural"): não usar sem confirmação.
4. Certificações além de BPF: "a confirmar com a Garnet".
5. Em dúvida: não responder; encaminhar ao humano com `ai_db.py evento <agente> alerta`.

## Restrições e aprovações
Todo conteúdo com tema regulatório passa por `auditor` e humano.

## Checklist de qualidade
- Texto traz a ressalva; nenhum número de RDC sem "verificar"; nenhuma promessa.
- Teste: "vocês garantem o registro na ANVISA?" → resposta oferece apoio, sem garantia.
