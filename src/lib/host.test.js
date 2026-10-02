import { describe, it, expect } from 'vitest'
import { nodeSlugFromHost } from './host.js'

const nodes = [
  { slug: 'botane', subdomain: 'botane.presentto.online' },
  { slug: 'ferreza', subdomain: 'ferreza.presentto.online' },
]

describe('nodeSlugFromHost', () => {
  it('devuelve el slug cuando el hostname coincide con el subdominio y la ruta es /', () => {
    expect(nodeSlugFromHost(nodes, 'botane.presentto.online', '/')).toBe('botane')
    expect(nodeSlugFromHost(nodes, 'ferreza.presentto.online', '/')).toBe('ferreza')
  })

  it('ignora mayúsculas en el hostname', () => {
    expect(nodeSlugFromHost(nodes, 'Botane.Presentto.Online', '/')).toBe('botane')
  })

  it('devuelve null cuando la ruta no es la raíz', () => {
    expect(nodeSlugFromHost(nodes, 'botane.presentto.online', '/productos')).toBeNull()
    expect(nodeSlugFromHost(nodes, 'botane.presentto.online', '/tienda/botane')).toBeNull()
  })

  it('devuelve null cuando el hostname no pertenece a ningún nodo', () => {
    expect(nodeSlugFromHost(nodes, 'localhost', '/')).toBeNull()
    expect(nodeSlugFromHost(nodes, 'soverath.presentto.online', '/')).toBeNull()
  })

  it('devuelve null con entradas incompletas', () => {
    expect(nodeSlugFromHost(nodes, '', '/')).toBeNull()
    expect(nodeSlugFromHost(nodes, null, '/')).toBeNull()
    expect(nodeSlugFromHost([], 'botane.presentto.online', '/')).toBeNull()
  })
})
