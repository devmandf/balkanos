import { FORMATS_IMAGE, FORMATS_VIDEO, LIMITES } from '../config'
import type { TypeMedia } from '../types'

const MO = 1024 * 1024

export const FORMATS_ACCEPTES = [...FORMATS_IMAGE, ...FORMATS_VIDEO].join(',')

function dureeVideo(url: string): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => resolve(v.duration)
    v.onerror = () => resolve(NaN)
    v.src = url
  })
}

/**
 * Vérifie le format, le poids et (pour une vidéo) la durée d'un fichier choisi.
 * `url` = adresse locale créée avec URL.createObjectURL(fichier).
 */
export async function verifierFichier(fichier: File, url: string): Promise<{ type: TypeMedia | null; erreur: string | null }> {
  if (FORMATS_IMAGE.includes(fichier.type)) {
    if (fichier.size > LIMITES.imageMo * MO) return { type: 'image', erreur: `Image trop lourde (maximum ${LIMITES.imageMo} Mo).` }
    return { type: 'image', erreur: null }
  }
  if (FORMATS_VIDEO.includes(fichier.type)) {
    if (fichier.size > LIMITES.videoMo * MO) return { type: 'video', erreur: `Vidéo trop lourde (maximum ${LIMITES.videoMo} Mo).` }
    const d = await dureeVideo(url)
    if (Number.isNaN(d)) return { type: 'video', erreur: 'Cette vidéo ne peut pas être lue. Essayez un autre fichier MP4.' }
    if (d > LIMITES.videoSecondes + 0.5) return { type: 'video', erreur: `Vidéo trop longue (maximum ${LIMITES.videoSecondes} secondes).` }
    return { type: 'video', erreur: null }
  }
  return { type: null, erreur: 'Format non accepté. Formats possibles : JPG, PNG, WEBP ou MP4.' }
}

/** 1 536 000 → « 1,5 Mo » */
export function poids(octets: number): string {
  return octets >= MO ? `${(octets / MO).toFixed(1).replace('.', ',')} Mo` : `${Math.max(1, Math.round(octets / 1024))} Ko`
}

export const TEXTE_FORMATS = `JPG, PNG, WEBP (max ${LIMITES.imageMo} Mo) · MP4 (max ${LIMITES.videoMo} Mo, ${LIMITES.videoSecondes} s)`
