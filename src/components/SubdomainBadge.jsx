export default function SubdomainBadge({ subdomain, accent = 'var(--text)' }) {
  return (
    <span className="domain-badge mono" style={{ '--accent': accent }}>
      <span className="domain-badge__dot" aria-hidden="true" />
      {subdomain}
    </span>
  )
}
