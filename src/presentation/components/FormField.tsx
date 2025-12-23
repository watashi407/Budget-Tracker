import { useId } from 'react'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * FormField - React 19 useId pattern
 * Generates stable, unique IDs for form fields that are SSR-safe.
 */
interface FormFieldProps {
    label: string
    name: string
    type?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
    error?: string
    step?: string
    min?: string
    labelExtra?: React.ReactNode
    className?: string
}

export function FormField({
    label,
    name,
    type = 'text',
    placeholder,
    required,
    disabled,
    value,
    onChange,
    onBlur,
    error,
    step,
    min,
    labelExtra,
    className,
}: FormFieldProps) {
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
                name={name}
                type={type}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                step={step}
                min={min}
                className={cn(
                    error ? 'border-destructive focus-visible:ring-destructive' : '',
                    className
                )}
            />
            {error && (
                <p className="text-destructive text-xs flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </p>
            )}
        </div>
    )
}

