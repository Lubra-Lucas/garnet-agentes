---
name: conteudo-b2b
description: Use para planejar e escrever o calendário de conteúdo, roteiros de reels/carrosséis/stories, legendas e artigos curtos voltados a quem quer criar sua marca de maquiagem. Acione nos turnos de marketing.
---

# conteudo-b2b

## Objetivo
Gerar conteúdo que eduque e atraia influenciadoras, marcas indie e distribuidores, sem prometer resultado e sem usar material não autorizado.

## Quem usa
`marketing`.

## Referências
- `conhecimento/garnet.md` (fatos, cases, o que não dizer), `conhecimento/tom-de-voz.md`, `conhecimento/icp.md` (dores e objeções como pautas), `conhecimento/lgpd-e-canais.md`.
- Skill `regulatorio-cosmeticos` para qualquer alegação de produto.

## Ferramentas permitidas
Read, `ai_db.py get ai_conteudos|ai_v_funil`, `ai_db.py post|patch ai_conteudos`, `ai_db.py evento`. Sem publicar.

## Entrada
Período (ex.: 2 semanas), públicos prioritários, métricas recentes (`funil-analytics`).

## Saída (insere em `ai_conteudos`)
```json
{
  "tipo": "post|reels|carrossel|story|anuncio",
  "titulo": "Como funciona o pedido mínimo em compactados",
  "roteiro": "gancho, desenvolvimento, CTA (cena a cena)",
  "legenda": "texto final",
  "publico": "influenciadora|marca_indie|distribuidor",
  "data_sugerida": "2026-11-04",
  "status": "rascunho",
  "agente_id": "marketing"
}
```
Depois de auditado: `aguardando_aprovacao`. `auditoria` no formato da skill `auditoria-conformidade`.

## Regras de decisão
1. Pilares (hipótese): (a) bastidores e processo em 8 etapas; (b) 5 modelos de produção; (c) mitos sobre pedido mínimo e prazo; (d) como montar um briefing; (e) simulador "Monte a sua make".
2. Cada peça tem um CTA único: briefing (`#contato`), simulador (`#personalize`) ou WhatsApp.
3. Imagens: apenas fotos reais autorizadas. Imagens de conceito geradas por IA só como "ilustração", nunca como produto fabricado. Fotos da fábrica sem legenda nem ampliação.
4. Cases: nomes da lista citável, como "marcas que já fabricamos", sem resultados ou citações.
5. Sem preço, sem depoimento, sem veículos como se fossem da Garnet, sem promessas de vendas.
6. Frequência (hipótese): 3 a 4 peças por semana.
7. Não usar imagem ou voz de pessoas sem autorização.

## Restrições e aprovações
Publicação sempre por humano após aprovação. O `marketing` não acessa redes.

## Checklist de qualidade
- Fatos conferidos em `garnet.md`; CTA único; tom elegante; legenda ≤ 600 caracteres (hipótese).
- Teste: roteiro que cita "resultado de X% de vendas" deve ser reprovado.
