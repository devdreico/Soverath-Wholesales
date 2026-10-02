import { toCsv } from './csv.js'

export const DEFAULT_BASE_URL = 'https://soverath.presentto.online'
export const BRAND = 'Soverath'
export const CURRENCY = 'USD'
export const FEED_FILES = [
  'google-merchant.csv',
  'meta-catalog.csv',
  'whatsapp-catalog.csv',
  'mercadolibre.json',
]

export const FEED_HEADERS = {
  'google-merchant.csv': [
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
  ],
  'meta-catalog.csv': ['id', 'title', 'description', 'link', 'brand', 'availability', 'price'],
  'whatsapp-catalog.csv': [
    'id',
    'title',
    'description',
    'link',
    'availability',
    'price',
    'brand',
    'image_link',
  ],
}

const landing = (baseUrl, product) => `${baseUrl}/tienda/${product.storeSlug}`
const imageUrl = (baseUrl) => `${baseUrl}/soverath-wholesales-logo.png`
const money = (price) => `${Number(price).toFixed(2)} ${CURRENCY}`
const googleAvailability = (product) => (product.stock > 0 ? 'in_stock' : 'out_of_stock')
const metaAvailability = (product) => (product.stock > 0 ? 'in stock' : 'out of stock')

const categorySlug = (category) =>
  category
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const describeProduct = (product, store) =>
  `${product.name}. ${product.category} · ${store?.name ?? BRAND}. Mayoreo con ${product.stock} unidades en bodega.`

const storeOf = (stores, product) => stores.find((store) => store.slug === product.storeSlug)

/**
 * Devuelve los `storeSlug` de los productos sin tienda en el registro.
 * @param {{storeSlug: string}[]} products
 * @param {{slug: string}[]} stores
 * @returns {string[]}
 */
export function missingStoreSlugs(products, stores) {
  const known = new Set(stores.map((store) => store.slug))
  return [...new Set(products.map((product) => product.storeSlug).filter((slug) => !known.has(slug)))]
}

/**
 * Feed de Google Merchant Center (CSV).
 * @param {{sku: string, name: string, category: string, storeSlug: string, price: number, stock: number}[]} products
 * @param {{slug: string, name: string}[]} stores
 * @param {{baseUrl?: string}} [options]
 * @returns {string}
 */
export function buildGoogleMerchant(products, stores, { baseUrl = DEFAULT_BASE_URL } = {}) {
  const rows = products.map((product) => {
    const store = storeOf(stores, product)
    return [
      product.sku,
      product.name,
      describeProduct(product, store),
      landing(baseUrl, product),
      imageUrl(baseUrl),
      money(product.price),
      googleAvailability(product),
      BRAND,
      product.sku,
      product.sku,
    ]
  })
  return toCsv([FEED_HEADERS['google-merchant.csv'], ...rows])
}

/**
 * Feed de catálogo Meta (Facebook/Instagram Shops).
 * @param {Parameters<typeof buildGoogleMerchant>[0]} products
 * @param {Parameters<typeof buildGoogleMerchant>[1]} stores
 * @param {{baseUrl?: string}} [options]
 * @returns {string}
 */
export function buildMetaCatalog(products, stores, { baseUrl = DEFAULT_BASE_URL } = {}) {
  const rows = products.map((product) => {
    const store = storeOf(stores, product)
    return [
      product.sku,
      product.name,
      describeProduct(product, store),
      landing(baseUrl, product),
      BRAND,
      metaAvailability(product),
      money(product.price),
    ]
  })
  return toCsv([FEED_HEADERS['meta-catalog.csv'], ...rows])
}

/**
 * Feed de catálogo de WhatsApp Business (columnas Meta).
 * @param {Parameters<typeof buildGoogleMerchant>[0]} products
 * @param {Parameters<typeof buildGoogleMerchant>[1]} stores
 * @param {{baseUrl?: string}} [options]
 * @returns {string}
 */
export function buildWhatsappCatalog(products, stores, { baseUrl = DEFAULT_BASE_URL } = {}) {
  const rows = products.map((product) => {
    const store = storeOf(stores, product)
    return [
      product.sku,
      product.name,
      describeProduct(product, store),
      landing(baseUrl, product),
      metaAvailability(product),
      money(product.price),
      BRAND,
      imageUrl(baseUrl),
    ]
  })
  return toCsv([FEED_HEADERS['whatsapp-catalog.csv'], ...rows])
}

/**
 * Ítems de MercadoLibre (JSON).
 * @param {Parameters<typeof buildGoogleMerchant>[0]} products
 * @param {Parameters<typeof buildGoogleMerchant>[1]} stores
 * @param {{baseUrl?: string}} [options]
 * @returns {string}
 */
export function buildMercadoLibre(products, stores, { baseUrl = DEFAULT_BASE_URL } = {}) {
  const items = products.map((product) => ({
    id: product.sku,
    title: product.name,
    description: describeProduct(product, storeOf(stores, product)),
    price: Number(product.price.toFixed(2)),
    currency_id: CURRENCY,
    condition: 'new',
    available_quantity: product.stock,
    category_id: categorySlug(product.category),
    permalink: landing(baseUrl, product),
    seller_custom_field: `${product.storeSlug}/${product.sku}`,
  }))
  return `${JSON.stringify(items, null, 2)}\n`
}

/**
 * Genera los cuatro feeds del catálogo.
 * @param {Parameters<typeof buildGoogleMerchant>[0]} products
 * @param {Parameters<typeof buildGoogleMerchant>[1]} stores
 * @param {{baseUrl?: string}} [options]
 * @returns {Record<string, string>} Contenido por nombre de fichero.
 */
export function buildFeeds(products, stores, options = {}) {
  return {
    'google-merchant.csv': buildGoogleMerchant(products, stores, options),
    'meta-catalog.csv': buildMetaCatalog(products, stores, options),
    'whatsapp-catalog.csv': buildWhatsappCatalog(products, stores, options),
    'mercadolibre.json': buildMercadoLibre(products, stores, options),
  }
}
