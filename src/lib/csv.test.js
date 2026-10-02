import { describe, expect, it } from 'vitest'
import { escapeCsvValue, parseCsv, parseCsvRecords, toCsv } from './csv.js'

describe('parseCsv', () => {
  it('parsea comillas, comas internas, CRLF y comillas escapadas', () => {
    const text = 'sku,nombre\r\n"BT-SUP-014","Omega 3, 60 cápsulas"\r\n"X","Dijo ""hola"""\r\n'
    expect(parseCsv(text)).toEqual([
      ['sku', 'nombre'],
      ['BT-SUP-014', 'Omega 3, 60 cápsulas'],
      ['X', 'Dijo "hola"'],
    ])
  })

  it('respeta saltos de línea dentro de campos entrecomillados', () => {
    const text = 'a,b\n"1\n2",x\n'
    expect(parseCsv(text)).toEqual([
      ['a', 'b'],
      ['1\n2', 'x'],
    ])
  })

  it('omite líneas vacías y tolera BOM', () => {
    const text = '\uFEFFa,b\n\n\n1,2\n'
    expect(parseCsv(text)).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('lanza error si hay una comilla sin cerrar', () => {
    expect(() => parseCsv('a\n"sin cerrar')).toThrow(/comilla sin cerrar/)
  })
})

describe('parseCsvRecords', () => {
  it('mapea cabecera a objetos conservando los valores en bruto', () => {
    const records = parseCsvRecords('sku, stock\nBT-1, 10\nBT-2,\n')
    expect(records).toEqual([
      { sku: 'BT-1', stock: ' 10' },
      { sku: 'BT-2', stock: '' },
    ])
  })

  it('lanza error sin cabecera', () => {
    expect(() => parseCsvRecords('')).toThrow(/cabecera/)
  })
})

describe('toCsv / escapeCsvValue', () => {
  it('escapa comillas, comas y saltos de línea', () => {
    expect(escapeCsvValue('a,b')).toBe('"a,b"')
    expect(escapeCsvValue('say "hi"')).toBe('"say ""hi"""')
    expect(escapeCsvValue('line1\nline2')).toBe('"line1\nline2"')
    expect(escapeCsvValue(null)).toBe('')
    expect(escapeCsvValue(12.5)).toBe('12.5')
  })

  it('hace round-trip con parseCsv', () => {
    const rows = [
      ['sku', 'nombre'],
      ['BT-SUP-014', 'Omega 3, "wild"'],
      ['OF-PAPEL-005', 'Resma\nA70'],
    ]
    expect(parseCsv(toCsv(rows))).toEqual(rows)
  })
})
