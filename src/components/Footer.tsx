import { motion } from 'motion/react'
import { TEXTE_FOOTER } from '../config'
import ShinyText from './bits/ShinyText'

export default function Footer({ delai = 0 }: { delai?: number }) {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delai, duration: 0.6 }}
      className="relative z-10 flex h-[10dvh] min-h-14 shrink-0 flex-col items-center justify-center gap-1.5 border-t border-trait bg-linear-to-b from-surface-haut to-surface-bas shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
    >
      {/* Fin trait rouge au-dessus de l'année. */}
      <span aria-hidden className="ligne-rouge w-14" />
      <ShinyText
        texte={TEXTE_FOOTER}
        className="pl-[0.42em] font-jura text-[clamp(12px,2dvh,18px)] font-medium leading-none tracking-[0.42em]"
      />
    </motion.footer>
  )
}
