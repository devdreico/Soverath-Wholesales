import { StrictMode, lazy } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App.jsx'
import { setSeo } from './lib/seo.js'
import './index.css'
import './styles/nav.css'
import './styles/home.css'
import './styles/products.css'
import './styles/store.css'

const HomeEntry = lazy(() => import('./components/HomeEntry.jsx'))
const Products = lazy(() => import('./pages/Products.jsx'))
const Category = lazy(() => import('./pages/Category.jsx'))
const StorePage = lazy(() => import('./pages/StorePage.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

/** /admin no se prerendera (localStorage en primer render): noindex al cargar su chunk. */
const Admin = lazy(() =>
  import('./pages/Admin.jsx').then((mod) => {
    setSeo({ path: '/admin' })
    return mod
  })
)

/**
 * Árbol de rutas del cliente: una vuelta de Suspense en App por chunk de ruta.
 * El prerender replica esta estructura con imports estáticos en prerender-entry.jsx.
 */
export function AppTree() {
  return (
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route element={<App />}>
            <Route path="/" element={<HomeEntry />} />
            <Route path="/productos" element={<Products />} />
            <Route path="/productos/:categoria" element={<Category />} />
            <Route path="/tienda/:slug" element={<StorePage />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StrictMode>
  )
}

const container = document.getElementById('root')
const prerendered = container.getAttribute('data-prerendered')
const canHydrate = container.hasChildNodes() && prerendered === window.location.pathname

if (canHydrate) hydrateRoot(container, <AppTree />)
else createRoot(container).render(<AppTree />)
