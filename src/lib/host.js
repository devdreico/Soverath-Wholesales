/**
 * Lógica de enrutado por hostname: si la app se sirve bajo
 * `<nodo>.presentto.online` con la raíz exacta, el host decide a qué
 * tienda se abre.
 *
 * @param {{slug: string, subdomain: string}[]} nodes Directorio de nodos.
 * @param {string} hostname Host de la petición (p. ej. "botane.presentto.online").
 * @param {string} pathname Ruta solicitada (p. ej. "/").
 * @returns {string | null} Slug del nodo coincidente o null si no aplica.
 */
export function nodeSlugFromHost(nodes, hostname, pathname) {
  if (pathname !== '/') return null

  const host = String(hostname ?? '').toLowerCase()
  const node = nodes.find((entry) => entry.subdomain.toLowerCase() === host)

  return node ? node.slug : null
}
