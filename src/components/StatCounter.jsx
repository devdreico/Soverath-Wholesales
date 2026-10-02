import { useRef } from 'react'
import { useCountUp } from '../hooks/useReveal.js'

export default function StatCounter({ value, suffix = '', label, decimals = 0 }) {
  const ref = useRef(null)
  const current = useCountUp(ref, value)

  return (
    <div className="stat" ref={ref}>
      <span className="stat__value mono">
        {decimals > 0 ? (current / 10 ** decimals).toFixed(decimals) : current}
        <span className="stat__suffix">{suffix}</span>
      </span>
      <span className="stat__label">{label}</span>
    </div>
  )
}
