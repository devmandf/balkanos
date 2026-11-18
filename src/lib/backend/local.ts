/* ==========================================================================
   MODE DÉMO — tout est enregistré dans CE navigateur (localStorage + IndexedDB).
   Rien ne part sur Internet, rien n'est partagé avec d'autres visiteurs.
   Sert à essayer tout le parcours (compte, envoi, validation, commentaires)
   tant que Supabase n'est pas branché. Ce n'est PAS une vraie sécurité.
   ========================================================================== */

import { DUREE_AFFICHAGE_JOURS, DUREE_PUBLICITE_JOURS, LIMITES, NOM_SITE } from '../../config'
import {
  PREFERENCES_DEFAUT,
  type Commentaire,
  type Demande,
  type Media,
  type Preferences,
  type PubPubliee,
  type Role,
  type Utilisateur,
} from '../../types'
import { encoreAffiche, identifiant, type Backend } from './types'

const CLE = 'balkanos-demo-v1'
const EMAIL_ADMIN_DEMO = 'admin@demo.local'

type CompteDemo = { id: string; email: string; pseudo: string; empreinte: string; role: Role; preferences: Preferences }
type CommentaireDemo = Omit<Commentaire, 'aMoi'> & { userId: string }
/** Dans `demandes`, `urlMedia` contient la clé du fichier rangé dans IndexedDB. */
type Etat = { comptes: CompteDemo[]; session: string | null; demandes: Demande[]; commentaires: CommentaireDemo[] }

const VIDE: Etat = { comptes: [], session: null, demandes: [], commentaires: [] }

function lire(): Etat {
  try {
    return { ...VIDE, ...(JSON.parse(localStorage.getItem(CLE) ?? '{}') as Partial<Etat>) }
  } catch {
    return { ...VIDE }
  }
}

function ecrire(etat: Etat) {
  localStorage.setItem(CLE, JSON.stringify(etat))
}

/* ------------------------------------------------- fichiers (IndexedDB) */

function base(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const ouverture = indexedDB.open('balkanos-demo', 1)
    ouverture.onupgradeneeded = () => ouverture.result.createObjectStore('medias')
    ouverture.onsuccess = () => resolve(ouverture.result)
    ouverture.onerror = () => reject(ouverture.error)
  })
}

async function operation<T>(mode: IDBTransactionMode, action: (magasin: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const bdd = await base()
  return new Promise<T>((resolve, reject) => {
    const requete = action(bdd.transaction('medias', mode).objectStore('medias'))
    requete.onsuccess = () => resolve(requete.result)
    requete.onerror = () => reject(requete.error)
  })
}

const adresses = new Map<string, string>()

async function fichier(cle: string): Promise<Blob> {
  const blob = await operation<Blob | undefined>('readonly', (m) => m.get(cle))
  if (!blob) throw new Error('Fichier introuvable dans ce navigateur.')
  return blob
}

/** Adresse locale (blob:) d'un fichier rangé dans IndexedDB. */
async function adresse(cle: string): Promise<string> {
  const connue = adresses.get(cle)
  if (connue) return connue
  try {
    const url = URL.createObjectURL(await fichier(cle))
    adresses.set(cle, url)
    return url
  } catch {
    return ''
  }
}

async function avecAdresse(d: Demande): Promise<Demande> {
  return { ...d, urlMedia: await adresse(d.urlMedia) }
}

/* ------------------------------------------------------------- comptes */

async function empreinte(texte: string): Promise<string> {
  if (crypto.subtle) {
    const octets = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`balkanos:${texte}`))
    return Array.from(new Uint8Array(octets), (b) => b.toString(16).padStart(2, '0')).join('')
  }
  let h = 5381
  for (const c of texte) h = ((h << 5) + h + c.charCodeAt(0)) | 0
  return `x${h}`
}

function versUtilisateur(c: CompteDemo): Utilisateur {
  return { id: c.id, email: c.email, pseudo: c.pseudo, role: c.role, preferences: { ...PREFERENCES_DEFAUT, ...c.preferences } }
}

function connecte(etat = lire()): CompteDemo | null {
  return etat.comptes.find((c) => c.id === etat.session) ?? null
}

function exigerCompte(): CompteDemo {
  const c = connecte()
  if (!c) throw new Error('Connectez-vous pour continuer.')
  return c
}

function exigerAdmin(): CompteDemo {
  const c = exigerCompte()
  if (c.role !== 'admin') throw new Error("Réservé à l'administration.")
  return c
}

const ecouteurs = new Set<(u: Utilisateur | null) => void>()
function prevenir() {
  const c = connecte()
  ecouteurs.forEach((rappel) => rappel(c ? versUtilisateur(c) : null))
}

