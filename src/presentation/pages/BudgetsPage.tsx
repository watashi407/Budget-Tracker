import { useState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { CreateBudgetDialog } from '@/presentation/components/CreateBudgetDialog'
import { EditBudgetDialog } from '@/presentation/components/EditBudgetDialog'
import { BudgetList } from '@/presentation/components/BudgetList'
import { useBudgets } from '@/presentation/hooks/useBudgets'
import { PlusCircle } from 'lucide-react'
import type { Budget } from '@/domain/entities/Budget'

export function BudgetsPage() {
    const { budgets } = useBudgets()
    const [showBudgetDialog, setShowBudgetDialog] = useState(false)
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="axis-header">BUDGET MANAGEMENT</div>
                    <h1 className="text-3xl font-bold tracking-tight">ACTIVE BUDGETS</h1>
                    <p className="text-muted-foreground font-mono text-xs mt-1">
                        {budgets.length} budget{budgets.length !== 1 ? 's' : ''} configured
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <Button
                        onClick={() => setShowBudgetDialog(true)}
                        className="rounded-none border border-primary bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        NEW BUDGET
                    </Button>
                </div>
            </div>

            {/* Budget List with Search and Pagination */}
            <BudgetList
                onEdit={(b) => setEditingBudget(b)}
                onAddNew={() => setShowBudgetDialog(true)}
                showAddButton={false}
            />

            {/* Dialogs */}
            <CreateBudgetDialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog} />
            <EditBudgetDialog
                open={!!editingBudget}
                onOpenChange={(open) => !open && setEditingBudget(null)}
                budget={editingBudget}
            />
        </div>
    )
}
