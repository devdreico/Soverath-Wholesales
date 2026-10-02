import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProductGrid from './ProductGrid.jsx'
import { products } from '../data/products.js'

const renderGrid = (items) =>
  render(
    <MemoryRouter>
      <ProductGrid items={items} />
    </MemoryRouter>
  )

describe('ProductGrid', () => {
  it('muestra el estado vacío cuando no hay resultados', () => {
    const { container } = renderGrid([])

    const empty = container.querySelector('.products-empty')
    expect(empty).not.toBeNull()
    expect(screen.getByRole('status')).toHaveClass('products-empty')
    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
    expect(container.querySelectorAll('.product')).toHaveLength(0)
  })

  it('personaliza el título del estado vacío', () => {
    render(
      <MemoryRouter>
        <ProductGrid items={[]} emptyLabel="Sin referencias publicadas en Ferreza" />
      </MemoryRouter>
    )

    expect(
      screen.getByText('Sin referencias publicadas en Ferreza')
    ).toBeInTheDocument()
  })

  it('renderiza una tarjeta por producto con su SKU visible', () => {
    const { container } = renderGrid([products[0], products[10]])

    expect(container.querySelectorAll('.product')).toHaveLength(2)
    expect(screen.getByText('BT-SUP-014')).toBeInTheDocument()
    expect(screen.getByText('FZ-HRR-203')).toBeInTheDocument()
    expect(screen.queryByText('Sin resultados')).not.toBeInTheDocument()
  })
})
