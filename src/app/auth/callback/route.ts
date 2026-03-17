import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'
import { getURL } from '@/lib/utils'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/onboarding'

    const siteUrl = getURL()

    if (code) {
        console.log('[Auth Callback] Code received, exchanging for session...')
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            console.log('[Auth Callback] Session created successfully')

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

                // Use absolute URL for redirect to be safe
                return NextResponse.redirect(`${siteUrl}${destination}`)
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
