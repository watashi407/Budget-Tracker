import { useState, useMemo } from 'react'
import { useBudgets } from '@/presentation/hooks/useBudgets'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { CreateBudgetDialog } from '@/presentation/components/CreateBudgetDialog'
import { EditBudgetDialog } from '@/presentation/components/EditBudgetDialog'
import { BudgetCard } from '@/presentation/components/BudgetCard'
import {
    PlusCircle, Wallet, Search
} from 'lucide-react'
import type { Budget } from '@/domain/entities/Budget'

export function BudgetsPage() {
    const { budgets, loading } = useBudgets()
    const [showBudgetDialog, setShowBudgetDialog] = useState(false)
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Filter budgets by search query
    const filteredBudgets = useMemo(() => {
        if (!searchQuery.trim()) return budgets
        const query = searchQuery.toLowerCase()
        return budgets.filter(b =>
            b.name.toLowerCase().includes(query) ||
            b.category.toLowerCase().includes(query)
        )
    }, [budgets, searchQuery])

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

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search budgets by name or category..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <span className="text-sm text-muted-foreground">
                    {filteredBudgets.length} result{filteredBudgets.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Budget Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
            ) : filteredBudgets.length === 0 ? (
                <div className="axis-card p-12 flex flex-col items-center justify-center text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                        <Wallet className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">
                        {searchQuery ? 'NO MATCHING BUDGETS' : 'NO ACTIVE BUDGETS'}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                        {searchQuery
                            ? 'Try adjusting your search query.'
                            : 'Initialize a budget parameter to begin tracking financial data.'}
                    </p>
                    {!searchQuery && (
                        <Button
                            onClick={() => setShowBudgetDialog(true)}
                            className="rounded-none border border-primary bg-primary/10 text-primary hover:bg-primary hover:text-white"
                        >
                            INITIALIZE BUDGET
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredBudgets.map((budget) => (
                        <BudgetCard
                            key={budget.id}
                            budget={budget}
                            onEdit={(b) => setEditingBudget(b)}
                        />
                    ))}
                </div>
            )}

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
