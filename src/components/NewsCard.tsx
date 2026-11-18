import { motion } from 'motion/react'
import type { Media } from '../types'
import { asset } from '../lib/outils'
import { suivreSouris } from './bits/spotlight'
import { IconeLecture } from './Icones'

type Props = {
  media: Media
  /** Position dans la grille : sert à l'apparition en cascade (40 ms entre deux cartes). */
  index: number
  delaiBase?: number
  onOuvrir: (m: Media) => void
}

export const TRANSITION_CARTE = { duration: 0.34, ease: [0.2, 0.7, 0.2, 1] as const }

export default function NewsCard({ media, index, delaiBase = 0, onOuvrir }: Props) {
  const delay = delaiBase + index * 0.04
  const estVideo = media.type === 'video'

  return (
    <motion.button
      type="button"
      layoutId={`carte-${media.id}`}
      onClick={() => onOuvrir(media)}
      onPointerMove={suivreSouris}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        opacity: { delay, duration: 0.4 },
        y: { delay, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] },
        layout: TRANSITION_CARTE,
      }}
      style={{ borderRadius: 12 }}
      className="surface spotlight group/carte relative flex min-h-0 min-w-0 flex-col overflow-hidden text-left lg:max-xl:nth-[n+10]:hidden"
    >
      {/* Vignette */}
      <span className="relative block aspect-video w-full overflow-hidden bg-black fit:aspect-auto fit:min-h-0 fit:flex-1">
        {estVideo && !media.poster ? (
          <video
            src={`${asset(media.src)}#t=0.1`}
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover/carte:scale-[1.06]"
          />
        ) : (
          <img
            src={asset(estVideo ? media.poster! : media.src)}
            alt=""
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover/carte:scale-[1.06]"
          />
        )}

        {estVideo && (
          <span className="absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-[rgba(10,10,12,0.6)] text-white backdrop-blur-sm">
            <IconeLecture taille={13} className="ml-px" />
          </span>
        )}
      </span>

      {/* Barre de légende : titre sur une ligne, tronqué avec « … » */}
      <span className="flex h-8 w-full shrink-0 items-center border-t border-trait px-3">
        <span className="truncate text-[12.5px] font-medium text-texte/80 transition-[color,text-shadow] duration-300 group-hover/carte:lueur group-focus-visible/carte:lueur">
          {media.titre}
        </span>
      </span>
    </motion.button>
  )
}
