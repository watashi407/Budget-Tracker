import { createGemini } from '@tanstack/ai-gemini'
import { chat } from '@tanstack/ai'
import type { Budget } from '@/domain/entities/Budget'
import type { Transaction } from '@/domain/entities/Transaction'
import { aiApiKeyService, type AIProvider, type AIProviderConfig } from '@/data/services/AIApiKeyService'
import { supabase } from '@/lib/supabase'

/**
 * Result interface for receipt scanning
 * Contains extracted transaction data with confidence score
 */
export interface ScanReceiptResult {
    amount?: number
    category?: string
    description?: string
    date?: string
    type?: 'income' | 'expense'
    merchantName?: string
    confidence: number
    rawText?: string
}

/**
 * Result interface for budget document scanning
 * Contains extracted budget data with confidence score
 */
export interface ScanBudgetResult {
    name?: string
    category?: string
    amount?: number
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    confidence: number
    rawText?: string
}

/**
 * GeminiAIService
 * Service for interacting with configured AI providers for budget insights, forecasting, and document scanning.
 */
class GeminiAIService {
    /**
     * Check if AI service is available
     */
    isAvailable(): boolean {
        return aiApiKeyService.getStatus().hasKey
    }

    private getApiKey(provider?: AIProvider): string {
        const apiKey = aiApiKeyService.getApiKey(provider)
        if (!apiKey) {
            throw new Error('AI API key not configured')
        }
        return apiKey
    }

    private getGeminiAdapter(apiKey: string): ReturnType<typeof createGemini> {
        return createGemini(apiKey)
    }

    private getProviderConfig(): AIProviderConfig {
        const config = aiApiKeyService.getConfig()
        if (!config.apiKey) {
            throw new Error(`${config.provider === 'nvidia' ? 'NVIDIA' : 'Gemini'} API key not configured`)
        }

        return config
    }

    /**
     * Convert a File to base64 data and extract mime type for vision API
     */
    private async fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
                const dataUrl = reader.result as string
                // Extract base64 data from data URL (remove "data:image/png;base64," prefix)
                const base64Match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
                if (base64Match) {
                    resolve({ base64: base64Match[2], mimeType: base64Match[1] })
                } else {
                    reject(new Error('Invalid data URL format'))
                }
            }
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsDataURL(file)
        })
    }

    private async callTextAI(prompt: string): Promise<string> {
        const status = aiApiKeyService.getStatus()
        if (status.source === 'supabase') {
            return this.callSupabaseAI(prompt)
        }

        const config = this.getProviderConfig()

        if (config.provider === 'nvidia') {
            await this.migrateNvidiaTokenToSupabase(config)
            return this.callSupabaseAI(prompt)
        }

        const response = await chat({
            adapter: this.getGeminiAdapter(config.apiKey ?? this.getApiKey(config.provider)),
            model: 'gemini-2.0-flash',
            messages: [{ role: 'user', content: prompt }]
        })

        return this.collectResponse(response)
    }

    private async callVisionAI(prompt: string, base64Image: string, mimeType: string): Promise<string> {
        const status = aiApiKeyService.getStatus()
        if (status.source === 'supabase') {
            return this.callSupabaseAI(prompt, { base64: base64Image, mimeType })
        }

        const config = this.getProviderConfig()

        if (config.provider === 'nvidia') {
            await this.migrateNvidiaTokenToSupabase(config)
            return this.callSupabaseAI(prompt, { base64: base64Image, mimeType })
        }

        return this.callGeminiVisionAPI(prompt, base64Image, mimeType, config.apiKey ?? this.getApiKey(config.provider), config.visionModel)
    }

    private async migrateNvidiaTokenToSupabase(config: AIProviderConfig): Promise<void> {
        if (!config.apiKey) {
            throw new Error('NVIDIA API key not configured')
        }

        await aiApiKeyService.saveRemoteConfig({
            provider: 'nvidia',
            apiKey: config.apiKey,
            textModel: config.textModel,
            visionModel: config.visionModel,
        })
    }

    private async callSupabaseAI(prompt: string, image?: { base64: string; mimeType: string }): Promise<string> {
        const { data, error } = await supabase.functions.invoke<{ text: string }>('ai', {
            body: {
                action: 'chat',
                prompt,
                image,
            },
        })

        if (error) {
            throw new Error(error.message || 'Failed to call Supabase AI function')
        }

        if (!data?.text) {
            throw new Error('AI response was empty')
        }

        return data.text
    }

    /**
     * Call Gemini Vision API directly for multimodal content.
     * Uses the REST API since TanStack AI adapter has issues with multimodal.
     */
    private async callGeminiVisionAPI(
        prompt: string,
        base64Image: string,
        mimeType: string,
        apiKey: string,
        model: string
    ): Promise<string> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`

        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Image
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.4,
                topK: 32,
                topP: 1,
                maxOutputTokens: 1024,
            }
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Gemini Vision API error:', response.status, errorText)
            throw new Error(`Gemini API error: ${response.status}`)
        }

        const data = await response.json()

        // Extract text from response
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        return text
    }

    /**
     * Scan a receipt image and extract transaction data
     * Uses Gemini's vision capabilities via direct REST API
     */
    async scanReceipt(imageFile: File): Promise<ScanReceiptResult> {
        try {
            const { base64, mimeType } = await this.fileToBase64(imageFile)

            const prompt = `Analyze this receipt/document image and extract financial transaction data.

