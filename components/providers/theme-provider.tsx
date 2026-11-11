"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

function ColorSchemeMetaSync() {
    const { theme } = useTheme()

    React.useEffect(() => {
        const meta = document.querySelector('meta[name="color-scheme"]')
        if (!meta) return
        const value =
            theme === "light" || theme === "dark" ? theme : "light dark"
        meta.setAttribute("content", value)
    }, [theme])

    return null
}

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <NextThemesProvider {...props}>
            <ColorSchemeMetaSync />
            {children}
        </NextThemesProvider>
    )
}