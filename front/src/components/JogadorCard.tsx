import { Link } from "react-router-dom"
import { ImgComFallback } from "./ImgComFallback"
import type { Jogador } from "../types"

const STATUS_LABEL: Record<string, string> = {
  DISPONIVEL: "Disponível",
  EM_NEGOCIACAO: "Em negociação",
  TRANSFERIDO: "Transferido",
}
const STATUS_CLASSE: Record<string, string> = {
  DISPONIVEL: "aceita",
  EM_NEGOCIACAO: "pendente",
  TRANSFERIDO: "recusada",
}

function resumoIA(jogador: Jogador): string | null {
  if (!jogador.analiseIA || !jogador.potencialMercado) return null
  const base = `IA · Potencial ${jogador.potencialMercado}`
  return jogador.jogadorComparavel ? `${base} · lembra ${jogador.jogadorComparavel}` : base
}

export function JogadorCard({ jogador }: { jogador: Jogador }) {
  const resumo = resumoIA(jogador)

  return (
    <div className="jogador-card">
      <ImgComFallback src={jogador.foto} alt={`Foto de ${jogador.nome}`} />
      <div className="jogador-card-corpo">
        <div className="etiquetas">
          <span className="tag">{jogador.posicao?.nome}</span>
          <span className={`status-pill ${STATUS_CLASSE[jogador.status]}`}>{STATUS_LABEL[jogador.status]}</span>
        </div>
        <h3>{jogador.nome}</h3>
        <p className="posicao">{jogador.idade} anos · {jogador.nacionalidade}</p>
        <p className="clube-atual">Atualmente no {jogador.clubeAtual}</p>
        {resumo && <p className="resumo-ia">{resumo}</p>}
        <p className="valor">R$ {Number(jogador.valorPedido).toLocaleString("pt-BR")}</p>
        <Link to={`/jogadores/${jogador.id}`} className="btn-detalhes">Ver Detalhes →</Link>
      </div>
    </div>
  )
}
