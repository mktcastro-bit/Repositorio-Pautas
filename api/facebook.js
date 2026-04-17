/**
 * POST /api/facebook
 *
 * Publica na Página do Facebook via Meta Graph API.
 *
 * Body (JSON):
 * {
 *   type:      "single" | "carousel",
 *   caption:   "Texto da legenda...",
 *   imageUrl:  "https://..." (para single)
 *   imageUrls: ["https://...", ...] (para carousel — máx 10)
 * }
 *
 * Variáveis de ambiente necessárias:
 *   FACEBOOK_PAGE_ID           — ID numérico da Página do Facebook
 *   FACEBOOK_PAGE_ACCESS_TOKEN — Token de acesso da Página (longa duração)
 */

const GRAPH = 'https://graph.facebook.com/v19.0';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { FACEBOOK_PAGE_ID: pageId, FACEBOOK_PAGE_ACCESS_TOKEN: token } = process.env;

  if (!pageId || !token) {
    return res.status(500).json({
      error: 'Variáveis FACEBOOK_PAGE_ID e FACEBOOK_PAGE_ACCESS_TOKEN não configuradas.',
    });
  }

  const { type = 'single', caption = '', imageUrl, imageUrls = [] } = req.body || {};

  try {
    let postId;

    if (type === 'carousel') {
      if (!imageUrls.length) {
        return res.status(400).json({ error: 'imageUrls é obrigatório para carousel.' });
      }

      // Upload cada foto sem publicar, depois criar feed com attached_media
      const attached = [];
      for (const url of imageUrls.slice(0, 10)) {
        const r = await graphPost(`/${pageId}/photos`, {
          url,
          published:    false,
          access_token: token,
        });
        if (r.error) throw new Error(`Erro no upload: ${r.error.message}`);
        attached.push({ media_fbid: r.id });
      }

      const feed = await graphPost(`/${pageId}/feed`, {
        message:        caption,
        attached_media: attached,
        access_token:   token,
      });
      if (feed.error) throw new Error(feed.error.message);
      postId = feed.id;

    } else {
      if (!imageUrl) {
        return res.status(400).json({ error: 'imageUrl é obrigatório para post único.' });
      }

      const r = await graphPost(`/${pageId}/photos`, {
        url:          imageUrl,
        message:      caption,
        access_token: token,
      });
      if (r.error) throw new Error(r.error.message);
      postId = r.id;
    }

    return res.status(200).json({
      success:  true,
      post_id:  postId,
      platform: 'facebook',
      message:  'Publicado com sucesso no Facebook!',
    });

  } catch (err) {
    console.error('[Facebook]', err.message);
    return res.status(500).json({ error: err.message });
  }
}

async function graphPost(path, body) {
  const r = await fetch(`${GRAPH}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  return r.json();
}
