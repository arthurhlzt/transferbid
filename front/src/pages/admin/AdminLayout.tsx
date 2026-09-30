import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom"

import { obterAdmin } from "../../services/session"

const classeLink = ({ isActive }: { isActive: boolean }) => (isActive ? "ativo" : undefined)

export function AdminLayout() {
  const admin = obterAdmin()
  const navigate = useNavigate()

  if (!admin) return <Navigate to="/admin/login" replace />

  function sair() {
    localStorage.removeItem("adminAuth")
    navigate("/admin/login")
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h3>transfer<span className="bid">BID</span></h3>
        <p className="subtitulo-painel">Painel do empresário</p>
        <nav aria-label="Menu do painel">
          <NavLink to="/admin" end className={classeLink}>Visão Geral</NavLink>
          <NavLink to="/admin/jogadores" className={classeLink}>Cadastro de Jogadores</NavLink>
          <NavLink to="/admin/propostas" className={classeLink}>Controle de Propostas</NavLink>
          <button onClick={sair}>Sair do Sistema</button>
        </nav>
      </aside>
      <div className="admin-content">
        <header className="admin-header">{admin.nome}</header>
        <Outlet />
      </div>
    </div>
  )
}
