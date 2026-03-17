import { z } from 'zod'
import { tool } from 'ai'
import { createClient } from '@/lib/supabase/server'

// Helper: get authenticated user or throw
async function getUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) throw new Error('Usuário não autenticado')
    return { supabase, userId: user.id }
}

// ============================================================
// Transacoes
// ============================================================

export const insertTransactionTool = tool({
    description: 'Insere uma nova transação financeira (entrada ou saída) no banco de dados.',
    inputSchema: z.object({
        tipo: z.enum(['entrada', 'saida']).describe('O tipo da transação'),
        valor: z.number().positive().describe('O valor da transação em reais'),
        categoria: z.string().describe('A categoria do gasto/ganho (ex: Alimentação, Transporte, Salário)'),
        descricao: z.string().describe('Uma breve descrição sobre a transação'),
        data: z.string().optional().describe('Data da transação no formato YYYY-MM-DD. Se não for passada, usa hoje.'),
        status: z.enum(['pago', 'pendente']).default('pago').describe('Indica se a transação já foi paga/recebida ou se é uma pendência.'),
        dataVencimento: z.string().optional().describe('Data de vencimento no formato YYYY-MM-DD (útil para contas pendentes).'),
        contaId: z.string().uuid().optional().describe('ID da conta associada (corrente, investimento, etc).'),
        parcelaAtual: z.number().int().positive().optional().describe('Número da parcela atual (se for parcelado).'),
        totalParcelas: z.number().int().positive().optional().describe('Total de parcelas (se for parcelado).'),
        isRecurring: z.boolean().optional().describe('Indica se é uma transação recorrente (ex: salário, aluguel, assinatura).'),
        frequency: z.enum(['semanal', 'mensal', 'anual']).optional().describe('Frequência da recorrência.'),
    }),
    execute: async ({ tipo, valor, categoria, descricao, data, status, dataVencimento, contaId, parcelaAtual, totalParcelas, isRecurring, frequency }) => {
        const { supabase, userId } = await getUser()

        const { data: result, error } = await supabase
            .from('transactions')
            .insert([{
                user_id: userId,
                tipo,
                valor,
                categoria,
                descricao,
                fonte: 'chat',
                status,
                data_vencimento: dataVencimento,
                conta_id: contaId,
                parcela_atual: parcelaAtual,
                total_parcelas: totalParcelas,
                is_recurring: isRecurring ?? false,
                frequency: frequency ?? (isRecurring ? 'mensal' : null),
                ...(data && { data }),
            }])
            .select()

        if (error) return { success: false, error: error.message }

        return {
            success: true,
            message: 'Transação registrada com sucesso!',
            transaction: result?.[0] ?? null,
        }
    },
})

export const listTransactionsTool = tool({
    description: 'Lista transações do usuário com filtros opcionais de período, tipo, categoria e status.',
    inputSchema: z.object({
        tipo: z.enum(['entrada', 'saida']).optional().describe('Filtrar por tipo'),
        categoria: z.string().optional().describe('Filtrar por categoria'),
        status: z.enum(['pago', 'pendente']).optional().describe('Filtrar por status de pagamento'),
        dataInicio: z.string().optional().describe('Data início no formato YYYY-MM-DD'),
        dataFim: z.string().optional().describe('Data fim no formato YYYY-MM-DD'),
        limite: z.number().int().positive().optional().describe('Número máximo de resultados (padrão 20)'),
    }),
    execute: async ({ tipo, categoria, status, dataInicio, dataFim, limite }) => {
        const { supabase, userId } = await getUser()

        let query = supabase
            .from('transactions')
            .select('id, tipo, valor, categoria, descricao, data, status, data_vencimento, parcela_atual, total_parcelas, conta_id, created_at')
            .eq('user_id', userId)
            .order('data', { ascending: false })
            .limit(limite ?? 20)

        if (tipo) query = query.eq('tipo', tipo)
        if (categoria) query = query.ilike('categoria', `%${categoria}%`)
        if (status) query = query.eq('status', status)
        if (dataInicio) query = query.gte('data', dataInicio)
        if (dataFim) query = query.lte('data', dataFim)

        const { data, error } = await query

        if (error) return { success: false, error: error.message }

        return {
            success: true,
            total: data?.length ?? 0,
            transacoes: data ?? [],
        }
    },
})

