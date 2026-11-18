export type TypeMedia = 'image' | 'video'

/** Une actualité ou une vidéo affichée dans la grille. */
export type Media = {
  id: string
  titre: string
  categorie?: string
  /** Date ISO (AAAA-MM-JJ ou date complète). Sert au tri : le plus récent en premier. */
  date: string
  type: TypeMedia
  /** Chemin dans `public/` ou adresse complète (https://…, blob:…). */
  src: string
  /** Image d'attente pour une vidéo. */
  poster?: string
  /** Description affichée quand la carte est agrandie. */
  texte?: string
}

export type Section = 'actus' | 'medias' | 'contact' | 'compte'

/* ------------------------------------------------------------------ Comptes */

export type Role = 'membre' | 'admin'

export type Preferences = {
  /** Les vidéos démarrent toutes seules à l'ouverture. */
  lectureAuto: boolean
  /** Les vidéos démarrent sans le son. */
  sonCoupe: boolean
}

// Par défaut, les vidéos démarrent AVEC le son (si le navigateur le refuse, elles démarrent sans).
export const PREFERENCES_DEFAUT: Preferences = { lectureAuto: true, sonCoupe: false }

export type Utilisateur = {
  id: string
  email: string
  pseudo: string
  role: Role
  preferences: Preferences
}

/* ----------------------------------------------------------------- Demandes */

export type Statut = 'en_attente' | 'publie' | 'refuse'

/** publication = carte dans la grille · publicite = visuel dans l'Espace publicitaire. */
export type Formule = 'publication' | 'publicite'

export type Demande = {
  id: string
  userId: string
  formule: Formule
  nom: string
  telephone: string
  email: string
  titre: string
  description: string
  /** Lien ouvert au clic (publicité uniquement). */
  lien: string
  urlMedia: string
  typeMedia: TypeMedia
  /** Montant payé. 0 tant que tout est gratuit (« Free Limited »), ou pour un contenu ajouté par l'admin. */
  montant: number
  operateur: string
  refTransaction: string
  statut: Statut
  motifRefus: string
  date: string
  datePublication: string | null
}

export type NouvelleDemande = {
  formule: Formule
  nom: string
  telephone: string
  email: string
  titre: string
  description: string
  lien: string
  fichier: File
  typeMedia: TypeMedia
  montant: number
  operateur: string
  refTransaction: string
}

/** Contenu ajouté directement par l'admin : publié tout de suite. */
export type PublicationDirecte = Pick<NouvelleDemande, 'formule' | 'titre' | 'description' | 'lien' | 'fichier' | 'typeMedia'>

/** Admin : modification d'une demande (déjà en ligne ou non). Sans fichier, le média actuel est conservé. */
export type ModificationDemande = {
  titre: string
  description: string
  /** Publicité uniquement ; '' pour aucun lien. */
  lien: string
  fichier?: File
  typeMedia?: TypeMedia
}

/** Publicité validée, affichée dans l'Espace publicitaire. */
export type PubPubliee = { type: TypeMedia; src: string; lien: string; titre: string }

/* ------------------------------------------------------------- Commentaires */

export type Commentaire = {
  id: string
  mediaId: string
  pseudo: string
  texte: string
  date: string
  /** true si le commentaire a été écrit par la personne connectée. */
  aMoi: boolean
}
