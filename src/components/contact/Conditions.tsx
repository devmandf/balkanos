import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CONDITIONS } from '../../config'
import { IconeFermer } from '../Icones'

/** Fenêtre « Conditions de diffusion » (le texte se modifie dans src/config.ts). */
export default function Conditions({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) {
  const bouton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!ouvert) return
    bouton.current?.focus()
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer()
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [ouvert, onFermer])

  return createPortal(
    <AnimatePresence>
      {ouvert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onFermer}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titre-conditions"
            initial={{ y: 16, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="surface defile relative max-h-[86dvh] w-full max-w-lg rounded-2xl p-5 sm:p-6"
          >
            <button
              type="button"
              onClick={onFermer}
              aria-label="Fermer"
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-gris transition-colors hover:bg-white/8 hover:text-white"
            >
              <IconeFermer taille={18} />
            </button>

            <h2 id="titre-conditions" className="pr-10 text-lg font-semibold text-white">
              Conditions de diffusion
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-texte/80">{CONDITIONS.intro}</p>

            <h3 className="mt-5 font-jura text-[11px] font-bold uppercase tracking-[0.2em] text-gris">Contenus refusés</h3>
            <ul className="mt-2 space-y-1.5 text-sm leading-snug text-texte/80">
              {CONDITIONS.interdits.map((ligne) => (
                <li key={ligne} className="flex gap-2.5">
                  <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gris" />
                  {ligne}
                </li>
              ))}
            </ul>

            <h3 className="mt-5 font-jura text-[11px] font-bold uppercase tracking-[0.2em] text-gris">À savoir</h3>
            <ul className="mt-2 space-y-1.5 text-sm leading-snug text-texte/80">
              {CONDITIONS.regles.map((ligne) => (
                <li key={ligne} className="flex gap-2.5">
                  <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gris" />
                  {ligne}
                </li>
              ))}
            </ul>

            <button
              ref={bouton}
              type="button"
              onClick={onFermer}
              className="pilule glare mt-6 h-11 w-full rounded-xl text-sm font-semibold text-texte transition-[color,text-shadow] duration-300 hover:lueur"
            >
              J'ai compris
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
