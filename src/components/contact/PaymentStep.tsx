import { useId, useState, type FormEvent } from 'react'
import { AFFICHER_NUMERO, BENEFICIAIRE, LIEN_PAIEMENT_WAVE, MODE_TEST, NUMERO_PAIEMENT, OPERATEURS, TEXTES, type Operateur } from '../../config'
import { MODE_DEMO, backend } from '../../lib/backend'
import { NOM_FORMULE, asset, prix, tarif } from '../../lib/outils'
import { IconeAlerte, IconeRetour, IconeTelecharger } from '../Icones'
import type { Brouillon } from './Contact'

type Props = {
  brouillon: Brouillon
  onRetour: () => void
  onEnvoye: (mode: 'supabase' | 'demo', reference: string) => void
}

/** Étape 2 : montant, QR codes (Wave, Orange Money), puis saisie de la référence de transaction. */
export default function PaymentStep({ brouillon, onRetour, onEnvoye }: Props) {
  const id = useId()
  const [operateur, setOperateur] = useState(OPERATEURS[0].id)
  const [reference, setReference] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const { prix: montant, jours } = tarif(brouillon.formule)

  const envoyer = async (e: FormEvent) => {
    e.preventDefault()
    const ref = reference.trim()
    if (ref.length < 4) {
      setErreur("Saisissez la référence reçue par SMS ou dans l'application.")
      return
    }
    if (!brouillon.fichier || !brouillon.typeMedia) {
      setErreur("Le fichier est manquant : revenez à l'étape précédente.")
      return
    }
    setErreur(null)
    setEnvoi(true)
    try {
      await backend.creerDemande({
        formule: brouillon.formule,
        nom: brouillon.nom.trim(),
        telephone: brouillon.telephone.trim(),
        email: brouillon.email.trim(),
        titre: brouillon.titre.trim(),
        description: brouillon.description.trim(),
        lien: brouillon.formule === 'publicite' ? brouillon.lien.trim() : '',
        fichier: brouillon.fichier,
        typeMedia: brouillon.typeMedia,
        montant,
        operateur,
        refTransaction: ref,
      })
      onEnvoye(backend.mode, ref)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'envoi a échoué. Réessayez dans un instant.")
      setEnvoi(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {MODE_TEST && (
        <p
          role="alert"
          className="flex items-center justify-center gap-2.5 rounded-xl border border-rouge bg-rouge/15 px-4 py-2.5 text-center text-[13px] font-bold uppercase tracking-[0.16em] text-white"
        >
          <IconeAlerte taille={17} className="shrink-0 text-rouge" />
          {TEXTES.alertePaiementTest}
        </p>
      )}

      <p className="text-center text-sm leading-relaxed text-texte/85">
        Réglez <strong className="font-jura text-base font-bold text-white">{prix(montant)}</strong> avec l'un des deux QR codes, puis indiquez votre
        référence de transaction.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)] xl:gap-5">
        {OPERATEURS.map((op) => (
          <CarteQr key={op.id} op={op} montant={montant} />
        ))}

        {/* Référence de transaction */}
        <form onSubmit={envoyer} noValidate className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 rounded-xl border border-trait bg-white/[0.025] p-3">
            <span className="block h-14 w-20 shrink-0 overflow-hidden rounded-md bg-black">
              {brouillon.apercu &&
                (brouillon.typeMedia === 'video' ? (
                  <video src={brouillon.apercu} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                ) : (
                  <img src={brouillon.apercu} alt="" className="h-full w-full object-cover" />
                ))}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-snug text-white [overflow-wrap:anywhere]">{brouillon.titre}</span>
              <span className="mt-0.5 block font-jura text-xs text-gris">
                {NOM_FORMULE[brouillon.formule]} · {prix(montant)} · {jours} jours
              </span>
            </span>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-xs font-medium text-texte/85">Moyen de paiement utilisé</legend>
            <div className="grid grid-cols-2 gap-2">
              {OPERATEURS.map((op) => (
                <label
                  key={op.id}
                  className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[10px] border text-[13px] font-semibold transition-colors duration-200 has-focus-visible:outline-2 has-focus-visible:outline-white/75 ${
                    operateur === op.id ? 'border-white/55 bg-white/8 text-white' : 'border-trait text-gris hover:text-white'
                  }`}
                >
                  <input type="radio" name={`${id}-operateur`} value={op.id} checked={operateur === op.id} onChange={() => setOperateur(op.id)} className="sr-only" />
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: op.couleur }} />
                  {op.nom}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor={`${id}-ref`} className="mb-1.5 block text-xs font-medium text-texte/85">
              Référence de transaction
            </label>
            <input
              id={`${id}-ref`}
              className="champ font-jura font-semibold tracking-wide"
              placeholder="Reçue par SMS ou dans l'application"
              autoComplete="off"
              maxLength={40}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              aria-invalid={erreur ? true : undefined}
              aria-describedby={erreur ? `${id}-erreur` : undefined}
            />
            {erreur && (
              <p id={`${id}-erreur`} role="alert" className="mt-1 text-[11px] font-medium text-[#ff6b72]">
                {erreur}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRetour}
              disabled={envoi}
              className="pilule flex h-12 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-texte transition-[color,text-shadow] duration-300 hover:lueur disabled:opacity-50"
            >
              <IconeRetour taille={16} />
              Retour
            </button>
            <button
              type="submit"
              data-spark
              disabled={envoi}
              className="glare h-12 flex-1 rounded-xl bg-white text-sm font-semibold text-black shadow-[0_0_28px_-6px_rgba(255,255,255,0.55)] transition-[filter,opacity] duration-200 hover:brightness-110 disabled:opacity-60"
            >
              {envoi ? 'Envoi en cours…' : 'Envoyer ma demande'}
            </button>
          </div>

          {MODE_DEMO && (
            <p className="text-[11px] leading-relaxed text-gris">
              Mode démo : la demande est enregistrée uniquement dans ce navigateur, rien n'est envoyé sur Internet.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

function CarteQr({ op, montant }: { op: Operateur; montant: number }) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-xl border border-trait bg-white/[0.025] p-4 text-center">
      <p className="flex items-center gap-2 text-sm font-semibold text-white">
        {op.logo ? (
          <img src={asset(op.logo)} alt="" className="h-5 w-auto" />
        ) : (
          <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: op.couleur }} />
        )}
        {op.nom}
      </p>

      <img
        src={asset(op.qr)}
        alt={`QR code ${op.nom} — bénéficiaire ${BENEFICIAIRE}`}
        width={348}
        height={418}
        className="h-auto w-full max-w-[210px] rounded-lg border border-trait"
      />

      <p className="text-[13px] leading-snug text-texte/85">
        Bénéficiaire : <strong className="font-semibold text-white">{BENEFICIAIRE}</strong>
        <br />
        Montant exact : <strong className="font-jura font-bold text-white">{prix(montant)}</strong>
        {AFFICHER_NUMERO && NUMERO_PAIEMENT && (
          <>
            <br />
            Numéro : <strong className="font-jura font-bold text-white">{NUMERO_PAIEMENT}</strong>
          </>
        )}
      </p>
      <p className="text-[11px] leading-snug text-gris">{TEXTES.consigneQr}</p>

      <div className="mt-auto flex w-full flex-col gap-2 pt-1">
        {/* Sur téléphone : on ne peut pas scanner son propre écran → on enregistre le QR puis on l'importe dans l'appli. */}
        <a
          href={asset(op.qr)}
          download={`qr-${op.id}-balkanos.png`}
          className="pilule flex h-10 items-center justify-center gap-2 rounded-[10px] text-xs font-semibold text-texte transition-[color,text-shadow] duration-300 hover:lueur"
        >
          <IconeTelecharger taille={15} />
          Télécharger le QR
        </a>
        {op.id === 'wave' && LIEN_PAIEMENT_WAVE && (
          <a
            href={LIEN_PAIEMENT_WAVE}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center rounded-[10px] bg-white text-sm font-semibold text-black md:hidden"
          >
            Payer avec Wave
          </a>
        )}
      </div>
    </div>
  )
}
