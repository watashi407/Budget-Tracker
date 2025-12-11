import { useActionState, useState, useEffect } from 'react'
import type { Budget, UpdateBudgetInput } from '@/domain/entities/Budget'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog'
import { useBudgets } from '@/presentation/hooks/useBudgets'

interface EditBudgetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    budget: Budget | null
}

export function EditBudgetDialog({ open, onOpenChange, budget }: EditBudgetDialogProps) {
    const { updateBudget } = useBudgets()

    const [name, setName] = useState('')
    const [category, setCategory] = useState('')
    const [amount, setAmount] = useState('')
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
    const [color, setColor] = useState('#3b82f6')

    // Initialize form when budget changes
    useEffect(() => {
        if (budget) {
            setName(budget.name)
            setCategory(budget.category)
            setAmount(budget.amount.toString())
            setPeriod(budget.period)
            setColor(budget.color || '#3b82f6')
        }
    }, [budget])

    const [state, formAction, isPending] = useActionState(async (_prevState: any, formData: FormData) => {
        if (!budget) return { success: false, error: 'No budget selected' }

        try {
            const name = formData.get('name') as string
            const category = formData.get('category') as string
            const amountStr = formData.get('amount') as string
            const period = formData.get('period') as 'daily' | 'weekly' | 'monthly' | 'yearly'
            const color = formData.get('color') as string

            const parsedAmount = parseFloat(amountStr)
            if (isNaN(parsedAmount) || parsedAmount < 0) {
                throw new Error('Please enter a valid amount')
            }

            const input: UpdateBudgetInput = {
                name,
                category,
                amount: parsedAmount,
                period,
                color,
            }

            await updateBudget(budget.id, input)

            onOpenChange(false)
            return { success: true, error: null }
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Failed to update budget' }
        }
    }, { success: false, error: null })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Budget</DialogTitle>
                    <DialogDescription>
                        Modify your budget details.
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
                            <Label htmlFor="edit-name">Budget Name</Label>
                            <Input
                                id="edit-name"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-category">Category</Label>
                            <Input
                                id="edit-category"
                                name="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                required
                                disabled={isPending}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-amount">Amount</Label>
                                <Input
                                    id="edit-amount"
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    disabled={isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-period">Period</Label>
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
                            <Label htmlFor="edit-color">Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="edit-color"
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
                            {isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
