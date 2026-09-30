import { useEffect, useState } from "react"
import { api } from "../../services/api"
import { Campo } from "../../components/Campo"
import { EstadoErro } from "../../components/EstadoErro"
import { ImgComFallback } from "../../components/ImgComFallback"
import { IconStar, IconTrash } from "../../components/Icons"
import { extrairErros } from "../../components/erros"
import type { Jogador, Posicao } from "../../types"

const formVazio = {
  nome: "", idade: "", nacionalidade: "", clubeAtual: "",
  pernaBoa: "DESTRA", valorPedido: "", foto: "", posicaoId: "",
}

const STATUS_LABEL: Record<string, string> = { DISPONIVEL: "Disponível", EM_NEGOCIACAO: "Em negociação", TRANSFERIDO: "Transferido" }
const STATUS_CLASSE: Record<string, string> = { DISPONIVEL: "aceita", EM_NEGOCIACAO: "pendente", TRANSFERIDO: "recusada" }
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

  function carregar() {
    setErroCarga(false)
    api.get("/jogadores").then((r) => setJogadores(r.data)).catch(() => setErroCarga(true))
    api.get("/posicoes").then((r) => setPosicoes(r.data)).catch(() => {})
  }

  useEffect(() => { carregar() }, [])

  const atualizar = (campo: string, valor: string) => setForm({ ...form, [campo]: valor })

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    setErroGeral("")
    const novos: Record<string, string> = {}
    if (form.nome.trim().length < 2) novos.nome = "Informe o nome."
    if (!(Number(form.idade) >= 14 && Number(form.idade) <= 60)) novos.idade = "Idade entre 14 e 60."
    if (form.nacionalidade.trim().length < 2) novos.nacionalidade = "Informe a nacionalidade."
    if (form.clubeAtual.trim().length < 2) novos.clubeAtual = "Informe o clube atual."
    if (!form.posicaoId) novos.posicaoId = "Selecione a posição."
    if (!(Number(form.valorPedido) > 0)) novos.valorPedido = "Informe um valor maior que zero."
    try { new URL(form.foto) } catch { novos.foto = "Informe uma URL válida (https://...)." }
    setErros(novos)
    if (Object.keys(novos).length) return

    setSalvando(true)
    try {
      await api.post("/jogadores", {
        ...form,
        idade: Number(form.idade),
        valorPedido: Number(form.valorPedido),
        posicaoId: Number(form.posicaoId),
      })
      setForm(formVazio)
      setMostrarForm(false)
      carregar()
    } catch (e: any) {
      const { campos, geral } = extrairErros(e)
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
      alert("Não foi possível excluir. O jogador pode ter propostas vinculadas.")
    }
  }

  async function alternarDestaque(jogador: Jogador) {
    // Endpoint dedicado (PATCH): não reenvia o jogador inteiro.
    try {
      await api.patch(`/jogadores/${jogador.id}/destaque`, { destaque: !jogador.destaque })
      carregar()
    } catch {
      alert("Não foi possível alterar o destaque. Jogadores transferidos não podem ser destacados.")
    }
  }

  const visiveis = filtro === "TODOS" ? jogadores : jogadores.filter((j) => j.status === filtro)

  return (
    <main>
      <div className="titulo-com-acao">
        <h2>Cadastro de Jogadores</h2>
        <button onClick={() => setMostrarForm((v) => !v)}>{mostrarForm ? "Fechar formulário" : "Novo jogador"}</button>
      </div>

      {mostrarForm && (
        <form className="form-jogador" onSubmit={salvar} noValidate>
          <Campo label="Nome" htmlFor="j-nome" erro={erros.nome}>
            <input id="j-nome" value={form.nome} onChange={(e) => atualizar("nome", e.target.value)} />
          </Campo>
          <Campo label="Idade" htmlFor="j-idade" erro={erros.idade}>
            <input id="j-idade" type="number" value={form.idade} onChange={(e) => atualizar("idade", e.target.value)} />
          </Campo>
          <Campo label="Nacionalidade" htmlFor="j-nac" erro={erros.nacionalidade}>
            <input id="j-nac" value={form.nacionalidade} onChange={(e) => atualizar("nacionalidade", e.target.value)} />
          </Campo>
          <Campo label="Clube atual" htmlFor="j-clube" erro={erros.clubeAtual}>
            <input id="j-clube" value={form.clubeAtual} onChange={(e) => atualizar("clubeAtual", e.target.value)} />
          </Campo>
          <Campo label="Posição" htmlFor="j-pos" erro={erros.posicaoId}>
            <select id="j-pos" value={form.posicaoId} onChange={(e) => atualizar("posicaoId", e.target.value)}>
              <option value="">Selecione...</option>
              {posicoes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </Campo>
          <Campo label="Perna dominante" htmlFor="j-perna">
            <select id="j-perna" value={form.pernaBoa} onChange={(e) => atualizar("pernaBoa", e.target.value)}>
              <option value="DESTRA">Destra</option>
              <option value="CANHOTA">Canhota</option>
              <option value="AMBIDESTRO">Ambidestro</option>
            </select>
          </Campo>
          <Campo label="Valor pedido (R$)" htmlFor="j-valor" erro={erros.valorPedido}>
            <input id="j-valor" type="number" value={form.valorPedido} onChange={(e) => atualizar("valorPedido", e.target.value)} />
          </Campo>
          <Campo label="URL da foto" htmlFor="j-foto" erro={erros.foto} dica="Link direto para a imagem (https://...)">
            <input id="j-foto" value={form.foto} onChange={(e) => atualizar("foto", e.target.value)} />
          </Campo>
          {erroGeral && <p className="erro" role="alert" style={{ gridColumn: "1 / -1" }}>{erroGeral}</p>}
          <button type="submit" disabled={salvando}>
            {salvando ? "Salvando e consultando a IA..." : "Salvar jogador"}
          </button>
        </form>
      )}

      <div className="filtros-status" role="group" aria-label="Filtrar por status de mercado">
        {FILTROS.map((f) => (
          <button key={f.valor} type="button" className={`chip ${filtro === f.valor ? "ativo" : ""}`}
            aria-pressed={filtro === f.valor} onClick={() => setFiltro(f.valor)}>
            {f.rotulo}
          </button>
        ))}
      </div>

      {erroCarga && <EstadoErro mensagem="Não foi possível carregar os jogadores." onTentarNovamente={carregar} />}

      <div className="tabela-wrap">
        <table className="tabela-admin">
          <thead>
            <tr><th>Jogador</th><th>Posição</th><th>Idade</th><th>Valor pedido</th><th>Status</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {visiveis.map((j) => (
              <tr key={j.id}>
                <td>
                  <div className="celula-jogador">
                    <ImgComFallback src={j.foto} alt={`Foto de ${j.nome}`} />
                    <span>{j.nome}{j.analiseIA && <span className="badge-ia" title="Análise gerada por consulta real à IA">IA</span>}</span>
                  </div>
                </td>
                <td>{j.posicao?.nome}</td>
                <td>{j.idade}</td>
                <td>R$ {Number(j.valorPedido).toLocaleString("pt-BR")}</td>
                <td><span className={`status-pill ${STATUS_CLASSE[j.status]}`}>{STATUS_LABEL[j.status]}</span></td>
                <td>
                  <div className="acoes">
                    <button className={`btn-icone ${j.destaque ? "ativo" : ""}`} onClick={() => alternarDestaque(j)}
                      aria-label={j.destaque ? `Remover ${j.nome} dos destaques` : `Destacar ${j.nome}`}
                      aria-pressed={j.destaque}
                      title={j.destaque ? "Remover dos destaques" : "Destacar na Home"}>
                      <IconStar filled={j.destaque} />
                    </button>
                    <button className="btn-icone perigo" onClick={() => excluir(j)}
                      aria-label={`Excluir ${j.nome}`} title="Excluir jogador">
                      <IconTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visiveis.length === 0 && !erroCarga && (
              <tr><td colSpan={6}>Nenhum jogador neste filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
