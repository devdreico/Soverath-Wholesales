export default function Header() {
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

      <p className="header__eyebrow">Gateway oficial</p>
      <h1 className="header__title">
        Soverath <span>Wholesales</span>
      </h1>
      <p className="header__subtitle">
        Importador de productos con inventario para diferentes bodegas de
        productos.
      </p>
      <span className="sr-only">
        Acceso a las tiendas afiliadas Botane, Viking Dogs, Blooxury, Esturel y
        Knifopics.
      </span>

      <div className="header__badges">
        <span className="badge glass">5 tiendas afiliadas</span>
        <span className="badge glass">Inventario multi-bodega</span>
        <span className="badge glass">Compra segura</span>
      </div>
    </header>
  )
}
