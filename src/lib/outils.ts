import {
  DEVISE,
  DUREE_AFFICHAGE_JOURS,
  DUREE_PUBLICITE_JOURS,
  NOM_OFFRE_GRATUITE,
  PAIEMENT_ACTIF,
  PRIX_PUBLICATION,
  PRIX_PUBLICITE,
} from '../config'
import type { Formule } from '../types'

/** Prix et durée d'affichage selon la formule choisie. */
export function tarif(formule: Formule): { prix: number; jours: number } {
  return formule === 'publicite'
    ? { prix: PRIX_PUBLICITE, jours: DUREE_PUBLICITE_JOURS }
    : { prix: PRIX_PUBLICATION, jours: DUREE_AFFICHAGE_JOURS }
}

/** Ce qui est affiché à la place du prix : « 5 000 FCFA », ou « Free Limited » tant que tout est gratuit. */
export function etiquettePrix(formule: Formule): string {
  return PAIEMENT_ACTIF ? prix(tarif(formule).prix) : NOM_OFFRE_GRATUITE
}

/** Montant enregistré avec une demande : 0 tant que tout est gratuit. */
export function montantDu(formule: Formule): number {
  return PAIEMENT_ACTIF ? tarif(formule).prix : 0
}

export const NOM_FORMULE: Record<Formule, string> = { publication: 'Publication', publicite: 'Publicité' }

/** « Été à Dakar » → « ete a dakar » (pour comparer sans accents ni majuscules). */
export function sansAccents(texte: string): string {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** « il y a 5 min », « il y a 2 h », « hier », puis la date. */
export function ilYA(iso: string): string {
  const secondes = (Date.now() - new Date(iso).getTime()) / 1000
  if (!Number.isFinite(secondes)) return ''
  if (secondes < 60) return "à l'instant"
  if (secondes < 3600) return `il y a ${Math.floor(secondes / 60)} min`
  if (secondes < 86400) return `il y a ${Math.floor(secondes / 3600)} h`
  if (secondes < 172800) return 'hier'
  return dateCourte(iso)
}

/** Enregistre un fichier sur l'appareil. */
export function enregistrerFichier(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nom
  document.body.appendChild(lien)
  lien.click()
  lien.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** « Grande braderie ! » → « grande-braderie » */
export function slug(texte: string): string {
  return (
    texte
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'media'
  )
}

/** Transforme un chemin de `public/` en adresse utilisable (fonctionne en local et sur GitHub Pages). */
export function asset(chemin: string): string {
  if (/^(https?:|blob:|data:)/.test(chemin)) return chemin
  return import.meta.env.BASE_URL + chemin.replace(/^\//, '')
}

/** 5000 → « 5 000 FCFA » */
export function prix(montant: number): string {
  return `${montant.toLocaleString('fr-FR').replace(/ | /g, ' ')} ${DEVISE}`
}

/** « 2026-11-16 » → « 16 nov. 2026 » */
export function dateCourte(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** 75 → « 1:15 » */
export function duree(secondes: number): string {
  if (!Number.isFinite(secondes) || secondes < 0) return '0:00'
  const s = Math.floor(secondes)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function animationsReduites(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Ajoute https:// si besoin et vérifie que c'est une vraie adresse web. Renvoie '' si le lien est incorrect. */
export function lienPropre(saisie: string): string {
  const brut = saisie.trim()
  if (!brut) return ''
  try {
    const url = new URL(/^https?:\/\//i.test(brut) ? brut : `https://${brut}`)
    return url.hostname.includes('.') ? url.toString() : ''
  } catch {
    return ''
  }
}
