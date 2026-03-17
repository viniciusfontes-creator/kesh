'use client'

import { signup, signInWithGoogle } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubmitButton } from '@/components/ui/submit-button'
import { motion } from 'framer-motion'
import { Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SignupContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const message = searchParams.get('message')

    return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-background transition-colors duration-500 overflow-hidden relative">
            {error && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl px-6 py-3 rounded-2xl text-red-500 text-sm font-bold shadow-2xl">
                        {error}
                    </div>
                </div>
            )}
            {message && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl px-6 py-3 rounded-2xl text-emerald-500 text-sm font-bold shadow-2xl">
                        {message}
                    </div>
                </div>
            )}
            {/* Background elements for Apple feel */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-foreground/5 blur-[120px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-foreground/5 blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="w-full max-w-[420px] space-y-12 relative z-10"
            >
                <div className="space-y-4 text-center">
                    <div className="flex justify-center mb-6">
                        <Link href="/login">
                            <Button variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="w-4 h-4" />
                                Voltar para login
                            </Button>
                        </Link>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black tracking-tighter text-foreground italic">Kesh</h1>
                        <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed max-w-[280px] mx-auto">
                            Crie sua conta e comece a organizar sua vida financeira agora.
                        </p>
                    </div>
                </div>

                <div className="space-y-8 bg-card/40 backdrop-blur-3xl p-8 rounded-[40px] border border-border/50 shadow-xl shadow-black/5">
                    <form action={signInWithGoogle}>
                        <SubmitButton 
                            variant="outline" 
                            className="w-full h-14 rounded-2xl border-border bg-background text-foreground hover:bg-muted transition-all duration-300 font-bold flex items-center gap-3 justify-center shadow-sm"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5 grayscale opacity-70 group-hover:grayscale-0 transition-all" aria-hidden="true">
                                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="currentColor" />
                                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="currentColor" />
                                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="currentColor" />
                                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26537 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="currentColor" />
                            </svg>
                            Criar com Google
                        </SubmitButton>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-[0.25em] font-bold">
                            <span className="bg-card px-4 text-muted-foreground/60">ou use seu email</span>
                        </div>
                    </div>

                    <form action={signup} className="space-y-6">
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 px-1">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="ola@kesh.ai"
                                    required
                                    className="h-14 bg-muted/50 border-border/50 rounded-2xl px-5 text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-foreground/20 shadow-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 px-1">
                                    Senha
                                </Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="h-14 bg-muted/50 border-border/50 rounded-2xl px-5 text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-foreground/20 shadow-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="pt-4 space-y-4">
                            <SubmitButton 
                                className="w-full h-14 bg-foreground text-background rounded-2xl font-bold shadow-xl shadow-foreground/5 active:scale-95 transition-all text-base" 
                            >
                                Criar conta
                            </SubmitButton>
                            <p className="text-[11px] text-center text-muted-foreground font-medium px-4">
                                Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade.
                            </p>
                        </div>
                    </form>
                </div>
                
                <footer className="text-center pt-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/40 border border-border/40">
                        <Sparkles className="w-3.5 h-3.5 text-foreground" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tecnologia Kesh</span>
                    </div>
                </footer>
            </motion.div>
        </div>
    )
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-background">
                <p className="text-muted-foreground italic font-medium">Carregando Kesh...</p>
            </div>
        }>
            <SignupContent />
        </Suspense>
    )
}
