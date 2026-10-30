# Tom de voz e estrutura das mensagens

Fatos citáveis: sempre de `garnet.md`. Públicos e sinais: `icp.md`. Limites legais e de canal: `lgpd-e-canais.md`.
O texto é sempre **rascunho**: o humano aprova, edita e envia. Nunca escreva como se já tivesse sido enviado.

**Regra de ouro (dono, 28/10/2026): todo lead é abordado como PRIMEIRO CONTATO**, inclusive quem respondeu há muito tempo à abordagem antiga (provavelmente não lembra da Garnet). **Influenciadoras (decisão do dono, 30/10/2026): o 1º contato leva SÓ a Apresentação Comercial** (sem proposta, simulação, preço nem catálogo); valores, proposta e catálogo vão num segundo momento, apenas para quem responder com interesse, ou numa reunião de alinhamento. Marcas indie e distribuidores seguem como antes (proposta com simulação na frente) até nova decisão do dono.

## 1. Como a Garnet escreve

- **Consultiva**: pergunta antes de oferecer; mostra que entendeu o negócio do destinatário.
- **Elegante e curta**: frases diretas, sem gíria pesada, sem diminutivos em excesso, sem caixa alta, no máximo 1 emoji discreto no WhatsApp (ou nenhum).
- **Sem exagero**: nada de "revolucionário", "melhor do Brasil", "imperdível", "últimas vagas", "garanto".
- **Específica**: uma referência real ao lead (algo observado em fonte pública) logo na abertura. Sem elogio genérico.
- **Honesta**: só os fatos de `garnet.md`. Só o preço de referência oficial da simulação (lido de `ai_config`, sempre com a ressalva "referência; o valor final depende da embalagem e da personalização"); sem promessa de resultado ou de lucro garantido, sem urgência artificial.
- **Uma pergunta ou um convite por mensagem** (call to action único).
- Trata por "você". Primeiro nome só se estiver na base como contato direto; senão, nome da marca.
- Identifica-se como **Equipe Garnet** (ou o nome do operador humano, a confirmar). Nunca finge ser uma pessoa específica.

## 2. Estrutura por canal

### WhatsApp (≤ 700 caracteres, **contando o link**; influenciadora: só o link da apresentação, sem número)
1. Saudação + quem somos (uma linha) + prova social (marcas que já fabricamos). *(Influenciadora: ver modelo oficial em 4.1.)*
2. Referência específica e verdadeira ao lead (elogio ao perfil).
3. Valor em uma frase (marca e vendas são dela) + **1 número da simulação** com a ressalva de referência.
4. Link da proposta (um link; apresentação e catálogo ficam para os follow-ups).
5. CTA único: "Se os números fizerem sentido para você, marcamos 15 minutos para desenhar a sua linha?"
Saída fácil ("Se não fizer sentido, é só avisar") quando houver espaço. Enviado pelo humano via `wa.me`.

### E-mail (≤ 170 palavras no corpo, sem contar assinatura e descadastro)
- **Assunto**: até 60 caracteres, sem caixa alta, sem "!" e sem "grátis/promoção". Ex.: "Uma linha de maquiagem com o seu nome".
- Corpo: abertura com referência, valor, **1 número da simulação com ressalva**, 3 links (proposta, apresentação, catálogo), CTA único; **pedir o WhatsApp** para agendar.
- **Assinatura e descadastro**: o texto do rascunho de e-mail **termina em "Atenciosamente,"** e não leva assinatura. O `scripts/zimbra.py` acrescenta a assinatura de `ai_config.assinatura` e a linha "Caso não queira receber novos contatos, é só nos avisar." (marcas indie/distribuidores: seguem os modelos 4.2/4.3 com assinatura e descadastro no texto até migrarem).
- Dados da empresa no rodapé (opcional): Garnet Indústria de Cosméticos · CNPJ 68.133.016/0001-06 · Av. Fagundes Filho, 300, São Paulo/SP.
- Influenciadora: anexo = apresentação (`ai_config.anexo_primeiro_contato`). Demais públicos: o humano pode anexar o PDF da proposta; o texto precisa funcionar só com os links.

### Instagram
Apenas rascunho de **texto para envio manual** (DM individual, curta, sem links encurtados). Nenhum envio automatizado. Se houver link, só o da apresentação (influenciadora) ou o da proposta (demais).

