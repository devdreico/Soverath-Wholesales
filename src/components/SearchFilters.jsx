export default function SearchFilters({
  query,
  onQuery,
  categories,
  activeCategory,
  onCategory,
  stores,
  activeStore,
  onStore,
  sort,
  onSort,
  resultCount,
}) {
  const input = (e) => onQuery(e.target.value)

  return (
    <div className="filters glass">
      <div className="filters__search">
        <span className="filters__search-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </span>
        <input
          className="filters__input"
          type="search"
          placeholder="Buscar por nombre, SKU o etiqueta…"
          value={query}
          onChange={input}
          aria-label="Buscar productos"
        />
        <span className="filters__count mono" aria-live="polite">
          {String(resultCount).padStart(3, '0')} refs
        </span>
      </div>

      <div className="filters__row" role="group" aria-label="Filtrar por categoría">
        <button
          type="button"
          className={`chip${activeCategory === 'todas' ? ' is-active' : ''}`}
          aria-pressed={activeCategory === 'todas'}
          onClick={() => onCategory('todas')}
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            type="button"
            key={cat}
            className={`chip${activeCategory === cat ? ' is-active' : ''}`}
            aria-pressed={activeCategory === cat}
            onClick={() => onCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="filters__row filters__row--split">
        <div className="filters__select-wrap">
          <label className="filters__label mono" htmlFor="filter-store">
            Tienda
          </label>
          <select
            id="filter-store"
            className="filters__select"
            value={activeStore}
            onChange={(e) => onStore(e.target.value)}
          >
            <option value="todas">Todas las tiendas</option>
            {stores.map((store) => (
              <option key={store.slug} value={store.slug}>
                {store.index} — {store.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filters__select-wrap">
          <label className="filters__label mono" htmlFor="filter-sort">
            Orden
          </label>
          <select
            id="filter-sort"
            className="filters__select"
            value={sort}
            onChange={(e) => onSort(e.target.value)}
          >
            <option value="destacado">Destacado</option>
            <option value="precio-asc">Precio ↑</option>
            <option value="precio-desc">Precio ↓</option>
            <option value="stock">Stock</option>
            <option value="nombre">A–Z</option>
          </select>
        </div>
      </div>
    </div>
  )
}
