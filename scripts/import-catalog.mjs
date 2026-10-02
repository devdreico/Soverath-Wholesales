#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { parseCsvRecords } from '../src/lib/csv.js'

const REQUIRED_COLUMNS = ['sku', 'nombre', 'categoria', 'costo', 'precio', 'stock', 'proveedor', 'peso']
const NUMERIC_COLUMNS = ['costo', 'precio', 'stock', 'peso']
const TRUE_VALUES = new Set(['1', 'true', 'si', 'sí', 'yes', 'y', 'on'])
const FALSE_VALUES = new Set(['0', 'false', 'no', 'n', 'off', ''])
const USAGE = `Uso: node scripts/import-catalog.mjs [ruta.csv] [--dry-run] [--channels <canales.csv>] [--out <destino.js>]

Genera src/data/catalog.generated.js desde un CSV de catálogo.
Columnas requeridas: ${REQUIRED_COLUMNS.join(',')}
`

/**
 * Marca errores de validación esperados (se imprimen sin stack y salen con 1).
 * @param {string} message
 * @returns {never}
 */
const fail = (message) => {
  const error = new Error(message)
  error.expected = true
  throw error
}

/**
 * @param {string[]} argv
 * @returns {{input: string, dryRun: boolean, channels: string|null, out: string, help: boolean}}
 */
const parseArgs = (argv) => {
  const args = {
    input: 'data/catalog.csv',
    dryRun: false,
    channels: null,
    out: 'src/data/catalog.generated.js',
    help: false,
    positionals: 0,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--help' || arg === '-h') args.help = true
    else if (arg === '--channels') args.channels = argv[(i += 1)] ?? ''
    else if (arg.startsWith('--channels=')) args.channels = arg.slice('--channels='.length)
    else if (arg === '--out') args.out = argv[(i += 1)] ?? ''
    else if (arg.startsWith('--out=')) args.out = arg.slice('--out='.length)
    else if (arg.startsWith('--')) fail(`opción desconocida: ${arg}`)
    else {
      args.positionals += 1
      args.input = arg
    }
  }

  if (args.positionals > 1) fail('se esperaba una sola ruta de entrada')
  if (!args.channels) args.channels = null
  if (!args.out) fail('--out requiere una ruta')
  return args
}

const toNumber = (value, column, rowNumber) => {
  const text = String(value ?? '').trim()
  if (text === '') fail(`fila ${rowNumber}: la columna "${column}" está vacía`)
  const parsed = Number(text.replace(',', '.'))
  if (!Number.isFinite(parsed)) fail(`fila ${rowNumber}: "${text}" no es un número válido en "${column}"`)
  return parsed
}

const toBoolean = (value, channel, rowNumber) => {
  const text = String(value ?? '').trim().toLowerCase()
  if (TRUE_VALUES.has(text)) return true
  if (FALSE_VALUES.has(text)) return false
  return fail(`fila ${rowNumber}: valor "${value}" no reconocido para el canal "${channel}" (usa si/no)`)
}

const readRecords = (path, label) => {
  if (!existsSync(path)) fail(`no existe el archivo ${label}: ${path}`)
  return parseCsvRecords(readFileSync(path, 'utf8'))
}

const validateHeader = (records, path) => {
  if (records.length === 0) fail(`el archivo ${path} está vacío`)
  const header = Object.keys(records[0]).map((key) => key.trim())
  const missing = REQUIRED_COLUMNS.filter((column) => !header.includes(column))
  if (missing.length > 0) {
    fail(
      `columnas requeridas faltantes en ${path}: ${missing.join(',')}\n  cabecera encontrada: ${header.join(',')}`,
    )
  }
  return header
}

const mergeChannels = (rows, channelsPath, header) => {
  const extra = header.filter((column) => !REQUIRED_COLUMNS.includes(column))
  if (extra.length > 0) console.warn(`aviso: columnas extra ignoradas en el catálogo: ${extra.join(',')}`)
  if (!channelsPath) return rows
  if (!existsSync(channelsPath)) {
    console.warn(`aviso: no se encontró ${channelsPath}; se omite la disponibilidad por canal`)
    return rows
  }

  const records = readRecords(channelsPath, 'archivo de canales')
  const channelColumns = Object.keys(records[0]).filter((key) => key.trim().toLowerCase() !== 'sku')
  if (channelColumns.length === 0) fail(`${channelsPath} no tiene columnas de canal además de "sku"`)

  const bySku = new Map(
    records.map((record) => [String(record.sku ?? '').trim().toUpperCase(), record]),
  )

  return rows.map((row, index) => {
    const record = bySku.get(row.sku.toUpperCase())
    if (!record) return row
    const channels = {}
    for (const column of channelColumns) {
      channels[column.trim()] = toBoolean(record[column], column.trim(), index + 2)
    }
    return { ...row, channels }
  })
}

