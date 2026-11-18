import { NOMBRE_CARTES } from '../config'
import type { Media } from '../types'
import NewsCard from './NewsCard'

type Props = {
  items: Media[]
  onOuvrir: (m: Media) => void
  /** Délai avant l'apparition de la première carte (secondes). */
  delaiBase?: number
  /** Désactive la grille pendant qu'une carte est agrandie. */
  inactive?: boolean
  /** Message affiché quand il n'y a aucun contenu (téléphone / tablette, ou recherche sans résultat). */
  vide?: string
  /** Nombre d'emplacements de la grille (12 par défaut ; 9 sur les écrans moyens dans Médias). */
  taille?: number
}

/**
 * Grille de la zone centrale. Le contenu le plus récent occupe le 1er emplacement.
 * ≥ 1280 px : 4 × 3 (12 cartes) · 1024–1279 px : 3 × 3 (9 cartes) · tablette : 2 colonnes · mobile : 1 colonne.
 * Sur ordinateur, les emplacements libres restent visibles (cases vides), comme sur la maquette.
 */
export default function NewsGrid({ items, onOuvrir, delaiBase = 0, inactive = false, vide, taille = NOMBRE_CARTES }: Props) {
  const libres = Math.max(0, taille - items.length)

  return (
    <>
      {items.length === 0 && (
        <p className="surface flex min-h-40 items-center justify-center rounded-xl px-6 text-center text-sm text-gris fit:hidden">
          {vide ?? 'Aucun contenu pour le moment.'}
        </p>
      )}

      <div
        inert={inactive}
        className={`grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 fit:grid fit:h-full fit:grid-rows-3 fit:gap-[clamp(10px,1.7dvh,18px)] ${
          items.length === 0 ? 'hidden' : 'grid'
        }`}
      >
        {items.slice(0, taille).map((m, i) => (
          <NewsCard key={m.id} media={m} index={i} delaiBase={delaiBase} onOuvrir={onOuvrir} />
        ))}

        {/* Emplacements libres (ordinateur uniquement). */}
        {Array.from({ length: libres }, (_, i) => (
          <div
            key={`libre-${i}`}
            aria-hidden
            className="surface hidden min-h-0 flex-col overflow-hidden rounded-xl opacity-40 fit:flex lg:max-xl:nth-[n+10]:hidden"
          >
            <span className="min-h-0 flex-1 bg-black/40" />
            <span className="h-8 shrink-0 border-t border-trait" />
          </div>
        ))}
      </div>
    </>
  )
}
