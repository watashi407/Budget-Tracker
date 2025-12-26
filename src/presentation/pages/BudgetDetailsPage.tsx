import { useParams, Link } from '@tanstack/react-router'
import { useBudget } from '@/presentation/hooks/useBudgets'
import { TransactionList } from '@/presentation/components/TransactionList'
import { Button } from '@/presentation/components/ui/button'
import { ArrowLeft, Wallet, Calendar, TrendingUp, PlusCircle, Paperclip, ChevronDown, ChevronUp, Upload, AlertCircle } from 'lucide-react'
import { CreateTransactionDialog } from '@/presentation/components/CreateTransactionDialog'
import { FileUpload } from '@/presentation/components/FileUpload'
import { AttachmentList } from '@/presentation/components/AttachmentList'
import { useAttachments } from '@/presentation/hooks/useAttachments'
import { useState } from 'react'
import { useCurrency } from '@/presentation/context/CurrencyContext'

export function BudgetDetailsPage() {
    const { budgetId } = useParams({ from: '/budgets/$budgetId' })
    const { data: budget, isLoading, error } = useBudget(budgetId)
    const { formatCurrency } = useCurrency()
    const [showTransactionDialog, setShowTransactionDialog] = useState(false)
    const [showAttachments, setShowAttachments] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const {
        attachments,
        loading: attachmentsLoading,
        uploading,
        deletingIds,
        error: attachmentError,
        uploadAttachment,
        deleteAttachment,
    } = useAttachments('budget', budgetId)

    const handleUpload = async () => {
        console.log('BudgetDetailsPage: Upload button clicked') // Debug log
        if (!selectedFile) {
            console.log('BudgetDetailsPage: No file selected')
            return
        }

        console.log('BudgetDetailsPage: Starting upload for', selectedFile.name)
        const result = await uploadAttachment(selectedFile)
        console.log('BudgetDetailsPage: Upload result:', result)

        if (result) {
            console.log('BudgetDetailsPage: Upload successful')
            setSelectedFile(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    if (error || !budget) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <h2 className="text-xl font-bold text-destructive">Budget Not Found</h2>
                <Link to="/dashboard">
                    <Button variant="outline">Return to Dashboard</Button>
                </Link>
            </div>
        )
    }

    const percentSpent = Math.min((budget.spent / budget.amount) * 100, 100)
    const isOverBudget = budget.spent > budget.amount
    const remaining = budget.amount - budget.spent

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors w-fit">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>

                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div
                                className="h-12 w-12 rounded-xl flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: `${budget.color || 'hsl(var(--primary))'}20`, color: budget.color || 'hsl(var(--primary))' }}
                            >
                                <Wallet className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">{budget.name}</h1>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-primary" />
                                        {budget.category}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button onClick={() => setShowTransactionDialog(true)} className="gap-2">
                        <PlusCircle className="w-4 h-4" />
                        Add Transaction
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="p-6 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Budget</p>
                    <p className="text-2xl font-bold mt-2 text-foreground">{formatCurrency(budget.amount)}</p>
                </div>
                <div className="p-6 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spent</p>
                    <p className={`text-2xl font-bold mt-2 ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
                        {formatCurrency(budget.spent)}
                    </p>
                    <div className="mt-3 h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${percentSpent}%` }}
                        />
                    </div>
                </div>
                <div className="p-6 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Remaining</p>
                    <p className={`text-2xl font-bold mt-2 ${remaining < 0 ? 'text-destructive' : 'text-success'}`}>
                        {formatCurrency(remaining)}
                    </p>
                </div>
            </div>

            {/* Transactions */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Transaction History
                </h2>
                <TransactionList budgetId={budget.id} />
            </div>

            {/* Attachments Section */}
            <div className="rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm overflow-hidden">
                <button
                    onClick={() => setShowAttachments(!showAttachments)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Paperclip className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-foreground">Attachments</span>
                        {attachments.length > 0 && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {attachments.length}
                            </span>
                        )}
                    </div>
                    {showAttachments ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                </button>

                {showAttachments && (
                    <div className="p-4 pt-0 space-y-4 border-t border-border/50">
                        {/* Error Display */}
                        {attachmentError && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {attachmentError}
                            </div>
                        )}

                        {/* Upload Section */}
                        <div className="space-y-2">
                            <FileUpload
                                onFileSelect={setSelectedFile}
                                onFileRemove={() => setSelectedFile(null)}
                                selectedFile={selectedFile}
                                uploading={uploading}
                            />
                            {selectedFile && (
                                <div className="flex justify-end mt-4">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('BudgetDetailsPage: Native button clicked');
                                            handleUpload();
                                        }}
                                        disabled={uploading}
                                        style={{ pointerEvents: 'auto' }}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        <Upload className="w-4 h-4" style={{ pointerEvents: 'none' }} />
                                        {uploading ? 'Uploading...' : 'Upload File'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Attachment List */}
                        <AttachmentList
                            attachments={attachments}
                            onDelete={deleteAttachment}
                            loading={attachmentsLoading}
                            deletingIds={deletingIds}
                        />
                    </div>
                )}
            </div>

            <CreateTransactionDialog
                open={showTransactionDialog}
                onOpenChange={setShowTransactionDialog}
                defaultBudgetId={budget.id}
            />
        </div>
    )
}
