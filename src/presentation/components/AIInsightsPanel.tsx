import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Badge } from '@/presentation/components/ui/badge'
import { Separator } from '@/presentation/components/ui/separator'
import { geminiAIService } from '@/data/services/GeminiAIService'
import { useBudgets } from '@/presentation/hooks/useBudgets'
import { useTransactions } from '@/presentation/hooks/useTransactions'
import { Sparkles, Send, TrendingUp, AlertCircle, Bot, User, Loader2 } from 'lucide-react'

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
        } catch (err: unknown) {
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
        } catch (err: unknown) {
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
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to get AI response')
        } finally {
            setLoading(false)
        }
    }

    if (!isAIAvailable) {
        return (
            <Card className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        AI Budget Assistant
                    </CardTitle>
                    <CardDescription>Get personalized insights and forecasts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-warning">Gemini API Key Required</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Add your Gemini API key to the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">VITE_GEMINI_API_KEY</code> environment variable to enable AI features.
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
            <Card className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        AI Budget Assistant
                    </CardTitle>
                    <CardDescription>Get personalized insights and forecasts powered by Gemini AI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                        <Button onClick={getInsights} disabled={loading} className="gap-2">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                            Get Insights
                        </Button>
                        <Button onClick={getForecast} disabled={loading} variant="outline" className="gap-2">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Get Forecast
                        </Button>
                    </div>

                    {/* Insights Display */}
                    {insights && (
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    Insights
                                </Badge>
                            </div>
                            <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{insights}</div>
                        </div>
                    )}

                    {/* Forecast Display */}
                    {forecast && (
                        <div className="p-4 bg-info/5 border border-info/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <Badge variant="info" className="bg-info/20 text-info border-info/30">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Forecast
                                </Badge>
                            </div>
                            <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{forecast}</div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Chat Interface */}
            <Card className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Bot className="w-5 h-5 text-primary" />
                        Ask AI About Your Budget
                    </CardTitle>
                    <CardDescription>Chat with AI to get personalized financial advice</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Chat History */}
                    {chatHistory.length > 0 && (
                        <div className="space-y-3 max-h-80 overflow-y-auto p-1">
                            {chatHistory.map((chat, index) => (
                                <div
                                    key={index}
                                    className={`flex gap-3 ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {chat.role === 'ai' && (
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Bot className="w-4 h-4 text-primary" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] p-3 rounded-lg ${chat.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{chat.message}</p>
                                    </div>
                                    {chat.role === 'user' && (
                                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    )}
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
                            onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                            disabled={loading}
                            className="flex-1"
                        />
                        <Button onClick={sendChatMessage} disabled={loading || !chatMessage.trim()} size="icon">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
