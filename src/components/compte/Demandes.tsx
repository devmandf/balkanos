import { useCallback, useEffect, useRef, useState } from 'react'
import { LIMITES, NOM_OFFRE_GRATUITE, NOM_SITE, OPERATEURS, PAIEMENT_ACTIF } from '../../config'
import { backend } from '../../lib/backend'
import { FORMATS_ACCEPTES, poids, verifierFichier } from '../../lib/fichiers'
import { NOM_FORMULE, dateCourte, enregistrerFichier, lienPropre, prix, slug, tarif } from '../../lib/outils'
import { useNavigation } from '../../lib/session'
import type { Demande, Statut, TypeMedia } from '../../types'
import { IconeCoche, IconeCorbeille, IconeCrayon, IconeFermer, IconeHorloge, IconeTelecharger } from '../Icones'

const JOUR = 24 * 60 * 60 * 1000

const STATUTS: Record<Statut, { nom: string; classe: string; Icone: typeof IconeCoche }> = {
  en_attente: { nom: 'En attente', classe: 'border-white/15 text-gris', Icone: IconeHorloge },
  publie: { nom: 'Acceptée', classe: 'border-white/50 text-white', Icone: IconeCoche },
  refuse: { nom: 'Refusée', classe: 'border-rouge/70 text-[#ff6b72]', Icone: IconeFermer },
}

export function BadgeStatut({ statut }: { statut: Statut }) {
  const { nom, classe, Icone } = STATUTS[statut]
  return (
    <span className={`inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold ${classe}`}>
      <Icone taille={12} strokeWidth={2.4} />
      {nom}
    </span>
  )
}

/** Contenu ajouté directement par l'admin (onglet « Publier un contenu ») : il n'a pas de date de fin. */
const directe = (d: Demande) => d.nom === NOM_SITE && !d.telephone

/** « En ligne jusqu'au 24 nov. 2026 » pour un contenu de membre accepté (payant ou gratuit). */
function echeance(d: Demande): string | null {
  if (d.statut !== 'publie' || !d.datePublication) return null
  if (directe(d)) return 'En ligne (sans date de fin)'
  const fin = new Date(d.datePublication).getTime() + tarif(d.formule).jours * JOUR
  return fin > Date.now() ? `En ligne jusqu'au ${dateCourte(new Date(fin).toISOString())}` : 'Affichage terminé'
}

function Vignette({ d, lecture = false }: { d: Demande; lecture?: boolean }) {
  return (
    <span className={`block shrink-0 overflow-hidden rounded-lg bg-black ${lecture ? 'h-28 w-full sm:w-44' : 'h-16 w-24'}`}>
      {!d.urlMedia ? null : d.typeMedia === 'video' ? (
        <video src={d.urlMedia} controls={lecture} muted playsInline preload="metadata" className="h-full w-full object-cover" />
      ) : (
        <img src={d.urlMedia} alt="" className="h-full w-full object-cover" />
      )}
    </span>
  )
}

function useDemandes(charge: () => Promise<Demande[]>) {
  const [demandes, setDemandes] = useState<Demande[] | null>(null)
  const [erreur, setErreur] = useState('')
  const recharger = useCallback(() => {
    charge()
      .then((l) => {
        setDemandes(l)
        setErreur('')
      })
      .catch((e: unknown) => setErreur(e instanceof Error ? e.message : 'Chargement impossible.'))
  }, [charge])
  useEffect(recharger, [recharger])
  return { demandes, erreur, setErreur, recharger }
}

const chargerLesMiennes = () => backend.mesDemandes()
const chargerToutes = () => backend.toutesLesDemandes()

const boutonSecondaire =
  'pilule flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-texte transition-[color,text-shadow] duration-300 hover:lueur'

/* ================================================================ Membre */

