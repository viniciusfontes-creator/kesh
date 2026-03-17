import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const transactionSchema = z.object({
    transactions: z.array(z.object({
        descricao: z.string().describe('Descrição da transação'),
        valor: z.number().describe('Valor absoluto da transação'),
        tipo: z.enum(['entrada', 'saida']).describe('entrada = receita/crédito, saida = despesa/débito'),
        categoria: z.string().describe('Categoria sugerida (ex: Alimentação, Transporte, Salário, Moradia, Lazer, Saúde, Educação, Outros)'),
        data: z.string().describe('Data no formato YYYY-MM-DD'),
    })),
})

export const maxDuration = 60

export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type || 'application/pdf'

    try {
        const result = await generateObject({
            model: google('gemini-flash-latest'),
            schema: transactionSchema,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'file',
                            data: base64,
                            mimeType,
                        } as any,
                        {
                            type: 'text',
                            text: `Analise este extrato bancário/financeiro e extraia TODAS as transações encontradas.

Para cada transação, identifique:
- descricao: descrição clara da transação
- valor: valor numérico (sempre positivo)
- tipo: "entrada" para receitas/créditos, "saida" para despesas/débitos
- categoria: categorize entre: Alimentação, Transporte, Salário, Moradia, Lazer, Saúde, Educação, Compras, Serviços, Transferência, Investimento, Outros
- data: data da transação no formato YYYY-MM-DD

Se não conseguir identificar a data exata, use a data mais provável baseada no contexto do documento.
Retorne todas as transações encontradas, mesmo que sejam muitas.`,
                        },
                    ],
                },
            ],
        })

        return NextResponse.json(result.object)
    } catch (error) {
        console.error('Error analyzing statement:', error)
        return NextResponse.json(
            { error: 'Não foi possível analisar o extrato. Tente novamente.' },
            { status: 500 }
        )
    }
}
