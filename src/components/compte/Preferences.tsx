import { useId, useState, type FormEvent } from 'react'
import { useSession } from '../../lib/session'
import { PREFERENCES_DEFAUT, type Preferences as Prefs } from '../../types'

function Interrupteur({ actif, onChange, titre, detail }: { actif: boolean; onChange: (v: boolean) => void; titre: string; detail: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      onClick={() => onChange(!actif)}
      className="flex min-h-14 w-full items-center gap-4 rounded-xl border border-trait bg-white/[0.025] px-4 py-3 text-left transition-colors hover:border-white/20"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-white">{titre}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-gris">{detail}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 ${actif ? 'border-white bg-white' : 'border-white/25 bg-white/5'}`}>
        <span
          className={`absolute left-0.5 top-0.5 h-[18px] w-[18px] rounded-full transition-transform duration-200 ${actif ? 'translate-x-5 bg-black' : 'bg-gris'}`}
        />
      </span>
    </button>
  )
}

/** Préférences du compte : pseudo (affiché avec les commentaires) et lecture des vidéos. */
export default function Preferences() {
  const id = useId()
  const { utilisateur, majProfil } = useSession()
  const [pseudo, setPseudo] = useState(utilisateur?.pseudo ?? '')
  const [prefs, setPrefs] = useState<Prefs>(utilisateur?.preferences ?? PREFERENCES_DEFAUT)
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault()
    if (pseudo.trim().length < 2) return setMessage({ texte: 'Le pseudo doit faire au moins 2 caractères.', erreur: true })
    setEnvoi(true)
    setMessage(null)
    try {
      await majProfil({ pseudo: pseudo.trim(), preferences: prefs })
      setMessage({ texte: 'Préférences enregistrées.', erreur: false })
    } catch (err) {
      setMessage({ texte: err instanceof Error ? err.message : "L'enregistrement a échoué.", erreur: true })
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form onSubmit={enregistrer} noValidate className="flex max-w-xl flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-pseudo`} className="mb-1 block text-xs font-medium text-texte/85">
            Pseudo <span className="font-normal text-gris">(affiché avec vos commentaires)</span>
          </label>
          <input id={`${id}-pseudo`} className="champ" maxLength={30} value={pseudo} onChange={(e) => setPseudo(e.target.value)} />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="mb-1 block text-xs font-medium text-texte/85">
            E-mail du compte
          </label>
          <input id={`${id}-email`} className="champ opacity-60" value={utilisateur?.email ?? ''} readOnly />
        </div>
      </div>

      <Interrupteur
        actif={prefs.lectureAuto}
        onChange={(v) => setPrefs({ ...prefs, lectureAuto: v })}
        titre="Lecture automatique des vidéos"
        detail="La vidéo démarre toute seule quand vous ouvrez une carte."
      />
      <Interrupteur
        actif={prefs.sonCoupe}
        onChange={(v) => setPrefs({ ...prefs, sonCoupe: v })}
        titre="Démarrer les vidéos sans le son"
        detail="Le son reste activable à tout moment depuis le lecteur (ou avec la touche M)."
      />

      {message && (
        <p role="status" className={`text-xs font-medium ${message.erreur ? 'text-[#ff6b72]' : 'text-white'}`}>
          {message.texte}
        </p>
      )}

      <button
        type="submit"
        data-spark
        disabled={envoi}
        className="glare h-11 self-start rounded-xl bg-white px-6 text-sm font-semibold text-black shadow-[0_0_28px_-6px_rgba(255,255,255,0.55)] transition-[filter,opacity] duration-200 hover:brightness-110 disabled:opacity-60"
      >
        {envoi ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
