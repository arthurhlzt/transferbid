import axios from "axios"
import { tokenClube, obterAdmin, limparSessao } from "./session"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
})

// Anexa o token JWT correto conforme a área da aplicação: rotas /admin/* usam o
// token do administrador (adminAuth), o restante usa o token do clube logado
// (clubeToken). Assim as chamadas autenticadas (propostas, cadastro de jogador,
// dashboard etc.) não precisam repetir esse cabeçalho manualmente em cada tela.
api.interceptors.request.use((config) => {
  const url = config.url || ''
  const clubeRoute = url.startsWith('/clubes') || url === '/propostas/minhas' ||
    (url === '/propostas' && config.method?.toLowerCase() === 'post')
  const token = clubeRoute ? tokenClube() :
    (window.location.pathname.startsWith('/admin') ? obterAdmin()?.token : tokenClube())
  if (token) config.headers.Authorization = `Bearer ${token}`

  return config
})

// Se o token do admin expirar (401 dentro da área /admin), limpa a sessão e volta pro login.
api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const emAdmin = window.location.pathname.startsWith("/admin")
    const naTelaDeLogin = window.location.pathname === "/admin/login"
    const url = erro?.config?.url || ''
    const clubeRoute = url.startsWith('/clubes') || url === '/propostas/minhas' ||
      (url === '/propostas' && erro?.config?.method === 'post')
    if (erro?.response?.status === 401 && clubeRoute) {
      limparSessao()
      window.dispatchEvent(new Event('clube-sessao-expirada'))
    }
    if (!clubeRoute && erro?.response?.status === 401 && emAdmin && !naTelaDeLogin) {
      localStorage.removeItem("adminAuth")
      window.location.href = "/admin/login"
    }
    return Promise.reject(erro)
  }
)