export const updateTransactionTool = tool({
    description: 'Atualiza campos de uma transação existente. Precisa do ID da transação.',
    inputSchema: z.object({
        id: z.string().uuid().describe('ID da transação a ser atualizada'),
        tipo: z.enum(['entrada', 'saida']).optional().describe('Novo tipo'),
        valor: z.number().positive().optional().describe('Novo valor em reais'),
        categoria: z.string().optional().describe('Nova categoria'),
        descricao: z.string().optional().describe('Nova descrição'),
        data: z.string().optional().describe('Nova data no formato YYYY-MM-DD'),
        isRecurring: z.boolean().optional().describe('Alterar status de recorrência'),
        frequency: z.enum(['semanal', 'mensal', 'anual']).optional().describe('Alterar frequência'),
    }),
    execute: async ({ id, ...fields }) => {
        const { supabase, userId } = await getUser()

        // Remove undefined fields
        const updates = Object.fromEntries(
            Object.entries(fields).filter(([, v]) => v !== undefined)
        )

        if (Object.keys(updates).length === 0) {
            return { success: false, error: 'Nenhum campo para atualizar.' }
        }

        const { data, error } = await supabase
            .from('transactions')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()

        if (error) return { success: false, error: error.message }
        if (!data?.length) return { success: false, error: 'Transação não encontrada.' }

        return { success: true, transaction: data[0] }
    },
})

export const deleteTransactionTool = tool({
    description: 'Deleta uma transação pelo ID. Sempre liste as transações antes para confirmar qual deletar.',
    inputSchema: z.object({
        id: z.string().uuid().describe('ID da transação a ser deletada'),
    }),
    execute: async ({ id }) => {
        const { supabase, userId } = await getUser()

        const { error, count } = await supabase
            .from('transactions')
            .delete({ count: 'exact' })
            .eq('id', id)
            .eq('user_id', userId)

        if (error) return { success: false, error: error.message }
        if (count === 0) return { success: false, error: 'Transação não encontrada.' }

        return { success: true, message: 'Transação deletada com sucesso.' }
    },
})

// ============================================================
// Balanco
// ============================================================

export const getBalanceTool = tool({
    description: 'Obtém um resumo do saldo atual, considerando apenas transações pagas. Também lista pendências próximas.',
    inputSchema: z.object({}),
    execute: async () => {
        const { supabase, userId } = await getUser()

        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        
        // Saldo total (considerando tudo que foi pago)
        const { data: todasPagas, error: errorPagas } = await supabase
            .from('transactions')
            .select('tipo, valor')
            .eq('user_id', userId)
            .eq('status', 'pago')

        if (errorPagas) return { error: errorPagas.message }

        let saldoGeral = 0
        todasPagas?.forEach((t) => {
            if (t.tipo === 'entrada') saldoGeral += Number(t.valor)
            if (t.tipo === 'saida') saldoGeral -= Number(t.valor)
        })

        // Resumo do mês
        const { data: mesTransacoes, error: errorMes } = await supabase
            .from('transactions')
            .select('tipo, valor, status')
            .eq('user_id', userId)
            .gte('data', firstDay)

        if (errorMes) return { error: errorMes.message }

        let entradasMes = 0
        let saidasMes = 0
        let pendenteMes = 0

        mesTransacoes?.forEach((t) => {
            if (t.status === 'pago') {
                if (t.tipo === 'entrada') entradasMes += Number(t.valor)
                if (t.tipo === 'saida') saidasMes += Number(t.valor)
            } else {
                if (t.tipo === 'saida') pendenteMes += Number(t.valor)
            }
        })

        return {
            mesAtivo: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            saldoGeral,
            entradasNoMes: entradasMes,
            saidasNoMes: saidasMes,
            pendenciasNoMes: pendenteMes,
            saldoProjetado: saldoGeral - pendenteMes,
        }
    },
})

