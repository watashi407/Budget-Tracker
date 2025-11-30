import { useEffect, useState } from "react"
import { Moon, Sun, Laptop } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"

type Theme = "dark" | "light" | "system"

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>("system")

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"
            root.classList.add(systemTheme)
            return
        }

        root.classList.add(theme)
    }, [theme])

    return (
        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-full border border-border">
            <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-full ${theme === 'light' ? 'bg-background shadow-sm' : ''}`}
                onClick={() => setTheme("light")}
            >
                <Sun className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-full ${theme === 'dark' ? 'bg-background shadow-sm' : ''}`}
                onClick={() => setTheme("dark")}
            >
                <Moon className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-full ${theme === 'system' ? 'bg-background shadow-sm' : ''}`}
                onClick={() => setTheme("system")}
            >
                <Laptop className="h-4 w-4" />
            </Button>
        </div>
    )
}
