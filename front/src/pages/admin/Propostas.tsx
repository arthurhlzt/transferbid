import { useEffect, useState } from "react"
import { api } from "../../services/api"
import { StatusPill } from "../../components/StatusPill"
import { EstadoErro } from "../../components/EstadoErro"
import { ImgComFallback } from "../../components/ImgComFallback"
import { IconCheck, IconTrash, IconX } from "../../components/Icons"
import type { Proposta } from "../../types"

const brl = (v: string | number) => `R$ ${Number(v).toLocaleString("pt-BR")}`
const FILTROS = [
  { valor: "TODAS", rotulo: "Todas" },
  { valor: "PENDENTE", rotulo: "Pendentes" },
  { valor: "ACEITA", rotulo: "Aceitas" },
  { valor: "RECUSADA", rotulo: "Recusadas" },
]

export function Propostas() {
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [respostas, setRespostas] = useState<Record<number, string>>({})
  const [filtro, setFiltro] = useState("TODAS")
  const [erroCarga, setErroCarga] = useState(false)
  const [erroAcao, setErroAcao] = useState("")
  const [processando, setProcessando] = useState<number | null>(null)

  function carregar() {
    setErroCarga(false)
    api.get("/propostas").then((r) => setPropostas(r.data)).catch(() => setErroCarga(true))
  }

  useEffect(() => { carregar() }, [])

  async function responder(id: number, status: "ACEITA" | "RECUSADA") {
    if (status === "ACEITA" && !confirm("Aceitar esta proposta? O jogador será marcado como transferido e as demais propostas pendentes serão recusadas.")) return
    const resposta = respostas[id]?.trim() || (status === "ACEITA" ? "Ok. Aceitamos a proposta." : "Não será possível aceitar.")
    setErroAcao("")
    setProcessando(id)
    try {
      await api.put(`/propostas/${id}`, { resposta, status })
      carregar()
    } catch {
      setErroAcao("Não foi possível registrar a resposta. Tente novamente.")
    } finally {
      setProcessando(null)
    }
  }

  async function excluir(id: number) {
    if (!confirm("Excluir esta proposta?")) return
    try {
      await api.delete(`/propostas/${id}`)
      carregar()
    } catch {
      setErroAcao("Não foi possível excluir a proposta. Tente novamente.")
    }
  }

  const visiveis = filtro === "TODAS" ? propostas : propostas.filter((p) => p.status === filtro)
  const contagem = (status: string) => (status === "TODAS" ? propostas.length : propostas.filter((p) => p.status === status).length)

  return (
    <main>
      <h2>Controle de Propostas</h2>
      <p className="subtitulo">Responda às ofertas dos clubes. Ao aceitar, o jogador é marcado como transferido.</p>

      <div className="filtros-status" role="group" aria-label="Filtrar por status da proposta">
        {FILTROS.map((f) => (
          <button key={f.valor} type="button" className={`chip ${filtro === f.valor ? "ativo" : ""}`}
            aria-pressed={filtro === f.valor} onClick={() => setFiltro(f.valor)}>
            {f.rotulo} ({contagem(f.valor)})
          </button>
        ))}
      </div>

      {erroCarga && <EstadoErro mensagem="Não foi possível carregar as propostas." onTentarNovamente={carregar} />}
      {erroAcao && <EstadoErro mensagem={erroAcao} />}

      <div className="tabela-wrap">
        <table className="tabela-admin">
          <thead>
            <tr><th>Jogador</th><th>Clube</th><th>Valor ofertado</th><th>Enviada em</th><th>Status e resposta</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {visiveis.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="celula-jogador">
                    <ImgComFallback src={p.jogador.foto} alt={`Foto de ${p.jogador.nome}`} />
                    <span>{p.jogador.nome}</span>
                  </div>
                </td>
                <td>{p.clube?.nome}</td>
                <td>
                  <span className="valor-oferta">{brl(p.valorOferta)}</span>
                  <span className="valor-pedido">Pedido: {brl(p.jogador.valorPedido)}</span>
                  <small>{p.mensagem}</small>
                </td>
                <td>{new Date(p.createdAt).toLocaleDateString("pt-BR")}</td>
                <td>
                  {p.status === "PENDENTE" ? (
                    <>
                      <StatusPill status={p.status} />
                      <input
                        style={{ marginTop: 8 }}
                        aria-label={`Resposta para a proposta de ${p.clube?.nome}`}
                        placeholder="Escreva uma resposta (opcional)"
                        value={respostas[p.id] ?? ""}
                        onChange={(e) => setRespostas({ ...respostas, [p.id]: e.target.value })}
                      />
                    </>
                  ) : (
                    <>
                      <StatusPill status={p.status} />
                      <p style={{ margin: "6px 0 0", color: "var(--ink-muted)", fontSize: 13 }}>{p.resposta}</p>
                    </>
                  )}
                </td>
                <td>
                  <div className="acoes">
                    {p.status === "PENDENTE" && (
                      <>
                        <button className="btn-icone aceitar" disabled={processando === p.id}
                          onClick={() => responder(p.id, "ACEITA")}
                          aria-label={`Aceitar proposta de ${p.clube?.nome}`} title="Aceitar proposta">
                          <IconCheck />
                        </button>
                        <button className="btn-icone perigo" disabled={processando === p.id}
                          onClick={() => responder(p.id, "RECUSADA")}
                          aria-label={`Recusar proposta de ${p.clube?.nome}`} title="Recusar proposta">
                          <IconX />
                        </button>
                      </>
                    )}
                    <button className="btn-icone perigo" onClick={() => excluir(p.id)}
                      aria-label={`Excluir proposta de ${p.clube?.nome}`} title="Excluir proposta">
                      <IconTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visiveis.length === 0 && !erroCarga && (
              <tr><td colSpan={6}>Nenhuma proposta neste filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
