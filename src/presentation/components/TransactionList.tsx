import { useTransition, useState, useMemo } from 'react'
import { Receipt, Search, Calendar as CalendarIcon, Mail } from 'lucide-react'
import { useTransactions } from '@/presentation/hooks/useTransactions'
import { useCurrency } from '@/presentation/context/CurrencyContext'
import { useAuth } from '@/presentation/context/AuthContext'
import type { Transaction } from '@/domain/entities/Transaction'

import { DeleteConfirmDialog } from '@/presentation/components/DeleteConfirmDialog'
import { TransactionAttachmentsDialog } from '@/presentation/components/TransactionAttachmentsDialog'
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

import { PAGINATION } from '@/constants/ui'
import { PaginationControls } from '@/presentation/components/shared/PaginationControls'
import { Input } from '@/presentation/components/ui/input'
import { EditTransactionDialog } from '@/presentation/components/EditTransactionDialog'
import { TransactionRow } from '@/presentation/components/TransactionRow'

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
    const [attachmentTransaction, setAttachmentTransaction] = useState<Transaction | null>(null)

    const isEmailVerified = user?.emailVerified

    // Search States
    const [searchText, setSearchText] = useState('')
    const [searchDate, setSearchDate] = useState('')

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(PAGINATION.DEFAULT_ITEMS_PER_PAGE)

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
                            <TransactionRow
                                key={transaction.id}
                                transaction={transaction}
                                onLockToggle={handleLockToggle}
                                onEdit={setEditingTransaction}
                                onDelete={handleDeleteClick}
                                onAttachments={setAttachmentTransaction}
                                isPending={isPending}
                                formatCurrency={formatCurrency}
                                budgetName={transaction.budgetId ? budgets.find(b => b.id === transaction.budgetId)?.name : undefined}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Pagination Controls */}
            {showPagination && !limit && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredTransactions.length}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                />
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

            <TransactionAttachmentsDialog
                open={!!attachmentTransaction}
                onOpenChange={(open) => !open && setAttachmentTransaction(null)}
                transaction={attachmentTransaction}
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
