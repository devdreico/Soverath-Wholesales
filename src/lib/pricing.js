import { formatPrice } from '../data/products.js'

/**
 * Tramo de mayoreo. Los límites `from`/`to` son inclusivos; `to` opcional deja
 * el tramo abierto por arriba. Si `qty` cae en un hueco entre tramos (o por
 * encima del último `to` cerrado) se usa el precio base.
 *
 * @typedef {Object} Tier
 * @property {number} from    Cantidad mínima del tramo (inclusiva).
 * @property {number} [to]    Cantidad máxima del tramo (inclusiva).
 * @property {number} [price] Precio unitario absoluto del tramo.
 * @property {number} [discountPct] Descuento % sobre el precio base.
 */

/**
 * Redondea a 2 decimales evitando ruido de coma flotante.
 * @param {number} value
 * @returns {number}
 */
const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100

/**
 * Precio unitario escalonado (mayoreo) según la cantidad.
 * Cantidades menores que 1 se tratan como 1 (clamp documentado).
 *
 * @param {number} basePrice Precio base por unidad (>= 0).
 * @param {Tier[]} [tiers] Tramos ordenados o no.
 * @param {number} qty Cantidad solicitada.
 * @returns {number}
 */
export function tierPrice(basePrice, tiers, qty) {
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    throw new Error(`tierPrice: basePrice inválido (${basePrice})`)
  }

  const units = Number.isFinite(qty) ? Math.max(1, Math.floor(qty)) : 1
  if (!Array.isArray(tiers) || tiers.length === 0) return round2(basePrice)

  const sorted = [...tiers].sort((a, b) => a.from - b.from)
  let candidate = null
  for (const tier of sorted) {
    if (tier.from <= units) candidate = tier
    else break
  }

  if (!candidate) return round2(basePrice)
  if (candidate.to !== undefined && candidate.to !== null && units > candidate.to) {
    return round2(basePrice)
  }
  if (candidate.price !== undefined && candidate.price !== null) {
    if (!Number.isFinite(candidate.price) || candidate.price < 0) {
      throw new Error(`tierPrice: precio de tramo inválido (${candidate.price})`)
    }
    return round2(candidate.price)
  }
  if (candidate.discountPct !== undefined && candidate.discountPct !== null) {
    if (!Number.isFinite(candidate.discountPct)) {
      throw new Error(`tierPrice: discountPct inválido (${candidate.discountPct})`)
    }
    return round2(Math.max(0, basePrice * (1 - candidate.discountPct / 100)))
  }
  return round2(basePrice)
}

/**
 * Precio neto por unidad que percibe el vendedor en un canal: aplica `factor`,
 * `commissionPct` (descuento %) y `feeFlat` (cargo fijo por unidad). El
 * resultado nunca baja de 0.
 *
 * @param {number} basePrice Precio de partida (>= 0).
 * @param {{factor?: number, commissionPct?: number, feeFlat?: number}} [channel]
 * @returns {number}
 */
export function channelPrice(basePrice, channel = {}) {
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    throw new Error(`channelPrice: basePrice inválido (${basePrice})`)
  }

  const factor = channel.factor ?? 1
  const commissionPct = channel.commissionPct ?? 0
  const feeFlat = channel.feeFlat ?? 0
  if (!Number.isFinite(factor) || !Number.isFinite(commissionPct) || !Number.isFinite(feeFlat)) {
    throw new Error('channelPrice: factor, commissionPct y feeFlat deben ser números')
  }

  const value = basePrice * factor * (1 - commissionPct / 100) - feeFlat
  return round2(Math.max(0, value))
}

/**
 * Cotización de una línea para un canal concreto.
 *
 * - `unitPrice`: precio unitario de mayoreo (lo que paga el comprador).
 * - `channelPrice`: neto por unidad tras comisión/fee del canal.
 * - `total`: total del pedido = unitPrice × qty.
 * - `marginPct`: (unitPrice − cost) / unitPrice · 100 (`null` sin cost).
 * - `marginAfterFeePct`: margen sobre el neto del canal (`null` sin cost).
 * - `blocked`: true si el canal está deshabilitado, si el margen neto cae por
 *   debajo de `minMarginPct` o si falta `costo` y hay mínimo de margen exigido.
 *
 * @param {Object} input
 * @param {number} input.basePrice
 * @param {number} input.qty Cantidad (entero >= 1; si no, lanza Error).
 * @param {Tier[]} [input.tiers]
 * @param {object} [input.channel]
 * @param {number} [input.minMarginPct] Margen mínimo exigido en %.
 * @param {number|null} [input.cost] Costo unitario.
 * @returns {{unitPrice: number, channelPrice: number, total: number,
 *   marginPct: number|null, marginAfterFeePct: number|null,
 *   blocked: boolean, reason: string|null}}
 */
export function quote({
  basePrice,
  qty,
  tiers,
  channel,
  minMarginPct = 0,
  cost = null,
}) {
  if (!Number.isFinite(qty) || qty < 1) {
    throw new Error(`quote: qty debe ser un número mayor o igual a 1 (recibido: ${qty})`)
  }
  if (minMarginPct == null || !Number.isFinite(minMarginPct) || minMarginPct < 0) {
    throw new Error(`quote: minMarginPct inválido (${minMarginPct})`)
  }

  const unitPrice = tierPrice(basePrice, tiers, qty)
  const net = channelPrice(unitPrice, channel ?? {})
  const hasCost = Number.isFinite(cost) && cost !== null && cost >= 0
  const marginPct = hasCost && unitPrice > 0 ? round2(((unitPrice - cost) / unitPrice) * 100) : null
  const marginAfterFeePct = hasCost && net > 0 ? round2(((net - cost) / net) * 100) : null

  let blocked = false
  let reason = null

  if (channel && channel.enabled === false) {
    blocked = true
    reason = `Canal ${channel.name ?? channel.id ?? ''} deshabilitado`.trim()
  } else if (marginAfterFeePct !== null && marginAfterFeePct < minMarginPct) {
    blocked = true
    reason = `Margen tras comisión (${marginAfterFeePct}%) por debajo del mínimo exigido (${minMarginPct}%)`
  } else if (marginAfterFeePct === null && minMarginPct > 0) {
    blocked = true
    reason = `Falta el costo: no se puede verificar el margen mínimo (${minMarginPct}%)`
  }

  return {
    unitPrice,
    channelPrice: net,
    total: round2(unitPrice * qty),
    marginPct,
    marginAfterFeePct,
    blocked,
    reason,
  }
}

/**
 * Formatea una cantidad monetaria reutilizando el formato del catálogo.
 * @param {number} value
 * @returns {string}
 */
export const formatMoney = (value) => formatPrice(round2(Number(value) || 0))
