import { createBrowserClient } from '@supabase/ssr'

// Cookie domain for cross-app session sharing in production
// Configurable via environment variable - defaults to endlesswinning.com in production
const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN ||
  (process.env.NODE_ENV === 'production' ? '.endlesswinning.com' : undefined)

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Configure shared cookie domain for production
    // Allows session sharing between onboarding and dashboard apps
    cookieDomain ? {
      cookieOptions: {
        domain: cookieDomain,
      },
    } : undefined
  )
}
