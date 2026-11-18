import { useId, useRef, useState, type FormEvent } from 'react'
import { LIMITES } from '../../config'
import { backend } from '../../lib/backend'
import { FORMATS_ACCEPTES, TEXTE_FORMATS, poids, verifierFichier } from '../../lib/fichiers'
import { useNavigation } from '../../lib/session'
import type { Formule, TypeMedia } from '../../types'
import { ApercuCarte, ApercuPub } from '../contact/Apercus'

const VIDE = { titre: '', description: '', lien: '' }

/**
 * Admin : ajouter soi-même un contenu, publié tout de suite (sans paiement, sans date de fin).
 * Il prend la première place de la grille, ou l'Espace publicitaire.
 */
export default function PublierDirect() {
  const id = useId()
  const { rafraichir } = useNavigation()
  const selecteur = useRef<HTMLInputElement>(null)
  const [formule, setFormule] = useState<Formule>('publication')
  const [champs, setChamps] = useState(VIDE)
  const [fichier, setFichier] = useState<{ fichier: File; url: string; type: TypeMedia } | null>(null)
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const pub = formule === 'publicite'

  const choisir = async (f: File | undefined) => {
    if (!f) return
    const url = URL.createObjectURL(f)
    const { type, erreur } = await verifierFichier(f, url)
    if (erreur || !type) {
      URL.revokeObjectURL(url)
      setMessage({ texte: erreur ?? 'Fichier refusé.', erreur: true })
      return
    }
    if (fichier) URL.revokeObjectURL(fichier.url)
    setMessage(null)
    setFichier({ fichier: f, url, type })
  }

  const publier = async (e: FormEvent) => {
    e.preventDefault()
    if (champs.titre.trim().length < 3) return setMessage({ texte: 'Ajoutez un titre (3 caractères minimum).', erreur: true })
    if (!fichier) return setMessage({ texte: 'Ajoutez une image ou une vidéo.', erreur: true })
    const lien = champs.lien.trim()
    if (pub && lien && !/^https?:\/\/\S+\.\S+/i.test(lien)) return setMessage({ texte: 'Le lien doit commencer par https://', erreur: true })

    setEnvoi(true)
    setMessage(null)
    try {
      await backend.publierDirect({
        formule,
        titre: champs.titre.trim(),
        description: champs.description.trim(),
        lien: pub ? lien : '',
        fichier: fichier.fichier,
        typeMedia: fichier.type,
      })
      URL.revokeObjectURL(fichier.url)
      setFichier(null)
      setChamps(VIDE)
      if (selecteur.current) selecteur.current.value = ''
      rafraichir()
      setMessage({ texte: pub ? "C'est en ligne : la publicité est affichée dans l'Espace publicitaire." : "C'est en ligne : le contenu occupe la première place de la grille.", erreur: false })
    } catch (err) {
      setMessage({ texte: err instanceof Error ? err.message : 'La publication a échoué.', erreur: true })
    } finally {
      setEnvoi(false)
    }
  }

  const choix = (f: Formule, nom: string) => (
    <button
      type="button"
      aria-pressed={formule === f}
      onClick={() => setFormule(f)}
      className={`h-10 flex-1 rounded-md px-3 text-[13px] font-semibold transition-colors duration-200 ${formule === f ? 'bg-white/12 text-white' : 'text-gris hover:text-white'}`}
    >
      {nom}
    </button>
  )

  return (
    <form onSubmit={publier} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-3">
        <p className="text-[13px] leading-relaxed text-gris">
          Publié immédiatement, sans paiement ni date de fin. Pour le retirer : onglet « Demandes reçues » → « Retirer du site » ou supprimer.
        </p>

        <div role="group" aria-label="Emplacement" className="flex rounded-lg border border-trait p-0.5">
          {choix('publication', 'Dans la grille')}
          {choix('publicite', 'Espace publicitaire')}
        </div>

        <div>
          <label htmlFor={`${id}-titre`} className="mb-1 flex justify-between text-xs font-medium text-texte/85">
            Titre <span className="font-jura font-normal tabular-nums text-gris">{champs.titre.length}/{LIMITES.titre}</span>
          </label>
          <input id={`${id}-titre`} className="champ" maxLength={LIMITES.titre} value={champs.titre} onChange={(e) => setChamps({ ...champs, titre: e.target.value })} />
        </div>

        <div>
          <label htmlFor={`${id}-description`} className="mb-1 flex justify-between text-xs font-medium text-texte/85">
            Description <span className="font-jura font-normal tabular-nums text-gris">{champs.description.length}/{LIMITES.description}</span>
          </label>
          <textarea
            id={`${id}-description`}
            className="champ h-24 resize-none py-2.5 leading-relaxed"
            maxLength={LIMITES.description}
            value={champs.description}
            onChange={(e) => setChamps({ ...champs, description: e.target.value })}
          />
        </div>

        {pub && (
          <div>
            <label htmlFor={`${id}-lien`} className="mb-1 block text-xs font-medium text-texte/85">
              Lien ouvert au clic <span className="font-normal text-gris">(optionnel)</span>
            </label>
            <input id={`${id}-lien`} className="champ" type="url" placeholder="https://…" maxLength={200} value={champs.lien} onChange={(e) => setChamps({ ...champs, lien: e.target.value })} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-white/18 bg-white/[0.02] px-4 py-3">
          <input ref={selecteur} type="file" accept={FORMATS_ACCEPTES} aria-label="Image ou vidéo" onChange={(e) => void choisir(e.target.files?.[0])} className="sr-only" tabIndex={-1} />
          <button type="button" onClick={() => selecteur.current?.click()} className="pilule glare h-10 rounded-lg px-4 text-xs font-semibold text-texte hover:lueur">
            {fichier ? 'Changer de fichier' : 'Choisir une image ou une vidéo'}
          </button>
          <p className="min-w-0 flex-1 truncate font-jura text-[11px] text-gris">
            {fichier ? `${fichier.fichier.name} · ${poids(fichier.fichier.size)}` : TEXTE_FORMATS}
          </p>
        </div>

        {message && (
          <p role="alert" className={`text-xs font-medium leading-relaxed ${message.erreur ? 'text-[#ff6b72]' : 'text-white'}`}>
            {message.texte}
          </p>
        )}

        <button
          type="submit"
          data-spark
          disabled={envoi}
          className="glare h-12 rounded-xl bg-white text-sm font-semibold text-black shadow-[0_0_28px_-6px_rgba(255,255,255,0.55)] transition-[filter,opacity] duration-200 hover:brightness-110 disabled:opacity-60"
        >
          {envoi ? 'Publication…' : 'Publier maintenant'}
        </button>
      </div>

      <div className="min-w-0 rounded-xl border border-trait bg-black/30 p-4">
        {pub ? (
          <ApercuPub src={fichier?.url ?? null} type={fichier?.type ?? null} titre={champs.titre} format="ordinateur" />
        ) : (
          <ApercuCarte src={fichier?.url ?? null} type={fichier?.type ?? null} titre={champs.titre} />
        )}
      </div>
    </form>
  )
}
