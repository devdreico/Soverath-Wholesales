import { describe, expect, it } from 'vitest'
import { channels } from '../data/channels.js'
import { channelCta, channelCtas, getChannel, getChannels, getEnabledChannels } from './channels.js'

describe('registro de canales', () => {
  it('expone 5 canales ordenados por order', () => {
    expect(getChannels()).toHaveLength(5)
    expect(getChannels().map((channel) => channel.order)).toEqual([1, 2, 3, 4, 5])
    expect(channels).toHaveLength(5)
  })

  it('solo web y whatsapp están habilitados', () => {
    expect(getEnabledChannels().map((channel) => channel.id)).toEqual(['web', 'whatsapp'])
  })

  it('getChannel devuelve canal por id o null', () => {
    expect(getChannel('mercado')?.type).toBe('marketplace')
    expect(getChannel('inexistente')).toBeNull()
  })

  it('todos los canales cumplen el contrato', () => {
    for (const channel of getChannels()) {
      expect(channel).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        url: expect.any(String),
        commissionPct: expect.any(Number),
        enabled: expect.any(Boolean),
        ctaLabel: expect.any(String),
        order: expect.any(Number),
      })
      expect(['web', 'whatsapp', 'marketplace', 'fisico']).toContain(channel.type)
    }
  })
})

describe('channelCta', () => {
  const product = { sku: 'BT-SUP-014', name: 'Omega 3 Wild — 60 cápsulas' }
  const store = { slug: 'botane', name: 'Botane' }

  it('construye la URL con atribución para producto y tienda', () => {
    const cta = channelCta(getChannel('web'), { product, store })
    const params = new URLSearchParams(cta.href.split('?')[1])
    expect(cta.href.startsWith('https://soverath.presentto.online?')).toBe(true)
    expect(params.get('ch')).toBe('web')
    expect(params.get('utm_medium')).toBe('web')
    expect(params.get('utm_campaign')).toBe('producto-BT-SUP-014')
    expect(params.get('utm_content')).toBe('BT-SUP-014')
    expect(cta.label).toBe('Comprar en el portal')
    expect(cta.external).toBe(true)
  })

  it('en WhatsApp añade el mensaje de cotización', () => {
    const cta = channelCta(getChannel('whatsapp'), { product, store })
    const params = new URLSearchParams(cta.href.split('?')[1])
    expect(params.get('text')).toContain('Omega 3 Wild')
    expect(params.get('text')).toContain('BT-SUP-014')
    expect(params.get('ch')).toBe('whatsapp')
  })

  it('devuelve null para canales sin URL o deshabilitados', () => {
    expect(channelCta(getChannel('mercado'))).toBeNull()
    expect(channelCta(getChannel('fisico'), { store })).toBeNull()
    expect(channelCta(null)).toBeNull()
    expect(channelCta({ ...getChannel('web'), enabled: false })).toBeNull()
  })

  it('channelCtas solo devuelve CTAs accionables', () => {
    const ctas = channelCtas({ product, store })
    expect(ctas.map((cta) => cta.channel)).toEqual(['web', 'whatsapp'])
    for (const cta of ctas) expect(cta.href).toMatch(/^https:\/\//)
  })

  it('campaña por tienda cuando no hay producto', () => {
    const params = new URLSearchParams(channelCta(getChannel('web'), { store }).href.split('?')[1])
    expect(params.get('utm_campaign')).toBe('tienda-botane')
    expect(params.get('utm_content')).toBe('botane')
  })
})
