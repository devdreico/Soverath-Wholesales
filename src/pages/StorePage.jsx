import { useEffect } from 'react'
import { Navigate, Link, useParams } from 'react-router-dom'
import StoreHero from '../components/StoreHero.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import ProductGrid from '../components/ProductGrid.jsx'
import { getStore, stores } from '../data/stores.jsx'
import { products, CATALOG_TOTAL } from '../data/products.js'
import { setSeo } from '../lib/seo.js'

export default function StorePage() {
  const { slug } = useParams()
  const store = getStore(slug)

  useEffect(() => {
    if (!store) return
    setSeo({
      title: `${store.name} (${store.category}) | Soverath Wholesales`,
      description: `${store.description} Nodo ${store.index} del ecosistema Soverath Wholesales — accede a su apartado en ${store.subdomain}.`,
      path: `/tienda/${store.slug}`,
    })
  }, [store])

  if (!store) return <Navigate to="/404" replace />

  const items = products.filter((p) => p.storeSlug === store.slug)
  const siblings = stores.filter((s) => s.slug !== store.slug).slice(0, 6)

  return (
    <>
      <StoreHero store={store} productCount={items.length} />

      <section className="store-catalog" aria-labelledby="store-catalog-title">
        <div id="store-catalog-title">
          <SectionHeading
            eyebrow={`Nodo ${store.index} · catálogo`}
            title={`Existencias de ${store.name}`}
            meta={`${items.length} refs`}
            accent={store.accent}
            description={`Muestra publicada de ${store.name}. El catálogo completo del nodo supera las ${CATALOG_TOTAL} referencias del ecosistema.`}
          />
        </div>

        <ProductGrid items={items} emptyLabel={`Sin referencias publicadas en ${store.name}`} />
      </section>

      <section className="store-siblings" aria-label="Otros nodos">
        <p className="store-siblings__label mono">Sigue explorando el ecosistema</p>
        <ul className="store-siblings__list">
          {siblings.map((s) => (
            <li key={s.slug}>
              <Link
                className="store-siblings__item mono"
                to={`/tienda/${s.slug}`}
              >
                <span className="store-siblings__dot" aria-hidden="true" />
                {s.index} {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
