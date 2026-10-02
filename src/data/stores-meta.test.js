import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const KEYS = ['slug', 'name', 'category', 'index', 'subdomain', 'url', 'accent']

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const field = (block, key) => block.match(new RegExp(`\\b${key}:\\s*'([^']*)'`))?.[1] ?? null

const parseStoresFromJsx = (text) => {
  const anchors = [...text.matchAll(/\bslug:\s*'([^']+)'/g)]
  return anchors.map((anchor, position) => {
    const next = anchors[position + 1]
    const block = text.slice(anchor.index, next ? next.index : text.length)
    const store = { slug: anchor[1] }
    for (const key of KEYS.slice(1)) store[key] = field(block, key)
    return store
  })
}

const source = parseStoresFromJsx(read('./stores.jsx'))
const meta = JSON.parse(read('./stores.meta.json'))

describe('stores.meta.json sincronizado con stores.jsx', () => {
  it('mantiene las 22 tiendas en el mismo orden', () => {
    expect(source).toHaveLength(22)
    expect(meta).toHaveLength(22)
    expect(meta.map((store) => store.slug)).toEqual(source.map((store) => store.slug))
    expect(new Set(meta.map((store) => store.slug)).size).toBe(22)
  })

  it('coincide campo a campo con stores.jsx', () => {
    meta.forEach((store, position) => {
      const expected = source[position]
      for (const key of KEYS) {
        expect(store[key], `${store.slug}.${key}`).toBe(expected[key])
      }
    })
  })

  it('solo expone los metadatos permitidos (sin iconos ni tags)', () => {
    for (const store of meta) {
      expect(Object.keys(store).sort()).toEqual([...KEYS].sort())
    }
  })
})
