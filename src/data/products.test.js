import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { products, formatPrice, unitLabel, categories } from './products.js'

const storesSource = readFileSync(resolve(process.cwd(), 'src/data/stores.jsx'), 'utf8')

const storeSlugs = [...storesSource.matchAll(/slug:\s*'([^']+)'/g)].map((match) => match[1])

describe('catálogo de productos', () => {
  it('publica 30 referencias en la muestra', () => {
    expect(products).toHaveLength(30)
  })

  it('mantiene ids únicos e incrementales', () => {
    const ids = products.map((product) => product.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(Math.min(...ids)).toBe(1)
    expect(Math.max(...ids)).toBe(30)
  })

  it('mantiene SKUs únicos', () => {
    const skus = products.map((product) => product.sku)
    expect(new Set(skus).size).toBe(skus.length)
    skus.forEach((sku) => expect(sku).toMatch(/^[A-Z]{2}-[A-Z0-9]+-\d{3}$/))
  })

  it('todas las tiendas del directorio existen en src/data/stores.jsx', () => {
    expect(storeSlugs.length).toBeGreaterThanOrEqual(22)
    products.forEach((product) => {
      expect(storeSlugs).toContain(product.storeSlug)
    })
  })

  it('cada producto tiene categoría, precio, stock y etiquetas válidos', () => {
    products.forEach((product) => {
      expect(product.name.length).toBeGreaterThan(0)
      expect(categories).toContain(product.category)
      expect(product.price).toBeGreaterThan(0)
      expect(product.stock).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(product.tags)).toBe(true)
      expect(product.tags.length).toBeGreaterThan(0)
    })
  })
})

describe('formatPrice', () => {
  it('formatea enteros sin decimales', () => {
    expect(formatPrice(118)).toBe('$118')
  })

  it('formatea los decimales con dos cifras', () => {
    expect(formatPrice(18.9)).toBe('$18,90')
    expect(formatPrice(4.9)).toBe('$4,90')
  })

  it('aplica el prefijo de moneda a todo el catálogo', () => {
    products.forEach((product) => {
      expect(formatPrice(product.price)).toMatch(/^\$\d/)
    })
  })
})

describe('unitLabel', () => {
  it('traduce las unidades de venta conocidas', () => {
    expect(unitLabel('unidad')).toBe('un.')
    expect(unitLabel('caja')).toBe('caja')
    expect(unitLabel('paquete')).toBe('pza.')
    expect(unitLabel('pack')).toBe('pack')
    expect(unitLabel('kg')).toBe('kg')
    expect(unitLabel('litro')).toBe('L')
    expect(unitLabel('saco')).toBe('saco')
  })

  it('devuelve la unidad original si no está en el mapa', () => {
    expect(unitLabel('tarro')).toBe('tarro')
  })
})
