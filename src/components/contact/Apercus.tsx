import { useLayoutEffect, useRef, useState } from 'react'
import { TEXTES } from '../../config'
import { dateCourte } from '../../lib/outils'
import type { TypeMedia } from '../../types'
import { IconeTeleverser } from '../Icones'

/* Aperçus EN TAILLE RÉELLE de ce que la personne est en train de préparer.
   Tout reste dans le navigateur (adresse locale blob:), rien n'est envoyé. */

type Contenu = { src: string | null; type: TypeMedia | null; titre: string; description?: string }

export const TITRE_VIDE = 'Votre titre apparaîtra ici'

/** L'image ou la vidéo choisie, ou un emplacement en pointillés tant qu'aucun fichier n'est choisi. */
export function Visuel({ src, type, ajuste, icone = 34 }: { src: string | null; type: TypeMedia | null; ajuste: 'object-cover' | 'object-contain'; icone?: number }) {
  if (!src) {
    return (
      <span className="flex h-full w-full items-center justify-center border border-dashed border-white/25 bg-white/[0.04] text-white/55">
        <IconeTeleverser taille={icone} />
      </span>
    )
  }
  return type === 'video' ? (
    <video src={src} muted autoPlay loop playsInline className={`h-full w-full ${ajuste}`} />
  ) : (
    <img src={src} alt="" className={`h-full w-full ${ajuste}`} />
  )
}

/** La carte telle qu'elle apparaît dans la grille d'accueil. */
export function ApercuCarte({ src, type, titre }: Contenu) {
  const affiche = titre.trim() || TITRE_VIDE
  // Le titre dépasse-t-il de la carte ? (il est alors coupé par « … »)
  const ligne = useRef<HTMLSpanElement>(null)
  const [coupe, setCoupe] = useState(false)
  useLayoutEffect(() => {
    const el = ligne.current
    if (!el) return
    const mesurer = () => setCoupe(el.scrollWidth > el.clientWidth + 1)
    mesurer()
    const observateur = new ResizeObserver(mesurer)
    observateur.observe(el)
    return () => observateur.disconnect()
  }, [affiche])

  return (
    <div className="mx-auto w-full max-w-[340px]">
      <div className="surface overflow-hidden rounded-xl">
        <span className="block aspect-[16/10] w-full overflow-hidden bg-black">
          <Visuel src={src} type={type} ajuste="object-cover" />
        </span>
        <span className="flex h-8 w-full items-center border-t border-trait px-3">
          <span ref={ligne} className="truncate text-[12.5px] font-medium text-white">
            {affiche}
          </span>
        </span>
      </div>

      {coupe && (
        <p className="mt-2.5 text-center text-[11px] leading-relaxed text-gris">
          Titre long : il est coupé sur la carte, mais s'affiche en entier quand on l'ouvre.
        </p>
      )}
    </div>
  )
}

/** La carte une fois ouverte : média en grand, titre complet, description. */
export function ApercuAgrandi({ src, type, titre, description }: Contenu) {
  return (
    <div className="surface overflow-hidden rounded-xl">
      <span className="block aspect-video w-full overflow-hidden bg-black">
        <Visuel src={src} type={type} ajuste="object-contain" icone={48} />
      </span>
      <div className="border-t border-trait px-4 py-3.5">
        <p className="font-jura text-[11px] font-semibold uppercase tracking-[0.2em] text-gris">Annonce · {dateCourte(new Date().toISOString())}</p>
        <p className="mt-1.5 text-[19px] font-semibold leading-snug text-white [overflow-wrap:anywhere]">{titre.trim() || TITRE_VIDE}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-texte/75 [overflow-wrap:anywhere]">
          {description?.trim() || <span className="text-gris">Votre description apparaîtra ici.</span>}
        </p>
      </div>
    </div>
  )
}

/** La publicité dans l'Espace publicitaire : colonne (ordinateur) ou bandeau (téléphone). */
export function ApercuPub({ src, type, format }: Contenu & { format: 'ordinateur' | 'telephone' }) {
  const vide = <span className="font-jura text-[12px] tracking-[0.14em] text-gris/80">{TEXTES.pubVide}</span>
  return format === 'ordinateur' ? (
    <div className="mx-auto w-full max-w-[220px]">
      <div className="surface flex aspect-[1/2] w-full items-center justify-center overflow-hidden rounded-xl">
        {src ? <Visuel src={src} type={type} ajuste="object-cover" /> : vide}
      </div>
      <p className="mt-2.5 text-center text-[11px] leading-relaxed text-gris">
        Sur ordinateur : colonne à droite de la page. Un visuel <strong className="font-semibold text-texte">vertical</strong> (portrait) la remplit le
        mieux.
      </p>
    </div>
  ) : (
    <div className="mx-auto w-full max-w-[380px]">
      <div className="surface flex h-[72px] w-full items-center justify-center overflow-hidden rounded-xl">
        {src ? <Visuel src={src} type={type} ajuste="object-cover" /> : vide}
      </div>
      <p className="mt-2.5 text-center text-[11px] leading-relaxed text-gris">
        Sur téléphone et tablette : bandeau sous l'en-tête. Seule la bande centrale du visuel est visible : placez-y l'essentiel.
      </p>
    </div>
  )
}
