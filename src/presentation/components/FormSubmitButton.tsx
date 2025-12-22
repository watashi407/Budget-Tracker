import { useFormStatus } from 'react-dom'
import { Button, type ButtonProps } from '@/presentation/components/ui/button'
import { Loader2 } from 'lucide-react'

/**
 * FormSubmitButton - React 19 useFormStatus pattern
 * Automatically tracks form pending state without prop drilling.
 * Must be used inside a <form> element.
 */
interface FormSubmitButtonProps extends Omit<ButtonProps, 'type'> {
    pendingText?: string
    children: React.ReactNode
}

export function FormSubmitButton({
    pendingText = 'Saving...',
    children,
    disabled,
    ...props
}: FormSubmitButtonProps) {
    const { pending } = useFormStatus()

    return (
        <Button type="submit" disabled={pending || disabled} {...props}>
            {pending ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {pendingText}
                </>
            ) : (
                children
            )}
        </Button>
    )
}
