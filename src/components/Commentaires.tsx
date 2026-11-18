import { useEffect, useId, useState, type FormEvent } from 'react'
import { LIMITES } from '../config'
import { backend } from '../lib/backend'
import { ilYA } from '../lib/outils'
import { useNavigation, useSession } from '../lib/session'
import type { Commentaire } from '../types'
import { IconeCorbeille, IconeEnvoyer } from './Icones'

/**
 * Commentaires d'une image ou d'une vidéo : messages très courts (100 caractères),
 * le plus récent en haut. Il faut être connecté pour écrire ; tout le monde peut lire.
 */
export default function Commentaires({ mediaId }: { mediaId: string }) {
  const id = useId()
  const { utilisateur } = useSession()
  const { aller } = useNavigation()
  const [liste, setListe] = useState<Commentaire[] | null>(null)
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let actif = true
    setListe(null)
    backend
      .commentaires(mediaId)
      .then((l) => actif && setListe(l))
      .catch(() => actif && setListe([]))
    return () => {
      actif = false
    }
    // On recharge aussi quand la personne connectée change (pour savoir quels messages sont les siens).
  }, [mediaId, utilisateur?.id])

  const envoyer = async (e: FormEvent) => {
    e.preventDefault()
    if (!texte.trim() || envoi) return
    setEnvoi(true)
    setErreur('')
    try {
      const nouveau = await backend.commenter(mediaId, texte)
      setListe((l) => [nouveau, ...(l ?? [])]) // le plus récent en haut
      setTexte('')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'envoi a échoué.")
    } finally {
      setEnvoi(false)
    }
  }

  const supprimer = async (c: Commentaire) => {
    setErreur('')
    try {
      await backend.supprimerCommentaire(c.id)
      setListe((l) => (l ?? []).filter((x) => x.id !== c.id))
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Suppression impossible.')
    }
  }

  const peutSupprimer = (c: Commentaire) => c.aMoi || utilisateur?.role === 'admin'

  return (
    <section aria-labelledby={`${id}-titre`} className="flex min-h-0 flex-1 flex-col">
      <h3 id={`${id}-titre`} className="shrink-0 px-5 pb-2 pt-4 font-jura text-[11px] font-semibold uppercase tracking-[0.2em] text-gris xl:px-6">
        Commentaires{liste && liste.length > 0 ? ` · ${liste.length}` : ''}
      </h3>

      <ul className="defile min-h-16 flex-1 space-y-2.5 px-5 pb-3 xl:px-6">
        {liste === null && <li className="text-xs text-gris">Chargement…</li>}
        {liste?.length === 0 && <li className="text-xs leading-relaxed text-gris">Aucun commentaire pour le moment. Soyez le premier à réagir.</li>}
        {liste?.map((c) => (
          <li key={c.id} className="group/com rounded-lg border border-trait bg-white/[0.025] px-3 py-2">
            <p className="flex items-baseline gap-2 text-[11px]">
              <span className="truncate font-semibold text-white">{c.pseudo}</span>
              <span className="shrink-0 font-jura text-gris">{ilYA(c.date)}</span>
              {peutSupprimer(c) && (
                <button
                  type="button"
                  onClick={() => void supprimer(c)}
                  aria-label={`Supprimer le commentaire de ${c.pseudo}`}
                  className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center self-center rounded text-gris opacity-60 transition-[color,opacity] hover:text-white hover:opacity-100"
                >
                  <IconeCorbeille taille={13} />
                </button>
              )}
            </p>
            <p className="mt-0.5 text-[13px] leading-snug text-texte/90 [overflow-wrap:anywhere]">{c.texte}</p>
          </li>
        ))}
      </ul>

      <div className="shrink-0 border-t border-trait px-5 py-3 xl:px-6">
        {utilisateur ? (
          <form onSubmit={envoyer} className="flex items-center gap-2">
            <label htmlFor={`${id}-champ`} className="sr-only">
              Votre commentaire ({LIMITES.commentaire} caractères maximum)
            </label>
            <div className="relative min-w-0 flex-1">
              <input
                id={`${id}-champ`}
                className="champ pr-14"
                placeholder="Votre commentaire…"
                maxLength={LIMITES.commentaire}
                autoComplete="off"
                value={texte}
                onChange={(e) => setTexte(e.target.value)}
              />
              <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-jura text-[11px] tabular-nums text-gris">
                {texte.length}/{LIMITES.commentaire}
              </span>
            </div>
            <button
              type="submit"
              data-spark
              disabled={envoi || !texte.trim()}
              aria-label="Envoyer le commentaire"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white text-black transition-opacity disabled:opacity-40"
            >
              <IconeEnvoyer taille={18} />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => aller('compte')}
            className="pilule glare h-11 w-full rounded-[10px] text-[13px] font-semibold text-texte transition-[color,text-shadow] duration-300 hover:lueur"
          >
            Se connecter pour commenter
          </button>
        )}
        {erreur && (
          <p role="alert" className="mt-1.5 text-[11px] font-medium text-[#ff6b72]">
            {erreur}
          </p>
        )}
      </div>
    </section>
  )
}
