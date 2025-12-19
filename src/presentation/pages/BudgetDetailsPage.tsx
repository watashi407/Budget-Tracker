import { useParams, Link } from '@tanstack/react-router'
import { useBudget } from '@/presentation/hooks/useBudgets'
import { TransactionList } from '@/presentation/components/TransactionList'
import { Button } from '@/presentation/components/ui/button'
import { ArrowLeft, Wallet, Calendar, TrendingUp, PlusCircle } from 'lucide-react'
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
    const isOverBudget = budget.spent > budget.amount
    const remaining = budget.amount - budget.spent

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors w-fit">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>

                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div
                                className="h-12 w-12 rounded-xl flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: `${budget.color || 'hsl(var(--primary))'}20`, color: budget.color || 'hsl(var(--primary))' }}
                            >
                                <Wallet className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">{budget.name}</h1>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-primary" />
                                        {budget.category}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button onClick={() => setShowTransactionDialog(true)} className="gap-2">
                        <PlusCircle className="w-4 h-4" />
                        Add Transaction
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="p-6 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Budget</p>
                    <p className="text-2xl font-bold mt-2 text-foreground">${budget.amount.toFixed(2)}</p>
                </div>
                <div className="p-6 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spent</p>
                    <p className={`text-2xl font-bold mt-2 ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
                        ${budget.spent.toFixed(2)}
                    </p>
                    <div className="mt-3 h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${percentSpent}%` }}
                        />
                    </div>
                </div>
                <div className="p-6 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Remaining</p>
                    <p className={`text-2xl font-bold mt-2 ${remaining < 0 ? 'text-destructive' : 'text-success'}`}>
                        ${remaining.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Transactions */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Transaction History
                </h2>
                <TransactionList budgetId={budget.id} />
            </div>

            <CreateTransactionDialog
                open={showTransactionDialog}
                onOpenChange={setShowTransactionDialog}
                defaultBudgetId={budget.id}
            />
        </div>
    )
}
