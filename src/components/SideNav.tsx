import { motion } from 'motion/react'
import type { ComponentType } from 'react'
import type { Section } from '../types'
import { IconeEnveloppe, IconeJournal, IconeMedias } from './Icones'

const ENTREES: { id: Section; label: string; Icone: ComponentType<{ taille?: number; className?: string }> }[] = [
  { id: 'actus', label: 'Actus', Icone: IconeJournal },
  { id: 'medias', label: 'Medias', Icone: IconeMedias },
  { id: 'contact', label: 'Contact', Icone: IconeEnveloppe },
]

type Props = { section: Section; onChange: (s: Section) => void }

/** Navigation : colonne à gauche (desktop / tablette) + barre d'onglets en bas (mobile). */
export default function SideNav({ section, onChange }: Props) {
  return (
    <>
      {/* ---------------------------------------------------- Desktop / tablette */}
      <motion.nav
        aria-label="Navigation principale"
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.12, duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
        className="relative hidden md:sticky md:top-4 md:block md:h-[min(70dvh,480px)] md:self-start fit:relative fit:top-0 fit:h-full fit:self-stretch"
      >
        {/* Colonne : les boutons dépassent de chaque côté, comme sur la maquette. */}
        <div aria-hidden className="surface absolute inset-y-0 left-0 right-0 rounded-xl lg:left-[16%] lg:right-[16%]" />

        <ul className="relative flex h-full flex-col items-center justify-between py-7 fit:py-[6dvh]">
          {ENTREES.map(({ id, label, Icone }) => {
            const actif = section === id
            return (
              <li key={id} className="group relative w-12 lg:w-full">
                {/* Halo sous le bouton, au survol uniquement. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-3 -bottom-2 h-5 rounded-full bg-white/35 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100"
                />
                <button
                  type="button"
                  data-spark
                  onClick={() => onChange(id)}
                  aria-current={actif ? 'page' : undefined}
                  aria-label={label}
                  className={`pilule glare flex h-12 w-full items-center justify-center gap-2.5 rounded-xl text-[clamp(13px,1.05vw,16px)] font-semibold transition-[color,text-shadow,filter] duration-300 hover:brightness-125 lg:h-[clamp(42px,6.4dvh,58px)] lg:justify-start lg:pl-[15%] ${
                    actif ? 'lueur' : 'text-texte/85 hover:lueur'
                  }`}
                >
                  <Icone
                    taille={19}
                    className={`shrink-0 transition-colors duration-300 group-hover:text-white ${actif ? 'text-white' : 'text-gris'}`}
                  />
                  <span className="hidden lg:inline">{label}</span>
                </button>

                {/* Indicateur rouge de l'onglet actif : il glisse d'un bouton à l'autre. */}
                {actif && (
                  <motion.span
                    layoutId="indicateur-nav"
                    aria-hidden
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute left-0 top-[22%] bottom-[22%] z-10 w-[2px] rounded-full bg-rouge shadow-[0_0_10px_rgba(227,38,47,0.9)]"
                  />
                )}

                {/* Infobulle (tablette : icônes seules). */}
                <span
                  role="tooltip"
                  className="pilule pointer-events-none absolute left-full top-1/2 z-30 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 lg:hidden"
                >
                  {label}
                </span>
              </li>
            )
          })}
        </ul>
      </motion.nav>

      {/* ----------------------------------------------------------------- Mobile */}
      <nav
        aria-label="Navigation principale"
        className="surface fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="flex h-16">
          {ENTREES.map(({ id, label, Icone }) => {
            const actif = section === id
            return (
              <li key={id} className="relative flex-1">
                <button
                  type="button"
                  data-spark
                  onClick={() => onChange(id)}
                  aria-current={actif ? 'page' : undefined}
                  className={`flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-[color,text-shadow] duration-300 ${
                    actif ? 'lueur' : 'text-gris'
                  }`}
                >
                  <Icone taille={22} />
                  {label}
                </button>
                {actif && (
                  <motion.span
                    layoutId="indicateur-onglet"
                    aria-hidden
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute left-1/2 top-0 -ml-5 h-[2px] w-10 rounded-full bg-rouge shadow-[0_0_10px_rgba(227,38,47,0.9)]"
                  />
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
