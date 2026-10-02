import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Nav from './Nav.jsx'
import { stores } from '../data/stores.jsx'

const renderNav = () =>
  render(
    <MemoryRouter>
      <Nav />
    </MemoryRouter>
  )

describe('Nav', () => {
  it('renderiza los tres enlaces principales', () => {
    renderNav()

    expect(screen.getByRole('link', { name: 'Índice' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Productos' })).toHaveAttribute(
      'href',
      '/productos'
    )
    expect(screen.getByRole('button', { name: 'Tiendas' })).toBeInTheDocument()
  })

  it('lista las 22 tiendas dentro del desplegable', () => {
    renderNav()

    const dropdown = document.getElementById('nav-stores')
    const links = within(dropdown).getAllByRole('link')

    expect(links).toHaveLength(stores.length)
    expect(links).toHaveLength(22)
    expect(
      within(dropdown).getByRole('link', { name: /Ferreza/ })
    ).toHaveAttribute('href', '/tienda/ferreza')
  })

  it('expande y pliega el desplegable de tiendas con aria-expanded', async () => {
    const user = userEvent.setup()
    renderNav()

    const toggle = screen.getByRole('button', { name: 'Tiendas' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('expone el contador de nodos activos', () => {
    renderNav()

    expect(screen.getByText('22 nodos activos')).toBeInTheDocument()
  })
})
