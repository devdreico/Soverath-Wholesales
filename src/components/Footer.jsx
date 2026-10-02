import { Link } from 'react-router-dom'
import { stores } from '../data/stores.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner glass">
        <div className="footer__top">
          <div className="footer__brand">
            <span className="footer__brand-mark mono">S/</span>
            <p className="footer__line">
              Soverath Wholesales — importador con inventario para nuestras bodegas
              de productos.
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
                  style={{ background: store.accent }}
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
