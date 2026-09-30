import { prisma } from "../../lib/prisma"
import { PernaBoa, StatusJogador } from "../../generated/prisma/enums"
import { buscarDadosComGemini } from "../../services/iaServices"
import { authAdmin } from "../middlewares/auth"

import { Router } from 'express'
import { z } from 'zod'

const router = Router()
router.param('id', (req, res, next, id) => {
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1 || Number(id) > 2147483647) {
    res.status(400).json({ erro: 'ID inválido' }); return
  }
  next()
})

const jogadorSchema = z.object({
  nome: z.string().trim().max(80).min(2, { message: "Nome deve possuir, no mínimo, 2 caracteres" }),
  idade: z.number().int().min(14).max(60, { message: "Idade inválida" }),
  nacionalidade: z.string().trim().min(2).max(40),
  clubeAtual: z.string().trim().min(2).max(60),
  pernaBoa: z.enum(PernaBoa).optional(),
  valorPedido: z.number().max(9999999999.99).positive({ message: "Valor pedido deve ser maior que zero" }),
  foto: z.string().url({ message: "Informe uma URL de foto válida" }),
  videoDestaque: z.string().url().regex(/^https?:\/\//).nullable().optional(),
  status: z.enum(StatusJogador).optional(),
  destaque: z.boolean().optional(),
  posicaoId: z.number().int().positive(),
})

const destaqueSchema = z.object({
  destaque: z.boolean(),
})

// GET /jogadores -> lista completa, com filtros combináveis via query string
// (destaque, nome, posicaoId, valorMaximo). Usada também para "destaques" via
// ?destaque=true e para a busca separada por campo da Home.
router.get("/", async (req, res) => {
  /*
    #swagger.tags = ['Jogadores']
    #swagger.summary = 'Lista jogadores (com filtros opcionais)'
    #swagger.description = 'Retorna jogadores cadastrados, combinando os filtros informados (todos opcionais e combináveis com AND).'
    #swagger.parameters['destaque'] = {
      in: 'query', required: false, type: 'string',
      description: 'Quando igual a true, retorna somente os jogadores com destaque = true'
    }
    #swagger.parameters['nome'] = {
      in: 'query', required: false, type: 'string',
      description: 'Filtra por nome, clube atual ou nacionalidade contendo o texto informado'
    }
    #swagger.parameters['posicaoId'] = {
      in: 'query', required: false, type: 'integer',
      description: 'Filtra pela posição informada'
    }
    #swagger.parameters['valorMaximo'] = {
      in: 'query', required: false, type: 'number',
      description: 'Filtra jogadores com valorPedido menor ou igual ao informado'
    }
    #swagger.responses[200] = { description: 'Lista de jogadores retornada com sucesso.' }
  */
  const filtro = z.object({
    destaque: z.enum(['true', 'false']).optional(),
    nome: z.string().max(120).optional(),
    posicaoId: z.coerce.number().int().positive().max(2147483647).optional(),
    valorMaximo: z.coerce.number().nonnegative().max(9999999999.99).optional(),
  }).safeParse(req.query)
  if (!filtro.success) { res.status(400).json({ erro: filtro.error }); return }
  const { destaque, nome, posicaoId, valorMaximo } = filtro.data

  const where: any = {}
  if (destaque !== undefined) where.destaque = destaque === "true"
  if (nome && String(nome).trim()) {
    const termo = String(nome).trim()
    where.OR = [
      { nome: { contains: termo, mode: "insensitive" } },
      { clubeAtual: { contains: termo, mode: "insensitive" } },
      { nacionalidade: { contains: termo, mode: "insensitive" } },
    ]
  }
  if (posicaoId && !isNaN(Number(posicaoId))) where.posicaoId = Number(posicaoId)
  if (valorMaximo !== undefined) where.valorPedido = { lte: Number(valorMaximo) }

  try {
    const jogadores = await prisma.jogador.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: { posicao: true },
      orderBy: { createdAt: "desc" },
    })
    res.status(200).json(jogadores)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

router.get("/:id", async (req, res) => {
  /*
    #swagger.tags = ['Jogadores']
    #swagger.summary = 'Detalha um jogador'
    #swagger.parameters['id'] = {
      in: 'path',
      required: true,
      type: 'integer',
      description: 'Código do jogador'
    }
    #swagger.responses[200] = { description: 'Jogador encontrado.' }
    #swagger.responses[404] = { description: 'Jogador não encontrado.' }
  */
  const { id } = req.params

  try {
    const jogador = await prisma.jogador.findFirst({
      where: { id: Number(id) },
      include: { posicao: true },
    })

    if (!jogador) {
      res.status(404).json({ erro: "Jogador não encontrado" })
      return
    }

    res.status(200).json(jogador)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

// POST /jogadores -> cadastra o jogador (admin) e enriquece automaticamente com dados da IA (Gemini)
router.post("/", authAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Jogadores']
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.summary = 'Cadastra um jogador'
    #swagger.description = 'Cria um novo jogador e, em seguida, consulta a IA (Gemini) para complementar automaticamente pontos fortes, pontos fracos, estilo de jogo, jogador comparável e potencial de mercado. Requer autenticação de administrador.'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        nome: 'Rafael Andrade',
        idade: 22,
        nacionalidade: 'Brasil',
        clubeAtual: 'Grêmio Náutico',
        pernaBoa: 'DESTRA',
        valorPedido: 8500000,
        foto: 'https://exemplo.com/foto.jpg',
        posicaoId: 1
      }
    }
    #swagger.responses[201] = { description: 'Jogador cadastrado (e enriquecido pela IA) com sucesso.' }
    #swagger.responses[400] = { description: 'Dados inválidos.' }
    #swagger.responses[401] = { description: 'Não autenticado.' }
  */
  const valida = jogadorSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const {
    nome, idade, nacionalidade, clubeAtual, pernaBoa = "DESTRA",
    valorPedido, foto, videoDestaque = null, status = "DISPONIVEL",
    destaque = true, posicaoId,
  } = valida.data

  try {
    const jogador = await prisma.jogador.create({
      data: {
        nome, idade, nacionalidade, clubeAtual, pernaBoa,
        valorPedido, foto, videoDestaque, status, destaque, posicaoId,
      },
    })

    const posicao = await prisma.posicao.findUnique({ where: { id: Number(posicaoId) } })

    // Consulta a IA para complementar automaticamente o cadastro (requisito 3).
    // analiseIA só fica true quando a consulta realmente é feita com sucesso —
    // isso evita confundir dado real de IA com conteúdo ilustrativo (ex.: dos seeds).
    let jogadorFinal = jogador
    try {
      const dadosIA = await buscarDadosComGemini(nome, idade, posicao?.nome as string, clubeAtual)

      jogadorFinal = await prisma.jogador.update({
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
    } catch (erroIA: any) {
      console.log("Falha ao consultar o Gemini:", erroIA.message)
    }

    res.status(201).json(jogadorFinal)
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

router.put("/:id", authAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Jogadores']
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.summary = 'Atualiza um jogador'
    #swagger.description = 'Requer autenticação de administrador. Para alternar apenas o destaque, prefira PATCH /jogadores/{id}/destaque.'
    #swagger.parameters['id'] = {
      in: 'path',
      required: true,
      type: 'integer',
      description: 'Código do jogador'
    }
    #swagger.responses[200] = { description: 'Jogador atualizado com sucesso.' }
    #swagger.responses[400] = { description: 'Dados inválidos.' }
    #swagger.responses[401] = { description: 'Não autenticado.' }
  */
  const { id } = req.params

  const valida = jogadorSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  try {
    const jogador = await prisma.$transaction(async (tx) => {
      const atual = await tx.jogador.findUniqueOrThrow({ where: { id: Number(id) } })
      if (atual.status === 'TRANSFERIDO' && (valida.data.status && valida.data.status !== 'TRANSFERIDO' || valida.data.destaque)) {
        throw new Error('Transferência encerrada')
      }
      const perfilMudou = atual.nome !== valida.data.nome || atual.idade !== valida.data.idade ||
        atual.clubeAtual !== valida.data.clubeAtual || atual.posicaoId !== valida.data.posicaoId
      return tx.jogador.update({
        where: { id: Number(id) },
        data: { ...valida.data, ...(perfilMudou ? {
          analiseIA: false, pontosFortes: null, pontosFracos: null, estiloDeJogo: null,
          jogadorComparavel: null, potencialMercado: null,
        } : {}) },
      })
    }, { isolationLevel: 'Serializable' })
    res.status(200).json(jogador)
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

// PATCH /jogadores/:id/destaque -> alterna somente o destaque, sem exigir o objeto inteiro
// (evita o bug de reenviar valorPedido como string e cair na validação de número)
router.patch("/:id/destaque", authAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Jogadores']
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.summary = 'Alterna o destaque de um jogador'
    #swagger.description = 'Atualiza apenas o campo destaque, sem precisar reenviar o restante dos dados do jogador. Requer autenticação de administrador.'
    #swagger.parameters['id'] = {
      in: 'path',
      required: true,
      type: 'integer',
      description: 'Código do jogador'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: { destaque: true }
    }
    #swagger.responses[200] = { description: 'Destaque atualizado com sucesso.' }
    #swagger.responses[400] = { description: 'Dados inválidos.' }
  */
  const { id } = req.params

  const valida = destaqueSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  try {
    const jogador = await prisma.jogador.updateMany({
      where: { id: Number(id), ...(valida.data.destaque ? { status: { not: 'TRANSFERIDO' as const } } : {}) },
      data: { destaque: valida.data.destaque },
    })
    if (!jogador.count) { res.status(409).json({ erro: 'Jogador inexistente ou transferido' }); return }
    res.status(200).json(jogador)
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

router.delete("/:id", authAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Jogadores']
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.summary = 'Exclui um jogador'
    #swagger.description = 'Requer autenticação de administrador.'
    #swagger.parameters['id'] = {
      in: 'path',
      required: true,
      type: 'integer',
      description: 'Código do jogador'
    }
    #swagger.responses[200] = { description: 'Jogador excluído com sucesso.' }
    #swagger.responses[400] = { description: 'Não foi possível excluir.' }
    #swagger.responses[401] = { description: 'Não autenticado.' }
  */
  const { id } = req.params
  try {
    const jogador = await prisma.jogador.delete({ where: { id: Number(id) } })
    res.status(200).json(jogador)
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

export default router
