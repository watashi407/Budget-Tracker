import { Link, Outlet } from "@tanstack/react-router"
import { useAuth } from "@/presentation/context/AuthContext"
import { ThemeToggle } from "./ThemeToggle"
import { Wallet, LayoutDashboard, Settings, LogOut } from "lucide-react"
import { Button } from "./ui/button"
import { Toaster } from "@/presentation/components/ui/toaster"

export function MainLayout() {
    const { user, signOut, loading } = useAuth()

    // If loading, show a full-screen spinner
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-primary">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    // If not authenticated, just render the content (Login/Signup pages handle their own layout)
    if (!user) {
        return <Outlet />
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-primary/20 selection:text-primary">
            {/* Sidebar */}
            <aside className="w-72 border-r border-border/50 bg-black/40 backdrop-blur-xl hidden md:flex flex-col relative overflow-hidden">
                {/* Tech Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                <div className="p-6 border-b border-border/50 relative z-10">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3 font-bold text-2xl text-white tracking-tight group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-md rounded-sm opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative h-10 w-10 rounded-sm bg-black border border-primary/50 flex items-center justify-center shadow-[0_0_10px_-3px_hsl(var(--primary)/0.3)] group-hover:border-primary transition-colors duration-300">
                                    <Wallet className="h-5 w-5 text-primary" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-mono font-bold tracking-tighter text-white">
                                    WATASHI POCKET
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
                        <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-sm font-medium hover:bg-primary/10 hover:text-primary hover:border-r-2 hover:border-primary transition-all duration-200 rounded-none group">
                            <LayoutDashboard className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="font-mono">DASHBOARD</span>
                        </Button>
                    </Link>
                    <Link to="/settings" className="w-full">
                        <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-sm font-medium hover:bg-primary/10 hover:text-primary hover:border-r-2 hover:border-primary transition-all duration-200 rounded-none group">
                            <Settings className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="font-mono">SETTINGS</span>
                        </Button>
                    </Link>
                </nav>

                <div className="p-4 border-t border-border/50 space-y-4 bg-black/20 relative z-10">
                    <div className="flex items-center gap-3 p-3 border border-border/50 bg-card/20 hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                        <div className="h-8 w-8 rounded-sm bg-zinc-900 border border-border flex items-center justify-center text-xs font-mono font-bold text-primary">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono font-semibold text-white truncate group-hover:text-primary transition-colors">{user?.fullName || "OPERATOR"}</p>
                            <p className="text-[10px] font-mono text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between px-1">
                        <ThemeToggle />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={signOut}
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors gap-2 rounded-none border border-transparent hover:border-destructive/50"
                        >
                            <LogOut className="h-3 w-3" />
                            <span className="text-[10px] font-mono uppercase">Logout</span>
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Mobile Header */}
                <header className="md:hidden h-16 border-b border-border/50 flex items-center justify-between px-4 bg-background/80 backdrop-blur-xl">
                    <div className="flex items-center gap-2 font-bold text-lg text-primary">
                        <div className="h-8 w-8 rounded-sm bg-black border border-primary/50 flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-mono tracking-tighter text-white">WATASHI</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={signOut}
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
            <Toaster />
        </div>
    )
}
