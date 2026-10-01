import "dotenv/config"
import bcrypt from "bcryptjs"
import { prisma } from "../lib/prisma"
import { responderProposta } from "../services/propostaServices"
import { buscarDadosComGemini } from "../services/iaServices"

const CONSULTAR_IA_PARA_TODOS = false

const nomes = [
  "Rafael Andrade", "Bruno Castilho", "Diego Ferreira", "Lucas Martins", "Thiago Souza",
  "Miguel Torres", "Enzo Ribeiro", "Gabriel Costa", "Matheus Lima", "Pedro Alves",
  "Carlos Herrera", "Andrés Gómez", "João Pinto", "Nuno Silva", "Igor Petrov",
  "Marco Rossi", "Kwame Mensah", "Yuto Tanaka", "Sipho Ndlovu", "Ivan Kovač",
]

const nacionalidades = ["Brasil", "Argentina", "Portugal", "Espanha", "Itália", "Uruguai", "Colômbia", "Japão", "Gana", "Croácia"]
const clubesAtuais = ["Grêmio Náutico", "Sporting Litoral", "Estrella del Sur", "Real Montanha", "Atlético Vale", "União Costeira", "Deportivo Norte", "FC Vento Sul"]
const paisesClubes = ["Brasil", "Portugal", "Espanha", "Argentina", "Itália"]
const statusJogador = ["DISPONIVEL", "EM_NEGOCIACAO"] as const
const statusProposta = ["PENDENTE", "PENDENTE", "ACEITA", "RECUSADA"] as const

function aleatorio<T>(lista: readonly T[]): T {
  return lista[Math.floor(Math.random() * lista.length)]
}

function fotoAleatoria(seed: number) {
  return `https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&sig=${seed}`
}

async function main() {
  if (process.env.SEED_DEMO !== 'true' || !process.env.DEMO_PASSWORD || process.env.DEMO_PASSWORD.length < 12) {
    throw new Error('Seed de demonstração exige SEED_DEMO=true e DEMO_PASSWORD com 12 caracteres')
  }
  const posicoes = await prisma.posicao.findMany()
  if (posicoes.length === 0) {
    throw new Error("Rode antes o `npm run seed` para criar as posições e o admin.")
  }

  const senhaHash = await bcrypt.hash(process.env.DEMO_PASSWORD, 10)

  const clubes = []
  for (let i = 0; i < 6; i++) {
    const clube = await prisma.clube.upsert({
      where: { email: `clube${i}@exemplo.com` },
      update: {},
      create: {
        nome: `Clube Exemplo ${i + 1}`,
        pais: aleatorio(paisesClubes),
        email: `clube${i}@exemplo.com`,
        senha: senhaHash,
      },
    })
    clubes.push(clube)
  }

  const jogadoresCriados = []
  for (let i = 0; i < nomes.length; i++) {
    const nome = nomes[i]
    const posicao = aleatorio(posicoes)
    const idade = 18 + Math.floor(Math.random() * 18)
    const clubeAtual = aleatorio(clubesAtuais)

    const jogador = await prisma.jogador.create({
      data: {
        nome,
        idade,
        nacionalidade: aleatorio(nacionalidades),
        clubeAtual,
        pernaBoa: aleatorio(["DESTRA", "CANHOTA", "AMBIDESTRO"] as const),
        valorPedido: 500000 + Math.floor(Math.random() * 15000000),
        foto: fotoAleatoria(i),
        status: aleatorio(statusJogador),
        destaque: Math.random() > 0.4,
        posicaoId: posicao.id,
      },
    })

    if (i < 3 || CONSULTAR_IA_PARA_TODOS) {
      try {
        const dadosIA = await buscarDadosComGemini(nome, idade, posicao.nome, clubeAtual)
        await prisma.jogador.update({
          where: { id: jogador.id },
          data: {
            pontosFortes: JSON.stringify(dadosIA.pontosFortes ?? []),
            pontosFracos: JSON.stringify(dadosIA.pontosFracos ?? []),
            estiloDeJogo: dadosIA.estiloDeJogo ?? null,
            jogadorComparavel: dadosIA.jogadorComparavel ?? null,
            potencialMercado: dadosIA.potencialMercado ?? null,
            analiseIA: true,
          },
        })
      } catch (erro: any) {
        console.log(`Falha ao consultar IA para ${nome}:`, erro.message)
      }
    } else {
      await prisma.jogador.update({
        where: { id: jogador.id },
        data: {
          pontosFortes: JSON.stringify(["Técnica apurada", "Bom posicionamento"]),
          pontosFracos: JSON.stringify(["Consistência"]),
          estiloDeJogo: "Perfil ainda em análise pela equipe de scout.",
          jogadorComparavel: "A definir",
          potencialMercado: aleatorio(["Alto", "Médio", "Em desenvolvimento"]),
        },
      })
    }

    jogadoresCriados.push(jogador)
    console.log(`Jogador criado (${i + 1}/${nomes.length}): ${nome}`)
  }

  let totalPropostas = 0
  for (const clube of clubes) {
    const quantidade = 1 + Math.floor(Math.random() * 4)
    for (let i = 0; i < quantidade; i++) {
      const jogador = aleatorio(jogadoresCriados)
      const atual = await prisma.jogador.findUniqueOrThrow({ where: { id: jogador.id } })
      if (atual.status === 'TRANSFERIDO') continue
      const status = aleatorio(statusProposta)
      const proposta = await prisma.proposta.create({
        data: {
          valorOferta: Number(jogador.valorPedido) * (0.7 + Math.random() * 0.4),
          mensagem: "Proposta gerada automaticamente para teste da Dashboard.",
          jogadorId: jogador.id,
          clubeId: clube.id,
          status: "PENDENTE",
        },
      })
      if (status !== "PENDENTE") await responderProposta(proposta.id, "Resposta automática de teste.", status)
      totalPropostas++
    }
  }

  console.log(`\nConcluído! ${jogadoresCriados.length} jogadores, ${clubes.length} clubes e ${totalPropostas} propostas criadas.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => { await prisma.$disconnect() })
