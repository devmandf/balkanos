import { useEffect, useState } from 'react'

/**
 * Grain animé très léger posé sur toute la page.
 * Inspiré de « Noise » (reactbits.dev), réécrit : une petite tuile de bruit est dessinée
 * une seule fois puis déplacée par `transform` (aucun redessin, donc très léger).
 */
export default function Noise({ taille = 180 }: { taille?: number }) {
  const [tuile, setTuile] = useState<string | null>(null)

  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = taille
    canvas.height = taille
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const image = ctx.createImageData(taille, taille)
    for (let i = 0; i < image.data.length; i += 4) {
      const v = Math.random() * 255
      image.data[i] = v
      image.data[i + 1] = v
      image.data[i + 2] = v
      image.data[i + 3] = 255
    }
    ctx.putImageData(image, 0, 0)
    setTuile(canvas.toDataURL('image/png'))
  }, [taille])

  if (!tuile) return null
  return <div aria-hidden className="grain" style={{ backgroundImage: `url(${tuile})` }} />
}
