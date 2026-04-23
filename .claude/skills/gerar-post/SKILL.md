---
name: gerar-post
description: Gera um post Nexum360 completo end-to-end (sugestão de ideias → conteúdo tipado → arte HTML) usando os prompts reais de produção em api/suggest-ideas.js, api/generate.js + o renderer local em lib/render/. Claude produz o JSON de conteúdo diretamente na conversa e a arte é renderizada pela lib (não mais via IA). Use quando o usuário invocar /gerar-post ou pedir para testar o fluxo localmente, sem custo de API.
---

# /gerar-post — Fluxo de geração Nexum360 local

Esta skill substitui o "modo mock" do index.html. Em vez de gerar HTML fake com template fixo, Claude (você) executa os prompts reais aqui na conversa e a arte é montada pelo renderer local.

## Arquitetura (pós-refactor)

Três camadas separadas:

1. **Tipo de slide** (semântico): capa, grid-2-colunas, lista-numerada, grid-4-pilares, frase-destaque-com-box, comparacao-contraste, cta-final, teste-pergunta. Ver `lib/render/schemas.js`.
2. **Conteúdo** (texto/dados): brand-agnostic, produzido pela IA em JSON tipado.
3. **Brand DNA** (tokens visuais): cores, tipografia, decoração, labels. Ver `lib/render/presets.js` (`NEXUM_DNA`).

A IA só produz camadas 1+2. A camada 3 vem do DNA salvo da marca. **Não existe mais `variante` Dark/Blue/White** — o visual é 100% DNA.

## Parâmetros (args)

Formato livre na string `args`. Defaults entre parênteses:

- `pilar` — Estratégia de Marca | Marketing e Performance | Tecnologia e IA | Mentalidade e Gestão Empresarial | Bastidores e Diagnóstico de Negócios (default: `Tecnologia e IA`)
- `rede_social` — Instagram | LinkedIn | Ambos (default: `Instagram`)
- `formato` — Carrossel | Post Único | Artigo | Notícia (default: `Carrossel`)
- `pub_formato` — feed | story | reels (default: `feed`)
- `sugestao` — direção/tema livre (opcional)
- `tema` — tema explícito, pula etapa de sugestões (opcional)
- `slide` — índice específico (1-based). Se ausente, renderiza todos.
- `dna` — caminho pra um JSON de DNA customizado. Se ausente, usa `NEXUM_DNA`.

## Fonte da verdade

**LEIA** estes arquivos antes de gerar (reflete a versão atual do código, não do que está aqui):

1. `api/suggest-ideas.js` — SYSTEM_PROMPT + user prompt do passo 1
2. `api/generate.js` — SYSTEM_PROMPT + `buildUserPrompt()` do passo 2 (saída JSON tipada)
3. `api/_lib/brand.js` — helper `brandContextBlock(brand_profile)`
4. `lib/render/schemas.js` — schemas Zod dos tipos de slide e do Brand DNA
5. `lib/render/presets.js` — `NEXUM_DNA` (preset de teste)
6. `lib/render/render.js` — `renderSlide({...})` e `renderCarrossel({...})`

Se algo mudar no código, a skill segue correta porque sempre relê.

## Brand profile

Procure `brand-profile.json` no root. Se não existir, `null` (brandContextBlock retorna vazio).

## Fluxo

### Passo 0 — Preparar

1. Ler os arquivos de `api/*` e `lib/render/*` listados acima.
2. Ler `brand-profile.json` se existir.
3. Ler `pautas.json` pra pegar `temas_existentes` (usado no passo 1).
4. Criar `samples/<YYYYMMDD-HHmmss>/`.

### Passo 1 — Sugestão de ideias

- Pular se `tema` foi passado.
- Monte o userPrompt como `api/suggest-ideas.js`.
- Produza 6 ideias: `{ "ideas": [{ "titulo": "...", "subtitulo": "..." }, ...] }`.
- Salve em `samples/<ts>/ideas.json`.
- Apresente numeradas e peça escolha (default=1).

### Passo 2 — Gerar conteúdo tipado

- Use ideia escolhida (ou `tema` explícito) como `ideia_selecionada`.
- Monte userPrompt como `buildUserPrompt()` de `api/generate.js`.
- Siga o SYSTEM_PROMPT de `generate.js` e produza JSON completo:
  - `tema`, `gancho`, `angulo`, `picah`, `slides[]`, `legenda_ig`, `legenda_li`, `hashtags_ig`, `hashtags_li`.
  - Carrossel: 7-8 slides começando em `capa`, terminando em `cta-final`.
  - Post Único: 1 slide (`capa` ou `frase-destaque-com-box`).
  - Cada item de `slides` segue o schema do seu `tipo` (ver `lib/render/schemas.js`).
  - Rich text: `_destaque_`, `**forte**`, `~~riscado~~` em campos marcados "rich".
- Salve em `samples/<ts>/content.json`.

### Passo 3 — Renderizar arte (LOCAL, sem IA)

A arte NÃO é gerada pela IA. É renderizada pelo renderer local. Você tem duas opções:

**Opção A — inline (preferível):** escreva um script temporário que importa `renderCarrossel` e o conteúdo gerado, e rode com `node`:

```js
// samples/<ts>/render.mjs
import fs from 'node:fs';
import path from 'node:path';
import { renderCarrossel } from '../../lib/render/render.js';
import { NEXUM_DNA } from '../../lib/render/presets.js';

const content = JSON.parse(fs.readFileSync(new URL('./content.json', import.meta.url)));
const htmls = renderCarrossel({
  slides: content.slides,
  dna: NEXUM_DNA, // ou DNA do brand-profile.json se houver
  pilar: '<pilar recebido>',
  tags: ['<tag>'],
});
htmls.forEach((html, i) => {
  fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), `slide-${i+1}.html`), html);
});
```

Rode: `node samples/<ts>/render.mjs`.

**Opção B — só 1 slide:** chame `renderSlide({ conteudo, dna, indice, total, pilar, tags })` via script curto.

Se o usuário passou `slide=N`, renderize só o slide N.

### Passo 4 — Preview

- Abra `samples/<ts>/slide-1.html` via `Read` (fica no preview).
- Liste arquivos gerados pro usuário com caminhos clicáveis.

## Regras

- **NÃO gere HTML você mesmo.** A arte vem do renderer. Se o layout de um tipo não existir ou ficar feio, o caminho é ajustar `lib/render/templates.js`, não inventar HTML aqui.
- **NÃO use `variante`.** O parâmetro não existe mais. Visual = DNA.
- **Valide o conteúdo** antes de renderizar — `renderSlide` aceita `validar: true` e lança se o JSON violar o schema.
- **NÃO chame API externa.** Tudo local.
- **Releia os arquivos-fonte** antes de cada execução pra refletir mudanças recentes.
- Respostas curtas no chat; conteúdo rico nos arquivos.

## Output final

```
Gerado em samples/<ts>/
- ideias: samples/<ts>/ideas.json
- conteúdo: samples/<ts>/content.json
- arte: slide-1.html … slide-N.html (primeiro aberto no preview)
```
