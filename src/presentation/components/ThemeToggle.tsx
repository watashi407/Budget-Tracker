import { useEffect, useState } from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"

type Theme = "dark" | "light" | "system"

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('theme') as Theme) || 'system'
        }
        return 'system'
    })

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")

        let effectiveTheme: "light" | "dark"
        if (theme === "system") {
            effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"
        } else {
            effectiveTheme = theme
        }

        root.classList.add(effectiveTheme)
        localStorage.setItem('theme', theme)

        // Listen for system theme changes
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        const handleChange = () => {
            if (theme === 'system') {
                root.classList.remove("light", "dark")
                root.classList.add(mediaQuery.matches ? "dark" : "light")
            }
        }
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [theme])

    return (
        <div className="flex items-center gap-0.5 p-1 rounded-lg bg-muted/50 border border-border/50">
            <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-md transition-all ${theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setTheme("light")}
                title="Light mode"
            >
                <Sun className="h-3.5 w-3.5" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-md transition-all ${theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setTheme("dark")}
                title="Dark mode"
            >
                <Moon className="h-3.5 w-3.5" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-md transition-all ${theme === 'system' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setTheme("system")}
                title="System preference"
            >
                <Monitor className="h-3.5 w-3.5" />
            </Button>
        </div>
    )
}
