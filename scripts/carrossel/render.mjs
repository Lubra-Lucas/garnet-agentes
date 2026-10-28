#!/usr/bin/env node
// Renderiza um carrossel Garnet (spec JSON) em PNGs 1080x1350.
// Uso: node scripts/carrossel/render.mjs spec.json pasta_saida   -> imprime JSON com os arquivos.
// Spec: ver docs/arquitetura.md ("Mídia social"). Nunca rode `playwright install`.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function carregarPlaywright() {
  for (const alvo of ['playwright', '/opt/node-tools/node_modules/playwright', 'playwright-core']) {
    try { return require(alvo); } catch { /* tenta o próximo */ }
  }
  throw new Error('Pacote playwright não encontrado (não rode playwright install; use o instalado no ambiente).');
}

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const urlSegura = (u) => (/^https:\/\/[^\s"'<>()]+$/.test(String(u || '')) ? String(u) : '');

// Título com a palavra de destaque em itálico dourado; se não estiver no título, vai numa linha própria.
function tituloComDestaque(titulo, destaque) {
  const t = String(titulo ?? '');
  const d = String(destaque ?? '').trim();
  if (!d) return esc(t);
  const i = t.indexOf(d);
  if (i < 0) return `${esc(t)} <em>${esc(d)}</em>`;
  return `${esc(t.slice(0, i))}<em>${esc(d)}</em>${esc(t.slice(i + d.length))}`;
}
// Em textos livres, *palavra* vira destaque.
const comMarcas = (s) => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');

function conteudoDa(l) {
  switch (l.tipo) {
    case 'capa':
      return { cls: 'capa', html: `<div class="conteudo" data-fit>
        ${l.olho ? `<div class="olho">${esc(l.olho)}</div>` : ''}
        <h1>${tituloComDestaque(l.titulo, l.destaque)}</h1>
        ${l.subtitulo ? `<div class="filete"></div><div class="sub">${comMarcas(l.subtitulo)}</div>` : ''}</div>` };
    case 'texto':
      return { cls: 'texto', html: `<div class="conteudo" data-fit>
        ${l.numero ? `<div class="numero">${esc(l.numero)}</div>` : ''}
        <h2>${tituloComDestaque(l.titulo, l.destaque)}</h2>
        ${l.texto ? `<div class="filete"></div><p>${comMarcas(l.texto)}</p>` : ''}</div>` };
    case 'lista':
      return { cls: 'lista', html: `<div class="conteudo" data-fit>
        <h2>${tituloComDestaque(l.titulo, l.destaque)}</h2>
        <ul>${(l.itens || []).map((it, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span><div>${comMarcas(it)}</div></li>`).join('')}</ul></div>` };
    case 'etapas':
      return { cls: 'etapas', html: `<div class="conteudo" data-fit>
        <h2>${tituloComDestaque(l.titulo, l.destaque)}</h2>
        <div>${(l.etapas || []).map((e, i) => `<div class="etapa"><div class="n">${esc(e.n ?? String(i + 1).padStart(2, '0'))}</div>
          <div><div class="nome">${esc(e.nome)}</div>${e.texto ? `<div class="t">${comMarcas(e.texto)}</div>` : ''}</div></div>`).join('')}</div></div>` };
    case 'dado':
      return { cls: 'dado', html: `<div class="conteudo" data-fit>
        <div class="valor" data-fit-linha>${esc(l.valor)}</div>
        <div class="rotulo">${comMarcas(l.rotulo)}</div>
        ${l.texto ? `<div class="filete"></div><p>${comMarcas(l.texto)}</p>` : ''}</div>` };
    case 'imagem': {
      const u = urlSegura(l.imagem);
      return { cls: 'imagem' + (u ? '' : ' sem-imagem'), imagem: u, html: `
        ${u ? `<div class="foto" data-bg="${esc(u)}"></div>` : ''}<div class="veu"></div>
        <div class="conteudo" data-fit><div class="legenda">${comMarcas(l.legenda)}</div></div>
        ${l.ilustrativa ? '<div class="selo">Imagem ilustrativa</div>' : ''}` };
    }
    case 'cta':
      return { cls: 'cta', html: `<div class="conteudo" data-fit>
        <h2>${tituloComDestaque(l.titulo, l.destaque)}</h2>
        ${l.texto ? `<div class="filete"></div><p>${comMarcas(l.texto)}</p>` : ''}
        ${l.acao ? `<div class="botao">${esc(l.acao)}</div>` : ''}
        <div class="arroba">@garnetcosmeticos</div></div>` };
    default:
      throw new Error(`Tipo de lâmina desconhecido: "${l.tipo}"`);
  }
}

function montarSlide(l, i, total, temaPadrao, logo) {
  const { cls, html, imagem } = conteudoDa(l);
  const tema = (l.tema || temaPadrao) === 'escuro' ? 'escuro' : 'claro';
  const capaFoto = l.tipo === 'capa' && urlSegura(l.imagem);
  const ultima = i === total - 1;
  const num = (n) => String(n).padStart(2, '0');
  return `<div class="slide ${tema === 'escuro' ? 'escuro' : ''} ${cls} ${capaFoto ? 'com-foto' : ''}">
    ${capaFoto ? `<div class="foto" data-bg="${esc(urlSegura(l.imagem))}" style="position:absolute;inset:0;z-index:0;background-size:cover;background-position:center"></div><div class="foto-veu" style="position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(18,16,14,.55),rgba(18,16,14,.85))"></div>` : ''}
    <div class="topo"><img src="${logo}" alt="Garnet"><div class="pagina"><b>${num(i + 1)}</b> / ${num(total)}</div></div>
    ${html}
    <div class="rodape"><span>${ultima ? '' : 'Garnet Cosméticos'}</span>${ultima ? '<span>garnetcosmeticos.com.br</span>' : '<span class="deslize">deslize <i></i></span>'}</div>
  </div>`;
}

// Reduz --k até o conteúdo caber na área; valor grande (dado) também não pode passar da largura.
const AJUSTAR = async () => {
  await document.fonts.ready;
  const c = document.querySelector('[data-fit]');
  const v = document.querySelector('[data-fit-linha]');
  let k = 1;
  const estoura = () => c.scrollHeight > c.clientHeight + 1 || c.scrollWidth > c.clientWidth + 1 || (v && v.scrollWidth > c.clientWidth + 1);
  const slide = document.querySelector('.slide');
  slide.style.setProperty('--k', k);
  while (estoura() && k > 0.4) { k = Math.round((k - 0.03) * 100) / 100; slide.style.setProperty('--k', k); }
  return { k, ok: !estoura() };
};

async function principal() {
  const [specArq, saida] = process.argv.slice(2);
  if (!specArq || !saida) { console.error('Uso: node render.mjs spec.json pasta_saida'); process.exit(2); }
  const spec = JSON.parse(fs.readFileSync(specArq, 'utf8'));
  const laminas = spec['lâminas'] || spec.laminas || spec.slides;
  if (!Array.isArray(laminas) || !laminas.length) throw new Error('Spec sem "lâminas".');
  fs.mkdirSync(saida, { recursive: true });

  const modelo = fs.readFileSync(path.join(AQUI, 'template.html'), 'utf8');
  const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(AQUI, 'garnet-logo.png')).toString('base64');
  const { chromium } = carregarPlaywright();
  const browser = await chromium.launch();
  const arquivos = [];
  const avisos = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    for (let i = 0; i < laminas.length; i++) {
      const l = laminas[i];
      const html = modelo.replace('{{SLIDE}}', () => montarSlide(l, i, laminas.length, spec.tema, logo));
      await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
      // Imagens remotas: tenta carregar; se falhar, a lâmina segue sem imagem.
      const falhou = await page.evaluate(async () => {
        const falhas = [];
        for (const el of document.querySelectorAll('[data-bg]')) {
          const url = el.getAttribute('data-bg');
          const ok = await new Promise((res) => {
            const im = new Image(); const t = setTimeout(() => res(false), 10000);
            im.onload = () => { clearTimeout(t); res(true); }; im.onerror = () => { clearTimeout(t); res(false); };
            im.src = url;
          });
          if (ok) el.style.backgroundImage = `url("${url}")`;
          else {
            falhas.push(url); el.remove();
            const s = document.querySelector('.slide');
            s.classList.remove('com-foto'); document.querySelector('.foto-veu')?.remove();
            if (s.classList.contains('imagem')) s.classList.add('sem-imagem');
          }
        }
        return falhas;
      });
      if (falhou.length) avisos.push(`lâmina ${i + 1}: imagem não carregou (${falhou.join(', ')}); renderizada sem imagem`);
      const r = await page.evaluate(AJUSTAR);
      if (!r.ok) avisos.push(`lâmina ${i + 1}: texto ainda não cabe com fonte mínima; encurte o texto`);
      else if (r.k < 0.7) avisos.push(`lâmina ${i + 1}: fonte reduzida a ${Math.round(r.k * 100)}%; considere encurtar`);
      const arq = path.join(saida, String(i + 1).padStart(2, '0') + '.png');
      await page.screenshot({ path: arq, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
      arquivos.push(arq);
    }
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify({ arquivos, avisos }, null, 1));
}

principal().catch((e) => { console.error(`Erro: ${e.message}`); process.exit(1); });
