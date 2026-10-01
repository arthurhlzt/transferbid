import { useEffect, useRef, useState } from "react"
import { api } from "../../services/api"
import { Campo } from "../../components/Campo"
import { EstadoErro } from "../../components/EstadoErro"
import { ImgComFallback } from "../../components/ImgComFallback"
import { IconStar, IconTrash } from "../../components/Icons"
import { extrairErros } from "../../components/erros"
import type { Jogador, Posicao } from "../../types"

const formVazio = {
  nome: "",
  idade: "",
  nacionalidade: "",
  clubeAtual: "",
  pernaBoa: "DESTRA",
  valorPedido: "",
  foto: "",
  posicaoId: "",
}

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

const FILTROS = [
  { valor: "TODOS", rotulo: "Todos" },
  { valor: "DISPONIVEL", rotulo: "Disponíveis" },
  { valor: "EM_NEGOCIACAO", rotulo: "Em negociação" },
  { valor: "TRANSFERIDO", rotulo: "Transferidos" },
]

export function Jogadores() {
  const [jogadores, setJogadores] = useState<Jogador[]>([])
  const [posicoes, setPosicoes] = useState<Posicao[]>([])
  const [filtro, setFiltro] = useState("TODOS")
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(formVazio)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erroCarga, setErroCarga] = useState(false)
  const [gerandoIA, setGerandoIA] = useState<number | null>(null)
  const [avisoIA, setAvisoIA] = useState("")
  const [jogadorEmEdicao, setJogadorEmEdicao] = useState<Jogador | null>(null)
  const gerandoIARef = useRef(false)

  function carregar() {
    setErroCarga(false)

    api.get("/jogadores")
      .then((resposta) => setJogadores(resposta.data))
      .catch(() => setErroCarga(true))

    api.get("/posicoes")
      .then((resposta) => setPosicoes(resposta.data))
      .catch(() => {})
  }

  useEffect(() => {
    carregar()
  }, [])

  function atualizar(campo: keyof typeof formVazio, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  async function gerarAnalise(jogador: Jogador) {
    if (gerandoIARef.current) return

    gerandoIARef.current = true
    setGerandoIA(jogador.id)
    setAvisoIA("")

    try {
      const resposta = await api.post<Jogador>(
        `/jogadores/${jogador.id}/analise-ia`,
      )

      setJogadores((atuais) =>
        atuais.map((item) =>
          item.id === jogador.id ? resposta.data : item,
        ),
      )

      setAvisoIA(
        `Análise IA de ${jogador.nome} gerada com sucesso.`,
      )
    } catch (erro: any) {
      const mensagem = erro.response?.data?.erro

      setAvisoIA(
        typeof mensagem === "string"
          ? mensagem
          : "Não foi possível consultar a IA. Verifique a conexão e tente novamente.",
      )
    } finally {
      gerandoIARef.current = false
      setGerandoIA(null)
    }
  }

function limparFormulario() {
  setJogadorEmEdicao(null)
  setForm(formVazio)
  setErros({})
  setErroGeral("")
}

function editarJogador(jogador: Jogador) {
  setJogadorEmEdicao(jogador)

  setForm({
    nome: jogador.nome,
    idade: String(jogador.idade),
    nacionalidade: jogador.nacionalidade,
    clubeAtual: jogador.clubeAtual,
    pernaBoa: jogador.pernaBoa,
    valorPedido: String(jogador.valorPedido),
    foto: jogador.foto,
    posicaoId: String(jogador.posicaoId),
  })

  setErros({})
  setErroGeral("")
  setAvisoIA("")
  setMostrarForm(true)

  window.scrollTo({ top: 0, behavior: "smooth" })
}

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    setErroGeral("")

    const novos: Record<string, string> = {}

    if (form.nome.trim().length < 2) {
      novos.nome = "Informe o nome."
    }

    const idade = Number(form.idade)

    if (!Number.isInteger(idade) || idade < 14 || idade > 60) {
      novos.idade = "Informe uma idade inteira entre 14 e 60."
    }

    if (form.nacionalidade.trim().length < 2) {
      novos.nacionalidade = "Informe a nacionalidade."
    }

    if (form.clubeAtual.trim().length < 2) {
      novos.clubeAtual = "Informe o clube atual."
    }

    if (!form.posicaoId) {
      novos.posicaoId = "Selecione a posição."
    }

    if (!(Number(form.valorPedido) > 0)) {
      novos.valorPedido = "Informe um valor maior que zero."
    }

    try {
      new URL(form.foto)
    } catch {
      novos.foto = "Informe uma URL válida (https://...)."
    }

    setErros(novos)

    if (Object.keys(novos).length > 0) return

    setSalvando(true)
    setAvisoIA("")

    try {
      const dados = {
        ...form,
        idade,
        valorPedido: Number(form.valorPedido),
        posicaoId: Number(form.posicaoId),
      }

      if (jogadorEmEdicao) {
        await api.put(`/jogadores/${jogadorEmEdicao.id}`, {
          ...dados,
          status: jogadorEmEdicao.status,
          destaque: jogadorEmEdicao.destaque,
          videoDestaque: jogadorEmEdicao.videoDestaque ?? null,
        })

        setAvisoIA(
          "Jogador atualizado. A análise IA existente não foi recalculada.",
        )
      } else {
        const resposta = await api.post<Jogador>("/jogadores", dados)

        setAvisoIA(
          resposta.data.analiseIA
            ? "Jogador cadastrado com análise IA."
            : "Jogador cadastrado sem análise IA. Use Gerar análise IA para tentar novamente.",
        )
      }

      limparFormulario()
      setMostrarForm(false)
      carregar()
    } catch (erro: any) {
      const { campos, geral } = extrairErros(erro)
      setErros(campos)
      setErroGeral(geral)
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(jogador: Jogador) {
    if (!confirm(`Excluir ${jogador.nome}?`)) return

    try {
      await api.delete(`/jogadores/${jogador.id}`)
      carregar()
    } catch {
      alert(
        "Não foi possível excluir. O jogador pode ter propostas vinculadas.",
      )
    }
  }

  async function alternarDestaque(jogador: Jogador) {
    try {
      await api.patch(`/jogadores/${jogador.id}/destaque`, {
        destaque: !jogador.destaque,
      })
      carregar()
    } catch {
      alert(
        "Não foi possível alterar o destaque. Jogadores transferidos não podem ser destacados.",
      )
    }
  }

  const visiveis = filtro === "TODOS"
    ? jogadores
    : jogadores.filter((jogador) => jogador.status === filtro)

  return (
    <main>
      <div className="titulo-com-acao">
        <h2>Cadastro de Jogadores</h2>

      <button
        type="button"
         disabled={salvando}
         onClick={() => {
        limparFormulario()
        setAvisoIA("")
        setMostrarForm((aberto) => !aberto)
        }}
      >
  {mostrarForm ? "Cancelar" : "Novo jogador"}
</button>
      </div>

      {mostrarForm && (
        <form
          className="form-jogador"
          onSubmit={salvar}
          noValidate
        >
          <h3 style={{ gridColumn: "1 / -1" }}>
           {jogadorEmEdicao
             ? `Editar jogador: ${jogadorEmEdicao.nome}`
             : "Novo jogador"}
          </h3>
          <Campo
            label="Nome"
            htmlFor="j-nome"
            erro={erros.nome}
          >
            <input
              id="j-nome"
              value={form.nome}
              onChange={(evento) =>
                atualizar("nome", evento.target.value)
              }
            />
          </Campo>

          <Campo
            label="Idade"
            htmlFor="j-idade"
            erro={erros.idade}
          >
            <input
              id="j-idade"
              type="number"
              value={form.idade}
              onChange={(evento) =>
                atualizar("idade", evento.target.value)
              }
            />
          </Campo>

          <Campo
            label="Nacionalidade"
            htmlFor="j-nac"
            erro={erros.nacionalidade}
          >
            <input
              id="j-nac"
              value={form.nacionalidade}
              onChange={(evento) =>
                atualizar("nacionalidade", evento.target.value)
              }
            />
          </Campo>

          <Campo
            label="Clube atual"
            htmlFor="j-clube"
            erro={erros.clubeAtual}
          >
            <input
              id="j-clube"
              value={form.clubeAtual}
              onChange={(evento) =>
                atualizar("clubeAtual", evento.target.value)
              }
            />
          </Campo>

          <Campo
            label="Posição"
            htmlFor="j-pos"
            erro={erros.posicaoId}
          >
            <select
              id="j-pos"
              value={form.posicaoId}
              onChange={(evento) =>
                atualizar("posicaoId", evento.target.value)
              }
            >
              <option value="">Selecione...</option>

              {posicoes.map((posicao) => (
                <option key={posicao.id} value={posicao.id}>
                  {posicao.nome}
                </option>
              ))}
            </select>
          </Campo>

          <Campo label="Perna dominante" htmlFor="j-perna">
            <select
              id="j-perna"
              value={form.pernaBoa}
              onChange={(evento) =>
                atualizar("pernaBoa", evento.target.value)
              }
            >
              <option value="DESTRA">Destra</option>
              <option value="CANHOTA">Canhota</option>
              <option value="AMBIDESTRO">Ambidestro</option>
            </select>
          </Campo>

          <Campo
            label="Valor pedido (R$)"
            htmlFor="j-valor"
            erro={erros.valorPedido}
          >
            <input
              id="j-valor"
              type="number"
              value={form.valorPedido}
              onChange={(evento) =>
                atualizar("valorPedido", evento.target.value)
              }
            />
          </Campo>

          <Campo
            label="URL da foto"
            htmlFor="j-foto"
            erro={erros.foto}
            dica="Link direto para a imagem (https://...)"
          >
            <input
              id="j-foto"
              value={form.foto}
              onChange={(evento) =>
                atualizar("foto", evento.target.value)
              }
            />
          </Campo>

          {erroGeral && (
            <p
              className="erro"
              role="alert"
              style={{ gridColumn: "1 / -1" }}
            >
              {erroGeral}
            </p>
          )}

          <button type="submit" disabled={salvando}>
            {salvando
            ? jogadorEmEdicao
            ? "Salvando alterações..."
            : "Salvando e consultando a IA..."
            : jogadorEmEdicao
            ? "Salvar alterações"
            : "Salvar jogador"}
          </button>
        </form>
      )}

      <div
        className="filtros-status"
        role="group"
        aria-label="Filtrar por status de mercado"
      >
        {FILTROS.map((item) => (
          <button
            key={item.valor}
            type="button"
            className={`chip ${filtro === item.valor ? "ativo" : ""}`}
            aria-pressed={filtro === item.valor}
            onClick={() => setFiltro(item.valor)}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      {erroCarga && (
        <EstadoErro
          mensagem="Não foi possível carregar os jogadores."
          onTentarNovamente={carregar}
        />
      )}

      {avisoIA && <p role="status">{avisoIA}</p>}

      <div className="tabela-wrap">
        <table className="tabela-admin">
          <thead>
            <tr>
              <th>Jogador</th>
              <th>Posição</th>
              <th>Idade</th>
              <th>Valor pedido</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {visiveis.map((j) => (
              <tr key={j.id}>
                <td>
                  <div className="celula-jogador">
                    <ImgComFallback
                      src={j.foto}
                      alt={`Foto de ${j.nome}`}
                    />

                    <span>
                      {j.nome}

                      {j.analiseIA && (
                        <span
                          className="badge-ia"
                          title="Análise gerada por consulta real à IA"
                        >
                          IA
                        </span>
                      )}
                    </span>
                  </div>
                </td>

                <td>{j.posicao?.nome}</td>
                <td>{j.idade}</td>

                <td>
                  R$ {Number(j.valorPedido).toLocaleString("pt-BR")}
                </td>

                <td>
                  <span
                    className={`status-pill ${STATUS_CLASSE[j.status]}`}
                  >
                    {STATUS_LABEL[j.status]}
                  </span>
                </td>

                <td>
                  <div className="acoes">
                    {!j.analiseIA && (
                      <button
                        type="button"
                        disabled={gerandoIA !== null || salvando}
                        onClick={() => gerarAnalise(j)}
                        aria-label={`Gerar análise IA de ${j.nome}`}
                      >
                        {gerandoIA === j.id
                          ? "Gerando análise..."
                          : "Gerar análise IA"}
                      </button>
                    )}

                    <button
                      type="button"
                      className={`btn-icone ${j.destaque ? "ativo" : ""}`}
                      disabled={gerandoIA === j.id}
                      onClick={() => alternarDestaque(j)}
                      aria-label={
                        j.destaque
                          ? `Remover ${j.nome} dos destaques`
                          : `Destacar ${j.nome}`
                      }
                      aria-pressed={j.destaque}
                      title={
                        j.destaque
                          ? "Remover dos destaques"
                          : "Destacar na Home"
                      }
                    >
                      <IconStar filled={j.destaque} />
                    </button>
                    <button
                      type="button"
                      disabled={salvando || gerandoIA !== null}
                      onClick={() => editarJogador(j)}
                      aria-label={`Editar ${j.nome}`}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-icone perigo"
                      disabled={gerandoIA === j.id}
                      onClick={() => excluir(j)}
                      aria-label={`Excluir ${j.nome}`}
                      title="Excluir jogador"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {visiveis.length === 0 && !erroCarga && (
              <tr>
                <td colSpan={6}>Nenhum jogador neste filtro.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}