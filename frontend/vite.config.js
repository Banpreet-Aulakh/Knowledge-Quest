import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    historyApiFallback: true,
    proxy: {
      '/api': 'http://localhost:3000',
      '/login': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Only proxy non-GET methods for /login (e.g., the POST for authentication)
        bypass: (req) => {
          if (req.method === 'GET') {
            return '/index.html';
          }
        }
      },
      '/register': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        bypass: (req) => {
          if (req.method === 'GET') {
            return '/index.html';
          }
        }
      },
      '/logout': 'http://localhost:3000',
      '/library': 'http://localhost:3000',
      '/skills': 'http://localhost:3000'
    }
  }
})
