import { useEffect, useState } from 'react'

/**
 * Revela el elemento asociado a `ref` cuando entra en el viewport.
 * Uso:
 *   const gridRef = useRef(null)
 *   const reveal = useReveal(gridRef, 0)
 *   <div ref={gridRef} className={reveal.className} style={reveal.style}>
 *
 * @param {{current: Element | null}} ref elemento a observar
 * @param {number} delayIndex posición en la cascada (stagger), en pasos de 60ms
 */
export function useReveal(ref, delayIndex = 0) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          io.disconnect()
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -6% 0px' }
    )

    io.observe(node)
    return () => io.disconnect()
  }, [ref])

  return {
    revealed,
    className: revealed ? 'is-revealed' : '',
    style: { '--reveal-delay': `${delayIndex * 60}ms` },
  }
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Cuenta hacia arriba cuando el elemento de `ref` es visible.
 * @param {{current: Element | null}} ref elemento a observar
 * @param {number} to valor final
 * @param {number} duration ms
 */
export function useCountUp(ref, to, duration = 1400) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? to : 0))

  useEffect(() => {
    const node = ref.current
    if (!node || prefersReducedMotion()) return undefined

    let frame = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()

        const start = performance.now()
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - p, 3)
          setValue(Math.round(to * eased))
          if (p < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )

    io.observe(node)
    return () => {
      io.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [ref, to, duration])

  return value
}
