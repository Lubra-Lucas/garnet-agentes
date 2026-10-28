// Renderiza um HTML (uma <section class="pagina"> por página, 16:9) em PDF com Playwright.
// Uso: node scripts/pdf/render.mjs <arquivo.html> <saida.pdf> [dados.json]
// Se dados.json for passado, fica disponível no HTML como window.DADOS antes dos scripts da página rodarem.
import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node-tools/node_modules/playwright'); }

const [html, saida, dadosArq] = process.argv.slice(2);
if (!html || !saida) { console.error('Uso: node scripts/pdf/render.mjs <arquivo.html> <saida.pdf> [dados.json]'); process.exit(2); }
const dados = dadosArq ? JSON.parse(readFileSync(dadosArq, 'utf8')) : null;

const browser = await playwright.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1333, height: 750 } });
if (dados) await page.addInitScript((d) => { window.DADOS = d; }, dados);
await page.goto(pathToFileURL(resolve(html)).href, { waitUntil: 'networkidle', timeout: 90000 });
await page.evaluate(async () => {
  await document.fonts.ready;
  if (window.__prontas) await window.__prontas; // a página pode expor uma promessa (ex.: redução de imagens)
  await Promise.all([...document.images].map((img) => img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })));
});
const avisos = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => 'imagem não carregou: ' + i.src));
await page.pdf({ path: saida, width: '1333px', height: '750px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await browser.close();
console.log(JSON.stringify({ pdf: resolve(saida), bytes: statSync(saida).size, avisos }, null, 1));
