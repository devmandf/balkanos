import type { CSSProperties } from 'react'

/**
 * Texte parcouru par un reflet lumineux.
 * Inspiré de « Shiny Text » (reactbits.dev), réécrit. Le style est dans index.css (.shiny-text).
 */
export default function ShinyText({
  texte,
  dureeSecondes = 4.5,
  className = '',
}: {
  texte: string
  dureeSecondes?: number
  className?: string
}) {
  return (
    <span className={`shiny-text ${className}`} style={{ '--shiny-duree': `${dureeSecondes}s` } as CSSProperties}>
      {texte}
    </span>
  )
}
