import {
  ORDER_CHANNELS,
  ORDER_CHANNEL_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
} from '../../lib/orders-store.js'

export default function AdminFilters({ filters, onChange, resultCount = 0 }) {
  const set = (patch) => onChange({ ...filters, ...patch })

  return (
    <section className="admin-filters glass" aria-label="Filtros de pedidos">
      <div className="admin-filters__search">
        <label className="admin-filters__label mono" htmlFor="admin-orders-search">
          Buscar
        </label>
        <input
          id="admin-orders-search"
          className="admin-filters__input"
          type="search"
          placeholder="Cliente o id del pedido…"
          value={filters.query}
          onChange={(event) => set({ query: event.target.value })}
        />
        <span className="admin-filters__count mono" aria-live="polite">
          {String(resultCount).padStart(2, '0')} pedidos
        </span>
      </div>

      <div className="admin-filters__row" role="group" aria-label="Filtrar por canal">
        <span className="admin-filters__legend mono" aria-hidden="true">
          Canal
        </span>
        <button
          type="button"
          className={`admin-chip${filters.channel === 'todos' ? ' is-active' : ''}`}
          aria-pressed={filters.channel === 'todos'}
          onClick={() => set({ channel: 'todos' })}
        >
          Todos
        </button>
        {ORDER_CHANNELS.map((channel) => (
          <button
            type="button"
            key={channel}
            className={`admin-chip${filters.channel === channel ? ' is-active' : ''}`}
            aria-pressed={filters.channel === channel}
            onClick={() => set({ channel })}
          >
            <span className="admin-chip__dot" data-channel={channel} aria-hidden="true" />
            {ORDER_CHANNEL_LABELS[channel]}
          </button>
        ))}
      </div>

      <div className="admin-filters__row" role="group" aria-label="Filtrar por estado">
        <span className="admin-filters__legend mono" aria-hidden="true">
          Estado
        </span>
        <button
          type="button"
          className={`admin-chip${filters.status === 'todos' ? ' is-active' : ''}`}
          aria-pressed={filters.status === 'todos'}
          onClick={() => set({ status: 'todos' })}
        >
          Todos
        </button>
        {ORDER_STATUSES.map((status) => (
          <button
            type="button"
            key={status}
            className={`admin-chip admin-chip--status${filters.status === status ? ' is-active' : ''}`}
            data-status={status}
            aria-pressed={filters.status === status}
            onClick={() => set({ status })}
          >
            {ORDER_STATUS_LABELS[status]}
          </button>
        ))}
      </div>
    </section>
  )
}
