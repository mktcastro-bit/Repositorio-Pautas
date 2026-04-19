/**
 * POST /api/suggest-brand-field
 *
 * Gera sugestões para campos específicos do DNA da marca.
 *
 * Body: {
 *   field:   "tom_de_voz" | "proposta_valor"
 *   context: { nome, descricao, areas, perfil, cargo, maturidade,
 *              dor_principal, tom, sofisticacao, linguagem, evitar }
 * }
 *
 * Retorna:
 *   tom_de_voz:    { suggestion: { tom, sofisticacao, linguagem, evitar, racional } }
 *   proposta_valor:{ suggestion: { opcoes: [string, string, string] } }
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL         = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Você é um especialista em branding e estratégia de comunicação.
Analisa marcas e sugere identidade de voz e posicionamento com base no contexto fornecido.
RESPONDA SEMPRE como JSON válido, sem markdown, sem explicações extras.`;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { ANTHROPIC_API_KEY: apiKey } = process.env;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada.' });

  const { field, context } = req.body || {};
  if (!field || !context) return res.status(400).json({ error: 'field e context são obrigatórios.' });

  const builders = { tom_de_voz: buildVozPrompt, proposta_valor: buildPropostaPrompt };
  const builder  = builders[field];
  if (!builder) return res.status(400).json({ error: `field inválido: ${field}. Use tom_de_voz ou proposta_valor.` });

  const userPrompt = builder(context);

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

    const data   = await r.json();
    const raw    = data.content?.[0]?.text || '';
    const clean  = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const start  = clean.indexOf('{');
    const end    = clean.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('Resposta não contém JSON válido.');
    const result = JSON.parse(clean.slice(start, end + 1));

    return res.status(200).json({ success: true, suggestion: result });

  } catch (err) {
    console.error('[suggest-brand-field]', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ── Prompt builders ────────────────────────────────────────────

function contextSummary(ctx) {
  const parts = [];
  if (ctx.nome)           parts.push(`Marca: ${ctx.nome}`);
  if (ctx.descricao)      parts.push(`O que faz: ${ctx.descricao}`);
  if (ctx.areas?.length)  parts.push(`Áreas: ${ctx.areas.join(', ')}`);
  if (ctx.perfil)         parts.push(`Mercado: ${ctx.perfil}`);
  if (ctx.cargo?.length)  parts.push(`Público-alvo: ${ctx.cargo.join(', ')}`);
  if (ctx.maturidade)     parts.push(`Maturidade do público: ${ctx.maturidade}`);
  if (ctx.dor_principal)  parts.push(`Dor principal do cliente: ${ctx.dor_principal}`);
  return parts.map(p => `- ${p}`).join('\n');
}

function buildVozPrompt(ctx) {
  return `Com base nas informações desta marca, sugira a voz ideal de comunicação.

CONTEXTO DA MARCA:
${contextSummary(ctx)}

Sugira a voz de comunicação mais adequada para essa marca. Escolha entre os tons disponíveis:
direto, provocativo, inteligente, inspirador, educativo, humorado, formal, descontraído, técnico, emocional

RETORNE EXATAMENTE este JSON:
{
  "tom":          ["tom1", "tom2", "tom3"],
  "sofisticacao": "premium" | "popular" | "técnica",
  "linguagem":    "direta" | "emocional" | "educativa" | "provocativa",
  "evitar":       ["item1", "item2", "item3"],
  "racional":     "Explicação em 2-3 frases do porquê dessa voz para essa marca específica"
}

REGRAS:
- "tom" deve ter 2 a 4 itens — escolha os que melhor representam essa marca
- "evitar" deve ter 3 a 5 itens específicos e acionáveis (não genéricos como "ser ruim")
- "racional" deve ser direto e justificar as escolhas com base no contexto da marca`;
}

function buildPropostaPrompt(ctx) {
  return `Com base nas informações desta marca, crie 3 opções de proposta de valor.

CONTEXTO DA MARCA:
${contextSummary(ctx)}
${ctx.tom?.length    ? `- Tom de voz: ${ctx.tom.join(', ')}`           : ''}
${ctx.sofisticacao   ? `- Sofisticação: ${ctx.sofisticacao}`            : ''}
${ctx.linguagem      ? `- Linguagem: ${ctx.linguagem}`                  : ''}

RETORNE EXATAMENTE este JSON:
{
  "opcoes": [
    "Proposta de valor 1 — direta e impactante (máx 15 palavras)",
    "Proposta de valor 2 — focada na transformação do cliente (máx 15 palavras)",
    "Proposta de valor 3 — focada no diferencial competitivo (máx 15 palavras)"
  ]
}

REGRAS:
- Cada proposta deve ser uma frase completa, clara e única
- Não use clichês como "soluções inovadoras", "excelência", "qualidade acima de tudo"
- Cada opção deve ter um ângulo diferente (resultado, transformação, diferencial)
- O tom deve refletir a voz da marca quando disponível
- Máximo 15 palavras por opção`;
}
