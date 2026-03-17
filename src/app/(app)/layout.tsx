'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageCircle,
  LayoutDashboard,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Loader2,
  Wallet,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { NotificationPanel, NotificationBell } from '@/components/notifications/notification-panel'
import { useNotifications } from '@/components/notifications/use-notifications'

const navItems = [
    { href: '/chat', label: 'Chat', icon: MessageCircle },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/contas', label: 'Contas', icon: Wallet },
    { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [isNavigating, setIsNavigating] = useState(false)
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()
    const { unreadCount } = useNotifications()

    useEffect(() => {
        setMounted(true)
    }, [])

    // Simulação de loading na troca de rota
    useEffect(() => {
        setIsNavigating(true)
        const timer = setTimeout(() => setIsNavigating(false), 400)
        return () => clearTimeout(timer)
    }, [pathname])

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
            {/* Desktop Sidebar - CSS transition instead of Framer Motion */}
            <aside
                style={{ width: isCollapsed ? 80 : 300 }}
                className={cn(
                    "hidden md:flex flex-col h-full border-r border-border/60 bg-card/30 backdrop-blur-[40px] z-30 relative overflow-hidden transition-[width] duration-300 ease-out",
                    isCollapsed ? "items-center" : ""
                )}
            >
                {/* Header / Logo & Toggle */}
                <div className={cn(
                    "p-6 mb-2 flex items-center justify-between",
                    isCollapsed ? "flex-col gap-6 justify-center" : ""
                )}>
                    {!isCollapsed ? (
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black tracking-tighter text-foreground">Kesh</h1>
                            <NotificationPanel
                                trigger={
                                    <button className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all">
                                        <NotificationBell unreadCount={unreadCount} />
                                    </button>
                                }
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                                <span className="text-foreground font-black text-xl italic tracking-tighter">K</span>
                            </div>
                            <NotificationPanel
                                trigger={
                                    <button className="w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform text-muted-foreground hover:text-foreground">
                                        <NotificationBell unreadCount={unreadCount} />
                                    </button>
                                }
                            />
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={cn(
                            "h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all",
                            isCollapsed ? "" : "opacity-40 hover:opacity-100"
                        )}
                    >
                        {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1 mt-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-200 group relative outline-none",
                                    isActive
                                        ? "text-background"
                                        : "text-muted-foreground/70 hover:text-foreground",
                                    isCollapsed ? "justify-center px-0 w-12 mx-auto" : ""
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active-indicator"
                                        className="absolute inset-0 bg-foreground rounded-2xl shadow-md"
                                        transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                                    />
                                )}
                                <item.icon className={cn("w-[20px] h-[20px] shrink-0 relative z-10", isActive ? "" : "group-hover:scale-110 transition-transform")} />
                                {!isCollapsed && (
                                    <span className="truncate relative z-10">{item.label}</span>
                                )}
                                {isCollapsed && isActive && (
                                    <motion.div 
                                        layoutId="sidebar-active-dot"
                                        className="absolute -right-3 w-1.5 h-6 bg-foreground rounded-full" 
                                    />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom Section */}
                <div className={cn(
                    "p-4 border-t border-border flex flex-col gap-2",
                    isCollapsed ? "items-center px-0" : ""
                )}>
                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size={isCollapsed ? "icon" : "default"}
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className={cn(
                            "w-full h-11 flex items-center justify-start gap-3 rounded-xl hover:bg-secondary/80 text-muted-foreground border border-transparent hover:border-border transition-all duration-100",
                            isCollapsed ? "justify-center w-10" : "px-3"
                        )}
                    >
                        {mounted && (theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-zinc-600" />)}
                        {!mounted && <div className="w-5 h-5" />}
                        {!isCollapsed && <span>{mounted ? (theme === 'dark' ? 'Modo Claro' : 'Modo Escuro') : ''}</span>}
                    </Button>

                    {/* Logout */}
                    <form action="/auth/signout" method="POST" className="w-full">
                        <Button
                            type="submit"
                            variant="ghost"
                            size={isCollapsed ? "icon" : "default"}
                            className={cn(
                                "w-full h-11 flex items-center justify-start gap-3 rounded-xl hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-all",
                                isCollapsed ? "justify-center w-10 mx-auto" : "px-3"
                            )}
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && <span className="font-medium">Sair</span>}
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full relative bg-background/50 selection:bg-foreground/10">
                {/* Global Page Loader */}
                <AnimatePresence>
                    {isNavigating && (
                        <motion.div 
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed top-0 left-0 right-0 h-1 bg-foreground z-[100] origin-left"
                        />
                    )}
                </AnimatePresence>

                <div className="h-full relative overflow-x-hidden pb-32 md:pb-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="h-full w-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Mobile Bottom Tab Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] border-t border-border/50 bg-background/80 backdrop-blur-xl z-50 flex items-center justify-around px-4 pb-safe">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 transition-all",
                                isActive ? "scale-110 text-foreground" : "text-muted-foreground opacity-60"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                            <span className="text-[10px] font-semibold tracking-tight">{item.label}</span>
                        </Link>
                    )
                })}
                <NotificationPanel
                    trigger={
                        <button className="flex flex-col items-center justify-center gap-1 text-muted-foreground opacity-60">
                            <NotificationBell unreadCount={unreadCount} className="w-5 h-5" />
                            <span className="text-[10px] font-semibold tracking-tight">Alertas</span>
                        </button>
                    }
                />
            </nav>
        </div>
    )
}
