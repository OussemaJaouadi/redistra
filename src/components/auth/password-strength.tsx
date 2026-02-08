"use client"

import * as React from "react"
import { Check, X } from "@phosphor-icons/react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface Requirement {
    label: string
    met: boolean
}

interface PasswordStrengthProps {
    password?: string
    className?: string
}

export function PasswordStrength({ password = "", className }: PasswordStrengthProps) {
    const requirements: Requirement[] = [
        { label: "At least 8 characters", met: password.length >= 8 },
        { label: "At least one uppercase letter", met: /[A-Z]/.test(password) },
        { label: "At least one lowercase letter", met: /[a-z]/.test(password) },
        { label: "At least one number", met: /[0-9]/.test(password) },
        { label: "At least one special character", met: /[^A-Za-z0-9]/.test(password) },
    ]

    const metCount = requirements.filter((req) => req.met).length
    const strength = (metCount / requirements.length) * 100

    const getStrengthColor = () => {
        if (strength === 0) return "bg-muted"
        if (strength <= 40) return "bg-danger"
        if (strength <= 80) return "bg-warning"
        return "bg-success"
    }

    const getStrengthLabel = () => {
        if (password.length === 0) return ""
        if (strength <= 40) return "Weak"
        if (strength <= 80) return "Medium"
        return "Strong"
    }

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Password Strength</span>
                <span className={cn("font-medium", {
                    "text-danger": strength <= 40 && password.length > 0,
                    "text-warning": strength > 40 && strength <= 80,
                    "text-success": strength > 80,
                })}>
                    {getStrengthLabel()}
                </span>
            </div>

            <Progress
                value={strength}
                className="h-1"
                indicatorClassName={getStrengthColor()}
            />

            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {requirements.map((req, index) => (
                    <li
                        key={index}
                        className={cn("flex items-center gap-1.5 text-xs transition-colors",
                            req.met ? "text-success" : "text-muted-foreground"
                        )}
                    >
                        {req.met ? (
                            <Check weight="bold" className="size-3" />
                        ) : (
                            <X weight="bold" className="size-3" />
                        )}
                        {req.label}
                    </li>
                ))}
            </ul>
        </div>
    )
}
