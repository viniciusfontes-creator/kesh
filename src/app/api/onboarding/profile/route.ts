import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // If no profile exists (user created before trigger), create one
    if (!profile || (error && error.code === 'PGRST116')) {
        const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .upsert({
                user_id: user.id,
                email: user.email || '',
                nome_completo: user.user_metadata?.full_name || '',
            }, { onConflict: 'user_id' })
            .select()
            .single()

        if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
        profile = newProfile
        error = null
    }

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Pre-fill from auth metadata if profile is sparse
    const fullName = profile?.nome_completo || user.user_metadata?.full_name || ''
    const email = profile?.email || user.email || ''

    return NextResponse.json({
        ...profile,
        nome_completo: fullName,
        email,
    })
}

export async function PATCH(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { nome_completo, telefone, cpf, onboarding_step } = body

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (nome_completo !== undefined) updateData.nome_completo = nome_completo
    if (telefone !== undefined) updateData.telefone = telefone
    if (cpf !== undefined) updateData.cpf = cpf
    if (onboarding_step !== undefined) updateData.onboarding_step = onboarding_step

    const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}
