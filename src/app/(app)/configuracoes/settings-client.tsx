'use client'

import { useState, useTransition } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose,
} from '@/components/ui/sheet'
import {
  User, Bell, Shield, Moon, Sun, ChevronRight, Check, X, Loader2,
} from 'lucide-react'
import { updateProfile, togglePushNotifications, acceptDataPrivacy } from './actions'

export interface UserProfile {
  nome_completo: string | null
  email: string | null
  telefone: string | null
  push_notifications: boolean
  data_privacy_accepted: boolean
  data_privacy_accepted_at: string | null
}

interface SettingsClientProps {
  email: string
  profile: UserProfile
}

export default function SettingsClient({ email, profile }: SettingsClientProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Profile state
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [isPendingProfile, startProfileTransition] = useTransition()

  // Push notifications state
  const [pushEnabled, setPushEnabled] = useState(profile.push_notifications)
  const [pushOpen, setPushOpen] = useState(false)
  const [isPendingPush, startPushTransition] = useTransition()

  // Privacy state
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(profile.data_privacy_accepted)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const [isPendingPrivacy, startPrivacyTransition] = useTransition()

  // Theme state
  const [themeOpen, setThemeOpen] = useState(false)

  useState(() => { setMounted(true) })

  function handleProfileSubmit(formData: FormData) {
    startProfileTransition(async () => {
      const result = await updateProfile(formData)
      if (result.success) {
        setProfileSaved(true)
        setTimeout(() => {
          setProfileSaved(false)
          setProfileOpen(false)
        }, 1200)
      }
    })
  }

  function handlePushToggle(enabled: boolean) {
    setPushEnabled(enabled)
    startPushTransition(async () => {
      const result = await togglePushNotifications(enabled)
      if (result.error) setPushEnabled(!enabled) // rollback
    })
  }

  function handleAcceptPrivacy() {
    startPrivacyTransition(async () => {
      const result = await acceptDataPrivacy()
      if (result.success) {
        setPrivacyAccepted(true)
        setTimeout(() => setPrivacyOpen(false), 1000)
      }
    })
  }

  const prefItems = [
    {
      icon: Bell,
      title: 'Notificações Push',
      desc: pushEnabled ? 'Ativadas' : 'Desativadas',
      onClick: () => setPushOpen(true),
      badge: pushEnabled,
    },
    {
      icon: mounted && theme === 'dark' ? Sun : Moon,
      title: 'Modo Escuro / Claro',
      desc: mounted ? (theme === 'dark' ? 'Tema escuro ativo' : 'Tema claro ativo') : 'Personalize sua visão.',
      onClick: () => setThemeOpen(true),
    },
    {
      icon: Shield,
      title: 'Privacidade de Dados',
      desc: privacyAccepted ? 'Termos aceitos' : 'Pendente',
      onClick: () => setPrivacyOpen(true),
      badge: privacyAccepted,
    },
  ]

  return (
    <>
      {/* ── Profile Card ── */}
      <Card className="rounded-[32px] border border-border/40 bg-card/40 backdrop-blur-md shadow-sm p-2">
        <CardHeader className="pt-6 px-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-foreground/5 rounded-[20px] text-foreground">
              <User className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Perfil</CardTitle>
              <CardDescription className="font-medium">Sua identidade no Kesh.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-6">
          <div className="p-4 rounded-[22px] bg-muted/40 border border-border/50 space-y-3">
            {profile.nome_completo && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome</span>
                <span className="text-sm font-semibold">{profile.nome_completo}</span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Endereço de Email</span>
              <span className="text-sm font-semibold">{email}</span>
            </div>
            {profile.telefone && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Telefone</span>
                <span className="text-sm font-semibold">{profile.telefone}</span>
              </div>
            )}
          </div>

          <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
            <SheetTrigger
              render={
                <Button className="w-full h-11 rounded-[18px] font-semibold text-sm bg-foreground text-background hover:opacity-90 transition-opacity" />
              }
            >
              Editar Perfil
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[32px] px-6 pb-10 pt-6 max-h-[85vh]">
              <SheetHeader className="p-0 mb-6">
                <SheetTitle className="text-xl font-bold tracking-tight">Editar Perfil</SheetTitle>
                <SheetDescription>Atualize suas informações pessoais.</SheetDescription>
              </SheetHeader>

              <form action={handleProfileSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="nome_completo" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Nome completo
                  </Label>
                  <Input
                    id="nome_completo"
                    name="nome_completo"
                    defaultValue={profile.nome_completo || ''}
                    placeholder="Seu nome completo"
                    className="h-12 rounded-2xl px-4 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_display" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    id="email_display"
                    value={email}
                    disabled
                    className="h-12 rounded-2xl px-4 text-base opacity-50"
                  />
                  <p className="text-[11px] text-muted-foreground">O email não pode ser alterado por aqui.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    defaultValue={profile.telefone || ''}
                    placeholder="(00) 00000-0000"
                    className="h-12 rounded-2xl px-4 text-base"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isPendingProfile || profileSaved}
                  className="w-full h-12 rounded-2xl font-bold text-sm bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  {profileSaved ? (
                    <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Salvo!</span>
                  ) : isPendingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </form>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>

      {/* ── Preferences Card ── */}
      <Card className="rounded-[32px] border border-border/40 bg-card/40 backdrop-blur-md shadow-sm p-2 md:col-span-2">
        <CardHeader className="pt-6 px-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-foreground/5 rounded-[20px] text-foreground">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Preferências</CardTitle>
              <CardDescription className="font-medium">Controle como o Kesh interage com você.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {prefItems.map((pref, i) => (
            <button
              key={i}
              onClick={pref.onClick}
              className="flex items-center justify-between p-5 rounded-[24px] bg-muted/30 hover:bg-muted/50 transition-colors border border-border/30 group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-background rounded-[16px] text-foreground shadow-sm">
                  <pref.icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold block">{pref.title}</span>
                  <span className="text-[11px] text-muted-foreground font-medium">{pref.desc}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pref.badge !== undefined && (
                  <div className={`w-2 h-2 rounded-full ${pref.badge ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* ── Push Notifications Sheet ── */}
      <Sheet open={pushOpen} onOpenChange={setPushOpen}>
        <SheetContent side="bottom" className="rounded-t-[32px] px-6 pb-10 pt-6">
          <SheetHeader className="p-0 mb-6">
            <SheetTitle className="text-xl font-bold tracking-tight">Notificações Push</SheetTitle>
            <SheetDescription>
              Receba alertas sobre gastos, metas e conteúdos da Kesh.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            <div className="p-5 rounded-[22px] bg-muted/40 border border-border/50">
              <p className="text-sm leading-relaxed text-foreground/80">
                Ao ativar, você concorda em receber notificações push com alertas financeiros,
                lembretes de metas e conteúdos relevantes da <strong>Kesh</strong>.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold block">Receber notificações</span>
                <span className="text-[11px] text-muted-foreground">
                  {pushEnabled ? 'Você receberá conteúdos da Kesh' : 'Notificações desativadas'}
                </span>
              </div>
              <button
                onClick={() => handlePushToggle(!pushEnabled)}
                disabled={isPendingPush}
                className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${
                  pushEnabled ? 'bg-emerald-500' : 'bg-muted-foreground/20'
                }`}
              >
                <span
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    pushEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <SheetClose
              render={
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-[18px] font-semibold text-sm"
                />
              }
            >
              Fechar
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Theme Sheet ── */}
      <Sheet open={themeOpen} onOpenChange={setThemeOpen}>
        <SheetContent side="bottom" className="rounded-t-[32px] px-6 pb-10 pt-6">
          <SheetHeader className="p-0 mb-6">
            <SheetTitle className="text-xl font-bold tracking-tight">Aparência</SheetTitle>
            <SheetDescription>Escolha o tema visual do aplicativo.</SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => { setTheme('light'); setThemeOpen(false) }}
              className={`flex flex-col items-center gap-3 p-6 rounded-[24px] border-2 transition-all ${
                mounted && theme === 'light'
                  ? 'border-foreground bg-foreground/5'
                  : 'border-border/40 bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Sun className="w-6 h-6 text-amber-500" />
              </div>
              <span className="text-sm font-bold">Claro</span>
              {mounted && theme === 'light' && (
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Ativo</span>
              )}
            </button>

            <button
              onClick={() => { setTheme('dark'); setThemeOpen(false) }}
              className={`flex flex-col items-center gap-3 p-6 rounded-[24px] border-2 transition-all ${
                mounted && theme === 'dark'
                  ? 'border-foreground bg-foreground/5'
                  : 'border-border/40 bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <div className="p-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <Moon className="w-6 h-6 text-indigo-500" />
              </div>
              <span className="text-sm font-bold">Escuro</span>
              {mounted && theme === 'dark' && (
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Ativo</span>
              )}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Privacy Sheet ── */}
      <Sheet open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <SheetContent side="bottom" className="rounded-t-[32px] px-6 pb-10 pt-6 max-h-[85vh] overflow-y-auto">
          <SheetHeader className="p-0 mb-6">
            <SheetTitle className="text-xl font-bold tracking-tight">Privacidade de Dados</SheetTitle>
            <SheetDescription>Leia e aceite nossos termos para continuar.</SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {privacyAccepted ? (
              <div className="p-6 rounded-[22px] bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Termos aceitos</p>
                {profile.data_privacy_accepted_at && (
                  <p className="text-[11px] text-muted-foreground">
                    Aceito em {new Date(profile.data_privacy_accepted_at).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="p-5 rounded-[22px] bg-muted/40 border border-border/50 max-h-60 overflow-y-auto text-sm leading-relaxed text-foreground/80 space-y-4">
                  <p><strong>Termos de Uso e Política de Privacidade — Kesh</strong></p>
                  <p>
                    Ao utilizar o Kesh, você concorda com a coleta e o processamento dos seus dados financeiros
                    exclusivamente para o funcionamento do assistente inteligente. Seus dados são armazenados de
                    forma segura e criptografada.
                  </p>
                  <p>
                    <strong>1. Dados Coletados:</strong> Informações de perfil (nome, email, telefone),
                    transações financeiras, metas e categorias cadastradas pelo usuário.
                  </p>
                  <p>
                    <strong>2. Uso dos Dados:</strong> Os dados são utilizados exclusivamente para fornecer
                    análises financeiras personalizadas, registrar transações e monitorar metas de gastos.
                  </p>
                  <p>
                    <strong>3. Compartilhamento:</strong> Não compartilhamos seus dados com terceiros, exceto
                    quando necessário para integrações explicitamente autorizadas por você (ex.: Open Finance).
                  </p>
                  <p>
                    <strong>4. Segurança:</strong> Utilizamos criptografia em trânsito e em repouso,
                    autenticação segura via Supabase Auth e políticas de acesso por linha (RLS).
                  </p>
                  <p>
                    <strong>5. Exclusão:</strong> Você pode solicitar a exclusão completa dos seus dados a
                    qualquer momento entrando em contato conosco.
                  </p>
                  <p>
                    <strong>6. Consentimento:</strong> Ao marcar a caixa abaixo e clicar em &quot;Aceitar&quot;,
                    você declara ter lido e concordado com todos os termos acima.
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={privacyChecked}
                    onChange={(e) => setPrivacyChecked(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded border-border accent-foreground"
                  />
                  <span className="text-sm leading-snug">
                    Li e aceito os <strong>Termos de Uso</strong> e a <strong>Política de Privacidade</strong> do Kesh.
                  </span>
                </label>

                <Button
                  onClick={handleAcceptPrivacy}
                  disabled={!privacyChecked || isPendingPrivacy}
                  className="w-full h-12 rounded-2xl font-bold text-sm bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {isPendingPrivacy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Aceitar Termos'
                  )}
                </Button>
              </>
            )}

            <SheetClose
              render={
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-[18px] font-semibold text-sm"
                />
              }
            >
              Fechar
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
