import { useEffect, useState, useCallback } from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"
import { STORAGE_KEYS, type Theme } from '@/constants/ui'

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem(STORAGE_KEYS.THEME) as Theme) || 'system'
        }
        return 'system'
    })

    // Apply theme using requestAnimationFrame for non-blocking UI
    const applyTheme = useCallback((newTheme: Theme) => {
        requestAnimationFrame(() => {
            const root = window.document.documentElement
            root.classList.remove("light", "dark")

            let effectiveTheme: "light" | "dark"
            if (newTheme === "system") {
                effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light"
            } else {
                effectiveTheme = newTheme
            }

            root.classList.add(effectiveTheme)
            localStorage.setItem(STORAGE_KEYS.THEME, newTheme)
        })
    }, [])

    useEffect(() => {
        applyTheme(theme)

        // Listen for system theme changes
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        const handleChange = () => {
            if (theme === 'system') {
                applyTheme('system')
            }
        }
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [theme, applyTheme])

    const handleThemeChange = useCallback((newTheme: Theme) => {
        setTheme(newTheme)
    }, [])

    return (
        <div className="flex items-center gap-0.5 p-1 rounded-lg bg-muted/50 border border-border/50">
            <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-md ${theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => handleThemeChange("light")}
                title="Light mode"
            >
                <Sun className="h-3.5 w-3.5" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-md ${theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => handleThemeChange("dark")}
                title="Dark mode"
            >
                <Moon className="h-3.5 w-3.5" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-md ${theme === 'system' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => handleThemeChange("system")}
                title="System preference"
            >
                <Monitor className="h-3.5 w-3.5" />
            </Button>
        </div>
    )
}

