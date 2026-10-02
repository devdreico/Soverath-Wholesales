export default function SubdomainBadge({ subdomain }) {
  return (
    <span className="domain-badge mono">
      <span className="domain-badge__dot" aria-hidden="true" />
      {subdomain}
    </span>
  )
}
