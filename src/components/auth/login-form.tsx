"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeSlash, CircleNotch, Lock } from "@phosphor-icons/react"
import { toast } from "@/lib/toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Field,
    FieldLabel,
    FieldContent,
    FieldError,
} from "@/components/ui/field"
import { useLogin } from "@/lib/api"

const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    remember: z.boolean(),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
    const router = useRouter()
    const [showPassword, setShowPassword] = React.useState(false)
    const [lockoutError, setLockoutError] = React.useState<string | null>(null)

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
            remember: false,
        },
    })

    const mutation = useLogin()

    const onSubmit = (data: LoginFormValues) => {
        setLockoutError(null)
        mutation.mutate(data, {
            onSuccess: () => {
                toast.success("Logged in successfully!")
                router.push("/")
            },
            onError: (error: Error) => {
                // Check if it's a lockout error (423 status)
                if (error.message.includes('locked') || error.message.includes('too many failed attempts')) {
                    setLockoutError(error.message)
                } else {
                    toast.fail(error.message)
                }
            },
        })
    }

    return (
        <div className="w-full">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">Welcome back</h1>
                <p className="text-muted-foreground text-sm">Sign in to your Redis management dashboard</p>
            </div>

            {lockoutError && (
                <Alert variant="destructive" className="mb-6">
                    <Lock className="h-4 w-4" />
                    <AlertDescription>{lockoutError}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-5">
                    <Field>
                        <FieldLabel htmlFor="username" className="mb-1.5">
                            Username <span className="text-primary">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                id="username"
                                placeholder="Enter your username"
                                autoComplete="username"
                                disabled={mutation.isPending}
                                aria-invalid={!!errors.username}
                                {...register("username")}
                            />
                            {errors.username && (
                                <FieldError errors={[errors.username]} />
                            )}
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="password" className="mb-1.5">
                            Password <span className="text-primary">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    disabled={mutation.isPending}
                                    aria-invalid={!!errors.password}
                                    className="pr-10"
                                    {...register("password")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors rounded-sm p-1 hover:bg-muted"
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && (
                                <FieldError errors={[errors.password]} />
                            )}
                        </FieldContent>
                    </Field>

                    <div className="flex items-center gap-2 pt-1">
                        <Controller
                            control={control}
                            name="remember"
                            render={({ field }) => (
                                <Checkbox
                                    id="remember"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={mutation.isPending}
                                />
                            )}
                        />
                        <Label
                            htmlFor="remember"
                            className="cursor-pointer select-none"
                        >
                            Remember me for 30 days
                        </Label>
                    </div>
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full relative overflow-hidden group"
                        size="lg"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? (
                            <>
                                <CircleNotch className="animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            "Sign in"
                        )}
                    </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                    Need access? Ask your admin to create an account for you.
                </p>
            </form>
        </div>
    )
}