// ============================================================
// Contas
// ============================================================

export const createContaTool = tool({
    description: 'Cria uma nova conta ou carteira (ex: Banco do Brasil, Carteira Real, Investimentos).',
    inputSchema: z.object({
        nome: z.string().describe('Nome da conta (ex: Nubank, Dinheiro, XP Investimentos)'),
        tipo: z.enum(['conta_corrente', 'investimento', 'poupanca', 'cartao_credito']).describe('Tipo da conta'),
        saldoInicial: z.number().optional().describe('Saldo inicial da conta'),
        cor: z.string().optional().describe('Cor para identificação visual'),
    }),
    execute: async ({ nome, tipo, saldoInicial, cor }) => {
        const { supabase, userId } = await getUser()

        const { data, error } = await supabase
            .from('contas')
            .insert([{ user_id: userId, nome, tipo, saldo: saldoInicial ?? 0, cor }])
            .select()

        if (error) return { success: false, error: error.message }

        return { success: true, conta: data?.[0] ?? null }
    },
})

export const listContasTool = tool({
    description: 'Lista todas as contas/carteiras do usuário.',
    inputSchema: z.object({}),
    execute: async () => {
        const { supabase, userId } = await getUser()

        const { data, error } = await supabase
            .from('contas')
            .select('*')
            .eq('user_id', userId)
            .order('nome')

        if (error) return { success: false, error: error.message }

        return { success: true, contas: data ?? [] }
    },
})

// ============================================================
// Categorias
// ============================================================

export const listCategoriasTool = tool({
    description: 'Lista as categorias personalizadas do usuário.',
    inputSchema: z.object({
        tipo: z.enum(['entrada', 'saida']).optional().describe('Filtrar por tipo'),
    }),
    execute: async ({ tipo }) => {
        const { supabase, userId } = await getUser()

        let query = supabase
            .from('categorias')
            .select('id, nome, tipo, cor, icone')
            .eq('user_id', userId)
            .order('nome')

        if (tipo) query = query.eq('tipo', tipo)

        const { data, error } = await query

        if (error) return { success: false, error: error.message }

        return { success: true, categorias: data ?? [] }
    },
})

export const createCategoriaTool = tool({
    description: 'Cria uma nova categoria personalizada para o usuário.',
    inputSchema: z.object({
        nome: z.string().describe('Nome da categoria'),
        tipo: z.enum(['entrada', 'saida']).optional().describe('Tipo da categoria'),
        cor: z.string().optional().describe('Cor em hex (ex: #FF5733)'),
        icone: z.string().optional().describe('Nome do ícone (ex: coffee, car)'),
    }),
    execute: async ({ nome, tipo, cor, icone }) => {
        const { supabase, userId } = await getUser()

        const { data, error } = await supabase
            .from('categorias')
            .insert([{ user_id: userId, nome, tipo, cor, icone }])
            .select()

        if (error) return { success: false, error: error.message }

        return { success: true, categoria: data?.[0] ?? null }
    },
})

// ============================================================
// Metas
// ============================================================

export const createMetaTool = tool({
    description: 'Cria uma nova meta financeira (limite de gastos por categoria e período).',
    inputSchema: z.object({
        categoria: z.string().describe('Categoria alvo da meta (ex: Alimentação)'),
        valorLimite: z.number().positive().describe('Valor limite em reais'),
        periodo: z.enum(['mensal', 'semanal', 'anual']).describe('Período da meta'),
    }),
    execute: async ({ categoria, valorLimite, periodo }) => {
        const { supabase, userId } = await getUser()

        const { data, error } = await supabase
            .from('metas')
            .insert([{
                user_id: userId,
                categoria,
                valor_limite: valorLimite,
                periodo,
                ativo: true,
            }])
            .select()

        if (error) return { success: false, error: error.message }

        return { success: true, meta: data?.[0] ?? null }
    },
})

