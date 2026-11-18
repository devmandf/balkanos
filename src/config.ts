/* ==========================================================================
   BALKANOS — RÉGLAGES DU SITE
   C'est LE fichier à modifier pour changer le prix, les QR codes, le logo…
   Aucune donnée secrète ici : ce fichier est visible par tous les visiteurs.
   ========================================================================== */

/** Seul nom affiché sur le site. */
export const NOM_SITE = 'Balkanos'

/**
 * Phase de test privée.
 * true  → bandeau « MODE TEST », balise noindex, avertissement « ne pas payer ».
 * false → site prêt pour le public.
 */
export const MODE_TEST = true

/* ------------------------------------------------------------------ Logo */

/** Fichier du logo dans le dossier `public/` (sert aussi d'icône d'onglet). */
export const LOGO = 'logo.png'
/** Afficher le mot « BALKANOS » à droite du globe. */
export const AFFICHER_NOM_A_COTE_DU_LOGO = true

/* ---------------------------------------------------------------- Footer */

export const TEXTE_FOOTER = '2027'

/* -------------------------------------------------------------- Paiement */

/**
 * Paiements.
 * false → TOUT EST GRATUIT (offre de lancement « Free Limited ») : aucune étape de paiement,
 *         aucun prix ni QR code affiché nulle part. Les réglages de paiement ci-dessous sont
 *         simplement mis de côté.
 * true  → l'étape de paiement par QR code revient dans Contact, avec les prix ci-dessous.
 */
export const PAIEMENT_ACTIF = false

/** Nom de l'offre gratuite, affiché à la place des prix. */
export const NOM_OFFRE_GRATUITE = 'Free Limited'

/** Prix d'une publication dans la grille, en FCFA. */
export const PRIX_PUBLICATION = 5000
export const DEVISE = 'FCFA'
/** Durée d'affichage d'un contenu payé, en jours. */
export const DUREE_AFFICHAGE_JOURS = 7

/** Prix d'une publicité (visuel dans l'Espace publicitaire), en FCFA. */
export const PRIX_PUBLICITE = 5000
/** Durée d'affichage d'une publicité, en jours. */
export const DUREE_PUBLICITE_JOURS = 7

/** Nom du bénéficiaire affiché sous les QR codes (ne jamais mettre un nom réel). */
export const BENEFICIAIRE = NOM_SITE

/** Le numéro de téléphone n'est PAS affiché par défaut. */
export const AFFICHER_NUMERO = false
/** Numéro affiché seulement si AFFICHER_NUMERO = true. */
export const NUMERO_PAIEMENT = ''

/**
 * Lien de paiement Wave (Wave Business). Laisser vide : le bouton « Payer avec Wave »
 * reste alors caché et seul « Télécharger le QR » est proposé sur mobile.
 */
export const LIEN_PAIEMENT_WAVE = ''

export type Operateur = {
  id: string
  nom: string
  /** Image du QR code dans `public/`. Pour la remplacer : écraser le fichier. */
  qr: string
  /** Petite pastille de couleur à côté du nom. */
  couleur: string
  /** Facultatif : logo officiel dans `public/` (ex. 'paiement/logo-wave.png'). */
  logo?: string
}

export const OPERATEURS: Operateur[] = [
  { id: 'wave', nom: 'Wave', qr: 'paiement/qr-wave.png', couleur: '#1DC8FF' },
  { id: 'orange-money', nom: 'Orange Money', qr: 'paiement/qr-orange-money.png', couleur: '#FF7900' },
]

/* ------------------------------------------------------ Envoi de médias */

export const LIMITES = {
  /** Taille maximale d'une image, en Mo. */
  imageMo: 10,
  /** Taille maximale d'une vidéo, en Mo. */
  videoMo: 50,
  /** Durée maximale d'une vidéo, en secondes. */
  videoSecondes: 60,
  /** Longueur maximale du titre. */
  titre: 80,
  /** Longueur maximale de la description. */
  description: 300,
  /** Longueur maximale d'un commentaire. */
  commentaire: 100,
}

