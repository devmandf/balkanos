import { creerBackendLocal } from './local'
import { SUPABASE_ACTIF, creerBackendSupabase } from './supabase'
import type { Backend } from './types'

/**
 * Le « serveur » du site.
 * - Supabase configuré (.env.local)  → comptes et contenus réels.
 * - Sinon                            → mode démo : tout reste dans ce navigateur.
 */
export const backend: Backend = SUPABASE_ACTIF ? creerBackendSupabase() : creerBackendLocal()

export const MODE_DEMO = backend.mode === 'demo'
