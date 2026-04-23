// Conteúdo estruturado do post 8 — prova de conceito do refactor.
// Mesma informação do post atual, mas agora em JSON tipado.
// O que era HTML "costurado à mão" vira dado editável.

export const POC_PAUTA = {
  tema: 'Sua marca tem personalidade — ou só tem logotipo?',
  pilar: 'Estratégia de Marca',
  tags: ['Estratégia · Marca'],

  slides: [
    // Slide 1 · capa
    {
      tipo: 'capa',
      tagline: 'Carrossel · 01/07',
      titulo: 'Sua marca tem _personalidade_ — ou só tem logotipo?',
      subtitulo: 'A diferença aparece na hora da escolha do cliente. Não no manual de identidade.',
    },

    // Slide 2 · grid-2-colunas
    {
      tipo: 'grid-2-colunas',
      titulo: 'Logotipo é o que você _mostra_. Marca é o que _fica_.',
      esquerda: {
        label: 'Logotipo',
        destaque: 'Vitrine',
        descricao: 'A empresa decora a fachada antes de definir o que vende. Bonito por fora, igual a todo mundo por dentro.',
      },
      direita: {
        label: 'Marca',
        destaque: 'Posição',
        descricao: 'O que a empresa representa e por que o cliente escolhe ela — mesmo quando existe alternativa mais barata ao lado.',
      },
    },

    // Slide 3 · lista-numerada
    {
      tipo: 'lista-numerada',
      label: 'Diagnóstico rápido',
      titulo: 'Três sinais de que sua marca é só logotipo.',
      itens: [
        {
          titulo: 'O cliente chega pelo _preço_.',
          descricao: 'Sem proposta clara de valor, a única variável de decisão é quanto custa — e sempre vai ter alguém mais barato.',
        },
        {
          titulo: 'O time comercial explica o que vocês fazem antes de vender.',
          descricao: 'Se o vendedor precisa traduzir a empresa, a marca não está comunicando — está enfeitando.',
        },
        {
          titulo: 'Qualquer concorrente poderia assinar seu conteúdo.',
          descricao: 'Ausência de ponto de vista próprio é o sintoma mais caro e mais comum nas marcas B2B.',
        },
      ],
    },

    // Slide 4 · grid-4-pilares
    {
      tipo: 'grid-4-pilares',
      titulo: 'Personalidade de marca não está no ~~visual~~. Está na _decisão_.',
      pilares: [
        { label: 'O que diz',     texto: 'Ponto de vista próprio, não eco do mercado.' },
        { label: 'O que recusa',  texto: 'O que não fazemos — e por quê.' },
        { label: 'Quem afasta',   texto: 'O cliente errado, de propósito.' },
        { label: 'Onde sustenta', texto: 'Valor percebido, mesmo sob pressão de preço.' },
      ],
    },

    // Slide 5 · frase-destaque-com-box
    {
      tipo: 'frase-destaque-com-box',
      label: 'Consequência estratégica',
      titulo: 'Marca sem posicionamento compete por _preço_. Sempre.',
      box: {
        label: 'Por quê',
        texto: 'Sem critério claro de valor, o cliente só tem um eixo para decidir: quanto custa. E nesse eixo, sempre vai existir alguém mais barato que você.',
      },
    },

    // Slide 6 · comparacao-contraste
    {
      tipo: 'comparacao-contraste',
      titulo: 'Branding ≠ vendas. Branding resolve _percepção_.',
      caixa_a: {
        label: 'Expectativa errada',
        titulo: 'ROI em 30 dias',
        descricao: 'Quem trata branding como campanha de performance desiste no dia 31 — antes de qualquer resultado real.',
      },
      caixa_b: {
        label: 'Ativo de longo prazo',
        titulo: 'Margem, autoridade, recorrência',
        descricao: 'Percepção consistente reduz custo de aquisição, sustenta preço e cria preferência duradoura.',
      },
      fechamento: 'Quem confunde os dois **paga em margem** o que deixa de construir em posicionamento.',
    },

    // Slide 7 · cta-final
    {
      tipo: 'cta-final',
      tagline: 'Ângulo Nexum360',
      titulo: 'Marca é _estratégia com aparência_. Não o contrário.',
      metodo: {
        label: 'Como construímos marca na Nexum360',
        passos: [
          { destaque: 'posicionamento',    frase: 'Primeiro, **posicionamento** — o que a marca representa e para quem.' },
          { destaque: 'narrativa',         frase: 'Depois, **narrativa** — o que dizer, o que recusar, quem afastar.' },
          { destaque: 'identidade visual', frase: 'Por último, **identidade visual** — consequência, não partida.' },
        ],
      },
      cta: {
        texto: 'Pronto para parar de competir por preço?',
        url: 'nexum360.com.br',
      },
    },
  ],
};
