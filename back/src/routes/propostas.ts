import { prisma } from "../../lib/prisma"
import { criarProposta, responderProposta, ConflitoProposta } from "../../services/propostaServices"
import { StatusProposta } from "../../generated/prisma/enums"
import { authAdmin, authClube } from "../middlewares/auth"

import { Router } from 'express'
import { z } from 'zod'

const router = Router()
router.param('id', (req, res, next, id) => {
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1 || Number(id) > 2147483647) {
    res.status(400).json({ erro: 'ID inválido' }); return
  }
  next()
})

const propostaSchema = z.object({
  valorOferta: z.number().max(9999999999.99).positive({ message: "Valor da oferta deve ser maior que zero" }),
  mensagem: z.string().trim().max(5000).min(3, { message: "Mensagem deve possuir, no mínimo, 3 caracteres" }),
  jogadorId: z.number().int().positive(),
})

const respostaSchema = z.object({
  resposta: z.string().trim().min(1).max(5000),
  status: z.enum(StatusProposta),
})

const clubePublico = { id: true, nome: true, pais: true, email: true } as const

router.get("/", authAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Propostas']
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.summary = 'Lista todas as propostas'
    #swagger.description = 'Retorna todas as propostas do sistema, com os dados do jogador e do clube (sem a senha). Requer autenticação de administrador.'
    #swagger.responses[200] = { description: 'Lista de propostas retornada com sucesso.' }
    #swagger.responses[401] = { description: 'Não autenticado.' }
  */
  try {
    const propostas = await prisma.proposta.findMany({
      include: { jogador: true, clube: { select: clubePublico } },
      orderBy: { createdAt: "desc" },
    })
    res.status(200).json(propostas)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

router.get("/minhas", authClube, async (req, res) => {
  /*
    #swagger.tags = ['Propostas']
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.summary = 'Lista as propostas do clube autenticado'
    #swagger.description = 'Retorna as propostas feitas pelo clube dono do token enviado (não é possível ver propostas de outro clube). Usada na tela "Minhas Propostas".'
    #swagger.responses[200] = { description: 'Lista de propostas do clube retornada com sucesso.' }
    #swagger.responses[401] = { description: 'Não autenticado.' }
  */
  try {
    const propostas = await prisma.proposta.findMany({
      where: { clubeId: req.clubeId },
      include: { jogador: true },
      orderBy: { createdAt: "desc" },
    })
    res.status(200).json(propostas)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

router.post("/", authClube, async (req, res) => {
  /*
    #swagger.tags = ['Propostas']
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.summary = 'Cria uma proposta'
    #swagger.description = 'O clube autenticado (via token) faz uma proposta por um jogador. O clube da proposta é sempre o do token, não um valor enviado pelo corpo.'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        valorOferta: 8000000,
        mensagem: 'Pago 6 milhões à vista e 2 milhões em 3x',
        jogadorId: 1
      }
    }
    #swagger.responses[201] = { description: 'Proposta criada com sucesso.' }
    #swagger.responses[400] = { description: 'Dados inválidos ou jogador indisponível.' }
    #swagger.responses[401] = { description: 'Não autenticado.' }
  */
  const valida = propostaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { valorOferta, mensagem, jogadorId } = valida.data

  try {
    const proposta = await criarProposta({ valorOferta, mensagem, jogadorId, clubeId: req.clubeId! })
    res.status(201).json(proposta)
  } catch (error) {
    if (error instanceof ConflitoProposta || (error as { code?: string }).code === 'P2034') {
      res.status(409).json({ erro: error instanceof ConflitoProposta ? error.message : 'A negociação mudou. Atualize a página e tente novamente.' })
      return
    }
    res.status(400).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

router.put("/:id", authAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Propostas']
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.summary = 'Responde/atualiza uma proposta'
    #swagger.description = 'Usada pelo administrador para aceitar, recusar e responder uma proposta. Ao aceitar, o jogador é marcado como TRANSFERIDO, retirado dos destaques e as demais propostas pendentes por ele são recusadas automaticamente. Requer autenticação de administrador.'
    #swagger.parameters['id'] = {
      in: 'path',
      required: true,
      type: 'integer',
      description: 'Código da proposta'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: { resposta: 'Ok. Aceitamos a proposta.', status: 'ACEITA' }
    }
    #swagger.responses[200] = { description: 'Proposta atualizada com sucesso.' }
    #swagger.responses[400] = { description: 'Dados inválidos.' }
    #swagger.responses[401] = { description: 'Não autenticado.' }
  */
  const { id } = req.params

  const valida = respostaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { resposta, status } = valida.data

  try {
    const proposta = await responderProposta(Number(id), resposta, status)
    res.status(200).json(proposta)
  } catch (error) {
    if (error instanceof ConflitoProposta || (error as { code?: string }).code === 'P2034') {
      res.status(409).json({ erro: error instanceof ConflitoProposta ? error.message : 'A negociação mudou. Atualize a página e tente novamente.' })
      return
    }
    res.status(400).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

router.delete("/:id", authAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Propostas']
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.summary = 'Exclui uma proposta'
    #swagger.description = 'Requer autenticação de administrador.'
    #swagger.parameters['id'] = {
      in: 'path',
      required: true,
      type: 'integer',
      description: 'Código da proposta'
    }
    #swagger.responses[200] = { description: 'Proposta excluída com sucesso.' }
    #swagger.responses[400] = { description: 'Não foi possível excluir.' }
    #swagger.responses[401] = { description: 'Não autenticado.' }
  */
  const { id } = req.params
  try {
    const proposta = await prisma.proposta.deleteMany({ where: { id: Number(id), status: { not: 'ACEITA' } } })
    if (!proposta.count) { res.status(409).json({ erro: 'Proposta inexistente ou aceita; o histórico da transferência deve ser preservado.' }); return }
    res.status(200).json(proposta)
  } catch (error) {
    if (error instanceof ConflitoProposta || (error as { code?: string }).code === 'P2034') {
      res.status(409).json({ erro: error instanceof ConflitoProposta ? error.message : 'A negociação mudou. Atualize a página e tente novamente.' })
      return
    }
    res.status(400).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

export default router
