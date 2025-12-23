import { useActionState, useState } from 'react'
import type { CreateBudgetInput } from '@/domain/entities/Budget'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog'
import { FormSubmitButton } from '@/presentation/components/FormSubmitButton'
import { EmailVerificationMessage } from '@/presentation/components/EmailVerificationMessage'
import { FileUpload } from '@/presentation/components/FileUpload'
import { FormField } from '@/presentation/components/FormField'
import { useBudgets } from '@/presentation/hooks/useBudgets'
import { useAuth } from '@/presentation/context/AuthContext'
import { storageService } from '@/data/services/SupabaseStorageService'
import { AlertCircle, Paperclip } from 'lucide-react'
import { BUDGET_CATEGORIES, OTHERS_CATEGORY } from '@/constants/categories'

/**
 * CreateBudgetDialog Component
 * Modal dialog for creating a new budget with form validation.
 * Part of the Presentation layer in Clean Architecture.
 */
interface CreateBudgetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface FieldErrors {
    name?: string
    category?: string
    amount?: string
}

export function CreateBudgetDialog({ open, onOpenChange }: CreateBudgetDialogProps) {
    const { user } = useAuth()
    const { createBudget } = useBudgets()
    const isEmailVerified = user?.emailVerified

    // Form state
    const [name, setName] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [customCategory, setCustomCategory] = useState('')
    const [amount, setAmount] = useState('')
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
    const [color, setColor] = useState('#3b82f6')

    // File attachment state
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)

    // Derived category value (either selected or custom)
    const category = selectedCategory === OTHERS_CATEGORY ? customCategory : selectedCategory

    // Field-level errors
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

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

            const now = new Date()
            const endDate = new Date(now)

            // Calculate end date based on period
            switch (period) {
                case 'daily':
                    endDate.setDate(endDate.getDate() + 1)
                    break
                case 'weekly':
                    endDate.setDate(endDate.getDate() + 7)
                    break
                case 'monthly':
                    endDate.setMonth(endDate.getMonth() + 1)
                    break
                case 'yearly':
                    endDate.setFullYear(endDate.getFullYear() + 1)
                    break
            }

            const parsedAmount = parseFloat(amountStr)
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new Error('Please enter a valid amount greater than 0')
            }

            const input: CreateBudgetInput = {
                name,
                category,
                amount: parsedAmount,
                period,
                startDate: now,
                endDate,
                color,
                icon: 'wallet', // Default icon
            }

            const budget = await createBudget(input)

            // Upload file attachment if selected
            if (selectedFile && budget) {
                try {
                    await storageService.uploadAttachment({
                        file: selectedFile,
                        entityType: 'budget',
                        entityId: budget.id,
                    })
                } catch (uploadErr) {
                    console.error('Failed to upload attachment:', uploadErr)
                    // Don't fail the whole budget creation for attachment error
                }
            }

            // Reset form
            setName('')
            setSelectedCategory('')
            setCustomCategory('')
            setAmount('')
            setPeriod('monthly')
            setColor('#3b82f6')
            setSelectedFile(null)
            setUploadError(null)
            setFieldErrors({})
            onOpenChange(false)
            return { success: true, error: null }
        } catch (err: unknown) {
            return { success: false, error: err instanceof Error ? err.message : 'Failed to create budget' }
        }
    }, { success: false, error: null })

    // Reset errors when dialog closes
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setFieldErrors({})
            setSelectedFile(null)
            setUploadError(null)
        }
        onOpenChange(isOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Budget</DialogTitle>
                    <DialogDescription>
                        Set up a new budget to track your spending in a specific category.
                    </DialogDescription>
                </DialogHeader>

                {!isEmailVerified ? (
                    <EmailVerificationMessage
                        onClose={() => onOpenChange(false)}
                        actionName="creating budgets"
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

                            <FormField
                                label="Budget Name"
                                name="name"
                                placeholder="e.g., Groceries, Entertainment"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={(e) => handleBlur('name', e.target.value)}
                                required
                                disabled={isPending}
                                error={fieldErrors.name}
                            />

                            <div className="space-y-2">
                                <Label htmlFor="category" className="flex items-center gap-1">
                                    Category <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={selectedCategory}
                                    onValueChange={(value) => {
                                        setSelectedCategory(value)
                                        if (value !== OTHERS_CATEGORY) {
                                            setCustomCategory('')
                                            // Find the label for the selected category
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
                                {/* Hidden input to submit the actual category value */}
                                <input type="hidden" name="category" value={category} />
                                {selectedCategory === OTHERS_CATEGORY ? (
                                    <div className="mt-2">
                                        <FormField
                                            label="Specify Category"
                                            name="customCategory"
                                            placeholder="Enter custom category"
                                            value={customCategory}
                                            onChange={(e) => setCustomCategory(e.target.value)}
                                            onBlur={(e) => handleBlur('category', e.target.value)}
                                            disabled={isPending}
                                            error={fieldErrors.category}
                                            required
                                        />
                                    </div>
                                ) : (
                                    fieldErrors.category && (
                                        <p className="text-destructive text-xs flex items-center gap-1 mt-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {fieldErrors.category}
                                        </p>
                                    )
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    label="Amount"
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    onBlur={(e) => handleBlur('amount', e.target.value)}
                                    required
                                    disabled={isPending}
                                    error={fieldErrors.amount}
                                />

                                <div className="space-y-2">
                                    <Label htmlFor="period">Period</Label>
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
                                <Label htmlFor="color">Color</Label>
                                <div className="flex gap-3">
                                    <Input
                                        id="color"
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
                                        placeholder="#3b82f6"
                                        disabled={isPending}
                                    />
                                </div>
                            </div>

                            {/* File Attachment */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Paperclip className="w-4 h-4" />
                                    Attachment (Optional)
                                </Label>
                                <FileUpload
                                    onFileSelect={setSelectedFile}
                                    onFileRemove={() => setSelectedFile(null)}
                                    selectedFile={selectedFile}
                                    uploading={isPending}
                                    error={uploadError || undefined}
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                                Cancel
                            </Button>
                            <FormSubmitButton pendingText="Creating...">
                                Create Budget
                            </FormSubmitButton>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
