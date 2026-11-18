/* ==========================================================================
   MODE RÉEL — Supabase (offre gratuite) : comptes, demandes, médias, commentaires.

   Actif dès que `.env.local` contient VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.
   Seule la clé publique « anon » est utilisée. Toute la sécurité est faite par
   les règles RLS de `supabase/schema.sql` (qui peut lire / écrire quoi).

   Essayé avec le compte admin sur le projet de test (voir README, partie 9).
   Le rôle « membre » simple reste à vérifier avec un second compte.
   ========================================================================== */

import type { SupabaseClient, User } from '@supabase/supabase-js'
import { DUREE_AFFICHAGE_JOURS, DUREE_PUBLICITE_JOURS, LIMITES, NOM_SITE } from '../../config'
import {
  PREFERENCES_DEFAUT,
  type Commentaire,
  type Demande,
  type Formule,
  type Media,
  type Preferences,
  type PubPubliee,
  type Role,
  type Statut,
  type TypeMedia,
  type Utilisateur,
} from '../../types'
import { encoreAffiche, identifiant, type Backend } from './types'

const URL_PROJET = import.meta.env.VITE_SUPABASE_URL
const CLE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

/** true si les réglages Supabase sont présents. */
export const SUPABASE_ACTIF = Boolean(URL_PROJET && CLE_ANON && !URL_PROJET.includes('xxxxxxxx'))

const SEAU = 'medias'

let promesse: Promise<SupabaseClient> | null = null
/** La bibliothèque Supabase n'est téléchargée que si elle sert vraiment. */
function client(): Promise<SupabaseClient> {
  promesse ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(URL_PROJET!, CLE_ANON!))
  return promesse
}

/* ---------------------------------------------------------------- erreurs */

function messageAuth(brut: string): string {
  const m = brut.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou mot de passe incorrect.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Un compte existe déjà avec cet e-mail.'
  if (m.includes('not confirmed')) return "Confirmez d'abord votre adresse : ouvrez le lien reçu par e-mail."
  if (m.includes('password')) return 'Mot de passe trop court (8 caractères minimum).'
  if (m.includes('rate limit') || m.includes('too many')) return 'Trop de tentatives. Patientez quelques minutes.'
  if (m.includes('valid email') || m.includes('invalid email')) return 'Adresse e-mail incorrecte.'
  return 'Une erreur est survenue. Réessayez dans un instant.'
}

function echec(action: string): never {
  throw new Error(`${action} a échoué. Vérifiez votre connexion puis réessayez.`)
}

/* ------------------------------------------------------------ conversions */

type LigneProfil = { pseudo: string; role: Role; preferences: Partial<Preferences> | null }

async function versUtilisateur(sb: SupabaseClient, user: User): Promise<Utilisateur> {
  const { data } = await sb.from('profils').select('pseudo, role, preferences').eq('id', user.id).maybeSingle()
  const profil = data as LigneProfil | null
  return {
    id: user.id,
    email: user.email ?? '',
    pseudo: profil?.pseudo ?? (user.user_metadata?.pseudo as string | undefined) ?? 'Membre',
    role: profil?.role ?? 'membre',
    preferences: { ...PREFERENCES_DEFAUT, ...(profil?.preferences ?? {}) },
  }
}

type LigneDemande = {
  id: string
  user_id: string
  formule: Formule
  nom: string
  telephone: string
  email: string | null
  titre: string
  description: string
  lien: string | null
  url_media: string
  type_media: TypeMedia
  montant: number
  operateur: string | null
  ref_transaction: string | null
  statut: Statut
  motif_refus: string | null
  date: string
  date_publication: string | null
}

const COLONNES_DEMANDE =
  'id, user_id, formule, nom, telephone, email, titre, description, lien, url_media, type_media, montant, operateur, ref_transaction, statut, motif_refus, date, date_publication'

