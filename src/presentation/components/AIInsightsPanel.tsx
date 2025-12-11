import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Badge } from '@/presentation/components/ui/badge'
import { Separator } from '@/presentation/components/ui/separator'
import { geminiAIService } from '@/data/services/GeminiAIService'
import { useBudgets } from '@/presentation/hooks/useBudgets'
import { useTransactions } from '@/presentation/hooks/useTransactions'
import { Sparkles, Send, TrendingUp, AlertCircle } from 'lucide-react'

/**
 * AIInsightsPanel Component
 * Displays AI-powered budget insights, forecasts, and chat interface.
 * Part of the Presentation layer in Clean Architecture.
 */
export function AIInsightsPanel() {
    const { budgets } = useBudgets()
    const { transactions } = useTransactions()

    const [insights, setInsights] = useState<string>('')
    const [forecast, setForecast] = useState<string>('')
    const [chatMessage, setChatMessage] = useState('')
    const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai', message: string }>>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const isAIAvailable = geminiAIService.isAvailable()

    /**
     * Get budget insights from AI
     */
    async function getInsights() {
        setLoading(true)
        setError('')

        try {
            const result = await geminiAIService.getBudgetInsights(budgets, transactions)
            setInsights(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get insights')
        } finally {
            setLoading(false)
        }
    }


    /**
     * Get spending forecast from AI
     */
    async function getForecast() {
        setLoading(true)
        setError('')

        try {
            const result = await geminiAIService.getSpendingForecast(budgets, transactions)
            setForecast(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get forecast')
        } finally {
            setLoading(false)
        }
    }

    /**
     * Send chat message to AI
     */
    async function sendChatMessage() {
        if (!chatMessage.trim()) return

        const userMessage = chatMessage
        setChatMessage('')
        setChatHistory(prev => [...prev, { role: 'user', message: userMessage }])
        setLoading(true)
        setError('')

        try {
            const result = await geminiAIService.chat(userMessage, budgets, transactions)
            setChatHistory(prev => [...prev, { role: 'ai', message: result }])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get AI response')
        } finally {
            setLoading(false)
        }
    }

    if (!isAIAvailable) {
        return (
            <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        AI Budget Assistant
                    </CardTitle>
                    <CardDescription>Get personalized insights and forecasts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-yellow-500">Gemini API Key Required</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Add your Gemini API key to the <code className="bg-black/20 px-1 rounded">.env</code> file to enable AI features.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        AI Budget Assistant
                    </CardTitle>
                    <CardDescription>Get personalized insights and forecasts powered by Gemini AI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                        <Button onClick={getInsights} disabled={loading} className="gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Get Insights
                        </Button>
                        <Button onClick={getForecast} disabled={loading} variant="outline" className="gap-2">
                            <Sparkles className="w-4 h-4" />
                            Get Forecast
                        </Button>
                    </div>

                    {/* Insights Display */}
                    {insights && (
                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="border-purple-500/50 text-purple-500">
                                    Insights
                                </Badge>
                            </div>
                            <div className="text-sm whitespace-pre-wrap">{insights}</div>
                        </div>
                    )}

                    {/* Forecast Display */}
                    {forecast && (
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="border-blue-500/50 text-blue-500">
                                    Forecast
                                </Badge>
                            </div>
                            <div className="text-sm whitespace-pre-wrap">{forecast}</div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Chat Interface */}
            <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                    <CardTitle className="text-lg">Ask AI About Your Budget</CardTitle>
                    <CardDescription>Chat with AI to get personalized advice</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Chat History */}
                    {chatHistory.length > 0 && (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {chatHistory.map((chat, index) => (
                                <div
                                    key={index}
                                    className={`p-3 rounded-lg ${chat.role === 'user'
                                        ? 'bg-primary/10 ml-8'
                                        : 'bg-muted mr-8'
                                        }`}
                                >
                                    <p className="text-xs font-medium mb-1 text-muted-foreground">
                                        {chat.role === 'user' ? 'You' : 'AI Assistant'}
                                    </p>
                                    <p className="text-sm whitespace-pre-wrap">{chat.message}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {chatHistory.length > 0 && <Separator />}

                    {/* Chat Input */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Ask about your budget, spending patterns, or get advice..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                            disabled={loading}
                        />
                        <Button onClick={sendChatMessage} disabled={loading || !chatMessage.trim()} size="icon">
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
