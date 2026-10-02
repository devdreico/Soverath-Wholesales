export default function Marquee({ items, speed = 46 }) {
  const row = (
    <ul className="marquee__row" aria-hidden="true">
      {items.map((item) => (
        <li className="marquee__item mono" key={item}>
          {item}
          <span className="marquee__sep">✳</span>
        </li>
      ))}
    </ul>
  )

  return (
    <div
      className="marquee"
      style={{ '--marquee-duration': `${speed}s` }}
      role="presentation"
    >
      <div className="marquee__track">
        {row}
        {row}
      </div>
      <span className="sr-only">{items.join(', ')}</span>
    </div>
  )
}
