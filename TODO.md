# TODO — Soverath Wholesales: plan de implementación

Leyenda: `[ ]` pendiente · `[~]` en curso · `[x]` hecho · 🔒 bloqueado en insumo del usuario
Regla de calidad (aplica a toda tarea): **lint 0 warnings · tests verdes · build OK · sin errores a11y críticos · docs del área actualizadas**.

---

## 🔒 Insumos que necesito de ti (desbloquean tareas)

| ID | Insumo | Formato mínimo | Desbloquea | Estado |
|----|--------|----------------|-----------|--------|
| I1 | Volcado real del catálogo (+1000) | CSV: `sku,nombre,categoria,costo,precio,stock,proveedor,peso` | B1, B2 | [ ] |
| I2 | Lista canónica de canales de venta | CSV/Fila: `nombre,tipo(web/whatsapp/ml/amazon/fisico),url,comision_pct,gestor` | B3, B5, C2 | [ ] |
| I3 | Margen real y comisiones por canal | % por canal sobre precio base | B2 | [ ] |
| I4 | Moneda, mercado e IVA | 1 línea de decisión | B2 (UI de precios), C2 | [ ] |
| I5 | Operación logística | transportistas, cortes de hora, zonas, mínimo de pedido | C1 | [ ] |
| I6 | Accesos de analítica (solo lectura) | Search Console, Meta, paneles marketplace | C3 | [ ] |
| I7 | Presupamento mensual real | cifra | C4 | [ ] |
| I8 | Disponibilidad del equipo | horas/semana por persona | C4 | [ ] |
| I9 | Prueba social | facturas proveedor, antigüedad, fotos de bodega, clientes | C1 | [ ] |
| I10 | Políticas comerciales | devoluciones, garantía, mínimo mayoreo, plazos de pago | B5 | [ ] |

---

## Fase A — Cimiento de calidad (sin bloqueos)

| ID | Tarea | Criterios de aceptación | Owner | Estado |
|----|-------|------------------------|-------|--------|
| A1 | Suite unitaria Vitest + Testing Library | `npm test` verde; cubre: catálogo (filtros, formatos, derivados), seo por ruta, StoreCard (link interno + externo + acento), SearchFilters (callbacks/aria), ProductGrid (vacío), Nav, HomeEntry (hostname→nodo) | Agente A | [x] |
| A2 | CI GitHub Actions | workflow: lint + test + build en push/PR; badge documentado | Agente A | [x] |
| A3 | E2E Playwright | specs: portada (22 cards), búsqueda en /productos, nodo /tienda/ferreza, 404; `npm run test:e2e` | Agente A | [x] |
| A4 | Tokens de diseño + contraste | accents de 22 nodos verificados WCAG AA (≥4.5 texto / ≥3 UI) vía `npm run contrast`; correcciones aplicadas | Agente C | [x] |
| A5 | Auditoría a11y | skip-link, focus visible en todo el flujo de teclado, aria-live en resultados, landmarks, sin texto < 4.5:1 | Agente C | [x] |
| A6 | Code-splitting por ruta | `React.lazy` en todas las rutas + Suspense con fallback coherente; JS inicial < 60 KB gz | Agente B | [x] |
| A7 | Prerender SEO de las 24 rutas | build genera `dist/<ruta>/index.html` con contenido + title/canonical/og propios; cliente hidrata sin errores | Agente B | [x] |
| A8 | Páginas de categoría | `/productos/<categoria>` con filtros preactivados, enlazadas desde chips y sitemap | Agente B | [x] |
| A9 | Smoke test en repo | `scripts/smoke.mjs` (jsdom) con los checks de render/interacción; incluido en CI | Integración | [x] |

## Fase B — Núcleo ecosistema (inventario único → N salidas)

| ID | Tarea | Criterios de aceptación | Requiere | Owner | Estado |
|----|-------|------------------------|----------|-------|--------|
| B1 | Pipeline de importación de catálogo | `npm run catalog:import -- data/catalog.csv` valida columnas, deduplica SKU, genera `src/data/catalog.generated.js`; plantilla `data/catalog.template.csv` incluida | I1 (datos reales) | Agente D | [x] |
| B2 | Motor de precios por canales | `src/lib/pricing.js`: precio escalonado por cantidad, factor por canal, guarda de margen mínimo (canal bloqueado si comisión ≥ margen); tests | I3, I4 | Agente D | [x] |
| B3 | Registro de canales | `src/data/channels.js` + `src/lib/channels.js`: canales con `enabled`, tipo, comisión y CTA; 5 placeholders listos para I2 | I2 (relleno real) | Agente D | [x] |
| B4 | Generadores de feeds | `npm run feeds` → Google Merchant CSV, Meta/WhatsApp CSV, MercadoLibre JSON en `feeds/`; campos obligatorios presentes; con datos de muestra | — | Agente D | [x] |
| B5 | Hub de pedidos `/admin` | lista con canal, estados (nuevo→pagado→empacado→enviado→entregado), KPIs por canal, adapter reemplazable (localStorage hoy, Supabase luego); sin dependencias nuevas | I10 (reglas) | Agente E | [x] |
| B6 | Acciones multi-canal en fichas | producto y nodo muestran CTA por canal habilitado (web/WhatsApp/marketplace) + atribución `ch`/`utm` en todos los enlaces | I2 (activar) | Integración | [x] |

