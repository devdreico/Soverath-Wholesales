import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import StoreCard from '../components/StoreCard.jsx'
import ProductCard from '../components/ProductCard.jsx'
import Marquee from '../components/Marquee.jsx'
import StatCounter from '../components/StatCounter.jsx'
import { useReveal } from '../hooks/useReveal.js'
import { stores } from '../data/stores.jsx'
import { products, CATALOG_TOTAL, categories } from '../data/products.js'
import { setSeo } from '../lib/seo.js'

const REGRIMES = [
  'mayoreo digital',
  'bodega propia',
  'salud natural',
  'mascotas',
  'belleza',
  'tecnología',
  'cocina',
  'ferretería',
  'moda',
  'alimentos',
  'logística',
  '22 nodos',
]

export default function Home() {
  const gridRef = useRef(null)
  const grid = useReveal(gridRef, 0)

  useEffect(() => {
    setSeo({
      title: 'Soverath Wholesales | Importador de productos y bodegas',
      description:
        'Portal del ecosistema Soverath Wholesales: 22 tiendas afiliadas con identidad propia y catálogo de más de 1000 productos con inventario en bodega.',
      path: '/',
    })
  }, [])

  const featured = products.slice(0, 6)

  return (
    <>
      <Header
        kicker="Gateway oficial · nodo central"
        words={['Soverath', 'Wholesales']}
        lead={
          <>
            Ecosistema digital de mayoreo: <strong>22 tiendas</strong> con identidad
            propia y un catálogo que escala a <strong>+1000 referencias reales</strong>{' '}
            con inventario en bodega.
          </>
        }
        badges={['22 tiendas', '+1000 productos', 'Compra segura']}
      />

      <section className="stats glass" aria-label="Cifras del ecosistema">
        <StatCounter value={stores.length} label="tiendas conectadas" />
        <span className="stats__divider" aria-hidden="true" />
        <StatCounter value={CATALOG_TOTAL} suffix="+" label="referencias en catálogo" />
        <span className="stats__divider" aria-hidden="true" />
        <StatCounter value={categories.length} label="categorías cruzadas" />
      </section>

      <Marquee items={REGRIMES} />

      <section className="stores" aria-labelledby="stores-title">
        <div id="stores-title">
          <SectionHeading
            eyebrow="Directorio de nodos"
            title="Veintidós tiendas, un mismo gateway"
            meta="01 — 22"
            description="Cada nodo opera con identidad y subdominio propios; todos comparten inventario, logística y estándares de calidad del ecosistema."
          />
        </div>

        <div className="stores__grid" ref={gridRef}>
          {stores.map((store, index) => (
            <div
              className={`stores__cell reveal ${grid.className}`}
              key={store.slug}
              style={{
                ...grid.style,
                '--reveal-delay': `${(index % 4) * 70}ms`,
              }}
            >
              <StoreCard store={store} index={index} />
            </div>
          ))}
        </div>
      </section>

      <section className="picks" aria-labelledby="picks-title">
        <div id="picks-title">
          <SectionHeading
            eyebrow="Muestra de catálogo"
            title="Lo que sale de bodega esta semana"
            meta={`${String(products.length).padStart(2, '0')} de ${CATALOG_TOTAL}+`}
            accent="var(--accent-cyan)"
            description="Referencias reales distribuidas entre los nodos del ecosistema. El inventario completo se publica en la sala de productos."
          />
        </div>

        <div className="products products--picks">
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} order={i} />
          ))}
        </div>

        <Link className="btn btn--primary picks__cta" to="/productos">
          Entrar a la sala de productos
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </>
  )
}
