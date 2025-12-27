import React, { useMemo, useState } from 'react'
import {
    Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell,
    PieChart, Pie, Legend,
    AreaChart, Area
} from 'recharts'
import type { Budget } from '@/domain/entities/Budget'
import { BarChart3, PieChartIcon, TrendingUp } from 'lucide-react'
import { useCurrency } from '@/presentation/context/CurrencyContext'
import { Button } from '@/presentation/components/ui/button'

type ChartType = 'bar' | 'pie' | 'area'

interface SpendingChartProps {
    budgets: Budget[]
}

// Colors for pie chart slices
const CHART_COLORS = [
    'hsl(var(--primary))',
    'hsl(24, 95%, 53%)',      // Orange
    'hsl(142, 76%, 36%)',     // Green
    'hsl(262, 83%, 58%)',     // Purple
    'hsl(199, 89%, 48%)',     // Blue
    'hsl(45, 93%, 47%)',      // Yellow
    'hsl(340, 82%, 52%)',     // Pink
    'hsl(173, 58%, 39%)',     // Teal
]

export const SpendingChart = React.memo(function SpendingChart({ budgets }: SpendingChartProps) {
    const { formatCurrency } = useCurrency()
    const [chartType, setChartType] = useState<ChartType>('bar')

    // Bar chart data - budget vs spent
    const barData = useMemo(() => budgets.map(b => ({
        name: b.name,
        budget: b.amount,
        spent: b.spent,
        remaining: Math.max(0, b.amount - b.spent),
        isOverBudget: b.spent > b.amount,
        color: b.color || 'hsl(var(--primary))'
    })), [budgets])

    // Pie chart data - spending distribution
    const pieData = useMemo(() => budgets
        .filter(b => b.spent > 0)
        .map((b, i) => ({
            name: b.name,
            value: b.spent,
            color: b.color || CHART_COLORS[i % CHART_COLORS.length],
            percentage: 0
        })), [budgets])

    // Calculate percentages for pie chart
    const pieDataWithPercentages = useMemo(() => {
        const total = pieData.reduce((sum, item) => sum + item.value, 0)
        return pieData.map(item => ({
            ...item,
            percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
        }))
    }, [pieData])

    // Area chart data - simulate monthly trend (based on budget utilization %)
    const areaData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
        const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)

        // Generate simulated monthly data based on current utilization
        return months.map((month, i) => ({
            month,
            spending: Math.round(totalSpent * (0.6 + Math.random() * 0.8) * ((i + 1) / 6)),
            budget: Math.round(totalBudget / 6 * (i + 1))
        }))
    }, [budgets])

    if (budgets.length === 0) {
        return (
            <div className="h-[300px] w-full flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-muted/30">
                <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No budget data available</p>
                <p className="text-xs text-muted-foreground mt-1">Create a budget to see your spending analysis</p>
            </div>
        )
    }

    const chartTabs = [
        { id: 'bar' as ChartType, label: 'Comparison', icon: BarChart3 },
        { id: 'pie' as ChartType, label: 'Distribution', icon: PieChartIcon },
        { id: 'area' as ChartType, label: 'Trend', icon: TrendingUp },
    ]

    return (
        <div className="p-6 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm">
            {/* Header with chart type tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Spending Analysis</h3>
                    <p className="text-xs text-muted-foreground">
                        {chartType === 'bar' && 'Budget vs actual spending comparison'}
                        {chartType === 'pie' && 'Spending distribution by category'}
                        {chartType === 'area' && 'Monthly spending trend overview'}
                    </p>
                </div>

                {/* Chart Type Tabs */}
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                    {chartTabs.map((tab) => (
                        <Button
                            key={tab.id}
                            variant={chartType === tab.id ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setChartType(tab.id)}
                            className="gap-1.5 h-8 px-3"
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Legend for bar chart */}
            {chartType === 'bar' && (
                <div className="flex items-center gap-4 text-xs mb-4">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-primary" />
                        <span className="text-muted-foreground">Spent</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-muted" />
                        <span className="text-muted-foreground">Remaining</span>
                    </div>
                </div>
            )}

            {/* Chart Container */}
            <div className="h-[300px] w-full min-h-[300px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                        <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                            <XAxis
                                dataKey="name"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => formatCurrency(value)}
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const item = payload[0].payload
                                        return (
                                            <div className="bg-card/95 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl">
                                                <p className="text-sm font-semibold text-foreground mb-2">{item.name}</p>
                                                <div className="space-y-1.5 text-xs">
                                                    <div className="flex justify-between gap-6 text-muted-foreground">
                                                        <span>Budget:</span>
                                                        <span className="text-foreground font-medium">{formatCurrency(item.budget)}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-6 text-muted-foreground">
                                                        <span>Spent:</span>
                                                        <span className={`font-medium ${item.isOverBudget ? 'text-destructive' : 'text-primary'}`}>
                                                            {formatCurrency(item.spent)}
                                                        </span>
                                                    </div>
                                                    <div className="border-t border-border pt-1.5 flex justify-between gap-6 text-muted-foreground">
                                                        <span>Remaining:</span>
                                                        <span className="text-success font-medium">{formatCurrency(item.remaining)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Bar dataKey="spent" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                {barData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.isOverBudget ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                                        fillOpacity={0.85}
                                    />
                                ))}
                            </Bar>
                            <Bar dataKey="remaining" stackId="a" fill="hsl(var(--muted))" fillOpacity={0.5} radius={[6, 6, 0, 0]} maxBarSize={50} />
                        </BarChart>
                    ) : chartType === 'pie' ? (
                        <PieChart>
                            <Pie
                                data={pieDataWithPercentages}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {pieDataWithPercentages.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const item = payload[0].payload
                                        return (
                                            <div className="bg-card/95 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl">
                                                <p className="text-sm font-semibold text-foreground mb-1">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatCurrency(item.value)} ({item.percentage}%)
                                                </p>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                            />
                        </PieChart>
                    ) : (
                        <AreaChart data={areaData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                            <defs>
                                <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="month"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => formatCurrency(value)}
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-card/95 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl">
                                                <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
                                                <div className="space-y-1 text-xs">
                                                    <div className="flex justify-between gap-4 text-muted-foreground">
                                                        <span>Spending:</span>
                                                        <span className="text-primary font-medium">{formatCurrency(payload[0].value as number)}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-4 text-muted-foreground">
                                                        <span>Budget:</span>
                                                        <span className="text-foreground font-medium">{formatCurrency(payload[1].value as number)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="spending"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#spendingGradient)"
                            />
                            <Area
                                type="monotone"
                                dataKey="budget"
                                stroke="hsl(var(--muted-foreground))"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fillOpacity={1}
                                fill="url(#budgetGradient)"
                            />
                        </AreaChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* Legend for area chart */}
            {chartType === 'area' && (
                <div className="flex items-center justify-center gap-6 text-xs mt-4">
                    <div className="flex items-center gap-2">
                        <div className="h-0.5 w-4 bg-primary" />
                        <span className="text-muted-foreground">Spending</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-0.5 w-4 bg-muted-foreground" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, currentColor 2px, currentColor 4px)' }} />
                        <span className="text-muted-foreground">Budget Target</span>
                    </div>
                </div>
            )}
        </div>
    )
})