function versDemande(l: LigneDemande): Demande {
  return {
    id: l.id,
    userId: l.user_id,
    formule: l.formule,
    nom: l.nom,
    telephone: l.telephone,
    email: l.email ?? '',
    titre: l.titre,
    description: l.description,
    lien: l.lien ?? '',
    urlMedia: l.url_media,
    typeMedia: l.type_media,
    montant: l.montant,
    operateur: l.operateur ?? '',
    refTransaction: l.ref_transaction ?? '',
    statut: l.statut,
    motifRefus: l.motif_refus ?? '',
    date: l.date,
    datePublication: l.date_publication,
  }
}

type LignePubliee = {
  id: string
  formule: Formule
  titre: string
  description: string
  lien: string | null
  url_media: string
  type_media: TypeMedia
  /** Envoyé par un membre : expire après sa durée d'affichage. */
  temporaire: boolean
  date_publication: string
}

type LigneCommentaire = { id: string; media_id: string; user_id: string; pseudo: string; texte: string; date: string }

/**
 * Envoie un fichier dans le stockage et renvoie son adresse publique.
 * Chaque personne envoie dans SON dossier (son identifiant) : c'est imposé par la base,
 * qui limite aussi le nombre d'envois par jour (voir schema.sql, partie 6).
 */
async function deposer(sb: SupabaseClient, fichier: File, type: TypeMedia): Promise<string> {
  const { data: auth } = await sb.auth.getSession()
  const moi = auth.session?.user.id
  if (!moi) throw new Error('Connectez-vous pour continuer.')
  const extension = fichier.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || (type === 'video' ? 'mp4' : 'jpg')
  const chemin = `${moi}/${identifiant()}.${extension}`
  const { error } = await sb.storage.from(SEAU).upload(chemin, fichier, { contentType: fichier.type, cacheControl: '3600', upsert: false })
  if (error) {
    if (/row-level security|policy/i.test(error.message)) {
      throw new Error("Limite d'envois atteinte pour aujourd'hui (10 fichiers par 24 h). Réessayez demain.")
    }
    echec("L'envoi du fichier")
  }
  return sb.storage.from(SEAU).getPublicUrl(chemin).data.publicUrl
}

/** Traduit les refus volontaires de la base (limites anti-abus) en message clair. */
function refusDeLaBase(message: string): string | null {
  if (message.includes('Trop de demandes')) return 'Vous avez déjà 5 demandes en attente. Attendez leur traitement avant d’en envoyer une autre.'
  if (message.includes('Trop de commentaires')) return 'Doucement : 5 commentaires par minute au maximum.'
  if (message.includes('Pseudo réservé')) return 'Ce pseudo est réservé. Choisissez-en un autre.'
  return null
}

function cheminDepuisUrl(url: string): string | null {
  const repere = `/object/public/${SEAU}/`
  const i = url.indexOf(repere)
  return i === -1 ? null : decodeURIComponent(url.slice(i + repere.length))
}

/* ---------------------------------------------------------------- backend */

