/**
 * POST /api/generate
 *
 * Gera conteúdo estruturado via Anthropic API.
 *
 * Diferente da versão anterior:
 *  - Não gera HTML; gera JSON tipado por slide (ver lib/render/schemas.js).
 *  - Não recebe variante visual; visual é 100% do Brand DNA (lib/render/presets.js).
 *  - Tom de voz vem do brand_profile — nenhuma marca está hard-coded.
 *
 * Body (JSON):
 * {
 *   pilar, rede_social, formato, pub_formato,
 *   tema | ideia_selecionada, gancho,
 *   brand_profile  // obrigatório pra gerar com voz da marca
 * }
 *
 * Retorna: { success, result: { tema, gancho, angulo, picah, slides:[...], legenda_ig, legenda_li, hashtags_ig, hashtags_li } }
 *
 * Variável necessária: ANTHROPIC_API_KEY
 */

import { brandContextBlock } from './_lib/brand.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL         = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Você é um estrategista sênior de marketing e branding que gera carrosséis e posts tipados para redes sociais B2B. Você recebe o DNA da marca (tom, pilares, público) e devolve JSON estruturado.

TOM DE VOZ: use sempre o tom descrito no DNA da marca. Se o DNA pede "direto, provocativo", fale assim. Se pede "acolhedor, didático", fale assim. Nunca clichês genéricos de influencer.

PÚBLICO: descrito no DNA. Fale com quem o DNA define — decisores, empreendedores, gestores, profissionais específicos.

METODOLOGIA PICAH (aplique ao menos 1):
- P = Polêmico   I = Inspirador   C = Conversável   A = Atual   H = Humorado

━━━ TIPOS DE SLIDE DISPONÍVEIS ━━━

Você escolhe o tipo de cada slide conforme o conteúdo. Os tipos e seus campos obrigatórios:

1. **capa** — abertura do carrossel
   { tipo:"capa", tagline?, titulo (rich), subtitulo }

2. **grid-2-colunas** — comparação simples lado a lado
   { tipo:"grid-2-colunas", titulo (rich),
     esquerda:{label, destaque, descricao},
     direita:{label, destaque, descricao} }

3. **lista-numerada** — 2 a 5 itens
   { tipo:"lista-numerada", label?, titulo (rich),
     itens:[{titulo (rich), descricao}] }

4. **grid-4-pilares** — exatamente 4 itens curtos
   { tipo:"grid-4-pilares", titulo (rich),
     pilares:[{label, texto}] }

5. **frase-destaque-com-box** — frase grande + caixa de apoio
   { tipo:"frase-destaque-com-box", label?, titulo (rich),
     box:{label, texto} }

6. **comparacao-contraste** — A (ruim) vs B (bom)
   { tipo:"comparacao-contraste", titulo (rich),
     caixa_a:{label, titulo, descricao},
     caixa_b:{label, titulo, descricao},
     fechamento (rich)? }

7. **cta-final** — último slide; método opcional + CTA
   { tipo:"cta-final", tagline?, titulo (rich),
     metodo?:{label, passos:[{destaque, frase (rich)}]},
     cta:{texto, url} }

8. **teste-pergunta** — pergunta + veredito condicional
   { tipo:"teste-pergunta", label?, pergunta (rich),
     veredito:[{condicao, texto, destaque?}] }

━━━ RICH TEXT INLINE (em qualquer campo marcado "rich") ━━━
Use 3 marcações leves, sem markdown adicional:
  _palavra_     → destaque principal (ex: "Sua marca tem _personalidade_")
  **palavra**   → palavra forte (ex: "**posicionamento**")
  ~~palavra~~   → riscado (ex: "não está no ~~visual~~")

Destaque APENAS 1-3 palavras por campo. Não destacar nada é pior que destacar a errada.

