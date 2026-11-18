import { motion } from 'motion/react'
import { AFFICHER_NOM_A_COTE_DU_LOGO, LOGO, MODE_TEST, NOM_SITE, PAIEMENT_ACTIF, TEXTES } from '../config'
import { asset } from '../lib/outils'
import { useNavigation, useSession } from '../lib/session'
import DecryptedText from './bits/DecryptedText'
import { IconeCompte } from './Icones'

export default function Header() {
  const { section, aller } = useNavigation()
  const { utilisateur } = useSession()
  const actif = section === 'compte'

  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
      className="relative z-20 mx-[max(12px,2.5vw)] mt-[max(10px,2.2dvh)] shrink-0"
    >
      <div className="surface relative flex h-14 items-center justify-center rounded-xl md:h-[8dvh] md:min-h-[52px]">
        {/* Étiquette « MODE TEST » : seulement si les paiements sont réactivés pendant une phase de test. */}
        {PAIEMENT_ACTIF && MODE_TEST && (
          <span className="absolute -top-2 left-3 rounded-full border border-white/15 bg-surface-bas px-2.5 py-0.5 font-jura text-[10px] font-semibold tracking-[0.22em] text-gris sm:top-1/2 sm:-translate-y-1/2 sm:py-1">
            {TEXTES.bandeauTest}
          </span>
        )}

        <h1 className="flex h-full items-center gap-3 md:gap-4">
          <span className="relative aspect-square h-[70%]">
            {/* Halo rose très doux derrière le globe (rien sur le globe lui-même). */}
            <span aria-hidden className="halo-logo absolute -inset-[22%] rounded-full bg-[#D3779A]/25 blur-[10px]" />
            <img
              src={asset(LOGO)}
              alt={AFFICHER_NOM_A_COTE_DU_LOGO ? '' : NOM_SITE}
              width={64}
              height={64}
              className="relative h-full w-full [image-rendering:pixelated]"
            />
          </span>
          {AFFICHER_NOM_A_COTE_DU_LOGO && (
            <DecryptedText
              texte={NOM_SITE.toUpperCase()}
              delaiMs={250}
              className="font-jura text-[clamp(15px,2.5dvh,23px)] font-semibold tracking-[0.34em] text-texte max-[400px]:tracking-[0.2em]"
            />
          )}
        </h1>

        {/* Compte : connexion, tableau de bord, administration.
            (Le bouton est dans un bloc positionné : la classe .glare impose déjà sa propre position.) */}
        <div className="absolute right-2 top-1/2 flex max-w-[38%] -translate-y-1/2 sm:right-3">
        <button
          type="button"
          data-spark
          onClick={() => aller('compte')}
          aria-current={actif ? 'page' : undefined}
          aria-label={utilisateur ? `Mon compte (${utilisateur.pseudo})` : 'Connexion'}
          className={`pilule glare group flex h-10 min-w-0 items-center gap-2 rounded-[10px] px-2.5 text-[13px] font-semibold transition-[color,text-shadow,filter] duration-300 hover:brightness-125 sm:px-3.5 ${
            actif ? 'lueur' : 'text-texte/85 hover:lueur'
          }`}
        >
          <IconeCompte taille={18} className={`shrink-0 transition-colors duration-300 group-hover:text-white ${actif ? 'text-white' : 'text-gris'}`} />
          <span className="hidden truncate sm:inline">{utilisateur ? utilisateur.pseudo : 'Connexion'}</span>
          {utilisateur?.role === 'admin' && (
            <span className="hidden rounded border border-white/25 px-1 font-jura text-[9px] font-bold tracking-[0.14em] text-white lg:inline">
              ADMIN
            </span>
          )}
        </button>
        </div>
      </div>

      {/* Fine ligne rouge sous le header, qui s'estompe vers les bords. */}
      <div aria-hidden className="ligne-rouge mx-[10%] opacity-80" />
    </motion.header>
  )
}