export const listMetasTool = tool({
    description: 'Lista as metas financeiras ativas do usuário.',
    inputSchema: z.object({}),
    execute: async () => {
        const { supabase, userId } = await getUser()

        const { data, error } = await supabase
            .from('metas')
            .select('id, categoria, valor_limite, periodo, ativo')
            .eq('user_id', userId)
            .eq('ativo', true)
            .order('categoria')

        if (error) return { success: false, error: error.message }

        return { success: true, metas: data ?? [] }
    },
})

export const checkMetasTool = tool({
    description: 'Verifica o progresso das metas ativas comparando com os gastos reais do período atual.',
    inputSchema: z.object({}),
    execute: async () => {
        const { supabase, userId } = await getUser()

        // Buscar metas ativas
        const { data: metas, error: metasError } = await supabase
            .from('metas')
            .select('id, categoria, valor_limite, periodo')
            .eq('user_id', userId)
            .eq('ativo', true)

        if (metasError) return { success: false, error: metasError.message }
        if (!metas?.length) return { success: true, metas: [], message: 'Nenhuma meta ativa.' }

        const now = new Date()

        // Calcular range de data por período
        const ranges: Record<string, { start: string; end: string }> = {
            mensal: {
                start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
                end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
            },
            semanal: (() => {
                const day = now.getDay()
                const monday = new Date(now)
                monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
                const sunday = new Date(monday)
                sunday.setDate(monday.getDate() + 6)
                return {
                    start: monday.toISOString().split('T')[0],
                    end: sunday.toISOString().split('T')[0],
                }
            })(),
            anual: {
                start: `${now.getFullYear()}-01-01`,
                end: `${now.getFullYear()}-12-31`,
            },
        }

        // Buscar gastos do período mais amplo (anual) para cobrir todos
        const { data: transacoes, error: txError } = await supabase
            .from('transactions')
            .select('categoria, valor, data')
            .eq('user_id', userId)
            .eq('tipo', 'saida')
            .gte('data', ranges.anual.start)
            .lte('data', ranges.anual.end)

        if (txError) return { success: false, error: txError.message }

        // Verificar cada meta
        const resultado = metas.map((meta) => {
            const range = ranges[meta.periodo] ?? ranges.mensal
            const gastos = (transacoes ?? [])
                .filter(t =>
                    t.categoria.toLowerCase() === meta.categoria.toLowerCase() &&
                    t.data >= range.start &&
                    t.data <= range.end
                )
                .reduce((sum, t) => sum + Number(t.valor), 0)

            const limite = Number(meta.valor_limite)
            const percentual = limite > 0 ? Math.round((gastos / limite) * 100) : 0

            return {
                id: meta.id,
                categoria: meta.categoria,
                periodo: meta.periodo,
                valorLimite: limite,
                gastoAtual: gastos,
                percentual,
                status: percentual >= 100 ? 'estourada' : percentual >= 80 ? 'alerta' : 'ok',
            }
        })

        return { success: true, metas: resultado }
    },
})

// ============================================================
// Notificacoes
// ============================================================

export const createNotificationTool = tool({
    description: 'Cria uma notificação in-app para o usuário. Use para alertas de metas, lembretes de contas, conquistas e avisos importantes.',
    inputSchema: z.object({
        type: z.enum(['meta_alert', 'meta_exceeded', 'bill_reminder', 'transaction', 'weekly_summary', 'achievement', 'system']).describe('Tipo da notificação'),
        title: z.string().describe('Título curto da notificação (ex: "Meta de Alimentação em alerta!")'),
        body: z.string().describe('Corpo da notificação com detalhes (ex: "Você já gastou 85% do limite de R$ 500")'),
        actionUrl: z.string().optional().describe('URL para navegar ao clicar (ex: /contas)'),
    }),
    execute: async ({ type, title, body, actionUrl }) => {
        const { supabase, userId } = await getUser()

        const { error } = await supabase
            .from('notifications')
            .insert([{
                user_id: userId,
                type,
                title,
                body,
                action_url: actionUrl,
            }])

        if (error) return { success: false, error: error.message }

        return { success: true, message: 'Notificação criada com sucesso.' }
    },
})
