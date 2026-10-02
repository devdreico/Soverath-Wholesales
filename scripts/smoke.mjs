import { spawnSync } from 'node:child_process'
import { JSDOM } from 'jsdom'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const DIST = resolve(import.meta.dirname, '../dist')
const bundle = readdirSync(resolve(DIST, 'assets')).find((f) => f.endsWith('.js'))

const wait = (ms) => new Promise((res) => setTimeout(res, ms))

function createWindow(url) {
  const dom = new JSDOM(
    '<!doctype html><html><head><link rel="canonical" href=""></head><body><div id="root"></div></body></html>',
    { url, pretendToBeVisual: true }
  )
  const { window } = dom

  window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  })
  window.IntersectionObserver = class {
    constructor(cb) {
      this.cb = cb
    }
    observe(el) {
      this.cb([{ isIntersecting: true, target: el }])
    }
    disconnect() {}
    unobserve() {}
  }
  window.scrollTo = () => {}
  window.fetch = () => Promise.resolve({ ok: true, status: 200, text: async () => '' })
  window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0)
  window.cancelAnimationFrame = (id) => clearTimeout(id)

  for (const key of [
    'window',
    'document',
    'navigator',
    'location',
    'history',
    'HTMLElement',
    'Element',
    'Node',
    'getComputedStyle',
    'CustomEvent',
    'Event',
    'MouseEvent',
    'KeyboardEvent',
    'matchMedia',
    'IntersectionObserver',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'localStorage',
    'SVGElement',
    'MutationObserver',
    'fetch',
  ]) {
    if (window[key] === undefined) continue
    try {
      Object.defineProperty(globalThis, key, {
        value: window[key],
        configurable: true,
        writable: true,
      })
    } catch {
      /* clave no redefinible en este runtime */
    }
  }

  return dom
}

const SCENARIOS = [
  {
    label: 'portada /',
    url: 'http://soverath.presentto.online/',
    checks: [
      ['hero Soverath', (d) => d.body.innerHTML.includes('Soverath')],
      ['directorio "Veintidós tiendas"', (d) => d.body.innerHTML.includes('Veintidós tiendas')],
      ['22 tarjetas de tienda', (d) => d.querySelectorAll('.card').length === 22],
      ['CTA a sala de productos', (d) => d.body.innerHTML.includes('sala de productos')],
      ['CTA de canal en destacados', (d) => Boolean(d.querySelector('.channel-cta'))],
    ],
  },
  {
    label: 'catálogo /productos',
    url: 'http://soverath.presentto.online/productos',
    checks: [
      ['h1 Catálogo de mayoreo', (d) => d.querySelector('h1')?.textContent.includes('Catálogo')],
      ['SKU visible', (d) => d.body.innerHTML.includes('BT-SUP-014')],
      ['chips de categoría', (d) => d.querySelectorAll('.chip').length > 5],
      ['links de categoría', (d) => d.querySelectorAll('a[href^="/productos/"]').length > 0],
      ['CTA de canal con ch', (d) =>
        Boolean([...d.querySelectorAll('.channel-cta')].find((a) => a.href.includes('ch=whatsapp')))],
    ],
  },
  {
    label: 'búsqueda y filtros',
    url: 'http://soverath.presentto.online/productos',
    checks: [
      [
        'búsqueda "taladro" → 1 resultado',
        (d) => {
          const input = d.querySelector('.filters__input')
          const View = d.defaultView
          const setter = Object.getOwnPropertyDescriptor(
            Object.getPrototypeOf(input),
            'value'
          )?.set
          setter.call(input, 'taladro')
          input.dispatchEvent(new View.Event('input', { bubbles: true }))
          return d.querySelectorAll('.product').length === 1
        },
      ],
      [
        'contador refleja 001 refs',
        (d) => /\b001 refs\b/.test(d.querySelector('.filters__count')?.textContent ?? ''),
      ],
      [
        'chip de categoría aplica filtro',
        async (d) => {
          const input = d.querySelector('.filters__input')
          const View = d.defaultView
          const setter = Object.getOwnPropertyDescriptor(
            Object.getPrototypeOf(input),
            'value'
          )?.set
          setter.call(input, '')
          input.dispatchEvent(new View.Event('input', { bubbles: true }))
          const chip = [...d.querySelectorAll('.chip')].find(
            (c) => c.textContent.toLowerCase() === 'cocina'
          )
          if (!chip) return false
          chip.click()
          await wait(300)
          return (
            chip.getAttribute('aria-pressed') === 'true' &&
            d.querySelectorAll('.product').length > 0 &&
            !d.body.innerHTML.includes('Taladro percutor')
          )
        },
      ],
    ],
  },
  {
    label: 'categoría /productos/ferreteria',
    url: 'http://soverath.presentto.online/productos/ferreteria',
    checks: [
      ['h1 de categoría', (d) => d.querySelector('h1')?.textContent.toLowerCase().includes('ferreter')],
      ['producto ferretería visible', (d) => d.body.innerHTML.includes('Taladro percutor')],
      [
        'canonical de categoría',
        (d) =>
          (d.head.querySelector('link[rel="canonical"]')?.href ?? '').includes(
            '/productos/ferreteria'
          ),
      ],
    ],
  },
  {
    label: 'tienda /tienda/ferreza',
    url: 'http://soverath.presentto.online/tienda/ferreza',
    checks: [
      ['hero Ferreza', (d) => d.querySelector('h1')?.textContent.includes('Ferreza')],
      ['badge subdominio', (d) => d.body.innerHTML.includes('ferreza.presentto.online')],
      ['producto del nodo', (d) => d.body.innerHTML.includes('Taladro percutor')],
      [
        'CTA WhatsApp con atribución',
        (d) =>
          Boolean(
            [...d.querySelectorAll('.channel-cta')].find((a) => a.href.includes('ch=whatsapp'))
          ),
      ],
    ],
  },
  {
    label: '404',
    url: 'http://soverath.presentto.online/noexiste',
    checks: [
      ['página de error', (d) => d.body.innerHTML.includes('Nodo fuera de cobertura')],
      ['canonical apunta a 404', (d) => d.head.querySelector('link[rel="canonical"]') !== null],
    ],
  },
  {
    label: 'subdominio ferreza.presentto.online',
    url: 'http://ferreza.presentto.online/',
    checks: [
      ['abre el nodo directamente', (d) => d.querySelector('h1')?.textContent.includes('Ferreza')],
      ['badge del subdominio', (d) => d.body.innerHTML.includes('ferreza.presentto.online')],
    ],
  },
]

