import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface ImportedTransaction {
    descricao: string
    valor: number
    tipo: 'entrada' | 'saida'
    categoria: string
    data: string
}

export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transactions } = await req.json() as { transactions: ImportedTransaction[] }

    if (!Array.isArray(transactions) || transactions.length === 0) {
        return NextResponse.json({ error: 'No transactions provided' }, { status: 400 })
    }

    // Collect unique categories to ensure they exist
    const uniqueCategories = [...new Set(transactions.map(t => t.categoria).filter(Boolean))]

    // Get existing categories
    const { data: existingCats } = await supabase
        .from('categorias')
        .select('nome')
        .eq('user_id', user.id)

    const existingNames = new Set((existingCats || []).map(c => c.nome))

    // Create missing categories
    const newCategories = uniqueCategories
        .filter(name => !existingNames.has(name))
        .map(nome => ({
            user_id: user.id,
            nome,
            tipo: 'geral' as const,
        }))

    if (newCategories.length > 0) {
        await supabase.from('categorias').insert(newCategories)
    }

    // Insert transactions
    const rows = transactions.map(t => ({
        user_id: user.id,
        descricao: t.descricao,
        valor: Math.abs(t.valor),
        tipo: t.tipo,
        categoria: t.categoria,
        data: t.data,
        status: 'pago' as const,
        source: 'import' as const,
    }))

    const { data, error } = await supabase
        .from('transactions')
        .insert(rows)
        .select()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ imported: data?.length || 0 })
}
