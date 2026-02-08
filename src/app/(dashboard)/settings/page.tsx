"use client"

import { useSettings, useUpdateSetting, useResetSettings } from "@/lib/api/hooks/settings"
import { usePreferences, useUpdatePreference, useResetPreferences } from "@/lib/api/hooks/preferences"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/lib/toast"
import Image from "next/image"
import { ArrowCounterClockwise } from "@phosphor-icons/react"
import { useMemo } from "react"
import type { SystemSetting } from "@/types"

type SettingsValues = Record<string, string | number | boolean>
type PreferenceValues = Record<string, string | number | boolean>

// System Settings Component
function SystemSettings() {
    const { data, isLoading } = useSettings()
    const updateSetting = useUpdateSetting()
    const resetSettings = useResetSettings()
    const settings = useMemo(() => {
        const next: SettingsValues = {}
        const settingsList = data?.data?.settings ?? []
        settingsList.forEach((setting: SystemSetting) => {
            try {
                next[setting.key] = JSON.parse(setting.value)
            } catch {
                next[setting.key] = setting.value
            }
        })
        return next
    }, [data])

    const getNumberSetting = (value: SettingsValues[string], fallback: number) => {
        if (typeof value === "number") {
            return value
        }
        if (typeof value === "string") {
            const parsed = Number(value)
            return Number.isNaN(parsed) ? fallback : parsed
        }
        return fallback
    }

    const handleUpdate = (key: string, value: string | number | boolean) => {
        updateSetting.mutate(
            { key, data: { value } },
            {
                onSuccess: () => toast.success("Setting updated"),
                onError: (error: unknown) => {
                    const message = error instanceof Error ? error.message : "Failed to update setting"
                    toast.fail(message)
                },
            }
        )
    }

    const handleReset = () => {
        resetSettings.mutate(undefined, {
            onSuccess: () => toast.success("Settings reset to defaults"),
            onError: (error: unknown) => {
                const message = error instanceof Error ? error.message : "Failed to reset settings"
                toast.fail(message)
            },
        })
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">System Configuration</h3>
                <Button variant="outline" size="sm" onClick={handleReset} disabled={resetSettings.isPending}>
                    <ArrowCounterClockwise className="h-4 w-4 mr-2" />
                    Reset to Defaults
                </Button>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-sm border border-secondary/20 bg-secondary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                        <Label>Session Timeout (minutes)</Label>
                        <p className="text-sm text-muted-foreground">Automatic logout after inactivity</p>
                    </div>
                    <Input
                        type="number"
                        className="w-24 bg-background"
                        value={getNumberSetting(settings.sessionTimeout, 15)}
                        onChange={(e) => handleUpdate("sessionTimeout", parseInt(e.target.value))}
                    />
                </div>

                <div className="flex flex-col gap-3 rounded-sm border border-secondary/20 bg-secondary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                        <Label>Max Login Attempts</Label>
                        <p className="text-sm text-muted-foreground">Lock account after failed attempts</p>
                    </div>
                    <Input
                        type="number"
                        className="w-24 bg-background"
                        value={getNumberSetting(settings.maxLoginAttempts, 5)}
                        onChange={(e) => handleUpdate("maxLoginAttempts", parseInt(e.target.value))}
                    />
                </div>

                <div className="flex flex-col gap-3 rounded-sm border border-secondary/20 bg-secondary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                        <Label>Password Min Length</Label>
                        <p className="text-sm text-muted-foreground">Minimum characters for passwords</p>
                    </div>
                    <Input
                        type="number"
                        className="w-24 bg-background"
                        value={getNumberSetting(settings.passwordMinLength, 8)}
                        onChange={(e) => handleUpdate("passwordMinLength", parseInt(e.target.value))}
                    />
                </div>

                <div className="flex flex-col gap-3 rounded-sm border border-secondary/20 bg-secondary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                        <Label>Audit Log Retention (days)</Label>
                        <p className="text-sm text-muted-foreground">How long to keep audit logs</p>
                    </div>
                    <Input
                        type="number"
                        className="w-24 bg-background"
                        value={getNumberSetting(settings.auditRetention, 90)}
                        onChange={(e) => handleUpdate("auditRetention", parseInt(e.target.value))}
                    />
                </div>

                <div className="flex flex-col gap-3 rounded-sm border border-secondary/20 bg-secondary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                        <Label>Allow User Registration</Label>
                        <p className="text-sm text-muted-foreground">Enable public user registration</p>
                    </div>
                    <Switch
                        checked={settings.allowRegistration === true}
                        onCheckedChange={(checked) => handleUpdate("allowRegistration", checked === true)}
                    />
                </div>
            </div>
        </div>
    )
}

