import axios from "axios"
import { tokenClube, obterAdmin, limparSessao } from "./session"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
})


api.interceptors.request.use((config) => {
  const url = config.url || ''
  const clubeRoute = url.startsWith('/clubes') || url === '/propostas/minhas' ||
    (url === '/propostas' && config.method?.toLowerCase() === 'post')
  const token = clubeRoute ? tokenClube() :
    (window.location.pathname.startsWith('/admin') ? obterAdmin()?.token : tokenClube())
  if (token) config.headers.Authorization = `Bearer ${token}`

  return config
})


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
