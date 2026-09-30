import { useEffect, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { api } from "../services/api"
import { useClube } from "../context/ClubeContext"
import { StatusPill } from "../components/StatusPill"
import { ImgComFallback } from "../components/ImgComFallback"
import { EstadoErro } from "../components/EstadoErro"
import type { Proposta } from "../types"

const brl = (v: string | number) => `R$ ${Number(v).toLocaleString("pt-BR")}`

export function MinhasPropostas() {
  const { clube, carregando } = useClube()
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [carregandoLista, setCarregandoLista] = useState(true)
  const [erro, setErro] = useState(false)

  function carregar() {
    setErro(false)
    setCarregandoLista(true)
    api.get("/propostas/minhas")
      .then((resposta) => setPropostas(resposta.data))
      .catch(() => setErro(true))
      .finally(() => setCarregandoLista(false))
  }

  useEffect(() => { if (clube) carregar() }, [clube])

  if (carregando) return <main><p>Carregando...</p></main>
  if (!clube) return <Navigate to="/login" replace />

  return (
    <main>
      <h1>Minhas <u>propostas</u></h1>
      <p className="subtitulo">Acompanhe o valor ofertado, a data de envio e a resposta da agência.</p>

      {erro && <EstadoErro mensagem="Não foi possível carregar suas propostas." onTentarNovamente={carregar} />}
      {carregandoLista && !erro && <p aria-live="polite">Carregando propostas...</p>}

      {!carregandoLista && !erro && (
        <div className="tabela-wrap">
          <table className="tabela-propostas">
            <thead>
              <tr>
                <th>Jogador</th>
                <th>Valor ofertado</th>
                <th>Condições</th>
                <th>Enviada em</th>
                <th>Status e resposta</th>
              </tr>
            </thead>
            <tbody>
              {propostas.map((proposta) => (
                <tr key={proposta.id}>
                  <td>
                    <div className="celula-jogador">
                      <ImgComFallback src={proposta.jogador.foto} alt={`Foto de ${proposta.jogador.nome}`} />
                      <span>{proposta.jogador.nome}<br /><small>{proposta.jogador.clubeAtual}</small></span>
                    </div>
                  </td>
                  <td>
                    <span className="valor-oferta">{brl(proposta.valorOferta)}</span>
                    <span className="valor-pedido">Pedido: {brl(proposta.jogador.valorPedido)}</span>
                  </td>
                  <td>{proposta.mensagem}</td>
                  <td>{new Date(proposta.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td>
                    <StatusPill status={proposta.status} />
                    {proposta.status !== "PENDENTE" && (
                      <p style={{ margin: "6px 0 0", color: "var(--ink-muted)", fontSize: 13 }}>{proposta.resposta}</p>
                    )}
                  </td>
                </tr>
              ))}
              {propostas.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    Você ainda não fez nenhuma proposta. <Link to="/">Explorar o mercado</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
