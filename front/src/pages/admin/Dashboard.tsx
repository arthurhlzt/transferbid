import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, LabelList, ResponsiveContainer } from "recharts"
import { VictoryChart, VictoryBar, VictoryAxis, VictoryTheme } from "victory"
import { api } from "../../services/api"
import { EstadoErro } from "../../components/EstadoErro"

interface DadosDashboard {
  numJogadores: number
  numClubes: number
  numPropostas: number
  taxaAceitacao: number | null
  jogadoresPorPosicao: { posicao: string; total: number }[]
  clubesPorPais: { pais: string; total: number }[]
  propostasPorStatus: { status: string; total: number }[]
  jogadoresPorStatus: { status: string; total: number }[]
  valorMedioPorPosicao: { posicao: string; valorMedio: number }[]
}

const ROTULO_STATUS: Record<string, string> = {
  PENDENTE: "Pendentes", ACEITA: "Aceitas", RECUSADA: "Recusadas",
  DISPONIVEL: "Disponíveis", EM_NEGOCIACAO: "Em negociação", TRANSFERIDO: "Transferidos",
}

const axisStyle = {
  axis: { stroke: "rgba(234,239,234,0.2)" },
  tickLabels: { fill: "#8b98a3", fontFamily: "Inter, sans-serif", fontSize: 11 },
  grid: { stroke: "rgba(234,239,234,0.06)" },
}

const tooltipStyle = {
  background: "#1b232c", border: "1px solid rgba(234,239,234,0.12)", borderRadius: 8, color: "#eaefea",
}

function BarrasHorizontais({ dados, rotulo, cor }: { dados: { nome: string; total: number }[]; rotulo: string; cor: string }) {
  const ordenados = [...dados].sort((a, b) => b.total - a.total)
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, ordenados.length * 40)}>
      <BarChart data={ordenados} layout="vertical" margin={{ left: 0, right: 32, top: 4, bottom: 4 }}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="nome" width={92} axisLine={false} tickLine={false}
          tick={{ fill: "#eaefea", fontSize: 12.5 }} />
        <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={tooltipStyle}
          formatter={(valor) => [valor, rotulo]} />
        <Bar dataKey="total" fill={cor} radius={[0, 4, 4, 0]} barSize={20}>
          <LabelList dataKey="total" position="right" fill="#eaefea" fontSize={12} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function Dashboard() {
  const [dados, setDados] = useState<DadosDashboard | null>(null)
  const [erro, setErro] = useState(false)

  function carregar() {
    setErro(false)
    api.get("/admin/dashboard").then((r) => setDados(r.data)).catch(() => setErro(true))
  }

  useEffect(carregar, [])

  if (erro) return <main><EstadoErro mensagem="Não foi possível carregar a visão geral." onTentarNovamente={carregar} /></main>
  if (!dados) return <main><p aria-live="polite">Carregando...</p></main>

  const total = (status: string) => dados.propostasPorStatus.find((p) => p.status === status)?.total ?? 0
  const pendentes = total("PENDENTE")
  const taxaAceitacao = dados.taxaAceitacao !== null ? `${dados.taxaAceitacao}%` : "—"

  return (
    <main>
      <h2>Visão Geral do Sistema</h2>
      <p className="subtitulo">Acompanhe o andamento das negociações e o perfil do seu mercado.</p>

      <div className="cards-resumo">
        <div className="card destaque">
          <strong>{pendentes}</strong>
          <span>Propostas aguardando resposta</span>
        </div>
        <div className="card turf">
          <strong>{taxaAceitacao}</strong>
          <span>Taxa de aceitação (das respondidas)</span>
        </div>
        <div className="card">
          <strong>{dados.numPropostas}</strong>
          <span>Propostas recebidas</span>
        </div>
        <div className="card steel">
          <strong>{dados.numJogadores}</strong>
          <span>Jogadores no portfólio</span>
        </div>
        <div className="card rust">
          <strong>{dados.numClubes}</strong>
          <span>Clubes cadastrados</span>
        </div>
      </div>

      <div className="graficos">
        <div>
          <h3>Propostas por status</h3>
          <p className="legenda-grafico">Quantidade de propostas em cada etapa da negociação.</p>
          <VictoryChart theme={VictoryTheme.clean} domainPadding={30} height={240}>
            <VictoryAxis tickFormat={dados.propostasPorStatus.map((d) => ROTULO_STATUS[d.status] ?? d.status)} style={axisStyle} />
            <VictoryAxis dependentAxis tickFormat={(v) => (Number.isInteger(v) ? v : "")} style={axisStyle} />
            <VictoryBar data={dados.propostasPorStatus.map((d) => ({ ...d, rotulo: ROTULO_STATUS[d.status] ?? d.status }))}
              x="rotulo" y="total" style={{ data: { fill: "#ffb343" } }} cornerRadius={{ top: 3 }} />
          </VictoryChart>
        </div>

        <div>
          <h3>Jogadores por status de mercado</h3>
          <p className="legenda-grafico">Quantos atletas estão disponíveis, em negociação ou já transferidos.</p>
          <VictoryChart theme={VictoryTheme.clean} domainPadding={30} height={240}>
            <VictoryAxis tickFormat={dados.jogadoresPorStatus.map((d) => ROTULO_STATUS[d.status] ?? d.status)} style={axisStyle} />
            <VictoryAxis dependentAxis tickFormat={(v) => (Number.isInteger(v) ? v : "")} style={axisStyle} />
            <VictoryBar data={dados.jogadoresPorStatus.map((d) => ({ ...d, rotulo: ROTULO_STATUS[d.status] ?? d.status }))}
              x="rotulo" y="total" style={{ data: { fill: "#4fd8c4" } }} cornerRadius={{ top: 3 }} />
          </VictoryChart>
        </div>
      </div>

      <div className="graficos">
        <div>
          <h3>Jogadores por posição</h3>
          <p className="legenda-grafico">Número de atletas cadastrados em cada posição.</p>
          <BarrasHorizontais dados={dados.jogadoresPorPosicao.map((d) => ({ nome: d.posicao, total: d.total }))}
            rotulo="Jogadores" cor="#ffb343" />
        </div>

        <div>
          <h3>Clubes por país</h3>
          <p className="legenda-grafico">Origem dos clubes que já se cadastraram para negociar.</p>
          <BarrasHorizontais dados={dados.clubesPorPais.map((d) => ({ nome: d.pais, total: d.total }))}
            rotulo="Clubes" cor="#6f92bd" />
        </div>
      </div>

      <div className="graficos">
        <div>
          <h3>Valor médio pedido por posição</h3>
          <p className="legenda-grafico">Em milhões de reais (R$ mi).</p>
          <VictoryChart theme={VictoryTheme.clean} domainPadding={30} height={240}>
            <VictoryAxis tickFormat={dados.valorMedioPorPosicao.map((d) => d.posicao)} style={axisStyle} />
            <VictoryAxis dependentAxis tickFormat={(v) => `${(v / 1000000).toFixed(1)}`} style={axisStyle} />
            <VictoryBar data={dados.valorMedioPorPosicao} x="posicao" y="valorMedio"
              style={{ data: { fill: "#e0563a" } }} cornerRadius={{ top: 3 }} />
          </VictoryChart>
        </div>
      </div>
    </main>
  )
}
