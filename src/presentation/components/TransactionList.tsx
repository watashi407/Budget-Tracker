import { useTransition, useState, useMemo } from 'react'
import { Trash2, ArrowUpRight, ArrowDownLeft, Receipt, Lock, Unlock, Edit, Search, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTransactions } from '@/presentation/hooks/useTransactions'
import { useCurrency } from '@/presentation/context/CurrencyContext'
import { useAuth } from '@/presentation/context/AuthContext'
import type { Transaction } from '@/domain/entities/Transaction'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import { EditTransactionDialog } from '@/presentation/components/EditTransactionDialog'
import { DeleteConfirmDialog } from '@/presentation/components/DeleteConfirmDialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/presentation/components/ui/alert-dialog'
import { useBudgets } from '@/presentation/hooks/useBudgets'
import { Mail } from 'lucide-react'

interface TransactionListProps {
    budgetId?: string
    limit?: number
    initialTransactions?: Transaction[]
    showPagination?: boolean
}

export function TransactionList({ budgetId, limit, initialTransactions, showPagination = true }: TransactionListProps) {
    const { user } = useAuth()
    const { transactions: fetchedTransactions, deleteTransaction, updateTransaction, loading } = useTransactions(budgetId)
    const { budgets } = useBudgets()
    const { formatCurrency } = useCurrency()
    const [isPending, startTransition] = useTransition()
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; description: string } | null>(null)
    const [showVerificationDialog, setShowVerificationDialog] = useState(false)

    const isEmailVerified = user?.emailVerified

    // Search States
    const [searchText, setSearchText] = useState('')
    const [searchDate, setSearchDate] = useState('')

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(5)

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

    // Pagination Logic
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage

    // Apply limit if provided (for dashboard), otherwise use pagination
    const displayTransactions = limit
        ? filteredTransactions.slice(0, limit)
        : filteredTransactions.slice(startIndex, endIndex)

    // Reset to page 1 when filters change
    useMemo(() => {
        setCurrentPage(1)
    }, [searchText, searchDate, itemsPerPage])

    function handleDeleteClick(id: string, description: string) {
        if (!isEmailVerified) {
            setShowVerificationDialog(true)
            return
        }
        setDeleteTarget({ id, description })
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return
        startTransition(async () => {
            try {
                await deleteTransaction(deleteTarget.id)
                setDeleteTarget(null)
            } catch {
                // Error handled by mutation
            }
        })
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
                <div className="border border-border/50 rounded-xl bg-card/50 overflow-hidden">
                    {/* Header Row - Hidden on mobile for cleaner look */}
                    <div className="hidden sm:grid grid-cols-12 gap-2 md:gap-4 p-3 border-b border-border/50 bg-muted/30 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="col-span-1 text-center">Lock</div>
                        <div className="col-span-4 md:col-span-3">Description</div>
                        <div className="col-span-2 hidden md:block">Category</div>
                        <div className="col-span-2 text-right">Date</div>
                        <div className="col-span-2 text-right">Amount</div>
                        <div className="col-span-1 text-center">Act</div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-border/30">
                        {displayTransactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className={`flex flex-col sm:grid sm:grid-cols-12 gap-2 md:gap-4 p-3 sm:items-center hover:bg-muted/30 transition-colors group text-xs ${transaction.isLocked ? 'opacity-75 bg-muted/10' : ''}`}
                            >
                                {/* Mobile: Top Row with Icon, Description, Amount */}
                                <div className="flex items-center justify-between sm:hidden">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className={`p-1.5 rounded-lg shrink-0 ${transaction.type === 'income'
                                            ? 'bg-success/10 text-success'
                                            : 'bg-destructive/10 text-destructive'
                                            }`}>
                                            {transaction.type === 'income' ? (
                                                <ArrowUpRight className="w-4 h-4" />
                                            ) : (
                                                <ArrowDownLeft className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="truncate font-medium text-foreground">
                                                {transaction.description}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {transaction.category}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`font-semibold shrink-0 ${transaction.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                    </span>
                                </div>

                                {/* Mobile: Bottom Row with Date and Actions */}
                                <div className="flex items-center justify-between sm:hidden pl-8">
                                    <span className="text-[10px] text-muted-foreground">
                                        {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleLockToggle(transaction)}
                                            className={`p-1.5 rounded-lg ${transaction.isLocked ? 'text-primary' : 'text-muted-foreground'}`}
                                            disabled={isPending}
                                        >
                                            {transaction.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                        </button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTransaction(transaction)} disabled={transaction.isLocked || isPending}>
                                            <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClick(transaction.id, transaction.description)} disabled={transaction.isLocked || isPending}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Desktop: Lock Status */}
                                <div className="hidden sm:flex col-span-1 justify-center">
                                    <button
                                        onClick={() => handleLockToggle(transaction)}
                                        className={`p-1.5 rounded-lg transition-colors ${transaction.isLocked ? 'text-primary' : 'text-muted-foreground hover:text-primary opacity-50 hover:opacity-100'}`}
                                        title={transaction.isLocked ? "Unlock Transaction" : "Lock Transaction"}
                                        disabled={isPending}
                                    >
                                        {transaction.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                    </button>
                                </div>

                                {/* Desktop: Description */}
                                <div className="hidden sm:flex col-span-4 md:col-span-3 items-center gap-2 overflow-hidden">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${transaction.type === 'income'
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

                                {/* Desktop: Category */}
                                <div className="hidden md:block col-span-2">
                                    <span className="px-2 py-1 rounded-lg bg-muted text-[10px] text-muted-foreground uppercase font-medium">
                                        {transaction.category}
                                    </span>
                                </div>

                                {/* Desktop: Date */}
                                <div className="hidden sm:block col-span-2 text-right text-muted-foreground">
                                    {new Date(transaction.date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: '2-digit',
                                    })}
                                </div>

                                {/* Desktop: Amount */}
                                <div className="hidden sm:block col-span-2 text-right font-semibold">
                                    <span className={transaction.type === 'income' ? 'text-success' : 'text-destructive'}>
                                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                    </span>
                                </div>

                                {/* Desktop: Actions */}
                                <div className="hidden sm:flex col-span-1 justify-center gap-1">
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
                                        onClick={() => handleDeleteClick(transaction.id, transaction.description)}
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

            {/* Pagination Controls */}
            {showPagination && !limit && filteredTransactions.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Show</span>
                        <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(value) => setItemsPerPage(Number(value))}
                        >
                            <SelectTrigger className="w-16 h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="6">6</SelectItem>
                                <SelectItem value="7">7</SelectItem>
                                <SelectItem value="8">8</SelectItem>
                            </SelectContent>
                        </Select>
                        <span>per page</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground mr-2">
                            {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum: number
                                if (totalPages <= 5) {
                                    pageNum = i + 1
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i
                                } else {
                                    pageNum = currentPage - 2 + i
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? 'default' : 'ghost'}
                                        size="icon"
                                        className="h-8 w-8 text-xs"
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                )
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            <EditTransactionDialog
                open={!!editingTransaction}
                onOpenChange={(open) => !open && setEditingTransaction(null)}
                transaction={editingTransaction}
            />

            <DeleteConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title={`Delete "${deleteTarget?.description}"?`}
                description="This will permanently delete this transaction. This action cannot be undone."
                isPending={isPending}
            />

            <AlertDialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                            <Mail className="w-8 h-8 text-amber-500" />
                        </div>
                        <AlertDialogTitle className="text-center">Email Verification Required</AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                            Please verify your email address before deleting transactions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="justify-center">
                        <AlertDialogAction>Close</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
