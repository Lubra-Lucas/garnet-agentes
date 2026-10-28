// DADOS FICTÍCIOS — usados apenas em ?demo=1. Nenhum nome, contato ou texto aqui é real.
(function () {
  const ago = (min) => new Date(Date.now() - min * 60000).toISOString();
  const dia = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  let seq = 1000;
  const uid = (p) => `${p}-${(++seq).toString(36)}`;

  const agentes = [
    { id: 'orquestrador', nome: 'Orquestrador', papel: 'Abre o turno, distribui e resume', cor: '#8a6d3b', icone: 'workflow', ordem: 1, ativo: true },
    { id: 'qualificacao', nome: 'Inteligência & Qualificação', papel: 'Pesquisa sinais públicos e dá score', cor: '#3f7f8c', icone: 'search', ordem: 2, ativo: true },
    { id: 'sdr', nome: 'SDR', papel: 'Escreve rascunhos de primeiro contato e follow-up', cor: '#b0526a', icone: 'pen', ordem: 3, ativo: true },
    { id: 'auditor', nome: 'Auditor de Conformidade', papel: 'Revisa todo texto antes de chegar a você', cor: '#6a5aa8', icone: 'shield', ordem: 4, ativo: true },
    { id: 'atendimento', nome: 'Atendimento & Pré-vendas', papel: 'Classifica respostas e monta briefing', cor: '#4d8a5e', icone: 'message', ordem: 5, ativo: true },
    { id: 'marketing', nome: 'Marketing & Social', papel: 'Calendário, roteiros, legendas e anúncios', cor: '#c07a3a', icone: 'megaphone', ordem: 6, ativo: true },
    { id: 'performance', nome: 'Performance', papel: 'KPIs do funil e relatório semanal', cor: '#4a6fa5', icone: 'trending', ordem: 7, ativo: true },
  ];

  const T1 = 'demo-turno-1', T0 = 'demo-turno-0', TA = 'demo-turno-a', TB = 'demo-turno-b';
  const turnos = [
    { id: T1, tipo: 'manha', status: 'em_andamento', iniciado_em: ago(95), finalizado_em: null, resumo: null, metricas: {} },
    { id: T0, tipo: 'tarde', status: 'concluido', iniciado_em: ago(1400), finalizado_em: ago(1340), resumo: 'Demonstração: 9 leads qualificados, 7 rascunhos criados, 6 aprovados pelo auditor e 1 devolvido ao SDR.', metricas: { qualificados: 9, rascunhos: 7, auditados: 7, reprovados: 1 } },
    { id: TA, tipo: 'marketing', status: 'concluido', iniciado_em: ago(2900), finalizado_em: ago(2870), resumo: 'Demonstração: calendário de 5 conteúdos e plano de anúncios proposto.', metricas: { conteudos: 5, campanhas: 2 } },
    { id: TB, tipo: 'performance', status: 'falhou', iniciado_em: ago(4400), finalizado_em: ago(4390), resumo: 'Demonstração: relatório semanal interrompido por falta de dados de anúncios.', metricas: {} },
  ];

  const ex = (turno, ag, inst, st, tarefa, resultado, ini, fim, erro) => ({
    id: uid('exec'), turno_id: turno, agente_id: ag, instancia: inst, status: st, tarefa, resultado: resultado || null,
    iniciado_em: ago(ini), finalizado_em: fim == null ? null : ago(fim), erro: erro || null,
  });
  const execucoes = [
    ex(T1, 'orquestrador', null, 'concluida', 'Abrir turno e selecionar 20 leads', 'Selecionei 20 leads (4 respondidos, 6 em follow-up, 10 novos) e distribuí entre qualificação e SDR.', 94, 88),
    ex(T1, 'qualificacao', null, 'trabalhando', 'Pontuando "Marca Fictícia Brisa Ltda" (site e Instagram)', null, 87, null),
    ex(T1, 'sdr', 'influenciadoras', 'trabalhando', 'Escrevendo 1º contato para "Ana Demonstração" (WhatsApp)', null, 40, null),
    ex(T1, 'sdr', 'marcas_indie', 'concluida', 'Follow-up passo 2 para 3 marcas indie', '3 rascunhos entregues ao auditor (2 WhatsApp, 1 e-mail).', 70, 52),
    ex(T1, 'sdr', 'distribuidores', 'na_fila', 'Aguardando qualificação de 2 distribuidores', null, 20, null),
    ex(T1, 'auditor', null, 'concluida', 'Auditar 5 rascunhos', '4 aprovados e enviados para a sua aprovação; 1 reprovado (promessa de prazo sem confirmação).', 60, 45),
    ex(T1, 'atendimento', null, 'concluida', 'Classificar resposta de "Distribuidora Exemplo Norte"', 'Intenção: orçamento. Criei oportunidade na etapa Briefing e sugeri pedir categoria e quantidade.', 30, 8),
    ex(T1, 'performance', null, 'bloqueada', 'Gerar relatório do funil', null, 25, null, 'Sem dados de anúncios ainda (ai_campanhas sem gasto registrado).'),
    ex(T0, 'marketing', null, 'concluida', 'Roteiros da semana', '5 conteúdos propostos para a semana; 2 já aprovados.', 1395, 1360),
    ex(T0, 'sdr', 'influenciadoras', 'concluida', 'Rascunhos do turno da tarde', '3 rascunhos criados.', 1390, 1370),
    ex(T0, 'auditor', null, 'concluida', 'Auditar 7 rascunhos', '6 aprovados, 1 reprovado.', 1370, 1350),
    ex(TA, 'marketing', null, 'concluida', 'Calendário e plano de anúncios', 'Calendário com 5 conteúdos e 2 campanhas em proposta.', 2895, 2872),
    ex(TB, 'performance', null, 'falhou', 'Relatório semanal', null, 4398, 4391, 'Tempo esgotado ao consultar ai_v_funil (demonstração).'),
  ];

  const ev = (min, ag, tipo, msg, lead, dados, turno) => ({
    id: ++seq, created_at: ago(min), turno_id: turno || T1, execucao_id: null, agente_id: ag, lead_id: lead || null, tipo, mensagem: msg, dados: dados || {},
  });
  const eventos = [
    ev(94, 'orquestrador', 'info', 'Turno da manhã aberto (kill switch desligado).', null, { limite_rascunhos_turno: 20 }),
    ev(90, 'orquestrador', 'decisao', 'Selecionei 20 leads: 4 que responderam, 6 em follow-up e 10 novos.', null, { respondeu: 4, contatado: 6, novos: 10 }),
    ev(88, 'orquestrador', 'handoff', 'Entreguei 10 leads novos à Qualificação.', null, { destino: 'qualificacao' }),
    ev(80, 'qualificacao', 'acao', 'Analisei o site de "Estúdio Fictício Lume": vende maquiagem própria, sem linha compacta.', 'demo-lead-03', { fonte: 'https://exemplo.invalid/lume' }),
    ev(72, 'qualificacao', 'decisao', 'Score 78 para "Estúdio Fictício Lume" (3 motivos com fonte).', 'demo-lead-03', { score: 78, motivos: [{ criterio: 'Linha própria', pontos: 30, fonte: 'site' }] }),
    ev(70, 'sdr', 'acao', 'Iniciei follow-up passo 2 para marcas indie.', null, { instancia: 'marcas_indie' }),
    ev(64, 'sdr', 'acao', 'Rascunho criado para "Marca Fictícia Brisa Ltda" (WhatsApp, passo 2).', 'demo-lead-05', { canal: 'whatsapp' }),
    ev(60, 'sdr', 'handoff', 'Entreguei 3 rascunhos ao Auditor.', null, { destino: 'auditor' }),
    ev(55, 'auditor', 'alerta', 'Rascunho reprovado: promete prazo de entrega sem confirmação.', 'demo-lead-07', { regra: 'sem promessas de prazo' }),
    ev(48, 'auditor', 'decisao', '4 rascunhos aprovados e enviados para aprovação humana.', null, { aprovados: 4 }),
    ev(30, 'atendimento', 'acao', 'Classificando resposta de "Distribuidora Exemplo Norte".', 'demo-lead-09', {}),
    ev(8, 'atendimento', 'decisao', 'Intenção: orçamento. Oportunidade criada em Briefing.', 'demo-lead-09', { intencao: 'orcamento' }),
    ev(25, 'performance', 'erro', 'Não consegui gerar o relatório: sem dados de anúncios.', null, { erro: 'sem dados' }),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const L = (n, nome, publico, cidade, uf, prio, score, extra) => Object.assign({
    id: 'demo-lead-' + String(n).padStart(2, '0'), nome, segmento_id: publico, publico, cidade, uf,
    site: 'https://exemplo.invalid/' + n, instagram: 'demo_perfil_' + n, tiktok: null, seguidores: 5000 + n * 1370,
    email: `contato${n}@exemplo.invalid`, tem_email: true, whatsapp: `1190000${String(n).padStart(4, '0')}`, telefone: null, tem_whatsapp: true,
    status_busca: prio === 1 ? 'respondeu' : prio === 2 ? 'contatado' : 'novo', score_base: score - 8, score_ai: score, prioridade: prio,
    bloqueado: false, ultimo_contato_ai: null, rascunhos_abertos: 0, ultima_interacao_resumo: null,
  }, extra || {});
  const leads = [
    L(1, 'Ana Demonstração', 'influenciadora', 'São Paulo', 'SP', 3, 82, { rascunhos_abertos: 1 }),
    L(2, 'Bia Exemplo Makeup', 'influenciadora', 'Curitiba', 'PR', 2, 74, { ultimo_contato_ai: ago(4300), ultima_interacao_resumo: 'Mensagem enviada, sem resposta ainda.' }),
    L(3, 'Estúdio Fictício Lume', 'influenciadora', 'Belo Horizonte', 'MG', 3, 78),
    L(4, 'Carla Teste Beauty', 'influenciadora', 'Recife', 'PE', 3, 61, { tem_email: false, email: null }),
    L(5, 'Marca Fictícia Brisa Ltda', 'marca_indie', 'Florianópolis', 'SC', 2, 85, { rascunhos_abertos: 1, ultimo_contato_ai: ago(5800) }),
    L(6, 'Cosméticos Imaginários Aurora', 'marca_indie', 'Porto Alegre', 'RS', 3, 69),
    L(7, 'Marca Demo Pétala', 'marca_indie', 'Goiânia', 'GO', 3, 66, { rascunhos_abertos: 1 }),
    L(8, 'Perfumaria Fictícia Névoa', 'marca_indie', 'Salvador', 'BA', 1, 88, { ultima_interacao_resumo: 'Respondeu pedindo informações sobre pedido mínimo.', ultimo_contato_ai: ago(9000) }),
    L(9, 'Distribuidora Exemplo Norte', 'distribuidor', 'Manaus', 'AM', 1, 91, { ultima_interacao_resumo: 'Pediu orçamento de compactos.', ultimo_contato_ai: ago(10000) }),
    L(10, 'Distribuidora Demo Sul Ltda', 'distribuidor', 'Joinville', 'SC', 2, 72, { ultimo_contato_ai: ago(7000) }),
    L(11, 'Atacado Fictício Beleza Já', 'distribuidor', 'Campinas', 'SP', 3, 64, { tem_whatsapp: false, whatsapp: null, telefone: null }),
    L(12, 'Duda Imaginária Make', 'influenciadora', 'Fortaleza', 'CE', 3, 58),
    L(13, 'Marca Demo Cerrado', 'marca_indie', 'Brasília', 'DF', 3, 55),
    L(14, 'Opt-out Fictício Ltda', 'distribuidor', 'Londrina', 'PR', 3, 40, { bloqueado: true }),
  ];

  const qualif = leads.map((l) => ({
    lead_id: l.id, publico: l.publico, score: l.score_ai,
    motivos: [
      { criterio: 'Vende maquiagem com marca própria', pontos: 30, evidencia: 'Página de produtos com linha própria (dado fictício).', fonte: 'site (demonstração)' },
      { criterio: 'Audiência ativa', pontos: 25, evidencia: 'Postagens semanais no Instagram (dado fictício).', fonte: 'instagram (demonstração)' },
      { criterio: 'Sem linha de compactos', pontos: 20, evidencia: 'Catálogo sem pó compacto (dado fictício).', fonte: 'site (demonstração)' },
    ],
    sinais: {}, resumo: 'Perfil fictício para demonstração do painel. Boa aderência ao produto compacto private label.', agente_id: 'qualificacao', atualizado_em: ago(120),
  }));

  const rascunho = (n, lead, canal, passo, status, texto, just, aud, extra) => Object.assign({
    id: 'demo-rasc-' + n, lead_id: lead, execucao_id: null, agente_id: 'sdr', canal, passo_cadencia: passo,
    assunto: canal === 'email' ? 'Linha de compactos com a sua marca' : null, texto, justificativa: just, status,
    auditoria: aud, texto_final: null, motivo_rejeicao: null, aprovado_em: null, enviado_em: null, updated_at: ago(40), created_at: ago(55),
  }, extra || {});
  const okAud = (extra) => ({ aprovado: true, checagens: [
    { regra: 'Sem promessa de preço', ok: true, nota: 'Não cita valores.' },
    { regra: 'Sem promessa de prazo', ok: true, nota: 'Prazo não mencionado.' },
    { regra: 'Tom humano e personalizado', ok: true, nota: 'Cita o perfil do lead.' },
    { regra: 'Opt-out respeitado', ok: true, nota: 'Lead não está bloqueado.' }].concat(extra || []), motivo: null });
  const rascunhos = [
    rascunho(1, 'demo-lead-01', 'whatsapp', 0, 'aguardando_aprovacao',
      'Oi, Ana! Vi seu trabalho com maquiagem e achei lindo o cuidado com acabamento. Aqui na Garnet fabricamos compactos de pó com a marca de quem quer ter a própria linha. Posso te contar como funciona?',
      'Perfil com audiência engajada e sem linha própria de compactos. Primeiro contato leve, sem preço, convidando para conversar.', okAud()),
    rascunho(2, 'demo-lead-05', 'whatsapp', 2, 'aguardando_aprovacao',
      'Olá! Retomando nosso contato: preparamos uma explicação curta de como funciona o pedido mínimo (1.000 peças em compactos). Quer que eu envie?',
      'Follow-up do passo 2 depois de 4 dias sem resposta. Traz um fato comercial confirmado (pedido mínimo).', okAud()),
    rascunho(3, 'demo-lead-07', 'email', 0, 'aguardando_aprovacao',
      'Olá, tudo bem? Sou da Garnet Cosméticos, fabricante de maquiagem compacta private label. Notei que a Marca Demo Pétala ainda não tem pó compacto no catálogo. Posso apresentar como produzimos com a sua identidade visual?',
      'Marca indie com catálogo sem compactos; e-mail é o canal disponível mais formal.', okAud([{ regra: 'Assunto sem exageros', ok: false, nota: 'Assunto levemente promocional; sugerida revisão.' }])),
    rascunho(4, 'demo-lead-10', 'whatsapp', 1, 'aguardando_aprovacao',
      'Oi! Passando para saber se faz sentido conversarmos sobre uma linha de compactos para a Distribuidora Demo Sul. Posso enviar um resumo rápido?',
      'Distribuidor contatado há 5 dias; passo 1 da cadência.', okAud()),
    rascunho(5, 'demo-lead-02', 'whatsapp', 0, 'aprovado',
      'Oi, Bia! Adoro seus tutoriais. A Garnet fabrica compactos para quem quer lançar a própria linha. Posso te mandar um resumo?',
      'Primeiro contato aprovado por você.', okAud(), { texto_final: 'Oi, Bia! Adoro seus tutoriais. A Garnet fabrica compactos para quem quer lançar a própria linha. Posso te mandar um resumo?', aprovado_em: ago(15), updated_at: ago(15) }),
    rascunho(6, 'demo-lead-08', 'whatsapp', 0, 'enviado', 'Olá! Segue o resumo sobre pedido mínimo.', 'Enviado em demonstração.', okAud(), { enviado_em: ago(9000), aprovado_em: ago(9010) }),
  ];

  const interacoes = [
    { id: 'demo-int-1', lead_id: 'demo-lead-09', canal: 'whatsapp', direcao: 'saida', resumo: 'Primeiro contato enviado', conteudo: 'Olá! Somos a Garnet, fabricante de compactos private label.', intencao: null, rascunho_id: null, registrado_por: 'humano', created_at: ago(10000) },
    { id: 'demo-int-2', lead_id: 'demo-lead-09', canal: 'whatsapp', direcao: 'entrada', resumo: 'Pediu orçamento', conteudo: 'Oi! Temos interesse em compactos, podem mandar condições e orçamento? (resposta fictícia)', intencao: 'orcamento', rascunho_id: null, registrado_por: 'humano', created_at: ago(1500) },
    { id: 'demo-int-3', lead_id: 'demo-lead-08', canal: 'whatsapp', direcao: 'entrada', resumo: 'Perguntou o pedido mínimo', conteudo: 'Qual o pedido mínimo? (resposta fictícia)', intencao: 'duvida', rascunho_id: null, registrado_por: 'humano', created_at: ago(2000) },
  ];

  const oportunidades = [
    { id: 'demo-op-1', lead_id: 'demo-lead-09', etapa: 'briefing', categoria_produto: 'Pó compacto', quantidade_estimada: 3000, valor_estimado: null, briefing: {}, proxima_acao: 'Pedir categoria e quantidade', proxima_acao_em: dia(1), updated_at: ago(8) },
    { id: 'demo-op-2', lead_id: 'demo-lead-08', etapa: 'conversa', categoria_produto: 'Perfumaria', quantidade_estimada: 3000, valor_estimado: null, briefing: {}, proxima_acao: 'Responder pedido mínimo', proxima_acao_em: dia(0), updated_at: ago(300) },
    { id: 'demo-op-3', lead_id: 'demo-lead-05', etapa: 'amostra', categoria_produto: 'Blush compacto', quantidade_estimada: 1000, valor_estimado: null, briefing: {}, proxima_acao: 'Enviar amostra', proxima_acao_em: dia(3), updated_at: ago(2000) },
    { id: 'demo-op-4', lead_id: 'demo-lead-10', etapa: 'proposta', categoria_produto: 'Pó compacto', quantidade_estimada: 5000, valor_estimado: null, briefing: {}, proxima_acao: 'Montar proposta', proxima_acao_em: dia(5), updated_at: ago(3000) },
    { id: 'demo-op-5', lead_id: 'demo-lead-03', etapa: 'ganho', categoria_produto: 'Iluminador', quantidade_estimada: 1000, valor_estimado: null, briefing: {}, proxima_acao: 'Iniciar produção', proxima_acao_em: dia(7), updated_at: ago(6000) },
    { id: 'demo-op-6', lead_id: 'demo-lead-12', etapa: 'perdido', categoria_produto: 'Compacto', quantidade_estimada: 1000, valor_estimado: null, briefing: {}, proxima_acao: 'Reavaliar em 90 dias', proxima_acao_em: dia(90), updated_at: ago(8000) },
  ];

  const conteudos = [
    { id: 'demo-ct-1', tipo: 'reels', titulo: 'Bastidores: prensagem do pó compacto', roteiro: '1) Close na prensa. 2) Mão testando a textura. 3) Cartela de cores. (roteiro fictício)', legenda: 'Do pó à prensagem: o cuidado em cada compacto. (legenda fictícia)', publico: 'marca_indie', data_sugerida: dia(1), status: 'aguardando_aprovacao', auditoria: {}, agente_id: 'marketing', updated_at: ago(300) },
    { id: 'demo-ct-2', tipo: 'carrossel', titulo: '5 perguntas antes de lançar sua linha', roteiro: 'Slide 1: capa. Slides 2–6: perguntas. Slide 7: convite. (fictício)', legenda: 'Pronta para ter a sua marca? Comece por aqui. (legenda fictícia)', publico: 'influenciadora', data_sugerida: dia(2), status: 'aguardando_aprovacao', auditoria: {}, agente_id: 'marketing', updated_at: ago(300) },
    { id: 'demo-ct-3', tipo: 'post', titulo: 'O que é private label?', roteiro: 'Imagem com texto curto. (fictício)', legenda: 'Private label: nós produzimos, você assina. (legenda fictícia)', publico: 'marca_indie', data_sugerida: dia(3), status: 'aprovado', auditoria: {}, agente_id: 'marketing', updated_at: ago(200) },
    { id: 'demo-ct-4', tipo: 'anuncio', titulo: 'Anúncio: compactos com a sua marca', roteiro: 'Vídeo de 15s. (fictício)', legenda: 'Sua marca, nosso know-how. Peça um orçamento. (legenda fictícia)', publico: 'influenciadora', data_sugerida: dia(5), status: 'reprovado_auditoria', auditoria: { aprovado: false, motivo: 'Promete resultado de vendas (demonstração).' }, agente_id: 'marketing', updated_at: ago(200) },
    { id: 'demo-ct-5', tipo: 'story', titulo: 'Enquete: qual cor de blush?', roteiro: 'Enquete com 2 opções. (fictício)', legenda: 'Você escolhe! (legenda fictícia)', publico: 'influenciadora', data_sugerida: dia(-1), status: 'publicado', auditoria: {}, agente_id: 'marketing', updated_at: ago(1000) },
  ];
  const campanhas = [
    { id: 'demo-cp-1', nome: 'Demonstração: Compactos para criadoras', plataforma: 'meta', objetivo: 'Geração de contatos', publico: 'influenciadora', orcamento: 600, gasto: 215.4, status: 'ativa', criativos: [], resultados: {}, updated_at: ago(300) },
    { id: 'demo-cp-2', nome: 'Demonstração: Private label para marcas', plataforma: 'google', objetivo: 'Tráfego qualificado', publico: 'marca_indie', orcamento: 400, gasto: 0, status: 'proposta', criativos: [], resultados: {}, updated_at: ago(300) },
  ];
  const config = [
    { chave: 'kill_switch', valor: false }, { chave: 'limite_rascunhos_turno', valor: 20 }, { chave: 'limite_contatos_lead_dia', valor: 1 },
    { chave: 'cadencia_dias', valor: [0, 3, 8, 15] }, { chave: 'orcamento_ads_mes', valor: 1000 },
    { chave: 'publicos', valor: ['influenciadora', 'marca_indie', 'distribuidor'] },
  ];

  const DEMO = {
    ai_agentes: agentes, ai_turnos: turnos, ai_execucoes: execucoes, ai_eventos: eventos, ai_leads_qualificacao: qualif,
    ai_rascunhos: rascunhos, ai_interacoes: interacoes, ai_oportunidades: oportunidades, ai_conteudos: conteudos,
    ai_campanhas: campanhas, ai_config: config, ai_v_leads_alvo: leads, ai_fila: [], ai_bloqueios: [], ai_v_agentes_status: [],
    uid,
  };

  // ai_v_funil no formato real: linhas (grupo, chave, total), calculadas a partir dos dados fictícios.
  Object.defineProperty(DEMO, 'ai_v_funil', { enumerable: true, get() {
    const linhas = [];
    const add = (grupo, chave, total) => linhas.push({ grupo, chave, total });
    add('geral', 'alvos', leads.filter((l) => !l.bloqueado).length);
    add('geral', 'qualificados', qualif.length);
    add('geral', 'enviados', rascunhos.filter((r) => r.status === 'enviado').length);
    add('geral', 'respostas', interacoes.filter((i) => i.direcao === 'entrada').length);
    const cont = (arr, k) => arr.reduce((m, x) => (m[x[k]] = (m[x[k]] || 0) + 1, m), {});
    Object.entries(cont(rascunhos, 'status')).forEach(([k, v]) => add('rascunhos', k, v));
    Object.entries(cont(oportunidades, 'etapa')).forEach(([k, v]) => add('oportunidades', k, v));
    return linhas;
  } });

  // Simulação de atividade ao vivo: a cada chamada um agente muda de status e surge um evento.
  const ATIV = {
    orquestrador: [['Reavaliar prioridades da fila', 'Fila reordenada: 2 leads que responderam subiram para prioridade 1.']],
    qualificacao: [['Pontuando "Marca Demo Pétala"', 'Score 66 com 3 motivos e fontes.'], ['Pesquisando Instagram de "Duda Imaginária Make"', 'Score 58; sem sinais de linha própria.']],
    sdr: [['Escrevendo follow-up para "Bia Exemplo Makeup"', 'Rascunho criado e enviado ao auditor.'], ['Escrevendo 1º contato para "Carla Teste Beauty"', 'Rascunho criado (WhatsApp).']],
    auditor: [['Auditando rascunho de "Marca Demo Pétala"', 'Aprovado com 1 ressalva.']],
    atendimento: [['Montando briefing de "Perfumaria Fictícia Névoa"', 'Briefing montado: perfumaria, 3.000 peças.']],
    marketing: [['Escrevendo legenda do carrossel da semana', 'Legenda e roteiro enviados para aprovação.']],
    performance: [['Calculando KPIs do funil', 'KPIs atualizados: 14 alvos, 4 rascunhos aguardando.']],
  };
  DEMO.tick = function () {
    const ag = agentes[Math.floor(Math.random() * agentes.length)].id;
    const inst = ag === 'sdr' ? ['influenciadoras', 'marcas_indie', 'distribuidores'][Math.floor(Math.random() * 3)] : null;
    const atual = execucoes.find((e) => e.turno_id === T1 && e.agente_id === ag && (e.instancia || null) === inst);
    const par = ATIV[ag][Math.floor(Math.random() * ATIV[ag].length)];
    const agora = new Date().toISOString();
    let msg, tipo;
    if (atual && atual.status === 'trabalhando') {
      Object.assign(atual, { status: 'concluida', resultado: par[1], finalizado_em: agora });
      msg = `Concluí: ${par[1]}`; tipo = 'decisao';
    } else {
      const novo = { id: uid('exec'), turno_id: T1, agente_id: ag, instancia: inst, status: 'trabalhando', tarefa: par[0], resultado: null, iniciado_em: agora, finalizado_em: null, erro: null };
      execucoes.push(novo); msg = `Comecei: ${par[0]}`; tipo = 'acao';
    }
    eventos.unshift({ id: ++seq, created_at: agora, turno_id: T1, execucao_id: null, agente_id: ag, lead_id: null, tipo, mensagem: msg, dados: { simulado: true } });
    if (Math.random() < 0.25) eventos.unshift({ id: ++seq, created_at: agora, turno_id: T1, execucao_id: null, agente_id: ag, lead_id: null, tipo: 'handoff', mensagem: 'Passei o resultado para o próximo agente do fluxo.', dados: { simulado: true } });
  };
  window.DEMO = DEMO;
})();
