import { useRef } from 'react'
import {
    TrendingUp,
    CreditCard,
    DollarSign,
    ShieldCheck,
    Wallet
} from 'lucide-react'


export function LandingGraphic() {
    const containerRef = useRef<HTMLDivElement>(null)

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-square max-w-[500px] mx-auto perspective-1000"
        >
            {/* Main polished glass card */}
            <div className="absolute inset-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 flex flex-col justify-between transform rotate-y-12 rotate-x-6 hover:rotate-y-0 hover:rotate-x-0 transition-all duration-700 ease-out group">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg">
                            <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="h-3 w-24 bg-white/10 rounded-full mb-2" />
                            <div className="h-2 w-16 bg-white/5 rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Chart Area simulation */}
                <div className="flex-1 flex items-end gap-3 px-2 pb-4">
                    {[40, 70, 50, 90, 60, 80].map((height, i) => (
                        <div
                            key={i}
                            className="w-full bg-gradient-to-t from-primary/20 to-primary/50 hover:from-primary/40 hover:to-primary/70 rounded-t-sm transition-all duration-500"
                            style={{
                                height: `${height}%`,
                                transitionDelay: `${i * 100}ms`
                            }}
                        />
                    ))}
                </div>

                {/* Bottom stats */}
                <div className="flex gap-4 mt-6">
                    <div className="flex-1 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="h-2 w-12 bg-white/10 rounded-full mb-2" />
                        <div className="h-4 w-20 bg-primary/20 rounded-full" />
                    </div>
                    <div className="flex-1 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="h-2 w-12 bg-white/10 rounded-full mb-2" />
                        <div className="h-4 w-20 bg-orange-500/20 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Floating elements */}

            {/* Total Balance Card */}
            <div className="absolute top-10 -right-4 md:-right-12 p-4 rounded-2xl bg-card border border-white/10 shadow-xl backdrop-blur-md animate-float-slow z-20 w-48">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Total Balance</span>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    $12,450.00
                </div>
                <div className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    +2.4% this month
                </div>
            </div>

            {/* Expense Alert */}
            <div className="absolute -bottom-6 -left-4 md:-left-8 p-4 rounded-2xl bg-card border border-white/10 shadow-xl backdrop-blur-md animate-float-delayed z-20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-red-500" />
                </div>
                <div>
                    <div className="text-sm font-medium">Monthly Rent</div>
                    <div className="text-xs text-muted-foreground">-$1,200.00</div>
                </div>
            </div>

            {/* Income Bubble */}
            <div className="absolute top-1/2 -right-8 p-3 rounded-2xl bg-card border border-white/10 shadow-xl backdrop-blur-md animate-float z-10">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-500" />
                </div>
            </div>

            {/* Security Badge */}
            <div className="absolute top-0 left-0 p-3 rounded-2xl bg-card border border-white/10 shadow-xl backdrop-blur-md animate-float-slow z-10" style={{ animationDelay: '2s' }}>
                <ShieldCheck className="h-6 w-6 text-primary" />
            </div>

            {/* Background Glows */}
            <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10 rounded-full" />
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-orange-500/20 blur-[80px] -z-10 rounded-full" />
        </div>
    )
}
