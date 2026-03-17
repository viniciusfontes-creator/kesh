'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    AlertTriangle,
    TrendingDown,
    Clock,
    ArrowRightLeft,
    BarChart3,
    Trophy,
    Info,
    Bell,
    CheckCheck,
    Trash2,
    BellOff,
} from 'lucide-react'
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useNotifications } from './use-notifications'
import type { NotificationType } from '@/types/database'

const NOTIFICATION_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
    meta_alert: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    meta_exceeded: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
    bill_reminder: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    transaction: { icon: ArrowRightLeft, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    weekly_summary: { icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    achievement: { icon: Trophy, color: 'text-green-500', bg: 'bg-green-500/10' },
    system: { icon: Info, color: 'text-muted-foreground', bg: 'bg-muted/40' },
}

function timeAgo(dateStr: string): string {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    const diffHour = Math.floor(diffMs / 3_600_000)
    const diffDay = Math.floor(diffMs / 86_400_000)

    if (diffMin < 1) return 'agora'
    if (diffMin < 60) return `${diffMin}min`
    if (diffHour < 24) return `${diffHour}h`
    if (diffDay < 7) return `${diffDay}d`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function groupNotifications(notifications: ReturnType<typeof useNotifications>['notifications']) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 86_400_000)

    const groups: { label: string; items: typeof notifications }[] = [
        { label: 'Hoje', items: [] },
        { label: 'Esta semana', items: [] },
        { label: 'Anteriores', items: [] },
    ]

    for (const n of notifications) {
        const date = new Date(n.created_at)
        if (date >= today) {
            groups[0].items.push(n)
        } else if (date >= weekAgo) {
            groups[1].items.push(n)
        } else {
            groups[2].items.push(n)
        }
    }

    return groups.filter(g => g.items.length > 0)
}

interface NotificationPanelProps {
    trigger: React.ReactNode
}

export function NotificationPanel({ trigger }: NotificationPanelProps) {
    const router = useRouter()
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useNotifications()

    const groups = groupNotifications(notifications)

    const handleClick = (id: string, actionUrl: string | null, read: boolean) => {
        if (!read) markAsRead(id)
        if (actionUrl) router.push(actionUrl)
    }

    return (
        <Sheet>
            <SheetTrigger render={trigger as React.JSX.Element} />
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="p-5 pb-3 border-b border-border/40">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-lg font-bold">Notificações</SheetTitle>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsRead}
                                className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Marcar todas como lidas
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
                            <BellOff className="w-10 h-10 opacity-40" />
                            <p className="text-sm">Nenhuma notificação</p>
                        </div>
                    ) : (
                        <div className="py-2">
                            <AnimatePresence initial={false}>
                                {groups.map(group => (
                                    <div key={group.label}>
                                        <p className="px-5 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            {group.label}
                                        </p>
                                        {group.items.map((notification) => {
                                            const config = NOTIFICATION_CONFIG[notification.type]
                                            const Icon = config.icon

                                            return (
                                                <motion.div
                                                    key={notification.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, x: -100 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <div
                                                        onClick={() => handleClick(notification.id, notification.action_url, notification.read)}
                                                        className={cn(
                                                            "flex gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-muted/40 group relative",
                                                            !notification.read && "bg-foreground/[0.02]"
                                                        )}
                                                    >
                                                        {/* Unread dot */}
                                                        {!notification.read && (
                                                            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                        )}

                                                        {/* Icon */}
                                                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5", config.bg)}>
                                                            <Icon className={cn("w-4 h-4", config.color)} />
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={cn(
                                                                "text-sm leading-snug",
                                                                !notification.read ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                                                            )}>
                                                                {notification.title}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                                {notification.body}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                                                                {timeAgo(notification.created_at)}
                                                            </p>
                                                        </div>

                                                        {/* Delete */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                deleteNotification(notification.id)
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded-lg self-center"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

interface NotificationBellProps {
    unreadCount: number
    className?: string
}

export function NotificationBell({ unreadCount, className }: NotificationBellProps) {
    return (
        <div className={cn("relative", className)}>
            <Bell className="w-5 h-5" />
            <AnimatePresence>
                {unreadCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
