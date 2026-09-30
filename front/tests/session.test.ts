import assert from 'node:assert/strict'
import { test, beforeEach } from 'node:test'
const storage = new Map<string,string>()
Object.defineProperty(globalThis,'localStorage',{value:{
  getItem:(k:string)=>storage.get(k)??null,
  setItem:(k:string,v:string)=>storage.set(k,v),
  removeItem:(k:string)=>storage.delete(k),
}})
const {salvarSessao,limparSessao,tokenClube,obterAdmin}=await import('../src/services/session.ts')
beforeEach(()=>{limparSessao();storage.clear()})
test('login sem lembrar mantém token disponível e não persiste UUID',()=>{
  salvarSessao('uuid-a','token-a',false)
  assert.equal(tokenClube(),'token-a')
  assert.equal(localStorage.getItem('clubeKey'),null)
  assert.equal(localStorage.getItem('clubeToken'),null)
})
test('login lembrado persiste UUID e token; novo login temporário remove sessão anterior',()=>{
  salvarSessao('uuid-a','token-a',true)
  assert.equal(localStorage.getItem('clubeKey'),'uuid-a')
  assert.equal(localStorage.getItem('clubeToken'),'token-a')
  salvarSessao('uuid-b','token-b',false)
  assert.equal(tokenClube(),'token-b')
  assert.equal(localStorage.getItem('clubeKey'),null)
  assert.equal(localStorage.getItem('clubeToken'),null)
})
test('logout remove memória e persistência',()=>{
  salvarSessao('uuid-a','token-a',true);limparSessao()
  assert.equal(tokenClube(),null)
  assert.equal(localStorage.getItem('clubeKey'),null)
})
test('JSON inválido do admin não quebra a aplicação',()=>{
  localStorage.setItem('adminAuth','{inválido')
  assert.equal(obterAdmin(),null)
})
