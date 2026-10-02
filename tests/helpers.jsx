import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import App from '../src/App.jsx'
import HomeEntry from '../src/components/HomeEntry.jsx'
import Products from '../src/pages/Products.jsx'
import Category from '../src/pages/Category.jsx'
import StorePage from '../src/pages/StorePage.jsx'
import NotFound from '../src/pages/NotFound.jsx'

/**
 * Monta la aplicación real con el mismo árbol de rutas que `src/main.jsx`
 * (sin /admin: usa localStorage en primer render) sobre una ruta inicial en
 * memoria.
 *
 * @param {string} path Ruta inicial (p. ej. "/productos").
 * @returns {ReturnType<typeof render>} Resultado de Testing Library.
 */
export function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<App />}>
          <Route path="/" element={<HomeEntry />} />
          <Route path="/productos" element={<Products />} />
          <Route path="/productos/:categoria" element={<Category />} />
          <Route path="/tienda/:slug" element={<StorePage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}
