import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { MODE_DEMO, backend } from '../../lib/backend'
import { IconeFermer } from '../Icones'

type Props = {
  /** Appelé dès que la personne est connectée. */
  onSucces?: () => void
  /** Phrase d'introduction (par exemple « pour envoyer votre contenu »). */
  intro?: string
}

/** Connexion / création de compte : e-mail + mot de passe (+ pseudo à l'inscription). */
export default function AuthPanel({ onSucces, intro }: Props) {
  const id = useId()
  const [inscription, setInscription] = useState(false)
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null)
  const [attente, setAttente] = useState(false)

  const envoyer = async (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // ce formulaire peut être affiché au-dessus d'un autre formulaire
    const erreur = (texte: string) => setMessage({ texte, erreur: true })
    if (inscription && pseudo.trim().length < 2) return erreur('Choisissez un pseudo (2 caractères minimum).')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return erreur('Adresse e-mail incorrecte.')
    if (inscription && motDePasse.length < 8) return erreur('Mot de passe : 8 caractères minimum.')
    if (!motDePasse) return erreur('Saisissez votre mot de passe.')

    setAttente(true)
    setMessage(null)
    try {
      if (inscription) {
        const { confirmationRequise } = await backend.inscrire(email, motDePasse, pseudo)
        if (confirmationRequise) {
          setInscription(false)
          setMotDePasse('')
          setMessage({ texte: 'Compte créé. Ouvrez le lien reçu par e-mail pour le confirmer, puis connectez-vous ici.', erreur: false })
          return
        }
      } else {
        await backend.connecter(email, motDePasse)
      }
      onSucces?.()
    } catch (err) {
      erreur(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setAttente(false)
    }
  }

  const entrerAdminDemo = async () => {
    await backend.connecterAdminDemo?.()
    onSucces?.()
  }

  const onglet = (actif: boolean) =>
    `h-9 flex-1 rounded-md text-[13px] font-semibold transition-colors duration-200 ${actif ? 'bg-white/12 text-white' : 'text-gris hover:text-white'}`

  return (
    <div className="mx-auto w-full max-w-sm">
      {intro && <p className="mb-3 text-center text-[13px] leading-relaxed text-texte/80">{intro}</p>}

      <div role="group" aria-label="Connexion ou inscription" className="mb-4 flex rounded-lg border border-trait p-0.5">
        <button type="button" aria-pressed={!inscription} onClick={() => { setInscription(false); setMessage(null) }} className={onglet(!inscription)}>
          Se connecter
        </button>
        <button type="button" aria-pressed={inscription} onClick={() => { setInscription(true); setMessage(null) }} className={onglet(inscription)}>
          Créer un compte
        </button>
      </div>

      <form onSubmit={envoyer} noValidate className="flex flex-col gap-3">
        {inscription && (
          <div>
            <label htmlFor={`${id}-pseudo`} className="mb-1 block text-xs font-medium text-texte/85">
              Pseudo <span className="font-normal text-gris">(affiché avec vos commentaires)</span>
            </label>
            <input id={`${id}-pseudo`} className="champ" value={pseudo} maxLength={30} autoComplete="nickname" onChange={(e) => setPseudo(e.target.value)} />
          </div>
        )}
        <div>
          <label htmlFor={`${id}-email`} className="mb-1 block text-xs font-medium text-texte/85">
            E-mail
          </label>
          <input id={`${id}-email`} className="champ" type="email" inputMode="email" value={email} maxLength={80} autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor={`${id}-mdp`} className="mb-1 block text-xs font-medium text-texte/85">
            Mot de passe {inscription && <span className="font-normal text-gris">(8 caractères minimum)</span>}
          </label>
          <input
            id={`${id}-mdp`}
            className="champ"
            type="password"
            value={motDePasse}
            maxLength={72}
            autoComplete={inscription ? 'new-password' : 'current-password'}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
        </div>

        {message && (
          <p role="alert" className={`text-xs font-medium leading-relaxed ${message.erreur ? 'text-[#ff6b72]' : 'text-white'}`}>
            {message.texte}
          </p>
        )}

        <button
          type="submit"
          data-spark
          disabled={attente}
          className="glare mt-1 h-11 rounded-xl bg-white text-sm font-semibold text-black shadow-[0_0_28px_-6px_rgba(255,255,255,0.55)] transition-[filter,opacity] duration-200 hover:brightness-110 disabled:opacity-60"
        >
          {attente ? 'Patientez…' : inscription ? 'Créer mon compte' : 'Se connecter'}
        </button>
      </form>

      {MODE_DEMO && (
        <div className="mt-5 rounded-xl border border-trait bg-white/[0.03] p-3 text-center">
          <p className="text-[11px] leading-relaxed text-gris">
            Mode démo : les comptes sont enregistrés uniquement dans ce navigateur. Rien n'est envoyé sur Internet.
          </p>
          <button
            type="button"
            onClick={() => void entrerAdminDemo()}
            className="pilule glare mt-2.5 h-10 w-full rounded-[10px] text-xs font-semibold text-texte transition-[color,text-shadow] duration-300 hover:lueur"
          >
            Entrer comme administratrice (démo)
          </button>
        </div>
      )}
    </div>
  )
}

/** La même chose dans une fenêtre, pour se connecter sans quitter la page en cours. */
export function AuthModal({ ouvert, onFermer, onSucces, intro }: Props & { ouvert: boolean; onFermer: () => void }) {
  useEffect(() => {
    if (!ouvert) return
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer()
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [ouvert, onFermer])

  return createPortal(
    <AnimatePresence>
      {ouvert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onFermer}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Connexion"
            initial={{ y: 16, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="surface defile relative max-h-[90dvh] w-full max-w-md rounded-2xl p-5 pt-12 sm:p-6 sm:pt-12"
          >
            <button
              type="button"
              onClick={onFermer}
              aria-label="Fermer"
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-gris transition-colors hover:bg-white/8 hover:text-white"
            >
              <IconeFermer taille={18} />
            </button>
            <AuthPanel onSucces={onSucces} intro={intro} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
