import { useState } from 'react'
import type { CreateTransactionInput } from '@/domain/entities/Transaction'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog'
import { useTransactions } from '@/presentation/hooks/useTransactions'
import { useBudgets } from '@/presentation/hooks/useBudgets'

/**
 * CreateTransactionDialog Component
 * Modal dialog for creating a new transaction (income or expense).
 * Part of the Presentation layer in Clean Architecture.
 */
interface CreateTransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateTransactionDialog({ open, onOpenChange }: CreateTransactionDialogProps) {
    const { createTransaction } = useTransactions()
    const { budgets } = useBudgets()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form state
    const [type, setType] = useState<'income' | 'expense'>('expense')
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('')
    const [description, setDescription] = useState('')
    const [budgetId, setBudgetId] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    /**
     * Handle form submission
     */
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const parsedAmount = parseFloat(amount)
            if (isNaN(parsedAmount) || parsedAmount < 0) {
                throw new Error('Please enter a valid amount')
            }

            const input: CreateTransactionInput = {
                type,
                amount: parsedAmount,
                category,
                description,
                budgetId: budgetId || undefined,
                date: new Date(date),
            }

            await createTransaction(input)

            // Reset form
            setType('expense')
            setAmount('')
            setCategory('')
            setDescription('')
            setBudgetId('')
            setDate(new Date().toISOString().split('T')[0])
            onOpenChange(false)
        } catch (err: any) {
            setError(err.message || 'Failed to create transaction')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                    <DialogDescription>
                        Record a new income or expense transaction.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {error && (
                            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select value={type} onValueChange={(value: any) => setType(value)} disabled={loading}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="income">Income</SelectItem>
                                    <SelectItem value="expense">Expense</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input
                                id="category"
                                placeholder="e.g., Food, Salary, Rent"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="budget">Budget (Optional)</Label>
                            <Select value={budgetId} onValueChange={setBudgetId} disabled={loading}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a budget" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {budgets.map((budget) => (
                                        <SelectItem key={budget.id} value={budget.id}>
                                            {budget.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Add details about this transaction..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                disabled={loading}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Transaction'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
