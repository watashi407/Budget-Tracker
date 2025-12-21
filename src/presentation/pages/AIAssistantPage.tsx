import { useState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Badge } from '@/presentation/components/ui/badge'
import { Separator } from '@/presentation/components/ui/separator'
import { geminiAIService } from '@/data/services/GeminiAIService'
import { useBudgets } from '@/presentation/hooks/useBudgets'
import { useTransactions } from '@/presentation/hooks/useTransactions'
import { MarkdownRenderer } from '@/presentation/components/MarkdownRenderer'
import { Sparkles, Send, TrendingUp, AlertCircle, Bot, User, Loader2, MessageSquare } from 'lucide-react'

export function AIAssistantPage() {
    const { budgets } = useBudgets()
    const { transactions } = useTransactions()

    const [insights, setInsights] = useState<string>('')
    const [forecast, setForecast] = useState<string>('')
    const [chatMessage, setChatMessage] = useState('')
    const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai', message: string }>>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState<'insights' | 'chat'>('chat')

    const isAIAvailable = geminiAIService.isAvailable()

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

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="axis-header">ARTIFICIAL INTELLIGENCE</div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-primary" />
                        AI ASSISTANT
                    </h1>
                    <p className="text-muted-foreground font-mono text-xs mt-1">
                        Powered by Gemini AI • {budgets.length} budgets • {transactions.length} transactions in context
                    </p>
                </div>
            </div>

            {!isAIAvailable ? (
                <div className="axis-card p-6 flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-warning/10">
                        <AlertCircle className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-warning mb-1">Gemini API Key Required</h3>
                        <p className="text-sm text-muted-foreground">
                            Add your Gemini API key to the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">VITE_GEMINI_API_KEY</code> environment variable to enable AI features.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Tab Navigation */}
                    <div className="flex gap-1 p-1 bg-muted/50 rounded-lg mb-4 w-fit">
                        <Button
                            variant={activeTab === 'chat' ? 'default' : 'ghost'}
                            size="sm"
                            className="gap-2"
                            onClick={() => setActiveTab('chat')}
                        >
                            <MessageSquare className="w-4 h-4" />
                            Chat
                        </Button>
                        <Button
                            variant={activeTab === 'insights' ? 'default' : 'ghost'}
                            size="sm"
                            className="gap-2"
                            onClick={() => setActiveTab('insights')}
                        >
                            <TrendingUp className="w-4 h-4" />
                            Insights & Forecast
                        </Button>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-4">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {activeTab === 'chat' ? (
                        <div className="flex-1 flex flex-col axis-card p-4 min-h-[400px]">
                            {/* Chat History */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
                                {chatHistory.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-sm mb-2">Ask me anything about your budget and finances!</p>
                                        <p className="text-xs text-muted-foreground/70">
                                            I have access to your {budgets.length} budgets and {transactions.length} transactions.
                                        </p>
                                    </div>
                                ) : (
                                    chatHistory.map((chat, index) => (
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
                                                {chat.role === 'ai' ? (
                                                    <MarkdownRenderer content={chat.message} className="text-sm" />
                                                ) : (
                                                    <p className="text-sm whitespace-pre-wrap">{chat.message}</p>
                                                )}
                                            </div>
                                            {chat.role === 'user' && (
                                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            <Separator className="mb-4" />

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
                        </div>
                    ) : (
                        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                            {/* Quick Actions */}
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Button onClick={getInsights} disabled={loading} className="gap-2 h-12">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                                    Get Budget Insights
                                </Button>
                                <Button onClick={getForecast} disabled={loading} variant="outline" className="gap-2 h-12">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Get Spending Forecast
                                </Button>
                            </div>

                            {/* Insights Display */}
                            {insights && (
                                <div className="axis-card p-4 bg-primary/5 border-primary/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                            Insights
                                        </Badge>
                                    </div>
                                    <MarkdownRenderer content={insights} className="text-foreground/90 leading-relaxed" />
                                </div>
                            )}

                            {/* Forecast Display */}
                            {forecast && (
                                <div className="axis-card p-4 bg-info/5 border-info/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge variant="secondary" className="bg-secondary/20 text-secondary border-secondary/30">
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            Forecast
                                        </Badge>
                                    </div>
                                    <MarkdownRenderer content={forecast} className="text-foreground/90 leading-relaxed" />
                                </div>
                            )}

                            {!insights && !forecast && !loading && (
                                <div className="text-center py-12 text-muted-foreground axis-card">
                                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-sm">Click the buttons above to get AI-powered insights about your budget</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
