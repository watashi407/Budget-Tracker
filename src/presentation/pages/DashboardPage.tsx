import { useState, useMemo } from 'react'
import { useAuth } from '@/presentation/context/AuthContext'
import { useBudgets } from '@/presentation/hooks/useBudgets'
import { useTransactions } from '@/presentation/hooks/useTransactions'
import { useCurrency } from '@/presentation/context/CurrencyContext'
import { useTimezone } from '@/presentation/context/TimezoneContext'
import { useGlobalActions } from '@/presentation/context/GlobalActionsContext'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'

import { EditBudgetDialog } from '@/presentation/components/EditBudgetDialog'
import { BudgetList } from '@/presentation/components/BudgetList'
import { TransactionList } from '@/presentation/components/TransactionList'
import { ExportReportDialog } from '@/presentation/components/ExportReportDialog'
import { SpendingChart } from '@/presentation/components/SpendingChart'
import { PlusCircle, TrendingUp, TrendingDown, Activity, Download, Calendar } from 'lucide-react'
import type { Budget } from '@/domain/entities/Budget'


export function DashboardPage() {
    const { user } = useAuth()
    const { budgets } = useBudgets()
    const { transactions } = useTransactions()
    const { formatCurrency } = useCurrency()
    const { parseDate } = useTimezone()
    const { openTransactionDialog, openBudgetDialog } = useGlobalActions()

    const [showExportDialog, setShowExportDialog] = useState(false)
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

    // Date range filter state - default to last 30 days
    const getDefaultFromDate = () => {
        const date = new Date()
        date.setDate(date.getDate() - 30)
        return date.toISOString().split('T')[0]
    }
    const getDefaultToDate = () => new Date().toISOString().split('T')[0]

    const [dateFrom, setDateFrom] = useState(getDefaultFromDate())
    const [dateTo, setDateTo] = useState(getDefaultToDate())

    // Filter Logic - using timezone context for date parsing
    const filteredTransactions = useMemo(() => {
        const fromDate = dateFrom ? parseDate(dateFrom) : null
        const toDate = dateTo ? parseDate(dateTo) : null

        // Set toDate to end of day for inclusive comparison
        if (toDate) {
            toDate.setHours(23, 59, 59, 999)
        }

        return transactions.filter(t => {
            const tDate = parseDate(t.date)

            // If no date range set, show all
            if (!fromDate && !toDate) return true

            // Check from date
            if (fromDate && tDate < fromDate) return false

            // Check to date
            if (toDate && tDate > toDate) return false

            return true
        })
    }, [transactions, dateFrom, dateTo, parseDate])

    // Quick filter presets
    const setPreset = (preset: 'today' | 'week' | 'month' | 'all') => {
        const today = new Date()
        switch (preset) {
            case 'today':
                setDateFrom(today.toISOString().split('T')[0])
                setDateTo(today.toISOString().split('T')[0])
                break
            case 'week':
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                setDateFrom(weekAgo.toISOString().split('T')[0])
                setDateTo(today.toISOString().split('T')[0])
                break
            case 'month':
                const monthAgo = new Date()
                monthAgo.setDate(monthAgo.getDate() - 30)
                setDateFrom(monthAgo.toISOString().split('T')[0])
                setDateTo(today.toISOString().split('T')[0])
                break
            case 'all':
                setDateFrom('')
                setDateTo('')
                break
        }
    }

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

    // Forecast Logic (Simple linear projection) - only works for month view
    const forecast = useMemo(() => {
        const now = new Date()
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const dayOfMonth = now.getDate()

        // Only show forecast if viewing roughly current month
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const isMonthView = dateFrom && new Date(dateFrom) >= thirtyDaysAgo

        if (isMonthView && dayOfMonth > 0) {
            const dailyAvg = totalExpenses / dayOfMonth
            return dailyAvg * daysInMonth
        }
        return 0
    }, [totalExpenses, dateFrom])

    return (
        <div className="space-y-8">
            {/* Quick Actions & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="dashboard-header">
                <div>
                    <div className="axis-header">SYSTEM STATUS</div>
                    <h1 className="text-3xl font-bold tracking-tight">DASHBOARD</h1>
                    <p className="text-muted-foreground font-mono text-xs mt-1">OPERATOR: {user?.fullName || user?.email}</p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    {/* Date Range Picker */}
                    <div className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-xl p-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-[130px] h-7 text-xs bg-transparent border-0 p-0 focus-visible:ring-0"
                            title="From date"
                        />
                        <span className="text-muted-foreground text-xs">to</span>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-[130px] h-7 text-xs bg-transparent border-0 p-0 focus-visible:ring-0"
                            title="To date"
                        />
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1 bg-muted/50 border border-border/50 rounded-xl p-1">
                        <Button variant="ghost" size="sm" onClick={() => setPreset('today')} className="text-xs h-7 px-2">
                            Today
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setPreset('week')} className="text-xs h-7 px-2">
                            Week
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setPreset('month')} className="text-xs h-7 px-2">
                            Month
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setPreset('all')} className="text-xs h-7 px-2">
                            All
                        </Button>
                    </div>

                    <Button onClick={() => setShowExportDialog(true)} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        EXPORT
                    </Button>
                    <Button onClick={openTransactionDialog} id="btn-add-transaction">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        ADD TRANSACTION
                    </Button>
                    <Button onClick={openBudgetDialog} variant="outline" id="btn-new-budget">
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
                        {forecast > 0 ? 'FORECAST (EOM)' : 'TOTAL SPENT'}
                    </div>
                    <div className="text-3xl font-mono font-bold text-foreground tracking-tighter mt-3">
                        {formatCurrency(forecast > 0 ? forecast : totalExpenses)}
                    </div>
                    <div className="mt-5 h-1.5 w-full bg-border/30 overflow-hidden rounded-full">
                        <div
                            className={`h-full ${totalExpenses > totalBudget ? 'bg-destructive' : 'bg-secondary'} transition-all duration-1000 rounded-full`}
                            style={{ width: `${Math.min((totalExpenses / (totalBudget || 1)) * 100, 100)}%` }}
                        />
                    </div>
                    {forecast > 0 && (
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
                    <div className="axis-header text-emerald-500">INCOME</div>
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
                    <div className="axis-header text-rose-500">EXPENSES</div>
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
                    onAddNew={openBudgetDialog}
                />
            </div>

            {/* Recent Transactions */}
            <div>
                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <span className="w-1 h-4 bg-white inline-block" />
                        TRANSACTION LOG ({filteredTransactions.length} entries)
                    </h2>
                    <Button onClick={openTransactionDialog} variant="ghost" size="sm" className="text-xs font-mono text-muted-foreground hover:text-primary">
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
            <EditBudgetDialog
                open={!!editingBudget}
                onOpenChange={(open) => !open && setEditingBudget(null)}
                budget={editingBudget}
            />
            <ExportReportDialog
                open={showExportDialog}
                onOpenChange={setShowExportDialog}
                budgets={budgets}
                transactions={transactions}
            />
        </div>
    )
}
