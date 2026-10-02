import { Navigate } from 'react-router-dom'
import { stores } from '../data/stores.jsx'
import { nodeSlugFromHost } from '../lib/host.js'
import Home from '../pages/Home.jsx'

/**
 * Entrada de la portada: si la app se sirve bajo <nodo>.presentto.online
 * (wildcard DNS activo), el host decide a qué tienda se abre en vez de
 * mostrar la portada general. En SSR (prerender) no hay window: se pinta Home.
 */
export default function HomeEntry() {
  const slug =
    typeof window !== 'undefined'
      ? nodeSlugFromHost(stores, window.location.hostname, window.location.pathname)
      : null

  if (slug) {
    return <Navigate to={`/tienda/${slug}`} replace />
  }
  return <Home />
}
