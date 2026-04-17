/**
 * POST /api/refine
 *
 * Solicita alterações em uma pauta existente via Anthropic API.
 *
 * Body (JSON):
 * {
 *   pauta:     { tema, gancho, legenda_ig, legenda_li, slides, pilar, formato, ... }
 *   instrucao: "Deixe a legenda mais curta e direta..."
 * }
 *
 * Retorna JSON com os campos alterados:
 * { legenda_ig?, legenda_li?, tema?, gancho?, slides?, resposta? }
 *
 * Variável necessária: ANTHROPIC_API_KEY
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL         = 'claude-3-5-sonnet-20241022';

const SYSTEM_PROMPT = `Você é um estrategista sênior de marketing e branding da Nexum360.

Tom de voz da Nexum360:
- Direto, inteligente e provocativo
- Sem clichês e sem frases motivacionais vazias
- Linguagem de negócio, foco em clareza, profundidade e impacto
- Público-alvo: empresários, gestores e decisores

Você receberá os dados de uma pauta existente e uma instrução de alteração.
Aplique APENAS o que foi solicitado. Mantenha o restante intacto.

RESPONDA SEMPRE como JSON válido, sem markdown, sem explicações extras.`;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { ANTHROPIC_API_KEY: apiKey } = process.env;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada no Vercel.' });
  }

  const { pauta, instrucao } = req.body || {};
  if (!pauta || !instrucao) {
    return res.status(400).json({ error: 'pauta e instrucao são obrigatórios.' });
  }

  const userPrompt = `PAUTA ATUAL:
Tema: ${pauta.tema || ''}
Gancho: ${pauta.gancho || ''}
Pilar: ${pauta.pilar || ''}
Formato: ${pauta.formato || ''}
Rede Social: ${pauta.rede_social || ''}
Ângulo Nexum360: ${pauta.angulo_nexum || ''}
${pauta.slides?.length ? `Slides:\n${pauta.slides.map((s,i) => `  Slide ${i+1}: ${s.titulo} — ${s.texto}`).join('\n')}` : ''}
${pauta.legenda_ig ? `\nLegenda Instagram:\n${pauta.legenda_ig}` : ''}
${pauta.legenda_li ? `\nLegenda LinkedIn:\n${pauta.legenda_li}` : ''}

INSTRUÇÃO DO USUÁRIO:
"${instrucao}"

Retorne APENAS os campos que precisam ser alterados, no formato JSON:
{
  "tema":        "..." (se alterado),
  "gancho":      "..." (se alterado),
  "angulo_nexum":"..." (se alterado),
  "slides":      [...] (se alterado — mantenha todos os 8 slides),
  "legenda_ig":  "..." (se alterado),
  "legenda_li":  "..." (se alterado),
  "resposta":    "Explicação breve do que foi alterado"
}

Inclua apenas os campos que foram modificados. O campo "resposta" é obrigatório.`;

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
      console.error('[refine] Anthropic error:', err);
      return res.status(502).json({ error: `Anthropic API error: ${r.status}` });
    }

    const data    = await r.json();
    const raw     = data.content?.[0]?.text || '';
    const jsonStr = extractJson(raw);
    const result  = JSON.parse(jsonStr);

    return res.status(200).json({ success: true, result });

  } catch (err) {
    console.error('[refine]', err.message);
    return res.status(500).json({ error: err.message });
  }
}

function extractJson(text) {
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Resposta não contém JSON válido.');
  return clean.slice(start, end + 1);
}
