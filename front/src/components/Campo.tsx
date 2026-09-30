// Campo de formulário com label permanente (não some ao digitar, ao contrário do
// placeholder) e mensagem de erro logo abaixo do próprio campo.
interface CampoProps {
  label: string
  htmlFor: string
  erro?: string
  dica?: string
  children: React.ReactNode
}

export function Campo({ label, htmlFor, erro, dica, children }: CampoProps) {
  return (
    <div className={`campo ${erro ? "com-erro" : ""}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {dica && !erro && <small className="dica-campo">{dica}</small>}
      {erro && <small className="erro-campo" role="alert">{erro}</small>}
    </div>
  )
}
