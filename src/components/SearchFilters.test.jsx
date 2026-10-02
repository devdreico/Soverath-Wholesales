import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchFilters from './SearchFilters.jsx'
import { categories } from '../data/products.js'
import { stores } from '../data/stores.jsx'

function SearchFiltersHarness({ onQuery, onCategory, resultCount = 7 }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('todas')

  const handleQuery = (value) => {
    setQuery(value)
    onQuery(value)
  }

  const handleCategory = (value) => {
    setActiveCategory(value)
    onCategory(value)
  }

  return (
    <SearchFilters
      query={query}
      onQuery={handleQuery}
      categories={categories}
      activeCategory={activeCategory}
      onCategory={handleCategory}
      stores={stores}
      activeStore="todas"
      onStore={() => {}}
      sort="destacado"
      onSort={() => {}}
      resultCount={resultCount}
    />
  )
}

describe('SearchFilters', () => {
  it('notifica cada tecla escrita en el buscador con onQuery', async () => {
    const user = userEvent.setup()
    const onQuery = vi.fn()

    render(<SearchFiltersHarness onQuery={onQuery} onCategory={vi.fn()} />)

    const input = screen.getByLabelText('Buscar productos')
    await user.type(input, 'taladro')

    expect(onQuery).toHaveBeenCalled()
    expect(onQuery).toHaveBeenLastCalledWith('taladro')
    expect(input).toHaveValue('taladro')
  })

  it('notifica la categoría elegida con onCategory al pulsar un chip', async () => {
    const user = userEvent.setup()
    const onCategory = vi.fn()

    render(<SearchFiltersHarness onQuery={vi.fn()} onCategory={onCategory} />)

    await user.click(screen.getByRole('button', { name: 'Cocina' }))

    expect(onCategory).toHaveBeenCalledWith('Cocina')
    expect(screen.getByRole('button', { name: 'Cocina' })).toHaveClass('is-active')
  })

  it('ofrece el chip Todas para limpiar la categoría', async () => {
    const user = userEvent.setup()
    const onCategory = vi.fn()

    render(<SearchFiltersHarness onQuery={vi.fn()} onCategory={onCategory} />)

    await user.click(screen.getByRole('button', { name: 'Todas' }))

    expect(onCategory).toHaveBeenCalledWith('todas')
  })

  it('muestra el contador de referencias con relleno de tres dígitos', () => {
    render(<SearchFiltersHarness onQuery={vi.fn()} onCategory={vi.fn()} resultCount={7} />)

    const count = screen.getByText('007 refs')
    expect(count).toHaveAttribute('aria-live', 'polite')
  })

  it('sin resultados muestra 000 refs', () => {
    render(
      <SearchFiltersHarness onQuery={vi.fn()} onCategory={vi.fn()} resultCount={0} />
    )

    expect(screen.getByText('000 refs')).toBeInTheDocument()
  })
})
