import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Budget } from '@/domain/entities/Budget'
import type { Transaction } from '@/domain/entities/Transaction'

/**
 * Report Filter Options
 */
export interface ReportFilters {
    reportType: 'transactions' | 'budgets' | 'summary'
    startDate?: Date
    endDate?: Date
    categories?: string[]
    budgetIds?: string[]
}

/**
 * ReportExportService
 * Handles generation of Excel and PDF reports with filtering capabilities.
 */
class ReportExportService {
    /**
     * Filter transactions based on provided filters
     */
    filterTransactions(transactions: Transaction[], filters: ReportFilters): Transaction[] {
        return transactions.filter(t => {
            // Date filter
            if (filters.startDate && new Date(t.date) < filters.startDate) return false
            if (filters.endDate && new Date(t.date) > filters.endDate) return false

            // Category filter
            if (filters.categories?.length && !filters.categories.includes(t.category)) return false

            // Budget filter
            if (filters.budgetIds?.length && t.budgetId && !filters.budgetIds.includes(t.budgetId)) return false

            return true
        })
    }

    /**
     * Filter budgets based on provided filters
     */
    filterBudgets(budgets: Budget[], filters: ReportFilters): Budget[] {
        return budgets.filter(b => {
            // Date filter (check if budget period overlaps with filter range)
            if (filters.startDate && new Date(b.endDate) < filters.startDate) return false
            if (filters.endDate && new Date(b.startDate) > filters.endDate) return false

            // Category filter
            if (filters.categories?.length && !filters.categories.includes(b.category)) return false

            return true
        })
    }

    /**
     * Generate summary data from budgets and transactions
     */
    generateSummaryData(budgets: Budget[], transactions: Transaction[], filters: ReportFilters) {
        const filteredBudgets = this.filterBudgets(budgets, filters)
        const filteredTransactions = this.filterTransactions(transactions, filters)

        const totalBudget = filteredBudgets.reduce((sum, b) => sum + b.amount, 0)
        const totalSpent = filteredBudgets.reduce((sum, b) => sum + b.spent, 0)
        const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
        const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

        // Category breakdown
        const categoryBreakdown: Record<string, { income: number; expense: number }> = {}
        filteredTransactions.forEach(t => {
            if (!categoryBreakdown[t.category]) {
                categoryBreakdown[t.category] = { income: 0, expense: 0 }
            }
            if (t.type === 'income') {
                categoryBreakdown[t.category].income += t.amount
            } else {
                categoryBreakdown[t.category].expense += t.amount
            }
        })

        return {
            totalBudget,
            totalSpent,
            totalIncome,
            totalExpenses,
            netSavings: totalIncome - totalExpenses,
            budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
            categoryBreakdown,
            budgetCount: filteredBudgets.length,
            transactionCount: filteredTransactions.length,
        }
    }

    /**
     * Export transactions to Excel
     */
    exportTransactionsToExcel(transactions: Transaction[], filename: string = 'transactions_report') {
        const data = transactions.map(t => ({
            'Date': new Date(t.date).toLocaleDateString(),
            'Type': t.type.charAt(0).toUpperCase() + t.type.slice(1),
            'Category': t.category,
            'Description': t.description,
            'Amount': t.amount.toFixed(2),
        }))

        this.generateExcel(data, filename)
    }

    /**
     * Export budgets to Excel
     */
    exportBudgetsToExcel(budgets: Budget[], filename: string = 'budgets_report') {
        const data = budgets.map(b => ({
            'Name': b.name,
            'Category': b.category,
            'Period': b.period.charAt(0).toUpperCase() + b.period.slice(1),
            'Budget Amount': b.amount.toFixed(2),
            'Spent': b.spent.toFixed(2),
            'Remaining': (b.amount - b.spent).toFixed(2),
            'Utilization %': ((b.spent / b.amount) * 100).toFixed(1),
            'Start Date': new Date(b.startDate).toLocaleDateString(),
            'End Date': new Date(b.endDate).toLocaleDateString(),
        }))

        this.generateExcel(data, filename)
    }

    /**
     * Export summary to Excel
     */
    exportSummaryToExcel(budgets: Budget[], transactions: Transaction[], filters: ReportFilters, filename: string = 'summary_report') {
        const summary = this.generateSummaryData(budgets, transactions, filters)

        // Overview sheet data
        const overviewData = [
            { 'Metric': 'Total Budget', 'Value': summary.totalBudget.toFixed(2) },
            { 'Metric': 'Total Spent', 'Value': summary.totalSpent.toFixed(2) },
            { 'Metric': 'Total Income', 'Value': summary.totalIncome.toFixed(2) },
            { 'Metric': 'Total Expenses', 'Value': summary.totalExpenses.toFixed(2) },
            { 'Metric': 'Net Savings', 'Value': summary.netSavings.toFixed(2) },
            { 'Metric': 'Budget Utilization', 'Value': `${summary.budgetUtilization.toFixed(1)}%` },
            { 'Metric': 'Number of Budgets', 'Value': summary.budgetCount.toString() },
            { 'Metric': 'Number of Transactions', 'Value': summary.transactionCount.toString() },
        ]

        // Category breakdown data
        const categoryData = Object.entries(summary.categoryBreakdown).map(([category, amounts]) => ({
            'Category': category,
            'Income': amounts.income.toFixed(2),
            'Expense': amounts.expense.toFixed(2),
            'Net': (amounts.income - amounts.expense).toFixed(2),
        }))

        // Create workbook with multiple sheets
        const wb = XLSX.utils.book_new()
        const ws1 = XLSX.utils.json_to_sheet(overviewData)
        const ws2 = XLSX.utils.json_to_sheet(categoryData)

        XLSX.utils.book_append_sheet(wb, ws1, 'Overview')
        XLSX.utils.book_append_sheet(wb, ws2, 'By Category')

        XLSX.writeFile(wb, `${filename}.xlsx`)
    }

