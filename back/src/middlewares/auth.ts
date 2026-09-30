import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres')

interface TokenClube {
  tipo: 'clube'
  clubeId: string
}

interface TokenAdmin {
  tipo: 'admin'
  adminId: number
}

declare global {
  namespace Express {
    interface Request {
      clubeId?: string
      adminId?: number
    }
  }
}

export function gerarTokenClube(clubeId: string): string {
  const payload: TokenClube = { tipo: 'clube', clubeId }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function gerarTokenAdmin(adminId: number): string {
  const payload: TokenAdmin = { tipo: 'admin', adminId }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

function extrairToken(req: Request): string | null {
  const cabecalho = req.headers.authorization
  if (!cabecalho || !cabecalho.startsWith('Bearer ')) return null
  return cabecalho.slice('Bearer '.length)
}

// Exige um clube autenticado. Preenche req.clubeId a partir do token (nunca confie
// em um clubeId enviado pelo corpo da requisição para operações sensíveis).
export function authClube(req: Request, res: Response, next: NextFunction) {
  const token = extrairToken(req)
  if (!token) {
    res.status(401).json({ erro: 'Não autenticado. Faça login novamente.' })
    return
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as TokenClube
    if (payload.tipo !== 'clube' || typeof payload.clubeId !== 'string' || !/^[0-9a-f-]{36}$/i.test(payload.clubeId)) throw new Error('tipo de token inválido')
    req.clubeId = payload.clubeId
    next()
  } catch {
    res.status(401).json({ erro: 'Sessão inválida ou expirada. Faça login novamente.' })
  }
}

// Exige um administrador autenticado.
export function authAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extrairToken(req)
  if (!token) {
    res.status(401).json({ erro: 'Não autenticado. Faça login novamente.' })
    return
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as TokenAdmin
    if (payload.tipo !== 'admin' || !Number.isInteger(payload.adminId) || payload.adminId <= 0) throw new Error('tipo de token inválido')
    req.adminId = payload.adminId
    next()
  } catch {
    res.status(401).json({ erro: 'Sessão inválida ou expirada. Faça login novamente.' })
  }
}
