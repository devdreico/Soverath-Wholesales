import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import StoreCard from './StoreCard.jsx'
import { stores } from '../data/stores.jsx'

const ferreza = stores.find((store) => store.slug === 'ferreza')

const renderCard = () =>
  render(
    <MemoryRouter>
      <StoreCard store={ferreza} index={5} />
    </MemoryRouter>
  )

describe('StoreCard', () => {
  it('enlaza al apartado interno de la tienda', () => {
    renderCard()

    const internal = screen.getByRole('link', {
      name: 'Abrir el apartado de Ferreza en el portal',
    })

    expect(internal).toHaveAttribute('href', '/tienda/ferreza')
  })

  it('abre el enlace externo en una pestaña nueva con noopener', () => {
    renderCard()

    const external = screen.getByRole('link', {
      name: 'Visitar el sitio externo de Ferreza',
    })

    expect(external).toHaveAttribute('href', 'https://ferreza.presentto.online')
    expect(external).toHaveAttribute('target', '_blank')
    expect(external.getAttribute('rel')).toContain('noopener')
    expect(external.getAttribute('aria-label')).toContain('Ferreza')
  })

  it('expone el acento del nodo como custom property --accent', () => {
    const { container } = renderCard()

    const card = container.querySelector('article.card')
    expect(card).not.toBeNull()
    expect(card.style.getPropertyValue('--accent').trim()).toBe(ferreza.accent)
  })

  it('muestra el slug, la categoría y el subdominio del nodo', () => {
    renderCard()

    expect(screen.getByText('ferreza')).toBeInTheDocument()
    expect(screen.getByText('Ferretería')).toBeInTheDocument()
    expect(screen.getByText('ferreza.presentto.online')).toBeInTheDocument()
  })
})
