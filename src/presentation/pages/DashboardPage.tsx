import { useState, useMemo } from 'react'
import { useAuth } from '@/presentation/context/AuthContext'
import { useBudgets } from '@/presentation/hooks/useBudgets'
import { useTransactions } from '@/presentation/hooks/useTransactions'
import { useCurrency } from '@/presentation/context/CurrencyContext'
import { Button } from '@/presentation/components/ui/button'

import { CreateBudgetDialog } from '@/presentation/components/CreateBudgetDialog'
import { EditBudgetDialog } from '@/presentation/components/EditBudgetDialog'
import { CreateTransactionDialog } from '@/presentation/components/CreateTransactionDialog'
import { BudgetList } from '@/presentation/components/BudgetList'
import { TransactionList } from '@/presentation/components/TransactionList'
import { AIInsightsDialog } from '@/presentation/components/AIInsightsDialog'
import { ExportReportDialog } from '@/presentation/components/ExportReportDialog'
import { SpendingChart } from '@/presentation/components/SpendingChart'
import { PlusCircle, TrendingUp, TrendingDown, Activity, Sparkles, Download } from 'lucide-react'
import type { Budget } from '@/domain/entities/Budget'


type DateFilter = 'ALL' | 'MTD' | 'YTD'
export function DashboardPage() {
    const { user } = useAuth()
    const { budgets } = useBudgets()
    const { transactions } = useTransactions()
    const { formatCurrency } = useCurrency()

    const [showBudgetDialog, setShowBudgetDialog] = useState(false)
    const [showTransactionDialog, setShowTransactionDialog] = useState(false)
    const [showAIDialog, setShowAIDialog] = useState(false)
    const [showExportDialog, setShowExportDialog] = useState(false)
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
    const [dateFilter, setDateFilter] = useState<DateFilter>('MTD')

    // Filter Logic
    const filteredTransactions = useMemo(() => {
        const now = new Date()
        return transactions.filter(t => {
            const tDate = new Date(t.date)
            if (dateFilter === 'ALL') return true
            if (dateFilter === 'MTD') {
                return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()
            }
            if (dateFilter === 'YTD') {
                return tDate.getFullYear() === now.getFullYear()
            }
            return true
        })
    }, [transactions, dateFilter])

    // Memoize expensive calculations
    const totalBudget = useMemo(() =>
        budgets.reduce((sum, b) => sum + b.amount, 0),
        [budgets]
    )

    const totalIncome = useMemo(() =>
        filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0),
        [filteredTransactions]
    )

    const totalExpenses = useMemo(() =>
        filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0),
        [filteredTransactions]
    )

    // Forecast Logic (Simple linear projection)
    const forecast = useMemo(() => {
        const now = new Date()
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const dayOfMonth = now.getDate()

        if (dateFilter === 'MTD' && dayOfMonth > 0) {
            const dailyAvg = totalExpenses / dayOfMonth
            return dailyAvg * daysInMonth
        }
        return 0
    }, [totalExpenses, dateFilter])

    return (
        <div className="space-y-8">
            {/* Quick Actions & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="axis-header">SYSTEM STATUS</div>
                    <h1 className="text-3xl font-bold tracking-tight">DASHBOARD</h1>
                    <p className="text-muted-foreground font-mono text-xs mt-1">OPERATOR: {user?.fullName || user?.email}</p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-1 bg-muted/50 border border-border/50 rounded-xl p-1.5 mr-2">
                        <Button
                            variant={dateFilter === 'MTD' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setDateFilter('MTD')}
                            className="text-xs h-7"
                        >
                            MTD
                        </Button>
                        <Button
                            variant={dateFilter === 'YTD' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setDateFilter('YTD')}
                            className="text-xs h-7"
                        >
                            YTD
                        </Button>
                        <Button
                            variant={dateFilter === 'ALL' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setDateFilter('ALL')}
                            className="text-xs h-7"
                        >
                            ALL
                        </Button>
                    </div>

                    <Button onClick={() => setShowExportDialog(true)} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        EXPORT
                    </Button>
                    <Button onClick={() => setShowTransactionDialog(true)}>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        ADD TRANSACTION
                    </Button>
                    <Button onClick={() => setShowBudgetDialog(true)} variant="outline">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        NEW BUDGET
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Budget (Static for now, usually monthly) */}
                <div className="kpi-card group">
                    <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div className="axis-header text-primary">TOTAL BUDGET (MONTHLY)</div>
                    <div className="text-3xl font-mono font-bold text-foreground tracking-tighter mt-3">
                        {formatCurrency(totalBudget)}
                    </div>
                    <div className="mt-5 h-1.5 w-full bg-border/30 overflow-hidden rounded-full">
                        <div className="h-full bg-primary w-full origin-left scale-x-100 transition-transform duration-1000 rounded-full" />
                    </div>
                </div>

                {/* Forecast / Spent */}
                <div className="kpi-card group">
                    <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Activity className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="axis-header text-secondary">
                        {dateFilter === 'MTD' ? 'FORECAST (EOM)' : 'TOTAL SPENT'}
                    </div>
                    <div className="text-3xl font-mono font-bold text-foreground tracking-tighter mt-3">
                        {formatCurrency(dateFilter === 'MTD' && forecast > 0 ? forecast : totalExpenses)}
                    </div>
                    <div className="mt-5 h-1.5 w-full bg-border/30 overflow-hidden rounded-full">
                        <div
                            className={`h-full ${totalExpenses > totalBudget ? 'bg-destructive' : 'bg-secondary'} transition-all duration-1000 rounded-full`}
                            style={{ width: `${Math.min((totalExpenses / (totalBudget || 1)) * 100, 100)}%` }}
                        />
                    </div>
                    {dateFilter === 'MTD' && (
                        <p className="text-[10px] font-mono text-muted-foreground mt-3 text-right">
                            CURRENT: {formatCurrency(totalExpenses)}
                        </p>
                    )}
                </div>

                {/* Income */}
                <div className="kpi-card group">
                    <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="axis-header text-emerald-500">INCOME ({dateFilter})</div>
                    <div className="text-3xl font-mono font-bold text-foreground tracking-tighter mt-3">
                        {formatCurrency(totalIncome)}
                    </div>
                    <div className="mt-5 flex items-center gap-2">
                        <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-mono text-emerald-500/70">ACTIVE</span>
                    </div>
                </div>

                {/* Expenses */}
                <div className="kpi-card group">
                    <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
                        <TrendingDown className="w-5 h-5 text-rose-500" />
                    </div>
                    <div className="axis-header text-rose-500">EXPENSES ({dateFilter})</div>
                    <div className="text-3xl font-mono font-bold text-foreground tracking-tighter mt-3">
                        {formatCurrency(totalExpenses)}
                    </div>
                    <div className="mt-5 flex items-center gap-2">
                        <div className="h-2 w-2 bg-rose-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-mono text-rose-500/70">TRACKING</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div>
                <SpendingChart budgets={budgets} />
            </div>

            {/* Budgets Section */}
            <div>
                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <span className="w-1 h-4 bg-primary inline-block" />
                        ACTIVE BUDGETS
                    </h2>
                </div>

                <BudgetList
                    onEdit={(b) => setEditingBudget(b)}
                    onAddNew={() => setShowBudgetDialog(true)}
                />
            </div>

            {/* Floating AI Assistant Button */}
            <Button
                onClick={() => setShowAIDialog(true)}
                className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 transition-all hover:scale-105"
                size="icon"
                aria-label="Open AI Budget Assistant"
            >
                <Sparkles className="w-6 h-6 text-white" />
                <span className="sr-only">AI Budget Assistant</span>
            </Button>

            {/* Recent Transactions */}
            <div>
                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <span className="w-1 h-4 bg-white inline-block" />
                        TRANSACTION LOG ({dateFilter})
                    </h2>
                    <Button onClick={() => setShowTransactionDialog(true)} variant="ghost" size="sm" className="text-xs font-mono text-muted-foreground hover:text-primary">
                        + ADD ENTRY
                    </Button>
                </div>

                <div className="axis-card p-4">
                    <TransactionList
                        initialTransactions={filteredTransactions}
                    />
                </div>
            </div>

            {/* Dialogs */}
            <CreateBudgetDialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog} />
            <EditBudgetDialog
                open={!!editingBudget}
                onOpenChange={(open) => !open && setEditingBudget(null)}
                budget={editingBudget}
            />
            <CreateTransactionDialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog} />
            <AIInsightsDialog open={showAIDialog} onOpenChange={setShowAIDialog} />
            <ExportReportDialog
                open={showExportDialog}
                onOpenChange={setShowExportDialog}
                budgets={budgets}
                transactions={transactions}
            />
        </div>
    )
}
