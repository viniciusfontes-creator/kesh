'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { StepProfile } from '@/components/onboarding/step-profile'
import { StepFeatures } from '@/components/onboarding/step-features'
import { StepUpload } from '@/components/onboarding/step-upload'
import { StepPlan } from '@/components/onboarding/step-plan'
import { StepComplete } from '@/components/onboarding/step-complete'

interface ProfileData {
    nome_completo: string
    email: string
    telefone: string
    cpf: string
    onboarding_step: number
}

const STEP_LABELS = ['Perfil', 'Funcionalidades', 'Extrato', 'Plano', 'Pronto']

export default function OnboardingPage() {
    const [step, setStep] = useState(-1) // -1 = loading
    const [profileData, setProfileData] = useState<ProfileData | null>(null)
    const [importedCount, setImportedCount] = useState(0)

    // Load profile to check where user left off
    useEffect(() => {
        async function loadProfile() {
            try {
                const res = await fetch('/api/onboarding/profile')
                if (res.ok) {
                    const data = await res.json()
                    setProfileData(data)
                    // Resume from last saved step
                    setStep(data.onboarding_step || 0)
                } else {
                    setStep(0)
                }
            } catch {
                setStep(0)
            }
        }
        loadProfile()
    }, [])

    async function advanceStep(nextStep: number) {
        setStep(nextStep)

        // Persist step progress (non-blocking)
        if (nextStep < 5) {
            fetch('/api/onboarding/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ onboarding_step: nextStep }),
            }).catch(() => {})
        }
    }

    // Loading state
    if (step === -1) {
        return (
            <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="w-full max-w-[960px] mx-auto">
            {/* Progress bar */}
            {step < 5 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <div className="flex items-center justify-between mb-3 px-1">
                        {STEP_LABELS.map((label, i) => (
                            <span
                                key={i}
                                className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                                    i <= step ? 'text-foreground' : 'text-muted-foreground/30'
                                }`}
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                    <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-foreground rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
                            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                        />
                    </div>
                </motion.div>
            )}

            {/* Steps */}
            <AnimatePresence mode="wait">
                {step === 0 && profileData && (
                    <StepProfile
                        key="profile"
                        initialData={profileData}
                        onComplete={() => advanceStep(1)}
                    />
                )}

                {step === 1 && (
                    <StepFeatures
                        key="features"
                        onComplete={() => advanceStep(2)}
                        onSkip={() => advanceStep(2)}
                    />
                )}

                {step === 2 && (
                    <StepUpload
                        key="upload"
                        onComplete={() => {
                            // Upload redirects to /chat internally
                        }}
                        onSkip={() => advanceStep(3)}
                    />
                )}

                {step === 3 && (
                    <StepPlan
                        key="plan"
                        onComplete={() => advanceStep(4)}
                        onSkip={() => advanceStep(4)}
                    />
                )}

                {step === 4 && (
                    <StepComplete
                        key="complete"
                        importedCount={importedCount}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
