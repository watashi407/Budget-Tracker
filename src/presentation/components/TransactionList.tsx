import { useTransition } from 'react'
import { Trash2, ArrowUpRight, ArrowDownLeft, Receipt } from 'lucide-react'
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
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    if (displayTransactions.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed border-border rounded-lg bg-muted/30">
                <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No transactions found</p>
                <p className="text-xs text-muted-foreground mt-1">Add your first transaction to get started</p>
            </div>
        )
    }

    return (
        <div className="border border-border/50 rounded-lg bg-card/50 overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 p-3 border-b border-border/50 bg-muted/30 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-6 md:col-span-5">Description</div>
                <div className="col-span-3 md:col-span-2">Category</div>
                <div className="col-span-3 md:col-span-2 text-right">Date</div>
                <div className="col-span-3 md:col-span-2 text-right hidden md:block">Amount</div>
                <div className="col-span-1 text-center">Act</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border/30">
                {displayTransactions.map((transaction) => (
                    <div
                        key={transaction.id}
                        className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-muted/30 transition-colors group text-sm"
                    >
                        {/* Description */}
                        <div className="col-span-6 md:col-span-5 flex items-center gap-3 overflow-hidden">
                            <div className={`p-1.5 rounded-lg ${transaction.type === 'income'
                                ? 'bg-success/10 text-success'
                                : 'bg-destructive/10 text-destructive'
                                }`}>
                                {transaction.type === 'income' ? (
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                ) : (
                                    <ArrowDownLeft className="w-3.5 h-3.5" />
                                )}
                            </div>
                            <span className="truncate font-medium text-foreground group-hover:text-primary transition-colors">
                                {transaction.description}
                            </span>
                        </div>

                        {/* Category */}
                        <div className="col-span-3 md:col-span-2">
                            <span className="px-2 py-1 rounded-md bg-muted text-[10px] text-muted-foreground uppercase font-medium">
                                {transaction.category}
                            </span>
                        </div>

                        {/* Date */}
                        <div className="col-span-3 md:col-span-2 text-right text-muted-foreground text-xs">
                            {new Date(transaction.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: '2-digit',
                            })}
                        </div>

                        {/* Amount */}
                        <div className="col-span-3 md:col-span-2 text-right font-semibold md:block">
                            <span className={transaction.type === 'income' ? 'text-success' : 'text-destructive'}>
                                {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex justify-center">
                            <button
                                onClick={() => handleDelete(transaction.id, transaction.description)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
