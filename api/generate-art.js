/**
 * POST /api/generate-art
 *
 * Gera o HTML visual de um post Nexum360 via Anthropic API.
 *
 * Body (JSON):
 * { pauta: { tema, gancho, angulo_nexum, pilar, variante, formato, slides, fonte, ... } }
 *
 * Retorna: { success: true, html: "<!DOCTYPE html>..." }
 *
 * Variável necessária: ANTHROPIC_API_KEY
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL         = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Você é um designer front-end especialista em criar posts visuais HTML para a Nexum360.

Você cria arquivos HTML completos e autocontidos que representam posts visuais de 1080x1350px para Instagram/LinkedIn.

━━━ DESIGN SYSTEM NEXUM360 ━━━

VARIANTE DARK:
  --bg: #0a0a0a | --surface: #111111 | --border: #222222
  --accent: #c8a96e | --accent-alpha: rgba(200,169,110,0.1)
  --text: #f0f0f0 | --muted: #888888

VARIANTE BLUE:
  --bg: #070d1a | --surface: #0d1628 | --border: #1a2b47
  --accent: #4d8fda | --accent-alpha: rgba(77,143,218,0.12)
  --text: #f0f0f0 | --muted: #7a90b0

VARIANTE WHITE:
  --bg: #f5f4ef | --surface: #eeecea | --border: #d8d5cf
  --accent: #1a1a1a | --accent-alpha: rgba(26,26,26,0.06)
  --text: #1a1a1a | --muted: #666666

━━━ ESTRUTURA OBRIGATÓRIA ━━━

Card: 1080x1350px, padding: 88px 100px
Fonte heading: 'Playfair Display' (Google Fonts)
Fonte corpo: system-ui, -apple-system, sans-serif

HEADER (topo): logo "nexum360" (Playfair Display, 1.5rem) à esquerda + label do pilar à direita
FOOTER (base): "nexum360.com.br" à esquerda + tags temáticas à direita
CONTEÚDO: flex-direction column, justify-content center, gap variável

━━━ ELEMENTOS DO DESIGN ━━━

1. source-tag: "── FONTE · ANO" em uppercase, letra spacing 0.18em, cor muted
2. headline h1: Playfair Display, ~4rem, font-weight 700, line-height 1.1, letter-spacing -0.02em
   - Use <em> para palavra em itálico colorida com accent
3. body-text: 1.75rem, cor muted, line-height 1.6 — use <strong> para destaques
4. stat-numbers: flex row com 2–4 itens, cada um com valor grande (Playfair, 3.5rem, accent) + label (muted)
5. insight-box: background accent-alpha, border-left 2px solid accent, border-radius 0 8px 8px 0, padding 28px 32px
   - insight-label: 11px uppercase, letter-spacing 0.2em, cor accent
   - insight-text: Playfair italic, 2.2rem, cor text
6. accent-line: 56px × 2px, background accent
7. deco-number: número gigante (300-420px) em background com opacity 0.04, Playfair, cor accent, posição absolute
8. bullet-list: lista sem marcador, cada item com "→" prefix, font-size 1.5rem, cor text, gap 16px

━━━ TAMANHOS MÍNIMOS DE TEXTO (OBRIGATÓRIO — o card é 1080×1350 e será visualizado reduzido no feed) ━━━

NUNCA use tamanhos menores que os limites abaixo, mesmo que o layout "peça" algo menor:
- Descrições, corpo de texto de apoio, legendas explicativas: ≥ 1.3rem
- Subtítulos, citações curtas, itens de lista: ≥ 1.5rem
- Labels de seção em uppercase (source-tag, pilar-label, insight-label, counter): ≥ 0.72rem (letra-espaçada)
- Footer / assinatura / URL: ≥ 0.85rem
- Tags pill: ≥ 0.62rem

Se você se vir escrevendo font-size menor que 1rem para texto em lower-case (que não seja uppercase-label), PARE — aumente. Texto pequeno demais fica ilegível no Instagram.

━━━ REGRAS ━━━
- Retorne APENAS o HTML completo, sem markdown, sem explicações
- Inclua sempre as Google Fonts no <head>
- Use apenas CSS inline ou <style> — sem dependências externas além das fontes
- O card deve ter overflow: hidden
- NÃO adicione media queries com zoom/scale no body — o card é sempre 1080×1350 e será renderizado em PNG nesse tamanho.
- Seja criativo com o layout mas mantenha o design premium e minimalista
- Não use emojis no design
- Adapte os elementos ao conteúdo — não force todos os elementos em todo post`;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { ANTHROPIC_API_KEY: apiKey } = process.env;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada.' });

  const { pauta, slideIndex } = req.body || {};
  if (!pauta) return res.status(400).json({ error: 'pauta é obrigatório.' });

  const slide = pauta.slides?.[slideIndex ?? 0];
  const isCarousel = pauta.formato === 'Carrossel';
  const slideInfo = slide
    ? `\nSlide ${(slideIndex ?? 0) + 1}: "${slide.titulo}"\nTexto do slide: "${slide.texto}"`
    : '';
  const totalSlides = pauta.slides?.length || 1;
  const slideCounter = isCarousel ? `Slide ${(slideIndex ?? 0) + 1} de ${totalSlides}` : '';

  const userPrompt = `Crie o HTML visual completo para o seguinte post da Nexum360:

DADOS DO POST:
- Tema: ${pauta.tema}
- Gancho: ${pauta.gancho || ''}
- Ângulo Nexum360: ${pauta.angulo_nexum || ''}
- Pilar: ${pauta.pilar}
- Variante Visual: ${pauta.variante} (use as cores desta variante)
- Formato: ${pauta.formato}
- Rede Social: ${pauta.rede_social || 'Ambos'}
- Fonte/Referência: ${pauta.fonte || ''}
${slideInfo}
${slideCounter ? `- Contador: ${slideCounter}` : ''}

INSTRUÇÕES:
- Use a variante "${pauta.variante}" do design system
- O conteúdo principal é: "${slide?.titulo || pauta.tema}"
- Subtexto/desenvolvimento: "${slide?.texto || pauta.gancho || ''}"
- Ângulo estratégico para o footer ou insight box: "${pauta.angulo_nexum || ''}"
${pauta.fonte ? `- Cite a fonte "${pauta.fonte}" no design` : ''}
${isCarousel && slideCounter ? `- Inclua o contador "${slideCounter}" no footer` : ''}
- Escolha os elementos visuais mais adequados para este conteúdo específico
- Crie um layout que comunique o impacto da mensagem visualmente

Retorne apenas o HTML completo.`;

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
        max_tokens: 8096,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(502).json({ error: `Anthropic API error: ${r.status}` });
    }

    const data = await r.json();
    let html   = data.content?.[0]?.text || '';

    // Remove possível markdown code fence
    html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim();

    if (!html.startsWith('<!DOCTYPE') && !html.startsWith('<html')) {
      return res.status(500).json({ error: 'HTML gerado inválido.' });
    }

    return res.status(200).json({ success: true, html });

  } catch (err) {
    console.error('[generate-art]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