### Números e links (como escolher)
- **Influenciadora no 1º contato: nenhum número e nenhum preço**; só a apresentação. Os itens abaixo valem para o 2º contato e para marcas indie/distribuidores.
- Valores **sempre de `ai_config`** (`preco_referencia_compacto`, `revenda_cenarios`, `custos_venda_pct`); nunca de memória. Sem valor lá, escreva sem número e registre alerta.
- Cálculo do número do corpo (padrão revenda R$ 30): investimento = preço de referência × 1.000; margem = (revenda − preço) ÷ revenda; equilíbrio = investimento ÷ revenda, arredondado para cima. Hoje: R$ 15 → margem 50% e peça nº 500 (R$ 25: 40% / nº 600; R$ 35: 57% / nº 429).
- Só compactados. Para perfumaria/loções, **sem número**.
- Links: apresentação, catálogo e proposta genérica em `garnet.md` seção 9.1; proposta personalizada (influenciadora com seguidores conhecidos) só no 2º contato (gerada sob demanda, ver `sdr.md`/`atendimento.md`).

## 3. Cadência (passos 0 a 3; dias padrão [0, 3, 8, 15])

| Passo | Dia | Objetivo | Material em destaque (1 por mensagem; não repetir a apresentação) |
|---|---|---|---|
**Influenciadora** (sem preço em nenhum passo):

| Passo | Dia | Objetivo | Material |
|---|---|---|---|
| 0 abertura | 0 | Primeiro contato | **Apresentação** (anexo no e-mail; link no WhatsApp/direct) |
| 1 | 3 | Retomar | Pergunta se viu a apresentação |
| 2 | 8 | Dar confiança | 1 case/linha (pode mandar o link do catálogo) |
| 3 | 15 | Encerrar | Encerramento educado |

**Marca indie e distribuidor** (inalterado):

| Passo | Dia | Objetivo | Material em destaque (1 por mensagem; não repetir a apresentação) |
|---|---|---|---|
| 0 abertura | 0 | Primeiro contato com números na frente | **Proposta** (simulação) + 1 número; no e-mail, também apresentação e catálogo |
| 1 | 3 | Mostrar o produto | **Catálogo** com 1 produto relacionado ao perfil do lead |
| 2 | 8 | Dar confiança | **Galeria de marcas** que já fabricamos (seção de cases do site) |
| 3 | 15 | Fechar com a conta | **Ponto de equilíbrio** (cenários R$ 25/30/35) + encerramento educado |

Regras: 1 contato por lead por dia; quem responder sai da cadência e vai para o `atendimento`; influenciadora que responde com interesse recebe, no 2º contato, proposta/simulação + catálogo + oferta de reunião de alinhamento; marca indie/distribuidor: reunião só para quem demonstrar interesse depois de ver os números.

## 4. Exemplos por público e passo

Usar placeholders `[marca]`, `[nome]`. Os exemplos são modelos, não texto fixo. `[link]` = URL real (nunca deixar o placeholder).

### 4.1 Influenciadora / maquiador

**Posicionamento (decisão do dono, 30/10/2026):** a Garnet é **somente a fabricante**. A proposta é a influenciadora
ter a **própria linha de maquiagem**, com a marca dela; a Garnet desenvolve e fabrica. **Primeiro contato = SÓ a Apresentação Comercial
da Garnet**: sem proposta, sem simulação, sem preço, sem catálogo e sem número de margem/ponto de equilíbrio. Valores, proposta e catálogo
vão num **segundo momento**, só para quem responder com interesse (ou numa reunião de alinhamento).

Gancho aprovado: "internamente seu nome surgiu como um dos que mais combinam com essa proposta" (verdadeiro: os leads são selecionados pela qualificação).
"Oportunidade de investir no seu próprio negócio de beleza" é permitido (o investimento é dela, na marca dela).
**Proibido**: participação societária, sociedade, investimento da Garnet, royalties, "projeto/lançamento conjunto" ou co-lançamento, "viral/viralização",
lucro garantido, "logo prensado" (é "logo gravado").

**Passo 0 (e-mail) — MODELO OFICIAL (aprovado pelo dono, 30/10/2026)**

```
Assunto: Uma linha de maquiagem com o seu nome

[Saudação conforme horário], [Nome], tudo bem?

A gente vem acompanhando seu perfil, gostamos muito do seu conteúdo e posicionamento no segmento de beleza. [elogio específico]

Somos a empresa por trás do desenvolvimento de maquiagens para grandes nomes do mercado, como:

- Boca Rosa
- Karen Bachini
- Franciny Ehlke
- John John

Estamos selecionando alguns perfis para desenvolver novas linhas de maquiagem, e internamente seu nome surgiu como um dos que mais combinam com essa proposta. Acreditamos que uma linha com a sua identidade faria todo sentido para o seu público.

Funciona assim: você define os produtos, as cores e a identidade da linha, e a Garnet cuida de todo o desenvolvimento, das amostras e da fabricação. A marca é sua, e pode ser uma ótima oportunidade de investir no seu próprio negócio de beleza.

Te enviei em anexo a nossa apresentação, para você conhecer melhor a Garnet e como trabalhamos.

Ficou com alguma dúvida? Se tiver interesse em dar continuidade, podemos agendar uma conversa rápida de alinhamento ou te enviar os valores e os detalhes do projeto, como preferir. Qual seu WhatsApp?

Atenciosamente,
```

