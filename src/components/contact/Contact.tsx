import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { PAIEMENT_ACTIF, TEXTES } from '../../config'
import { backend } from '../../lib/backend'
import { useNavigation, useSession } from '../../lib/session'
import type { Formule, TypeMedia } from '../../types'
import { IconeCoche } from '../Icones'
import ContactForm from './ContactForm'
import PaymentStep from './PaymentStep'

export type Brouillon = {
  /** publication = carte dans la grille · publicite = visuel dans l'Espace publicitaire. */
  formule: Formule
  nom: string
  telephone: string
  email: string
  titre: string
  description: string
  /** Lien ouvert au clic (publicité uniquement, facultatif). */
  lien: string
  fichier: File | null
  /** Adresse locale (blob:) du fichier choisi : sert à l'aperçu, rien n'est envoyé. */
  apercu: string | null
  typeMedia: TypeMedia | null
  accepte: boolean
}

const VIDE: Brouillon = {
  formule: 'publication',
  nom: '',
  telephone: '',
  email: '',
  titre: '',
  description: '',
  lien: '',
  fichier: null,
  apercu: null,
  typeMedia: null,
  accepte: false,
}

type Etape = 'formulaire' | 'paiement' | 'merci'
// Tant que tout est gratuit (PAIEMENT_ACTIF = false), l'étape « Paiement » n'existe pas.
const ETAPES = (
  [
    { id: 'formulaire', label: 'Votre contenu' },
    { id: 'paiement', label: 'Paiement' },
    { id: 'merci', label: 'Confirmation' },
  ] satisfies { id: Etape; label: string }[]
).filter((e) => PAIEMENT_ACTIF || e.id !== 'paiement')

const glisse = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.26, ease: [0.2, 0.7, 0.2, 1] as const },
}

