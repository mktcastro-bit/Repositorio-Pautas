// Zod schemas — fonte única de validação pra Brand DNA e conteúdo de slides.
// Importe `SlideContentSchema` pra validar o array de slides de uma pauta,
// e `BrandDNASchema` pra validar o DNA de uma marca antes de renderizar.

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// BRAND DNA (27 tokens)
// ─────────────────────────────────────────────────────────────

const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Esperado cor hex #RRGGBB');

export const BrandDNASchema = z.object({
  // 1. Cores
  cores: z.object({
    bg_primario: HexColor,
    bg_surface: HexColor,
    borda: HexColor,
    texto_primario: HexColor,
    texto_secundario: HexColor,
    accent: HexColor,
    accent_alpha: z.string().optional(), // auto-derivado se ausente
  }),

  // 2. Tipografia
  tipografia: z.object({
    display: z.string().default('Playfair Display'),
    corpo: z.string().default('system-ui'),
    escala: z.enum(['compacta', 'confortavel', 'espacosa']).default('confortavel'),
    peso_display: z.enum(['400', '600', '700', '900']).default('700'),
  }),

  // 3. Destaque de palavras
  destaque: z.object({
    estilo: z.enum(['italico-cor', 'negrito-cor', 'sublinhado-cor', 'fundo-cor', 'maiusculas-cor']).default('italico-cor'),
    intensidade: z.enum(['sutil', 'medio', 'forte']).default('forte'),
  }),

  // 4. Decoração de fundo
  decoracao: z.object({
    tipo: z.enum(['nenhum', 'numero-slide', 'palavra-chave', 'simbolo-asset', 'padrao-asset']).default('nenhum'),
    opacidade: z.number().min(0.02).max(0.3).default(0.06),
    tamanho: z.enum(['S', 'M', 'L', 'XL']).default('XL'),
    posicao: z.enum([
      'canto-sup-esq','topo-centro','canto-sup-dir',
      'meio-esq','centro','meio-dir',
      'canto-inf-esq','base-centro','canto-inf-dir'
    ]).default('canto-inf-dir'),
    asset_id: z.string().nullable().default(null), // se tipo = simbolo/padrao
  }),

  // 5. Labels
  labels: z.object({
    transformacao: z.enum(['uppercase', 'capitalize', 'normal']).default('uppercase'),
    spacing: z.enum(['tight', 'normal', 'wide', 'ultra']).default('wide'),
    prefixo: z.enum(['nenhum', 'traco-duplo', 'bullet', 'seta', 'barra']).default('nenhum'),
  }),

  // 6. Contador
  contador: z.object({
    formato: z.enum(['XX_barra_YY', 'XX_de_YY', 'XX', 'oculto']).default('XX_de_YY'),
  }),

  // 7. Caixas
  caixas: z.object({
    radius: z.enum(['nenhum', 'S', 'M', 'L', 'pill']).default('M'),
    estilo: z.enum(['flat', 'borda-lateral', 'borda-completa', 'sombra', 'gradiente']).default('borda-lateral'),
    preenchimento: z.enum(['nenhum', 'surface', 'accent-alpha', 'accent-solido']).default('accent-alpha'),
  }),

  // 8. Header e rodapé
  header: z.object({
    estilo: z.enum(['minimal', 'logo-pilar', 'logo-tagline', 'logo-categoria-badge']).default('logo-pilar'),
  }),
  rodape: z.object({
    estilo: z.enum(['minimal', 'com-contador', 'completo']).default('completo'),
    align: z.enum(['left', 'center', 'space-between']).default('space-between'),
  }),

  // 9. Logo
  logo: z.object({
    asset_id: z.string().nullable().default(null),
    tamanho_header: z.enum(['S', 'M', 'L']).default('M'),
    // Texto de fallback quando não houver asset (wordmark textual)
    fallback_texto: z.string().default(''),
  }),

  // Identidade da marca (não-visual, mas usado no render — URL assinatura etc.)
  marca: z.object({
    nome: z.string(),
    assinatura_url: z.string().default(''),
  }),
});

// ─────────────────────────────────────────────────────────────
// SLIDE CONTENT (8 tipos)
// ─────────────────────────────────────────────────────────────
//
// Rich text convention:
//   _palavra_     → destaque (vira <em data-rich="destaque">)
//   **palavra**   → forte    (vira <strong data-rich="forte">)
//   ~~palavra~~   → riscado  (vira <span data-rich="riscado">)

const RichString = z.string(); // plain string; parser trata marcações no render

