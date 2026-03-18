'use client'

import { ShieldCheck, Lock, EyeOff, Github, Twitter, Linkedin } from 'lucide-react'
import { motion } from 'framer-motion'

export function SecuritySection() {
  return (
    <section id="security" className="py-24 border-t border-border/40">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
             <h2 className="text-3xl font-bold mb-6">Segurança por design</h2>
             <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
               Levamos sua privacidade a sério. Seus dados são criptografados e nunca vendidos. 
               Construído sobre stacks de classe mundial para garantir que seu dinheiro e informações estejam seguros.
             </p>
             <div className="space-y-4">
                 {[
                   { icon: <Lock className="w-5 h-5" />, text: "Criptografia de ponta a ponta" },
                   { icon: <ShieldCheck className="w-5 h-5" />, text: "Tecnologia de nível bancário" },
                   { icon: <EyeOff className="w-5 h-5" />, text: "Privacidade absoluta de dados" },
                 ].map((item, i) => (
                 <div key={i} className="flex items-center gap-3 text-sm font-medium">
                   <div className="text-primary">{item.icon}</div>
                   <span>{item.text}</span>
                 </div>
               ))}
             </div>
          </div>
          <div className="flex-1 relative">
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="w-64 h-64 md:w-80 md:h-80 border-2 border-dashed border-primary/20 rounded-full flex items-center justify-center mx-auto"
            >
                <div className="w-48 h-48 md:w-60 md:h-60 bg-primary/5 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-20 h-20 md:w-24 md:h-24 text-primary" />
                </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="py-12 border-t border-border/40 bg-card/30">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-border/10 pb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">k</span>
                </div>
                <span className="text-lg font-bold">Kesh</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              A revolução silenciosa na sua gestão financeira.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
             <div className="space-y-3">
                <h4 className="text-sm font-bold">Produto</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                    <li><a href="#features" className="hover:text-primary transition-colors">Funcionalidades</a></li>
                    <li><a href="#pricing" className="hover:text-primary transition-colors">Preços</a></li>
                    <li><a href="/login" className="hover:text-primary transition-colors">App</a></li>
                </ul>
             </div>
             <div className="space-y-3">
                <h4 className="text-sm font-bold">Empresa</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                    <li><a href="#" className="hover:text-primary transition-colors">Sobre</a></li>
                    <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
                    <li><a href="#" className="hover:text-primary transition-colors">Termos</a></li>
                </ul>
             </div>
             <div className="space-y-3 flex flex-col gap-2">
                <h4 className="text-sm font-bold">Siga-nos</h4>
                <div className="flex gap-4">
                    <Github className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />
                    <Twitter className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />
                    <Linkedin className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />
                </div>
             </div>
          </div>
        </div>
        <div className="pt-8 text-center md:text-left">
           <p className="text-xs text-muted-foreground">
             © {new Date().getFullYear()} Kesh Intelligence. Todos os direitos reservados.
           </p>
        </div>
      </div>
    </footer>
  )
}
