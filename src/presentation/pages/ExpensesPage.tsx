import { useState, useMemo } from 'react'
import { useTransactions } from '@/presentation/hooks/useTransactions'
import { useBudgets } from '@/presentation/hooks/useBudgets'
import { useCurrency } from '@/presentation/context/CurrencyContext'
import { Button } from '@/presentation/components/ui/button'
import { CreateTransactionDialog } from '@/presentation/components/CreateTransactionDialog'
import { ExportReportDialog } from '@/presentation/components/ExportReportDialog'
import { TransactionList } from '@/presentation/components/TransactionList'
import { PlusCircle, Receipt, ArrowUpRight, ArrowDownLeft, List, Download } from 'lucide-react'

type TypeFilter = 'all' | 'income' | 'expense'

export function ExpensesPage() {
    const { transactions } = useTransactions()
    const { budgets } = useBudgets()
    const { formatCurrency } = useCurrency()
    const [showTransactionDialog, setShowTransactionDialog] = useState(false)
    const [showExportDialog, setShowExportDialog] = useState(false)
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

    // Filter transactions by type
    const filteredTransactions = useMemo(() => {
        if (typeFilter === 'all') return transactions
        return transactions.filter(t => t.type === typeFilter)
    }, [transactions, typeFilter])

    // Calculate summaries
    const totalIncome = useMemo(() =>
        transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        [transactions]
    )

    const totalExpenses = useMemo(() =>
        transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        [transactions]
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="axis-header">TRANSACTION MANAGEMENT</div>
                    <h1 className="text-3xl font-bold tracking-tight">EXPENSES & INCOME</h1>
                    <p className="text-muted-foreground font-mono text-xs mt-1">
                        {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} recorded
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <Button
                        onClick={() => setShowExportDialog(true)}
                        variant="outline"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        EXPORT
                    </Button>
                    <Button
                        onClick={() => setShowTransactionDialog(true)}
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        ADD TRANSACTION
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="axis-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10">
                            <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground uppercase font-mono">Total Income</div>
                            <div className="text-xl font-bold text-emerald-500">{formatCurrency(totalIncome)}</div>
                        </div>
                    </div>
                </div>
                <div className="axis-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-500/10">
                            <ArrowDownLeft className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground uppercase font-mono">Total Expenses</div>
                            <div className="text-xl font-bold text-rose-500">{formatCurrency(totalExpenses)}</div>
                        </div>
                    </div>
                </div>
                <div className="axis-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Receipt className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground uppercase font-mono">Net Balance</div>
                            <div className={`text-xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {formatCurrency(totalIncome - totalExpenses)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground mr-2">Filter:</span>
                <div className="flex items-center gap-1 bg-muted/50 border border-border/50 rounded-xl p-1.5">
                    <Button
                        variant={typeFilter === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setTypeFilter('all')}
                        className="text-xs h-8 gap-1.5 px-3"
                    >
                        <List className="w-3.5 h-3.5" />
                        All
                    </Button>
                    <Button
                        variant={typeFilter === 'income' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setTypeFilter('income')}
                        className="text-xs h-8 gap-1.5 px-3"
                    >
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                        Income
                    </Button>
                    <Button
                        variant={typeFilter === 'expense' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setTypeFilter('expense')}
                        className="text-xs h-8 gap-1.5 px-3"
                    >
                        <ArrowDownLeft className="w-3.5 h-3.5 text-rose-500" />
                        Expenses
                    </Button>
                </div>
                <span className="text-sm text-muted-foreground ml-auto">
                    {filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Transaction List with built-in search */}
            <div className="axis-card p-4">
                <TransactionList initialTransactions={filteredTransactions} />
            </div>

            {/* Dialogs */}
            <CreateTransactionDialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog} />
            <ExportReportDialog
                open={showExportDialog}
                onOpenChange={setShowExportDialog}
                budgets={budgets}
                transactions={transactions}
            />
        </div>
    )
}
