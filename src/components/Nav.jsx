import { NavLink, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { stores } from '../data/stores.jsx'

const links = [
  { to: '/', label: 'Índice', end: true },
  { to: '/productos', label: 'Productos' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [storesOpen, setStoresOpen] = useState(false)

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      setStoresOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <nav className="nav" aria-label="Navegación principal">
      <Link to="/" className="nav__brand" onClick={() => setOpen(false)}>
        <span className="nav__brand-mark">S</span>
        <span className="nav__brand-text">Soverath</span>
      </Link>

      <button
        type="button"
        className="nav__toggle"
        aria-expanded={open}
        aria-controls="nav-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav__toggle-label">{open ? 'Cerrar' : 'Menú'}</span>
        <span className="nav__toggle-bars" aria-hidden="true">
          <i />
          <i />
        </span>
      </button>

      <div className={`nav__menu${open ? ' is-open' : ''}`} id="nav-menu">
        <ul className="nav__list">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `nav__link${isActive ? ' is-active' : ''}`
                }
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          <li className={`nav__dropdown${storesOpen ? ' is-open' : ''}`}>
            <button
              type="button"
              className="nav__link"
              aria-expanded={storesOpen}
              aria-controls="nav-stores"
              onClick={() => setStoresOpen((v) => !v)}
            >
              Tiendas
            </button>
            <ul className="nav__dropdown-list" id="nav-stores">
              {stores.map((store) => (
                <li key={store.slug}>
                  <Link
                    to={`/tienda/${store.slug}`}
                    className="nav__dropdown-link"
                    onClick={() => {
                      setOpen(false)
                      setStoresOpen(false)
                    }}
                  >
                    <span
                      className="nav__dropdown-dot"
                      aria-hidden="true"
                    />
                    {store.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        </ul>

        <span className="nav__count mono" aria-hidden="true">
          22 nodos activos
        </span>
      </div>
    </nav>
  )
}
