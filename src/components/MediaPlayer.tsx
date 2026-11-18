import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ToucheReact, type PointerEvent } from 'react'
import type { TypeMedia } from '../types'
import { asset, duree } from '../lib/outils'
import {
  IconeFermer,
  IconeLecture,
  IconeMuet,
  IconePause,
  IconePleinEcran,
  IconeQuitterPleinEcran,
  IconeVolume,
} from './Icones'

type Props = {
  type: TypeMedia
  src: string
  poster?: string
  titre: string
  /** Légende facultative affichée sur une image. */
  legende?: string
  /** La vidéo démarre toute seule (préférence du compte). */
  lectureAuto?: boolean
  /** La vidéo démarre sans le son (préférence du compte). */
  sonCoupe?: boolean
  /** Affiche le bouton ✕ et active la touche Échap. */
  onFermer?: () => void
  className?: string
}

const DELAI_MASQUAGE = 2500

/**
 * Lecteur média de la zone centrale, inspiré des contrôles du mode PiP de Firefox :
 * les contrôles apparaissent au survol / au toucher puis disparaissent après 2,5 s.
 * Raccourcis : Espace = lecture/pause, M = muet, F = plein écran, ← / → = ±5 s, Échap = fermer.
 */
export default function MediaPlayer({
  type,
  src,
  poster,
  titre,
  legende,
  lectureAuto = true,
  sonCoupe = false,
  onFermer,
  className = '',
}: Props) {
  const cadre = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const piste = useRef<HTMLDivElement>(null)
  const progression = useRef<HTMLDivElement>(null)
  const curseur = useRef<HTMLDivElement>(null)
  const minuterie = useRef(0)
  const glisse = useRef(false)
  const pointeur = useRef({ type: 'mouse', controlesVisibles: true })

  const [enLecture, setEnLecture] = useState(false)
  const [muet, setMuet] = useState(sonCoupe)
  const [volume, setVolume] = useState(1)
  const [temps, setTemps] = useState(0)
  const [total, setTotal] = useState(0)
  const [visibles, setVisibles] = useState(true)
  const [pleinEcran, setPleinEcran] = useState(false)

  const estVideo = type === 'video'

  /* ------------------------------------------------ affichage des contrôles */

  const montrer = useCallback(() => {
    setVisibles(true)
    window.clearTimeout(minuterie.current)
    minuterie.current = window.setTimeout(() => {
      const v = video.current
      if (v && !v.paused && !v.ended) setVisibles(false)
    }, DELAI_MASQUAGE)
  }, [])

  useEffect(() => () => window.clearTimeout(minuterie.current), [])

  /* ---------------------------------------------------------------- actions */

  const basculerLecture = useCallback(() => {
    const v = video.current
    if (!v) return
    if (v.paused || v.ended) void v.play().catch(() => {})
    else v.pause()
  }, [])

  const basculerMuet = useCallback(() => {
    const v = video.current
    if (!v) return
    v.muted = !v.muted
    if (!v.muted && v.volume === 0) v.volume = 0.5
  }, [])

  const avancer = useCallback((secondes: number) => {
    const v = video.current
    if (!v || !Number.isFinite(v.duration)) return
    v.currentTime = Math.min(Math.max(0, v.currentTime + secondes), v.duration)
  }, [])

  const basculerPleinEcran = useCallback(() => {
    const c = cadre.current
    if (!c) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else if (c.requestFullscreen) void c.requestFullscreen().catch(() => {})
    // iPhone : seul le plein écran natif de la vidéo existe.
    else (video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null)?.webkitEnterFullscreen?.()
  }, [])

  /* ------------------------------------------------- barre de progression */

  const dessinerProgression = useCallback(() => {
    const v = video.current
    const p = v && v.duration > 0 ? Math.min(v.currentTime / v.duration, 1) : 0
    if (progression.current) progression.current.style.transform = `scaleX(${p})`
    if (curseur.current) curseur.current.style.left = `${p * 100}%`
  }, [])

  // Pendant la lecture, la barre avance à chaque image (fluide), sans re-rendre le composant.
  useEffect(() => {
    if (!enLecture) {
      dessinerProgression()
      return
    }
    let image = requestAnimationFrame(function boucle() {
      dessinerProgression()
      image = requestAnimationFrame(boucle)
    })
    return () => cancelAnimationFrame(image)
  }, [enLecture, dessinerProgression])

  const chercher = (clientX: number) => {
    const v = video.current
    const p = piste.current
    if (!v || !p || !Number.isFinite(v.duration)) return
    const r = p.getBoundingClientRect()
    v.currentTime = Math.min(Math.max(0, (clientX - r.left) / r.width), 1) * v.duration
    dessinerProgression()
  }

  const debutGlisse = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    glisse.current = true
    chercher(e.clientX)
  }

  /* --------------------------------------------------------------- clavier */

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      const cible = e.target instanceof HTMLElement ? e.target : null
      const saisie =
        !!cible && (['INPUT', 'TEXTAREA', 'SELECT'].includes(cible.tagName) || cible.isContentEditable)

      if (e.key === 'Escape') {
        if (!document.fullscreenElement) onFermer?.()
        return
      }
      if (!estVideo || saisie) return

      switch (e.key) {
        case ' ':
          if (cible?.tagName === 'BUTTON') return // le bouton ciblé gère lui-même Espace
          e.preventDefault()
          basculerLecture()
          break
        case 'm':
        case 'M':
          basculerMuet()
          break
        case 'f':
        case 'F':
          basculerPleinEcran()
          break
        case 'ArrowLeft':
          e.preventDefault()
          avancer(-5)
          break
        case 'ArrowRight':
          e.preventDefault()
          avancer(5)
          break
        default:
          return
      }
      montrer()
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [estVideo, onFermer, basculerLecture, basculerMuet, basculerPleinEcran, avancer, montrer])

  useEffect(() => {
    const changement = () => setPleinEcran(document.fullscreenElement === cadre.current)
    document.addEventListener('fullscreenchange', changement)
    return () => document.removeEventListener('fullscreenchange', changement)
  }, [])

  // Démarrage selon les préférences. Si le navigateur refuse une lecture avec le son, on démarre sans le son.
  useEffect(() => {
    const v = video.current
    if (!v) return
    v.muted = sonCoupe
    if (!lectureAuto) return
    v.play().catch(() => {
      v.muted = true
      v.play().catch(() => {})
    })
    // Uniquement à l'ouverture : changer une préférence ne relance pas la vidéo en cours.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // À l'ouverture, le lecteur prend le focus : les raccourcis clavier marchent tout de suite.
  useEffect(() => {
    if (onFermer) cadre.current?.focus({ preventScroll: true })
  }, [onFermer])

  /* ----------------------------------------------------------------- rendu */

  const clicVideo = () => {
    // Au doigt : le premier toucher affiche seulement les contrôles.
    if (pointeur.current.type === 'touch' && !pointeur.current.controlesVisibles) return
    basculerLecture()
  }

  const toucheCurseur = (e: ToucheReact<HTMLDivElement>) => {
    if (e.key === 'Home') avancer(-Infinity)
    if (e.key === 'End') avancer(Infinity)
  }

  const apparition = visibles ? 'opacity-100' : 'pointer-events-none opacity-0'
  const boutonRond =
    'flex h-11 w-11 items-center justify-center rounded-full text-white/90 transition-[color,background-color] duration-200 hover:bg-white/12 hover:text-white'

  return (
    <div
      ref={cadre}
      tabIndex={-1}
      onPointerDown={(e) => {
        pointeur.current = { type: e.pointerType, controlesVisibles: visibles }
        montrer()
      }}
      onPointerMove={(e) => {
        if (e.pointerType === 'mouse') montrer()
      }}
      onPointerLeave={(e) => {
        const v = video.current
        if (e.pointerType === 'mouse' && v && !v.paused) setVisibles(false)
      }}
      onFocus={montrer}
      className={`relative flex items-center justify-center overflow-hidden bg-black outline-none ${
        estVideo && !visibles ? 'cursor-none' : ''
      } ${className}`}
    >
      {estVideo ? (
        <video
          ref={video}
          src={asset(src)}
          poster={poster ? asset(poster) : undefined}
          playsInline
          preload="metadata"
          aria-label={titre}
          onClick={clicVideo}
          onPlay={() => {
            setEnLecture(true)
            montrer()
          }}
          onPause={() => {
            setEnLecture(false)
            setVisibles(true)
          }}
          onEnded={() => {
            setEnLecture(false)
            setVisibles(true)
          }}
          onTimeUpdate={(e) => setTemps(e.currentTarget.currentTime)}
          onDurationChange={(e) => setTotal(e.currentTarget.duration)}
          onVolumeChange={(e) => {
            setMuet(e.currentTarget.muted)
            setVolume(e.currentTarget.volume)
          }}
          className="h-full w-full object-contain"
        />
      ) : (
        <img src={asset(src)} alt={titre} className="h-full w-full object-contain" />
      )}

      {!estVideo && legende && (
        <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-4 pb-3 pt-10 text-sm text-white/90">
          {legende}
        </p>
      )}

      {estVideo && (
        <>
          {/* Léger dégradé sombre quand les contrôles sont visibles. */}
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,12,0.55)_0%,transparent_26%,transparent_58%,rgba(10,10,12,0.82)_100%)] transition-opacity duration-300 ${
              visibles ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Bouton lecture / pause central. */}
          <button
            type="button"
            onClick={basculerLecture}
            aria-label={enLecture ? 'Pause' : 'Lecture'}
            className={`group/central absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-[rgba(10,10,12,0.6)] text-white backdrop-blur-md transition-opacity duration-300 ${apparition}`}
          >
            <span
              aria-hidden
              className="absolute -inset-2 rounded-full bg-white/25 opacity-0 blur-lg transition-opacity duration-300 group-hover/central:opacity-100"
            />
            {enLecture ? <IconePause taille={26} className="relative" /> : <IconeLecture taille={26} className="relative ml-0.5" />}
          </button>

          {/* Barre du bas : progression + commandes. */}
          <div className={`absolute inset-x-0 bottom-0 px-3 pb-1.5 transition-opacity duration-300 sm:px-4 ${apparition}`}>
            <div
              ref={piste}
              role="slider"
              tabIndex={0}
              aria-label="Progression de la vidéo"
              aria-valuemin={0}
              aria-valuemax={Math.round(total) || 0}
              aria-valuenow={Math.round(temps)}
              aria-valuetext={`${duree(temps)} sur ${duree(total)}`}
              onKeyDown={toucheCurseur}
              onPointerDown={debutGlisse}
              onPointerMove={(e) => {
                if (glisse.current) chercher(e.clientX)
              }}
              onPointerUp={() => (glisse.current = false)}
              onPointerCancel={() => (glisse.current = false)}
              className="group/piste relative flex h-6 cursor-pointer touch-none items-center"
            >
              <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/25 transition-[height] duration-150 group-hover/piste:h-[5px]">
                <div ref={progression} className="h-full w-full origin-left scale-x-0 bg-rouge" />
              </div>
              <div
                ref={curseur}
                className="pointer-events-none absolute left-0 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-[0_0_10px_rgba(255,255,255,0.7)] transition-opacity duration-150 group-hover/piste:opacity-100 group-focus-visible/piste:opacity-100"
              />
            </div>

            <div className="flex items-center gap-1">
              <button type="button" onClick={basculerLecture} aria-label={enLecture ? 'Pause' : 'Lecture'} className={boutonRond}>
                {enLecture ? <IconePause taille={20} /> : <IconeLecture taille={20} />}
              </button>
              <span className="ml-1 font-jura text-xs font-medium tabular-nums text-white/75">
                {duree(temps)} <span className="text-white/40">/</span> {duree(total)}
              </span>

              <span className="flex-1" />

              <button type="button" onClick={basculerMuet} aria-label={muet ? 'Activer le son' : 'Couper le son'} aria-pressed={muet} className={boutonRond}>
                {muet || volume === 0 ? <IconeMuet taille={20} /> : <IconeVolume taille={20} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muet ? 0 : volume}
                onChange={(e) => {
                  const v = video.current
                  if (!v) return
                  v.volume = Number(e.target.value)
                  v.muted = v.volume === 0
                }}
                aria-label="Volume"
                className="hidden h-1 w-[72px] cursor-pointer accent-white sm:block"
              />
              <button
                type="button"
                onClick={basculerPleinEcran}
                aria-label={pleinEcran ? 'Quitter le plein écran' : 'Plein écran'}
                className={boutonRond}
              >
                {pleinEcran ? <IconeQuitterPleinEcran taille={20} /> : <IconePleinEcran taille={20} />}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Fermer (✕) : retour à la grille. */}
      {onFermer && (
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer et revenir à la grille"
          className={`absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-[rgba(10,10,12,0.6)] text-white backdrop-blur-md transition-opacity duration-300 hover:bg-[rgba(40,40,44,0.75)] ${
            !estVideo || visibles ? 'opacity-100' : 'opacity-0 focus-visible:opacity-100'
          }`}
        >
          <IconeFermer taille={20} />
        </button>
      )}
    </div>
  )
}
