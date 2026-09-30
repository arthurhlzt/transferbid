const LABELS: Record<string, string> = {
  PENDENTE: "Aguardando",
  ACEITA: "Aceita",
  RECUSADA: "Recusada",
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`status-pill ${status.toLowerCase()}`}>
      {LABELS[status] ?? status}
    </span>
  )
}
