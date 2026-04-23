# Documento 1 — Catálogo de Tokens do Brand DNA

Status: **rascunho para revisão**
Escopo: **genérico, multi-tenant**. Nenhum token é específico de uma marca; valores aqui são exemplos do que o sistema aceita.

Cada marca preenche esses tokens 1 vez na tela `/dna` (multi-step). O `renderSlide()` consome o DNA + o conteúdo do slide + o tipo, e gera o HTML final. Mudar o DNA reflete em todos os posts futuros.

---

## 1. Cores (7 tokens)

| Token | Tipo | Default | Descrição |
|---|---|---|---|
| `cor_bg_primario` | hex | `#070d1a` | Fundo principal do card |
| `cor_bg_surface` | hex | `#0d1628` | Fundo de caixas/boxes internos |
| `cor_borda` | hex | `#1a2b47` | Linhas e divisores sutis |
| `cor_texto_primario` | hex | `#f0f0f0` | Texto principal |
| `cor_texto_secundario` | hex | `#7a90b0` | Texto de apoio (labels, rodapé, descrições) |
| `cor_accent` | hex | `#4d8fda` | Cor da marca — usada em destaques, números, CTAs |
| `cor_accent_alpha` | hex+alpha (auto) | `rgba(accent, 0.12)` | Versão translúcida do accent (derivada automaticamente) |

**Paletas predefinidas:** user pode escolher um preset (Dark / Light / Contraste-Alto) que popula os 7 tokens, ou ajustar manualmente.

---

## 2. Tipografia (4 tokens)

| Token | Tipo | Default | Descrição |
|---|---|---|---|
| `fonte_display` | enum | `Playfair Display` | Fonte dos títulos/destaques. Opções: Playfair Display, Inter, Space Grotesk, Fraunces, DM Serif, Montserrat, Bebas Neue, custom (Google Font) |
| `fonte_corpo` | enum | `system-ui` | Fonte do corpo/descrições. Opções: system-ui, Inter, DM Sans, Work Sans, IBM Plex Sans |
| `escala` | enum | `confortavel` | Multiplicador geral de tamanho: `compacta` (×0.92), `confortavel` (×1.0), `espacosa` (×1.08) |
| `peso_display` | enum | `700` | Peso da fonte de títulos: `400`, `600`, `700`, `900` |

---

## 3. Destaque de palavras (2 tokens)

Define como palavras marcadas com `_palavra_` no conteúdo aparecem visualmente.

| Token | Tipo | Default | Descrição |
|---|---|---|---|
| `destaque_estilo` | enum | `italico-cor` | `italico-cor` / `negrito-cor` / `sublinhado-cor` / `fundo-cor` / `maiusculas-cor` |
| `destaque_intensidade` | enum | `forte` | `sutil` (opacidade 0.7) / `medio` (1.0) / `forte` (1.0 + peso extra) |

Palavras com `**forte**` sempre viram negrito na cor accent (não configurável).
Palavras com `~~riscado~~` usam sempre linha inclinada na cor accent (não configurável).

---

## 4. Decoração de fundo ambiente (4 tokens)

Elemento decorativo grande atrás do conteúdo (opcional por tipo de slide).

| Token | Tipo | Default | Descrição |
|---|---|---|---|
| `decoracao_tipo` | enum | `nenhum` | `nenhum` / `numero-slide` / `palavra-chave` / `simbolo-asset` / `padrao-asset` |
| `decoracao_opacidade` | número | `0.06` | 0.02 a 0.30 |
| `decoracao_tamanho` | enum | `XL` | `S` / `M` / `L` / `XL` (relativo ao card) |
| `decoracao_posicao` | enum | `canto-inferior-direito` | 9 opções (3×3 grid: canto-sup-esq, topo-centro, canto-sup-dir, meio-esq, centro, meio-dir, canto-inf-esq, base-centro, canto-inf-dir) |

Se `decoracao_tipo = simbolo-asset` ou `padrao-asset`, precisa ter ao menos 1 asset desse tipo na biblioteca (a IA escolhe qual).

**Regras por tipo de slide** (v1.1 — no MVP usa a mesma decoração em todos os slides que suportam):
- Capa e CTA: decoração presente.
- Lista, grid-4, comparação: decoração ausente (já têm muita informação).

---

## 5. Labels (3 tokens)

