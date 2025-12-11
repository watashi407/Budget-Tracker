
import { useState, useMemo } from 'react'
import { useAuth } from '@/presentation/context/AuthContext'
import { useBudgets } from '@/presentation/hooks/useBudgets'
import { useTransactions } from '@/presentation/hooks/useTransactions'
import { Button } from '@/presentation/components/ui/button'

import { Separator } from '@/presentation/components/ui/separator'
import { CreateBudgetDialog } from '@/presentation/components/CreateBudgetDialog'
import { EditBudgetDialog } from '@/presentation/components/EditBudgetDialog'
import { CreateTransactionDialog } from '@/presentation/components/CreateTransactionDialog'
import { BudgetCard } from '@/presentation/components/BudgetCard'
import { TransactionList } from '@/presentation/components/TransactionList'
import { AIInsightsPanel } from '@/presentation/components/AIInsightsPanel'
import { SpendingChart } from '@/presentation/components/SpendingChart'
import { PlusCircle, Wallet, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import type { Budget } from '@/domain/entities/Budget'


type DateFilter = 'ALL' | 'MTD' | 'YTD'

export function DashboardPage() {
    const { user } = useAuth()
    const { budgets, loading: budgetsLoading, error: budgetsError } = useBudgets()
    const { transactions } = useTransactions()

    const [showBudgetDialog, setShowBudgetDialog] = useState(false)
    const [showTransactionDialog, setShowTransactionDialog] = useState(false)
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
    const [dateFilter, setDateFilter] = useState<DateFilter>('MTD')

    // Filter Logic
    const filteredTransactions = useMemo(() => {
        const now = new Date()
        return transactions.filter(t => {
            const tDate = new Date(t.date)
            if (dateFilter === 'ALL') return true
            if (dateFilter === 'MTD') {
                return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()
            }
            if (dateFilter === 'YTD') {
                return tDate.getFullYear() === now.getFullYear()
            }
            return true
        })
    }, [transactions, dateFilter])

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)

    // Calculate totals based on FILTERED transactions
    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

    // Forecast Logic (Simple linear projection)
    const forecast = useMemo(() => {
        const now = new Date()
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const dayOfMonth = now.getDate()

        if (dateFilter === 'MTD' && dayOfMonth > 0) {
            const dailyAvg = totalExpenses / dayOfMonth
            return dailyAvg * daysInMonth
        }
        return 0
    }, [totalExpenses, dateFilter])

    // Check for missing table error (Postgres code 42P01)
    if (budgetsError && (budgetsError as { code?: string }).code === '42P01') {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-4 space-y-6">
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20 animate-pulse">
                    <Activity className="h-10 w-10 text-destructive" />
                </div>
                <div className="space-y-2 max-w-md">
                    <h1 className="text-2xl font-bold tracking-tight text-white">DATABASE CONNECTION REQUIRED</h1>
                    <p className="text-muted-foreground">
                        The application is connected to Supabase, but the necessary tables (<b>budgets</b>, <b>transactions</b>) do not exist yet.
                    </p>
                </div>

                <div className="w-full max-w-2xl bg-black/50 border border-border rounded-lg p-4 text-left overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-muted-foreground uppercase">REQUIRED SQL SETUP</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => {
                                navigator.clipboard.writeText(`-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  spent DECIMAL(10, 2) DEFAULT 0,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	"full_name" text,
	"avatar_url" text,
	"updated_at" timestamp with time zone DEFAULT now()
);

-- Row Level Security
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING ( true );
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK ( auth.uid() = id );
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING ( auth.uid() = id );

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();`)
                                alert('SQL copied to clipboard!')
                            }}
                        >
                            COPY SQL
                        </Button>
                    </div>
                    <pre className="text-[10px] font-mono text-primary/80 overflow-x-auto p-2 bg-black border border-white/5 rounded h-48">
                        {`-- Enable UUID extension... (Click COPY SQL for full script)`}
                    </pre>
                </div>

                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        onClick={() => window.open('https://supabase.com/dashboard/project/vsfiksmbacwstzttopag/sql', '_blank')}
                    >
                        OPEN SUPABASE SQL EDITOR
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                        I'VE RUN THE SQL (REFRESH)
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Quick Actions & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="axis-header">SYSTEM STATUS</div>
                    <h1 className="text-3xl font-bold tracking-tight">DASHBOARD</h1>
                    <p className="text-muted-foreground font-mono text-xs mt-1">OPERATOR: {user?.fullName || user?.email}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex items-center bg-black/40 border border-white/10 rounded-md p-1 mr-2">
                        <Button
                            variant={dateFilter === 'MTD' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setDateFilter('MTD')}
                            className="text-xs h-7"
                        >
                            MTD
                        </Button>
                        <Button
                            variant={dateFilter === 'YTD' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setDateFilter('YTD')}
                            className="text-xs h-7"
                        >
                            YTD
                        </Button>
                        <Button
                            variant={dateFilter === 'ALL' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setDateFilter('ALL')}
                            className="text-xs h-7"
                        >
                            ALL
                        </Button>
                    </div>

                    <Button onClick={() => setShowTransactionDialog(true)} className="rounded-none border border-primary bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        ADD TRANSACTION
                    </Button>
                    <Button onClick={() => setShowBudgetDialog(true)} variant="outline" className="rounded-none border-border hover:border-primary/50 hover:text-primary transition-all">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        NEW BUDGET
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Budget (Static for now, usually monthly) */}
                <div className="axis-card p-6 group">
                    <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div className="axis-header text-primary">TOTAL BUDGET (MONTHLY)</div>
                    <div className="text-3xl font-mono font-bold text-white tracking-tighter mt-2">
                        ${totalBudget.toFixed(2)}
                    </div>
                    <div className="mt-4 h-1 w-full bg-border/30 overflow-hidden">
                        <div className="h-full bg-primary w-full origin-left scale-x-100 transition-transform duration-1000" />
                    </div>
                </div>

                {/* Forecast / Spent */}
                <div className="axis-card p-6 group">
                    <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Activity className="w-4 h-4 text-secondary" />
                    </div>
                    <div className="axis-header text-secondary">
                        {dateFilter === 'MTD' ? 'FORECAST (EOM)' : 'TOTAL SPENT'}
                    </div>
                    <div className="text-3xl font-mono font-bold text-white tracking-tighter mt-2">
                        ${(dateFilter === 'MTD' && forecast > 0 ? forecast : totalExpenses).toFixed(2)}
                    </div>
                    <div className="mt-4 h-1 w-full bg-border/30 overflow-hidden">
                        <div
                            className={`h-full ${totalExpenses > totalBudget ? 'bg-destructive' : 'bg-secondary'} transition-all duration-1000`}
                            style={{ width: `${Math.min((totalExpenses / (totalBudget || 1)) * 100, 100)}%` }}
                        />
                    </div>
                    {dateFilter === 'MTD' && (
                        <p className="text-[10px] font-mono text-muted-foreground mt-2 text-right">
                            CURRENT: ${totalExpenses.toFixed(0)}
                        </p>
                    )}
                </div>

                {/* Income */}
                <div className="axis-card p-6 group">
                    <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="axis-header text-emerald-500">INCOME ({dateFilter})</div>
                    <div className="text-3xl font-mono font-bold text-white tracking-tighter mt-2">
                        ${totalIncome.toFixed(2)}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="h-1 w-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-mono text-emerald-500/70">ACTIVE</span>
                    </div>
                </div>

                {/* Expenses */}
                <div className="axis-card p-6 group">
                    <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <TrendingDown className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="axis-header text-rose-500">EXPENSES ({dateFilter})</div>
                    <div className="text-3xl font-mono font-bold text-white tracking-tighter mt-2">
                        ${totalExpenses.toFixed(2)}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="h-1 w-2 bg-rose-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-mono text-rose-500/70">TRACKING</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div>
                <SpendingChart budgets={budgets} />
            </div>

            {/* Budgets Section */}
            <div>
                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <span className="w-1 h-4 bg-primary inline-block" />
                        ACTIVE BUDGETS
                    </h2>
                    {budgets.length > 0 && (
                        <Button onClick={() => setShowBudgetDialog(true)} variant="ghost" size="sm" className="text-xs font-mono text-muted-foreground hover:text-primary">
                            + ADD NEW
                        </Button>
                    )}
                </div>

                {budgetsLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                ) : budgets.length === 0 ? (
                    <div className="axis-card p-12 flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                            <Wallet className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">NO ACTIVE BUDGETS</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                            Initialize a budget parameter to begin tracking financial data.
                        </p>
                        <Button onClick={() => setShowBudgetDialog(true)} className="rounded-none border border-primary bg-primary/10 text-primary hover:bg-primary hover:text-white">
                            INITIALIZE BUDGET
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {budgets.map((budget) => (
                            <BudgetCard
                                key={budget.id}
                                budget={budget}
                                onEdit={(b) => setEditingBudget(b)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Separator className="bg-border/50" />

            {/* AI Insights Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-4 bg-secondary inline-block" />
                    <h2 className="text-xl font-bold tracking-tight">AI ANALYSIS</h2>
                </div>
                <AIInsightsPanel />
            </div>

            <Separator className="bg-border/50" />

            {/* Recent Transactions */}
            <div>
                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <span className="w-1 h-4 bg-white inline-block" />
                        TRANSACTION LOG ({dateFilter})
                    </h2>
                    <Button onClick={() => setShowTransactionDialog(true)} variant="ghost" size="sm" className="text-xs font-mono text-muted-foreground hover:text-primary">
                        + ADD ENTRY
                    </Button>
                </div>

                <div className="axis-card p-0">
                    <TransactionList
                        limit={10}
                        initialTransactions={filteredTransactions}
                    />
                </div>
            </div>

            {/* Dialogs */}
            <CreateBudgetDialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog} />
            <EditBudgetDialog
                open={!!editingBudget}
                onOpenChange={(open) => !open && setEditingBudget(null)}
                budget={editingBudget}
            />
            <CreateTransactionDialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog} />
        </div>
    )
}
