import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { createDevApiProxy } from './devApiProxy.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'THREADLABS_')
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      proxy: { '/api': createDevApiProxy(env.THREADLABS_DEV_API_TARGET) },
    },
  }
})
