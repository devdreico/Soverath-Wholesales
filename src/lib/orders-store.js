import { channels } from '../data/channels.js'

/**
 * Repositorio de pedidos del hub `/admin`.
 *
 * Adaptador inyectable: por defecto escribe en `localStorage`
 * (clave `soverath.orders.v1`); para pasar a Supabase/API basta con
 * `setOrdersAdapter({ read, write })` sin tocar la UI.
 *
 * `ORDER_CHANNELS` y `ORDER_CHANNEL_LABELS` se derivan del registro único
 * `src/data/channels.js`, para que un pedido use siempre el mismo id de
 * canal que la atribución (`ch=<id>`).
 *
 * Todas las operaciones de mutación devuelven `{ ok, order?, error? }`
 * con mensajes en español: nunca lanzan excepciones no controladas.
 *
 * @typedef {Object} Order
 * @property {string} id         Identificador tipo "ORD-2026-0001".
 * @property {string} channel    Canal de venta (ver ORDER_CHANNELS).
 * @property {string} customer   Nombre del cliente.
 * @property {number} items      Artículos del pedido.
 * @property {number} total      Importe total.
 * @property {string} note       Nota libre (puede ser "").
 * @property {string} status     Estado (ver ORDER_STATUSES).
 * @property {string} createdAt  Fecha ISO de creación.
 * @property {string} updatedAt  Fecha ISO del último cambio de estado.
 *
 * @typedef {Object} OrdersAdapter
 * @property {() => any} read
 * @property {(orders: Order[]) => void} write
 */

export const ORDERS_STORAGE_KEY = 'soverath.orders.v1'

export const ORDER_STATUSES = [
  'nuevo',
  'pagado',
  'empacado',
  'enviado',
  'entregado',
  'cancelado',
]

export const ORDER_CHANNELS = channels.map((channel) => channel.id)

export const ORDER_PIPELINE = ['nuevo', 'pagado', 'empacado', 'enviado', 'entregado']

