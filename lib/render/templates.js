// Templates por tipo de slide.
// Cada função recebe (conteudo, dna, ctx) e devolve o HTML do miolo
// (tudo que vai dentro de <section class="content">).
// Header/footer/decoração ficam no render.js.

import {
  parseRich,
  caixaCss,
  labelSpacing,
  labelTransform,
  labelPrefix,
  radius,
} from './tokens.js';

// ─────────────────────────────────────────────────────────────
// Tipo 1 · capa
// ─────────────────────────────────────────────────────────────
export function renderCapa(c, dna) {
  const prefix = labelPrefix(dna);
  return `
    ${c.tagline ? `<div class="tagline" style="font-size:0.78rem; letter-spacing:${labelSpacing(dna)}; text-transform:${labelTransform(dna)}; color:var(--accent); font-weight:800; margin-bottom:32px;">${prefix}${parseRich(c.tagline)}</div>` : ''}
    <h1 style="font-family:var(--font-display); font-weight:var(--weight-display); font-size:5.2rem; line-height:1.04; letter-spacing:-0.03em; max-width:920px;">${parseRich(c.titulo)}</h1>
    <div style="width:80px; height:3px; background:var(--accent); margin-top:32px; margin-bottom:32px;"></div>
    <p style="font-family:var(--font-display); font-style:italic; font-weight:700; font-size:1.6rem; line-height:1.4; color:var(--muted); max-width:760px;">${parseRich(c.subtitulo)}</p>
  `;
}

