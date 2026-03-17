'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const nome_completo = (formData.get('nome_completo') as string)?.trim() || null
  const telefone = (formData.get('telefone') as string)?.trim() || null

  const { error } = await supabase
    .from('user_profiles')
    .update({ nome_completo, telefone, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (error) return { error: 'Erro ao salvar perfil.' }

  revalidatePath('/configuracoes')
  return { success: true }
}

export async function togglePushNotifications(enabled: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('user_profiles')
    .update({ push_notifications: enabled, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (error) return { error: 'Erro ao salvar preferência.' }

  revalidatePath('/configuracoes')
  return { success: true }
}

export async function acceptDataPrivacy() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('user_profiles')
    .update({
      data_privacy_accepted: true,
      data_privacy_accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) return { error: 'Erro ao salvar aceite.' }

  revalidatePath('/configuracoes')
  return { success: true }
}
