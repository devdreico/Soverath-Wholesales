/**
 * Utilidades CSV sin dependencias externas.
 *
 * Soporta comillas dobles, comillas escapadas (""), delimitadores dentro de
 * campos, saltos de línea CRLF/LF y BOM. El serializer garantiza round-trip.
 *
 * @typedef {Object} CsvOptions
 * @property {string} [delimiter] Carácter separador (por defecto ",").
 * @property {boolean} [skipEmptyLines] Omite filas totalmente vacías (true).
 */

/**
 * Parsea un texto CSV en filas de campos.
 * @param {string} text
 * @param {CsvOptions} [options]
 * @returns {string[][]}
 */
export function parseCsv(text, { delimiter = ',', skipEmptyLines = true } = {}) {
  if (typeof text !== 'string') throw new TypeError('parseCsv: se esperaba un texto')

  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let closedQuote = false

  const pushField = () => {
    row.push(field)
    field = ''
    closedQuote = false
  }
  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }

  for (let i = 0; i < src.length; i += 1) {
    const char = src[i]

    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
          closedQuote = true
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"' && field === '') {
      inQuotes = true
      continue
    }
    if (char === delimiter) {
      pushField()
      continue
    }
    if (char === '\r') {
      if (src[i + 1] === '\n') i += 1
      pushRow()
      continue
    }
    if (char === '\n') {
      pushRow()
      continue
    }

    field += char
    closedQuote = false
  }

  if (inQuotes) {
    throw new SyntaxError('parseCsv: comilla sin cerrar al final del archivo')
  }
  if (field !== '' || row.length > 0 || closedQuote) pushRow()

  if (!skipEmptyLines) return rows
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''))
}

/**
 * Parsea un CSV con cabecera y devuelve objetos por fila.
 * @param {string} text
 * @param {CsvOptions} [options]
 * @returns {Record<string, string>[]}
 */
export function parseCsvRecords(text, options = {}) {
  const [header, ...rows] = parseCsv(text, options)
  if (!header) throw new SyntaxError('parseCsvRecords: el archivo no tiene cabecera')
  const keys = header.map((key) => key.trim())

  return rows.map((row) => {
    const record = {}
    keys.forEach((key, index) => {
      record[key] = row[index] ?? ''
    })
    return record
  })
}

/**
 * Escapa un valor para uso seguro dentro de una fila CSV.
 * @param {unknown} value
 * @param {string} [delimiter]
 * @returns {string}
 */
export function escapeCsvValue(value, delimiter = ',') {
  const text = value === null || value === undefined ? '' : String(value)
  const needsQuotes =
    text.includes('"') ||
    text.includes(delimiter) ||
    text.includes('\n') ||
    text.includes('\r')
  return needsQuotes ? `"${text.replaceAll('"', '""')}"` : text
}

/**
 * Serializa filas a texto CSV con escaping correcto.
 * @param {unknown[][]} rows
 * @param {{delimiter?: string, eol?: string, bom?: boolean}} [options]
 * @returns {string}
 */
export function toCsv(rows, { delimiter = ',', eol = '\r\n', bom = false } = {}) {
  const body = rows
    .map((row) => row.map((cell) => escapeCsvValue(cell, delimiter)).join(delimiter))
    .join(eol)
  return `${bom ? '﻿' : ''}${body}${rows.length ? eol : ''}`
}
