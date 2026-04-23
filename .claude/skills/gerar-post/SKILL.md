---
name: gerar-post
description: Gera um post Nexum360 completo end-to-end (sugestão de ideias → conteúdo → arte HTML) usando os prompts reais de produção em api/suggest-ideas.js, api/generate.js e api/generate-art.js — mas sem chamar API externa. Claude produz o conteúdo diretamente na conversa, salva os artefatos em samples/ e abre o HTML no preview. Use quando o usuário invocar /gerar-post ou pedir para testar o fluxo de geração localmente, sem custo de API.
---

# /gerar-post — Fluxo de geração Nexum360 local

Esta skill substitui o "modo mock" do index.html. Em vez de gerar HTML fake com template fixo, Claude (você) executa os três prompts reais de produção aqui na conversa e entrega o resultado como arquivos.

## Parâmetros (args)

Aceite os parâmetros via string `args`, com formato livre. Se ausentes, use os defaults entre parênteses:

- `pilar` — Estratégia de Marca | Marketing e Performance | Tecnologia e IA | Mentalidade e Gestão Empresarial | Bastidores e Diagnóstico de Negócios (default: `Tecnologia e IA`)
- `rede_social` — Instagram | LinkedIn | Ambos (default: `Instagram`)
- `formato` — Carrossel | Post Único | Artigo | Notícia (default: `Carrossel`)
- `variante` — Dark | Blue | White (default: `Dark`)
- `pub_formato` — feed | story | reels (default: `feed`)
- `sugestao` — direção/tema livre do usuário (opcional)
- `tema` — tema explícito, pula a etapa de sugestões (opcional)
- `slide` — índice específico a renderizar (0-based). Se ausente, gera todos os slides.

Exemplo: `/gerar-post pilar="Tecnologia e IA" rede_social=Instagram formato=Carrossel variante=White sugestao="IA para PMEs"`

## Fonte da verdade dos prompts

**LEIA** estes três arquivos e extraia `SYSTEM_PROMPT` + o construtor do user prompt de cada um. NÃO reescreva a lógica aqui — o repo é a fonte única da verdade:

1. `api/suggest-ideas.js` — passo 1
2. `api/generate.js` — passo 2 (inclui helper `buildUserPrompt` e `PUB_FORMAT_LABELS`)
3. `api/generate-art.js` — passo 3
4. `api/_lib/brand.js` — helper `brandContextBlock`

Se os prompts mudarem no futuro, a skill segue correta porque sempre relê os arquivos.

## Brand profile

Procure `brand-profile.json` no root do repo. Se não existir, use `null` (o `brandContextBlock` trata isso retornando string vazia). Pode-se criar esse arquivo depois com o DNA da marca.

## Fluxo de execução

### Passo 0 — Preparar

1. Ler os 4 arquivos listados acima.
2. Ler `brand-profile.json` se existir.
3. Ler `pautas.json` para pegar `temas_existentes` (campo `tema` de cada pauta) — usado no passo 1 para evitar repetição.
4. Criar diretório `samples/<YYYYMMDD-HHmmss>/` para os artefatos.

### Passo 1 — Sugestão de ideias (equivalente a `/api/suggest-ideas`)

- **Pular** se o usuário forneceu `tema` explicitamente.
- Montar o `userPrompt` exatamente como `api/suggest-ideas.js` faz (com `brandBlock`, `sugestaoTxt`, `existentesTxt`).
- Você (Claude) responde como se fosse o modelo: siga o `SYSTEM_PROMPT` e produza **6 ideias** no schema JSON exato:
  ```json
  { "ideas": [ { "titulo": "...", "subtitulo": "..." }, ... ] }
  ```
- Salve em `samples/<timestamp>/ideas.json`.
- Apresente as 6 ideias numeradas ao usuário e pergunte qual escolher (ou peça `default=1`).

### Passo 2 — Gerar conteúdo (equivalente a `/api/generate`)

