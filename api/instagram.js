/**
 * POST /api/instagram
 *
 * Publica no Instagram via Meta Graph API.
 *
 * Body (JSON):
 * {
 *   type:      "single" | "carousel" | "story" | "reels",
 *   caption:   "Texto da legenda...",
 *   imageUrl:  "https://..." (para single e story)
 *   imageUrls: ["https://...", ...] (para carousel — máx 10)
 *   videoUrl:  "https://...mp4" (para reels)
 * }
 *
 * Variáveis de ambiente necessárias:
 *   INSTAGRAM_USER_ID      — ID numérico da conta Instagram Business
 *   INSTAGRAM_ACCESS_TOKEN — Token de longa duração (válido por 60 dias)
 */

const GRAPH = 'https://graph.facebook.com/v19.0';

export default async function handler(req, res) {
  // Preflight CORS
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { INSTAGRAM_USER_ID: userId, INSTAGRAM_ACCESS_TOKEN: token } = process.env;

  if (!userId || !token) {
    return res.status(500).json({
      error: 'Variáveis INSTAGRAM_USER_ID e INSTAGRAM_ACCESS_TOKEN não configuradas.',
    });
  }

  const { type = 'single', caption = '', imageUrl, imageUrls = [], videoUrl } = req.body || {};

  try {
    let postId;

    if (type === 'story') {
      // ── STORY ─────────────────────────────────────────────────
      if (!imageUrl) return res.status(400).json({ error: 'imageUrl é obrigatório para story.' });

      const container = await graphPost(`/${userId}/media`, {
        image_url:    imageUrl,
        media_type:   'IMAGE',
        access_token: token,
      });
      if (container.error) throw new Error(container.error.message);

      await waitForStatus(container.id, token);

      const pub = await graphPost(`/${userId}/media_publish`, {
        creation_id:  container.id,
        access_token: token,
      });
      if (pub.error) throw new Error(pub.error.message);
      postId = pub.id;

    } else if (type === 'reels') {
      // ── REELS ─────────────────────────────────────────────────
      if (!videoUrl) return res.status(400).json({ error: 'videoUrl é obrigatório para reels.' });

      const container = await graphPost(`/${userId}/media`, {
        media_type:   'REELS',
        video_url:    videoUrl,
        caption:      caption,
        access_token: token,
      });
      if (container.error) throw new Error(container.error.message);

      // Reels levam mais tempo para processar (até 5 min)
      await waitForStatus(container.id, token, 300000);

      const pub = await graphPost(`/${userId}/media_publish`, {
        creation_id:  container.id,
        access_token: token,
      });
      if (pub.error) throw new Error(pub.error.message);
      postId = pub.id;

    } else if (type === 'carousel') {
      // ── CARROSSEL ─────────────────────────────────────────────
      if (!imageUrls.length) {
        return res.status(400).json({ error: 'imageUrls é obrigatório para carousel.' });
      }

      // 1. Criar container para cada slide
      const itemIds = [];
      for (const url of imageUrls.slice(0, 10)) {
        const r = await graphPost(`/${userId}/media`, {
          image_url:        url,
          is_carousel_item: true,
          access_token:     token,
        });
        if (r.error) throw new Error(`Erro no slide: ${r.error.message}`);
        itemIds.push(r.id);
      }

      // 2. Criar container do carrossel
      const carousel = await graphPost(`/${userId}/media`, {
        media_type:   'CAROUSEL',
        children:     itemIds.join(','),
        caption:      caption,
        access_token: token,
      });
      if (carousel.error) throw new Error(carousel.error.message);

      // 3. Aguardar processamento
      await waitForStatus(carousel.id, token);

      // 4. Publicar
      const pub = await graphPost(`/${userId}/media_publish`, {
        creation_id:  carousel.id,
        access_token: token,
      });
      if (pub.error) throw new Error(pub.error.message);
      postId = pub.id;

    } else {
      // ── POST ÚNICO ────────────────────────────────────────────
      if (!imageUrl) {
        return res.status(400).json({ error: 'imageUrl é obrigatório para post único.' });
      }

      // 1. Criar container
      const container = await graphPost(`/${userId}/media`, {
        image_url:    imageUrl,
        caption:      caption,
        access_token: token,
      });
      if (container.error) throw new Error(container.error.message);

      // 2. Aguardar processamento
      await waitForStatus(container.id, token);

      // 3. Publicar
      const pub = await graphPost(`/${userId}/media_publish`, {
        creation_id:  container.id,
        access_token: token,
      });
      if (pub.error) throw new Error(pub.error.message);
      postId = pub.id;
    }

    return res.status(200).json({
      success:  true,
      post_id:  postId,
      platform: 'instagram',
      message:  'Publicado com sucesso no Instagram!',
    });

  } catch (err) {
    console.error('[Instagram]', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ── HELPERS ───────────────────────────────────────────────────

async function graphPost(path, body) {
  const r = await fetch(`${GRAPH}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  return r.json();
}

async function graphGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const r  = await fetch(`${GRAPH}${path}?${qs}`);
  return r.json();
}

// Aguarda container ficar com status FINISHED (máx 30s)
async function waitForStatus(containerId, token, maxMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const data = await graphGet(`/${containerId}`, {
      fields:       'status_code',
      access_token: token,
    });
    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR')    throw new Error('Container com erro no Instagram.');
    await sleep(2000);
  }
  throw new Error('Timeout aguardando processamento do container.');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
