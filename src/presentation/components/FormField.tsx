import { forwardRef, useId } from 'react'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * FormField - React 19 useId pattern with forwardRef for react-hook-form compatibility
 * Generates stable, unique IDs for form fields that are SSR-safe.
 */
interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string
    error?: string
    labelExtra?: React.ReactNode
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
    { label, error, labelExtra, className, required, ...inputProps },
    ref
) {
    const id = useId() // Stable, SSR-safe unique ID

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label htmlFor={id} className="flex items-center gap-1">
                    {label}
                    {required && <span className="text-destructive">*</span>}
                </Label>
                {labelExtra}
            </div>
            <Input
                id={id}
                ref={ref}
                required={required}
                className={cn(
                    error ? 'border-destructive focus-visible:ring-destructive' : '',
                    className
                )}
                {...inputProps}
            />
            {error && (
                <p className="text-destructive text-xs flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </p>
            )}
        </div>
    )
})
