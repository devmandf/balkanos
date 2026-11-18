import { motion } from 'motion/react'
import { PUBLICITE, TEXTES, type Publicite } from '../config'
import { asset } from '../lib/outils'
import { useNavigation } from '../lib/session'

type Props = {
  /** colonne = zone verticale à droite (desktop) ; bandeau = bande horizontale (tablette / mobile). */
  variante: 'colonne' | 'bandeau'
  /** Par défaut : la publicité réglée dans src/config.ts. */
  pub?: Publicite
  className?: string
  delai?: number
}

/**
 * Zone publicitaire.
 * Priorité : 1) publicité envoyée par la page Contact et validée · 2) PUBLICITE de config.ts · 3) « Espace publicitaire ».
 */
export default function AdSlot({ variante, pub, className = '', delai = 0 }: Props) {
  const { pub: publiee } = useNavigation()
  pub ??= publiee ? { type: publiee.type, src: publiee.src, lien: publiee.lien || undefined, description: publiee.titre } : PUBLICITE
  return (
    <motion.aside
      aria-label="Publicité"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delai, duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
      className={`surface relative overflow-hidden rounded-xl ${variante === 'colonne' ? 'h-full' : 'h-[72px]'} ${className}`}
    >
      <Contenu pub={pub} />
    </motion.aside>
  )
}

function Contenu({ pub }: { pub: Publicite }) {
  if (pub.type === 'image') {
    const image = <img src={asset(pub.src)} alt={pub.description ?? 'Publicité'} className="h-full w-full object-cover" />
    return pub.lien ? (
      <a href={pub.lien} target="_blank" rel="noopener noreferrer sponsored" className="block h-full w-full">
        {image}
      </a>
    ) : (
      image
    )
  }

  if (pub.type === 'video') {
    const video = <video src={asset(pub.src)} autoPlay muted loop playsInline className="h-full w-full object-cover" />
    return pub.lien ? (
      <a href={pub.lien} target="_blank" rel="noopener noreferrer sponsored" className="block h-full w-full">
        {video}
      </a>
    ) : (
      video
    )
  }

  if (pub.type === 'html') {
    // Le code de la régie tourne dans un cadre isolé : il ne peut pas toucher au reste du site.
    return (
      <iframe
        title="Publicité"
        srcDoc={`<!doctype html><html><body style="margin:0;background:transparent;display:grid;place-items:center;min-height:100vh">${pub.html}</body></html>`}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        className="h-full w-full border-0"
      />
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center px-4 text-center">
      <p className="font-jura text-[13px] tracking-[0.14em] text-gris/80">{TEXTES.pubVide}</p>
    </div>
  )
}
