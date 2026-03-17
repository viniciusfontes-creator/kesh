'use client'

import { useChat } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { Send, User, Sparkles, Plus, History, Edit2, Check, Paperclip, ImageIcon, Mic, X, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface FileUIPart {
    type: 'file'
    mediaType: string
    filename?: string
    url: string
}
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { MarkdownContent } from '@/components/chat/markdown-content'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const TOOL_DISPLAY: Record<string, { pending: string; done: string }> = {
    insertTransaction: { pending: 'Adicionando transação...', done: 'Transação adicionada' },
    getBalance: { pending: 'Consultando dados...', done: 'Balanço consultado' },
    listTransactions: { pending: 'Buscando transações...', done: 'Transações encontradas' },
    deleteTransaction: { pending: 'Removendo transação...', done: 'Transação removida' },
    updateTransaction: { pending: 'Atualizando transação...', done: 'Transação atualizada' },
    listCategorias: { pending: 'Buscando categorias...', done: 'Categorias listadas' },
    createCategoria: { pending: 'Criando categoria...', done: 'Categoria criada' },
    createMeta: { pending: 'Criando meta...', done: 'Meta criada' },
    listMetas: { pending: 'Buscando metas...', done: 'Metas listadas' },
    checkMetas: { pending: 'Verificando metas...', done: 'Metas verificadas' },
    createNotification: { pending: 'Criando notificação...', done: 'Notificação criada' },
}

interface Session {
    id: string
    title: string
    created_at: string
}

export default function ChatPage() {
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
    const [sessions, setSessions] = useState<Session[]>([])
    const [isHistoryLoading, setIsHistoryLoading] = useState(false)
    const [input, setInput] = useState('')
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
    const [editTitleValue, setEditTitleValue] = useState('')
    const [attachments, setAttachments] = useState<FileUIPart[]>([])
    const [isRecording, setIsRecording] = useState(false)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const [showAttachMenu, setShowAttachMenu] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)

    // Chamada padrão do useChat - Versão v3.0 / v6.x
    const { messages, sendMessage, setMessages, status, error } = useChat({
        onError: (err) => {
            console.error('Chat error:', err)
        },
    })
    const isLoading = status === 'streaming' || status === 'submitted'
    
    const bottomRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Check for pending attachment from other pages (e.g. /contas upload, onboarding)
    useEffect(() => {
        const pending = sessionStorage.getItem('pendingChatAttachment')
        const pendingMessage = sessionStorage.getItem('pendingChatMessage')
        if (pending) {
            try {
                const data = JSON.parse(pending)
                setAttachments([{
                    type: 'file',
                    mediaType: data.mediaType,
                    filename: data.filename,
                    url: data.url,
                }])
                if (pendingMessage) {
                    setInput(pendingMessage)
                } else if (data.accountName) {
                    setInput(`Analise este extrato da conta ${data.accountName} e registre as transações encontradas.`)
                }
            } catch { /* ignore parse errors */ }
            sessionStorage.removeItem('pendingChatAttachment')
            sessionStorage.removeItem('pendingChatMessage')
        }
    }, [])

    const fetchSessions = useCallback(async () => {
        try {
            const r = await fetch('/api/chat/sessions')
            if (r.ok) {
                const data = await r.json()
                setSessions(data)
                if (data.length > 0 && !activeSessionId) {
                    setActiveSessionId(data[0].id)
                }
            }
        } catch (e) {
            console.error('Error fetching sessions', e)
        }
    }, [activeSessionId])

    useEffect(() => {
        const timeout = setTimeout(() => {
            void fetchSessions()
        }, 0)
        return () => clearTimeout(timeout)
    }, [fetchSessions])

    const createNewSession = async () => {
        try {
            const r = await fetch('/api/chat/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'Nova Conversa' })
            })
            if (r.ok) {
                const newSession = await r.json()
                setSessions(prev => [newSession, ...prev])
                setActiveSessionId(newSession.id)
                setMessages([])
                setIsHistoryOpen(false)
                return newSession.id
            }
        } catch (e) {
            console.error('Error creating session', e)
        }
    }

    const renameSession = async (id: string, newTitle: string) => {
        try {
            const r = await fetch('/api/chat/sessions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title: newTitle })
            })
            if (r.ok) {
                setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s))
                setEditingSessionId(null)
            }
        } catch (e) {
            console.error('Error renaming session', e)
        }
    }

    // Load history when session changes
    useEffect(() => {
        if (!activeSessionId) return

        setIsHistoryLoading(true)
        fetch(`/api/chat/history?sessionId=${activeSessionId}`)
            .then(r => (r.ok ? r.json() : []))
            .then(msgs => {
                setMessages(msgs)
                setIsHistoryLoading(false)
            })
            .catch(() => setIsHistoryLoading(false))
    }, [activeSessionId, setMessages])

    useEffect(() => {
        const timer = setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
        return () => clearTimeout(timer)
    }, [messages, isLoading])

    // --- Attachment handlers ---

    const compressImage = (file: File, maxSize = 4 * 1024 * 1024): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (file.size <= maxSize && (file.type === 'image/jpeg' || file.type === 'image/webp')) {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(file)
                return
            }
            const img = new Image()
            const url = URL.createObjectURL(file)
            img.onload = () => {
                URL.revokeObjectURL(url)
                const canvas = document.createElement('canvas')
                let { width, height } = img
                const MAX_DIM = 2048
                if (width > MAX_DIM || height > MAX_DIM) {
                    const ratio = Math.min(MAX_DIM / width, MAX_DIM / height)
                    width = Math.round(width * ratio)
                    height = Math.round(height * ratio)
                }
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')!
                ctx.drawImage(img, 0, 0, width, height)
                resolve(canvas.toDataURL('image/jpeg', 0.8))
            }
            img.onerror = reject
            img.src = url
        })
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return
        setShowAttachMenu(false)

        for (const file of Array.from(files)) {
            if (file.size > 10 * 1024 * 1024) {
                alert('Arquivo muito grande. Máximo: 10MB')
                continue
            }

            if (file.type.startsWith('image/')) {
                try {
                    const dataUrl = await compressImage(file)
                    setAttachments(prev => [...prev, {
                        type: 'file',
                        mediaType: 'image/jpeg',
                        filename: file.name,
                        url: dataUrl,
                    }])
                } catch {
                    alert('Erro ao processar imagem.')
                }
            } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                const reader = new FileReader()
                reader.onload = () => {
                    setAttachments(prev => [...prev, {
                        type: 'file',
                        mediaType: 'application/pdf',
                        filename: file.name,
                        url: reader.result as string,
                    }])
                }
                reader.readAsDataURL(file)
            }
        }
        if (imageInputRef.current) imageInputRef.current.value = ''
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(t => t.stop())
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                const reader = new FileReader()
                reader.onload = () => {
                    setAttachments(prev => [...prev, {
                        type: 'file',
                        mediaType: 'audio/webm',
                        filename: `audio-${Date.now()}.webm`,
                        url: reader.result as string,
                    }])
                }
                reader.readAsDataURL(audioBlob)
                if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
                setRecordingDuration(0)
            }

            mediaRecorder.start(250)
            setIsRecording(true)
            setShowAttachMenu(false)

            let seconds = 0
            recordingTimerRef.current = setInterval(() => {
                seconds++
                setRecordingDuration(seconds)
                if (seconds >= 120) stopRecording() // max 2 min
            }, 1000)
        } catch {
            alert('Permissão de microfone negada. Habilite nas configurações do navegador.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
        setIsRecording(false)
    }

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index))
    }

    const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

    // --- Send ---

    const handleSend = () => {
        if ((!input.trim() && attachments.length === 0) || isLoading) return

        const content = input
        const files = attachments.length > 0 ? [...attachments] : []
        setInput('')
        setAttachments([])
        if (textareaRef.current) textareaRef.current.style.height = 'auto'

        // Constrói partes para compatibilidade com o servidor (que já normaliza)
        const parts: any[] = []
        if (content.trim()) {
            parts.push({ type: 'text', text: content })
        }
        files.forEach(f => {
            parts.push({
                type: 'file',
                mediaType: f.mediaType,
                url: f.url,
                filename: f.filename
            })
        })

        const processMessage = (sessionId: string) => {
            // No SDK v3/v6, usamos sendMessage com o formato { text, files }
            if (typeof sendMessage === 'function') {
                sendMessage({
                    text: content,
                    files: files.map(f => ({
                        type: 'file',
                        url: f.url,
                        filename: f.filename,
                        mediaType: f.mediaType
                    })) as any[]
                }, { body: { sessionId } })
            } else {
                console.error('Erro: função sendMessage não encontrada no useChat')
            }

            const currentSession = sessions.find(s => s.id === sessionId)
            if (!currentSession || currentSession.title === 'Nova Conversa' || !currentSession.title) {
                const titleText = content || (files.length > 0 ? 'Anexo enviado' : 'Nova Conversa')
                const shortTitle = titleText.length > 30 ? titleText.substring(0, 30) + '...' : titleText
                renameSession(sessionId, shortTitle)
            }
        }

        if (!activeSessionId) {
            createNewSession().then((newId) => {
                if (newId) processMessage(newId)
            })
        } else {
            processMessage(activeSessionId)
        }
    }

    return (
        <div className="flex h-full w-full overflow-hidden bg-background">
            {/* Desktop Side History (Colapsible) */}
            <aside className="hidden lg:flex flex-col w-80 border-r border-border bg-card/10 backdrop-blur-md">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <h2 className="font-extrabold text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">Histórico</h2>
                    <Button variant="ghost" size="icon-sm" onClick={createNewSession} className="hover:bg-foreground hover:text-background rounded-lg transition-all">
                        <Plus className="w-3.5 h-3.5" />
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-none">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className={cn(
                                "group relative w-full px-2 py-1",
                            )}
                        >
                            <div
                                onClick={() => {
                                    if (editingSessionId !== session.id) {
                                        setActiveSessionId(session.id)
                                        setMessages([])
                                    }
                                }}
                                className={cn(
                                    "w-full text-left px-4 py-3 rounded-[16px] text-sm font-semibold transition-all flex items-center justify-between cursor-pointer",
                                    activeSessionId === session.id 
                                        ? "bg-foreground text-background shadow-lg shadow-foreground/10" 
                                        : "hover:bg-muted text-muted-foreground/70 hover:text-foreground"
                                )}
                            >
                                <div className="flex-1 min-w-0 pr-4">
                                    {editingSessionId === session.id ? (
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                autoFocus
                                                value={editTitleValue}
                                                onChange={(e) => setEditTitleValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') renameSession(session.id, editTitleValue)
                                                    if (e.key === 'Escape') setEditingSessionId(null)
                                                }}
                                                className="w-full bg-background/50 dark:bg-foreground/5 text-xs font-bold px-2 py-1 rounded-md border border-border outline-none focus:ring-2 ring-foreground/10"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => renameSession(session.id, editTitleValue)}
                                                className="p-1 hover:bg-background/20 rounded-md transition-colors"
                                            >
                                                <Check className="w-3 h-3 text-emerald-500" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="line-clamp-1">{session.title || 'Nova Conversa'}</div>
                                    )}
                                    <div className={cn("text-[9px] font-bold mt-0.5 opacity-40 uppercase", activeSessionId === session.id ? "text-background" : "")}>
                                        {new Date(session.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    </div>
                                </div>
                                
                                {activeSessionId === session.id && editingSessionId !== session.id && (
                                    <button 
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setEditingSessionId(session.id)
                                            setEditTitleValue(session.title || 'Nova Conversa')
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background/20 rounded-md"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {sessions.length === 0 && !isHistoryLoading && (
                        <div className="text-center py-10 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                            Nenhum chat
                        </div>
                    )}
                </div>
            </aside>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="flex-none border-b border-border bg-background/80 backdrop-blur-md z-20">
                    <div className="flex items-center justify-between h-14 md:h-16 px-4 md:px-8 max-w-5xl mx-auto w-full">
                        <div className="flex items-center gap-4">
                            {/* Mobile History Trigger */}
                            <div className="lg:hidden">
                                <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                                    <SheetTrigger render={<Button variant="ghost" size="icon" className="text-muted-foreground" />}>
                                        <History className="w-5 h-5" />
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-[300px] p-0 border-r border-border bg-background">
                                        <SheetHeader className="p-6 border-b border-border flex-row items-center justify-between space-y-0 text-left">
                                            <SheetTitle className="text-left font-black tracking-tighter text-2xl">Histórico</SheetTitle>
                                        </SheetHeader>
                                        <div className="flex flex-col h-full pb-10">
                                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                                {isHistoryLoading ? (
                                                    <div className="space-y-4">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="h-16 bg-muted animate-pulse rounded-2xl" />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    sessions.map((session) => (
                                                        <button
                                                            key={session.id}
                                                            onClick={() => {
                                                                setActiveSessionId(session.id)
                                                                setIsHistoryOpen(false)
                                                                setMessages([])
                                                            }}
                                                            className={cn(
                                                                "w-full text-left px-5 py-4 rounded-2xl text-sm font-bold transition-all",
                                                                activeSessionId === session.id 
                                                                    ? "bg-foreground text-background" 
                                                                    : "hover:bg-muted text-muted-foreground"
                                                            )}
                                                        >
                                                            <div className="line-clamp-1">{session.title || 'Nova Conversa'}</div>
                                                            <div className="text-[10px] opacity-40 mt-1">
                                                                {new Date(session.created_at).toLocaleDateString('pt-BR')}
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                                {sessions.length === 0 && !isHistoryLoading && (
                                                    <div className="text-center py-10 text-muted-foreground/40 font-medium italic text-xs">
                                                        Nenhuma conversa encontrada.
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 mt-auto">
                                                <Button 
                                                    onClick={() => {
                                                        createNewSession()
                                                        setIsHistoryOpen(false)
                                                    }}
                                                    className="w-full h-12 rounded-2xl gap-2 font-bold bg-foreground text-background"
                                                >
                                                    <Plus className="w-4 h-4" /> Nova Conversa
                                                </Button>
                                            </div>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>

                            <div className="h-6 w-[1px] bg-border/60 mx-1 md:block hidden" />

                            <div>
                                <h1 className="text-lg font-bold tracking-tight text-foreground truncate max-w-[200px] md:max-w-md">
                                    {sessions.find(s => s.id === activeSessionId)?.title || 'Nova Conversa'}
                                </h1>
                                <div className="flex items-center gap-1.5 opacity-60">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">AI</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button 
                                onClick={createNewSession}
                                variant="outline" 
                                size="sm" 
                                className="rounded-xl border-border bg-background hover:bg-muted text-foreground font-bold md:flex hidden"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Chat
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 w-full overflow-y-auto px-4 md:px-8 lg:px-12 mb-36 md:mb-12 scrollbar-none pt-8 max-w-5xl mx-auto">
                    <AnimatePresence mode="popLayout">
                        {(messages.length === 0 && !isHistoryLoading) ? (
                            <motion.div
                                key="empty-state"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8"
                            >
                                <motion.div 
                                    whileHover={{ scale: 1.05, rotate: -2 }}
                                    className="px-8 py-4 bg-card rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-foreground/5 ring-1 ring-border/50"
                                >
                                    <h1 className="text-5xl font-black tracking-tighter text-foreground italic">Kesh</h1>
                                </motion.div>
                                <div className="space-y-3">
                                    <h2 className="text-3xl font-black tracking-tight text-foreground">Como posso ajudar hoje?</h2>
                                    <p className="text-muted-foreground font-medium max-w-[320px] text-[15px] leading-relaxed mx-auto italic">
                                        Pergunte sobre seus investimentos, gastos do mês ou metas futuras.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg pt-4">
                                     {[
                                         "Quanto gastei com lazer esse mês?",
                                         "Adicionar gasto de R$ 50 em alimentação",
                                         "Quais metas estão próximas de vencer?",
                                         "Envie uma foto da fatura para registrar"
                                     ].map((hint, i) => (
                                         <button 
                                            key={i}
                                            onClick={() => setInput(hint)}
                                            className="p-4 text-xs font-bold text-muted-foreground text-left bg-card/40 hover:bg-muted hover:text-foreground border border-border/50 rounded-2xl transition-all"
                                         >
                                             {hint}
                                         </button>
                                     ))}
                                </div>
                            </motion.div>
                        ) : null}

                        {isHistoryLoading && messages.length === 0 && (
                            <div className="flex items-center justify-center h-full">
                                <div className="flex flex-col items-center gap-4">
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-6 h-6 border-2 border-foreground/10 border-t-foreground rounded-full" 
                                    />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Carregando Diálogo</span>
                                </div>
                            </div>
                        )}

                        {messages.filter(m => m.role !== 'system').map((m, index) => (
                            <motion.div
                                key={`msg-${m.id}-${index}`}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ 
                                    type: 'spring', 
                                    damping: 30, 
                                    stiffness: 200,
                                    delay: index * 0.05
                                }}
                                className={cn(
                                    "flex w-full mb-10",
                                    m.role === 'user' ? 'justify-end' : 'justify-start'
                                )}
                            >
                                <div className={cn(
                                    "flex gap-4 max-w-[98%] sm:max-w-[85%] lg:max-w-[80%]",
                                    m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                )}>
                                    <Avatar className={cn(
                                        "w-8 h-8 mt-1 shadow-sm shrink-0 transition-transform active:scale-95",
                                        m.role === 'user' ? "bg-foreground" : "bg-muted"
                                    )}>
                                        <AvatarFallback className={cn(
                                            "font-bold text-[10px]",
                                            m.role === 'user' ? 'text-background' : 'text-foreground'
                                        )}>
                                            {m.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 fill-foreground" />}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className={cn(
                                        "flex flex-col gap-2 relative group",
                                        m.role === 'user' ? 'items-end' : 'items-start'
                                    )}>
                                        {/* Render attachments/parts (UIMessagePart pattern for v3/v6) */}
                                        {m.parts && (m.parts as any[]).length > 0 && (
                                            <div className={cn(
                                                "flex flex-col gap-2 mb-2",
                                                m.role === 'user' ? 'items-end' : 'items-start'
                                            )}>
                                                {/* 1. Render Files first */}
                                                <div className={cn(
                                                    "flex flex-wrap gap-2",
                                                    m.role === 'user' ? 'justify-end' : 'justify-start'
                                                )}>
                                                    {(m.parts as any[]).filter(p => p.type === 'file').map((p, pi) => {
                                                        const part = p
                                                        if (part.mediaType?.startsWith('image/') || part.url?.startsWith('data:image')) {
                                                            return (
                                                                <div key={pi} className="w-48 h-48 rounded-2xl overflow-hidden border border-border/50 shadow-lg">
                                                                    <img src={part.url} alt={part.filename || 'imagem'} className="w-full h-full object-cover" />
                                                                </div>
                                                            )
                                                        }
                                                        if (part.mediaType?.startsWith('audio/') || part.url?.startsWith('data:audio')) {
                                                            return (
                                                                <div key={pi} className="rounded-2xl border border-border/50 shadow-lg overflow-hidden bg-card p-3">
                                                                    <audio src={part.url} controls className="h-8" />
                                                                </div>
                                                            )
                                                        }
                                                        return null
                                                    })}
                                                </div>

                                                {/* 2. Render Text Content */}
                                                {(m.parts as any[]).some(p => p.type === 'text') && (
                                                    <div
                                                        className={cn(
                                                            'px-6 py-4 text-[15px] leading-[1.6] shadow-xl transition-all duration-300',
                                                            m.role === 'user'
                                                                ? 'bg-foreground text-background rounded-[22px] rounded-tr-none font-semibold'
                                                                : 'bg-card text-foreground border border-border/50 rounded-[22px] rounded-tl-none'
                                                        )}
                                                    >
                                                        <MarkdownContent
                                                            noInvert={m.role === 'user'}
                                                            content={(m.parts as any[]).filter(p => p.type === 'text').map(p => p.text).join('')}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <span className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-[0.2em] px-2">
                                            {m.role === 'user' ? 'Enviado' : 'AI'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex justify-start w-full mb-10"
                            >
                                <div className="flex gap-4 flex-row items-center">
                                    <Avatar className="w-8 h-8 bg-muted">
                                        <AvatarFallback className="text-foreground font-bold text-[10px]">
                                            <Sparkles className="w-4 h-4 fill-foreground" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="px-6 py-4 bg-muted/20 rounded-[20px] rounded-tl-none flex flex-col gap-2 border border-border/50 shadow-sm relative overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            {[0, 1, 2].map((i) => (
                                                <motion.span
                                                    key={i}
                                                    animate={{
                                                        scale: [1, 1.4, 1],
                                                        opacity: [0.3, 1, 0.3]
                                                    }}
                                                    transition={{
                                                        duration: 0.8,
                                                        repeat: Infinity,
                                                        delay: i * 0.15,
                                                        ease: "easeInOut"
                                                    }}
                                                    className="w-1.5 h-1.5 rounded-full bg-foreground"
                                                />
                                            ))}
                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-[0.2em] ml-2">Kesh está pensando...</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start w-full mb-10"
                            >
                                <div className="px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-[22px] rounded-tl-none max-w-[85%]">
                                    <p className="text-sm font-medium text-red-500">
                                        Ocorreu um erro ao processar sua mensagem. Tente novamente.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={bottomRef} className="h-20" />
                </div>

                {/* Hidden file input */}
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                />

                {/* Input Area - Floats elegantly */}
                <div className="absolute bottom-2 md:bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 md:px-8 z-40">
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, type: 'spring', damping: 20 }}
                        className="w-full flex flex-col gap-2"
                    >
                        {/* Attachment Previews */}
                        <AnimatePresence>
                            {attachments.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: 10, height: 0 }}
                                    className="flex gap-2 px-4 overflow-x-auto scrollbar-none"
                                >
                                    {attachments.map((att, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="relative shrink-0 group"
                                        >
                                            {att.mediaType.startsWith('image/') ? (
                                                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-border shadow-lg bg-card">
                                                    <img src={att.url} alt={att.filename} className="w-full h-full object-cover" />
                                                </div>
                                            ) : att.mediaType.startsWith('audio/') ? (
                                                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-border shadow-lg bg-card">
                                                    <Mic className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-xs font-bold text-muted-foreground">Áudio</span>
                                                </div>
                                            ) : att.mediaType === 'application/pdf' ? (
                                                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-border shadow-lg bg-card">
                                                    <Paperclip className="w-4 h-4 text-red-500" />
                                                    <span className="text-xs font-bold text-muted-foreground truncate max-w-[120px]">{att.filename || 'PDF'}</span>
                                                </div>
                                            ) : null}
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(i)}
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {isRecording ? (
                                /* Recording bar - WhatsApp style */
                                <motion.div
                                    key="recording"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex w-full gap-3 items-center bg-card/80 dark:bg-zinc-900/60 backdrop-blur-[40px] p-2.5 pl-4 pr-2.5 rounded-[28px] shadow-2xl border border-red-500/30 ring-2 ring-red-500/10"
                                >
                                    {/* Cancel button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            stopRecording()
                                            setAttachments(prev => prev.filter(a => !a.mediaType.startsWith('audio/')))
                                        }}
                                        className="p-2 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    {/* Waveform + timer */}
                                    <div className="flex-1 flex items-center gap-3 px-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                                        <div className="flex items-center gap-[3px] flex-1">
                                            {Array.from({ length: 24 }).map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{
                                                        height: [4, Math.random() * 20 + 6, 4],
                                                    }}
                                                    transition={{
                                                        duration: 0.6 + Math.random() * 0.4,
                                                        repeat: Infinity,
                                                        delay: i * 0.05,
                                                        ease: "easeInOut",
                                                    }}
                                                    className="w-[3px] rounded-full bg-foreground/30"
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm font-bold text-foreground tabular-nums shrink-0">
                                            {formatDuration(recordingDuration)}
                                        </span>
                                    </div>

                                    {/* Stop & send button */}
                                    <button
                                        type="button"
                                        onClick={stopRecording}
                                        className="h-11 w-11 rounded-[20px] shrink-0 bg-foreground text-background flex items-center justify-center shadow-xl shadow-foreground/20 hover:scale-105 active:scale-90 transition-all"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ) : (
                                /* Normal input bar */
                                <motion.form
                                    key="input"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        handleSend()
                                    }}
                                    className={cn(
                                        "flex w-full gap-2 items-center bg-card/80 dark:bg-zinc-900/60 backdrop-blur-[40px] p-2.5 pl-3 pr-2.5 rounded-[28px] shadow-2xl border border-border transition-all duration-300",
                                        (input.trim() || attachments.length > 0) ? "ring-2 ring-emerald-500/20 border-emerald-500/30" : "ring-1 ring-white/5"
                                    )}
                                >
                                    {/* Attachment menu */}
                                    <div className="relative shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setShowAttachMenu(prev => !prev)}
                                            className={cn(
                                                "p-2.5 rounded-full transition-all",
                                                showAttachMenu ? "bg-foreground text-background" : "text-muted-foreground/50 hover:text-foreground hover:bg-muted"
                                            )}
                                        >
                                            <Paperclip className="w-4 h-4" />
                                        </button>
                                        <AnimatePresence>
                                            {showAttachMenu && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                    className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden min-w-[180px]"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => imageInputRef.current?.click()}
                                                        className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                                                    >
                                                        <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                                        Arquivo / Imagem
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <textarea
                                        ref={textareaRef}
                                        value={input}
                                        rows={1}
                                        onChange={(e) => {
                                            setInput(e.target.value)
                                            e.target.style.height = 'auto'
                                            e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) {
                                                e.preventDefault()
                                                handleSend()
                                            }
                                        }}
                                        onFocus={() => setShowAttachMenu(false)}
                                        placeholder="Descreva seus ganhos ou despesas..."
                                        className="flex-1 border-none bg-transparent py-4 text-[16px] resize-none min-h-[52px] max-h-[200px] focus:outline-none scrollbar-none font-medium placeholder:text-muted-foreground/40"
                                    />
                                    {/* Mic / Send toggle */}
                                    {(!input.trim() && attachments.length === 0 && !isLoading) ? (
                                        <button
                                            type="button"
                                            onClick={startRecording}
                                            className="h-11 w-11 rounded-[20px] shrink-0 bg-muted text-muted-foreground/50 hover:text-foreground hover:bg-muted/80 flex items-center justify-center transition-all active:scale-90"
                                        >
                                            <Mic className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            size="icon"
                                            disabled={(!input.trim() && attachments.length === 0) || isLoading}
                                            className={cn(
                                                'h-11 w-11 rounded-[20px] shrink-0 transition-all duration-500 active:scale-90',
                                                isLoading
                                                    ? 'bg-muted text-muted-foreground/30 border border-border/30'
                                                    : 'bg-foreground text-background shadow-xl shadow-foreground/20 hover:scale-105'
                                            )}
                                        >
                                            {isLoading ? (
                                                <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                        </Button>
                                    )}
                                </motion.form>
                            )}
                        </AnimatePresence>
                        <div className="flex justify-center items-center gap-4 px-6">
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/30">Privacidade Total</span>
                            <div className="w-1 h-1 rounded-full bg-border/40" />
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/30">AI</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
