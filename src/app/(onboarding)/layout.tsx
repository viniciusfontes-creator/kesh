'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background transition-colors duration-500 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-foreground/5 blur-[120px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-foreground/5 blur-[120px]" />
            </div>

            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="relative z-10 flex items-center justify-center pt-8 pb-4"
            >
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black tracking-tighter text-foreground italic">Kesh</h1>
                    <Sparkles className="w-4 h-4 text-muted-foreground/60" />
                </div>
            </motion.header>

            {/* Content */}
            <main className="relative z-10 flex items-center justify-center px-6 pb-12" style={{ minHeight: 'calc(100vh - 80px)' }}>
                {children}
            </main>
        </div>
    )
}
