# Soverath Wholesales

Portal mayorista multicanal y ecosistema comercial orquestado. Conecta un inventario centralizado en bodega con múltiples salidas de venta (22 tiendas temáticas digitales, subdominios, portal general, WhatsApp, marketplaces y mostrador físico), con soporte de prerender SEO, feed generation, hub de pedidos interno y atribución de campañas multicanal (`utm_*` + `ch`).

## Stack

- **Framework**: React 19 + Vite 8
- **Enrutamiento**: `react-router-dom@7.18.4` (Lazy loading por ruta + Suspense)
- **Estilos**: CSS nativo con diseño modular y variables por nodo (`src/index.css`, `src/styles/`)
- **Calidad y Linter**: `oxlint`
- **Testing**: Vitest + Testing Library (unitarias), Playwright (E2E), scripts de smoke en jsdom y contraste WCAG

## Requisitos y Configuración

- **Node.js**: v22 o superior
- **Gestor de paquetes**: npm

```bash
# Instalación de dependencias
npm ci

# Servidor de desarrollo
npm run dev

# Compilación de producción (incluye SSR, prerender de 45 rutas y sitemap)
npm run build
```

## Scripts Disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo Vite |
| `npm run build` | Compila cliente y SSR, genera 45 páginas prerenderizadas y actualiza el sitemap |
| `npm run preview` | Previsualiza la compilación de producción |
| `npm run lint` | Ejecuta `oxlint` para validación de código |
| `npm test` | Ejecuta la suite de unitarias con Vitest |
| `npm run test:watch` | Ejecuta Vitest en modo watch |
| `npm run test:e2e` | Ejecuta las pruebas End-to-End con Playwright |
| `npm run smoke` | Ejecuta el smoke test en jsdom (7 escenarios de render e interacción) |
| `npm run contrast` | Verifica el contraste WCAG AA de los 22 nodos comerciales |
| `npm run feeds` | Genera los feeds de exportación (Google, Meta, MercadoLibre) en `feeds/` |
| `npm run catalog:import` | Importa un catálogo masivo CSV desde `data/catalog.csv` |

## Estructura del Repositorio

- `src/components/`: Componentes UI reutilizables (Hero, ProductCard, SearchFilters, ChannelActions, Admin, etc.)
- `src/pages/`: Vistas de ruta principales (Products, Category, StorePage, Admin, NotFound)
- `src/lib/`: Lógica de negocio y adaptadores (`seo.js`, `host.js`, `channels.js`, `pricing.js`, `attribution.js`, `feeds.js`, `orders-store.js`)
- `src/data/`: Datos estáticos y metadatos (`products.js`, `stores.jsx`, `channels.js`, `stores.meta.json`)
- `src/styles/`: Hojas de estilo modulares (`nav.css`, `home.css`, `products.css`, `store.css`, `admin.css`)
- `scripts/`: Herramientas de compilación, prerender, feeds, contraste y smoke test
- `e2e/`: Pruebas End-to-End con Playwright
- `data/`: Plantillas CSV y documentación de importación (`catalog.template.csv`, `README.md`)

## Cómo Añadir una Tienda

1. Añadir el nodo comercial en `src/data/stores.jsx` asegurando su `slug`, `subdomain`, `accent` (verificado WCAG), `icon` y `category`.
2. Registrar la metadata correspondiente en `src/data/stores.meta.json`.
3. El sistema de enrutamiento y prerender incorporará automáticamente la nueva ruta `/tienda/:slug` y el subdominio correspondiente.

## Cómo Activar un Canal de Venta

1. Modificar el registro en `src/data/channels.js`.
2. Cambiar `enabled: true` e indicar la `url` de salida, la comisión porcentual (`commissionPct`) y el `ctaLabel`.
3. Los botones de acción en fichas de producto y tiendas (`ChannelActions`) reflejarán los canales activos con la atribución de campaña automática (`ch=<id>&utm_campaign=...`).

## Notas de Calidad y Verificación

El proyecto cuenta con un pipeline de CI configurado en `.github/workflows/ci.yml` que ejecuta:
1. `npm run lint` (0 warnings permitidos)
2. `npm test` (tests unitarios en verde)
3. `npm run build` (compilación completa y prerender)
4. `npm run smoke` (verificación de los 7 escenarios en jsdom)
