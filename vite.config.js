import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * En preview, `/productos` debe servir `dist/productos/index.html` (como hace
 * un host estático con `try_files $uri $uri/`) en vez de caer en el fallback
 * SPA de `dist/index.html`. Sin esto el prerender no se sirve en las rutas
 * declaradas sin barra final y el cliente no puede hidratar.
 */
function prerenderedIndexFallback() {
  return {
    name: 'prerendered-index-fallback',
    configurePreviewServer(server) {
      const distDir = path.join(server.config.root, 'dist')

      server.middlewares.use((req, _res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0])
        if (!url || url.endsWith('/') || path.extname(url)) return next()

        const target = path.join(distDir, url, 'index.html')
        const inside = target.startsWith(distDir + path.sep)

        if (inside && fs.existsSync(target)) {
          req.url = `${url}/index.html`
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), prerenderedIndexFallback()],
})
