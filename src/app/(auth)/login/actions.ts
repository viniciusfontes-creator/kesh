'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

function encodeQueryParam(value: string) {
    return encodeURIComponent(value)
}

function redirectWithMessage(path: string, message: string, type: 'error' | 'message' = 'error') {
    const key = type === 'error' ? 'error' : 'message'
    redirect(`${path}?${key}=${encodeQueryParam(message)}`)
}

function validateEmail(email: unknown): email is string {
    return typeof email === 'string' && email.trim().length > 0 && email.includes('@')
}

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email')
    const password = formData.get('password')

    if (!validateEmail(email) || typeof password !== 'string' || password.length < 6) {
        redirectWithMessage('/login', 'Email ou senha inválidos')
        return
    }

    const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
    })

    if (error) {
        redirectWithMessage('/login', 'Email ou senha incorretos')
    }

    revalidatePath('/', 'layout')
    redirect('/onboarding')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email')
    const password = formData.get('password')

    if (!validateEmail(email) || typeof password !== 'string' || password.length < 6) {
        redirectWithMessage('/login', 'Email ou senha inválidos')
        return
    }

    const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
    })

    if (error) {
        redirectWithMessage('/login', 'Não foi possível criar a conta. Tente novamente.')
    }

    // Se deu certo (verifique no Supabase se exige double opt-in)
    redirectWithMessage('/login', 'Conta criada! Verifique seu email para confirmar.', 'message')
}

export async function signInWithGoogle() {
    const supabase = await createClient()
    const reqHeaders = await headers()
    const origin = process.env.NEXT_PUBLIC_APP_URL || reqHeaders.get('origin') || 'http://localhost:3000'

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/callback?next=/onboarding`,
        },
    })

    if (error) {
        console.warn('Google sign-in error:', error)
    }

    if (data.url) {
        redirect(data.url)
    }
}
