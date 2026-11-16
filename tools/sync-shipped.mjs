// Keep first-paint data in sync: the street must be centred before a navigation snapshot.
import { readFile, writeFile } from 'node:fs/promises';
const page = new URL('../shipped/index.html', import.meta.url);
const data = JSON.parse(await readFile(new URL('../assets/data/shipped.json', import.meta.url), 'utf8'));
const block = `<script type="application/json" id="shipped-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
let html = await readFile(page, 'utf8');
html = html.includes('id="shipped-data"') ? html.replace(/<script type="application\/json" id="shipped-data">[\s\S]*?<\/script>/, block) : html.replace('<script src="/assets/js/site.js"', `${block}\n<script src="/assets/js/site.js"`);
await writeFile(page, html);
