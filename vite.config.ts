import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { MODE_TEST } from './src/config'

/**
 * Balises de sécurité ajoutées à la page.
 * - Tant que MODE_TEST = true : les moteurs de recherche ignorent le site (noindex).
 * - Sur le site en ligne (npm run build) : une « Content-Security-Policy » n'autorise que
 *   le site lui-même et le projet Supabase. Un code malveillant injecté ne pourrait donc
 *   ni se charger depuis un autre site, ni envoyer des données ailleurs.
 */
function balisesDeSecurite(enLigne: boolean, supabase: string): Plugin {
  return {
    name: 'balkanos-securite',
    transformIndexHtml() {
      const balises: { tag: string; attrs: Record<string, string>; injectTo: 'head-prepend' | 'head' }[] = []

      if (enLigne) {
        const hote = supabase ? ` ${new URL(supabase).origin}` : ''
        const temps_reel = supabase ? ` wss://${new URL(supabase).host}` : ''
        const regles = [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          `img-src 'self' data: blob:${hote}`,
          `media-src 'self' blob:${hote}`,
          "font-src 'self' data:",
          `connect-src 'self'${hote}${temps_reel}`,
          "frame-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ]
        balises.push({ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: regles.join('; ') }, injectTo: 'head-prepend' })
        balises.push({ tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head' })
      }

      if (MODE_TEST) balises.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' })
      return balises
    },
  }
}

export default defineConfig(({ command, mode, isPreview }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  return {
    // En local (npm run dev) : http://localhost:5173/
    // Pour GitHub Pages (npm run build) : https://<compte>.github.io/balkanos/
    // → remplacer '/balkanos/' par '/' si un nom de domaine personnalisé est branché.
    // (npm run preview montre la version construite sur http://localhost:4173/balkanos/)
    base: command === 'build' || isPreview ? '/balkanos/' : '/',
    plugins: [react(), tailwindcss(), balisesDeSecurite(command === 'build', env.VITE_SUPABASE_URL ?? '')],
  }
})
