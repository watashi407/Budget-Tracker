import { createContext, useContext, useState, type ReactNode } from 'react'
import { CreateTransactionDialog } from '@/presentation/components/CreateTransactionDialog'
import { CreateBudgetDialog } from '@/presentation/components/CreateBudgetDialog'
import { AIInsightsDialog } from '@/presentation/components/AIInsightsDialog'

interface GlobalActionsContextType {
    openTransactionDialog: () => void
    openBudgetDialog: () => void
    openAiDialog: () => void
}

const GlobalActionsContext = createContext<GlobalActionsContextType | undefined>(undefined)

export function useGlobalActions() {
    const context = useContext(GlobalActionsContext)
    if (!context) {
        throw new Error('useGlobalActions must be used within a GlobalActionsProvider')
    }
    return context
}

export function GlobalActionsProvider({ children }: { children: ReactNode }) {
    const [isTransactionOpen, setIsTransactionOpen] = useState(false)
    const [isBudgetOpen, setIsBudgetOpen] = useState(false)
    const [isAiOpen, setIsAiOpen] = useState(false)

    // Helper functions to open dialogs
    const openTransactionDialog = () => setIsTransactionOpen(true)
    const openBudgetDialog = () => setIsBudgetOpen(true)
    const openAiDialog = () => setIsAiOpen(true)

    return (
        <GlobalActionsContext.Provider
            value={{
                openTransactionDialog,
                openBudgetDialog,
                openAiDialog,
            }}
        >
            {children}

            {/* Global Dialogs */}
            <CreateTransactionDialog
                open={isTransactionOpen}
                onOpenChange={setIsTransactionOpen}
            />
            <CreateBudgetDialog
                open={isBudgetOpen}
                onOpenChange={setIsBudgetOpen}
            />
            <AIInsightsDialog
                open={isAiOpen}
                onOpenChange={setIsAiOpen}
            />
        </GlobalActionsContext.Provider>
    )
}
