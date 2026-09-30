let tokenEmMemoria: string | null = null
export function tokenClube() { return tokenEmMemoria || localStorage.getItem('clubeToken') }
export function salvarSessao(id: string, token: string, lembrar: boolean) {
  limparSessao()
  tokenEmMemoria = token
  if (lembrar) {
    localStorage.setItem('clubeToken', token)
    localStorage.setItem('clubeKey', id)
  }
}
export function limparSessao() {
  tokenEmMemoria = null
  localStorage.removeItem('clubeToken')
  localStorage.removeItem('clubeKey')
}
export function obterAdmin() {
  try {
    const admin = JSON.parse(localStorage.getItem('adminAuth') || 'null')
    return typeof admin?.token === 'string' && admin.token ? admin : null
  } catch { localStorage.removeItem('adminAuth'); return null }
}
