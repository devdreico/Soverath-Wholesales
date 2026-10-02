/**
 * Atribución de enlaces de salida: preserva la query existente y añade los
 * parámetros de campaña (UTM) más el identificador corto `ch`.
 *
 * @typedef {Object} Attribution
 * @property {string} [channel]  Identificador del canal (-> ch).
 * @property {string} [source]   -> utm_source.
 * @property {string} [medium]   -> utm_medium.
 * @property {string} [campaign] -> utm_campaign.
 * @property {string} [content]  -> utm_content.
 */

const PARAMS = [
  ['ch', 'channel'],
  ['utm_source', 'source'],
  ['utm_medium', 'medium'],
  ['utm_campaign', 'campaign'],
  ['utm_content', 'content'],
]

/**
 * Añade atribución a una URL conservando query y fragmento existentes.
 * @param {string} url
 * @param {Attribution} [attrs]
 * @returns {string}
 */
export function withAttribution(url, { channel, source, medium, campaign, content } = {}) {
  if (typeof url !== 'string' || url === '') {
    throw new Error('withAttribution: se requiere una URL no vacía')
  }

  const hashIndex = url.indexOf('#')
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : ''
  const clean = hashIndex >= 0 ? url.slice(0, hashIndex) : url
  const queryIndex = clean.indexOf('?')
  const path = queryIndex >= 0 ? clean.slice(0, queryIndex) : clean
  const params = new URLSearchParams(queryIndex >= 0 ? clean.slice(queryIndex + 1) : '')

  const values = { channel, source, medium, campaign, content }
  for (const [param, key] of PARAMS) {
    const value = values[key]
    if (value === undefined || value === null || value === '') params.delete(param)
    else params.set(param, String(value))
  }

  const query = params.toString()
  return `${path}${query ? `?${query}` : ''}${hash}`
}

/**
 * Lee la atribución presente en un `location.search` (con o sin "?").
 * @param {string} search
 * @returns {{channel: string|null, source: string|null, medium: string|null,
 *   campaign: string|null, content: string|null}}
 */
export function parseAttribution(search = '') {
  const text = typeof search === 'string' && search.startsWith('?') ? search.slice(1) : search
  const params = new URLSearchParams(text ?? '')

  const read = (param) => params.get(param)
  return {
    channel: read('ch'),
    source: read('utm_source'),
    medium: read('utm_medium'),
    campaign: read('utm_campaign'),
    content: read('utm_content'),
  }
}
