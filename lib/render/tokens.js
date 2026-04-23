// Helpers pra converter tokens de DNA em CSS.
// São funções puras: recebem o DNA validado e devolvem strings CSS.

// ─────────────────────────────────────────────────────────────
// Utilidades de cor
// ─────────────────────────────────────────────────────────────

export function hexToRgba(hex, alpha = 1) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function resolveAccentAlpha(dna) {
  return dna.cores.accent_alpha || hexToRgba(dna.cores.accent, 0.12);
}

// ─────────────────────────────────────────────────────────────
// Escalas
// ─────────────────────────────────────────────────────────────

const ESCALA_MULT = {
  compacta: 0.92,
  confortavel: 1.0,
  espacosa: 1.08,
};

export function scale(dna, remBase) {
  const m = ESCALA_MULT[dna.tipografia.escala] || 1;
  return `${(remBase * m).toFixed(2)}rem`;
}

// ─────────────────────────────────────────────────────────────
// Labels
// ─────────────────────────────────────────────────────────────

const SPACING_MAP = {
  tight: '0.05em',
  normal: '0.12em',
  wide: '0.2em',
  ultra: '0.3em',
};

const PREFIXO_MAP = {
  nenhum: '',
  'traco-duplo': '── ',
  bullet: '• ',
  seta: '→ ',
  barra: '│ ',
};

export function labelTransform(dna) {
  return dna.labels.transformacao === 'uppercase' ? 'uppercase'
       : dna.labels.transformacao === 'capitalize' ? 'capitalize'
       : 'none';
}

export function labelSpacing(dna) {
  return SPACING_MAP[dna.labels.spacing] || '0.12em';
}

export function labelPrefix(dna) {
  return PREFIXO_MAP[dna.labels.prefixo] || '';
}

// ─────────────────────────────────────────────────────────────
// Contador
// ─────────────────────────────────────────────────────────────

export function formatarContador(dna, indice, total) {
  const pad = (n) => String(n).padStart(2, '0');
  switch (dna.contador.formato) {
    case 'XX_barra_YY': return `${pad(indice)} / ${pad(total)}`;
    case 'XX_de_YY':    return `${pad(indice)} de ${pad(total)}`;
    case 'XX':          return pad(indice);
    case 'oculto':      return '';
    default:            return `${pad(indice)} / ${pad(total)}`;
  }
}

// ─────────────────────────────────────────────────────────────
// Caixas
// ─────────────────────────────────────────────────────────────

const RADIUS_MAP = {
  nenhum: '0',
  S: '4px',
  M: '12px',
  L: '24px',
  pill: '999px',
};

export function radius(dna) {
  return RADIUS_MAP[dna.caixas.radius] || '12px';
}

export function caixaCss(dna) {
  const accent = dna.cores.accent;
  const surface = dna.cores.bg_surface;
  const borda = dna.cores.borda;
  const alpha = resolveAccentAlpha(dna);
  const r = radius(dna);

  const fill = {
    'nenhum': 'transparent',
    'surface': surface,
    'accent-alpha': alpha,
    'accent-solido': accent,
  }[dna.caixas.preenchimento];

  const base = `background:${fill}; border-radius:${r};`;

  switch (dna.caixas.estilo) {
    case 'flat':
      return base;
    case 'borda-lateral':
      return `${base} border-left:3px solid ${accent}; border-radius:0 ${r} ${r} 0;`;
    case 'borda-completa':
      return `${base} border:1px solid ${borda};`;
    case 'sombra':
      return `${base} box-shadow:0 8px 32px ${hexToRgba(accent, 0.15)};`;
    case 'gradiente':
      return `background:linear-gradient(135deg, ${surface}, ${alpha}); border-radius:${r};`;
    default:
      return base;
  }
}

// ─────────────────────────────────────────────────────────────
// Destaque inline (para `_palavra_` etc.)
// ─────────────────────────────────────────────────────────────

export function destaqueCss(dna) {
  const accent = dna.cores.accent;
  const intensidade = dna.destaque.intensidade;
  const opacidade = intensidade === 'sutil' ? 0.8 : 1.0;
  const pesoExtra = intensidade === 'forte' ? 'font-weight:800;' : '';

  switch (dna.destaque.estilo) {
    case 'italico-cor':
      return `color:${accent}; font-style:italic; opacity:${opacidade};`;
    case 'negrito-cor':
      return `color:${accent}; font-weight:800; opacity:${opacidade};`;
    case 'sublinhado-cor':
      return `color:${accent}; text-decoration:underline; text-decoration-color:${accent}; text-underline-offset:0.1em; ${pesoExtra} opacity:${opacidade};`;
    case 'fundo-cor':
      return `background:${hexToRgba(accent, 0.2)}; color:${accent}; padding:0 0.2em; border-radius:4px; ${pesoExtra}`;
    case 'maiusculas-cor':
      return `color:${accent}; text-transform:uppercase; letter-spacing:0.05em; ${pesoExtra} opacity:${opacidade};`;
    default:
      return `color:${accent}; font-style:italic;`;
  }
}

// ─────────────────────────────────────────────────────────────
// Rich text parser (muito simples)
// Ordem importa: processa riscado → forte → destaque
// ─────────────────────────────────────────────────────────────

