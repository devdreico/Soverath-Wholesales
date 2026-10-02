import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { categories } from '../src/data/products.js'
import { categorySlug } from '../src/lib/routes.js'

const BASE = 'https://soverath.presentto.online'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const stores = JSON.parse(
  await readFile(path.join(ROOT, 'src/data/stores.meta.json'), 'utf8')
)

/**
 * Fuente única de rutas públicas (A7): home, catálogo, 21 categorías y 22 tiendas.
 * /admin queda fuera a propósito (no indexable).
 *
 * @returns {string[]} Rutas a prerenderizar y publicar en el sitemap.
 */
export function routesForPrerender() {
  return [
    '/',
    '/productos',
    ...categories.map((category) => `/productos/${categorySlug(category)}`),
    ...stores.map((store) => `/tienda/${store.slug}`),
  ]
}

const priorityFor = (route) => {
  if (route === '/') return '1.0'
  if (route === '/productos') return '0.9'
  if (route.startsWith('/productos/')) return '0.7'
  return '0.8'
}

const changefreqFor = (route) =>
  route === '/' || route.startsWith('/tienda/') ? 'weekly' : 'daily'

/**
 * @param {string[]} routes Rutas incluidas en el sitemap.
 * @returns {string} Documento sitemap.xml.
 */
export function sitemapXml(routes = routesForPrerender()) {
  const lastmod = new Date().toISOString().slice(0, 10)
  const entries = routes.map(
    (route) => `  <url>
    <loc>${BASE}${route === '/' ? '/' : route}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreqFor(route)}</changefreq>
    <priority>${priorityFor(route)}</priority>
  </url>`
  )

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${entries.join('\n')}
</urlset>
`
}

async function main() {
  const routes = routesForPrerender()
  const xml = sitemapXml(routes)
  const targets = [path.join(ROOT, 'public', 'sitemap.xml')]
  const distSitemap = path.join(ROOT, 'dist', 'sitemap.xml')

  await writeFile(targets[0], xml)
  try {
    await writeFile(distSitemap, xml)
    targets.push(distSitemap)
  } catch {
    // dist aún no existe (ejecución suelta sin build)
  }

  console.log(
    `sitemap.xml · ${routes.length} rutas (${categories.length} categorías, ${stores.length} tiendas) → ${targets
      .map((file) => path.relative(ROOT, file))
      .join(', ')}`
  )
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  await main()
}
