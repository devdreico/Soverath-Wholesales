# Análisis: de mayoreo digital a operación con presencia física

Diagnóstico del sistema actual y hoja de ruta para convertir Soverath Wholesales de
"portal vitrina" en un mayorista con operación real, bodega y frente de venta.

---

## 1. Diagnóstico del sistema actual

### Fortalezas

- **Identidad por nodo escalable**: 22 tiendas con color, icono, subdominio y tags
  propios; añadir la 23ª es una fila de datos (`src/data/stores.jsx`), no código.
- **Contrato de catálogo listo para producción**: `src/data/products.js` ya define
  SKU, unidad de venta, stock y etiquetas. El volcado de los 1000+ reales no toca UI.
- **Descubrimiento**: buscador por nombre/SKU/tag, filtros cruzados por tienda y
  categoría, orden por precio/stock, paginación progresiva.
- **Arquitectura de dominio**: rutas por nodo + compuerta de hostname. Cada tienda
  puede vivir en su subdominio sin duplicar despliegues.
- **SEO técnico correcto**: metadatos por ruta, canonical/OG dinámicos, sitemap de
  24 URLs, JSON-LD con `ItemList` de los 22 nodos.

### Debilidades

1. **Catálogo estático**: el stock se declara en el bundle; con 1000+ SKUs y ventas
   diarias, la UI mentiría en horas. No hay fuente de verdad externa.
2. **Sin identidad de cliente**: no hay cuentas, segmentación (menudeo/mayoreo) ni
   precio según volumen — el corazón de un negocio de mayoreo.
3. **Sin transacción**: las cards abren tiendas externas; el portal no convierte.
4. **SPA sin SSR**: para catálogo indexable a escala (1000+ páginas de producto),
   el contenido se genera en cliente y Google depende del render.
5. **Datos de muestra**: precios y stock son ilustrativos; la moneda no está definida.
6. **Operación invisible**: no se muestra logística, mínimos de pedido, tiempos de
   entrega ni cobertura — lo primero que pregunta un comprador mayorista.

---

## 2. Cuellos de botella priorizados

| # | Problema | Impacto | Esfuerzo |
|---|----------|---------|----------|
| 1 | Sin backend ni fuente de verdad de inventario | Bloqueante para vender | Alto |
| 2 | Sin precios por volumen ni cuentas B2B | Pierde margen y conversión | Medio |
| 3 | Catálogo no indexable a escala (SPA pura) | SEO limitado en 1000+ refs | Medio |
| 4 | 17 nodos sin dominio propio | Marca incompleta | Bajo (DNS) |
| 5 | Sin proceso logístico publicado | Frena la primera compra | Bajo |
| 6 | Sin analítica ni embudos | No se puede decidir con datos | Bajo |

---

## 3. Hoja de ruta

### Fase 0 — Fundamentos inmediatos (0–2 semanas)

- Definir **moneda, Incoterms y mínimos de pedido** (decisiones de negocio, no de código).
- Wildcard DNS + `*.presentto.online` para los 22 nodos (ver README).
- Publicar **página de logística**: cobertura, tiempos, mínimos, métodos de pago.
- Analítica desde el día 1 (Plausible/Umami autoservido): eventos en `cta_abrir_tienda`,
  `buscar_producto`, `cargar_mas`, `ver_nodo`.
- Reescribir las descripciones de las 17 tiendas nuevas con copy comercial real.

### Fase 1 — Fuente de verdad del catálogo (2–6 semanas)

- **Export del ERP/inventario** → pipeline diario (CSV/API) a un JSON servido o API.
- SKU único obligatorio, alias por tienda y categoría normalizada.
- Estado de stock en vivo (disponible / bajo / agotado) y "última actualización" visible:
  en mayoreo la confianza nace de la transparencia del inventario.
- Cuando el volcado supere ~200 refs visibles, añadir índice por categoría
  (`/productos/<categoria>`) para SEO.

### Fase 2 — Comercio mayorista (1–3 meses)

- **Cuenta B2B**: registro con datos fiscales, aprobación manual y segmentos
  (menudeo / mayoreo / distribuidor).
- **Precio por volumen**: `price` pasa a ser tabla `{qty_from → price}`; la ficha
  muestra la curva de precio (1–9, 10–49, 50+) — el gatillo de conversión mayorista.
- **Carrito + checkout por pedido**: cotización automática, transferencia/condominio,
  facturación con datos fiscales.
- **Reorden rápido**: recompra con un clic desde pedidos anteriores.
- Listas de precios por cliente y campañas por nodo.

### Fase 3 — Operación y logística (3–6 meses)

- Integrar **WMS/ERP** (o hoja controlada al inicio): reservas al confirmar pedido,
  pick & pack, guías de envío impresas.
- Modalidades: envío a domicilio, retiro en bodega, rutas programadas por zona.
- **Tablero de pedido** para el cliente: estado, historial, facturas, remitos.
- Almacén físico con ubicaciones por SKU; conteo cíclico para que el stock publicado
  coincida con la realidad (la web ya muestra barras de stock: deben ser verdad).

### Fase 4 — Presencia física (6–12 meses)

- **Showroom/punto de venta** enlazado desde el portal: mapa, horarios, catálogo del
  local y "recoge hoy" (click & collect).
- Estrategia de local: no 22 locales — **un frente físico del ecosistema** con las
  22 marcas bajo un mismo techo (la ventaja de operar en red).
- Señalética y packaging con el sistema visual ya construido (acentos por nodo).
- Pagos en local con el mismo catálogo y precios que la web (omnicanal real).
- Punto de venta ligero (Square/Clip/Tienda Nube o POS propio) sincronizado con el
  mismo inventario que alimenta la web.

### Fase 5 — Escala de red (12+ meses)

- **Marketplace interno**: los 22 nodos comparten inventario y carrito único
  ("compra de varias tiendas en un pedido") — es la ventaja estructural sobre vender
  por separado.
- Alianzas de distribución, exportación a la región y catálogo por temporada.
- Datos: margen por nodo, rotación por SKU, coste de reposición → decisión de
  qué tienda física o categoría abrir a continuación.

---

## 4. Decisiones técnicas pendientes (requieren definición de negocio)

1. **Moneda y redondeo** de precios de mayoreo.
2. **Motor de backend**: API headless (Supabase/Firebase al inicio, medible) vs CMS.
3. **Render del catálogo**: SSR/prerender del index de productos cuando haya 1000+
   referencias indexables (hoy el SEO de catálogo depende de rutas, no de SKUs).
4. **Futuro de los dominios externos**: si `vikingdogs.presentto.online` (tienda
   externa actual) migra al nodo interno, decidir redirecciones 301 para no perder
   posicionamiento.
5. **Multi-idioma**: sólo si hay exportación real.

---

## 5. Riesgos

- **Deuda de verdad de datos**: mostrar stock/precios sin sincronizar erosiona la
  confianza más rápido que no mostrarlos.
- **Duplicidad de esfuerzo**: 22 tiendas con tienda propia + portal pueden competir
  entre sí en SEO si no se define canonical y propiedad de contenido por URL.
- **Crecer la vitrina antes que la operación**: el orden correcto es inventario →
  precio → pedido → logística → local; la web ya está un paso por delante.

**Conclusión:** el sistema ya resuelve la parte difícil de presentación (identidad
de 22 nodos, catálogo filtrable, SEO y subdominios). El salto a mayoreo real no es
más diseño: es **fuente de verdad de inventario, precio por volumen, cuentas B2B y
una operación logística publicada**. Con eso, el frente físico deja de ser una web
institucional y pasa a ser el escaparate de una bodega que ya vende.
