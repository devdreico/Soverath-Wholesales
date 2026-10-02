export default function SectionHeading({
  as = 'h2',
  eyebrow,
  title,
  description,
  meta,
  accent = 'var(--text)',
}) {
  const Title = as === 'h1' ? 'h1' : 'h2'

  return (
    <header className="section-heading" style={{ '--section-accent': accent }}>
      <p className="section-heading__eyebrow mono">
        <span className="section-heading__pulse" aria-hidden="true" />
        {eyebrow}
      </p>

      <div className="section-heading__row">
        <Title className="section-heading__title">{title}</Title>
        {meta ? <span className="section-heading__meta mono">{meta}</span> : null}
      </div>

      <span className="section-heading__rule" aria-hidden="true" />

      {description ? (
        <p className="section-heading__description">{description}</p>
      ) : null}
    </header>
  )
}
