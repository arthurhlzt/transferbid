// Run ONLY against a disposable local API and database. No live credentials.
import assert from 'node:assert/strict'
const base = process.env.TEST_API_URL || 'http://127.0.0.1:3100'
if (!['127.0.0.1','localhost'].includes(new URL(base).hostname)) throw new Error('Use uma API local descartável')
const suffix = Date.now()
let checks = 0
async function call(path, method='GET', body, token, expected=200) {
  const r = await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(45000)})
  const data = await r.json()
  assert.equal(r.status,expected,`${method} ${path}: ${JSON.stringify(data)}`); checks++
  return data
}
const spec=await call('/swagger.json')
assert.equal(spec.swagger,'2.0');assert.ok(!spec.host && !spec.schemes);checks++
for (const [path,method] of [['/clubes/me','get'],['/jogadores/{id}/destaque','patch']]) {
  assert.deepEqual(spec.paths[path][method].security,[{bearerAuth:[]}]); checks++
}
await call('/admin/dashboard','GET',undefined,undefined,401)
await call('/propostas','POST',{jogadorId:1,valorOferta:10,mensagem:'Teste'},undefined,401)
const {token:admin}=await call('/admin/login','POST',{email:'admin@agencia.com',senha:process.env.TEST_ADMIN_PASSWORD})
const clubes=[]
for (let i=0;i<2;i++) {
  const email=`smoke-${suffix}-${i}@example.com`,senha='Teste-local-2026'
  const clube=await call('/clubes','POST',{nome:`Clube teste ${i}`,pais:'Brasil',email,senha},undefined,201)
  const login=await call('/clubes/login','POST',{email,senha})
  clubes.push({...clube,token:login.token})
}
await call('/admin/dashboard','GET',undefined,clubes[0].token,401)
await call('/clubes/me','GET',undefined,admin,401)
const posicoes=await call('/posicoes')
const jogador=await call('/jogadores','POST',{nome:`Atleta teste ${suffix}`,idade:23,nacionalidade:'Brasil',clubeAtual:'Clube local',valorPedido:100000,foto:'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800',posicaoId:posicoes[0].id},admin,201)
assert.equal(jogador.analiseIA,false);checks++
const filtro=await call(`/jogadores?nome=${encodeURIComponent(jogador.nome)}&destaque=true`)
assert.equal(filtro[0].id,jogador.id);checks++
await call('/jogadores/abc','GET',undefined,undefined,400)
await call('/jogadores?posicaoId=1.5','GET',undefined,undefined,400)
const propostas=[]
for (const c of clubes) propostas.push(await call('/propostas','POST',{jogadorId:jogador.id,valorOferta:90000,mensagem:'Proposta local de teste',clubeId:clubes[1].id},c.token,201))
assert.equal(propostas[0].clubeId,clubes[0].id);checks++
const minhas=await call('/propostas/minhas','GET',undefined,clubes[0].token)
assert.ok(minhas.every(p=>p.clubeId===clubes[0].id));checks++
await call(`/propostas/${propostas[0].id}`,'PUT',{resposta:'Aceitamos',status:'ACEITA'},admin)
const transferido=await call(`/jogadores/${jogador.id}`)
assert.equal(transferido.status,'TRANSFERIDO');assert.equal(transferido.destaque,false);checks++
const outras=await call('/propostas/minhas','GET',undefined,clubes[1].token)
assert.equal(outras[0].status,'RECUSADA');assert.ok(outras[0].resposta);checks++
await call(`/propostas/${propostas[1].id}`,'PUT',{resposta:'Outra aceitação',status:'ACEITA'},admin,409)
await call(`/propostas/${propostas[0].id}`,'PUT',{resposta:'Reabrir',status:'PENDENTE'},admin,409)
await call(`/propostas/${propostas[0].id}`,'DELETE',undefined,admin,409)
await call('/propostas','POST',{jogadorId:jogador.id,valorOferta:1,mensagem:'Outra'},clubes[0].token,409)
await call(`/jogadores/${jogador.id}/destaque`,'PATCH',{destaque:true},admin,409)
await call('/admin/dashboard','GET',undefined,admin)
const allowed=await fetch(base+'/health',{headers:{Origin:'http://localhost:5173'}})
assert.equal(allowed.headers.get('access-control-allow-origin'),'http://localhost:5173');checks++
const denied=await fetch(base+'/health',{headers:{Origin:'https://untrusted.example'}})
assert.equal(denied.headers.get('access-control-allow-origin'),null);checks++
console.log(`${checks} verificações de API aprovadas; dados de teste mantidos no banco descartável.`)
