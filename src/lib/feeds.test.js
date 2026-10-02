import { describe, expect, it } from 'vitest'
import { products } from '../data/products.js'
import { parseCsv } from './csv.js'
import {
  buildFeeds,
  buildGoogleMerchant,
  buildMercadoLibre,
  buildMetaCatalog,
  buildWhatsappCatalog,
  FEED_HEADERS,
  missingStoreSlugs,
} from './feeds.js'

const stores = [
  { slug: 'botane', name: 'Botane' },
  { slug: 'esturel', name: 'Esturel' },
]
const sample = [
  {
    sku: 'BT-SUP-014',
    name: 'Omega 3 Wild — 60 cápsulas',
    category: 'Suplementos',
    storeSlug: 'botane',
    price: 18.9,
    stock: 240,
  },
  {
    sku: 'ES-HWD-118',
    name: 'SSD NVMe 1 TB Gen4',
    category: 'Hardware',
    storeSlug: 'esturel',
    price: 74.9,
    stock: 0,
  },
]

describe('missingStoreSlugs', () => {
  it('detecta storeSlug sin tienda registrada', () => {
    expect(missingStoreSlugs(sample, stores)).toEqual([])
    expect(missingStoreSlugs([{ storeSlug: 'fantasma' }], stores)).toEqual(['fantasma'])
    expect(missingStoreSlugs([{ storeSlug: 'x' }, { storeSlug: 'x' }], stores)).toEqual(['x'])
  })
})

describe('buildGoogleMerchant', () => {
  const [header, ...rows] = parseCsv(buildGoogleMerchant(sample, stores))

  it('incluye los campos obligatorios', () => {
    expect(header).toEqual(FEED_HEADERS['google-merchant.csv'])
    expect(header).toEqual([
      'id',
      'title',
      'description',
      'link',
      'image_link',
      'price',
      'availability',
      'brand',
      'gtin',
      'mpn',
    ])
  })

  it('usa SKU como id/gtin/mpn, marca Soverath y availability por stock', () => {
    expect(rows[0]).toEqual([
      'BT-SUP-014',
      'Omega 3 Wild — 60 cápsulas',
      expect.stringContaining('Botane'),
      'https://soverath.presentto.online/tienda/botane',
      'https://soverath.presentto.online/soverath-wholesales-logo.png',
      '18.90 USD',
      'in_stock',
      'Soverath',
      'BT-SUP-014',
      'BT-SUP-014',
    ])
    expect(rows[1][6]).toBe('out_of_stock')
  })
})

describe('buildMetaCatalog / buildWhatsappCatalog', () => {
  it('meta-catalog.csv respeta sus columnas y availability con espacio', () => {
    const [header, row] = parseCsv(buildMetaCatalog(sample, stores))
    expect(header).toEqual(FEED_HEADERS['meta-catalog.csv'])
    expect(header).toEqual([
      'id',
      'title',
      'description',
      'link',
      'brand',
      'availability',
      'price',
    ])
    expect(row[5]).toBe('in stock')
    expect(row[6]).toBe('18.90 USD')
  })

  it('whatsapp-catalog.csv incluye image_link', () => {
    const [header, row] = parseCsv(buildWhatsappCatalog(sample, stores))
    expect(header).toEqual(FEED_HEADERS['whatsapp-catalog.csv'])
    expect(header).toEqual([
      'id',
      'title',
      'description',
      'link',
      'availability',
      'price',
      'brand',
      'image_link',
    ])
    expect(row[7]).toMatch(/^https:\/\//)
  })
})

describe('buildMercadoLibre', () => {
  const items = JSON.parse(buildMercadoLibre(sample, stores))

  it('genera un array con los campos del ítem', () => {
    expect(Array.isArray(items)).toBe(true)
    expect(items[0]).toEqual({
      id: 'BT-SUP-014',
      title: 'Omega 3 Wild — 60 cápsulas',
      description: expect.stringContaining('Botane'),
      price: 18.9,
      currency_id: 'USD',
      condition: 'new',
      available_quantity: 240,
      category_id: 'suplementos',
      permalink: 'https://soverath.presentto.online/tienda/botane',
      seller_custom_field: 'botane/BT-SUP-014',
    })
    expect(items[1].available_quantity).toBe(0)
  })
})

describe('buildFeeds con el catálogo real', () => {
  it('genera los 4 ficheros con cabeceras válidas y sin storeSlug huérfano', () => {
    const realStores = [...new Set(products.map((product) => product.storeSlug))].map((slug) => ({
      slug,
      name: slug,
    }))
    const feeds = buildFeeds(products, realStores)

    expect(Object.keys(feeds)).toEqual([
      'google-merchant.csv',
      'meta-catalog.csv',
      'whatsapp-catalog.csv',
      'mercadolibre.json',
    ])
    expect(missingStoreSlugs(products, realStores)).toEqual([])

    for (const file of ['google-merchant.csv', 'meta-catalog.csv', 'whatsapp-catalog.csv']) {
      const [header, ...rows] = parseCsv(feeds[file])
      expect(header).toEqual(FEED_HEADERS[file])
      expect(rows).toHaveLength(products.length)
    }

    const items = JSON.parse(feeds['mercadolibre.json'])
    expect(items).toHaveLength(products.length)
    expect(items.every((item) => item.currency_id === 'USD')).toBe(true)
  })
})
