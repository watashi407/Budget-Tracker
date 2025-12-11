import { useActionState, useState } from 'react'
import type { CreateBudgetInput } from '@/domain/entities/Budget'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog'
import { useBudgets } from '@/presentation/hooks/useBudgets'

/**
 * CreateBudgetDialog Component
 * Modal dialog for creating a new budget with form validation.
 * Part of the Presentation layer in Clean Architecture.
 */
interface CreateBudgetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateBudgetDialog({ open, onOpenChange }: CreateBudgetDialogProps) {
    const { createBudget } = useBudgets()

    // Form state for controlled inputs (optional, but useful for immediate feedback or complex UI)
    // We can rely on FormData for submission, but keeping state for controlled inputs is fine too.
    // To fully leverage Actions, we could make inputs uncontrolled, but let's keep it simple for now
    // and just ensure name attributes are present.
    const [name, setName] = useState('')
    const [category, setCategory] = useState('')
    const [amount, setAmount] = useState('')
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
    const [color, setColor] = useState('#3b82f6')

    const [state, formAction, isPending] = useActionState(async (_prevState: any, formData: FormData) => {
        console.log('[CreateBudgetDialog] Submitting form via Action...')

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
            if (isNaN(parsedAmount) || parsedAmount < 0) {
                throw new Error('Please enter a valid amount')
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

            console.log('[CreateBudgetDialog] Calling createBudget...')
            await createBudget(input)
            console.log('[CreateBudgetDialog] createBudget resolved. Closing dialog.')

            // Reset form (optional if we are closing)
            setName('')
            setCategory('')
            setAmount('')
            setPeriod('monthly')
            setColor('#3b82f6')
            onOpenChange(false)
            return { success: true, error: null }
        } catch (err) {
            console.error('[CreateBudgetDialog] Error:', err)
            return { success: false, error: err instanceof Error ? err.message : 'Failed to create budget' }
        }
    }, { success: false, error: null })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Budget</DialogTitle>
                    <DialogDescription>
                        Set up a new budget to track your spending in a specific category.
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
                            <Label htmlFor="name">Budget Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g., Groceries, Entertainment"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input
                                id="category"
                                name="category"
                                placeholder="e.g., Food, Transportation"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                required
                                disabled={isPending}
                            />
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
                                <Label htmlFor="period">Period</Label>
                                <Select
                                    name="period"
                                    value={period}
                                    onValueChange={(value: any) => setPeriod(value)}
                                    disabled={isPending}
                                >
                                    <SelectTrigger>
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
                            <div className="flex gap-2">
                                <Input
                                    id="color"
                                    name="color"
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-20 h-10"
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
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Creating...' : 'Create Budget'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
