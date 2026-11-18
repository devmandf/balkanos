import { useEffect, useState } from 'react'
import { animationsReduites } from '../../lib/outils'

const SIGNES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/'

/**
 * Texte qui se « déchiffre » lettre par lettre à l'apparition.
 * Inspiré de « Decrypted Text » (reactbits.dev), réécrit.
 */
export default function DecryptedText({
  texte,
  delaiMs = 0,
  vitesseMs = 45,
  className = '',
}: {
  texte: string
  delaiMs?: number
  vitesseMs?: number
  className?: string
}) {
  const [affiche, setAffiche] = useState(texte)

  useEffect(() => {
    if (animationsReduites()) {
      setAffiche(texte)
      return
    }
    let tour = 0
    let intervalle = 0
    const brouiller = (reveles: number) =>
      texte
        .split('')
        .map((c, i) => (i < reveles || c === ' ' ? c : SIGNES[Math.floor(Math.random() * SIGNES.length)]))
        .join('')

    setAffiche(brouiller(0))
    const depart = window.setTimeout(() => {
      intervalle = window.setInterval(() => {
        tour++
        const reveles = Math.floor(tour / 2)
        setAffiche(brouiller(reveles))
        if (reveles >= texte.length) window.clearInterval(intervalle)
      }, vitesseMs)
    }, delaiMs)

    return () => {
      window.clearTimeout(depart)
      window.clearInterval(intervalle)
    }
  }, [texte, delaiMs, vitesseMs])

  return (
    // Le texte final (invisible) réserve la place : la largeur ne bouge pas pendant l'effet.
    <span className={`relative inline-block ${className}`}>
      <span className={affiche === texte ? '' : 'invisible'}>{texte}</span>
      {affiche !== texte && (
        <span aria-hidden className="absolute inset-0 whitespace-nowrap">
          {affiche}
        </span>
      )}
    </span>
  )
}
