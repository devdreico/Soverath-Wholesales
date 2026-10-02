import { describe, expect, it } from 'vitest'
import { formatMoney, channelPrice, quote, tierPrice } from './pricing.js'

const TIERS = [
  { from: 1, to: 10, price: 10 },
  { from: 11, to: 50, discountPct: 10 },
  { from: 51, price: 8 },
]

describe('tierPrice', () => {
  it('sin tramos devuelve el precio base', () => {
    expect(tierPrice(20, [], 5)).toBe(20)
    expect(tierPrice(20, undefined, 5)).toBe(20)
  })

  it('respeta los límites inclusivos de cada escalón', () => {
    expect(tierPrice(12, TIERS, 1)).toBe(10)
    expect(tierPrice(12, TIERS, 10)).toBe(10)
    expect(tierPrice(12, TIERS, 11)).toBe(10.8)
    expect(tierPrice(12, TIERS, 50)).toBe(10.8)
    expect(tierPrice(12, TIERS, 51)).toBe(8)
  })

  it('qty fuera de tramo (hueco o por encima) cae al precio base', () => {
    const gaps = [
      { from: 1, to: 10, price: 9 },
      { from: 21, to: 30, price: 7 },
    ]
    expect(tierPrice(12, gaps, 15)).toBe(12)
    expect(tierPrice(12, gaps, 40)).toBe(12)
    expect(tierPrice(12, gaps, 0.5)).toBe(9)
  })

  it('clampea qty < 1 a un solo escalón (documentado)', () => {
    expect(tierPrice(12, TIERS, 0)).toBe(10)
    expect(tierPrice(12, TIERS, -7)).toBe(10)
  })

  it('price absoluto tiene prioridad sobre discountPct y no baja de 0', () => {
    const tiers = [{ from: 1, price: 15, discountPct: 50 }]
    expect(tierPrice(30, tiers, 3)).toBe(15)
    expect(tierPrice(30, [{ from: 1, discountPct: 150 }], 3)).toBe(0)
  })

  it('rechaza precios base inválidos', () => {
    expect(() => tierPrice(-1, TIERS, 3)).toThrow(/basePrice/)
    expect(() => tierPrice(Number.NaN, TIERS, 3)).toThrow(/basePrice/)
  })
})

describe('channelPrice', () => {
  it('aplica factor, comisión y fee fija', () => {
    expect(channelPrice(100, { commissionPct: 16 })).toBe(84)
    expect(channelPrice(100, { factor: 1.1, commissionPct: 10, feeFlat: 4 })).toBe(95)
    expect(channelPrice(100)).toBe(100)
  })

  it('nunca devuelve negativos', () => {
    expect(channelPrice(10, { commissionPct: 60, feeFlat: 100 })).toBe(0)
  })
})

describe('quote', () => {
  it('canal sin comisión y con margen suficiente no bloquea', () => {
    const result = quote({
      basePrice: 20,
      qty: 30,
      tiers: TIERS,
      channel: { id: 'web', name: 'Portal', commissionPct: 0 },
      minMarginPct: 20,
      cost: 6,
    })
    expect(result.unitPrice).toBe(18)
    expect(result.channelPrice).toBe(18)
    expect(result.total).toBe(540)
    expect(result.marginPct).toBe(66.67)
    expect(result.marginAfterFeePct).toBe(66.67)
    expect(result.blocked).toBe(false)
    expect(result.reason).toBeNull()
  })

  it('canal con comisión alta bloquea con motivo en español', () => {
    const result = quote({
      basePrice: 20,
      qty: 1,
      channel: { id: 'mercado', name: 'Mercado Libre', commissionPct: 40 },
      minMarginPct: 30,
      cost: 9,
    })
    expect(result.channelPrice).toBe(12)
    expect(result.blocked).toBe(true)
    expect(result.reason).toMatch(/Margen tras comisión/)
    expect(result.marginAfterFeePct).toBeLessThan(30)
  })

  it('bloquea si falta el cost y hay margen mínimo exigido', () => {
    const result = quote({
      basePrice: 20,
      qty: 2,
      channel: { id: 'web', commissionPct: 3 },
      minMarginPct: 15,
    })
    expect(result.blocked).toBe(true)
    expect(result.reason).toMatch(/Falta el costo/)
    expect(result.marginPct).toBeNull()
    expect(result.marginAfterFeePct).toBeNull()
  })

  it('sin cost ni margen mínimo se cotiza sin bloquear', () => {
    const result = quote({ basePrice: 20, qty: 2, channel: { id: 'web' } })
    expect(result.blocked).toBe(false)
    expect(result.marginPct).toBeNull()
  })

  it('bloquea canales deshabilitados', () => {
    const result = quote({
      basePrice: 20,
      qty: 1,
      channel: { id: 'fisico', name: 'Mostrador', enabled: false, commissionPct: 0 },
      cost: 5,
      minMarginPct: 10,
    })
    expect(result.blocked).toBe(true)
    expect(result.reason).toMatch(/deshabilitado/)
  })

  it('qty 0 o negativa lanza un error claro', () => {
    expect(() => quote({ basePrice: 20, qty: 0 })).toThrow(/qty/)
    expect(() => quote({ basePrice: 20, qty: -3 })).toThrow(/qty/)
  })

  it('formatMoney delega en formatPrice del catálogo', () => {
    expect(formatMoney(18.9)).toBe('$18,90')
    expect(formatMoney(120)).toBe('$120')
    expect(formatMoney('41.55')).toBe('$41,55')
  })
})
