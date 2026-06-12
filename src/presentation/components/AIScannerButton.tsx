import { useState, useRef, useCallback } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { geminiAIService, type ScanReceiptResult, type ScanBudgetResult } from '@/data/services/GeminiAIService'
import { useAIConfiguration } from '@/presentation/hooks/useAIConfiguration'
import { Scan, Loader2, AlertCircle, CheckCircle2, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/presentation/components/ui/use-toast'

/**
 * Accepted image types for scanning
 */
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

interface AIScannerButtonProps {
    /** Mode determines which scan method to use */
    mode: 'transaction' | 'budget'
    /** Callback when scan completes successfully */
    onScanComplete: (result: ScanReceiptResult | ScanBudgetResult) => void
    /** Whether the button is disabled */
    disabled?: boolean
    /** Additional CSS classes */
    className?: string
}

/**
 * AIScannerButton Component
 * A reusable button that triggers AI-powered document/receipt scanning.
 * 
 * Features:
 * - Image file selection via click or camera capture
 * - Visual scanning animation during processing
 * - Confidence-based feedback
 * - Error handling with toast notifications
 * 
 * Part of the Presentation layer in Clean Architecture.
 */
export function AIScannerButton({
    mode,
    onScanComplete,
    disabled = false,
    className,
}: AIScannerButtonProps) {
    const [isScanning, setIsScanning] = useState(false)
    const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()
    const aiConfiguration = useAIConfiguration()

    const isAIAvailable = aiConfiguration.hasKey

    /**
     * Validate the selected image file
     */
    const validateImage = useCallback((file: File): { valid: boolean; error?: string } => {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            return { valid: false, error: 'Please select a valid image (JPEG, PNG, WebP, or GIF)' }
        }
        if (file.size > MAX_IMAGE_SIZE) {
            return { valid: false, error: 'Image size must be less than 10MB' }
        }
        return { valid: true }
    }, [])

    /**
     * Handle file selection and trigger scanning
     */
    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }

        // Validate file
        const validation = validateImage(file)
        if (!validation.valid) {
            toast({
                title: 'Invalid Image',
                description: validation.error,
                variant: 'destructive',
            })
            return
        }

        // Start scanning
        setIsScanning(true)
        setScanStatus('scanning')

        try {
            let result: ScanReceiptResult | ScanBudgetResult

            if (mode === 'transaction') {
                result = await geminiAIService.scanReceipt(file)
            } else {
                result = await geminiAIService.scanBudgetDocument(file)
            }

            // Check confidence level
            if (result.confidence < 30) {
                toast({
                    title: 'Low Confidence Scan',
                    description: 'The AI had difficulty extracting data from this image. Please verify the results.',
                })
            } else if (result.confidence >= 70) {
                toast({
                    title: 'Scan Complete',
                    description: `Successfully extracted data with ${result.confidence}% confidence.`,
                })
            } else {
                toast({
                    title: 'Scan Complete',
                    description: 'Data extracted. Please review and adjust as needed.',
                })
            }

            setScanStatus('success')
            onScanComplete(result)

            // Reset status after animation
            setTimeout(() => setScanStatus('idle'), 2000)
        } catch (error) {
            console.error('Scan error:', error)
            setScanStatus('error')
            toast({
                title: 'Scan Failed',
                description: error instanceof Error ? error.message : 'Failed to scan document',
                variant: 'destructive',
            })

            // Reset status after animation
            setTimeout(() => setScanStatus('idle'), 2000)
        } finally {
            setIsScanning(false)
        }
    }, [mode, onScanComplete, toast, validateImage])

    /**
     * Trigger file selection dialog
     */
    const handleClick = useCallback(() => {
        if (!isAIAvailable) {
            toast({
                title: 'AI Not Available',
                description: 'Add an AI API token in Settings to use AI scanning.',
            })
            return
        }
        if (!disabled && !isScanning) {
            fileInputRef.current?.click()
        }
    }, [disabled, isScanning, isAIAvailable, toast])

    /**
     * Get button icon based on current status
     */
    const getIcon = () => {
        switch (scanStatus) {
            case 'scanning':
                return <Loader2 className="w-4 h-4 animate-spin" />
            case 'success':
                return <CheckCircle2 className="w-4 h-4 text-green-500" />
            case 'error':
                return <AlertCircle className="w-4 h-4 text-destructive" />
            default:
                return <Scan className="w-4 h-4" />
        }
    }

    /**
     * Get button text based on current status
     */
    const getButtonText = () => {
        switch (scanStatus) {
            case 'scanning':
                return 'Scanning...'
            case 'success':
                return 'Scanned!'
            case 'error':
                return 'Retry'
            default:
                return mode === 'transaction' ? 'Scan Receipt' : 'Scan Document'
        }
    }

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
                disabled={disabled || isScanning}
            />
            <Button
                type="button"
                variant={scanStatus === 'success' ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleClick}
                disabled={disabled || isScanning || !isAIAvailable}
                className={cn(
                    'gap-2 transition-all duration-200',
                    scanStatus === 'scanning' && 'border-primary/50 animate-pulse',
                    scanStatus === 'success' && 'border-green-500/50 bg-green-500/10',
                    scanStatus === 'error' && 'border-destructive/50',
                    !isAIAvailable && 'opacity-50',
                    className
                )}
            >
                {getIcon()}
                <span className="hidden sm:inline">{getButtonText()}</span>
                <Camera className="w-3.5 h-3.5 sm:hidden" />
            </Button>
        </>
    )
}
