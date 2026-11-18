import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PREFERENCES_DEFAUT, type Media, type Preferences, type PubPubliee, type Section, type Utilisateur } from '../types'
import { backend } from './backend'

/* ------------------------------------------------------------------ Session */

type Session = {
  /** Personne connectée, ou null. */
  utilisateur: Utilisateur | null
  /** false tant qu'on ne sait pas encore si quelqu'un est connecté. */
  pret: boolean
  /** Préférences de la personne connectée (valeurs par défaut sinon). */
  preferences: Preferences
  majProfil: (champs: { pseudo?: string; preferences?: Preferences }) => Promise<void>
}

const ContexteSession = createContext<Session | null>(null)

export function FournisseurSession({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [pret, setPret] = useState(false)

  useEffect(() => {
    let actif = true
    backend
      .sessionInitiale()
      .then((u) => actif && setUtilisateur(u))
      .catch(() => {})
      .finally(() => actif && setPret(true))
    const arreter = backend.ecouterSession((u) => actif && setUtilisateur(u))
    return () => {
      actif = false
      arreter()
    }
  }, [])

  const majProfil = useCallback(async (champs: { pseudo?: string; preferences?: Preferences }) => {
    setUtilisateur(await backend.majProfil(champs))
  }, [])

  const valeur = useMemo<Session>(
    () => ({ utilisateur, pret, preferences: utilisateur?.preferences ?? PREFERENCES_DEFAUT, majProfil }),
    [utilisateur, pret, majProfil],
  )

  return <ContexteSession.Provider value={valeur}>{children}</ContexteSession.Provider>
}

export function useSession(): Session {
  const s = useContext(ContexteSession)
  if (!s) throw new Error('useSession doit être utilisé dans <FournisseurSession>')
  return s
}

/* --------------------------------------------------------------- Navigation */

type Navigation = {
  section: Section
  aller: (s: Section) => void
  /** Contenus publiés (grille) et publicité en cours. */
  medias: Media[]
  pub: PubPubliee | null
  /** Recharge les contenus publiés (après une validation par l'admin, par exemple). */
  rafraichir: () => void
}

export const ContexteNavigation = createContext<Navigation | null>(null)

export function useNavigation(): Navigation {
  const n = useContext(ContexteNavigation)
  if (!n) throw new Error('useNavigation doit être utilisé dans <App>')
  return n
}
