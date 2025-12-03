import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cookie domain for cross-app session sharing in production
const cookieDomain = process.env.NODE_ENV === 'production' ? '.endlesswinning.com' : undefined

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                // Add shared cookie domain for production
                ...(cookieDomain && { domain: cookieDomain }),
              })
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}
