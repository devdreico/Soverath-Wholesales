export default function AdminEmpty({ glyph = '◈', title, hint, actionLabel, onAction }) {
  return (
    <div className="admin-empty glass" role="status">
      <span className="admin-empty__glyph" aria-hidden="true">
        {glyph}
      </span>
      <p className="admin-empty__title">{title}</p>
      <p className="admin-empty__hint">{hint}</p>
      {actionLabel ? (
        <button type="button" className="btn btn--ghost admin-empty__action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