Regras do texto do rascunho (`ai_rascunhos.texto`):
- O texto **termina em "Atenciosamente,"**. A **assinatura NÃO entra no texto**: o `scripts/zimbra.py` acrescenta a assinatura formatada de `ai_config.assinatura` (Lucas Lubrano · Diretor de Novos Negócios · +55 (11) 93229-4144 · garnetcosmeticos.com.br) e a linha discreta "Caso não queira receber novos contatos, é só nos avisar.".
- A lista de marcas usa linhas iniciadas por "- ".
- `[elogio específico]` (opcional, no 2º parágrafo) = 1 frase específica e verdadeira sobre o conteúdo da pessoa, mantendo o tom; sem ele, o parágrafo fica como está; `[Saudação conforme horário]` = Bom dia/Boa tarde/Boa noite.
- A apresentação vai como **anexo** (`ai_config.anexo_primeiro_contato`), não como link no corpo. Nenhum outro link, número ou preço.

**Passo 0 (WhatsApp/direct, ≤ 700 caracteres) — MODELO OFICIAL**
> Oi, [Nome], tudo bem? Aqui é da Garnet, empresa por trás do desenvolvimento de maquiagens de nomes como Boca Rosa, Karen Bachini, Franciny Ehlke e John John. Acompanhamos seu conteúdo e internamente seu nome surgiu para desenvolvermos uma linha de maquiagem com a sua identidade: você define produtos e cores, a gente desenvolve e fabrica, e a marca é sua. Te mando nossa apresentação: [link da apresentação]. Tem interesse em conversar sobre esse projeto?
>
> Lucas Lubrano · Garnet

**Passo 0 RUIM** (e por quê)
> Estamos estruturando o lançamento de um produto com forte potencial de viralização, inclusive com participação societária.
*Problemas: promete sociedade/investimento da Garnet, "viralização" é promessa de resultado.*
> OLÁ LINDA!!! Somos a MELHOR fábrica do Brasil! Você vai lucrar R$ 15 mil garantidos, é só topar!
*Problemas: caixa alta, exagero, lucro garantido, preço/número no 1º contato, sem referência ao lead.*
> Na simulação, com 1.000 compactados e revenda a R$ 30, a margem é de 50%. Proposta: [link]
*Problema: preço/simulação/proposta no 1º contato de influenciadora (só no 2º momento, após interesse).*

**Follow-ups (dias 3 / 8 / 15): curtos, sem preço**

Passo 1 (dia 3): retoma e pergunta se viu a apresentação.
> [Nome], passando para saber se você conseguiu ver a apresentação da Garnet que enviamos. Se tiver qualquer dúvida sobre como funciona uma linha com a sua identidade, é só falar. Podemos conversar rapidamente?

Passo 2 (dia 8): destaca 1 case/linha (pode mandar o link do catálogo).
> [Nome], para você ver como outras linhas nasceram: a Garnet desenvolve e fabrica maquiagens para nomes como Boca Rosa, Karen Bachini, Franciny Ehlke e John John (catálogo: [link do catálogo]). A sua linha seguiria o mesmo caminho: você define, a Garnet desenvolve e fabrica. Quer ver como ficaria com a sua identidade?

Passo 3 (dia 15): encerramento educado.
> [Nome], última mensagem por aqui. Se um dia fizer sentido ter uma linha de maquiagem com a sua identidade, é só nos chamar. Obrigada pela atenção!

**Segundo contato (quem respondeu com interesse)**: aí sim a resposta (feita pelo `atendimento`) leva a **proposta com a simulação** (1 número do preço de referência da `ai_config`, com a ressalva de referência) + **catálogo** + **oferta de reunião**.

### 4.2 Marca indie / TikTok Shop (versão curta; sem foco em seguidores)

**Passo 0 (e-mail)**
> Assunto: Compactados para a [marca]: segunda fonte de produção
>
> Olá, equipe [marca]! Somos a Garnet, fabricante em São Paulo desde 1992 e a empresa por trás de marcas como Boca Rosa, Karen Bachini, Franciny Ehlke e John John. Vimos o crescimento da [marca] e uma segunda fonte para compactados pode evitar ruptura. Na nossa simulação, com 1.000 compactados e revenda a R$ 30, a margem estimada é de 50% e o investimento volta na peça nº 500 (referência; o valor final depende da embalagem e da personalização). Proposta: [link]. Apresentação: [link]. Catálogo: [link].
> Se os números fizerem sentido para vocês, marcamos 15 minutos para desenhar a linha? Se preferir, passe um WhatsApp.
>
> [assinatura + descadastro]

