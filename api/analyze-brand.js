/**
 * POST /api/analyze-brand
 *
 * Busca o HTML público de uma URL, extrai cores e conteúdo relevante,
 * e pede ao Claude para identificar o DNA da marca.
 *
 * Body: { site_url: "https://suamarca.com.br" }
 * Retorna: { success: true, suggestions: { nome, descricao, proposta_valor,
 *            dor_principal, estilo, cor_primaria, cor_secundaria, cor_terciaria } }
 */

import { brandContextBlock } from './_lib/brand.js';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL         = 'claude-sonnet-4-6';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { ANTHROPIC_API_KEY: apiKey } = process.env;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada.' });

  const { site_url } = req.body || {};
  if (!site_url) return res.status(400).json({ error: 'site_url é obrigatório.' });

  // Valida URL
  let parsedUrl;
  try {
    parsedUrl = new URL(site_url.startsWith('http') ? site_url : `https://${site_url}`);
  } catch {
    return res.status(400).json({ error: 'URL inválida.' });
  }

  // Busca o HTML da página
  let rawHtml = '';
  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 10000);
    const r = await fetch(parsedUrl.toString(), {
      signal:  controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BrandAnalyzer/1.0)' },
    });
    clearTimeout(timeout);
    if (r.ok) rawHtml = await r.text();
  } catch {
    // Se não conseguir buscar, envia ao Claude só com a URL
  }

  // Extrai texto útil + cores do HTML
  const { pageText, colors } = extractFromHtml(rawHtml);

  const userPrompt = buildAnalysisPrompt(parsedUrl.toString(), pageText, colors);

  try {
    const r = await fetch(ANTHROPIC_API, {
      method:  'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 1024,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(502).json({ error: `Anthropic API error: ${r.status} — ${err}` });
    }

    const data    = await r.json();
    const raw     = data.content?.[0]?.text || '';
    const clean   = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const start   = clean.indexOf('{');
    const end     = clean.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('Resposta não contém JSON válido.');
    const result  = JSON.parse(clean.slice(start, end + 1));

    return res.status(200).json({ success: true, suggestions: result });

  } catch (err) {
    console.error('[analyze-brand]', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ── Helpers ────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é um especialista em branding e identidade visual.
Analise as informações de um site e extraia o DNA visual e estratégico da marca.
RESPONDA SEMPRE como JSON válido, sem markdown, sem explicações extras.`;

function buildAnalysisPrompt(url, pageText, colors) {
  const colorList = colors.length
    ? `\nCORES ENCONTRADAS NO HTML/CSS:\n${colors.slice(0, 40).map(c => `- ${c}`).join('\n')}`
    : '\n(Não foi possível extrair cores do HTML)';

  const textSnippet = pageText
    ? `\nCONTEÚDO DA PÁGINA (primeiros 2000 caracteres):\n${pageText.slice(0, 2000)}`
    : '';

  return `URL analisada: ${url}
${colorList}
${textSnippet}

Com base nas informações acima, identifique o DNA desta marca e retorne EXATAMENTE este JSON:
{
  "nome":           "Nome da empresa/marca (string curta)",
  "descricao":      "Descrição em 1-2 frases do que a empresa faz",
  "proposta_valor": "Proposta de valor percebida (1 frase)",
  "dor_principal":  "Principal dor ou necessidade do público desta marca (1 frase)",
  "estilo":         "Estilo visual percebido (ex: minimalista, moderno, ousado, corporativo)",
  "cor_primaria":   "#rrggbb — cor mais dominante/representativa da marca",
  "cor_secundaria": "#rrggbb — segunda cor mais presente",
  "cor_terciaria":  "#rrggbb — terceira cor identificada (pode ser branco, preto ou neutro)"
}

REGRAS:
- Cores DEVEM ser hex válidos (#rrggbb). Se não identificar, use: primária #333333, secundária #666666, terciária #ffffff.
- Não invente informações. Se não houver evidência suficiente para um campo, use string vazia "".
- Nome e descrição devem refletir o que está no site, não a URL.`;
}

function extractFromHtml(html) {
  if (!html) return { pageText: '', colors: [] };

  // Remove scripts, styles, SVGs e tags HTML para extrair texto limpo
  const textOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Extrai cores hex do HTML completo (inline styles + style tags + data attrs)
  const hexPattern = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
  const rawColors  = [];
  let m;
  while ((m = hexPattern.exec(html)) !== null) {
    const c = m[0].toLowerCase();
    // Normaliza shorthand para 6 dígitos
    const full = c.length === 4
      ? '#' + c[1]+c[1]+c[2]+c[2]+c[3]+c[3]
      : c;
    rawColors.push(full);
  }

  // Extrai cores rgb/rgba do HTML
  const rgbPattern = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi;
  while ((m = rgbPattern.exec(html)) !== null) {
    const hex = '#' + [m[1], m[2], m[3]].map(v => parseInt(v).toString(16).padStart(2, '0')).join('');
    rawColors.push(hex);
  }

  // Deduplica e remove preto puro, branco puro e tons cinza para deixar cores de marca
  const SKIP = new Set(['#000000','#ffffff','#fff','#000','#111111','#222222','#333333','#444444','#eeeeee','#f0f0f0','#f5f5f5','#fafafa','#cccccc','#999999','#888888','#aaaaaa','#dddddd']);
  const seen  = new Set();
  const colors = [];
  for (const c of rawColors) {
    if (seen.has(c) || SKIP.has(c)) continue;
    seen.add(c);
    colors.push(c);
  }

  return { pageText: textOnly, colors };
}
