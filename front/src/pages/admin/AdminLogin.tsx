import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../../services/api"
import { Campo } from "../../components/Campo"
import { extrairErros } from "../../components/erros"

export function AdminLogin() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState("")
  const [enviando, setEnviando] = useState(false)
  const navigate = useNavigate()

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault()
    setErroGeral("")
    const novos: Record<string, string> = {}
    if (!email.trim()) novos.email = "Informe o e-mail."
    if (!senha) novos.senha = "Informe a senha."
    setErros(novos)
    if (Object.keys(novos).length) return

    setEnviando(true)
    try {
      const resposta = await api.post("/admin/login", { email, senha })
      localStorage.setItem("adminAuth", JSON.stringify(resposta.data))
      navigate("/admin")
    } catch (e: any) {
      setErroGeral(e?.response?.status === 400 ? "E-mail ou senha inválidos." : extrairErros(e).geral)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="form-page admin-login">
      <form onSubmit={entrar} noValidate>
        <div>
          <h2>transfer<span className="bid">BID</span></h2>
          <p style={{ color: "var(--ink-muted)", fontSize: 13.5, margin: "4px 0 0" }}>Acesso restrito do empresário</p>
        </div>

        <Campo label="E-mail" htmlFor="admin-email" erro={erros.email}>
          <input id="admin-email" type="email" autoComplete="username" value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </Campo>
        <Campo label="Senha" htmlFor="admin-senha" erro={erros.senha}>
          <input id="admin-senha" type="password" autoComplete="current-password" value={senha}
            onChange={(e) => setSenha(e.target.value)} />
        </Campo>

        {erroGeral && <p className="erro" role="alert">{erroGeral}</p>}

        <button type="submit" disabled={enviando}>{enviando ? "Entrando..." : "Entrar"}</button>
      </form>
    </main>
  )
}
