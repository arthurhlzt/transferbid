import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { api } from "../services/api"
import { useClube } from "../context/ClubeContext"
import { ImgComFallback } from "../components/ImgComFallback"
import { Campo } from "../components/Campo"
import { EstadoErro } from "../components/EstadoErro"
import { extrairErros } from "../components/erros"
import type { Jogador } from "../types"

const PERNA: Record<string, string> = { DESTRA: "Destra", CANHOTA: "Canhota", AMBIDESTRO: "Ambidestro" }
const STATUS_LABEL: Record<string, string> = {
  DISPONIVEL: "Disponível para negociação",
  EM_NEGOCIACAO: "Em negociação",
  TRANSFERIDO: "Já transferido",
}
const STATUS_CLASSE: Record<string, string> = { DISPONIVEL: "aceita", EM_NEGOCIACAO: "pendente", TRANSFERIDO: "recusada" }

function parseLista(json?: string | null): string[] {
  if (!json) return []
  try { const value = JSON.parse(json); return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [] } catch { return [] }
}

export function JogadorDetalhe() {
  const { id } = useParams()
  const { clube } = useClube()
  const [jogador, setJogador] = useState<Jogador | null>(null)
  const [erroCarga, setErroCarga] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [valorOferta, setValorOferta] = useState("")
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  function carregar() {
    setErroCarga("")
    api.get(`/jogadores/${id}`)
      .then((resposta) => setJogador(resposta.data))
      .catch((e) => setErroCarga(e?.response?.status === 404
        ? "Jogador não encontrado."
        : "Não foi possível carregar os dados do jogador."))
  }

  useEffect(carregar, [id])

  async function enviarProposta(evento: React.FormEvent) {
    evento.preventDefault()
    setErroGeral("")
    const erros: Record<string, string> = {}
    if (!(Number(valorOferta) > 0)) erros.valorOferta = "Informe um valor maior que zero."
    if (mensagem.trim().length < 3) erros.mensagem = "Escreva ao menos 3 caracteres."
    setErrosCampos(erros)
    if (Object.keys(erros).length || !clube || !jogador) return

    setEnviando(true)
    try {
      // clubeId não é enviado: a API identifica o clube pelo token (Authorization).
      await api.post("/propostas", { jogadorId: jogador.id, valorOferta: Number(valorOferta), mensagem })
      setEnviado(true)
    } catch (e: any) {
      if (e?.response?.status === 401) {
        setErroGeral("Sua sessão expirou. Saia e faça login novamente.")
      } else {
        const { campos, geral } = extrairErros(e)
        setErrosCampos(campos)
        setErroGeral(geral)
      }
    } finally {
      setEnviando(false)
    }
  }

  if (erroCarga) {
    return (
      <main>
        <EstadoErro mensagem={erroCarga} onTentarNovamente={carregar} />
        <p><Link to="/">← Voltar ao mercado</Link></p>
      </main>
    )
  }
  if (!jogador) return <main><p aria-live="polite">Carregando...</p></main>

  const temAnalise = Boolean(jogador.pontosFortes || jogador.estiloDeJogo)
  const transferido = jogador.status === "TRANSFERIDO"

  return (
    <main>
      <p><Link to="/">← Voltar ao mercado</Link></p>

      <div className="detalhe-grid">
        {/* Coluna esquerda: perfil e análise */}
        <div className="detalhe-principal">
          <ImgComFallback src={jogador.foto} alt={`Foto de ${jogador.nome}`} className="foto-grande" />
          <h1>{jogador.nome}</h1>

          <dl className="ficha">
            <div><dt>Posição</dt><dd>{jogador.posicao?.nome}</dd></div>
            <div><dt>Idade</dt><dd>{jogador.idade} anos</dd></div>
            <div><dt>Nacionalidade</dt><dd>{jogador.nacionalidade}</dd></div>
            <div><dt>Clube atual</dt><dd>{jogador.clubeAtual}</dd></div>
            <div><dt>Perna dominante</dt><dd>{PERNA[jogador.pernaBoa] ?? jogador.pernaBoa}</dd></div>
          </dl>

          {jogador.videoDestaque && (
            <a className="link-video" href={jogador.videoDestaque} target="_blank" rel="noopener noreferrer">
              ▶ Assistir vídeo de destaque
            </a>
          )}

          {temAnalise && (
            <section className="dados-ia" aria-label="Análise de scout">
              <h2>Pontos fortes</h2>
              <ul>{parseLista(jogador.pontosFortes).map((item) => <li key={item}>{item}</li>)}</ul>

              <h2>Pontos a desenvolver</h2>
              <ul>{parseLista(jogador.pontosFracos).map((item) => <li key={item}>{item}</li>)}</ul>

              <p><strong>Estilo de jogo:</strong> {jogador.estiloDeJogo}</p>
              <p><strong>Jogador comparável:</strong> {jogador.jogadorComparavel}</p>
              <p><strong>Potencial de mercado:</strong> {jogador.potencialMercado}</p>

              {jogador.analiseIA ? (
                <p className="aviso-ia"><em>* Estimativa de perfil gerada por IA (Gemini), sem verificação factual do atleta. Sujeita a erros.</em></p>
              ) : (
                <p className="aviso-ia"><em>* Análise ilustrativa de exemplo — ainda não consultada à IA de verdade.</em></p>
              )}
            </section>
          )}
        </div>

        {/* Coluna direita: valor, disponibilidade e proposta */}
        <aside className="detalhe-lateral">
          <p className="rotulo">Valor pedido</p>
          <p className="valor">R$ {Number(jogador.valorPedido).toLocaleString("pt-BR")}</p>
          <span className={`status-pill ${STATUS_CLASSE[jogador.status]}`}>{STATUS_LABEL[jogador.status]}</span>

          <hr />

          {transferido && <p className="cta-login">Este jogador já foi transferido e não recebe novas propostas.</p>}

          {!transferido && !clube && (
            <p className="cta-login">
              Gostou? <Link to="/login">Identifique-se</Link> para fazer uma proposta.
            </p>
          )}

          {!transferido && clube && !enviado && (
            <form className="form-proposta" onSubmit={enviarProposta} noValidate>
              <p className="titulo-form">Fazer uma proposta</p>
              <Campo label="Clube" htmlFor="clube-proposta">
                <input id="clube-proposta" value={`${clube.nome} (${clube.email})`} disabled />
              </Campo>
              <Campo label="Valor da oferta (R$)" htmlFor="valor-oferta" erro={errosCampos.valorOferta}>
                <input id="valor-oferta" type="number" min="1" value={valorOferta}
                  onChange={(e) => setValorOferta(e.target.value)} />
              </Campo>
              <Campo label="Condições da proposta" htmlFor="msg-proposta" erro={errosCampos.mensagem}
                dica="Ex.: R$ 5 milhões à vista e 2 milhões em 2x">
                <textarea id="msg-proposta" value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
              </Campo>
              {erroGeral && <p className="erro" role="alert">{erroGeral}</p>}
              <button type="submit" disabled={enviando}>{enviando ? "Enviando..." : "Enviar proposta"}</button>
            </form>
          )}

          {enviado && (
            <p className="sucesso">
              Proposta enviada! Acompanhe em <Link to="/minhas-propostas">Minhas Propostas</Link>.
            </p>
          )}
        </aside>
      </div>
    </main>
  )
}
