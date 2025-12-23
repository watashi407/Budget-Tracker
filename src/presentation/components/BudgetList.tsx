import { useState, useMemo } from 'react'
import { Search, Wallet } from 'lucide-react'
import { useBudgets } from '@/presentation/hooks/useBudgets'
import type { Budget } from '@/domain/entities/Budget'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { BudgetCard } from '@/presentation/components/BudgetCard'
import { PaginationControls } from '@/presentation/components/shared/PaginationControls'
import { PAGINATION } from '@/constants/ui'

interface BudgetListProps {
    initialBudgets?: Budget[]
    onEdit?: (budget: Budget) => void
    onAddNew?: () => void
    showSearch?: boolean
    showAddButton?: boolean
}

export function BudgetList({
    initialBudgets,
    onEdit,
    onAddNew,
    showSearch = true,
    showAddButton = true
}: BudgetListProps) {
    const { budgets: fetchedBudgets, loading } = useBudgets()

    // Search State
    const [searchText, setSearchText] = useState('')

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(PAGINATION.DEFAULT_ITEMS_PER_PAGE)

    const budgets = initialBudgets || fetchedBudgets

    // Filter Logic
    const filteredBudgets = useMemo(() => {
        return budgets.filter(b =>
            b.name.toLowerCase().includes(searchText.toLowerCase()) ||
            b.category.toLowerCase().includes(searchText.toLowerCase())
        )
    }, [budgets, searchText])

    // Pagination Logic
    const totalPages = Math.ceil(filteredBudgets.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const displayBudgets = filteredBudgets.slice(startIndex, endIndex)

    // Reset to page 1 when filters change
    useMemo(() => {
        setCurrentPage(1)
    }, [searchText, itemsPerPage])

    if (loading && !initialBudgets) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    if (budgets.length === 0) {
        return (
            <div className="axis-card p-12 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                    <Wallet className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">NO ACTIVE BUDGETS</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                    Initialize a budget parameter to begin tracking financial data.
                </p>
                {onAddNew && (
                    <Button onClick={onAddNew} className="rounded-none border border-primary bg-primary/10 text-primary hover:bg-primary hover:text-white">
                        INITIALIZE BUDGET
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Search Controls */}
            {showSearch && (
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                    <div className="relative flex-1 w-full sm:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search budgets..."
                            className="pl-9"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                    {showAddButton && onAddNew && (
                        <Button onClick={onAddNew} variant="ghost" size="sm" className="text-xs font-mono text-muted-foreground hover:text-primary">
                            + ADD NEW
                        </Button>
                    )}
                </div>
            )}

            {/* Budget Cards Grid */}
            {displayBudgets.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-lg bg-muted/30">
                    <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No budgets found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your search.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {displayBudgets.map((budget) => (
                        <BudgetCard
                            key={budget.id}
                            budget={budget}
                            onEdit={onEdit}
                        />
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredBudgets.length}
                startIndex={startIndex}
                endIndex={endIndex}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                minItemsToShow={3}
            />
        </div>
    )
}
