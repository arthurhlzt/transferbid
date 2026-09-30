// Extrai mensagens de erro de uma resposta da API para exibir junto aos campos.
// A API devolve { erro: <ZodError> } (com "issues") em validações, ou { erro: "texto" }.
export function extrairErros(err: any): { campos: Record<string, string>; geral: string } {
  const dados = err?.response?.data
  const campos: Record<string, string> = {}
  const issues = dados?.erro?.issues ?? dados?.erro?.errors
  if (Array.isArray(issues)) {
    for (const item of issues) {
      const campo = Array.isArray(item.path) ? String(item.path[0] ?? "") : ""
      if (campo && !campos[campo]) campos[campo] = item.message
    }
  }
  let geral = ""
  if (typeof dados?.erro === "string") geral = dados.erro
  else if (!Object.keys(campos).length) geral = "Não foi possível concluir a operação. Tente novamente."
  if (!err?.response) geral = "Sem conexão com o servidor. Verifique sua internet e tente novamente."
  return { campos, geral }
}
