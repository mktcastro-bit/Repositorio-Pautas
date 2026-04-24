/**
 * POST /api/suggest-ideas
 *
 * Gera 6 ideias de conteúdo (título + subtítulo) para o usuário escolher.
 *
 * Body: { pilar, rede_social, formato, variante, sugestao }
 * Retorna: { success: true, ideas: [{ titulo, subtitulo }] }
 */

import { brandContextBlock } from './_lib/brand.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL         = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Você é um estrategista sênior de conteúdo, especialista em posicionamento de marca, marketing e inteligência artificial aplicada a negócios.

TOM DE VOZ:
- Direto, inteligente e provocativo
- Sem clichês e sem frases motivacionais vazias
- Linguagem de negócio, não de influencer
- Fale com empresários, gestores e decisores

Gere ideias de conteúdo com títulos fortes e subtítulos que explicam o ângulo estratégico.
RESPONDA SEMPRE como JSON válido, sem markdown, sem explicações extras.`;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const body = req.body || {};

  // Modo mock — retorna fixture bundlada, zero custo, zero latência.
  if (body.mock) {
    try {
      const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, '_fixtures', 'ideas.json'), 'utf8'));
      return res.status(200).json({ success: true, ideas: fixture.ideas || [], mock: true });
    } catch (e) {
      return res.status(500).json({ error: 'Falha ao ler fixture: ' + e.message });
    }
  }

  const { ANTHROPIC_API_KEY: apiKey } = process.env;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada.' });

  const {
    pilar            = 'Tecnologia e IA',
    rede_social       = 'Ambos',
    formato          = 'Carrossel',
    variante         = 'Dark',
    sugestao         = '',
    temas_existentes = [],
    brand_profile    = null,
  } = body;

  const brandBlock = brandContextBlock(brand_profile);
  const marcaNome  = brand_profile?.identidade?.nome || 'a marca';

  const sugestaoTxt = sugestao
    ? `O usuário sugeriu a seguinte direção: "${sugestao}". Use como inspiração, mas explore variações.`
    : `Sugira ideias variadas e relevantes para o posicionamento atual de ${marcaNome}.`;

  const existentesTxt = temas_existentes.length
    ? `\nCONTEÚDO JÁ EXISTENTE NO REPOSITÓRIO — não repita nem faça variações próximas destes temas:\n${temas_existentes.map(t => `- "${t}"`).join('\n')}\n`
    : '';

  const userPrompt = `Gere 6 ideias de conteúdo distintas para ${marcaNome}.

${brandBlock}
PARÂMETROS:
- Pilar: ${pilar}
- Rede Social: ${rede_social}
- Formato: ${formato}
- Variante Visual: ${variante}
- Direção: ${sugestaoTxt}
${existentesTxt}
Cada ideia deve ter:
- "titulo": título direto e impactante (máx 12 palavras), que funcione como hook
- "subtitulo": ângulo ou gancho estratégico (máx 20 palavras), que explica o porquê do post

As 6 ideias devem ser DISTINTAS entre si — variando abordagem, provocação ou público-alvo dentro do mesmo pilar.

RETORNE EXATAMENTE este JSON (sem markdown):
{
  "ideas": [
    { "titulo": "...", "subtitulo": "..." },
    { "titulo": "...", "subtitulo": "..." },
    { "titulo": "...", "subtitulo": "..." },
    { "titulo": "...", "subtitulo": "..." },
    { "titulo": "...", "subtitulo": "..." },
    { "titulo": "...", "subtitulo": "..." }
  ]
}`;

  const tool = {
    name: 'deliver_ideas',
    description: 'Entrega 6 ideias de conteúdo em formato estruturado. Use SEMPRE esta tool para responder.',
    input_schema: {
      type: 'object',
      required: ['ideas'],
      properties: {
        ideas: {
          type: 'array',
          minItems: 6, maxItems: 6,
          items: {
            type: 'object',
            required: ['titulo', 'subtitulo'],
            properties: {
              titulo: { type: 'string', description: 'Título direto e impactante (máx 12 palavras)' },
              subtitulo: { type: 'string', description: 'Ângulo ou gancho estratégico (máx 20 palavras)' },
            },
          },
        },
      },
    },
  };

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
        // Prompt caching: SYSTEM_PROMPT é idêntico entre chamadas, cacheia ~90% do custo.
        system:     [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages:   [{ role: 'user', content: userPrompt }],
        tools: [tool],
        tool_choice: { type: 'tool', name: 'deliver_ideas' },
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(502).json({ error: `Anthropic API error: ${r.status} — ${err}` });
    }

    const data = await r.json();
    const toolUse = data.content?.find(b => b.type === 'tool_use');
    if (!toolUse?.input) {
      console.error('[suggest-ideas] Sem tool_use:', JSON.stringify(data.content));
      return res.status(500).json({ error: 'Modelo não retornou tool_use estruturado.' });
    }

    return res.status(200).json({ success: true, ideas: toolUse.input.ideas || [] });

  } catch (err) {
    console.error('[suggest-ideas]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
