import { useEffect, useState, useSyncExternalStore } from 'react'
import AdminEmpty from '../components/admin/AdminEmpty.jsx'
import AdminFilters from '../components/admin/AdminFilters.jsx'
import AdminKpis from '../components/admin/AdminKpis.jsx'
import AdminOrderCard from '../components/admin/AdminOrderCard.jsx'
import AdminOrderForm from '../components/admin/AdminOrderForm.jsx'
import { formatPrice } from '../data/products.js'
import {
  ORDER_CHANNELS,
  ORDER_CHANNEL_LABELS,
  createOrder,
  getOrdersRevision,
  listOrders,
  orderStats,
  seedOrders,
  subscribeOrders,
  updateStatus,
} from '../lib/orders-store.js'
import '../styles/admin.css'

const INITIAL_FILTERS = { channel: 'todos', status: 'todos', query: '' }

export default function Admin() {
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [message, setMessage] = useState('')

  useSyncExternalStore(subscribeOrders, getOrdersRevision, getOrdersRevision)

  useEffect(() => {
    seedOrders()
  }, [])

  const all = listOrders()
  const orders = listOrders(filters)
  const stats = orderStats(all)

  const activeChannels = Object.values(stats.byChannel).filter((entry) => entry.count > 0).length

  const kpis = [
    {
      label: 'Pedidos totales',
      value: String(stats.totalOrders),
      hint: `${stats.byStatus.nuevo.count} nuevos · ${stats.byStatus.entregado.count} entregados`,
    },
    { label: 'Ingreso total', value: formatPrice(stats.totalRevenue), hint: 'sin cancelados' },
    { label: 'Ticket medio', value: formatPrice(stats.avgTicket), hint: 'por pedido facturado' },
    {
      label: 'Canales activos',
      value: `${activeChannels} / ${ORDER_CHANNELS.length}`,
      hint: 'web · WhatsApp · marketplaces · tienda',
    },
  ]

  function handleStatus(order, status) {
    const result = updateStatus(order.id, status)
    if (result.ok) {
      setMessage(`Pedido ${result.order.id} actualizado a ${result.order.status}.`)
    } else {
      setMessage(result.error)
    }
  }

  function handleCancel(order) {
    handleStatus(order, 'cancelado')
  }

  function handleCreate(payload) {
    const result = createOrder(payload)
    if (result.ok) {
      const channel = ORDER_CHANNEL_LABELS[result.order.channel] ?? result.order.channel
      setMessage(`Pedido ${result.order.id} creado en ${channel}.`)
    }
    return result
  }

  function handleSeed() {
    const seeded = seedOrders()
    if (seeded.ok) {
      setMessage(
        seeded.created > 0
          ? `Se cargaron ${seeded.created} pedidos de ejemplo.`
          : 'Ya hay pedidos en el almacén.',
      )
    } else {
      setMessage(seeded.error)
    }
  }

  function clearFilters() {
    setFilters(INITIAL_FILTERS)
  }

  return (
    <section className="admin" aria-labelledby="admin-title">
      <header className="admin__head">
        <p className="admin__eyebrow mono">
          <span className="admin__pulse" aria-hidden="true" />
          Hub de pedidos
        </p>

        <div className="admin__title-row">
          <h1 className="admin__title" id="admin-title">
            Operación multicanal
          </h1>
          <span className="admin__meta mono">
            {stats.totalOrders} pedidos · {activeChannels} canales
          </span>
        </div>

        <span className="admin__rule" aria-hidden="true" />

        <p className="admin__desc">
          Un solo inventario, varias salidas. Cada pedido entra con su canal y avanza por el mismo
          flujo: nuevo, pagado, empacado, enviado y entregado.
        </p>
      </header>

      <AdminKpis kpis={kpis} />

      <AdminFilters filters={filters} onChange={setFilters} resultCount={orders.length} />

      <p className="admin__message mono" role="status" aria-live="polite">
        {message}
      </p>

      <section className="admin__orders" aria-labelledby="admin-orders-title">
        <div className="admin__section-head">
          <h2 className="admin__subtitle" id="admin-orders-title">
            Pedidos
          </h2>
          <span className="admin__count mono">
            {orders.length} de {all.length}
          </span>
        </div>

        {orders.length > 0 ? (
          <ul className="admin__list">
            {orders.map((order, index) => (
              <AdminOrderCard
                key={order.id}
                order={order}
                onStatus={handleStatus}
                onCancel={handleCancel}
                delay={Math.min(index, 10) * 45}
              />
            ))}
          </ul>
        ) : all.length === 0 ? (
          <AdminEmpty
            glyph="◈"
            title="Todavía no hay pedidos"
            hint="Carga el set de ejemplo para ver cómo se comporta el hub con los cinco canales de venta."
            actionLabel="Cargar pedidos de ejemplo"
            onAction={handleSeed}
          />
        ) : (
          <AdminEmpty
            glyph="⌖"
            title="Ningún pedido coincide con el filtro"
            hint="Prueba con otro canal, otro estado o una búsqueda más amplia."
            actionLabel="Limpiar filtros"
            onAction={clearFilters}
          />
        )}
      </section>

      <AdminOrderForm onCreate={handleCreate} />
    </section>
  )
}
