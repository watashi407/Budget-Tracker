import { useActionState, useState, useEffect } from 'react'
import type { Budget, UpdateBudgetInput } from '@/domain/entities/Budget'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog'
import { useBudgets } from '@/presentation/hooks/useBudgets'
import { AlertCircle } from 'lucide-react'
import { BUDGET_CATEGORIES, OTHERS_CATEGORY } from '@/constants/categories'

interface EditBudgetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    budget: Budget | null
}

interface FieldErrors {
    name?: string
    category?: string
    amount?: string
}

export function EditBudgetDialog({ open, onOpenChange, budget }: EditBudgetDialogProps) {
    const { updateBudget } = useBudgets()

    const [name, setName] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [customCategory, setCustomCategory] = useState('')
    const [amount, setAmount] = useState('')
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
    const [color, setColor] = useState('#3b82f6')

    // Derived category value (either selected or custom)
    const category = selectedCategory === OTHERS_CATEGORY ? customCategory : selectedCategory

    // Field-level errors
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    // Initialize form when budget changes
    useEffect(() => {
        if (budget) {
            setName(budget.name)
            // Check if budget category matches a predefined one
            const matchedCategory = BUDGET_CATEGORIES.find(c => c.value === budget.category || c.label === budget.category)
            if (matchedCategory) {
                setSelectedCategory(matchedCategory.value)
                setCustomCategory('')
            } else {
                setSelectedCategory(OTHERS_CATEGORY)
                setCustomCategory(budget.category)
            }
            setAmount(budget.amount.toString())
            setPeriod(budget.period)
            setColor(budget.color || '#3b82f6')
            setFieldErrors({})
        }
    }, [budget])

    // Validate a single field
    const validateField = (fieldName: keyof FieldErrors, value: string): string | undefined => {
        switch (fieldName) {
            case 'name':
                if (!value.trim()) return 'Budget name is required'
                if (value.trim().length < 2) return 'Name must be at least 2 characters'
                return undefined
            case 'category':
                if (!value.trim()) return 'Category is required'
                return undefined
            case 'amount':
                if (!value.trim()) return 'Amount is required'
                const num = parseFloat(value)
                if (isNaN(num)) return 'Please enter a valid number'
                if (num <= 0) return 'Amount must be greater than 0'
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
            name: validateField('name', name),
            category: validateField('category', category),
            amount: validateField('amount', amount),
        }
        setFieldErrors(errors)
        return !Object.values(errors).some(error => error !== undefined)
    }

    const [state, formAction, isPending] = useActionState(async (_prevState: { success: boolean; error: string | null }, formData: FormData) => {
        if (!budget) return { success: false, error: 'No budget selected' }

        // Validate all fields first
        if (!validateAllFields()) {
            return { success: false, error: 'Please fix the errors above' }
        }

        try {
            const name = formData.get('name') as string
            const category = formData.get('category') as string
            const amountStr = formData.get('amount') as string
            const period = formData.get('period') as 'daily' | 'weekly' | 'monthly' | 'yearly'
            const color = formData.get('color') as string

            const parsedAmount = parseFloat(amountStr)
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new Error('Please enter a valid amount greater than 0')
            }

            const input: UpdateBudgetInput = {
                name,
                category,
                amount: parsedAmount,
                period,
                color,
            }

            await updateBudget(budget.id, input)
            setFieldErrors({})
            onOpenChange(false)
            return { success: true, error: null }
        } catch (err: unknown) {
            return { success: false, error: err instanceof Error ? err.message : 'Failed to update budget' }
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
                    <DialogTitle>Edit Budget</DialogTitle>
                    <DialogDescription>
                        Modify your budget details.
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction}>
                    <div className="space-y-5 py-4">
                        {state.error && (
                            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {state.error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="edit-name" className="flex items-center gap-1">
                                Budget Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="edit-name"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={(e) => handleBlur('name', e.target.value)}
                                required
                                disabled={isPending}
                                className={fieldErrors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                            />
                            {fieldErrors.name && (
                                <p className="text-destructive text-xs flex items-center gap-1 mt-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {fieldErrors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-category" className="flex items-center gap-1">
                                Category <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={selectedCategory}
                                onValueChange={(value) => {
                                    setSelectedCategory(value)
                                    if (value !== OTHERS_CATEGORY) {
                                        setCustomCategory('')
                                        const found = BUDGET_CATEGORIES.find(c => c.value === value)
                                        if (found) {
                                            handleBlur('category', found.label)
                                        }
                                    }
                                }}
                                disabled={isPending}
                            >
                                <SelectTrigger className={`rounded-xl ${fieldErrors.category ? 'border-destructive focus-visible:ring-destructive' : ''}`}>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {BUDGET_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value={OTHERS_CATEGORY}>Others (Specify below)</SelectItem>
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="category" value={category} />
                            {selectedCategory === OTHERS_CATEGORY && (
                                <Input
                                    placeholder="Enter custom category"
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    onBlur={(e) => handleBlur('category', e.target.value)}
                                    disabled={isPending}
                                    className={`mt-2 ${fieldErrors.category ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                />
                            )}
                            {fieldErrors.category && (
                                <p className="text-destructive text-xs flex items-center gap-1 mt-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {fieldErrors.category}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-amount" className="flex items-center gap-1">
                                    Amount <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="edit-amount"
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
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
                                <Label htmlFor="edit-period">Period</Label>
                                <Select
                                    name="period"
                                    value={period}
                                    onValueChange={(value: string) => setPeriod(value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                                    disabled={isPending}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-color">Color</Label>
                            <div className="flex gap-3">
                                <Input
                                    id="edit-color"
                                    name="color"
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-20 h-10 p-1 rounded-xl cursor-pointer"
                                    disabled={isPending}
                                />
                                <Input
                                    type="text"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    disabled={isPending}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