export function parseRich(str) {
  if (!str) return '';
  // escape HTML básico primeiro
  let out = String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // riscado: ~~texto~~
  out = out.replace(/~~(.+?)~~/g, '<span data-rich="riscado">$1</span>');
  // forte: **texto**
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong data-rich="forte">$1</strong>');
  // destaque: _texto_  (não comer underscores dentro de palavras: exige não-alfanumérico antes e depois)
  out = out.replace(/(^|[^\w])_([^_\n]+?)_(?=[^\w]|$)/g, '$1<em data-rich="destaque">$2</em>');

  return out;
}

// ─────────────────────────────────────────────────────────────
// Decoração de fundo
// ─────────────────────────────────────────────────────────────

const TAMANHO_DECO_REM = { S: 10, M: 16, L: 24, XL: 32 };

const POSICAO_MAP = {
  'canto-sup-esq':   'top:-20px; left:20px;',
  'topo-centro':     'top:-30px; left:50%; transform:translateX(-50%);',
  'canto-sup-dir':   'top:-20px; right:20px;',
  'meio-esq':        'top:50%; left:-40px; transform:translateY(-50%);',
  'centro':          'top:50%; left:50%; transform:translate(-50%,-50%);',
  'meio-dir':        'top:50%; right:-40px; transform:translateY(-50%);',
  'canto-inf-esq':   'bottom:40px; left:40px;',
  'base-centro':     'bottom:40px; left:50%; transform:translateX(-50%);',
  'canto-inf-dir':   'bottom:40px; right:40px;',
};

export function decoracaoHtml(dna, { indiceSlide, palavraChave }) {
  const d = dna.decoracao;
  if (d.tipo === 'nenhum') return '';

  const tamanho = TAMANHO_DECO_REM[d.tamanho] || 32;
  const posicao = POSICAO_MAP[d.posicao] || POSICAO_MAP['canto-inf-dir'];
  const opacity = d.opacidade;
  const baseStyle = `position:absolute; ${posicao} font-family:var(--font-display); font-weight:900; font-size:${tamanho}rem; line-height:0.8; color:var(--accent); opacity:${opacity}; pointer-events:none; z-index:1;`;

  switch (d.tipo) {
    case 'numero-slide':
      return `<div class="deco" style="${baseStyle}">${String(indiceSlide).padStart(2,'0')}</div>`;
    case 'palavra-chave':
      if (!palavraChave) return '';
      return `<div class="deco" style="${baseStyle} font-style:italic;">${palavraChave}</div>`;
    case 'simbolo-asset':
    case 'padrao-asset':
      // Resolução de asset fica no integrador (recebe URL pronta)
      return '';
    default:
      return '';
  }
}

// ─────────────────────────────────────────────────────────────
// CSS global compartilhado (variáveis + reset + card frame)
// ─────────────────────────────────────────────────────────────

export function baseCss(dna) {
  const alpha = resolveAccentAlpha(dna);
  return `
  :root {
    --bg: ${dna.cores.bg_primario};
    --surface: ${dna.cores.bg_surface};
    --borda: ${dna.cores.borda};
    --text: ${dna.cores.texto_primario};
    --muted: ${dna.cores.texto_secundario};
    --accent: ${dna.cores.accent};
    --accent-alpha: ${alpha};
    --font-display: '${dna.tipografia.display}', Georgia, serif;
    --font-body: ${dna.tipografia.corpo}, -apple-system, sans-serif;
    --weight-display: ${dna.tipografia.peso_display};
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { background:var(--bg); font-family:var(--font-body); color:var(--text); }
  body { min-height:100vh; display:flex; align-items:center; justify-content:center; }
  .card {
    width:1080px; height:1350px; background:var(--bg);
    padding:88px 100px; display:flex; flex-direction:column;
    justify-content:space-between; position:relative; overflow:hidden;
  }
  .header { display:flex; justify-content:space-between; align-items:center; position:relative; z-index:2; }
  .logo { font-family:var(--font-display); font-weight:700; font-size:1.5rem; letter-spacing:-0.01em; }
  .pilar {
    font-size:0.72rem; letter-spacing:${labelSpacing(dna)};
    text-transform:${labelTransform(dna)};
    color:var(--muted); font-weight:700;
  }
  .content {
    display:flex; flex-direction:column; flex:1; justify-content:center;
    padding:20px 0; position:relative; z-index:2;
  }
  .footer {
    display:flex; ${dna.rodape.align === 'center' ? 'justify-content:center;' : dna.rodape.align === 'left' ? 'justify-content:flex-start;' : 'justify-content:space-between;'}
    align-items:center; border-top:1px solid var(--borda);
    padding-top:22px; font-size:0.95rem; color:var(--muted);
    position:relative; z-index:2;
  }
  .counter { color:var(--accent); font-weight:700; letter-spacing:0.18em; }
  .tags { display:flex; gap:8px; }
  .tag {
    font-size:0.66rem; letter-spacing:${labelSpacing(dna)};
    text-transform:${labelTransform(dna)};
    color:var(--accent); font-weight:700; padding:5px 11px;
    border:1px solid var(--borda); border-radius:999px;
  }
  [data-rich="destaque"] { ${destaqueCss(dna)} }
  [data-rich="forte"] { color:var(--accent); font-weight:800; font-style:normal; }
  [data-rich="riscado"] {
    position:relative; display:inline-block; color:var(--muted);
  }
  [data-rich="riscado"]::after {
    content:""; position:absolute; left:-4px; right:-4px; top:52%;
    height:4px; background:var(--accent); transform:skew(-4deg);
  }
  .label {
    font-size:0.72rem; letter-spacing:${labelSpacing(dna)};
    text-transform:${labelTransform(dna)};
    color:var(--accent); font-weight:800;
  }
  `;
}
