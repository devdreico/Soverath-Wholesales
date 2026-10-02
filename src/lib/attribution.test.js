import { describe, expect, it } from 'vitest'
import { parseAttribution, withAttribution } from './attribution.js'

describe('withAttribution', () => {
  it('añade utm y ch preservando la query existente', () => {
    const href = withAttribution('https://ejemplo.com/tienda/ferreza?ref=erp', {
      channel: 'web',
      source: 'web',
      medium: 'boton',
      campaign: 'mayoreo',
      content: 'FZ-HRR-203',
    })
    const params = new URLSearchParams(href.split('?')[1])
    expect(href.startsWith('https://ejemplo.com/tienda/ferreza?')).toBe(true)
    expect(params.get('ref')).toBe('erp')
    expect(params.get('ch')).toBe('web')
    expect(params.get('utm_source')).toBe('web')
    expect(params.get('utm_medium')).toBe('boton')
    expect(params.get('utm_campaign')).toBe('mayoreo')
    expect(params.get('utm_content')).toBe('FZ-HRR-203')
  })

  it('sobrescribe atribución previa sin duplicar parámetros', () => {
    const first = withAttribution('https://ejemplo.com/?ch=web&utm_source=web', { channel: 'whatsapp' })
    expect(first.match(/ch=/g)).toHaveLength(1)
    expect(new URLSearchParams(first.split('?')[1]).get('ch')).toBe('whatsapp')
    expect(new URLSearchParams(first.split('?')[1]).get('utm_source')).toBeNull()
  })

  it('preserva el fragmento y omite valores vacíos', () => {
    const href = withAttribution('https://ejemplo.com/#seccion', { channel: 'web', medium: '' })
    expect(href).toBe('https://ejemplo.com/?ch=web#seccion')
  })

  it('lanza error con URL vacía', () => {
    expect(() => withAttribution('', { channel: 'web' })).toThrow(/URL/)
  })
})

describe('parseAttribution', () => {
  it('lee la atribución generada (round-trip)', () => {
    const href = withAttribution('https://ejemplo.com/tienda/botane', {
      channel: 'whatsapp',
      source: 'whatsapp',
      medium: 'whatsapp',
      campaign: 'tienda-botane',
      content: 'BT-SUP-014',
    })
    expect(parseAttribution(`?${href.split('?')[1]}`)).toEqual({
      channel: 'whatsapp',
      source: 'whatsapp',
      medium: 'whatsapp',
      campaign: 'tienda-botane',
      content: 'BT-SUP-014',
    })
  })

  it('devuelve null en campos ausentes y acepta search sin interrogación', () => {
    expect(parseAttribution('utm_source=boletin')).toEqual({
      channel: null,
      source: 'boletin',
      medium: null,
      campaign: null,
      content: null,
    })
    expect(parseAttribution('').channel).toBeNull()
  })
})
