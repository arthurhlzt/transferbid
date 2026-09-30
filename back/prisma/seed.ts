import "dotenv/config"
import bcrypt from "bcryptjs"
import { prisma } from "../lib/prisma"
import { buscarDadosComGemini } from "../services/iaServices"

// Cadastra um jogador e tenta enriquecer com uma consulta REAL ao Gemini.
// Se a GEMINI_API_KEY não estiver configurada (ou a chamada falhar), o jogador
// é criado mesmo assim, só que sem os campos de análise (analiseIA fica false) —
// evita fingir que existe uma análise de IA quando não existe.
async function criarJogadorComIA(data: {
  nome: string; idade: number; nacionalidade: string; clubeAtual: string
  pernaBoa: "DESTRA" | "CANHOTA" | "AMBIDESTRO"; valorPedido: number; foto: string
  posicaoId: number; posicaoNome: string
}) {
  const jogador = await prisma.jogador.create({
    data: {
      nome: data.nome, idade: data.idade, nacionalidade: data.nacionalidade,
      clubeAtual: data.clubeAtual, pernaBoa: data.pernaBoa, valorPedido: data.valorPedido,
      foto: data.foto, status: "DISPONIVEL", destaque: true, posicaoId: data.posicaoId,
    },
  })

  try {
    const dadosIA = await buscarDadosComGemini(data.nome, data.idade, data.posicaoNome, data.clubeAtual)
    return prisma.jogador.update({
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
    console.log(`Aviso: não foi possível consultar o Gemini para ${data.nome} (${erro.message}). Configure GEMINI_API_KEY no .env para habilitar a análise.`)
    return jogador
  }
}

async function main() {
  const emailAdmin = (process.env.ADMIN_EMAIL || 'admin@agencia.com').trim().toLowerCase()
  const senhaAdmin = process.env.ADMIN_PASSWORD
  if (!senhaAdmin || senhaAdmin.length < 12) throw new Error('ADMIN_PASSWORD deve ter pelo menos 12 caracteres')
  const demo = process.env.SEED_DEMO === 'true'
  if (demo && (!process.env.DEMO_PASSWORD || process.env.DEMO_PASSWORD.length < 12)) throw new Error('Configure DEMO_PASSWORD com pelo menos 12 caracteres')
  const senhaHash = await bcrypt.hash(senhaAdmin, 10)

  await prisma.admin.upsert({
    where: { email: emailAdmin },
    update: { senha: senhaHash },
    create: {
      nome: "Empresário Responsável",
      email: emailAdmin,
      senha: senhaHash,
    },
  })

  const posicoes = ["Goleiro", "Zagueiro", "Lateral", "Volante", "Meia", "Atacante"]
  for (const nome of posicoes) {
    const existe = await prisma.posicao.findFirst({ where: { nome } })
    if (!existe) {
      await prisma.posicao.create({ data: { nome } })
    }
  }

  const totalJogadores = await prisma.jogador.count()
  if (demo && totalJogadores === 0) {
    const meia = await prisma.posicao.findFirstOrThrow({ where: { nome: "Meia" } })
    const atacante = await prisma.posicao.findFirstOrThrow({ where: { nome: "Atacante" } })
    const zagueiro = await prisma.posicao.findFirstOrThrow({ where: { nome: "Zagueiro" } })

    const jogador1 = await criarJogadorComIA({
      nome: "Rafael Andrade", idade: 22, nacionalidade: "Brasil", clubeAtual: "Grêmio Náutico",
      pernaBoa: "DESTRA", valorPedido: 8500000,
      foto: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800",
      posicaoId: atacante.id, posicaoNome: atacante.nome,
    })

    const jogador2 = await criarJogadorComIA({
      nome: "Bruno Castilho", idade: 26, nacionalidade: "Portugal", clubeAtual: "Sporting Litoral",
      pernaBoa: "CANHOTA", valorPedido: 4200000,
      foto: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800",
      posicaoId: meia.id, posicaoNome: meia.nome,
    })

    await criarJogadorComIA({
      nome: "Diego Ferreira", idade: 29, nacionalidade: "Argentina", clubeAtual: "Estrella del Sur",
      pernaBoa: "DESTRA", valorPedido: 2800000,
      foto: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=800",
      posicaoId: zagueiro.id, posicaoNome: zagueiro.nome,
    })

    const clubeExemplo = await prisma.clube.upsert({
      where: { email: "diretoria@fcexemplo.com" },
      update: {},
      create: {
        nome: "FC Exemplo",
        pais: "Brasil",
        email: "diretoria@fcexemplo.com",
        senha: await bcrypt.hash(process.env.DEMO_PASSWORD!, 10),
      },
    })

    await prisma.proposta.create({
      data: {
        valorOferta: 8000000,
        mensagem: "Pago 6 milhões à vista e 2 milhões em 3x",
        jogadorId: jogador1.id,
        clubeId: clubeExemplo.id,
      },
    })

    await prisma.proposta.create({
      data: {
        valorOferta: 4000000,
        mensagem: "Proposta com metas de performance no primeiro ano",
        jogadorId: jogador2.id,
        clubeId: clubeExemplo.id,
      },
    })
  }

  console.log("Seed concluído. Credenciais definidas pelas variáveis de ambiente.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
