import { useState } from 'react'
import { ORDER_CHANNELS, ORDER_CHANNEL_LABELS } from '../../lib/orders-store.js'

const EMPTY = { customer: '', channel: 'web', total: '', note: '' }

export default function AdminOrderForm({ onCreate }) {
  const [values, setValues] = useState(EMPTY)
  const [error, setError] = useState('')

  const update = (key) => (event) =>
    setValues((current) => ({ ...current, [key]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()

    const result = onCreate({
      channel: values.channel,
      customer: values.customer,
      items: 1,
      total: Number(values.total),
      note: values.note,
    })

    if (result?.ok) {
      setValues(EMPTY)
      setError('')
      return
    }

    setError(result?.error ?? 'No se pudo crear el pedido.')
  }

  return (
    <section className="admin-form glass" aria-labelledby="admin-form-title">
      <div className="admin-form__head">
        <h2 className="admin__subtitle" id="admin-form-title">
          Nuevo pedido
        </h2>
        <p className="admin-form__hint mono">Alta manual: mostrador, llamada o corrección</p>
      </div>

      <form className="admin-form__grid" onSubmit={submit} noValidate>
        <div className="admin-form__field">
          <label className="admin-form__label mono" htmlFor="admin-new-customer">
            Cliente
          </label>
          <input
            id="admin-new-customer"
            className="admin-form__input"
            type="text"
            required
            autoComplete="off"
            placeholder="Nombre o empresa"
            value={values.customer}
            onChange={update('customer')}
          />
        </div>

        <div className="admin-form__field">
          <label className="admin-form__label mono" htmlFor="admin-new-channel">
            Canal
          </label>
          <select
            id="admin-new-channel"
            className="admin-form__select"
            value={values.channel}
            onChange={update('channel')}
          >
            {ORDER_CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {ORDER_CHANNEL_LABELS[channel]}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-form__field">
          <label className="admin-form__label mono" htmlFor="admin-new-total">
            Importe
          </label>
          <input
            id="admin-new-total"
            className="admin-form__input"
            type="number"
            required
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="0,00"
            value={values.total}
            onChange={update('total')}
          />
        </div>

        <div className="admin-form__field admin-form__field--wide">
          <label className="admin-form__label mono" htmlFor="admin-new-note">
            Nota
          </label>
          <input
            id="admin-new-note"
            className="admin-form__input"
            type="text"
            autoComplete="off"
            placeholder="Horario de entrega, referencia interna…"
            value={values.note}
            onChange={update('note')}
          />
        </div>

        <div className="admin-form__actions">
          <button type="submit" className="btn btn--primary">
            Crear pedido
            <span aria-hidden="true">+</span>
          </button>
          {error ? (
            <p className="admin-form__error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  )
}
