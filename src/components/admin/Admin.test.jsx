// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import Admin from '../../pages/Admin.jsx'
import { ORDERS_STORAGE_KEY, listOrders, setOrdersAdapter } from '../../lib/orders-store.js'

const stored = () => JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) ?? '[]')

beforeEach(() => {
  localStorage.clear()
  setOrdersAdapter(null)
})

afterEach(cleanup)

describe('Admin', () => {
  it('siembra 8 pedidos y pinta KPIs, cabecera y lista', () => {
    render(<Admin />)

    expect(stored()).toHaveLength(8)
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    expect(screen.getAllByRole('listitem')).toHaveLength(8)

    const kpis = document.querySelectorAll('.admin-kpi__value')
    expect(kpis[0].textContent).toBe('8')
    expect(kpis[3].textContent).toBe('5 / 5')

    expect(document.querySelector('.admin__count').textContent).toBe('8 de 8')
    expect(document.querySelector('.admin-order__id').textContent).toMatch(/^ORD-\d{4}-\d{4}$/)
  })

  it('filtra por canal y por búsqueda con cero resultados y limpieza', () => {
    render(<Admin />)

    const channelGroup = screen.getByRole('group', { name: 'Filtrar por canal' })
    fireEvent.click(within(channelGroup).getByRole('button', { name: 'WhatsApp' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'zzzz' } })
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.getByText('Ningún pedido coincide con el filtro')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(8)
  })

  it('avanza y retrocede estado con confirmación en aria-live', () => {
    render(<Admin />)

    const first = screen.getAllByRole('listitem')[0]
    expect(first.querySelector('.admin-order__badge').textContent).toBe('Estado: Nuevo')

    fireEvent.click(within(first).getByRole('button', { name: /Avanzar estado/ }))
    expect(screen.getByText(/actualizado a pagado/)).toBeTruthy()
    expect(listOrders()[0].status).toBe('pagado')

    const updated = screen.getAllByRole('listitem')[0]
    fireEvent.click(within(updated).getByRole('button', { name: /Retroceder estado/ }))
    expect(screen.getByText(/actualizado a nuevo/)).toBeTruthy()
  })

  it('cancela con confirmación inline y permite reabrir', () => {
    render(<Admin />)

    const first = screen.getAllByRole('listitem')[0]
    const orderId = first.querySelector('.admin-order__id').textContent

    fireEvent.click(within(first).getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(within(first).getByRole('button', { name: 'Sí, cancelar' }))

    expect(screen.getByText(`Pedido ${orderId} actualizado a cancelado.`)).toBeTruthy()
    expect(listOrders()[0].status).toBe('cancelado')

    const cancelled = screen.getAllByRole('listitem')[0]
    fireEvent.click(within(cancelled).getByRole('button', { name: 'Reabrir' }))
    expect(screen.getByText(`Pedido ${orderId} actualizado a nuevo.`)).toBeTruthy()
  })

  it('muestra el estado vacío si el almacén no puede cargar ni sembrar', () => {
    setOrdersAdapter({
      read: () => [],
      write: () => {
        throw new Error('sin permisos')
      },
    })

    render(<Admin />)

    expect(screen.getByText('Todavía no hay pedidos')).toBeTruthy()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Cargar pedidos de ejemplo' }))
    expect(screen.getByText(/No se pudo guardar el almacén de pedidos/)).toBeTruthy()

    setOrdersAdapter(null)
  })

  it('crea un pedido desde el formulario y muestra errores en español', () => {
    const { container } = render(<Admin />)

    expect(screen.getByLabelText('Cliente')).toBeTruthy()
    expect(screen.getByLabelText('Canal')).toBeTruthy()
    expect(screen.getByLabelText('Importe')).toBeTruthy()
    expect(screen.getByLabelText('Nota')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Café Aurora' } })
    fireEvent.change(screen.getByLabelText('Importe'), { target: { value: '150.25' } })
    fireEvent.change(screen.getByLabelText('Nota'), { target: { value: 'Entrega 9:00' } })
    fireEvent.submit(container.querySelector('form'))

    expect(screen.getByText(/creado en Web/)).toBeTruthy()
    expect(screen.getAllByRole('listitem')).toHaveLength(9)
    expect(screen.getByLabelText('Cliente').value).toBe('')

    fireEvent.submit(container.querySelector('form'))
    expect(screen.getByRole('alert').textContent).toBe('El cliente es obligatorio.')
    expect(stored()).toHaveLength(9)
  })
})
