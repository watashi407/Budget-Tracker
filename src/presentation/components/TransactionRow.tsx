import { Trash2, ArrowUpRight, ArrowDownLeft, Lock, Unlock, Edit, Paperclip } from 'lucide-react'
import type { Transaction } from '@/domain/entities/Transaction'
import { Button } from '@/presentation/components/ui/button'

interface TransactionRowProps {
    transaction: Transaction
    onLockToggle: (transaction: Transaction) => void
    onEdit: (transaction: Transaction) => void
    onDelete: (id: string, description: string) => void
    onAttachments: (transaction: Transaction) => void
    isPending: boolean
    formatCurrency: (amount: number) => string
    budgetName?: string
}

export function TransactionRow({
    transaction,
    onLockToggle,
    onEdit,
    onDelete,
    onAttachments,
    isPending,
    formatCurrency,
    budgetName,
}: TransactionRowProps) {
    return (
        <div
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
                        onClick={() => onLockToggle(transaction)}
                        className={`p-1.5 rounded-lg ${transaction.isLocked ? 'text-primary' : 'text-muted-foreground'}`}
                        disabled={isPending}
                    >
                        {transaction.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => onAttachments(transaction)} title="Attachments">
                        <Paperclip className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(transaction)} disabled={transaction.isLocked || isPending}>
                        <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(transaction.id, transaction.description)} disabled={transaction.isLocked || isPending}>
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* Desktop: Lock Status */}
            <div className="hidden sm:flex col-span-1 justify-center">
                <button
                    onClick={() => onLockToggle(transaction)}
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
                    {budgetName && (
                        <span className="text-[10px] text-muted-foreground truncate">
                            {budgetName}
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
            <div className="hidden sm:flex col-span-1 justify-center gap-0.5">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => onAttachments(transaction)}
                    title="Attachments"
                >
                    <Paperclip className="w-3.5 h-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => onEdit(transaction)}
                    disabled={transaction.isLocked || isPending}
                    title={transaction.isLocked ? "Transaction is locked" : "Edit"}
                >
                    <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(transaction.id, transaction.description)}
                    disabled={transaction.isLocked || isPending}
                    title={transaction.isLocked ? "Transaction is locked" : "Delete"}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    )
}
