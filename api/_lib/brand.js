/**
 * Helper compartilhado para injetar o DNA da Marca (brand_profile) nos prompts.
 * Arquivo em /api/_lib/ — Vercel ignora pastas/arquivos com prefixo "_" no roteamento.
 */

export function brandContextBlock(bp) {
  if (!bp || typeof bp !== 'object') return '';

  const ident   = bp.identidade || {};
  const pub     = bp.publico    || {};
  const voz     = bp.voz        || {};
  const visual  = bp.visual     || {};

  const lines = [];
  lines.push('CONTEXTO DA MARCA (use como base de identidade — NUNCA genérico):');

  if (ident.nome)           lines.push(`- Marca: ${ident.nome}${ident.descricao ? ' — ' + ident.descricao : ''}`);
  if (ident.proposta_valor) lines.push(`- Proposta de valor: ${ident.proposta_valor}`);

  if (Array.isArray(bp.areas_atuacao) && bp.areas_atuacao.length)
    lines.push(`- Áreas de atuação: ${bp.areas_atuacao.join(' · ')}`);

  const pubParts = [];
  if (pub.perfil)               pubParts.push(pub.perfil);
  if (Array.isArray(pub.cargo) && pub.cargo.length) pubParts.push(pub.cargo.join('/'));
  if (pub.maturidade)           pubParts.push(`maturidade ${pub.maturidade}`);
  if (pubParts.length)          lines.push(`- Público: ${pubParts.join(', ')}`);
  if (pub.dor_principal)        lines.push(`- Dor principal do público: ${pub.dor_principal}`);

  if (Array.isArray(voz.tom) && voz.tom.length) lines.push(`- Tom de voz: ${voz.tom.join(', ')}`);
  const vozParts = [];
  if (voz.sofisticacao) vozParts.push(`Sofisticação: ${voz.sofisticacao}`);
  if (voz.linguagem)    vozParts.push(`Linguagem: ${voz.linguagem}`);
  if (vozParts.length)  lines.push(`- ${vozParts.join(' · ')}`);
  if (Array.isArray(voz.evitar) && voz.evitar.length)
    lines.push(`- EVITAR: ${voz.evitar.join(' · ')}`);

  if (visual.estilo) lines.push(`- Estilo visual: ${visual.estilo}`);
  const cores = [visual.cor_primaria, visual.cor_secundaria, visual.cor_terciaria].filter(Boolean);
  if (cores.length) lines.push(`- Paleta de cores da marca: ${cores.join(' · ')}`);

  // Assets da marca — inventário para IA escolher via asset_hint
  const assets = bp.assets;
  if (assets) {
    const assetLines = [];
    const logoVars = ['principal', 'secundaria', 'monograma', 'monocromatica']
      .filter(v => assets.logo?.[v]?.data);
    if (logoVars.length)
      assetLines.push(`- Logo — variantes disponíveis: ${logoVars.join(' · ')}`);

    const listAssets = (arr, label) => {
      const valid = (arr || []).filter(a => a?.data);
      if (valid.length)
        assetLines.push(`- ${label}: ${valid.map(a => `${a.id} "${a.nome}"${a.tags?.length ? ' [' + a.tags.join(', ') + ']' : ''}`).join(' · ')}`);
    };
    listAssets(assets.simbolos,   'Símbolos');
    listAssets(assets.icones,     'Ícones');
    listAssets(assets.backgrounds,'Backgrounds');

    if (assetLines.length) {
      lines.push('');
      lines.push('ASSETS DA MARCA (use asset_hint nos slides para selecionar):');
      assetLines.forEach(l => lines.push(l));
      lines.push('  → Escolha pelo propósito semântico do slide. Capa = logo principal. CTA = monograma. Slide de contraste = sem símbolo ou símbolo neutro. Deixe null quando não agregar valor.');
    }
  }

  lines.push('');
  lines.push('DIRETRIZ: gere conteúdo que SÓ essa marca poderia assinar. Se o output couber em qualquer consultoria do mesmo nicho, reescreva.');

  return lines.join('\n') + '\n';
}

export function extractJson(text) {
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Resposta não contém JSON válido.');
  const raw = clean.slice(start, end + 1);

  let sanitized = '';
  let inString  = false;
  let escape    = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escape) { sanitized += ch; escape = false; continue; }
    if (ch === '\\') { escape = true; sanitized += ch; continue; }
    if (ch === '"') { inString = !inString; sanitized += ch; continue; }
    if (inString && (ch === '\n' || ch === '\r')) { sanitized += '\\n'; continue; }
    sanitized += ch;
  }
  return sanitized;
}
