export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner glass">
        <p className="footer__line">
          Soverath Wholesales — importador con inventario para nuestras bodegas
          de productos.
        </p>
        <p className="footer__line footer__line--muted">
          Por ahora solo estas 5 tiendas afiliadas públicamente.
        </p>
        <p className="footer__copy">
          © {new Date().getFullYear()} Soverath Wholesales · soverath.presentto.online
        </p>
      </div>
    </footer>
  )
}
