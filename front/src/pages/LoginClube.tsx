import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api } from "../services/api"
import { useClube } from "../context/ClubeContext"
import { Campo } from "../components/Campo"
import { extrairErros } from "../components/erros"

export function LoginClube() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [manterConectado, setManterConectado] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState("")
  const [enviando, setEnviando] = useState(false)
  const { login } = useClube()
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
      const resposta = await api.post("/clubes/login", { email, senha })
      login(resposta.data.clube, resposta.data.token, manterConectado)
      navigate("/")
    } catch (e: any) {
      setErroGeral(e?.response?.status === 400 ? "E-mail ou senha inválidos." : extrairErros(e).geral)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="form-page">
      <form onSubmit={entrar} noValidate>
        <h2>Acesso do clube</h2>

        <Campo label="E-mail" htmlFor="login-email" erro={erros.email}>
          <input id="login-email" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </Campo>

        <Campo label="Senha" htmlFor="login-senha" erro={erros.senha}>
          <input id="login-senha" type="password" autoComplete="current-password" value={senha}
            onChange={(e) => setSenha(e.target.value)} />
        </Campo>

        <label className="checkbox">
          <input type="checkbox" checked={manterConectado} onChange={(e) => setManterConectado(e.target.checked)} />
          Manter conectado
        </label>

        {erroGeral && <p className="erro" role="alert">{erroGeral}</p>}

        <button type="submit" disabled={enviando}>{enviando ? "Entrando..." : "Entrar"}</button>

        <p style={{ margin: 0 }}>Ainda não possui conta? <Link to="/cadastro">Cadastre-se</Link></p>
      </form>
    </main>
  )
}
