# Arquitectura del Ecosistema — Soverath Wholesales

Este documento describe la arquitectura técnica, los contratos de datos y los flujos de operación de Soverath Wholesales, diseñado bajo el principio de **inventario único en bodega con salidas comerciales múltiples (orquestación multicanal)**.

---

## 1. Modelo Mental y Núcleo de Datos

El sistema centraliza las referencias de inventario en contratos agnósticos (`src/data/products.js` y `src/lib/orders-store.js`) y desacopla la presentación comercial a través de:
- **Nodos comerciales (`stores.jsx`)**: 22 tiendas virtuales temáticas con identidad propia (accent, icono, subdominio).
- **Canales de venta externos y propios (`channels.js`)**: Canales digitales y físicos con control de comisiones y pasarelas de conversión directa (WhatsApp, portales, marketplaces).
- **Atribución integrada (`attribution.js`)**: Inyección automática de parámetros de campaña (`utm_*` y `ch=<canal>`) en cada enlace de salida.

---

## 2. Enrutamiento, Code-Splitting y Prerender SEO

- **Rutas Principales (`src/main.jsx`)**:
  - `/` → `HomeEntry` (resolución dinámica de nodo por hostname o selector de tienda)
  - `/productos` → Catálogo general con filtros dinámicos
  - `/productos/:categoria` → Vistas filtradas por categoría de mayoreo (`Category.jsx`)
  - `/tienda/:slug` → Ficha comercial de cada nodo con su inventario dedicado (`StorePage.jsx`)
  - `/admin` → Hub de operaciones y pedidos (`Admin.jsx`, protegido con cabecera `noindex`)
  - `*` → Página de error 404 (`NotFound.jsx`)

- **Code-Splitting y SSR / Prerender (`scripts/prerender.mjs`)**:
  - Todas las páginas están separadas mediante `React.lazy` + `Suspense`.
  - El script de compilación ejecuta una pasada SSR (`dist-ssr/prerender-entry.js`) para generar **45 rutas estáticas** (`dist/<ruta>/index.html`) con metadatos personalizados (Title, Description, Canonical, OpenGraph via `src/lib/seo.js`).
  - En el cliente, `src/main.jsx` detecta si el contenedor posee el atributo `data-prerendered` correspondiente a la ruta actual y ejecuta `hydrateRoot` (con hidratación limpia sin errores de consola); en caso contrario, utiliza `createRoot`.
  - Un middleware integrado en `vite.config.js` resuelve las solicitudes mediante el archivo index estático correspondiente.

---

## 3. Capas del Sistema (Contratos y Adaptadores)

### A. Gestión de Catálogo e Importación (`scripts/import-catalog.mjs`)
Permite vaciar catálogos reales masivos mediante CSV (`data/catalog.csv`), validando cabeceras obligatorias, deduplicando por SKU y generando el archivo generado de inventario.

### B. Motor de Precios y Canales (`src/lib/pricing.js` y `src/lib/channels.js`)
Calcula los precios escalonados (por caja, pack, unidad, kilogramo) y aplica factores de margen por canal, bloqueando canales cuya comisión exceda el margen comercial permitido.

### C. Generador de Feeds (`scripts/generate-feeds.mjs`)
Exporta el catálogo sincronizado hacia formatos estándar de canal (Google Merchant CSV, Meta/WhatsApp CSV, MercadoLibre JSON) en la carpeta `/feeds`.

### D. Hub de Pedidos y Estado (`src/lib/orders-store.js`)
Repositorio centralizado de pedidos con soporte para un adaptador reemplazable (`setOrdersAdapter`), permitiendo operar con `localStorage` en prototipos y escalar a Supabase u otras fuentes de verdad remotas sin alterar la interfaz de administración (`/admin`).

---

## 4. Aseguramiento de Calidad (Testing y CI)

- **Unitaria (Vitest + Testing Library)**: Cobertura de componentes, filtros, pasarelas de atribución, tiendas y almacenamiento de órdenes (122 tests).
- **End-to-End (Playwright)**: Verificación de flujos críticos de navegación, portales, nodos y búsquedas (16 especificaciones).
- **Smoke Test en JSDOM (`scripts/smoke.mjs`)**: Validación automatizada por proceso hijo de 7 escenarios completos de render e interacción en cliente.
- **Accesibilidad y Contraste (`scripts/contrast-check.mjs`)**: Verificación automática de la conformidad WCAG AA (≥4.5:1 para texto y ≥3:1 para elementos de interfaz) en las paletas de color de los 22 nodos.
- **Pipeline CI (`.github/workflows/ci.yml`)**: Ejecución secuencial de Linter (`oxlint`), Pruebas unitarias, Build/Prerender y Smoke test en cada commit o PR.

---

## 5. Árbol Estructural del Código Fuente

```text
src/
├── App.jsx
├── main.jsx
├── prerender-entry.jsx
├── index.css
├── components/
│   ├── Admin.jsx
│   ├── ChannelActions.jsx
│   ├── HomeEntry.jsx
│   ├── ProductCard.jsx
│   ├── ProductGrid.jsx
│   ├── SearchFilters.jsx
│   ├── StoreHero.jsx
│   ├── SubdomainBadge.jsx
│   └── admin/
├── data/
│   ├── channels.js
│   ├── products.js
│   ├── stores.jsx
│   └── stores.meta.json
├── hooks/
│   └── useReveal.js
├── lib/
│   ├── attribution.js
│   ├── channels.js
│   ├── csv.js
│   ├── feeds.js
│   ├── host.js
│   ├── orders-store.js
│   ├── pricing.js
│   └── seo.js
├── pages/
│   ├── Category.jsx
│   ├── NotFound.jsx
│   ├── Products.jsx
│   └── StorePage.jsx
└── test/
    └── setup.js
```
