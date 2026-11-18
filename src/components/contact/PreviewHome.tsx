import { useLayoutEffect, useRef, useState } from 'react'
import { LOGO, NOM_SITE, NOMBRE_CARTES, TEXTE_FOOTER, TEXTES } from '../../config'
import { asset } from '../../lib/outils'
import type { Formule, TypeMedia } from '../../types'
import { IconeEnveloppe, IconeJournal, IconeMedias } from '../Icones'
import { TITRE_VIDE, Visuel } from './Apercus'

type Props = {
  /** Adresse locale (blob:) du fichier choisi, ou null si aucun fichier. */
  src: string | null
  type: TypeMedia | null
  titre: string
  /** publication = 1er emplacement de la grille · publicite = Espace publicitaire. */
  formule: Formule
}

// La miniature est une vraie page de 1280 × 720 px, réduite pour tenir dans le cadre.
const LARGEUR = 1280
const HAUTEUR = 720

const NAV = [
  { label: 'Actus', Icone: IconeJournal },
  { label: 'Medias', Icone: IconeMedias },
  { label: 'Contact', Icone: IconeEnveloppe },
]

/**
 * Miniature fidèle de la page d'accueil : montre OÙ le contenu apparaîtra
 * (1er emplacement de la grille, ou Espace publicitaire). Un anneau lumineux le signale.
 */
export default function PreviewHome({ src, type, titre, formule }: Props) {
  const cadre = useRef<HTMLDivElement>(null)
  const [echelle, setEchelle] = useState(0)

  useLayoutEffect(() => {
    const el = cadre.current
    if (!el) return
    const mesurer = () => setEchelle(el.clientWidth / LARGEUR)
    mesurer()
    const observateur = new ResizeObserver(mesurer)
    observateur.observe(el)
    return () => observateur.disconnect()
  }, [])

  const titreAffiche = titre.trim() || TITRE_VIDE
  const anneau = <span className="pulsation pointer-events-none absolute inset-0 rounded-xl ring-[5px] ring-inset ring-white" />
  const pub = formule === 'publicite'

  return (
    <div
      ref={cadre}
      role="img"
      aria-label={
        pub
          ? "Aperçu de la page d'accueil : votre visuel apparaît dans l'espace publicitaire, à droite"
          : `Aperçu de la page d'accueil : votre contenu « ${titreAffiche} » apparaît dans le premier emplacement de la grille`
      }
      className="relative aspect-video w-full overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute left-0 top-0 flex origin-top-left flex-col overflow-hidden rounded-[22px] border-2 border-white/12 bg-page"
        style={{ width: LARGEUR, height: HAUTEUR, transform: `scale(${echelle})`, visibility: echelle ? 'visible' : 'hidden' }}
      >
        {/* En-tête */}
        <div className="surface mx-8 mt-4 flex h-[58px] shrink-0 items-center justify-center gap-4 rounded-xl">
          <img src={asset(LOGO)} alt="" className="h-10 w-10 [image-rendering:pixelated]" />
          <span className="font-jura text-[19px] font-semibold tracking-[0.34em]">{NOM_SITE.toUpperCase()}</span>
        </div>
        <div className="ligne-rouge mx-[150px] shrink-0" />

        <div className="mx-8 my-6 grid min-h-0 flex-1 grid-cols-[134px_minmax(0,1fr)_218px] gap-11">
          {/* Navigation */}
          <div className="relative">
            <div className="surface absolute inset-y-0 left-[16%] right-[16%] rounded-xl" />
            <div className="relative flex h-full flex-col justify-between py-11">
              {NAV.map(({ label, Icone }, i) => (
                <span key={label} className={`pilule flex h-[46px] items-center gap-2.5 rounded-xl pl-5 text-[14px] font-semibold ${i === 0 ? 'text-white' : 'text-texte/85'}`}>
                  <Icone taille={18} className={i === 0 ? 'text-white' : 'text-gris'} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Grille : le contenu le plus récent prend le 1er emplacement */}
          <div className="grid min-h-0 grid-cols-4 grid-rows-3 gap-[13px]">
            {Array.from({ length: NOMBRE_CARTES }, (_, i) =>
              i === 0 && !pub ? (
                <div key={i} className="surface relative flex min-h-0 flex-col overflow-hidden rounded-xl">
                  <span className="relative block min-h-0 flex-1 overflow-hidden bg-black">
                    <Visuel src={src} type={type} ajuste="object-cover" icone={44} />
                  </span>
                  <span className="flex h-8 shrink-0 items-center border-t border-trait px-3">
                    <span className="truncate text-[12.5px] font-medium text-white">{titreAffiche}</span>
                  </span>
                  {anneau}
                </div>
              ) : (
                <div key={i} className="surface flex min-h-0 flex-col overflow-hidden rounded-xl opacity-40">
                  <span className="min-h-0 flex-1 bg-black/40" />
                  <span className="h-8 shrink-0 border-t border-trait" />
                </div>
              ),
            )}
          </div>

          {/* Espace publicitaire */}
          <div className="surface relative flex items-center justify-center overflow-hidden rounded-xl">
            {pub ? (
              <>
                <Visuel src={src} type={type} ajuste="object-cover" icone={56} />
                {anneau}
              </>
            ) : (
              <span className="font-jura text-[13px] tracking-[0.14em] text-gris/80">{TEXTES.pubVide}</span>
            )}
          </div>
        </div>

        {/* Pied de page */}
        <div className="flex h-[72px] shrink-0 flex-col items-center justify-center gap-2 border-t border-trait bg-linear-to-b from-surface-haut to-surface-bas">
          <span className="ligne-rouge w-14" />
          <span className="pl-[0.42em] font-jura text-[15px] font-medium leading-none tracking-[0.42em] text-[#c9c9cd]">{TEXTE_FOOTER}</span>
        </div>
      </div>
    </div>
  )
}
