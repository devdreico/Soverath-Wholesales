import { Link } from 'react-router-dom'
import { stores } from '../data/stores.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner glass">
        <div className="footer__top">
          <div className="footer__brand">
            <img
              className="footer__holding-logo"
              src="/soverath-logo.jpg"
              alt="Logotipo de Soverath Holding"
              width="48"
              height="48"
            />
            <p className="footer__line">
              Soverath Holding, casa matriz de Soverath Wholesales, importador con
              inventario para nuestras bodegas de productos.
            </p>
          </div>

          <nav className="footer__nav" aria-label="Navegación del pie">
            <Link className="footer__link mono" to="/">
              Índice
            </Link>
            <Link className="footer__link mono" to="/productos">
              Productos
            </Link>
          </nav>
        </div>

        <ul className="footer__stores">
          {stores.map((store) => (
            <li key={store.slug}>
              <Link className="footer__store" to={`/tienda/${store.slug}`}>
                <span
                  className="footer__store-dot"
                  aria-hidden="true"
                />
                {store.name}
              </Link>
            </li>
          ))}
        </ul>

        <p className="footer__copy mono">
          © {new Date().getFullYear()} Soverath Wholesales · soverath.presentto.online
        </p>
      </div>
    </footer>
  )
}
