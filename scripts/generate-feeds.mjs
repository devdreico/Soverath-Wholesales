#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { products } from '../src/data/products.js'
import { buildFeeds, DEFAULT_BASE_URL, FEED_FILES, missingStoreSlugs } from '../src/lib/feeds.js'

const USAGE = `Uso: node scripts/generate-feeds.mjs [--out <dir>] [--base-url <url>]

Genera google-merchant.csv, meta-catalog.csv, whatsapp-catalog.csv y
mercadolibre.json en el directorio de salida (por defecto feeds/).
`

const fail = (message) => {
  const error = new Error(message)
  error.expected = true
  throw error
}

const parseArgs = (argv) => {
  const args = { out: 'feeds', baseUrl: DEFAULT_BASE_URL, help: false }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') args.help = true
    else if (arg === '--out') args.out = argv[(i += 1)] ?? ''
    else if (arg.startsWith('--out=')) args.out = arg.slice('--out='.length)
    else if (arg === '--base-url') args.baseUrl = argv[(i += 1)] ?? ''
    else if (arg.startsWith('--base-url=')) args.baseUrl = arg.slice('--base-url='.length)
    else fail(`opción desconocida: ${arg}`)
  }

  if (!args.out) fail('--out requiere un directorio')
  if (!/^https?:\/\//.test(args.baseUrl)) fail(`--base-url debe ser una URL http(s): ${args.baseUrl}`)
  args.baseUrl = args.baseUrl.replace(/\/+$/, '')
  return args
}

const loadStores = () => {
  const path = new URL('../src/data/stores.meta.json', import.meta.url)
  let parsed
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    fail(`no se pudo leer stores.meta.json: ${error.message}`)
  }
  if (!Array.isArray(parsed) || parsed.length === 0) fail('stores.meta.json está vacío')
  return parsed
}

const firstLine = (content) => content.split(/\r?\n/, 1)[0]
const jsonHeader = (content) => Object.keys(JSON.parse(content)[0] ?? {}).join(',')

const main = () => {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log(USAGE)
    return
  }

  const stores = loadStores()
  const missing = missingStoreSlugs(products, stores)
  if (missing.length > 0) {
    fail(
      `storeSlug sin tienda en stores.meta.json: ${missing.join(', ')}. ` +
        'Sincroniza src/data/stores.meta.json con src/data/stores.jsx.',
    )
  }

  const feeds = buildFeeds(products, stores, { baseUrl: args.baseUrl })
  const outDir = resolve(args.out)
  mkdirSync(outDir, { recursive: true })

  console.log(
    `feeds: ${products.length} productos · ${stores.length} tiendas · base ${args.baseUrl} → ${args.out}/`,
  )
  for (const file of FEED_FILES) {
    writeFileSync(join(outDir, file), feeds[file], 'utf8')
    const header = file.endsWith('.json') ? jsonHeader(feeds[file]) : firstLine(feeds[file])
    console.log(`  · ${file} → ${header}`)
  }
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
