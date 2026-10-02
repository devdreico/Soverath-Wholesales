import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ChannelActions from './ChannelActions.jsx'
import { products } from '../data/products.js'
import { getStore } from '../data/stores.jsx'

const product = products[0]
const store = getStore(product.storeSlug)

const renderCtas = (props) =>
  render(
    <MemoryRouter>
      <ChannelActions {...props} />
    </MemoryRouter>
  )

describe('ChannelActions', () => {
  it('pinta el CTA de WhatsApp con atribución ch y target _blank', () => {
    renderCtas({ product, store })

    const link = screen.getByRole('link', { name: /whatsapp/i })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link.getAttribute('href')).toContain('wa.me')
    expect(link.getAttribute('href')).toContain('ch=whatsapp')
    expect(link.getAttribute('href')).toContain(`utm_campaign=producto-${product.sku}`)
  })

  it('excluye el canal web por defecto', () => {
    renderCtas({ product, store })

    expect(screen.queryByRole('link', { name: /portal/i })).toBeNull()
    expect(screen.getByRole('navigation', { name: 'Comprar por canal' })).toBeInTheDocument()
  })

  it('no pinta nada si todos los canales relevantes están deshabilitados', () => {
    const { container } = renderCtas({ product, store, exclude: ['web', 'whatsapp'] })

    expect(container.querySelector('.channel-ctas')).toBeNull()
  })

  it('usa el aria-label personalizado en el hero de tienda', () => {
    renderCtas({ store, label: 'Cotizar por canal' })

    expect(screen.getByRole('navigation', { name: 'Cotizar por canal' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /whatsapp/i }).getAttribute('href')).toContain(
      'utm_campaign=tienda'
    )
  })
})