export const ORDER_STATUS_LABELS = {
  nuevo: 'Nuevo',
  pagado: 'Pagado',
  empacado: 'Empacado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

const CHANNEL_OPS_NAMES = {
  web: 'Web',
  whatsapp: 'WhatsApp',
  mercado: 'Mercado Libre',
  amazon: 'Amazon',
  fisico: 'Tienda física',
}

const CHANNEL_SOURCE_NAMES = Object.fromEntries(
  channels.map((channel) => [channel.id, channel.name]),
)

export const ORDER_CHANNEL_LABELS = Object.fromEntries(
  ORDER_CHANNELS.map((id) => [id, CHANNEL_OPS_NAMES[id] ?? CHANNEL_SOURCE_NAMES[id] ?? id]),
)

const round2 = (value) => Math.round(value * 100) / 100

const storage = () => {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

const defaultAdapter = {
  read() {
    const store = storage()
    if (!store) return []
    const raw = store.getItem(ORDERS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  },
  write(orders) {
    const store = storage()
    if (!store) throw new Error('localStorage no disponible')
    store.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
  },
}

let adapter = { ...defaultAdapter }

let revision = 0
const listeners = new Set()

function notify() {
  revision += 1
  for (const listener of [...listeners]) {
    try {
      listener()
    } catch {
      listeners.delete(listener)
    }
  }
}

/**
 * Suscribe un callback a los cambios del almacén (para `useSyncExternalStore`).
 * Devuelve la función de baja.
 *
 * @param {() => void} listener
 * @returns {() => void}
 */
export function subscribeOrders(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Revisión actual del almacén: cambia en cada escritura con éxito.
 *
 * @returns {number}
 */
export function getOrdersRevision() {
  return revision
}

/**
 * Sustituye el almacén por defecto (localStorage) por otro adaptador.
 * Llama con `null` para volver al adaptador de localStorage.
 *
 * @param {Partial<OrdersAdapter>|null} next
 * @returns {{ok: boolean, error?: string}}
 */
export function setOrdersAdapter(next) {
  if (next == null) {
    adapter = { ...defaultAdapter }
    notify()
    return { ok: true }
  }
  if (typeof next.read !== 'function' || typeof next.write !== 'function') {
    return {
      ok: false,
      error: 'El adapter debe exponer las funciones read y write.',
    }
  }
  adapter = { read: next.read, write: next.write }
  notify()
  return { ok: true }
}

function readAll() {
  try {
    const data = adapter.read()
    if (!Array.isArray(data)) return []
    return data.filter((order) => order && typeof order === 'object' && order.id)
  } catch {
    return []
  }
}

function writeAll(orders) {
  try {
    adapter.write(orders)
    return null
  } catch {
    return 'No se pudo guardar el almacén de pedidos. Inténtalo de nuevo.'
  }
}

function nextId(list, isoDate) {
  const year = new Date(isoDate).getFullYear()
  let max = 0
  for (const order of list) {
    const match = /^ORD-(\d{4})-(\d{4})$/.exec(String(order.id))
    if (match && Number(match[1]) === year) max = Math.max(max, Number(match[2]))
  }
  return `ORD-${year}-${String(max + 1).padStart(4, '0')}`
}

function normalizeItems(items) {
  const value = Array.isArray(items) ? items.length : Number(items)
  if (!Number.isFinite(value) || value < 0) return null
  return Math.round(value)
}

/**
 * Indica si `to` es una transición legal desde `from`.
 * El flujo admite avance y retroceso de un paso, cancelación desde
 * cualquier estado salvo `entregado`, y reapertura de un pedido cancelado.
 *
 * @param {string} from Estado actual.
 * @param {string} to Estado destino.
 * @returns {boolean}
 */
export function canTransition(from, to) {
  if (!ORDER_STATUSES.includes(from) || !ORDER_STATUSES.includes(to)) return false
  if (from === to) return false

  if (to === 'cancelado') return from !== 'entregado'
  if (from === 'cancelado') return to === 'nuevo'

  const a = ORDER_PIPELINE.indexOf(from)
  const b = ORDER_PIPELINE.indexOf(to)
  return a !== -1 && b !== -1 && Math.abs(a - b) === 1
}

/**
 * Estado anterior/siguiente dentro del flujo principal.
 *
 * @param {string} status Estado actual.
 * @param {1|-1} direction 1 para avanzar, -1 para retroceder.
 * @returns {string|null} Estado destino o null si no hay paso posible.
 */
export function stepStatus(status, direction) {
  const index = ORDER_PIPELINE.indexOf(status)
  if (index === -1) return null
  const target = index + direction
  if (target < 0 || target >= ORDER_PIPELINE.length) return null
  return ORDER_PIPELINE[target]
}

/**
 * Crea un pedido en estado `nuevo` y lo persiste.
 *
 * @param {Object} input
 * @param {string} input.channel Canal de ORDER_CHANNELS.
 * @param {string} input.customer Nombre del cliente.
 * @param {number|any[]} [input.items] Artículos (o array de líneas).
 * @param {number} input.total Importe total.
 * @param {string} [input.note] Nota libre.
 * @returns {{ok: boolean, order?: Order, error?: string}}
 */
export function createOrder({ channel, customer, items = 1, total, note = '' } = {}) {
  if (!ORDER_CHANNELS.includes(channel)) {
    return {
      ok: false,
      error: `Canal no válido: «${String(channel)}». Usa uno de: ${ORDER_CHANNELS.join(', ')}.`,
    }
  }

  const name = typeof customer === 'string' ? customer.trim() : ''
  if (!name) return { ok: false, error: 'El cliente es obligatorio.' }

  const amount = Number(total)
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'El importe debe ser un número mayor que 0.' }
  }

  const count = normalizeItems(items)
  if (count === null) {
    return { ok: false, error: 'Los artículos deben ser un número mayor o igual que 0.' }
  }

  if (note != null && typeof note !== 'string') {
    return { ok: false, error: 'La nota debe ser texto.' }
  }

  const list = readAll()
  const createdAt = new Date().toISOString()
  const order = {
    id: nextId(list, createdAt),
    channel,
    customer: name,
    items: count,
    total: round2(amount),
    note: note.trim(),
    status: 'nuevo',
    createdAt,
    updatedAt: createdAt,
  }

  const error = writeAll([...list, order])
  if (error) return { ok: false, error }

  notify()
  return { ok: true, order }
}

/**
 * Lista pedidos ordenados del más reciente al más antiguo.
 *
 * @param {{channel?: string, status?: string, query?: string}} [filters]
 * @returns {Order[]}
 */
export function listOrders(filters = {}) {
  const { channel, status, query } = filters ?? {}
  const q = typeof query === 'string' ? query.trim().toLowerCase() : ''

  const matchChannel = !channel || channel === 'todos' || channel === 'all'
  const matchStatus = !status || status === 'todos' || status === 'all'

  return readAll()
    .filter((order) => (matchChannel ? true : order.channel === channel))
    .filter((order) => (matchStatus ? true : order.status === status))
    .filter((order) => {
      if (!q) return true
      return (
        String(order.id).toLowerCase().includes(q) ||
        String(order.customer ?? '')
          .toLowerCase()
          .includes(q) ||
        String(order.note ?? '')
          .toLowerCase()
          .includes(q)
      )
    })
    .sort(
      (a, b) =>
        String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')) ||
        String(b.id ?? '').localeCompare(String(a.id ?? '')),
    )
}

/**
 * Devuelve un pedido por su id, o null si no existe.
 *
 * @param {string} id
 * @returns {Order|null}
 */
export function getOrder(id) {
  if (typeof id !== 'string' || !id) return null
  return readAll().find((order) => order.id === id) ?? null
}

/**
 * Cambia el estado de un pedido validando la transición.
 *
 * @param {string} id
 * @param {string} status Estado destino de ORDER_STATUSES.
 * @returns {{ok: boolean, order?: Order, error?: string}}
 */
export function updateStatus(id, status) {
  if (!ORDER_STATUSES.includes(status)) {
    return {
      ok: false,
      error: `Estado no válido: «${String(status)}». Usa uno de: ${ORDER_STATUSES.join(', ')}.`,
    }
  }

  const list = readAll()
  const index = list.findIndex((order) => order.id === id)
  if (index === -1) return { ok: false, error: `No existe el pedido «${String(id)}».` }

  const current = list[index].status
  if (current === status) {
    return { ok: false, error: `El pedido ${id} ya está en estado ${status}.` }
  }
  if (!canTransition(current, status)) {
    return { ok: false, error: `Transición no permitida: ${current} → ${status}.` }
  }

  const updated = { ...list[index], status, updatedAt: new Date().toISOString() }
  list[index] = updated

  const error = writeAll(list)
  if (error) return { ok: false, error }

  notify()
  return { ok: true, order: updated }
}

/**
 * Elimina un pedido del almacén.
 *
 * @param {string} id
 * @returns {{ok: boolean, error?: string}}
 */
export function removeOrder(id) {
  const list = readAll()
  const next = list.filter((order) => order.id !== id)
  if (next.length === list.length) {
    return { ok: false, error: `No existe el pedido «${String(id)}».` }
  }

  const error = writeAll(next)
  if (error) return { ok: false, error }

  notify()
  return { ok: true }
}

const SEEDS = [
  {
    channel: 'web',
    customer: 'Café Norteño S.L.',
    items: 46,
    total: 1240.5,
    note: 'Reposición mensual de albarán 44B',
    status: 'pagado',
    daysAgo: 6,
  },
  {
    channel: 'whatsapp',
    customer: 'María Fernanda Ríos',
    items: 12,
    total: 385,
    note: 'Coordina entrega por la tarde',
    status: 'empacado',
    daysAgo: 5,
  },
  {
    channel: 'mercado',
    customer: 'Distribuidora El Roble',
    items: 88,
    total: 2190,
    note: 'Envío a centro de distribución Monterrey',
    status: 'enviado',
    daysAgo: 4,
  },
  {
    channel: 'amazon',
    customer: 'Laura Sánchez',
    items: 6,
    total: 649.9,
    note: 'Pedido FBA #A77-2210',
    status: 'entregado',
    daysAgo: 3,
  },
  {
    channel: 'fisico',
    customer: 'Bodega La Esquina',
    items: 4,
    total: 96.4,
    note: 'Recogido en mostrador',
    status: 'entregado',
    daysAgo: 2,
  },
  {
    channel: 'web',
    customer: 'Grupo Hostelería Vega',
    items: 132,
    total: 3480,
    note: 'Factura con IVA, pago a 30 días',
    status: 'nuevo',
    daysAgo: 1,
  },
  {
    channel: 'whatsapp',
    customer: 'Jorge Peña',
    items: 9,
    total: 214.75,
    note: 'Pregunta por stock de la siguiente tanda',
    status: 'nuevo',
    daysAgo: 0,
  },
  {
    channel: 'mercado',
    customer: 'Tienda Mascota Feliz',
    items: 21,
    total: 572.3,
    note: 'Cancelado por el comprador antes de facturar',
    status: 'cancelado',
    daysAgo: 7,
  },
]

/**
 * Si el almacén está vacío, crea 8 pedidos de ejemplo repartidos en los
 * 5 canales. Idempotente: con datos existentes no hace nada.
 *
 * @returns {{ok: boolean, created: number, skipped?: boolean, orders?: Order[], error?: string}}
 */
export function seedOrders() {
  const existing = readAll()
  if (existing.length > 0) return { ok: true, created: 0, skipped: true }

  const year = new Date().getFullYear()
  const now = Date.now()

  const seeds = SEEDS.map((seed, index) => {
    const createdAt = new Date(now - seed.daysAgo * 86400000 - (SEEDS.length - index) * 3600000)
    const iso = createdAt.toISOString()
    return {
      id: `ORD-${year}-${String(index + 1).padStart(4, '0')}`,
      channel: seed.channel,
      customer: seed.customer,
      items: seed.items,
      total: round2(seed.total),
      note: seed.note,
      status: seed.status,
      createdAt: iso,
      updatedAt: iso,
    }
  })

  const error = writeAll(seeds)
  if (error) return { ok: false, created: 0, error }

  notify()
  return { ok: true, created: seeds.length, orders: seeds }
}

/**
 * Agregados de KPIs. Los pedidos cancelados cuentan en `count` pero
 * no suman dinero (`total`, `totalRevenue`, `avgTicket`).
 *
 * @param {Order[]} orders
 * @returns {{
 *   totalOrders: number,
 *   byChannel: Record<string, {count: number, total: number}>,
 *   byStatus: Record<string, {count: number, total: number}>,
 *   totalRevenue: number,
 *   avgTicket: number
 * }}
 */
export function orderStats(orders = []) {
  const list = Array.isArray(orders) ? orders : []

  const byChannel = {}
  for (const channel of ORDER_CHANNELS) byChannel[channel] = { count: 0, total: 0 }

  const byStatus = {}
  for (const status of ORDER_STATUSES) byStatus[status] = { count: 0, total: 0 }

  let revenue = 0
  let billed = 0

  for (const order of list) {
    const channel = ORDER_CHANNELS.includes(order?.channel) ? order.channel : null
    const status = ORDER_STATUSES.includes(order?.status) ? order.status : null
    const total = Number(order?.total)
    const money = Number.isFinite(total) ? total : 0

    if (channel) byChannel[channel].count += 1
    if (status) byStatus[status].count += 1

    if (order?.status === 'cancelado') continue

    if (channel) byChannel[channel].total = round2(byChannel[channel].total + money)
    if (status) byStatus[status].total = round2(byStatus[status].total + money)
    revenue = round2(revenue + money)
    billed += 1
  }

  for (const channel of ORDER_CHANNELS) {
    byChannel[channel].total = round2(byChannel[channel].total)
  }
  for (const status of ORDER_STATUSES) {
    byStatus[status].total = round2(byStatus[status].total)
  }

  return {
    totalOrders: list.length,
    byChannel,
    byStatus,
    totalRevenue: revenue,
    avgTicket: billed > 0 ? round2(revenue / billed) : 0,
  }
}
