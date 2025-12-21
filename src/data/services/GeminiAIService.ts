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

        const financialData = this.buildContextPrompt(budgets, transactions)

        // Build a combined prompt that won't cause echoing
        const combinedPrompt = `You are a helpful budget assistant for the Watashi Pocket app. Respond directly to the user's message.

For greetings like "hi", "hello", "hey" - respond with a friendly, brief greeting (1-2 sentences max).
For budget questions - use the financial data below to provide helpful insights.

${financialData}

User says: "${message}"

Respond naturally and directly (do not explain what you will do, just do it):`

        try {
            const response = await chat({
                adapter: this.gemini,
                model: 'gemini-2.0-flash',
                messages: [{ role: 'user', content: combinedPrompt }]
            })

            return this.collectResponse(response)
        } catch (error: any) {
            console.error('Error in AI chat:', error)
            if (error.status) console.error('Status:', error.status);
            if (error.statusText) console.error('StatusText:', error.statusText);
            if (error.errorDetails) console.error('Details:', error.errorDetails);

            throw new Error(`Failed to get AI response: ${error.message || 'Unknown error'}`)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async collectResponse(stream: any): Promise<string> {
        let text = ''
        for await (const chunk of stream) {
            if (typeof chunk === 'string') {
                text += chunk
            } else if (typeof chunk === 'object' && chunk !== null) {
                // Only use one content source per chunk to avoid duplicates
                if ('delta' in chunk && chunk.delta) {
                    // Prefer delta for streaming responses
                    text += chunk.delta
                } else if ('content' in chunk && chunk.content && !('delta' in chunk)) {
                    // Use content only if delta is not present
                    text += chunk.content
                } else if ('text' in chunk && chunk.text) {
                    // Some adapters use 'text' field
                    text += chunk.text
                }
            }
        }
        return text.trim()
    }

    /**
     * Build context prompt with budget and transaction data
     */
    private buildContextPrompt(budgets: Budget[], transactions: Transaction[]): string {
        const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
        const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

        // Only include budget details if there are budgets
        const budgetDetails = budgets.length > 0
            ? `\nBudgets: ${budgets.slice(0, 5).map(b => `${b.name}: $${b.spent.toFixed(0)}/$${b.amount.toFixed(0)}`).join(', ')}`
            : ''

        // Only include transaction details if there are transactions
        const transactionDetails = transactions.length > 0
            ? `\nRecent: ${transactions.slice(0, 5).map(t => `${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(0)} ${t.category}`).join(', ')}`
            : ''

        return `FINANCIAL DATA:
Total Budget: $${totalBudget.toFixed(2)}, Spent: $${totalSpent.toFixed(2)}
Income: $${totalIncome.toFixed(2)}, Expenses: $${totalExpenses.toFixed(2)}${budgetDetails}${transactionDetails}`
    }

    /**
     * Build insights prompt
     */
    private buildInsightsPrompt(budgets: Budget[], transactions: Transaction[]): string {
        const context = this.buildContextPrompt(budgets, transactions)

        return `Analyze this financial data and provide spending insights:

${context}

Generate 3-5 key insights with:
1. **Bold key findings** for each insight
2. Specific dollar amounts and percentages
3. Actionable recommendations

Be data-driven and concise. Start your response with the first insight:`
    }

    /**
     * Build forecast prompt
     */
    private buildForecastPrompt(budgets: Budget[], transactions: Transaction[]): string {
        const context = this.buildContextPrompt(budgets, transactions)

        return `Analyze this financial data and provide a spending forecast:

${context}

Generate a forecast report with:
1. **Summary**: Key predictions for next month (2-3 sentences)
2. **Projected Spending**: Estimated amounts by category
3. **⚠️ Warnings**: Any potential budget overruns
4. **Recommendations**: 2-3 actionable tips to stay on track

Use specific dollar amounts. Be concise and helpful. Start your response with the summary:`
    }
}

// Export singleton instance
export const geminiAIService = new GeminiAIService()
