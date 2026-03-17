import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { getURL } from '@/lib/utils'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/onboarding'

    const siteUrl = getURL()

    if (code) {
        console.log('[Auth Callback] Code received, exchanging for session...')

        const cookieStore = await cookies()

        // Create Supabase client with explicit cookie handling for Route Handler
        const supabase = createServerClient(
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
                                cookieStore.set(name, value, options)
                            )
                        } catch (error) {
                            console.error('[Auth Callback] Error setting cookies:', error)
                        }
                    },
                },
            }
        )

        const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && sessionData.session) {
            console.log('[Auth Callback] Session created successfully')
            console.log('[Auth Callback] Session access_token:', sessionData.session.access_token ? 'PRESENT' : 'MISSING')
            console.log('[Auth Callback] Cookies being set...')

            // Get user to check profile
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                console.log('[Auth Callback] User ID:', user.id)

                // Check if user has completed onboarding
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('onboarding_completed')
                    .eq('user_id', user.id)
                    .single()

                if (profileError) {
                    console.warn('[Auth Callback] Profile query error:', profileError.message)
                }

                console.log('[Auth Callback] Profile found:', !!profile)
                console.log('[Auth Callback] Onboarding completed:', profile?.onboarding_completed)

                // Decide destination based on onboarding status
                let destination: string

                if (profile?.onboarding_completed) {
                    // Existing user - go to chat (or use 'next' if provided)
                    destination = next !== '/onboarding' ? next : '/chat'
                    console.log('[Auth Callback] Existing user, redirecting to:', destination)
                } else {
                    // New user or incomplete onboarding - go to onboarding
                    destination = '/onboarding'
                    console.log('[Auth Callback] New user or incomplete onboarding, redirecting to:', destination)
                }

                // Create redirect response
                const redirectUrl = new URL(destination, siteUrl)
                const response = NextResponse.redirect(redirectUrl)

                // Explicitly copy all cookies to the response
                // This ensures cookies are preserved in Vercel edge runtime
                const allCookies = cookieStore.getAll()
                allCookies.forEach(cookie => {
                    response.cookies.set(cookie.name, cookie.value, {
                        path: '/',
                        httpOnly: cookie.name.includes('auth-token'),
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 60 * 60 * 24 * 7, // 7 days
                    })
                })

                console.log('[Auth Callback] Redirecting with', allCookies.length, 'cookies')
                return response
            }

            console.error('[Auth Callback] Could not get user after session creation')
            return NextResponse.redirect(`${siteUrl}/login?error=Session created but could not get user`)
        }

        if (error) {
            console.error('[Auth Callback] Exchange error:', error.message)
        }
    }

    console.warn('[Auth Callback] Authentication failed or no code')
    return NextResponse.redirect(`${siteUrl}/login?error=Could not authenticate with Google`)
}
