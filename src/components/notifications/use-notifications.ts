'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Notification } from '@/types/database'

const POLL_INTERVAL = 30_000 // 30 seconds

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications')
            if (!res.ok) return
            const data = await res.json()
            setNotifications(data.notifications)
            setUnreadCount(data.unreadCount)
        } catch {
            // silently fail on polling errors
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, POLL_INTERVAL)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    const markAsRead = useCallback(async (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))

        await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    }, [])

    const markAllAsRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)

        await fetch('/api/notifications', { method: 'PATCH' })
    }, [])

    const deleteNotification = useCallback(async (id: string) => {
        const target = notifications.find(n => n.id === id)
        setNotifications(prev => prev.filter(n => n.id !== id))
        if (target && !target.read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
        }

        await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    }, [notifications])

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refetch: fetchNotifications,
    }
}
