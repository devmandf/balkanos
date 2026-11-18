import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { NOMBRE_CARTES } from '../config'
import { sansAccents } from '../lib/outils'
import type { Media } from '../types'
import { IconeFermer, IconePrecedent, IconeRecherche, IconeSuivant } from './Icones'
import NewsGrid from './NewsGrid'

type Props = {
  /** Tous les médias publiés (images et vidéos), du plus récent au plus ancien. */
  items: Media[]
  onOuvrir: (m: Media) => void
  delaiBase?: number
  inactive?: boolean
}

/** Nombre maximal de numéros de page visibles : « ‹ 1 2 3 4 › ». */
const PAGES_VISIBLES = 4

/** Écrans moyens (1024–1279 px) : la grille fait 3 × 3, donc 9 médias par page au lieu de 12. */
const ECRAN_MOYEN = '(min-width: 1024px) and (max-width: 1279.98px)'
function useTailleDePage(): number {
  const moyen = useSyncExternalStore(
    (rappel) => {
      const requete = window.matchMedia(ECRAN_MOYEN)
      requete.addEventListener('change', rappel)
      return () => requete.removeEventListener('change', rappel)
    },
    () => window.matchMedia(ECRAN_MOYEN).matches,
  )
  return moyen ? 9 : NOMBRE_CARTES
}

/**
 * Section « Médias » : toutes les images et vidéos publiées, avec recherche et pagination.
 * (La section « Actus » ne montre que les 12 plus récentes.)
 */
export default function Medias({ items, onOuvrir, delaiBase, inactive }: Props) {
  const parPage = useTailleDePage()
  const [page, setPage] = useState(1)
  const [recherche, setRecherche] = useState('')
  const [champOuvert, setChampOuvert] = useState(false)
  const champ = useRef<HTMLInputElement>(null)

  const trouves = useMemo(() => {
    const mots = sansAccents(recherche).split(/\s+/).filter(Boolean)
    if (mots.length === 0) return items
    return items.filter((m) => {
      const texte = sansAccents(`${m.titre} ${m.texte ?? ''} ${m.categorie ?? ''}`)
      return mots.every((mot) => texte.includes(mot))
    })
  }, [items, recherche])

  const pages = Math.max(1, Math.ceil(trouves.length / parPage))
  const courante = Math.min(page, pages)
  const visibles = trouves.slice((courante - 1) * parPage, courante * parPage)

  // Une nouvelle recherche (ou un changement de taille de page) ramène à la page 1.
  useEffect(() => setPage(1), [recherche, parPage])
  useEffect(() => {
    if (champOuvert) champ.current?.focus()
  }, [champOuvert])

  // Fenêtre glissante de 4 numéros autour de la page courante.
  const premier = Math.min(Math.max(1, courante - 1), Math.max(1, pages - PAGES_VISIBLES + 1))
  const numeros = Array.from({ length: Math.min(PAGES_VISIBLES, pages) }, (_, i) => premier + i)

  const fermerRecherche = () => {
    setRecherche('')
    setChampOuvert(false)
  }

  const bouton =
    'flex h-10 min-w-10 items-center justify-center rounded-[10px] px-2 text-[13px] font-semibold transition-[color,text-shadow,opacity] duration-200 max-md:h-11 max-md:min-w-11'

  return (
    <div className="flex flex-col gap-3 fit:h-full">
      <div className="min-h-0 fit:flex-1">
        {recherche && trouves.length === 0 ? (
          <p className="surface flex h-full min-h-40 items-center justify-center rounded-xl px-6 text-center text-sm text-gris">
            Aucun média ne correspond à « {recherche} ».
          </p>
        ) : (
          // key = page + recherche : les cartes rejouent leur apparition à chaque changement.
          <NewsGrid
            key={`${courante}-${recherche}`}
            items={visibles}
            taille={parPage}
            onOuvrir={onOuvrir}
            delaiBase={delaiBase}
            inactive={inactive}
            vide="Aucun média pour le moment."
          />
        )}
      </div>

      {/* Barre du bas : recherche · numéros de page · nombre de médias */}
      <div className="grid shrink-0 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 md:grid-cols-[1fr_auto_1fr]">
        {/* Recherche */}
        <div role="search" className="flex min-w-0 items-center gap-2 max-md:col-span-2">
          {champOuvert ? (
            <div className="relative w-full max-w-72">
              <IconeRecherche taille={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gris" />
              <input
                ref={champ}
                type="search"
                className="champ h-10 min-h-0 pl-9 pr-10 text-[13px] [&::-webkit-search-cancel-button]:hidden"
                placeholder="Rechercher un média…"
                aria-label="Rechercher dans les médias"
                maxLength={60}
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') fermerRecherche()
                }}
              />
              <button
                type="button"
                onClick={fermerRecherche}
                aria-label="Fermer la recherche"
                className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gris transition-colors hover:text-white"
              >
                <IconeFermer taille={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-spark
              onClick={() => setChampOuvert(true)}
              className={`pilule glare gap-2 px-3.5 text-texte/85 hover:lueur ${bouton}`}
            >
              <IconeRecherche taille={16} className="text-gris" />
              Rechercher
            </button>
          )}
        </div>

        {/* Pagination : ‹ 1 2 3 4 › */}
        <nav aria-label="Pages des médias" className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage(courante - 1)}
            disabled={courante <= 1}
            aria-label="Page précédente"
            className={`pilule text-texte/85 hover:lueur disabled:pointer-events-none disabled:opacity-35 ${bouton}`}
          >
            <IconePrecedent taille={17} />
          </button>
          {numeros.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              aria-label={`Page ${n}`}
              aria-current={n === courante ? 'page' : undefined}
              className={`font-jura ${bouton} ${n === courante ? 'lueur border border-white/50 bg-white/8' : 'border border-transparent text-gris hover:text-white'}`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage(courante + 1)}
            disabled={courante >= pages}
            aria-label="Page suivante"
            className={`pilule text-texte/85 hover:lueur disabled:pointer-events-none disabled:opacity-35 ${bouton}`}
          >
            <IconeSuivant taille={17} />
          </button>
        </nav>

        {/* Compteur */}
        <p aria-live="polite" className="justify-self-end whitespace-nowrap font-jura text-xs text-gris">
          {trouves.length} média{trouves.length > 1 ? 's' : ''} · page {courante}/{pages}
        </p>
      </div>
    </div>
  )
}
