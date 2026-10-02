import { useState } from 'react'
import { formatPrice } from '../../data/products.js'
import {
  ORDER_CHANNEL_LABELS,
  ORDER_STATUS_LABELS,
  canTransition,
  stepStatus,
} from '../../lib/orders-store.js'

const formatDate = (iso) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })} · ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
}

export default function AdminOrderCard({ order, onStatus, onCancel, delay = 0 }) {
  const [confirming, setConfirming] = useState(false)

  const back = stepStatus(order.status, -1)
  const next = stepStatus(order.status, 1)
  const cancellable = canTransition(order.status, 'cancelado')
  const reopen = order.status === 'cancelado'

  const confirmCancel = () => {
    setConfirming(false)
    onCancel(order)
  }

  return (
    <li
      className="admin-order glass"
      data-channel={order.channel}
      data-status={order.status}
      style={{ '--delay': `${delay}ms` }}
    >
      <div className="admin-order__top">
        <span className="admin-order__id mono">{order.id}</span>
        <span className="admin-order__channel">
          <span className="admin-order__dot" aria-hidden="true" />
          {ORDER_CHANNEL_LABELS[order.channel] ?? order.channel}
        </span>
        <span className="admin-order__badge mono">
          <span className="sr-only">Estado: </span>
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <div className="admin-order__body">
        <h3 className="admin-order__customer">{order.customer}</h3>
        <p className="admin-order__meta mono">
          {formatDate(order.createdAt)} · {order.items} art.
        </p>
        {order.note ? <p className="admin-order__note">{order.note}</p> : null}
      </div>

      <div className="admin-order__foot">
        <span className="admin-order__total mono">{formatPrice(order.total)}</span>

        {confirming ? (
          <div
            className="admin-order__confirm"
            role="group"
            aria-label={`Confirmar cancelación del pedido ${order.id}`}
          >
            <span className="admin-order__confirm-text">¿Cancelar este pedido?</span>
            <button
              type="button"
              className="admin-order__btn admin-order__btn--danger"
              onClick={confirmCancel}
            >
              Sí, cancelar
            </button>
            <button type="button" className="admin-order__btn" onClick={() => setConfirming(false)}>
              No
            </button>
          </div>
        ) : (
          <div
            className="admin-order__actions"
            role="group"
            aria-label={`Acciones del pedido ${order.id}`}
          >
            <button
              type="button"
              className="admin-order__btn"
              disabled={!back}
              aria-label={`Retroceder estado del pedido ${order.id}`}
              onClick={() => onStatus(order, back)}
            >
              <span aria-hidden="true">←</span>
              <span className="admin-order__btn-text">Retroceder</span>
            </button>
            <button
              type="button"
              className="admin-order__btn admin-order__btn--next"
              disabled={!next}
              aria-label={`Avanzar estado del pedido ${order.id}`}
              onClick={() => onStatus(order, next)}
            >
              <span className="admin-order__btn-text">Avanzar</span>
              <span aria-hidden="true">→</span>
            </button>
            {reopen ? (
              <button
                type="button"
                className="admin-order__btn"
                onClick={() => onStatus(order, 'nuevo')}
              >
                Reabrir
              </button>
            ) : cancellable ? (
              <button
                type="button"
                className="admin-order__btn admin-order__btn--danger"
                onClick={() => setConfirming(true)}
              >
                Cancelar
              </button>
            ) : null}
          </div>
        )}
      </div>
    </li>
  )
}