Return ONLY a valid JSON object with these fields (use null for fields you cannot determine):
{
    "amount": <number or null - the total amount/price>,
    "category": <string or null - categorize as one of: food, eating-out, transportation, utilities, healthcare, entertainment, shopping, groceries, personal-care, education, work, other>,
    "description": <string or null - brief description of the purchase/transaction>,
    "date": <string or null - date in YYYY-MM-DD format>,
    "type": <"income" or "expense" - determine if this is money received or spent>,
    "merchantName": <string or null - name of the store/merchant>,
    "confidence": <number 0-100 - how confident are you in this extraction>,
    "rawText": <string or null - key text visible on the receipt>
}

Important:
- Extract the TOTAL amount, not individual items
- If it's a receipt from a store, it's likely an "expense"
- If it's a payslip or deposit slip, it's likely "income"
- Be conservative with confidence - lower if image is unclear or data is ambiguous`

            const responseText = await this.callVisionAI(prompt, base64, mimeType)
            return this.parseReceiptResult(responseText)
        } catch (error) {
            console.error('Error scanning receipt:', error)
            throw new Error('Failed to scan receipt. Please try again.')
        }
    }

    /**
     * Scan a budget document/screenshot and extract budget data
     * Uses Gemini's vision capabilities via direct REST API
     */
    async scanBudgetDocument(imageFile: File): Promise<ScanBudgetResult> {
        try {
            const { base64, mimeType } = await this.fileToBase64(imageFile)

            const prompt = `Analyze this budget document/screenshot and extract budget planning data.

Return ONLY a valid JSON object with these fields (use null for fields you cannot determine):
{
    "name": <string or null - suggested budget name>,
    "category": <string or null - categorize as one of: housing, utilities, food, eating-out, transportation, healthcare, insurance, savings, debt, personal-care, clothing, entertainment, hobbies, education, work, software, family, gifts, donations, business, taxes, miscellaneous>,
    "amount": <number or null - the budget amount/limit>,
    "period": <"daily" or "weekly" or "monthly" or "yearly" or null - the budget period>,
    "confidence": <number 0-100 - how confident are you in this extraction>,
    "rawText": <string or null - key text visible in the document>
}

