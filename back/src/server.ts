import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'

import routesPosicoes from './routes/posicoes'
import routesJogadores from './routes/jogadores'
import routesClubes from './routes/clubes'
import routesPropostas from './routes/propostas'
import routesAdmin from './routes/admin'

export const app = express()
const port = Number(process.env.PORT || 3000)

app.use(express.json())
const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean)
if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGINS) {
  throw new Error('Configure CORS_ORIGINS com a URL do frontend')
}
app.use(cors({ origin: (origin, callback) => callback(null, !origin || origins.includes(origin)) }))
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// Documentação Swagger (gerada com `npm run swagger`, a partir dos comentários
// #swagger.* nas rotas). Se o arquivo ainda não foi gerado, a API sobe normalmente
// e /docs só fica disponível depois de rodar o comando.
const swaggerOutputPath = path.resolve(process.cwd(), 'swagger-output.json')
if (fs.existsSync(swaggerOutputPath)) {
  const swaggerDocument = JSON.parse(fs.readFileSync(swaggerOutputPath, 'utf-8'))
  app.get('/swagger.json', (_req, res) => res.json(swaggerDocument))
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, { swaggerOptions: { url: '/swagger.json' } }))
} else {
  console.log('Aviso: swagger-output.json não encontrado. Rode "npm run swagger" para gerar a documentação em /docs.')
}

app.use("/posicoes", routesPosicoes)
app.use("/jogadores", routesJogadores)
app.use("/clubes", routesClubes)
app.use("/propostas", routesPropostas)
app.use("/admin", routesAdmin)

app.get('/', (req, res) => {
  res.send('API: Agenciamento de Transferência de Jogadores (documentação em /docs)')
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta: ${port}`)
})