/* ------------------------------------------------------- Contenu de la grille */

/** Nombre d'emplacements de la grille (4 colonnes × 3 rangées). */
export const NOMBRE_CARTES = 12

/**
 * Actualités et vidéos de démonstration (src/data/*.json).
 * true  → affichées quand le site tourne en local (npm run dev), pour voir une grille remplie.
 * false → jamais affichées.
 * Une fois le site en ligne, la grille démarre toujours VIDE : seuls les contenus publiés y apparaissent.
 */
export const DEMO_EN_LOCAL = true

export const FORMATS_IMAGE = ['image/jpeg', 'image/png', 'image/webp']
export const FORMATS_VIDEO = ['video/mp4']

/* ------------------------------------------------------------ Publicité */

export type Publicite =
  | { type: 'vide' }
  | { type: 'image'; src: string; lien?: string; description?: string }
  | { type: 'video'; src: string; lien?: string; description?: string }
  | { type: 'html'; html: string }

/**
 * Contenu de la zone publicitaire quand aucune publicité payée n'est en cours.
 * (Une publicité envoyée par la page Contact puis validée passe toujours devant.)
 * Exemples :
 *   { type: 'image', src: 'pub/affiche.jpg', lien: 'https://exemple.sn' }
 *   { type: 'video', src: 'pub/spot.mp4' }
 *   { type: 'html', html: '<script src="…"></script>' }   (régie publicitaire)
 */
export const PUBLICITE: Publicite = { type: 'vide' }

/* --------------------------------------------------------------- Textes */

export const TEXTES = {
  description: "L'actualité en un coup d'œil.",
  pubVide: 'Espace publicitaire',
  bandeauTest: 'MODE TEST',
  alertePaiementTest: 'MODE TEST — ne pas payer',
  consigneQr: 'Indiquez ensuite votre référence de transaction',
  merci: PAIEMENT_ACTIF
    ? 'Merci ! Votre contenu sera publié après vérification du paiement.'
    : "Merci ! Votre contenu sera publié après validation par l'équipe Balkanos.",
  /** Petite phrase qui explique l'offre gratuite. */
  offreGratuite: 'Offre de lancement : la publication est gratuite, pour une durée limitée.',
}

/** Conditions de diffusion (affichées dans la fenêtre « Conditions »). */
export const CONDITIONS = {
  intro:
    "Chaque contenu envoyé est vérifié par l'équipe Balkanos avant toute mise en ligne. Rien n'est publié automatiquement.",
  interdits: [
    'Violence, menaces, harcèlement ou incitation à la haine',
    'Nudité ou contenu à caractère sexuel',
    'Diffamation, fausses informations ou atteinte à la vie privée',
    "Images, vidéos ou musiques dont vous n'avez pas les droits",
    'Arnaques, jeux d’argent illégaux, produits ou services interdits par la loi',
    'Contenu politique ou religieux visant à nuire à une personne ou à un groupe',
  ],
  regles: [
    `Une publication validée reste affichée ${DUREE_AFFICHAGE_JOURS} jours sur la page d'accueil ; une publicité, ${DUREE_PUBLICITE_JOURS} jours dans l'espace publicitaire.`,
    'Les commentaires sont publics. Balkanos peut supprimer tout commentaire contraire à ces règles.',
    ...(PAIEMENT_ACTIF
      ? [
          'Balkanos peut refuser un contenu sans avoir à se justifier. Dans ce cas, le paiement est remboursé.',
          "Le paiement est vérifié manuellement à partir de votre référence de transaction : la publication n'est pas immédiate.",
        ]
      : [
          `${NOM_OFFRE_GRATUITE} : pendant le lancement, la publication est gratuite. Cette offre est limitée dans le temps et peut évoluer.`,
          'Balkanos peut refuser un contenu sans avoir à se justifier.',
          "Chaque contenu est vérifié à la main : la publication n'est pas immédiate.",
        ]),
    'Votre numéro de téléphone sert uniquement à vous contacter au sujet de votre envoi. Il n’est jamais affiché sur le site.',
  ],
}
