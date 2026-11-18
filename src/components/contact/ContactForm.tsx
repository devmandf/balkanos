import { useEffect, useId, useRef, useState, type ComponentType, type DragEvent, type FormEvent, type ReactNode } from 'react'
import { LIMITES, PAIEMENT_ACTIF } from '../../config'
import { FORMATS_ACCEPTES, TEXTE_FORMATS, poids, verifierFichier } from '../../lib/fichiers'
import { etiquettePrix, lienPropre, tarif } from '../../lib/outils'
import { useSession } from '../../lib/session'
import type { Formule } from '../../types'
import { AuthModal } from '../compte/AuthPanel'
import { IconeAnnonce, IconeFermer, IconeGrille, IconeTeleverser } from '../Icones'
import { ApercuAgrandi, ApercuCarte, ApercuPub } from './Apercus'
import Conditions from './Conditions'
import type { Brouillon } from './Contact'
import PreviewHome from './PreviewHome'

type Props = {
  brouillon: Brouillon
  onChange: (b: Brouillon) => void
  /** Appelé avec le formulaire complet et vérifié (la personne est connectée). */
  onValider: (b: Brouillon) => void
  /** Envoi en cours (mode gratuit : le formulaire est envoyé directement). */
  envoi?: boolean
  erreurEnvoi?: string
}

type Erreurs = Partial<Record<'nom' | 'telephone' | 'email' | 'titre' | 'lien' | 'fichier' | 'accepte', string>>

const FORMULES: { id: Formule; nom: string; detail: string; Icone: ComponentType<{ taille?: number; className?: string }> }[] = [
  { id: 'publication', nom: 'Publication', detail: "Votre image ou vidéo dans la grille de la page d'accueil, avec titre, description et commentaires.", Icone: IconeGrille },
  { id: 'publicite', nom: 'Publicité', detail: "Votre visuel dans l'Espace publicitaire, visible en permanence sur toutes les sections du site.", Icone: IconeAnnonce },
]

type Vue = 'carte' | 'agrandi' | 'ordinateur' | 'telephone' | 'page'
const VUES: Record<Formule, { id: Vue; label: string }[]> = {
  publication: [
    { id: 'carte', label: 'Carte' },
    { id: 'agrandi', label: 'Carte ouverte' },
    { id: 'page', label: 'Sur la page' },
  ],
  publicite: [
    { id: 'ordinateur', label: 'Ordinateur' },
    { id: 'telephone', label: 'Téléphone' },
    { id: 'page', label: 'Sur la page' },
  ],
}

function Rubrique({ numero, titre, children }: { numero: number; titre: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 flex items-center gap-2.5 font-jura text-[11px] font-semibold uppercase tracking-[0.2em] text-gris">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/20 text-[10px] text-white">{numero}</span>
        {titre}
      </h3>
      {children}
    </section>
  )
}

