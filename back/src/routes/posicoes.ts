import { prisma } from "../../lib/prisma"
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

const posicaoSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve possuir, no mínimo, 3 caracteres" })
})

router.get("/", async (req, res) => {
  /*
    #swagger.tags = ['Posições']
    #swagger.summary = 'Lista todas as posições'
    #swagger.description = 'Retorna a lista de posições cadastradas (Goleiro, Zagueiro, Lateral, Volante, Meia, Atacante...), usadas para classificar os jogadores.'
    #swagger.responses[200] = { description: 'Lista de posições retornada com sucesso.' }
  */
  try {
    const posicoes = await prisma.posicao.findMany()
    res.status(200).json(posicoes)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

router.post("/", authAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Posições']
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.summary = 'Cadastra uma posição'
    #swagger.description = 'Cria uma nova posição, usada na classificação dos jogadores.'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: { nome: 'Atacante' }
    }
    #swagger.responses[201] = { description: 'Posição cadastrada com sucesso.' }
    #swagger.responses[400] = { description: 'Dados inválidos.' }
    #swagger.responses[401] = { description: 'Não autenticado.' }
  */
  const valida = posicaoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome } = valida.data

  try {
    const posicao = await prisma.posicao.create({ data: { nome } })
    res.status(201).json(posicao)
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

router.delete("/:id", authAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Posições']
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.summary = 'Exclui uma posição'
    #swagger.parameters['id'] = {
      in: 'path',
      required: true,
      type: 'integer',
      description: 'Código da posição'
    }
    #swagger.responses[200] = { description: 'Posição excluída com sucesso.' }
    #swagger.responses[400] = { description: 'Não foi possível excluir (posição em uso ou inexistente).' }
    #swagger.responses[401] = { description: 'Não autenticado.' }
  */
  const { id } = req.params
  try {
    const posicao = await prisma.posicao.delete({ where: { id: Number(id) } })
    res.status(200).json(posicao)
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

router.put("/:id", authAdmin, async (req, res) => {
  /*
    #swagger.tags = ['Posições']
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.summary = 'Atualiza uma posição'
    #swagger.parameters['id'] = {
      in: 'path',
      required: true,
      type: 'integer',
      description: 'Código da posição'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: { nome: 'Meia' }
    }
    #swagger.responses[200] = { description: 'Posição atualizada com sucesso.' }
    #swagger.responses[400] = { description: 'Dados inválidos.' }
    #swagger.responses[401] = { description: 'Não autenticado.' }
  */
  const { id } = req.params

  const valida = posicaoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  try {
    const posicao = await prisma.posicao.update({
      where: { id: Number(id) },
      data: valida.data,
    })
    res.status(200).json(posicao)
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

export default router
