import { useLocation } from 'react-router-dom'

/**
 * Envuelve cada ruta: al cambiar de pathname el nodo se remonta y ejecuta
 * la animación de entrada (cortina + desenfoque) definida en CSS.
 */
export default function PageTransition({ children }) {
  const location = useLocation()

  return (
    <div className="route" key={location.pathname}>
      <span className="route__veil" aria-hidden="true" />
      {children}
    </div>
  )
}

/**
 * Fallback del code-splitting: gate de marca, sin spinner genérico.
 * Se usa dentro del `<Suspense>` de App y se replica en el prerender.
 */
export function RouteFallback() {
  return (
    <div className="route" role="status" aria-busy="true">
      <span className="sr-only">Cargando</span>
      <p
        className="mono"
        aria-hidden="true"
        style={{ opacity: 0.6, letterSpacing: '0.35em', textTransform: 'uppercase' }}
      >
        Soverath Wholesales
      </p>
    </div>
  )
}
