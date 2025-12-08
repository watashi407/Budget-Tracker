import { useActionState, useState } from 'react'
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
    defaultBudgetId?: string
}

export function CreateTransactionDialog({ open, onOpenChange, defaultBudgetId }: CreateTransactionDialogProps) {
    const { createTransaction } = useTransactions()
    const { budgets } = useBudgets()

    // Form state
    const [type, setType] = useState<'income' | 'expense'>('expense')
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('')
    const [description, setDescription] = useState('')
    const [budgetId, setBudgetId] = useState(defaultBudgetId || '')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    const [state, formAction, isPending] = useActionState(async (_prevState: any, formData: FormData) => {
        console.log('[CreateTransactionDialog] Submitting form via Action...')

        try {
            const type = formData.get('type') as 'income' | 'expense'
            const amountStr = formData.get('amount') as string
            const category = formData.get('category') as string
            const description = formData.get('description') as string
            const budgetId = formData.get('budgetId') as string
            const dateStr = formData.get('date') as string

            const parsedAmount = parseFloat(amountStr)
            if (isNaN(parsedAmount) || parsedAmount < 0) {
                throw new Error('Please enter a valid amount')
            }

            const input: CreateTransactionInput = {
                type,
                amount: parsedAmount,
                category,
                description,
                budgetId: budgetId || undefined,
                date: new Date(dateStr),
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
            return { success: true, error: null }
        } catch (err: any) {
            return { success: false, error: err.message || 'Failed to create transaction' }
        }
    }, { success: false, error: null })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                    <DialogDescription>
                        Record a new income or expense transaction.
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction}>
                    <div className="space-y-4 py-4">
                        {state.error && (
                            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                                {state.error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                name="type"
                                value={type}
                                onValueChange={(value: any) => setType(value)}
                                disabled={isPending}
                            >
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
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    disabled={isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    name="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input
                                id="category"
                                name="category"
                                placeholder="e.g., Food, Salary, Rent"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                required
                                disabled={isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="budget">Budget (Optional)</Label>
                            <Select
                                name="budgetId"
                                value={budgetId || "none"}
                                onValueChange={(value) => setBudgetId(value === "none" ? "" : value)}
                                disabled={isPending}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a budget" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
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
                                name="description"
                                placeholder="Add details about this transaction..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                disabled={isPending}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Adding...' : 'Add Transaction'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
