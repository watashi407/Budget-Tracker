import { useTransition } from 'react'
import type { Budget } from '@/domain/entities/Budget'

import { Badge } from '@/presentation/components/ui/badge'
import { Button } from '@/presentation/components/ui/button'
import { Trash2, Edit } from 'lucide-react'
import { useBudgets } from '@/presentation/hooks/useBudgets'

interface BudgetCardProps {
    budget: Budget
    onEdit?: (budget: Budget) => void
}

export function BudgetCard({ budget, onEdit }: BudgetCardProps) {
    const { deleteBudget } = useBudgets()
    const [, startTransition] = useTransition()

    const progress = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0
    const isOverBudget = progress > 100

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
        <div className="axis-card group hover:border-primary/50 transition-colors duration-300">
            {/* Tech Decoration */}
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-primary/30 group-hover:border-primary transition-colors" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-primary/30 group-hover:border-primary transition-colors" />

            <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="axis-header text-primary mb-1">BUDGET ID: {budget.id.slice(0, 8)}</div>
                        <h3 className="text-lg font-bold tracking-tight text-white uppercase">{budget.name}</h3>
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{budget.category}</p>
                    </div>
                    <Badge variant="outline" className={`rounded-none border font-mono text-[10px] uppercase ${isOverBudget ? 'border-destructive text-destructive' : 'border-primary/50 text-primary'}`}>
                        {budget.period}
                    </Badge>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-end font-mono">
                        <div>
                            <span className="text-2xl font-bold text-white">${budget.spent.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground ml-2">/ ${budget.amount.toFixed(2)}</span>
                        </div>
                        <div className={`text-sm font-bold ${isOverBudget ? 'text-destructive' : 'text-primary'}`}>
                            {progress.toFixed(1)}%
                        </div>
                    </div>

                    {/* Technical Progress Bar */}
                    <div className="h-2 w-full bg-black border border-white/10 relative overflow-hidden">
                        {/* Grid lines in background */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:10%_100%]" />

                        <div
                            className={`h-full transition-all duration-500 relative ${isOverBudget ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        >
                            {/* Striped pattern overlay */}
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.2)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0.2)_75%,transparent_75%,transparent)] bg-[size:8px_8px]" />
                        </div>
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase">
                        <span>REMAINING: ${(budget.amount - budget.spent).toFixed(2)}</span>
                        <span>STATUS: {isOverBudget ? 'CRITICAL' : 'NOMINAL'}</span>
                    </div>
                </div>

                <div className="pt-2 flex gap-2 border-t border-white/5">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-8 rounded-none text-xs font-mono hover:bg-white/5 hover:text-primary"
                        onClick={() => onEdit?.(budget)}
                    >
                        <Edit className="w-3 h-3 mr-2" />
                        CONFIGURE
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-none text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={handleDelete}
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
