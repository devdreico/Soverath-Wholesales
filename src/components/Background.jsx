import { useEffect, useRef } from 'react'

export default function Background() {
  const glowRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const node = glowRef.current
    if (!node) return undefined

    let x = window.innerWidth / 2
    let y = window.innerHeight / 3
    let tx = x
    let ty = y
    let frame = 0

    const onMove = (e) => {
      tx = e.clientX
      ty = e.clientY
    }

    const loop = () => {
      x += (tx - x) * 0.07
      y += (ty - y) * 0.07
      node.style.transform = `translate3d(${x - 320}px, ${y - 320}px, 0)`
      frame = requestAnimationFrame(loop)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    frame = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="bg" aria-hidden="true">
      <div className="bg__blob bg__blob--1" />
      <div className="bg__blob bg__blob--2" />
      <div className="bg__blob bg__blob--3" />
      <div className="bg__blob bg__blob--4" />
      <div className="bg__cursor" ref={glowRef} />
      <div className="bg__grain" />
    </div>
  )
}
