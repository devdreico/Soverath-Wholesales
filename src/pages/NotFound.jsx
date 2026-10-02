import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { setSeo } from '../lib/seo.js'

export default function NotFound() {
  useEffect(() => {
    setSeo({
      title: 'Página no encontrada | Soverath Wholesales',
      description: 'La ruta solicitada no existe dentro del ecosistema Soverath Wholesales.',
      path: '/404',
    })
  }, [])

  return (
    <section className="notfound">
      <p className="notfound__code mono">error 404</p>
      <h1 className="notfound__title">Nodo fuera de cobertura</h1>
      <p className="notfound__lead">
        La ruta que intentas abrir no forma parte del directorio del ecosistema.
      </p>
      <div className="notfound__actions">
        <Link className="btn btn--primary" to="/">
          Volver al índice
          <span aria-hidden="true">→</span>
        </Link>
        <Link className="btn btn--ghost mono" to="/productos">
          /productos
        </Link>
      </div>
    </section>
  )
}
