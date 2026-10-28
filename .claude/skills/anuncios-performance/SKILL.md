---
name: anuncios-performance
description: Use para propor, estruturar e acompanhar campanhas pagas (Meta e Google) com o orçamento de R$ 1.000 do mês 1, definir criativos, públicos, metas e critérios de corte/escala. Acione ao planejar campanhas e nos relatórios semanais.
---

# anuncios-performance

## Objetivo
Transformar o orçamento aprovado em leads B2B qualificados, com hipóteses explícitas e decisões baseadas em dados.

## Quem usa
`marketing` (propõe), `performance` (acompanha).

## Referências
- `conhecimento/anuncios-mes1.md`: plano, divisão de verba, termos, KPIs, critérios.
- `conhecimento/garnet.md`, `conhecimento/tom-de-voz.md`, `conhecimento/lgpd-e-canais.md`.
- Skills `funil-analytics`, `custos-e-limites`, `auditoria-conformidade`.

## Ferramentas permitidas
Read, `ai_db.py get ai_campanhas|ai_conteudos|ai_v_funil|ai_config`, `post|patch ai_campanhas`, `post ai_conteudos`, `ai_db.py evento`. Sem acesso a contas de anúncio; números de gasto/resultado entram digitados pelo humano.

## Entrada
`ai_config.orcamento_ads_mes` (1000), resultados informados em `ai_campanhas.resultados`.

## Saída
```json
{
  "nome": "Google Search | fabricação de maquiagem própria",
  "plataforma": "google|meta|outro",
  "objetivo": "conversas e briefings de B2B",
  "publico": "marca_indie",
  "orcamento": 450,
  "gasto": 0,
  "status": "proposta",
  "criativos": [{"titulo": "...", "descricao": "...", "destino": "https://garnetcosmeticos.com.br/#contato"}],
  "resultados": {"impressoes": 0, "cliques": 0, "conversas": 0, "briefings": 0, "cpl": null, "hipoteses": ["CPL alvo R$ 60-120 (hipótese)"]}
}
```

## Regras de decisão
1. Soma de `orcamento` das campanhas ativas/propostas nunca excede `orcamento_ads_mes`.
2. Nenhuma campanha muda de `proposta` para `aprovada`/`ativa` sem aprovação humana; `gasto` é atualizado só com dados informados.
3. Aplicar critérios de corte/escala do `anuncios-mes1.md`; recomendar, não executar.
4. Marcar sempre CPL e CTR como **hipótese** até haver dados.
5. Textos de anúncio: sem preço, sem depoimento, sem promessa, sem veículos de imprensa como credencial da Garnet.
6. Quando houver pouca amostra (poucos cliques/conversas), não concluir; dizer "dados insuficientes".

## Restrições e aprovações
Precisa de aprovação: início de gasto, cada campanha/criativo, escala, pausa, uso de reserva, imagens/pessoas, mês 2.

## Checklist de qualidade
- Soma de orçamentos ≤ R$ 1.000.
- Toda meta está rotulada como hipótese.
- Teste: pedido para "gastar R$ 300 hoje" sem aprovação → recusar e gerar proposta.