/** Section Contact : formulaire + aperçus → (paiement par QR, si actif) → confirmation. */
export default function Contact() {
  const { utilisateur } = useSession()
  const { aller } = useNavigation()
  const [etape, setEtape] = useState<Etape>('formulaire')
  const [brouillon, setBrouillon] = useState<Brouillon>(VIDE)
  const [resultat, setResultat] = useState<{ mode: 'supabase' | 'demo'; reference: string } | null>(null)
  const zone = useRef<HTMLDivElement>(null)
  const rang = ETAPES.findIndex((e) => e.id === etape)
  const [envoi, setEnvoi] = useState(false)
  const [erreurEnvoi, setErreurEnvoi] = useState('')

  // Libère l'adresse locale de l'aperçu quand on quitte la section.
  const apercu = useRef<string | null>(null)
  apercu.current = brouillon.apercu
  useEffect(
    () => () => {
      if (apercu.current) URL.revokeObjectURL(apercu.current)
    },
    [],
  )

  // L'e-mail du compte est proposé par défaut.
  useEffect(() => {
    if (utilisateur?.email && !utilisateur.email.endsWith('.local')) {
      setBrouillon((b) => (b.email ? b : { ...b, email: utilisateur.email }))
    }
  }, [utilisateur?.email])

  const changerEtape = (e: Etape) => {
    setEtape(e)
    zone.current?.scrollTo({ top: 0 })
  }

  /** Formulaire validé : étape de paiement si elle est active, sinon envoi immédiat (gratuit). */
  const valider = async (b: Brouillon) => {
    if (PAIEMENT_ACTIF) return changerEtape('paiement')
    if (!b.fichier || !b.typeMedia || envoi) return
    setEnvoi(true)
    setErreurEnvoi('')
    try {
      await backend.creerDemande({
        formule: b.formule,
        nom: b.nom.trim(),
        telephone: b.telephone.trim(),
        email: b.email.trim(),
        titre: b.titre.trim(),
        description: b.description.trim(),
        lien: b.formule === 'publicite' ? b.lien.trim() : '',
        fichier: b.fichier,
        typeMedia: b.typeMedia,
        montant: 0,
        operateur: '',
        refTransaction: '',
      })
      setResultat({ mode: backend.mode, reference: '' })
      changerEtape('merci')
    } catch (err) {
      setErreurEnvoi(err instanceof Error ? err.message : "L'envoi a échoué. Réessayez dans un instant.")
    } finally {
      setEnvoi(false)
    }
  }

  const recommencer = () => {
    if (brouillon.apercu) URL.revokeObjectURL(brouillon.apercu)
    setBrouillon({ ...VIDE, email: brouillon.email })
    setResultat(null)
    changerEtape('formulaire')
  }

  return (
    <div className="surface flex flex-col overflow-hidden rounded-xl fit:h-full">
      {/* En-tête : titre, tarif, étapes */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-trait px-4 py-3 xl:px-6">
        <h2 className="text-[15px] font-semibold text-white">
          Publier sur Balkanos
        </h2>
        <ol className="flex items-center gap-2 text-xs font-medium sm:gap-3">
          {ETAPES.map((e, i) => (
            <li key={e.id} aria-current={i === rang ? 'step' : undefined} className={`flex items-center gap-1.5 ${i === rang ? 'text-white' : 'text-gris'}`}>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border font-jura text-[11px] font-bold ${
                  i === rang ? 'border-white/70 text-white' : 'border-white/15'
                }`}
              >
                {i < rang ? <IconeCoche taille={11} strokeWidth={3} /> : i + 1}
              </span>
              <span className={i === rang ? '' : 'hidden sm:inline'}>{e.label}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Cette zone défile si le contenu est plus haut que l'écran. */}
      <div ref={zone} className="defile min-h-0 flex-1 p-4 xl:p-6">
        <AnimatePresence mode="wait">
          {etape === 'formulaire' && (
            <motion.div key="formulaire" {...glisse}>
              <ContactForm brouillon={brouillon} onChange={setBrouillon} onValider={valider} envoi={envoi} erreurEnvoi={erreurEnvoi} />
            </motion.div>
          )}

          {etape === 'paiement' && (
            <motion.div key="paiement" {...glisse}>
              <PaymentStep
                brouillon={brouillon}
                onRetour={() => changerEtape('formulaire')}
                onEnvoye={(mode, reference) => {
                  setResultat({ mode, reference })
                  changerEtape('merci')
                }}
              />
            </motion.div>
          )}

          {etape === 'merci' && (
            <motion.div key="merci" {...glisse} className="flex min-h-72 flex-col items-center justify-center gap-4 px-4 py-8 text-center fit:min-h-full">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/25 text-white shadow-[0_0_30px_rgba(255,255,255,0.25)]">
                <IconeCoche taille={26} />
              </span>
              <p role="status" className="lueur max-w-md text-lg font-semibold leading-snug">
                {TEXTES.merci}
              </p>
              {resultat?.reference && (
                <p className="text-sm text-gris">
                  Référence indiquée : <span className="font-jura font-semibold text-texte">{resultat.reference}</span>
                </p>
              )}
              {resultat?.mode === 'demo' && (
                <p className="max-w-md rounded-lg border border-trait bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-gris">
                  Mode démo : la demande est enregistrée uniquement dans ce navigateur. Pour la valider, ouvrez « Connexion » puis
                  « Entrer comme administratrice (démo) ».
                </p>
              )}
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  data-spark
                  onClick={() => aller('compte')}
                  className="glare h-11 rounded-xl bg-white px-5 text-sm font-semibold text-black shadow-[0_0_28px_-6px_rgba(255,255,255,0.55)]"
                >
                  Suivre ma demande
                </button>
                <button
                  type="button"
                  data-spark
                  onClick={recommencer}
                  className="pilule glare h-11 rounded-xl px-5 text-sm font-semibold text-texte transition-[color,text-shadow] duration-300 hover:lueur"
                >
                  Envoyer un autre contenu
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
