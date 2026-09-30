import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiUrl = process.env.VITE_API_URL || env.VITE_API_URL
  if (command === 'build' && !apiUrl) throw new Error('Configure VITE_API_URL antes do build')
  if (apiUrl && !/^https?:\/\//.test(apiUrl)) throw new Error('VITE_API_URL deve começar com http:// ou https://')
  return { plugins: [react()] }
})
