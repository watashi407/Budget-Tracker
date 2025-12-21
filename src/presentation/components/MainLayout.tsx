import { Link, Outlet } from "@tanstack/react-router"
import { useAuth } from "@/presentation/context/AuthContext"
import { ThemeToggle } from "./ThemeToggle"
import { Wallet, LayoutDashboard, Settings, LogOut, Menu, X, Receipt, Sparkles } from "lucide-react"
import { Button } from "./ui/button"
import { Toaster } from "@/presentation/components/ui/toaster"
import { useState } from "react"

export function MainLayout() {
    const { user, signOut, loading } = useAuth()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // If loading, show a full-screen spinner
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-primary">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
                    <span className="text-sm font-mono text-muted-foreground">INITIALIZING...</span>
                </div>
            </div>
        )
    }

    // If not authenticated, just render the content (Login/Signup pages handle their own layout)
    if (!user) {
        return <Outlet />
    }

    return (
        <div className="h-screen overflow-hidden bg-background text-foreground flex font-sans">
            {/* Sidebar - Desktop */}
            <aside className="w-72 border-r border-border/50 bg-card/50 backdrop-blur-xl hidden md:flex flex-col relative overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

                <div className="p-6 border-b border-border/50 relative z-10">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3 font-bold text-2xl tracking-tight group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-lg opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg group-hover:shadow-primary/30 transition-shadow duration-300">
                                    <Wallet className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold tracking-tight text-foreground">
                                    Watashi Pocket
                                </span>
                                <span className="text-[10px] font-mono text-primary/80 tracking-widest uppercase">
                                    v3.0 SYSTEM
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 relative z-10">
                    <div className="px-4 py-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                        Navigation
                    </div>
                    <Link to="/" className="w-full">
                        <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg group">
                            <LayoutDashboard className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span>Dashboard</span>
                        </Button>
                    </Link>
                    <Link to="/budgets" className="w-full">
                        <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg group">
                            <Wallet className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span>Budgets</span>
                        </Button>
                    </Link>
                    <Link to="/expenses" className="w-full">
                        <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg group">
                            <Receipt className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span>Expenses</span>
                        </Button>
                    </Link>
                    <Link to="/ai-assistant" className="w-full">
                        <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg group">
                            <Sparkles className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span>AI Assistant</span>
                        </Button>
                    </Link>
                    <Link to="/settings" className="w-full">
                        <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg group">
                            <Settings className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span>Settings</span>
                        </Button>
                    </Link>
                </nav>

                <div className="p-4 border-t border-border/50 space-y-4 bg-muted/30 relative z-10">
                    <div className="flex items-center gap-3 p-3 border border-border/50 bg-card/50 rounded-lg hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 border border-border flex items-center justify-center text-sm font-bold text-primary">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{user?.fullName || "User"}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between px-1">
                        <ThemeToggle />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={signOut}
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors gap-2 rounded-lg"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Logout</span>
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Mobile Header */}
                <header className="md:hidden h-16 border-b border-border/50 flex items-center justify-between px-4 bg-card/80 backdrop-blur-xl sticky top-0 z-40">
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-md">
                            <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold tracking-tight text-foreground">Watashi</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-muted-foreground"
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </header>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 right-0 bg-card/95 backdrop-blur-xl border-b border-border z-30 animate-slide-down">
                        <nav className="p-4 space-y-2">
                            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start gap-3">
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboard
                                </Button>
                            </Link>
                            <Link to="/budgets" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start gap-3">
                                    <Wallet className="h-4 w-4" />
                                    Budgets
                                </Button>
                            </Link>
                            <Link to="/expenses" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start gap-3">
                                    <Receipt className="h-4 w-4" />
                                    Expenses
                                </Button>
                            </Link>
                            <Link to="/ai-assistant" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start gap-3">
                                    <Sparkles className="h-4 w-4" />
                                    AI Assistant
                                </Button>
                            </Link>
                            <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start gap-3">
                                    <Settings className="h-4 w-4" />
                                    Settings
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                onClick={signOut}
                                className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        </nav>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
            <Toaster />
        </div>
    )
}
