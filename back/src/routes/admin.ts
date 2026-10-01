import { prisma } from "../../lib/prisma"
import { authAdmin, gerarTokenAdmin } from "../middlewares/auth"

import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const router = Router()

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(120).email(),
  senha: z.string(),
})

router.post("/login", async (req, res) => {
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Login do administrador'
    #swagger.description = 'Autentica o administrador e retorna um token JWT, usado no cabeçalho Authorization para acessar a área restrita.'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: { email: 'admin@agencia.com', senha: 'admin123' }
    }
    #swagger.responses[200] = { description: 'Login realizado com sucesso.' }
    #swagger.responses[400] = { description: 'E-mail ou senha inválidos.' }
  */
  const valida = loginSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { email, senha } = valida.data

  try {
    const admin = await prisma.admin.findUnique({ where: { email } })
    if (!admin) {
      res.status(400).json({ erro: "E-mail ou senha inválidos" })
      return
    }

    const senhaCorreta = await bcrypt.compare(senha, admin.senha)
    if (!senhaCorreta) {
      res.status(400).json({ erro: "E-mail ou senha inválidos" })
      return
    }

    const token = gerarTokenAdmin(admin.id)
    res.status(200).json({ token, nome: admin.nome, email: admin.email })
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

router.get("/dashboard", authAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Admin']
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.summary = 'Dados da Dashboard'
    #swagger.description = 'Retorna as contagens gerais e as agregações usadas nos gráficos da área restrita. Requer autenticação de administrador.'
    #swagger.responses[200] = { description: 'Dados da Dashboard retornados com sucesso.' }
    #swagger.responses[401] = { description: 'Não autenticado.' }
  */
  try {
    const [numJogadores, numClubes, numPropostas] = await Promise.all([
      prisma.jogador.count(),
      prisma.clube.count(),
      prisma.proposta.count(),
    ])

    const jogadoresPorPosicaoRaw = await prisma.jogador.groupBy({
      by: ["posicaoId"],
      _count: { _all: true },
    })
    const posicoes = await prisma.posicao.findMany()
    const jogadoresPorPosicao = jogadoresPorPosicaoRaw.map((item: any) => ({
      posicao: posicoes.find((p: any) => p.id === item.posicaoId)?.nome ?? "Outra",
      total: item._count._all,
    }))

    const clubesPorPaisRaw = await prisma.clube.groupBy({
      by: ["pais"],
      _count: { _all: true },
    })
    const clubesPorPais = clubesPorPaisRaw.map((item: any) => ({
      pais: item.pais,
      total: item._count._all,
    }))

    const propostasPorStatusRaw = await prisma.proposta.groupBy({
      by: ["status"],
      _count: { _all: true },
    })
    const propostasPorStatus = propostasPorStatusRaw.map((item: any) => ({
      status: item.status,
      total: item._count._all,
    }))

    const aceitas = propostasPorStatus.find((p: any) => p.status === "ACEITA")?.total ?? 0
    const recusadas = propostasPorStatus.find((p: any) => p.status === "RECUSADA")?.total ?? 0
    const respondidas = aceitas + recusadas
    const taxaAceitacao = respondidas > 0 ? Math.round((aceitas / respondidas) * 100) : null

    const jogadoresPorStatusRaw = await prisma.jogador.groupBy({
      by: ["status"],
      _count: { _all: true },
    })
    const jogadoresPorStatus = jogadoresPorStatusRaw.map((item: any) => ({
      status: item.status,
      total: item._count._all,
    }))

    const valorMedioPorPosicaoRaw = await prisma.jogador.groupBy({
      by: ["posicaoId"],
      _avg: { valorPedido: true },
    })
    const valorMedioPorPosicao = valorMedioPorPosicaoRaw.map((item: any) => ({
      posicao: posicoes.find((p: any) => p.id === item.posicaoId)?.nome ?? "Outra",
      valorMedio: Number(item._avg.valorPedido ?? 0),
    }))

    res.status(200).json({
      numJogadores,
      numClubes,
      numPropostas,
      taxaAceitacao,
      jogadoresPorPosicao,
      clubesPorPais,
      propostasPorStatus,
      jogadoresPorStatus,
      valorMedioPorPosicao,
    })
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

export default router
