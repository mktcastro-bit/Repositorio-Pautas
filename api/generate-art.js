/**
 * POST /api/generate-art
 *
 * Agora é um WRAPPER LOCAL — não chama Anthropic.
 * Recebe conteúdo tipado + Brand DNA e renderiza o HTML via lib/render.
 *
 * Body (JSON):
 * {
 *   conteudo: { tipo, ...campos },  // objeto que valida em SlideContentSchema
 *   dna:      BrandDNA,             // tokens visuais da marca
 *   indice:   number,               // 1-based
 *   total:    number,               // total de slides
 *   pilar:    string,
 *   tags?:    string[],
 *   palavra_chave_deco?: string
 * }
 *
 * Retorna: { success: true, html: "<!DOCTYPE html>..." }
 *
 * COMPATIBILIDADE LEGADA:
 * Se o body vier no formato antigo ({ pauta: {...} }) com um `slides[]` de
 * titulo/texto sem `tipo`, o endpoint responde 410 Gone com a instrução
 * de migrar — forçando o cliente a passar pro formato tipado.
 */

import { renderSlide } from '../lib/render/render.js';
import { NEXUM_DNA } from '../lib/render/presets.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const body = req.body || {};

  // Detecção de formato legado
  if (body.pauta && !body.conteudo) {
    return res.status(410).json({
      error: 'Endpoint atualizado. Passe { conteudo, dna, indice, total, pilar, tags }. Ver lib/render/schemas.js.',
      migration_hint: 'Use a lib `lib/render/render.js -> renderSlide()` diretamente em vez de chamar este endpoint.',
    });
  }

  const {
    conteudo,
    dna = NEXUM_DNA, // fallback pro preset enquanto não tem DB
    indice,
    total,
    pilar,
    tags = [],
    palavra_chave_deco = '',
  } = body;

  if (!conteudo) return res.status(400).json({ error: 'Campo `conteudo` obrigatório.' });
  if (!indice || !total) return res.status(400).json({ error: 'Campos `indice` e `total` obrigatórios.' });
  if (!pilar) return res.status(400).json({ error: 'Campo `pilar` obrigatório.' });

  try {
    const html = renderSlide({
      conteudo,
      dna,
      indice,
      total,
      pilar,
      tags,
      palavraChaveDeco: palavra_chave_deco,
      validar: true,
    });

    return res.status(200).json({ success: true, html });

  } catch (err) {
    console.error('[generate-art]', err.message);
    return res.status(400).json({ error: err.message });
  }
}