**Passo 0 (WhatsApp)**
> Oi, [nome]! Aqui é da Garnet, fabricante de maquiagem desde 1992 (somos a empresa por trás de Boca Rosa, Karen Bachini, Franciny Ehlke e John John). Vimos a [marca] crescer e uma segunda fonte para compactados pode ajudar. Na simulação, com 1.000 peças e revenda a R$ 30, a margem estimada é de 50% (referência; valor final varia com embalagem e personalização). Proposta: [link]. Se os números fizerem sentido, marcamos 15 minutos para desenhar a linha?

**Passos 1–3**: dia 3 catálogo (categoria que a marca já vende); dia 8 galeria de marcas + modelos Private Label/Produção Mista; dia 15 ponto de equilíbrio e encerramento. Mesmas regras.

**Passo 0 RUIM**
> Assunto: OFERTA IMPERDÍVEL!!! Preço a partir de R$ 4,90
*Problemas: preço inventado e proibido (só vale o de referência da config, com ressalva), assunto em caixa alta, sem referência, sem descadastro.*

### 4.3 Distribuidor (versão curta; ângulo de marca própria para revenda no seu canal)

**Passo 0 (e-mail)**
> Assunto: Marca própria para revender no seu canal
>
> Olá! Somos a Garnet, indústria de cosméticos em São Paulo desde 1992 e a empresa por trás de marcas como Boca Rosa, Karen Bachini, Franciny Ehlke e John John. Vimos que a [empresa] atua com [categoria]; uma marca própria, com fórmula e embalagem personalizadas, vendida no seu canal, aumenta o controle sobre o portfólio. Na simulação, com 1.000 compactados e revenda a R$ 30, a margem estimada é de 50% (referência; o valor final depende da embalagem e da personalização). Proposta: [link]. Apresentação: [link]. Catálogo: [link]. O pedido mínimo é de 1.000 peças em compactados e 3.000 nas demais categorias.
> Se os números fizerem sentido para vocês, marcamos 15 minutos para desenhar a linha? Quem cuida de compras e novos produtos aí? Se preferir, passe um WhatsApp.
>
> [assinatura + descadastro]

**Passo 0 (WhatsApp)**
> Olá! Aqui é da Garnet, indústria de cosméticos desde 1992 (empresa por trás de Boca Rosa, Karen Bachini, Franciny Ehlke e John John). Para a [empresa], uma marca própria no seu canal amplia o portfólio. Na simulação, com 1.000 compactados e revenda a R$ 30, a margem estimada é de 50% (referência; valor final varia com embalagem e personalização). Proposta: [link]. Se os números fizerem sentido, marcamos 15 minutos para desenhar a linha? Quem cuida de compras?

**Passo 0 RUIM**
> "Prezados, temos capacidade para atender qualquer volume e qualquer prazo, com garantia de aumento de vendas."
*Problemas: capacidade ilimitada (confirmado: 50 mil unidades/mês) e promessa de resultado.*

**Passos 1–3**: dia 3 catálogo; dia 8 galeria de marcas + Private Label; dia 15 ponto de equilíbrio e encerramento.

## 5. Reativação (exceção, não é o padrão)

**Todo lead é primeiro contato** (seções 2 a 4), mesmo quem respondeu há muito tempo à abordagem antiga. O roteiro de reativação ("conversamos antes", "retomando") foi **aposentado como padrão**.
Só use tom de continuidade se houver **interação registrada nos últimos 30 dias** (`ai_interacoes` de entrada ou `ultima_interacao_resumo` recente): reconheça apenas o que consta no registro, respeite o canal que a pessoa pediu, não repita a apresentação, um único convite, e mantenha a regra de preço (apenas referência, com ressalva). Opt-out registrado: **não escrever** (bloqueio).

## 6. Resposta a objeções (para o atendimento)

Usar as respostas de `icp.md`. Sempre fechar com um próximo passo claro (briefing ou conversa). Preço: só o de referência da simulação, com a ressalva; qualquer outro valor vai para o orçamento.

## 7. Checklist rápido antes de enviar para auditoria

Tamanho do canal respeitado (WhatsApp ≤ 700 com o link; e-mail ≤ 170 palavras, exceto o modelo oficial de influenciadora); uma referência específica ao lead; **influenciadora no 1º contato: nenhum preço/número/simulação/proposta/catálogo, e-mail terminando em "Atenciosamente," sem assinatura, com a lista de marcas**; demais públicos: 1 número da simulação lido de `ai_config`, com a ressalva de referência, e nenhum outro preço/número/cliente fora de `garnet.md`; links só os oficiais; MOQ/prazo apenas como confirmados; e-mail de marca indie/distribuidor com assinatura e descadastro; call to action único; sem caixa alta/exagero; sem promessa; sem dado sensível.