    /**
     * Export transactions to PDF
     */
    exportTransactionsToPDF(transactions: Transaction[], filename: string = 'transactions_report', title: string = 'Transactions Report') {
        const doc = new jsPDF()

        // Add title
        doc.setFontSize(20)
        doc.setTextColor(40, 40, 40)
        doc.text(title, 14, 20)

        // Add date
        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)

        // Table data
        const tableData = transactions.map(t => [
            new Date(t.date).toLocaleDateString(),
            t.type.charAt(0).toUpperCase() + t.type.slice(1),
            t.category,
            t.description.length > 30 ? t.description.substring(0, 30) + '...' : t.description,
            `$${t.amount.toFixed(2)}`,
        ])

        autoTable(doc, {
            head: [['Date', 'Type', 'Category', 'Description', 'Amount']],
            body: tableData,
            startY: 35,
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [79, 70, 229], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 245, 250] },
        })

        doc.save(`${filename}.pdf`)
    }

    /**
     * Export budgets to PDF
     */
    exportBudgetsToPDF(budgets: Budget[], filename: string = 'budgets_report', title: string = 'Budgets Report') {
        const doc = new jsPDF()

        doc.setFontSize(20)
        doc.setTextColor(40, 40, 40)
        doc.text(title, 14, 20)

        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)

        const tableData = budgets.map(b => [
            b.name,
            b.category,
            b.period,
            `$${b.amount.toFixed(2)}`,
            `$${b.spent.toFixed(2)}`,
            `${((b.spent / b.amount) * 100).toFixed(1)}%`,
        ])

        autoTable(doc, {
            head: [['Name', 'Category', 'Period', 'Budget', 'Spent', 'Used %']],
            body: tableData,
            startY: 35,
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [79, 70, 229], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 245, 250] },
        })

        doc.save(`${filename}.pdf`)
    }

    /**
     * Export summary to PDF
     */
    exportSummaryToPDF(budgets: Budget[], transactions: Transaction[], filters: ReportFilters, filename: string = 'summary_report', title: string = 'Financial Summary Report') {
        const summary = this.generateSummaryData(budgets, transactions, filters)
        const doc = new jsPDF()

        doc.setFontSize(20)
        doc.setTextColor(40, 40, 40)
        doc.text(title, 14, 20)

        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)

        // Overview table
        const overviewData = [
            ['Total Budget', `$${summary.totalBudget.toFixed(2)}`],
            ['Total Spent', `$${summary.totalSpent.toFixed(2)}`],
            ['Total Income', `$${summary.totalIncome.toFixed(2)}`],
            ['Total Expenses', `$${summary.totalExpenses.toFixed(2)}`],
            ['Net Savings', `$${summary.netSavings.toFixed(2)}`],
            ['Budget Utilization', `${summary.budgetUtilization.toFixed(1)}%`],
        ]

        autoTable(doc, {
            head: [['Metric', 'Value']],
            body: overviewData,
            startY: 35,
            styles: { fontSize: 10, cellPadding: 4 },
            headStyles: { fillColor: [79, 70, 229], textColor: 255 },
            columnStyles: { 0: { fontStyle: 'bold' } },
        })

        // Category breakdown
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalY = (doc as any).lastAutoTable.finalY || 100

        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.text('Category Breakdown', 14, finalY + 15)

        const categoryData = Object.entries(summary.categoryBreakdown).map(([category, amounts]) => [
            category,
            `$${amounts.income.toFixed(2)}`,
            `$${amounts.expense.toFixed(2)}`,
            `$${(amounts.income - amounts.expense).toFixed(2)}`,
        ])

        autoTable(doc, {
            head: [['Category', 'Income', 'Expense', 'Net']],
            body: categoryData,
            startY: finalY + 20,
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [99, 102, 241], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 245, 250] },
        })

        doc.save(`${filename}.pdf`)
    }

    /**
     * Generate Excel file from data array
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private generateExcel(data: Record<string, any>[], filename: string) {
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Report')
        XLSX.writeFile(wb, `${filename}.xlsx`)
    }
}

export const reportExportService = new ReportExportService()
