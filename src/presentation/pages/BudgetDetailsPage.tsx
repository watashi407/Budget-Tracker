import { useParams, Link } from '@tanstack/react-router'
import { useBudget } from '@/presentation/hooks/useBudgets'
import { TransactionList } from '@/presentation/components/TransactionList'
import { Button } from '@/presentation/components/ui/button'
import { ArrowLeft, Wallet, Calendar, TrendingUp } from 'lucide-react'
import { CreateTransactionDialog } from '@/presentation/components/CreateTransactionDialog'
import { useState } from 'react'

export function BudgetDetailsPage() {
    const { budgetId } = useParams({ from: '/budgets/$budgetId' })
    const { data: budget, isLoading, error } = useBudget(budgetId)
    const [showTransactionDialog, setShowTransactionDialog] = useState(false)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    if (error || !budget) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <h2 className="text-xl font-bold text-destructive">Budget Not Found</h2>
                <Link to="/">
                    <Button variant="outline">Return to Dashboard</Button>
                </Link>
            </div>
        )
    }

    const percentSpent = Math.min((budget.spent / budget.amount) * 100, 100)

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors w-fit">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    BACK TO DASHBOARD
                </Link>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div
                                className="h-10 w-10 rounded-lg flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: `${budget.color}20`, color: budget.color }}
                            >
                                <Wallet className="w-5 h-5" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">{budget.name}</h1>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-primary/50" />
                                {budget.category}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {budget.period.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <Button onClick={() => setShowTransactionDialog(true)}>
                        ADD TRANSACTION
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="axis-card p-6">
                    <div className="axis-header text-muted-foreground">TOTAL BUDGET</div>
                    <div className="text-2xl font-mono font-bold mt-2">${budget.amount.toFixed(2)}</div>
                </div>
                <div className="axis-card p-6">
                    <div className="axis-header text-muted-foreground">SPENT</div>
                    <div className="text-2xl font-mono font-bold mt-2 text-rose-500">${budget.spent.toFixed(2)}</div>
                    <div className="mt-3 h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-rose-500 transition-all duration-1000"
                            style={{ width: `${percentSpent}%` }}
                        />
                    </div>
                </div>
                <div className="axis-card p-6">
                    <div className="axis-header text-muted-foreground">REMAINING</div>
                    <div className="text-2xl font-mono font-bold mt-2 text-emerald-500">
                        ${(budget.amount - budget.spent).toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Transactions */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    TRANSACTION HISTORY
                </h2>
                <div className="axis-card p-0">
                    <TransactionList budgetId={budget.id} />
                </div>
            </div>

            <CreateTransactionDialog
                open={showTransactionDialog}
                onOpenChange={setShowTransactionDialog}
                defaultBudgetId={budget.id}
            />
        </div>
    )
}
