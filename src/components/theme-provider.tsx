"use client"

import * as React from "react"
import { usePreferences } from "@/lib/api/hooks/preferences"
import { useMe } from "@/lib/api"
import type { ListUserPreferencesResponseDto, MeResponseDto } from "@/types"

type Theme = "dark" | "light" | "auto"

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
}

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "dark" | "light"
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children, defaultTheme = "auto" }: ThemeProviderProps) {
  const { data: meData } = useMe()
  const meUser = meData?.data?.user ?? (meData as MeResponseDto | undefined)?.user
  const isAuthenticated = !!meUser
  
  // Only fetch preferences if authenticated
  const { data } = usePreferences({ enabled: isAuthenticated })
  const preferences =
    data?.data?.values || (data as ListUserPreferencesResponseDto | undefined)?.values || {}
  const getThemeValue = (value: unknown): Theme | undefined => {
    if (value === "light" || value === "dark" || value === "auto") {
      return value
    }
    return undefined
  }
  
  // Get theme from preferences or use default
  const [theme, setThemeState] = React.useState<Theme>(() => {
    const preferredTheme = getThemeValue(preferences.theme)
    if (typeof window === "undefined") {
      return preferredTheme ?? defaultTheme
    }

    const stored = window.localStorage.getItem("theme")
    if (stored === "dark" || stored === "light" || stored === "auto") {
      return stored
    }

    return preferredTheme ?? defaultTheme
  })
  const [resolvedTheme, setResolvedTheme] = React.useState<"dark" | "light">("dark")

  // Update theme when preferences change
  React.useEffect(() => {
    const preferredTheme = getThemeValue(preferences.theme)
    if (preferredTheme) {
      setThemeState(preferredTheme)
    }
  }, [preferences.theme])

  // Apply theme to document
  React.useEffect(() => {
    const root = window.document.documentElement
    
    // Remove old theme classes
    root.classList.remove("light", "dark")
    
    // Determine resolved theme
    let resolved: "dark" | "light"
    
    if (theme === "auto") {
      // Check system preference
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      resolved = systemTheme
    } else {
      resolved = theme
    }
    
    setResolvedTheme(resolved)
    
    // Apply theme class
    root.classList.add(resolved)
    
    // Update color-scheme meta tag
    root.style.colorScheme = resolved
  }, [theme])

  // Persist theme locally for consistent refresh behavior
  React.useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("theme", theme)
  }, [theme])

  // Listen for system theme changes when in auto mode
  React.useEffect(() => {
    if (theme !== "auto") return
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    const handleChange = () => {
      const resolved = mediaQuery.matches ? "dark" : "light"
      setResolvedTheme(resolved)
      
      const root = window.document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add(resolved)
      root.style.colorScheme = resolved
    }
    
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
  }, [])

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
    }),
    [theme, resolvedTheme, setTheme]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  
  return context
}
