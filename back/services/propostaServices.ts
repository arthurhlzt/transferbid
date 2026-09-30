import { prisma } from '../lib/prisma'

export class ConflitoProposta extends Error {}

export async function criarProposta(data: { valorOferta: number; mensagem: string; jogadorId: number; clubeId: string }) {
  return prisma.$transaction(async (tx) => {
    const jogador = await tx.jogador.findUnique({ where: { id: data.jogadorId } })
    if (!jogador) throw new ConflitoProposta('Jogador não encontrado')
    if (jogador.status === 'TRANSFERIDO') throw new ConflitoProposta('O jogador já foi transferido')
    return tx.proposta.create({ data })
  }, { isolationLevel: 'Serializable' })
}

export async function responderProposta(id: number, resposta: string, status: 'PENDENTE' | 'ACEITA' | 'RECUSADA') {
  return prisma.$transaction(async (tx) => {
    const atual = await tx.proposta.findUnique({ where: { id }, include: { jogador: true } })
    if (!atual) throw new ConflitoProposta('Proposta não encontrada')
    if (atual.status !== 'PENDENTE') throw new ConflitoProposta('Esta proposta já foi encerrada')
    if (atual.jogador.status === 'TRANSFERIDO') throw new ConflitoProposta('O jogador já foi transferido')
    if (status === 'ACEITA') {
      const venda = await tx.jogador.updateMany({
        where: { id: atual.jogadorId, status: { not: 'TRANSFERIDO' } },
        data: { status: 'TRANSFERIDO', destaque: false },
      })
      if (venda.count !== 1) throw new ConflitoProposta('O jogador já foi transferido')
      await tx.proposta.updateMany({
        where: { jogadorId: atual.jogadorId, status: 'PENDENTE', id: { not: id } },
        data: { status: 'RECUSADA', resposta: 'Proposta recusada automaticamente: o jogador foi transferido para outro clube.' },
      })
    }
    return tx.proposta.update({ where: { id }, data: { resposta, status } })
  }, { isolationLevel: 'Serializable' })
}
