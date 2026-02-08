"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { typeboxResolver } from "@hookform/resolvers/typebox"
import { manualConnectionSchema, connectionStringSchema } from "@/types/schemas/connection.schemas"
import type { Static } from "@sinclair/typebox"
import { useTestConnection } from "@/lib/api/hooks/connections"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import {
    Lock,
    ShieldCheck,
    Link,
    IdentificationCard,
    X,
    Pulse,
    FloppyDisk,
    Eye,
    EyeSlash,
    Copy,
    Key,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Field,
    FieldContent,
    FieldError,
    FieldTitle,
} from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ManualConnectionFormValues = Static<typeof manualConnectionSchema>
type ConnectionStringFormValues = Static<typeof connectionStringSchema>

interface ConnectionFormProps {
    allowConnectionString?: boolean
    includeDatabase?: boolean
    initialValues?: Partial<ManualConnectionFormValues>
    prefillPassword?: string | null
    onRevealPassword?: () => void
    isPasswordLoading?: boolean
    forcePasswordPrefill?: boolean
    autoShowPassword?: boolean
    onSubmitManual: (data: ManualConnectionFormValues) => void
    onSubmitUri?: (data: ConnectionStringFormValues) => void
    onCancel?: () => void
    submitLabel?: string
    isSubmitting?: boolean
}

function normalizeNumber(value: number | undefined) {
    if (value === undefined || Number.isNaN(value)) {
        return undefined
    }

    return value
}

