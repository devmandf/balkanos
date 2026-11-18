import { useEffect, useState } from 'react'
import { MODE_DEMO, backend } from '../../lib/backend'
import { useSession } from '../../lib/session'
import { IconeSortie } from '../Icones'
import AuthPanel from './AuthPanel'
import { DemandesRecues, MesDemandes } from './Demandes'
import Preferences from './Preferences'
import PublierDirect from './PublierDirect'

type Onglet = 'recues' | 'publier' | 'mes' | 'preferences'

const ONGLETS_MEMBRE: { id: Onglet; nom: string }[] = [
  { id: 'mes', nom: 'Mes demandes' },
  { id: 'preferences', nom: 'Préférences' },
]
const ONGLETS_ADMIN: { id: Onglet; nom: string }[] = [
  { id: 'recues', nom: 'Demandes reçues' },
  { id: 'publier', nom: 'Publier un contenu' },
  { id: 'preferences', nom: 'Préférences' },
]

/**
 * Section « Compte » (bouton en haut à droite du header).
 * - Non connecté : connexion / création de compte.
 * - Membre       : tableau de bord (statut de ses demandes) + préférences.
 * - Admin        : demandes reçues (accepter, refuser, télécharger), publication directe, préférences.
 */
export default function Compte() {
  const { utilisateur, pret } = useSession()
  const [choix, setChoix] = useState<Onglet | null>(null)

  // À chaque changement de personne connectée, on revient sur le premier onglet.
  useEffect(() => setChoix(null), [utilisateur?.id])

  if (!pret) return <div className="surface rounded-xl p-6 text-sm text-gris fit:h-full">Chargement…</div>

  if (!utilisateur) {
    return (
      <div className="surface defile rounded-xl px-5 py-8 fit:h-full">
        <div className="mx-auto mb-6 max-w-sm text-center">
          <h2 className="text-lg font-semibold text-white">Mon compte</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-gris">
            Un compte permet d'envoyer un contenu, de suivre où en est votre demande et de commenter les publications.
          </p>
        </div>
        <AuthPanel />
      </div>
    )
  }

  const admin = utilisateur.role === 'admin'
  const onglets = admin ? ONGLETS_ADMIN : ONGLETS_MEMBRE
  const onglet = onglets.find((o) => o.id === choix)?.id ?? onglets[0].id

  return (
    <div className="surface flex flex-col overflow-hidden rounded-xl fit:h-full">
      {/* En-tête : qui est connecté */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-trait px-4 py-3 xl:px-6">
        <h2 className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[15px] font-semibold text-white">
          <span className="truncate">Bonjour, {utilisateur.pseudo}</span>
          {admin && <span className="rounded border border-white/30 px-1.5 py-px font-jura text-[10px] font-bold tracking-[0.16em]">ADMIN</span>}
          <span className="truncate text-xs font-normal text-gris">{utilisateur.email}</span>
        </h2>
        <button
          type="button"
          onClick={() => void backend.deconnecter()}
          className="pilule flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-texte transition-[color,text-shadow] duration-300 hover:lueur"
        >
          <IconeSortie taille={15} />
          Déconnexion
        </button>
      </div>

      {/* Onglets */}
      <div role="tablist" aria-label="Rubriques du compte" className="flex shrink-0 gap-1 overflow-x-auto border-b border-trait px-3 xl:px-5">
        {onglets.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={onglet === o.id}
            onClick={() => setChoix(o.id)}
            className={`relative h-11 shrink-0 px-3 text-[13px] font-semibold transition-[color,text-shadow] duration-200 ${
              onglet === o.id ? 'lueur' : 'text-gris hover:text-white'
            }`}
          >
            {o.nom}
            {onglet === o.id && <span aria-hidden className="absolute inset-x-3 bottom-0 h-px bg-white/80" />}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="defile min-h-0 flex-1 p-4 xl:p-6">
        {MODE_DEMO && (
          <p className="mb-4 rounded-lg border border-trait bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-gris">
            Mode démo : comptes, demandes et commentaires sont enregistrés uniquement dans ce navigateur. Rien n'est envoyé sur Internet.
          </p>
        )}
        {onglet === 'mes' && <MesDemandes />}
        {onglet === 'recues' && <DemandesRecues />}
        {onglet === 'publier' && <PublierDirect />}
        {onglet === 'preferences' && <Preferences key={utilisateur.id} />}
      </div>
    </div>
  )
}
