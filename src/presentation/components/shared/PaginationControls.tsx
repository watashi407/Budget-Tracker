import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import { PAGINATION } from '@/constants/ui'

interface PaginationControlsProps {
    currentPage: number
    totalPages: number
    totalItems: number
    startIndex: number
    endIndex: number
    itemsPerPage: number
    onPageChange: (page: number) => void
    onItemsPerPageChange: (count: number) => void
    /** Minimum items required to show pagination (default: 3) */
    minItemsToShow?: number
}

/**
 * Reusable pagination controls component with items-per-page selector
 * and page navigation buttons.
 */
export function PaginationControls({
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    minItemsToShow = 3,
}: PaginationControlsProps) {
    // Don't render if not enough items
    if (totalItems <= minItemsToShow) {
        return null
    }

    // Calculate visible page numbers
    const getVisiblePages = (): number[] => {
        const maxVisible = 5
        const pages: number[] = []

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else if (currentPage <= 3) {
            for (let i = 1; i <= maxVisible; i++) {
                pages.push(i)
            }
        } else if (currentPage >= totalPages - 2) {
            for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                pages.push(i)
            }
        }

        return pages
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/30">
            {/* Items per page selector */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Show</span>
                <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => onItemsPerPageChange(Number(value))}
                >
                    <SelectTrigger className="w-16 h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {PAGINATION.ITEMS_PER_PAGE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option.toString()}>
                                {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span>per page</span>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-2">
                    {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
                </span>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                    {getVisiblePages().map((pageNum) => (
                        <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'ghost'}
                            size="icon"
                            className="h-8 w-8 text-xs"
                            onClick={() => onPageChange(pageNum)}
                        >
                            {pageNum}
                        </Button>
                    ))}
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}
