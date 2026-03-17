'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface SubmitButtonProps {
    children: React.ReactNode
    className?: string
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    formAction?: (formData: FormData) => void
}

export function SubmitButton({ children, className, variant, formAction }: SubmitButtonProps) {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            disabled={pending}
            className={className}
            variant={variant}
            formAction={formAction}
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aguarde...
                </>
            ) : (
                children
            )}
        </Button>
    )
}
