import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AdSlot from './components/AdSlot'
import Footer from './components/Footer'
import Header from './components/Header'
import MediaDetail from './components/MediaDetail'
import Medias from './components/Medias'
import NewsGrid from './components/NewsGrid'
import SideNav from './components/SideNav'
import ClickSpark from './components/bits/ClickSpark'
import Noise from './components/bits/Noise'
import Compte from './components/compte/Compte'
import Contact from './components/contact/Contact'
import { DEMO_EN_LOCAL, NOMBRE_CARTES } from './config'
import actusDemo from './data/actus.json'
import videosDemo from './data/videos.json'
import { backend } from './lib/backend'
import { ContexteNavigation, FournisseurSession } from './lib/session'
import type { Media, PubPubliee, Section } from './types'

const TITRES: Record<Section, string> = {
  actus: 'Actualités',
  medias: 'Medias',
  contact: 'Contact — publier un contenu',
  compte: 'Mon compte',
}

/** Contenus de démonstration : uniquement en local (npm run dev). En ligne, la grille démarre vide. */
const AFFICHER_DEMO = import.meta.env.DEV && DEMO_EN_LOCAL

/** Le plus récent en premier. */
const parDate = (a: Media, b: Media) => b.date.localeCompare(a.date)

export default function App() {
  return (
    <FournisseurSession>
      <Site />
    </FournisseurSession>
  )
}

function Site() {
  const [section, setSection] = useState<Section>('actus')
  const [ouvert, setOuvert] = useState<Media | null>(null)
  const [publies, setPublies] = useState<{ medias: Media[]; pub: PubPubliee | null }>({ medias: [], pub: null })
  // Première arrivée sur la page : apparition en cascade (header → nav → cartes → pub → footer).
  const [arrivee, setArrivee] = useState(true)

  const rafraichir = useCallback(() => {
    backend
      .contenusPublies()
      .then(setPublies)
      .catch(() => {})
  }, [])

  useEffect(rafraichir, [rafraichir])

  const actus = useMemo(
    () => [...publies.medias, ...(AFFICHER_DEMO ? (actusDemo as Media[]) : [])].sort(parDate).slice(0, NOMBRE_CARTES),
    [publies],
  )
  // Médias : TOUTES les images et vidéos publiées (la section a sa recherche et ses pages).
  const medias = useMemo(
    () => [...publies.medias, ...(AFFICHER_DEMO ? [...(actusDemo as Media[]), ...(videosDemo as Media[])] : [])].sort(parDate),
    [publies],
  )

  const aller = useCallback((s: Section) => {
    setOuvert(null)
    setArrivee(false)
    setSection(s)
  }, [])

  const fermer = useCallback(() => setOuvert(null), [])

  // Pas de défilement de la page derrière une carte agrandie (mobile).
  useEffect(() => {
    document.documentElement.style.overflow = ouvert ? 'hidden' : ''
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [ouvert])

  const navigation = useMemo(
    () => ({ section, aller, medias: publies.medias, pub: publies.pub, rafraichir }),
    [section, aller, publies, rafraichir],
  )

  const delaiCartes = arrivee ? 0.26 : 0.04

  return (
    <ContexteNavigation.Provider value={navigation}>
      <MotionConfig reducedMotion="user">
        <Noise />
        <ClickSpark />

        <div className="relative flex min-h-dvh flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 fit:h-dvh fit:overflow-hidden">
          {/* Lumière diffuse qui tombe sous le header, comme un projecteur. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[70dvh] bg-[radial-gradient(58%_62%_at_50%_9%,rgba(255,255,255,0.105),transparent_72%)]"
          />

          <Header />

          {/* Tablette / mobile : la pub passe en bandeau sous le header. */}
          <AdSlot variante="bandeau" delai={0.2} className="z-10 mx-[max(12px,2.5vw)] mt-4 shrink-0 lg:hidden" />

          {/* z-30 : sur mobile, la carte agrandie (plein écran) passe au-dessus du header. */}
          <main className="relative z-30 mx-[max(12px,2.5vw)] my-4 grid flex-1 grid-cols-1 gap-4 md:grid-cols-[64px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[clamp(132px,10.5vw,210px)_minmax(0,1fr)_14vw] lg:gap-[clamp(20px,3.4vw,64px)] xl:grid-cols-[clamp(132px,10.5vw,210px)_minmax(0,1fr)_17vw] fit:my-[3.4dvh] fit:min-h-0">
            <SideNav section={section} onChange={aller} />

            <section aria-label={TITRES[section]} className="relative min-h-[50dvh] min-w-0 fit:min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={section}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
                  className="fit:h-full"
                >
                  {section === 'actus' && (
                    <NewsGrid
                      items={actus}
                      onOuvrir={setOuvert}
                      delaiBase={delaiCartes}
                      inactive={!!ouvert}
                      vide="Aucune actualité pour le moment."
                    />
                  )}
                  {section === 'medias' && <Medias items={medias} onOuvrir={setOuvert} delaiBase={delaiCartes} inactive={!!ouvert} />}
                  {section === 'contact' && <Contact />}
                  {section === 'compte' && <Compte />}
                </motion.div>
              </AnimatePresence>

              {/* Carte agrandie : elle grandit depuis sa place dans la grille. */}
              <AnimatePresence>{ouvert && <MediaDetail key={ouvert.id} media={ouvert} onFermer={fermer} />}</AnimatePresence>
            </section>

            <AdSlot variante="colonne" delai={arrivee ? 0.75 : 0} className="hidden lg:block" />
          </main>

          <Footer delai={0.85} />
        </div>
      </MotionConfig>
    </ContexteNavigation.Provider>
  )
}
