import { useTransition, useState, useMemo } from 'react'
import { Trash2, ArrowUpRight, ArrowDownLeft, Receipt, Lock, Unlock, Edit, Search, Calendar as CalendarIcon } from 'lucide-react'
import { useTransactions } from '@/presentation/hooks/useTransactions'
import { useCurrency } from '@/presentation/context/CurrencyContext'
import type { Transaction } from '@/domain/entities/Transaction'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { EditTransactionDialog } from '@/presentation/components/EditTransactionDialog'
import { useBudgets } from '@/presentation/hooks/useBudgets'

interface TransactionListProps {
    budgetId?: string
    limit?: number
    initialTransactions?: Transaction[]
}

export function TransactionList({ budgetId, limit, initialTransactions }: TransactionListProps) {
    const { transactions: fetchedTransactions, deleteTransaction, updateTransaction, loading } = useTransactions(budgetId)
    const { budgets } = useBudgets()
    const { formatCurrency } = useCurrency()
    const [isPending, startTransition] = useTransition()
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

    // Search States
    const [searchText, setSearchText] = useState('')
    const [searchDate, setSearchDate] = useState('')

    const transactions = initialTransactions || fetchedTransactions

    // Filter Logic
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            // Text Search (Description, Category, Budget Name)
            const searchLower = searchText.toLowerCase()
            const budgetName = budgets.find(b => b.id === t.budgetId)?.name.toLowerCase() || ''
            const matchesText =
                t.description.toLowerCase().includes(searchLower) ||
                t.category.toLowerCase().includes(searchLower) ||
                budgetName.includes(searchLower)

            if (!matchesText) return false

            // Date Search
            if (searchDate) {
                const tDate = new Date(t.date).toISOString().split('T')[0]
                if (tDate !== searchDate) return false
            }

            return true
        })
    }, [transactions, searchText, searchDate, budgets])

    const displayTransactions = limit ? filteredTransactions.slice(0, limit) : filteredTransactions

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

    function handleLockToggle(transaction: Transaction) {
        startTransition(async () => {
            try {
                await updateTransaction(transaction.id, { isLocked: !transaction.isLocked })
            } catch (error) {
                console.error('Failed to update transaction lock:', error)
            }
        })
    }

    if (loading && !initialTransactions) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Search Controls can be placed here or passed as props if strict UI control is needed. 
                For now, placing them inside for self-containment if no limit is set (i.e. full list view) 
                or if the user wants to search even in dashboard widgets.
            */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search transactions, categories, budgets..."
                        className="pl-9"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
                <div className="relative w-full sm:w-auto">
                    <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="date"
                        className="pl-9 w-full sm:w-[150px]"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                    />
                </div>
            </div>

            {displayTransactions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-lg bg-muted/30">
                    <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No transactions found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or add a new one.</p>
                </div>
            ) : (
                <div className="border border-border/50 rounded-lg bg-card/50 overflow-hidden">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 p-3 border-b border-border/50 bg-muted/30 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="col-span-1 text-center">Lock</div>
                        <div className="col-span-5 md:col-span-4">Description</div>
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
                                className={`grid grid-cols-12 gap-4 p-3 items-center hover:bg-muted/30 transition-colors group text-sm ${transaction.isLocked ? 'opacity-75 bg-muted/10' : ''}`}
                            >
                                {/* Lock Status */}
                                <div className="col-span-1 flex justify-center">
                                    <button
                                        onClick={() => handleLockToggle(transaction)}
                                        className={`p-1 rounded-md transition-colors ${transaction.isLocked ? 'text-primary' : 'text-muted-foreground hover:text-primary opacity-50 hover:opacity-100'}`}
                                        title={transaction.isLocked ? "Unlock Transaction" : "Lock Transaction"}
                                        disabled={isPending}
                                    >
                                        {transaction.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                    </button>
                                </div>

                                {/* Description */}
                                <div className="col-span-5 md:col-span-4 flex items-center gap-3 overflow-hidden">
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
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate font-medium text-foreground group-hover:text-primary transition-colors">
                                            {transaction.description}
                                        </span>
                                        {transaction.budgetId && (
                                            <span className="text-[10px] text-muted-foreground truncate">
                                                {budgets.find(b => b.id === transaction.budgetId)?.name}
                                            </span>
                                        )}
                                    </div>
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
                                <div className="col-span-3 md:col-span-2 text-right font-semibold md:block hidden">
                                    <span className={transaction.type === 'income' ? 'text-success' : 'text-destructive'}>
                                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 flex justify-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                                        onClick={() => setEditingTransaction(transaction)}
                                        disabled={transaction.isLocked || isPending}
                                        title={transaction.isLocked ? "Transaction is locked" : "Edit"}
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(transaction.id, transaction.description)}
                                        disabled={transaction.isLocked || isPending}
                                        title={transaction.isLocked ? "Transaction is locked" : "Delete"}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <EditTransactionDialog
                open={!!editingTransaction}
                onOpenChange={(open) => !open && setEditingTransaction(null)}
                transaction={editingTransaction}
            />
        </div>
    )
}
