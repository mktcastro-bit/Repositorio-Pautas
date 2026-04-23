// Script de prova de conceito.
// Renderiza o post 8 a partir do JSON + DNA Nexum e salva em samples/poc/.
//
// Uso:  node lib/render/poc-run.js

import fs from 'node:fs';
import path from 'node:path';
import { renderCarrossel } from './render.js';
import { NEXUM_DNA } from './presets.js';
import { POC_PAUTA } from './poc-content.js';

const OUT_DIR = path.resolve('samples/poc');
fs.mkdirSync(OUT_DIR, { recursive: true });

const htmls = renderCarrossel({
  slides: POC_PAUTA.slides,
  dna: NEXUM_DNA,
  pilar: POC_PAUTA.pilar,
  tags: POC_PAUTA.tags,
});

htmls.forEach((html, i) => {
  const file = path.join(OUT_DIR, `slide-${i + 1}.html`);
  fs.writeFileSync(file, html);
  console.log(`✓ ${file}`);
});

console.log(`\nGerou ${htmls.length} slides em ${OUT_DIR}`);
