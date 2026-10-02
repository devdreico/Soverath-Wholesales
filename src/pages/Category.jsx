import { Navigate, useParams } from 'react-router-dom'
import { CatalogPage } from './Products.jsx'
import { categoryFromSlug } from '../lib/routes.js'

/**
 * /productos/<categoría>: valida el parámetro contra el catálogo y reutiliza
 * la sala de productos con el filtro preactivado. Slug inexistente →
 * redirección replace a /productos (evita hojas de ruta muertas).
 */
export default function Category() {
  const { categoria } = useParams()
  const category = categoryFromSlug(categoria)

  if (!category) return <Navigate to="/productos" replace />

  return (
    <CatalogPage key={categoria} path={`/productos/${categoria}`} initialCategory={category} />
  )
}