export function ConnectionForm({
    allowConnectionString = true,
    includeDatabase = true,
    initialValues,
    prefillPassword,
    onRevealPassword,
    isPasswordLoading,
    forcePasswordPrefill = false,
    autoShowPassword = false,
    onSubmitManual,
    onSubmitUri,
    onCancel,
    submitLabel = "Save",
    isSubmitting,
}: ConnectionFormProps) {
    const [activeTab, setActiveTab] = useState("manual")
    const [manualPasswordVisibility, setManualPasswordVisibility] = useState<"show" | "hide" | null>(null)
    const { mutate: testConnection, isPending: isTesting } = useTestConnection()

    const manualDefaultValues = useMemo(
        () => ({
            name: "",
            host: "localhost",
            port: 6379,
            database: 0,
            useTls: false,
            ...initialValues,
        }),
        [initialValues]
    )

    const manualForm = useForm<ManualConnectionFormValues>({
        resolver: typeboxResolver(manualConnectionSchema),
        defaultValues: manualDefaultValues,
    })

    const uriForm = useForm<ConnectionStringFormValues>({
        resolver: typeboxResolver(connectionStringSchema),
        defaultValues: {
            name: "",
            connectionString: "",
        },
    })

    const useTlsValue = useWatch({
        control: manualForm.control,
        name: "useTls",
    })

    useEffect(() => {
        manualForm.reset(manualDefaultValues)
    }, [manualDefaultValues, manualForm])

    useEffect(() => {
        if (prefillPassword === undefined) {
            return
        }

        const current = manualForm.getValues("password")
        const { isDirty } = manualForm.getFieldState("password")

        if (forcePasswordPrefill || (!isDirty && (!current || current.length === 0))) {
            const nextValues = {
                ...manualForm.getValues(),
                password: prefillPassword ?? "",
            }

            manualForm.reset(nextValues, {
                keepDirty: true,
                keepTouched: true,
                keepErrors: true,
                keepSubmitCount: true,
            })
        }
    }, [prefillPassword, manualForm, forcePasswordPrefill, autoShowPassword])

    const autoReveal = autoShowPassword && !!prefillPassword
    const showPassword = manualPasswordVisibility ? manualPasswordVisibility === "show" : autoReveal

    const handleTogglePassword = () => {
        setManualPasswordVisibility((prev) => (prev === "show" ? "hide" : "show"))
    }

    const passwordKey =
        prefillPassword === undefined ? "unset" : prefillPassword ? "loaded" : "empty"

    const submitManual = (data: ManualConnectionFormValues) => {
        const payload = {
            ...data,
            port: normalizeNumber(data.port),
            database: normalizeNumber(data.database),
        }

        if (!includeDatabase) {
            delete payload.database
        }

        onSubmitManual(payload)
    }

    const submitUri = (data: ConnectionStringFormValues) => {
        onSubmitUri?.(data)
    }

    const handleTestManual = async () => {
        const valid = await manualForm.trigger()
        if (!valid) {
            return
        }

        const values = manualForm.getValues()
        testConnection(
            {
                host: values.host,
                port: normalizeNumber(values.port),
                username: values.username || undefined,
                password: values.password || undefined,
                database: includeDatabase ? normalizeNumber(values.database) : undefined,
                useTls: values.useTls,
            },
            {
                onSuccess: (result) => {
                    const latency = result?.data?.latencyMs
                    toast.success(
                        latency ? `Connection OK (${latency} ms)` : "Connection OK"
                    )
                },
                onError: (error: unknown) => {
                    toast.fail(error instanceof Error ? error.message : "Connection test failed")
                },
            }
        )
    }

    const handleTestUri = async () => {
        const valid = await uriForm.trigger()
        if (!valid) {
            return
        }

        const values = uriForm.getValues()
        testConnection(
            { connectionString: values.connectionString },
            {
                onSuccess: (result) => {
                    const latency = result?.data?.latencyMs
                    toast.success(
                        latency ? `Connection OK (${latency} ms)` : "Connection OK"
                    )
                },
                onError: (error: unknown) => {
                    toast.fail(error instanceof Error ? error.message : "Connection test failed")
                },
            }
        )
    }

    const handleCopyUri = () => {
        const values = manualForm.getValues()
        const { host, port, username, password, database } = values
        const auth = username || password ? `${username || ""}:${password || ""}@` : ""
        const db = includeDatabase && database !== undefined ? `/${database}` : ""
        const uri = `redis://${auth}${host}:${port}${db}`

        navigator.clipboard.writeText(uri)
        toast.info("Connection URI copied to clipboard")
    }

    const showTabs = allowConnectionString && onSubmitUri

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {showTabs && (
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="manual">Manual Configuration</TabsTrigger>
                    <TabsTrigger value="uri">Connection String</TabsTrigger>
                </TabsList>
            )}

            <TabsContent value="manual">
                <form onSubmit={manualForm.handleSubmit(submitManual)} className="space-y-6">
                    <div className="p-4 rounded-xl border border-border/80 bg-muted/5 space-y-4">
                        <div className="flex items-center gap-2 mb-4 px-1">
                            <IdentificationCard size={18} weight="light" className="text-primary" />
                            <h3 className="text-sm font-semibold text-foreground/80">Connection Details</h3>
                        </div>

                        <Field>
                            <FieldTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Connection Name</FieldTitle>
                            <FieldContent>
                                <Input
                                    placeholder="e.g. Production Redis"
                                    {...manualForm.register("name")}
                                    className="h-10 bg-background/50 border-border/80 focus-visible:ring-1"
                                />
                            </FieldContent>
                            <FieldError errors={[{ message: manualForm.formState.errors.name?.message }]} />
                        </Field>

                        <div className="grid grid-cols-3 gap-4">
                            <Field className="col-span-2">
                                <FieldTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Hostname / IP</FieldTitle>
                                <FieldContent>
                                    <Input
                                        placeholder="localhost or 127.0.0.1"
                                        {...manualForm.register("host")}
                                        className="h-10 bg-background/50 border-border/80 font-mono focus-visible:ring-1"
                                    />
                                </FieldContent>
                                <FieldError errors={[{ message: manualForm.formState.errors.host?.message }]} />
                            </Field>

                            <Field>
                                <FieldTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Port</FieldTitle>
                                <FieldContent>
                                    <Input
                                        type="number"
                                        placeholder="6379"
                                        {...manualForm.register("port", { valueAsNumber: true })}
                                        className="h-10 bg-background/50 border-border/80 font-mono focus-visible:ring-1"
                                    />
                                </FieldContent>
                                <FieldError errors={[{ message: manualForm.formState.errors.port?.message }]} />
                            </Field>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-border/80 bg-muted/5 space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <ShieldCheck size={18} weight="light" className="text-primary" />
                            <h3 className="text-sm font-semibold text-foreground/80">Authentication & Security</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <div className="flex items-center justify-between">
                                    <FieldTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Username</FieldTitle>
                                    {onRevealPassword && (
                                        <span
                                            aria-hidden="true"
                                            className="h-6 px-2 text-[10px] font-semibold uppercase tracking-wide opacity-0 select-none"
                                        >
                                            Load
                                        </span>
                                    )}
                                </div>
                                <FieldContent>
                                    <Input
                                        placeholder="default"
                                        autoComplete="off"
                                        {...manualForm.register("username")}
                                        className="h-10 bg-background/50 border-border/80 focus-visible:ring-1"
                                    />
                                </FieldContent>
                            </Field>
                            <Field>
                                <div className="flex items-center justify-between">
                                    <FieldTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Password</FieldTitle>
                                    {onRevealPassword && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={onRevealPassword}
                                            disabled={isPasswordLoading}
                                            className="h-6 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                                        >
                                            <Key size={12} weight="light" className="mr-1" />
                                            {isPasswordLoading ? "Loading" : "Load"}
                                        </Button>
                                    )}
                                </div>
                                <FieldContent className="relative">
                                    <Input
                                        key={`password-${passwordKey}`}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Load password"
                                        autoComplete="off"
                                        defaultValue={prefillPassword ?? ""}
                                        {...manualForm.register("password")}
                                        className="h-10 bg-background/50 border-border/80 focus-visible:ring-1 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleTogglePassword}
                                        disabled={isPasswordLoading}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                    >
                                        {isPasswordLoading ? (
                                            <Pulse size={16} weight="light" className="animate-pulse" />
                                        ) : showPassword ? (
                                            <EyeSlash size={16} weight="light" />
                                        ) : (
                                            <Eye size={16} weight="light" />
                                        )}
                                    </button>
                                </FieldContent>
                            </Field>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-center">
                        {includeDatabase && (
                            <Field>
                                <FieldTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Database Index</FieldTitle>
                                <FieldContent>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        {...manualForm.register("database", { valueAsNumber: true })}
                                        className="h-10 bg-background/50 border-border/80 font-mono focus-visible:ring-1"
                                    />
                                </FieldContent>
                                <FieldError errors={[{ message: manualForm.formState.errors.database?.message }]} />
                            </Field>
                        )}

                        <div className={cn(
                            "flex items-center justify-between rounded-xl border p-3 min-h-12 transition-all duration-200 w-full",
                            useTlsValue
                                ? "border-success/40 bg-success/5 ring-1 ring-success/10"
                                : "border-border/80 bg-muted/5 hover:bg-muted/10",
                            !includeDatabase ? "col-span-2" : ""
                        )}>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-1.5 rounded-lg transition-colors border",
                                    useTlsValue
                                        ? "bg-success text-success-foreground border-success/20"
                                        : "bg-muted text-primary border-border/40"
                                )}>
                                    <Lock size={16} weight={useTlsValue ? "fill" : "light"} />
                                </div>
                                <div className="flex flex-col">
                                    <span
                                        className="text-sm font-bold cursor-pointer leading-tight text-foreground select-none"
                                        onClick={() => manualForm.setValue("useTls", !manualForm.getValues("useTls"))}
                                    >
                                        TLS / SSL
                                    </span>
                                    <span className="text-[10px] font-medium text-muted-foreground">Secure connection</span>
                                </div>
                            </div>
                            <Switch
                                checked={useTlsValue}
                                onCheckedChange={(checked) => manualForm.setValue("useTls", checked)}
                                className="data-[state=checked]:bg-success"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 -mx-6 -mb-6 bg-muted/10 border-t border-border/60 p-6 mt-6">
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                className="h-11 border-border/80 bg-background/50 hover:bg-muted/40 backdrop-blur-md transition-all active:scale-95 flex items-center gap-2 px-6"
                            >
                                <X size={18} weight="light" />
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleTestManual}
                                disabled={isTesting}
                                className="h-11 bg-accent/10 hover:bg-accent/20 border border-accent/30 backdrop-blur-md text-accent transition-all active:scale-95 flex items-center gap-2 px-6"
                            >
                                <Pulse size={18} weight="light" className={cn(isTesting && "animate-pulse")} />
                                {isTesting ? "Testing..." : "Test Connection"}
                            </Button>
                            {submitLabel === "Save" && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleCopyUri}
                                    className="h-11 bg-primary/5 hover:bg-primary/10 border border-primary/20 backdrop-blur-md text-primary-foreground transition-all active:scale-95 flex items-center gap-2 px-6"
                                >
                                    <Copy size={18} weight="light" />
                                    Copy URI
                                </Button>
                            )}
                        </div>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-11 px-8 bg-success/80 hover:bg-success/90 text-success-foreground font-bold shadow-lg shadow-success/20 backdrop-blur-md transition-all active:scale-95 flex items-center gap-2"
                        >
                            <FloppyDisk size={18} weight="bold" />
                            {isSubmitting ? "Saving..." : submitLabel}
                        </Button>
                    </div>
                </form>
            </TabsContent>

            {showTabs && (
                <TabsContent value="uri">
                    <form onSubmit={uriForm.handleSubmit(submitUri)} className="space-y-6">
                        <div className="p-4 rounded-xl border border-border/80 bg-muted/5 space-y-4">
                            <Field>
                                <FieldTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2 flex items-center gap-2 px-1">
                                    <IdentificationCard size={18} weight="light" className="text-primary" />
                                    Connection Name
                                </FieldTitle>
                                <FieldContent>
                                    <Input
                                        placeholder="Production Cache"
                                        {...uriForm.register("name")}
                                        className="h-10 bg-background/50 border-border/80 focus-visible:ring-1"
                                    />
                                </FieldContent>
                                <FieldError errors={[{ message: uriForm.formState.errors.name?.message }]} />
                            </Field>

                            <Field>
                                <FieldTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2 flex items-center gap-2 px-1">
                                    <Link size={18} weight="light" className="text-primary" />
                                    Connection URI
                                </FieldTitle>
                                <FieldContent>
                                    <Input
                                        placeholder="redis://[:password]@host:port[/db-number]"
                                        {...uriForm.register("connectionString")}
                                        className="h-10 bg-background/50 border-border/80 font-mono text-sm focus-visible:ring-1"
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-2 px-1">
                                        Standard Redis URI format (e.g., redis://user:password@host:port/db)
                                    </p>
                                </FieldContent>
                                <FieldError errors={[{ message: uriForm.formState.errors.connectionString?.message }]} />
                            </Field>
                        </div>

                        <div className="flex items-center justify-between pt-4 -mx-6 -mb-6 bg-muted/10 border-t border-border/60 p-6 mt-6">
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onCancel}
                                    className="h-11 border-border/80 bg-background/50 hover:bg-muted/40 backdrop-blur-md transition-all active:scale-95 flex items-center gap-2 px-6"
                                >
                                    <X size={18} weight="light" />
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                onClick={handleTestUri}
                                disabled={isTesting}
                                className="h-11 bg-accent/10 hover:bg-accent/20 border border-accent/30 backdrop-blur-md text-accent transition-all active:scale-95 flex items-center gap-2 px-6"
                            >
                                    <Pulse size={18} weight="light" className={cn(isTesting && "animate-pulse")} />
                                    {isTesting ? "Testing..." : "Test Connection"}
                                </Button>
                                {submitLabel === "Save" && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            const uri = uriForm.getValues("connectionString")
                                            navigator.clipboard.writeText(uri)
                                            toast.info("Connection URI copied to clipboard")
                                        }}
                                        className="h-11 bg-primary/5 hover:bg-primary/10 border border-primary/20 backdrop-blur-md text-primary-foreground transition-all active:scale-95 flex items-center gap-2 px-6"
                                    >
                                        <Copy size={18} weight="light" />
                                        Copy URI
                                    </Button>
                                )}
                            </div>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-11 px-8 bg-success/80 hover:bg-success/90 text-success-foreground font-bold shadow-lg shadow-success/20 backdrop-blur-md transition-all active:scale-95 flex items-center gap-2"
                            >
                                <FloppyDisk size={18} weight="bold" />
                                {isSubmitting ? "Saving..." : submitLabel}
                            </Button>
                        </div>
                    </form>
                </TabsContent>
            )}
        </Tabs>
    )
}
