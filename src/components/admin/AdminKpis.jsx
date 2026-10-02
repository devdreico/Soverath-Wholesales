export default function AdminKpis({ kpis = [] }) {
  return (
    <dl className="admin-kpis">
      {kpis.map((kpi, index) => (
        <div
          className="admin-kpi glass"
          key={kpi.label}
          style={{ '--delay': `${Math.min(index, 6) * 60}ms` }}
        >
          <dt className="admin-kpi__label mono">{kpi.label}</dt>
          <dd className="admin-kpi__value mono">{kpi.value}</dd>
          {kpi.hint ? <dd className="admin-kpi__hint">{kpi.hint}</dd> : null}
        </div>
      ))}
    </dl>
  )
}
