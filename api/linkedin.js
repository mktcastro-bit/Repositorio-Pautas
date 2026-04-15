/**
 * POST /api/linkedin
 *
 * Publica no LinkedIn via UGC Posts API.
 *
 * Body (JSON):
 * {
 *   caption:  "Texto da legenda...",
 *   imageUrl: "https://..." (URL pública da imagem)
 * }
 *
 * Variáveis de ambiente necessárias:
 *   LINKEDIN_ACCESS_TOKEN — Token OAuth 2.0 (válido por 60 dias)
 *   LINKEDIN_PERSON_ID    — URN do perfil (ex: "urn:li:person:ABC123")
 *                           Obtido via GET https://api.linkedin.com/v2/me
 */

const LI_API  = 'https://api.linkedin.com/v2';
const LI_REST = 'https://api.linkedin.com/rest';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { LINKEDIN_ACCESS_TOKEN: token, LINKEDIN_PERSON_ID: personId } = process.env;

  if (!token || !personId) {
    return res.status(500).json({
      error: 'Variáveis LINKEDIN_ACCESS_TOKEN e LINKEDIN_PERSON_ID não configuradas.',
    });
  }

  const { caption = '', imageUrl } = req.body || {};

  if (!imageUrl) {
    return res.status(400).json({ error: 'imageUrl é obrigatório.' });
  }

  try {
    const author = personId.startsWith('urn:li:') ? personId : `urn:li:person:${personId}`;

    // ── 1. Registrar upload da imagem ─────────────────────────
    const registerBody = {
      registerUploadRequest: {
        owner:          author,
        recipes:        ['urn:li:digitalmediaRecipe:feedshare-image'],
        serviceRelationships: [{
          identifier:       'urn:li:userGeneratedContent',
          relationshipType: 'OWNER',
        }],
      },
    };

    const registerRes = await liPost(`${LI_API}/assets?action=registerUpload`, token, registerBody);

    if (!registerRes.value) {
      throw new Error(`Erro ao registrar upload: ${JSON.stringify(registerRes)}`);
    }

    const uploadUrl = registerRes.value.uploadMechanism[
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
    ].uploadUrl;
    const assetUrn = registerRes.value.asset;

    // ── 2. Fazer upload da imagem (busca a URL pública e envia) ─
    const imgRes  = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Não foi possível baixar a imagem: ${imageUrl}`);
    const imgBlob = await imgRes.arrayBuffer();

    const uploadRes = await fetch(uploadUrl, {
      method:  'PUT',
      headers: {
        'Authorization':  `Bearer ${token}`,
        'Content-Type':   imgRes.headers.get('content-type') || 'image/png',
      },
      body: imgBlob,
    });

    if (!uploadRes.ok) {
      throw new Error(`Erro no upload da imagem para o LinkedIn: ${uploadRes.status}`);
    }

    // ── 3. Criar o post UGC ────────────────────────────────────
    const postBody = {
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary:    { text: caption },
          shareMediaCategory: 'IMAGE',
          media: [{
            status:      'READY',
            description: { text: caption.substring(0, 200) },
            media:       assetUrn,
            title:       { text: 'Nexum360' },
          }],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const postRes = await liPost(`${LI_API}/ugcPosts`, token, postBody);

    if (postRes.id) {
      return res.status(200).json({
        success:  true,
        post_id:  postRes.id,
        platform: 'linkedin',
        message:  'Publicado com sucesso no LinkedIn!',
      });
    }

    throw new Error(`Resposta inesperada: ${JSON.stringify(postRes)}`);

  } catch (err) {
    console.error('[LinkedIn]', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ── HELPERS ───────────────────────────────────────────────────

async function liPost(url, token, body) {
  const r = await fetch(url, {
    method:  'POST',
    headers: {
      'Authorization':               `Bearer ${token}`,
      'Content-Type':                'application/json',
      'X-Restli-Protocol-Version':   '2.0.0',
      'LinkedIn-Version':            '202304',
    },
    body: JSON.stringify(body),
  });
  // LinkedIn retorna 201 sem body em alguns casos
  const text = await r.text();
  try { return text ? JSON.parse(text) : { id: r.headers.get('x-restli-id') }; }
  catch { return { raw: text }; }
}