export function creerBackendSupabase(): Backend {
  return {
    mode: 'supabase',

    async sessionInitiale() {
      const sb = await client()
      const { data } = await sb.auth.getSession()
      return data.session ? versUtilisateur(sb, data.session.user) : null
    },

    ecouterSession(rappel) {
      let arreter = () => {}
      let annule = false
      void client().then((sb) => {
        if (annule) return
        const { data } = sb.auth.onAuthStateChange((_evenement, session) => {
          // Jamais d'appel Supabase directement dans ce rappel (risque de blocage) : on diffère.
          setTimeout(() => {
            if (!session) rappel(null)
            else void versUtilisateur(sb, session.user).then(rappel)
          }, 0)
        })
        arreter = () => data.subscription.unsubscribe()
      })
      return () => {
        annule = true
        arreter()
      }
    },

    async inscrire(email, motDePasse, pseudo) {
      const sb = await client()
      const { data, error } = await sb.auth.signUp({
        email: email.trim(),
        password: motDePasse,
        options: { data: { pseudo: pseudo.trim() }, emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
      })
      if (error) throw new Error(messageAuth(error.message))
      // Adresse déjà utilisée : Supabase répond sans erreur mais sans identité.
      if (data.user && data.user.identities?.length === 0) throw new Error('Un compte existe déjà avec cet e-mail.')
      return { confirmationRequise: !data.session }
    },

    async connecter(email, motDePasse) {
      const sb = await client()
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: motDePasse })
      if (error) throw new Error(messageAuth(error.message))
    },

    async deconnecter() {
      const sb = await client()
      await sb.auth.signOut()
    },

    async majProfil(champs) {
      const sb = await client()
      const { data } = await sb.auth.getUser()
      if (!data.user) throw new Error('Connectez-vous pour continuer.')
      const modifs: Record<string, unknown> = {}
      if (champs.pseudo !== undefined) modifs.pseudo = champs.pseudo.trim()
      if (champs.preferences) modifs.preferences = champs.preferences
      const { error } = await sb.from('profils').update(modifs).eq('id', data.user.id)
      if (error) throw new Error(refusDeLaBase(error.message) ?? "L'enregistrement a échoué. Vérifiez votre connexion puis réessayez.")
      return versUtilisateur(sb, data.user)
    },

    async creerDemande(n) {
      const sb = await client()
      const url = await deposer(sb, n.fichier, n.typeMedia)
      // user_id est rempli automatiquement par la base (auth.uid()).
      const { error } = await sb.from('soumissions').insert({
        formule: n.formule,
        nom: n.nom,
        telephone: n.telephone,
        email: n.email || null,
        titre: n.titre,
        description: n.description,
        lien: n.lien || null,
        url_media: url,
        type_media: n.typeMedia,
        montant: n.montant,
        operateur: n.operateur,
        ref_transaction: n.refTransaction,
      })
      if (error) throw new Error(refusDeLaBase(error.message) ?? "L'enregistrement de votre demande a échoué. Vérifiez votre connexion puis réessayez.")
    },

    async mesDemandes() {
      const sb = await client()
      const { data: auth } = await sb.auth.getUser()
      if (!auth.user) throw new Error('Connectez-vous pour continuer.')
      const { data, error } = await sb
        .from('soumissions')
        .select(COLONNES_DEMANDE)
        .eq('user_id', auth.user.id)
        .order('date', { ascending: false })
      if (error || !data) echec('Le chargement de vos demandes')
      return (data as LigneDemande[]).map(versDemande)
    },

    async toutesLesDemandes() {
      const sb = await client()
      // Les règles RLS ne renvoient toutes les lignes qu'à un compte admin.
      const { data, error } = await sb.from('soumissions').select(COLONNES_DEMANDE).order('date', { ascending: false }).limit(500)
      if (error || !data) echec('Le chargement des demandes')
      return (data as LigneDemande[]).map(versDemande)
    },

    async changerStatut(id, statut, motif = '') {
      const sb = await client()
      // La date de publication est fixée par la base au moment où le statut passe à « publie ».
      const { error } = await sb
        .from('soumissions')
        .update({ statut, motif_refus: statut === 'refuse' ? motif.trim() || null : null })
        .eq('id', id)
      if (error) echec('La mise à jour')
    },

    async supprimerDemande(id) {
      const sb = await client()
      const { data } = await sb.from('soumissions').select('url_media').eq('id', id).maybeSingle()
      const chemin = data ? cheminDepuisUrl((data as { url_media: string }).url_media) : null
      const { error } = await sb.from('soumissions').delete().eq('id', id)
      if (error) echec('La suppression')
      if (chemin) await sb.storage.from(SEAU).remove([chemin])
      await sb.from('commentaires').delete().eq('media_id', `pub-${id}`)
    },

    async modifierDemande(id, m) {
      const sb = await client()
      const modifs: Record<string, unknown> = {
        titre: m.titre.trim(),
        description: m.description.trim(),
        lien: m.lien.trim() || null,
      }
      // Nouveau média : on l'envoie d'abord, on ne supprime l'ancien qu'une fois la demande mise à jour.
      let ancien: string | null = null
      let nouveau: string | null = null
      if (m.fichier && m.typeMedia) {
        const { data } = await sb.from('soumissions').select('url_media').eq('id', id).maybeSingle()
        ancien = data ? cheminDepuisUrl((data as { url_media: string }).url_media) : null
        const url = await deposer(sb, m.fichier, m.typeMedia)
        nouveau = cheminDepuisUrl(url)
        modifs.url_media = url
        modifs.type_media = m.typeMedia
      }
      const { data, error } = await sb.from('soumissions').update(modifs).eq('id', id).select('id')
      if (error || !data?.length) {
        if (nouveau) await sb.storage.from(SEAU).remove([nouveau])
        echec('La modification')
      }
      if (ancien && ancien !== nouveau) await sb.storage.from(SEAU).remove([ancien])
    },

    async publierDirect(p) {
      const sb = await client()
      const url = await deposer(sb, p.fichier, p.typeMedia)
      const { error } = await sb.from('soumissions').insert({
        formule: p.formule,
        nom: NOM_SITE,
        telephone: '',
        titre: p.titre,
        description: p.description,
        lien: p.lien || null,
        url_media: url,
        type_media: p.typeMedia,
        montant: 0,
        statut: 'publie',
      })
      if (error) echec('La publication')
    },

    async telechargerMedia(d) {
      const reponse = await fetch(d.urlMedia)
      if (!reponse.ok) echec('Le téléchargement')
      return reponse.blob()
    },

    async contenusPublies() {
      const sb = await client()
      const { data, error } = await sb
        .from('contenus_publies')
        .select('id, formule, titre, description, lien, url_media, type_media, temporaire, date_publication')
        .order('date_publication', { ascending: false })
        .limit(300)
      if (error || !data) return { medias: [], pub: null }

      const medias: Media[] = []
      let pub: PubPubliee | null = null
      for (const l of data as LignePubliee[]) {
        if (l.formule === 'publicite') {
          if (!pub && encoreAffiche(l.date_publication, l.temporaire, DUREE_PUBLICITE_JOURS)) {
            pub = { type: l.type_media, src: l.url_media, lien: l.lien ?? '', titre: l.titre }
          }
        } else if (encoreAffiche(l.date_publication, l.temporaire, DUREE_AFFICHAGE_JOURS)) {
          medias.push({
            id: `pub-${l.id}`,
            titre: l.titre,
            categorie: l.temporaire ? 'Annonce' : 'Actualité',
            date: l.date_publication,
            type: l.type_media,
            src: l.url_media,
            texte: l.description,
          })
        }
      }
      return { medias, pub }
    },

    async commentaires(mediaId) {
      const sb = await client()
      const { data: auth } = await sb.auth.getSession()
      const moi = auth.session?.user.id
      const { data, error } = await sb
        .from('commentaires')
        .select('id, media_id, user_id, pseudo, texte, date')
        .eq('media_id', mediaId)
        .order('date', { ascending: false })
        .limit(200)
      if (error || !data) return []
      return (data as LigneCommentaire[]).map(
        (c): Commentaire => ({ id: c.id, mediaId: c.media_id, pseudo: c.pseudo, texte: c.texte, date: c.date, aMoi: c.user_id === moi }),
      )
    },

    async commenter(mediaId, texte) {
      const sb = await client()
      const propre = texte.trim().slice(0, LIMITES.commentaire)
      if (!propre) throw new Error('Écrivez un message.')
      // user_id et pseudo sont remplis par la base (on ne peut pas écrire au nom de quelqu'un d'autre).
      const { data, error } = await sb
        .from('commentaires')
        .insert({ media_id: mediaId, texte: propre })
        .select('id, media_id, user_id, pseudo, texte, date')
        .single()
      if (error || !data) throw new Error((error && refusDeLaBase(error.message)) ?? "L'envoi du commentaire a échoué. Réessayez dans un instant.")
      const c = data as LigneCommentaire
      return { id: c.id, mediaId: c.media_id, pseudo: c.pseudo, texte: c.texte, date: c.date, aMoi: true }
    },

    async supprimerCommentaire(id) {
      const sb = await client()
      const { error } = await sb.from('commentaires').delete().eq('id', id)
      if (error) echec('La suppression')
    },
  }
}