// ─────────────────────────────────────────────────────────────
// Tipo 2 · grid-2-colunas
// ─────────────────────────────────────────────────────────────
export function renderGrid2Colunas(c, dna) {
  const prefix = labelPrefix(dna);
  const col = (col) => `
    <div style="display:flex; flex-direction:column; gap:14px;">
      <div class="label" style="color:var(--muted);">${prefix}${col.label}</div>
      <div style="font-family:var(--font-display); font-weight:var(--weight-display); font-size:2.8rem; line-height:1.1; letter-spacing:-0.02em;">${col.destaque}</div>
      <p style="font-size:1.35rem; line-height:1.5; color:var(--muted); max-width:360px;">${parseRich(col.descricao)}</p>
    </div>`;
  return `
    <h1 style="font-family:var(--font-display); font-weight:var(--weight-display); font-size:4.4rem; line-height:1.08; letter-spacing:-0.028em; max-width:900px; margin-bottom:56px;">${parseRich(c.titulo)}</h1>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:60px; border-top:1px solid var(--borda); padding-top:40px;">
      ${col(c.esquerda)}
      ${col(c.direita)}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// Tipo 3 · lista-numerada
// ─────────────────────────────────────────────────────────────
export function renderListaNumerada(c, dna) {
  const prefix = labelPrefix(dna);
  const itens = c.itens.map((it, i) => `
    <div style="display:grid; grid-template-columns:72px 1fr; column-gap:20px; padding:24px 0; border-bottom:1px solid var(--borda);">
      <div style="font-family:var(--font-display); font-weight:var(--weight-display); font-size:3rem; color:var(--accent); line-height:1;">${String(i+1).padStart(2,'0')}</div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="font-family:var(--font-display); font-weight:var(--weight-display); font-style:italic; font-size:1.8rem; line-height:1.25;">${parseRich(it.titulo)}</div>
        <p style="font-size:1.35rem; line-height:1.45; color:var(--muted);">${parseRich(it.descricao)}</p>
      </div>
    </div>
  `).join('');
  return `
    ${c.label ? `<div class="label" style="margin-bottom:24px;">${prefix}${c.label}</div>` : ''}
    <h1 style="font-family:var(--font-display); font-weight:var(--weight-display); font-size:3.6rem; line-height:1.1; letter-spacing:-0.025em; max-width:900px; margin-bottom:20px; border-bottom:1px solid var(--borda); padding-bottom:32px;">${parseRich(c.titulo)}</h1>
    <div>${itens}</div>
  `;
}

// ─────────────────────────────────────────────────────────────
// Tipo 4 · grid-4-pilares
// ─────────────────────────────────────────────────────────────
export function renderGrid4Pilares(c, dna) {
  const prefix = labelPrefix(dna);
  const items = c.pilares.map((p, i) => `
    <div style="padding:28px 20px; ${i < 3 ? 'border-right:1px solid var(--borda);' : ''} display:flex; flex-direction:column; gap:10px;">
      <div class="label" style="font-size:0.7rem;">${prefix}${p.label}</div>
      <div style="font-family:var(--font-display); font-weight:var(--weight-display); font-size:1.55rem; line-height:1.25;">${parseRich(p.texto)}</div>
    </div>
  `).join('');
  return `
    <h1 style="font-family:var(--font-display); font-weight:var(--weight-display); font-size:4.2rem; line-height:1.08; letter-spacing:-0.028em; max-width:900px; margin-bottom:56px;">${parseRich(c.titulo)}</h1>
    <div style="display:grid; grid-template-columns:repeat(4,1fr); border-top:1px solid var(--borda); border-bottom:1px solid var(--borda);">
      ${items}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// Tipo 5 · frase-destaque-com-box
// ─────────────────────────────────────────────────────────────
export function renderFraseDestaque(c, dna) {
  const prefix = labelPrefix(dna);
  return `
    ${c.label ? `<div class="label" style="margin-bottom:24px;">${prefix}${c.label}</div>` : ''}
    <h1 style="font-family:var(--font-display); font-weight:var(--weight-display); font-size:4.6rem; line-height:1.06; letter-spacing:-0.03em; max-width:900px; margin-bottom:40px;">${parseRich(c.titulo)}</h1>
    <div style="${caixaCss(dna)} padding:32px 36px; display:flex; flex-direction:column; gap:12px; max-width:820px;">
      <div class="label" style="font-size:0.68rem;">${c.box.label}</div>
      <p style="font-family:var(--font-display); font-weight:var(--weight-display); font-style:italic; font-size:1.6rem; line-height:1.4;">${parseRich(c.box.texto)}</p>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// Tipo 6 · comparacao-contraste
// ─────────────────────────────────────────────────────────────
export function renderComparacao(c, dna) {
  const bg = dna.cores.bg_primario;
  const surface = dna.cores.bg_surface;
  const accent = dna.cores.accent;
  const borda = dna.cores.borda;
  const r = radius(dna);

  const caixa = (side, box, destaque) => {
    const bgCol = destaque ? accent : surface;
    const labelCol = destaque ? `rgba(7,13,26,0.6)` : 'var(--muted)';
    const titleCol = destaque ? bg : 'var(--text)';
    const descCol = destaque ? `rgba(7,13,26,0.85)` : 'var(--muted)';
    const br = destaque ? `0 ${r} ${r} 0` : `${r} 0 0 ${r}`;
    const border = destaque ? '' : `border:1px solid ${borda}; border-right:0;`;
    return `
      <div style="background:${bgCol}; ${border} border-radius:${br}; padding:40px 36px; display:flex; flex-direction:column; gap:14px;">
        <div style="font-size:0.68rem; letter-spacing:${labelSpacing(dna)}; text-transform:${labelTransform(dna)}; font-weight:800; color:${labelCol};">${box.label}</div>
        <div style="font-family:var(--font-display); font-weight:var(--weight-display); font-size:2.2rem; line-height:1.1; letter-spacing:-0.02em; color:${titleCol};">${box.titulo}</div>
        <p style="font-size:1.35rem; line-height:1.5; color:${descCol};">${parseRich(box.descricao)}</p>
      </div>`;
  };

  return `
    <h1 style="font-family:var(--font-display); font-weight:var(--weight-display); font-size:4.2rem; line-height:1.08; letter-spacing:-0.028em; max-width:900px; margin-bottom:40px;">${parseRich(c.titulo)}</h1>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0;">
      ${caixa('a', c.caixa_a, false)}
      ${caixa('b', c.caixa_b, true)}
    </div>
    ${c.fechamento ? `
      <div style="font-family:var(--font-display); font-style:italic; font-weight:700; font-size:1.7rem; line-height:1.4; color:var(--text); max-width:820px; border-left:2px solid ${accent}; padding:8px 0 8px 24px; margin-top:40px;">${parseRich(c.fechamento)}</div>
    ` : ''}
  `;
}

// ─────────────────────────────────────────────────────────────
// Tipo 7 · cta-final
// ─────────────────────────────────────────────────────────────
export function renderCtaFinal(c, dna) {
  const prefix = labelPrefix(dna);
  const accent = dna.cores.accent;

  const metodo = c.metodo ? `
    <div style="${caixaCss(dna)} padding:32px 36px; display:flex; flex-direction:column; gap:18px; max-width:900px;">
      <div class="label" style="font-size:0.68rem;">${c.metodo.label}</div>
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${c.metodo.passos.map((p, i) => `
          <div style="display:grid; grid-template-columns:36px 1fr; column-gap:14px; font-family:var(--font-display); font-weight:var(--weight-display); font-style:italic; font-size:1.6rem; line-height:1.4;">
            <div style="font-style:normal; font-size:1.45rem; color:${accent};">${String(i+1).padStart(2,'0')}</div>
            <span>${parseRich(p.frase)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  return `
    ${c.tagline ? `<div class="label" style="margin-bottom:24px;">${prefix}${c.tagline}</div>` : ''}
    <h1 style="font-family:var(--font-display); font-weight:var(--weight-display); font-size:4.8rem; line-height:1.04; letter-spacing:-0.03em; max-width:900px; margin-bottom:44px;">${parseRich(c.titulo)}</h1>
    ${metodo}
    <div style="display:flex; justify-content:space-between; align-items:center; padding:32px 0 0; border-top:1px solid var(--borda); margin-top:44px;">
      <div style="font-family:var(--font-display); font-weight:var(--weight-display); font-size:1.65rem;">${parseRich(c.cta.texto)}</div>
      <div style="font-size:1rem; letter-spacing:0.1em; color:var(--accent); font-weight:700; text-transform:uppercase;">${c.cta.url}</div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// Tipo 8 · teste-pergunta
// ─────────────────────────────────────────────────────────────
export function renderTestePergunta(c, dna) {
  const prefix = labelPrefix(dna);
  const verediInst = c.veredito.map(v => `
    <div style="font-family:var(--font-display); font-style:italic; font-weight:700; font-size:1.85rem; line-height:1.35; color:${v.destaque ? 'var(--accent)' : 'var(--muted)'};">
      <strong style="font-style:normal; color:var(--text);">${parseRich(v.condicao)}</strong> ${parseRich(v.texto)}
    </div>`).join('');
  return `
    ${c.label ? `<div class="label" style="margin-bottom:32px;">${prefix}${c.label}</div>` : ''}
    <div style="font-family:var(--font-display); font-weight:var(--weight-display); font-size:4.6rem; line-height:1.08; letter-spacing:-0.028em; max-width:900px; margin-bottom:48px;">${parseRich(c.pergunta)}</div>
    <div style="display:flex; flex-direction:column; gap:10px; padding:28px 0 0; border-top:1px solid var(--borda); max-width:800px;">
      ${verediInst}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// Dispatcher
// ─────────────────────────────────────────────────────────────

export const TEMPLATES = {
  'capa': renderCapa,
  'grid-2-colunas': renderGrid2Colunas,
  'lista-numerada': renderListaNumerada,
  'grid-4-pilares': renderGrid4Pilares,
  'frase-destaque-com-box': renderFraseDestaque,
  'comparacao-contraste': renderComparacao,
  'cta-final': renderCtaFinal,
  'teste-pergunta': renderTestePergunta,
};

export function renderConteudoMiolo(conteudo, dna) {
  const fn = TEMPLATES[conteudo.tipo];
  if (!fn) throw new Error(`Tipo de slide desconhecido: ${conteudo.tipo}`);
  return fn(conteudo, dna);
}
