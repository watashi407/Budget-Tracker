import { useActionState, useState } from 'react'
import type { CreateTransactionInput } from '@/domain/entities/Transaction'
import { Button } from '@/presentation/components/ui/button'
import { Label } from '@/presentation/components/ui/label'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog'
import { FormSubmitButton } from '@/presentation/components/FormSubmitButton'
import { EmailVerificationMessage } from '@/presentation/components/EmailVerificationMessage'
import { FileUpload } from '@/presentation/components/FileUpload'
import { useTransactions } from '@/presentation/hooks/useTransactions'
import { useBudgets } from '@/presentation/hooks/useBudgets'
import { useCurrency } from '@/presentation/context/CurrencyContext'
import { useAuth } from '@/presentation/context/AuthContext'
import { storageService } from '@/data/services/SupabaseStorageService'
import { FormField } from '@/presentation/components/FormField'
import { useToast } from '@/presentation/components/ui/use-toast'
import { AlertCircle, Paperclip } from 'lucide-react'
import { AIScannerButton } from '@/presentation/components/AIScannerButton'
import type { ScanReceiptResult } from '@/data/services/GeminiAIService'

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

interface FieldErrors {
    amount?: string
    category?: string
    description?: string
    date?: string
}

export function CreateTransactionDialog({ open, onOpenChange, defaultBudgetId }: CreateTransactionDialogProps) {
    const { user } = useAuth()
    const { createTransaction } = useTransactions()
    const { budgets } = useBudgets()
    const { currency, availableCurrencies } = useCurrency()
    const { toast } = useToast()

    const activeCurrency = availableCurrencies.find(c => c.code === currency)
    const isEmailVerified = user?.emailVerified

    // Form state
    const [type, setType] = useState<'income' | 'expense'>('expense')
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('')
    const [description, setDescription] = useState('')
    const [budgetId, setBudgetId] = useState(defaultBudgetId || '')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    // File attachment state
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)

    // Field-level errors
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

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

            const input: CreateTransactionInput = {
                type,
                amount: parsedAmount,
                category,
                description,
                budgetId: budgetId && budgetId !== "none" ? budgetId : undefined,
                date: new Date(dateStr),
            }

            const transaction = await createTransaction(input)

            // Upload file attachment if selected
            if (selectedFile && transaction) {
                try {
                    await storageService.uploadAttachment({
                        file: selectedFile,
                        entityType: 'transaction',
                        entityId: transaction.id,
                    })
                } catch (uploadErr) {
                    console.error('Failed to upload attachment:', uploadErr)
                    // Don't fail the whole transaction for attachment error
                }
            }

            // Reset form
            setType('expense')
            setAmount('')
            setCategory('')
            setDescription('')
            setBudgetId('')
            setDate(new Date().toISOString().split('T')[0])
            setSelectedFile(null)
            setUploadError(null)
            setFieldErrors({})
            onOpenChange(false)

            // Show success toast
            toast({
                title: "Transaction created",
                description: `${type === 'income' ? 'Income' : 'Expense'} of ${activeCurrency?.symbol || '$'}${parsedAmount.toFixed(2)} added successfully.`,
            })

            return { success: true, error: null }
        } catch (err: unknown) {
            console.error('[CreateTransaction] Error:', err)
            const message = err instanceof Error ? err.message : 'Failed to create transaction'
            return { success: false, error: message }
        }
    }, { success: false, error: null })

    /**
     * Handle AI scan result and populate form fields
     */
    const handleScanResult = (result: ScanReceiptResult) => {
        // Auto-fill amount
        if (result.amount !== undefined) {
            setAmount(result.amount.toString())
        }
        // Auto-fill category
        if (result.category) {
            setCategory(result.category)
        }
        // Auto-fill description (use merchant name + raw text if available)
        if (result.description) {
            setDescription(result.description)
        } else if (result.merchantName) {
            setDescription(`Purchase at ${result.merchantName}`)
        }
        // Auto-fill date
        if (result.date) {
            setDate(result.date)
        }
        // Auto-fill type
        if (result.type) {
            setType(result.type)
        }
        // Clear field errors for auto-filled fields
        setFieldErrors({})
    }

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
                    <div className="flex items-center justify-between">
                        <DialogTitle>Add Transaction</DialogTitle>
                        <AIScannerButton
                            mode="transaction"
                            onScanComplete={(result) => handleScanResult(result as ScanReceiptResult)}
                            disabled={isPending || !isEmailVerified}
                        />
                    </div>
                    <DialogDescription>
                        Record a new income or expense transaction. Use AI to scan receipts.
                    </DialogDescription>
                </DialogHeader>

                {!isEmailVerified ? (
                    <EmailVerificationMessage
                        onClose={() => onOpenChange(false)}
                        actionName="creating transactions"
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
                                <FormField
                                    label={`Amount (${activeCurrency?.symbol})`}
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

                                <FormField
                                    label="Date"
                                    name="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    onBlur={(e) => handleBlur('date', e.target.value)}
                                    required
                                    disabled={isPending}
                                    error={fieldErrors.date}
                                />
                            </div>

                            <FormField
                                label="Category"
                                name="category"
                                placeholder="e.g., Food, Salary, Rent"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                onBlur={(e) => handleBlur('category', e.target.value)}
                                required
                                disabled={isPending}
                                error={fieldErrors.category}
                            />

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
                            <FormSubmitButton pendingText="Adding...">
                                Add Transaction
                            </FormSubmitButton>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
