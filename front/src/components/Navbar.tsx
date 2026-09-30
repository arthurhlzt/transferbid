import { Link, useNavigate } from "react-router-dom"
import { useClube } from "../context/ClubeContext"

export function Navbar() {
  const { clube, logout } = useClube()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/")
  }

  return (
    <header className="navbar">
      <Link to="/" className="logo">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M2 14L7.5 8.5L11 12L18 4" stroke="#ffb343" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 4H18V9" stroke="#ffb343" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        transfer<span className="bid">BID</span>
      </Link>

      <nav>
        {clube ? (
          <>
            <span className="clube-nome">{clube.nome}</span>
            <Link to="/minhas-propostas">Minhas Propostas</Link>
            <button onClick={handleLogout}>Sair</button>
          </>
        ) : (
          <>
            <Link to="/login">Identifique-se</Link>
            <Link to="/cadastro">Cadastre-se</Link>
          </>
        )}
      </nav>
    </header>
  )
}