// Tipo 1 · capa
export const CapaSchema = z.object({
  tipo: z.literal('capa'),
  tagline: z.string().max(40).optional(),
  titulo: RichString.max(120),
  subtitulo: z.string().max(160),
});

// Tipo 2 · grid-2-colunas
export const Grid2ColunasSchema = z.object({
  tipo: z.literal('grid-2-colunas'),
  titulo: RichString.max(140),
  esquerda: z.object({
    label: z.string().max(24),
    destaque: z.string().max(18),
    descricao: z.string().max(180),
  }),
  direita: z.object({
    label: z.string().max(24),
    destaque: z.string().max(18),
    descricao: z.string().max(180),
  }),
});

// Tipo 3 · lista-numerada
export const ListaNumeradaSchema = z.object({
  tipo: z.literal('lista-numerada'),
  label: z.string().max(40).optional(),
  titulo: RichString.max(110),
  itens: z.array(z.object({
    titulo: RichString.max(100),
    descricao: z.string().max(200),
  })).min(2).max(5),
});

// Tipo 4 · grid-4-pilares
export const Grid4PilaresSchema = z.object({
  tipo: z.literal('grid-4-pilares'),
  titulo: RichString.max(140),
  pilares: z.array(z.object({
    label: z.string().max(24),
    texto: z.string().max(100),
  })).length(4),
});

// Tipo 5 · frase-destaque-com-box
export const FraseDestaqueSchema = z.object({
  tipo: z.literal('frase-destaque-com-box'),
  label: z.string().max(40).optional(),
  titulo: RichString.max(130),
  box: z.object({
    label: z.string().max(24),
    texto: z.string().max(260),
  }),
});

// Tipo 6 · comparacao-contraste
export const ComparacaoContrasteSchema = z.object({
  tipo: z.literal('comparacao-contraste'),
  titulo: RichString.max(130),
  caixa_a: z.object({
    label: z.string().max(30),
    titulo: z.string().max(50),
    descricao: z.string().max(200),
  }),
  caixa_b: z.object({
    label: z.string().max(30),
    titulo: z.string().max(50),
    descricao: z.string().max(200),
  }),
  fechamento: RichString.max(180).optional(),
});

// Tipo 7 · cta-final
export const CtaFinalSchema = z.object({
  tipo: z.literal('cta-final'),
  tagline: z.string().max(40).optional(),
  titulo: RichString.max(130),
  metodo: z.object({
    label: z.string().max(50),
    passos: z.array(z.object({
      destaque: z.string().max(24),
      frase: RichString.max(160),
    })).min(2).max(4),
  }).optional(),
  cta: z.object({
    texto: z.string().max(80),
    url: z.string().max(50),
  }),
});

// Tipo 8 · teste-pergunta
export const TestePerguntaSchema = z.object({
  tipo: z.literal('teste-pergunta'),
  label: z.string().max(40).optional(),
  pergunta: RichString.max(160),
  veredito: z.array(z.object({
    condicao: z.string().max(24),
    texto: z.string().max(100),
    destaque: z.boolean().optional(),
  })).min(2).max(3),
});

// União discriminada de todos os tipos
export const SlideContentSchema = z.discriminatedUnion('tipo', [
  CapaSchema,
  Grid2ColunasSchema,
  ListaNumeradaSchema,
  Grid4PilaresSchema,
  FraseDestaqueSchema,
  ComparacaoContrasteSchema,
  CtaFinalSchema,
  TestePerguntaSchema,
]);

// Array de slides
export const SlidesArraySchema = z.array(SlideContentSchema).min(1).max(10);

// ─────────────────────────────────────────────────────────────
// PAUTA (metadados editoriais + slides)
// ─────────────────────────────────────────────────────────────

export const PautaSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  brand_id: z.string().optional(),

  tema: z.string(),
  pilar: z.string(),
  gancho: z.string().optional(),
  angulo: z.string().optional(),
  fonte: z.string().optional(),

  slides: SlidesArraySchema,

  legenda_ig: z.string().optional(),
  legenda_li: z.string().optional(),
  hashtags_ig: z.array(z.string()).optional(),
  hashtags_li: z.array(z.string()).optional(),

  rede_social: z.enum(['Instagram','LinkedIn','Ambos']).optional(),
  formato: z.enum(['Carrossel','Post Único','Artigo','Notícia']).optional(),
  status: z.enum(['Rascunho','Pronto','Publicado']).default('Rascunho'),
});