/** Étape 1 : formulaire à gauche, aperçus en taille réelle à droite. La zone défile si besoin. */
export default function ContactForm({ brouillon, onChange, onValider, envoi = false, erreurEnvoi = '' }: Props) {
  const id = useId()
  const { utilisateur } = useSession()
  const selecteur = useRef<HTMLInputElement>(null)
  const [erreurs, setErreurs] = useState<Erreurs>({})
  const [survolDepot, setSurvolDepot] = useState(false)
  const [vue, setVue] = useState<Vue>(VUES[brouillon.formule][0].id)
  const [conditionsOuvertes, setConditionsOuvertes] = useState(false)
  const [connexionOuverte, setConnexionOuverte] = useState(false)
  // Formulaire vérifié, gardé le temps que la personne se connecte.
  const verifie = useRef<Brouillon>(brouillon)

  const pub = brouillon.formule === 'publicite'
  const modifier = (champ: Partial<Brouillon>) => onChange({ ...brouillon, ...champ })

  // En changeant de formule, on revient sur le premier aperçu de cette formule.
  useEffect(() => setVue(VUES[brouillon.formule][0].id), [brouillon.formule])

  const choisir = async (fichier: File | undefined) => {
    if (!fichier) return
    const url = URL.createObjectURL(fichier)
    const { type, erreur } = await verifierFichier(fichier, url)
    if (erreur || !type) {
      URL.revokeObjectURL(url)
      setErreurs((e) => ({ ...e, fichier: erreur ?? 'Fichier refusé.' }))
      return
    }
    if (brouillon.apercu) URL.revokeObjectURL(brouillon.apercu)
    setErreurs((e) => ({ ...e, fichier: undefined }))
    modifier({ fichier, apercu: url, typeMedia: type })
  }

  const retirer = () => {
    if (brouillon.apercu) URL.revokeObjectURL(brouillon.apercu)
    if (selecteur.current) selecteur.current.value = ''
    modifier({ fichier: null, apercu: null, typeMedia: null })
  }

  const depot = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setSurvolDepot(false)
    void choisir(e.dataTransfer.files[0])
  }

  const valider = (e: FormEvent) => {
    e.preventDefault()
    const trouve: Erreurs = {}
    if (brouillon.nom.trim().length < 2) trouve.nom = 'Indiquez votre nom.'
    const tel = brouillon.telephone.trim()
    if (!tel.startsWith('+')) trouve.telephone = 'Commencez par l’indicatif du pays, par exemple +221.'
    else if (tel.replace(/\D/g, '').length < 9) trouve.telephone = 'Numéro incomplet.'
    if (brouillon.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brouillon.email.trim())) trouve.email = 'Adresse e-mail incorrecte.'
    if (brouillon.titre.trim().length < 3) trouve.titre = 'Ajoutez un titre (3 caractères minimum).'
    if (pub && brouillon.lien.trim() && !lienPropre(brouillon.lien)) trouve.lien = 'Lien incorrect. Exemple : https://monsite.sn'
    if (!brouillon.fichier) trouve.fichier = 'Ajoutez une image ou une vidéo.'
    if (!brouillon.accepte) trouve.accepte = 'Vous devez accepter les conditions de diffusion.'
    setErreurs(trouve)
    if (Object.keys(trouve).length > 0) {
      // Amène le premier champ en erreur à l'écran.
      requestAnimationFrame(() => document.querySelector('[data-erreur]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
      return
    }
    const final = pub ? { ...brouillon, lien: lienPropre(brouillon.lien) } : brouillon
    if (pub) onChange(final)
    verifie.current = final
    // Un compte est nécessaire pour suivre sa demande : on le demande ici, sans perdre le formulaire.
    if (!utilisateur) setConnexionOuverte(true)
    else onValider(final)
  }

  const messageErreur = (nom: keyof Erreurs) =>
    erreurs[nom] && (
      <p id={`${id}-${nom}-erreur`} data-erreur role="alert" className="mt-1 text-[11px] font-medium text-[#ff6b72]">
        {erreurs[nom]}
      </p>
    )

  const etiquette = (pour: string, texte: string, complement?: ReactNode) => (
    <label htmlFor={`${id}-${pour}`} className="mb-1 flex items-baseline justify-between gap-3 text-xs font-medium text-texte/85">
      <span>{texte}</span>
      {complement && <span className="font-jura font-normal tabular-nums text-gris">{complement}</span>}
    </label>
  )

  const attributs = (nom: 'nom' | 'telephone' | 'email' | 'titre' | 'lien') => ({
    id: `${id}-${nom}`,
    value: brouillon[nom],
    'aria-invalid': erreurs[nom] ? (true as const) : undefined,
    'aria-describedby': erreurs[nom] ? `${id}-${nom}-erreur` : undefined,
  })

  const contenu = { src: brouillon.apercu, type: brouillon.typeMedia, titre: brouillon.titre, description: brouillon.description }

  return (
    <form onSubmit={valider} noValidate className="grid gap-7 lg:grid-cols-2 xl:gap-9">
      {/* ============================================================ Formulaire */}
      <div className="flex min-w-0 flex-col gap-6">
        <Rubrique numero={1} titre="Catégorie">
          <div role="radiogroup" aria-label="Type de publication" className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
            {FORMULES.map(({ id: formule, nom, detail, Icone }) => {
              const choisi = brouillon.formule === formule
              const { jours } = tarif(formule)
              return (
                <label
                  key={formule}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors duration-200 has-focus-visible:outline-2 has-focus-visible:outline-white/75 ${
                    choisi ? 'border-white/55 bg-white/[0.07]' : 'border-trait bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name={`${id}-formule`}
                    value={formule}
                    checked={choisi}
                    onChange={() => modifier({ formule })}
                    className="sr-only"
                  />
                  <Icone taille={22} className={`mt-0.5 shrink-0 ${choisi ? 'text-white' : 'text-gris'}`} />
                  <span className="min-w-0">
                    <span className={`block text-sm font-semibold ${choisi ? 'lueur' : 'text-texte'}`}>{nom}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-gris">{detail}</span>
                    <span className="mt-1.5 block font-jura text-[13px] font-semibold text-white">
                      {etiquettePrix(formule)} <span className="font-medium text-gris">· {jours} jours</span>
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </Rubrique>

        <Rubrique numero={2} titre="Vos coordonnées">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              {etiquette('nom', 'Nom')}
              <input {...attributs('nom')} className="champ" placeholder="Votre nom" autoComplete="name" maxLength={60} onChange={(e) => modifier({ nom: e.target.value })} />
              {messageErreur('nom')}
            </div>
            <div className="min-w-0">
              {etiquette('telephone', 'Téléphone (WhatsApp)')}
              <input
                {...attributs('telephone')}
                className="champ"
                type="tel"
                inputMode="tel"
                placeholder="+"
                autoComplete="tel"
                maxLength={20}
                onChange={(e) => modifier({ telephone: e.target.value })}
                // Le numéro commence par l'indicatif du pays : « + » est posé dès qu'on clique dans le champ.
                onFocus={() => !brouillon.telephone && modifier({ telephone: '+' })}
                onBlur={() => brouillon.telephone.trim() === '+' && modifier({ telephone: '' })}
              />
              {messageErreur('telephone')}
            </div>
            <div className="min-w-0 sm:col-span-2">
              {etiquette('email', 'E-mail', 'optionnel')}
              <input
                {...attributs('email')}
                className="champ"
                type="email"
                inputMode="email"
                placeholder="vous@exemple.com"
                autoComplete="email"
                maxLength={80}
                onChange={(e) => modifier({ email: e.target.value })}
              />
              {messageErreur('email')}
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-gris">Ces informations servent uniquement à vous contacter. Elles ne sont jamais affichées sur le site.</p>
        </Rubrique>

        <Rubrique numero={3} titre={pub ? 'Votre publicité' : 'Votre contenu'}>
          <div className="flex flex-col gap-3">
            <div>
              {etiquette('titre', pub ? 'Titre (nom de votre publicité)' : 'Titre', `${brouillon.titre.length}/${LIMITES.titre}`)}
              <input
                {...attributs('titre')}
                className="champ"
                placeholder={pub ? 'Ex. : Boutique Awa — soldes de fin d’année' : 'Ex. : Grande braderie ce samedi au marché'}
                maxLength={LIMITES.titre}
                onChange={(e) => modifier({ titre: e.target.value })}
              />
              {messageErreur('titre')}
            </div>

            <div>
              {etiquette('description', 'Description', `${brouillon.description.length}/${LIMITES.description}`)}
              <textarea
                id={`${id}-description`}
                className="champ h-28 resize-none py-2.5 leading-relaxed"
                placeholder={
                  pub
                    ? 'Quelques mots sur votre publicité (pour Balkanos uniquement, non affiché).'
                    : 'Le texte affiché sous le titre quand on ouvre votre carte : lieu, date, prix, contact…'
                }
                maxLength={LIMITES.description}
                value={brouillon.description}
                onChange={(e) => modifier({ description: e.target.value })}
              />
            </div>

            {pub && (
              <div>
                {etiquette('lien', 'Lien ouvert quand on clique sur la publicité', 'optionnel')}
                <input
                  {...attributs('lien')}
                  className="champ"
                  type="url"
                  inputMode="url"
                  placeholder="https://monsite.sn  ou  wa.me/221770000000"
                  autoComplete="url"
                  maxLength={200}
                  onChange={(e) => modifier({ lien: e.target.value })}
                />
                {messageErreur('lien')}
              </div>
            )}

            {/* Zone de dépôt */}
            <div>
              <span id={`${id}-fichier-label`} className="mb-1 block text-xs font-medium text-texte/85">
                Image ou vidéo
              </span>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setSurvolDepot(true)
                }}
                onDragLeave={() => setSurvolDepot(false)}
                onDrop={depot}
                className={`flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-4 text-center transition-colors duration-200 ${
                  survolDepot ? 'border-white/60 bg-white/[0.07]' : erreurs.fichier ? 'border-rouge/70 bg-white/[0.02]' : 'border-white/18 bg-white/[0.02]'
                }`}
              >
                <input
                  ref={selecteur}
                  type="file"
                  accept={FORMATS_ACCEPTES}
                  aria-labelledby={`${id}-fichier-label`}
                  onChange={(e) => void choisir(e.target.files?.[0])}
                  className="sr-only"
                  tabIndex={-1}
                />
                {brouillon.fichier ? (
                  <>
                    <p className="max-w-full truncate text-sm font-medium text-white">{brouillon.fichier.name}</p>
                    <p className="font-jura text-xs text-gris">
                      {brouillon.typeMedia === 'video' ? 'Vidéo' : 'Image'} · {poids(brouillon.fichier.size)}
                    </p>
                    <div className="mt-1 flex gap-2">
                      <button type="button" onClick={() => selecteur.current?.click()} className="pilule h-10 rounded-lg px-4 text-xs font-semibold text-texte hover:lueur">
                        Changer de fichier
                      </button>
                      <button type="button" onClick={retirer} aria-label="Retirer le fichier" className="pilule flex h-10 w-10 items-center justify-center rounded-lg text-gris hover:text-white">
                        <IconeFermer taille={15} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <IconeTeleverser taille={24} className="text-gris" />
                    <p className="text-sm text-texte/85">Glissez votre fichier ici</p>
                    <button type="button" onClick={() => selecteur.current?.click()} className="pilule glare h-10 rounded-lg px-4 text-xs font-semibold text-texte hover:lueur">
                      Choisir un fichier
                    </button>
                    <p className="font-jura text-[11px] tracking-wide text-gris">{TEXTE_FORMATS}</p>
                  </>
                )}
              </div>
              {messageErreur('fichier')}
              {pub && <p className="mt-1.5 text-[11px] leading-relaxed text-gris">Conseil : un visuel vertical (portrait), par exemple 1080 × 1920 px.</p>}
            </div>
          </div>
        </Rubrique>
      </div>

      {/* ================================================================ Aperçu */}
      <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-0 lg:self-start">
        <Rubrique numero={4} titre="Aperçu en direct">
          <div role="group" aria-label="Type d'aperçu" className="mb-3 flex rounded-lg border border-trait p-0.5 text-xs font-semibold">
            {VUES[brouillon.formule].map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={vue === v.id}
                onClick={() => setVue(v.id)}
                className={`h-9 flex-1 rounded-md px-2 transition-colors duration-200 ${vue === v.id ? 'bg-white/12 text-white' : 'text-gris hover:text-white'}`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-trait bg-black/30 p-4">
            {vue === 'carte' && <ApercuCarte {...contenu} />}
            {vue === 'agrandi' && <ApercuAgrandi {...contenu} />}
            {vue === 'ordinateur' && <ApercuPub {...contenu} format="ordinateur" />}
            {vue === 'telephone' && <ApercuPub {...contenu} format="telephone" />}
            {vue === 'page' && (
              <>
                <PreviewHome src={brouillon.apercu} type={brouillon.typeMedia} titre={brouillon.titre} formule={brouillon.formule} />
                <p className="mt-2.5 text-center text-[11px] leading-relaxed text-gris">
                  {pub
                    ? "L'anneau lumineux montre l'Espace publicitaire, à droite de la page."
                    : "L'anneau lumineux montre votre carte : le contenu le plus récent prend la première place de la grille."}
                </p>
              </>
            )}
          </div>
          <p className="mt-2 text-[11px] text-gris">Rien n'est envoyé à cette étape : l'aperçu reste sur votre appareil.</p>
        </Rubrique>

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-texte/85">
            <input
              type="checkbox"
              checked={brouillon.accepte}
              onChange={(e) => modifier({ accepte: e.target.checked })}
              aria-invalid={erreurs.accepte ? true : undefined}
              className="mt-0.5 h-4 w-4 shrink-0 accent-white"
            />
            <span>
              J'accepte les{' '}
              <button type="button" onClick={() => setConditionsOuvertes(true)} className="font-semibold text-white underline decoration-white/40 underline-offset-4 hover:lueur">
                conditions de diffusion
              </button>
            </span>
          </label>
          {messageErreur('accepte')}
        </div>

        <div>
          <button
            type="submit"
            data-spark
            disabled={envoi}
            className="glare h-12 w-full rounded-xl bg-white text-sm font-semibold text-black shadow-[0_0_28px_-6px_rgba(255,255,255,0.55)] transition-[filter,opacity] duration-200 hover:brightness-110 disabled:opacity-60"
          >
            {envoi ? 'Envoi en cours…' : PAIEMENT_ACTIF ? 'Je valide' : "J'envoie ma demande"}
          </button>
          {erreurEnvoi && (
            <p role="alert" className="mt-2 text-center text-[11px] font-medium text-[#ff6b72]">
              {erreurEnvoi}
            </p>
          )}
          {!utilisateur && (
            <p className="mt-2 text-center text-[11px] leading-relaxed text-gris">
              Un compte gratuit vous sera demandé juste après, pour suivre l'avancement de votre demande.
            </p>
          )}
        </div>
      </div>

      <Conditions ouvert={conditionsOuvertes} onFermer={() => setConditionsOuvertes(false)} />
      <AuthModal
        ouvert={connexionOuverte}
        onFermer={() => setConnexionOuverte(false)}
        onSucces={() => {
          setConnexionOuverte(false)
          onValider(verifie.current)
        }}
        intro="Connectez-vous ou créez un compte pour envoyer votre contenu et suivre votre demande. Votre formulaire est conservé."
      />
    </form>
  )
}
