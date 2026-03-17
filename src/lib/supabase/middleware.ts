import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Already auth inside login page -> /chat
    if (user && pathname.startsWith('/login')) {
        console.log('[Middleware] Auth user at login page. Sending to /chat')
        const url = request.nextUrl.clone()
        url.pathname = '/chat'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
