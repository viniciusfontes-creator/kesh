'use client'

import { useCallback, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface StepUploadProps {
    onComplete: () => void
    onSkip: () => void
}

export function StepUpload({ onComplete, onSkip }: StepUploadProps) {
    const [processing, setProcessing] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [error, setError] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleFile = useCallback(async (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            setError('Arquivo muito grande. Máximo: 10MB')
            return
        }

        setProcessing(true)
        setError('')

        try {
            // Read file as data URL
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(file)
            })

            // Determine media type
            let mediaType = file.type || 'application/pdf'
            if (file.name.endsWith('.pdf')) mediaType = 'application/pdf'
            if (file.name.endsWith('.csv')) mediaType = 'text/csv'

            // Save to sessionStorage for the chat page to pick up
            sessionStorage.setItem('pendingChatAttachment', JSON.stringify({
                mediaType,
                filename: file.name,
                url: dataUrl,
            }))

            // Save the auto-message
            sessionStorage.setItem('pendingChatMessage',
                'Olá Kesh, segue em anexo meu extrato financeiro, quero que você crie essa conta no meu banco de dados e categorize todas as entradas e saídas. Ao decorrer da execução, liste quais transações você ficou em dúvida ou gostaria de saber se são recorrentes e etc.'
            )

            // Mark onboarding as complete before redirecting
            await fetch('/api/onboarding/complete', { method: 'POST' })

            // Redirect to chat
            router.push('/chat')
        } catch {
            setError('Erro ao processar arquivo. Tente novamente.')
            setProcessing(false)
        }
    }, [router])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) handleFile(droppedFile)
    }, [handleFile])

    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-[520px]"
        >
            <div className="space-y-3 text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/60 border border-border/50 mb-2">
                    <FileText className="w-7 h-7 text-foreground" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Importe seu extrato
                </h2>
                <p className="text-sm text-muted-foreground max-w-[360px] mx-auto">
                    Envie um extrato bancário e nossa IA vai analisar, categorizar e registrar todas as suas transações automaticamente.
                </p>
            </div>

            <div className="bg-card/40 backdrop-blur-3xl p-8 rounded-[32px] border border-border/50 shadow-xl shadow-black/5 space-y-6">
                {!processing ? (
                    <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                            dragOver
                                ? 'border-foreground/40 bg-muted/40'
                                : 'border-border/50 hover:border-border hover:bg-muted/20'
                        }`}
                    >
                        <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-sm font-medium text-foreground">
                            Arraste seu extrato aqui
                        </p>
                        <p className="text-xs text-muted-foreground/50 mt-1">
                            PDF, imagem ou CSV
                        </p>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".pdf,.csv,.jpg,.jpeg,.png,image/*,application/pdf"
                            className="hidden"
                            onChange={e => {
                                const f = e.target.files?.[0]
                                if (f) handleFile(f)
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
                        <div className="text-center">
                            <p className="text-sm font-medium text-foreground">Preparando...</p>
                            <p className="text-xs text-muted-foreground mt-1">Redirecionando para o chat com a IA</p>
                        </div>
                    </div>
                )}

                {error && (
                    <p className="text-sm text-red-500 text-center">{error}</p>
                )}
            </div>

            <div className="text-center mt-6">
                <button
                    onClick={onSkip}
                    disabled={processing}
                    className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors font-medium"
                >
                    Pular por enquanto
                </button>
            </div>
        </motion.div>
    )
}