━━━ ESTRUTURA DE CARROSSEL (7-8 slides) ━━━
- Slide 1: sempre \`capa\` — hook forte, máx 15 palavras no título
- Slide 2-6: variar entre os tipos 2-6 e 8. NÃO repetir o mesmo tipo seguido.
  Escolha o tipo pelo conteúdo:
    * comparando 2 conceitos? → grid-2-colunas ou comparacao-contraste
    * 3-5 razões/sinais/etapas? → lista-numerada
    * 4 pilares/dimensões? → grid-4-pilares
    * frase de autoridade + explicação? → frase-destaque-com-box
    * diagnóstico "se sim / se não"? → teste-pergunta
- Último slide: sempre \`cta-final\`

━━━ ESTRUTURA DE POST ÚNICO (1 slide) ━━━
Use \`capa\` ou \`frase-destaque-com-box\`.

━━━ LIMITES DE CARACTERES (soft — prefira conciso) ━━━
- títulos: até 120
- descrições: até 180
- labels: até 30

━━━ LEGENDAS ━━━
LEGENDA INSTAGRAM: gancho na 1ª linha, parágrafos curtos, CTA antes das hashtags, 10-12 hashtags.
LEGENDA LINKEDIN: abertura profissional, análise aprofundada, CTA com URL da marca, 8-10 hashtags.

━━━ FORMATO DE RESPOSTA ━━━
Responda EXCLUSIVAMENTE com JSON válido. Sem markdown, sem crases, sem explicações, sem emojis no JSON (exceto se o brand_profile pedir emojis nas legendas).`;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const body = req.body || {};

  // Modo mock — retorna fixture bundlada, zero custo, zero latência.
  if (body.mock) {
    try {
      const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, '_fixtures', 'content.json'), 'utf8'));
      return res.status(200).json({ success: true, result: fixture, mock: true });
    } catch (e) {
      return res.status(500).json({ error: 'Falha ao ler fixture: ' + e.message });
    }
  }

  const { ANTHROPIC_API_KEY: apiKey } = process.env;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada no Vercel.' });
  }

  const {
    pilar             = 'Tecnologia e IA',
    rede_social       = 'Ambos',
    formato           = 'Carrossel',
    pub_formato       = 'feed',
    ideia_selecionada = null,
    tema              = '',
    gancho            = '',
    brand_profile     = null,
  } = body;

  const userPrompt = buildUserPrompt({ pilar, rede_social, formato, pub_formato, ideia_selecionada, tema, gancho, brand_profile });

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
        // Prompt caching: SYSTEM_PROMPT é idêntico entre chamadas, cacheia ~90% do custo.
        system:     [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages:   [{ role: 'user', content: userPrompt }],
        // Força saída estruturada via tool use — elimina JSON malformado.
        tools: [DELIVER_TOOL],
        tool_choice: { type: 'tool', name: 'deliver_content' },
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('[generate] Anthropic error:', err);
      return res.status(502).json({ error: `Anthropic API error: ${r.status}` });
    }

    const data  = await r.json();
    const usage = data.usage || {};

    // Procura o bloco tool_use na resposta.
    const toolUse = data.content?.find(b => b.type === 'tool_use');
    if (!toolUse?.input) {
      console.error('[generate] Sem tool_use:', JSON.stringify(data.content));
      return res.status(500).json({ error: 'Modelo não retornou tool_use estruturado.' });
    }

    return res.status(200).json({
      success: true,
      result: toolUse.input,
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
      },
    });

  } catch (err) {
    console.error('[generate]', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ── TOOL DEFINITION (JSON Schema) ────────────────────────────
// O modelo é forçado a chamar esta tool — o `input` é sempre JSON válido.
// Schema é intencionalmente leve no `slides[]` (additionalProperties:true)
// porque são 8 tipos discriminados; a validação fina fica no lib/render/schemas.js.
const DELIVER_TOOL = {
  name: 'deliver_content',
  description: 'Entrega o conteúdo completo da pauta em formato estruturado. Use SEMPRE esta tool para responder.',
  input_schema: {
    type: 'object',
    required: ['tema', 'gancho', 'angulo', 'picah', 'slides', 'legenda_ig', 'legenda_li', 'hashtags_ig', 'hashtags_li'],
    properties: {
      tema: { type: 'string', description: 'Título completo do conteúdo' },
      gancho: { type: 'string', description: 'Frase de abertura impactante' },
      angulo: { type: 'string', description: 'Como o conteúdo posiciona a marca estrategicamente' },
      picah: {
        type: 'array',
        items: { type: 'string', enum: ['P', 'I', 'C', 'A', 'H'] },
        minItems: 1,
      },
      slides: {
        type: 'array',
        minItems: 1,
        maxItems: 8,
        items: {
          type: 'object',
          required: ['tipo'],
          properties: {
            tipo: {
              type: 'string',
              enum: ['capa', 'grid-2-colunas', 'lista-numerada', 'grid-4-pilares', 'frase-destaque-com-box', 'comparacao-contraste', 'cta-final', 'teste-pergunta'],
            },
          },
          additionalProperties: true,
        },
      },
      legenda_ig: { type: 'string' },
      legenda_li: { type: 'string' },
      hashtags_ig: { type: 'array', items: { type: 'string' } },
      hashtags_li: { type: 'array', items: { type: 'string' } },
    },
  },
};

// ── HELPERS ───────────────────────────────────────────────────

const PUB_FORMAT_LABELS = {
  feed:  'Feed (post no grid, proporção 4:5 — legenda completa)',
  story: 'Story (vertical 9:16 — conteúdo direto, texto na própria imagem)',
  reels: 'Reels (vídeo curto — roteiro/script + legenda dinâmica)',
};

function buildUserPrompt({ pilar, rede_social, formato, pub_formato, ideia_selecionada, tema, gancho, brand_profile }) {
  const isCarrossel = formato === 'Carrossel';
  const pubLabel    = PUB_FORMAT_LABELS[pub_formato] || pub_formato;
  const brandBlock  = brandContextBlock(brand_profile);

  const temaTxt = ideia_selecionada?.titulo
    ? `Tema: "${ideia_selecionada.titulo}"`
    : tema ? `Tema: "${tema}"` : 'Sugira um tema relevante e atual alinhado aos pilares da marca.';
  const ganchoTxt = ideia_selecionada?.subtitulo
    ? `Gancho: "${ideia_selecionada.subtitulo}"`
    : gancho ? `Gancho: "${gancho}"` : 'Crie um gancho forte e original.';

  const slidesRule = isCarrossel
    ? `7 a 8 slides, começando em \`capa\` e terminando em \`cta-final\`. Variar os tipos conforme o conteúdo.`
    : `1 slide do tipo \`capa\` ou \`frase-destaque-com-box\`.`;

  return `Gere um conteúdo completo com os parâmetros abaixo.

${brandBlock}

PARÂMETROS DESTA PUBLICAÇÃO:
- Pilar editorial: ${pilar}
- Rede Social: ${rede_social}
- Formato de conteúdo: ${formato}
- Formato de publicação: ${pubLabel}
- ${temaTxt}
- ${ganchoTxt}

CARROSSEL: ${slidesRule}

Retorne EXATAMENTE este JSON (sem markdown, sem crases, sem explicações):

{
  "tema": "título completo do conteúdo",
  "gancho": "frase de abertura impactante (usada em legendas e prévia)",
  "angulo": "como este conteúdo posiciona a marca estrategicamente",
  "picah": ["P"],
  "slides": [
    /* cada item segue o schema do tipo escolhido — ver tipos disponíveis no system prompt.
       Exemplo de slide 1:
       { "tipo":"capa", "tagline":"...", "titulo":"Texto com _destaque_", "subtitulo":"..." }
    */
  ],
  "legenda_ig": "legenda completa para Instagram com CTA e 10-12 hashtags",
  "legenda_li": "legenda completa para LinkedIn com CTA e 8-10 hashtags",
  "hashtags_ig": ["#Tag1","#Tag2"],
  "hashtags_li": ["#Tag1","#Tag2"]
}`;
}

// extractJson removido — saída agora é via tool_use, JSON sempre válido.
