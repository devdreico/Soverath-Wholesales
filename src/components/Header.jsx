export default function Header({ kicker, words, lead, badges }) {
  return (
    <header className="header">
      <div className="header__logo-wrap glass">
        <img
          className="header__logo"
          src="/soverath-wholesales-logo.png"
          alt="Logo de Soverath Wholesales"
          width="76"
          height="76"
        />
      </div>

      <p className="header__eyebrow mono">{kicker}</p>

      <h1 className="header__title">
        {words.map((word, i) => (
          <span className="header__word" key={`${word}-${i}`} style={{ '--wi': i }}>
            <span className="header__word-inner">{word}</span>
          </span>
        ))}
      </h1>

      <p className="header__subtitle">{lead}</p>

      <div className="header__badges">
        {badges.map((badge) => (
          <span className="badge glass mono" key={badge}>
            {badge}
          </span>
        ))}
      </div>
    </header>
  )
}
