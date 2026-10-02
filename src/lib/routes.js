import { categories } from '../data/products.js'

/**
 * Slug URL-amigable para rutas y sitemap (sin acentos, minúsculas, guiones).
 * Contrato compartido por páginas, SEO y scripts de build.
 *
 * @param {string} value Texto de origen (p. ej. "Ferretería").
 * @returns {string} Slug (p. ej. "ferreteria").
 */
export function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * @param {string} category Nombre visible de la categoría.
 * @returns {string} Slug de la ruta /productos/<slug>.
 */
export const categorySlug = (category) => slugify(category)

/**
 * @param {string} category Nombre visible de la categoría.
 * @returns {string} Ruta canónica de la categoría.
 */
export const categoryPath = (category) => `/productos/${categorySlug(category)}`

/**
 * @param {string} slug Slug de la ruta.
 * @returns {string | null} Nombre de la categoría o null si no existe.
 */
export const categoryFromSlug = (slug) =>
  categories.find((category) => categorySlug(category) === slug) ?? null
