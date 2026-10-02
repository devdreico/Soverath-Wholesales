import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const BG_FLOOR = '#040506'
const BG_PANEL = '#0b0d10'
const BACKGROUNDS = [BG_FLOOR, BG_PANEL]
const TEXT_MIN = 4.5
const UI_MIN = 3
const SMALL_PX = 14
const OWNED = new Set([
  'src/index.css',
  'src/styles/nav.css',
  'src/styles/home.css',
  'src/styles/products.css',
  'src/styles/store.css',
])
const SKIP_COLORS = new Set([
  'none',
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
  'currentcolor',
  'parentcolor',
  'canvastext',
])

const splitTop = (str, sep) => {
  const parts = []
  let depth = 0
  let quote = ''
  let cur = ''
  for (const ch of str) {
    if (quote) {
      cur += ch
      if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      cur += ch
      continue
    }
    if (ch === '(') depth += 1
    else if (ch === ')') depth -= 1
    if (ch === sep && depth === 0) {
      parts.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  parts.push(cur)
  return parts
}

const indexOfTop = (str, target) => {
  let depth = 0
  let quote = ''
  for (let i = 0; i < str.length; i += 1) {
    const ch = str[i]
    if (quote) {
      if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '(') depth += 1
    else if (ch === ')') depth -= 1
    else if (ch === target && depth === 0) return i
  }
  return -1
}

const parseHex = (raw) => {
  let h = raw.replace('#', '')
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('')
  if (h.length !== 6 && h.length !== 8) return null
  const int = Number.parseInt(h.slice(0, 6), 16)
  const a = h.length === 8 ? Number.parseInt(h.slice(6, 8), 16) / 255 : 1
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255, a }
}

const parseRgb = (raw) => {
  const inner = raw.slice(raw.indexOf('(') + 1, raw.lastIndexOf(')'))
  const norm = inner.replace(/\//g, ' ').replace(/,/g, ' ').replace(/\s+/g, ' ').trim()
  const parts = norm.split(' ')
  if (parts.length < 3) return null
  const num = (s) => {
    if (s.endsWith('%')) return (Number.parseFloat(s) / 100) * 255
    return Number.parseFloat(s)
  }
  const r = num(parts[0])
  const g = num(parts[1])
  const b = num(parts[2])
  let a = 1
  if (parts[3] !== undefined) a = parts[3].endsWith('%') ? Number.parseFloat(parts[3]) / 100 : Number.parseFloat(parts[3])
  if ([r, g, b, a].some((v) => Number.isNaN(v))) return null
  return { r, g, b, a }
}

const linear = (c) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

const luminance = ({ r, g, b }) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)

const contrast = (a, b) => {
  const la = luminance(a)
  const lb = luminance(b)
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

const over = (fg, bg) => ({
  r: fg.a * fg.r + (1 - fg.a) * bg.r,
  g: fg.a * fg.g + (1 - fg.a) * bg.g,
  b: fg.a * fg.b + (1 - fg.a) * bg.b,
  a: 1,
})

const same = (a, b) =>
  Math.abs(a.r - b.r) < 1.5 && Math.abs(a.g - b.g) < 1.5 && Math.abs(a.b - b.b) < 1.5 && Math.abs(a.a - b.a) < 0.01

const toHex = ({ r, g, b }) =>
  `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const parseDecls = (body) => {
  const map = {}
  for (const part of splitTop(body, ';')) {
    const idx = indexOfTop(part, ':')
    if (idx < 0) continue
    const prop = part.slice(0, idx).trim().toLowerCase()
    const value = part.slice(idx + 1).trim()
    if (prop) map[prop] = value
  }
  return map
}

const parseRules = (css) => {
  const rules = []
  let i = 0
  while (i < css.length) {
    const open = css.indexOf('{', i)
    if (open === -1) break
    const head = css.slice(i, open)
    let depth = 1
    let j = open + 1
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth += 1
      else if (css[j] === '}') depth -= 1
      j += 1
    }
    const body = css.slice(open + 1, j - 1)
    const selector = head.split(';').pop().trim()
    if (/^@(keyframes|-webkit-keyframes|font-face|page|counter-style|property)/i.test(selector)) {
      // bloque sin reglas de estilo
    } else if (/^@(media|supports|layer|container)/i.test(selector)) {
      rules.push(...parseRules(body))
    } else if (selector && !selector.startsWith('@')) {
      rules.push({ selector, decls: parseDecls(body) })
    }
    i = j
  }
  return rules
}

const parseVarCall = (raw) => {
  const inner = raw.slice(raw.indexOf('(') + 1, raw.lastIndexOf(')'))
  const parts = splitTop(inner, ',')
  return { name: parts[0].trim(), fallback: parts.length > 1 ? parts.slice(1).join(',').trim() : null }
}

const colorsOf = (value, ctx) => {
  if (!value) return []
  const v = value.trim()
  const low = v.toLowerCase()
  if (low === 'transparent') return [{ r: 0, g: 0, b: 0, a: 0 }]
  if (low === 'white') return [{ r: 255, g: 255, b: 255, a: 1 }]
  if (low === 'black') return [{ r: 0, g: 0, b: 0, a: 1 }]
  if (SKIP_COLORS.has(low)) return []
  if (v.startsWith('#')) return [parseHex(v)].filter(Boolean)
  if (/^rgba?\(/i.test(v)) return [parseRgb(v)].filter(Boolean)
  if (/^var\(/i.test(v)) {
    const { name, fallback } = parseVarCall(v)
    if (name === '--accent') return [...ctx.accents]
    if (Object.hasOwn(ctx.vars, name)) return colorsOf(ctx.vars[name], ctx)
    if (fallback) return colorsOf(fallback, ctx)
    return []
  }
  if (/^color-mix\(/i.test(v)) {
    const inner = v.slice(v.indexOf('(') + 1, v.lastIndexOf(')'))
    const parts = splitTop(inner, ',')
    if (parts.length !== 3) return []
    if (parts[0].trim().toLowerCase().replace(/\s+/g, ' ') !== 'in srgb') return []
    const side = (raw) => {
      const s = raw.trim()
      const m = s.match(/^(.*?)\s*(-?[\d.]+)%$/)
      if (!m) return { colors: colorsOf(s, ctx), pct: 100 }
      return { colors: colorsOf(m[1].trim(), ctx), pct: Number.parseFloat(m[2]) }
    }
    const a = side(parts[1])
    const b = side(parts[2])
    const total = a.pct + b.pct
    if (!a.colors.length || !b.colors.length || total === 0) return []
    const pa = a.pct / total
    const pb = b.pct / total
    const out = []
    for (const ca of a.colors) {
      for (const cb of b.colors) {
        const alpha = pa * ca.a + pb * cb.a
        if (alpha <= 0) {
          out.push({ r: 0, g: 0, b: 0, a: 0 })
          continue
        }
        out.push({
          r: (pa * ca.a * ca.r + pb * cb.a * cb.r) / alpha,
          g: (pa * ca.a * ca.g + pb * cb.a * cb.g) / alpha,
          b: (pa * ca.a * ca.b + pb * cb.a * cb.b) / alpha,
          a: alpha,
        })
      }
    }
    return out
  }
  return []
}

const gradientStops = (value, ctx) => {
  const out = []
  for (const seg of splitTop(value, ',')) {
    const s = seg.trim()
    if (!s) continue
    if (/^[a-z-]*gradient\(/i.test(s)) {
      const inner = s.slice(s.indexOf('(') + 1, s.lastIndexOf(')'))
      out.push(...gradientStops(inner, ctx))
      continue
    }
    const direct = colorsOf(s, ctx)
    if (direct.length) {
      out.push(...direct)
      continue
    }
    out.push(...colorsOf(s.split(/\s+/)[0], ctx))
  }
  return out.filter((c) => c)
}

const backgroundColors = (decls, ctx) => {
  const value = decls['background-color'] ?? decls.background ?? decls['background-image']
  if (!value) return []
  if (/^\s*(none|transparent)\s*$/i.test(value)) return []
  return gradientStops(value, ctx)
}

const toPx = (value) => {
  if (!value) return null
  const v = value.trim().toLowerCase()
  if (/^clamp\(/.test(v)) {
    const nums = v.match(/[\d.]+(?:px|rem|em|pt)/g) || []
    const pxs = nums.map(toPx).filter((n) => n != null)
    return pxs.length ? Math.max(...pxs) : null
  }
  if (v.endsWith('rem')) return Number.parseFloat(v) * 16
  if (v.endsWith('em')) return Number.parseFloat(v) * 16
  if (v.endsWith('pt')) return Number.parseFloat(v) * (4 / 3)
  if (v.endsWith('px')) return Number.parseFloat(v)
  return null
}

const fontSizeOf = (rule, allRules) => {
  const own = toPx(rule.decls['font-size'])
  if (own != null) return own
  const classes = [...rule.selector.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map((m) => m[1])
  for (const cls of classes) {
    const re = new RegExp(`\\.${cls}(?![a-zA-Z0-9_-])`)
    for (const other of allRules) {
      if (other === rule || !other.decls['font-size']) continue
      if (re.test(other.selector)) {
        const px = toPx(other.decls['font-size'])
        if (px != null) return px
      }
    }
  }
  return 16
}

const ratioPair = (color, ownBgs) => {
  const stops = ownBgs.length ? ownBgs : [null]
  return BACKGROUNDS.map((page) => {
    let worst = Infinity
    for (const own of stops) {
      const base = own ? over(own, parseHex(page)) : parseHex(page)
      worst = Math.min(worst, contrast(over(color, base), base))
    }
    return worst
  })
}

const readStores = () => {
  const src = readFileSync(join(ROOT, 'src/data/stores.jsx'), 'utf8')
  const accents = [...src.matchAll(/accent:\s*'(#[0-9a-fA-F]{6})'/g)].map((m) => parseHex(m[1]))
  const slugs = [...src.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1])
  return { accents, slugs }
}

const readStyles = () => {
  const files = ['src/index.css']
  const dir = join(ROOT, 'src/styles')
  for (const name of readdirSync(dir).sort()) {
    if (name.endsWith('.css')) files.push(`src/styles/${name}`)
  }
  return files.map((rel) => ({
    rel,
    css: stripComments(readFileSync(join(ROOT, rel), 'utf8')),
  }))
}

const pad = (value, size) => String(value).padEnd(size)
const padL = (value, size) => String(value).padStart(size)

const { accents, slugs } = readStores()
const styles = readStyles()

const rootRules = []
const allRules = []
for (const file of styles) {
  const rules = parseRules(file.css)
  allRules.push(...rules.map((r) => ({ ...r, file: file.rel })))
  rootRules.push(...rules.filter((r) => r.selector === ':root'))
}

const vars = {}
for (const rule of rootRules) {
  for (const [key, value] of Object.entries(rule.decls)) {
    if (key.startsWith('--')) vars[key] = value
  }
}

const ctx = { vars, accents }

const textTokenNames = new Set()
const textRules = []
for (const rule of allRules) {
  for (const prop of ['color', '-webkit-text-fill-color']) {
    const value = rule.decls[prop]
    if (!value) continue
    for (const m of value.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) textTokenNames.add(m[1])
  }
  const colorValue = rule.decls['-webkit-text-fill-color'] ?? rule.decls.color
  if (!colorValue) continue
  const colors = colorsOf(colorValue, ctx)
  if (!colors.length) continue
  const ownBg = backgroundColors(rule.decls, ctx)
  if (colors.every((c) => c.a === 0)) continue
  if (colors.length && ownBg.length && colors.every((c) => ownBg.some((o) => same(c, o)))) continue
  textRules.push({ ...rule, colorValue, colors, ownBg })
}

const accentTextMixes = new Set()
for (const rule of textRules) {
  if (/color-mix\([^)]*var\(--accent\)/i.test(rule.colorValue)) accentTextMixes.add(rule.colorValue)
}

const failures = []
const warnings = []

console.log('Contraste WCAG 2.x — Soverath Wholesales')
console.log(`Fondos de referencia: ${BG_FLOOR} (suelo) · ${BG_PANEL} (panel)`)
console.log(`Umbrales: texto ${TEXT_MIN}:1 · UI/gráfico ${UI_MIN}:1 · texto pequeño < ${SMALL_PX}px`)
console.log('')

console.log('== Tokens --* de src/index.css ==')
console.log(
  `${pad('token', 20)} ${pad('valor', 30)} ${padL('#040506', 9)} ${padL('#0b0d10', 9)} ${pad('uso', 12)} ${padL('umbral', 7)} estado`
)
const colorTokens = Object.entries(vars).filter(([, value]) => colorsOf(value, ctx).length > 0)
for (const [name, value] of colorTokens) {
  const colors = colorsOf(value, ctx)
  const isText = textTokenNames.has(name)
  const ratios = BACKGROUNDS.map((bg) => {
    const base = parseHex(bg)
    let worst = Infinity
    for (const color of colors) worst = Math.min(worst, contrast(over(color, base), base))
    return worst
  })
  const min = Math.min(...ratios)
  const threshold = isText ? TEXT_MIN : UI_MIN
  const ok = min >= threshold
  if (isText && !ok) failures.push(`token ${name} (${value}) = ${min.toFixed(2)}:1 < ${TEXT_MIN}:1`)
  console.log(
    `${pad(name, 20)} ${pad(value.slice(0, 30), 30)} ${padL(ratios[0].toFixed(2), 9)} ${padL(ratios[1].toFixed(2), 9)} ${pad(isText ? 'texto' : 'superficie', 12)} ${padL(isText ? threshold.toFixed(1) : '—', 7)} ${ok ? 'OK' : isText ? 'FAIL' : 'info'}`
  )
}
console.log('')

console.log(`== Acentos de tienda (${accents.length}) — src/data/stores.jsx ==`)
console.log(
  `${pad('#', 3)} ${pad('slug', 15)} ${pad('accent', 9)} ${padL('#040506', 9)} ${padL('#0b0d10', 9)} ${padL('texto', 7)} ${padL('UI', 7)} ${pad('uso texto (color-mix)', 24)} ${padL('min', 7)} estado`
)
accents.forEach((accent, i) => {
  const direct = BACKGROUNDS.map((bg) => contrast(accent, parseHex(bg)))
  const derived = []
  for (const mix of accentTextMixes) {
    for (const color of colorsOf(mix, { vars, accents: [accent] })) {
      derived.push(Math.min(...BACKGROUNDS.map((bg) => contrast(over(color, parseHex(bg)), parseHex(bg)))))
    }
  }
  const derivedMin = derived.length ? Math.min(...derived) : null
  const textMin = Math.min(...direct, ...(derivedMin === null ? [] : [derivedMin]))
  const uiMin = Math.min(...direct)
  const textOk = textMin >= TEXT_MIN
  const uiOk = uiMin >= UI_MIN
  if (!textOk) failures.push(`acento ${slugs[i] ?? i} ${toHex(accent)} = ${textMin.toFixed(2)}:1 < ${TEXT_MIN}:1`)
  if (!uiOk) failures.push(`acento ${slugs[i] ?? i} ${toHex(accent)} = ${uiMin.toFixed(2)}:1 < ${UI_MIN}:1`)
  console.log(
    `${pad(i + 1, 3)} ${pad(slugs[i] ?? '?', 15)} ${pad(toHex(accent), 9)} ${padL(direct[0].toFixed(2), 9)} ${padL(direct[1].toFixed(2), 9)} ${padL(textMin.toFixed(2), 7)} ${padL(uiMin.toFixed(2), 7)} ${pad(derivedMin === null ? '—' : `${derivedMin.toFixed(2)}:1`, 24)} ${padL(textMin.toFixed(2), 7)} ${textOk && uiOk ? 'OK' : 'FAIL'}`
  )
})
console.log('')

console.log('== Usos de texto en CSS (color aplicado a contenido) ==')
console.log(
  `${pad('archivo', 20)} ${pad('regla', 46)} ${pad('color', 30)} ${padL('px', 6)} ${padL('#040506', 9)} ${padL('#0b0d10', 9)} ${padL('min', 7)} estado`
)
const sortedTextRules = [...textRules].sort((a, b) => (a.file === b.file ? a.selector.localeCompare(b.selector) : a.file.localeCompare(b.file)))
for (const rule of sortedTextRules) {
  const px = fontSizeOf(rule, allRules)
  const display = rule.colorValue.length > 30 ? `${rule.colorValue.slice(0, 29)}…` : rule.colorValue
  let worst = Infinity
  let first = Infinity
  let second = Infinity
  for (const color of rule.colors) {
    const pair = ratioPair(color, rule.ownBg)
    worst = Math.min(worst, ...pair)
    first = Math.min(first, pair[0])
    second = Math.min(second, pair[1])
  }
  const owned = OWNED.has(rule.file)
  const ok = worst >= TEXT_MIN
  const label = `${rule.file} ${rule.selector} = ${worst.toFixed(2)}:1 < ${TEXT_MIN}:1`
  if (!ok) {
    if (owned) failures.push(label)
    else warnings.push(`fuera de alcance (Agente E): ${label}`)
  }
  const state = ok ? (px < SMALL_PX ? 'OK (pequeño)' : 'OK') : owned ? 'FAIL' : 'AVISO'
  console.log(
    `${pad(rule.file.replace('src/styles/', '').replace('src/', ''), 20)} ${pad(rule.selector.slice(0, 45), 46)} ${pad(display, 30)} ${padL(px.toFixed(1), 6)} ${padL(first.toFixed(2), 9)} ${padL(second.toFixed(2), 9)} ${padL(worst.toFixed(2), 7)} ${state}`
  )
}
console.log('')

if (warnings.length) {
  console.log(`Avisos fuera de alcance: ${warnings.length}`)
  for (const w of warnings) console.log(`  - ${w}`)
  console.log('')
}

if (failures.length) {
  console.log(`RESULTADO: ${failures.length} incumplimiento(s)`)
  for (const f of failures) console.log(`  - ${f}`)
  process.exit(1)
}
console.log('RESULTADO: todos los umbrales cumplidos (exit 0)')
