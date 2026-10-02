import { channels as registry } from '../data/channels.js'
import { withAttribution } from './attribution.js'

/**
 * Acceso al registro de canales y construcción de CTAs de salida.
 *
 * @typedef {Object} ChannelCta
 * @property {string} href     URL de salida con atribución (utm_* + ch).
 * @property {string} label    Texto del botón (`ctaLabel`).
 * @property {string} channel  id del canal.
 * @property {boolean} external true si abre fuera del portal.
 */

const byOrder = (a, b) => a.order - b.order || a.id.localeCompare(b.id)

/**
 * Todos los canales del registro, ordenados por `order`.
 * @returns {import('../data/channels.js').Channel[]}
 */
export function getChannels() {
  return [...registry].sort(byOrder)
}

/**
 * Canales habilitados y con URL publicable, listos para renderizar CTAs.
 * @returns {import('../data/channels.js').Channel[]}
 */
export function getEnabledChannels() {
  return getChannels().filter((channel) => channel.enabled && Boolean(channel.url))
}

/**
 * Canal por id (habilitado o no).
 * @param {string} id
 * @returns {import('../data/channels.js').Channel|null}
 */
export function getChannel(id) {
  return registry.find((channel) => channel.id === id) ?? null
}

const whatsappText = ({ product, store }) => {
  const parts = ['Hola, quiero cotizar']
  if (product) parts.push(`${product.name} (${product.sku})`)
  else parts.push(store ? `productos de ${store.name}` : 'mayoreo Soverath')
  if (product && store) parts.push(`en ${store.name}`)
  return `${parts.join(' ')}.`
}

const withTextParam = (url, text) =>
  `${url}${url.includes('?') ? '&' : '?'}text=${encodeURIComponent(text)}`

/**
 * Construye la URL de salida de un canal con atribución de campaña.
 * Devuelve `null` si el canal no existe, está deshabilitado o no tiene URL.
 *
 * @param {import('../data/channels.js').Channel|null} channel
 * @param {{product?: {sku: string, name: string}, store?: {slug: string, name: string}}} [context]
 * @returns {ChannelCta|null}
 */
export function channelCta(channel, { product, store } = {}) {
  if (!channel || !channel.enabled || !channel.url) return null

  let href = channel.url
  if (channel.type === 'whatsapp') href = withTextParam(href, whatsappText({ product, store }))

  href = withAttribution(href, {
    channel: channel.id,
    source: channel.id,
    medium: channel.type,
    campaign: product ? `producto-${product.sku}` : `tienda-${store?.slug ?? 'home'}`,
    content: product?.sku ?? store?.slug ?? null,
  })

  return { href, label: channel.ctaLabel, channel: channel.id, external: true }
}

/**
 * CTAs de todos los canales habilitados para un producto y/o tienda.
 * @param {{product?: {sku: string, name: string}, store?: {slug: string, name: string}}} [context]
 * @returns {ChannelCta[]}
 */
export function channelCtas({ product, store } = {}) {
  return getEnabledChannels()
    .map((channel) => channelCta(channel, { product, store }))
    .filter(Boolean)
}
