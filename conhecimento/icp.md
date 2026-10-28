# ICP, sinais e regra de score

Públicos da fase atual (`ai_leads_qualificacao.publico`) e segmentos do Busca Leads:

| publico | segmentos |
|---|---|
| `influenciadora` | `influenciadora`, `maquiador` |
| `marca_indie` | `marca_indie`, `tiktok_perfumaria` |
| `distribuidor` | `distribuidor` |

Fatos comerciais: ver `garnet.md`. Pedido mínimo (1.000 / 3.000 peças) é um **filtro de fit**: quem não consegue chegar a esse volume é fit baixo, mas **nunca diga isso como recusa**; encaminhe ao orçamento.

## 1. Influenciadora e maquiador

**Quem é.** Criadora de conteúdo de beleza (maquiagem como nicho principal), maquiador(a) com nome, escola ou cursos, que quer uma linha assinada ou expandir uma marca que já tem.

**Dores.** Medo de pedido mínimo alto; não saber por onde começar (fórmula, embalagem, ANVISA); experiência ruim com fornecedor que atrasa ou muda a cor; querer cor e acabamento exclusivos; lançar rápido enquanto a audiência está aquecida.

**Gatilhos de compra.** Aniversário de canal, aumento de audiência, pedidos de seguidores por "linha própria", parceria recente com marca, lançamento de curso, fim de contrato com marca atual, lançamento de colab concorrente.

**Sinais positivos observáveis (fonte pública).**
- Maquiagem é o nicho principal (`extras.nichos`).
- Audiência engajada de 30 mil a 1 milhão (micro e médias fecham mais fácil que celebridades).
- Fala em "minha marca", "lançamento", "em breve" ou já tem marca sem linha de compactos.
- Contato profissional publicado (e-mail comercial, assessoria, parcerias).
- Mora ou atua em SP (facilita visita à fábrica).
- Já vende produto próprio ou infoproduto (prova que sabe monetizar).
**Sinais negativos.** Nicho sem relação com maquiagem; já tem contrato exclusivo com fabricante grande; marca própria estabelecida em multinacional; contrato de embaixadora de marca concorrente; perfil inativo; só contato via DM sem outro canal; celebridade top (agenda por assessoria complexa, tratar como oportunidade especial, sem automação).

**Objeções e respostas.**
- "Não tenho dinheiro para o mínimo." Resposta: o pedido mínimo de referência para compactados é de 1.000 peças; o orçamento depende da embalagem e da personalização, e a equipe ajuda a montar um primeiro lote que faça sentido. Não prometer lote menor.
- "Não entendo de fórmula/ANVISA." A Garnet conduz o desenvolvimento e apoia a adequação regulatória (modelo Full Service).
- "Já tenho fornecedor." Sem confronto: oferecer a Garnet como segunda opção para compactados/linha nova, e perguntar o que faltaria no fornecedor atual.
- "Quanto custa?" Para compactados, cite só o preço de referência da simulação (lido de `ai_config`, com a ressalva de que o valor final depende de embalagem e personalização) e peça o briefing para a equipe orçar. Nenhum outro valor.
- "Posso ver amostras?" Sim: enviamos amostras para projetos qualificados; a equipe combina o envio depois de entender o projeto.

## 2. Marca indie (inclui TikTok Shop e perfumaria)

**Quem é.** Marca pequena ou média de beleza, com CNPJ, e-commerce ou loja no TikTok Shop, que terceiriza produção ou quer segunda fonte, extensão de linha ou entrar em novas categorias (compactados, perfumaria, body splash).

**Dores.** Falta de estoque/ruptura; fornecedor que não escala com a demanda do TikTok Shop; lote mínimo alto para testar SKU; qualidade irregular; prazo longo; dificuldade de personalizar embalagem.

**Gatilhos de compra.** Pico de vendas no TikTok Shop, lançamento de nova linha, ruptura do fornecedor, evento (Beauty Fair), expansão para varejo/distribuidores, mudança de CNPJ ou investimento recebido.

**Sinais positivos.**
- Vende no TikTok Shop (`extras.tiktok_perfil.ttSeller`) e tem tração (seguidores, reviews recentes).
- Lançamento ou entrada em categoria em 2025–2026.
- Linha sem compactados ou com poucos SKUs de make.
- Contato comercial/parcerias direto no site; CNPJ ativo e porte pequeno/médio.
- Sede em SP ou região.
**Sinais negativos.** Multinacional ou grupo grande (Avon, Darrow etc.); fábrica própria declarada; sem contato; marca inativa, site fora do ar; revenda pura sem marca própria; produto fora do portfólio (shampoo, condicionador, tintura).

**Objeções e respostas.**
- "Meu volume por SKU é pequeno." Falar do mínimo confirmado (1.000 / 3.000 peças) e oferecer análise do briefing; não prometer exceção.
- "Já produzo em outro lugar." Segunda fonte para reduzir risco de ruptura; compactados como especialidade.
- "Preciso de prazo curto." Referência de ~30 dias; confirmado após o briefing.
- "Como garantem qualidade?" BPF e controle de qualidade em todas as etapas (ver `garnet.md`); sem citar certificações não listadas.

## 3. Distribuidor (especialmente com marca própria)

**Quem é.** Atacado/distribuição de beleza e perfumaria, centrais de compra, importadores, atacado de maquiagem para revenda; relevantes os que têm **marca própria** ou querem criar uma.

**Dores.** Depender de marcas de terceiros (margem e ruptura); dificuldade de criar linha própria com qualidade e fiscalização regulatória; mínimos altos de outros fabricantes; necessidade de portfólio exclusivo para fidelizar varejistas.

