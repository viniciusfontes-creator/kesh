import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // Defensive check: ensure environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[Middleware] CRITICAL: Missing Supabase environment variables')
        console.error('[Middleware] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING')
        console.error('[Middleware] NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING')
        // Return early - allow request to proceed without auth check
        return supabaseResponse
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError) {
        console.error('[Middleware] Error getting user:', userError.message)
    }

    const pathname = request.nextUrl.pathname
    console.log(`[Middleware] Path: ${pathname} | User: ${user?.email || 'Guest'}`)

    const isAppPath = pathname.startsWith('/dashboard') ||
        pathname.startsWith('/chat') ||
        pathname.startsWith('/contas') ||
        pathname.startsWith('/configuracoes') ||
        pathname === '/'

    // Basic protection: No user -> /login (except for /login /signup /auth)
    if (!user && isAppPath) {
        console.log('🚨 [Middleware] Protected path, no user found. Redirecting to /login')
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Already auth inside login/signup page -> /chat
    if (user && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
        console.log(`[Middleware] Auth user at ${pathname}. Sending to /chat`)
        const url = request.nextUrl.clone()
        url.pathname = '/chat'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
