import { GoogleGenAI } from '@google/genai'

import { z } from 'zod'
const analiseSchema = z.object({
  pontosFortes: z.array(z.string().min(1).max(500)).min(1).max(5),
  pontosFracos: z.array(z.string().min(1).max(500)).min(1).max(5),
  estiloDeJogo: z.string().min(1).max(3000),
  jogadorComparavel: z.string().min(1).max(80),
  potencialMercado: z.string().min(1).max(30),
})

// Schema com os campos que a IA deve retornar sobre o jogador
const schemaJogador = {
  type: 'OBJECT',
  properties: {
    pontosFortes: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Principais pontos fortes técnicos e táticos do jogador (3 a 5 itens)',
    },
    pontosFracos: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Principais pontos a desenvolver do jogador (3 a 5 itens)',
    },
    estiloDeJogo: {
      type: 'STRING',
      description: 'Um parágrafo curto descrevendo o estilo de jogo do atleta',
    },
    jogadorComparavel: {
      type: 'STRING',
      description: 'Nome de um jogador profissional conhecido com estilo semelhante, para efeito de comparação',
    },
    potencialMercado: {
      type: 'STRING',
      description: 'Classificação resumida do potencial de mercado (ex: "Alto", "Médio", "Em desenvolvimento")',
    },
  },
  required: ['pontosFortes', 'pontosFracos', 'estiloDeJogo', 'jogadorComparavel', 'potencialMercado'],
}

export async function buscarDadosComGemini(
  nome: string,
  idade: number,
  posicao: string,
  clubeAtual: string,
) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY não configurada')
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { timeout: 30000 } })
  const resposta = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    contents: `Jogador de futebol: ${nome}, ${idade} anos, posição ${posicao}, atualmente no ${clubeAtual}.
      Com base em jogadores reais de perfil semelhante (não é necessário ser exatamente este atleta, caso não
      seja conhecido, faça uma estimativa plausível a partir da posição, idade e clube), gere uma análise
      resumida de scout: pontos fortes, pontos a desenvolver, estilo de jogo, um jogador profissional
      comparável e o potencial de mercado.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: schemaJogador,
    },
  })

  return analiseSchema.parse(JSON.parse(resposta.text || '{}'))
}
