import fs from "node:fs/promises"
import swaggerAutogen from "swagger-autogen"

const doc = {
  info: {
    title: "API - Agenciamento de Transferência de Jogadores",
    description: "Documentação da API do sistema de agenciamento de transferência de jogadores para clubes. Rotas protegidas exigem um token JWT: faça login em /clubes/login ou /admin/login, copie o token e clique em \"Authorize\" abaixo, informando: Bearer SEU_TOKEN",
    version: "1.0.0",
  },
  basePath: "/",
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: 'Informe: Bearer SEU_TOKEN (token retornado por /clubes/login ou /admin/login)',
    },
  },
}

const outputFile = "./swagger-output.json"

// Arquivo principal que registra as rotas
const routes = ["./src/server.ts"]

// Sem "openapi: 3.0.0": gera Swagger 2.0, formato compatível com os comentários
// "#swagger.parameters['body'] = { in: 'body', ... }" usados nas rotas. Gerar como
// OpenAPI 3.0 exigiria reescrever esses comentários como "#swagger.requestBody".
const result = await swaggerAutogen()(outputFile, routes, doc)
if (!result || !result.success) throw new Error('Falha ao gerar Swagger')
const spec = JSON.parse(await fs.readFile(outputFile, 'utf8'))
delete spec.host
delete spec.schemes
await fs.writeFile(outputFile, JSON.stringify(spec, null, 2) + '\n')
