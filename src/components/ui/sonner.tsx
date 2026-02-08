"use client"

import { useTheme } from "@/components/theme-provider"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircleIcon, InfoIcon, WarningIcon, XCircleIcon, SpinnerIcon } from "@phosphor-icons/react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()
  const resolved = theme === "auto" ? "system" : theme

  return (
    <Sonner
      theme={resolved as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CheckCircleIcon className="size-4 text-success/80" />
        ),
        info: (
          <InfoIcon className="size-4 text-accent/80" />
        ),
        warning: (
          <WarningIcon className="size-4 text-warning/80" />
        ),
        error: (
          <XCircleIcon className="size-4 text-danger/80" />
        ),
        loading: (
          <SpinnerIcon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "toast-card",
          title: "font-semibold",
          description: "text-muted-foreground",
          success: "toast-success",
          error: "toast-error",
          info: "toast-info",
          warning: "toast-warning",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
