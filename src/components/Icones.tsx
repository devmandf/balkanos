import type { ReactNode, SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & { taille?: number }

function Icone({ taille = 20, children, ...reste }: Props & { children: ReactNode }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...reste}
    >
      {children}
    </svg>
  )
}

export const IconeJournal = (p: Props) => (
  <Icone {...p}>
    <path d="M4 5h12v14H6a2 2 0 0 1-2-2V5Z" />
    <path d="M16 9h4v8a2 2 0 0 1-2 2h-2" />
    <path d="M7.5 9h5M7.5 12.5h5M7.5 16h3" />
  </Icone>
)

export const IconeVideos = (p: Props) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M10 8.6v6.8l5.6-3.4L10 8.6Z" fill="currentColor" stroke="none" />
  </Icone>
)

export const IconeEnveloppe = (p: Props) => (
  <Icone {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.5 7.5 8.5 6 8.5-6" />
  </Icone>
)

export const IconeLecture = (p: Props) => (
  <Icone {...p}>
    <path d="M8 5.2v13.6a.6.6 0 0 0 .92.5l10.6-6.8a.6.6 0 0 0 0-1L8.92 4.7a.6.6 0 0 0-.92.5Z" fill="currentColor" stroke="none" />
  </Icone>
)

export const IconePause = (p: Props) => (
  <Icone {...p}>
    <rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
    <rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
  </Icone>
)

export const IconeVolume = (p: Props) => (
  <Icone {...p}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" fill="currentColor" stroke="none" />
    <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" />
  </Icone>
)

export const IconeMuet = (p: Props) => (
  <Icone {...p}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" fill="currentColor" stroke="none" />
    <path d="m16 9.5 5 5M21 9.5l-5 5" />
  </Icone>
)

export const IconePleinEcran = (p: Props) => (
  <Icone {...p}>
    <path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4" />
  </Icone>
)

export const IconeQuitterPleinEcran = (p: Props) => (
  <Icone {...p}>
    <path d="M8 4v4H4M16 4v4h4M8 20v-4H4M16 20v-4h4" />
  </Icone>
)

export const IconeFermer = (p: Props) => (
  <Icone {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icone>
)

export const IconeTeleverser = (p: Props) => (
  <Icone {...p}>
    <path d="M12 16V5M7.5 9.5 12 5l4.5 4.5" />
    <path d="M5 15v2.5A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5V15" />
  </Icone>
)

export const IconeTelecharger = (p: Props) => (
  <Icone {...p}>
    <path d="M12 5v11M7.5 11.5 12 16l4.5-4.5" />
    <path d="M5 15v2.5A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5V15" />
  </Icone>
)

export const IconeCoche = (p: Props) => (
  <Icone {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icone>
)

export const IconeRetour = (p: Props) => (
  <Icone {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icone>
)

export const IconeCompte = (p: Props) => (
  <Icone {...p}>
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M5 19.5c.8-3.4 3.5-5.2 7-5.2s6.2 1.8 7 5.2" />
  </Icone>
)

export const IconeHorloge = (p: Props) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icone>
)

export const IconeCorbeille = (p: Props) => (
  <Icone {...p}>
    <path d="M4.5 7h15M9.5 7V5h5v2M6.5 7l.8 11.2a1.5 1.5 0 0 0 1.5 1.3h6.4a1.5 1.5 0 0 0 1.5-1.3L17.5 7" />
    <path d="M10 11v5M14 11v5" />
  </Icone>
)

export const IconeEnvoyer = (p: Props) => (
  <Icone {...p}>
    <path d="M20 4 3.5 10.5l6.5 3 3 6.5L20 4Z" />
    <path d="m10 13.5 4-4" />
  </Icone>
)

export const IconeSortie = (p: Props) => (
  <Icone {...p}>
    <path d="M10 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H10" />
    <path d="M15 8l4 4-4 4M19 12H9.5" />
  </Icone>
)

export const IconeGrille = (p: Props) => (
  <Icone {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </Icone>
)

export const IconeAnnonce = (p: Props) => (
  <Icone {...p}>
    <path d="M4 10v4h3l8 4.5v-13L7 10H4Z" />
    <path d="M18.5 9.5a4 4 0 0 1 0 5M8 14.5l1 4.5h2.5" />
  </Icone>
)

export const IconeMedias = (p: Props) => (
  <Icone {...p}>
    <rect x="7" y="7.5" width="14" height="11.5" rx="2.2" />
    <path d="M3.5 15.5V7A2 2 0 0 1 5.5 5H17" />
    <path d="M12.4 10.6v5.3l4.4-2.65-4.4-2.65Z" fill="currentColor" stroke="none" />
  </Icone>
)

export const IconeRecherche = (p: Props) => (
  <Icone {...p}>
    <circle cx="10.8" cy="10.8" r="6.3" />
    <path d="m15.6 15.6 4.4 4.4" />
  </Icone>
)

export const IconePrecedent = (p: Props) => (
  <Icone {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </Icone>
)

export const IconeSuivant = (p: Props) => (
  <Icone {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Icone>
)

export const IconeCrayon = (p: Props) => (
  <Icone {...p}>
    <path d="M4.5 19.5h4l10-10a2.1 2.1 0 0 0-3-3l-10 10v3Z" />
    <path d="m14 8 2.8 2.8" />
  </Icone>
)

export const IconeAlerte = (p: Props) => (
  <Icone {...p}>
    <path d="M12 4 3 19.5h18L12 4Z" />
    <path d="M12 10v4.5M12 17.2v.1" />
  </Icone>
)