## Fase C — Crecimiento

| ID | Tarea | Criterios de aceptación | Requiere | Owner | Estado |
|----|-------|------------------------|----------|-------|--------|
| C1 | Página de logística + confianza | cobertura, tiempos, mínimos, prueba social publicada | I5, I9 | [ ] | |
| C2 | Landing por canal/campaña | plantilla reutilizable con oferta B2B y captura a WhatsApp propio | I2, I4 | [ ] | |
| C3 | Panel de métricas | ventas/margen por canal, stock en riesgo, SKU rotados | I6 | [ ] | |
| C4 | Motor de crecimiento | pauta por canal con presupuesto, experimentos semanales | I7, I8 | [ ] | |
| C5 | Multi-carrito entre nodos | pedido único cruzando tiendas (ventaja de red) | B5 | [ ] | |
| C6 | Fuente de verdad remota | swap de adapter a Supabase/API manteniendo contratos | I1 | [ ] | |

---

## Tablero de subagentes (propiedad de archivos)

| Agente | Tareas | Archivos PROPIOS (única autoridad) | Prohibido tocar |
|--------|--------|-----------------------------------|-----------------|
| **A — Tests & CI** | A1, A2, A3 | `vitest.config.js`, `src/test/**`, `**/*.test.{js,jsx}`, `tests/**`, `.github/workflows/ci.yml`, `playwright.config.js`, `e2e/**` | `package.json`, `vite.config.js`, `src/main.jsx`, código fuente (salvo extracción mínima para testabilidad documentada) |
| **C — Tokens & A11y** | A4, A5 | `src/index.css`, `src/styles/**`, `scripts/contrast-check.mjs`, `src/App.jsx` (skip-link), ediciones a11y puntuales en componentes (sin renombrar clases) | `package.json`, `main.jsx`, tests, datos |
| **D — Datos & Feeds** | B1, B2, B3, B4 | `src/lib/pricing.js`, `src/lib/channels.js`, `src/lib/feeds.js`, `src/lib/attribution.js`, `src/lib/csv.js`, `src/data/channels.js`, `scripts/generate-feeds.mjs`, `scripts/import-catalog.mjs`, `data/**`, sus `*.test.js`, y línea de scripts en `package.json` (`feeds`, `catalog:import`) | componentes, estilos, `main.jsx`, `stores.jsx`, `products.js` |
| **E — Admin/Pedidos** | B5 | `src/pages/Admin.jsx`, `src/components/admin/**`, `src/lib/orders-store.js`, `src/styles/admin.css`, sus `*.test.js` | `package.json`, `main.jsx`, estilos ajenos, tests ajenos |
| **B — Rutas & SEO** | A6, A7, A8 | `src/main.jsx`, `src/pages/Category.jsx`, `src/pages/Products.jsx`, `scripts/prerender*.mjs`, `src/prerender-entry.jsx`, `vite.config.js`, línea `build` en `package.json` | tests ajenos, estilos, datos, librerías de D/E |
| **F — Docs** | docs | `README.md`, `ARCHITECTURE.md`, actualización de estados en `TODO.md` | cualquier archivo de código |
| **Integración (yo)** | B6, A9, verificación final | `ProductCard.jsx`, `StoreHero.jsx`, `scripts/smoke.mjs`, `src/data/stores.jsx`, `src/data/products.js` | — |

## Secuencia

```
Onda 1 (paralela)   A · C · D · E
Onda 2              B (requiere base estable + Admin listo)
Onda 3              Integración (B6, A9) + F (docs)
Verificación         lint · npm test · test:e2e · build+prerender · smoke
```

## Estado global

- [x] Onda 1 — A, C, D, E
- [x] Onda 2 — B
- [x] Onda 3 — integración + docs
- [x] Verificación final
