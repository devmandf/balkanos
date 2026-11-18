import type {
  Commentaire,
  Demande,
  Media,
  ModificationDemande,
  NouvelleDemande,
  Preferences,
  PublicationDirecte,
  PubPubliee,
  Statut,
  Utilisateur,
} from '../../types'

/**
 * Tout ce dont le site a besoin côté « serveur ».
 * Deux implémentations : `local.ts` (mode démo, dans le navigateur) et `supabase.ts` (réel).
 * Le reste du site ne connaît que cette interface.
 */
export interface Backend {
  /** demo = tout reste dans ce navigateur · supabase = comptes et contenus réels, partagés. */
  mode: 'demo' | 'supabase'

  /* --------------------------------------------------------------- Comptes */
  /** Personne déjà connectée au chargement de la page (ou null). */
  sessionInitiale(): Promise<Utilisateur | null>
  /** Prévient à chaque connexion / déconnexion. Renvoie la fonction pour arrêter l'écoute. */
  ecouterSession(rappel: (u: Utilisateur | null) => void): () => void
  /** `confirmationRequise` = un e-mail de confirmation a été envoyé, la personne n'est pas encore connectée. */
  inscrire(email: string, motDePasse: string, pseudo: string): Promise<{ confirmationRequise: boolean }>
  connecter(email: string, motDePasse: string): Promise<void>
  /** Mode démo uniquement : entrer comme administratrice sans mot de passe. */
  connecterAdminDemo?(): Promise<void>
  deconnecter(): Promise<void>
  majProfil(champs: { pseudo?: string; preferences?: Preferences }): Promise<Utilisateur>

  /* -------------------------------------------------------------- Demandes */
  creerDemande(n: NouvelleDemande): Promise<void>
  mesDemandes(): Promise<Demande[]>
  /** Admin : toutes les demandes, de la plus récente à la plus ancienne. */
  toutesLesDemandes(): Promise<Demande[]>
  /** Admin : accepter (publie), refuser (refuse) ou remettre en attente. */
  changerStatut(id: string, statut: Statut, motif?: string): Promise<void>
  /** Admin : supprime la demande et son média. */
  supprimerDemande(id: string): Promise<void>
  /** Admin : ajoute un contenu publié immédiatement (sans paiement ni expiration). */
  publierDirect(p: PublicationDirecte): Promise<void>
  /** Admin : modifie le titre, la description, le lien et (si un fichier est fourni) le média. */
  modifierDemande(id: string, m: ModificationDemande): Promise<void>
  /** Récupère le fichier d'une demande pour l'enregistrer. */
  telechargerMedia(d: Demande): Promise<Blob>

  /* ---------------------------------------------------------------- Public */
  /** Contenus validés et encore dans leur durée d'affichage, du plus récent au plus ancien. */
  contenusPublies(): Promise<{ medias: Media[]; pub: PubPubliee | null }>

  /* ---------------------------------------------------------- Commentaires */
  /** Du plus récent au plus ancien. */
  commentaires(mediaId: string): Promise<Commentaire[]>
  commenter(mediaId: string, texte: string): Promise<Commentaire>
  /** Auteur du commentaire ou admin. */
  supprimerCommentaire(id: string): Promise<void>
}

const JOUR = 24 * 60 * 60 * 1000

/**
 * Un contenu envoyé par un membre (« temporaire ») disparaît après sa durée d'affichage,
 * qu'il soit payant ou gratuit. Un contenu publié par l'admin reste.
 */
export function encoreAffiche(datePublication: string, temporaire: boolean, jours: number): boolean {
  if (!temporaire) return true
  return Date.now() - new Date(datePublication).getTime() < jours * JOUR
}

export function identifiant(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  // Sur le Wi-Fi local (http://192.168…), randomUUID n'existe pas : on fabrique l'équivalent.
  const o = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(o, (b) => b.toString(16).padStart(2, '0')).join('')
}
