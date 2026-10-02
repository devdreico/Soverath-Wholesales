import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './helpers.jsx'

describe('Interacción en /productos', () => {
  it('buscar "taladro" deja un único resultado', async () => {
    const user = userEvent.setup()
    const { container } = renderApp('/productos')

    await user.type(screen.getByLabelText('Buscar productos'), 'taladro')

    expect(screen.getByText('001 refs')).toBeInTheDocument()
    expect(container.querySelectorAll('.product')).toHaveLength(1)
    expect(screen.getByText('Taladro percutor 750 W')).toBeInTheDocument()
  })

  it('el chip Cocina deja solo productos de la categoría Cocina', async () => {
    const user = userEvent.setup()
    const { container } = renderApp('/productos')

    await user.click(screen.getByRole('button', { name: 'Cocina' }))

    expect(screen.getByText('002 refs')).toBeInTheDocument()
    const visibleCategories = [...container.querySelectorAll('.product__category')].map(
      (node) => node.textContent
    )
    expect(visibleCategories.length).toBeGreaterThan(0)
    expect(visibleCategories).toEqual(visibleCategories.map(() => 'Cocina'))
    expect(screen.getByRole('button', { name: 'Cocina' })).toHaveClass('is-active')
  })

  it('una búsqueda sin resultados muestra el estado vacío', async () => {
    const user = userEvent.setup()
    const { container } = renderApp('/productos')

    await user.type(screen.getByLabelText('Buscar productos'), 'zzzzzz')

    expect(screen.getByText('000 refs')).toBeInTheDocument()
    expect(container.querySelector('.products-empty')).not.toBeNull()
    expect(screen.getByRole('status')).toHaveClass('products-empty')
    expect(container.querySelectorAll('.product')).toHaveLength(0)
  })
})
