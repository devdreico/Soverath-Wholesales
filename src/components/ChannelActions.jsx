import { channelCtas } from '../lib/channels.js'

const CHANNEL_COLORS = {
  web: '#6ee7f9',
  whatsapp: '#25d366',
  mercado: '#ffe066',
  amazon: '#ff9900',
  fisico: '#f4f4f4',
}

/**
 * Fila de CTAs hacia los canales de venta habilitados, con atribución
 * de campaña (`utm_*` + `ch`) ya aplicada por `channelCtas`.
 *
 * @param {{product?: object, store?: object, exclude?: string[], label?: string}} props
 */
export default function ChannelActions({
  product,
  store,
  exclude = ['web'],
  label = 'Comprar por canal',
}) {
  const ctas = channelCtas({ product, store }).filter(
    (cta) => !exclude.includes(cta.channel)
  )

  if (ctas.length === 0) return null

  return (
    <nav className="channel-ctas" aria-label={label}>
      {ctas.map((cta) => (
        <a
          key={cta.channel}
          className="channel-cta mono"
          href={cta.href}
          {...(cta.external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
          style={{ '--cta-accent': CHANNEL_COLORS[cta.channel] ?? '#6ee7f9' }}
        >
          <span className="channel-cta__dot" aria-hidden="true" />
          {cta.label}
        </a>
      ))}
    </nav>
  )
}
