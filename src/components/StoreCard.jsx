export default function StoreCard({ store, index }) {
  const { name, category, title, description, url, accent, icon } = store

  return (
    <a
      className="card glass"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ '--accent': accent, '--delay': `${index * 70}ms` }}
    >
      <span className="card__icon" aria-hidden="true">
        {icon}
      </span>

      <span className="card__body">
        <span className="card__meta">
          <span className="card__category">{category}</span>
          <span className="card__dot" aria-hidden="true" />
          <span className="card__name">{name}</span>
        </span>
        <span className="card__title">{title}</span>
        <span className="card__description">{description}</span>
      </span>

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
    </a>
  )
}
