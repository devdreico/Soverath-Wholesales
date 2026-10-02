import { Link } from 'react-router-dom'

export default function StoreCard({ store, index }) {
  const { slug, index: number, name, category, title, description, url } = store

  return (
    <article
      className="card glass"
      style={{ '--accent': 'var(--accent-cyan)', '--delay': `${(index % 12) * 55}ms` }}
    >
      <span className="card__index mono" aria-hidden="true">
        {number}
      </span>
      <span className="card__spot" aria-hidden="true" />
      <span className="card__edge" aria-hidden="true" />

      <div className="card__head">
        <span className="card__icon" aria-hidden="true">
          {store.icon}
        </span>
        <span className="card__meta">
          <span className="card__category">{category}</span>
          <span className="card__name mono">{slug}</span>
        </span>
      </div>

      <div className="card__body">
        <h3 className="card__title">{title}</h3>
        <p className="card__description">{description}</p>
      </div>

      <div className="card__foot">
        <span className="card__domain mono">{store.subdomain}</span>
        <span className="card__cta" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M8 16 16 8M9.5 8H16v6.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      <Link
        className="card__hit"
        to={`/tienda/${slug}`}
        aria-label={`Abrir el apartado de ${name} en el portal`}
      />
      <a
        className="card__ext"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visitar el sitio externo de ${name}`}
      >
        ↗
      </a>
    </article>
  )
}
