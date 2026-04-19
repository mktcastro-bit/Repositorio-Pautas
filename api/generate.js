/**
 * POST /api/generate
 *
 * Gera conteúdo Nexum360 via Anthropic API (claude-3-5-haiku).
 *
 * Body (JSON):
 * {
 *   pilar:      "Tecnologia e IA" | "Estratégia de Marca" | ...
 *   rede_social: "Instagram" | "LinkedIn" | "Ambos"
 *   formato:    "Carrossel" | "Post Único" | "Artigo" | "Notícia"
 *   variante:   "Dark" | "Blue" | "White"
 *   tema:       "..." (opcional — se não fornecido, IA sugere)
 *   gancho:     "..." (opcional — frase de abertura sugerida)
 * }
 *
 * Retorna JSON estruturado com: tema, gancho, slides, legenda_ig,
 * legenda_li, picah, angulo_nexum, hashtags_ig, hashtags_li
 *
 * Variável necessária: ANTHROPIC_API_KEY
 */

import { brandContextBlock } from './_lib/brand.js';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL         = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Você é um estrategista sênior de marketing e branding da Nexum360, especialista em posicionamento de marca, marketing orientado a resultados, tecnologia e inteligência artificial aplicada a negócios.

A Nexum360 atua com estratégia, branding, marketing, dados, automação e crescimento empresarial.

TOM DE VOZ:
- Direto, inteligente e provocativo
- Sem clichês e sem frases motivacionais vazias
- Linguagem de negócio (não linguagem de influencer)
- Pode confrontar o leitor
- Foco em clareza, profundidade e impacto
- Fale com empresários, gestores e decisores — não com iniciantes

PILARES DE CONTEÚDO:
1. Estratégia de Marca
2. Marketing e Performance
3. Tecnologia e IA
4. Mentalidade e Gestão Empresarial
5. Bastidores e Diagnóstico de Negócios

METODOLOGIA PICAH — aplique ao menos um:
- P = Polêmico
- I = Inspirador
- C = Conversável
- A = Atual
- H = Humorado

ESTRUTURA CARROSSEL (8 slides):
- Slide 1: Hook forte (impacto ou provocação) — máx 15 palavras
- Slides 2–6: Desenvolvimento progressivo — cada slide com 1 ideia clara, máx 40 palavras
- Slide 7: Insight ou virada de chave — máx 30 palavras
- Slide 8: Fechamento forte + CTA — máx 40 palavras

ESTRUTURA POST ÚNICO:
- Frase principal forte e compartilhável (máx 20 palavras)
- Subtexto de apoio (máx 30 palavras)

LEGENDA INSTAGRAM:
- Gancho na 1ª linha (sem hashtag)
- Desenvolvimento em parágrafos curtos
- CTA claro antes das hashtags
- 12 hashtags no final

LEGENDA LINKEDIN:
- Abertura profissional e provocativa
- Análise mais aprofundada (pode ter mais texto)
- CTA com referência ao nexum360.com.br
- 10 hashtags no final

RESPONDA SEMPRE como JSON válido, sem markdown, sem código extra. Use o schema exato fornecido.`;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { ANTHROPIC_API_KEY: apiKey } = process.env;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada no Vercel.' });
  }

  const {
    pilar             = 'Tecnologia e IA',
    rede_social        = 'Ambos',
    formato           = 'Carrossel',
    variante          = 'Dark',
    pub_formato       = 'feed',
    ideia_selecionada = null,
    tema              = '',
    gancho            = '',
    brand_profile     = null,
  } = req.body || {};

  const userPrompt = buildUserPrompt({ pilar, rede_social, formato, variante, pub_formato, ideia_selecionada, tema, gancho, brand_profile });

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
        max_tokens: 4096,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('[generate] Anthropic error:', err);
      return res.status(502).json({ error: `Anthropic API error: ${r.status}` });
    }

    const data  = await r.json();
    const raw   = data.content?.[0]?.text || '';

    // Extrai JSON da resposta (remove possível markdown)
    const jsonStr = extractJson(raw);
    const result  = JSON.parse(jsonStr);

    return res.status(200).json({ success: true, result });

  } catch (err) {
    console.error('[generate]', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ── HELPERS ───────────────────────────────────────────────────

const PUB_FORMAT_LABELS = {
  feed:  'Feed (post no grid do Instagram, proporção 4:5 — legenda completa)',
  story: 'Story (vertical 9:16 — conteúdo direto, sem legenda longa, texto na própria imagem)',
  reels: 'Reels (vídeo curto — forneça roteiro/script e legenda dinâmica para o vídeo)',
};

function buildUserPrompt({ pilar, rede_social, formato, variante, pub_formato, ideia_selecionada, tema, gancho, brand_profile }) {
  const isCarrossel  = formato === 'Carrossel';
  const pubLabel     = PUB_FORMAT_LABELS[pub_formato] || pub_formato;
  const brandBlock   = brandContextBlock(brand_profile);
  const temaTxt  = ideia_selecionada?.titulo
    ? `O tema é: "${ideia_selecionada.titulo}"`
    : tema ? `O tema é: "${tema}"` : 'Sugira um tema relevante e atual para o posicionamento da Nexum360.';
  const ganchoTxt = ideia_selecionada?.subtitulo
    ? `O gancho de abertura é: "${ideia_selecionada.subtitulo}"`
    : gancho ? `O gancho de abertura sugerido é: "${gancho}"` : 'Crie um gancho forte e original.';

  const slidesSchema = isCarrossel
    ? `"slides": [{ "numero": 1, "titulo": "...", "texto": "..." }, ... (8 slides)]`
    : `"slides": [{ "numero": 1, "titulo": "Frase principal", "texto": "Subtexto de apoio" }]`;

  return `Crie um conteúdo completo para esta marca com os parâmetros abaixo.

${brandBlock}
PARÂMETROS:
- Pilar: ${pilar}
- Rede Social: ${rede_social}
- Formato de conteúdo: ${formato}
- Formato de publicação: ${pubLabel}
- Variante Visual: ${variante}
- Tema: ${temaTxt}
- Gancho: ${ganchoTxt}

RETORNE EXATAMENTE este JSON (sem markdown, sem explicações):
{
  "tema": "título completo e direto do conteúdo",
  "gancho": "frase de abertura impactante",
  "angulo_nexum": "como este conteúdo posiciona a Nexum360 estrategicamente",
  "picah": ["P"],
  ${slidesSchema},
  "legenda_ig": "legenda completa para Instagram com CTA e 12 hashtags",
  "legenda_li": "legenda completa para LinkedIn com CTA e 10 hashtags",
  "hashtags_ig": ["#Tag1", "#Tag2"],
  "hashtags_li": ["#Tag1", "#Tag2"]
}`;
}

function extractJson(text) {
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Resposta não contém JSON válido.');
  const raw = clean.slice(start, end + 1);

  // Sanitiza quebras de linha literais dentro de strings JSON
  let sanitized = '';
  let inString  = false;
  let escape    = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escape) { sanitized += ch; escape = false; continue; }
    if (ch === '\\') { escape = true; sanitized += ch; continue; }
    if (ch === '"') { inString = !inString; sanitized += ch; continue; }
    if (inString && (ch === '\n' || ch === '\r')) { sanitized += '\\n'; continue; }
    sanitized += ch;
  }
  return sanitized;
}
