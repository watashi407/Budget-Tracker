import { useActionState, useState, useEffect } from 'react'
import type { Transaction, UpdateTransactionInput } from '@/domain/entities/Transaction'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog'
import { FormSubmitButton } from '@/presentation/components/FormSubmitButton'
import { EmailVerificationMessage } from '@/presentation/components/EmailVerificationMessage'
import { useTransactions } from '@/presentation/hooks/useTransactions'
import { useBudgets } from '@/presentation/hooks/useBudgets'
import { useCurrency } from '@/presentation/context/CurrencyContext'
import { useAuth } from '@/presentation/context/AuthContext'
import { AlertCircle } from 'lucide-react'

/**
 * EditTransactionDialog Component
 * Modal dialog for editing an existing transaction.
 * Part of the Presentation layer in Clean Architecture.
 */
interface EditTransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: Transaction | null
}

interface FieldErrors {
    amount?: string
    category?: string
    description?: string
    date?: string
}

export function EditTransactionDialog({ open, onOpenChange, transaction }: EditTransactionDialogProps) {
    const { user } = useAuth()
    const { updateTransaction } = useTransactions()
    const { budgets } = useBudgets()
    const { currency, availableCurrencies } = useCurrency()

    const activeCurrency = availableCurrencies.find(c => c.code === currency)
    const isEmailVerified = user?.emailVerified

    // Form state
    const [type, setType] = useState<'income' | 'expense'>('expense')
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('')
    const [description, setDescription] = useState('')
    const [budgetId, setBudgetId] = useState('')
    const [date, setDate] = useState('')

    // Field-level errors
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    // Initialize form when transaction changes
    useEffect(() => {
        if (transaction) {
            setType(transaction.type)
            setAmount(transaction.amount.toString())
            setCategory(transaction.category)
            setDescription(transaction.description)
            setBudgetId(transaction.budgetId || '')
            // Format date for input type="date"
            setDate(new Date(transaction.date).toISOString().split('T')[0])
            setFieldErrors({})
        }
    }, [transaction])

    // Validate a single field
    const validateField = (fieldName: keyof FieldErrors, value: string): string | undefined => {
        switch (fieldName) {
            case 'amount':
                if (!value.trim()) return 'Amount is required'
                const num = parseFloat(value)
                if (isNaN(num)) return 'Please enter a valid number'
                if (num <= 0) return 'Amount must be greater than 0'
                return undefined
            case 'category':
                if (!value.trim()) return 'Category is required'
                return undefined
            case 'description':
                if (!value.trim()) return 'Description is required'
                if (value.trim().length < 2) return 'Description must be at least 2 characters'
                return undefined
            case 'date':
                if (!value) return 'Date is required'
                return undefined
            default:
                return undefined
        }
    }

    // Handle field blur for real-time validation
    const handleBlur = (fieldName: keyof FieldErrors, value: string) => {
        const error = validateField(fieldName, value)
        setFieldErrors(prev => ({ ...prev, [fieldName]: error }))
    }

    // Validate all fields
    const validateAllFields = (): boolean => {
        const errors: FieldErrors = {
            amount: validateField('amount', amount),
            category: validateField('category', category),
            description: validateField('description', description),
            date: validateField('date', date),
        }
        setFieldErrors(errors)
        return !Object.values(errors).some(error => error !== undefined)
    }

    const [state, formAction, isPending] = useActionState(async (_prevState: { success: boolean; error: string | null }, formData: FormData) => {
        if (!transaction) return { success: false, error: 'No transaction selected' }

        // Validate all fields first
        if (!validateAllFields()) {
            return { success: false, error: 'Please fix the errors above' }
        }

        try {
            const type = formData.get('type') as 'income' | 'expense'
            const amountStr = formData.get('amount') as string
            const category = formData.get('category') as string
            const description = formData.get('description') as string
            const budgetId = formData.get('budgetId') as string
            const dateStr = formData.get('date') as string

            const parsedAmount = parseFloat(amountStr)
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new Error('Please enter a valid amount greater than 0')
            }

            const input: UpdateTransactionInput = {
                type,
                amount: parsedAmount,
                category,
                description,
                budgetId: budgetId || undefined,
                date: new Date(dateStr),
            }

            await updateTransaction(transaction.id, input)
            setFieldErrors({})
            onOpenChange(false)
            return { success: true, error: null }
        } catch (err: unknown) {
            return { success: false, error: err instanceof Error ? err.message : 'Failed to update transaction' }
        }
    }, { success: false, error: null })

    // Reset errors when dialog closes
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setFieldErrors({})
        }
        onOpenChange(isOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Transaction</DialogTitle>
                    <DialogDescription>
                        Update the details of this transaction.
                    </DialogDescription>
                </DialogHeader>

                {!isEmailVerified ? (
                    <EmailVerificationMessage
                        onClose={() => onOpenChange(false)}
                        actionName="editing transactions"
                    />
                ) : (
                    <form action={formAction}>
                        <div className="space-y-5 py-4">
                            {state.error && (
                                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {state.error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select
                                    name="type"
                                    value={type}
                                    onValueChange={(value: string) => setType(value as 'income' | 'expense')}
                                    disabled={isPending}
                                >
                                    <SelectTrigger className="rounded-xl">
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
                                    <Label htmlFor="amount" className="flex items-center gap-1">
                                        Amount ({activeCurrency?.symbol}) <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="amount"
                                        name="amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder={`0.00`}
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        onBlur={(e) => handleBlur('amount', e.target.value)}
                                        required
                                        disabled={isPending}
                                        className={fieldErrors.amount ? 'border-destructive focus-visible:ring-destructive' : ''}
                                    />
                                    {fieldErrors.amount && (
                                        <p className="text-destructive text-xs flex items-center gap-1 mt-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {fieldErrors.amount}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date" className="flex items-center gap-1">
                                        Date <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="date"
                                        name="date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        onBlur={(e) => handleBlur('date', e.target.value)}
                                        required
                                        disabled={isPending}
                                        className={fieldErrors.date ? 'border-destructive focus-visible:ring-destructive' : ''}
                                    />
                                    {fieldErrors.date && (
                                        <p className="text-destructive text-xs flex items-center gap-1 mt-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {fieldErrors.date}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category" className="flex items-center gap-1">
                                    Category <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="category"
                                    name="category"
                                    placeholder="e.g., Food, Salary, Rent"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    onBlur={(e) => handleBlur('category', e.target.value)}
                                    required
                                    disabled={isPending}
                                    className={fieldErrors.category ? 'border-destructive focus-visible:ring-destructive' : ''}
                                />
                                {fieldErrors.category && (
                                    <p className="text-destructive text-xs flex items-center gap-1 mt-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {fieldErrors.category}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="budget">Budget (Optional)</Label>
                                <Select
                                    name="budgetId"
                                    value={budgetId || "none"}
                                    onValueChange={(value) => setBudgetId(value === "none" ? "" : value)}
                                    disabled={isPending}
                                >
                                    <SelectTrigger className="rounded-xl">
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
                                <Label htmlFor="description" className="flex items-center gap-1">
                                    Description <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Add details about this transaction..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onBlur={(e) => handleBlur('description', e.target.value)}
                                    required
                                    disabled={isPending}
                                    rows={3}
                                    className={`rounded-xl ${fieldErrors.description ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                />
                                {fieldErrors.description && (
                                    <p className="text-destructive text-xs flex items-center gap-1 mt-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {fieldErrors.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                                Cancel
                            </Button>
                            <FormSubmitButton pendingText="Saving...">
                                Save Changes
                            </FormSubmitButton>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
