'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export function LandingNavbar() {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-background/70 border-b border-border/40"
    >
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xl">k</span>
        </div>
        <span className="text-xl font-semibold tracking-tight">Kesh</span>
      </Link>

      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
        <Link href="#features" className="hover:text-foreground transition-colors">Funcionalidades</Link>
        <Link href="#security" className="hover:text-foreground transition-colors">Segurança</Link>
        <Link href="#pricing" className="hover:text-foreground transition-colors">Planos</Link>
      </nav>

      <div className="flex items-center gap-3">
        <Link href="/login">
          <Button variant="ghost" size="sm" className="text-sm">
            Entrar
          </Button>
        </Link>
        <Link href="/signup">
          <Button size="sm" className="text-sm rounded-full px-5">
            Começar
          </Button>
        </Link>
      </div>
    </motion.header>
  )
}
