// Função principal de renderização.
// renderSlide({ tipo, conteudo, dna, indice, total, pilar, tags }) → HTML completo.

import { BrandDNASchema, SlideContentSchema } from './schemas.js';
import { baseCss, formatarContador, decoracaoHtml, labelSpacing, labelTransform } from './tokens.js';
import { renderConteudoMiolo } from './templates.js';

/**
 * Renderiza um slide completo (HTML autocontido 1080×1350).
 *
 * @param {Object} opts
 * @param {Object} opts.conteudo   — objeto validável por SlideContentSchema
 * @param {Object} opts.dna        — objeto validável por BrandDNASchema
 * @param {number} opts.indice     — 1-based, posição do slide
 * @param {number} opts.total      — total de slides no carrossel
 * @param {string} opts.pilar      — ex: "Estratégia de Marca"
 * @param {string[]} [opts.tags]   — tags do rodapé (ex: ["Estratégia · Marca"])
 * @param {string} [opts.palavraChaveDeco] — palavra pra decoração "palavra-chave"
 * @param {boolean} [opts.validar] — default true, valida schemas (desliga em produção se quiser)
 * @returns {string} HTML completo (<!DOCTYPE html>...)
 */
export function renderSlide(opts) {
  const {
    conteudo, dna,
    indice, total, pilar,
    tags = [],
    palavraChaveDeco = '',
    validar = true,
  } = opts;

  if (validar) {
    BrandDNASchema.parse(dna);
    SlideContentSchema.parse(conteudo);
  }

  const marca = dna.marca.nome;
  const logoTxt = dna.logo.fallback_texto || marca;
  const assinatura = dna.marca.assinatura_url;
  const contador = formatarContador(dna, indice, total);

  const miolo = renderConteudoMiolo(conteudo, dna);
  const deco = decoracaoHtml(dna, { indiceSlide: indice, palavraChave: palavraChaveDeco });

  // Header
  const header = renderHeader(dna, logoTxt, pilar);

  // Footer
  const footer = renderFooter(dna, assinatura, contador, tags);

  // Google Fonts
  const fontHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(dna.tipografia.display).replace(/%20/g,'+')}:ital,wght@0,400;0,700;1,700&display=swap`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${marca} · Slide ${indice}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${fontHref}" rel="stylesheet">
<style>${baseCss(dna)}</style>
</head>
<body>
  <article class="card">
    ${deco}
    ${header}
    <section class="content">
      ${miolo}
    </section>
    ${footer}
  </article>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// Header (segue dna.header.estilo)
// ─────────────────────────────────────────────────────────────
function renderHeader(dna, logoTxt, pilar) {
  const estilo = dna.header.estilo;
  const logo = `<div class="logo">${escapeHtml(logoTxt)}</div>`;
  if (estilo === 'minimal') {
    return `<header class="header">${logo}<div></div></header>`;
  }
  // logo-pilar (default), logo-tagline, logo-categoria-badge (badge diferenciado)
  if (estilo === 'logo-categoria-badge') {
    return `<header class="header">${logo}
      <div style="font-size:0.7rem; letter-spacing:${labelSpacing(dna)}; text-transform:${labelTransform(dna)}; color:var(--accent); font-weight:800; padding:6px 14px; border:1px solid var(--accent); border-radius:999px;">${escapeHtml(pilar)}</div>
    </header>`;
  }
  // logo-pilar e logo-tagline usam mesma estrutura, texto do pilar à direita
  return `<header class="header">${logo}<div class="pilar">${escapeHtml(pilar)}</div></header>`;
}

// ─────────────────────────────────────────────────────────────
// Footer (segue dna.rodape.estilo)
// ─────────────────────────────────────────────────────────────
function renderFooter(dna, assinatura, contador, tags) {
  const estilo = dna.rodape.estilo;
  const urlBlock = `<div>${escapeHtml(assinatura)}</div>`;

  if (estilo === 'minimal') {
    return `<footer class="footer">${urlBlock}</footer>`;
  }

  const contadorBlock = contador ? `<div class="counter">${contador}</div>` : '';

  if (estilo === 'com-contador') {
    return `<footer class="footer">${urlBlock}${contadorBlock}</footer>`;
  }

  // completo
  const tagsBlock = tags.length
    ? `<div class="tags">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`
    : '<div></div>';

  return `<footer class="footer">${urlBlock}${contadorBlock}${tagsBlock}</footer>`;
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Renderiza um carrossel inteiro (array de slides).
 *
 * @param {Object} opts
 * @param {Object[]} opts.slides   — array de conteudos
 * @param {Object}   opts.dna
 * @param {string}   opts.pilar
 * @param {string[]} [opts.tags]
 * @returns {string[]} array de HTML (1 por slide)
 */
export function renderCarrossel({ slides, dna, pilar, tags = [] }) {
  const total = slides.length;
  return slides.map((conteudo, i) => renderSlide({
    conteudo, dna,
    indice: i + 1,
    total,
    pilar,
    tags,
  }));
}
