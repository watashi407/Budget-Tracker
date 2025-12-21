import { useState, useMemo } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/presentation/components/ui/dialog'
import { Button } from '@/presentation/components/ui/button'
import { Label } from '@/presentation/components/ui/label'
import { Input } from '@/presentation/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/presentation/components/ui/select'
import { Badge } from '@/presentation/components/ui/badge'
import { FileSpreadsheet, FileText, Download, Calendar, Filter, X, Loader2 } from 'lucide-react'
import { reportExportService, type ReportFilters } from '@/data/services/ReportExportService'
import type { Budget } from '@/domain/entities/Budget'
import type { Transaction } from '@/domain/entities/Transaction'

interface ExportReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    budgets: Budget[]
    transactions: Transaction[]
}

type ReportType = 'transactions' | 'budgets' | 'summary'
type ExportFormat = 'excel' | 'pdf'

export function ExportReportDialog({
    open,
    onOpenChange,
    budgets,
    transactions,
}: ExportReportDialogProps) {
    const [reportType, setReportType] = useState<ReportType>('transactions')
    const [exportFormat, setExportFormat] = useState<ExportFormat>('excel')
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [selectedBudgets, setSelectedBudgets] = useState<string[]>([])
    const [isExporting, setIsExporting] = useState(false)

    // Get unique categories from transactions and budgets
    const availableCategories = useMemo(() => {
        const transactionCategories = transactions.map(t => t.category)
        const budgetCategories = budgets.map(b => b.category)
        return [...new Set([...transactionCategories, ...budgetCategories])].sort()
    }, [transactions, budgets])

    // Build filters object
    const buildFilters = (): ReportFilters => ({
        reportType,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        budgetIds: selectedBudgets.length > 0 ? selectedBudgets : undefined,
    })

    // Get preview count
    const previewCount = useMemo(() => {
        const filters = buildFilters()
        if (reportType === 'transactions') {
            return reportExportService.filterTransactions(transactions, filters).length
        } else if (reportType === 'budgets') {
            return reportExportService.filterBudgets(budgets, filters).length
        }
        return null
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reportType, startDate, endDate, selectedCategories, selectedBudgets, transactions, budgets])

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        )
    }

    const toggleBudget = (budgetId: string) => {
        setSelectedBudgets(prev =>
            prev.includes(budgetId)
                ? prev.filter(b => b !== budgetId)
                : [...prev, budgetId]
        )
    }

    const clearFilters = () => {
        setStartDate('')
        setEndDate('')
        setSelectedCategories([])
        setSelectedBudgets([])
    }

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const filters = buildFilters()
            const timestamp = new Date().toISOString().split('T')[0]

            if (reportType === 'transactions') {
                const filteredTransactions = reportExportService.filterTransactions(transactions, filters)
                if (exportFormat === 'excel') {
                    reportExportService.exportTransactionsToExcel(filteredTransactions, `transactions_${timestamp}`)
                } else {
                    reportExportService.exportTransactionsToPDF(filteredTransactions, `transactions_${timestamp}`)
                }
            } else if (reportType === 'budgets') {
                const filteredBudgets = reportExportService.filterBudgets(budgets, filters)
                if (exportFormat === 'excel') {
                    reportExportService.exportBudgetsToExcel(filteredBudgets, `budgets_${timestamp}`)
                } else {
                    reportExportService.exportBudgetsToPDF(filteredBudgets, `budgets_${timestamp}`)
                }
            } else {
                if (exportFormat === 'excel') {
                    reportExportService.exportSummaryToExcel(budgets, transactions, filters, `summary_${timestamp}`)
                } else {
                    reportExportService.exportSummaryToPDF(budgets, transactions, filters, `summary_${timestamp}`)
                }
            }

            onOpenChange(false)
        } catch (error) {
            console.error('Export failed:', error)
        } finally {
            setIsExporting(false)
        }
    }

    const hasActiveFilters = startDate || endDate || selectedCategories.length > 0 || selectedBudgets.length > 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="w-5 h-5 text-primary" />
                        Export Report
                    </DialogTitle>
                    <DialogDescription>
                        Configure and export your financial data as Excel or PDF.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Report Type Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Report Type</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['transactions', 'budgets', 'summary'] as ReportType[]).map(type => (
                                <Button
                                    key={type}
                                    variant={reportType === type ? 'default' : 'outline'}
                                    className="h-10"
                                    onClick={() => setReportType(type)}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Export Format */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Export Format</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={exportFormat === 'excel' ? 'default' : 'outline'}
                                className="h-12 flex items-center gap-2"
                                onClick={() => setExportFormat('excel')}
                            >
                                <FileSpreadsheet className="w-5 h-5" />
                                <div className="text-left">
                                    <div className="font-medium">Excel</div>
                                    <div className="text-xs opacity-70">.xlsx</div>
                                </div>
                            </Button>
                            <Button
                                variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                                className="h-12 flex items-center gap-2"
                                onClick={() => setExportFormat('pdf')}
                            >
                                <FileText className="w-5 h-5" />
                                <div className="text-left">
                                    <div className="font-medium">PDF</div>
                                    <div className="text-xs opacity-70">.pdf</div>
                                </div>
                            </Button>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Date Range
                            </Label>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-muted-foreground"
                                    onClick={clearFilters}
                                >
                                    <X className="w-3 h-3 mr-1" />
                                    Clear filters
                                </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-muted-foreground">From</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">To</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Categories
                            {selectedCategories.length > 0 && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                    {selectedCategories.length} selected
                                </Badge>
                            )}
                        </Label>
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-muted/30 rounded-lg">
                            {availableCategories.length > 0 ? (
                                availableCategories.map(category => (
                                    <Badge
                                        key={category}
                                        variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                                        className="cursor-pointer transition-colors hover:bg-primary/80"
                                        onClick={() => toggleCategory(category)}
                                    >
                                        {category}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-sm text-muted-foreground">No categories available</span>
                            )}
                        </div>
                    </div>

                    {/* Budget Filter (only for transactions) */}
                    {reportType === 'transactions' && budgets.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                Filter by Budget
                                {selectedBudgets.length > 0 && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                        {selectedBudgets.length} selected
                                    </Badge>
                                )}
                            </Label>
                            <Select onValueChange={(value) => toggleBudget(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select budgets to include..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {budgets.map(budget => (
                                        <SelectItem key={budget.id} value={budget.id}>
                                            {budget.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedBudgets.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {selectedBudgets.map(id => {
                                        const budget = budgets.find(b => b.id === id)
                                        return budget ? (
                                            <Badge
                                                key={id}
                                                variant="secondary"
                                                className="cursor-pointer"
                                                onClick={() => toggleBudget(id)}
                                            >
                                                {budget.name}
                                                <X className="w-3 h-3 ml-1" />
                                            </Badge>
                                        ) : null
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Preview Count */}
                    {previewCount !== null && (
                        <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                            <span className="font-medium">{previewCount}</span>{' '}
                            {reportType === 'transactions' ? 'transactions' : 'budgets'} will be exported
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting} className="gap-2">
                        {isExporting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Export {exportFormat.toUpperCase()}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