const parDateDesc = <T extends { date: string }>(a: T, b: T) => b.date.localeCompare(a.date)

/* -------------------------------------------------------------- backend */

export function creerBackendLocal(): Backend {
  return {
    mode: 'demo',

    async sessionInitiale() {
      const c = connecte()
      return c ? versUtilisateur(c) : null
    },

    ecouterSession(rappel) {
      ecouteurs.add(rappel)
      return () => ecouteurs.delete(rappel)
    },

    async inscrire(email, motDePasse, pseudo) {
      const etat = lire()
      const adresseMail = email.trim().toLowerCase()
      if (etat.comptes.some((c) => c.email === adresseMail)) throw new Error('Un compte existe déjà avec cet e-mail.')
      const compte: CompteDemo = {
        id: identifiant(),
        email: adresseMail,
        pseudo: pseudo.trim(),
        empreinte: await empreinte(motDePasse),
        role: 'membre',
        preferences: PREFERENCES_DEFAUT,
      }
      ecrire({ ...etat, comptes: [...etat.comptes, compte], session: compte.id })
      prevenir()
      return { confirmationRequise: false }
    },

    async connecter(email, motDePasse) {
      const etat = lire()
      const adresseMail = email.trim().toLowerCase()
      const marque = await empreinte(motDePasse)
      const compte = etat.comptes.find((c) => c.email === adresseMail && c.empreinte === marque)
      if (!compte) throw new Error('E-mail ou mot de passe incorrect.')
      ecrire({ ...etat, session: compte.id })
      prevenir()
    },

    async connecterAdminDemo() {
      const etat = lire()
      let admin = etat.comptes.find((c) => c.email === EMAIL_ADMIN_DEMO)
      if (!admin) {
        admin = { id: identifiant(), email: EMAIL_ADMIN_DEMO, pseudo: NOM_SITE, empreinte: '', role: 'admin', preferences: PREFERENCES_DEFAUT }
        etat.comptes = [...etat.comptes, admin]
      }
      ecrire({ ...etat, session: admin.id })
      prevenir()
    },

    async deconnecter() {
      ecrire({ ...lire(), session: null })
      prevenir()
    },

    async majProfil(champs) {
      const etat = lire()
      const moi = connecte(etat)
      if (!moi) throw new Error('Connectez-vous pour continuer.')
      if (champs.pseudo !== undefined) moi.pseudo = champs.pseudo.trim()
      if (champs.preferences) moi.preferences = champs.preferences
      ecrire(etat)
      prevenir()
      return versUtilisateur(moi)
    },

    async creerDemande(n) {
      const moi = exigerCompte()
      const cle = identifiant()
      await operation('readwrite', (m) => m.put(n.fichier, cle))
      const etat = lire()
      etat.demandes.push({
        id: identifiant(),
        userId: moi.id,
        formule: n.formule,
        nom: n.nom,
        telephone: n.telephone,
        email: n.email,
        titre: n.titre,
        description: n.description,
        lien: n.lien,
        urlMedia: cle,
        typeMedia: n.typeMedia,
        montant: n.montant,
        operateur: n.operateur,
        refTransaction: n.refTransaction,
        statut: 'en_attente',
        motifRefus: '',
        date: new Date().toISOString(),
        datePublication: null,
      })
      ecrire(etat)
    },

    async mesDemandes() {
      const moi = exigerCompte()
      return Promise.all(lire().demandes.filter((d) => d.userId === moi.id).sort(parDateDesc).map(avecAdresse))
    },

    async toutesLesDemandes() {
      exigerAdmin()
      return Promise.all(lire().demandes.sort(parDateDesc).map(avecAdresse))
    },

    async changerStatut(id, statut, motif = '') {
      exigerAdmin()
      const etat = lire()
      const d = etat.demandes.find((x) => x.id === id)
      if (!d) throw new Error('Demande introuvable.')
      if (statut === 'publie' && d.statut !== 'publie') d.datePublication = new Date().toISOString()
      d.statut = statut
      d.motifRefus = statut === 'refuse' ? motif.trim() : ''
      ecrire(etat)
    },

    async supprimerDemande(id) {
      exigerAdmin()
      const etat = lire()
      const d = etat.demandes.find((x) => x.id === id)
      if (!d) return
      await operation('readwrite', (m) => m.delete(d.urlMedia))
      const url = adresses.get(d.urlMedia)
      if (url) URL.revokeObjectURL(url)
      adresses.delete(d.urlMedia)
      etat.demandes = etat.demandes.filter((x) => x.id !== id)
      etat.commentaires = etat.commentaires.filter((c) => c.mediaId !== `pub-${id}`)
      ecrire(etat)
    },

    async modifierDemande(id, m) {
      exigerAdmin()
      const avant = lire().demandes.find((x) => x.id === id)
      if (!avant) throw new Error('Demande introuvable.')
      let nouvelleCle: string | null = null
      if (m.fichier && m.typeMedia) {
        nouvelleCle = identifiant()
        await operation('readwrite', (mg) => mg.put(m.fichier!, nouvelleCle!))
        await operation('readwrite', (mg) => mg.delete(avant.urlMedia))
        const url = adresses.get(avant.urlMedia)
        if (url) URL.revokeObjectURL(url)
        adresses.delete(avant.urlMedia)
      }
      const etat = lire()
      const d = etat.demandes.find((x) => x.id === id)
      if (!d) throw new Error('Demande introuvable.')
      d.titre = m.titre.trim()
      d.description = m.description.trim()
      d.lien = d.formule === 'publicite' ? m.lien.trim() : ''
      if (nouvelleCle && m.typeMedia) {
        d.urlMedia = nouvelleCle
        d.typeMedia = m.typeMedia
      }
      ecrire(etat)
    },

    async publierDirect(p) {
      const moi = exigerAdmin()
      const cle = identifiant()
      await operation('readwrite', (m) => m.put(p.fichier, cle))
      const maintenant = new Date().toISOString()
      const etat = lire()
      etat.demandes.push({
        id: identifiant(),
        userId: moi.id,
        formule: p.formule,
        nom: NOM_SITE,
        telephone: '',
        email: '',
        titre: p.titre,
        description: p.description,
        lien: p.lien,
        urlMedia: cle,
        typeMedia: p.typeMedia,
        montant: 0,
        operateur: '',
        refTransaction: '',
        statut: 'publie',
        motifRefus: '',
        date: maintenant,
        datePublication: maintenant,
      })
      ecrire(etat)
    },

    async telechargerMedia(d) {
      const origine = lire().demandes.find((x) => x.id === d.id)
      if (!origine) throw new Error('Demande introuvable.')
      return fichier(origine.urlMedia)
    },

    async contenusPublies() {
      const publiees = lire()
        .demandes.filter((d) => d.statut === 'publie' && d.datePublication)
        .sort((a, b) => b.datePublication!.localeCompare(a.datePublication!))

      const medias: Media[] = []
      let pub: PubPubliee | null = null
      const comptes = lire().comptes
      for (const d of publiees) {
        // Envoyé par un membre → temporaire ; publié par l'admin → sans date de fin.
        const temporaire = comptes.find((c) => c.id === d.userId)?.role !== 'admin'
        if (d.formule === 'publicite') {
          if (!pub && encoreAffiche(d.datePublication!, temporaire, DUREE_PUBLICITE_JOURS)) {
            pub = { type: d.typeMedia, src: await adresse(d.urlMedia), lien: d.lien, titre: d.titre }
          }
        } else if (encoreAffiche(d.datePublication!, temporaire, DUREE_AFFICHAGE_JOURS)) {
          medias.push({
            id: `pub-${d.id}`,
            titre: d.titre,
            categorie: temporaire ? 'Annonce' : 'Actualité',
            date: d.datePublication!,
            type: d.typeMedia,
            src: await adresse(d.urlMedia),
            texte: d.description,
          })
        }
      }
      return { medias, pub }
    },

    async commentaires(mediaId) {
      const moi = connecte()
      return lire()
        .commentaires.filter((c) => c.mediaId === mediaId)
        .sort(parDateDesc)
        .map(({ userId, ...c }) => ({ ...c, aMoi: userId === moi?.id }))
    },

    async commenter(mediaId, texte) {
      const moi = exigerCompte()
      const propre = texte.trim().slice(0, LIMITES.commentaire)
      if (!propre) throw new Error('Écrivez un message.')
      const nouveau: CommentaireDemo = {
        id: identifiant(),
        mediaId,
        pseudo: moi.pseudo,
        texte: propre,
        date: new Date().toISOString(),
        userId: moi.id,
      }
      const etat = lire()
      etat.commentaires.push(nouveau)
      ecrire(etat)
      const { userId: _auteur, ...public_ } = nouveau
      return { ...public_, aMoi: true }
    },

    async supprimerCommentaire(id) {
      const moi = exigerCompte()
      const etat = lire()
      const c = etat.commentaires.find((x) => x.id === id)
      if (!c) return
      if (c.userId !== moi.id && moi.role !== 'admin') throw new Error('Suppression non autorisée.')
      etat.commentaires = etat.commentaires.filter((x) => x.id !== id)
      ecrire(etat)
    },
  }
}
