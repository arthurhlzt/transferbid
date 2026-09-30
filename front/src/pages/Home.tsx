import { useEffect, useState } from "react"
import { api } from "../services/api"
import { JogadorCard } from "../components/JogadorCard"
import { Campo } from "../components/Campo"
import { EstadoErro } from "../components/EstadoErro"
import type { Jogador, Posicao } from "../types"

export function Home() {
  const [jogadores, setJogadores] = useState<Jogador[]>([])
  const [posicoes, setPosicoes] = useState<Posicao[]>([])
  const [nome, setNome] = useState("")
  const [posicaoId, setPosicaoId] = useState("")
  const [valorMaximo, setValorMaximo] = useState("")
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const [pesquisando, setPesquisando] = useState(false)
  const [ultimaBusca, setUltimaBusca] = useState<Record<string, string>>({ destaque: "true" })

  useEffect(() => {
    api.get("/posicoes").then((resposta) => setPosicoes(resposta.data)).catch(() => {})
    buscar({ destaque: "true" })
  }, [])

  function carregarDestaques() {
    setPesquisando(false)
    setNome(""); setPosicaoId(""); setValorMaximo("")
    buscar({ destaque: "true" })
  }

  function buscar(params: Record<string, string>) {
    setUltimaBusca(params)
    setCarregando(true)
    setErro(false)
    api.get("/jogadores", { params })
      .then((resposta) => setJogadores(resposta.data))
      .catch(() => setErro(true))
      .finally(() => setCarregando(false))
  }

  function pesquisar(evento: React.FormEvent) {
    evento.preventDefault()
    const params: Record<string, string> = {}
    if (nome.trim()) params.nome = nome.trim()
    if (posicaoId) params.posicaoId = posicaoId
    if (valorMaximo) params.valorMaximo = valorMaximo
    setPesquisando(true)
    buscar(params)
  }

  const quantidade = jogadores.length

  return (
    <main>
      <h1>Mercado de Jogadores</h1>
      <p className="subtitulo">
        Acompanhe os atletas disponíveis para negociação, com análise de scout gerada
        por IA quando disponível.
      </p>

      <form className="busca" onSubmit={pesquisar}>
        <Campo label="Nome, clube ou nacionalidade" htmlFor="filtro-nome">
          <input id="filtro-nome" placeholder="Ex.: Rafael, Grêmio, Brasil" value={nome}
            onChange={(e) => setNome(e.target.value)} />
        </Campo>
        <Campo label="Posição" htmlFor="filtro-posicao">
          <select id="filtro-posicao" value={posicaoId} onChange={(e) => setPosicaoId(e.target.value)}>
            <option value="">Qualquer posição</option>
            {posicoes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </Campo>
        <Campo label="Valor máximo (R$)" htmlFor="filtro-valor">
          <input id="filtro-valor" type="number" min="0" placeholder="Ex.: 5000000" value={valorMaximo}
            onChange={(e) => setValorMaximo(e.target.value)} />
        </Campo>
        <button type="submit">Pesquisar</button>
        <button type="button" onClick={carregarDestaques}>Exibir Destaques</button>
      </form>

      <h2>
        {pesquisando
          ? `Resultados da pesquisa${carregando ? "" : ` — ${quantidade} encontrado${quantidade === 1 ? "" : "s"}`}`
          : <>Jogadores <u>em destaque</u></>}
      </h2>
      <p className="subtitulo" style={{ margin: "0 0 20px" }}>
        {pesquisando
          ? "Resultados de acordo com os filtros informados acima."
          : "Atletas selecionados pela agência para esta janela de transferências."}
      </p>

      {carregando && <p aria-live="polite">Carregando jogadores...</p>}

      {erro && (
        <EstadoErro
          mensagem="Não foi possível carregar os jogadores agora."
          onTentarNovamente={() => buscar(ultimaBusca)}
        />
      )}

      {!carregando && !erro && (
        <div className="grid-jogadores">
          {jogadores.map((jogador) => <JogadorCard key={jogador.id} jogador={jogador} />)}
          {quantidade === 0 && <p>Nenhum jogador encontrado com esses filtros.</p>}
        </div>
      )}
    </main>
  )
}