- Use a ideia selecionada (ou o `tema` explícito) como `ideia_selecionada`.
- Monte o `userPrompt` usando `buildUserPrompt()` de `api/generate.js` — mesma lógica (brandBlock, temaTxt, ganchoTxt, slidesSchema).
- Você produz o JSON completo seguindo o `SYSTEM_PROMPT` de `generate.js`:
  - `tema`, `gancho`, `angulo_nexum`, `picah`, `slides`, `legenda_ig`, `legenda_li`, `hashtags_ig`, `hashtags_li`.
  - Carrossel = 8 slides exatos; Post Único = 1 slide.
  - Respeite TOM DE VOZ, PICAH, estrutura de carrossel e estrutura de legendas definidas no system prompt.
- Salve em `samples/<timestamp>/content.json`.

### Passo 3 — Gerar arte (equivalente a `/api/generate-art`)

Para **cada slide** (ou apenas o slide pedido em `slide=N`):

- Monte a `pauta` combinando o conteúdo gerado + parâmetros (pilar, variante, formato, rede_social, pub_formato).
- Monte o `userPrompt` exatamente como `api/generate-art.js` faz (tema, gancho, ângulo, pilar, variante, formato, rede_social, fonte, slide info, contador).
- Você gera o HTML completo seguindo o `SYSTEM_PROMPT` de `generate-art.js`:
  - Card 1080×1350px, padding 88px 100px.
  - Fonte Playfair Display + system-ui.
  - Paleta da variante (Dark/Blue/White).
  - HEADER + CONTEÚDO + FOOTER.
  - Use os elementos do design system de forma criativa e adaptada ao conteúdo do slide — **NÃO force todos os elementos em todos os slides**. Varie layouts entre slides.
  - Sem emojis no design.
  - HTML autocontido, sem markdown, sem explicações.
- Salve cada slide como `samples/<timestamp>/slide-<N+1>.html`.

### Passo 4 — Preview

- Abra o primeiro slide HTML gerado com a ferramenta `Read` (para ficar visível no painel de preview do Claude Code, já que a edição/leitura HTML aparece lá).
- Liste ao usuário os arquivos gerados com caminho clicável:
  - `samples/<timestamp>/ideas.json`
  - `samples/<timestamp>/content.json`
  - `samples/<timestamp>/slide-1.html` … `slide-N.html`

## Regras importantes

- **NÃO use o template do mock do index.html**. Ele é ruim. Gere HTML livre e criativo seguindo o design system do `SYSTEM_PROMPT`.
- **VARIE layouts entre slides** — capa pode ser diferente de slide do meio que é diferente do CTA final. Use `deco-number`, `insight-box`, `stat-numbers`, `bullet-list` quando couber.
- **NÃO chame API externa** — tudo acontece na sua resposta.
- **NÃO reescreva prompts inline**. Sempre releia os arquivos `api/*.js` antes de gerar, para refletir a versão atual.
- **TAMANHOS MÍNIMOS (crítico — falha recorrente):** respeite a seção "TAMANHOS MÍNIMOS DE TEXTO" do `SYSTEM_PROMPT` em `api/generate-art.js`. O card é 1080×1350 exibido reduzido no feed — texto abaixo de 1rem para lower-case fica ilegível. Se achar que precisa "apertar" o layout com texto pequeno, corte conteúdo em vez de encolher fonte.
- **NÃO coloque `@media zoom`** no CSS — o card é renderizado em PNG no tamanho nativo.
- Se o usuário pedir para iterar/regenerar um slide específico, aceite `slide=N` e regere só aquele.
- Mantenha as respostas curtas no chat — o conteúdo rico vai para os arquivos.

## Output final (mensagem curta ao usuário)

Depois de gerar tudo, responda com algo como:

```
Gerado em samples/20260420-143022/
- ideias: [ideas.json](samples/20260420-143022/ideas.json)
- conteúdo: [content.json](samples/20260420-143022/content.json)
- arte: slide-1.html … slide-8.html (primeiro aberto no preview)
```
