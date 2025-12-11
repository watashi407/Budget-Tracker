import { createGemini } from '@tanstack/ai-gemini'
import { chat } from '@tanstack/ai'
import type { Budget } from '@/domain/entities/Budget'
import type { Transaction } from '@/domain/entities/Transaction'

/**
 * GeminiAIService
 * Service for interacting with Google's Gemini AI for budget insights and forecasting.
 * Refactored to use TanStack AI.
 */
class GeminiAIService {
    private gemini: ReturnType<typeof createGemini> | null = null

    constructor() {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY
        if (apiKey) {
            this.gemini = createGemini(apiKey)
        }
    }

    /**
     * Check if AI service is available
     */
    isAvailable(): boolean {
        return this.gemini !== null
    }

    /**
     * Get budget insights based on current budgets and transactions
     */
    async getBudgetInsights(budgets: Budget[], transactions: Transaction[]): Promise<string> {
        if (!this.gemini) {
            throw new Error('Gemini API key not configured')
        }

        const prompt = this.buildInsightsPrompt(budgets, transactions)

        try {
            const response = await chat({
                adapter: this.gemini,
                model: 'gemini-2.0-flash',
                messages: [{ role: 'user', content: prompt }]
            })

            return this.collectResponse(response)
        } catch (error) {
            console.error('Error getting budget insights:', error)
            throw new Error('Failed to get AI insights')
        }
    }

    /**
     * Get spending forecast based on historical data
     */
    async getSpendingForecast(budgets: Budget[], transactions: Transaction[]): Promise<string> {
        if (!this.gemini) {
            throw new Error('Gemini API key not configured')
        }

        const prompt = this.buildForecastPrompt(budgets, transactions)

        try {
            const response = await chat({
                adapter: this.gemini,
                model: 'gemini-2.0-flash',
                messages: [{ role: 'user', content: prompt }]
            })

            return this.collectResponse(response)
        } catch (error) {
            console.error('Error getting spending forecast:', error)
            throw new Error('Failed to get spending forecast')
        }
    }

    /**
     * Chat with AI about budget questions
     */
    async chat(message: string, budgets: Budget[], transactions: Transaction[]): Promise<string> {
        if (!this.gemini) {
            throw new Error('Gemini API key not configured')
        }

        const context = this.buildContextPrompt(budgets, transactions)
        // TanStack AI handles system messages, but for now passing as user message context is safe
        const messages = [
            { role: 'system', content: context },
            { role: 'user', content: message }
        ]

        try {
            const response = await chat({
                adapter: this.gemini,
                model: 'gemini-2.0-flash',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                messages: messages as any // Cast for role 'system' if strictly typed
            })

            return this.collectResponse(response)
        } catch (error) {
            console.error('Error in AI chat:', error)
            throw new Error('Failed to get AI response')
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async collectResponse(stream: any): Promise<string> {
        let text = ''
        for await (const chunk of stream) {
            if (typeof chunk === 'string') {
                text += chunk
            } else if (typeof chunk === 'object' && chunk !== null) {
                if ('content' in chunk && chunk.content) {
                    text += chunk.content
                } else if ('delta' in chunk && chunk.delta) {
                    // some adapters use delta
                    text += chunk.delta
                }
            }
        }
        return text
    }

    /**
     * Build context prompt with budget and transaction data
     */
    private buildContextPrompt(budgets: Budget[], transactions: Transaction[]): string {
        const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
        const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

        return `You are a financial advisor assistant helping users manage their budgets.

Current Budget Summary:
- Total Budget: $${totalBudget.toFixed(2)}
- Total Spent: $${totalSpent.toFixed(2)}
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}

Active Budgets (${budgets.length}):
${budgets.map(b => `- ${b.name} (${b.category}): $${b.spent.toFixed(2)} / $${b.amount.toFixed(2)} (${b.period})`).join('\n')}

Recent Transactions (${transactions.length}):
${transactions.slice(0, 10).map(t => `- ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)} - ${t.description} (${t.category})`).join('\n')}`
    }

    /**
     * Build insights prompt
     */
    private buildInsightsPrompt(budgets: Budget[], transactions: Transaction[]): string {
        const context = this.buildContextPrompt(budgets, transactions)

        return `${context}

Based on this financial data, provide 3-5 key insights about the user's spending habits and budget health. Be specific, actionable, and concise. Format your response as bullet points.`
    }

    /**
     * Build forecast prompt
     */
    private buildForecastPrompt(budgets: Budget[], transactions: Transaction[]): string {
        const context = this.buildContextPrompt(budgets, transactions)

        return `${context}

Based on the current spending patterns and budget allocations, provide a forecast for the next month. Include:
1. Projected spending by category
2. Potential budget overruns
3. Recommendations to stay on track

Be specific and data-driven. Format your response clearly.`
    }
}

// Export singleton instance
export const geminiAIService = new GeminiAIService()
