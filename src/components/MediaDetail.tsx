import { motion } from 'motion/react'
import { dateCourte } from '../lib/outils'
import { useSession } from '../lib/session'
import type { Media } from '../types'
import Commentaires from './Commentaires'
import MediaPlayer from './MediaPlayer'
import { TRANSITION_CARTE } from './NewsCard'

/** Carte agrandie dans la zone centrale : média + titre + description + commentaires. */
export default function MediaDetail({ media, onFermer }: { media: Media; onFermer: () => void }) {
  const { preferences } = useSession()

  return (
    <motion.div
      layoutId={`carte-${media.id}`}
      transition={{ layout: TRANSITION_CARTE }}
      style={{ borderRadius: 12 }}
      role="dialog"
      aria-modal="true"
      aria-label={media.titre}
      className="surface fixed inset-0 z-50 overflow-hidden fit:absolute fit:z-20"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.14, duration: 0.25 }}
        className="flex h-full w-full flex-col lg:flex-row"
      >
        <MediaPlayer
          type={media.type}
          src={media.src}
          poster={media.poster}
          titre={media.titre}
          lectureAuto={preferences.lectureAuto}
          sonCoupe={preferences.sonCoupe}
          onFermer={onFermer}
          className="aspect-video max-h-[42dvh] w-full shrink-0 lg:aspect-auto lg:h-full lg:max-h-none lg:w-auto lg:min-w-0 lg:flex-1"
        />

        <div className="flex min-h-0 flex-1 flex-col border-t border-trait lg:w-[40%] lg:flex-none xl:w-[38%] lg:border-l lg:border-t-0">
          {/* Titre et description */}
          <div className="defile max-h-[45%] shrink-0 border-b border-trait px-5 py-4 xl:px-6 xl:py-5">
            <p className="font-jura text-[11px] font-semibold uppercase tracking-[0.2em] text-gris">
              {[media.categorie, dateCourte(media.date)].filter(Boolean).join(' · ')}
            </p>
            <h2 className="mt-2 text-[clamp(16px,1.35vw,21px)] font-semibold leading-snug text-white [overflow-wrap:anywhere]">{media.titre}</h2>
            {media.texte && <p className="mt-2 text-[13px] leading-relaxed text-texte/75 [overflow-wrap:anywhere]">{media.texte}</p>}
          </div>

          <Commentaires mediaId={media.id} />
        </div>
      </motion.div>
    </motion.div>
  )
}
