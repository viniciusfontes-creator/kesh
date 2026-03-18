'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

import { DashboardMockup } from './dashboard-mockup'

export function Hero({ user }: { user?: any }) {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-full -z-10" />
      
      <div className="container px-4 mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-6 animate-pulse"
        >
          <Sparkles className="w-3 h-3 text-primary" />
          <span>Inteligência Artificial de ponta</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent"
        >
          Finanças sob controle, <br />
          <span className="text-foreground">sem o ruído.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          A plataforma de gestão inteligente que entende sua vida financeira. 
          Minimalista por fora, poderosa por dentro.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href={user ? "/chat" : "/signup"}>
            <Button size="lg" className="rounded-full px-8 text-base h-12">
              {user ? "Retomar Conversa" : "Começar Agora"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          {!user && (
            <Link href="/login">
              <Button variant="outline" size="lg" className="rounded-full px-8 text-base h-12">
                Ver Demonstração
              </Button>
            </Link>
          )}
          {user && (
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="rounded-full px-8 text-base h-12">
                Ir para Dashboard
              </Button>
            </Link>
          )}
        </motion.div>
      </div>

      {/* Real Dashboard Mockup */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="mt-16 relative max-w-5xl mx-auto px-4 perspective-1000"
      >
        <div className="transform rotate-x-2 transition-transform duration-500 hover:rotate-x-0">
            <DashboardMockup />
        </div>
      </motion.div>
    </section>
  )
}
