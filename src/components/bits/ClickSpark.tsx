import { useEffect, useRef } from 'react'
import { animationsReduites } from '../../lib/outils'

type Etincelle = { x: number; y: number; angle: number; debut: number }

/**
 * Petites étincelles blanches au clic.
 * Inspiré de « Click Spark » (reactbits.dev), réécrit : un seul canvas pour toute la page,
 * déclenché par les éléments qui portent l'attribut `data-spark`.
 */
export default function ClickSpark({
  couleur = '#ffffff',
  nombre = 8,
  rayon = 22,
  longueur = 9,
  duree = 420,
}: {
  couleur?: string
  nombre?: number
  rayon?: number
  longueur?: number
  duree?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || animationsReduites()) return

    let etincelles: Etincelle[] = []
    let image = 0

    const ajuster = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const dessiner = (t: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      etincelles = etincelles.filter((e) => t - e.debut < duree)
      for (const e of etincelles) {
        const p = (t - e.debut) / duree
        const sortie = p * (2 - p)
        const d = sortie * rayon
        const l = longueur * (1 - sortie)
        ctx.globalAlpha = 1 - p
        ctx.strokeStyle = couleur
        ctx.lineWidth = 1.6
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(e.x + Math.cos(e.angle) * d, e.y + Math.sin(e.angle) * d)
        ctx.lineTo(e.x + Math.cos(e.angle) * (d + l), e.y + Math.sin(e.angle) * (d + l))
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      image = etincelles.length ? requestAnimationFrame(dessiner) : 0
    }

    const clic = (ev: PointerEvent) => {
      if (!(ev.target instanceof Element) || !ev.target.closest('[data-spark]')) return
      const debut = performance.now()
      for (let i = 0; i < nombre; i++) {
        etincelles.push({ x: ev.clientX, y: ev.clientY, angle: (Math.PI * 2 * i) / nombre, debut })
      }
      if (!image) image = requestAnimationFrame(dessiner)
    }

    ajuster()
    window.addEventListener('resize', ajuster)
    document.addEventListener('pointerdown', clic)
    return () => {
      window.removeEventListener('resize', ajuster)
      document.removeEventListener('pointerdown', clic)
      if (image) cancelAnimationFrame(image)
    }
  }, [couleur, nombre, rayon, longueur, duree])

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[80] h-full w-full" />
}
