export function EstadoErro({ mensagem, onTentarNovamente }: { mensagem: string; onTentarNovamente?: () => void }) {
  return (
    <div className="estado-erro" role="alert">
      <p>{mensagem}</p>
      {onTentarNovamente && (
        <button type="button" onClick={onTentarNovamente}>Tentar novamente</button>
      )}
    </div>
  )
}
