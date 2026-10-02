import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderApp } from './helpers.jsx'

describe('Páginas de categoría', () => {
  it('/productos/ferreteria preactiva el filtro y pinta su h1', () => {
    const { container } = renderApp('/productos/ferreteria')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Mayoreo de Ferretería' })
    ).toBeInTheDocument()
    expect(screen.getByText('002 refs')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ferretería' })).toHaveClass('is-active')

    const categories = [...container.querySelectorAll('.product__category')].map(
      (node) => node.textContent
    )
    expect(categories).toHaveLength(2)
    expect(categories).toEqual(['Ferretería', 'Ferretería'])

    expect(document.title).toBe('Ferretería — mayoreo | Soverath Wholesales')
  })

  it('marca la categoría activa en la fila de enlaces del catálogo', () => {
    renderApp('/productos/ferreteria')

    const nav = screen.getByRole('navigation', { name: 'Categorías del catálogo' })
    const active = within(nav).getByRole('link', { name: 'Ferretería' })

    expect(active).toHaveAttribute('href', '/productos/ferreteria')
    expect(active).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getAllByRole('link')).toHaveLength(22)
  })

  it('un slug de categoría inexistente redirige al catálogo completo', () => {
    renderApp('/productos/no-existe')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Catálogo de mayoreo' })
    ).toBeInTheDocument()
    expect(document.title).toBe('Productos y mayoreo (1000+ referencias) | Soverath Wholesales')
  })
})
