/**
 * Registro de canales de venta del ecosistema.
 *
 * Placeholders listos para sustituir por la lista canónica del usuario (I2):
 * `nombre,tipo,url,comision_pct,gestor`. `web` y `whatsapp` operan con datos
 * de ejemplo; los marketplaces y el punto físico quedan `enabled: false` hasta
 * recibir URL, comisión y gestor reales.
 *
 * @typedef {Object} Channel
 * @property {string} id            Clave estable para atribución (`ch=<id>`).
 * @property {string} name          Nombre visible en CTAs.
 * @property {'web'|'whatsapp'|'marketplace'|'fisico'} type
 * @property {string} url           URL de salida (vacío si aún no existe).
 * @property {number} commissionPct Comisión del canal en % sobre el precio.
 * @property {boolean} enabled      Habilitado para mostrar CTAs.
 * @property {string} ctaLabel      Texto del botón de acción.
 * @property {number} order         Orden de mostrado.
 */

/** @type {Channel[]} */
export const channels = [
  {
    id: 'web',
    name: 'Portal Soverath',
    type: 'web',
    url: 'https://soverath.presentto.online',
    commissionPct: 0,
    enabled: true,
    ctaLabel: 'Comprar en el portal',
    order: 1,
  },
  {
    id: 'whatsapp',
    name: 'Cotizar por WhatsApp',
    type: 'whatsapp',
    url: 'https://wa.me/573000000000',
    commissionPct: 0,
    enabled: true,
    ctaLabel: 'Cotizar por WhatsApp',
    order: 2,
  },
  {
    id: 'mercado',
    name: 'Mercado Libre',
    type: 'marketplace',
    url: '',
    commissionPct: 16,
    enabled: false,
    ctaLabel: 'Ver en Mercado Libre',
    order: 3,
  },
  {
    id: 'amazon',
    name: 'Amazon',
    type: 'marketplace',
    url: '',
    commissionPct: 15,
    enabled: false,
    ctaLabel: 'Ver en Amazon',
    order: 4,
  },
  {
    id: 'fisico',
    name: 'Mostrador físico',
    type: 'fisico',
    url: '',
    commissionPct: 0,
    enabled: false,
    ctaLabel: 'Visitar el mostrador',
    order: 5,
  },
]
