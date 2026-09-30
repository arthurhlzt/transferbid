import { BrowserRouter, Routes, Route } from "react-router-dom"
import { lazy, Suspense } from "react"
import { ClubeProvider } from "./context/ClubeContext"
import { Navbar } from "./components/Navbar"

import { Home } from "./pages/Home"
import { JogadorDetalhe } from "./pages/JogadorDetalhe"
import { LoginClube } from "./pages/LoginClube"
import { CadastroClube } from "./pages/CadastroClube"
import { MinhasPropostas } from "./pages/MinhasPropostas"

import { AdminLogin } from "./pages/admin/AdminLogin"
import { AdminLayout } from "./pages/admin/AdminLayout"
const Dashboard = lazy(() => import("./pages/admin/Dashboard").then(module => ({ default: module.Dashboard })))
import { Jogadores } from "./pages/admin/Jogadores"
import { Propostas } from "./pages/admin/Propostas"

function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

export default function App() {
  return (
    <ClubeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SiteLayout><Home /></SiteLayout>} />
          <Route path="/jogadores/:id" element={<SiteLayout><JogadorDetalhe /></SiteLayout>} />
          <Route path="/login" element={<SiteLayout><LoginClube /></SiteLayout>} />
          <Route path="/cadastro" element={<SiteLayout><CadastroClube /></SiteLayout>} />
          <Route path="/minhas-propostas" element={<SiteLayout><MinhasPropostas /></SiteLayout>} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Suspense fallback={<p>Carregando painel...</p>}><Dashboard /></Suspense>} />
            <Route path="jogadores" element={<Jogadores />} />
            <Route path="propostas" element={<Propostas />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ClubeProvider>
  )
}