**Gatilhos de compra.** Plano de lançar marca própria, perda de distribuição de marca terceira, expansão regional, entrada em perfumaria/maquiagem, portal de fornecedores aberto.

**Sinais positivos.**
- Já tem marca própria (`extras.marca_propria`) ou fala em "linha própria".
- Canal de varejo ativo (lojas, revendedores) e portal de fornecedor/cadastro.
- Contato comercial ou compras identificado.
- Atua com maquiagem/perfumaria (categorias da Garnet).
**Sinais negativos.** Distribuição de nicho fora do portfólio (profissional de cabelo, farma pura); multinacional; contato só "geral" sem comprador; já com fábrica própria.

**Objeções e respostas.**
- "Meu volume por item é alto/baixo." Mínimos confirmados; capacidade de referência de 50 mil unidades por mês (não prometer além).
- "Preciso de exclusividade." A confirmar com a Garnet; não prometer.
- "Preciso de tabela de preços." Compactados: a simulação de referência está na Proposta Comercial (com a ressalva); o preço final depende de embalagem e personalização e sai no orçamento a partir do briefing. Perfumaria/loções: só orçamento.
- "Fazem registro na ANVISA?" A equipe apoia a adequação regulatória; detalhes são tratados com a equipe técnica.

## 4. Regra de score 0–100

Entrada: dados do Busca Leads (`ai_v_leads_alvo`) + sinais públicos pesquisados. Saída: `ai_leads_qualificacao.score` e `motivos` (ver skill `icp-e-scoring`). Cada ponto deve ter evidência e fonte; sem evidência, sem ponto.

**Base:** 30 pontos para todo lead dos públicos-alvo com ao menos um canal de contato. Sem nenhum canal: score máximo 25.

### 4.1 Influenciadora / maquiador (soma 30 base + até 70)
| Critério | Pontos |
|---|---|
| Maquiagem é o nicho principal | +15 |
| Audiência 30 mil a 1 milhão | +10 (100 mil a 1 milhão) / +8 (30 mil a 100 mil) |
| Sinal de marca própria ou lançamento em breve (2025–2026) | +12 |
| Contato direto/comercial/assessoria (tipo `direto` ou `comercial` ou `agencia`) | +10 |
| Em SP | +5 |
| Dá aulas / escola / curso (maquiador) | +5 |
| Engajamento recente (posts nos últimos 60 dias) | +5 |
| Fora do nicho de beleza/maquiagem | −20 |
| Celebridade acima de 5 milhões ou multinacional como embaixadora exclusiva | −15 |
| Perfil inativo (sem post há mais de 90 dias) | −15 |
| Só contato "sac" ou "geral" | −5 |

### 4.2 Marca indie / TikTok Shop e perfumaria (30 base + até 70)
| Critério | Pontos |
|---|---|
| Vende no TikTok Shop | +12 |
| Lançamento ou nova linha em 2025–2026 | +12 |
| Categoria compatível (maquiagem compactada, perfumaria, body splash, skincare, corpo) | +10 |
| Seguidores 10 mil a 100 mil (+5) ou acima de 100 mil (+8) | +5 / +8 |
| Contato comercial/parcerias/direto | +10 |
| Em SP | +5 |
| Sem compactados na linha (oportunidade de entrada) | +8 |
| Multinacional ou grupo grande | −20 |
| Fábrica própria declarada | −15 |
| Site fora do ar / marca inativa | −15 |
| Só contato "sac" ou "geral" | −5 |

### 4.3 Distribuidor (30 base + até 70)
| Critério | Pontos |
|---|---|
| Tem marca própria ou fala em linha própria | +15 |
| Atua com maquiagem ou perfumaria | +10 |
| Contato comercial ou de compras | +10 |
| Portal/cadastro de fornecedor ou revendedores ativos | +8 |
| Em SP ou entrega nacional | +5 |
| Porte compatível com 3.000+ peças por item | +7 |
| Multinacional | −20 |
| Fora do portfólio (só cabelo/farma/profissional de salão) | −20 |
| Só contato "geral" sem comprador | −5 |

### 4.4 Bônus e penalidades válidos para todos
| Critério | Pontos |
|---|---|
| **Já respondeu antes** (`leads.status = 'respondeu'`, ou resposta registrada em `interacoes`/`extras`) | **+25** (e prioridade 1 independentemente do score) |
| Já contatado sem resposta (`contatado`) | +0 (prioridade 2) |
| Relacionamento prévio com a Garnet (`extras.relacao_garnet`) | +10 |
| Pediu para não ser contatado / está em `ai_bloqueios` | score 0 e **não gerar rascunho** |
| `opt_out` em `ai_interacoes` | score 0 |
| Fonte `conhecimento_setorial` ainda não verificada | teto de 50 |
| Sem nenhum contato | teto de 25 |

O score é limitado a 0–100. Arredonde para inteiro.

### 4.5 Faixas e ação
- **80–100**: abordar primeiro; rascunho no próximo turno.
- **60–79**: qualificar mais (pesquisa complementar) e abordar quando houver vaga.
- **40–59**: backlog.
- **< 40**: não abordar nesta fase.
Quem respondeu antes vai à frente da fila mesmo com score baixo, mas com texto de **primeiro contato** (reativação só se houver interação nos últimos 30 dias; ver `tom-de-voz.md`).

### 4.6 Formato de `motivos`
`[{"criterio": "nicho_maquiagem", "pontos": 15, "evidencia": "bio fala de make e tutoriais", "fonte": "https://..."}]`. Penalidades têm pontos negativos. A soma dos pontos deve bater com o score (antes do teto).
