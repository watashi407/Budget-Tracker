import React, { useTransition } from 'react'
import { Link } from '@tanstack/react-router'
import type { Budget } from '@/domain/entities/Budget'

import { Badge } from '@/presentation/components/ui/badge'
import { Button } from '@/presentation/components/ui/button'
import { Trash2, Edit, TrendingUp, TrendingDown } from 'lucide-react'
import { useBudgets } from '@/presentation/hooks/useBudgets'
import { useCurrency } from '@/presentation/context/CurrencyContext'

interface BudgetCardProps {
    budget: Budget
    onEdit?: (budget: Budget) => void
}

export const BudgetCard = React.memo(function BudgetCard({ budget, onEdit }: BudgetCardProps) {
    const { deleteBudget } = useBudgets()
    const { formatCurrency } = useCurrency()
    const [, startTransition] = useTransition()

    const progress = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0
    const isOverBudget = progress > 100
    const remaining = budget.amount - budget.spent

    function handleDelete() {
        if (confirm(`Are you sure you want to delete "${budget.name}"?`)) {
            startTransition(async () => {
                try {
                    await deleteBudget(budget.id)
                } catch (error) {
                    console.error('Failed to delete budget:', error)
                }
            })
        }
    }

    return (
        <div className="group relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300">
            {/* Gradient accent on hover */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-orange-500 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />

            <Link
                to="/budgets/$budgetId"
                params={{ budgetId: budget.id }}
                className="block p-5 space-y-4"
            >
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                            {budget.category}
                        </p>
                        <h3 className="text-lg font-bold tracking-tight text-foreground">{budget.name}</h3>
                    </div>
                    <Badge
                        variant={isOverBudget ? "destructive" : "outline"}
                        className="font-mono text-[10px] uppercase"
                    >
                        {budget.period}
                    </Badge>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <div className="space-y-0.5">
                            <span className="text-2xl font-bold text-foreground">{formatCurrency(budget.spent)}</span>
                            <span className="text-sm text-muted-foreground ml-2">/ {formatCurrency(budget.amount)}</span>
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-bold ${isOverBudget ? 'text-destructive' : 'text-primary'}`}>
                            {isOverBudget ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                            {progress.toFixed(1)}%
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isOverBudget
                                ? 'bg-gradient-to-r from-destructive to-red-400'
                                : 'bg-gradient-to-r from-primary to-orange-400'
                                }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span className={remaining < 0 ? 'text-destructive font-medium' : ''}>
                            {remaining >= 0 ? `${formatCurrency(remaining)} remaining` : `${formatCurrency(Math.abs(remaining))} over budget`}
                        </span>
                        <span className={`font-medium ${isOverBudget ? 'text-destructive' : 'text-success'}`}>
                            {isOverBudget ? 'Over Budget' : 'On Track'}
                        </span>
                    </div>
                </div>
            </Link>

            <div className="px-5 pb-5 flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                    onClick={(e) => {
                        e.preventDefault()
                        onEdit?.(budget)
                    }}
                >
                    <Edit className="w-3.5 h-3.5 mr-2" />
                    Configure
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                    onClick={(e) => {
                        e.preventDefault()
                        handleDelete()
                    }}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    )
})