const normalizeRows = (path, channelsPath) => {
  const records = readRecords(path, 'catálogo')
  const header = validateHeader(records, path)
  const errors = []
  const seen = new Map()

  const rows = records.map((record, index) => {
    const rowNumber = index + 2
    const row = {}
    for (const column of REQUIRED_COLUMNS) row[column] = String(record[column] ?? '').trim()

    if (row.sku === '') errors.push(`fila ${rowNumber}: SKU vacío`)
    if (row.nombre === '') errors.push(`fila ${rowNumber}: nombre vacío`)
    if (row.categoria === '') errors.push(`fila ${rowNumber}: categoría vacía`)
    if (row.proveedor === '') errors.push(`fila ${rowNumber}: proveedor vacío`)

    const key = row.sku.toUpperCase()
    if (key !== '') {
      if (seen.has(key)) errors.push(`SKU duplicado: ${row.sku} (filas ${seen.get(key)} y ${rowNumber})`)
      else seen.set(key, rowNumber)
    }

    for (const column of NUMERIC_COLUMNS) {
      try {
        row[column] = toNumber(record[column], column, rowNumber)
      } catch (error) {
        errors.push(error.message)
        row[column] = Number.NaN
      }
    }

    if (Number.isFinite(row.precio) && row.precio <= 0) {
      errors.push(`fila ${rowNumber}: precio debe ser mayor que 0`)
    }
    if (Number.isFinite(row.costo) && row.costo < 0) {
      errors.push(`fila ${rowNumber}: costo no puede ser negativo`)
    }
    if (Number.isFinite(row.stock) && (row.stock < 0 || !Number.isInteger(row.stock))) {
      errors.push(`fila ${rowNumber}: stock debe ser un entero mayor o igual a 0`)
    }
    if (Number.isFinite(row.peso) && row.peso < 0) {
      errors.push(`fila ${rowNumber}: peso no puede ser negativo`)
    }

    return row
  })

  if (errors.length > 0) {
    fail(`importación inválida (${path}):\n${errors.map((message) => `  · ${message}`).join('\n')}`)
  }
  if (rows.length === 0) fail(`${path} no contiene filas de datos`)

  return mergeChannels(rows, channelsPath, header)
}

/**
 * Construye el código de src/data/catalog.generated.js.
 * @param {Record<string, any>[]} rows
 * @param {string} source
 * @returns {string}
 */
const buildModule = (rows, source) => {
  const items = rows.map((row) => {
    const item = {
      sku: row.sku,
      nombre: row.nombre,
      categoria: row.categoria,
      costo: row.costo,
      precio: row.precio,
      stock: row.stock,
      proveedor: row.proveedor,
      peso: row.peso,
    }
    if (row.channels) item.channels = row.channels
    return item
  })

  const meta = { count: items.length, importedAt: new Date().toISOString(), source }
  const body = items
    .map((item) => `  ${JSON.stringify(item, null, 2).split('\n').join('\n  ')}`)
    .join(',\n')

  return [
    '/**',
    ' * Generado por scripts/import-catalog.mjs — no editar a mano.',
    ' * Vuelve a ejecutar `npm run catalog:import` tras cada volcado del ERP.',
    ' * @type {Array<{sku: string, nombre: string, categoria: string, costo: number,',
    ' *   precio: number, stock: number, proveedor: string, peso: number,',
    ' *   channels?: Record<string, boolean>}>>',
    ' */',
    `export const catalogGenerated = [\n${body},\n]`,
    '',
    '/** Metadatos del último volcado. @type {{count: number, importedAt: string, source: string}} */',
    `export const catalogMeta = ${JSON.stringify(meta, null, 2)}`,
    '',
  ].join('\n')
}

const main = () => {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log(USAGE)
    return
  }

  const rows = normalizeRows(args.input, args.channels)
  const source = args.input.replaceAll('\\', '/')

  console.log(`catálogo válido: ${rows.length} productos · columnas: ${REQUIRED_COLUMNS.join(',')}`)
  if (args.channels) {
    const withChannels = rows.filter((row) => row.channels).length
    console.log(`disponibilidad por canal: ${withChannels}/${rows.length} productos desde ${args.channels}`)
  }

  if (args.dryRun) {
    console.log(`dry-run: no se escribió nada (destino sería ${args.out})`)
    return
  }

  mkdirSync(dirname(resolve(args.out)), { recursive: true })
  writeFileSync(args.out, buildModule(rows, source), 'utf8')
  console.log(`✓ ${rows.length} productos → ${args.out}`)
}

try {
  main()
} catch (error) {
  if (error.expected) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
  throw error
}
