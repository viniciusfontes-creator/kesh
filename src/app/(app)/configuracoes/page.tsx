import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreditCard, Landmark, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SettingsClient, { type UserProfile } from './settings-client'

export default async function SettingsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user profile (or create a default if missing)
    const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('nome_completo, email, telefone, push_notifications, data_privacy_accepted, data_privacy_accepted_at')
        .eq('user_id', user.id)
        .single()

    const profile: UserProfile = {
        nome_completo: profileRow?.nome_completo ?? null,
        email: profileRow?.email ?? user.email ?? null,
        telefone: profileRow?.telefone ?? null,
        push_notifications: profileRow?.push_notifications ?? true,
        data_privacy_accepted: profileRow?.data_privacy_accepted ?? false,
        data_privacy_accepted_at: profileRow?.data_privacy_accepted_at ?? null,
    }

    return (
        <div className="flex flex-col h-full w-full p-6 md:px-12 md:py-10 space-y-10 max-w-5xl mx-auto pb-40 md:pb-12">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-8 bg-foreground rounded-full" />
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">Ajustes</h1>
                </div>
                <p className="text-[17px] text-muted-foreground font-medium max-w-2xl leading-relaxed">
                    Personalize sua inteligência financeira e gerencie seus dados.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Perfil + Preferências (client-side interactive) */}
                <SettingsClient email={user.email || ''} profile={profile} />

                {/* Plano / Assinatura */}
                <Card className="rounded-[32px] border border-border/40 bg-card/40 backdrop-blur-md shadow-sm p-2 flex flex-col">
                    <CardHeader className="pt-6 px-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-foreground/5 rounded-[20px] text-foreground">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight">Plano Atual</CardTitle>
                                <CardDescription className="font-medium">Sua experiência financeira.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 flex-1 flex flex-col justify-between">
                        <div className="p-6 rounded-[22px] bg-foreground text-background shadow-xl shadow-foreground/10 relative overflow-hidden group">
                           <div className="absolute -right-6 -top-6 w-24 h-24 bg-background/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                           <div className="relative z-10 flex justify-between items-center">
                               <div>
                                   <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Status</span>
                                   <div className="text-2xl font-black tracking-tight">Free Plan</div>
                               </div>
                               <div className="text-4xl font-black">R$0</div>
                           </div>
                           <p className="mt-4 text-xs font-medium opacity-70 leading-relaxed">Você tem acesso ao assistente básico e dashboard limitado.</p>
                        </div>
                        <Button variant="outline" className="w-full h-11 rounded-[18px] font-bold text-sm border-border hover:bg-muted mt-4">
                            Upgrade para o Pro
                        </Button>
                    </CardContent>
                </Card>

                {/* Open Finance - Em Breve */}
                <Card className="rounded-[32px] border border-border/40 bg-card/40 backdrop-blur-md shadow-sm p-2 md:col-span-2 relative overflow-hidden">
                    <CardHeader className="pt-6 px-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-foreground/5 rounded-[20px] text-foreground">
                                    <Landmark className="w-6 h-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold tracking-tight">Open Finance</CardTitle>
                                    <CardDescription className="font-medium">
                                        Conecte seus bancos para dados financeiros em tempo real.
                                    </CardDescription>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider">
                                <Clock className="w-3 h-3" />
                                Em Breve
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                            <div className="p-4 bg-muted/40 rounded-full">
                                <Landmark className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground">Estamos desenvolvendo esta funcionalidade</p>
                                <p className="text-xs text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
                                    Em breve você poderá conectar suas contas bancárias via Open Finance para que o Kesh tenha acesso aos seus dados financeiros reais automaticamente.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
