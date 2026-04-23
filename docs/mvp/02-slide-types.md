# Documento 2 — Schemas dos Tipos de Slide

Status: **rascunho para revisão**
Escopo: **só conteúdo**. Nada visual aqui — estilo vem 100% do Brand DNA (doc 1).

Cada tipo é um padrão de estrutura de informação (capa, lista, comparação…). Funciona pra qualquer marca. O `renderSlide(tipo, conteudo, brandDNA)` combina tipo + conteúdo + DNA e produz HTML.

---

## Convenções

### Rich text inline
Qualquer campo marcado como `rich` suporta 3 marcações simples (inspirado em Markdown):

| Marcação | Significado | Visual (definido pelo DNA) |
|---|---|---|
| `_palavra_` | Destaque | `destaque_estilo` + cor accent |
| `**palavra**` | Forte | Negrito + cor accent |
| `~~palavra~~` | Riscado | Linha inclinada cor accent |

### Campos auto-injetados em todos os tipos
Não precisam entrar no conteúdo — o sistema preenche:

- `contador` — gerado pela posição (ex: `02/07`)
- `pilar` — herdado da pauta
- `brand_dna` — aplicado globalmente
- `logo_url` — do DNA
- `assinatura_url` — do DNA

### Limite de caracteres
Cada campo tem limite **sugerido** (não bloqueia, só avisa no editor) pra não quebrar layout:

---

## Tipo 1 · `capa`

Abertura do carrossel. Título grande, subtítulo curto.

```typescript
{
  tipo: "capa",
  tagline?: string,       // max 40  - ex: "Carrossel · 01/07"
  titulo: rich,           // max 90
  subtitulo: string,      // max 120
}
```

Exemplo:
```json
{
  "tipo": "capa",
  "tagline": "Carrossel · 01/07",
  "titulo": "Sua marca tem _personalidade_ — ou só tem logotipo?",
  "subtitulo": "A diferença aparece na hora da escolha do cliente. Não no manual de identidade."
}
```

---

## Tipo 2 · `grid-2-colunas`

Duas colunas comparadas: label + palavra-destaque grande + descrição.

```typescript
{
  tipo: "grid-2-colunas",
  titulo: rich,           // max 120
  esquerda: {
    label: string,        // max 20
    destaque: string,     // max 15
    descricao: string     // max 160
  },
  direita: {
    label: string,        // max 20
    destaque: string,     // max 15
    descricao: string     // max 160
  }
}
```

Exemplo:
```json
{
  "tipo": "grid-2-colunas",
  "titulo": "Logotipo é o que você _mostra_. Marca é o que _fica_.",
  "esquerda": {
    "label": "Logotipo",
    "destaque": "Vitrine",
    "descricao": "A empresa decora a fachada antes de definir o que vende. Bonito por fora, igual a todo mundo por dentro."
  },
  "direita": {
    "label": "Marca",
    "destaque": "Posição",
    "descricao": "O que a empresa representa e por que o cliente escolhe ela — mesmo com alternativa mais barata ao lado."
  }
}
```

---

## Tipo 3 · `lista-numerada`

Lista de 2 a 5 itens numerados (01, 02, 03…).

```typescript
{
  tipo: "lista-numerada",
  label?: string,         // max 30
  titulo: rich,           // max 90
  itens: [                // 2 a 5 itens
    {
      titulo: rich,       // max 80
      descricao: string   // max 160
    }
  ]
}
```

Exemplo:
```json
{
  "tipo": "lista-numerada",
  "label": "Diagnóstico rápido",
  "titulo": "Três sinais de que sua marca é só logotipo.",
  "itens": [
    { "titulo": "O cliente chega pelo _preço_.", "descricao": "Sem proposta clara de valor, a única variável de decisão é quanto custa — e sempre vai ter alguém mais barato." },
    { "titulo": "O time comercial explica o que vocês fazem antes de vender.", "descricao": "Se o vendedor precisa traduzir a empresa, a marca não está comunicando — está enfeitando." },
    { "titulo": "Qualquer concorrente poderia assinar seu conteúdo.", "descricao": "Ausência de ponto de vista próprio é o sintoma mais caro e mais comum nas marcas B2B." }
  ]
}
```

---

## Tipo 4 · `grid-4-pilares`

Exatamente 4 colunas pequenas. Título maior no topo.

```typescript
{
  tipo: "grid-4-pilares",
  titulo: rich,           // max 120
  pilares: [              // exatamente 4
    {
      label: string,      // max 20
      texto: string       // max 80
    }
  ]
}
```

Exemplo:
```json
{
  "tipo": "grid-4-pilares",
  "titulo": "Personalidade de marca não está no ~~visual~~. Está na _decisão_.",
  "pilares": [
    { "label": "O que diz",    "texto": "Ponto de vista próprio, não eco do mercado." },
    { "label": "O que recusa", "texto": "O que não fazemos — e por quê." },
    { "label": "Quem afasta",  "texto": "O cliente errado, de propósito." },
    { "label": "Onde sustenta","texto": "Valor percebido, mesmo sob pressão de preço." }
  ]
}
```

---

## Tipo 5 · `frase-destaque-com-box`

Frase grande + caixa de apoio (ex: "Por quê", "Como", "Exemplo").

```typescript
{
  tipo: "frase-destaque-com-box",
  label?: string,         // max 30
  titulo: rich,           // max 110
  box: {
    label: string,        // max 20
    texto: string         // max 220
  }
}
```

