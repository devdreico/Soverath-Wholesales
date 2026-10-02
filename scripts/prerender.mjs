import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, seoMetaFor } from '../dist-ssr/prerender-entry.js'
import { routesForPrerender } from './generate-sitemap.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * Sustituye en el template las etiquetas SEO genéricas por las de la ruta.
 * @param {string} html Template dist/index.html.
 * @param {{title: string, description: string, url: string}} meta Meta de la ruta.
 */
function injectHead(html, meta) {
  const replacements = [
    [/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`],
    [
      /<meta[^>]*name="description"[^>]*>/,
      `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    ],
    [/<link[^>]*rel="canonical"[^>]*>/, `<link rel="canonical" href="${meta.url}" />`],
    [
      /<meta[^>]*property="og:title"[^>]*>/,
      `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    ],
    [
      /<meta[^>]*property="og:description"[^>]*>/,
      `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    ],
    [/<meta[^>]*property="og:url"[^>]*>/, `<meta property="og:url" content="${meta.url}" />`],
    [
      /<meta[^>]*name="twitter:title"[^>]*>/,
      `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    ],
    [
      /<meta[^>]*name="twitter:description"[^>]*>/,
      `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    ],
  ]

  return replacements.reduce(
    (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
    html
  )
}

/**
 * Inserta el markup prerenderizado dentro de `#root`, conservando los data
 * attrs que `src/main.jsx` usa para decidir hidratación vs. render de cliente.
 * @param {string} html Template con meta ya inyectada.
 * @param {string} route Ruta prerenderizada.
 * @param {string} markup HTML de la ruta.
 */
function injectRoot(html, route, markup) {
  const start = html.indexOf('<div id="root"')
  const end = html.indexOf('<noscript', start)

  if (start === -1 || end === -1) {
    throw new Error('No se encontró <div id="root"> en dist/index.html')
  }

  const block = `<div id="root" data-prerendered="${escapeHtml(route)}">${markup}</div>\n    `
  return html.slice(0, start) + block + html.slice(end)
}

const template = await readFile(path.join(DIST, 'index.html'), 'utf8')
const routes = routesForPrerender()
let bytes = 0

for (const route of routes) {
  const markup = render(route)
  const html = injectRoot(injectHead(template, seoMetaFor(route)), route, markup)
  const target =
    route === '/'
      ? path.join(DIST, 'index.html')
      : path.join(DIST, route.slice(1), 'index.html')

  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, html)
  bytes += Buffer.byteLength(html)
}

console.log(
  `prerender · ${routes.length} rutas · ${bytes} bytes · ${(
    bytes /
    1024 /
    routes.length
  ).toFixed(1)} KB/parcial (sin /admin)`
)