Labels = os textos pequenos em maiúsculas tipo "DIAGNÓSTICO RÁPIDO", "POR QUÊ", "MARCA".

| Token | Tipo | Default | Descrição |
|---|---|---|---|
| `label_transformacao` | enum | `uppercase` | `uppercase` / `capitalize` / `normal` |
| `label_spacing` | enum | `wide` | `tight` (0.05em) / `normal` (0.1em) / `wide` (0.2em) / `ultra` (0.3em) |
| `label_prefixo` | enum | `nenhum` | `nenhum` / `traco-duplo` (──) / `bullet` (•) / `seta` (→) / `barra` (│) |

---

## 6. Contador do carrossel (1 token)

| Token | Tipo | Default | Descrição |
|---|---|---|---|
| `contador_formato` | enum | `XX_de_YY` | `XX_barra_YY` (01 / 07) / `XX_de_YY` (01 de 07) / `XX` (01) / `oculto` |

---

## 7. Bordas e caixas (3 tokens)

| Token | Tipo | Default | Descrição |
|---|---|---|---|
| `radius` | enum | `M` | `nenhum` (0) / `S` (4px) / `M` (12px) / `L` (24px) / `pill` (999px) |
| `caixa_estilo` | enum | `borda-lateral` | `flat` (sem borda) / `borda-lateral` (barra à esquerda) / `borda-completa` (borda 1px) / `sombra` (shadow) / `gradiente` |
| `caixa_preenchimento` | enum | `accent-alpha` | `nenhum` / `surface` / `accent-alpha` / `accent-solido` |

---

## 8. Header e Rodapé (3 tokens)

| Token | Tipo | Default | Descrição |
|---|---|---|---|
| `header_estilo` | enum | `logo-pilar` | `minimal` (só logo) / `logo-pilar` (logo esquerda, pilar direita) / `logo-tagline` / `logo-categoria-badge` |
| `rodape_estilo` | enum | `completo` | `minimal` (só URL) / `com-contador` (URL + contador) / `completo` (URL + contador + tags) |
| `rodape_align` | enum | `space-between` | `left` / `center` / `space-between` |

---

## 9. Logo (2 tokens)

| Token | Tipo | Default | Descrição |
|---|---|---|---|
| `logo_asset_id` | uuid | null | Referência ao asset do logo (upload obrigatório no DNA) |
| `logo_tamanho_header` | enum | `M` | `S` (20px altura) / `M` (28px) / `L` (36px) |

Se `logo_asset_id` for null, o sistema usa o `nome_da_marca` (string) como fallback, renderizado em `fonte_display`.

---

## Totais

**27 tokens** no catálogo MVP. Agrupados em 9 categorias que refletem os passos do onboarding de DNA:

1. Cores (passo 5)
2. Tipografia (passo 5)
3. Destaque (passo 5)
4. Decoração (passo 6)
5. Labels (passo 5)
6. Contador (passo 5)
7. Bordas e caixas (passo 5)
8. Header e rodapé (passo 5)
9. Logo (passo 6)

Passos 1-4 da tela `/dna` capturam dados de conteúdo da marca (nome, voz, público, pilares) — esses são inputs pra IA, não tokens visuais, e viram outro documento.

---

## Preset "Nexum" (primeiro caso de teste)

Pra provar que o sistema reproduz o visual atual, a Nexum entra como preset:

```json
{
  "cores": { "accent": "#4d8fda", "bg": "#070d1a", ... },
  "tipografia": { "display": "Playfair Display", "corpo": "system-ui", "escala": "confortavel", "peso": 700 },
  "destaque": { "estilo": "italico-cor", "intensidade": "forte" },
  "decoracao": { "tipo": "numero-slide", "opacidade": 0.06, "tamanho": "XL", "posicao": "canto-inferior-direito" },
  "labels": { "transformacao": "uppercase", "spacing": "wide", "prefixo": "traco-duplo" },
  "contador": { "formato": "XX_barra_YY" },
  "caixas": { "radius": "M", "estilo": "borda-lateral", "preenchimento": "accent-alpha" },
  "header": { "estilo": "logo-pilar" },
  "rodape": { "estilo": "completo", "align": "space-between" },
  "logo": { "asset_id": "nexum-wordmark-uuid", "tamanho_header": "M" }
}
```

Aplicar esse JSON + o conteúdo do post 8 no `renderSlide()` deve produzir HTML visualmente idêntico aos slides de hoje.
