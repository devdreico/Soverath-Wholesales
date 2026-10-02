# data/ — pipeline de catálogo y feeds

Fuente de verdad del inventario: un CSV de catálogo → módulo JS generado → feeds de canales.

## Formato del CSV de catálogo

Columnas **requeridas** (en este orden o en cualquier orden, con cabecera exacta):

| Columna | Tipo | Reglas |
|---------|------|--------|
| `sku` | texto | Obligatorio, único (la comparación ignora mayúsculas) |
| `nombre` | texto | Obligatorio |
| `categoria` | texto | Obligatorio |
| `costo` | número | ≥ 0 |
| `precio` | número | > 0 |
| `stock` | entero | ≥ 0 |
| `proveedor` | texto | Obligatorio |
| `peso` | número | ≥ 0 (kg por unidad) |

- Codificación UTF-8, separador `,`, comillas dobles para campos con comas o saltos de línea (`"Aceite de oliva, 5 L"`), comillas escapadas como `""`, fin de línea LF o CRLF.
- Cualquier columna extra se ignora con un aviso.
- Plantilla con 5 filas de ejemplo: [`catalog.template.csv`](./catalog.template.csv).

### CSV opcional de canales (`--channels`)

Clave `sku` + una columna por canal con valores `si`/`no` (también `1/0`, `true/false`):

```csv
sku,web,whatsapp,mercado
BT-SUP-014,si,si,no
ES-HWD-118,si,no,si
```

Si el fichero no existe se avisa y se omite. Los productos sin fila de canales quedan sin el objeto `channels`.

## Comandos

```bash
# 1. Valida sin escribir nada
npm run catalog:import -- data/catalog.template.csv --dry-run

# 2. Importa y genera src/data/catalog.generated.js
npm run catalog:import -- data/catalog.csv
npm run catalog:import -- data/catalog.csv --channels data/channels-availability.csv

# 3. Genera los 4 feeds en feeds/ (git-ignored)
npm run feeds
npm run feeds -- --out /tmp/feeds --base-url https://otro-dominio.online
```

Errores (salen con código `1`): columnas requeridas faltantes, SKU duplicado (lista filas), valores no numéricos, stock no entero, archivo inexistente y `storeSlug` sin tienda en `src/data/stores.meta.json`.

## Salidas

- `src/data/catalog.generated.js` → `catalogGenerated` (filas tipadas) + `catalogMeta` (`count`, `importedAt`, `source`). **No editar a mano**: se regenera en cada importación.
- `feeds/google-merchant.csv` → `id,title,description,link,image_link,price,availability,brand,gtin,mpn`
- `feeds/meta-catalog.csv` → `id,title,description,link,brand,availability,price`
- `feeds/whatsapp-catalog.csv` → `id,title,description,link,availability,price,brand,image_link`
- `feeds/mercadolibre.json` → array con `id,title,description,price,currency_id,condition,available_quantity,category_id,permalink,seller_custom_field`

Convenciones de los feeds: `id`/`gtin`/`mpn` = SKU, marca `Soverath`, precios `18.90 USD`, `availability` Google `in_stock`/`out_of_stock` y Meta/WhatsApp `in stock`/`out of stock`, `permalink`/`link` al nodo `/tienda/<storeSlug>`, `category_id` = categoría en slug (placeholder hasta mapear categorías reales de ML), imagen = logotipo del repositorio (los productos aún no tienen foto).

## Flujo recomendado

```
export del ERP (CSV UTF-8)
  → npm run catalog:import -- data/catalog.csv --dry-run   # valida
  → npm run catalog:import -- data/catalog.csv             # genera catalog.generated.js
  → npm run feeds                                          # 4 feeds para Google/Meta/WhatsApp/ML
  → npm run build                                          # empaqueta la web
```

El volcado real (I1) sustituye a la plantilla; `src/data/products.js` sigue siendo el catálogo publicado en la web hasta conectar el volcado con `catalog.generated.js`.