// User Preferences Component
function UserPreferences() {
    const { data, isLoading } = usePreferences()
    const updatePreference = useUpdatePreference()
    const resetPreferences = useResetPreferences()
    const { setTheme } = useTheme()
    const preferencesPayload = data?.data ?? (data as { values?: PreferenceValues } | undefined)
    const preferences = preferencesPayload?.values || {}
    const getNumberPreference = (value: unknown, fallback: number) => {
        if (typeof value === "number") {
            return value
        }
        if (typeof value === "string") {
            const parsed = Number(value)
            return Number.isNaN(parsed) ? fallback : parsed
        }
        return fallback
    }
    const themeValue = typeof preferences.theme === "string" ? preferences.theme : "auto"

    const handleUpdate = (key: string, value: string | number | boolean) => {
        updatePreference.mutate(
            { key, data: { value } },
            {
                onSuccess: () => {
                    toast.success("Preference saved")
                    // If theme changed, update it immediately
                    if (key === "theme") {
                        if (value === "light" || value === "dark" || value === "auto") {
                            setTheme(value)
                        }
                    }
                },
                onError: (error: unknown) => {
                    const message = error instanceof Error ? error.message : "Failed to save preference"
                    toast.fail(message)
                },
            }
        )
    }

    const handleReset = () => {
        resetPreferences.mutate(undefined, {
            onSuccess: () => toast.success("Preferences reset"),
            onError: (error: unknown) => {
                const message = error instanceof Error ? error.message : "Failed to reset preferences"
                toast.fail(message)
            },
        })
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Your Preferences</h3>
                <Button variant="outline" size="sm" onClick={handleReset} disabled={resetPreferences.isPending}>
                    <ArrowCounterClockwise className="h-4 w-4 mr-2" />
                    Reset
                </Button>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-sm border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                        <Label>Theme</Label>
                        <p className="text-sm text-muted-foreground">Choose your preferred color theme</p>
                    </div>
                    <Select
                        value={themeValue}
                        onValueChange={(value) => handleUpdate("theme", value)}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="auto">System</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-3 rounded-sm border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                        <Label>Compact Mode</Label>
                        <p className="text-sm text-muted-foreground">Reduce padding and font sizes</p>
                    </div>
                    <Switch
                        checked={preferences.compactMode === true}
                        onCheckedChange={(checked) => handleUpdate("compactMode", checked === true)}
                    />
                </div>

                <div className="flex flex-col gap-3 rounded-sm border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                        <Label>Show Key Values in Table</Label>
                        <p className="text-sm text-muted-foreground">Display preview of key values</p>
                    </div>
                    <Switch
                        checked={preferences.showKeyValues !== false}
                        onCheckedChange={(checked) => handleUpdate("showKeyValues", checked === true)}
                    />
                </div>

                <div className="flex flex-col gap-3 rounded-sm border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                        <Label>Auto-refresh Keys</Label>
                        <p className="text-sm text-muted-foreground">Refreshes the key list in the Keys page at the interval above. Does not affect your login session.</p>
                    </div>
                    <Switch
                        checked={preferences.autoRefresh === true}
                        onCheckedChange={(checked) => handleUpdate("autoRefresh", checked === true)}
                    />
                </div>

                <div className="flex flex-col gap-3 rounded-sm border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                        <Label>Default Page Size</Label>
                        <p className="text-sm text-muted-foreground">Number of items per page</p>
                    </div>
                    <Input
                        type="number"
                        className="w-24 bg-background"
                        value={getNumberPreference(preferences.pageSize, 50)}
                        onChange={(e) => handleUpdate("pageSize", parseInt(e.target.value))}
                    />
                </div>
            </div>
        </div>
    )
}

