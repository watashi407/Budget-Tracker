import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import type { Budget } from '@/domain/entities/Budget'
import { BarChart3 } from 'lucide-react'

interface SpendingChartProps {
    budgets: Budget[]
}

export function SpendingChart({ budgets }: SpendingChartProps) {
    const data = budgets.map(b => ({
        name: b.name,
        budget: b.amount,
        spent: b.spent,
        remaining: Math.max(0, b.amount - b.spent),
        isOverBudget: b.spent > b.amount,
        color: b.color || 'hsl(var(--primary))'
    }))

    if (budgets.length === 0) {
        return (
            <div className="h-[300px] w-full flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-muted/30">
                <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No budget data available</p>
                <p className="text-xs text-muted-foreground mt-1">Create a budget to see your spending analysis</p>
            </div>
        )
    }

    return (
        <div className="p-6 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Spending Analysis</h3>
                    <p className="text-xs text-muted-foreground">Budget vs actual spending comparison</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-primary" />
                        <span className="text-muted-foreground">Spent</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-muted" />
                        <span className="text-muted-foreground">Remaining</span>
                    </div>
                </div>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
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
                            tickFormatter={(value) => `$${value}`}
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
                                                    <span className="text-foreground font-medium">${item.budget.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between gap-6 text-muted-foreground">
                                                    <span>Spent:</span>
                                                    <span className={`font-medium ${item.isOverBudget ? 'text-destructive' : 'text-primary'}`}>
                                                        ${item.spent.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="border-t border-border pt-1.5 flex justify-between gap-6 text-muted-foreground">
                                                    <span>Remaining:</span>
                                                    <span className="text-success font-medium">${item.remaining.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Bar dataKey="spent" radius={[6, 6, 0, 0]} maxBarSize={50}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.isOverBudget ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                                    fillOpacity={0.85}
                                />
                            ))}
                        </Bar>
                        <Bar dataKey="remaining" stackId="a" fill="hsl(var(--muted))" fillOpacity={0.5} radius={[6, 6, 0, 0]} maxBarSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
