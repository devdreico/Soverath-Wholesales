// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  ORDER_CHANNELS,
  ORDER_STATUSES,
  ORDERS_STORAGE_KEY,
  canTransition,
  createOrder,
  getOrdersRevision,
  getOrder,
  listOrders,
  orderStats,
  removeOrder,
  seedOrders,
  setOrdersAdapter,
  subscribeOrders,
  stepStatus,
  updateStatus,
} from './orders-store.js'

const stored = () => JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) ?? '[]')

beforeEach(() => {
  localStorage.clear()
  setOrdersAdapter(null)
})

describe('createOrder', () => {
  it('genera id secuencial, estado nuevo y persiste en localStorage', () => {
    const first = createOrder({
      channel: 'web',
      customer: '  Panadería Luna  ',
      items: 3,
      total: 120.5,
      note: ' recogida 9:00 ',
    })

    expect(first.ok).toBe(true)
    expect(first.order.id).toMatch(/^ORD-\d{4}-0001$/)
    expect(first.order.status).toBe('nuevo')
    expect(first.order.customer).toBe('Panadería Luna')
    expect(first.order.note).toBe('recogida 9:00')
    expect(first.order.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(stored()).toHaveLength(1)

    const second = createOrder({ channel: 'amazon', customer: 'Ana Ruiz', total: 40 })
    expect(second.order.id).toMatch(/^ORD-\d{4}-0002$/)
    expect(stored()).toHaveLength(2)
  })

  it('devuelve errores en español sin lanzar excepciones', () => {
    expect(createOrder({ channel: 'tiktok', customer: 'Ana', total: 10 })).toEqual({
      ok: false,
      error: expect.stringContaining('Canal no válido'),
    })
    expect(createOrder({ channel: 'web', customer: '   ', total: 10 }).error).toContain(
      'cliente',
    )
    expect(createOrder({ channel: 'web', customer: 'Ana', total: 'gratis' }).error).toContain(
      'importe',
    )
    expect(createOrder({ channel: 'web', customer: 'Ana', total: -2 }).ok).toBe(false)
    expect(createOrder({ channel: 'web', customer: 'Ana', total: 5, items: -1 }).ok).toBe(false)
    expect(stored()).toHaveLength(0)
  })
})

describe('listOrders y getOrder', () => {
  beforeEach(() => {
    createOrder({ channel: 'web', customer: 'Alfa Corp', total: 100 })
    createOrder({ channel: 'whatsapp', customer: 'Beta S.L.', total: 50 })
    createOrder({ channel: 'amazon', customer: 'Gamma', total: 75, note: 'urgente' })
  })

  it('filtra por canal, estado y query (cliente, id o nota)', () => {
    expect(listOrders().map((o) => o.channel)).toEqual(['amazon', 'whatsapp', 'web'])
    expect(listOrders({ channel: 'web' })).toHaveLength(1)
    expect(listOrders({ channel: 'todos' })).toHaveLength(3)
    expect(listOrders({ status: 'pagado' })).toHaveLength(0)
    expect(listOrders({ query: 'beta' })).toHaveLength(1)
    expect(listOrders({ query: 'urgente' })).toHaveLength(1)
    expect(listOrders({ query: 'ORD-' })).toHaveLength(3)
    expect(listOrders({ channel: 'web', query: 'beta' })).toHaveLength(0)
  })

  it('getOrder devuelve el pedido o null', () => {
    const [newest] = listOrders()
    expect(getOrder(newest.id)?.customer).toBe('Gamma')
    expect(getOrder('ORD-1999-9999')).toBeNull()
    expect(getOrder()).toBeNull()
  })

  it('removeOrder borra solo el indicado', () => {
    const [newest] = listOrders()
    expect(removeOrder(newest.id)).toEqual({ ok: true })
    expect(getOrder(newest.id)).toBeNull()
    expect(stored()).toHaveLength(2)
    expect(removeOrder('ORD-1999-9999').ok).toBe(false)
  })
})

describe('updateStatus', () => {
  beforeEach(() => {
    createOrder({ channel: 'fisico', customer: 'Mostrador', total: 20 })
  })

  it('acepta transiciones legales dentro del flujo', () => {
    const [order] = listOrders()

    const paid = updateStatus(order.id, 'pagado')
    expect(paid.ok).toBe(true)
    expect(paid.order.status).toBe('pagado')

    expect(updateStatus(order.id, 'empacado').ok).toBe(true)
    expect(updateStatus(order.id, 'enviado').ok).toBe(true)
    expect(updateStatus(order.id, 'enviado').ok).toBe(false)
    expect(updateStatus(order.id, 'empacado').ok).toBe(true)
    expect(updateStatus(order.id, 'cancelado').ok).toBe(true)
    expect(updateStatus(order.id, 'nuevo').ok).toBe(true)
    expect(getOrder(order.id).status).toBe('nuevo')
  })

  it('rechaza saltos, cancelaciones ilegales y estados desconocidos', () => {
    const [order] = listOrders()

    expect(updateStatus(order.id, 'enviado')).toEqual({
      ok: false,
      error: expect.stringContaining('Transición no permitida'),
    })
    expect(updateStatus(order.id, 'enviado entero').error).toContain('Estado no válido')
    expect(updateStatus('ORD-1999-9999', 'pagado').error).toContain('No existe')

    updateStatus(order.id, 'pagado')
    updateStatus(order.id, 'empacado')
    updateStatus(order.id, 'enviado')
    updateStatus(order.id, 'entregado')
    expect(updateStatus(order.id, 'cancelado').ok).toBe(false)
  })

  it('canTransition y stepStatus describen la regla de negocio', () => {
    expect(canTransition('nuevo', 'pagado')).toBe(true)
    expect(canTransition('pagado', 'nuevo')).toBe(true)
    expect(canTransition('nuevo', 'enviado')).toBe(false)
    expect(canTransition('nuevo', 'nuevo')).toBe(false)
    expect(canTransition('nuevo', 'cancelado')).toBe(true)
    expect(canTransition('entregado', 'cancelado')).toBe(false)
    expect(canTransition('cancelado', 'nuevo')).toBe(true)
    expect(canTransition('cancelado', 'pagado')).toBe(false)
    expect(canTransition('nuevo', 'otro')).toBe(false)

    expect(stepStatus('nuevo', 1)).toBe('pagado')
    expect(stepStatus('nuevo', -1)).toBeNull()
    expect(stepStatus('entregado', 1)).toBeNull()
    expect(stepStatus('cancelado', 1)).toBeNull()
  })
})

describe('seedOrders', () => {
  it('crea 8 pedidos repartidos en los 5 canales y es idempotente', () => {
    const first = seedOrders()

    expect(first.ok).toBe(true)
    expect(first.created).toBe(8)
    expect(stored()).toHaveLength(8)
    expect(new Set(stored().map((o) => o.channel))).toEqual(new Set(ORDER_CHANNELS))
    expect(new Set(stored().map((o) => o.status)).size).toBeGreaterThan(3)
    expect(stored().every((o) => o.id.startsWith(`ORD-${new Date().getFullYear()}-`))).toBe(true)
    expect(stored().every((o) => typeof o.customer === 'string' && o.customer.length > 0)).toBe(
      true,
    )
    expect(stored().every((o) => o.total > 0)).toBe(true)

    const second = seedOrders()
    expect(second).toMatchObject({ ok: true, created: 0, skipped: true })
    expect(stored()).toHaveLength(8)
  })

  it('no siembra si ya hay pedidos', () => {
    createOrder({ channel: 'web', customer: 'Único', total: 10 })
    expect(seedOrders()).toMatchObject({ ok: true, created: 0, skipped: true })
    expect(stored()).toHaveLength(1)
  })
})

describe('orderStats', () => {
  it('agrega por canal, estado, ingreso y ticket medio', () => {
    seedOrders()
    const stats = orderStats(listOrders())

    expect(stats.totalOrders).toBe(8)
    expect(Object.keys(stats.byChannel)).toEqual(ORDER_CHANNELS)
    expect(Object.keys(stats.byStatus)).toEqual(ORDER_STATUSES)

    const activeChannels = Object.values(stats.byChannel).filter((c) => c.count > 0)
    expect(activeChannels).toHaveLength(5)
    expect(Object.values(stats.byChannel).reduce((sum, c) => sum + c.count, 0)).toBe(8)
    expect(stats.byStatus.cancelado.count).toBe(1)
    expect(stats.byStatus.cancelado.total).toBe(0)

    const nonCancelled = listOrders().filter((o) => o.status !== 'cancelado')
    const expected = Math.round(nonCancelled.reduce((sum, o) => sum + o.total, 0) * 100) / 100
    expect(stats.totalRevenue).toBe(expected)
    expect(stats.avgTicket).toBe(Math.round((expected / nonCancelled.length) * 100) / 100)
  })

  it('devuelve ceros con lista vacía o basura', () => {
    expect(orderStats()).toEqual({
      totalOrders: 0,
      byChannel: Object.fromEntries(ORDER_CHANNELS.map((c) => [c, { count: 0, total: 0 }])),
      byStatus: Object.fromEntries(ORDER_STATUSES.map((s) => [s, { count: 0, total: 0 }])),
      totalRevenue: 0,
      avgTicket: 0,
    })
    expect(orderStats([{ canal: 'x' }]).totalOrders).toBe(1)
  })
})

describe('setOrdersAdapter', () => {
  it('permite intercambiar el almacén sin tocar la UI', () => {
    const memory = []
    const result = setOrdersAdapter({
      read: () => memory.slice(),
      write: (orders) => {
        memory.splice(0, memory.length, ...orders)
      },
    })

    expect(result).toEqual({ ok: true })
    const created = createOrder({ channel: 'web', customer: 'Remoto', total: 99 })
    expect(created.ok).toBe(true)
    expect(memory).toHaveLength(1)
    expect(localStorage.getItem(ORDERS_STORAGE_KEY)).toBeNull()

    expect(updateStatus(created.order.id, 'pagado').ok).toBe(true)
    expect(memory[0].status).toBe('pagado')
    expect(removeOrder(created.order.id).ok).toBe(true)
    expect(memory).toHaveLength(0)

    setOrdersAdapter(null)
    expect(createOrder({ channel: 'web', customer: 'Local', total: 5 }).ok).toBe(true)
    expect(stored()).toHaveLength(1)
  })

  it('rechaza adaptadores incompletos', () => {
    expect(setOrdersAdapter({ read: () => [] })).toEqual({
      ok: false,
      error: expect.stringContaining('read y write'),
    })
    expect(setOrdersAdapter('nope').ok).toBe(false)
  })

  it('no revienta si el adaptador falla', () => {
    setOrdersAdapter({
      read: () => {
        throw new Error('sin red')
      },
      write: () => {
        throw new Error('sin red')
      },
    })

    expect(listOrders()).toEqual([])
    expect(getOrder('ORD-2026-0001')).toBeNull()
    expect(createOrder({ channel: 'web', customer: 'Ana', total: 10 }).ok).toBe(false)
    expect(seedOrders().ok).toBe(false)
  })
})

describe('subscribeOrders', () => {
  it('notifica solo en escrituras con éxito', () => {
    let calls = 0
    const unsubscribe = subscribeOrders(() => {
      calls += 1
    })
    const before = getOrdersRevision()

    listOrders()
    getOrder('ORD-1999-9999')
    expect(calls).toBe(0)

    const created = createOrder({ channel: 'web', customer: 'Ana', total: 10 })
    updateStatus(created.order.id, 'pagado')
    expect(calls).toBe(2)
    expect(getOrdersRevision()).toBe(before + 2)

    updateStatus(created.order.id, 'enviado')
    expect(calls).toBe(2)

    removeOrder(created.order.id)
    expect(calls).toBe(3)

    unsubscribe()
    seedOrders()
    expect(calls).toBe(3)
  })

  it('da de baja un listener que lanza excepción', () => {
    subscribeOrders(() => {
      throw new Error('listener roto')
    })
    let calls = 0
    const unsubscribe = subscribeOrders(() => {
      calls += 1
    })

    expect(() => seedOrders()).not.toThrow()
    expect(calls).toBe(1)

    unsubscribe()
    seedOrders()
    expect(calls).toBe(1)
  })
})
