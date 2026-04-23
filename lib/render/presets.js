// Presets de Brand DNA — cada marca tem o seu.
// Nexum é o primeiro, usado como caso de teste pra validar que o sistema
// genérico reproduz o visual histórico.

export const NEXUM_DNA = {
  marca: {
    nome: 'Nexum360',
    assinatura_url: 'nexum360.com.br',
  },
  cores: {
    bg_primario: '#070d1a',
    bg_surface: '#0d1628',
    borda: '#1a2b47',
    texto_primario: '#f0f0f0',
    texto_secundario: '#7a90b0',
    accent: '#4d8fda',
    accent_alpha: 'rgba(77,143,218,0.12)',
  },
  tipografia: {
    display: 'Playfair Display',
    corpo: 'system-ui',
    escala: 'confortavel',
    peso_display: '700',
  },
  destaque: {
    estilo: 'italico-cor',
    intensidade: 'forte',
  },
  decoracao: {
    tipo: 'numero-slide',
    opacidade: 0.06,
    tamanho: 'XL',
    posicao: 'canto-inf-dir',
    asset_id: null,
  },
  labels: {
    transformacao: 'uppercase',
    spacing: 'wide',
    prefixo: 'traco-duplo',
  },
  contador: {
    formato: 'XX_barra_YY',
  },
  caixas: {
    radius: 'M',
    estilo: 'borda-lateral',
    preenchimento: 'accent-alpha',
  },
  header: {
    estilo: 'logo-pilar',
  },
  rodape: {
    estilo: 'completo',
    align: 'space-between',
  },
  logo: {
    asset_id: null,
    tamanho_header: 'M',
    fallback_texto: 'nexum360',
  },
};