// About Component
function About() {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium">About RediStra</h3>

            <div className="rounded-sm border border-border/80 bg-card p-6 space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="rounded-sm border border-secondary/20 bg-secondary/5 p-3">
                        <Image
                            src="/Redistra.png"
                            alt="RediStra"
                            width={56}
                            height={56}
                            className="size-14 object-contain rounded-sm"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h4 className="text-2xl font-semibold">RediStra</h4>
                        <p className="text-sm text-muted-foreground">Self-hosted Redis management interface</p>
                        <span className="inline-flex w-fit items-center rounded-sm border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                            Open source · MIT
                        </span>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-sm border border-secondary/20 bg-secondary/5 p-3">
                        <p className="text-xs text-muted-foreground">Version</p>
                        <p className="text-sm font-semibold">1.0.0</p>
                    </div>
                    <div className="rounded-sm border border-secondary/20 bg-secondary/5 p-3">
                        <p className="text-xs text-muted-foreground">Build Date</p>
                        <p className="text-sm font-semibold">2026-02-01</p>
                    </div>
                    <div className="rounded-sm border border-secondary/20 bg-secondary/5 p-3">
                        <p className="text-xs text-muted-foreground">Runtime</p>
                        <p className="text-sm font-semibold">Bun 1.1+ · Node 22+</p>
                    </div>
                    <div className="rounded-sm border border-secondary/20 bg-secondary/5 p-3">
                        <p className="text-xs text-muted-foreground">License</p>
                        <p className="text-sm font-semibold">MIT</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">
                        RediStra is a self-hosted Redis management interface built with modern web technologies.
                        It provides a clean, intuitive interface for managing Redis instances, browsing keys,
                        and monitoring performance. Open source from Oussema with love.
                    </p>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium">Technology Stack</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            "Next.js 16",
                            "React 19",
                            "TypeScript",
                            "Tailwind v4",
                            "shadcn/ui",
                            "Elysia",
                            "SQLite",
                            "Drizzle",
                            "ioredis",
                        ].map((tech) => (
                            <span
                                key={tech}
                                className="px-2.5 py-1 rounded-sm border border-secondary/20 bg-secondary/5 text-xs font-semibold text-foreground/80"
                            >
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="rounded-sm border border-secondary/20 bg-secondary/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Developed by</p>
                    <a
                        href="https://oussemajaouadi.site"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex text-lg font-semibold text-primary hover:underline"
                    >
                        Oussema Jaouadi
                    </a>
                </div>
            </div>
        </div>
    )
}

export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Configure system preferences and options</p>
            </div>

            <Tabs defaultValue="system" className="w-full">
                <TabsList className="inline-flex w-full max-w-2xl rounded-sm border border-border/60 bg-muted/30 p-1">
                    <TabsTrigger
                        value="system"
                        className="h-9 flex-1 rounded-sm text-sm data-active:bg-background data-active:text-foreground data-active:shadow-sm text-muted-foreground"
                    >
                        System
                    </TabsTrigger>
                    <TabsTrigger
                        value="preferences"
                        className="h-9 flex-1 rounded-sm text-sm data-active:bg-background data-active:text-foreground data-active:shadow-sm text-muted-foreground"
                    >
                        Preferences
                    </TabsTrigger>
                    <TabsTrigger
                        value="about"
                        className="h-9 flex-1 rounded-sm text-sm data-active:bg-background data-active:text-foreground data-active:shadow-sm text-muted-foreground"
                    >
                        About
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="system" className="mt-4">
                    <SystemSettings />
                </TabsContent>

                <TabsContent value="preferences" className="mt-4">
                    <UserPreferences />
                </TabsContent>

                <TabsContent value="about" className="mt-4">
                    <About />
                </TabsContent>
            </Tabs>
        </div>
    )
}
