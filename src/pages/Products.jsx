import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SectionHeading from '../components/SectionHeading.jsx'
import SearchFilters from '../components/SearchFilters.jsx'
import ProductGrid from '../components/ProductGrid.jsx'
import { products, categories, CATALOG_TOTAL } from '../data/products.js'
import { stores } from '../data/stores.jsx'
import { categoryPath } from '../lib/routes.js'
import { setSeo } from '../lib/seo.js'

const PAGE = 12

/**
 * Sala de catálogo compartida por /productos y /productos/<categoría>.
 * @param {{path: string, initialCategory?: string}} props Ruta SEO activa y
 * categoría preactivada ('todas' para el catálogo completo).
 */
export function CatalogPage({ path, initialCategory = 'todas' }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(initialCategory)
  const [store, setStore] = useState('todas')
  const [sort, setSort] = useState('destacado')
  const [visible, setVisible] = useState(PAGE)

  const isCategory = initialCategory !== 'todas'

  useEffect(() => {
    setSeo({ path })
  }, [path])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    const list = products.filter((p) => {
      if (category !== 'todas' && p.category !== category) return false
      if (store !== 'todas' && p.storeSlug !== store) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some((tag) => tag.includes(q))
      )
    })

    const sorted = [...list]
    if (sort === 'precio-asc') sorted.sort((a, b) => a.price - b.price)
    if (sort === 'precio-desc') sorted.sort((a, b) => b.price - a.price)
    if (sort === 'stock') sorted.sort((a, b) => b.stock - a.stock)
    if (sort === 'nombre') sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'))

    return sorted
  }, [query, category, store, sort])

  const resetPage = () => setVisible(PAGE)

  const onQuery = (value) => {
    setQuery(value)
    resetPage()
  }
  const onCategory = (value) => {
    setCategory(value)
    resetPage()
  }
  const onStore = (value) => {
    setStore(value)
    resetPage()
  }
  const onSort = (value) => {
    setSort(value)
    resetPage()
  }

  const shown = filtered.slice(0, visible)
  const remaining = filtered.length - shown.length

  return (
    <>
      <SectionHeading
        as="h1"
        eyebrow={isCategory ? `Categoría · ${initialCategory}` : 'Sala de productos'}
        title={isCategory ? `Mayoreo de ${initialCategory}` : 'Catálogo de mayoreo'}
        meta={`${CATALOG_TOTAL}+ referencias`}
        accent="var(--accent-cyan)"
        description="Busca por nombre, SKU o etiqueta; filtra por nodo y categoría. Precios de mayoreo por caja, pack, kilogramo o litro según la referencia."
      />

      <SearchFilters
        query={query}
        onQuery={onQuery}
        categories={categories}
        activeCategory={category}
        onCategory={onCategory}
        stores={stores}
        activeStore={store}
        onStore={onStore}
        sort={sort}
        onSort={onSort}
        resultCount={filtered.length}
      />

      <nav className="filters__row" aria-label="Categorías del catálogo">
        <Link
          className={`chip${path === '/productos' ? ' is-active' : ''}`}
          aria-current={path === '/productos' ? 'page' : undefined}
          to="/productos"
        >
          Todas
        </Link>
        {categories.map((categoryName) => {
          const to = categoryPath(categoryName)
          const active = path === to
          return (
            <Link
              key={categoryName}
              className={`chip${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              to={to}
            >
              {categoryName}
            </Link>
          )
        })}
      </nav>

      <ProductGrid items={shown} />

      {remaining > 0 ? (
        <button
          type="button"
          className="btn btn--ghost load-more mono"
          onClick={() => setVisible((v) => v + PAGE)}
        >
          Cargar más · quedan {remaining}
          <span aria-hidden="true">↓</span>
        </button>
      ) : (
        <p className="load-more-note mono">
          {filtered.length === products.length
            ? `Mostrando las ${products.length} referencias publicadas de la muestra · el volcado completo supera las ${CATALOG_TOTAL}`
            : 'Fin de los resultados para este filtro'}
        </p>
      )}
    </>
  )
}

export default function Products() {
  return <CatalogPage path="/productos" />
}
