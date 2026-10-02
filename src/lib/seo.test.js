import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setSeo } from './seo.js'

const FIXTURE_MARK = 'seo-fixture'

const seedTags = () => {
  const markup = `
    <meta name="description" content="" data-seo-fixture="${FIXTURE_MARK}" />
    <link rel="canonical" href="" data-seo-fixture="${FIXTURE_MARK}" />
    <meta property="og:title" content="" data-seo-fixture="${FIXTURE_MARK}" />
    <meta property="og:description" content="" data-seo-fixture="${FIXTURE_MARK}" />
    <meta property="og:url" content="" data-seo-fixture="${FIXTURE_MARK}" />
    <meta name="twitter:title" content="" data-seo-fixture="${FIXTURE_MARK}" />
    <meta name="twitter:description" content="" data-seo-fixture="${FIXTURE_MARK}" />
  `
  document.head.insertAdjacentHTML('beforeend', markup)
}

const removeTags = () => {
  document.head
    .querySelectorAll(`[data-seo-fixture="${FIXTURE_MARK}"]`)
    .forEach((tag) => tag.remove())
}

const meta = (selector) => document.head.querySelector(selector)?.getAttribute('content')

describe('setSeo', () => {
  beforeEach(() => {
    seedTags()
  })

  afterEach(() => {
    removeTags()
  })

  it('actualiza el title del documento', () => {
    setSeo({
      title: 'Catálogo de mayoreo | Soverath Wholesales',
      description: 'Descripción de prueba',
      path: '/productos',
    })

    expect(document.title).toBe('Catálogo de mayoreo | Soverath Wholesales')
  })

  it('actualiza la meta description', () => {
    setSeo({
      title: 'Título',
      description: 'Catálogo de mayoreo con stock en bodega.',
      path: '/productos',
    })

    expect(meta('meta[name="description"]')).toBe(
      'Catálogo de mayoreo con stock en bodega.'
    )
  })

  it('actualiza el canonical con la ruta indicada', () => {
    setSeo({ title: 'Título', description: 'Descripción', path: '/tienda/ferreza' })

    expect(document.head.querySelector('link[rel="canonical"]').getAttribute('href')).toBe(
      'https://soverath.presentto.online/tienda/ferreza'
    )
  })

  it('apunta el canonical y og:url a la raíz cuando la ruta es /', () => {
    setSeo({ title: 'Título', description: 'Descripción', path: '/' })

    expect(document.head.querySelector('link[rel="canonical"]').getAttribute('href')).toBe(
      'https://soverath.presentto.online/'
    )
    expect(meta('meta[property="og:url"]')).toBe('https://soverath.presentto.online/')
  })

  it('actualiza og:title y og:description junto al title', () => {
    setSeo({
      title: 'Ferreza (Ferretería) | Soverath Wholesales',
      description: 'Herramientas y fijaciones.',
      path: '/tienda/ferreza',
    })

    expect(meta('meta[property="og:title"]')).toBe(
      'Ferreza (Ferretería) | Soverath Wholesales'
    )
    expect(meta('meta[property="og:description"]')).toBe('Herramientas y fijaciones.')
    expect(meta('meta[property="og:url"]')).toBe(
      'https://soverath.presentto.online/tienda/ferreza'
    )
  })
})
