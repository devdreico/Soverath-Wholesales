import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { Route, Routes, StaticRouter } from 'react-router-dom'
import App from './App.jsx'
import HomeEntry from './components/HomeEntry.jsx'
import Products from './pages/Products.jsx'
import Category from './pages/Category.jsx'
import StorePage from './pages/StorePage.jsx'
import NotFound from './pages/NotFound.jsx'
import { seoMetaFor } from './lib/seo.js'

export { seoMetaFor }

/**
 * Renderiza una ruta pública al markup que rellena `#root` en dist/.
 * Importa las páginas de forma estática (renderToString no admite lazy) y
 * replica el árbol de `src/main.jsx` sin la ruta /admin.
 *
 * @param {string} path Ruta a renderizar (p. ej. "/tienda/ferreza").
 * @returns {string} HTML de la ruta.
 */
export function render(path) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={path}>
        <Routes>
          <Route element={<App />}>
            <Route path="/" element={<HomeEntry />} />
            <Route path="/productos" element={<Products />} />
            <Route path="/productos/:categoria" element={<Category />} />
            <Route path="/tienda/:slug" element={<StorePage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </StaticRouter>
    </StrictMode>
  )
}
