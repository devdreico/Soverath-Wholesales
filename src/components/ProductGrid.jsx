import ProductCard from './ProductCard.jsx'

export default function ProductGrid({ items, emptyLabel = 'Sin resultados' }) {
  if (items.length === 0) {
    return (
      <div className="products-empty glass" role="status">
        <span className="products-empty__glyph" aria-hidden="true">
          ◍
        </span>
        <p className="products-empty__title">{emptyLabel}</p>
        <p className="products-empty__hint">
          Ajusta la búsqueda o cambia de categoría para seguir explorando el catálogo.
        </p>
      </div>
    )
  }

  return (
    <div className="products">
      {items.map((product, i) => (
        <ProductCard key={product.id} product={product} order={i} />
      ))}
    </div>
  )
}
