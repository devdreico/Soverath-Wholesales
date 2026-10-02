import { Link } from 'react-router-dom'
import { formatPrice, unitLabel } from '../data/products.js'
import { getStore } from '../data/stores.jsx'
import ChannelActions from './ChannelActions.jsx'

export default function ProductCard({ product, order = 0 }) {
  const store = getStore(product.storeSlug)
  const out = product.stock === 0

  return (
    <article
      className="product glass"
      style={{
        '--accent': 'var(--accent-cyan)',
        '--delay': `${(order % 12) * 45}ms`,
      }}
    >
      <span className="product__index mono" aria-hidden="true">
        {product.sku}
      </span>

      <div className="product__visual" aria-hidden="true">
        <span className="product__visual-glyph">{store?.icon}</span>
        <span className="product__visual-ring" />
        {product.isNew ? <span className="product__flag mono">Nuevo</span> : null}
        {out ? <span className="product__flag product__flag--out mono">Agotado</span> : null}
      </div>

      <div className="product__body">
        <p className="product__category mono">{product.category}</p>
        <h3 className="product__name">{product.name}</h3>

        <div className="product__price-row">
          <span className="product__price mono">{formatPrice(product.price)}</span>
          <span className="product__unit mono">/ {unitLabel(product.unit)}</span>
        </div>

        <div className="product__stock">
          <span className={`product__stock-bar${out ? ' is-empty' : ''}`}>
            <span
              className="product__stock-fill"
              style={{
                width: `${Math.max(6, Math.min(100, (product.stock / 500) * 100))}%`,
              }}
            />
          </span>
          <span className="product__stock-label mono">
            {out ? 'sin stock' : `${product.stock} en bodega`}
          </span>
        </div>
      </div>

      <div className="product__foot">
        <Link
          className="product__store"
          to={`/tienda/${product.storeSlug}`}
        >
          <span className="product__store-dot" aria-hidden="true" />
          {store?.name}
        </Link>
        <Link
          className="product__go"
          to={`/tienda/${product.storeSlug}`}
          aria-label={`Ver ${product.name} en ${store?.name}`}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M8 16 16 8M9.5 8H16v6.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>

      <ChannelActions product={product} store={store} />
    </article>
  )
}
