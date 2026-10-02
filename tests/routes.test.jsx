import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from './helpers.jsx'

describe('Integración de rutas', () => {
  it('la raíz pinta la portada con las 22 tarjetas del directorio', () => {
    const { container } = renderApp('/')

    expect(container.querySelectorAll('.stores__cell')).toHaveLength(22)
    expect(screen.getByText('Veintidós tiendas, un mismo gateway')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Entrar a la sala de productos/ })
    ).toHaveAttribute('href', '/productos')
  })

  it('/productos pinta el catálogo de mayoreo', () => {
    renderApp('/productos')

    expect(
      screen.getByRole('heading', { name: 'Catálogo de mayoreo' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Buscar productos')).toBeInTheDocument()
  })

  it('/tienda/ferreza pinta la ficha de la tienda con su catálogo', () => {
    renderApp('/tienda/ferreza')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ferreza')
    expect(screen.getByText('Taladro percutor 750 W')).toBeInTheDocument()
    expect(document.querySelector('.domain-badge')).toHaveTextContent(
      'ferreza.presentto.online'
    )
  })

  it('/tienda/inexistente cae en el 404', () => {
    renderApp('/tienda/inexistente')

    expect(
      screen.getByRole('heading', { name: 'Nodo fuera de cobertura' })
    ).toBeInTheDocument()
  })

  it('/cualquiera cae en el 404', () => {
    renderApp('/cualquiera')

    expect(
      screen.getByRole('heading', { name: 'Nodo fuera de cobertura' })
    ).toBeInTheDocument()
    expect(screen.getByText('error 404')).toBeInTheDocument()
  })
})