Important:
- Look for budget limits, spending caps, or allocation amounts
- The period might be indicated by words like "per month", "weekly", "annual"
- If you see a category breakdown, extract the most relevant/prominent one
- Be conservative with confidence - lower if the document is unclear`

            const responseText = await this.callVisionAI(prompt, base64, mimeType)
            return this.parseBudgetResult(responseText)
        } catch (error) {
            console.error('Error scanning budget document:', error)
            throw new Error('Failed to scan document. Please try again.')
        }
    }

    /**
     * Parse JSON response into ScanReceiptResult
     */
    private parseReceiptResult(responseText: string): ScanReceiptResult {
        try {
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                console.error('No JSON found in response:', responseText)
                return { confidence: 0 }
            }

            const parsed = JSON.parse(jsonMatch[0])
            return {
                amount: typeof parsed.amount === 'number' ? parsed.amount : undefined,
                category: typeof parsed.category === 'string' ? parsed.category : undefined,
                description: typeof parsed.description === 'string' ? parsed.description : undefined,
                date: typeof parsed.date === 'string' ? parsed.date : undefined,
                type: parsed.type === 'income' || parsed.type === 'expense' ? parsed.type : 'expense',
                merchantName: typeof parsed.merchantName === 'string' ? parsed.merchantName : undefined,
                confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 50,
                rawText: typeof parsed.rawText === 'string' ? parsed.rawText : undefined,
            }
        } catch (error) {
            console.error('Failed to parse receipt result:', error, responseText)
            return { confidence: 0 }
        }
    }

    /**
     * Parse JSON response into ScanBudgetResult
     */
    private parseBudgetResult(responseText: string): ScanBudgetResult {
        try {
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                console.error('No JSON found in response:', responseText)
                return { confidence: 0 }
            }

            const parsed = JSON.parse(jsonMatch[0])
            const validPeriods = ['daily', 'weekly', 'monthly', 'yearly']
            return {
                name: typeof parsed.name === 'string' ? parsed.name : undefined,
                category: typeof parsed.category === 'string' ? parsed.category : undefined,
                amount: typeof parsed.amount === 'number' ? parsed.amount : undefined,
                period: validPeriods.includes(parsed.period) ? parsed.period : undefined,
                confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 50,
                rawText: typeof parsed.rawText === 'string' ? parsed.rawText : undefined,
            }
        } catch (error) {
            console.error('Failed to parse budget result:', error, responseText)
            return { confidence: 0 }
        }
    }

    /**
     * Get budget insights based on current budgets and transactions
     */
    async getBudgetInsights(budgets: Budget[], transactions: Transaction[]): Promise<string> {
        const prompt = this.buildInsightsPrompt(budgets, transactions)

        try {
            return await this.callTextAI(prompt)
        } catch (error) {
            console.error('Error getting budget insights:', error)
            throw new Error('Failed to get AI insights')
        }
    }

    /**
     * Get spending forecast based on historical data
     */
    async getSpendingForecast(budgets: Budget[], transactions: Transaction[]): Promise<string> {
        const prompt = this.buildForecastPrompt(budgets, transactions)

        try {
            return await this.callTextAI(prompt)
        } catch (error) {
            console.error('Error getting spending forecast:', error)
            throw new Error('Failed to get spending forecast')
        }
    }

    /**
     * Chat with AI about budget questions
     */
    async chat(message: string, budgets: Budget[], transactions: Transaction[]): Promise<string> {
        const financialData = this.buildContextPrompt(budgets, transactions)

        // Build a combined prompt that won't cause echoing
        const combinedPrompt = `You are a helpful budget assistant for the Watashi Pocket app. Respond directly to the user's message.

For greetings like "hi", "hello", "hey" - respond with a friendly, brief greeting (1-2 sentences max).
For budget questions - use the financial data below to provide helpful insights.

${financialData}

User says: "${message}"

        Respond naturally and directly (do not explain what you will do, just do it):`

        try {
            return await this.callTextAI(combinedPrompt)
        } catch (error: unknown) {
            console.error('Error in AI chat:', error)
            const err = error as { status?: number; statusText?: string; errorDetails?: string; message?: string }
            if (err.status) console.error('Status:', err.status);
            if (err.statusText) console.error('StatusText:', err.statusText);
            if (err.errorDetails) console.error('Details:', err.errorDetails);

            throw new Error(`Failed to get AI response: ${err.message || 'Unknown error'}`)
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

