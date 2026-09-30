export interface Posicao {
  id: number
  nome: string
}

export interface Jogador {
  id: number
  nome: string
  idade: number
  nacionalidade: string
  clubeAtual: string
  pernaBoa: "DESTRA" | "CANHOTA" | "AMBIDESTRO"
  valorPedido: string
  foto: string
  videoDestaque?: string | null
  status: "DISPONIVEL" | "EM_NEGOCIACAO" | "TRANSFERIDO"
  destaque: boolean
  pontosFortes?: string | null
  pontosFracos?: string | null
  estiloDeJogo?: string | null
  jogadorComparavel?: string | null
  potencialMercado?: string | null
  analiseIA: boolean
  posicao: Posicao
  posicaoId: number
}

export interface Clube {
  id: string
  nome: string
  pais: string
  email: string
}

export interface Proposta {
  id: number
  valorOferta: string
  mensagem: string
  resposta?: string | null
  status: "PENDENTE" | "ACEITA" | "RECUSADA"
  createdAt: string
  jogador: Jogador
  clube?: Clube
}
