// Shared copywriting guidelines for every Gemini-backed text generation Edge
// Function (slogan, about-us, product description, sales summary). Centralizes
// the rules that keep generated copy specific and varied instead of generic
// retail filler, and the mechanism that avoids repeating earlier generations
// when the user clicks "Gerar com IA" more than once on the same field.

export type CopyKind = 'slogan' | 'about' | 'product_description' | 'sales_summary'

const GENERIC_CLICHES = [
  'os melhores produtos',
  'qualidade e confiança',
  'satisfação garantida',
  'a melhor escolha',
  'preços imperdíveis',
  'tradição e qualidade',
  'há anos no mercado',
  'compre com segurança',
]

const COPYWRITING_GUIDELINES = `Você é um copywriter brasileiro especializado em e-commerce e varejo.
Escreva em português do Brasil, com tom direto e confiante, como um lojista experiente falaria com seu cliente.

Regras obrigatórias:
- Nunca use clichês genéricos de varejo, como: ${GENERIC_CLICHES.map((c) => `"${c}"`).join(', ')}. Se uma frase serviria para qualquer loja, ela está errada.
- Use de forma concreta as informações fornecidas no contexto (categoria, marca, condição, atributos, dados). Prefira detalhes específicos a adjetivos vagos.
- Nunca invente fatos que não foram fornecidos: preço, garantia, certificação, tempo de mercado, localização e, especialmente, o que a loja vende (segmento, categoria de produto, nicho). Se o contexto não disser o que a loja vende, NÃO invente um segmento (ex.: não suponha "churrasco", "moda", "eletrônicos" etc. sem essa informação) — escreva algo genérico sobre a experiência de compra, atendimento ou confiança no lojista, sem citar um produto ou nicho específico.
- Escreva em texto simples, sem markdown, sem listas com marcadores e sem emoji, salvo instrução em contrário.
- Seja conciso: cada frase deve agregar informação ou apelo, sem enchimento.`

const CREATIVE_ANGLES = [
  'benefício direto: foque no que o cliente ganha ao comprar',
  'storytelling: sugira um momento ou uso real do produto/loja',
  'emocional: conecte com um desejo ou necessidade do cliente',
  'urgência sutil: transmita que vale a pena agir agora, sem soar artificial',
  'humor leve: um tom descontraído e simpático, sem exagero',
] as const

export function pickCreativeAngle(rng: () => number = Math.random): string {
  const index = Math.floor(rng() * CREATIVE_ANGLES.length)
  return CREATIVE_ANGLES[index]
}

const KIND_INSTRUCTIONS: Record<CopyKind, string> = {
  slogan: 'Gere um slogan curto (até 8 palavras) para a loja. Apenas o slogan, sem aspas ou pontuação final desnecessária.',
  about: 'Gere um texto "Sobre nós" para a página da loja, entre 2 e 4 frases, contando o que a loja vende e por que comprar nela.',
  product_description:
    'Gere a descrição de um produto para a página de venda, entre 2 e 5 frases, destacando os atributos fornecidos e o caso de uso.',
  sales_summary:
    'Gere um resumo curto (2-3 frases) da performance de vendas e uma lista de 3 a 5 oportunidades acionáveis, com base nos dados fornecidos.',
}

export type BuildSystemInstructionOptions = {
  previousTexts?: string[]
  rng?: () => number
}

/**
 * Builds the systemInstruction for a Gemini generateContent call covering one
 * of the copy kinds above. Always includes the fixed guidelines, a randomly
 * picked creative angle (forces structural variation across calls with the
 * same input), and — when the caller supplies texts generated earlier for the
 * same field — an explicit instruction to avoid repeating them.
 */
export function buildSystemInstruction(
  kind: CopyKind,
  options: BuildSystemInstructionOptions = {},
): string {
  const { previousTexts, rng } = options
  const angle = pickCreativeAngle(rng)

  const parts = [
    COPYWRITING_GUIDELINES,
    `Tarefa: ${KIND_INSTRUCTIONS[kind]}`,
    `Ângulo criativo para este texto: ${angle}.`,
  ]

  if (previousTexts && previousTexts.length > 0) {
    const list = previousTexts.map((text, i) => `${i + 1}. ${text}`).join('\n')
    parts.push(
      `O usuário já gerou estas versões anteriormente para o mesmo campo — gere algo com estrutura e vocabulário claramente diferentes, não apenas uma reformulação:\n${list}`,
    )
  }

  return parts.join('\n\n')
}

/** Higher temperature when regenerating, to reinforce variety beyond the prompt instruction. */
export function temperatureFor(previousTexts?: string[]): number {
  return previousTexts && previousTexts.length > 0 ? 0.9 : 0.7
}
