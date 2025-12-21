import { useState, useMemo } from 'react'
import { Search, Wallet, ChevronLeft, ChevronRight } from 'lucide-react'
import { useBudgets } from '@/presentation/hooks/useBudgets'
import type { Budget } from '@/domain/entities/Budget'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import { BudgetCard } from '@/presentation/components/BudgetCard'

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
    const [itemsPerPage, setItemsPerPage] = useState(6)

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
            {filteredBudgets.length > 3 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Show</span>
                        <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(value) => setItemsPerPage(Number(value))}
                        >
                            <SelectTrigger className="w-16 h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="6">6</SelectItem>
                                <SelectItem value="7">7</SelectItem>
                                <SelectItem value="8">8</SelectItem>
                            </SelectContent>
                        </Select>
                        <span>per page</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground mr-2">
                            {startIndex + 1}-{Math.min(endIndex, filteredBudgets.length)} of {filteredBudgets.length}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum: number
                                if (totalPages <= 5) {
                                    pageNum = i + 1
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i
                                } else {
                                    pageNum = currentPage - 2 + i
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? 'default' : 'ghost'}
                                        size="icon"
                                        className="h-8 w-8 text-xs"
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                )
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
