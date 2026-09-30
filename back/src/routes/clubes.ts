import { prisma } from "../../lib/prisma"
import { authClube, gerarTokenClube } from "../middlewares/auth"

import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const router = Router()

const cadastroSchema = z.object({
  nome: z.string().trim().max(80).min(2, { message: "Nome deve possuir, no mínimo, 2 caracteres" }),
  pais: z.string().trim().min(2).max(50),
  email: z.string().trim().toLowerCase().max(120).email({ message: "E-mail inválido" }),
  senha: z.string().min(6, { message: "Senha deve possuir, no mínimo, 6 caracteres" }),
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(120).email(),
  senha: z.string(),
})

// POST /clubes -> cadastro de um novo clube (cliente do sistema)
router.post("/", async (req, res) => {
  /*
    #swagger.tags = ['Clubes']
    #swagger.summary = 'Cadastra um clube'
    #swagger.description = 'Cria um novo clube (cliente do sistema), que poderá fazer login e enviar propostas por jogadores.'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        nome: 'FC Exemplo',
        pais: 'Brasil',
        email: 'diretoria@fcexemplo.com',
        senha: '123456'
      }
    }
    #swagger.responses[201] = { description: 'Clube cadastrado com sucesso.' }
    #swagger.responses[400] = { description: 'Dados inválidos ou e-mail já utilizado.' }
  */
  const valida = cadastroSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, pais, email, senha } = valida.data

  try {
    const senhaHash = await bcrypt.hash(senha, 10)
    const clube = await prisma.clube.create({
      data: { nome, pais, email, senha: senhaHash },
    })
    res.status(201).json({ id: clube.id, nome: clube.nome, pais: clube.pais, email: clube.email })
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível cadastrar. E-mail já utilizado?" })
  }
})

// POST /clubes/login -> autentica o clube e retorna um token JWT
router.post("/login", async (req, res) => {
  /*
    #swagger.tags = ['Clubes']
    #swagger.summary = 'Login do clube'
    #swagger.description = 'Autentica o clube e retorna um token JWT. O front-end guarda o token (em memória e, se "Manter Conectado", também no LocalStorage) e o envia no cabeçalho Authorization das próximas requisições.'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: { email: 'diretoria@fcexemplo.com', senha: '123456' }
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
    const clube = await prisma.clube.findUnique({ where: { email } })
    if (!clube) {
      res.status(400).json({ erro: "E-mail ou senha inválidos" })
      return
    }

    const senhaCorreta = await bcrypt.compare(senha, clube.senha)
    if (!senhaCorreta) {
      res.status(400).json({ erro: "E-mail ou senha inválidos" })
      return
    }

    const token = gerarTokenClube(clube.id)
    res.status(200).json({
      token,
      clube: { id: clube.id, nome: clube.nome, pais: clube.pais, email: clube.email },
    })
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

// GET /clubes/me -> recupera os dados do PRÓPRIO clube autenticado (via token)
router.get("/me", authClube, async (req, res) => {
  /*
    #swagger.tags = ['Clubes']
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.summary = 'Dados do clube autenticado'
    #swagger.description = 'Retorna os dados do clube dono do token enviado no cabeçalho Authorization. Usada para restaurar a sessão ao reabrir o front-end.'
    #swagger.responses[200] = { description: 'Clube encontrado.' }
    #swagger.responses[401] = { description: 'Não autenticado.' }
  */
  try {
    const clube = await prisma.clube.findUnique({
      where: { id: req.clubeId },
      select: { id: true, nome: true, pais: true, email: true },
    })
    if (!clube) {
      res.status(404).json({ erro: "Clube não encontrado" })
      return
    }
    res.status(200).json(clube)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível concluir a operação. Verifique os dados e tente novamente." })
  }
})

export default router
