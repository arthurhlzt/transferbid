import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api } from "../services/api"
import { Campo } from "../components/Campo"
import { extrairErros } from "../components/erros"

export function CadastroClube() {
  const [form, setForm] = useState({ nome: "", pais: "", email: "", senha: "" })
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState("")
  const [enviando, setEnviando] = useState(false)
  const navigate = useNavigate()

  const atualizar = (campo: string, valor: string) => setForm({ ...form, [campo]: valor })

  async function cadastrar(evento: React.FormEvent) {
    evento.preventDefault()
    setErroGeral("")
    const novos: Record<string, string> = {}
    if (form.nome.trim().length < 2) novos.nome = "Informe o nome do clube."
    if (form.pais.trim().length < 2) novos.pais = "Informe o país."
    if (!/^\S+@\S+\.\S+$/.test(form.email)) novos.email = "Informe um e-mail válido."
    if (form.senha.length < 6) novos.senha = "A senha deve ter ao menos 6 caracteres."
    setErros(novos)
    if (Object.keys(novos).length) return

    setEnviando(true)
    try {
      await api.post("/clubes", form)
      navigate("/login")
    } catch (e: any) {
      const { campos, geral } = extrairErros(e)
      setErros(campos)
      setErroGeral(geral)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="form-page">
      <form onSubmit={cadastrar} noValidate>
        <h2>Cadastro de clube</h2>

        <Campo label="Nome do clube" htmlFor="cad-nome" erro={erros.nome}>
          <input id="cad-nome" value={form.nome} onChange={(e) => atualizar("nome", e.target.value)} />
        </Campo>
        <Campo label="País" htmlFor="cad-pais" erro={erros.pais}>
          <input id="cad-pais" value={form.pais} onChange={(e) => atualizar("pais", e.target.value)} />
        </Campo>
        <Campo label="E-mail" htmlFor="cad-email" erro={erros.email}>
          <input id="cad-email" type="email" autoComplete="email" value={form.email}
            onChange={(e) => atualizar("email", e.target.value)} />
        </Campo>
        <Campo label="Senha" htmlFor="cad-senha" erro={erros.senha} dica="Mínimo de 6 caracteres">
          <input id="cad-senha" type="password" autoComplete="new-password" value={form.senha}
            onChange={(e) => atualizar("senha", e.target.value)} />
        </Campo>

        {erroGeral && <p className="erro" role="alert">{erroGeral}</p>}

        <button type="submit" disabled={enviando}>{enviando ? "Cadastrando..." : "Cadastrar"}</button>
        <p style={{ margin: 0 }}>Já possui conta? <Link to="/login">Entrar</Link></p>
      </form>
    </main>
  )
}
