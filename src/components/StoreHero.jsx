import { useRef } from 'react'
import { Link } from 'react-router-dom'
import SubdomainBadge from './SubdomainBadge.jsx'
import ChannelActions from './ChannelActions.jsx'
import { useReveal } from '../hooks/useReveal.js'

export default function StoreHero({ store, productCount }) {
  const sectionRef = useRef(null)
  const hero = useReveal(sectionRef, 0)

  return (
    <section
      className="store-hero"
      ref={sectionRef}
    >
      <span className="store-hero__watermark" aria-hidden="true">
        {store.index}
      </span>
      <span className="store-hero__beam" aria-hidden="true" />

      <div className={`store-hero__content reveal ${hero.className}`} style={hero.style}>
        <Link className="store-hero__back mono" to="/">
          ← Índice general
        </Link>

        <p className="store-hero__eyebrow mono">
          Nodo {store.index} / 22 · {store.category}
        </p>

        <h1 className="store-hero__title">
          {store.name}
          <span className="store-hero__title-line" aria-hidden="true" />
        </h1>

        <p className="store-hero__lead">{store.title}</p>
        <p className="store-hero__description">{store.description}</p>

        <div className="store-hero__meta">
          <SubdomainBadge subdomain={store.subdomain} />
          <span className="store-hero__stock mono">
            {String(productCount).padStart(2, '0')} referencias en catálogo
          </span>
        </div>

        <div className="store-hero__actions">
          <a
            className="btn btn--primary"
            href={store.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir tienda externa
            <span aria-hidden="true">↗</span>
          </a>
          <a
            className="btn btn--ghost mono"
            href={`https://${store.subdomain}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {store.subdomain}
          </a>
        </div>

        <ChannelActions store={store} label="Cotizar por canal" />

        <ul className="store-hero__tags">
          {store.tags.map((tag) => (
            <li className="store-hero__tag mono" key={tag}>
              #{tag}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
