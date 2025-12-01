import { useTransition } from 'react'
import { Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useTransactions } from '@/presentation/hooks/useTransactions'
import type { Transaction } from '@/domain/entities/Transaction'

interface TransactionListProps {
    budgetId?: string
    limit?: number
    initialTransactions?: Transaction[]
}

export function TransactionList({ budgetId, limit, initialTransactions }: TransactionListProps) {
    const { transactions: fetchedTransactions, deleteTransaction, loading } = useTransactions(budgetId)
    const [isPending, startTransition] = useTransition()

    const transactions = initialTransactions || fetchedTransactions

    function handleDelete(id: string, description: string) {
        if (confirm(`Are you sure you want to delete "${description}"?`)) {
            startTransition(async () => {
                try {
                    await deleteTransaction(id)
                } catch (error) {
                    console.error('Failed to delete transaction:', error)
                }
            })
        }
    }

    const displayTransactions = limit ? transactions.slice(0, limit) : transactions

    if (loading || isPending) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
        )
    }

    if (displayTransactions.length === 0) {
        return (
            <div className="text-center py-8 border border-dashed border-white/10 bg-black/20">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">NO DATA ENTRIES FOUND</p>
            </div>
        )
    }

    return (
        <div className="border border-white/10 bg-black/40">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 p-3 border-b border-white/10 bg-white/5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                <div className="col-span-6 md:col-span-5">DESCRIPTION</div>
                <div className="col-span-3 md:col-span-2">CATEGORY</div>
                <div className="col-span-3 md:col-span-2 text-right">DATE</div>
                <div className="col-span-3 md:col-span-2 text-right hidden md:block">AMOUNT</div>
                <div className="col-span-1 text-center">ACT</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/5">
                {displayTransactions.map((transaction) => (
                    <div
                        key={transaction.id}
                        className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-white/5 transition-colors group text-xs font-mono"
                    >
                        {/* Description */}
                        <div className="col-span-6 md:col-span-5 flex items-center gap-3 overflow-hidden">
                            <div className={`p-1 rounded-none border ${transaction.type === 'income'
                                ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                                : 'border-rose-500/30 text-rose-500 bg-rose-500/5'
                                }`}>
                                {transaction.type === 'income' ? (
                                    <ArrowUpRight className="w-3 h-3" />
                                ) : (
                                    <ArrowDownLeft className="w-3 h-3" />
                                )}
                            </div>
                            <span className="truncate font-medium text-white group-hover:text-primary transition-colors">
                                {transaction.description}
                            </span>
                        </div>

                        {/* Category */}
                        <div className="col-span-3 md:col-span-2">
                            <span className="px-1.5 py-0.5 border border-white/10 text-[10px] text-muted-foreground uppercase">
                                {transaction.category}
                            </span>
                        </div>

                        {/* Date */}
                        <div className="col-span-3 md:col-span-2 text-right text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: '2-digit',
                            })}
                        </div>

                        {/* Amount (Mobile combined) */}
                        <div className="col-span-3 md:col-span-2 text-right font-bold md:block">
                            <span className={transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}>
                                {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex justify-center">
                            <button
                                onClick={() => handleDelete(transaction.id, transaction.description)}
                                className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
