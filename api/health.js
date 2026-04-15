// GET /api/health — verifica se a API está online e as variáveis configuradas
export default function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const vars = {
    instagram: {
      user_id:      !!process.env.INSTAGRAM_USER_ID,
      access_token: !!process.env.INSTAGRAM_ACCESS_TOKEN,
    },
    linkedin: {
      access_token: !!process.env.LINKEDIN_ACCESS_TOKEN,
      person_id:    !!process.env.LINKEDIN_PERSON_ID,
    },
    vercel_url: process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'não detectada',
  };

  const allOk =
    vars.instagram.user_id &&
    vars.instagram.access_token &&
    vars.linkedin.access_token &&
    vars.linkedin.person_id;

  res.status(200).json({
    status: allOk ? 'ok' : 'incompleto',
    message: allOk
      ? 'API pronta para publicar.'
      : 'Algumas variáveis de ambiente estão faltando.',
    config: vars,
    timestamp: new Date().toISOString(),
  });
}
