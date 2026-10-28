/* Garnet AI — painel. JS puro, sem build. Todo texto vindo do banco passa por esc() (template `html`). */
(function () {
  'use strict';
  const CFG = window.GARNET_CONFIG || {};
  const DEMO_MODE = new URLSearchParams(location.search).get('demo') === '1';

  // ---------- Escape seguro: o template `html` escapa tudo, exceto o que já é Safe ----------
  class Safe { constructor(s) { this.s = s; } toString() { return this.s; } }
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const str = (v) => (v instanceof Safe ? v.s : Array.isArray(v) ? v.map(str).join('') : v == null || v === false ? '' : esc(v));
  const html = (strs, ...vals) => new Safe(strs.reduce((o, s, i) => o + s + (i < vals.length ? str(vals[i]) : ''), ''));
  const $ = (s, r = document) => r.querySelector(s);

  // ---------- Ícones (SVG inline no estilo lucide) ----------
  const P = {
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', checksq: '<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    trending: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', power: '<path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/>',
    kanban: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 7v7M12 7v4M16 7v9"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>', pen: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
    workflow: '<rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/>',
    arrow: '<path d="m9 18 6-6-6-6"/>', info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  };
  const ic = (n) => new Safe(`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${P[n] || P.bot}</svg>`);

  // ---------- Constantes de domínio ----------
  const ROTULO_PUBLICO = { influenciadora: 'Influenciadora', marca_indie: 'Marca indie', distribuidor: 'Distribuidor' };
  const ETAPAS = [['conversa', 'Conversa'], ['briefing', 'Briefing'], ['amostra', 'Amostra'], ['proposta', 'Proposta'], ['negociacao', 'Negociação'], ['ganho', 'Ganho'], ['perdido', 'Perdido']];
  const INSTANCIAS = [['influenciadoras', 'Influenciadoras'], ['marcas_indie', 'Marcas indie'], ['distribuidores', 'Distribuidores']];
  const ST_EXEC = { trabalhando: ['Trabalhando', 'ouro'], na_fila: ['Na fila', 'info'], concluida: ['Concluído', 'ok'], falhou: ['Erro', 'err'], bloqueada: ['Bloqueado', 'warn'], ocioso: ['Ocioso', ''] };
  const TIPO_EV = { info: ['Info', 'info'], acao: ['Ação', 'ouro'], decisao: ['Decisão', 'viol'], handoff: ['Passagem', 'ok'], alerta: ['Alerta', 'warn'], erro: ['Erro', 'err'] };
  const NAV = [['equipe', 'Equipe', 'users'], ['aovivo', 'Ao vivo', 'activity'], ['aprovacoes', 'Aprovações', 'checksq'], ['leads', 'Leads', 'list'],
    ['registrar', 'Registrar resposta', 'message'], ['oportunidades', 'Oportunidades', 'kanban'], ['marketing', 'Marketing & Anúncios', 'megaphone'], ['turnos', 'Turnos', 'history']];
  const TIPO_TURNO = { manha: 'Manhã', tarde: 'Tarde', marketing: 'Marketing', performance: 'Performance', manual: 'Manual' };
  const ST_TURNO = { em_andamento: ['Em andamento', 'ouro'], concluido: ['Concluído', 'ok'], falhou: ['Falhou', 'err'], interrompido: ['Interrompido', 'warn'] };

  // ---------- Utilitários ----------
  function rel(ts) {
    if (!ts) return '—';
    const s = (Date.now() - new Date(ts).getTime()) / 1000;
    if (s < 45) return 'agora';
    if (s < 3600) return `há ${Math.max(1, Math.round(s / 60))} min`;
    if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
    const d = Math.floor(s / 86400);
    return d === 1 ? 'ontem' : `há ${d} dias`;
  }
  const dataHora = (ts) => (ts ? new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');
  const dataCurta = (d) => (d ? new Date(d + (String(d).length === 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—');
  const brl = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const agora = () => new Date().toISOString();
  const resumir = (t, n = 140) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
  const digitos = (v) => String(v || '').replace(/\D/g, '');
  function numWa(v) { let d = digitos(v); if (!d) return ''; if (d.length <= 11) d = '55' + d; return d; }
  function urlSegura(u, base) {
    u = String(u || '').trim(); if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (base) return base + u.replace(/^@/, '');
    return /^[\w-]+(\.[\w-]+)+/.test(u) ? 'https://' + u : '';
  }
  const lugar = (l) => [l.cidade, l.uf].filter(Boolean).join(' / ');

  // ---------- Estado ----------
  const S = { agentes: [], execs: [], eventos: [], turnos: [], leads: [], rascunhos: [], qualif: {}, interacoes: [], opps: [], conteudos: [], campanhas: [], config: {}, funil: [], contagens: {}, contatos: {} };
  const UI = { view: 'equipe', filtroAg: '', filtroTipo: '', filtroPublico: '', busca: '', edits: {}, regLead: null, regBusca: '', regCanal: 'whatsapp', regTexto: '', vistos: new Set(), primeira: true, sig: '' };
  let sb = null, usuario = null, realtimeOk = false, carregando = false, timerPoll = null;

  // ---------- Camada de dados (Supabase real ou memória do demo) ----------
  async function ler(t, o = {}) {
    if (DEMO_MODE) {
      let a = (window.DEMO[t] || []).slice();
      if (o.eq) a = a.filter((r) => Object.entries(o.eq).every(([k, v]) => r[k] === v));
      if (o.order) { const [c, asc] = o.order; a.sort((x, y) => (x[c] > y[c] ? 1 : x[c] < y[c] ? -1 : 0) * (asc ? 1 : -1)); }
      if (o.limit) a = a.slice(0, o.limit);
      return JSON.parse(JSON.stringify(a));
    }
    let q = sb.from(t).select(o.cols || '*');
    if (o.eq) Object.entries(o.eq).forEach(([k, v]) => { q = q.eq(k, v); });
    if (o.in) q = q.in(o.in[0], o.in[1]);
    if (o.order) q = q.order(o.order[0], { ascending: o.order[1] });
    if (o.limit) q = q.limit(o.limit);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }
  async function inserir(t, row) {
    if (DEMO_MODE) {
      const novo = Object.assign({ id: window.DEMO.uid('demo'), created_at: agora(), updated_at: agora() }, row);
      window.DEMO[t].push(novo); return JSON.parse(JSON.stringify(novo));
    }
    const { data, error } = await sb.from(t).insert(row).select().single();
    if (error) throw error;
    return data;
  }
  async function atualizar(t, id, patch, col = 'id') {
    if (DEMO_MODE) {
      const r = window.DEMO[t].find((x) => x[col] === id); if (r) Object.assign(r, patch, { updated_at: agora() }); return r;
    }
    const { data, error } = await sb.from(t).update(patch).eq(col, id).select();
    if (error) throw error;
    return data && data[0];
  }
  async function contatosDe(ids) {
    // Se a view não expõe o número/e-mail, busca em `leads` (somente leitura) pela sessão do usuário.
    const falta = ids.filter((id) => !(id in S.contatos));
    if (!falta.length) return false;
    falta.forEach((id) => { S.contatos[id] = null; });
    if (DEMO_MODE) return false;
    try {
      const rows = await ler('leads', { cols: 'id,email,whatsapp,telefone', in: ['id', falta] });
      rows.forEach((r) => { S.contatos[r.id] = r; });
      return rows.length > 0;
    } catch (e) { return false; }
  }
  function contato(l) {
    const c = S.contatos[l.id] || {};
    return { email: l.email || c.email || '', whatsapp: l.whatsapp || c.whatsapp || l.telefone || c.telefone || '' };
  }

  async function carregar() {
    if (carregando) return; carregando = true;
    const falhas = [];
    const t = async (p, pad) => { try { return await p; } catch (e) { falhas.push(e.message || String(e)); return pad; } };
    try {
      const [ag, ex, ev, tu, le, ra, qu, it, op, co, ca, cf, fu, vs] = await Promise.all([
        t(ler('ai_agentes', { order: ['ordem', true] }), []), t(ler('ai_execucoes', { order: ['iniciado_em', false], limit: 400 }), []),
        t(ler('ai_eventos', { order: ['created_at', false], limit: 300 }), []), t(ler('ai_turnos', { order: ['iniciado_em', false], limit: 40 }), []),
        t(ler('ai_v_leads_alvo', { limit: 1500 }), []), t(ler('ai_rascunhos', { order: ['updated_at', false], limit: 400 }), []),
        t(ler('ai_leads_qualificacao', { limit: 1500 }), []), t(ler('ai_interacoes', { order: ['created_at', false], limit: 600 }), []),
        t(ler('ai_oportunidades', { order: ['updated_at', false], limit: 300 }), []), t(ler('ai_conteudos', { order: ['data_sugerida', true], limit: 200 }), []),
        t(ler('ai_campanhas', { order: ['updated_at', false], limit: 100 }), []), t(ler('ai_config'), []),
        t(ler('ai_v_funil'), []), t(ler('ai_v_agentes_status'), []),
      ]);
      S.agentes = ag.filter((a) => a.ativo !== false); S.execs = ex; S.eventos = ev; S.turnos = tu; S.leads = le; S.rascunhos = ra;
      S.qualif = Object.fromEntries(qu.map((q) => [q.lead_id, q])); S.interacoes = it; S.opps = op; S.conteudos = co; S.campanhas = ca;
      S.config = Object.fromEntries(cf.map((c) => [c.chave, c.valor])); S.funil = fu;
      S.contagens = Object.fromEntries(vs.map((v) => [v.agente_id || v.id, v.execucoes_hoje ?? v.execucoes_dia ?? v.total_hoje ?? null]));
      if (falhas.length && UI.primeira) toast('Algumas consultas falharam: ' + resumir(falhas[0], 90), true);
    } finally { carregando = false; UI.primeira = false; }
  }

  // ---------- Derivados ----------
  const lead = (id) => S.leads.find((l) => l.id === id);
  const nomeLead = (id) => (lead(id) || {}).nome || 'Lead';
  const agente = (id) => S.agentes.find((a) => a.id === id) || { id, nome: id || 'Sistema', cor: '#8a6d3b', icone: 'bot', papel: '' };
  function itensAgente(a) {
    const mais = (arr) => arr.slice().sort((x, y) => new Date(y.iniciado_em) - new Date(x.iniciado_em));
    const doAg = mais(S.execs.filter((e) => e.agente_id === a.id));
    const cria = (lista, inst, rotulo) => {
      const ultima = lista[0] || null;
      const ult = lista.find((e) => e.resultado && ['concluida', 'falhou'].includes(e.status)) || null;
      let st = 'ocioso';
      if (ultima) {
        const idade = (Date.now() - new Date(ultima.finalizado_em || ultima.iniciado_em)) / 60000;
        if (['trabalhando', 'na_fila', 'bloqueada'].includes(ultima.status)) st = ultima.status;
        else if (ultima.status === 'concluida' && idade < 60) st = 'concluida';
        else if (ultima.status === 'falhou' && idade < 1440) st = 'falhou';
      }
      return { inst, rotulo, ultima, ult, st };
    };
    if (a.id === 'sdr') return INSTANCIAS.map(([k, r]) => cria(doAg.filter((e) => e.instancia === k), k, r));
    return [cria(doAg, null, null)];
  }
  const statusAgente = (a) => { const it = itensAgente(a).map((i) => i.st); return ['trabalhando', 'falhou', 'bloqueada', 'na_fila', 'concluida'].find((s) => it.includes(s)) || 'ocioso'; };
  const aguardando = () => S.rascunhos.filter((r) => r.status === 'aguardando_aprovacao');

  function kpis() {
    const g = (grupo, chave) => { const l = S.funil.find((r) => r.grupo === grupo && r.chave === chave); return l ? Number(l.total) : null; };
    const somaOp = S.funil.filter((r) => r.grupo === 'oportunidades' && !['ganho', 'perdido'].includes(r.chave)).reduce((s, r) => s + Number(r.total), 0);
    return [
      ['Alvos', g('geral', 'alvos') ?? S.leads.length], ['Aguardando aprovação', g('rascunhos', 'aguardando_aprovacao') ?? aguardando().length],
      ['Enviados', g('geral', 'enviados') ?? S.rascunhos.filter((r) => r.status === 'enviado').length],
      ['Respostas', g('geral', 'respostas') ?? S.interacoes.filter((i) => i.direcao === 'entrada').length],
      ['Oportunidades', S.funil.length ? somaOp : S.opps.filter((o) => !['ganho', 'perdido'].includes(o.etapa)).length],
    ];
  }

  // ---------- Peças visuais ----------
  const badgeExec = (st) => { const [r, c] = ST_EXEC[st] || ST_EXEC.ocioso; return html`<span class="badge ${c}"><span class="dot ${st}"></span>${r}</span>`; };
  const icoAg = (a) => html`<span class="ag-ico" style="--c:${a.cor}">${ic(a.icone)}</span>`;
  const cabeca = (titulo, destaque, sub, extra) => html`<div class="cabeca"><div><h1>${titulo} <em>${destaque}</em></h1>${sub ? html`<p>${sub}</p>` : ''}</div>${extra || ''}</div>`;
  const vazio = (t) => html`<div class="vazio">${t}</div>`;

  // ---------- Views ----------
  function viewEquipe() {
    const turno = S.turnos.find((t) => t.status === 'em_andamento');
    const ultimo = S.turnos[0];
    const kill = S.config.kill_switch === true;
    const ag = (id) => S.agentes.find((a) => a.id === id) || agente(id);
    const no = (id, rot) => { const a = ag(id); const w = statusAgente(a) === 'trabalhando'; return html`<span class="no ${w ? 'trabalhando' : ''}" style="--c:${a.cor}"><i></i>${rot || a.nome.split(' ')[0]}</span>`; };
    const seta = html`<span class="seta">${ic('arrow')}</span>`;
    const n = aguardando().length;
    return html`${cabeca('Sua equipe de', 'agentes', 'Quem está trabalhando agora, o que cada um está fazendo e o que já entregou.')}
    <div class="topo">
      <section class="card"><div class="rotulo">Turno atual</div>
        ${turno ? html`<div class="turno-titulo"><span class="dot trabalhando"></span>Turno ${TIPO_TURNO[turno.tipo] || turno.tipo} em andamento</div><p class="muted peq">Iniciado ${rel(turno.iniciado_em)} (${dataHora(turno.iniciado_em)})</p>`
        : html`<div class="turno-titulo">Nenhum turno em andamento</div>${ultimo ? html`<p class="muted peq">Último: ${TIPO_TURNO[ultimo.tipo] || ultimo.tipo}, ${(ST_TURNO[ultimo.status] || [ultimo.status])[0].toLowerCase()} ${rel(ultimo.finalizado_em || ultimo.iniciado_em)}.</p>` : ''}`}
      </section>
      <section class="card kill ${kill ? 'ligado' : ''}"><div><div class="rotulo">Kill switch</div>
        <div class="turno-titulo">${ic('power')}${kill ? 'Ligado: os agentes estão parados' : 'Desligado: agentes liberados'}</div></div>
        <button class="btn ${kill ? 'primario' : 'perigo'}" data-act="kill">${kill ? 'Desligar kill switch' : 'Ligar kill switch'}</button></section>
    </div>
    <div class="kpis">${kpis().map(([r, v]) => html`<div class="card kpi"><b>${v}</b><span>${r}</span></div>`)}</div>
    <section class="secao"><h2>Fluxo <em>entre agentes</em></h2><div class="card fluxo">
      <div class="fluxo-linha">${no('orquestrador')}${seta}${no('qualificacao', 'Qualificação')}${seta}${no('sdr')}${seta}${no('auditor')}${seta}
        <span class="no voce"><i></i>Você ${n ? html`<span class="cont">${n}</span>` : ''}</span>${seta}${no('atendimento')}</div>
      <div class="fluxo-lat"><span class="rotulo">Laterais</span>${no('marketing')}${no('performance')}</div></div></section>
    <section class="secao"><h2>Agentes</h2><div class="agentes">${S.agentes.map(cartaoAgente)}</div></section>`;
  }
  function cartaoAgente(a) {
    const itens = itensAgente(a), st = statusAgente(a), sdr = a.id === 'sdr';
    const res = (it) => it.ult ? html`<button class="ag-res" data-act="resultado" data-id="${it.ult.id}">${it.ult.status === 'falhou' ? 'Erro: ' : ''}${it.ult.resultado || it.ult.erro}</button><div class="hora">${rel(it.ult.finalizado_em || it.ult.iniciado_em)}</div>` : html`<span class="muted peq">Ainda sem resultado.</span>`;
    const fazendo = (it) => ['trabalhando', 'na_fila'].includes(it.st) ? it.ultima.tarefa : it.st === 'bloqueada' ? 'Bloqueado: ' + (it.ultima.erro || it.ultima.tarefa) : 'Aguardando próxima tarefa';
    const it0 = itens[0];
    return html`<article class="card ag ${st}" style="--c:${a.cor}">
      <div class="ag-cab">${icoAg(a)}<div><h3>${a.nome}</h3><small>${a.papel}</small></div><span class="ag-status">${badgeExec(st)}</span></div>
      ${sdr ? html`<div class="inst">${itens.map((it) => html`<div><div class="l1"><span class="dot ${it.st}"></span>${it.rotulo}<span class="hora" style="margin-left:auto">${ST_EXEC[it.st][0]}</span></div>
          <div class="peq">${fazendo(it)}</div>${res(it)}</div>`)}</div>`
      : html`<div class="ag-bloco"><div class="rotulo">Fazendo agora</div><div>${fazendo(it0)}</div>${it0.ultima ? html`<div class="hora">desde ${rel(it0.ultima.iniciado_em)}</div>` : ''}</div>
        <div class="ag-bloco"><div class="rotulo">Último resultado</div>${res(it0)}</div>`}
      ${S.contagens[a.id] != null ? html`<div class="hora">${S.contagens[a.id]} execuções hoje</div>` : ''}
    </article>`;
  }

  function viewAoVivo() {
    let ev = S.eventos;
    if (UI.filtroAg) ev = ev.filter((e) => e.agente_id === UI.filtroAg);
    if (UI.filtroTipo) ev = ev.filter((e) => e.tipo === UI.filtroTipo);
    return html`${cabeca('Atividade', 'ao vivo', 'Tudo o que os agentes fazem, em ordem cronológica.')}
    <div class="filtros"><select id="f-ag" data-filtro="filtroAg" aria-label="Filtrar por agente"><option value="">Todos os agentes</option>${S.agentes.map((a) => html`<option value="${a.id}" ${UI.filtroAg === a.id ? 'selected' : ''}>${a.nome}</option>`)}</select>
    <select id="f-tipo" data-filtro="filtroTipo" aria-label="Filtrar por tipo"><option value="">Todos os tipos</option>${Object.entries(TIPO_EV).map(([k, v]) => html`<option value="${k}" ${UI.filtroTipo === k ? 'selected' : ''}>${v[0]}</option>`)}</select></div>
    <div class="feed">${ev.length ? ev.slice(0, 120).map((e) => { const a = agente(e.agente_id), t = TIPO_EV[e.tipo] || [e.tipo, '']; const novo = !UI.vistos.has(e.id);
      return html`<button class="ev ${novo && UI.vistos.size ? 'novo' : ''}" style="--c:${a.cor}" data-act="evento" data-id="${e.id}">${icoAg(a)}<div class="ev-corpo"><div class="ev-meta"><b style="color:var(--ink)">${a.nome}</b><span class="badge ${t[1]}">${t[0]}</span><span>${rel(e.created_at)}</span>${e.lead_id ? html`<span>· ${nomeLead(e.lead_id)}</span>` : ''}</div>${e.mensagem}</div></button>`; }) : vazio('Nenhum evento para esses filtros.')}</div>`;
  }
  function modalEvento(id) {
    const e = S.eventos.find((x) => String(x.id) === String(id)); if (!e) return;
    const a = agente(e.agente_id), t = TIPO_EV[e.tipo] || [e.tipo, ''];
    abrirModal(a.nome, html`<p><span class="badge ${t[1]}">${t[0]}</span> <span class="muted peq">${dataHora(e.created_at)} · ${rel(e.created_at)}</span></p><p>${e.mensagem}</p>
      ${e.lead_id ? html`<p><button class="btn mini" data-act="ficha" data-id="${e.lead_id}">Ver lead: ${nomeLead(e.lead_id)}</button></p>` : ''}
      <div class="rotulo">Dados</div><pre>${JSON.stringify(e.dados || {}, null, 2)}</pre>`);
  }
  function modalResultado(id) {
    const e = S.execs.find((x) => x.id === id); if (!e) return; const a = agente(e.agente_id);
    abrirModal(a.nome + (e.instancia ? ' · ' + e.instancia : ''), html`<p class="muted peq">${ST_EXEC[e.status][0]} · ${dataHora(e.iniciado_em)}${e.finalizado_em ? ' → ' + dataHora(e.finalizado_em) : ''}</p>
      <div class="rotulo">Tarefa</div><p>${e.tarefa}</p><div class="rotulo">Resultado</div><p style="white-space:pre-wrap">${e.resultado || '—'}</p>${e.erro ? html`<div class="rotulo">Erro</div><p style="color:var(--err)">${e.erro}</p>` : ''}`);
  }

  // Aprovações
  function cartaoRascunho(r) {
    const l = lead(r.lead_id) || { nome: 'Lead' }, c = contato(l), aud = r.auditoria || {}, aprov = r.status === 'aprovado';
    const texto = r.texto_final || r.texto;
    const email = r.canal === 'email' || c.email;
    const wa = numWa(c.whatsapp);
    return html`<article class="card rasc">
      <div class="rasc-cab"><div><h3>${l.nome}</h3><div class="meta" style="margin-top:6px">
        ${l.publico ? html`<span class="badge ouro">${ROTULO_PUBLICO[l.publico] || l.publico}</span>` : ''}${lugar(l) ? html`<span class="badge">${lugar(l)}</span>` : ''}
        <span class="badge ${l.prioridade === 1 ? 'ok' : ''}">Prioridade ${l.prioridade ?? '—'}</span>
        <span class="badge ${c.whatsapp ? 'ok' : ''}">WhatsApp ${c.whatsapp ? 'sim' : 'não'}</span><span class="badge ${c.email ? 'ok' : ''}">E-mail ${c.email ? 'sim' : 'não'}</span></div></div>
        <div class="meta"><span class="badge info">${r.canal}</span><span class="badge">Passo ${r.passo_cadencia}</span><button class="btn mini" data-act="ficha" data-id="${r.lead_id}">Ficha</button></div></div>
      ${r.justificativa ? html`<div class="just"><span class="rotulo">Por que o SDR escreveu isso</span><br>${r.justificativa}</div>` : ''}
      <div class="checks"><span class="rotulo">Checagens do auditor ${aud.aprovado === false ? html`<span class="badge err">reprovado</span>` : html`<span class="badge ok">aprovado</span>`}</span>
        ${(aud.checagens || []).map((k) => html`<div class="${k.ok ? 'ok' : 'nao'}">${ic(k.ok ? 'check' : 'x')}<span><b>${k.regra}</b>${k.nota ? ' · ' + k.nota : ''}</span></div>`)}</div>
      ${aprov ? html`${r.canal === 'email' && r.assunto ? html`<div><span class="rotulo">Assunto</span><div>${r.assunto}</div></div>` : ''}<div><span class="rotulo">Texto aprovado</span><div class="texto-final">${texto}</div></div>
        <div class="linha">
          ${wa ? html`<a class="btn primario" target="_blank" rel="noopener noreferrer" href="https://wa.me/${wa}?text=${encodeURIComponent(texto)}">${ic('message')}Abrir WhatsApp</a>` : html`<button class="btn" disabled title="Sem WhatsApp cadastrado">${ic('message')}Abrir WhatsApp</button>`}
          ${c.email ? html`<a class="btn" href="mailto:${encodeURIComponent(c.email).replace(/%40/g, '@')}?subject=${encodeURIComponent(r.assunto || 'Garnet Cosméticos')}&body=${encodeURIComponent(texto)}">${ic('mail')}Abrir e-mail</a>` : html`<button class="btn" disabled title="Sem e-mail cadastrado">${ic('mail')}Abrir e-mail</button>`}
          <button class="btn" data-act="enviado" data-id="${r.id}">${ic('send')}Marcar como enviado</button></div>`
      : html`${email && r.canal === 'email' ? html`<div class="campo"><label for="as-${r.id}">Assunto</label><input type="text" id="as-${r.id}" data-edit-assunto="${r.id}" value="${UI.edits['a' + r.id] ?? r.assunto ?? ''}"></div>` : ''}
        <div class="campo"><label for="tx-${r.id}">Texto (editável)</label><textarea id="tx-${r.id}" data-edit="${r.id}">${UI.edits[r.id] ?? texto}</textarea></div>
        <div class="linha"><button class="btn primario" data-act="aprovar" data-id="${r.id}">${ic('check')}Aprovar</button><button class="btn perigo" data-act="rejeitar" data-id="${r.id}">${ic('x')}Rejeitar</button></div>`}
    </article>`;
  }
  function viewAprovacoes() {
    const ag = aguardando(), ap = S.rascunhos.filter((r) => r.status === 'aprovado');
    return html`${cabeca('Aprovações', '', 'Nada é enviado sem a sua aprovação. Revise, edite se quiser e envie por WhatsApp ou e-mail.')}
    <section><h2>Aguardando <em>você</em> (${ag.length})</h2><div class="cols2" style="margin-top:14px">${ag.length ? ag.map(cartaoRascunho) : vazio('Nenhum rascunho aguardando aprovação.')}</div></section>
    <section class="secao"><h2>Aprovados, prontos para <em>enviar</em> (${ap.length})</h2><div class="cols2" style="margin-top:14px">${ap.length ? ap.map(cartaoRascunho) : vazio('Nenhum aprovado pendente de envio.')}</div></section>`;
  }

  // Leads
  const scoreLead = (l) => l.score_ai ?? l.score_base ?? 0;
  function listaLeads() {
    let ls = S.leads.slice();
    if (UI.filtroPublico) ls = ls.filter((l) => l.publico === UI.filtroPublico);
    if (UI.busca) ls = ls.filter((l) => (l.nome || '').toLowerCase().includes(UI.busca.toLowerCase()));
    ls.sort((a, b) => (a.prioridade ?? 9) - (b.prioridade ?? 9) || scoreLead(b) - scoreLead(a));
    return ls;
  }
  function viewLeads() {
    const ls = listaLeads();
    return html`${cabeca('Leads', 'alvo', 'Ordenados por prioridade e score. Quem respondeu aparece primeiro.')}
    <div class="filtros"><input type="search" id="f-busca" data-filtro="busca" placeholder="Buscar por nome" value="${UI.busca}" aria-label="Buscar por nome">
      <select id="f-pub" data-filtro="filtroPublico" aria-label="Filtrar por público"><option value="">Todos os públicos</option>${Object.entries(ROTULO_PUBLICO).map(([k, v]) => html`<option value="${k}" ${UI.filtroPublico === k ? 'selected' : ''}>${v}</option>`)}</select></div>
    <div class="lead-lista"><div class="lead-row lead-head"><span>Nome</span><span>Público</span><span>Cidade</span><span>Score</span><span>Status</span><span>Último contato</span></div>
    ${ls.length ? ls.slice(0, 250).map((l) => html`<button class="lead-row" data-act="ficha" data-id="${l.id}">
      <span><b>${l.nome}</b> ${l.prioridade === 1 ? html`<span class="badge ok">Respondeu</span>` : ''}${l.bloqueado ? html` <span class="badge err">Bloqueado</span>` : ''}</span>
      <span class="peq">${ROTULO_PUBLICO[l.publico] || l.publico || '—'}</span><span class="peq c-extra">${lugar(l) || '—'}</span>
      <span class="score">${scoreLead(l) || '—'}</span><span class="peq">${l.status_busca || '—'}</span><span class="peq">${l.ultimo_contato_ai ? rel(l.ultimo_contato_ai) : '—'}</span></button>`) : vazio('Nenhum lead encontrado.')}</div>`;
  }
  async function fichaLead(id) {
    const l = lead(id); if (!l) return;
    contatosDe([id]);
    const q = S.qualif[id], c = contato(l);
    const its = S.interacoes.filter((i) => i.lead_id === id), rs = S.rascunhos.filter((r) => r.lead_id === id);
    const link = (u, base) => { const s = urlSegura(u, base); return s ? html`<a class="btn mini" target="_blank" rel="noopener noreferrer" href="${s}">${ic('ext')}${resumir(u, 30)}</a>` : ''; };
    abrirModal(l.nome, html`<div class="meta"><span class="badge ouro">${ROTULO_PUBLICO[l.publico] || l.publico}</span>${lugar(l) ? html`<span class="badge">${lugar(l)}</span>` : ''}
        ${l.prioridade === 1 ? html`<span class="badge ok">Respondeu</span>` : ''}${l.bloqueado ? html`<span class="badge err">Bloqueado</span>` : ''}<span class="badge">Busca: ${l.status_busca || '—'}</span>${l.seguidores ? html`<span class="badge">${Number(l.seguidores).toLocaleString('pt-BR')} seguidores</span>` : ''}</div>
      <div class="linha" style="margin-top:10px">${link(l.site)}${link(l.instagram, 'https://instagram.com/')}${link(l.tiktok, 'https://tiktok.com/@')}</div>
      <p class="peq muted" style="margin-top:8px">WhatsApp: ${c.whatsapp || '—'} · E-mail: ${c.email || '—'}</p>
      <div class="sec-ficha"><h3>Qualificação ${q ? html`<span class="score">${q.score}/100</span>` : ''}</h3>${q ? html`<p>${q.resumo}</p><div class="lista-simples">${(q.motivos || []).map((m) => html`<div class="item"><b>${m.criterio}</b> (+${m.pontos})<br>${m.evidencia}<br><span class="muted peq">Fonte: ${m.fonte}</span></div>`)}</div>` : html`<p class="muted">Ainda não qualificado (score base ${l.score_base ?? '—'}).</p>`}</div>
      <div class="sec-ficha"><h3>Interações (${its.length})</h3><div class="lista-simples">${its.length ? its.map((i) => html`<div class="item"><span class="badge ${i.direcao === 'entrada' ? 'ok' : ''}">${i.direcao === 'entrada' ? 'Recebida' : 'Enviada'}</span> <span class="muted peq">${i.canal} · ${dataHora(i.created_at)}${i.intencao ? ' · ' + i.intencao : ''}</span><br>${i.conteudo || i.resumo}</div>`) : html`<span class="muted">Nenhuma interação registrada pela Garnet AI.</span>`}${l.ultima_interacao_resumo ? html`<div class="item muted">Busca Leads: ${l.ultima_interacao_resumo}</div>` : ''}</div></div>
      <div class="sec-ficha"><h3>Rascunhos (${rs.length})</h3><div class="lista-simples">${rs.length ? rs.map((r) => html`<div class="item"><span class="badge info">${r.canal}</span> <span class="badge">${r.status.replace(/_/g, ' ')}</span> <span class="muted peq">passo ${r.passo_cadencia}</span><br>${resumir(r.texto_final || r.texto, 200)}</div>`) : html`<span class="muted">Nenhum rascunho.</span>`}</div></div>
      <div class="linha" style="margin-top:18px"><button class="btn" data-act="reg-para" data-id="${id}">${ic('message')}Registrar resposta</button></div>`);
  }

  // Registrar resposta
  function viewRegistrar() {
    const sel = lead(UI.regLead);
    const achados = UI.regBusca ? S.leads.filter((l) => (l.nome || '').toLowerCase().includes(UI.regBusca.toLowerCase())).slice(0, 8) : [];
    return html`${cabeca('Registrar', 'resposta', 'Cole a resposta que o lead enviou. O Atendimento classifica e sugere a próxima ação.')}
    <form class="card" id="form-reg" style="max-width:720px" autocomplete="off">
      <div class="campo"><label for="reg-busca">Lead</label>
        ${sel ? html`<div class="sel-lead"><b>${sel.nome}</b><span class="muted peq">${ROTULO_PUBLICO[sel.publico] || ''} ${lugar(sel)}</span><button type="button" class="btn mini" data-act="reg-limpar">Trocar</button></div>`
        : html`<input type="search" id="reg-busca" value="${UI.regBusca}" placeholder="Digite o nome do lead">
          <div class="escolhas">${achados.map((l) => html`<button type="button" class="escolha" data-act="reg-escolher" data-id="${l.id}"><b>${l.nome}</b><span class="muted peq">${lugar(l)}</span></button>`)}</div>`}</div>
      <div class="campo"><label for="reg-canal">Canal</label><select id="reg-canal"><option value="whatsapp" ${UI.regCanal === 'whatsapp' ? 'selected' : ''}>WhatsApp</option><option value="email" ${UI.regCanal === 'email' ? 'selected' : ''}>E-mail</option><option value="instagram" ${UI.regCanal === 'instagram' ? 'selected' : ''}>Instagram</option></select></div>
      <div class="campo"><label for="reg-texto">Resposta recebida</label><textarea id="reg-texto" placeholder="Cole aqui a resposta do lead">${UI.regTexto}</textarea></div>
      <div class="linha"><button type="submit" class="btn primario" ${sel ? '' : 'disabled'}>${ic('check')}Registrar resposta</button>
        <button type="button" class="btn perigo" data-act="reg-optout" ${sel ? '' : 'disabled'}>${ic('ban')}Bloquear contato (opt-out)</button></div>
    </form>`;
  }

  // Oportunidades
  function viewOportunidades() {
    return html`${cabeca('Oportunidades', '', 'Do primeiro retorno ao pedido fechado.')}
    <div class="kanban">${ETAPAS.map(([k, r]) => { const os = S.opps.filter((o) => o.etapa === k);
      return html`<section class="col"><h3>${r}<span class="badge">${os.length}</span></h3>${os.map((o) => html`<article class="card op"><b>${nomeLead(o.lead_id)}</b>
        <span class="muted">${o.categoria_produto || 'Categoria a definir'}${o.quantidade_estimada ? ' · ' + Number(o.quantidade_estimada).toLocaleString('pt-BR') + ' pç' : ''}</span>
        <span>${o.proxima_acao || 'Sem próxima ação'}${o.proxima_acao_em ? html` <span class="badge ouro">${dataCurta(o.proxima_acao_em)}</span>` : ''}</span>
        <select data-etapa="${o.id}" aria-label="Mudar etapa">${ETAPAS.map(([e, er]) => html`<option value="${e}" ${e === o.etapa ? 'selected' : ''}>${er}</option>`)}</select></article>`)}</section>`; })}</div>`;
  }

  // Marketing
  const ST_CONT = { rascunho: ['Rascunho', ''], aguardando_aprovacao: ['Aguardando você', 'ouro'], aprovado: ['Aprovado', 'ok'], publicado: ['Publicado', 'info'], rejeitado: ['Rejeitado', 'err'], reprovado_auditoria: ['Reprovado pelo auditor', 'err'] };
  function viewMarketing() {
    const orc = Number(S.config.orcamento_ads_mes ?? 1000), gasto = S.campanhas.reduce((s, c) => s + Number(c.gasto || 0), 0), pct = orc ? Math.min(100, gasto / orc * 100) : 0;
    const cs = S.conteudos.slice().sort((a, b) => String(a.data_sugerida).localeCompare(String(b.data_sugerida)));
    return html`${cabeca('Marketing &', 'anúncios', 'Conteúdos por data sugerida e campanhas dentro do orçamento do mês.')}
    <section class="card"><div class="linha" style="justify-content:space-between"><div><div class="rotulo">Orçamento de anúncios do mês</div><b style="font-size:24px;font-weight:300">${brl(gasto)}</b> <span class="muted">de ${brl(orc)}</span></div><span class="badge ${gasto > orc ? 'err' : 'ouro'}">${pct.toFixed(0)}% usado</span></div>
      <div class="barra ${gasto > orc ? 'estourou' : ''}" style="margin-top:10px" role="progressbar" aria-valuenow="${pct.toFixed(0)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div></section>
    <section class="secao"><h2>Campanhas</h2><div class="cols2">${S.campanhas.length ? S.campanhas.map((c) => { const p = c.orcamento ? Math.min(100, Number(c.gasto || 0) / Number(c.orcamento) * 100) : 0;
      return html`<article class="card" style="display:grid;gap:10px"><div class="rasc-cab"><h3>${c.nome}</h3><span class="badge ${c.status === 'ativa' ? 'ok' : c.status === 'proposta' ? 'ouro' : ''}">${c.status}</span></div>
        <div class="meta"><span class="badge info">${c.plataforma}</span>${c.publico ? html`<span class="badge">${ROTULO_PUBLICO[c.publico] || c.publico}</span>` : ''}</div><p class="muted peq" style="margin:0">${c.objetivo}</p>
        <div class="barra"><span style="width:${p}%"></span></div><span class="peq">${brl(c.gasto)} gastos de ${brl(c.orcamento)}</span>
        ${c.status === 'proposta' ? html`<div class="linha"><button class="btn primario mini" data-act="camp-aprovar" data-id="${c.id}">Aprovar campanha</button></div>` : ''}</article>`; }) : vazio('Nenhuma campanha.')}</div></section>
    <section class="secao"><h2>Conteúdos</h2><div class="cols2">${cs.length ? cs.map((c) => { const st = ST_CONT[c.status] || [c.status, ''];
      return html`<article class="card" style="display:grid;gap:10px"><div class="rasc-cab"><div><span class="rotulo">${dataCurta(c.data_sugerida)} · ${c.tipo}</span><h3>${c.titulo}</h3></div><span class="badge ${st[1]}">${st[0]}</span></div>
        ${c.publico ? html`<div class="meta"><span class="badge">${ROTULO_PUBLICO[c.publico] || c.publico}</span></div>` : ''}
        ${c.roteiro ? html`<details><summary>Ver roteiro</summary><div class="leg" style="margin-top:8px">${c.roteiro}</div></details>` : ''}
        ${c.legenda ? html`<div class="leg">${c.legenda}</div>` : ''}
        ${c.auditoria && c.auditoria.motivo ? html`<p class="peq" style="color:var(--err);margin:0">Auditor: ${c.auditoria.motivo}</p>` : ''}
        <div class="linha">${['rascunho', 'aguardando_aprovacao'].includes(c.status) ? html`<button class="btn primario mini" data-act="cont-aprovar" data-id="${c.id}">Aprovar</button><button class="btn perigo mini" data-act="cont-rejeitar" data-id="${c.id}">Rejeitar</button>` : ''}
        ${c.legenda ? html`<button class="btn mini" data-act="copiar" data-id="${c.id}">${ic('copy')}Copiar legenda</button>` : ''}</div></article>`; }) : vazio('Nenhum conteúdo.')}</div></section>`;
  }

  // Turnos
  function viewTurnos() {
    return html`${cabeca('Histórico de', 'turnos', 'O que cada turno fez, agente por agente.')}
    <div class="lista-simples">${S.turnos.length ? S.turnos.map((t) => { const es = S.execs.filter((e) => e.turno_id === t.id).sort((a, b) => new Date(a.iniciado_em) - new Date(b.iniciado_em)); const st = ST_TURNO[t.status] || [t.status, ''];
      const dur = t.finalizado_em ? Math.round((new Date(t.finalizado_em) - new Date(t.iniciado_em)) / 60000) + ' min' : 'em curso';
      return html`<details class="card turno" ${t.status === 'em_andamento' ? 'open' : ''}><summary><b>${TIPO_TURNO[t.tipo] || t.tipo}</b><span class="badge ${st[1]}">${st[0]}</span><span class="muted peq">${dataHora(t.iniciado_em)} · ${dur}</span></summary>
        ${t.resumo ? html`<p style="margin-top:12px">${t.resumo}</p>` : ''}
        ${t.metricas && Object.keys(t.metricas).length ? html`<div class="meta">${Object.entries(t.metricas).map(([k, v]) => html`<span class="badge">${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}</span>`)}</div>` : ''}
        <div class="execs">${es.length ? es.map((e) => { const a = agente(e.agente_id); return html`<div class="exec" style="border-left:3px solid ${a.cor}"><div class="linha"><b>${a.nome}${e.instancia ? ' · ' + e.instancia : ''}</b>${badgeExec(e.status)}</div><span>${e.tarefa}</span>${e.resultado ? html`<span class="muted">${e.resultado}</span>` : ''}${e.erro ? html`<span style="color:var(--err)">${e.erro}</span>` : ''}</div>`; }) : html`<span class="muted peq">Sem execuções registradas.</span>`}</div></details>`; }) : vazio('Nenhum turno ainda.')}</div>`;
  }

  const VIEWS = { equipe: viewEquipe, aovivo: viewAoVivo, aprovacoes: viewAprovacoes, leads: viewLeads, registrar: viewRegistrar, oportunidades: viewOportunidades, marketing: viewMarketing, turnos: viewTurnos };

  // ---------- Renderização ----------
  function renderNav() {
    const n = aguardando().length;
    $('#nav').innerHTML = NAV.map(([k, r, i]) => html`<button data-act="nav" data-id="${k}" ${k === UI.view ? 'aria-current="page"' : ''}>${ic(i)}${r}${k === 'aprovacoes' && n ? html`<span class="cont">${n}</span>` : ''}</button>`).map(str).join('');
  }
  function render(forcar) {
    renderNav();
    const main = $('#main'), ae = document.activeElement;
    const editando = ae && main.contains(ae) && ae.matches('textarea, input[data-edit-assunto]');
    if (!forcar && (editando || UI.view === 'registrar')) return;
    const id = ae && main.contains(ae) ? ae.id : null, pos = id && ae.selectionStart != null ? ae.selectionStart : null;
    const y = window.scrollY;
    main.innerHTML = VIEWS[UI.view]().s;
    if (forcar === 'nav') window.scrollTo(0, 0); else window.scrollTo(0, y);
    if (id) { const el = document.getElementById(id); if (el) { el.focus(); if (pos != null && el.setSelectionRange) try { el.setSelectionRange(pos, pos); } catch (e) { /* tipo sem seleção */ } } }
    S.eventos.forEach((e) => UI.vistos.add(e.id));
    if (UI.view === 'aprovacoes') {
      const ids = S.rascunhos.filter((r) => r.status === 'aprovado').map((r) => r.lead_id);
      contatosDe(ids).then((m) => { if (m && UI.view === 'aprovacoes') render(); });
    }
  }

  // ---------- Modal, toast, confirmação ----------
  let focoAnterior = null;
  function abrirModal(titulo, corpo) {
    focoAnterior = document.activeElement;
    const m = $('#modal');
    m.innerHTML = html`<div class="modal-caixa" role="dialog" aria-modal="true" aria-label="${titulo}"><div class="modal-cab"><h2>${titulo}</h2><button class="btn mini" data-act="fechar" aria-label="Fechar">${ic('x')}</button></div>${corpo}</div>`.s;
    m.hidden = false; const b = m.querySelector('button'); if (b) b.focus();
  }
  function fecharModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; if (focoAnterior && focoAnterior.focus) try { focoAnterior.focus(); } catch (e) { /* elemento removido */ } }
  function toast(msg, erro) {
    const t = document.createElement('div'); t.className = 'toast' + (erro ? ' erro' : ''); t.textContent = msg; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 4500);
  }
  function pedir({ titulo, texto, campo, rotulo, ok = 'Confirmar', perigo }) {
    return new Promise((res) => {
      abrirModal(titulo, html`<form id="form-pedir"><p>${texto}</p>${campo ? html`<div class="campo"><label for="pedir-campo">${rotulo}</label><textarea id="pedir-campo" required></textarea></div>` : ''}
        <div class="linha"><button type="submit" class="btn ${perigo ? 'perigo' : 'primario'}">${ok}</button><button type="button" class="btn" data-act="fechar">Cancelar</button></div></form>`);
      const f = $('#form-pedir'); const c = $('#pedir-campo'); if (c) c.focus();
      let feito = false;
      f.addEventListener('submit', (e) => { e.preventDefault(); feito = true; const v = c ? c.value.trim() : true; fecharModal(); res(v); });
      new MutationObserver((_, o) => { if ($('#modal').hidden && !feito) { feito = true; o.disconnect(); res(null); } }).observe($('#modal'), { attributes: true, attributeFilter: ['hidden'] });
    });
  }
  async function seguro(fn, ok) {
    try { await fn(); if (ok) toast(ok); await atualizarTudo(true); } catch (e) { toast('Não foi possível salvar: ' + (e.message || e), true); }
  }

  // ---------- Ações ----------
  const ACOES = {
    nav: (b) => ir(b.dataset.id),
    fechar: fecharModal,
    sair: async () => { if (sb) await sb.auth.signOut(); location.reload(); },
    senha: async () => {
      const nova = prompt('Nova senha (mínimo 10 caracteres):'); if (!nova) return;
      if (nova.length < 10) return alert('A senha precisa ter pelo menos 10 caracteres.');
      if (prompt('Repita a nova senha:') !== nova) return alert('As senhas não conferem.');
      const { error } = await sb.auth.updateUser({ password: nova });
      alert(error ? 'Não foi possível trocar a senha: ' + error.message : 'Senha trocada. Use a nova senha nos próximos acessos.');
    },
    resultado: (b) => modalResultado(b.dataset.id),
    evento: (b) => modalEvento(b.dataset.id),
    ficha: (b) => fichaLead(b.dataset.id),
    'reg-para': (b) => { fecharModal(); UI.regLead = b.dataset.id; UI.regBusca = ''; ir('registrar'); },
    kill: async () => {
      const cur = S.config.kill_switch === true;
      const ok = await pedir({ titulo: cur ? 'Desligar kill switch?' : 'Ligar kill switch?', texto: cur ? 'Os agentes voltam a trabalhar no próximo turno.' : 'Os agentes param de iniciar novos turnos até você desligar.', ok: cur ? 'Desligar' : 'Ligar', perigo: !cur });
      if (ok) seguro(() => atualizar('ai_config', 'kill_switch', { valor: !cur, updated_at: agora() }, 'chave'), cur ? 'Kill switch desligado.' : 'Kill switch ligado.');
    },
    aprovar: (b) => {
      const r = S.rascunhos.find((x) => x.id === b.dataset.id); if (!r) return;
      const tx = ($('#tx-' + r.id) || {}).value || r.texto, as = $('#as-' + r.id);
      if (!tx.trim()) return toast('O texto não pode ficar vazio.', true);
      const patch = { texto_final: tx, status: 'aprovado', aprovado_em: agora() }; if (as) patch.assunto = as.value;
      delete UI.edits[r.id]; delete UI.edits['a' + r.id];
      seguro(() => atualizar('ai_rascunhos', r.id, patch), 'Rascunho aprovado.');
    },
    rejeitar: async (b) => {
      const m = await pedir({ titulo: 'Rejeitar rascunho', texto: 'Explique o motivo; o SDR usa isso para melhorar.', campo: true, rotulo: 'Motivo', ok: 'Rejeitar', perigo: true });
      if (m) seguro(() => atualizar('ai_rascunhos', b.dataset.id, { status: 'rejeitado', motivo_rejeicao: m }), 'Rascunho rejeitado.');
    },
    enviado: (b) => {
      const r = S.rascunhos.find((x) => x.id === b.dataset.id); if (!r) return;
      seguro(async () => {
        await atualizar('ai_rascunhos', r.id, { status: 'enviado', enviado_em: agora() });
        await inserir('ai_interacoes', { lead_id: r.lead_id, canal: r.canal, direcao: 'saida', resumo: resumir(r.texto_final || r.texto), conteudo: r.texto_final || r.texto, rascunho_id: r.id, registrado_por: 'humano' });
      }, 'Marcado como enviado.');
    },
    'reg-escolher': (b) => { UI.regLead = b.dataset.id; contatosDe([b.dataset.id]); render(true); },
    'reg-limpar': () => { UI.regLead = null; UI.regBusca = ''; render(true); },
    'reg-optout': async () => {
      const l = lead(UI.regLead); if (!l) return;
      await contatosDe([l.id]); const c = contato(l);
      const ok = await pedir({ titulo: 'Bloquear contato?', texto: `${l.nome} nunca mais receberá mensagens da Garnet AI. Isso é permanente.`, ok: 'Bloquear', perigo: true });
      if (ok) seguro(async () => { await inserir('ai_bloqueios', { lead_id: l.id, email: c.email || null, telefone: digitos(c.whatsapp) || null, motivo: 'opt-out registrado no painel' }); }, 'Contato bloqueado.');
    },
    copiar: async (b) => {
      const c = S.conteudos.find((x) => x.id === b.dataset.id); if (!c) return;
      try { await navigator.clipboard.writeText(c.legenda); toast('Legenda copiada.'); } catch (e) {
        const ta = document.createElement('textarea'); ta.value = c.legenda; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); toast('Legenda copiada.'); } catch (e2) { toast('Não foi possível copiar.', true); } ta.remove();
      }
    },
    'cont-aprovar': (b) => seguro(() => atualizar('ai_conteudos', b.dataset.id, { status: 'aprovado' }), 'Conteúdo aprovado.'),
    'cont-rejeitar': (b) => seguro(() => atualizar('ai_conteudos', b.dataset.id, { status: 'rejeitado' }), 'Conteúdo rejeitado.'),
    'camp-aprovar': (b) => seguro(() => atualizar('ai_campanhas', b.dataset.id, { status: 'aprovada' }), 'Campanha aprovada.'),
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b && ACOES[b.dataset.act]) { ACOES[b.dataset.act](b); return; }
    if (e.target.id === 'modal') fecharModal();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) fecharModal(); });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.edit) UI.edits[t.dataset.edit] = t.value;
    else if (t.dataset.editAssunto) UI.edits['a' + t.dataset.editAssunto] = t.value;
    else if (t.dataset.filtro) { UI[t.dataset.filtro] = t.value; render(true); }
    else if (t.id === 'reg-busca') { UI.regBusca = t.value; render(true); }
    else if (t.id === 'reg-texto') UI.regTexto = t.value;
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'reg-canal') UI.regCanal = t.value;
    else if (t.dataset.etapa) seguro(() => atualizar('ai_oportunidades', t.dataset.etapa, { etapa: t.value }), 'Etapa atualizada.');
  });
  document.addEventListener('submit', async (e) => {
    if (e.target.id !== 'form-reg') return;
    e.preventDefault();
    const l = lead(UI.regLead), tx = UI.regTexto.trim(); if (!l) return toast('Escolha um lead.', true); if (!tx) return toast('Cole a resposta recebida.', true);
    try {
      const it = await inserir('ai_interacoes', { lead_id: l.id, canal: UI.regCanal, direcao: 'entrada', resumo: resumir(tx), conteudo: tx, registrado_por: 'humano' });
      await inserir('ai_fila', { tipo: 'classificar_resposta', agente_id: 'atendimento', lead_id: l.id, prioridade: 1, status: 'pendente', chave_idempotencia: 'resp-' + it.id, payload: { interacao_id: it.id, rascunho_id: null } });
      toast('Resposta registrada. O Atendimento vai classificar.'); UI.regTexto = ''; UI.regLead = null; UI.regBusca = '';
      await atualizarTudo(true); render(true);
    } catch (err) { toast('Não foi possível registrar: ' + (err.message || err), true); }
  });

  // ---------- Navegação ----------
  function ir(v) { if (!VIEWS[v]) v = 'equipe'; UI.view = v; if (location.hash !== '#' + v) history.replaceState(null, '', location.search + '#' + v); render('nav'); }
  window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (VIEWS[v] && v !== UI.view) ir(v); });

  // ---------- Atualização ao vivo ----------
  let tDeb = null;
  async function atualizarTudo(forcar) { await carregar(); render(forcar ? true : false); }
  const agendarRefresh = () => { clearTimeout(tDeb); tDeb = setTimeout(() => atualizarTudo(), 400); };
  function indicador() {
    const txt = DEMO_MODE ? 'Simulação ao vivo' : realtimeOk ? 'Ao vivo (Realtime)' : `Atualiza a cada ${(CFG.POLLING_MS || 15000) / 1000} s`;
    $('#indicador').innerHTML = html`<span class="dot ${DEMO_MODE || realtimeOk ? 'live' : ''}"></span>${txt}`.s;
  }
  function iniciarAoVivo() {
    indicador();
    if (DEMO_MODE) { setInterval(() => { window.DEMO.tick(); atualizarTudo(); }, 4500); return; }
    try {
      const ch = sb.channel('garnet-ai');
      ['ai_eventos', 'ai_execucoes', 'ai_rascunhos'].forEach((tabela) => ch.on('postgres_changes', { event: '*', schema: 'public', table: tabela }, agendarRefresh));
      ch.subscribe((s) => { realtimeOk = s === 'SUBSCRIBED'; indicador(); });
    } catch (e) { realtimeOk = false; }
    let n = 0;
    timerPoll = setInterval(() => { if (realtimeOk && ++n % 4) return; atualizarTudo(); }, CFG.POLLING_MS || 15000);
  }

  // ---------- Login e inicialização ----------
  function telaCentral(corpo) { const t = $('#tela'); t.innerHTML = corpo.s; t.classList.add('ativa'); $('#app').hidden = true; }
  function telaLogin(msg) {
    telaCentral(html`<form class="card login" id="form-login"><h1>Garnet <em>AI</em></h1><p class="muted">Entre para acompanhar e aprovar o trabalho da sua equipe de agentes.</p>
      ${msg ? html`<div class="aviso" style="margin-bottom:14px">${msg}</div>` : ''}
      <div class="campo"><label for="lg-email">E-mail</label><input type="email" id="lg-email" required autocomplete="username"></div>
      <div class="campo"><label for="lg-senha">Senha</label><input type="password" id="lg-senha" autocomplete="current-password"></div>
      <button class="btn primario" type="submit" style="width:100%;justify-content:center">Entrar</button>
      <button class="btn" type="button" id="lg-link" style="width:100%;justify-content:center;margin-top:10px">Sem senha? Receber link de acesso no e-mail</button>
      <details style="margin-top:12px"><summary class="peq muted">O link do e-mail abriu outro site? Cole-o aqui</summary>
        <div class="campo" style="margin-top:8px"><input type="url" id="lg-colar" placeholder="https://papaicnydbcajkfghwem.supabase.co/auth/v1/verify?..."></div>
        <button class="btn" type="button" id="lg-colar-ok" style="width:100%;justify-content:center">Entrar com o link</button></details><p class="peq muted" style="margin-top:14px">Quer só ver como funciona? <a href="?demo=1" style="color:var(--gold-text)">Abrir demonstração</a></p></form>`);
    $('#form-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!$('#lg-senha').value) return telaLogin('Digite a senha, ou use "Receber link de acesso no e-mail".');
      const { error } = await sb.auth.signInWithPassword({ email: $('#lg-email').value.trim(), password: $('#lg-senha').value });
      if (error) telaLogin('Não foi possível entrar: ' + (error.message === 'Invalid login credentials' ? 'e-mail ou senha incorretos.' : error.message));
      else entrar();
    });
    // Acesso sem senha: link mágico enviado ao e-mail do operador (só para contas já existentes)
    $('#lg-link').addEventListener('click', async () => {
      const email = $('#lg-email').value.trim();
      if (!email) return telaLogin('Digite o seu e-mail e clique de novo em "Receber link".');
      const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname } });
      telaLogin(error ? 'Não foi possível enviar o link: ' + error.message : 'Link enviado para ' + email + '. Abra o e-mail (veja também o spam) e clique no link. Se ele abrir outro site, copie o endereço do link e cole no campo abaixo.');
    });
    $('#lg-colar-ok').addEventListener('click', async () => {
      let u; try { u = new URL($('#lg-colar').value.trim()); } catch { return telaLogin('Esse link não parece válido.'); }
      const token = u.searchParams.get('token') || u.searchParams.get('token_hash');
      const type = u.searchParams.get('type') || 'magiclink';
      if (!token) return telaLogin('Não encontrei o código de acesso nesse link.');
      const { error } = await sb.auth.verifyOtp({ token_hash: token, type });
      if (error) telaLogin('Link expirado ou já usado: peça um novo.'); else entrar();
    });
  }
  async function entrar() {
    const { data: { session } } = await sb.auth.getSession(); if (!session) return telaLogin();
    usuario = session.user.email;
    let permitido = false;
    try { const { data, error } = await sb.rpc('ai_permitido'); permitido = !error && data === true; } catch (e) { permitido = false; }
    if (!permitido) return telaCentral(html`<div class="card login"><h1>Acesso <em>pendente</em></h1><div class="aviso" style="margin:14px 0">Você entrou como <b>${usuario}</b>, mas este e-mail ainda não é um operador da Garnet AI. Peça para incluir o e-mail na tabela <code>ai_operadores</code> do Supabase e entre novamente.</div><button class="btn" data-act="sair">Sair</button></div>`);
    abrirApp();
  }
  async function abrirApp() {
    $('#tela').classList.remove('ativa'); $('#app').hidden = false;
    $('#usuario').textContent = usuario || ''; $('#btn-sair').hidden = DEMO_MODE; $('#btn-senha').hidden = DEMO_MODE;
    await carregar();
    const v = location.hash.slice(1); UI.view = VIEWS[v] ? v : 'equipe';
    render('nav'); iniciarAoVivo();
  }
  async function iniciar() {
    if (DEMO_MODE) { $('#selo-demo').hidden = false; document.title = 'Garnet AI — Demonstração'; usuario = 'demonstração'; return abrirApp(); }
    if (!window.supabase || window.__sbFalhou) return telaCentral(html`<div class="card login"><h1>Sem <em>conexão</em></h1><p>Não foi possível carregar a biblioteca do Supabase. Verifique a internet e recarregue, ou veja a <a href="?demo=1" style="color:var(--gold-text)">demonstração</a>.</p></div>`);
    sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY);
    sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') telaLogin(); });
    const { data: { session } } = await sb.auth.getSession();
    session ? entrar() : telaLogin();
  }
  iniciar();
})();