Exemplo:
```json
{
  "tipo": "frase-destaque-com-box",
  "label": "Consequência estratégica",
  "titulo": "Marca sem posicionamento compete por _preço_. Sempre.",
  "box": {
    "label": "Por quê",
    "texto": "Sem critério claro de valor, o cliente só tem um eixo para decidir: quanto custa. E nesse eixo, sempre vai existir alguém mais barato que você."
  }
}
```

---

## Tipo 6 · `comparacao-contraste`

Duas caixas (A neutra vs B em destaque) + frase de fechamento.

```typescript
{
  tipo: "comparacao-contraste",
  titulo: rich,           // max 110
  caixa_a: {              // lado neutro / "errado"
    label: string,        // max 25
    titulo: string,       // max 40
    descricao: string     // max 180
  },
  caixa_b: {              // lado em destaque / "certo"
    label: string,        // max 25
    titulo: string,       // max 40
    descricao: string     // max 180
  },
  fechamento?: rich       // max 150 — frase abaixo das caixas
}
```

Exemplo:
```json
{
  "tipo": "comparacao-contraste",
  "titulo": "Branding ≠ vendas. Branding resolve _percepção_.",
  "caixa_a": {
    "label": "Expectativa errada",
    "titulo": "ROI em 30 dias",
    "descricao": "Quem trata branding como campanha de performance desiste no dia 31 — antes de qualquer resultado real."
  },
  "caixa_b": {
    "label": "Ativo de longo prazo",
    "titulo": "Margem, autoridade, recorrência",
    "descricao": "Percepção consistente reduz custo de aquisição, sustenta preço e cria preferência duradoura."
  },
  "fechamento": "Quem confunde os dois **paga em margem** o que deixa de construir em posicionamento."
}
```

---

## Tipo 7 · `cta-final`

Último slide. Ângulo da marca + método em passos + call-to-action.

```typescript
{
  tipo: "cta-final",
  tagline?: string,       // max 30
  titulo: rich,           // max 110
  metodo?: {              // opcional — se ausente, slide fica mais "limpo"
    label: string,        // max 40
    passos: [             // 2 a 4 passos
      {
        destaque: string, // max 20 - palavra que vira cor accent
        frase: rich       // max 140 - frase completa que CONTÉM o destaque
      }
    ]
  },
  cta: {
    texto: string,        // max 60
    url: string           // max 40
  }
}
```

Exemplo:
```json
{
  "tipo": "cta-final",
  "tagline": "Ângulo Nexum360",
  "titulo": "Marca é _estratégia com aparência_. Não o contrário.",
  "metodo": {
    "label": "Como construímos marca na Nexum360",
    "passos": [
      { "destaque": "posicionamento",     "frase": "Primeiro, **posicionamento** — o que a marca representa e para quem." },
      { "destaque": "narrativa",          "frase": "Depois, **narrativa** — o que dizer, o que recusar, quem afastar." },
      { "destaque": "identidade visual",  "frase": "Por último, **identidade visual** — consequência, não partida." }
    ]
  },
  "cta": {
    "texto": "Pronto para parar de competir por preço?",
    "url": "nexum360.com.br"
  }
}
```

---

## Tipo 8 · `teste-pergunta`

Pergunta grande + veredito condicional ("Se sim / Se não"). Útil pra micro-diagnósticos.

```typescript
{
  tipo: "teste-pergunta",
  label?: string,         // max 30
  pergunta: rich,         // max 140
  veredito: [             // 2 ou 3 condições
    {
      condicao: string,   // max 20 - ex: "Se **sim**"
      texto: string,      // max 80
      destaque?: boolean  // true = aplica cor accent na linha inteira
    }
  ]
}
```

Exemplo:
```json
{
  "tipo": "teste-pergunta",
  "label": "Teste prático",
  "pergunta": "Se sua empresa mudasse de _nome_ amanhã, o cliente continuaria escolhendo?",
  "veredito": [
    { "condicao": "Se **sim**", "texto": "você construiu uma marca." },
    { "condicao": "Se **não**", "texto": "você tem um logotipo. Não uma marca.", "destaque": true }
  ]
}
```

---

## Schema completo de uma Pauta (depois do refactor)

```typescript
{
  id: uuid,
  user_id: uuid,
  brand_id: uuid,         // qual marca (DNA)

  // Metadados editoriais
  tema: string,
  pilar: string,          // da lista de pilares da marca
  gancho?: string,
  angulo?: string,
  fonte?: string,

  // Conteúdo do carrossel (refactor central)
  slides: SlideContent[], // array dos 8 tipos acima

  // Saídas textuais
  legenda_ig?: string,
  legenda_li?: string,
  hashtags_ig?: string[],
  hashtags_li?: string[],

  // Metadados de publicação
  rede_social: "Instagram"|"LinkedIn"|"Ambos",
  formato: "Carrossel"|"Post Único"|"Artigo"|"Notícia",
  status: "Rascunho"|"Pronto"|"Publicado",
  data_planejada?: date,
  data_publicacao?: date,

  // Cache de renderização
  slides_png_urls: string[],  // PNGs renderizados (cache)

  // Auditoria
  created_at: timestamp,
  updated_at: timestamp,
  tokens_consumidos: number   // soma das chamadas IA dessa pauta
}
```

---

## Resumindo

- **8 tipos de slide** cobrindo os padrões de conteúdo mais comuns em carrosséis B2B.
- **Campos só de conteúdo** — nenhum campo visual neles.
- **Rich text simples** (3 marcações) resolve 95% das necessidades de formatação inline; o DNA decide como essas marcações aparecem.
- **Limites de caracteres** servem pra orientação no editor (warning), não pra bloquear.
- **Campos auto-injetados** (contador, pilar, logo, URL, dna) não poluem o schema de conteúdo.
