import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { salvarSessao, limparSessao } from "../services/session"
import { api } from "../services/api"
import type { Clube } from "../types"

interface ClubeContextData {
  clube: Clube | null
  carregando: boolean
  login: (clube: Clube, token: string, manterConectado: boolean) => void
  logout: () => void
}

const ClubeContext = createContext<ClubeContextData>({} as ClubeContextData)

// Guarda o TOKEN (credencial de verdade) e o id do clube (exigido pelo trabalho,
// requisito 5) no LocalStorage. O id sozinho nunca é aceito pela API como prova
// de identidade — quem autentica as requisições é sempre o token no header.
const TOKEN_KEY = "clubeToken"
const ID_KEY = "clubeKey"

export function ClubeProvider({ children }: { children: ReactNode }) {
  const [clube, setClube] = useState<Clube | null>(null)
  const [carregando, setCarregando] = useState(true)

  // Ao iniciar o app, tenta recuperar o token salvo no LocalStorage e validar a
  // sessão consultando os dados do PRÓPRIO clube autenticado.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const idSalvo = localStorage.getItem(ID_KEY)
    if (!token) {
      setCarregando(false)
      return
    }

    api.get("/clubes/me")
      .then((resposta) => {
        if (idSalvo && idSalvo !== resposta.data.id) { limparSessao(); return }
        localStorage.setItem(ID_KEY, resposta.data.id)
        setClube(resposta.data)
      })
      .catch((erro) => {
        if ([401, 404].includes(erro?.response?.status)) limparSessao()
      })
      .finally(() => setCarregando(false))
  }, [])

  useEffect(() => {
    const expirar = () => setClube(null)
    window.addEventListener('clube-sessao-expirada', expirar)
    return () => window.removeEventListener('clube-sessao-expirada', expirar)
  }, [])

  function login(clubeLogado: Clube, token: string, manterConectado: boolean) {
    setClube(clubeLogado)
    salvarSessao(clubeLogado.id, token, manterConectado)
  }

  function logout() {
    setClube(null)
    limparSessao()
  }

  return (
    <ClubeContext.Provider value={{ clube, carregando, login, logout }}>
      {children}
    </ClubeContext.Provider>
  )
}

export function useClube() {
  return useContext(ClubeContext)
}