/** Tableau de bord du membre : où en est chaque demande. */
export function MesDemandes() {
  const { aller } = useNavigation()
  const { demandes, erreur, recharger } = useDemandes(chargerLesMiennes)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-gris">Suivez ici l'avancement de vos envois.</p>
        <div className="flex gap-2">
          <button type="button" onClick={recharger} className={boutonSecondaire}>
            Actualiser
          </button>
          <button type="button" data-spark onClick={() => aller('contact')} className="h-9 rounded-lg bg-white px-3 text-xs font-semibold text-black">
            Publier un contenu
          </button>
        </div>
      </div>

      {erreur && (
        <p role="alert" className="text-xs font-medium text-[#ff6b72]">
          {erreur}
        </p>
      )}
      {demandes === null && !erreur && <p className="text-sm text-gris">Chargement…</p>}
      {demandes?.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-gris">
          Vous n'avez encore rien envoyé. Cliquez sur « Publier un contenu » pour commencer.
        </p>
      )}

      <ul className="flex flex-col gap-2.5">
        {demandes?.map((d) => (
          <li key={d.id} className="flex gap-3 rounded-xl border border-trait bg-white/[0.025] p-3">
            <Vignette d={d} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 text-sm font-semibold leading-snug text-white [overflow-wrap:anywhere]">{d.titre}</p>
                <BadgeStatut statut={d.statut} />
              </div>
              <p className="mt-0.5 font-jura text-xs text-gris">
                {NOM_FORMULE[d.formule]} · {d.montant > 0 ? prix(d.montant) : NOM_OFFRE_GRATUITE} · envoyée le {dateCourte(d.date)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-texte/80">
                {d.statut === 'en_attente' && (PAIEMENT_ACTIF ? 'Paiement et contenu en cours de vérification.' : 'Contenu en cours de vérification par l’équipe Balkanos.')}
                {d.statut === 'publie' && echeance(d)}
                {d.statut === 'refuse' && (d.motifRefus ? `Motif : ${d.motifRefus}` : d.montant > 0 ? 'Votre demande n’a pas été retenue. Vous serez contacté pour le remboursement.' : 'Votre demande n’a pas été retenue.')}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ================================================================= Admin */

type Filtre = Statut | 'toutes'
const FILTRES: { id: Filtre; nom: string }[] = [
  { id: 'en_attente', nom: 'En attente' },
  { id: 'publie', nom: 'Acceptées' },
  { id: 'refuse', nom: 'Refusées' },
  { id: 'toutes', nom: 'Toutes' },
]

/** Espace admin : voir, accepter, refuser, télécharger, supprimer les demandes reçues. */
export function DemandesRecues() {
  const { rafraichir } = useNavigation()
  const { demandes, erreur, setErreur, recharger } = useDemandes(chargerToutes)
  const [filtre, setFiltre] = useState<Filtre>('en_attente')
  const [refus, setRefus] = useState<{ id: string; motif: string } | null>(null)
  const [aSupprimer, setASupprimer] = useState<string | null>(null)
  const [occupe, setOccupe] = useState<string | null>(null)
  const [edition, setEdition] = useState<Edition | null>(null)

  const agir = async (id: string, action: () => Promise<void>, rechargerApres = true) => {
    setErreur('')
    setOccupe(id)
    try {
      await action()
      if (rechargerApres) {
        recharger()
        rafraichir() // met à jour la grille et l'espace publicitaire
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Action impossible.')
    } finally {
      setOccupe(null)
    }
  }

  const telecharger = (d: Demande) =>
    agir(
      d.id,
      async () => {
        const blob = await backend.telechargerMedia(d)
        const extension = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || (d.typeMedia === 'video' ? 'mp4' : 'jpg')
        enregistrerFichier(blob, `balkanos-${slug(d.titre)}.${extension}`)
      },
      false,
    )

  const compte = (f: Filtre) => (demandes ?? []).filter((d) => f === 'toutes' || d.statut === f).length
  const visibles = (demandes ?? []).filter((d) => filtre === 'toutes' || d.statut === filtre)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Filtrer les demandes" className="flex flex-wrap gap-1.5">
          {FILTRES.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filtre === f.id}
              onClick={() => setFiltre(f.id)}
              className={`h-9 rounded-lg border px-3 text-xs font-semibold transition-colors duration-200 ${
                filtre === f.id ? 'border-white/55 bg-white/8 text-white' : 'border-trait text-gris hover:text-white'
              }`}
            >
              {f.nom} <span className="ml-1 font-jura tabular-nums opacity-70">{compte(f.id)}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={recharger} className={boutonSecondaire}>
          Actualiser
        </button>
      </div>

      {erreur && (
        <p role="alert" className="text-xs font-medium text-[#ff6b72]">
          {erreur}
        </p>
      )}
      {demandes === null && !erreur && <p className="text-sm text-gris">Chargement…</p>}
      {demandes && visibles.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-gris">Aucune demande dans cette liste.</p>
      )}

      <ul className="flex flex-col gap-3">
        {visibles.map((d) => (
          <li key={d.id} className={`rounded-xl border border-trait bg-white/[0.025] p-3 transition-opacity ${occupe === d.id ? 'opacity-60' : ''}`}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Vignette d={d} lecture />

              <div className="min-w-0 flex-1 text-xs leading-relaxed text-texte/80">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 text-sm font-semibold leading-snug text-white [overflow-wrap:anywhere]">{d.titre}</p>
                  <BadgeStatut statut={d.statut} />
                </div>
                <p className="mt-0.5 font-jura text-gris">
                  {NOM_FORMULE[d.formule]} · {d.typeMedia === 'video' ? 'Vidéo' : 'Image'} · reçue le {dateCourte(d.date)}
                  {echeance(d) && ` · ${echeance(d)}`}
                </p>
                {d.description && <p className="mt-1.5 [overflow-wrap:anywhere]">{d.description}</p>}
                {d.lien && (
                  <p className="mt-1 [overflow-wrap:anywhere]">
                    Lien :{' '}
                    <a href={d.lien} target="_blank" rel="noopener noreferrer" className="text-white underline decoration-white/40 underline-offset-2">
                      {d.lien}
                    </a>
                  </p>
                )}
                {!directe(d) ? (
                  <dl className="mt-2 grid gap-x-4 gap-y-0.5 rounded-lg bg-black/25 px-3 py-2 sm:grid-cols-2">
                    <div>
                      <dt className="inline text-gris">Nom : </dt>
                      <dd className="inline text-texte">{d.nom}</dd>
                    </div>
                    <div>
                      <dt className="inline text-gris">Téléphone : </dt>
                      <dd className="inline font-jura font-semibold text-texte">{d.telephone}</dd>
                    </div>
                    {d.montant > 0 && (
                    <>
                    <div>
                      <dt className="inline text-gris">Paiement : </dt>
                      <dd className="inline text-texte">
                        {prix(d.montant)} · {OPERATEURS.find((o) => o.id === d.operateur)?.nom ?? d.operateur}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-gris">Référence : </dt>
                      <dd className="inline font-jura font-semibold text-white">{d.refTransaction}</dd>
                    </div>
                    </>
                    )}
                    {d.email && (
                      <div className="sm:col-span-2">
                        <dt className="inline text-gris">E-mail : </dt>
                        <dd className="inline text-texte [overflow-wrap:anywhere]">{d.email}</dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <p className="mt-1.5 text-gris">Contenu ajouté directement par l'administration.</p>
                )}
                {d.statut === 'refuse' && d.motifRefus && <p className="mt-1.5 text-[#ff6b72]">Motif du refus : {d.motifRefus}</p>}
              </div>
            </div>

            {edition?.id === d.id ? (
              <FormulaireModification
                d={d}
                edition={edition}
                onChange={setEdition}
                onFermer={() => setEdition(null)}
                onEnregistre={() => {
                  setEdition(null)
                  recharger()
                  rafraichir() // met à jour la grille et l'espace publicitaire
                }}
              />
            ) : (
            /* Actions */
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-trait pt-3">
              {refus?.id === d.id ? (
                <>
                  <input
                    className="champ h-9 min-h-0 min-w-40 flex-1 text-xs"
                    placeholder="Motif du refus (facultatif, visible par la personne)"
                    maxLength={160}
                    autoFocus
                    value={refus.motif}
                    onChange={(e) => setRefus({ id: d.id, motif: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const motif = refus.motif
                      setRefus(null)
                      void agir(d.id, () => backend.changerStatut(d.id, 'refuse', motif))
                    }}
                    className="h-9 rounded-lg border border-rouge/70 px-3 text-xs font-semibold text-[#ff6b72] hover:bg-rouge/15"
                  >
                    Confirmer le refus
                  </button>
                  <button type="button" onClick={() => setRefus(null)} className={boutonSecondaire}>
                    Annuler
                  </button>
                </>
              ) : aSupprimer === d.id ? (
                <>
                  <p className="flex-1 text-xs text-texte/85">Supprimer définitivement cette demande et son fichier ?</p>
                  <button
                    type="button"
                    onClick={() => {
                      setASupprimer(null)
                      void agir(d.id, () => backend.supprimerDemande(d.id))
                    }}
                    className="h-9 rounded-lg border border-rouge/70 px-3 text-xs font-semibold text-[#ff6b72] hover:bg-rouge/15"
                  >
                    Oui, supprimer
                  </button>
                  <button type="button" onClick={() => setASupprimer(null)} className={boutonSecondaire}>
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  {d.statut !== 'publie' && (
                    <button
                      type="button"
                      data-spark
                      disabled={occupe === d.id}
                      onClick={() => void agir(d.id, () => backend.changerStatut(d.id, 'publie'))}
                      className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-xs font-semibold text-black"
                    >
                      <IconeCoche taille={14} strokeWidth={2.6} />
                      Accepter
                    </button>
                  )}
                  {d.statut !== 'refuse' && (
                    <button type="button" disabled={occupe === d.id} onClick={() => setRefus({ id: d.id, motif: '' })} className={boutonSecondaire}>
                      <IconeFermer taille={13} />
                      {d.statut === 'publie' ? 'Retirer du site' : 'Refuser'}
                    </button>
                  )}
                  {d.statut !== 'en_attente' && (
                    <button type="button" disabled={occupe === d.id} onClick={() => void agir(d.id, () => backend.changerStatut(d.id, 'en_attente'))} className={boutonSecondaire}>
                      Remettre en attente
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={occupe === d.id}
                    onClick={() => {
                      setRefus(null)
                      setASupprimer(null)
                      setEdition({ id: d.id, titre: d.titre, description: d.description, lien: d.lien, fichier: null })
                    }}
                    className={boutonSecondaire}
                  >
                    <IconeCrayon taille={14} />
                    Modifier
                  </button>
                  <span className="flex-1" />
                  <button type="button" disabled={occupe === d.id} onClick={() => void telecharger(d)} className={boutonSecondaire}>
                    <IconeTelecharger taille={14} />
                    Télécharger {d.typeMedia === 'video' ? 'la vidéo' : "l'image"}
                  </button>
                  <button type="button" disabled={occupe === d.id} onClick={() => setASupprimer(d.id)} aria-label="Supprimer la demande" className={`${boutonSecondaire} w-9 px-0 text-gris`}>
                    <IconeCorbeille taille={14} />
                  </button>
                </>
              )}
            </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ======================================================== Modification */

type Edition = {
  id: string
  titre: string
  description: string
  lien: string
  /** Nouveau média choisi (null = garder l'actuel). */
  fichier: { fichier: File; url: string; type: TypeMedia } | null
}

/** Admin : modifier le titre, la description, le lien (publicité) et remplacer le média. */
function FormulaireModification({
  d,
  edition,
  onChange,
  onFermer,
  onEnregistre,
}: {
  d: Demande
  edition: Edition
  onChange: (e: Edition) => void
  onFermer: () => void
  onEnregistre: () => void
}) {
  const selecteur = useRef<HTMLInputElement>(null)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const pub = d.formule === 'publicite'

  // Libère l'aperçu du nouveau fichier quand le formulaire se ferme.
  const apercu = useRef<string | null>(null)
  apercu.current = edition.fichier?.url ?? null
  useEffect(
    () => () => {
      if (apercu.current) URL.revokeObjectURL(apercu.current)
    },
    [],
  )

  const choisir = async (f: File | undefined) => {
    if (!f) return
    const url = URL.createObjectURL(f)
    const { type, erreur: refus } = await verifierFichier(f, url)
    if (refus || !type) {
      URL.revokeObjectURL(url)
      setErreur(refus ?? 'Fichier refusé.')
      return
    }
    if (edition.fichier) URL.revokeObjectURL(edition.fichier.url)
    setErreur('')
    onChange({ ...edition, fichier: { fichier: f, url, type } })
  }

  const enregistrer = async () => {
    const titre = edition.titre.trim()
    if (titre.length < 3) return setErreur('Le titre doit faire au moins 3 caractères.')
    const lien = pub && edition.lien.trim() ? lienPropre(edition.lien) : ''
    if (pub && edition.lien.trim() && !lien) return setErreur('Lien incorrect. Exemple : https://monsite.sn')
    setEnvoi(true)
    setErreur('')
    try {
      await backend.modifierDemande(d.id, {
        titre,
        description: edition.description,
        lien,
        fichier: edition.fichier?.fichier,
        typeMedia: edition.fichier?.type,
      })
      onEnregistre()
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'La modification a échoué.')
      setEnvoi(false)
    }
  }

  const etiquette = 'mb-1 flex items-baseline justify-between gap-3 text-xs font-medium text-texte/85'

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-trait pt-3">
      <p className="text-xs font-semibold text-white">Modifier {d.statut === 'publie' ? 'la publication en ligne' : 'la demande'}</p>

      <div>
        <label htmlFor={`modif-titre-${d.id}`} className={etiquette}>
          <span>Titre</span>
          <span className="font-jura font-normal tabular-nums text-gris">
            {edition.titre.length}/{LIMITES.titre}
          </span>
        </label>
        <input
          id={`modif-titre-${d.id}`}
          className="champ"
          maxLength={LIMITES.titre}
          value={edition.titre}
          onChange={(e) => onChange({ ...edition, titre: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor={`modif-description-${d.id}`} className={etiquette}>
          <span>Description</span>
          <span className="font-jura font-normal tabular-nums text-gris">
            {edition.description.length}/{LIMITES.description}
          </span>
        </label>
        <textarea
          id={`modif-description-${d.id}`}
          className="champ h-24 resize-none py-2.5 leading-relaxed"
          maxLength={LIMITES.description}
          value={edition.description}
          onChange={(e) => onChange({ ...edition, description: e.target.value })}
        />
      </div>

      {pub && (
        <div>
          <label htmlFor={`modif-lien-${d.id}`} className={etiquette}>
            <span>Lien ouvert au clic</span>
            <span className="font-normal text-gris">optionnel</span>
          </label>
          <input
            id={`modif-lien-${d.id}`}
            className="champ"
            type="url"
            inputMode="url"
            placeholder="https://…"
            maxLength={200}
            value={edition.lien}
            onChange={(e) => onChange({ ...edition, lien: e.target.value })}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={selecteur}
          type="file"
          accept={FORMATS_ACCEPTES}
          aria-label="Nouvelle image ou vidéo"
          onChange={(e) => void choisir(e.target.files?.[0])}
          className="sr-only"
          tabIndex={-1}
        />
        {edition.fichier && (
          <span className="block h-14 w-24 shrink-0 overflow-hidden rounded-md bg-black">
            {edition.fichier.type === 'video' ? (
              <video src={edition.fichier.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
            ) : (
              <img src={edition.fichier.url} alt="" className="h-full w-full object-cover" />
            )}
          </span>
        )}
        <button type="button" onClick={() => selecteur.current?.click()} className={boutonSecondaire}>
          {edition.fichier ? 'Choisir un autre fichier' : `Remplacer ${d.typeMedia === 'video' ? 'la vidéo' : "l'image"}`}
        </button>
        {edition.fichier ? (
          <>
            <span className="min-w-0 truncate font-jura text-[11px] text-gris">
              {edition.fichier.fichier.name} · {poids(edition.fichier.fichier.size)}
            </span>
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(edition.fichier!.url)
                if (selecteur.current) selecteur.current.value = ''
                onChange({ ...edition, fichier: null })
              }}
              className="text-[11px] text-gris underline underline-offset-2 hover:text-white"
            >
              Garder le média actuel
            </button>
          </>
        ) : (
          <span className="text-[11px] text-gris">Facultatif : sinon le média actuel est gardé.</span>
        )}
      </div>

      {erreur && (
        <p role="alert" className="text-[11px] font-medium text-[#ff6b72]">
          {erreur}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-spark
          disabled={envoi}
          onClick={() => void enregistrer()}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-xs font-semibold text-black disabled:opacity-60"
        >
          <IconeCoche taille={14} strokeWidth={2.6} />
          {envoi ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" disabled={envoi} onClick={onFermer} className={boutonSecondaire}>
          Annuler
        </button>
      </div>
    </div>
  )
}
