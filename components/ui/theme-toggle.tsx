
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
    const { setTheme, resolvedTheme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div
                aria-hidden="true"
                className={cn("size-8 rounded-full border border-transparent", className)}
            />
        );
    }

    const isDark = resolvedTheme === "dark";
    const nextTheme = isDark ? "light" : "dark";
    const label = isDark ? "Switch to light theme" : "Switch to dark theme";

    const handleToggle = () => {
        // Two-state toggle: revert to "system" when the target matches the OS preference
        if (systemTheme && nextTheme === systemTheme) {
            setTheme("system");
        } else {
            setTheme(nextTheme);
        }
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            aria-label={label}
            title={label}
            className={cn(
                "size-8 rounded-full border transition-all duration-200",
                "border-slate-200/90 bg-slate-100/85 text-slate-700 hover:bg-slate-200/80 hover:text-slate-950 shadow-2xs",
                "dark:border-white/10 dark:bg-white/5 dark:text-amber-300 dark:hover:bg-white/10 dark:hover:text-amber-200 dark:shadow-none",
                className
            )}
        >
            {isDark ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="sr-only">{label}</span>
        </Button>
    );
}