async function runChild(label) {
  const scenario = SCENARIOS.find((s) => s.label === label)
  if (!scenario) {
    console.error(`Escenario desconocido: ${label}`)
    process.exit(2)
  }

  const dom = createWindow(scenario.url)
  const { window } = dom
  let runtimeError = null
  window.addEventListener('error', (e) => {
    runtimeError = e.error ?? e.message
  })

  await import(`file://${resolve(DIST, 'assets', bundle)}`)
  await wait(700)

  const doc = window.document
  const results = []
  for (const [name, fn] of scenario.checks) {
    try {
      results.push([name, Boolean(await fn(doc))])
    } catch (err) {
      results.push([name, false, err.message])
    }
  }

  const ok = !runtimeError && results.every(([, pass]) => pass)
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${scenario.label}`)
  if (runtimeError) console.log(`  runtime: ${runtimeError?.stack ?? runtimeError}`)
  for (const [name, pass, detail] of results) {
    console.log(`  ${pass ? '✓' : '✗'} ${name}${pass || !detail ? '' : ` (${detail})`}`)
  }

  window.close()
  process.exit(ok ? 0 : 1)
}

if (process.argv[2] === '--child') {
  await runChild(process.argv[3])
} else {
  if (!bundle) {
    console.error('No hay bundle en dist/assets — ejecuta `npm run build` antes de `npm run smoke`.')
    process.exit(1)
  }

  const failures = []
  for (const { label } of SCENARIOS) {
    const child = spawnSync(process.execPath, [process.argv[1], '--child', label], {
      encoding: 'utf8',
      timeout: 60_000,
    })
    process.stdout.write(child.stdout ?? '')
    if (child.stderr) process.stderr.write(child.stderr)
    if (child.status !== 0) failures.push(label)
  }

  console.log(
    `\n${SCENARIOS.length - failures.length}/${SCENARIOS.length} escenarios · ${failures.length} fallos`
  )
  failures.forEach((label) => console.log(`  ✗ ${label}`))
  process.exit(failures.length === 0 ? 0 : 1)
}
