import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import type { Budget } from '@/domain/entities/Budget'

interface SpendingChartProps {
    budgets: Budget[]
}

export function SpendingChart({ budgets }: SpendingChartProps) {
    const data = budgets.map(b => ({
        name: b.name,
        budget: b.amount,
        spent: b.spent,
        remaining: Math.max(0, b.amount - b.spent),
        color: b.color || '#3b82f6'
    }))

    if (budgets.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center border border-white/10 bg-black/20 rounded-lg">
                <p className="text-muted-foreground font-mono text-sm">NO DATA AVAILABLE FOR VISUALIZATION</p>
            </div>
        )
    }

    return (
        <div className="axis-card p-6">
            <div className="axis-header text-primary mb-6">SPENDING ANALYSIS</div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#666' }}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                            tick={{ fill: '#666' }}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload
                                    return (
                                        <div className="bg-black/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
                                            <p className="text-xs font-bold text-white mb-2 uppercase">{data.name}</p>
                                            <div className="space-y-1 font-mono text-[10px]">
                                                <div className="flex justify-between gap-4 text-muted-foreground">
                                                    <span>BUDGET:</span>
                                                    <span className="text-white">${data.budget.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between gap-4 text-muted-foreground">
                                                    <span>SPENT:</span>
                                                    <span className="text-rose-500">${data.spent.toFixed(2)}</span>
                                                </div>
                                                <div className="border-t border-white/10 my-1 pt-1 flex justify-between gap-4 text-muted-foreground">
                                                    <span>REMAINING:</span>
                                                    <span className="text-emerald-500">${data.remaining.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Bar dataKey="spent" radius={[4, 4, 0, 0]} maxBarSize={50}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.spent > entry.budget ? '#ef4444' : entry.color}
                                    fillOpacity={0.8}
                                />
                            ))}
                        </Bar>
                        <Bar dataKey="remaining" stackId="a" fill="#3b82f6" fillOpacity={0.1} radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
