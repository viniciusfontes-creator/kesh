import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { getURL } from '@/lib/utils'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/onboarding'
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')

    const origin = requestUrl.origin

    console.log('[Auth Callback] Processing callback:', {
        origin,
        next,
        hasCode: !!code,
        hasError: !!error
    })

    if (code) {
        const cookieStore = await cookies()
        
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
                        } catch (err) {
                            console.error('[Auth Callback] Cookie set error:', err)
                        }
                    },
                },
            }
        )

        const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (!exchangeError && sessionData.session) {
            console.log('[Auth Callback] Session established successfully')
            
            // Get user to check onboarding status
            const { data: { user }, error: userError } = await supabase.auth.getUser()

            if (user && !userError) {
                console.log('[Auth Callback] User identified:', user.id)

                // Check if user has completed onboarding
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('onboarding_completed')
                    .eq('user_id', user.id)
                    .single()

                if (profileError) {
                    console.warn('[Auth Callback] Profile fetch warning:', profileError.message)
                }

                // Decide destination
                let destination: string
                if (profile?.onboarding_completed) {
                    destination = next !== '/onboarding' ? next : '/chat'
                } else {
                    destination = '/onboarding'
                }

                console.log('[Auth Callback] Redirecting to:', destination)
                
                // For Route Handlers, after calling cookieStore.set in exchangeCodeForSession,
                // a simple redirect should carry the cookies in Next.js 15.
                return NextResponse.redirect(new URL(destination, origin))
            } else {
                console.error('[Auth Callback] User fetch error:', userError?.message)
                return NextResponse.redirect(`${origin}/login?error=Session created but user not found`)
            }
        }

        if (exchangeError) {
            console.error('[Auth Callback] Code exchange error:', exchangeError.message)
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`)
        }
    }

    if (error || errorDescription) {
        console.error('[Auth Callback] Provider error:', error, errorDescription)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || error || 'Auth failed')}`)
    }

    console.warn('[Auth Callback] Fallback: redirecting to login')
    return NextResponse.redirect(`${origin}/login?error=Authentication failed`)
}
