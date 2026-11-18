import type { PointerEvent } from 'react'

/**
 * Lueur qui suit la souris (à utiliser avec la classe CSS `.spotlight`).
 * Inspiré de « Spotlight Card » (reactbits.dev), réécrit.
 *
 *   <div className="spotlight relative" onPointerMove={suivreSouris}>…</div>
 */
export function suivreSouris(e: PointerEvent<HTMLElement>) {
  const cadre = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - cadre.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - cadre.top}px`)
}
